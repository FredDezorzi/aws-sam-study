import { DynamoDBClient, PutItemCommand  } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Importando S3

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });
const s3 = new S3Client({ region: "us-east-1" }); // Inicializando o S3 Client
const productsTable = process.env.PRODUCTS_TABLE;
const productsBucket = process.env.BUCKET_STORAGE;

export const productProcessHandler  = async (event) => {
    try{
        const body = JSON.parse(event.Records[0].body);
        const product = body.product;
        const store = body.store;
        const command = {
            TableName: productsTable,
            Item: {
                "storeId": { S: product.storeId },
                "productId": { S: product.productId },
                "productName": { S: product.productName },
                "price": { N: product.price.toString()}
            }
        };
        const snsMessage = {
            Message: `The product ${product.productName} has been successfully registered in ${store.storeName}.`,
            TopicArn: store.topicArn
        };
        const s3Params = {
            Bucket: productsBucket,
            Key: `${product.storeId}/${product.productId}.json`,
            Body: JSON.stringify(product),
            ContentType: "application/json"
        };
        await dynamoDB.send(new PutItemCommand(command));
        await s3.send(new PutObjectCommand(s3Params));
        await sns.send(new PublishCommand(snsMessage));

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
