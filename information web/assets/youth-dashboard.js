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

const welcomeEl =
  document.getElementById(
    "youthWelcome"
  );

const profileViewEl =
  document.getElementById(
    "youthProfileView"
  );

const editBtn =
  document.getElementById(
    "editProfileBtn"
  );

const dialog =
  document.getElementById(
    "profileDialog"
  );

const editFieldsEl =
  document.getElementById(
    "profileEditFields"
  );

const saveBtn =
  document.getElementById(
    "saveProfileBtn"
  );

const quickStatsEl =
  document.getElementById(
    "youthQuickStats"
  );

const announcementsEl =
  document.getElementById(
    "youthAnnouncements"
  );

let recommendationsEl =
  document.getElementById(
    "youthRecommendations"
  );


if (profileViewEl) {
  profileViewEl.innerHTML =
    `<p class="empty-state">Loading your profile...</p>`;
}


let currentUser = null;
let currentData = null;

// =====================================================
// NOTIFICATION CENTER ELEMENTS
// =====================================================

const notificationBtn =
  document.getElementById(
    "youthNotificationBtn"
  );

const notificationBadge =
  document.getElementById(
    "youthNotificationBadge"
  );

const notificationDropdown =
  document.getElementById(
    "youthNotificationDropdown"
  );

const notificationList =
  document.getElementById(
    "youthNotificationList"
  );

const markAllNotificationsReadBtn =
  document.getElementById(
    "markAllNotificationsRead"
  );

const viewAllAnnouncementsBtn =
  document.getElementById(
    "viewAllAnnouncementsBtn"
  );


// =====================================================
// IMPORTANT ANNOUNCEMENT MODAL
// =====================================================

const importantAnnouncementDialog =
  document.getElementById(
    "importantAnnouncementDialog"
  );

const importantAnnouncementCategory =
  document.getElementById(
    "importantAnnouncementCategory"
  );

const importantAnnouncementTitle =
  document.getElementById(
    "importantAnnouncementTitle"
  );

const importantAnnouncementMessage =
  document.getElementById(
    "importantAnnouncementMessage"
  );

const importantAnnouncementImage =
  document.getElementById(
    "importantAnnouncementImage"
  );

const closeImportantAnnouncement =
  document.getElementById(
    "closeImportantAnnouncement"
  );

const importantAnnouncementDone =
  document.getElementById(
    "importantAnnouncementDone"
  );


// =====================================================
// NOTIFICATION STATE
// =====================================================

let currentAnnouncements = [];

let readAnnouncementIds = [];


// =====================================================
// HELPERS
// =====================================================

function escapeHtml(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    value ?? "";

  return div.innerHTML;

}


// =====================================================
// CALCULATE AGE
// =====================================================

function calculateAge(
  birthDateValue
) {

  if (!birthDateValue) {
    return null;
  }

  const birthDate =
    new Date(
      birthDateValue
    );

  if (
    Number.isNaN(
      birthDate.getTime()
    )
  ) {
    return null;
  }


  const today =
    new Date();


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


// =====================================================
// YOUTH STATUS
// =====================================================

function getYouthStatus(age) {

  if (
    age >= 15 &&
    age <= 30
  ) {

    return {
      status:
        "Active",

      eligibility:
        "Eligible"
    };

  }


  return {
    status:
      "Inactive",

    eligibility:
      "Archived"
  };

}


// =====================================================
// SAFE AUDIT LOG
// =====================================================

function safeLogActivity(
  data
) {

  logActivity(
    data
  )
    .catch(
      error => {

        console.error(
          "Audit log error:",
          error
        );

      }
    );

}


// =====================================================
// LOCAL DATE HELPER
// =====================================================

function getLocalDateString(
  date = new Date()
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      );


  const day =
    String(
      date.getDate()
    )
      .padStart(
        2,
        "0"
      );


  return `${year}-${month}-${day}`;

}


// =====================================================
// ANNOUNCEMENT EXPIRATION CHECK
// =====================================================

function isAnnouncementExpired(
  announcement
) {

  if (
    !announcement.expiryDate
  ) {

    return false;

  }


  const today =
    getLocalDateString();


  return (
    today >
    announcement.expiryDate
  );

}


// =====================================================
// QUICK STATS
// CLICKABLE OVERVIEW
// =====================================================

