const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios'); // Add axios for API requests

const app = express();
const VERIFY_TOKEN = "autodmtoken"; // Your webhook verification token
const ACCESS_TOKEN = "IGQWRNeEtIb0lfbWN3WEFsa0F0cDN5ZA3pFLWxWZAmFYNFZAzb2dCNTZA2SHBzNjZAYdU8wMlZAPOFY3SUZAEN1g1cWRaUTdhVS1uSUVkSWNSOThnUUJMZAEJtUW16bG5zNnZApOS1qalhqLXRrWnVucE1KNlVGVDJLZAHFYeG8ZD"; // Your Instagram long-lived access token

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

    if (body.object === 'instagram') {
        body.entry.forEach(async (entry) => {
            const changes = entry.changes;

            changes.forEach(async (change) => {
                if (change.field === 'comments') {
                    console.log('New Comment:', change.value);

                    const commenterId = change.value.from.id; // User ID of the commenter

                    // Send the "test is complete" message
                    try {
                        const message = "test is complete";
                        await sendDirectMessage(commenterId, message);
                        console.log(`Message sent to user ID ${commenterId}`);
                    } catch (error) {
                        console.error('Error sending DM:', error.response?.data || error.message);
                    }
                }
            });
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404); // Event not from Instagram
    }
});

// Function to Send a Direct Message
async function sendDirectMessage(userId, message) {
    const apiUrl = `https://graph.facebook.com/v17.0/${userId}/messages`;

    try {
        await axios.post(
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
    } catch (error) {
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
