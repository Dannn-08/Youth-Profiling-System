import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { logActivity } from "./audit-log.js";


// =====================================================
// PUROK / AREA OPTIONS
// =====================================================

const PUROK_OPTIONS = [
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
];


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
    key: "email",
    label: "Email",
    type: "email",
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
    options: PUROK_OPTIONS,
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
    full: true
  },

  {
    key: "kkNoReason",
    label: "If no, why?",
    type: "select",
    options: [
      "There was no KK Assembly Meeting",
      "Not Interested to Attend"
    ],
    full: true
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
// GLOBAL DATA
// =====================================================

let allUsers = [];
let youthList = [];
let adminList = [];
let announcementList = [];
let charts = {};

// Overview drill-down currently applied to Youth Management.
let overviewDrilldown = null;

// Currently signed-in administrator profile.
let currentAdminProfile = null;


// =====================================================
// HELPERS
// =====================================================

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}


// =====================================================
// NORMALIZE PUROK
// =====================================================

function normalizePurok(value) {
  if (!value) {
    return "";
  }

  const normalized = String(value).trim().toUpperCase();

  const aliases = {
    "BUKAL1": "BUKAL 1",
    "BUKAL 1": "BUKAL 1",
    "KALYE PUTOL/ BUKAL 2": "KALYE PUTOL / BUKAL 2",
    "KALYE PUTOL/BUKAL 2": "KALYE PUTOL / BUKAL 2",
    "KALYE PUTOL /BUKAL 2": "KALYE PUTOL / BUKAL 2",
    "KALYE PUTOL / BUKAL 2": "KALYE PUTOL / BUKAL 2"
  };

  return aliases[normalized] || value;
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

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
}


