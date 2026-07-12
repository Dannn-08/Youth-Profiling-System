import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./audit-log.js";

// Field definitions used for both the read-only view and the edit form.
// "full" = spans the full width of the form grid (matches youth-register.html)
const FIELDS = [
  { key: "fullName", label: "Full Name", type: "text", full: true },
  { key: "age", label: "Age", type: "number" },
  { key: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Prefer not to say"] },
  { key: "address", label: "Address / Purok", type: "text", full: true },
  { key: "contact", label: "Contact Number", type: "tel", full: true },
  { key: "education", label: "Educational Attainment", type: "select", options: ["Elementary", "High School", "Senior High School", "College", "Vocational", "Graduate", "Out of School Youth"] },
  { key: "educationStatus", label: "Current Education Status", type: "select", options: ["Currently Studying", "Not Studying", "Graduated"] },
  { key: "employment", label: "Employment Status", type: "select", options: ["Student", "Employed", "Unemployed", "Self-employed"] },
  { key: "civic", label: "Civic Participation", type: "select", options: ["Active", "Occasional", "Not Active"] },
  { key: "voterStatus", label: "Voter Registration Status", type: "select", options: ["Registered Voter", "Not Registered"] },
  { key: "newVoter", label: "New Voter Status", type: "select", options: ["New Voter", "Existing Voter", "Not Applicable"] },
  { key: "voterParticipation", label: "Voter Participation", type: "select", options: ["Participated", "Not Participated", "Not Applicable"] },
  { key: "specialNeeds", label: "Special Needs", type: "select", options: ["No", "Yes"] },
  { key: "assistance", label: "Specific Assistance Needed", type: "text", full: true },
  { key: "hobbies", label: "Hobbies / Skills", type: "text", full: true },
  { key: "sports", label: "Sports Interests", type: "text", full: true }
];

const welcomeEl = document.getElementById("youthWelcome");
const profileViewEl = document.getElementById("youthProfileView");
const editBtn = document.getElementById("editProfileBtn");
const dialog = document.getElementById("profileDialog");
const editFieldsEl = document.getElementById("profileEditFields");
const saveBtn = document.getElementById("saveProfileBtn");

let currentUser = null;
let currentData = null;

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function renderProfileView(data) {
  welcomeEl.textContent = "Welcome, " + (data.fullName || "Youth");

  const rows = [{ key: "email", label: "Email" }, ...FIELDS]
    .map(f => {
      const value = f.key === "email" ? (data.email || "") : (data[f.key] || "");
      return `
        <div class="info-item">
          <small>${escapeHtml(f.label)}</small>
          <span>${escapeHtml(value) || "&mdash;"}</span>
        </div>
      `;
    })
    .join("");

  profileViewEl.innerHTML = `<div class="info-grid">${rows}</div>`;
}

function buildEditFields(data) {
  editFieldsEl.innerHTML = FIELDS.map(f => {
    const value = data[f.key] ?? "";
    const fieldClass = f.full ? "field full" : "field";

    if (f.type === "select") {
      const options = f.options
        .map(opt => `<option value="${escapeHtml(opt)}" ${opt === value ? "selected" : ""}>${escapeHtml(opt)}</option>`)
        .join("");
      return `
        <label class="${fieldClass}">
          <span>${escapeHtml(f.label)}</span>
          <select name="${f.key}">
            <option value="">Select</option>
            ${options}
          </select>
        </label>
      `;
    }

    return `
      <label class="${fieldClass}">
        <span>${escapeHtml(f.label)}</span>
        <input type="${f.type}" name="${f.key}" value="${escapeHtml(value)}" />
      </label>
    `;
  }).join("");
}

editBtn.addEventListener("click", () => {
  if (!currentData) return;
  buildEditFields(currentData);
  dialog.showModal();
});

saveBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const updated = {};
  FIELDS.forEach(f => {
    const input = editFieldsEl.querySelector(`[name="${f.key}"]`);
    if (!input) return;
    updated[f.key] = f.type === "number" ? Number(input.value) : input.value.trim();
  });

  try {
    await updateDoc(doc(db, "users", currentUser.uid), updated);

    currentData = { ...currentData, ...updated };
    renderProfileView(currentData);

    await logActivity({ email: currentUser.email, role: "youth", activity: "Updated profile" });

    dialog.close();
    alert("Profile updated successfully!");

  } catch (error) {
    console.log(error.code);
    console.log(error.message);
    alert("Something went wrong while saving your profile. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return; // youth-check.js already handles the redirect

  currentUser = user;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      profileViewEl.innerHTML = `<p class="empty-state">No profile data found.</p>`;
      return;
    }
    currentData = snap.data();
    renderProfileView(currentData);
  } catch (error) {
    console.log(error.code);
    console.log(error.message);
    profileViewEl.innerHTML = `<p class="empty-state">Could not load your profile. Please refresh the page.</p>`;
  }
});