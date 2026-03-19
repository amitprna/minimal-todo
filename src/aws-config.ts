/**
 * AWS Amplify configuration.
 * Values are injected at build time by GitHub Actions (from CDK stack outputs).
 * For local development, copy .env.example to .env.local and fill in values.
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID as string,
      loginWith: {
        email: true,
      },
    },
  },
};

/** Base URL for the API (CloudFront routes /api/* → API Gateway) */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