function getYouthStatus(age) {
  const numericAge = Number(age);

  if (
    numericAge >= 15 &&
    numericAge <= 30
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


function isActiveYouth(youth) {
  if (
    youth.status === "Inactive" ||
    youth.eligibility === "Archived"
  ) {
    return false;
  }

  const age = Number(youth.age);

  return (
    age >= 15 &&
    age <= 30
  );
}


function ageGroup(age) {
  const n = Number(age);

  if (n >= 15 && n <= 19) {
    return "15-19";
  }

  if (n >= 20 && n <= 24) {
    return "20-24";
  }

  if (n >= 25 && n <= 30) {
    return "25-30";
  }

  return "Unspecified";
}


function countBy(list, keyFn) {
  const counts = {};

  list.forEach(item => {
    const key = keyFn(item) || "Unspecified";

    counts[key] =
      (
        counts[key] ||
        0
      ) + 1;
  });

  return counts;
}


function countMultiValueField(list, fieldName) {
  const counts = {};

  list.forEach(item => {
    const values =
      String(
        item[fieldName] ||
        ""
      )
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);

    values.forEach(value => {
      counts[value] =
        (
          counts[value] ||
          0
        ) + 1;
    });
  });

  return counts;
}


function getCreatedDate(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  if (
    value instanceof Date
  ) {
    return value;
  }

  const date = new Date(value);

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
// LOCAL DATE
// =====================================================

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();

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
// ANNOUNCEMENT EXPIRATION
// =====================================================

function isAnnouncementExpired(announcement) {
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
// BACKGROUND AUDIT LOG
// =====================================================

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
// DYNAMIC ADMIN WELCOME
// =====================================================

function getAdminDisplayName(user) {
  if (!user) {
    return "Administrator";
  }

  const matchedAdmin =
    adminList.find(admin =>
      admin.id === user.uid ||
      (
        admin.email &&
        user.email &&
        admin.email.toLowerCase() ===
          user.email.toLowerCase()
      )
    );

  currentAdminProfile =
    matchedAdmin ||
    currentAdminProfile;

  const storedName =
    matchedAdmin?.fullName ||
    currentAdminProfile?.fullName ||
    user.displayName ||
    "";

  if (storedName.trim()) {
    return storedName
      .trim()
      .replace(/^sk\s+/i, "");
  }

  const emailName =
    String(user.email || "")
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, letter =>
        letter.toUpperCase()
      )
      .trim();

  return emailName ||
    "Administrator";
}


function getAdminPosition(admin) {

  if (!admin) {
    return "Administrator";
  }

  return (
    admin.position ||
    admin.skPosition ||
    admin.designation ||
    "Administrator"
  );
}


function updateAdminWelcome(
  user = auth.currentUser
) {

  if (!user) {
    return;
  }


  const matchedAdmin =
    adminList.find(
      admin =>
        admin.id === user.uid ||
        (
          admin.email &&
          user.email &&
          admin.email.toLowerCase() ===
            user.email.toLowerCase()
        )
    );


  currentAdminProfile =
    matchedAdmin ||
    currentAdminProfile;


  const name =
    getAdminDisplayName(
      user
    );


  const position =
    getAdminPosition(
      currentAdminProfile
    );


  // ===============================================
  // MAIN WELCOME
  // ===============================================

  const heading =
    document.getElementById(
      "adminWelcomeTitle"
    );


  if (heading) {

    heading.textContent =
      `Welcome, SK ${name}!`;

  }


  // ===============================================
  // ACCOUNT AREA
  // ===============================================

  const profileName =
    document.getElementById(
      "adminProfileName"
    );


  const profileRole =
    document.getElementById(
      "adminProfileRole"
    );


  if (profileName) {

    profileName.textContent =
      name;

  }


  if (profileRole) {

    profileRole.textContent =
      position;

  }

}


// =====================================================
// ADMIN RECOMMENDATIONS
// =====================================================

function ensureAdminRecommendationsSection() {
  let section =
    document.getElementById(
      "adminRecommendationsSection"
    );

  if (section) {
    return section.querySelector(
      "#adminRecommendations"
    );
  }

  const statCards =
    document.getElementById(
      "statCards"
    );

  if (!statCards) {
    return null;
  }

  section =
    document.createElement(
      "section"
    );

  section.id =
    "adminRecommendationsSection";

  section.className =
    "panel profile-panel";

  section.style.margin =
    "24px 0";

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
          <path d="M9 18h6"></path>
          <path d="M10 22h4"></path>
          <path
            d="M8.2 14.5A6 6 0 1 1 15.8 14.5C14.7 15.4 14 16.2 14 17H10c0-.8-.7-1.6-1.8-2.5z"
          ></path>
        </svg>
      </span>

      <div>
        <h2>
          Recommended SK Activities & Programs
        </h2>

        <p>
          Data-driven suggestions based on the
          current profiles of active Barangay Bukal youth.
        </p>
      </div>

    </div>

    <div
      id="adminRecommendations"
      class="report-summary"
      style="margin-top:24px;"
    >
      <p class="empty-state">
        Analyzing youth data...
      </p>
    </div>
  `;

  statCards.insertAdjacentElement(
    "afterend",
    section
  );

  return section.querySelector(
    "#adminRecommendations"
  );
}


function percentage(part, total) {
  if (!total) {
    return 0;
  }

  return Math.round(
    (part / total) * 100
  );
}


function getTopCountEntry(counts) {
  return Object
    .entries(counts)
    .sort(
      (a, b) =>
        b[1] - a[1]
    )[0] || null;
}


// =====================================================
// BUILD ADMIN RECOMMENDATIONS
// =====================================================

function buildAdminRecommendations() {
  const activeYouth =
    youthList.filter(
      isActiveYouth
    );

  const total =
    activeYouth.length;

  if (!total) {
    return [];
  }

  const recommendations = [];
  const seen = new Set();

  function addRecommendation(
    title,
    description,
    basis,
    category
  ) {
    if (
      !title ||
      seen.has(title)
    ) {
      return;
    }

    seen.add(title);

    recommendations.push({
      title,
      description,
      basis,
      category
    });
  }

  const students =
    activeYouth.filter(
      youth =>
        youth.employment ===
          "Student" ||
        youth.educationStatus ===
          "Currently Studying"
    ).length;

  const unemployed =
    activeYouth.filter(
      youth =>
        youth.employment ===
        "Unemployed"
    ).length;

  const notStudying =
    activeYouth.filter(
      youth =>
        youth.educationStatus ===
          "Not Studying" ||
        youth.education ===
          "Out of School Youth"
    ).length;

  const noKK =
    activeYouth.filter(
      youth =>
        youth.kkAssemblyAttended ===
        "No"
    ).length;

  const notSKVoter =
    activeYouth.filter(
      youth =>
        youth.registeredSKVoter ===
        "No"
    ).length;

  const lowCivic =
    activeYouth.filter(
      youth =>
        youth.civic ===
          "Not Active" ||
        youth.civic ===
          "Occasional"
    ).length;

  const specialNeeds =
    activeYouth.filter(
      youth =>
        youth.specialNeeds ===
        "Yes"
    ).length;

  if (
    students > 0 &&
    percentage(
      students,
      total
    ) >= 25
  ) {
    addRecommendation(
      "Scholarship & Career Guidance Program",

      "Conduct a scholarship orientation, career guidance session, or education-support activity for students and currently studying youth.",

      `${students} of ${total} active youth (${percentage(
        students,
        total
      )}%) are students or currently studying.`,

      "Education"
    );
  }

  if (
    unemployed > 0 &&
    percentage(
      unemployed,
      total
    ) >= 15
  ) {
    addRecommendation(
      "Job Readiness & Employability Workshop",

      "Organize resume writing, interview preparation, digital skills, job-search guidance, and employment-readiness activities.",

      `${unemployed} of ${total} active youth (${percentage(
        unemployed,
        total
      )}%) are recorded as unemployed.`,

      "Employment"
    );
  }

  if (
    notStudying > 0 &&
    percentage(
      notStudying,
      total
    ) >= 10
  ) {
    addRecommendation(
      "Skills Training & Alternative Learning Program",

      "Coordinate vocational, livelihood, digital-skills, or alternative learning opportunities for youth who are not currently studying.",

      `${notStudying} of ${total} active youth (${percentage(
        notStudying,
        total
      )}%) are not studying or are listed as out-of-school youth.`,

      "Skills"
    );
  }

  if (
    noKK > 0 &&
    percentage(
      noKK,
      total
    ) >= 20
  ) {
    addRecommendation(
      "KK Assembly Engagement Campaign",

      "Promote upcoming KK Assemblies through targeted invitations, youth consultations, and clear information on how young people can participate.",

      `${noKK} of ${total} active youth (${percentage(
        noKK,
        total
      )}%) have not attended a KK Assembly.`,

      "KK Assembly"
    );
  }

  if (
    notSKVoter > 0 &&
    percentage(
      notSKVoter,
      total
    ) >= 15
  ) {
    addRecommendation(
      "Youth Voter Information Drive",

      "Hold an information campaign about SK voter registration, civic participation, and responsible youth involvement in local governance.",

      `${notSKVoter} of ${total} active youth (${percentage(
        notSKVoter,
        total
      )}%) are not recorded as registered SK voters.`,

      "Civic"
    );
  }

  if (
    lowCivic > 0 &&
    percentage(
      lowCivic,
      total
    ) >= 20
  ) {
    addRecommendation(
      "Community Volunteer & Leadership Day",

      "Create accessible volunteer activities such as clean-up drives, youth outreach, environmental projects, and leadership sessions.",

      `${lowCivic} of ${total} active youth (${percentage(
        lowCivic,
        total
      )}%) report occasional or no active civic participation.`,

      "Community"
    );
  }

  if (
    specialNeeds > 0
  ) {
    addRecommendation(
      "Inclusive Youth Support Program",

      "Review requested assistance and make SK activities, information, and community programs more accessible to youth with special needs.",

      `${specialNeeds} active youth profile${
        specialNeeds === 1
          ? ""
          : "s"
      } currently indicate special needs.`,

      "Inclusion"
    );
  }

  const topSport =
    getTopCountEntry(
      countMultiValueField(
        activeYouth,
        "sports"
      )
    );

  if (
    topSport &&
    topSport[1] > 0
  ) {
    addRecommendation(
      `${topSport[0]} Sports Clinic / League`,

      `Consider a ${topSport[0]} clinic, friendly tournament, league, or recreation activity based on current youth sports interests.`,

      `${topSport[0]} is currently the most common listed sports interest with ${topSport[1]} response${
        topSport[1] === 1
          ? ""
          : "s"
      }.`,

      "Sports"
    );
  }

  const topHobby =
    getTopCountEntry(
      countMultiValueField(
        activeYouth,
        "hobbies"
      )
    );

  if (
    topHobby &&
    topHobby[1] > 0
  ) {
    addRecommendation(
      `${topHobby[0]} Youth Skills Activity`,

      `Consider a workshop, showcase, peer-learning session, or youth club related to ${topHobby[0]}.`,

      `${topHobby[0]} is one of the most common listed hobbies or skills with ${topHobby[1]} response${
        topHobby[1] === 1
          ? ""
          : "s"
      }.`,

      "Interests"
    );
  }

  if (
    recommendations.length <
    4
  ) {
    addRecommendation(
      "Youth Leadership & Planning Workshop",

      "Conduct a leadership and planning activity where youth can help identify priorities and propose future Barangay Bukal programs.",

      "General youth development recommendation based on the current active-youth database.",

      "Leadership"
    );
  }

  if (
    recommendations.length <
    5
  ) {
    addRecommendation(
      "Health, Wellness & Recreation Day",

      "Organize a youth wellness activity combining recreation, physical fitness, mental wellness awareness, and community interaction.",

      "General recommendation supporting balanced youth development and well-being.",

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
// RENDER ADMIN RECOMMENDATIONS
// =====================================================

function renderAdminRecommendations() {
  const container =
    ensureAdminRecommendationsSection();

  if (!container) {
    return;
  }

  const recommendations =
    buildAdminRecommendations();

  if (
    recommendations.length ===
    0
  ) {
    container.innerHTML = `
      <p class="empty-state">
        No recommendation can be generated yet.
        Add active youth records to begin the analysis.
      </p>
    `;

    return;
  }

  container.innerHTML =
    recommendations
      .map(
        recommendation => `
          <article
            class="summary-box admin-recommendation-card"
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
              style="margin:8px 0 10px;"
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
              Data basis:
              ${escapeHtml(
                recommendation.basis
              )}
            </small>
          </article>
        `
      )
      .join("");
}
// =====================================================
// ANNOUNCEMENT IMAGE HELPER
// FIRESTORE BASE64 / WEBP
// =====================================================

async function uploadAnnouncementImage(file) {
  if (!file) {
    return null;
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Please select a valid image file."
    );
  }

  const maxOriginalSize =
    10 * 1024 * 1024;

  if (
    file.size >
    maxOriginalSize
  ) {
    throw new Error(
      "Announcement image must not exceed 10 MB."
    );
  }

  const image =
    await createImageBitmap(
      file
    );

  const maxWidth = 900;
  const maxHeight = 900;

  let width = image.width;
  let height = image.height;

  const scale =
    Math.min(
      maxWidth / width,
      maxHeight / height,
      1
    );

  width =
    Math.round(
      width * scale
    );

  height =
    Math.round(
      height * scale
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext(
      "2d"
    );

  if (!context) {
    throw new Error(
      "Your browser could not process the selected image."
    );
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  let quality = 0.72;

  let imageUrl =
    canvas.toDataURL(
      "image/webp",
      quality
    );

  while (
    imageUrl.length >
      700000 &&
    quality >
      0.30
  ) {
    quality -= 0.08;

    imageUrl =
      canvas.toDataURL(
        "image/webp",
        quality
      );
  }

  if (
    image.close
  ) {
    image.close();
  }

  if (
    imageUrl.length >
    850000
  ) {
    throw new Error(
      "The image is still too large after compression. Please use a smaller image."
    );
  }

  return {
    imageUrl
  };
}


// =====================================================
// AUTO DELETE EXPIRED ANNOUNCEMENTS
// =====================================================

async function deleteExpiredAnnouncements(announcements) {
  const expired =
    announcements.filter(
      announcement =>
        isAnnouncementExpired(
          announcement
        )
    );

  if (
    expired.length === 0
  ) {
    return announcements;
  }

  const results =
    await Promise.allSettled(
      expired.map(
        announcement =>
          deleteDoc(
            doc(
              db,
              "announcements",
              announcement.id
            )
          )
      )
    );

  results.forEach(
    (
      result,
      index
    ) => {

      const announcement =
        expired[index];

      if (
        result.status ===
        "fulfilled"
      ) {
        console.log(
          "Expired announcement automatically deleted:",
          announcement.title
        );

        safeLogActivity({
          email:
            auth.currentUser?.email ||
            "System",

          role:
            "admin",

          activity:
            "Auto-deleted expired announcement",

          details:
            `${announcement.title} • Displayed until: ${announcement.expiryDate}`
        });

      } else {

        console.error(
          "Could not automatically delete expired announcement:",
          announcement.title,
          result.reason
        );
      }
    }
  );

  return announcements.filter(
    announcement =>
      !isAnnouncementExpired(
        announcement
      )
  );
}


// =====================================================
// TAB SWITCHING
// =====================================================

const tabButtons =
  document.querySelectorAll(
    ".tab-nav button[data-tab]"
  );

const tabPanels =
  document.querySelectorAll(
    ".tab-panel"
  );


// =====================================================
// ACTIVATE DASHBOARD TAB
// =====================================================

function activateDashboardTab(tabName) {

  if (!tabName) {
    return;
  }

  const targetPanel =
    document.getElementById(
      `tab-${tabName}`
    );

  if (!targetPanel) {
    console.warn(
      `Dashboard panel not found: tab-${tabName}`
    );

    return;
  }


  // ===================================================
  // REMOVE ACTIVE STATE FROM ALL BUTTONS
  // ===================================================

  tabButtons.forEach(
    button => {

      button.classList.remove(
        "active"
      );

      button.setAttribute(
        "aria-selected",
        "false"
      );

    }
  );


  // ===================================================
  // HIDE ALL PANELS
  // ===================================================

  tabPanels.forEach(
    panel => {

      panel.classList.remove(
        "active"
      );

      panel.hidden = true;

    }
  );


  // ===================================================
  // ACTIVE BUTTON
  // ===================================================

  const activeButton =
    document.querySelector(
      `.tab-nav button[data-tab="${tabName}"]`
    );


  if (activeButton) {

    activeButton.classList.add(
      "active"
    );

    activeButton.setAttribute(
      "aria-selected",
      "true"
    );

  }


  // ===================================================
  // SHOW TARGET PANEL
  // ===================================================

  targetPanel.hidden =
    false;

  targetPanel.classList.add(
    "active"
  );


  // ===================================================
  // SAVE CURRENT TAB
  // ===================================================

  try {

    sessionStorage.setItem(
      "bukalAdminActiveTab",
      tabName
    );

  } catch (error) {

    console.warn(
      "Unable to save current dashboard tab:",
      error
    );

  }


  // ===================================================
  // SETTINGS
  // ===================================================

  if (
    tabName ===
    "settings"
  ) {

    renderAdminAccounts();

  }


  // ===================================================
  // REPORTS
  // ===================================================

  if (
    tabName ===
    "reports"
  ) {

    renderReports();

  }


  // ===================================================
  // OVERVIEW / CHART RESIZE
  // ===================================================

  if (
    tabName ===
    "overview"
  ) {

    requestAnimationFrame(
      () => {

        Object
          .values(
            charts
          )
          .forEach(
            chart => {

              try {

                chart?.resize();

              } catch (error) {

                console.warn(
                  "Chart resize error:",
                  error
                );

              }

            }
          );

      }
    );

  }


  // ===================================================
  // SEND EVENT WHEN TAB CHANGES
  // ===================================================

  document.dispatchEvent(
    new CustomEvent(
      "bukalAdminTabChanged",
      {
        detail: {
          tab:
            tabName
        }
      }
    )
  );

}


// =====================================================
// TAB BUTTON EVENTS
// =====================================================

tabButtons.forEach(
  button => {

    button.type =
      "button";


    button.addEventListener(
      "click",
      event => {

        event.preventDefault();


        const tabName =
          button.dataset.tab;


        if (!tabName) {
          return;
        }


        activateDashboardTab(
          tabName
        );

      }
    );

  }
);


// =====================================================
// INITIALIZE DASHBOARD TAB
// =====================================================

function initializeDashboardTabs() {

  let savedTab =
    "";


  try {

    savedTab =
      sessionStorage.getItem(
        "bukalAdminActiveTab"
      ) || "";

  } catch (error) {

    console.warn(
      "Unable to restore dashboard tab:",
      error
    );

  }


  // ===================================================
  // RESTORE PREVIOUS TAB
  // ===================================================

  if (
    savedTab &&
    document.getElementById(
      `tab-${savedTab}`
    )
  ) {

    activateDashboardTab(
      savedTab
    );

    return;

  }


  // ===================================================
  // DEFAULT TAB
  // ===================================================

  activateDashboardTab(
    "overview"
  );

}


// =====================================================
// START TAB SYSTEM
// =====================================================

initializeDashboardTabs();


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsersData() {

  const statCards =
    document.getElementById(
      "statCards"
    );


  const tableBody =
    document.getElementById(
      "youthTableBody"
    );


  if (statCards) {

    statCards.innerHTML = `
      <p class="empty-state">
        Loading dashboard data...
      </p>
    `;

  }


  if (tableBody) {

    tableBody.innerHTML = `
      <tr>

        <td
          colspan="11"
          class="empty-state"
        >
          Loading youth records...
        </td>

      </tr>
    `;

  }


  try {

    const snap =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    allUsers =
      snap.docs.map(
        documentSnapshot => ({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()

        })
      );


    youthList =
      allUsers
        .filter(
          user =>
            user.role ===
            "youth"
        )
        .map(
          user => {

            const youthData = {
              ...user
            };


            youthData.address =
              normalizePurok(
                youthData.address
              );


            if (
              youthData.birthDate
            ) {

              const calculatedAge =
                calculateAge(
                  youthData.birthDate
                );


              if (
                calculatedAge !==
                null
              ) {

                const youthStatus =
                  getYouthStatus(
                    calculatedAge
                  );


                youthData.age =
                  calculatedAge;


                youthData.status =
                  youthStatus.status;


                youthData.eligibility =
                  youthStatus.eligibility;

              }

            }


            return youthData;

          }
        );


    adminList =
      allUsers.filter(
        user =>
          user.role ===
          "admin"
      );


    renderStats();

    renderTable();

    renderReports();

    renderAdminAccounts();

    renderAdminRecommendations();

    updateAdminWelcome(
      auth.currentUser
    );


    requestAnimationFrame(
      () => {

        renderCharts();

      }
    );


  } catch (error) {

    console.error(
      "Users load error:",
      error
    );


    if (statCards) {

      statCards.innerHTML = `
        <p class="empty-state">
          Unable to load dashboard data.
        </p>
      `;

    }


    if (tableBody) {

      tableBody.innerHTML = `
        <tr>

          <td
            colspan="11"
            class="empty-state"
          >
            Unable to load youth records.
          </td>

        </tr>
      `;

    }

  }

}


// =====================================================
// STATS
// CLICKABLE OVERVIEW CARDS
// =====================================================

function renderStats() {

  const activeYouth =
    youthList.filter(
      isActiveYouth
    );


  const cards = [

    {
      label:
        "Total Active Youth",

      value:
        activeYouth.length,

      drilldown: {
        type:
          "active",

        label:
          "Active Youth"
      }
    },

    {
      label:
        "Male",

      value:
        activeYouth.filter(
          youth =>
            youth.gender ===
            "Male"
        ).length,

      drilldown: {
        type:
          "field",

        field:
          "gender",

        value:
          "Male",

        label:
          "Male"
      }
    },

    {
      label:
        "Female",

      value:
        activeYouth.filter(
          youth =>
            youth.gender ===
            "Female"
        ).length,

      drilldown: {
        type:
          "field",

        field:
          "gender",

        value:
          "Female",

        label:
          "Female"
      }
    },

    {
      label:
        "Students",

      value:
        activeYouth.filter(
          youth =>
            youth.employment ===
            "Student"
        ).length,

      drilldown: {
        type:
          "field",

        field:
          "employment",

        value:
          "Student",

        label:
          "Students"
      }
    }

  ];


  const container =
    document.getElementById(
      "statCards"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    cards
      .map(
        (
          card,
          index
        ) => `

          <div
            class="panel stat-card admin-overview-card"
            role="button"
            tabindex="0"
            data-stat-index="${index}"
            title="Click to view matching youth records"
            style="cursor:pointer;"
          >

            <small>
              ${escapeHtml(
                card.label
              )}
            </small>

            <strong>
              ${card.value}
            </strong>

          </div>

        `
      )
      .join("");


  container
    .querySelectorAll(
      "[data-stat-index]"
    )
    .forEach(
      cardElement => {

        const index =
          Number(
            cardElement
              .dataset
              .statIndex
          );


        const openDrilldown =
          () => {

            const card =
              cards[index];


            if (!card) {
              return;
            }


            applyOverviewDrilldown(
              card.drilldown
            );

          };


        cardElement.addEventListener(
          "click",
          openDrilldown
        );


        cardElement.addEventListener(
          "keydown",
          event => {

            if (
              event.key ===
                "Enter" ||
              event.key ===
                " "
            ) {

              event.preventDefault();

              openDrilldown();

            }

          }
        );

      }
    );

}


// =====================================================
// CHART
// =====================================================

function drawChart(
  canvasId,
  type,
  labels,
  data,
  colors
) {

  const canvas =
    document.getElementById(
      canvasId
    );


  if (!canvas) {
    return;
  }


  if (
    charts[
      canvasId
    ]
  ) {

    charts[
      canvasId
    ].destroy();

  }


  const isDoughnut =
    type ===
    "doughnut";


  const isBar =
    type ===
    "bar";


  charts[
    canvasId
  ] =
    new Chart(
      canvas,
      {

        type,

        data: {

          labels,

          datasets: [
            {

              data,

              backgroundColor:
                colors ||
                [
                  "#0a5255",
                  "#d8ad76",
                  "#5f8c8d",
                  "#89babd",
                  "#063f42",
                  "#bfcfd0",
                  "#8d6f47",
                  "#c8a77c"
                ],

              borderColor:
                isDoughnut
                  ? "#ffffff"
                  : "transparent",

              borderWidth:
                isDoughnut
                  ? 2
                  : 0,

              maxBarThickness:
                isBar
                  ? 60
                  : undefined,

              borderRadius:
                isBar
                  ? 5
                  : 0

            }
          ]

        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


// =================================================
// CLICK CHART → EXPAND FIRST
// =================================================

onClick: (
  event,
  elements,
  chart
) => {

  const panel =
    canvas.closest(
      ".chart-panel"
    );

  openChartFocus(
    canvasId,
    panel
  );

},


          animation: {

            duration:
              100

          },


          cutout:
            isDoughnut
              ? "64%"
              : undefined,


          plugins: {

            legend: {

              display:
                isDoughnut,

              position:
                "bottom"

            }

          },


          scales:
            isBar
              ? {

                  y: {

                    beginAtZero:
                      true,

                    ticks: {

                      precision:
                        0,

                      stepSize:
                        1

                    }

                  }

                }
              : undefined

        }

      }
    );

}


// =====================================================
// REGISTRATION TREND
// =====================================================

function renderRegistrationTrendChart() {

  const canvas =
    document.getElementById(
      "registrationTrendChart"
    );


  if (!canvas) {
    return;
  }


  if (
    charts.registrationTrendChart
  ) {

    charts
      .registrationTrendChart
      .destroy();

  }


  const currentYear =
    new Date()
      .getFullYear();


  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];


  const monthly =
    new Array(
      12
    )
      .fill(
        0
      );


  youthList.forEach(
    youth => {

      const date =
        getCreatedDate(
          youth.createdAt
        );


      if (!date) {
        return;
      }


      if (
        date.getFullYear() ===
        currentYear
      ) {

        monthly[
          date.getMonth()
        ]++;

      }

    }
  );


  charts.registrationTrendChart =
    new Chart(
      canvas,
      {

        type:
          "line",

        data: {

          labels:
            months,

          datasets: [
            {

              label:
                `Youth Registrations ${currentYear}`,

              data:
                monthly,

              borderColor:
                "#0a5255",

              backgroundColor:
                "rgba(10,82,85,.12)",

              borderWidth:
                3,

              tension:
                0.35,

              fill:
                true

            }
          ]

        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


onClick: (
  event,
  elements,
  chart
) => {

  const panel =
    canvas.closest(
      ".chart-panel"
    );

  openChartFocus(
    "registrationTrendChart",
    panel
  );

},


          animation: {

            duration:
              100

          },


          scales: {

            y: {

              beginAtZero:
                true,

              ticks: {

                precision:
                  0,

                stepSize:
                  1

              }

            }

          }

        }

      }
    );

}


// =====================================================
// ALL CHARTS
// =====================================================

function renderCharts() {

  const activeYouth =
    youthList.filter(
      isActiveYouth
    );


  // ===================================================
  // GENDER
  // ===================================================

  const gender =
    countBy(
      activeYouth,
      youth =>
        youth.gender
    );


  drawChart(
    "genderChart",
    "doughnut",
    Object.keys(
      gender
    ),
    Object.values(
      gender
    )
  );


  // ===================================================
  // AGE GROUP
  // ===================================================

  const ages =
    countBy(
      activeYouth,
      youth =>
        ageGroup(
          youth.age
        )
    );


  drawChart(
    "ageChart",
    "bar",
    Object.keys(
      ages
    ),
    Object.values(
      ages
    )
  );


  // ===================================================
  // PUROK
  // ===================================================

  const purok =
    countBy(
      activeYouth,
      youth =>
        normalizePurok(
          youth.address
        )
    );


  const sortedPurok =
    Object
      .entries(
        purok
      )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      );


  drawChart(
    "purokChart",
    "bar",

    sortedPurok.map(
      item =>
        item[0]
    ),

    sortedPurok.map(
      item =>
        item[1]
    )

  );


  // ===================================================
  // CIVIL STATUS
  // ===================================================

  const civilStatus =
    countBy(
      activeYouth,
      youth =>
        youth.civilStatus
    );


  drawChart(
    "civilStatusChart",
    "doughnut",
    Object.keys(
      civilStatus
    ),
    Object.values(
      civilStatus
    )
  );


  // ===================================================
  // EDUCATION
  // ===================================================

  const education =
    countBy(
      activeYouth,
      youth =>
        youth.education
    );


  drawChart(
    "educationChart",
    "bar",
    Object.keys(
      education
    ),
    Object.values(
      education
    )
  );


  // ===================================================
  // EDUCATION STATUS
  // ===================================================

  const educationStatus =
    countBy(
      activeYouth,
      youth =>
        youth.educationStatus
    );


  drawChart(
    "educationStatusChart",
    "doughnut",
    Object.keys(
      educationStatus
    ),
    Object.values(
      educationStatus
    )
  );


  // ===================================================
  // EMPLOYMENT
  // ===================================================

  const employment =
    countBy(
      activeYouth,
      youth =>
        youth.employment
    );


  drawChart(
    "employmentChart",
    "doughnut",
    Object.keys(
      employment
    ),
    Object.values(
      employment
    )
  );


  // ===================================================
  // VOTER REGISTRATION
  // ===================================================

  const voter =
    countBy(
      activeYouth,
      youth =>
        youth.voterStatus
    );


  drawChart(
    "voterChart",
    "doughnut",
    Object.keys(
      voter
    ),
    Object.values(
      voter
    )
  );


  // ===================================================
  // VOTER PARTICIPATION
  // ===================================================

  const voterParticipation =
    countBy(
      activeYouth,
      youth =>
        youth.voterParticipation
    );


  drawChart(
    "voterParticipationChart",
    "doughnut",
    Object.keys(
      voterParticipation
    ),
    Object.values(
      voterParticipation
    )
  );


  // ===================================================
  // NEW VOTER
  // ===================================================

  const newVoter =
    countBy(
      activeYouth,
      youth =>
        youth.newVoter
    );


  drawChart(
    "newVoterChart",
    "doughnut",
    Object.keys(
      newVoter
    ),
    Object.values(
      newVoter
    )
  );


  // ===================================================
  // SK VOTER
  // ===================================================

  const skVoter =
    countBy(
      activeYouth,
      youth =>
        youth.registeredSKVoter
    );


  drawChart(
    "skVoterChart",
    "doughnut",
    Object.keys(
      skVoter
    ),
    Object.values(
      skVoter
    )
  );


  // ===================================================
  // LAST SK ELECTION
  // ===================================================

  const skElection =
    countBy(
      activeYouth,
      youth =>
        youth.votedLastSKElection
    );


  drawChart(
    "skElectionChart",
    "doughnut",
    Object.keys(
      skElection
    ),
    Object.values(
      skElection
    )
  );


  // ===================================================
  // KK ATTENDANCE
  // ===================================================

  const kkAttendance =
    countBy(
      activeYouth,
      youth =>
        youth.kkAssemblyAttended
    );


  drawChart(
    "kkAttendanceChart",
    "doughnut",
    Object.keys(
      kkAttendance
    ),
    Object.values(
      kkAttendance
    )
  );


  // ===================================================
  // KK ATTENDANCE FREQUENCY
  // ===================================================

  const attendedYouth =
    activeYouth.filter(
      youth =>
        youth.kkAssemblyAttended ===
        "Yes"
    );


  const kkFrequency =
    countBy(
      attendedYouth,
      youth =>
        youth.kkAttendanceCount
    );


  drawChart(
    "kkFrequencyChart",
    "bar",
    Object.keys(
      kkFrequency
    ),
    Object.values(
      kkFrequency
    )
  );


  // ===================================================
  // KK REASON
  // ===================================================

  const notAttendedYouth =
    activeYouth.filter(
      youth =>
        youth.kkAssemblyAttended ===
        "No"
    );


  const kkReason =
    countBy(
      notAttendedYouth,
      youth =>
        youth.kkNoReason
    );


  drawChart(
    "kkReasonChart",
    "bar",
    Object.keys(
      kkReason
    ),
    Object.values(
      kkReason
    )
  );


  // ===================================================
  // CIVIC
  // ===================================================

  const civic =
    countBy(
      activeYouth,
      youth =>
        youth.civic
    );


  drawChart(
    "civicChart",
    "doughnut",
    Object.keys(
      civic
    ),
    Object.values(
      civic
    )
  );


  // ===================================================
  // SPECIAL NEEDS
  // ===================================================

  const specialNeeds =
    countBy(
      activeYouth,
      youth =>
        youth.specialNeeds
    );


  drawChart(
    "specialNeedsChart",
    "doughnut",
    Object.keys(
      specialNeeds
    ),
    Object.values(
      specialNeeds
    )
  );


  // ===================================================
  // SPORTS
  // ===================================================

  const sports =
    countMultiValueField(
      activeYouth,
      "sports"
    );


  const topSports =
    Object
      .entries(
        sports
      )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        8
      );


  drawChart(
    "sportsChart",
    "bar",

    topSports.map(
      item =>
        item[0]
    ),

    topSports.map(
      item =>
        item[1]
    )

  );


  // ===================================================
  // HOBBIES
  // ===================================================

  const hobbies =
    countMultiValueField(
      activeYouth,
      "hobbies"
    );


  const topHobbies =
    Object
      .entries(
        hobbies
      )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        8
      );


  drawChart(
    "hobbiesChart",
    "bar",

    topHobbies.map(
      item =>
        item[0]
    ),

    topHobbies.map(
      item =>
        item[1]
    )

  );


  // ===================================================
  // REGISTRATION TREND
  // ===================================================

  renderRegistrationTrendChart();

}
// =====================================================
// OVERVIEW / CHART DRILL-DOWN
// =====================================================

function clearVisibleYouthFilters() {
  if (searchInput) {
    searchInput.value = "";
  }

  if (filterGender) {
    filterGender.value = "";
  }

  if (filterPurok) {
    filterPurok.value = "";
  }

  if (filterEducation) {
    filterEducation.value = "";
  }

  if (filterEmployment) {
    filterEmployment.value = "";
  }

  if (filterStatus) {
    filterStatus.value = "";
  }

  if (filterSKVoter) {
    filterSKVoter.value = "";
  }

  if (filterKKAttendance) {
    filterKKAttendance.value = "";
  }
}


function ensureDrilldownNotice() {
  let notice =
    document.getElementById(
      "overviewDrilldownNotice"
    );

  if (notice) {
    return notice;
  }

  const filterRow =
    document.querySelector(
      "#tab-youth .filter-row"
    );

  if (!filterRow) {
    return null;
  }

  notice =
    document.createElement(
      "div"
    );

  notice.id =
    "overviewDrilldownNotice";

  notice.style.display =
    "none";

  notice.style.margin =
    "0 0 14px";

  notice.style.padding =
    "10px 12px";

  notice.style.border =
    "1px solid rgba(10,82,85,.18)";

  notice.style.borderRadius =
    "10px";

  notice.style.background =
    "rgba(10,82,85,.06)";

  notice.style.color =
    "#0a5255";

  notice.style.fontSize =
    "13px";

  filterRow.insertAdjacentElement(
    "beforebegin",
    notice
  );

  return notice;
}


function updateDrilldownNotice() {
  const notice =
    ensureDrilldownNotice();

  if (!notice) {
    return;
  }

  if (!overviewDrilldown) {
    notice.style.display =
      "none";

    notice.textContent =
      "";

    return;
  }

  notice.style.display =
    "block";

  notice.textContent =
    `Overview filter applied: ${
      overviewDrilldown.label ||
      overviewDrilldown.value ||
      "Selected data"
    }. Use “Clear Filters” to show all youth records.`;
}


function applyOverviewDrilldown(
  drilldown
) {
  clearVisibleYouthFilters();

  overviewDrilldown =
    drilldown || null;

  if (
    drilldown?.type ===
      "field"
  ) {
    if (
      drilldown.field ===
      "gender" &&
      filterGender
    ) {
      filterGender.value =
        drilldown.value;
    }

    if (
      drilldown.field ===
      "address" &&
      filterPurok
    ) {
      filterPurok.value =
        normalizePurok(
          drilldown.value
        );
    }

    if (
      drilldown.field ===
      "education" &&
      filterEducation
    ) {
      filterEducation.value =
        drilldown.value;
    }

    if (
      drilldown.field ===
      "employment" &&
      filterEmployment
    ) {
      filterEmployment.value =
        drilldown.value;
    }

    if (
      drilldown.field ===
      "registeredSKVoter" &&
      filterSKVoter
    ) {
      filterSKVoter.value =
        drilldown.value;
    }

    if (
      drilldown.field ===
      "kkAssemblyAttended" &&
      filterKKAttendance
    ) {
      filterKKAttendance.value =
        drilldown.value;
    }
  }

  if (
    drilldown?.type ===
      "active" &&
    filterStatus
  ) {
    filterStatus.value =
      "active";
  }

  activateDashboardTab(
    "youth"
  );

  updateDrilldownNotice();

  renderTable();

  const youthPanel =
    document.getElementById(
      "tab-youth"
    );

  youthPanel
    ?.scrollIntoView({
      behavior:
        "smooth",

      block:
        "start"
    });
}


function applyChartDrilldown(
  canvasId,
  label
) {
  const fieldMap = {
    genderChart:
      "gender",

    purokChart:
      "address",

    civilStatusChart:
      "civilStatus",

    educationChart:
      "education",

    educationStatusChart:
      "educationStatus",

    employmentChart:
      "employment",

    voterChart:
      "voterStatus",

    voterParticipationChart:
      "voterParticipation",

    newVoterChart:
      "newVoter",

    skVoterChart:
      "registeredSKVoter",

    skElectionChart:
      "votedLastSKElection",

    kkAttendanceChart:
      "kkAssemblyAttended",

    kkFrequencyChart:
      "kkAttendanceCount",

    kkReasonChart:
      "kkNoReason",

    civicChart:
      "civic",

    specialNeedsChart:
      "specialNeeds",

    sportsChart:
      "sports",

    hobbiesChart:
      "hobbies"
  };

  if (
    canvasId ===
    "ageChart"
  ) {
    applyOverviewDrilldown({
      type:
        "ageGroup",

      value:
        label,

      label:
        `Age Group ${label}`
    });

    return;
  }

  if (
    canvasId ===
    "registrationTrendChart"
  ) {
    applyOverviewDrilldown({
      type:
        "registrationMonth",

      value:
        label,

      label:
        `Registration Month: ${label}`
    });

    return;
  }

  const field =
    fieldMap[
      canvasId
    ];

  if (!field) {
    return;
  }

  applyOverviewDrilldown({
    type:
      field === "sports" ||
      field === "hobbies"
        ? "multiValue"
        : "field",

    field,

    value:
      field ===
      "address"
        ? normalizePurok(
            label
          )
        : label,

    label
  });
}


function matchesOverviewDrilldown(
  youth
) {
  if (!overviewDrilldown) {
    return true;
  }

  const {
    type,
    field,
    value
  } =
    overviewDrilldown;

  if (
    type ===
    "active"
  ) {
    return isActiveYouth(
      youth
    );
  }

  if (
    type ===
    "ageGroup"
  ) {
    return (
      ageGroup(
        youth.age
      ) === value
    );
  }

  if (
    type ===
    "registrationMonth"
  ) {
    const date =
      getCreatedDate(
        youth.createdAt
      );

    if (!date) {
      return false;
    }

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    return (
      date.getFullYear() ===
        new Date()
          .getFullYear() &&
      months[
        date.getMonth()
      ] === value
    );
  }

  if (
    type ===
    "multiValue"
  ) {
    const values =
      String(
        youth[field] ||
        ""
      )
        .split(
          /[,;/|]+/
        )
        .map(
          item =>
            item
              .trim()
              .toLowerCase()
        )
        .filter(
          Boolean
        );

    return values.includes(
      String(
        value
      )
        .trim()
        .toLowerCase()
    );
  }

  if (
    type ===
    "field"
  ) {
    if (
      field ===
      "address"
    ) {
      return (
        normalizePurok(
          youth.address
        ) ===
        normalizePurok(
          value
        )
      );
    }

    return (
      String(
        youth[field] ??
        ""
      ) ===
      String(
        value ??
        ""
      )
    );
  }

  return true;
}


// =====================================================
// FILTERS
// =====================================================

const searchInput =
  document.getElementById(
    "youthSearch"
  );

const filterGender =
  document.getElementById(
    "filterGender"
  );

const filterPurok =
  document.getElementById(
    "filterPurok"
  );

const filterEducation =
  document.getElementById(
    "filterEducation"
  );

const filterEmployment =
  document.getElementById(
    "filterEmployment"
  );

const filterStatus =
  document.getElementById(
    "filterStatus"
  );

const filterSKVoter =
  document.getElementById(
    "filterSKVoter"
  );

const filterKKAttendance =
  document.getElementById(
    "filterKKAttendance"
  );

const clearFiltersBtn =
  document.getElementById(
    "clearFilters"
  );


// =====================================================
// POPULATE FILTER OPTIONS
// =====================================================

function populateFilterOptions() {
  const eduOptions = [
    "Elementary",
    "High School",
    "Senior High School",
    "College",
    "Vocational",
    "Graduate",
    "Out of School Youth"
  ];

  const empOptions = [
    "Student",
    "Employed",
    "Unemployed",
    "Self-employed"
  ];

  if (
    filterPurok
  ) {
    filterPurok.innerHTML =
      `<option value="">All Purok / Area</option>` +
      PUROK_OPTIONS
        .map(
          option =>
            `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`
        )
        .join("");
  }

  if (
    filterEducation
  ) {
    filterEducation.innerHTML =
      `<option value="">All Education</option>` +
      eduOptions
        .map(
          option =>
            `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`
        )
        .join("");
  }

  if (
    filterEmployment
  ) {
    filterEmployment.innerHTML =
      `<option value="">All Employment</option>` +
      empOptions
        .map(
          option =>
            `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`
        )
        .join("");
  }
}


// =====================================================
// GET FILTERED YOUTH
// =====================================================

function getFilteredYouth() {
  const term =
    (
      searchInput?.value ||
      ""
    )
      .toLowerCase()
      .trim();

  return youthList.filter(
    youth => {

      const matchesSearch =
        !term ||
        (
          youth.fullName ||
          ""
        )
          .toLowerCase()
          .includes(
            term
          ) ||
        (
          youth.email ||
          ""
        )
          .toLowerCase()
          .includes(
            term
          ) ||
        (
          youth.address ||
          ""
        )
          .toLowerCase()
          .includes(
            term
          );


      const matchesGender =
        !filterGender?.value ||
        youth.gender ===
          filterGender.value;


      const matchesPurok =
        !filterPurok?.value ||
        normalizePurok(
          youth.address
        ) ===
          filterPurok.value;


      const matchesEducation =
        !filterEducation?.value ||
        youth.education ===
          filterEducation.value;


      const matchesEmployment =
        !filterEmployment?.value ||
        youth.employment ===
          filterEmployment.value;


      const matchesStatus =
        !filterStatus?.value ||
        (
          filterStatus.value ===
            "active" &&
          isActiveYouth(
            youth
          )
        ) ||
        (
          filterStatus.value ===
            "inactive" &&
          !isActiveYouth(
            youth
          )
        );


      const matchesSKVoter =
        !filterSKVoter?.value ||
        youth.registeredSKVoter ===
          filterSKVoter.value;


      const matchesKKAttendance =
        !filterKKAttendance?.value ||
        youth.kkAssemblyAttended ===
          filterKKAttendance.value;


      const matchesDrilldown =
        matchesOverviewDrilldown(
          youth
        );


      return (
        matchesSearch &&
        matchesGender &&
        matchesPurok &&
        matchesEducation &&
        matchesEmployment &&
        matchesStatus &&
        matchesSKVoter &&
        matchesKKAttendance &&
        matchesDrilldown
      );

    }
  );
}


// =====================================================
// YOUTH TABLE
// =====================================================

function renderTable() {
  const body =
    document.getElementById(
      "youthTableBody"
    );

  if (!body) {
    return;
  }

  const filtered =
    getFilteredYouth();

  if (
    filtered.length ===
    0
  ) {
    body.innerHTML = `
      <tr>

        <td
          colspan="11"
          class="empty-state"
        >
          No youth records found.
        </td>

      </tr>
    `;

  } else {

    body.innerHTML =
      filtered
        .map(
          youth => {

            const active =
              isActiveYouth(
                youth
              );


            const status =
              active
                ? "Active"
                : "Inactive / Archived";


            return `
              <tr>

                <td>
                  ${escapeHtml(
                    youth.fullName
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.email
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.age
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.gender
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.civilStatus ||
                    "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.education
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.employment
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.registeredSKVoter ||
                    "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.kkAssemblyAttended ||
                    "—"
                  )}
                </td>


                <td>

                  <span
                    class="status-pill ${
                      active
                        ? ""
                        : "off"
                    }"
                  >
                    ${status}
                  </span>

                </td>


                <td>

                  <div class="action-row">

                    <button
                      class="action-btn edit"
                      data-edit="${youth.id}"
                      type="button"
                      title="Edit"
                    >
                      ✎
                    </button>

                    <button
                      class="action-btn delete"
                      data-delete="${youth.id}"
                      type="button"
                      title="Delete"
                    >
                      🗑
                    </button>

                  </div>

                </td>

              </tr>
            `;

          }
        )
        .join("");

  }


  const countText =
    document.getElementById(
      "youthCountText"
    );


  if (
    countText
  ) {
    const activeCount =
      youthList.filter(
        isActiveYouth
      ).length;


    const archivedCount =
      youthList.length -
      activeCount;


    countText.textContent =
      `Showing ${filtered.length} of ${youthList.length} youth records • ${activeCount} Active • ${archivedCount} Archived`;
  }


  document
    .querySelectorAll(
      "[data-edit]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            openYouthDialog(
              button.dataset.edit
            )
        );

      }
    );


  document
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            deleteYouth(
              button.dataset.delete
            )
        );

      }
    );
}


// =====================================================
// FILTER EVENTS
// =====================================================

[
  searchInput,
  filterGender,
  filterPurok,
  filterEducation,
  filterEmployment,
  filterStatus,
  filterSKVoter,
  filterKKAttendance
]
  .filter(
    Boolean
  )
  .forEach(
    element => {

      element.addEventListener(
        "input",
        renderTable
      );

      element.addEventListener(
        "change",
        renderTable
      );

    }
  );


if (
  clearFiltersBtn
) {
  clearFiltersBtn.addEventListener(
    "click",
    () => {

      if (
        searchInput
      ) {
        searchInput.value =
          "";
      }

      if (
        filterGender
      ) {
        filterGender.value =
          "";
      }

      if (
        filterPurok
      ) {
        filterPurok.value =
          "";
      }

      if (
        filterEducation
      ) {
        filterEducation.value =
          "";
      }

      if (
        filterEmployment
      ) {
        filterEmployment.value =
          "";
      }

      if (
        filterStatus
      ) {
        filterStatus.value =
          "";
      }

      if (
        filterSKVoter
      ) {
        filterSKVoter.value =
          "";
      }

      if (
        filterKKAttendance
      ) {
        filterKKAttendance.value =
          "";
      }


      overviewDrilldown =
        null;


      updateDrilldownNotice();


      renderTable();

    }
  );
}
// =====================================================
// ADD / EDIT YOUTH
// =====================================================

const youthDialog =
  document.getElementById(
    "youthDialog"
  );

const youthDialogTitle =
  document.getElementById(
    "youthDialogTitle"
  );

const youthFieldsEl =
  document.getElementById(
    "adminYouthFields"
  );

const saveYouthBtn =
  document.getElementById(
    "saveYouthAdminBtn"
  );

const idInput =
  document.querySelector(
    '#adminYouthForm [name="id"]'
  );

const openAddYouthBtn =
  document.getElementById(
    "openAddYouth"
  );

if (openAddYouthBtn) {
  openAddYouthBtn.addEventListener(
    "click",
    () => openYouthDialog(null)
  );
}


// =====================================================
// BUILD YOUTH FIELDS
// =====================================================

function buildYouthFields(data = {}) {
  if (!youthFieldsEl) {
    return;
  }

  const normalizedData = {
    ...data,
    address: normalizePurok(
      data.address
    )
  };

  youthFieldsEl.innerHTML =
    FIELDS
      .map(field => {
        const value =
          normalizedData[field.key] ??
          "";

        const fieldClass =
          field.full
            ? "field full"
            : "field";

        let displayStyle = "";

        if (
          field.key ===
            "kkAttendanceCount" &&
          normalizedData.kkAssemblyAttended !==
            "Yes"
        ) {
          displayStyle =
            'style="display:none;"';
        }

        if (
          field.key ===
            "kkNoReason" &&
          normalizedData.kkAssemblyAttended !==
            "No"
        ) {
          displayStyle =
            'style="display:none;"';
        }

        if (field.type === "select") {
          const options =
            field.options
              .map(
                option =>
                  `<option value="${escapeHtml(option)}" ${
                    option === value
                      ? "selected"
                      : ""
                  }>${escapeHtml(option)}</option>`
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
                <option value="">
                  Select
                </option>

                ${options}
              </select>
            </label>
          `;
        }

        if (field.key === "age") {
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
      })
      .join("");

  const birthDateInput =
    youthFieldsEl.querySelector(
      '[name="birthDate"]'
    );

  const ageInput =
    youthFieldsEl.querySelector(
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

        ageInput.value =
          age !== null
            ? age
            : "";
      }
    );
  }

  const kkInput =
    youthFieldsEl.querySelector(
      '[name="kkAssemblyAttended"]'
    );

  const countWrapper =
    youthFieldsEl.querySelector(
      '[data-field-wrapper="kkAttendanceCount"]'
    );

  const reasonWrapper =
    youthFieldsEl.querySelector(
      '[data-field-wrapper="kkNoReason"]'
    );

  const countInput =
    youthFieldsEl.querySelector(
      '[name="kkAttendanceCount"]'
    );

  const reasonInput =
    youthFieldsEl.querySelector(
      '[name="kkNoReason"]'
    );

  function updateKKFields() {
    if (!kkInput) {
      return;
    }

    if (kkInput.value === "Yes") {
      if (countWrapper) {
        countWrapper.style.display =
          "flex";
      }

      if (reasonWrapper) {
        reasonWrapper.style.display =
          "none";
      }

      if (countInput) {
        countInput.required =
          true;
      }

      if (reasonInput) {
        reasonInput.required =
          false;

        reasonInput.value =
          "";
      }

    } else if (
      kkInput.value === "No"
    ) {

      if (countWrapper) {
        countWrapper.style.display =
          "none";
      }

      if (reasonWrapper) {
        reasonWrapper.style.display =
          "flex";
      }

      if (countInput) {
        countInput.required =
          false;

        countInput.value =
          "";
      }

      if (reasonInput) {
        reasonInput.required =
          true;
      }

    } else {

      if (countWrapper) {
        countWrapper.style.display =
          "none";
      }

      if (reasonWrapper) {
        reasonWrapper.style.display =
          "none";
      }

      if (countInput) {
        countInput.required =
          false;

        countInput.value =
          "";
      }

      if (reasonInput) {
        reasonInput.required =
          false;

        reasonInput.value =
          "";
      }
    }
  }

  if (kkInput) {
    kkInput.addEventListener(
      "change",
      updateKKFields
    );

    updateKKFields();
  }
}


