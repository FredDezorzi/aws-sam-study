var i=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var m=Object.getOwnPropertyNames;var g=Object.prototype.hasOwnProperty;var u=(r,e)=>{for(var t in e)i(r,t,{get:e[t],enumerable:!0})},l=(r,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of m(e))!g.call(r,o)&&o!==t&&i(r,o,{get:()=>e[o],enumerable:!(s=c(e,o))||s.enumerable});return r};var p=r=>l(i({},"__esModule",{value:!0}),r);var E={};u(E,{challengeHandler:()=>w});module.exports=p(E);var n=require("@aws-sdk/client-cognito-identity-provider");var a=require("crypto");function d(r,e,t){let s=t+r;return(0,a.createHmac)("sha256",e).update(s).digest("base64")}var f=new n.CognitoIdentityProviderClient({region:"us-east-1"}),w=async r=>{try{let e=JSON.parse(r.body),t={ChallengeName:"NEW_PASSWORD_REQUIRED",ClientId:process.env.COGNITO_ID,ChallengeResponses:{USERNAME:e.USER_ID_FOR_SRP,NEW_PASSWORD:e.newPassword,SECRET_HASH:d(process.env.COGNITO_ID,process.env.COGNITO_SECRET,e.USER_ID_FOR_SRP)},Session:e.Session},s=new n.RespondToAuthChallengeCommand(t),o=await f.send(s);return{statusCode:200,body:JSON.stringify(o)}}catch(e){let t={message:`Error: ${e.message}`};return{statusCode:500,body:JSON.stringify(t)}}};0&&(module.exports={challengeHandler});
//# sourceMappingURL=index.js.map
