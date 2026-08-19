import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { logActivity } from "./audit-log.js";


// Field definitions used for both the read-only view and the edit form.
// "full" = spans the full width of the form grid (matches youth-register.html)
const FIELDS = [
  { key: "fullName", label: "Full Name", type: "text", full: true },
  { key: "birthDate", label: "Birth Date", type: "date" },
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

const announcementsEl = document.getElementById("youthAnnouncements");

const quickStatsEl = document.getElementById("youthQuickStats");


profileViewEl.innerHTML = `<p class="empty-state">Loading your profile...</p>`;


let currentUser = null;

let currentData = null;


function escapeHtml(value) {

  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;

}


function calculateAge(birthDateValue) {

  if (!birthDateValue) return null;


  const birthDate = new Date(birthDateValue);

  const today = new Date();


  let age = today.getFullYear() - birthDate.getFullYear();


  const monthDifference = today.getMonth() - birthDate.getMonth();


  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {

    age--;

  }


  return age;

}


function getYouthStatus(age) {

  if (age >= 15 && age <= 30) {

    return {
      status: "Active",
      eligibility: "Eligible"
    };

  }


  return {
    status: "Inactive",
    eligibility: "Archived"
  };

}


// =====================================================
// QUICK STATUS OVERVIEW
// =====================================================

function renderQuickStats(data) {

  if (!quickStatsEl) {
    return;
  }


  const stats = [

    {
      label: "Age",
      value: data.age || "—"
    },

    {
      label: "Status",
      value: data.status || "—"
    },

    {
      label: "Eligibility",
      value: data.eligibility || "—"
    },

    {
      label: "Education",
      value: data.educationStatus || data.education || "—"
    },

    {
      label: "Employment",
      value: data.employment || "—"
    },

    {
      label: "Voter Status",
      value: data.voterStatus || "—"
    }

  ];


  quickStatsEl.innerHTML =
    stats
      .map(
        stat => `
          <div class="panel stat-card">

            <small>
              ${escapeHtml(stat.label)}
            </small>

            <strong>
              ${escapeHtml(stat.value)}
            </strong>

          </div>
        `
      )
      .join("");

}


function renderProfileView(data) {

  welcomeEl.textContent = "Welcome, " + (data.fullName || "Youth");


  renderQuickStats(data);


  const extraFields = [
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
    { key: "eligibility", label: "Eligibility" }
  ];


  const rows = [...extraFields, ...FIELDS]

    .map(f => {

      const value = data[f.key] || "";


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

        .map(
          opt =>
            `<option value="${escapeHtml(opt)}" ${opt === value ? "selected" : ""}>${escapeHtml(opt)}</option>`
        )

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


    if (f.key === "age") {

      return `
        <label class="${fieldClass}">

          <span>${escapeHtml(f.label)}</span>

          <input
            type="${f.type}"
            name="${f.key}"
            value="${escapeHtml(value)}"
            readonly
          />

        </label>
      `;

    }


    return `
      <label class="${fieldClass}">

        <span>${escapeHtml(f.label)}</span>

        <input
          type="${f.type}"
          name="${f.key}"
          value="${escapeHtml(value)}"
        />

      </label>
    `;

  }).join("");


  const birthDateInput = editFieldsEl.querySelector('[name="birthDate"]');

  const ageInput = editFieldsEl.querySelector('[name="age"]');


  if (birthDateInput && ageInput) {

    birthDateInput.addEventListener("change", () => {

      const age = calculateAge(birthDateInput.value);


      if (age !== null && !Number.isNaN(age)) {

        ageInput.value = age;

      }

    });

  }

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


    updated[f.key] = f.type === "number"
      ? Number(input.value)
      : input.value.trim();

  });


  if (updated.birthDate) {

    updated.age = calculateAge(updated.birthDate);


    const youthStatus = getYouthStatus(updated.age);


    updated.status = youthStatus.status;

    updated.eligibility = youthStatus.eligibility;

  }


  updated.updatedAt = new Date();


  try {

    await updateDoc(
      doc(db, "users", currentUser.uid),
      updated
    );


    currentData = {
      ...currentData,
      ...updated
    };


    renderProfileView(currentData);


    await logActivity({

      email: currentUser.email,

      role: "youth",

      activity: "Updated profile",

      details: `Profile updated. Age: ${updated.age}, Status: ${updated.status}`

    });


    dialog.close();


    alert(
      "Profile updated successfully!"
    );


  } catch (error) {

    console.log(error.code);

    console.log(error.message);


    alert(
      "Something went wrong while saving your profile. Please try again."
    );


  } finally {

    saveBtn.disabled = false;

    saveBtn.textContent = "Save Changes";

  }

});


// =====================================================
// ANNOUNCEMENTS
// =====================================================

function getAnnouncementDate(value) {

  if (!value) {

    return new Date(0);

  }


  if (
    typeof value.toDate === "function"
  ) {

    return value.toDate();

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return new Date(0);

  }


  return date;

}


async function loadYouthAnnouncements() {

  if (!announcementsEl) {

    return;

  }


  announcementsEl.innerHTML =
    `
      <p class="empty-state">
        Loading announcements...
      </p>
    `;


  try {

    const snap =
      await getDocs(
        collection(
          db,
          "announcements"
        )
      );


    const announcements = [];


    snap.forEach(
      documentSnapshot => {

        announcements.push({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()

        });

      }
    );


    announcements.sort(
      (a, b) =>

        getAnnouncementDate(
          b.createdAt
        ) -

        getAnnouncementDate(
          a.createdAt
        )

    );


    if (
      announcements.length === 0
    ) {

      announcementsEl.innerHTML =
        `
          <p class="empty-state">
            No announcements available.
          </p>
        `;


      return;

    }


    announcementsEl.innerHTML =
      announcements
        .map(
          announcement => {

            const date =
              getAnnouncementDate(
                announcement.createdAt
              );


            return `
              <div class="summary-box">

                <h3>
                  ${escapeHtml(
                    announcement.title
                  )}
                </h3>


                <p>

                  <strong>
                    ${escapeHtml(
                      announcement.category
                    )}
                  </strong>

                  ·

                  ${escapeHtml(
                    date.toLocaleDateString()
                  )}

                </p>


                <p>
                  ${escapeHtml(
                    announcement.message
                  )}
                </p>

              </div>
            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Announcement load error:",
      error
    );


    announcementsEl.innerHTML =
      `
        <p class="empty-state">
          Unable to load announcements.
        </p>
      `;

  }

}


// =====================================================
// AUTH / PROFILE
// =====================================================

onAuthStateChanged(auth, async (user) => {

  if (!user) return;


  currentUser = user;


  try {

    const snap =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );


    if (!snap.exists()) {

      profileViewEl.innerHTML =
        `<p class="empty-state">No profile data found.</p>`;


      return;

    }


    currentData = snap.data();


    if (currentData.birthDate) {

      const calculatedAge =
        calculateAge(
          currentData.birthDate
        );


      const youthStatus =
        getYouthStatus(
          calculatedAge
        );


      currentData.age =
        calculatedAge;


      currentData.status =
        youthStatus.status;


      currentData.eligibility =
        youthStatus.eligibility;


      await updateDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {

          age:
            calculatedAge,

          status:
            youthStatus.status,

          eligibility:
            youthStatus.eligibility

        }
      );

    }


    renderProfileView(
      currentData
    );


    await loadYouthAnnouncements();


  } catch (error) {

    console.log(
      error.code
    );


    console.log(
      error.message
    );


    profileViewEl.innerHTML =
      `<p class="empty-state">Could not load your profile. Please refresh the page.</p>`;

  }

});