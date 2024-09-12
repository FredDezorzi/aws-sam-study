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

        console.log("Iniciando consulta da loja...");
        const storeResult = await dynamoDB.send(new GetItemCommand(storeParams));
        const store = {
            storeId: storeResult.Item.storeId.S,
            storeName: storeResult.Item.storeName.S,
            topicArn: storeResult.Item.topicArn.S,
            topicStatus: storeResult.Item.topicStatus.S,
            email: storeResult.Item.email.S
        };

        if(!storeResult.Item){
            console.log("Loja não existe no DynamoDB");
            throw new Error('Store with this ID does not exist')
        }

        if(storeResult.Item.topicStatus.S == "Pending"){
            console.log("Email ainda não aprovado");
            throw new Error(`To be able to register a product, please confirm subscription via email sent to:  ${store.email}`)
        }

        console.log("Iniciando consulta do produto...");
        const productResult = await dynamoDB.send(new GetItemCommand(productsParams));
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

        console.log("ENVIANDO MENSAGEM: " + JSON.stringify(responseBody, null, 2));
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
