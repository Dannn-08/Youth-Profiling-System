
import { auth } from "./firebase-config.js";

const AI_WORKER_URL =
  "https://bukal-youth-ai.jonamarintan2002.workers.dev";

export async function generateYouthRecommendations(profile) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in again before using AI recommendations.");
  }

  const toList = (value) => {
    const items = Array.isArray(value)
      ? value
      : String(value || "").split(/[,;/|]+/);

    return items
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  };

  const hobbies = toList(profile?.hobbies);
  const sports = toList(profile?.sports);
  const interests = toList(profile?.interests);

  if (!hobbies.length && !sports.length && !interests.length) {
    throw new Error(
      "Add at least one hobby, sport, or interest to get AI recommendations."
    );
  }

  const idToken = await user.getIdToken();

  const response = await fetch(AI_WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      task: "youth-recommendations",
      profile: { hobbies, sports, interests }
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error || `AI request failed (${response.status}).`
    );
  }

  if (typeof result.text !== "string" || !result.text.trim()) {
    throw new Error("The AI service returned an empty response.");
  }

  return result.text.trim();
}