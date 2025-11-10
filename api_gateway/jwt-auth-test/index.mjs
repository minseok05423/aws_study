import jwt from "jsonwebtoken";

export const handler = async (event) => {
  console.log("Authorizer invoked with event:", JSON.stringify(event));
  const token = event.authorizationToken;

  try {
    if (!token) {
      console.log("Authorization failed: No token provided");
      return generatePolicy("user", "Deny", event.methodArn);
    }
    // Remove 'Bearer ' prefix if present

    const decoded = jwt.verify(token, process.env.key);
    console.log("Token verified successfully for user:", decoded);

    return generatePolicy(decoded.userId, "Allow", event.methodArn);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.log("Token expired", error);
    } else if (error.name === "JsonWebTokenError") {
      console.log("Invalid token", error);
    }
    return generatePolicy("user", "Deny", event.methodArn);
  }
};

function generatePolicy(principalId, effect, resource, context = {}) {
  const authResponse = {
    principalId: principalId,
  };

  if (effect && resource) {
    authResponse.policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    };
  }

  // Add context (optional user data passed to backend)
  if (Object.keys(context).length > 0) {
    authResponse.context = context;
  }

  return authResponse;
}
