import { createHmac } from 'crypto';
import { CognitoIdentityProviderClient, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";
const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

export const challengeHandler = async (event) => {
    const credentials = JSON.parse(event.body);
    console.log("CREDENTIALS:", JSON.stringify(credentials, null, 2));
    const params = {
      ChallengeName: "NEW_PASSWORD_REQUIRED",
      ClientId: process.env.COGNITO_ID,
      ChallengeResponses: {
        USERNAME: credentials.USER_ID_FOR_SRP,
        NEW_PASSWORD: credentials.newPassword,
        SECRET_HASH: generateCognitoSecretHash(
          process.env.COGNITO_ID ,
          process.env.COGNITO_SECRET,
          credentials.USER_ID_FOR_SRP,
        ),
      },
      Session: credentials.Session,
    }
      console.log("params:", JSON.stringify(params, null, 2));

      try {
        const command = new RespondToAuthChallengeCommand(params);
        const response = await client.send(command);
        console.log("Autenticado com sucesso:", response);
        return { 
            statusCode: 200, 
            body: JSON.stringify(response)
        };
      } catch (error) {
        console.error("Erro ao responder ao desafio:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
          };
      }
}

function generateCognitoSecretHash(clientId, clientSecret, username,) {
    const message = username + clientId;
    return createHmac('sha256', clientSecret).update(message).digest('base64');
  }