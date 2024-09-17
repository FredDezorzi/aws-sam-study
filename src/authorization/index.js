import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { generateCognitoSecretHash } from  '../utils/index.js';

const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

export const authorizationHandler = async (event) => {
  try {
    const credentials = JSON.parse(event.body);
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
    const command = new InitiateAuthCommand(params);
    const responseBody = await client.send(command);

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