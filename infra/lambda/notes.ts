import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE, ok, noContent, badRequest, serverError, getUserId, parseBody } from './utils';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getUserId(event);
    const method = event.requestContext.http.method;
    const categoryId = event.pathParameters?.categoryId;

    if (!categoryId) return badRequest('categoryId path parameter is required');

    // GET /notes/{categoryId} — fetch notes for a specific moment
    if (method === 'GET') {
      const result = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: `NOTE#${categoryId}` },
      }));
      return ok({ categoryId, content: (result.Item?.data as string) ?? '' });
    }

    // PUT /notes/{categoryId} — save/overwrite notes
    if (method === 'PUT') {
      const body = parseBody<{ content: string }>(event);
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: `NOTE#${categoryId}`,
          data: body.content ?? '',
        },
      }));
      return ok({ categoryId, content: body.content });
    }

    return badRequest('Method not supported');
  } catch (e) {
    return serverError(e);
  }
};
