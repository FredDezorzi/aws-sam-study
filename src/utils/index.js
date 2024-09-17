import { createHmac } from 'crypto';

export function generateCognitoSecretHash(clientId, clientSecret, username,) {
    const message = username + clientId;
    return createHmac('sha256', clientSecret).update(message).digest('base64');
}

export function generateUniqueIdentify(input) {
    const lowerCaseString = input.toLowerCase();
    let string = lowerCaseString.replace(/\s+/g, '');
    const uuidv4 = crypto.randomUUID();
    string += '-' + uuidv4.split('-')[4]
    return string;
}

export function validateStorePayload(payload) {
    const requiredFields = ['storeName', 'email'];

    requiredFields.forEach(field => {
        if (!(field in payload)) {
            throw new Error(`Mandatory field '${field}' missing.`)
        }
    }); 
    if (typeof payload.storeName !== 'string') {
        throw new Error(`Field 'storeName' must be a string.`)
    }
    if (typeof payload.email !== 'string') {
        throw new Error(`Field 'email' must be a string.`)
    }
}

export function validateProductPayload(payload) {
    const requiredFields = ['storeId', 'productName', 'price'];

    requiredFields.forEach(field => {
        if (!(field in payload)) {
            throw new Error(`Mandatory field '${field}' missing.`)
        }
    }); 
    if (typeof payload.storeId !== 'string') {
        throw new Error(`Field 'storeId' must be a string.`)
    }
    if (typeof payload.productName !== 'string') {
        throw new Error(`Field 'productName' must be a string.`)
    }
    if (typeof payload.price !== 'number') {
        throw new Error(`Field 'price' must be a number.`)
    }
}