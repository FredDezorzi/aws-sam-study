import { CognitoIdentityProviderClient, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";
import { generateCognitoSecretHash } from  '../utils/index.js';

const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

export const challengeHandler = async (event) => {
  try {
    const credentials = JSON.parse(event.body);
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
    const command = new RespondToAuthChallengeCommand(params);
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