function renderQuickStats(
  data
) {

  if (!quickStatsEl) {
    return;
  }


  const stats = [

    {
      label:
        "Age",

      value:
        data.age ||
        "—",

      fieldKey:
        "age"
    },

    {
      label:
        "Status",

      value:
        data.status ||
        "—",

      fieldKey:
        "status"
    },

    {
      label:
        "Eligibility",

      value:
        data.eligibility ||
        "—",

      fieldKey:
        "eligibility"
    },

    {
      label:
        "Education",

      value:
        data.educationStatus ||
        data.education ||
        "—",

      fieldKey:
        data.educationStatus
          ? "educationStatus"
          : "education"
    },

    {
      label:
        "Employment",

      value:
        data.employment ||
        "—",

      fieldKey:
        "employment"
    },

    {
      label:
        "SK Voter",

      value:
        data.registeredSKVoter ||
        "—",

      fieldKey:
        "registeredSKVoter"
    }

  ];


  quickStatsEl.innerHTML =
    stats
      .map(
        stat => `

          <div
            class="panel stat-card youth-overview-card"
            role="button"
            tabindex="0"
            data-profile-target="${escapeHtml(
              stat.fieldKey
            )}"
            title="Click to view this information in your profile"
            style="cursor:pointer;"
          >

            <small>
              ${escapeHtml(
                stat.label
              )}
            </small>

            <strong>
              ${escapeHtml(
                stat.value
              )}
            </strong>

          </div>

        `
      )
      .join("");


  quickStatsEl
    .querySelectorAll(
      "[data-profile-target]"
    )
    .forEach(
      card => {

        const openField =
          () => {

            focusProfileField(
              card.dataset
                .profileTarget
            );

          };


        card.addEventListener(
          "click",
          openField
        );


        card.addEventListener(
          "keydown",
          event => {

            if (
              event.key ===
                "Enter" ||
              event.key ===
                " "
            ) {

              event
                .preventDefault();

              openField();

            }

          }
        );

      }
    );

}


// =====================================================
// CLICKABLE OVERVIEW HELPER
// =====================================================

function focusProfileField(
  fieldKey
) {

  if (!profileViewEl) {
    return;
  }


  const profilePanel =
    profileViewEl
      .closest(
        ".profile-panel"
      ) ||
    profileViewEl;


  profilePanel
    .scrollIntoView({
      behavior:
        "smooth",

      block:
        "start"
    });


  window.setTimeout(
    () => {

      const field =
        profileViewEl
          .querySelector(
            `[data-profile-field="${fieldKey}"]`
          );


      if (!field) {
        return;
      }


      const previousOutline =
        field.style.outline;


      const previousBackground =
        field.style.background;


      const previousTransition =
        field.style.transition;


      field.style.transition =
        "background .2s ease, outline .2s ease";


      field.style.outline =
        "2px solid rgba(10, 82, 85, .35)";


      field.style.background =
        "rgba(10, 82, 85, .07)";


      field
        .scrollIntoView({
          behavior:
            "smooth",

          block:
            "center"
        });


      window.setTimeout(
        () => {

          field.style.outline =
            previousOutline;

          field.style.background =
            previousBackground;

          field.style.transition =
            previousTransition;

        },
        1600
      );

    },
    350
  );

}


// =====================================================
// PERSONALIZED RECOMMENDATIONS SECTION
// =====================================================

function ensureRecommendationsSection() {

  recommendationsEl =
    document.getElementById(
      "youthRecommendations"
    ) ||
    recommendationsEl;


  if (recommendationsEl) {

    return recommendationsEl;

  }


  if (!quickStatsEl) {

    return null;

  }


  const quickOverviewSection =
    quickStatsEl
      .closest(
        "section"
      );


  if (!quickOverviewSection) {

    return null;

  }


  const section =
    document.createElement(
      "section"
    );


  section.className =
    "panel profile-panel";


  section.id =
    "youthRecommendationSection";


  section.style.marginBottom =
    "24px";


  section.innerHTML = `

    <div class="panel-heading profile-heading">

      <span
        class="profile-avatar"
        aria-hidden="true"
      >

        <svg
          class="profile-svg-icon"
          viewBox="0 0 24 24"
        >

          <path
            d="M9 18h6"
          ></path>

          <path
            d="M10 22h4"
          ></path>

          <path
            d="M8.2 14.5A6 6 0 1 1 15.8 14.5C14.7 15.4 14 16.2 14 17H10c0-.8-.7-1.6-1.8-2.5z"
          ></path>

        </svg>

      </span>


      <div>

        <h2>
          Recommended Activities for You
        </h2>

        <p>
          Suggested SK activities, programs,
          and opportunities based on your
          profile and interests.
        </p>

      </div>

    </div>


    <div
      id="youthRecommendations"
      class="report-summary"
      style="margin-top:24px;"
    >

      <p class="empty-state">
        Loading personalized recommendations...
      </p>

    </div>

  `;


  quickOverviewSection
    .insertAdjacentElement(
      "afterend",
      section
    );


  recommendationsEl =
    section
      .querySelector(
        "#youthRecommendations"
      );


  return recommendationsEl;

}


