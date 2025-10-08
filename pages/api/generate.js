import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { prompt, previousCode } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let requestPrompt = "";

    if (previousCode) {
      // Update existing code
      requestPrompt = `
You are an AI code builder agent. Here is the existing code:
${previousCode}

The user wants to update or add features according to:
"${prompt}"

Rules:
1. Only update or add code that is necessary.
2. Do NOT remove unrelated code.
3. Return code in proper markdown blocks with language tags (html, css, javascript, etc.).
4. Only return code. Do NOT add explanations outside code.
`;
    } else {
      // Generate full project
      requestPrompt = `
You are an AI code builder agent.
Generate a FULL working project for this request:
"${prompt}"

Rules:
1. You can generate code in HTML, CSS, JavaScript, Python, Node.js, React, Vue, Angular, etc.
2. Always wrap code in proper markdown blocks with correct language tags.
3. Only return code. If generating a web app, HTML must be complete (<html>, <head>, <body>).
`;
    }

    // Call AI model
    const result = await model.generateContent(requestPrompt);
    const fullOutput = await result.response.text();

    if (!fullOutput || fullOutput.trim() === "")
      return res.status(500).json({ error: "AI returned empty output" });

    res.status(200).json({ output: fullOutput });
  } catch (err) {
    console.error("AI request failed:", err);
    res.status(500).json({ error: "AI request failed" });
  }
}
