const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");

const app = express();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "autodmtoken"; // Use environment variables for security
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "IGQWRNcDVkZA3FEcEhiVE1XdlR1YTg0Y3NWNUJRaW1peWZARSDRkV1JsT3g5TVFUVG1wbnNuV00yVVhRR0laY0IzRnMtb0c2aGRBblpqcjE2XzVETXRxbjBqYzV3UnBOYWZANZAWtTNjdKSGprZA19xdjBKSEF2eWtPTUUZD"; // Use environment variables

app.use(bodyParser.json());

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

// Callback Route for Business Login
app.get("/callback", (req, res) => {
  const code = req.query.code; // Extract the 'code' from the query parameters
  if (code) {
    console.log(`Business login successful. Code: ${code}`);
    res.status(200).send("Business login successful!");
  } else {
    console.error("No code provided in the callback.");
    res.status(400).send("No code provided");
  }
});

// Webhook Event Handling Route
app.post("/webhook", async (req, res) => {
  const body = req.body; //newcode

  try {
    if (body.object === "instagram") {
      if (Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.field === "comments" && change.value) {
                console.log("New Comment Received:", change.value);

                const commenterId = change.value.from?.id; // Safely access commenter ID
                const commentText = change.value.text?.toLowerCase(); // Normalize comment text

                // Check if the comment contains "yana"
                if (commentText === "yana") {
                  const message = "Test is completed";
                  console.log(`Sending message to commenter: ${commenterId}`);
                  await sendDirectMessage(commenterId, message);
                } else {
                  console.log(`Comment does not contain 'yana'. Skipping DM.`);
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
    } else {
      console.warn("Not an Instagram event:", body);
      res.status(404).send("Not an Instagram event");
    }
  } catch (error) {
    console.error("Unhandled error while processing webhook:", error.message, error.stack);
    res.status(500).send("Internal Server Error");
  }
});

// Function to Send a Direct Message
async function sendDirectMessage(userId, message) {
  const apiUrl = "https://graph.facebook.com/v17.0//messages";

  try {
    console.log(`Sending message to User ID: ${userId}`);
    const response = await axios.post(
      apiUrl,
      {
        recipient: { id: userId },
        message: { text: message },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("DM Sent Response:", response.data);
  } catch (error) {
    console.error("Error Sending DM:", error.response?.data || error.message);
    console.error("Error Status Code:", error.response?.status || "Unknown");
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