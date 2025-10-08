import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [updatePrompt, setUpdatePrompt] = useState(""); // new: for updating code
  const [files, setFiles] = useState([]); // [{name:"index.html", content:"..."}]
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Generate new code from AI ---
  async function handleGenerate() {
    if (!prompt.trim()) return alert("Please enter a prompt!");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) return alert("Error: " + data.error);

      // Parse AI output into files
      const blocks = Array.from(data.output.matchAll(/```(\w+)\n([\s\S]*?)```/g));
      const newFiles = blocks.map((blk, i) => {
        let name = blk[2].match(/\/\/\s*file:\s*(.+)/i)?.[1] || `file${i}.${blk[1]}`;
        let content = blk[2].replace(/\/\/\s*file:.*\n/i, "").trim();
        return { name, content };
      });

      setFiles(newFiles);
      setSelectedFile(newFiles[0] || null);
    } catch (err) {
      alert("Request failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Update selected file via AI ---
  async function handleUpdate() {
    if (!updatePrompt.trim() || !selectedFile) return alert("Enter update instructions and select a file");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: updatePrompt,
          previousCode: selectedFile.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) return alert("Error: " + data.error);

      // Replace code block content only
      const updatedContent = (data.output.match(/```(\w+)\n([\s\S]*?)```/)?.[2] || "").trim();
      if (!updatedContent) return alert("AI did not return updated code");

      const updatedFile = { ...selectedFile, content: updatedContent };
      setSelectedFile(updatedFile);
      setFiles(files.map(f => (f.name === updatedFile.name ? updatedFile : f)));
      setUpdatePrompt("");
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Update currently selected file manually ---
  function handleFileChange(e) {
    setSelectedFile({ ...selectedFile, content: e.target.value });
    setFiles(files.map(f => (f.name === selectedFile.name ? { ...f, content: e.target.value } : f)));
  }

  // --- Open live preview ---
  function openPreview() {
    if (files.length === 0) return alert("Generate code first!");

    let htmlBlocks = [], cssCode = "", jsCode = "";
    files.forEach(f => {
      const ext = f.name.split(".").pop().toLowerCase();
      if (ext === "html") htmlBlocks.push(f.content);
      else if (ext === "css") cssCode += f.content + "\n";
      else if (ext === "js" || ext === "javascript") jsCode += f.content + "\n";
    });

    let mergedHTML = htmlBlocks.join("\n");
    if (cssCode) {
      if (/<\/head>/i.test(mergedHTML)) mergedHTML = mergedHTML.replace(/<\/head>/i, `<style>${cssCode}</style>\n</head>`);
      else mergedHTML = mergedHTML.replace(/<html>/i, `<html><head><style>${cssCode}</style></head>`);
    }
    if (jsCode) {
      if (/<\/body>/i.test(mergedHTML)) mergedHTML = mergedHTML.replace(/<\/body>/i, `<script>${jsCode}</script>\n</body>`);
      else mergedHTML += `<script>${jsCode}</script>`;
    }

    const win = window.open("about:blank", "_blank");
    win.document.open();
    win.document.write(mergedHTML);
    win.document.close();
  }

  // --- Generate a random AI prompt and immediately generate project ---
async function generateAIprompt() {
  setLoading(true);
  try {
    // Ask AI to create a random project prompt
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Give me a short, unique website or app idea prompt suitable for generating multi-file code (HTML, CSS, JS). Only return the idea in one paragraph.",
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert("Error: " + data.error);

    // Extract AI text (remove markdown if any)
    const randomPrompt = (data.output.match(/```(?:\w+)?\n([\s\S]*?)```/)?.[1] || data.output).trim();

    // Set prompt and automatically generate project
    setPrompt(randomPrompt);
    await handleGenerate();
  } catch (err) {
    alert("Failed to generate random prompt: " + err.message);
  } finally {
    setLoading(false);
  }
}


  return (
 <main style={{ fontFamily: "sans-serif", display: "flex", padding: 20 }}>
  {/* --- Left panel: Prompt + Generate + Update --- */}
  <div style={{ flex: 1, marginRight: 20 }}>
    <h1>Ammoue AI Builder</h1>

    {/* Generate new project */}
    <textarea
      value={prompt}
      onChange={e => setPrompt(e.target.value)}
      placeholder="Describe your website or app..."
      rows="5"
      style={{ width: "100%", padding: 10 }}
    />
    <br />
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? "Generating..." : "Generate"}
    </button>
    <button onClick={openPreview} style={{ marginLeft: 10 }}>
      Preview Website
    </button>

    {/* AI-generated random prompt button */}
    <button onClick={generateAIprompt} style={{ marginTop: 10 }}>
      {loading ? "Generating Random Project..." : "Random AI Prompt & Generate"}
    </button>

    {/* Update selected file */}
    <h3 style={{ marginTop: 20 }}>Update Current Code</h3>
    <textarea
      value={updatePrompt}
      onChange={e => setUpdatePrompt(e.target.value)}
      placeholder="Describe changes to the selected file..."
      rows="3"
      style={{ width: "100%", padding: 10 }}
    />
    <button
      onClick={handleUpdate}
      disabled={loading || !selectedFile}
      style={{ marginTop: 5 }}
    >
      {loading ? "Updating..." : "Update Code"}
    </button>
  </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>Files:</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {files.map(f => (
                <li key={f.name}>
                  <button
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: selectedFile?.name === f.name ? "#ddd" : "#f5f5f5",
                      border: "1px solid #ccc",
                      padding: "5px 10px",
                      marginBottom: 2,
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedFile(f)}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right panel: Editor */}
      <div style={{ flex: 2 }}>
        {selectedFile ? (
          <>
            <h3>Editing: {selectedFile.name}</h3>
            <textarea
              value={selectedFile.content}
              onChange={handleFileChange}
              rows="25"
              style={{ width: "100%", fontFamily: "monospace", padding: 10 }}
            />
          </>
        ) : (
          <p>No file selected</p>
        )}
      </div>
    </main>
  );
}
