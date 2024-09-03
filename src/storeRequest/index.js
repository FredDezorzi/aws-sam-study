import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sqs = new SQSClient({ region: "us-east-1" });
const storesTable = process.env.STORES_TABLE;
const sqsQueueUrl  = process.env.SQS_QUEUE_URL;

export const storeRequestHandler = async (event) => {
    console.log("INICIO LAMBDA");
    console.log("EVENT: " + JSON.stringify(event, null, 2));
    const store = JSON.parse(event.body);
    console.log("DADOS STORE: " + JSON.stringify(store, null, 2));
    const params = {
        TableName: storesTable,
        Key: {
          storeId: { S: store.storeId} 
        },
      };
    try{
        console.log("Iniciando consulta ao DynamoDB...");
        const result = await dynamoDB.send(new GetItemCommand(params));
        console.log("Resultado da consulta: ", JSON.stringify(result, null, 2));

        if(result.Item){
            console.log("Loja já existe no DynamoDB");
            throw new Error('Store with this ID already exists')
        }
        const responseBody = { message: `Caro(a) ${store.storeName}, sua loja está sendo processada, assim  que terminarmos o cadastro você será notificado pelo email: ${store.email}.` };
        const sendMessageCommandInput = {
            MessageBody: JSON.stringify(store),
            QueueUrl: sqsQueueUrl
        }
        console.log("MENSAGEM ANTES DO SQS: " + responseBody);
        const command = new SendMessageCommand(sendMessageCommandInput);
        console.log("CRIOU COMMAND")
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