import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE, ok, created, noContent, badRequest, serverError, getUserId, parseBody } from './utils';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  categoryId: string;
  title: string;
  completed: boolean;
  pinned: boolean;
  subtasks: Subtask[];
  order: number;
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = getUserId(event);
    const method = event.requestContext.http.method;
    const id = event.pathParameters?.id;

    // GET /tasks — list all tasks for user (optionally filter by categoryId query param)
    if (method === 'GET') {
      const categoryId = event.queryStringParameters?.categoryId;
      const result = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':prefix': 'TASK#',
        },
      }));
      let tasks = (result.Items ?? []).map(item => item.data as Task);
      if (categoryId) tasks = tasks.filter(t => t.categoryId === categoryId);
      return ok(tasks);
    }

    // POST /tasks — create a new task
    if (method === 'POST') {
      const body = parseBody<Task>(event);
      if (!body.id || !body.categoryId || !body.title) {
        return badRequest('id, categoryId, and title are required');
      }
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: `TASK#${body.id}`,
          data: body,
        },
      }));
      return created(body);
    }

    // PUT /tasks/{id} — update an existing task (full replace of data field)
    if (method === 'PUT' && id) {
      const body = parseBody<Task>(event);
      await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: `TASK#${id}` },
        UpdateExpression: 'SET #data = :data',
        ExpressionAttributeNames: { '#data': 'data' },
        ExpressionAttributeValues: { ':data': body },
      }));
      return ok(body);
    }

    // DELETE /tasks/{id} — delete a task
    if (method === 'DELETE' && id) {
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: `TASK#${id}` },
      }));
      return noContent();
    }

    return badRequest('Method not supported');
  } catch (e) {
    return serverError(e);
  }
};
