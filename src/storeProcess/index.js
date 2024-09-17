import { DynamoDBClient, PutItemCommand  } from "@aws-sdk/client-dynamodb";
import { SNSClient, CreateTopicCommand, SubscribeCommand } from "@aws-sdk/client-sns";
import { generateUniqueIdentify } from  '../utils/index.js';


const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });
const storesTable = process.env.STORES_TABLE;

export const storeProcessHandler  = async (event) => {
    try{
        const store = JSON.parse(event.Records[0].body);
        const name = generateUniqueIdentify(store.storeName);
        const topicName = `store-topic-${name}-${store.storeId}-sns`;
        const createTopicCommand = new CreateTopicCommand({
            Name: topicName
        });
        const topicResponse = await sns.send(createTopicCommand);
        const topicArn = topicResponse.TopicArn;
        const subscribeCommand = new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: 'email',
            Endpoint: store.email
        });
        await sns.send(subscribeCommand);
        const command = {
            TableName: storesTable,
            Item: {
                "storeId": { S: store.storeId },
                "storeName": { S: store.storeName },
                "email": { S: store.email },
                "topicArn": { S: topicArn},
                "topicStatus": { S: 'Pending'}
            }
        };
        await dynamoDB.send(new PutItemCommand(command));
        
        return { 
            statusCode: 200,
             body: "ok" 
        };
    }catch(err){
        const responseBody = { message: `Error: ${err.message}` }
        return {
            statusCode: 500,
            body: JSON.stringify(responseBody)
        };
    } 
}