// =====================================================
// OPEN YOUTH DIALOG
// =====================================================

function openYouthDialog(youthId) {
  if (
    !youthDialog ||
    !idInput
  ) {
    return;
  }

  if (youthId) {
    const existing =
      youthList.find(
        youth =>
          youth.id === youthId
      );

    if (youthDialogTitle) {
      youthDialogTitle.textContent =
        "Edit Youth Profile";
    }

    idInput.value =
      youthId;

    buildYouthFields(
      existing || {}
    );

  } else {

    if (youthDialogTitle) {
      youthDialogTitle.textContent =
        "Add Youth Profile";
    }

    idInput.value = "";

    buildYouthFields({});
  }

  youthDialog.showModal();
}


// =====================================================
// SAVE YOUTH
// =====================================================

if (saveYouthBtn) {
  saveYouthBtn.addEventListener(
    "click",
    async () => {

      saveYouthBtn.disabled =
        true;

      saveYouthBtn.textContent =
        "Saving...";

      const payload = {};

      FIELDS.forEach(
        field => {
          const input =
            youthFieldsEl
              ?.querySelector(
                `[name="${field.key}"]`
              );

          if (!input) {
            return;
          }

          payload[field.key] =
            field.type === "number"
              ? Number(input.value)
              : input.value.trim();
        }
      );

      payload.address =
        normalizePurok(
          payload.address
        );

      if (payload.birthDate) {
        const calculatedAge =
          calculateAge(
            payload.birthDate
          );

        if (calculatedAge === null) {
          alert(
            "Please enter a valid birth date."
          );

          saveYouthBtn.disabled =
            false;

          saveYouthBtn.textContent =
            "Save Profile";

          return;
        }

        payload.age =
          calculatedAge;
      }

      if (
        payload.kkAssemblyAttended ===
          "Yes" &&
        !payload.kkAttendanceCount
      ) {
        alert(
          "Please indicate how many times the youth attended a KK Assembly."
        );

        saveYouthBtn.disabled =
          false;

        saveYouthBtn.textContent =
          "Save Profile";

        return;
      }

      if (
        payload.kkAssemblyAttended ===
          "No" &&
        !payload.kkNoReason
      ) {
        alert(
          "Please indicate why the youth has not attended a KK Assembly."
        );

        saveYouthBtn.disabled =
          false;

        saveYouthBtn.textContent =
          "Save Profile";

        return;
      }

      if (
        payload.kkAssemblyAttended ===
        "Yes"
      ) {
        payload.kkNoReason = "";
      }

      if (
        payload.kkAssemblyAttended ===
        "No"
      ) {
        payload.kkAttendanceCount =
          "";
      }

      const youthStatus =
        getYouthStatus(
          payload.age
        );

      payload.status =
        youthStatus.status;

      payload.eligibility =
        youthStatus.eligibility;

      payload.role = "youth";

      payload.updatedAt =
        new Date();

      try {

        if (idInput.value) {

          await updateDoc(
            doc(
              db,
              "users",
              idInput.value
            ),
            payload
          );

          safeLogActivity({
            email:
              auth.currentUser?.email,

            role:
              "admin",

            activity:
              "Edited youth profile",

            details:
              `${payload.fullName} • Purok: ${
                payload.address ||
                "N/A"
              } • Age ${payload.age} • SK Voter: ${
                payload.registeredSKVoter ||
                "N/A"
              } • KK Assembly: ${
                payload.kkAssemblyAttended ||
                "N/A"
              }`
          });

        } else {

          payload.createdAt =
            new Date();

          await addDoc(
            collection(
              db,
              "users"
            ),
            payload
          );

          safeLogActivity({
            email:
              auth.currentUser?.email,

            role:
              "admin",

            activity:
              "Added youth profile",

            details:
              `${payload.fullName} • Purok: ${
                payload.address ||
                "N/A"
              } • Age ${payload.age}`
          });
        }

        youthDialog.close();

        await loadUsersData();

        alert(
          "Youth profile saved!"
        );

      } catch (error) {

        console.error(
          "Save youth error:",
          error
        );

        alert(
          "Something went wrong while saving. Please try again."
        );

      } finally {

        saveYouthBtn.disabled =
          false;

        saveYouthBtn.textContent =
          "Save Profile";
      }
    }
  );
}


