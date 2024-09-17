import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from 'uuid';
import { validateProductPayload } from  '../utils/index.js';

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sqs = new SQSClient({ region: "us-east-1" });
const productsTable = process.env.PRODUCTS_TABLE;
const storesTable = process.env.STORES_TABLE;
const sqsQueueUrl  = process.env.SQS_QUEUE_URL;

export const productRequestHandler = async (event) => {
    try{
        const product = JSON.parse(event.body);
        await validateProductPayload(product);
        product.productId = uuidv4();
        const storeParams = {
            TableName: storesTable,
            Key: {
                storeId: { S: product.storeId} 
            },
        }
        const productsParams = {
            TableName: productsTable,
            Key: {
                storeId: { S: product.storeId },
                productId: { S: product.productId }
            },
        };
        const storeResult = await dynamoDB.send(new GetItemCommand(storeParams));
        const store = {
            storeId: storeResult.Item.storeId.S,
            storeName: storeResult.Item.storeName.S,
            topicArn: storeResult.Item.topicArn.S,
            topicStatus: storeResult.Item.topicStatus.S,
            email: storeResult.Item.email.S
        };
        if(!storeResult.Item){
            throw new Error('Store ID not found!')
        }
        if(storeResult.Item.topicStatus.S == "Pending"){
            throw new Error(`To register a product, please confirm subscription via email sent to:  ${store.email}`)
        }
        const productResult = await dynamoDB.send(new GetItemCommand(productsParams));
        if(productResult.Item){
            throw new Error(`Product with following ID: ${product.productId} already exists in ${store.storeName}!`)
        }
        const responseBody = { 
            message: `Dear ${store.storeName}, your product ${product.productName} is currently being processed. You will be notified at ${store.email} once the processing is complete.` 
        };
        const messageBody = JSON.stringify({product, store});
        const sendMessageCommandInput = {
            MessageBody: messageBody,
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