// =====================================================
// RECOMMENDATION HELPERS
// =====================================================

function normalizeRecommendationText(
  value
) {

  return String(
    value ||
    ""
  )
    .trim()
    .toLowerCase();

}


function splitInterests(
  value
) {

  return String(
    value ||
    ""
  )
    .split(
      /[,;/|]+/
    )
    .map(
      item =>
        item.trim()
    )
    .filter(
      Boolean
    );

}


function titleCaseInterest(
  value
) {

  return String(
    value ||
    ""
  )
    .trim()
    .replace(
      /\b\w/g,
      letter =>
        letter
          .toUpperCase()
    );

}


// =====================================================
// BUILD PERSONALIZED RECOMMENDATIONS
// =====================================================

function buildYouthRecommendations(
  data
) {

  const recommendations =
    [];


  const seenTitles =
    new Set();


  function addRecommendation(
    title,
    description,
    reason,
    category
  ) {

    if (
      !title ||
      seenTitles.has(
        title
      )
    ) {

      return;

    }


    seenTitles.add(
      title
    );


    recommendations.push({

      title,
      description,
      reason,
      category

    });

  }


  const employment =
    normalizeRecommendationText(
      data.employment
    );


  const education =
    normalizeRecommendationText(
      data.education
    );


  const educationStatus =
    normalizeRecommendationText(
      data.educationStatus
    );


  const civic =
    normalizeRecommendationText(
      data.civic
    );


  const voterStatus =
    normalizeRecommendationText(
      data.voterStatus
    );


  const skVoter =
    normalizeRecommendationText(
      data.registeredSKVoter
    );


  const kkAttendance =
    normalizeRecommendationText(
      data.kkAssemblyAttended
    );


  const kkCount =
    normalizeRecommendationText(
      data.kkAttendanceCount
    );


  const specialNeeds =
    normalizeRecommendationText(
      data.specialNeeds
    );


  // =================================================
  // STUDENT / CURRENTLY STUDYING
  // =================================================

  if (
    employment ===
      "student" ||
    educationStatus ===
      "currently studying"
  ) {

    addRecommendation(

      "Scholarship & Career Guidance Session",

      "Join an SK-led orientation on scholarships, college preparation, career options, and available youth opportunities.",

      "Recommended because your profile shows that you are currently studying.",

      "Education"

    );

  }


  // =================================================
  // UNEMPLOYED
  // =================================================

  if (
    employment ===
    "unemployed"
  ) {

    addRecommendation(

      "Job Readiness & Skills Workshop",

      "Participate in resume writing, interview preparation, digital skills, and basic employment-readiness activities.",

      "Recommended because your employment status is Unemployed.",

      "Employment"

    );

  }


  // =================================================
  // SELF-EMPLOYED
  // =================================================

  if (
    employment ===
    "self-employed"
  ) {

    addRecommendation(

      "Youth Entrepreneurship & Financial Literacy",

      "Attend a practical session on budgeting, pricing, simple bookkeeping, online selling, and small-business development.",

      "Recommended because your profile indicates that you are self-employed.",

      "Livelihood"

    );

  }


  // =================================================
  // OUT OF SCHOOL / NOT STUDYING
  // =================================================

  if (
    educationStatus ===
      "not studying" ||
    education ===
      "out of school youth"
  ) {

    addRecommendation(

      "Skills Training & Learning Opportunities",

      "Explore vocational training, alternative learning opportunities, livelihood programs, and skills-development activities.",

      "Recommended based on your current education information.",

      "Skills"

    );

  }


  // =================================================
  // CIVIC PARTICIPATION
  // =================================================

  if (
    civic ===
      "not active" ||
    civic ===
      "occasional"
  ) {

    addRecommendation(

      "Community Volunteer Day",

      "Join clean-up drives, youth outreach, environmental projects, or other community service activities organized by the SK.",

      "Recommended to encourage greater civic and community participation.",

      "Community"

    );

  }


  // =================================================
  // VOTER INFORMATION
  // =================================================

  if (
    voterStatus ===
      "not registered" ||
    skVoter ===
      "no"
  ) {

    addRecommendation(

      "Youth Voter Information Drive",

      "Attend an information session about voter registration, SK participation, and the importance of informed youth participation.",

      "Recommended based on your voter information in the system.",

      "Civic"

    );

  }


  // =================================================
  // KK ASSEMBLY
  // =================================================

  if (
    kkAttendance ===
    "no"
  ) {

    addRecommendation(

      "KK Assembly Engagement Session",

      "Attend the next KK Assembly or a short orientation explaining how the Katipunan ng Kabataan can participate in barangay youth planning.",

      "Recommended because your profile shows no recorded KK Assembly attendance.",

      "KK Assembly"

    );

  } else if (
    kkAttendance ===
      "yes" &&
    kkCount ===
      "1-2 times"
  ) {

    addRecommendation(

      "Regular KK Assembly Participation",

      "Continue attending KK Assemblies and take part in consultations, planning sessions, and youth discussions.",

      "Recommended to strengthen your participation in KK activities.",

      "KK Assembly"

    );

  }


  // =================================================
  // SPORTS INTERESTS
  // =================================================

  splitInterests(
    data.sports
  )
    .slice(
      0,
      2
    )
    .forEach(
      sportValue => {

        const sport =
          titleCaseInterest(
            sportValue
          );


        addRecommendation(

          `${sport} Sports Activity / Clinic`,

          `Consider joining or proposing an SK ${sport} clinic, friendly tournament, league, or youth fitness activity.`,

          `Recommended based on your listed sports interest: ${sport}.`,

          "Sports"

        );

      }
    );


  // =================================================
  // HOBBIES / SKILLS
  // =================================================

  splitInterests(
    data.hobbies
  )
    .slice(
      0,
      2
    )
    .forEach(
      hobbyValue => {

        const hobby =
          titleCaseInterest(
            hobbyValue
          );


        addRecommendation(

          `${hobby} Youth Skills Activity`,

          `A workshop, showcase, peer-learning session, or youth club related to ${hobby} may match your interests.`,

          `Recommended based on your listed hobby or skill: ${hobby}.`,

          "Interests"

        );

      }
    );


  // =================================================
  // SPECIAL NEEDS
  // =================================================

  if (
    specialNeeds ===
    "yes"
  ) {

    addRecommendation(

      "Inclusive Youth Support & Assistance",

      "Coordinate with the SK or barangay for accessible activities and information about assistance or support services relevant to your needs.",

      data.assistance
        ? `Your profile lists assistance needed: ${data.assistance}.`
        : "Recommended because Special Needs is marked Yes in your profile.",

      "Support"

    );

  }


  // =================================================
  // DEFAULT RECOMMENDATIONS
  // =================================================

  if (
    recommendations.length <
    3
  ) {

    addRecommendation(

      "Youth Leadership & Team-Building Activity",

      "Join leadership training, team-building, planning workshops, or youth consultations to develop confidence and community involvement.",

      "A general recommendation for active youth development and participation.",

      "Leadership"

    );

  }


  if (
    recommendations.length <
    4
  ) {

    addRecommendation(

      "Health, Wellness & Recreation Day",

      "Participate in fitness, mental wellness, recreation, and healthy-lifestyle activities for Barangay Bukal youth.",

      "A general recommendation supporting youth health and well-being.",

      "Wellness"

    );

  }


  return recommendations
    .slice(
      0,
      6
    );

}


