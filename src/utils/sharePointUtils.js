// import { Linking, Alert } from 'react-native'; // Import Linking and Alert for notifications and settings

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Import Config with error handling
let Config;
try {
  Config = require("react-native-config").default || require("react-native-config");
} catch (e) {
  console.warn("react-native-config not available, using fallback");
  Config = null;
}

export const retrieveAccessToken = async () => {
  // Get credentials from environment variables (secure storage)
  // Fallback to hardcoded values if Config is not available (for development/debugging)
  const clientId = Config?.SHAREPOINT_CLIENT_ID || "b1734805-3b9c-4032-a86a-dadaf3773fae";
  const clientSecret = Config?.SHAREPOINT_CLIENT_SECRET || "_yi8Q~IKwqvZBn35SM9wLVV27qbuzLYexY1Dyao7";
  const tenantId = Config?.SHAREPOINT_TENANT_ID || "4a49838b-9576-4a6e-9bac-3704ad1e3866";
  
  // Warn if using fallback (should only happen during development)
  if (!Config || !Config.SHAREPOINT_CLIENT_ID) {
    console.warn("⚠️ Using fallback credentials. Make sure react-native-config is properly configured and app is rebuilt.");
  }

  const tokenUrl = `https://accounts.accesscontrol.windows.net/${tenantId}/tokens/OAuth/2`;
  const formDigestUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/contextinfo`;
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const body = {
    grant_type: `client_credentials`,
    client_id: `${clientId}@${tenantId}`,
    client_secret: clientSecret,
    resource: `00000003-0000-0ff1-ce00-000000000000/solarvest.sharepoint.com@${tenantId}`,
  };
  try {
    const storedTokenJSON = await AsyncStorage.getItem("sharepointToken");
    if (!storedTokenJSON) {
      throw new Error("Token not found");
    }
    const storedToken = JSON.parse(storedTokenJSON);
    if (!storedToken) {
      throw new Error("Token not found");
    }
    const response = await axios({
      method: "GET",
      url: "https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web",
      headers: {
        Authorization: `Bearer ${storedToken.accessToken}`,
        Accept: "application/json;odata=verbose",
      },
    });
    if (response) {
      return [storedToken.accessToken, storedToken.formDigest];
    }
  } catch (error) {
    try {
      const response = await axios({
        method: "POST",
        url: tokenUrl,
        headers: headers,
        data: body,
      });
      if (response?.data?.access_token) {
        try {
          const digestResponse = await axios({
            method: "POST",
            url: formDigestUrl,
            headers: {
              Accept: "application/json;odata=nometadata",
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Bearer ${response.data.access_token}`,
            },
          });

          if (digestResponse?.data?.FormDigestValue) {
            const tokens = {
              accessToken: response.data.access_token,
              formDigest: digestResponse.data.FormDigestValue.split(",")[0],
            };
            const jsonString = JSON.stringify(tokens);

            // Set the stringified object in AsyncStorage
            AsyncStorage.setItem("sharepointToken", jsonString)
              .then(() => {
              })
              .catch((error) => {
              });
            return [
              response.data.access_token,
              digestResponse.data.FormDigestValue.split(",")[0],
            ];
          }
        } catch (error) {
          // Handle digest error silently
        }
      }
    } catch (error) {
      // Handle token error silently - error.response may not exist
    }
  }
};

export const checkFolderExist = async (folderUri,project) => {
  const checkUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${folderUri}')`;
  const uploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`;
  let folderExist = true;
  try {
    const [accessToken, formDigest] = await retrieveAccessToken();

    const response = await axios.get(checkUri, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json;odata=verbose",
      },
    });

    if (response?.data?.d?.Exists !== undefined) {
      return response.data.d.Exists;
    }
    return false;
  } catch (error) {
    // *********Create sharepoint folder path***********
    if (
      error?.response?.data?.error?.code ==
      "-2147024894, System.IO.FileNotFoundException"
    ) {
      try {
        let parentFolder = project;
        const [accessToken, formDigest] = await retrieveAccessToken();

        for (let path of folderUri.split("/").splice(1)) {

          try {
            const response = await axios({
              method: "POST",
              url: uploadUri,
              data: {
                __metadata: {
                  type: "SP.Folder",
                },
                ServerRelativeUrl: `ListofImage/${parentFolder}/${path}`,
              },
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": formDigest,
              },
            });
            parentFolder += "/" + path;
            if (response?.data?.d?.Exists !== undefined) {
              folderExist = response.data.d.Exists;
            }
          } catch (error) {
            // Handle folder creation error silently
            return false;
          }
        }
      } catch (error) {
      }
    }
  }
  return folderExist;
};
