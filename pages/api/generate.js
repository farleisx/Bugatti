import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { prompt, previousCode } = req.body;
  if (!prompt || typeof prompt !== "string")
    return res.status(400).json({ error: "Missing or invalid prompt" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const requestPrompt = previousCode
      ? `
You are an AI code builder agent. You have the following existing code:
${previousCode}

The user wants to update or add features according to:
"${prompt}"

Rules:
1. Return updated code wrapped in markdown blocks.
2. Only update relevant parts, don't remove unrelated code.
3. Use correct language tags.
4. Do not explain outside code.
`
      : `
You are an AI code builder agent.
Generate a full working project for this request:
"${prompt}"

Rules:
1. Wrap code in markdown with correct language tags.
2. If it's a web app, include <html>, <head>, <body>.
3. Only return code, no extra text.
`;

    const result = await model.generateContent(requestPrompt);
    const fullOutput = result.response.text();

    if (!fullOutput || !fullOutput.trim())
      return res.status(500).json({ error: "Empty AI output" });

    res.status(200).json({ output: fullOutput });
  } catch (err) {
    console.error("AI request failed:", err);
    res.status(500).json({ error: "AI request failed", details: err.message });
  }
}
