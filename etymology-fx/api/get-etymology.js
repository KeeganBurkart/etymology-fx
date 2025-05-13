// Example for Node.js (e.g., Vercel Serverless Function)
// Remember to install the Google Generative AI SDK: npm install @google/generative-ai

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const word = req.query.word;

    if (!word) {
        return res.status(400).json({ error: 'Word parameter is required' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or your preferred model

        const prompt = `
            You are an expert etymologist. Analyze the word "${word}".
            Your primary goal is to break it down into its constituent meaningful morphemes (prefixes, roots, suffixes).
            For each morpheme, provide:
            1. The morpheme itself (e.g., "pre-", "bio", "-logy").
            2. Its type (e.g., "prefix", "root", "suffix").
            3. Its language of origin (e.g., Latin, Greek, Old English).
            4. Its original meaning in that language.

            Also, provide a concise overall etymology of the full word "${word}".

            Return the response STRICTLY as a JSON object. Do not include any explanatory text, code block markers (\`\`\`json), or markdown before or after the JSON object itself.
            The JSON structure should be:
            {
              "word": "${word}",
              "overall_etymology": "Concise overall summary of the word's origin and evolution.",
              "morphemes": [
                {
                  "morpheme": "string",
                  "type": "prefix | root | suffix",
                  "origin": "string (e.g., Latin, Greek)",
                  "meaning": "string"
                }
              ]
            }
            If the word cannot be meaningfully broken into morphemes (e.g., it's a single root word with no affixes), the "morphemes" array should be empty or contain a single entry representing the whole word as a root.
            Focus on common, well-established etymological breakdowns.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Attempt to parse the text as JSON
        // Gemini might sometimes still wrap it or add minor text, so be robust if possible
        let jsonData;
        try {
            // A common issue is Gemini returning ```json ... ```
            const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();
            jsonData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Error parsing Gemini response:", parseError);
            console.error("Raw Gemini response:", text);
            return res.status(500).json({ error: "Failed to parse etymology data from AI.", details: text });
        }

        res.status(200).json(jsonData);

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to fetch etymology from AI.' });
    }
}