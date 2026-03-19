# Moments — Multi-User Todo App

A Japandi-aesthetic task management app, deployed on AWS.

---

## Before You Start (One-Time Setup)

### 1. Install Tools

```bash
npm install -g aws-cdk
npm install -g typescript
```

### 2. Configure AWS CLI

Create an IAM user with **AdministratorAccess** in the [AWS Console](https://console.aws.amazon.com/iam), then:

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, region: ap-south-1, output: json
```

### 3. Bootstrap CDK in Your AWS Account

This is required **once per account/region**:

```bash
cd infra
npm install
npx cdk bootstrap aws://ACCOUNT_ID/ap-south-1
```

Replace `ACCOUNT_ID` with your 12-digit AWS account ID (found in the AWS Console top-right corner).

---

## First Deploy (Local)

```bash
cd infra
npx cdk deploy --outputs-file cdk-outputs.json
```

This will:
- Create Cognito User Pool, DynamoDB table, Lambda functions, API Gateway, S3 bucket, and CloudFront distribution
- Print the live CloudFront URL when finished

Copy the Cognito values for local development:

```bash
# Create a .env.local in the todo/ root:
VITE_USER_POOL_ID=<UserPoolId from cdk-outputs.json>
VITE_USER_POOL_CLIENT_ID=<UserPoolClientId from cdk-outputs.json>
VITE_API_BASE=<ApiEndpoint from cdk-outputs.json>
```

Then run locally:

```bash
cd ..  # back to todo/ root
npm install
npm run dev
```

---

## CI/CD — Auto Deploy on Push

### Add GitHub Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your IAM Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM Secret Access Key |

After this, **every push to `main`** will:
1. Run `cdk deploy` to update infrastructure
2. Build the React app with the correct Cognito/API config
3. Sync to S3 and invalidate CloudFront cache

The live URL is printed at the end of the GitHub Actions run.

---

## Architecture

```
Browser → CloudFront → S3 (React app)
                    → API Gateway → Lambda → DynamoDB
Cognito User Pool provides authentication (JWT tokens)
```

---

## Project Structure

```
todo/
  src/
    api/client.ts       ← API client (auto-attaches JWT)
    hooks/useAuth.tsx   ← Cognito auth hook
    aws-config.ts       ← Amplify config
    components/
      AuthScreen.tsx    ← Sign in / Sign up UI
      AuthGate.tsx      ← Protects app behind auth
  infra/
    bin/app.ts          ← CDK entry point
    lib/todo-stack.ts   ← Full AWS infrastructure
    lambda/
      categories.ts     ← Moments CRUD
      tasks.ts          ← Tasks CRUD
      notes.ts          ← Notes CRUD
  .github/
    workflows/
      deploy.yml        ← CI/CD pipeline
```
