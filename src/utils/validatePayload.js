export function validateStorePayload(payload) {
    const requiredFields = ['storeId', 'storeName', 'email'];

    requiredFields.forEach(field => {
        if (!(field in payload)) {
            console.log("Payload invalido")
            throw new Error(`Mandatory field '${field}' missing.`)
        }
    }); 

    if (typeof payload.storeId !== 'string') {
        console.log("StoreId deve ser string");
        throw new Error(`Field 'storeId' must be a string.`)
    }
    if (typeof payload.storeName !== 'string') {
        console.log("storeName deve ser string");
        throw new Error(`Field 'storeName' must be a string.`)
    }
    if (typeof payload.email !== 'string') {
        console.log("email deve ser string");
        throw new Error(`Field 'email' must be a string.`)
    }
}

export function validateProductPayload(payload) {
    const requiredFields = ['storeId', 'productId', 'productName', 'price'];

    requiredFields.forEach(field => {
        if (!(field in payload)) {
            console.log("Payload invalido")
            throw new Error(`Mandatory field '${field}' missing.`)
        }
    }); 

    if (typeof payload.storeId !== 'string') {
        console.log("StoreId deve ser string");
        throw new Error(`Field 'storeId' must be a string.`)
    }
    if (typeof payload.productId !== 'string') {
        console.log("productId deve ser string");
        throw new Error(`Field 'productId' must be a string.`)
    }
    if (typeof payload.productName !== 'string') {
        console.log("productName deve ser string");
        throw new Error(`Field 'productName' must be a string.`)
    }
    if (typeof payload.price !== 'number') {
        console.log("productName deve ser number");
        throw new Error(`Field 'price' must be a number.`)
    }
}