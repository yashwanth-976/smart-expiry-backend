import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import "dotenv/config";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Health check
app.get("/", (req, res) => {
  res.send("Smart Expiry Backend Running");
});

// Recipes API
app.post("/recipes", async (req, res) => {
  try {
    const { ingredients } = req.body;

    // Basic validation
    if (!Array.isArray(ingredients) || ingredients.length < 1) {
      return res.json({ recipes: [] });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ SUPPORTED MODEL
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are a cooking assistant.

Return ONLY valid JSON.
No explanation.
No markdown.
No extra text.

JSON format:
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
- Use only the given ingredients
- Generate exactly 2 recipes
- Each recipe must have at least 3 steps
`
        },
        {
          role: "user",
          content: `Ingredients: ${ingredients.join(", ")}`
        }
      ]
    });

    // Get raw AI output
    let raw = completion.choices[0].message.content;

    // Safety cleanup (in case AI adds code fences)
    raw = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parse failed:", raw);
      return res.json({ recipes: [] });
    }

    // Final validation
    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      return res.json({ recipes: [] });
    }

    res.json({ recipes: parsed.recipes });

  } catch (err) {
    console.error("❌ Groq API error:", err);
    res.json({ recipes: [] });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
