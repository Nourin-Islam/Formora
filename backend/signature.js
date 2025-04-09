// Save this as generate-webhook-signature.js
import crypto from "crypto";

const secret = "whsec_6V96YYImTHlOwWCvanzbQm6LVjx0PNX6";
const payload = JSON.stringify({
  event: "user.created",
  data: {
    id: "user_id",
    email: "user@example1.com",
    first_name: "John",
    last_name: "Doe",
  },
});

const svixId = "test_id";
const svixTimestamp = Math.floor(Date.now() / 1000).toString();

const toSign = `${svixId}.${svixTimestamp}.${payload}`;
const signature = crypto.createHmac("sha256", secret).update(toSign).digest("base64");

console.log(`Headers for Postman:
Svix-Id: ${svixId}
Svix-Timestamp: ${svixTimestamp}
Svix-Signature: v1,${signature}`);