// =====================================================
// DISPLAY RECOMMENDATIONS
// =====================================================

function renderYouthRecommendations(
  data
) {

  const container =
    ensureRecommendationsSection();


  if (!container) {
    return;
  }


  const recommendations =
    buildYouthRecommendations(
      data
    );


  if (
    recommendations.length ===
    0
  ) {

    container.innerHTML = `

      <p class="empty-state">

        No recommendations are available yet.
        Complete your profile to receive more
        personalized suggestions.

      </p>

    `;


    return;

  }


  container.innerHTML =
    recommendations
      .map(
        recommendation => `

          <article
            class="summary-box youth-recommendation-card"
          >

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

              ${escapeHtml(
                recommendation.category
              )}

            </small>


            <h3>

              ${escapeHtml(
                recommendation.title
              )}

            </h3>


            <p
              style="
                margin:8px 0 10px;
              "
            >

              ${escapeHtml(
                recommendation.description
              )}

            </p>


            <small
              style="
                display:block;
                color:#71838a;
                line-height:1.5;
              "
            >

              ${escapeHtml(
                recommendation.reason
              )}

            </small>

          </article>

        `
      )
      .join("");

}


// =====================================================
// PROFILE VIEW
// =====================================================

function renderProfileView(
  data
) {

  // ===================================================
  // DYNAMIC WELCOME
  // ===================================================

  if (welcomeEl) {

    welcomeEl.textContent =
      "Welcome, " +
      (
        data.fullName ||
        "Youth"
      ) +
      "!";

  }


  // ===================================================
  // OVERVIEW + RECOMMENDATIONS
  // ===================================================

  renderQuickStats(
    data
  );


  renderYouthRecommendations(
    data
  );


  const extraFields = [

    {
      key:
        "email",

      label:
        "Email"
    },

    {
      key:
        "status",

      label:
        "Status"
    },

    {
      key:
        "eligibility",

      label:
        "Eligibility"
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

            <div
              class="info-item"
              data-profile-field="${escapeHtml(
                field.key
              )}"
            >

              <small>
                ${escapeHtml(
                  field.label
                )}
              </small>

              <span>
                ${escapeHtml(
                  value
                ) || "&mdash;"}
              </span>

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


          let displayStyle =
            "";


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


          // ===========================================
          // SELECT FIELDS
          // ===========================================

          if (
            field.type ===
            "select"
          ) {

            const options =
              field.options
                .map(
                  option => `

                    <option
                      value="${escapeHtml(
                        option
                      )}"
                      ${
                        option ===
                        value
                          ? "selected"
                          : ""
                      }
                    >

                      ${escapeHtml(
                        option
                      )}

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
                  ${escapeHtml(
                    field.label
                  )}
                </span>


                <select
                  name="${field.key}"
                >

                  <option
                    value=""
                  >
                    Select
                  </option>

                  ${options}

                </select>

              </label>

            `;

          }


          // ===========================================
          // AGE READ ONLY
          // ===========================================

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
                  ${escapeHtml(
                    field.label
                  )}
                </span>


                <input
                  type="number"
                  name="${field.key}"
                  value="${escapeHtml(
                    value
                  )}"
                  readonly
                />

              </label>

            `;

          }


          // ===========================================
          // NORMAL INPUT
          // ===========================================

          return `

            <label
              class="${fieldClass}"
              data-field-wrapper="${field.key}"
            >

              <span>
                ${escapeHtml(
                  field.label
                )}
              </span>


              <input
                type="${field.type}"
                name="${field.key}"
                value="${escapeHtml(
                  value
                )}"
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
    editFieldsEl
      .querySelector(
        '[name="birthDate"]'
      );


  const ageInput =
    editFieldsEl
      .querySelector(
        '[name="age"]'
      );


  if (
    birthDateInput &&
    ageInput
  ) {

    birthDateInput
      .addEventListener(
        "change",
        () => {

          const age =
            calculateAge(
              birthDateInput.value
            );


          if (
            age !== null &&
            !Number.isNaN(
              age
            )
          ) {

            ageInput.value =
              age;

          }

        }
      );

  }


  // ===================================================
  // KK ASSEMBLY CONDITIONAL FIELDS
  // ===================================================

  const kkAssemblyInput =
    editFieldsEl
      .querySelector(
        '[name="kkAssemblyAttended"]'
      );


  const kkAttendanceWrapper =
    editFieldsEl
      .querySelector(
        '[data-field-wrapper="kkAttendanceCount"]'
      );


  const kkReasonWrapper =
    editFieldsEl
      .querySelector(
        '[data-field-wrapper="kkNoReason"]'
      );


  const kkAttendanceInput =
    editFieldsEl
      .querySelector(
        '[name="kkAttendanceCount"]'
      );


  const kkReasonInput =
    editFieldsEl
      .querySelector(
        '[name="kkNoReason"]'
      );


  function updateKKConditionalFields() {

    if (!kkAssemblyInput) {
      return;
    }


    const value =
      kkAssemblyInput.value;


    // ===============================================
    // ATTENDED KK
    // ===============================================

    if (
      value ===
      "Yes"
    ) {

      if (
        kkAttendanceWrapper
      ) {

        kkAttendanceWrapper
          .style.display =
            "flex";

      }


      if (
        kkReasonWrapper
      ) {

        kkReasonWrapper
          .style.display =
            "none";

      }


      if (
        kkAttendanceInput
      ) {

        kkAttendanceInput.required =
          true;

      }


      if (
        kkReasonInput
      ) {

        kkReasonInput.required =
          false;

        kkReasonInput.value =
          "";

      }

    }


    // ===============================================
    // DID NOT ATTEND KK
    // ===============================================

    else if (
      value ===
      "No"
    ) {

      if (
        kkAttendanceWrapper
      ) {

        kkAttendanceWrapper
          .style.display =
            "none";

      }


      if (
        kkReasonWrapper
      ) {

        kkReasonWrapper
          .style.display =
            "flex";

      }


      if (
        kkAttendanceInput
      ) {

        kkAttendanceInput.required =
          false;

        kkAttendanceInput.value =
          "";

      }


      if (
        kkReasonInput
      ) {

        kkReasonInput.required =
          true;

      }

    }


    // ===============================================
    // EMPTY VALUE
    // ===============================================

    else {

      if (
        kkAttendanceWrapper
      ) {

        kkAttendanceWrapper
          .style.display =
            "none";

      }


      if (
        kkReasonWrapper
      ) {

        kkReasonWrapper
          .style.display =
            "none";

      }


      if (
        kkAttendanceInput
      ) {

        kkAttendanceInput.required =
          false;

        kkAttendanceInput.value =
          "";

      }


      if (
        kkReasonInput
      ) {

        kkReasonInput.required =
          false;

        kkReasonInput.value =
          "";

      }

    }

  }


  if (
    kkAssemblyInput
  ) {

    kkAssemblyInput
      .addEventListener(
        "change",
        updateKKConditionalFields
      );


    updateKKConditionalFields();

  }

}


