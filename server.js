const https = require('https'); // Import HTTPS module
const fs = require('fs'); // Import File System module
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios'); // Add axios for API requests

const app = express();
const VERIFY_TOKEN = "autodmtoken"; // Your webhook verification token
const ACCESS_TOKEN = "IGQWRNeEtIb0lfbWN3WEFsa0F0cDN5ZA3pFLWxWZAmFYNFZAzb2dCNTZA2SHBzNjZAYdU8wMlZAPOFY3SUZAEN1g1cWRaUTdhVS1uSUVkSWNSOThnUUJMZAEJtUW16bG5zNnZApOS1qalhqLXRrWnVucE1KNlVGVDJLZAHFYeG8ZD"; // Replace with your valid token

// Load SSL Certificates
const privateKey = fs.readFileSync('path/to/your/private.key', 'utf8');
const certificate = fs.readFileSync('path/to/your/certificate.crt', 'utf8');
const ca = fs.readFileSync('path/to/your/ca_bundle.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };

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
    const code = req.query.code;
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

                                const commenterId = change.value.from?.id;
                                const commentText = change.value.text?.toLowerCase();

                                if (commentText === "yana") {
                                    try {
                                        const message = "test is completed";
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
                    }
                });
            }
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
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
    res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

// Start HTTPS Server
const PORT = process.env.PORT || 3000;
https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Secure server is running on https://localhost:${PORT}`);
});
