import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return alert("Please enter a prompt!");
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok) setOutput(data.output);
      else alert("Error: " + data.error);
    } catch (err) {
      alert("Request failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

 function openPreview() {
  if (!output) return alert("Generate code first!");

  const blocks = Array.from(output.matchAll(/```(\w+)\n([\s\S]*?)```/g));
  let htmlCode = "";
  let cssCode = "";
  let jsCode = "";

  blocks.forEach((blk) => {
    const lang = blk[1].toLowerCase();
    const code = blk[2].trim();
    if (lang === "html") htmlCode += code + "\n";
    else if (lang === "css") cssCode += code + "\n";
    else if (lang === "js" || lang === "javascript") jsCode += code + "\n";
  });

  if (!htmlCode.trim()) htmlCode = "<html><body><h1>No HTML found</h1></body></html>";

  // Inject CSS into <head> and JS at the bottom of <body>
  const finalHTML = htmlCode.replace(
    /<\/head>/i,
    `<style>${cssCode}</style>\n</head>`
  ).replace(
    /<\/body>/i,
    `<script>${jsCode}</script>\n</body>`
  );

  const win = window.open("about:blank", "_blank");
  win.document.open();
  win.document.write(finalHTML);
  win.document.close();
}


  return (
    <main style={{ fontFamily: "sans-serif", textAlign: "center", padding: 30 }}>
      <h1>Ammoue AI Website Builder</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your website or app..."
        rows="5"
        cols="60"
        style={{ width: "80%", padding: "10px" }}
      />
      <br />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
      <button onClick={openPreview} style={{ marginLeft: 10 }}>
        Preview Website
      </button>

      <pre
        style={{
          textAlign: "left",
          background: "#111",
          color: "#0f0",
          padding: "20px",
          marginTop: "20px",
          whiteSpace: "pre-wrap",
        }}
      >
        {output}
      </pre>
    </main>
  );
}