// =====================================================
// OPEN EDIT PROFILE
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


      dialog
        ?.showModal();

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


      const updated =
        {};


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
              : input.value
                  .trim();

        }
      );


      // =================================================
      // VALIDATE BIRTH DATE / AGE
      // =================================================

      if (
        updated.birthDate
      ) {

        updated.age =
          calculateAge(
            updated.birthDate
          );


        if (
          updated.age ===
            null ||
          Number.isNaN(
            updated.age
          )
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

        updated.kkNoReason =
          "";

      }


      if (
        updated.kkAssemblyAttended ===
        "No"
      ) {

        updated.kkAttendanceCount =
          "";

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


        // ===============================================
        // RE-RENDER DASHBOARD AFTER UPDATE
        // ===============================================

        renderProfileView(
          currentData
        );


        dialog
          ?.close();


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

      }

      catch (
        error
      ) {

        console.error(
          "Profile save error:",
          error
        );


        alert(
          "Something went wrong while saving your profile. Please try again."
        );

      }

      finally {

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

function getAnnouncementDate(
  value
) {

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
    new Date(
      value
    );


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
// NOTIFICATION HELPERS
// =====================================================

function isAnnouncementRead(
  announcementId
) {

  return readAnnouncementIds
    .includes(
      announcementId
    );

}


// =====================================================
// UPDATE NOTIFICATION BADGE
// =====================================================

function updateNotificationBadge() {

  if (!notificationBadge) {
    return;
  }


  const unreadCount =
    currentAnnouncements
      .filter(
        announcement =>
          !isAnnouncementRead(
            announcement.id
          )
      )
      .length;


  if (unreadCount > 0) {

    notificationBadge.hidden =
      false;

    notificationBadge.textContent =
      unreadCount > 99
        ? "99+"
        : String(unreadCount);

  } else {

    notificationBadge.hidden =
      true;

    notificationBadge.textContent =
      "0";

  }

}


// =====================================================
// FORMAT NOTIFICATION DATE
// =====================================================

function formatNotificationDate(
  announcement
) {

  const date =
    getAnnouncementDate(
      announcement.createdAt ||
      announcement.date
    );


  if (!date) {
    return "";
  }


  return date.toLocaleDateString(
    "en-PH",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric"
    }
  );

}


// =====================================================
// RENDER NOTIFICATION LIST
// =====================================================

function renderNotificationCenter() {

  if (!notificationList) {
    return;
  }


  if (
    currentAnnouncements.length ===
    0
  ) {

    notificationList.innerHTML = `

      <p class="empty-state">
        No notifications available.
      </p>

    `;


    updateNotificationBadge();


    return;

  }


  notificationList.innerHTML =
    currentAnnouncements
      .slice(
        0,
        10
      )
      .map(
        announcement => {

          const unread =
            !isAnnouncementRead(
              announcement.id
            );


          const category =
            announcement.category ||
            "General";


          const title =
            announcement.title ||
            "Announcement";


          const date =
            formatNotificationDate(
              announcement
            );


          return `

            <button
              type="button"
              class="youth-notification-item ${
                unread
                  ? "unread"
                  : "read"
              }"
              data-notification-id="${escapeHtml(
                announcement.id
              )}"
            >

              <span
                class="notification-item-dot"
                aria-hidden="true"
              ></span>


              <span
                class="notification-item-content"
              >

                <small
                  class="notification-item-category"
                >
                  ${escapeHtml(
                    category
                  )}
                </small>


                <strong>
                  ${escapeHtml(
                    title
                  )}
                </strong>


                ${
                  date
                    ? `

                      <small
                        class="notification-item-date"
                      >
                        ${escapeHtml(
                          date
                        )}
                      </small>

                    `
                    : ""
                }

              </span>

            </button>

          `;

        }
      )
      .join("");


  notificationList
    .querySelectorAll(
      "[data-notification-id]"
    )
    .forEach(
      item => {

        item.addEventListener(
          "click",
          async () => {

            const announcementId =
              item.dataset
                .notificationId;


            await markAnnouncementAsRead(
              announcementId
            );


            closeNotificationDropdown();


            document
              .getElementById(
                "youthAnnouncementSection"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start"
              });

          }
        );

      }
    );


  updateNotificationBadge();

}


// =====================================================
// SAVE READ NOTIFICATION IDS
// =====================================================

async function saveReadAnnouncementIds() {

  if (!currentUser) {
    return;
  }


  try {

    await updateDoc(

      doc(
        db,
        "users",
        currentUser.uid
      ),

      {
        readAnnouncementIds:
          readAnnouncementIds,

        notificationUpdatedAt:
          new Date()
      }

    );


    if (currentData) {

      currentData.readAnnouncementIds =
        [
          ...readAnnouncementIds
        ];

    }

  } catch (error) {

    console.error(
      "Notification read-state save error:",
      error
    );

  }

}


// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

async function markAnnouncementAsRead(
  announcementId
) {

  if (
    !announcementId ||
    isAnnouncementRead(
      announcementId
    )
  ) {

    return;

  }


  readAnnouncementIds =
    [
      ...readAnnouncementIds,
      announcementId
    ];


  renderNotificationCenter();


  await saveReadAnnouncementIds();

}


// =====================================================
// MARK ALL AS READ
// =====================================================

async function markAllAnnouncementsAsRead() {

  const allIds =
    currentAnnouncements
      .map(
        announcement =>
          announcement.id
      );


  readAnnouncementIds =
    [
      ...new Set([
        ...readAnnouncementIds,
        ...allIds
      ])
    ];


  renderNotificationCenter();


  await saveReadAnnouncementIds();

}


// =====================================================
// OPEN NOTIFICATION DROPDOWN
// =====================================================

function openNotificationDropdown() {

  if (!notificationDropdown) {
    return;
  }


  notificationDropdown.hidden =
    false;


  notificationBtn
    ?.setAttribute(
      "aria-expanded",
      "true"
    );

}


// =====================================================
// CLOSE NOTIFICATION DROPDOWN
// =====================================================

function closeNotificationDropdown() {

  if (!notificationDropdown) {
    return;
  }


  notificationDropdown.hidden =
    true;


  notificationBtn
    ?.setAttribute(
      "aria-expanded",
      "false"
    );

}


// =====================================================
// TOGGLE NOTIFICATION DROPDOWN
// =====================================================

if (notificationBtn) {

  notificationBtn.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      if (
        notificationDropdown
          ?.hidden
      ) {

        openNotificationDropdown();

      } else {

        closeNotificationDropdown();

      }

    }
  );

}


