import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE, ok, created, noContent, badRequest, serverError, getUserId, parseBody } from './utils';

interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getUserId(event);
    const method = event.requestContext.http.method;
    const id = event.pathParameters?.id;

    // GET /categories — list all categories for this user
    if (method === 'GET') {
      const result = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':prefix': 'CATEGORY#',
        },
      }));
      const categories = (result.Items ?? [])
        .map(item => item.data as Category)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return ok(categories);
    }

    // POST /categories — create a new category
    if (method === 'POST') {
      const body = parseBody<Category>(event);
      if (!body.id || !body.name) return badRequest('id and name are required');
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: `CATEGORY#${body.id}`,
          data: body,
        },
      }));
      return created(body);
    }

    // PUT /categories/{id} — update a category
    if (method === 'PUT' && id) {
      const body = parseBody<Partial<Category>>(event);
      await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: `CATEGORY#${id}` },
        UpdateExpression: 'SET #data = :data',
        ExpressionAttributeNames: { '#data': 'data' },
        ExpressionAttributeValues: { ':data': body },
      }));
      return ok(body);
    }

    // DELETE /categories/{id} — delete category
    if (method === 'DELETE' && id) {
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: `CATEGORY#${id}` },
      }));
      return noContent();
    }

    return badRequest('Method not supported');
  } catch (e) {
    return serverError(e);
  }
};
