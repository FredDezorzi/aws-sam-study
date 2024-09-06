import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { validateProductPayload } from  '../utils/validatePayload.js';

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sqs = new SQSClient({ region: "us-east-1" });
const productsTable = process.env.PRODUCTS_TABLE;
const storesTable = process.env.STORES_TABLE;
const sqsQueueUrl  = process.env.SQS_QUEUE_URL;

export const productRequestHandler = async (event) => {
    console.log("INICIO LAMBDA");
    console.log("EVENT: " + JSON.stringify(event, null, 2));
    const product = JSON.parse(event.body);
    console.log("DADOS DO PRODUCT: " + JSON.stringify(product, null, 2));

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

    try{
        console.log("Iniciando validacao de paylaod...")
        await validateProductPayload(product);
        console.log("Payload validado");

        console.log("Iniciando consulta da loja...");
        const storeResult = await dynamoDB.send(new GetItemCommand(storeParams));
        console.log("Resultado da consulta: ", JSON.stringify(storeResult, null, 2));
        const store = {
            storeId: storeResult.Item.storeId.S,
            storeName: storeResult.Item.storeName.S,
            topicArn: storeResult.Item.topicArn.S,
            email: storeResult.Item.email.S
        };
        console.log("STORE como JSON: " + JSON.stringify(store));

        if(!storeResult.Item){
            console.log("Loja não existe no DynamoDB");
            throw new Error('Store with this ID does not exist')
        }

        console.log("Iniciando consulta do produto...");
        const productResult = await dynamoDB.send(new GetItemCommand(productsParams));
        console.log("Resultado da consulta: ", JSON.stringify(productResult, null, 2));
        if(productResult.Item){
            console.log("Id do produto já existe no DynamoDB");
            throw new Error(`Product with ID ${product.productId} already exists in ${store.storeName}`)
        }

        const responseBody = { 
            message: `Caro(a) ${store.storeName}, sua seu produto ${product.productName} está sendo processado. Quando o processamento finalizar você será notificado pelo email: ${store.email}.` 
        };
        const messageBody = JSON.stringify({product, store});
        const sendMessageCommandInput = {
            MessageBody: messageBody,
            QueueUrl: sqsQueueUrl
        }

        console.log("MENSAGEM ANTES DO SQS: " + JSON.stringify(responseBody, null, 2));
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