// =====================================================
// CLOSE DROPDOWN WHEN CLICKING OUTSIDE
// =====================================================

document.addEventListener(
  "click",
  event => {

    if (
      !notificationDropdown ||
      notificationDropdown.hidden
    ) {

      return;

    }


    const wrapper =
      notificationBtn
        ?.closest(
          ".youth-notification-wrap"
        );


    if (
      wrapper &&
      !wrapper.contains(
        event.target
      )
    ) {

      closeNotificationDropdown();

    }

  }
);


// =====================================================
// MARK ALL BUTTON
// =====================================================

if (
  markAllNotificationsReadBtn
) {

  markAllNotificationsReadBtn
    .addEventListener(
      "click",
      async event => {

        event.stopPropagation();


        await markAllAnnouncementsAsRead();

      }
    );

}


// =====================================================
// VIEW ALL ANNOUNCEMENTS
// =====================================================

if (
  viewAllAnnouncementsBtn
) {

  viewAllAnnouncementsBtn
    .addEventListener(
      "click",
      () => {

        closeNotificationDropdown();


        document
          .getElementById(
            "youthAnnouncementSection"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });

      }
    );

}


// =====================================================
// IMPORTANT / EMERGENCY ANNOUNCEMENT
// =====================================================

function showImportantAnnouncement(
  announcement
) {

  if (
    !announcement ||
    !importantAnnouncementDialog
  ) {

    return;

  }


  if (
    importantAnnouncementCategory
  ) {

    importantAnnouncementCategory
      .textContent =
      announcement.category ||
      "Important Announcement";

  }


  if (
    importantAnnouncementTitle
  ) {

    importantAnnouncementTitle
      .textContent =
      announcement.title ||
      "Announcement";

  }


  if (
    importantAnnouncementMessage
  ) {

    importantAnnouncementMessage
      .textContent =
      announcement.message ||
      announcement.description ||
      announcement.content ||
      "";

  }


  const imageUrl =
    announcement.imageUrl ||
    "";


  if (
    importantAnnouncementImage
  ) {

    if (imageUrl) {

      importantAnnouncementImage.src =
        imageUrl;

      importantAnnouncementImage.alt =
        announcement.title ||
        "Announcement poster";

      importantAnnouncementImage.hidden =
        false;

    } else {

      importantAnnouncementImage.removeAttribute(
        "src"
      );

      importantAnnouncementImage.hidden =
        true;

    }

  }


  importantAnnouncementDialog
    .dataset
    .announcementId =
    announcement.id;


  if (
    !importantAnnouncementDialog.open
  ) {

    importantAnnouncementDialog
      .showModal();

  }

}


