import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./audit-log.js";

// =====================================================
// FIELD DEFINITIONS
// =====================================================

const FIELDS = [
  { key: "fullName", label: "Full Name", type: "text", full: true },
  { key: "birthDate", label: "Birth Date", type: "date" },
  { key: "age", label: "Age", type: "number" },
  { key: "gender", label: "Gender",type: "select", options: ["Male","Female","Prefer not to say"]},
  { key: "address", label: "Address / Purok", type: "text", full: true},
  { key: "contact", label: "Contact Number", type: "tel", full: true},
  { key: "education", label: "Educational Attainment", type: "select", options: ["Elementary","High School", "Senior High School","College","Vocational","Graduate", "Out of School Youth"]},
  { key: "educationStatus", label: "Current Education Status", type: "select", options: ["Currently Studying", "Not Studying","Graduated"]},
  { key: "employment", label: "Employment Status", type: "select", options: ["Student","Employed","Unemployed","Self-employed"]},
  { key: "civic", label: "Civic Participation",type: "select",options: ["Active","Occasional","Not Active"]},
  { key: "voterStatus", label: "Voter Registration Status",type: "select",options: ["Registered Voter","Not Registered"]},
  { key: "newVoter", label: "New Voter Status",type: "select",options: ["New Voter","Existing Voter","Not Applicable"]},
  { key: "voterParticipation", label: "Voter Participation", type: "select", options: ["Participated","Not Participated","Not Applicable"]},
  { key: "specialNeeds", label: "Special Needs",type: "select", options: ["No","Yes"]},
  { key: "assistance", label: "Specific Assistance Needed", type: "text", full: true},
  { key: "hobbies", label: "Hobbies / Skills", type: "text", full: true},
  { key: "sports", label: "Sports Interests", type: "text", full: true}
];

// =====================================================
// ELEMENTS
// =====================================================

const welcomeEl = document.getElementById("youthWelcome");
const profileViewEl = document.getElementById("youthProfileView");
const editBtn = document.getElementById("editProfileBtn");
const dialog = document.getElementById("profileDialog");
const editFieldsEl = document.getElementById("profileEditFields");
const saveBtn = document.getElementById("saveProfileBtn");
const quickStatsEl = document.getElementById("youthQuickStats");


if (profileViewEl) {profileViewEl.innerHTML = `<p class="empty-state"> Loading your profile...</p>`;}
let currentUser = null;
let currentData = null;

// =====================================================
// HELPERS
// =====================================================

function escapeHtml(value) {const div = document.createElement( "div"); div.textContent = value ?? ""; return div.innerHTML;}
function calculateAge(birthDateValue) { if (!birthDateValue) {return null;} 

const birthDate = new Date(birthDateValue);
  if ( Number.isNaN(birthDate.getTime())) {return null;}

const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear();

const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 &&today.getDate() < birthDate.getDate())) {age--;}return age;}

function getYouthStatus(age) {
  if (age >= 15 && age <= 30) {return {status:"Active",eligibility:"Eligible"};}return {status:"Inactive",eligibility:"Archived"};}

function safeLogActivity(data) {logActivity(data).catch(error => {console.error("Audit log error:",error);
      }
    );
}

// =====================================================
// QUICK STATS
// =====================================================

function renderQuickStats(data) {
  if (!quickStatsEl) {return;}

const stats = [
  { label:"Age", value: data.age ||"—"},
  { label:"Status", value: data.status ||"—"},
  { label:"Eligibility", value: data.eligibility ||"—"},
  { label:"Education", value: data.educationStatus || data.education ||"—"},
  { label:"Employment", value: data.employment ||"—"},
  { label:"Voter Status", value:  data.voterStatus ||"—"}
  ];

  quickStatsEl.innerHTML = stats.map(stat => `<div class="panel stat-card">
    <small>${escapeHtml(stat.label)}</small>
    <strong>${escapeHtml(stat.value)}</strong>
    </div>`).join("");
}

// =====================================================
// PROFILE VIEW
// =====================================================

function renderProfileView(data) {
  if (welcomeEl) {welcomeEl.textContent ="Welcome, " +(data.fullName ||"Youth");}renderQuickStats(data );

const extraFields = [
  { key:"email",label:"Email"},
  { key:"status",label:"Status"},
  { key:"eligibility",label:"Eligibility"}
  ];

const rows =[...extraFields,...FIELDS]
  .map(field => {const value =data[field.key] ||"";
  return `<div class="info-item">

  <small>${escapeHtml(field.label)}</small>
  <span>${escapeHtml(value) ||"&mdash;"}</span>

  </div>`;
  }
  ).join("");

  if (profileViewEl) {
    profileViewEl.innerHTML = `
    <div class="info-grid">${rows}</div>`;
  }
}

// =====================================================
// EDIT FIELDS
// =====================================================

