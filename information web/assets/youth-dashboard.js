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


// =====================================================
// FIELD DEFINITIONS
// =====================================================

const FIELDS = [

  {
    key: "fullName",
    label: "Full Name",
    type: "text",
    full: true
  },

  {
    key: "birthDate",
    label: "Birth Date",
    type: "date"
  },

  {
    key: "age",
    label: "Age",
    type: "number"
  },

  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: [
      "Male",
      "Female",
      "Prefer not to say"
    ]
  },

  {
    key: "civilStatus",
    label: "Civil Status",
    type: "select",
    options: [
      "Single",
      "Married",
      "Widowed",
      "Divorced",
      "Separated",
      "Annulled",
      "Live-in",
      "Unknown"
    ]
  },

  {
    key: "address",
    label: "Purok / Area",
    type: "select",
    options: [
      "BRIONES COMPOUND",
      "CRDC",
      "PENINSULA HOMES",
      "INTERTOWN HOMES 1-6",
      "KALYE PUTOL / BUKAL 2",
      "SAN DIEGO VILLAGE",
      "BERANA COMPOUND",
      "SITIO PAG-ASA (ITAAS)",
      "SITIO PAG-ASA (IBABA)",
      "ENCENAREZ COMPOUND",
      "BUKAL 1",
      "GOLDEN MEADOWS",
      "CIUDAD REMBINO",
      "HIGHWAY",
      "KRISANT VILLAGE",
      "INTERTOWN HOMES PHASE 5",
      "INTERTOWN HOMES PHASE 6",
      "INTERTOWN HOMES PHASE 1-4"
    ],
    full: true
  },

  {
    key: "contact",
    label: "Contact Number",
    type: "tel",
    full: true
  },

  {
    key: "education",
    label: "Educational Attainment",
    type: "select",
    options: [
      "Elementary",
      "High School",
      "Senior High School",
      "College",
      "Vocational",
      "Graduate",
      "Out of School Youth"
    ]
  },

  {
    key: "educationStatus",
    label: "Current Education Status",
    type: "select",
    options: [
      "Currently Studying",
      "Not Studying",
      "Graduated"
    ]
  },

  {
    key: "employment",
    label: "Employment Status",
    type: "select",
    options: [
      "Student",
      "Employed",
      "Unemployed",
      "Self-employed"
    ]
  },

  {
    key: "civic",
    label: "Civic Participation",
    type: "select",
    options: [
      "Active",
      "Occasional",
      "Not Active"
    ]
  },

  {
    key: "voterStatus",
    label: "Voter Registration Status",
    type: "select",
    options: [
      "Registered Voter",
      "Not Registered"
    ]
  },

  {
    key: "newVoter",
    label: "New Voter Status",
    type: "select",
    options: [
      "New Voter",
      "Existing Voter",
      "Not Applicable"
    ]
  },

  {
    key: "voterParticipation",
    label: "Voter Participation",
    type: "select",
    options: [
      "Participated",
      "Not Participated",
      "Not Applicable"
    ]
  },


  // ===================================================
  // SK / KK INFORMATION
  // ===================================================

  {
    key: "registeredSKVoter",
    label: "Registered SK Voter?",
    type: "select",
    options: [
      "Yes",
      "No"
    ]
  },

  {
    key: "votedLastSKElection",
    label: "Did you vote in the last SK Election?",
    type: "select",
    options: [
      "Yes",
      "No"
    ]
  },

  {
    key: "kkAssemblyAttended",
    label: "Have you attended a KK Assembly?",
    type: "select",
    options: [
      "Yes",
      "No"
    ],
    full: true
  },

  {
    key: "kkAttendanceCount",
    label: "If yes, how many times?",
    type: "select",
    options: [
      "1-2 Times",
      "3-4 Times",
      "5 and Above"
    ],
    full: true,
    conditional: true
  },

  {
    key: "kkNoReason",
    label: "If no, why?",
    type: "select",
    options: [
      "There was no KK Assembly Meeting",
      "Not Interested to Attend"
    ],
    full: true,
    conditional: true
  },


  // ===================================================
  // SUPPORT INFORMATION
  // ===================================================

  {
    key: "specialNeeds",
    label: "Special Needs",
    type: "select",
    options: [
      "No",
      "Yes"
    ]
  },

  {
    key: "assistance",
    label: "Specific Assistance Needed",
    type: "text",
    full: true
  },


  // ===================================================
  // SKILLS AND INTERESTS
  // ===================================================

  {
    key: "hobbies",
    label: "Hobbies / Skills",
    type: "text",
    full: true
  },

  {
    key: "sports",
    label: "Sports Interests",
    type: "text",
    full: true
  }

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
const announcementsEl = document.getElementById("youthAnnouncements");


if (profileViewEl) {
  profileViewEl.innerHTML = `<p class="empty-state">Loading your profile...</p>`;
}


