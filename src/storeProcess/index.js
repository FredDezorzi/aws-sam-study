import { DynamoDBClient, PutItemCommand  } from "@aws-sdk/client-dynamodb";
import { SNSClient, CreateTopicCommand, SubscribeCommand, PublishCommand } from "@aws-sdk/client-sns";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });
const storesTable = process.env.STORES_TABLE;

export const storeProcessHandler  = async (event) => {
    console.log("PROCESSOR INICIADO")
    console.log("EVENT: " + JSON.stringify(event, null, 2));
    const store = JSON.parse(event.Records[0].body);
    console.log(store);
    
    try{
        const name = generateUniqueIdentify(store.storeName);
        const topicName = `store-topic-${name}-${store.storeId}-sns`;
        const createTopicCommand = new CreateTopicCommand({
            Name: topicName
        });

        console.log("CRIANDO TOPICO")
        const topicResponse = await sns.send(createTopicCommand);
        const topicArn = topicResponse.TopicArn;
        console.log("SNS Topic ARN:", topicArn);

        const subscribeCommand = new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: 'email',
            Endpoint: store.email
        });

        console.log("ENVIANDO SUBSCRIBE")
        await sns.send(subscribeCommand);

        const command = {
            TableName: storesTable,
            Item: {
                "storeId": { S: store.storeId },
                "storeName": { S: store.storeName },
                "email": { S: store.email },
                "topicArn": { S: topicArn}
            }
        };

        console.log("COMMAND CRIADO: " + command);

        await dynamoDB.send(new PutItemCommand(command));

        return { statusCode: 200, body: "ok" };
    } catch (error) {
        console.error("Erro:", error);
        return { statusCode: 500, body: "Erro interno do servidor" };
    }

}

export function generateUniqueIdentify(input) {
    const lowerCaseString = input.toLowerCase();
    let string = lowerCaseString.replace(/\s+/g, '');
    const uuidv4 = crypto.randomUUID();
    string += '-' + uuidv4.split('-')[4]
    return string;
}