function buildEditFields(
  data
) {

  if (!editFieldsEl) {
    return;
  }


  editFieldsEl.innerHTML =
    FIELDS
      .map(
        field => {

          const value =
            data[field.key] ??
            "";


          const fieldClass =
            field.full
              ? "field full"
              : "field";


          if (
            field.type ===
            "select"
          ) {

            const options =
              field.options
                .map(
                  option =>

                    `
                      <option
                        value="${escapeHtml(option)}"
                        ${
                          option === value
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(option)}
                      </option>
                    `

                )
                .join("");


            return `
              <label class="${fieldClass}">

                <span>
                  ${escapeHtml(
                    field.label
                  )}
                </span>

                <select name="${field.key}">

                  <option value="">
                    Select
                  </option>

                  ${options}

                </select>

              </label>
            `;

          }


          if (
            field.key ===
            "age"
          ) {

            return `
              <label class="${fieldClass}">

                <span>
                  ${escapeHtml(
                    field.label
                  )}
                </span>

                <input
                  type="${field.type}"
                  name="${field.key}"
                  value="${escapeHtml(value)}"
                  readonly
                />

              </label>
            `;

          }


          return `
            <label class="${fieldClass}">

              <span>
                ${escapeHtml(
                  field.label
                )}
              </span>

              <input
                type="${field.type}"
                name="${field.key}"
                value="${escapeHtml(value)}"
              />

            </label>
          `;

        }
      )
      .join("");


  const birthDateInput =
    editFieldsEl.querySelector(
      '[name="birthDate"]'
    );


  const ageInput =
    editFieldsEl.querySelector(
      '[name="age"]'
    );


  if (
    birthDateInput &&
    ageInput
  ) {

    birthDateInput.addEventListener(
      "change",
      () => {

        const age =
          calculateAge(
            birthDateInput.value
          );


        if (
          age !== null &&
          !Number.isNaN(age)
        ) {

          ageInput.value =
            age;

        }

      }
    );

  }

}


// =====================================================
// OPEN EDIT
// =====================================================

if (editBtn) {

  editBtn.addEventListener(
    "click",
    () => {

      if (!currentData) {
        return;
      }


      buildEditFields(
        currentData
      );


      dialog?.showModal();

    }
  );

}


// =====================================================
// SAVE PROFILE
// =====================================================

if (saveBtn) {

  saveBtn.addEventListener(
    "click",
    async () => {

      if (!currentUser) {
        return;
      }


      saveBtn.disabled =
        true;


      saveBtn.textContent =
        "Saving...";


      const updated = {};


      FIELDS.forEach(
        field => {

          const input =
            editFieldsEl
              ?.querySelector(
                `[name="${field.key}"]`
              );


          if (!input) {
            return;
          }


          updated[field.key] =
            field.type ===
            "number"
              ? Number(
                  input.value
                )
              : input.value.trim();

        }
      );


      if (
        updated.birthDate
      ) {

        updated.age =
          calculateAge(
            updated.birthDate
          );


        const youthStatus =
          getYouthStatus(
            updated.age
          );


        updated.status =
          youthStatus.status;


        updated.eligibility =
          youthStatus.eligibility;

      }


      updated.updatedAt =
        new Date();


      try {

        await updateDoc(
          doc(
            db,
            "users",
            currentUser.uid
          ),
          updated
        );


        currentData = {

          ...currentData,

          ...updated

        };


        // Update screen immediately

        renderProfileView(
          currentData
        );


        dialog?.close();


        alert(
          "Profile updated successfully!"
        );


        // Audit log runs in background

        safeLogActivity({

          email:
            currentUser.email,

          role:
            "youth",

          activity:
            "Updated profile",

          details:
            `Profile updated. Age: ${updated.age}, Status: ${updated.status}`

        });


      } catch (error) {

        console.error(
          "Profile save error:",
          error
        );


        alert(
          "Something went wrong while saving your profile. Please try again."
        );


      } finally {

        saveBtn.disabled =
          false;


        saveBtn.textContent =
          "Save Changes";

      }

    }
  );

}


// =====================================================
// AUTH / PROFILE
// =====================================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {
      return;
    }


    currentUser =
      user;


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

        if (profileViewEl) {

          profileViewEl.innerHTML =
            `
              <p class="empty-state">
                No profile data found.
              </p>
            `;

        }


        return;

      }


      currentData = {

        ...snap.data()

      };


      let needsStatusUpdate =
        false;


      if (
        currentData.birthDate
      ) {

        const calculatedAge =
          calculateAge(
            currentData.birthDate
          );


        if (
          calculatedAge !== null
        ) {

          const youthStatus =
            getYouthStatus(
              calculatedAge
            );


          if (
            currentData.age !==
              calculatedAge ||
            currentData.status !==
              youthStatus.status ||
            currentData.eligibility !==
              youthStatus.eligibility
          ) {

            needsStatusUpdate =
              true;

          }


          currentData.age =
            calculatedAge;


          currentData.status =
            youthStatus.status;


          currentData.eligibility =
            youthStatus.eligibility;

        }

      }


      // IMPORTANT:
      // render first, don't wait for Firestore update.

      renderProfileView(
        currentData
      );


      // Update only if age/status really changed.

      if (
        needsStatusUpdate
      ) {

        updateDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {

            age:
              currentData.age,

            status:
              currentData.status,

            eligibility:
              currentData.eligibility

          }
        )
          .catch(
            error => {

              console.error(
                "Background status update error:",
                error
              );

            }
          );

      }


    } catch (error) {

      console.error(
        "Youth dashboard load error:",
        error
      );


      if (profileViewEl) {

        profileViewEl.innerHTML =
          `
            <p class="empty-state">
              Could not load your profile. Please refresh the page.
            </p>
          `;

      }

    }

  }
);