// =====================================================
// CHECK FOR UNREAD EMERGENCY ANNOUNCEMENT
// =====================================================

function checkImportantAnnouncements() {

  const importantAnnouncement =
    currentAnnouncements
      .find(
        announcement => {

          const category =
            String(
              announcement.category ||
              ""
            )
              .trim()
              .toLowerCase();


          return (
            category ===
              "emergency" &&
            !isAnnouncementRead(
              announcement.id
            )
          );

        }
      );


  if (
    importantAnnouncement
  ) {

    showImportantAnnouncement(
      importantAnnouncement
    );

  }

}


// =====================================================
// CLOSE IMPORTANT ANNOUNCEMENT
// =====================================================

async function closeImportantAnnouncementDialog() {

  if (
    !importantAnnouncementDialog
  ) {

    return;

  }


  const announcementId =
    importantAnnouncementDialog
      .dataset
      .announcementId;


  if (
    announcementId
  ) {

    await markAnnouncementAsRead(
      announcementId
    );

  }


  importantAnnouncementDialog
    .close();

}


if (
  closeImportantAnnouncement
) {

  closeImportantAnnouncement
    .addEventListener(
      "click",
      closeImportantAnnouncementDialog
    );

}


if (
  importantAnnouncementDone
) {

  importantAnnouncementDone
    .addEventListener(
      "click",
      closeImportantAnnouncementDialog
    );

}


