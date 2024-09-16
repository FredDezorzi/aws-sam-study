import { createHmac } from 'crypto';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

export const authorizationHandler = async (event) => {
    const credentials = JSON.parse(event.body);
    console.log("CREDENTIALS:", JSON.stringify(credentials, null, 2));
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_ID,
      AuthParameters: {
        USERNAME: credentials.username,
        PASSWORD: credentials.password ,
        SECRET_HASH: generateCognitoSecretHash(
          process.env.COGNITO_ID,
          process.env.COGNITO_SECRET,
          credentials.username,
        ),
      },
    };
    console.log("params para secret  hash: client_ID: " + process.env.COGNITO_ID + " secretId: " + process.env.COGNITO_SECRET + " username: " + credentials.username);
    console.log("params:", JSON.stringify(params, null, 2));

    try {
        const command = new InitiateAuthCommand(params);
        const response = await client.send(command);
    
        return { 
            statusCode: 200, 
            body: JSON.stringify(response)
        };
    } catch(error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: error.message }),
        };
    }
}

function generateCognitoSecretHash(
    clientId,
    clientSecret,
    username,
  ) {
    const message = username + clientId;
    return createHmac('sha256', clientSecret).update(message).digest('base64');
  }