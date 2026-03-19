import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';
import { Construct } from 'constructs';

export class MinimalTodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── 1. Cognito User Pool ────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'MinimalTodoUserPool', {
      userPoolName: 'minimal-todo-user-pool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // keep users on stack destroy
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'MinimalTodoUserPoolClient', {
      userPool,
      userPoolClientName: 'minimal-todo-web-client',
      authFlows: {
        userSrp: true,
        userPassword: false,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    // ── 2. DynamoDB Table (single-table design) ─────────────────────────
    // PK: USER#<userId>   SK: CATEGORY#<id> | TASK#<id> | NOTE#<categoryId>
    const table = new dynamodb.Table(this, 'MinimalTodoTable', {
      tableName: 'minimal-todo-items',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // free tier friendly
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── 3. Lambda shared environment ────────────────────────────────────
    const lambdaEnv = {
      TABLE_NAME: table.tableName,
      USER_POOL_ID: userPool.userPoolId,
    };

    // ── 4. Lambda functions ─────────────────────────────────────────────
    const nodejsDefaults = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnv,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    };

    const categoriesFn = new lambdaNodejs.NodejsFunction(this, 'CategoriesFn', {
      ...nodejsDefaults,
      entry: path.join(__dirname, '..', 'lambda', 'categories.ts'),
      handler: 'handler',
      functionName: 'todo-categories',
    });

    const tasksFn = new lambdaNodejs.NodejsFunction(this, 'TasksFn', {
      ...nodejsDefaults,
      entry: path.join(__dirname, '..', 'lambda', 'tasks.ts'),
      handler: 'handler',
      functionName: 'todo-tasks',
    });

    const notesFn = new lambdaNodejs.NodejsFunction(this, 'NotesFn', {
      ...nodejsDefaults,
      entry: path.join(__dirname, '..', 'lambda', 'notes.ts'),
      handler: 'handler',
      functionName: 'todo-notes',
    });

    // Grant DynamoDB permissions
    table.grantReadWriteData(categoriesFn);
    table.grantReadWriteData(tasksFn);
    table.grantReadWriteData(notesFn);

    // ── 5. HTTP API Gateway with Cognito JWT Authorizer ─────────────────
    const httpApi = new apigateway.HttpApi(this, 'MinimalTodoApi', {
      apiName: 'minimal-todo-api',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowOrigins: ['*'], // locked down to CF URL after first deploy
         maxAge: cdk.Duration.days(1),
      },
    });

    const jwtAuthorizer = new apigatewayAuthorizers.HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      },
    );

    const authorizationConfig = {
      authorizer: jwtAuthorizer,
      authorizationScopes: [],
    };

    // Categories routes
    httpApi.addRoutes({
      path: '/api/categories',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('CategoriesIntegration', categoriesFn),
      ...authorizationConfig,
    });
    httpApi.addRoutes({
      path: '/api/categories/{id}',
      methods: [apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('CategoriesIdIntegration', categoriesFn),
      ...authorizationConfig,
    });

    // Tasks routes
    httpApi.addRoutes({
      path: '/api/tasks',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('TasksIntegration', tasksFn),
      ...authorizationConfig,
    });
    httpApi.addRoutes({
      path: '/api/tasks/{id}',
      methods: [apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('TasksIdIntegration', tasksFn),
      ...authorizationConfig,
    });

    // Notes routes
    httpApi.addRoutes({
      path: '/api/notes/{categoryId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('NotesIntegration', notesFn),
      ...authorizationConfig,
    });

    // ── 6. S3 Bucket for React frontend ─────────────────────────────────
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `minimal-todo-frontend-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ── 7. CloudFront Distribution ───────────────────────────────────────
    const oac = new cloudfront.S3OriginAccessControl(this, 'FrontendOAC', {
      description: 'OAC for todo frontend bucket',
    });

    const s3Origin = cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(frontendBucket, {
      originAccessControl: oac,
    });

    const apiOrigin = new cloudfrontOrigins.HttpOrigin(
      `${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`,
      { protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY }
    );

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: apiOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: 'index.html',
      // SPA routing: return index.html for 403/404
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    // ── 8. Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'The live URL for the Todo app',
      exportName: 'TodoCloudFrontURL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend deployment',
      exportName: 'TodoS3BucketName',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID (for cache invalidation)',
      exportName: 'TodoDistributionId',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: 'TodoUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: 'TodoUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
      exportName: 'TodoApiEndpoint',
    });
  }
}
