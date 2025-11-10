import jwt from "jsonwebtoken";

const key = "lambda";
const payload = {
  userId: 123,
  email: "testUser@gmail.com",
  role: "admin",
};
const token = jwt.sign(payload, key, { expiresIn: "1h" });
console.log(token);
