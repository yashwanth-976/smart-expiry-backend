import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.get("/", (req, res) => {
  res.send("Smart Expiry Backend Running");
});

app.post("/recipes", async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length < 2) {
      return res.json({ recipes: [] });
    }

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
Return ONLY valid JSON.
No text.
No explanation.

Format:
{
  "recipes": [
    {
      "name": "string",
      "ingredients": ["string"],
      "steps": ["string"]
    }
  ]
}

Rules:
- Use only given ingredients
- Create 2 recipes
- Each recipe must have at least 3 steps
`
        },
        {
          role: "user",
          content: ingredients.join(", ")
        }
      ]
    });

    let raw = completion.choices[0].message.content;

    // remove accidental code blocks
    raw = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse failed:", raw);
      return res.json({ recipes: [] });
    }

    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      return res.json({ recipes: [] });
    }

    res.json({ recipes: parsed.recipes });

  } catch (err) {
    console.error("Groq error:", err);
    res.json({ recipes: [] });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);
