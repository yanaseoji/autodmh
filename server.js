const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
require("dotenv").config(); // Load environment variables from .env file

// Debugging Logs
console.log("ACCESS_TOKEN:", process.env.ACCESS_TOKEN ? "Loaded" : "Missing");
console.log("APP_SECRET:", process.env.APP_SECRET ? "Loaded" : "Missing");
console.log("VERIFY_TOKEN:", process.env.VERIFY_TOKEN ? "Loaded" : "Missing");

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "autodmtoken"; // Secure token for webhook verification
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // Store the token in environment variables
const APP_SECRET = process.env.APP_SECRET; // Store the app secret securely

if (!ACCESS_TOKEN || !APP_SECRET) {
  console.error("ACCESS_TOKEN or APP_SECRET is missing. Please configure .env file.");
  process.exit(1);
}

app.use(bodyParser.json());

// Function to generate appsecret_proof
function generateAppSecretProof(accessToken, appSecret) {
  return crypto.createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

// Default Route
app.get("/", (req, res) => {
  res.status(200).send("Server is running successfully!");
});

// Webhook Verification Route
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook Verified");
      res.status(200).send(challenge); // Echo back the challenge
    } else {
      console.warn("Webhook verification failed. Invalid token.");
      res.sendStatus(403); // Forbidden
    }
  } else {
    console.error("Webhook verification request is missing required parameters.");
    res.sendStatus(400); // Bad Request
  }
});

// Webhook Event Handling Route
app.post("/webhook", async (req, res) => {
  const body = req.body;

  try {
    if (body.object === "instagram") {
      if (Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.field === "comments" && change.value) {
                console.log("New Instagram Comment:", change.value);

                const commenterId = change.value.from?.id; // Safely access commenter ID
                const commentText = change.value.text?.toLowerCase(); // Normalize text

                if (commentText === "yana") {
                  if (commenterId) {
                    try {
                      const message = "Test is completed";
                      await sendDirectMessage(commenterId, message);
                      console.log(`Message sent to user ID ${commenterId}`);
                    } catch (error) {
                      console.error("Error sending DM:", error.response?.data || error.message);
                    }
                  } else {
                    console.warn("Commenter ID is missing. Cannot send DM.");
                  }
                } else {
                  console.log(`Comment does not contain "yana". Skipping DM.`);
                }
              }
            }
          } else {
            console.warn("Changes array is missing or invalid in the entry:", entry);
          }
        }
      } else {
        console.warn("Entry array is missing or invalid in the payload:", body);
      }
      res.status(200).send("EVENT_RECEIVED");
    } else if (body.object === "page") {
      if (Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.messaging && Array.isArray(entry.messaging)) {
            for (const event of entry.messaging) {
              if (event.read) {
                console.log("Read Event:", event.read);
              } else if (event.message) {
                console.log("Message Event:", event.message);
              } else {
                console.log("Unhandled Messenger Event:", event);
              }
            }
          } else {
            console.warn("Messaging array is missing or invalid in the entry:", entry);
          }
        }
      }
      res.status(200).send("EVENT_RECEIVED");
    } else {
      console.warn("Unhandled object type:", body.object);
      res.status(404).send("Unhandled object type");
    }
  } catch (error) {
    console.error("Unhandled Error:", error.message, error.stack);
    res.status(500).send("Internal Server Error");
  }
});

// Function to Send a Direct Message
async function sendDirectMessage(userId, message) {
  const appSecretProof = generateAppSecretProof(ACCESS_TOKEN, APP_SECRET);
  const apiUrl = `https://graph.facebook.com/v21.0/${userId}/messages?appsecret_proof=${appSecretProof}`;

  try {
    console.log("Using Access Token (Partial):", ACCESS_TOKEN.slice(0, 10) + "...");
    console.log("App Secret Proof:", appSecretProof);
    console.log(`Sending message to User ID: ${userId}`);
    const response = await axios.post(
      apiUrl,
      {
        recipient: { id: userId },
        message: { text: message },
      },
      {
        headers: {
        //  Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("DM Sent Response:", response.data);
  } catch (error) {
    console.error("Error Sending DM:", error.response?.data || error.message);
    throw new Error(error.response?.data || error.message);
  }
}

// Privacy Policy Route
app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "privacy-policy.html")); // Serve the privacy policy HTML file
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
