const fetch = require('node-fetch'); // we'll use global fetch safely for Node 18+

/*
 * AI Controller handling communication with the Anakin API
 */
exports.chat = async (req, res) => {
    try {
        const { message, context } = req.body;
        const apiKey = process.env.ANAKIN_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'Anakin API key not configured.' });
        }

        // We use the recommended Anakin quickapps or chatbots endpoint.
        // Assuming a Chatbot App architecture and ANAKIN_APP_ID environment variable
        const appId = process.env.ANAKIN_APP_ID || 'default_app_id';
        const url = `https://api.anakin.ai/v1/chatbots/${appId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                content: message,
                stream: false,
                context: context || {}
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Anakin API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();

        res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        console.error('AI Controller Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Controller to interface database layer anomalies evaluation via Anakin API
 */
exports.evaluateAnomaly = async (req, res) => {
    try {
        const { policy, resource } = req.body;
        const apiKey = process.env.ANAKIN_API_KEY;

        const response = await fetch("https://api.anakin.ai/v1/quickapps/anomaly/runs", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                inputs: { policy, resource }
            })
        });

        const data = await response.json();
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
