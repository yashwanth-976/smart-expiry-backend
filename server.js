import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
app.get("/", (req, res) => {
  res.send("Smart Expiry Backend is running ✅");
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/recipes", async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: "No ingredients provided" });
  }
  const prompt = `
Suggest 3 simple recipes using: ${ingredients.join(", ")}.
For each recipe:
- Give recipe name
- Give 3–5 cooking steps
- Keep it simple for students
`;

Rules:
- Simple Indian home cooking
- No rare ingredients
- Short steps
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    res.json({
      recipes: data.choices[0].message.content
    });
  } catch (err) {
    res.status(500).json({ error: "Groq API error" });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Smart Expiry backend running on http://localhost:${PORT}`)
);


