const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const VERIFY_TOKEN = "autodmtoken"; // Hardcoded token value here

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

// Webhook Event Handling Route
app.post('/webhook', (req, res) => {
    console.log('Received Webhook Event:', req.body);
    res.status(200).send('EVENT_RECEIVED'); // Acknowledge receipt of the event
});

// Privacy Policy Route
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy.html')); // Serve the privacy policy HTML file
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
