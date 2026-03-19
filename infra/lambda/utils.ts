// Shared Lambda utilities: response helpers and DynamoDB client setup
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const TABLE = process.env.TABLE_NAME!;

export const ok = (body: unknown): APIGatewayProxyResultV2 => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const created = (body: unknown): APIGatewayProxyResultV2 => ({
  statusCode: 201,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const noContent = (): APIGatewayProxyResultV2 => ({ statusCode: 204 });

export const badRequest = (msg: string): APIGatewayProxyResultV2 => ({
  statusCode: 400,
  body: JSON.stringify({ error: msg }),
});

export const notFound = (): APIGatewayProxyResultV2 => ({
  statusCode: 404,
  body: JSON.stringify({ error: 'Not found' }),
});

export const serverError = (e: unknown): APIGatewayProxyResultV2 => {
  console.error(e);
  return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
};

/** Extract the Cognito `sub` (user ID) from the JWT claims. */
export const getUserId = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string =>
  event.requestContext.authorizer.jwt.claims['sub'] as string;

export const parseBody = <T>(event: APIGatewayProxyEventV2WithJWTAuthorizer): T =>
  JSON.parse(event.body ?? '{}') as T;
