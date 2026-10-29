
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleGenAI } = require("@google/genai");

initializeApp();

setGlobalOptions({
  maxInstances: 2,
  region: "us-central1",
});

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const allowedOrigins = [
  "https://bukal-youth-data.web.app",
  "https://bukal-youth-data.firebaseapp.com",
];

exports.aiAssistant = onRequest(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    cors: allowedOrigins,
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST requests only." });
    }

    try {
      const authorization = req.get("Authorization") || "";
      const match = authorization.match(/^Bearer (.+)$/);

      if (!match) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const decoded = await getAuth().verifyIdToken(match[1]);
      const userDoc = await getFirestore()
        .collection("users")
        .doc(decoded.uid)
        .get();

     
if (!userDoc.exists) {
  return res.status(403).json({
    error: "Account not authorized.",
  });
}

const userData = userDoc.data();
const role = userData.role;
const status = String(userData.status || "Active")
  .trim()
  .toLowerCase();

if (role === "admin" && status !== "active") {
  return res.status(403).json({
    error: "Administrator account is inactive.",
  });
}

if (
  role === "youth" &&
  (
    status === "inactive" ||
    userData.eligibility === "Archived"
  )
) {
  return res.status(403).json({
    error: "Youth account is inactive or archived.",
  });
}

const { task, prompt } = req.body || {};

      const allowedTasks = {
        "report-summary": ["admin"],
        "admin-recommendations": ["admin"],
        "youth-recommendations": ["youth"],
      };

      if (
        typeof task !== "string" ||
        !allowedTasks[task] ||
        !allowedTasks[task].includes(role)
      ) {
        return res.status(403).json({ error: "Task not authorized." });
      }

      if (
        typeof prompt !== "string" ||
        prompt.trim().length === 0 ||
        prompt.length > 12000
      ) {
        return res.status(400).json({ error: "Invalid prompt." });
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 700,
          temperature: 0.5,
        },
      });

      const text = result.text;

      if (!text) {
        return res.status(502).json({ error: "AI returned an empty response." });
      }

      return res.status(200).json({ text });
    } catch (error) {
      if (error.code === "auth/id-token-expired" ||
          error.code === "auth/argument-error" ||
          error.code === "auth/invalid-id-token") {
        return res.status(401).json({ error: "Please sign in again." });
      }

      // Avoid logging prompts, personal data, or secret values.
      console.error("AI assistant request failed:", error.message);
      return res.status(500).json({ error: "AI request failed." });
    }
  }
);