import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Shared helper: writes one entry to the "auditLogs" collection.
// Call this from any page after a meaningful action happens
// (login, registration, profile edits, admin actions, etc).
export async function logActivity({ email, role, activity, details = "" }) {
  try {
    await addDoc(collection(db, "auditLogs"), {
      timestamp: new Date(),
      email: email || "unknown",
      role: role || "unknown",
      activity,
      details
    });
  } catch (error) {
    // Never block the main action just because logging failed
    console.log("Audit log failed:", error.message);
  }
}