// =====================================================
// DELETE YOUTH
// =====================================================

async function deleteYouth(youthId) {
  const confirmed =
    confirm(
      "Are you sure you want to delete this youth profile? This cannot be undone."
    );

  if (!confirmed) {
    return;
  }

  const target =
    youthList.find(
      youth =>
        youth.id === youthId
    );

  try {

    await deleteDoc(
      doc(
        db,
        "users",
        youthId
      )
    );

    safeLogActivity({
      email:
        auth.currentUser?.email,

      role:
        "admin",

      activity:
        "Deleted youth profile",

      details:
        target?.fullName ||
        youthId
    });

    await loadUsersData();

  } catch (error) {

    console.error(
      "Delete youth error:",
      error
    );

    alert(
      "Something went wrong while deleting. Please try again."
    );
  }
}


// =====================================================
// REPORTS
// ADVANCED FILTERED ANALYTICS
// =====================================================

// =====================================================
// REPORT ELEMENTS
// =====================================================

const reportFilterPurok =
  document.getElementById(
    "reportFilterPurok"
  );

const reportFilterGender =
  document.getElementById(
    "reportFilterGender"
  );

const reportFilterAge =
  document.getElementById(
    "reportFilterAge"
  );

const reportFilterEducation =
  document.getElementById(
    "reportFilterEducation"
  );

const reportFilterEducationStatus =
  document.getElementById(
    "reportFilterEducationStatus"
  );

const reportFilterEmployment =
  document.getElementById(
    "reportFilterEmployment"
  );

const reportFilterVoter =
  document.getElementById(
    "reportFilterVoter"
  );

const reportFilterSKVoter =
  document.getElementById(
    "reportFilterSKVoter"
  );

const reportFilterKK =
  document.getElementById(
    "reportFilterKK"
  );

const reportFilterCivic =
  document.getElementById(
    "reportFilterCivic"
  );

const reportFilterSpecialNeeds =
  document.getElementById(
    "reportFilterSpecialNeeds"
  );

const reportFilterStatus =
  document.getElementById(
    "reportFilterStatus"
  );

const clearReportFiltersBtn =
  document.getElementById(
    "clearReportFilters"
  );

const reportContext =
  document.getElementById(
    "reportContext"
  );

const reportRecordCount =
  document.getElementById(
    "reportRecordCount"
  );

const reportInsights =
  document.getElementById(
    "reportInsights"
  );

const reportRecommendations =
  document.getElementById(
    "reportRecommendations"
  );

const reportTableBody =
  document.getElementById(
    "reportTableBody"
  );


// =====================================================
// POPULATE REPORT FILTER OPTIONS
// =====================================================

function populateReportFilterOptions() {

  if (reportFilterPurok) {

    reportFilterPurok.innerHTML =
      `<option value="">All Purok / Area</option>` +
      PUROK_OPTIONS
        .map(
          option =>
            `
              <option value="${escapeHtml(option)}">
                ${escapeHtml(option)}
              </option>
            `
        )
        .join("");

  }


  if (reportFilterEducation) {

    const options = [
      "Elementary",
      "High School",
      "Senior High School",
      "College",
      "Vocational",
      "Graduate",
      "Out of School Youth"
    ];


    reportFilterEducation.innerHTML =
      `<option value="">All Education Levels</option>` +
      options
        .map(
          option =>
            `
              <option value="${escapeHtml(option)}">
                ${escapeHtml(option)}
              </option>
            `
        )
        .join("");

  }

}


// =====================================================
// REPORT AGE FILTER
// =====================================================

