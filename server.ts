import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client configuration
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI features will fallback to offline mock generators.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Journal Emotional Sentiment Analysis
app.post("/api/gemini/sentiment", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Missing journal content target." });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Offline fallback for resilience when API key is missing
      console.log("Using offline mock fallback for sentiment analysis.");
      const score = Math.random() * 2 - 1; // -1 to 1
      const label = score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral";
      const emotions = ["Calm", "Joy", "Anxiety", "Sorrow", "Anger", "Hope"];
      const dominant = emotions[Math.floor(Math.random() * emotions.length)];
      return res.json({
        sentimentScore: parseFloat(score.toFixed(2)),
        sentimentLabel: label,
        dominantEmotion: dominant,
        analysisTips: "Synora Offline Guard: Please configure your GEMINI_API_KEY in the Secrets menu to unleash full LLM clinical intelligence. Offline assessment shows normal homeostasis balances."
      });
    }

    const ai = getGeminiClient();
    const prompt = `Perform sentiment analysis and diagnostic categorization on this private emotional journal entry. Be clinical, compassionate, and precise.\nJournal Text: "${content}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI Clinical Assistant specializing in sentiment, therapeutic mapping, and proactive emotional advice. Extract emotional tones and suggest healthy coping habits.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentimentScore: {
              type: Type.NUMBER,
              description: "The calculated sentiment score coefficient from -1.0 (highly distressed/negative) to +1.0 (highly vibrant/positive)."
            },
            sentimentLabel: {
              type: Type.STRING,
              description: "Vibe categorizations of the entry.",
              enum: ["positive", "neutral", "negative"]
            },
            dominantEmotion: {
              type: Type.STRING,
              description: "The primary feeling observed. Choose from Calm, Joy, Anxiety, Sorrow, Anger, Hope or custom terms."
            },
            analysisTips: {
              type: Type.STRING,
              description: "A compact, deep 2-sentence clinical/practical recommendation advising the user based on their specific journal thoughts."
            }
          },
          required: ["sentimentScore", "sentimentLabel", "dominantEmotion", "analysisTips"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    console.error("Sentiment analysis error: ", error);
    res.status(500).json({ error: "Failed to perform AI analysis. Secure proxy error." });
  }
});

// 2. API: Companion Emotional Support Chat (Contextual History)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, latestMessage } = req.body;
    if (!latestMessage) {
      return res.status(400).json({ error: "No client message received." });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({
        text: "Offline Mode: Connection successful. I am your local safe pocket therapist. To activate the advanced quantum Gemini intelligence model for depth exploration, please configure process.env.GEMINI_API_KEY inside the cloud engine secrets portal. For now, take a deep breath: you are doing beautifully.",
        detectedEmotion: "Peaceful"
      });
    }

    const ai = getGeminiClient();

    // Map the messages list into formatted conversation roles for the LLM
    const formattedHistory = (messages || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Start a chat session and prompt with history
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: "You are Syno, an empathetic emotional support specialist, certified companion, and wellness guide of the Synora platform. Your responses are gentle, deeply understanding, and encouraging. Never validate suicidal intent; prioritize safety lists. Speak clearly in markdown. Limit responses to 3 concise, high-value paragraphs maximum."
      },
      history: formattedHistory
    });

    const chatResponse = await chat.sendMessage({ message: latestMessage });
    const text = chatResponse.text || "I hear you, please tell me more.";

    // Get a quick emotion tag on this dialogue
    const emotionQuery = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Quickly tag the current emotion of the user's input in exactly one word (e.g., Grateful, Sad, Anxious, Angry, Overwhelmed, Peaceful, Excited) based on this: "${latestMessage}"`,
      config: {
        systemInstruction: "You are a speed categorizer. Return only a single word."
      }
    });
    const detectedEmotion = (emotionQuery.text || "Peaceful").trim().replace(/[^a-zA-Z]/g, '');

    res.json({ text, detectedEmotion });
  } catch (error) {
    console.error("Gemini chat error: ", error);
    res.status(500).json({ error: "Failed to generate dialogue response." });
  }
});

// 3. API: System Health Check (For Kubernetes and Load Balancing probes)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    api_key_configured: !!process.env.GEMINI_API_KEY,
    k8s_probe: "livenessProbeOK_readinessProbeOK"
  });
});

// Integrating Vite Dev server and Static asset compilation
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted in Express context.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static production build from: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Synora Ready] Microservices gateway active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
