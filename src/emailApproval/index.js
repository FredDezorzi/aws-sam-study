import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, ListSubscriptionsByTopicCommand, GetSubscriptionAttributesCommand, PublishCommand } from "@aws-sdk/client-sns";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });
const storeTable = process.env.STORES_TABLE;

export const emailApprovalHandler = async (event) => {
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
        const scanResult  = await dynamoDB.send(new ScanCommand(scanParams));

        for (const item of scanResult.Items) {
            const topicArn = item.topicArn.S;
            const listSubscriptionsParams = {
                TopicArn: topicArn
            };
            const listSubscriptionsResult = await sns.send(new ListSubscriptionsByTopicCommand(listSubscriptionsParams));
            const subscription = listSubscriptionsResult.Subscriptions.find(sub => sub.Endpoint === item.email.S);
            if (!subscription) {
                continue;
            }
            const subscriptionArn = subscription.SubscriptionArn;
            if (subscriptionArn === 'PendingConfirmation') {
                continue;
            }
            const snsParams = {
                SubscriptionArn: subscriptionArn
            };
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

                await dynamoDB.send(new UpdateItemCommand(updateParams));
                const snsMessage = {
                    Message: `The registration of the store ${item.storeName.S} was successfully completed. To register products, please use the following ID: ${item.storeId.S}.`,
                    TopicArn: item.topicArn.S
                };
                await sns.send(new PublishCommand(snsMessage));
            };
        }
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
