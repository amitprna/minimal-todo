#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinimalTodoStack } from '../lib/todo-stack';

const app = new cdk.App();

new MinimalTodoStack(app, 'MinimalTodoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-south-1',
  },
  description: 'Minimal-ToDo App – multi-user serverless backend',
});