function matchesReportAgeGroup(
  age,
  selectedGroup
) {

  if (!selectedGroup) {
    return true;
  }


  const numericAge =
    Number(age);


  if (
    Number.isNaN(
      numericAge
    )
  ) {
    return false;
  }


  if (
    selectedGroup ===
    "15-17"
  ) {

    return (
      numericAge >= 15 &&
      numericAge <= 17
    );

  }


  if (
    selectedGroup ===
    "18-24"
  ) {

    return (
      numericAge >= 18 &&
      numericAge <= 24
    );

  }


  if (
    selectedGroup ===
    "25-30"
  ) {

    return (
      numericAge >= 25 &&
      numericAge <= 30
    );

  }


  return true;

}


// =====================================================
// GET FILTERED REPORT YOUTH
// =====================================================

function getReportYouth() {

  return youthList.filter(
    youth => {

      const matchesPurok =
        !reportFilterPurok?.value ||
        normalizePurok(
          youth.address
        ) ===
          reportFilterPurok.value;


      const matchesGender =
        !reportFilterGender?.value ||
        youth.gender ===
          reportFilterGender.value;


      const matchesAge =
        matchesReportAgeGroup(
          youth.age,
          reportFilterAge?.value ||
          ""
        );


      const matchesEducation =
        !reportFilterEducation?.value ||
        youth.education ===
          reportFilterEducation.value;


      const matchesEducationStatus =
        !reportFilterEducationStatus?.value ||
        youth.educationStatus ===
          reportFilterEducationStatus.value;


      const matchesEmployment =
        !reportFilterEmployment?.value ||
        youth.employment ===
          reportFilterEmployment.value;


      const matchesVoter =
        !reportFilterVoter?.value ||
        youth.voterStatus ===
          reportFilterVoter.value;


      const matchesSKVoter =
        !reportFilterSKVoter?.value ||
        youth.registeredSKVoter ===
          reportFilterSKVoter.value;


      const matchesKK =
        !reportFilterKK?.value ||
        youth.kkAssemblyAttended ===
          reportFilterKK.value;


      const matchesCivic =
        !reportFilterCivic?.value ||
        youth.civic ===
          reportFilterCivic.value;


      const matchesSpecialNeeds =
        !reportFilterSpecialNeeds?.value ||
        youth.specialNeeds ===
          reportFilterSpecialNeeds.value;


      let matchesStatus =
        true;


      if (
        reportFilterStatus?.value ===
        "Active"
      ) {

        matchesStatus =
          isActiveYouth(
            youth
          );

      }


      if (
        reportFilterStatus?.value ===
        "Inactive"
      ) {

        matchesStatus =
          !isActiveYouth(
            youth
          );

      }


      return (
        matchesPurok &&
        matchesGender &&
        matchesAge &&
        matchesEducation &&
        matchesEducationStatus &&
        matchesEmployment &&
        matchesVoter &&
        matchesSKVoter &&
        matchesKK &&
        matchesCivic &&
        matchesSpecialNeeds &&
        matchesStatus
      );

    }
  );

}


// =====================================================
// REPORT CONTEXT / ACTIVE FILTER DESCRIPTION
// =====================================================

function updateReportContext(
  filtered
) {

  if (!reportContext) {
    return;
  }


  const filters = [];


  function addFilter(
    label,
    value
  ) {

    if (value) {

      filters.push(
        `${label}: ${value}`
      );

    }

  }


  addFilter(
    "Purok",
    reportFilterPurok?.value
  );

  addFilter(
    "Gender",
    reportFilterGender?.value
  );

  addFilter(
    "Age Group",
    reportFilterAge?.value
  );

  addFilter(
    "Education",
    reportFilterEducation?.value
  );

  addFilter(
    "Education Status",
    reportFilterEducationStatus?.value
  );

  addFilter(
    "Employment",
    reportFilterEmployment?.value
  );

  addFilter(
    "Voter",
    reportFilterVoter?.value
  );

  addFilter(
    "SK Voter",
    reportFilterSKVoter?.value
  );

  addFilter(
    "KK Assembly",
    reportFilterKK?.value
  );

  addFilter(
    "Civic Participation",
    reportFilterCivic?.value
  );

  addFilter(
    "Special Needs",
    reportFilterSpecialNeeds?.value
  );

  addFilter(
    "Status",
    reportFilterStatus?.value
  );


  const description =
    filters.length
      ? filters.join(" • ")
      : "Showing all registered youth records.";


  reportContext.innerHTML = `

    <strong>
      Current Report:
    </strong>

    <span>
      ${escapeHtml(
        description
      )}
    </span>

  `;


  if (reportRecordCount) {

    reportRecordCount.textContent =
      `${filtered.length} record${
        filtered.length === 1
          ? ""
          : "s"
      }`;

  }

}


// =====================================================
// REPORT SUMMARY
// =====================================================

function renderReportSummary(
  filtered
) {

  const reportSummary =
    document.getElementById(
      "reportSummary"
    );


  if (!reportSummary) {
    return;
  }


  const total =
    filtered.length;


  if (!total) {

    reportSummary.innerHTML = `

      <p class="empty-state">
        No youth records match the selected report filters.
      </p>

    `;

    return;

  }


  const active =
    filtered.filter(
      isActiveYouth
    ).length;


  const male =
    filtered.filter(
      youth =>
        youth.gender ===
        "Male"
    ).length;


  const female =
    filtered.filter(
      youth =>
        youth.gender ===
        "Female"
    ).length;


  const skVoters =
    filtered.filter(
      youth =>
        youth.registeredSKVoter ===
        "Yes"
    ).length;


  const kkAttended =
    filtered.filter(
      youth =>
        youth.kkAssemblyAttended ===
        "Yes"
    ).length;


  const specialNeeds =
    filtered.filter(
      youth =>
        youth.specialNeeds ===
        "Yes"
    ).length;


  const validAges =
    filtered
      .map(
        youth =>
          Number(
            youth.age
          )
      )
      .filter(
        age =>
          !Number.isNaN(age)
      );


  const averageAge =
    validAges.length
      ? (
          validAges.reduce(
            (
              sum,
              age
            ) =>
              sum + age,
            0
          )
          /
          validAges.length
        ).toFixed(1)
      : "—";


  const cards = [

    {
      label:
        "Total Records",

      value:
        total,

      detail:
        "Youth included in report"
    },

    {
      label:
        "Active Youth",

      value:
        active,

      detail:
        `${percentage(
          active,
          total
        )}% of selected records`
    },

    {
      label:
        "Average Age",

      value:
        averageAge,

      detail:
        "Average selected youth age"
    },

    {
      label:
        "Male",

      value:
        male,

      detail:
        `${percentage(
          male,
          total
        )}% of records`
    },

    {
      label:
        "Female",

      value:
        female,

      detail:
        `${percentage(
          female,
          total
        )}% of records`
    },

    {
      label:
        "SK Voters",

      value:
        skVoters,

      detail:
        `${percentage(
          skVoters,
          total
        )}% registered`
    },

    {
      label:
        "KK Participants",

      value:
        kkAttended,

      detail:
        `${percentage(
          kkAttended,
          total
        )}% attended`
    },

    {
      label:
        "Special Needs",

      value:
        specialNeeds,

      detail:
        `${percentage(
          specialNeeds,
          total
        )}% of selected records`
    }

  ];


  reportSummary.innerHTML =
    cards
      .map(
        card => `

          <article
            class="summary-box report-metric-card"
          >

            <small>
              ${escapeHtml(
                card.label
              )}
            </small>

            <strong
              class="report-metric-value"
            >
              ${escapeHtml(
                card.value
              )}
            </strong>

            <p>
              ${escapeHtml(
                card.detail
              )}
            </p>

          </article>

        `
      )
      .join("");

}


// =====================================================
// ANALYTICAL FINDINGS
// =====================================================

function buildReportInsights(
  filtered
) {

  const total =
    filtered.length;


  if (!total) {
    return [];
  }


  const findings = [];


  function addFinding(
    category,
    title,
    text
  ) {

    findings.push({
      category,
      title,
      text
    });

  }


  const topPurok =
    getTopCountEntry(
      countBy(
        filtered,
        youth =>
          normalizePurok(
            youth.address
          )
      )
    );


  if (topPurok) {

    addFinding(
      "Location",
      "Highest Youth Concentration",
      `${topPurok[0]} has the highest number of youth in this report with ${topPurok[1]} record${
        topPurok[1] === 1
          ? ""
          : "s"
      }, representing ${percentage(
        topPurok[1],
        total
      )}% of the selected data.`
    );

  }


  const topEducation =
    getTopCountEntry(
      countBy(
        filtered,
        youth =>
          youth.education
      )
    );


  if (topEducation) {

    addFinding(
      "Education",
      "Most Common Educational Attainment",
      `${topEducation[0]} is the most common educational attainment among the selected youth with ${topEducation[1]} record${
        topEducation[1] === 1
          ? ""
          : "s"
      } (${percentage(
        topEducation[1],
        total
      )}%).`
    );

  }


  const unemployed =
    filtered.filter(
      youth =>
        youth.employment ===
        "Unemployed"
    ).length;


  if (unemployed > 0) {

    addFinding(
      "Employment",
      "Unemployment Indicator",
      `${unemployed} of ${total} selected youth (${percentage(
        unemployed,
        total
      )}%) are recorded as unemployed.`
    );

  }


  const notStudying =
    filtered.filter(
      youth =>
        youth.educationStatus ===
          "Not Studying" ||
        youth.education ===
          "Out of School Youth"
    ).length;


  if (notStudying > 0) {

    addFinding(
      "Education",
      "Youth Not Currently Studying",
      `${notStudying} selected youth (${percentage(
        notStudying,
        total
      )}%) are not currently studying or are classified as out-of-school youth.`
    );

  }


  const noSKVoter =
    filtered.filter(
      youth =>
        youth.registeredSKVoter ===
        "No"
    ).length;


  if (noSKVoter > 0) {

    addFinding(
      "Civic",
      "SK Voter Registration Gap",
      `${noSKVoter} of ${total} youth (${percentage(
        noSKVoter,
        total
      )}%) are not recorded as registered SK voters.`
    );

  }


  const noKK =
    filtered.filter(
      youth =>
        youth.kkAssemblyAttended ===
        "No"
    ).length;


  if (noKK > 0) {

    addFinding(
      "KK Assembly",
      "KK Participation Gap",
      `${noKK} of ${total} selected youth (${percentage(
        noKK,
        total
      )}%) have never attended a KK Assembly.`
    );

  }


  const lowCivic =
    filtered.filter(
      youth =>
        youth.civic ===
          "Occasional" ||
        youth.civic ===
          "Not Active"
    ).length;


  if (lowCivic > 0) {

    addFinding(
      "Community",
      "Civic Participation",
      `${lowCivic} selected youth (${percentage(
        lowCivic,
        total
      )}%) report occasional or no active civic participation.`
    );

  }


  const specialNeeds =
    filtered.filter(
      youth =>
        youth.specialNeeds ===
        "Yes"
    ).length;


  if (specialNeeds > 0) {

    addFinding(
      "Inclusion",
      "Youth Requiring Additional Support",
      `${specialNeeds} selected youth profile${
        specialNeeds === 1
          ? ""
          : "s"
      } indicate special needs or possible assistance requirements.`
    );

  }


  const topSport =
    getTopCountEntry(
      countMultiValueField(
        filtered,
        "sports"
      )
    );


  if (topSport) {

    addFinding(
      "Sports",
      "Most Common Sports Interest",
      `${topSport[0]} is the most frequently recorded sports interest with ${topSport[1]} response${
        topSport[1] === 1
          ? ""
          : "s"
      }.`
    );

  }


  return findings.slice(
    0,
    8
  );

}


// =====================================================
// RENDER ANALYTICAL FINDINGS
// =====================================================

function renderReportInsights(
  filtered
) {

  if (!reportInsights) {
    return;
  }


  const findings =
    buildReportInsights(
      filtered
    );


  if (!findings.length) {

    reportInsights.innerHTML = `

      <p class="empty-state">
        No analytical finding can be generated from the selected records.
      </p>

    `;

    return;

  }


  reportInsights.innerHTML =
    findings
      .map(
        finding => `

          <article
            class="report-insight-card"
          >

            <small>
              ${escapeHtml(
                finding.category
              )}
            </small>

            <h4>
              ${escapeHtml(
                finding.title
              )}
            </h4>

            <p>
              ${escapeHtml(
                finding.text
              )}
            </p>

          </article>

        `
      )
      .join("");

}


// =====================================================
// REPORT RECOMMENDATIONS
// =====================================================

function buildReportRecommendations(
  filtered
) {

  const total =
    filtered.length;


  if (!total) {
    return [];
  }


  const recommendations = [];

  const usedTitles =
    new Set();


  function addRecommendation(
    category,
    title,
    description,
    basis
  ) {

    if (
      usedTitles.has(
        title
      )
    ) {
      return;
    }


    usedTitles.add(
      title
    );


    recommendations.push({
      category,
      title,
      description,
      basis
    });

  }


  const unemployed =
    filtered.filter(
      youth =>
        youth.employment ===
        "Unemployed"
    ).length;


  if (
    unemployed > 0 &&
    percentage(
      unemployed,
      total
    ) >= 15
  ) {

    addRecommendation(
      "Employment",
      "Job Readiness & Employment Assistance",
      "Conduct resume preparation, interview coaching, job-search orientation, digital skills training, or local employment referral activities.",
      `${unemployed} of ${total} selected youth (${percentage(
        unemployed,
        total
      )}%) are unemployed.`
    );

  }


  const notStudying =
    filtered.filter(
      youth =>
        youth.educationStatus ===
          "Not Studying" ||
        youth.education ===
          "Out of School Youth"
    ).length;


  if (
    notStudying > 0 &&
    percentage(
      notStudying,
      total
    ) >= 10
  ) {

    addRecommendation(
      "Education",
      "Alternative Learning & Skills Training",
      "Coordinate livelihood training, technical skills workshops, digital-skills programs, or alternative learning opportunities.",
      `${notStudying} of ${total} youth (${percentage(
        notStudying,
        total
      )}%) are not currently studying or are recorded as out-of-school youth.`
    );

  }


  const noKK =
    filtered.filter(
      youth =>
        youth.kkAssemblyAttended ===
        "No"
    ).length;


  if (
    noKK > 0 &&
    percentage(
      noKK,
      total
    ) >= 20
  ) {

    addRecommendation(
      "KK Assembly",
      "KK Assembly Participation Campaign",
      "Use targeted invitations, youth consultations, reminders, and information campaigns to encourage stronger KK Assembly participation.",
      `${noKK} of ${total} selected youth (${percentage(
        noKK,
        total
      )}%) have not attended a KK Assembly.`
    );

  }


  const noSKVoter =
    filtered.filter(
      youth =>
        youth.registeredSKVoter ===
        "No"
    ).length;


  if (
    noSKVoter > 0 &&
    percentage(
      noSKVoter,
      total
    ) >= 15
  ) {

    addRecommendation(
      "Civic",
      "SK Voter Information Drive",
      "Provide information about SK voter registration, responsible voting, and youth participation in local governance.",
      `${noSKVoter} of ${total} selected youth (${percentage(
        noSKVoter,
        total
      )}%) are not recorded as registered SK voters.`
    );

  }


  const lowCivic =
    filtered.filter(
      youth =>
        youth.civic ===
          "Not Active" ||
        youth.civic ===
          "Occasional"
    ).length;


  if (
    lowCivic > 0 &&
    percentage(
      lowCivic,
      total
    ) >= 20
  ) {

    addRecommendation(
      "Community",
      "Youth Volunteer & Leadership Program",
      "Organize community service, environmental projects, leadership sessions, youth consultations, or barangay volunteer activities.",
      `${lowCivic} of ${total} selected youth (${percentage(
        lowCivic,
        total
      )}%) report low or occasional civic participation.`
    );

  }


  const specialNeeds =
    filtered.filter(
      youth =>
        youth.specialNeeds ===
        "Yes"
    ).length;


  if (specialNeeds > 0) {

    addRecommendation(
      "Inclusion",
      "Inclusive Youth Assistance Program",
      "Review the recorded assistance needs and ensure SK programs, facilities, communication, and activities are accessible and inclusive.",
      `${specialNeeds} youth profile${
        specialNeeds === 1
          ? ""
          : "s"
      } in this report indicate special needs.`
    );

  }


  const topSport =
    getTopCountEntry(
      countMultiValueField(
        filtered,
        "sports"
      )
    );


  if (
    topSport &&
    topSport[1] > 0
  ) {

    addRecommendation(
      "Sports",
      `${topSport[0]} Sports Activity / Clinic`,
      `Consider organizing a ${topSport[0]} clinic, tournament, recreation day, or youth league.`,
      `${topSport[0]} is the most common listed sports interest with ${topSport[1]} response${
        topSport[1] === 1
          ? ""
          : "s"
      }.`
    );

  }


  const topHobby =
    getTopCountEntry(
      countMultiValueField(
        filtered,
        "hobbies"
      )
    );


  if (
    topHobby &&
    topHobby[1] > 0
  ) {

    addRecommendation(
      "Interests",
      `${topHobby[0]} Youth Skills Activity`,
      `Consider a workshop, peer-learning session, showcase, training, or youth club related to ${topHobby[0]}.`,
      `${topHobby[0]} is a commonly listed youth hobby or skill with ${topHobby[1]} response${
        topHobby[1] === 1
          ? ""
          : "s"
      }.`
    );

  }


  if (
    recommendations.length ===
    0
  ) {

    addRecommendation(
      "General",
      "Youth Development Consultation",
      "Conduct a youth consultation to identify current concerns, interests, and priorities for future SK programs.",
      `Recommendation based on ${total} selected youth record${
        total === 1
          ? ""
          : "s"
      }.`
    );

  }


  return recommendations.slice(
    0,
    6
  );

}


