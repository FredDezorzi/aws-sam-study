import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from 'uuid';
import { validateStorePayload } from  '../utils/index.js';

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sqs = new SQSClient({ region: "us-east-1" });
const storesTable = process.env.STORES_TABLE;
const sqsQueueUrl  = process.env.SQS_QUEUE_URL;

export const storeRequestHandler = async (event) => {
    try{
        const store = JSON.parse(event.body);
        await validateStorePayload(store);
        store.storeId = uuidv4();
        const params = {
            TableName: storesTable,
            Key: {
            storeId: { S: store.storeId} 
            },
        };
        const result = await dynamoDB.send(new GetItemCommand(params));
        if(result.Item){
            throw new Error('A store with this ID already exists!')
        }
        const responseBody = { 
            message: `Dear ${store.storeName}, your store is currently being processed. To complete the registration, you will need to approve it via the email sent from AWS to: ${store.email}. After your approval you will recive an Id for product registration.` 
          };
        const sendMessageCommandInput = {
            MessageBody: JSON.stringify(store),
            QueueUrl: sqsQueueUrl
        }
        const command = new SendMessageCommand(sendMessageCommandInput);
        await sqs.send(command);

        return { 
            statusCode: 200, 
            body: JSON.stringify(responseBody) 
        };
    }catch(err){
        const responseBody = { message: `Error: ${err.message}` }
        return {
            statusCode: 500,
            body: JSON.stringify(responseBody)
        };
    } 
}