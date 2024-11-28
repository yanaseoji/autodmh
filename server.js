const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Webhook Verification (for Meta)
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = "your_verify_token"; // Replace with your verify token

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified successfully.');
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Verification failed.');
        }
    }
});

// Webhook Event Handling
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'instagram') {
        body.entry.forEach(entry => {
            const changes = entry.changes;
            changes.forEach(change => {
                console.log('Received Event:', change);
                // Add your logic here (e.g., sending Auto DM)
            });
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
