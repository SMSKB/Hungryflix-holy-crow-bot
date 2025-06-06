const express = require('express');
// Ensure you have run: npm install node-fetch@2
const fetch = require('node-fetch');
const cors = require('cors'); // Ensure you have run: npm install cors

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Replace with YOUR n8n Webhook URL (preferably the TEST URL for development)
const N8N_WEBHOOK_URL = 'https://my-n8n-bot-qyea.onrender.com/webhook/0a1ba022-717d-42b5-a893-9d7b726961ff'; // <<=== PUT YOUR N8N TEST URL HERE

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies
app.use(express.static('public')); // To serve your HTML, CSS, JS frontend files

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Received from client: ${userMessage}`); // Log incoming message

    try {
        // Forward message to n8n webhook
        console.log(`Forwarding to n8n: ${N8N_WEBHOOK_URL}`); // Log the URL being called
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any other headers n8n expects, like an API key if you set one up
                // 'Authorization': 'Bearer YOUR_N8N_OPTIONAL_API_KEY'
            },
            body: JSON.stringify({
                // Structure this payload as your n8n webhook trigger expects
                // For example:
                query: userMessage, // This matches what n8n likely expects for an "AI Agent"
                userId: 'chat-user-01' // Optional: if you want to track users
            }),
        });

        const responseText = await n8nResponse.text(); // Get raw response text for debugging
        console.log(`n8n status: ${n8nResponse.status}`);
        console.log(`n8n response text: ${responseText}`);

        if (!n8nResponse.ok) {
            console.error(`Error from n8n webhook: ${n8nResponse.status} - ${responseText}`);
            return res.status(502).json({ error: 'Failed to get response from AI agent', details: responseText });
        }

        // Try to parse the response as JSON
        let n8nData;
        try {
            n8nData = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse n8n response as JSON:', e);
            console.error('n8n raw response was:', responseText);
            return res.status(500).json({ error: 'AI agent sent an invalid response format.'});
        }
        
        console.log('Received from n8n (parsed):', n8nData);

        // Adjust this based on n8n's actual response structure.
        // Common fields might be 'reply', 'text', 'message', or nested within a 'data' object.
        const botReply = n8nData.reply || n8nData.text || n8nData.message || (n8nData.data && n8nData.data.reply) || "I'm not sure how to respond to that right now.";

        res.json({ reply: botReply });

    } catch (error) {
        console.error('Error in /api/chat (forwarding to n8n or processing response):', error);
        res.status(500).json({ error: 'Internal server error while contacting AI agent.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Make sure your N8N_WEBHOOK_URL is set to: ${N8N_WEBHOOK_URL}`);
});