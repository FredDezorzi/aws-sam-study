# AWS SAM Application - Web App Infrastructure

This repository contains the AWS SAM (Serverless Application Model) template to set up the infrastructure for a web application. The infrastructure includes services like S3, Cognito, EventBridge, DynamoDB, Lambda, SQS, SNS, and API Gateway.

## Project Architecture

<img src="/architecture/architecture_AWS.png">

## Features

- **S3 Buckets**: Storage for repository objects.
- **DynamoDB**: Two tables for storing user and product data.
- **SQS**: Queues for processing store and product requests.
- **SNS**: Topics for sending notifications, including email confirmations.
- **Lambda Functions**: Backend logic for handling API requests, processing messages, and managing email notifications.
- **API Gateway**: Provides HTTP endpoints for store and product registration, authentication, and password management.
- **Cognito**: Manages user authentication and access control.

## Notification and Confirmation Process

The application includes a notification workflow for store registration and email confirmation:

1. **Store Registration**:
   - When a store is registered via the `/store` endpoint, an email is sent to the store owner with a confirmation link.
   - The email contains a unique token that the owner must use to confirm their email address and activate their store.

2. **Email Confirmation**:
   - The store owner clicks the confirmation link in the email.
   - This action triggers the `emailApprovalFunction` Lambda function, which validates the token and confirms the store registration.
   - Once confirmed, the store owner receives a second email containing a unique store ID.

3. **Store ID**:
   - The store ID provided in the second email is required for registering products in the store.
   - The store ID must be used when making requests to the `/product` endpoint to associate products with the correct store.
  
## User Creation and Authentication

To use the /store and /product endpoints, you need an authorization token. The process to obtain this token involves the following steps:

1. **Create a User in Cognito (First Step)**:
   - Go to the AWS Console and navigate to the Cognito service.
   - Create a user in the User Pool created by the application.
   - After creating the user, you will receive a password by email.

2. **Authenticate the User**:
   - Use the username and password received to log in at the /auth endpoint.
   - If your account is not yet verified, the /auth endpoint will provide a session that you must use to create a permanent password at the /changePassword endpoint.

3. **Create a Permanent Password**:
   - Fill out the /changePassword endpoint with the new password.
   - After successfully creating the new password, your account will be validated, and an authentication token will be generated.
   - The token is valid for 5 hours. If the token expires, you will need to request a new token at the /auth endpoint, providing the username and the newly created password.

## Application Resources

### S3 Buckets

- `bucketS3RepositoryObjects`: Stores repository objects with public read access.

### DynamoDB Tables

- `dynamoDBStoresTable`: Stores store registration data.
- `dynamoDBProductsTable`: Stores product data, associated with stores.

### SQS Queues

- `SQSRequestStoreQueue`: Queue for store registration requests.
- `SQSRequestProductQueue`: Queue for product registration requests.

### SNS Topics

- `SNSTopicStoreIdNotification`: Dynamic topic for sending notification emails.

### Lambda Functions

- **storeRequestFunction**: Handles store registration requests.
- **productRequestFunction**: Handles product registration requests.
- **storeProcessFunction**: Processes store registrations, including SNS topic creation and email notification.
- **productProcessFunction**: Processes product registrations, stores data in S3, and notify via email with SNS.
- **emailApprovalFunction**: Verifies email confirmations and sends the store ID to the store owner.
- **authorizationFunction**: Manages user authentication via AWS Cognito.
- **permanentPasswordFunction**: Generates permanent passwords for users.

### API Gateway Endpoints

- `/store` (POST): Store registration request.
- `/product` (POST): Product registration request.
- `/auth` (POST): User authentication.
- `/challenge` (POST): Password management (generate a permanent password).

## How to Deploy

### Prerequisites

- AWS CLI configured with appropriate credentials and region.
- AWS SAM CLI installed.

### Deployment Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   
2. Build the application using AWS SAM:

    ```bash
    sam build

3. Deploy the application:

    ```bash
    sam deploy

3. After deploying the stack, AWS SAM will provide API Gateway URLs and other resource identifiers.

## Postman Collection and Environment

In this repository, you will find a Postman collection and environment files for testing the API endpoints. These files are set up to facilitate testing with automated token management. You can use these files to easily test the endpoints and verify the functionality of the application.

### Postman Collection

The Postman collection includes the following endpoints:

- **/store (POST)**: Register a new store.
- **/product (POST)**: Register a new product.
- **/auth (POST)**: Authenticate a user.
- **/changePassword (POST)**: Create a permanent password.

### Postman Environment

The Postman environment file includes variables for:

- **API Base URL**: Base URL for the API Gateway endpoints.
- **Authorization Token**: Automatically managed token for authenticated requests.
- **USER_ID_FOR_SRP**: User ID required for changing the password.
- **SESSION**: Session ID required for changing the password.

### Example Payloads

Here are example payloads for each of the endpoints you can test using Postman:

#### Store Registration

To register a new store, use the following payload in the /store endpoint:

    {
      "storeName": "Loja Teste",
      "email": "loja.teste@gmail.com"
    }

#### Product Registration

To register a new product, use the following payload in the /product endpoint:

    {
      "storeId": "31cd3182-3063-4f6f-8213-4dc184ab4cc5",
      "productName": "Grape",
      "price": 15.5
    }

#### User Authentication

To authenticate a user, use the following payload in the /auth endpoint:

    {
      "username": "loja.teste@gmail.com",
      "password": "uS71Anlb"
    }

#### Change Password

To create a permanent password, use the following payload in the /changePassword endpoint:

    {
      "newPassword": "Teste.24#",
      "userIdForSrp": "{{USER_ID_FOR_SRP}}",
      "session": "{{SESSION}}"
    }

### Important Notes

- **API Base URL** After deploying the application, you will receive the base URL for the API Gateway endpoints. Update the `API Base URL` variable in the Postman environment with this URL to ensure that the requests are correctly routed to your deployed application.
- 
- **Variables for** `changePassword` **Endpoint**: The variables `userIdForSrp` and session are dynamically provided by the `/auth` endpoint response. Ensure that these variables are correctly set in your Postman environment after receiving the response from `/auth`.

### How to Use

1. **Import the Collection**: Open Postman, go to File -> Import, and select the Postman collection file provided in the repository.

2. **Set Up the Environment**: Import the Postman environment file in the same way. Update the API Base URL with the URL provided after deploying the application. This will configure the base URL and token management, and set up the necessary variables (USER_ID_FOR_SRP and SESSION).

3. **Test the Endpoints**: Use the provided example payloads to test the API endpoints. Ensure that the environment variables are correctly set for automated token management and the password change process.