// =====================================================
// RENDER REPORT RECOMMENDATIONS
// =====================================================

function renderReportRecommendations(
  filtered
) {

  if (!reportRecommendations) {
    return;
  }


  const recommendations =
    buildReportRecommendations(
      filtered
    );


  if (!recommendations.length) {

    reportRecommendations.innerHTML = `

      <p class="empty-state">
        No recommendation can be generated from the selected data.
      </p>

    `;

    return;

  }


  reportRecommendations.innerHTML =
    recommendations
      .map(
        recommendation => `

          <article
            class="report-insight-card recommendation"
          >

            <small>
              ${escapeHtml(
                recommendation.category
              )}
            </small>

            <h4>
              ${escapeHtml(
                recommendation.title
              )}
            </h4>

            <p>
              ${escapeHtml(
                recommendation.description
              )}
            </p>

            <span
              class="report-data-basis"
            >
              Data basis:
              ${escapeHtml(
                recommendation.basis
              )}
            </span>

          </article>

        `
      )
      .join("");

}


// =====================================================
// REPORT RECORD TABLE
// =====================================================

function renderReportTable(
  filtered
) {

  if (!reportTableBody) {
    return;
  }


  if (!filtered.length) {

    reportTableBody.innerHTML = `

      <tr>

        <td
          colspan="9"
          class="empty-state"
        >
          No youth records match the selected filters.
        </td>

      </tr>

    `;

    return;

  }


  reportTableBody.innerHTML =
    filtered
      .map(
        youth => `

          <tr>

            <td>
              ${escapeHtml(
                youth.fullName ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                youth.age ??
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                youth.gender ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                normalizePurok(
                  youth.address
                ) ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                youth.education ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                youth.employment ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                youth.registeredSKVoter ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                youth.kkAssemblyAttended ||
                "—"
              )}
            </td>

            <td>

              <span
                class="status-pill ${
                  isActiveYouth(
                    youth
                  )
                    ? ""
                    : "off"
                }"
              >
                ${
                  isActiveYouth(
                    youth
                  )
                    ? "Active"
                    : "Inactive"
                }
              </span>

            </td>

          </tr>

        `
      )
      .join("");

}


// =====================================================
// MASTER REPORT RENDERER
// =====================================================

function renderReports() {

  const filtered =
    getReportYouth();


  updateReportContext(
    filtered
  );


  renderReportSummary(
    filtered
  );


  renderReportInsights(
    filtered
  );


  renderReportRecommendations(
    filtered
  );


  renderReportTable(
    filtered
  );

}


// =====================================================
// REPORT FILTER EVENTS
// =====================================================

[
  reportFilterPurok,
  reportFilterGender,
  reportFilterAge,
  reportFilterEducation,
  reportFilterEducationStatus,
  reportFilterEmployment,
  reportFilterVoter,
  reportFilterSKVoter,
  reportFilterKK,
  reportFilterCivic,
  reportFilterSpecialNeeds,
  reportFilterStatus
]
  .filter(
    Boolean
  )
  .forEach(
    element => {

      element.addEventListener(
        "change",
        renderReports
      );

    }
  );


// =====================================================
// CLEAR REPORT FILTERS
// =====================================================

if (
  clearReportFiltersBtn
) {

  clearReportFiltersBtn
    .addEventListener(
      "click",
      () => {

        [
          reportFilterPurok,
          reportFilterGender,
          reportFilterAge,
          reportFilterEducation,
          reportFilterEducationStatus,
          reportFilterEmployment,
          reportFilterVoter,
          reportFilterSKVoter,
          reportFilterKK,
          reportFilterCivic,
          reportFilterSpecialNeeds,
          reportFilterStatus
        ]
          .filter(
            Boolean
          )
          .forEach(
            element => {

              element.value =
                "";

            }
          );


        renderReports();

      }
    );

}


// =====================================================
// PRINT / PDF
// =====================================================

const printReportBtn =
  document.getElementById(
    "printReportBtn"
  );


if (
  printReportBtn
) {

  printReportBtn.addEventListener(
    "click",
    () => {

      const filtered =
        getReportYouth();


      if (!filtered.length) {

        alert(
          "There are no records to include in this report."
        );

        return;

      }


      safeLogActivity({

        email:
          auth.currentUser?.email,

        role:
          "admin",

        activity:
          "Exported filtered report",

        details:
          `Print / PDF youth analytics report • ${filtered.length} record(s)`

      });


      window.print();

    }
  );

}


// =====================================================
// FILTERED CSV EXPORT
// =====================================================

const downloadCsvBtn =
  document.getElementById(
    "downloadCsvBtn"
  );


if (
  downloadCsvBtn
) {

  downloadCsvBtn.addEventListener(
    "click",
    () => {

      const filtered =
        getReportYouth();


      if (!filtered.length) {

        alert(
          "There are no records to export."
        );

        return;

      }


      const headers = [

        {
          key:
            "fullName",
          label:
            "Full Name"
        },

        {
          key:
            "email",
          label:
            "Email"
        },

        {
          key:
            "birthDate",
          label:
            "Birth Date"
        },

        {
          key:
            "age",
          label:
            "Age"
        },

        {
          key:
            "gender",
          label:
            "Gender"
        },

        {
          key:
            "civilStatus",
          label:
            "Civil Status"
        },

        {
          key:
            "address",
          label:
            "Purok / Area"
        },

        {
          key:
            "contact",
          label:
            "Contact Number"
        },

        {
          key:
            "education",
          label:
            "Educational Attainment"
        },

        {
          key:
            "educationStatus",
          label:
            "Education Status"
        },

        {
          key:
            "employment",
          label:
            "Employment"
        },

        {
          key:
            "civic",
          label:
            "Civic Participation"
        },

        {
          key:
            "voterStatus",
          label:
            "Voter Registration"
        },

        {
          key:
            "newVoter",
          label:
            "New Voter Status"
        },

        {
          key:
            "voterParticipation",
          label:
            "Voter Participation"
        },

        {
          key:
            "registeredSKVoter",
          label:
            "Registered SK Voter"
        },

        {
          key:
            "votedLastSKElection",
          label:
            "Voted Last SK Election"
        },

        {
          key:
            "kkAssemblyAttended",
          label:
            "KK Assembly Attendance"
        },

        {
          key:
            "kkAttendanceCount",
          label:
            "KK Attendance Frequency"
        },

        {
          key:
            "kkNoReason",
          label:
            "Reason for Not Attending KK"
        },

        {
          key:
            "specialNeeds",
          label:
            "Special Needs"
        },

        {
          key:
            "assistance",
          label:
            "Assistance Needed"
        },

        {
          key:
            "hobbies",
          label:
            "Hobbies / Skills"
        },

        {
          key:
            "sports",
          label:
            "Sports Interests"
        },

        {
          key:
            "status",
          label:
            "Youth Status"
        }

      ];


      const csvHeader =
        headers
          .map(
            header =>
              `"${header.label}"`
          )
          .join(",");


      const rows =
        filtered
          .map(
            youth => {

              return headers
                .map(
                  header => {

                    let value =
                      youth[
                        header.key
                      ] ??
                      "";


                    if (
                      header.key ===
                      "address"
                    ) {

                      value =
                        normalizePurok(
                          value
                        );

                    }


                    if (
                      header.key ===
                      "status"
                    ) {

                      value =
                        isActiveYouth(
                          youth
                        )
                          ? "Active"
                          : "Inactive / Archived";

                    }


                    return `"${String(
                      value
                    ).replace(
                      /"/g,
                      '""'
                    )}"`;

                  }
                )
                .join(",");

            }
          );


      const csv =
        [
          csvHeader,
          ...rows
        ].join(
          "\n"
        );


      const blob =
        new Blob(
          [
            "\ufeff",
            csv
          ],
          {
            type:
              "text/csv;charset=utf-8;"
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      const today =
        getLocalDateString();


      link.href =
        url;


      link.download =
        `Bukal-Youth-Report-${today}.csv`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      URL.revokeObjectURL(
        url
      );


      safeLogActivity({

        email:
          auth.currentUser?.email,

        role:
          "admin",

        activity:
          "Exported filtered report",

        details:
          `Downloaded filtered youth report CSV • ${filtered.length} record(s)`

      });

    }
  );

}


// =====================================================
// INITIALIZE REPORT FILTER OPTIONS
// =====================================================

populateReportFilterOptions();


// =====================================================
// ANNOUNCEMENT ELEMENTS
// =====================================================

const announcementDialog =
  document.getElementById(
    "announcementDialog"
  );

const announcementDialogTitle =
  document.getElementById(
    "announcementDialogTitle"
  );

const announcementForm =
  document.getElementById(
    "announcementForm"
  );

const announcementIdInput =
  announcementForm
    ?.querySelector(
      '[name="announcementId"]'
    );

const announcementCategoryInput =
  announcementForm
    ?.querySelector(
      '[name="announcementCategory"]'
    );

const announcementTitleInput =
  announcementForm
    ?.querySelector(
      '[name="announcementTitle"]'
    );

const announcementMessageInput =
  announcementForm
    ?.querySelector(
      '[name="announcementMessage"]'
    );

const announcementExpiryDateInput =
  announcementForm
    ?.querySelector(
      '[name="announcementExpiryDate"]'
    );

const announcementImageInput =
  announcementForm
    ?.querySelector(
      '[name="announcementImage"]'
    );

const saveAnnouncementBtn =
  document.getElementById(
    "saveAnnouncementBtn"
  );

const openAddAnnouncementBtn =
  document.getElementById(
    "openAddAnnouncement"
  );


// =====================================================
// LOAD ANNOUNCEMENTS
// =====================================================

async function loadAnnouncements() {
  const body =
    document.getElementById(
      "announcementTableBody"
    );

  if (!body) {
    return;
  }

  body.innerHTML = `
    <tr>
      <td
        colspan="6"
        class="empty-state"
      >
        Loading announcements...
      </td>
    </tr>
  `;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "announcements"
        )
      );

    let loadedAnnouncements =
      snap.docs.map(
        documentSnapshot => ({
          id:
            documentSnapshot.id,

          ...documentSnapshot.data()
        })
      );

    loadedAnnouncements =
      await deleteExpiredAnnouncements(
        loadedAnnouncements
      );

    announcementList =
      loadedAnnouncements;

    announcementList.sort(
      (a, b) => {

        const aDate =
          getCreatedDate(
            a.createdAt
          );

        const bDate =
          getCreatedDate(
            b.createdAt
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

    renderAnnouncementTable();

  } catch (error) {

    console.error(
      "Announcement load error:",
      error
    );

    body.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty-state"
        >
          Unable to load announcements.
        </td>
      </tr>
    `;
  }
}


// =====================================================
// RENDER ANNOUNCEMENTS
// =====================================================

function renderAnnouncementTable() {
  const body =
    document.getElementById(
      "announcementTableBody"
    );

  const countText =
    document.getElementById(
      "announcementCountText"
    );

  if (!body) {
    return;
  }

  if (
    announcementList.length === 0
  ) {
    body.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty-state"
        >
          No announcements available.
        </td>
      </tr>
    `;

    if (countText) {
      countText.textContent =
        "0 announcements";
    }

    return;
  }

  body.innerHTML =
    announcementList
      .map(
        announcement => {

          const createdDate =
            getCreatedDate(
              announcement.createdAt
            );

          const formattedDate =
            createdDate
              ? createdDate
                  .toLocaleDateString(
                    "en-PH",
                    {
                      year:
                        "numeric",

                      month:
                        "short",

                      day:
                        "numeric"
                    }
                  )
              : "—";

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
                        "short",

                      day:
                        "numeric"
                    }
                  )
              : "—";

          return `
            <tr>

              <td>
                ${escapeHtml(
                  formattedDate
                )}
              </td>

              <td>
                ${escapeHtml(
                  announcement.category ||
                  "General"
                )}
              </td>

              <td>
                ${escapeHtml(
                  announcement.title ||
                  ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  announcement.message ||
                  ""
                )}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    formattedExpiry
                  )}
                </strong>

                <small
                  style="
                    display:block;
                    margin-top:5px;
                    color:#71838a;
                  "
                >
                  Visible through this date
                </small>
              </td>

              <td>
                <div class="action-row">

                  <button
                    class="action-btn edit"
                    data-edit-announcement="${announcement.id}"
                    type="button"
                    title="Edit Announcement"
                  >
                    ✎
                  </button>

                  <button
                    class="action-btn delete"
                    data-delete-announcement="${announcement.id}"
                    type="button"
                    title="Delete Announcement"
                  >
                    🗑
                  </button>

                </div>
              </td>

            </tr>
          `;
        }
      )
      .join("");

  if (countText) {
    countText.textContent =
      `${announcementList.length} announcement${
        announcementList.length === 1
          ? ""
          : "s"
      }`;
  }

  document
    .querySelectorAll(
      "[data-edit-announcement]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            openAnnouncementDialog(
              button.dataset
                .editAnnouncement
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      "[data-delete-announcement]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            deleteAnnouncement(
              button.dataset
                .deleteAnnouncement
            );
          }
        );
      }
    );
}


// =====================================================
// OPEN ANNOUNCEMENT DIALOG
// =====================================================

