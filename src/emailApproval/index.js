import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, ListSubscriptionsByTopicCommand, GetSubscriptionAttributesCommand, PublishCommand } from "@aws-sdk/client-sns";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });
const storeTable = process.env.STORES_TABLE;

export const emailApprovalHandler = async (event) => {
    console.log("EMAIL APPROVAL INICIADO")

    try {
        const scanParams  = {
            TableName: storeTable,
            FilterExpression: '#topicStatus = :status',
            ExpressionAttributeNames: {
            '#topicStatus': 'topicStatus'
            },
            ExpressionAttributeValues: {
                ':status': { S: 'Pending' }
            }
        };

        console.log("EFETUANDO O SCAN")
        const scanResult  = await dynamoDB.send(new ScanCommand(scanParams));

        for (const item of scanResult.Items) {
            const topicArn = item.topicArn.S;
            const listSubscriptionsParams = {
                TopicArn: topicArn
            };

            console.log("LISTANDO ASSINATURAS PARA O TÓPICO: " + topicArn);
            const listSubscriptionsResult = await sns.send(new ListSubscriptionsByTopicCommand(listSubscriptionsParams));

            const subscription = listSubscriptionsResult.Subscriptions.find(sub => sub.Endpoint === item.email.S);

            console.log("subscription: " + JSON.stringify(subscription, null, 2));
            if (!subscription) {
                console.log(`Nenhuma assinatura encontrada para o e-mail ${item.email.S} no tópico ${topicArn}`);
                continue;
            }

            const subscriptionArn = subscription.SubscriptionArn;
            console.log("subscriptionArn: " + subscriptionArn)

            if (subscriptionArn === 'PendingConfirmation') {
                console.log(`Assinatura para o e-mail ${item.email.S} ainda está pendente.`);
                continue;
            }

            const snsParams = {
                SubscriptionArn: subscriptionArn
            };

            console.log("VERIFICANDO ATRIBUTO")
            const snsResult = await sns.send(new GetSubscriptionAttributesCommand(snsParams));
            const subscriptionStatus = snsResult.Attributes.PendingConfirmation;

            if(subscriptionStatus == "false") {
                const updateParams = {
                    TableName: storeTable,
                    Key: { storeId: { S: item.storeId.S } },
                    UpdateExpression: "SET topicStatus = :Approved",
                    ExpressionAttributeValues: {
                        ":Approved": { S: "Approved" }
                    }
                };

                console.log("ATUALIZANDO STATUS")
                await dynamoDB.send(new UpdateItemCommand(updateParams));
                const snsMessage = {
                    Message: `O cadastro da loja ${item.storeName.S} efetuado com sucesso, para realizar cadastro de produtos utilizar o id: ${item.storeId.S}`,
                    TopicArn: item.topicArn.S
                };
                console.log("Enviando mensagem ao SNS...");
                await sns.send(new PublishCommand(snsMessage));
                console.log("Mensagem enviada ao SNS com sucesso");
            };

        }
    } catch (error) {
        console.error("Error processing email approval:", error);
    }
    return { statusCode: 200, body: "Processo de aprovação de e-mail concluído." };
}
