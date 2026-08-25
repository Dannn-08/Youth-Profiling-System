import { auth, db, storage } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

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

  if (
    n >= 15 &&
    n <= 19
  ) {
    return "15-19";
  }

  if (
    n >= 20 &&
    n <= 24
  ) {
    return "20-24";
  }

  if (
    n >= 25 &&
    n <= 30
  ) {
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
// LOCAL DATE
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
// ANNOUNCEMENT IMAGE HELPERS
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

  const maxSize =
    5 * 1024 * 1024;

  if (
    file.size >
    maxSize
  ) {
    throw new Error(
      "Announcement image must not exceed 5 MB."
    );
  }

  const safeName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

  const imagePath =
    `announcements/${Date.now()}_${safeName}`;

  const imageRef =
    ref(
      storage,
      imagePath
    );

  await uploadBytes(
    imageRef,
    file
  );

  const imageUrl =
    await getDownloadURL(
      imageRef
    );

  return {
    imageUrl,
    imagePath
  };
}


async function deleteAnnouncementImage(imagePath) {
  if (!imagePath) {
    return;
  }

  try {
    const imageRef =
      ref(
        storage,
        imagePath
      );

    await deleteObject(
      imageRef
    );

  } catch (error) {
    if (
      error.code !==
      "storage/object-not-found"
    ) {
      console.error(
        "Announcement image delete error:",
        error
      );
    }
  }
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
        async announcement => {

          await deleteDoc(
            doc(
              db,
              "announcements",
              announcement.id
            )
          );

          if (
            announcement.imagePath
          ) {
            await deleteAnnouncementImage(
              announcement.imagePath
            );
          }

        }
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

tabButtons.forEach(btn => {
  btn.addEventListener(
    "click",
    () => {

      tabButtons.forEach(
        button =>
          button.classList.remove(
            "active"
          )
      );

      tabPanels.forEach(
        panel =>
          panel.classList.remove(
            "active"
          )
      );

      btn.classList.add(
        "active"
      );

      const panel =
        document.getElementById(
          "tab-" +
          btn.dataset.tab
        );

      if (panel) {
        panel.classList.add(
          "active"
        );
      }

    }
  );
});


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
    statCards.innerHTML =
      `
        <p class="empty-state">
          Loading dashboard data...
        </p>
      `;
  }

  if (tableBody) {
    tableBody.innerHTML =
      `
        <tr>
          <td colspan="11" class="empty-state">
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
            user.role === "youth"
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
          user.role === "admin"
      );

    renderStats();
    renderTable();
    renderReports();
    renderAdminAccounts();

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
      statCards.innerHTML =
        `
          <p class="empty-state">
            Unable to load dashboard data.
          </p>
        `;
    }

    if (tableBody) {
      tableBody.innerHTML =
        `
          <tr>
            <td colspan="11" class="empty-state">
              Unable to load youth records.
            </td>
          </tr>
        `;
    }
  }
}


// =====================================================
// STATS
// =====================================================

function renderStats() {
  const activeYouth =
    youthList.filter(
      isActiveYouth
    );

  const cards = [
    {
      label: "Total Active Youth",
      value: activeYouth.length
    },

    {
      label: "Male",
      value:
        activeYouth.filter(
          youth =>
            youth.gender ===
            "Male"
        ).length
    },

    {
      label: "Female",
      value:
        activeYouth.filter(
          youth =>
            youth.gender ===
            "Female"
        ).length
    },

    {
      label: "Students",
      value:
        activeYouth.filter(
          youth =>
            youth.employment ===
            "Student"
        ).length
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
        card =>
          `
            <div class="panel stat-card">
              <small>${escapeHtml(card.label)}</small>
              <strong>${card.value}</strong>
            </div>
          `
      )
      .join("");
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
    charts[canvasId]
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

  charts[canvasId] =
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
    new Array(12)
      .fill(0);

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

  const gender =
    countBy(
      activeYouth,
      youth =>
        youth.gender
    );

  drawChart(
    "genderChart",
    "doughnut",
    Object.keys(gender),
    Object.values(gender)
  );

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
    Object.keys(ages),
    Object.values(ages)
  );

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
      .entries(purok)
      .sort(
        (a, b) =>
          b[1] - a[1]
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

  const civilStatus =
    countBy(
      activeYouth,
      youth =>
        youth.civilStatus
    );

  drawChart(
    "civilStatusChart",
    "doughnut",
    Object.keys(civilStatus),
    Object.values(civilStatus)
  );

  const education =
    countBy(
      activeYouth,
      youth =>
        youth.education
    );

  drawChart(
    "educationChart",
    "bar",
    Object.keys(education),
    Object.values(education)
  );

  const educationStatus =
    countBy(
      activeYouth,
      youth =>
        youth.educationStatus
    );

  drawChart(
    "educationStatusChart",
    "doughnut",
    Object.keys(educationStatus),
    Object.values(educationStatus)
  );

  const employment =
    countBy(
      activeYouth,
      youth =>
        youth.employment
    );

  drawChart(
    "employmentChart",
    "doughnut",
    Object.keys(employment),
    Object.values(employment)
  );

  const voter =
    countBy(
      activeYouth,
      youth =>
        youth.voterStatus
    );

  drawChart(
    "voterChart",
    "doughnut",
    Object.keys(voter),
    Object.values(voter)
  );

  const voterParticipation =
    countBy(
      activeYouth,
      youth =>
        youth.voterParticipation
    );

  drawChart(
    "voterParticipationChart",
    "doughnut",
    Object.keys(voterParticipation),
    Object.values(voterParticipation)
  );

  const newVoter =
    countBy(
      activeYouth,
      youth =>
        youth.newVoter
    );

  drawChart(
    "newVoterChart",
    "doughnut",
    Object.keys(newVoter),
    Object.values(newVoter)
  );

  const skVoter =
    countBy(
      activeYouth,
      youth =>
        youth.registeredSKVoter
    );

  drawChart(
    "skVoterChart",
    "doughnut",
    Object.keys(skVoter),
    Object.values(skVoter)
  );

  const skElection =
    countBy(
      activeYouth,
      youth =>
        youth.votedLastSKElection
    );

  drawChart(
    "skElectionChart",
    "doughnut",
    Object.keys(skElection),
    Object.values(skElection)
  );

  const kkAttendance =
    countBy(
      activeYouth,
      youth =>
        youth.kkAssemblyAttended
    );

  drawChart(
    "kkAttendanceChart",
    "doughnut",
    Object.keys(kkAttendance),
    Object.values(kkAttendance)
  );

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
    Object.keys(kkFrequency),
    Object.values(kkFrequency)
  );

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
    Object.keys(kkReason),
    Object.values(kkReason)
  );

  const civic =
    countBy(
      activeYouth,
      youth =>
        youth.civic
    );

  drawChart(
    "civicChart",
    "doughnut",
    Object.keys(civic),
    Object.values(civic)
  );

  const specialNeeds =
    countBy(
      activeYouth,
      youth =>
        youth.specialNeeds
    );

  drawChart(
    "specialNeedsChart",
    "doughnut",
    Object.keys(specialNeeds),
    Object.values(specialNeeds)
  );

  const sports =
    countMultiValueField(
      activeYouth,
      "sports"
    );

  const topSports =
    Object
      .entries(sports)
      .sort(
        (a, b) =>
          b[1] - a[1]
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

  const hobbies =
    countMultiValueField(
      activeYouth,
      "hobbies"
    );

  const topHobbies =
    Object
      .entries(hobbies)
      .sort(
        (a, b) =>
          b[1] - a[1]
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

  renderRegistrationTrendChart();
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

  if (filterPurok) {
    filterPurok.innerHTML =
      `
        <option value="">
          All Purok / Area
        </option>
      ` +
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

  if (filterEducation) {
    filterEducation.innerHTML =
      `
        <option value="">
          All Education
        </option>
      ` +
      eduOptions
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

  if (filterEmployment) {
    filterEmployment.innerHTML =
      `
        <option value="">
          All Employment
        </option>
      ` +
      empOptions
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
          .includes(term) ||
        (
          youth.email ||
          ""
        )
          .toLowerCase()
          .includes(term) ||
        (
          youth.address ||
          ""
        )
          .toLowerCase()
          .includes(term);

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

      return (
        matchesSearch &&
        matchesGender &&
        matchesPurok &&
        matchesEducation &&
        matchesEmployment &&
        matchesStatus &&
        matchesSKVoter &&
        matchesKKAttendance
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
    body.innerHTML =
      `
        <tr>
          <td colspan="11" class="empty-state">
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
                <td>${escapeHtml(youth.fullName)}</td>
                <td>${escapeHtml(youth.email)}</td>
                <td>${escapeHtml(youth.age)}</td>
                <td>${escapeHtml(youth.gender)}</td>
                <td>${escapeHtml(youth.civilStatus || "—")}</td>
                <td>${escapeHtml(youth.education)}</td>
                <td>${escapeHtml(youth.employment)}</td>
                <td>${escapeHtml(youth.registeredSKVoter || "—")}</td>
                <td>${escapeHtml(youth.kkAssemblyAttended || "—")}</td>

                <td>
                  <span class="status-pill ${active ? "" : "off"}">
                    ${status}
                  </span>
                </td>

                <td>
                  <div class="action-row">
                    <button class="action-btn edit" data-edit="${youth.id}" type="button" title="Edit">✎</button>
                    <button class="action-btn delete" data-delete="${youth.id}" type="button" title="Delete">🗑</button>
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

  if (countText) {
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
  .filter(Boolean)
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

if (
  openAddYouthBtn
) {
  openAddYouthBtn.addEventListener(
    "click",
    () =>
      openYouthDialog(
        null
      )
  );
}


// =====================================================
// BUILD YOUTH FIELDS
// =====================================================

function buildYouthFields(data = {}) {
  if (
    !youthFieldsEl
  ) {
    return;
  }

  const normalizedData = {
    ...data,
    address:
      normalizePurok(
        data.address
      )
  };

  youthFieldsEl.innerHTML =
    FIELDS
      .map(
        field => {

          const value =
            normalizedData[field.key] ??
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

          if (
            field.type ===
            "select"
          ) {
            const options =
              field.options
                .map(
                  option =>
                    `
                      <option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>
                        ${escapeHtml(option)}
                      </option>
                    `
                )
                .join("");

            return `
              <label class="${fieldClass}" data-field-wrapper="${field.key}" ${displayStyle}>
                <span>${escapeHtml(field.label)}</span>
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
              <label class="${fieldClass}" data-field-wrapper="${field.key}">
                <span>${escapeHtml(field.label)}</span>
                <input type="number" name="${field.key}" value="${escapeHtml(value)}" readonly />
              </label>
            `;
          }

          return `
            <label class="${fieldClass}" data-field-wrapper="${field.key}">
              <span>${escapeHtml(field.label)}</span>
              <input type="${field.type}" name="${field.key}" value="${escapeHtml(value)}" />
            </label>
          `;
        }
      )
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

    if (
      kkInput.value ===
      "Yes"
    ) {
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
      kkInput.value ===
      "No"
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

  if (
    kkInput
  ) {
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

  if (
    youthId
  ) {
    const existing =
      youthList.find(
        youth =>
          youth.id ===
          youthId
      );

    if (
      youthDialogTitle
    ) {
      youthDialogTitle.textContent =
        "Edit Youth Profile";
    }

    idInput.value =
      youthId;

    buildYouthFields(
      existing ||
      {}
    );

  } else {

    if (
      youthDialogTitle
    ) {
      youthDialogTitle.textContent =
        "Add Youth Profile";
    }

    idInput.value =
      "";

    buildYouthFields(
      {}
    );
  }

  youthDialog.showModal();
}


// =====================================================
// SAVE YOUTH
// =====================================================

if (
  saveYouthBtn
) {
  saveYouthBtn.addEventListener(
    "click",
    async () => {

      saveYouthBtn.disabled =
        true;

      saveYouthBtn.textContent =
        "Saving...";

      const payload =
        {};

      FIELDS.forEach(
        field => {

          const input =
            youthFieldsEl
              ?.querySelector(
                `[name="${field.key}"]`
              );

          if (
            !input
          ) {
            return;
          }

          payload[field.key] =
            field.type ===
            "number"
              ? Number(
                  input.value
                )
              : input.value.trim();
        }
      );

      payload.address =
        normalizePurok(
          payload.address
        );

      if (
        payload.birthDate
      ) {
        const calculatedAge =
          calculateAge(
            payload.birthDate
          );

        if (
          calculatedAge ===
          null
        ) {
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
        payload.kkNoReason =
          "";
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

      payload.role =
        "youth";

      payload.updatedAt =
        new Date();

      try {
        if (
          idInput.value
        ) {
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
              auth.currentUser
                ?.email,

            role:
              "admin",

            activity:
              "Edited youth profile",

            details:
              `${payload.fullName} • Purok: ${payload.address || "N/A"} • Age ${payload.age} • SK Voter: ${payload.registeredSKVoter || "N/A"} • KK Assembly: ${payload.kkAssemblyAttended || "N/A"}`
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
              auth.currentUser
                ?.email,

            role:
              "admin",

            activity:
              "Added youth profile",

            details:
              `${payload.fullName} • Purok: ${payload.address || "N/A"} • Age ${payload.age}`
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

  if (
    !confirmed
  ) {
    return;
  }

  const target =
    youthList.find(
      youth =>
        youth.id ===
        youthId
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
        auth.currentUser
          ?.email,

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
// =====================================================

function renderReports() {
  const reportSummary =
    document.getElementById(
      "reportSummary"
    );

  if (
    !reportSummary
  ) {
    return;
  }

  const activeYouth =
    youthList.filter(
      isActiveYouth
    );

  const categories = [
    [
      "Youth Status",

      {
        Active:
          activeYouth.length,

        Archived:
          youthList.length -
          activeYouth.length
      }
    ],

    [
      "Youth Distribution by Purok / Area",

      countBy(
        activeYouth,
        youth =>
          normalizePurok(
            youth.address
          )
      )
    ],

    [
      "Gender Breakdown",

      countBy(
        activeYouth,
        youth =>
          youth.gender
      )
    ],

    [
      "Civil Status",

      countBy(
        activeYouth,
        youth =>
          youth.civilStatus
      )
    ],

    [
      "Education Level",

      countBy(
        activeYouth,
        youth =>
          youth.education
      )
    ],

    [
      "Education Status",

      countBy(
        activeYouth,
        youth =>
          youth.educationStatus
      )
    ],

    [
      "Employment Status",

      countBy(
        activeYouth,
        youth =>
          youth.employment
      )
    ],

    [
      "Voter Registration",

      countBy(
        activeYouth,
        youth =>
          youth.voterStatus
      )
    ],

    [
      "Voter Participation",

      countBy(
        activeYouth,
        youth =>
          youth.voterParticipation
      )
    ],

    [
      "New Voter Status",

      countBy(
        activeYouth,
        youth =>
          youth.newVoter
      )
    ],

    [
      "Registered SK Voter",

      countBy(
        activeYouth,
        youth =>
          youth.registeredSKVoter
      )
    ],

    [
      "Last SK Election Participation",

      countBy(
        activeYouth,
        youth =>
          youth.votedLastSKElection
      )
    ],

    [
      "KK Assembly Attendance",

      countBy(
        activeYouth,
        youth =>
          youth.kkAssemblyAttended
      )
    ],

    [
      "KK Assembly Attendance Frequency",

      countBy(
        activeYouth.filter(
          youth =>
            youth.kkAssemblyAttended ===
            "Yes"
        ),
        youth =>
          youth.kkAttendanceCount
      )
    ],

    [
      "Reasons for Not Attending KK Assembly",

      countBy(
        activeYouth.filter(
          youth =>
            youth.kkAssemblyAttended ===
            "No"
        ),
        youth =>
          youth.kkNoReason
      )
    ],

    [
      "Civic Participation",

      countBy(
        activeYouth,
        youth =>
          youth.civic
      )
    ],

    [
      "Special Needs",

      countBy(
        activeYouth,
        youth =>
          youth.specialNeeds
      )
    ]
  ];

  reportSummary.innerHTML =
    categories
      .map(
        (
          [
            title,
            counts
          ]
        ) => {

          const items =
            Object
              .entries(
                counts
              )
              .map(
                (
                  [
                    key,
                    value
                  ]
                ) =>
                  `
                    <li>
                      ${escapeHtml(key)}:
                      <strong>${value}</strong>
                    </li>
                  `
              )
              .join("");

          return `
            <div class="summary-box">
              <h3>${escapeHtml(title)}</h3>
              <ul>
                ${
                  items ||
                  "<li>No data yet</li>"
                }
              </ul>
            </div>
          `;
        }
      )
      .join("");
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

      safeLogActivity({
        email:
          auth.currentUser
            ?.email,

        role:
          "admin",

        activity:
          "Exported report",

        details:
          "Print / PDF youth report"
      });

      window.print();
    }
  );
}


// =====================================================
// CSV
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

      const headers = [
        "fullName",
        "email",
        "birthDate",
        "age",
        "status",
        "eligibility",
        "gender",
        "civilStatus",
        "address",
        "contact",
        "education",
        "educationStatus",
        "employment",
        "civic",
        "voterStatus",
        "newVoter",
        "voterParticipation",
        "registeredSKVoter",
        "votedLastSKElection",
        "kkAssemblyAttended",
        "kkAttendanceCount",
        "kkNoReason",
        "specialNeeds",
        "assistance",
        "hobbies",
        "sports"
      ];

      const rows =
        youthList.map(
          youth =>
            headers
              .map(
                header =>
                  `"${String(
                    youth[
                      header
                    ] ??
                    ""
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(",")
        );

      const csv =
        [
          headers.join(","),
          ...rows
        ]
          .join("\n");

      const blob =
        new Blob(
          [
            csv
          ],
          {
            type:
              "text/csv"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href =
        url;

      a.download =
        "bukal-youth-data.csv";

      a.click();

      URL.revokeObjectURL(
        url
      );

      safeLogActivity({
        email:
          auth.currentUser
            ?.email,

        role:
          "admin",

        activity:
          "Exported report",

        details:
          "Downloaded youth data CSV"
      });

    }
  );
}


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

  if (
    !body
  ) {
    return;
  }

  body.innerHTML =
    `
      <tr>
        <td colspan="6" class="empty-state">
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
      (
        a,
        b
      ) => {

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

    body.innerHTML =
      `
        <tr>
          <td colspan="6" class="empty-state">
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
    announcementList.length ===
    0
  ) {
    body.innerHTML =
      `
        <tr>
          <td colspan="6" class="empty-state">
            No announcements available.
          </td>
        </tr>
      `;

    if (
      countText
    ) {
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
              <td>${escapeHtml(formattedDate)}</td>

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

                <small style="display:block; margin-top:5px; color:#71838a;">
                  Visible through this date
                </small>
              </td>

              <td>
                <div class="action-row">
                  <button class="action-btn edit" data-edit-announcement="${announcement.id}" type="button" title="Edit Announcement">✎</button>
                  <button class="action-btn delete" data-delete-announcement="${announcement.id}" type="button" title="Delete Announcement">🗑</button>
                </div>
              </td>
            </tr>
          `;
        }
      )
      .join("");

  if (
    countText
  ) {
    countText.textContent =
      `${announcementList.length} announcement${
        announcementList.length ===
        1
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

  if (
    announcementId
  ) {

    const existing =
      announcementList.find(
        announcement =>
          announcement.id ===
          announcementId
      );

    if (
      !existing
    ) {
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

    if (
      announcementDialogTitle
    ) {
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

    if (
      announcementDialogTitle
    ) {
      announcementDialogTitle.textContent =
        "New Announcement";
    }
  }

  if (
    announcementImageInput
  ) {
    announcementImageInput.value =
      "";
  }

  announcementDialog.showModal();
}


// =====================================================
// NEW ANNOUNCEMENT
// =====================================================

if (
  openAddAnnouncementBtn
) {
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

if (
  saveAnnouncementBtn
) {
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

      if (
        expiryDate <
        today
      ) {
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
          5 * 1024 * 1024
      ) {
        alert(
          "Announcement image must not exceed 5 MB."
        );

        return;
      }

      saveAnnouncementBtn.disabled =
        true;

      saveAnnouncementBtn.textContent =
        selectedImage
          ? "Uploading..."
          : "Saving...";

      let newlyUploadedImage =
        null;

      try {

        // =================================================
        // UPDATE EXISTING
        // =================================================

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

          let imagePath =
            existing?.imagePath ||
            "";

          if (
            selectedImage
          ) {
            newlyUploadedImage =
              await uploadAnnouncementImage(
                selectedImage
              );

            imageUrl =
              newlyUploadedImage.imageUrl;

            imagePath =
              newlyUploadedImage.imagePath;
          }

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
              imagePath,
              updatedAt:
                new Date()
            }
          );

          if (
            selectedImage &&
            existing?.imagePath &&
            existing.imagePath !==
              imagePath
          ) {
            await deleteAnnouncementImage(
              existing.imagePath
            );
          }

          safeLogActivity({
            email:
              auth.currentUser
                ?.email,

            role:
              "admin",

            activity:
              "Updated announcement",

            details:
              `${title} • Display until: ${expiryDate}${imageUrl ? " • With image" : ""}`
          });

          alert(
            "Announcement updated successfully!"
          );

        } else {

          // =================================================
          // CREATE NEW
          // =================================================

          let imageUrl =
            "";

          let imagePath =
            "";

          if (
            selectedImage
          ) {
            newlyUploadedImage =
              await uploadAnnouncementImage(
                selectedImage
              );

            imageUrl =
              newlyUploadedImage.imageUrl;

            imagePath =
              newlyUploadedImage.imagePath;
          }

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
              imagePath,

              createdAt:
                new Date(),

              updatedAt:
                new Date(),

              createdBy:
                auth.currentUser
                  ?.email ||
                ""
            }
          );

          safeLogActivity({
            email:
              auth.currentUser
                ?.email,

            role:
              "admin",

            activity:
              "Created announcement",

            details:
              `${title} • Display until: ${expiryDate}${imageUrl ? " • With image" : ""}`
          });

          alert(
            "Announcement created successfully!"
          );
        }

        announcementDialog
          ?.close();

        await loadAnnouncements();

      } catch (error) {

        console.error(
          "Announcement save error:",
          error
        );

        if (
          newlyUploadedImage?.imagePath
        ) {
          await deleteAnnouncementImage(
            newlyUploadedImage.imagePath
          );
        }

        if (
          error.message ===
          "Please select a valid image file." ||
          error.message ===
          "Announcement image must not exceed 5 MB."
        ) {
          alert(
            error.message
          );
        } else {
          alert(
            "Something went wrong while saving the announcement. Please check your Firebase Storage and Firestore permissions."
          );
        }

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

  if (
    !target
  ) {
    return;
  }

  const confirmed =
    confirm(
      `Delete announcement "${target.title}"? This cannot be undone.`
    );

  if (
    !confirmed
  ) {
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

    if (
      target.imagePath
    ) {
      await deleteAnnouncementImage(
        target.imagePath
      );
    }

    safeLogActivity({
      email:
        auth.currentUser
          ?.email,

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
// ADMIN ACCOUNTS
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
    body.innerHTML =
      `
        <tr>
          <td colspan="5" class="empty-state">
            No admin accounts found.
          </td>
        </tr>
      `;

    return;
  }

  body.innerHTML =
    adminList
      .map(
        admin =>
          `
            <tr>
              <td>${escapeHtml(admin.fullName)}</td>
              <td>${escapeHtml(admin.email)}</td>
              <td>Admin</td>

              <td>
                <span class="status-pill">
                  Active
                </span>
              </td>

              <td>
                <span class="muted-text">
                  Managed via Firebase Auth
                </span>
              </td>
            </tr>
          `
      )
      .join("");
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
      (
        a,
        b
      ) => {

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

        return (
          bTime -
          aTime
        );
      }
    );

    if (
      logs.length ===
      0
    ) {
      tbody.innerHTML =
        `
          <tr>
            <td colspan="5" class="empty-state">
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
                <td>${escapeHtml(time.toLocaleString())}</td>
                <td>${escapeHtml(log.email)}</td>
                <td>${escapeHtml(log.role)}</td>
                <td>${escapeHtml(log.activity)}</td>
                <td>${escapeHtml(log.details)}</td>
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

if (
  clearAuditBtn
) {
  clearAuditBtn.addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "Clear all audit log entries? This cannot be undone."
        );

      if (
        !confirmed
      ) {
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
// INITIALIZE
// =====================================================

populateFilterOptions();

Promise.allSettled([
  loadUsersData(),
  loadAuditLogs(),
  loadAnnouncements()
]);