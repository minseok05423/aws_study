const jwt = require("jsonwebtoken");

// Use environment variable for the secret key
const SECRET_KEY = process.env.JWT_SECRET || "lambda";

exports.handler = async (event, context) => {
  try {
    console.log("Authorizer invoked with event:", JSON.stringify(event));

    // For TOKEN type authorizer, token is in event.authorizationToken
    const token = event.authorizationToken;

    if (!token) {
      console.error("Authorization failed: No token provided");
      throw new Error("Unauthorized"); // TOKEN type requires throwing error to deny
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, "");

    // Verify token synchronously
    try {
      const decoded = jwt.verify(cleanToken, SECRET_KEY);
      console.log("Token verified successfully for user:", decoded.userId || decoded.email);

      // Return Allow policy with user context
      // Note: context values MUST be strings for TOKEN type
      return generatePolicy(
        String(decoded.userId || decoded.email || "user"),
        "Allow",
        event.methodArn,
        {
          userId: String(decoded.userId || ""),
          email: String(decoded.email || ""),
          role: String(decoded.role || ""),
        }
      );
    } catch (err) {
      console.error("Token verification failed:", err.message);
      throw new Error("Unauthorized"); // Client will see generic 401/403
    }
  } catch (error) {
    console.error("Authorizer error:", error.message || error);
    throw new Error("Unauthorized"); // Client will see generic 401/403
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