function openAnnouncementDialog(
  announcementId = null
) {

  if (
    !announcementDialog ||
    !announcementIdInput ||
    !announcementCategoryInput ||
    !announcementTitleInput ||
    !announcementMessageInput ||
    !announcementExpiryDateInput
  ) {
    return;
  }

  if (announcementId) {

    const existing =
      announcementList.find(
        announcement =>
          announcement.id ===
          announcementId
      );

    if (!existing) {
      return;
    }

    announcementIdInput.value =
      existing.id;

    announcementCategoryInput.value =
      existing.category ||
      "General";

    announcementTitleInput.value =
      existing.title ||
      "";

    announcementMessageInput.value =
      existing.message ||
      "";

    announcementExpiryDateInput.value =
      existing.expiryDate ||
      "";

    if (announcementDialogTitle) {
      announcementDialogTitle.textContent =
        "Edit Announcement";
    }

  } else {

    announcementIdInput.value =
      "";

    announcementCategoryInput.value =
      "";

    announcementTitleInput.value =
      "";

    announcementMessageInput.value =
      "";

    announcementExpiryDateInput.value =
      getLocalDateString();

    if (announcementDialogTitle) {
      announcementDialogTitle.textContent =
        "New Announcement";
    }
  }

  if (announcementImageInput) {
    announcementImageInput.value =
      "";
  }

  announcementDialog.showModal();
}


// =====================================================
// NEW ANNOUNCEMENT
// =====================================================

if (openAddAnnouncementBtn) {
  openAddAnnouncementBtn
    .addEventListener(
      "click",
      () => {
        openAnnouncementDialog();
      }
    );
}


// =====================================================
// SAVE ANNOUNCEMENT
// =====================================================

if (saveAnnouncementBtn) {
  saveAnnouncementBtn.addEventListener(
    "click",
    async () => {

      if (
        !announcementCategoryInput ||
        !announcementTitleInput ||
        !announcementMessageInput ||
        !announcementExpiryDateInput
      ) {
        return;
      }

      const category =
        announcementCategoryInput
          .value
          .trim();

      const title =
        announcementTitleInput
          .value
          .trim();

      const message =
        announcementMessageInput
          .value
          .trim();

      const expiryDate =
        announcementExpiryDateInput
          .value;

      const selectedImage =
        announcementImageInput
          ?.files?.[0] ||
        null;

      if (
        !category ||
        !title ||
        !message ||
        !expiryDate
      ) {
        alert(
          "Please complete the category, title, announcement message, and Event / Display Until Date."
        );

        return;
      }

      const today =
        getLocalDateString();

      if (expiryDate < today) {
        alert(
          "Event / Display Until Date cannot be earlier than today."
        );

        return;
      }

      if (
        selectedImage &&
        !selectedImage.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "Please select a valid image file."
        );

        return;
      }

      if (
        selectedImage &&
        selectedImage.size >
          10 * 1024 * 1024
      ) {
        alert(
          "Announcement image must not exceed 10 MB."
        );

        return;
      }

      saveAnnouncementBtn.disabled =
        true;

      saveAnnouncementBtn.textContent =
        selectedImage
          ? "Processing Image..."
          : "Saving...";

      try {

        if (
          announcementIdInput
            ?.value
        ) {

          const announcementId =
            announcementIdInput.value;

          const existing =
            announcementList.find(
              announcement =>
                announcement.id ===
                announcementId
            );

          let imageUrl =
            existing?.imageUrl ||
            "";

          if (selectedImage) {
            const processedImage =
              await uploadAnnouncementImage(
                selectedImage
              );

            imageUrl =
              processedImage.imageUrl;
          }

          saveAnnouncementBtn.textContent =
            "Saving...";

          await updateDoc(
            doc(
              db,
              "announcements",
              announcementId
            ),
            {
              category,
              title,
              message,
              expiryDate,
              imageUrl,
              updatedAt:
                new Date()
            }
          );

          safeLogActivity({
            email:
              auth.currentUser?.email,

            role:
              "admin",

            activity:
              "Updated announcement",

            details:
              `${title} • Display until: ${expiryDate}${
                imageUrl
                  ? " • With image"
                  : ""
              }`
          });

          alert(
            "Announcement updated successfully!"
          );

        } else {

          let imageUrl = "";

          if (selectedImage) {
            const processedImage =
              await uploadAnnouncementImage(
                selectedImage
              );

            imageUrl =
              processedImage.imageUrl;
          }

          saveAnnouncementBtn.textContent =
            "Saving...";

          await addDoc(
            collection(
              db,
              "announcements"
            ),
            {
              category,
              title,
              message,
              expiryDate,
              imageUrl,

              createdAt:
                new Date(),

              updatedAt:
                new Date(),

              createdBy:
                auth.currentUser?.email ||
                ""
            }
          );

          safeLogActivity({
            email:
              auth.currentUser?.email,

            role:
              "admin",

            activity:
              "Created announcement",

            details:
              `${title} • Display until: ${expiryDate}${
                imageUrl
                  ? " • With image"
                  : ""
              }`
          });

          alert(
            "Announcement created successfully!"
          );
        }

        announcementDialog?.close();

        await loadAnnouncements();

      } catch (error) {

        console.error(
          "Announcement save error:",
          error
        );

        alert(
          error.message ||
          "Something went wrong while saving the announcement."
        );

      } finally {

        saveAnnouncementBtn.disabled =
          false;

        saveAnnouncementBtn.textContent =
          "Save Announcement";
      }
    }
  );
}


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

async function deleteAnnouncement(
  announcementId
) {
  const target =
    announcementList.find(
      announcement =>
        announcement.id ===
        announcementId
    );

  if (!target) {
    return;
  }

  const confirmed =
    confirm(
      `Delete announcement "${target.title}"? This cannot be undone.`
    );

  if (!confirmed) {
    return;
  }

  try {

    await deleteDoc(
      doc(
        db,
        "announcements",
        announcementId
      )
    );

    safeLogActivity({
      email:
        auth.currentUser?.email,

      role:
        "admin",

      activity:
        "Deleted announcement",

      details:
        target.title
    });

    await loadAnnouncements();

  } catch (error) {

    console.error(
      "Announcement delete error:",
      error
    );

    alert(
      "Something went wrong while deleting the announcement."
    );
  }
}


// =====================================================
// ADMIN / SK ACCOUNTS
// =====================================================

function renderAdminAccounts() {

  const body =
    document.getElementById(
      "accountsTableBody"
    );


  if (!body) {
    return;
  }


  if (
    adminList.length ===
    0
  ) {

    body.innerHTML = `
      <tr>

        <td
          colspan="5"
          class="empty-state"
        >
          No SK administrator accounts found.
        </td>

      </tr>
    `;

    return;

  }


  body.innerHTML =
    adminList
      .map(
        admin => {

          const position =
            getAdminPosition(
              admin
            );


          const status =
            String(
              admin.status ||
              "Active"
            );


          const isActive =
            status.toLowerCase() !==
            "inactive";


          const isCurrentAccount =
            (
              admin.id ===
                auth.currentUser?.uid
            ) ||
            (
              admin.email &&
              auth.currentUser?.email &&
              admin.email.toLowerCase() ===
                auth.currentUser.email.toLowerCase()
            );


          return `

            <tr>

              <td>

                <strong>
                  ${escapeHtml(
                    admin.fullName ||
                    "Unnamed SK Official"
                  )}
                </strong>

                ${
                  isCurrentAccount
                    ? `
                      <small
                        style="
                          display:block;
                          margin-top:4px;
                          color:#0a696d;
                          font-weight:700;
                        "
                      >
                        Signed-in account
                      </small>
                    `
                    : ""
                }

              </td>


              <td>
                ${escapeHtml(
                  admin.email ||
                  "—"
                )}
              </td>


              <td>

                <span
                  class="admin-position-label"
                >
                  ${escapeHtml(
                    position
                  )}
                </span>

              </td>


              <td>

                <span
                  class="status-pill ${
                    isActive
                      ? ""
                      : "off"
                  }"
                >
                  ${
                    isActive
                      ? "Active"
                      : "Inactive"
                  }
                </span>

              </td>


              <td>

                <div class="action-row">

                  ${
                    isCurrentAccount
                      ? `
                        <span
                          class="muted-text"
                          title="You cannot deactivate the account currently signed in."
                        >
                          Current User
                        </span>
                      `
                      : `
                        <button
                          type="button"
                          class="action-btn ${
                            isActive
                              ? "delete"
                              : "edit"
                          }"
                          data-toggle-admin-status="${admin.id}"
                          data-next-status="${
                            isActive
                              ? "Inactive"
                              : "Active"
                          }"
                          title="${
                            isActive
                              ? "Deactivate account"
                              : "Reactivate account"
                          }"
                        >
                          ${
                            isActive
                              ? "⏸"
                              : "✓"
                          }
                        </button>
                      `
                  }

                </div>

              </td>

            </tr>

          `;

        }
      )
      .join("");


  // ===============================================
  // ACTIVE / INACTIVE BUTTONS
  // ===============================================

  body
    .querySelectorAll(
      "[data-toggle-admin-status]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const adminId =
              button.dataset
                .toggleAdminStatus;


            const nextStatus =
              button.dataset
                .nextStatus;


            await toggleAdminStatus(
              adminId,
              nextStatus
            );

          }
        );

      }
    );

}

// =====================================================
// ACTIVATE / DEACTIVATE SK ACCOUNT
// =====================================================

async function toggleAdminStatus(
  adminId,
  nextStatus
) {

  const target =
    adminList.find(
      admin =>
        admin.id ===
        adminId
    );


  if (!target) {

    alert(
      "Administrator account not found."
    );

    return;

  }


  const actionText =
    nextStatus ===
      "Inactive"
      ? "deactivate"
      : "reactivate";


  const confirmed =
    confirm(
      `Are you sure you want to ${actionText} ${target.fullName || "this SK account"}?`
    );


  if (!confirmed) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "users",
        adminId
      ),
      {

        status:
          nextStatus,

        updatedAt:
          new Date()

      }
    );


    safeLogActivity({

      email:
        auth.currentUser?.email ||
        "Admin",

      role:
        "admin",

      activity:
        nextStatus ===
          "Inactive"
          ? "Deactivated SK account"
          : "Reactivated SK account",

      details:
        `${target.fullName || target.email} • ${getAdminPosition(target)} • Status: ${nextStatus}`

    });


    alert(
      `${target.fullName || "SK account"} is now ${nextStatus}.`
    );


    await loadUsersData();


  } catch (error) {

    console.error(
      "Admin status update error:",
      error
    );


    alert(
      "Unable to update the SK account status."
    );

  }

}
// =====================================================
// AUDIT LOG
// =====================================================

async function loadAuditLogs() {
  const tbody =
    document.getElementById(
      "auditTableBody"
    );

  if (!tbody) {
    return;
  }

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "auditLogs"
        )
      );

    const logs =
      snap.docs.map(
        documentSnapshot => ({
          id:
            documentSnapshot.id,

          ...documentSnapshot.data()
        })
      );

    logs.sort(
      (a, b) => {

        const aTime =
          a.timestamp?.toDate
            ? a.timestamp.toDate()
            : new Date(
                a.timestamp
              );

        const bTime =
          b.timestamp?.toDate
            ? b.timestamp.toDate()
            : new Date(
                b.timestamp
              );

        return bTime - aTime;
      }
    );

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="empty-state"
          >
            No activity recorded yet.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML =
      logs
        .map(
          log => {

            const time =
              log.timestamp?.toDate
                ? log.timestamp.toDate()
                : new Date(
                    log.timestamp
                  );

            return `
              <tr>

                <td>
                  ${escapeHtml(
                    time.toLocaleString()
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    log.email
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    log.role
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    log.activity
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    log.details
                  )}
                </td>

              </tr>
            `;
          }
        )
        .join("");

  } catch (error) {

    console.error(
      "Audit load error:",
      error
    );
  }
}


// =====================================================
// CLEAR AUDIT
// =====================================================

const clearAuditBtn =
  document.getElementById(
    "clearAuditBtn"
  );

if (clearAuditBtn) {
  clearAuditBtn.addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "Clear all audit log entries? This cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {

        const snap =
          await getDocs(
            collection(
              db,
              "auditLogs"
            )
          );

        await Promise.all(
          snap.docs.map(
            item =>
              deleteDoc(
                doc(
                  db,
                  "auditLogs",
                  item.id
                )
              )
          )
        );

        await loadAuditLogs();

      } catch (error) {

        console.error(
          "Clear audit error:",
          error
        );

        alert(
          "Something went wrong while clearing the audit logs."
        );
      }
    }
  );
}


// =====================================================
// SIGNED-IN ADMIN
// =====================================================

onAuthStateChanged(
  auth,
  user => {
    if (!user) {
      return;
    }

    updateAdminWelcome(
      user
    );
  }
);


// =====================================================
// INITIALIZE
// =====================================================

populateFilterOptions();

Promise.allSettled([
  loadUsersData(),
  loadAuditLogs(),
  loadAnnouncements()
]);


// =====================================================
// SYSTEM SETTINGS
// BACKUP + RESET BUTTONS
// =====================================================

const backupDataBtn =
  document.getElementById(
    "backupDataBtn"
  );

const resetDemoBtn =
  document.getElementById(
    "resetDemoBtn"
  );


// =====================================================
// DATE FORMATTER FOR BACKUP
// =====================================================

function formatBackupDate(value) {

  if (!value) {
    return "";
  }

  try {

    if (
      typeof value.toDate ===
      "function"
    ) {

      return value
        .toDate()
        .toLocaleString(
          "en-PH"
        );

    }

    if (
      value.seconds
    ) {

      return new Date(
        value.seconds * 1000
      ).toLocaleString(
        "en-PH"
      );

    }

    const date =
      new Date(
        value
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      return date
        .toLocaleString(
          "en-PH"
        );

    }

    return String(
      value
    );

  } catch {

    return String(
      value
    );

  }

}


// =====================================================
// SAFE EXCEL VALUE
// =====================================================

function escapeExcelValue(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    Array.isArray(value)
  ) {

    value =
      value.join(", ");

  }

  if (
    typeof value ===
    "object"
  ) {

    try {

      value =
        JSON.stringify(
          value
        );

    } catch {

      value =
        String(
          value
        );

    }

  }

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    );

}


// =====================================================
// BUILD EXCEL TABLE
// =====================================================

function buildExcelTable(
  title,
  headers,
  rows
) {

  let table = `
    <h2>${escapeExcelValue(title)}</h2>

    <table border="1">

      <thead>

        <tr>
  `;

  headers.forEach(
    header => {

      table += `
        <th
          style="
            background:#0a5255;
            color:#ffffff;
            padding:8px;
            font-weight:bold;
          "
        >
          ${escapeExcelValue(
            header.label
          )}
        </th>
      `;

    }
  );

  table += `
        </tr>

      </thead>

      <tbody>
  `;


  if (
    rows.length ===
    0
  ) {

    table += `
      <tr>

        <td
          colspan="${headers.length}"
          style="
            text-align:center;
            padding:10px;
          "
        >
          No records available
        </td>

      </tr>
    `;

  } else {

    rows.forEach(
      row => {

        table +=
          "<tr>";

        headers.forEach(
          header => {

            let value =
              row[
                header.key
              ];

            if (
              header.date
            ) {

              value =
                formatBackupDate(
                  value
                );

            }

            table += `
              <td
                style="
                  padding:7px;
                  vertical-align:top;
                "
              >
                ${escapeExcelValue(
                  value
                )}
              </td>
            `;

          }
        );

        table +=
          "</tr>";

      }
    );

  }

  table += `
      </tbody>

    </table>

    <br>
    <br>
  `;

  return table;

}