// =====================================================
// LOAD ANNOUNCEMENTS
// =====================================================

async function loadYouthAnnouncements() {

  if (
    !announcementsEl
  ) {

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


    let announcements =
      snap.docs
        .map(
          documentSnapshot => ({

            id:
              documentSnapshot.id,

            ...documentSnapshot.data()

          })
        );

// =================================================
// STORE ANNOUNCEMENTS FOR NOTIFICATION CENTER
// =================================================

currentAnnouncements =
  announcements;


// =================================================
// RENDER NOTIFICATION CENTER
// =================================================

renderNotificationCenter();


// =================================================
// CHECK EMERGENCY ANNOUNCEMENTS
// =================================================

checkImportantAnnouncements();


    // =================================================
    // HIDE EXPIRED ANNOUNCEMENTS
    // =================================================

    announcements =
      announcements
        .filter(
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
          )

          -

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
        `
          <p class="empty-state">
            No announcements available at this time.
          </p>
        `;


      return;

    }


    // =================================================
    // DISPLAY ANNOUNCEMENTS
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

                ? date
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

                <div
                  class="announcement-text-side"
                >

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

                    ${escapeHtml(
                      category
                    )}

                  </small>


                  <h3>

                    ${escapeHtml(
                      title
                    )}

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
                            ${escapeHtml(
                              formattedDate
                            )}

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
                            ${escapeHtml(
                              formattedExpiry
                            )}

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

                    ${escapeHtml(
                      message
                    )}

                  </p>

                </div>


                ${
                  imageUrl
                    ? `

                        <div
                          class="announcement-image-side"
                        >

                          <img
                            src="${escapeHtml(
                              imageUrl
                            )}"
                            alt="${escapeHtml(
                              title
                            )}"
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

  }

  catch (
    error
  ) {

    console.error(
      "Announcement load error:",
      error
    );


    announcementsEl.innerHTML =
      `
        <p class="empty-state">
          Unable to load announcements at this time.
        </p>
      `;

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
// LOAD SAVED NOTIFICATION READ STATE
// =================================================

readAnnouncementIds =
  Array.isArray(
    currentData?.readAnnouncementIds
  )
    ? [
        ...currentData.readAnnouncementIds
      ]
    : [];


// =================================================
// LOAD ANNOUNCEMENTS + NOTIFICATIONS
// =================================================

await loadYouthAnnouncements();

    try {

      const snap =
        await getDoc(

          doc(
            db,
            "users",
            user.uid
          )

        );


      if (
        !snap.exists()
      ) {

        if (
          profileViewEl
        ) {

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


      // =================================================
      // AUTO RECALCULATE AGE / STATUS
      // =================================================

      if (
        currentData.birthDate
      ) {

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
      // RENDER DASHBOARD
      // =================================================

      renderProfileView(
        currentData
      );


      // =================================================
      // UPDATE AGE / STATUS IN FIRESTORE
      // =================================================

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

    }

    catch (
      error
    ) {

      console.error(
        "Youth dashboard load error:",
        error
      );


      if (
        profileViewEl
      ) {

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