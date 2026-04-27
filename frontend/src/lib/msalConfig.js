import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "15a5c8f7-6848-46df-8b1c-500a906cab56",
    authority: "https://login.microsoftonline.com/7b00a15b-93dc-4b6a-8bce-06909dcecf35",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"]
};

export const msalInstance = new PublicClientApplication(msalConfig);