let currentUser = null;
let currentData = null;


// =====================================================
// HELPERS
// =====================================================

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}


function calculateAge(birthDateValue) {
  if (!birthDateValue) {
    return null;
  }

  const birthDate = new Date(birthDateValue);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() <
      birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
}


function getYouthStatus(age) {
  if (
    age >= 15 &&
    age <= 30
  ) {
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


function safeLogActivity(data) {
  logActivity(data)
    .catch(error => {
      console.error(
        "Audit log error:",
        error
      );
    });
}


// =====================================================
// LOCAL DATE HELPER
// =====================================================

function getLocalDateString(date = new Date()) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


// =====================================================
// ANNOUNCEMENT EXPIRATION CHECK
// =====================================================

function isAnnouncementExpired(announcement) {
  if (!announcement.expiryDate) {
    return false;
  }

  const today =
    getLocalDateString();

  /*
    Example:

    expiryDate = 2026-08-24

    August 24 = visible
    August 25 = expired
  */

  return today > announcement.expiryDate;
}


// =====================================================
// QUICK STATS
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
      value:
        data.educationStatus ||
        data.education ||
        "—"
    },

    {
      label: "Employment",
      value:
        data.employment ||
        "—"
    },

    {
      label: "SK Voter",
      value:
        data.registeredSKVoter ||
        "—"
    }

  ];

  quickStatsEl.innerHTML =
    stats
      .map(
        stat => `
          <div class="panel stat-card">
            <small>${escapeHtml(stat.label)}</small>
            <strong>${escapeHtml(stat.value)}</strong>
          </div>
        `
      )
      .join("");
}


// =====================================================
// PROFILE VIEW
// =====================================================

function renderProfileView(data) {
  if (welcomeEl) {
    welcomeEl.textContent =
      "Welcome, " +
      (
        data.fullName ||
        "Youth"
      );
  }

  renderQuickStats(data);

  const extraFields = [

    {
      key: "email",
      label: "Email"
    },

    {
      key: "status",
      label: "Status"
    },

    {
      key: "eligibility",
      label: "Eligibility"
    }

  ];


  const visibleFields =
    FIELDS.filter(
      field => {

        if (
          field.key ===
          "kkAttendanceCount"
        ) {
          return (
            data.kkAssemblyAttended ===
            "Yes"
          );
        }

        if (
          field.key ===
          "kkNoReason"
        ) {
          return (
            data.kkAssemblyAttended ===
            "No"
          );
        }

        return true;
      }
    );


  const rows =
    [
      ...extraFields,
      ...visibleFields
    ]
      .map(
        field => {

          const value =
            data[field.key] ||
            "";

          return `
            <div class="info-item">
              <small>${escapeHtml(field.label)}</small>
              <span>${escapeHtml(value) || "&mdash;"}</span>
            </div>
          `;
        }
      )
      .join("");


  if (profileViewEl) {
    profileViewEl.innerHTML = `
      <div class="info-grid">
        ${rows}
      </div>
    `;
  }
}


// =====================================================
// EDIT FIELDS
// =====================================================

