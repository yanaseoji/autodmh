const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios'); // Add axios for API requests

const app = express();
const VERIFY_TOKEN = "autodmtoken"; // Your webhook verification token
const ACCESS_TOKEN = "IGQWRPZAzFSZATVQMlI0STZAFVjBxQVc0YUI3U0hOS0w0TEM4QVRYTXJpbWFKNVlCNkxsR1hhd2dCYk05OHcyZAGV5Q3dwUVoxNzVST0lESDZAhTkphSmRMWnpOYndIM21ZASzM1c3ZAqbGxuWkRUUnphT1VCMjR4NUx3SUUZD"; // Your Instagram long-lived access token

app.use(bodyParser.json());

// Default Route
app.get('/', (req, res) => {
    res.status(200).send('Server is running successfully!');
});

// Webhook Verification Route
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook Verified');
            res.status(200).send(challenge); // Echo back the challenge
        } else {
            res.sendStatus(403); // Forbidden
        }
    } else {
        res.sendStatus(400); // Bad Request
    }
});

// Callback Route for Business Login
app.get('/callback', (req, res) => {
    const code = req.query.code; // Extract the 'code' from the query parameters
    if (code) {
        res.status(200).send('Business login successful!');
    } else {
        res.status(400).send('No code provided');
    }
});

// Webhook Event Handling Route
app.post('/webhook', async (req, res) => {
    const body = req.body;

    try {
        if (body.object === 'instagram') {
            if (Array.isArray(body.entry)) {
                body.entry.forEach(async (entry) => {
                    if (entry && Array.isArray(entry.changes)) {
                        entry.changes.forEach(async (change) => {
                            if (change.field === 'comments' && change.value) {
                                console.log('New Comment:', change.value);

                                const commenterId = change.value.from?.id; // Safely access commenter ID
                                const commentText = change.value.text?.toLowerCase(); // Safely access and normalize comment text

                                // Check if the comment contains "yana"
                                if (commentText === "yana") {
                                    try {
                                        const message = "test is completed";
                                        console.log(message);
                                        
                                        await sendDirectMessage(commenterId, message);
                                        console.log(`Message sent to user ID ${commenterId}`);
                                    } catch (error) {
                                        console.error('Error sending DM:', error.response?.data || error.message);
                                    }
                                } else {
                                    console.log(`Comment does not contain "yana". Skipping DM.`);
                                }
                            }
                        });
                    } else {
                        console.warn('Changes array is missing or invalid in the entry:', entry);
                    }
                });
            } else {
                console.warn('Entry array is missing or invalid in the payload:', body);
            }

            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.status(404).send('Not an Instagram event');
        }
    } catch (error) {
        console.error('Unhandled Error:', error.message, error.stack);
        res.status(500).send('Internal Server Error');
    }
});

// Function to Send a Direct Message
async function sendDirectMessage(userId, message) {
    const apiUrl = `https://graph.facebook.com/v17.0/${userId}/messages`;

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
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('DM Sent Response:', response.data);
    } catch (error) {
        console.error('Error Sending DM:', error.response?.data || error.message);
        throw new Error(error.response?.data || error.message);
    }
}

// Privacy Policy Route
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy.html')); // Serve the privacy policy HTML file
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
