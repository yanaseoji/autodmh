const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");

const app = express();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "autodmtoken"; // Use environment variables for security
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "IGQWRPQ1F5alloc1NneDF0Y1NDMlVsUTJHRGtHVkhWZA2RkdllqMGRvb09uemxCdC01c0ppeGFzOHYzWm9uUkQ2SHdZAdXhlQWs2WWs1Vjl3WU01ellUaWRyTVRRMWFtdUhwOXFCT1RocTZAxREd4ZAU1jMWdjNXVoaFEZD"; // Replace with a valid long-lived access token

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

// Webhook Event Handling Route
app.post("/webhook", async (req, res) => {
  const body = req.body;

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
                  try {
                    await sendDirectMessage(commenterId, message);
                  } catch (err) {
                    console.error(`Failed to send DM to ${commenterId}:`, err.message);
                  }
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
  const apiUrl = "https://graph.facebook.com/v17.0/me/messages"; // Correct endpoint

  try {
    console.log(`Sending message to User ID: ${userId}`);
    if (!userId) {
      throw new Error("Invalid User ID. Cannot send message.");
    }

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
    if (error.response?.data?.error?.message) {
      console.error("Graph API Error:", error.response.data.error.message);
    }
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
