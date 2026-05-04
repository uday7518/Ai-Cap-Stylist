import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

app.post("/recommend", async (req, res) => {
  try {
    const { image, occasion } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a fashion stylist who suggests caps based on user appearance and occasion.",
        },
        {
          role: "user",
          content: `User is going for ${occasion}.
Give a short, clean recommendation in 3-4 lines.
No markdown, no ** symbols.
Just plain readable text.`,
        },
      ],
    });

    res.json({
      result: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
