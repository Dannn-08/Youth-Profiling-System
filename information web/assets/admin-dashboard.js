import { auth, db } from "./firebase-config.js";

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
    key: "address",
    label: "Address / Purok",
    type: "text",
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

let youthList = [];

let charts = {};


// =====================================================
// HELPERS
// =====================================================

function escapeHtml(value) {

  const div =
    document.createElement("div");

  div.textContent =
    value ?? "";

  return div.innerHTML;

}


// =====================================================
// CALCULATE AGE
// =====================================================

function calculateAge(birthDateValue) {

  if (!birthDateValue) {
    return null;
  }


  const birthDate =
    new Date(birthDateValue);


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

  const numericAge =
    Number(age);


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


// =====================================================
// ACTIVE YOUTH CHECK
// =====================================================

function isActiveYouth(youth) {

  if (
    youth.status === "Inactive" ||
    youth.eligibility === "Archived"
  ) {

    return false;

  }


  const age =
    Number(youth.age);


  return (
    age >= 15 &&
    age <= 30
  );

}


// =====================================================
// AGE GROUP
// =====================================================

function ageGroup(age) {

  const n =
    Number(age);


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


// =====================================================
// COUNT BY CATEGORY
// =====================================================

function countBy(
  list,
  keyFn
) {

  const counts = {};


  list.forEach(
    item => {

      const key =
        keyFn(item) ||
        "Unspecified";


      counts[key] =
        (counts[key] || 0) + 1;

    }
  );


  return counts;

}


// =====================================================
// MULTI VALUE COUNTER
// =====================================================

function countMultiValueField(
  list,
  fieldName
) {

  const counts = {};


  list.forEach(
    item => {

      const values =
        String(
          item[fieldName] || ""
        )
          .split(",")
          .map(
            value =>
              value.trim()
          )
          .filter(Boolean);


      values.forEach(
        value => {

          counts[value] =
            (counts[value] || 0) + 1;

        }
      );

    }
  );


  return counts;

}


// =====================================================
// DATE CONVERTER
// =====================================================

function getCreatedDate(value) {

  if (!value) {
    return null;
  }


  if (
    typeof value.toDate === "function"
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


tabButtons.forEach(
  btn => {

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

  }
);


// =====================================================
// LOAD YOUTH DATA
// =====================================================

async function loadYouth() {

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

          <td
            colspan="8"
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


    youthList = [];


    snap.forEach(
      d => {

        const data =
          d.data();


        if (
          data.role === "youth"
        ) {

          let youthData = {

            id:
              d.id,

            ...data

          };


          if (
            youthData.birthDate
          ) {

            const calculatedAge =
              calculateAge(
                youthData.birthDate
              );


            if (
              calculatedAge !== null
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

          } else {

            const youthStatus =
              getYouthStatus(
                youthData.age
              );


            youthData.status =
              youthData.status ||
              youthStatus.status;


            youthData.eligibility =
              youthData.eligibility ||
              youthStatus.eligibility;

          }


          youthList.push(
            youthData
          );

        }

      }
    );


    renderStats();

    renderCharts();

    renderTable();

    renderReports();

  } catch (error) {

    console.error(
      "Error loading youth:",
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

            <td
              colspan="8"
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
// STAT CARDS
// =====================================================

function renderStats() {

  const activeYouth =
    youthList.filter(
      isActiveYouth
    );


  const total =
    activeYouth.length;


  const male =
    activeYouth.filter(
      youth =>
        youth.gender === "Male"
    ).length;


  const female =
    activeYouth.filter(
      youth =>
        youth.gender === "Female"
    ).length;


  const students =
    activeYouth.filter(
      youth =>
        youth.employment === "Student"
    ).length;


  const cards = [

    {
      label:
        "Total Active Youth",

      value:
        total
    },

    {
      label:
        "Male",

      value:
        male
    },

    {
      label:
        "Female",

      value:
        female
    },

    {
      label:
        "Students",

      value:
        students
    }

  ];


  const container =
    document.getElementById(
      "statCards"
    );


  if (!container) return;


  container.innerHTML =
    cards
      .map(
        card => `

          <div class="panel stat-card">

            <small>
              ${escapeHtml(card.label)}
            </small>

            <strong>
              ${card.value}
            </strong>

          </div>

        `
      )
      .join("");

}


// =====================================================
// GENERIC CHART
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

    charts[canvasId]
      .destroy();

  }


  const isDoughnut =
    type === "doughnut";


  const isBar =
    type === "bar";


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
                colors || [

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


              barPercentage:
                isBar
                  ? 0.60
                  : undefined,


              categoryPercentage:
                isBar
                  ? 0.68
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
              450

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
                "bottom",


              labels: {

                boxWidth:
                  12,

                boxHeight:
                  12,

                padding:
                  12,

                font: {

                  size:
                    11

                }

              }

            },


            tooltip: {

              enabled:
                true

            }

          },


          scales:
            isBar
              ? {

                  x: {

                    offset:
                      true,


                    grid: {

                      display:
                        false

                    },


                    ticks: {

                      font: {

                        size:
                          11

                      },


                      autoSkip:
                        false,


                      maxRotation:
                        30,


                      minRotation:
                        0

                    }

                  },


                  y: {

                    beginAtZero:
                      true,


                    grace:
                      "10%",


                    ticks: {

                      precision:
                        0,


                      stepSize:
                        1,


                      font: {

                        size:
                          11

                      }

                    },


                    grid: {

                      color:
                        "rgba(0,0,0,0.07)"

                    }

                  }

                }
              : undefined

        }

      }
    );

}


// =====================================================
// REGISTRATION TRENDS
// =====================================================

function renderRegistrationTrendChart() {

  const canvas =
    document.getElementById(
      "registrationTrendChart"
    );


  if (!canvas) return;


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


  const monthlyRegistrations =
    new Array(12)
      .fill(0);


  youthList.forEach(
    youth => {

      const createdDate =
        getCreatedDate(
          youth.createdAt
        );


      if (!createdDate) {
        return;
      }


      if (
        createdDate.getFullYear() ===
        currentYear
      ) {

        monthlyRegistrations[
          createdDate.getMonth()
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
                monthlyRegistrations,


              borderColor:
                "#0a5255",


              backgroundColor:
                "rgba(10, 82, 85, 0.12)",


              borderWidth:
                3,


              pointRadius:
                4,


              pointHoverRadius:
                6,


              pointBackgroundColor:
                "#0a5255",


              pointBorderColor:
                "#ffffff",


              pointBorderWidth:
                2,


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


          interaction: {

            intersect:
              false,


            mode:
              "index"

          },


          plugins: {

            legend: {

              display:
                true,


              position:
                "bottom"

            },


            tooltip: {

              callbacks: {

                label(
                  context
                ) {

                  const value =
                    context.parsed.y ||
                    0;


                  return (
                    value +
                    (
                      value === 1
                        ? " registration"
                        : " registrations"
                    )
                  );

                }

              }

            }

          },


          scales: {

            x: {

              grid: {

                display:
                  false

              }

            },


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
// RENDER ALL CHARTS
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
    Object.keys(
      educationStatus
    ),
    Object.values(
      educationStatus
    )
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
    Object.keys(
      voterParticipation
    ),
    Object.values(
      voterParticipation
    )
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
    Object.keys(
      specialNeeds
    ),
    Object.values(
      specialNeeds
    )
  );


  const sportsCounts =
    countMultiValueField(
      activeYouth,
      "sports"
    );


  const topSports =
    Object
      .entries(
        sportsCounts
      )
      .sort(
        (a, b) =>
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


  const hobbiesCounts =
    countMultiValueField(
      activeYouth,
      "hobbies"
    );


  const topHobbies =
    Object
      .entries(
        hobbiesCounts
      )
      .sort(
        (a, b) =>
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


  renderRegistrationTrendChart();

}


// =====================================================
// YOUTH MANAGEMENT FILTERS
// =====================================================

const searchInput =
  document.getElementById(
    "youthSearch"
  );


const filterGender =
  document.getElementById(
    "filterGender"
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


const clearFiltersBtn =
  document.getElementById(
    "clearFilters"
  );


// =====================================================
// POPULATE FILTERS
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
              <option value="${option}">
                ${option}
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
              <option value="${option}">
                ${option}
              </option>
            `
        )
        .join("");

  }

}


// =====================================================
// FILTER YOUTH
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


      return (
        matchesSearch &&
        matchesGender &&
        matchesEducation &&
        matchesEmployment &&
        matchesStatus
      );

    }
  );

}


// =====================================================
// RENDER TABLE
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
    filtered.length === 0
  ) {

    body.innerHTML =
      `
        <tr>

          <td
            colspan="8"
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
                    youth.education
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    youth.employment
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
                      title="Edit"
                    >
                      ✎
                    </button>


                    <button
                      class="action-btn delete"
                      data-delete="${youth.id}"
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
  filterEducation,
  filterEmployment,
  filterStatus
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


// =====================================================
// CLEAR FILTERS
// =====================================================

if (clearFiltersBtn) {

  clearFiltersBtn.addEventListener(
    "click",
    () => {

      if (searchInput) {
        searchInput.value = "";
      }


      if (filterGender) {
        filterGender.value = "";
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
    () =>
      openYouthDialog(
        null
      )
  );

}


// =====================================================
// BUILD YOUTH FIELDS
// =====================================================

function buildYouthFields(
  data = {}
) {

  if (!youthFieldsEl) {
    return;
  }


  youthFieldsEl.innerHTML =
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
                  ${escapeHtml(field.label)}
                </span>

                <select
                  name="${field.key}"
                >

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
            <label class="${fieldClass}">

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

}


// =====================================================
// OPEN DIALOG
// =====================================================

function openYouthDialog(
  youthId
) {

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


    idInput.value =
      "";


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
            field.type ===
            "number"
              ? Number(
                  input.value
                )
              : input.value.trim();

        }
      );


      if (
        payload.birthDate
      ) {

        const calculatedAge =
          calculateAge(
            payload.birthDate
          );


        if (
          calculatedAge === null
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


          await logActivity({

            email:
              auth.currentUser
                ?.email,

            role:
              "admin",

            activity:
              "Edited youth profile",

            details:
              `${payload.fullName} • Age ${payload.age} • ${payload.status}`

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


          await logActivity({

            email:
              auth.currentUser
                ?.email,

            role:
              "admin",

            activity:
              "Added youth profile",

            details:
              `${payload.fullName} • Age ${payload.age} • ${payload.status}`

          });

        }


        youthDialog.close();


        await loadYouth();


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

async function deleteYouth(
  youthId
) {

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


    await logActivity({

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


    await loadYouth();

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


  if (!reportSummary) {
    return;
  }


  const activeYouth =
    youthList.filter(
      isActiveYouth
    );


  const status = {

    Active:
      activeYouth.length,

    Archived:
      youthList.length -
      activeYouth.length

  };


  const gender =
    countBy(
      activeYouth,
      youth =>
        youth.gender
    );


  const education =
    countBy(
      activeYouth,
      youth =>
        youth.education
    );


  const educationStatus =
    countBy(
      activeYouth,
      youth =>
        youth.educationStatus
    );


  const employment =
    countBy(
      activeYouth,
      youth =>
        youth.employment
    );


  const voter =
    countBy(
      activeYouth,
      youth =>
        youth.voterStatus
    );


  const voterParticipation =
    countBy(
      activeYouth,
      youth =>
        youth.voterParticipation
    );


  const newVoter =
    countBy(
      activeYouth,
      youth =>
        youth.newVoter
    );


  const civic =
    countBy(
      activeYouth,
      youth =>
        youth.civic
    );


  const specialNeeds =
    countBy(
      activeYouth,
      youth =>
        youth.specialNeeds
    );


  function summaryBox(
    title,
    counts
  ) {

    const items =
      Object
        .entries(
          counts
        )
        .map(
          ([key, value]) =>
            `
              <li>

                ${escapeHtml(key)}:

                <strong>
                  ${value}
                </strong>

              </li>
            `
        )
        .join("");


    return `
      <div class="summary-box">

        <h3>
          ${escapeHtml(title)}
        </h3>

        <ul>

          ${
            items ||
            "<li>No data yet</li>"
          }

        </ul>

      </div>
    `;

  }


  reportSummary.innerHTML =

    summaryBox(
      "Youth Status",
      status
    ) +

    summaryBox(
      "Gender Breakdown",
      gender
    ) +

    summaryBox(
      "Education Level",
      education
    ) +

    summaryBox(
      "Education Status",
      educationStatus
    ) +

    summaryBox(
      "Employment Status",
      employment
    ) +

    summaryBox(
      "Voter Registration",
      voter
    ) +

    summaryBox(
      "Voter Participation",
      voterParticipation
    ) +

    summaryBox(
      "New Voter Status",
      newVoter
    ) +

    summaryBox(
      "Civic Participation",
      civic
    ) +

    summaryBox(
      "Special Needs",
      specialNeeds
    );

}


// =====================================================
// PRINT / PDF
// =====================================================

const printReportBtn =
  document.getElementById(
    "printReportBtn"
  );


if (printReportBtn) {

  printReportBtn.addEventListener(
    "click",
    async () => {

      await logActivity({

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
// CSV EXPORT
// =====================================================

const downloadCsvBtn =
  document.getElementById(
    "downloadCsvBtn"
  );


if (downloadCsvBtn) {

  downloadCsvBtn.addEventListener(
    "click",
    async () => {

      const headers = [

        "fullName",
        "email",
        "birthDate",
        "age",
        "status",
        "eligibility",
        "gender",
        "address",
        "contact",
        "education",
        "educationStatus",
        "employment",
        "civic",
        "voterStatus",
        "newVoter",
        "voterParticipation",
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
                    youth[header] ??
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

        ].join("\n");


      const blob =
        new Blob(
          [csv],
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


      await logActivity({

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
// AUDIT TRAIL
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


    const logs = [];


    snap.forEach(
      documentSnapshot => {

        logs.push({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()

        });

      }
    );


    logs.sort(
      (a, b) => {

        const aTime =
          a.timestamp
            ?.toDate
            ? a.timestamp
                .toDate()
            : new Date(
                a.timestamp
              );


        const bTime =
          b.timestamp
            ?.toDate
            ? b.timestamp
                .toDate()
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
      logs.length === 0
    ) {

      tbody.innerHTML =
        `
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
              log.timestamp
                ?.toDate
                ? log.timestamp
                    .toDate()
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


    tbody.innerHTML =
      `
        <tr>

          <td
            colspan="5"
            class="empty-state"
          >
            Unable to load audit logs.
          </td>

        </tr>
      `;

  }

}


// =====================================================
// CLEAR AUDIT LOG
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
            documentSnapshot =>

              deleteDoc(
                doc(
                  db,
                  "auditLogs",
                  documentSnapshot.id
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
          "Something went wrong while clearing logs."
        );

      }

    }
  );

}


// =====================================================
// ADMIN ACCOUNTS
// =====================================================

async function loadAdminAccounts() {

  const body =
    document.getElementById(
      "accountsTableBody"
    );


  if (!body) {
    return;
  }


  try {

    const snap =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    const admins = [];


    snap.forEach(
      documentSnapshot => {

        const data =
          documentSnapshot.data();


        if (
          data.role ===
          "admin"
        ) {

          admins.push({

            id:
              documentSnapshot.id,

            ...data

          });

        }

      }
    );


    if (
      admins.length === 0
    ) {

      body.innerHTML =
        `
          <tr>

            <td
              colspan="5"
              class="empty-state"
            >
              No admin accounts found.
            </td>

          </tr>
        `;


      return;

    }


    body.innerHTML =
      admins
        .map(
          admin => `

            <tr>

              <td>
                ${escapeHtml(
                  admin.fullName
                )}
              </td>

              <td>
                ${escapeHtml(
                  admin.email
                )}
              </td>

              <td>
                Admin
              </td>

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

  } catch (error) {

    console.error(
      "Admin account load error:",
      error
    );


    body.innerHTML =
      `
        <tr>

          <td
            colspan="5"
            class="empty-state"
          >
            Unable to load admin accounts.
          </td>

        </tr>
      `;

  }

}


// =====================================================
// ANNOUNCEMENTS
// =====================================================

const announcementForm =
  document.getElementById(
    "announcementForm"
  );


const announcementTitle =
  document.getElementById(
    "announcementTitle"
  );


const announcementCategory =
  document.getElementById(
    "announcementCategory"
  );


const announcementMessage =
  document.getElementById(
    "announcementMessage"
  );


const publishAnnouncementBtn =
  document.getElementById(
    "publishAnnouncementBtn"
  );


const announcementTableBody =
  document.getElementById(
    "announcementTableBody"
  );


// =====================================================
// ANNOUNCEMENT DATE
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


// =====================================================
// LOAD ANNOUNCEMENTS
// =====================================================

async function loadAnnouncements() {

  if (!announcementTableBody) {

    return;

  }


  announcementTableBody.innerHTML =
    `
      <tr>

        <td
          colspan="5"
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

      announcementTableBody.innerHTML =
        `
          <tr>

            <td
              colspan="5"
              class="empty-state"
            >
              No announcements published yet.
            </td>

          </tr>
        `;


      return;

    }


    announcementTableBody.innerHTML =
      announcements
        .map(
          announcement => {

            const date =
              getAnnouncementDate(
                announcement.createdAt
              );


            return `
              <tr>

                <td>
                  ${escapeHtml(
                    date.toLocaleString()
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    announcement.category
                  )}
                </td>

                <td>

                  <strong>
                    ${escapeHtml(
                      announcement.title
                    )}
                  </strong>

                </td>

                <td>
                  ${escapeHtml(
                    announcement.message
                  )}
                </td>

                <td>

                  <button
                    class="action-btn delete"
                    data-delete-announcement="${announcement.id}"
                    title="Delete Announcement"
                  >
                    🗑
                  </button>

                </td>

              </tr>
            `;

          }
        )
        .join("");


    document
      .querySelectorAll(
        "[data-delete-announcement]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>

              deleteAnnouncement(
                button.dataset
                  .deleteAnnouncement
              )

          );

        }
      );

  } catch (error) {

    console.error(
      "Announcement load error:",
      error
    );


    announcementTableBody.innerHTML =
      `
        <tr>

          <td
            colspan="5"
            class="empty-state"
          >
            Unable to load announcements.
          </td>

        </tr>
      `;

  }

}


// =====================================================
// PUBLISH ANNOUNCEMENT
// =====================================================

if (announcementForm) {

  announcementForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const title =
        announcementTitle
          ?.value
          .trim();


      const category =
        announcementCategory
          ?.value;


      const message =
        announcementMessage
          ?.value
          .trim();


      if (
        !title ||
        !category ||
        !message
      ) {

        alert(
          "Please complete all announcement fields."
        );


        return;

      }


      if (publishAnnouncementBtn) {

        publishAnnouncementBtn.disabled =
          true;


        publishAnnouncementBtn.textContent =
          "Publishing...";

      }


      try {

        await addDoc(
          collection(
            db,
            "announcements"
          ),
          {

            title,

            category,

            message,

            createdAt:
              new Date(),

            createdBy:
              auth.currentUser
                ?.email ||
              "Admin"

          }
        );


        await logActivity({

          email:
            auth.currentUser
              ?.email,

          role:
            "admin",

          activity:
            "Published announcement",

          details:
            title

        });


        announcementForm.reset();


        await loadAnnouncements();


        alert(
          "Announcement published successfully!"
        );

      } catch (error) {

        console.error(
          "Publish announcement error:",
          error
        );


        alert(
          "Unable to publish announcement. Please try again."
        );

      } finally {

        if (publishAnnouncementBtn) {

          publishAnnouncementBtn.disabled =
            false;


          publishAnnouncementBtn.textContent =
            "Publish Announcement";

        }

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

  const confirmed =
    confirm(
      "Delete this announcement? This cannot be undone."
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


    await logActivity({

      email:
        auth.currentUser
          ?.email,

      role:
        "admin",

      activity:
        "Deleted announcement",

      details:
        announcementId

    });


    await loadAnnouncements();

  } catch (error) {

    console.error(
      "Delete announcement error:",
      error
    );


    alert(
      "Unable to delete announcement."
    );

  }

}


// =====================================================
// INIT
// =====================================================

populateFilterOptions();

loadYouth();

loadAdminAccounts();

loadAuditLogs();

loadAnnouncements();