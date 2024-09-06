import { DynamoDBClient, PutItemCommand  } from "@aws-sdk/client-dynamodb";
import { SNSClient, CreateTopicCommand, SubscribeCommand, PublishCommand } from "@aws-sdk/client-sns";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });
const productsTable = process.env.PRODUCTS_TABLE;

export const productProcessHandler  = async (event) => {
    console.log("PROCESSOR INICIADO")
    console.log("EVENT: " + JSON.stringify(event, null, 2));
    const body = JSON.parse(event.Records[0].body);
    console.log("BODY: " + JSON.stringify(body));
    const product = body.product;
    const store = body.store;
    console.log("PRODUCT: " + JSON.stringify(product));
    console.log("STORE: " + JSON.stringify(store));

    try{
        const command = {
            TableName: productsTable,
            Item: {
                "storeId": { S: product.storeId },
                "productId": { S: product.productId },
                "productName": { S: product.productName },
                "price": { N: product.price.toString()}
            }
        };

        console.log("COMMAND CRIADO: " + JSON.stringify(command));

        const snsMessage = {
            Message: `O produto ${product.productName} da loja ${store.storeName} foi processado com sucesso.`,
            TopicArn: store.topicArn
        };

        console.log("Enviando mensagem ao SNS...");
        await sns.send(new PublishCommand(snsMessage));
        console.log("Mensagem enviada ao SNS com sucesso");

        await dynamoDB.send(new PutItemCommand(command));

        return { statusCode: 200, body: "Produto processado e mensagem enviada ao SNS" };
    } catch (error) {
        console.error("Erro:", error);
        return { statusCode: 500, body: "Erro interno do servidor" };
    }
}