// =====================================================
// DOWNLOAD BACKUP EXCEL
// =====================================================

if (
  backupDataBtn
) {

  backupDataBtn.addEventListener(
    "click",
    async () => {

      const originalText =
        backupDataBtn.textContent;

      try {

        backupDataBtn.disabled =
          true;

        backupDataBtn.textContent =
          "Preparing Backup...";


        // =================================================
        // LOAD FIRESTORE DATA
        // =================================================

        const [
          usersSnapshot,
          announcementsSnapshot,
          auditSnapshot
        ] =
          await Promise.all([

            getDocs(
              collection(
                db,
                "users"
              )
            ),

            getDocs(
              collection(
                db,
                "announcements"
              )
            ),

            getDocs(
              collection(
                db,
                "auditLogs"
              )
            )

          ]);


        // =================================================
        // USERS
        // =================================================

        const users =
          usersSnapshot
            .docs
            .map(
              snapshot => ({

                id:
                  snapshot.id,

                ...snapshot.data()

              })
            );


        // =================================================
        // ANNOUNCEMENTS
        // =================================================

        const announcements =
          announcementsSnapshot
            .docs
            .map(
              snapshot => ({

                id:
                  snapshot.id,

                ...snapshot.data()

              })
            );


        // =================================================
        // AUDIT LOGS
        // =================================================

        const auditLogs =
          auditSnapshot
            .docs
            .map(
              snapshot => ({

                id:
                  snapshot.id,

                ...snapshot.data()

              })
            );


        // =================================================
        // SEPARATE USERS
        // =================================================

        const youth =
          users.filter(
            user =>
              user.role ===
              "youth"
          );

        const admins =
          users.filter(
            user =>
              user.role ===
              "admin"
          );


        // =================================================
        // YOUTH HEADERS
        // =================================================

        const youthHeaders = [

          {
            key: "id",
            label: "Record ID"
          },

          {
            key: "fullName",
            label: "Full Name"
          },

          {
            key: "email",
            label: "Email"
          },

          {
            key: "birthDate",
            label: "Birth Date"
          },

          {
            key: "age",
            label: "Age"
          },

          {
            key: "gender",
            label: "Gender"
          },

          {
            key: "civilStatus",
            label: "Civil Status"
          },

          {
            key: "address",
            label: "Purok / Area"
          },

          {
            key: "contact",
            label: "Contact Number"
          },

          {
            key: "education",
            label: "Educational Attainment"
          },

          {
            key: "educationStatus",
            label: "Education Status"
          },

          {
            key: "employment",
            label: "Employment Status"
          },

          {
            key: "civic",
            label: "Civic Participation"
          },

          {
            key: "voterStatus",
            label: "Voter Registration"
          },

          {
            key: "newVoter",
            label: "New Voter Status"
          },

          {
            key: "voterParticipation",
            label: "Voter Participation"
          },

          {
            key: "registeredSKVoter",
            label: "Registered SK Voter"
          },

          {
            key: "votedLastSKElection",
            label: "Voted Last SK Election"
          },

          {
            key: "kkAssemblyAttended",
            label: "KK Assembly Attendance"
          },

          {
            key: "kkAttendanceCount",
            label: "KK Attendance Count"
          },

          {
            key: "kkNoReason",
            label: "Reason for Not Attending"
          },

          {
            key: "specialNeeds",
            label: "Special Needs"
          },

          {
            key: "assistance",
            label: "Specific Assistance Needed"
          },

          {
            key: "hobbies",
            label: "Hobbies / Skills"
          },

          {
            key: "sports",
            label: "Sports Interests"
          },

          {
            key: "status",
            label: "Status"
          },

          {
            key: "eligibility",
            label: "Eligibility"
          },

          {
            key: "createdAt",
            label: "Created At",
            date: true
          },

          {
            key: "updatedAt",
            label: "Updated At",
            date: true
          }

        ];


        // =================================================
        // ADMIN HEADERS
        // =================================================

        const adminHeaders = [

          {
            key: "id",
            label: "Record ID"
          },

          {
            key: "fullName",
            label: "Name"
          },

          {
            key: "email",
            label: "Email"
          },

          {
            key: "role",
            label: "Role"
          },

          {
            key: "status",
            label: "Status"
          },

          {
            key: "createdAt",
            label: "Created At",
            date: true
          }

        ];


        // =================================================
        // ANNOUNCEMENT HEADERS
        // =================================================

        const announcementHeaders = [

          {
            key: "id",
            label: "Record ID"
          },

          {
            key: "category",
            label: "Category"
          },

          {
            key: "title",
            label: "Title"
          },

          {
            key: "message",
            label: "Message"
          },

          {
            key: "expiryDate",
            label: "Display Until"
          },

          {
            key: "createdBy",
            label: "Created By"
          },

          {
            key: "createdAt",
            label: "Created At",
            date: true
          },

          {
            key: "updatedAt",
            label: "Updated At",
            date: true
          }

        ];


        // =================================================
        // AUDIT HEADERS
        // =================================================

        const auditHeaders = [

          {
            key: "id",
            label: "Record ID"
          },

          {
            key: "email",
            label: "User"
          },

          {
            key: "role",
            label: "Role"
          },

          {
            key: "activity",
            label: "Activity"
          },

          {
            key: "details",
            label: "Details"
          },

          {
            key: "timestamp",
            label: "Date & Time",
            date: true
          }

        ];


        // =================================================
        // BUILD EXCEL FILE CONTENT
        // =================================================

        let excelContent = `
          <!DOCTYPE html>

          <html>

          <head>

            <meta charset="UTF-8">

            <title>
              Bukal Youth Data Backup
            </title>

            <style>

              body {
                font-family:
                  Arial,
                  sans-serif;
              }

              h1 {
                color:
                  #063f42;
              }

              h2 {
                color:
                  #0a5255;
              }

              table {
                border-collapse:
                  collapse;
              }

              th,
              td {
                border:
                  1px solid #cccccc;
              }

            </style>

          </head>

          <body>


            <h1>
              Barangay Bukal Youth Information System
            </h1>


            <p>
              System Backup
            </p>


            <p>
              Generated:
              ${escapeExcelValue(
                new Date()
                  .toLocaleString(
                    "en-PH"
                  )
              )}
            </p>


            <br>
        `;


        excelContent +=
          buildExcelTable(
            "Youth Records",
            youthHeaders,
            youth
          );


        excelContent +=
          buildExcelTable(
            "Administrator Accounts",
            adminHeaders,
            admins
          );


        excelContent +=
          buildExcelTable(
            "Announcements",
            announcementHeaders,
            announcements
          );


        excelContent +=
          buildExcelTable(
            "Audit Trail",
            auditHeaders,
            auditLogs
          );


        excelContent += `
          </body>

          </html>
        `;


        // =================================================
        // CREATE FILE
        // =================================================

        const blob =
          new Blob(
            [
              "\ufeff",
              excelContent
            ],
            {
              type:
                "application/vnd.ms-excel;charset=utf-8;"
            }
          );


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        // =================================================
        // FILE NAME
        // =================================================

        const now =
          new Date();

        const year =
          now.getFullYear();

        const month =
          String(
            now.getMonth() + 1
          ).padStart(
            2,
            "0"
          );

        const day =
          String(
            now.getDate()
          ).padStart(
            2,
            "0"
          );


        const fileName =
          `Bukal-Youth-Data-Backup-${year}-${month}-${day}.xls`;


        link.href =
          url;

        link.download =
          fileName;


        // =================================================
        // DOWNLOAD
        // =================================================

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();


        setTimeout(
          () => {

            URL.revokeObjectURL(
              url
            );

          },
          2000
        );


        // =================================================
        // AUDIT
        // =================================================

        safeLogActivity({

          email:
            auth.currentUser?.email ||
            "Admin",

          role:
            "admin",

          activity:
            "Downloaded system backup",

          details:
            `Downloaded system backup: ${fileName}`

        });


        backupDataBtn.textContent =
          "Backup Downloaded ✓";


        setTimeout(
          () => {

            backupDataBtn.textContent =
              originalText;

          },
          1800
        );


      } catch (error) {

        console.error(
          "BACKUP ERROR:",
          error
        );


        alert(
          "Unable to download backup.\n\n" +
          "Error: " +
          (
            error?.message ||
            "Unknown error"
          )
        );


        backupDataBtn.textContent =
          originalText;

      } finally {

        backupDataBtn.disabled =
          false;

      }

    }
  );

}


// =====================================================
// RESET DATA BUTTON
// SAFE MODE
// =====================================================

if (
  resetDemoBtn
) {

  resetDemoBtn.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Reset Data can permanently remove system records.\n\nFor safety, automatic reset is disabled because deleting Firestore youth profiles without deleting their Firebase Authentication accounts can cause login/profile problems.\n\nPress OK to continue."
        );


      if (
        !confirmed
      ) {
        return;
      }


      alert(
        "No data was deleted.\n\nReset Data is currently in Safe Mode."
      );


      safeLogActivity({

        email:
          auth.currentUser?.email ||
          "Admin",

        role:
          "admin",

        activity:
          "Attempted data reset",

        details:
          "Reset Data was opened, but Safe Mode prevented deletion."

      });

    }
  );

}
// =====================================================
// EXPANDED CHART SYSTEM
// =====================================================

const chartFocusOverlay =
  document.getElementById(
    "chartFocusOverlay"
  );

const chartFocusCanvas =
  document.getElementById(
    "chartFocusCanvas"
  );

const chartFocusTitle =
  document.getElementById(
    "chartFocusTitle"
  );

const chartFocusClose =
  document.getElementById(
    "chartFocusClose"
  );

const chartFocusDone =
  document.getElementById(
    "chartFocusDone"
  );


let enlargedChart =
  null;

let enlargedSourceCanvasId =
  null;


// =====================================================
// OPEN LARGE CHART
// =====================================================

function openChartFocus(
  canvasId,
  panel
) {

  if (
    !chartFocusOverlay ||
    !chartFocusCanvas
  ) {

    console.error(
      "Chart focus modal is missing."
    );

    return;

  }


  const sourceChart =
    charts[
      canvasId
    ];


  if (!sourceChart) {

    console.error(
      "Chart not found:",
      canvasId
    );

    return;

  }


  enlargedSourceCanvasId =
    canvasId;


  const title =
    panel
      ?.querySelector(
        "h2"
      )
      ?.textContent
      ?.trim() ||
    "Chart Analytics";


  if (
    chartFocusTitle
  ) {

    chartFocusTitle.textContent =
      title;

  }


  if (
    enlargedChart
  ) {

    enlargedChart.destroy();

    enlargedChart =
      null;

  }


  const clonedData = {

    labels:
      [
        ...(
          sourceChart.data.labels ||
          []
        )
      ],


    datasets:
      sourceChart.data.datasets.map(
        dataset => ({

          ...dataset,

          data:
            Array.isArray(
              dataset.data
            )
              ? [
                  ...dataset.data
                ]
              : dataset.data

        })
      )

  };


  const sourceType =
    sourceChart.config.type;


  enlargedChart =
    new Chart(
      chartFocusCanvas,
      {

        type:
          sourceType,


        data:
          clonedData,


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


          animation: {

            duration:
              300

          },


          interaction: {

            intersect:
              true,

            mode:
              "nearest"

          },


          plugins: {

            legend: {

              display:
                sourceType ===
                  "doughnut" ||
                sourceType ===
                  "pie",

              position:
                "bottom",

              labels: {

                padding:
                  22,

                font: {

                  size:
                    14

                }

              }

            },


            tooltip: {

              padding:
                14,

              titleFont: {

                size:
                  15

              },

              bodyFont: {

                size:
                  14

              }

            }

          },


          scales:
            (
              sourceType ===
                "doughnut" ||
              sourceType ===
                "pie"
            )
              ? undefined
              : {

                  x: {

                    ticks: {

                      color:
                        "#536970",

                      font: {

                        size:
                          13

                      },

                      maxRotation:
                        35,

                      minRotation:
                        0

                    },

                    grid: {

                      color:
                        "rgba(10,82,85,.06)"

                    }

                  },


                  y: {

                    beginAtZero:
                      true,

                    ticks: {

                      precision:
                        0,

                      color:
                        "#536970",

                      font: {

                        size:
                          13

                      }

                    },

                    grid: {

                      color:
                        "rgba(10,82,85,.08)"

                    }

                  }

                },


          // =================================================
          // CLICK DATA INSIDE LARGE CHART
          // =================================================

          onClick: (
            event,
            elements,
            chart
          ) => {

            if (
              !elements ||
              elements.length ===
                0
            ) {

              return;

            }


            const index =
              elements[
                0
              ].index;


            const label =
              chart
                .data
                .labels?.[
                  index
                ];


            if (
              label ===
                undefined ||
              label ===
                null
            ) {

              return;

            }


            const sourceId =
              enlargedSourceCanvasId;


            closeChartFocus();


            applyChartDrilldown(
              sourceId,
              String(
                label
              )
            );

          }

        }

      }
    );


  chartFocusOverlay
    .classList
    .add(
      "open"
    );


  chartFocusOverlay
    .setAttribute(
      "aria-hidden",
      "false"
    );


  document.body
    .classList
    .add(
      "chart-focus-open"
    );


  requestAnimationFrame(
    () => {

      enlargedChart
        ?.resize();

    }
  );

}


// =====================================================
// CLOSE LARGE CHART
// =====================================================

function closeChartFocus() {

  if (
    !chartFocusOverlay
  ) {

    return;

  }


  chartFocusOverlay
    .classList
    .remove(
      "open"
    );


  chartFocusOverlay
    .setAttribute(
      "aria-hidden",
      "true"
    );


  document.body
    .classList
    .remove(
      "chart-focus-open"
    );


  if (
    enlargedChart
  ) {

    enlargedChart.destroy();

    enlargedChart =
      null;

  }


  enlargedSourceCanvasId =
    null;

}


// =====================================================
// CLICK WHOLE CHART PANEL
// =====================================================

document
  .querySelectorAll(
    "#tab-overview .chart-panel"
  )
  .forEach(
    panel => {

      const canvas =
        panel.querySelector(
          "canvas"
        );


      if (
        !canvas?.id
      ) {

        return;

      }


      panel.setAttribute(
        "tabindex",
        "0"
      );


      panel.setAttribute(
        "role",
        "button"
      );


      panel.addEventListener(
        "click",
        event => {

          /*
           * Kapag canvas mismo ang click,
           * Chart.js onClick na ang bahala.
           */
          if (
            event.target ===
            canvas
          ) {

            return;

          }


          openChartFocus(
            canvas.id,
            panel
          );

        }
      );


      panel.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
              "Enter" ||
            event.key ===
              " "
          ) {

            event.preventDefault();


            openChartFocus(
              canvas.id,
              panel
            );

          }

        }
      );

    }
  );


// =====================================================
// CLOSE EVENTS
// =====================================================

chartFocusClose
  ?.addEventListener(
    "click",
    closeChartFocus
  );


chartFocusDone
  ?.addEventListener(
    "click",
    closeChartFocus
  );


chartFocusOverlay
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        chartFocusOverlay
      ) {

        closeChartFocus();

      }

    }
  );


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
        "Escape" &&
      chartFocusOverlay
        ?.classList
        .contains(
          "open"
        )
    ) {

      closeChartFocus();

    }

  }
);