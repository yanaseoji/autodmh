const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.json());

// Default Route
app.get('/', (req, res) => {
    res.status(200).send('Server is running successfully!');
});

// Webhook Route
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = "autodmtoken"; // Replace with your token

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook Verified');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403).send('Forbidden');;
        }
    } else {
        res.sendStatus(400).send('Bad Request');
    }
});

// POST route to handle Webhook events
app.post('/webhook', (req, res) => {
    console.log('Received Webhook Event:', req.body);

    // Respond with HTTP 200 status to acknowledge receipt
    res.status(200).send('EVENT_RECEIVED');
});


// Privacy Policy Route
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy.html')); // Serve the privacy policy HTML file
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
