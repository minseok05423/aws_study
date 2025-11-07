const jwt = require("jsonwebtoken");

const key = "lambda";
const payload = {
  userId: 123,
  email: "user@example.com",
  role: "admin",
};
const token = jwt.sign(payload, key, { expiresIn: "1h" });

console.log(token);
