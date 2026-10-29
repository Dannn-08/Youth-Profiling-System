import { auth } from "./firebase-config.js";

const AI_WORKER_URL =
"https://bukal-youth-ai.jonamarintan2002.workers.dev";

export async function generateAISummary(promptText) {
const user = auth.currentUser;

if (!user) {
throw new Error("Please log in again before generating the AI summary.");
}

if (
typeof promptText !== "string" ||
!promptText.trim() ||
promptText.length > 12000
) {
throw new Error("The report summary input is empty or too long.");
}

const idToken = await user.getIdToken();

const response = await fetch(AI_WORKER_URL, {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${idToken}`
},
body: JSON.stringify({
task: "admin-report-summary",
reportContext: promptText.trim()
})
});

const data = await response.json().catch(() => ({}));

if (!response.ok) {
throw new Error(
data.error || `AI service request failed (${response.status}).`
);
}

if (typeof data.text !== "string" || !data.text.trim()) {
throw new Error("The AI service returned an empty response.");
}

return data.text.trim();
}