function buildEditFields(data) {
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

          let displayStyle = "";

          if (
            field.key ===
            "kkAttendanceCount" &&
            data.kkAssemblyAttended !==
            "Yes"
          ) {
            displayStyle =
              'style="display:none;"';
          }

          if (
            field.key ===
            "kkNoReason" &&
            data.kkAssemblyAttended !==
            "No"
          ) {
            displayStyle =
              'style="display:none;"';
          }


          if (
            field.type ===
            "select"
          ) {

            const options =
              field.options
                .map(
                  option => `
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
              <label
                class="${fieldClass}"
                data-field-wrapper="${field.key}"
                ${displayStyle}
              >
                <span>
                  ${escapeHtml(field.label)}
                </span>

                <select name="${field.key}">
                  <option value="">Select</option>
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
              <label
                class="${fieldClass}"
                data-field-wrapper="${field.key}"
              >
                <span>
                  ${escapeHtml(field.label)}
                </span>

                <input
                  type="number"
                  name="${field.key}"
                  value="${escapeHtml(value)}"
                  readonly
                />
              </label>
            `;
          }


          return `
            <label
              class="${fieldClass}"
              data-field-wrapper="${field.key}"
            >
              <span>
                ${escapeHtml(field.label)}
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


  // ===================================================
  // BIRTH DATE / AGE
  // ===================================================

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
          ageInput.value = age;
        }
      }
    );
  }


  // ===================================================
  // KK ASSEMBLY CONDITIONAL FIELDS
  // ===================================================

  const kkAssemblyInput =
    editFieldsEl.querySelector(
      '[name="kkAssemblyAttended"]'
    );

  const kkAttendanceWrapper =
    editFieldsEl.querySelector(
      '[data-field-wrapper="kkAttendanceCount"]'
    );

  const kkReasonWrapper =
    editFieldsEl.querySelector(
      '[data-field-wrapper="kkNoReason"]'
    );

  const kkAttendanceInput =
    editFieldsEl.querySelector(
      '[name="kkAttendanceCount"]'
    );

  const kkReasonInput =
    editFieldsEl.querySelector(
      '[name="kkNoReason"]'
    );


  function updateKKConditionalFields() {
    if (!kkAssemblyInput) {
      return;
    }

    const value =
      kkAssemblyInput.value;


    if (
      value ===
      "Yes"
    ) {

      if (kkAttendanceWrapper) {
        kkAttendanceWrapper.style.display =
          "flex";
      }

      if (kkReasonWrapper) {
        kkReasonWrapper.style.display =
          "none";
      }

      if (kkAttendanceInput) {
        kkAttendanceInput.required =
          true;
      }

      if (kkReasonInput) {
        kkReasonInput.required =
          false;

        kkReasonInput.value =
          "";
      }

    } else if (
      value ===
      "No"
    ) {

      if (kkAttendanceWrapper) {
        kkAttendanceWrapper.style.display =
          "none";
      }

      if (kkReasonWrapper) {
        kkReasonWrapper.style.display =
          "flex";
      }

      if (kkAttendanceInput) {
        kkAttendanceInput.required =
          false;

        kkAttendanceInput.value =
          "";
      }

      if (kkReasonInput) {
        kkReasonInput.required =
          true;
      }

    } else {

      if (kkAttendanceWrapper) {
        kkAttendanceWrapper.style.display =
          "none";
      }

      if (kkReasonWrapper) {
        kkReasonWrapper.style.display =
          "none";
      }

      if (kkAttendanceInput) {
        kkAttendanceInput.required =
          false;

        kkAttendanceInput.value =
          "";
      }

      if (kkReasonInput) {
        kkReasonInput.required =
          false;

        kkReasonInput.value =
          "";
      }
    }
  }


  if (kkAssemblyInput) {
    kkAssemblyInput.addEventListener(
      "change",
      updateKKConditionalFields
    );

    updateKKConditionalFields();
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
              ? Number(input.value)
              : input.value.trim();
        }
      );


      // =================================================
      // VALIDATE BIRTH DATE / AGE
      // =================================================

      if (updated.birthDate) {

        updated.age =
          calculateAge(
            updated.birthDate
          );

        if (
          updated.age === null ||
          Number.isNaN(updated.age)
        ) {

          alert(
            "Please enter a valid birth date."
          );

          saveBtn.disabled =
            false;

          saveBtn.textContent =
            "Save Changes";

          return;
        }


        const youthStatus =
          getYouthStatus(
            updated.age
          );

        updated.status =
          youthStatus.status;

        updated.eligibility =
          youthStatus.eligibility;
      }


      // =================================================
      // VALIDATE KK ASSEMBLY
      // =================================================

      if (
        updated.kkAssemblyAttended ===
        "Yes" &&
        !updated.kkAttendanceCount
      ) {

        alert(
          "Please indicate how many times you attended a KK Assembly."
        );

        saveBtn.disabled =
          false;

        saveBtn.textContent =
          "Save Changes";

        return;
      }


      if (
        updated.kkAssemblyAttended ===
        "No" &&
        !updated.kkNoReason
      ) {

        alert(
          "Please indicate why you have not attended a KK Assembly."
        );

        saveBtn.disabled =
          false;

        saveBtn.textContent =
          "Save Changes";

        return;
      }


      if (
        updated.kkAssemblyAttended ===
        "Yes"
      ) {
        updated.kkNoReason = "";
      }


      if (
        updated.kkAssemblyAttended ===
        "No"
      ) {
        updated.kkAttendanceCount = "";
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


        renderProfileView(
          currentData
        );


        dialog?.close();


        alert(
          "Profile updated successfully!"
        );


        safeLogActivity({

          email:
            currentUser.email,

          role:
            "youth",

          activity:
            "Updated profile",

          details:
            `Profile updated. Age: ${updated.age}, Status: ${updated.status}, SK Voter: ${updated.registeredSKVoter}, KK Assembly: ${updated.kkAssemblyAttended}`

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
// ANNOUNCEMENT DATE
// =====================================================

function getAnnouncementDate(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate ===
    "function"
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
    return null;
  }

  return date;
}


// =====================================================
// LOAD ANNOUNCEMENTS
// =====================================================

async function loadYouthAnnouncements() {

  if (!announcementsEl) {
    return;
  }


  announcementsEl.innerHTML =
    `<p class="empty-state">Loading announcements...</p>`;


  try {

    const snap =
      await getDocs(
        collection(
          db,
          "announcements"
        )
      );


    let announcements =
      snap.docs.map(
        documentSnapshot => ({
          id:
            documentSnapshot.id,

          ...documentSnapshot.data()
        })
      );


    // =================================================
    // HIDE EXPIRED ANNOUNCEMENTS
    // =================================================

    announcements =
      announcements.filter(
        announcement =>
          !isAnnouncementExpired(
            announcement
          )
      );


    // =================================================
    // NEWEST FIRST
    // =================================================

    announcements.sort(
      (
        a,
        b
      ) => {

        const aDate =
          getAnnouncementDate(
            a.createdAt ||
            a.date
          );

        const bDate =
          getAnnouncementDate(
            b.createdAt ||
            b.date
          );

        return (
          (
            bDate?.getTime() ||
            0
          ) -
          (
            aDate?.getTime() ||
            0
          )
        );
      }
    );


    // =================================================
    // EMPTY STATE
    // =================================================

    if (
      announcements.length ===
      0
    ) {

      announcementsEl.innerHTML =
        `<p class="empty-state">No announcements available at this time.</p>`;

      return;
    }


    // =================================================
    // DISPLAY ANNOUNCEMENTS
    // IMAGE IS DISPLAYED BESIDE THE TEXT
    // =================================================

    announcementsEl.innerHTML =
      announcements
        .map(
          announcement => {

            const date =
              getAnnouncementDate(
                announcement.createdAt ||
                announcement.date
              );


            const formattedDate =
              date
                ? date.toLocaleDateString(
                    "en-PH",
                    {
                      year:
                        "numeric",

                      month:
                        "long",

                      day:
                        "numeric"
                    }
                  )
                : "";


            const formattedExpiry =
              announcement.expiryDate
                ? new Date(
                    `${announcement.expiryDate}T00:00:00`
                  )
                    .toLocaleDateString(
                      "en-PH",
                      {
                        year:
                          "numeric",

                        month:
                          "long",

                        day:
                          "numeric"
                      }
                    )
                : "";


            const category =
              announcement.category ||
              "General";


            const title =
              announcement.title ||
              "Announcement";


            const message =
              announcement.message ||
              announcement.description ||
              announcement.content ||
              "";


            // =================================================
            // ANNOUNCEMENT IMAGE
            // =================================================

            const imageUrl =
              announcement.imageUrl ||
              "";


            return `
              <article
                class="summary-box announcement-display-card ${
                  imageUrl
                    ? "has-image"
                    : "no-image"
                }"
              >

                <div class="announcement-text-side">

                  <small
                    style="
                      display:inline-block;
                      margin-bottom:7px;
                      color:#0a5255;
                      font-weight:800;
                      text-transform:uppercase;
                      font-size:10px;
                      letter-spacing:.05em;
                    "
                  >
                    ${escapeHtml(category)}
                  </small>


                  <h3>
                    ${escapeHtml(title)}
                  </h3>


                  ${
                    formattedDate
                      ? `
                          <small
                            style="
                              display:block;
                              margin-bottom:5px;
                              color:#71838a;
                            "
                          >
                            Posted:
                            ${escapeHtml(formattedDate)}
                          </small>
                        `
                      : ""
                  }


                  ${
                    formattedExpiry
                      ? `
                          <small
                            style="
                              display:block;
                              margin-bottom:10px;
                              color:#71838a;
                            "
                          >
                            Event / Display Until:
                            ${escapeHtml(formattedExpiry)}
                          </small>
                        `
                      : ""
                  }


                  <p
                    style="
                      margin:0;
                      white-space:pre-line;
                    "
                  >
                    ${escapeHtml(message)}
                  </p>

                </div>


                ${
                  imageUrl
                    ? `
                        <div class="announcement-image-side">

                          <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${escapeHtml(title)}"
                            class="announcement-display-image"
                            loading="lazy"
                          />

                        </div>
                      `
                    : ""
                }

              </article>
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
      `<p class="empty-state">Unable to load announcements at this time.</p>`;
  }
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


    // =================================================
    // LOAD ANNOUNCEMENTS
    // =================================================

    loadYouthAnnouncements();


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
            `<p class="empty-state">No profile data found.</p>`;
        }

        return;
      }


      currentData = {
        ...snap.data()
      };


      let needsStatusUpdate =
        false;


      if (currentData.birthDate) {

        const calculatedAge =
          calculateAge(
            currentData.birthDate
          );


        if (
          calculatedAge !==
          null
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


      // =================================================
      // RENDER PROFILE
      // =================================================

      renderProfileView(
        currentData
      );


      // =================================================
      // UPDATE AGE / STATUS WHEN NECESSARY
      // =================================================

      if (needsStatusUpdate) {

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
              Could not load your profile.
              Please refresh the page.
            </p>
          `;
      }
    }
  }
);