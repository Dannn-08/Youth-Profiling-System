import { auth, db } from "./firebase-config.js";
import {
  collection, getDocs, doc, addDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./audit-log.js";

// ---------- Field definitions (shared by the Add/Edit dialog) ----------
const FIELDS = [
  { key: "fullName", label: "Full Name", type: "text", full: true },
  { key: "email", label: "Email", type: "email", full: true },
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

let youthList = [];   // all youth records from Firestore
let charts = {};      // keep chart instances so we can destroy/redraw

// ---------- Helpers ----------
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function ageGroup(age) {
  const n = Number(age);
  if (n >= 15 && n <= 19) return "15-19";
  if (n >= 20 && n <= 24) return "20-24";
  if (n >= 25 && n <= 30) return "25-30";
  return "Unspecified";
}

function countBy(list, keyFn) {
  const counts = {};
  list.forEach(item => {
    const key = keyFn(item) || "Unspecified";
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

// ---------- Tab switching ----------
const tabButtons = document.querySelectorAll(".tab-nav button[data-tab]");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ---------- Load data ----------
async function loadYouth() {
  document.getElementById("statCards").innerHTML = `<p class="empty-state">Loading dashboard data...</p>`;
  document.getElementById("youthTableBody").innerHTML = `<tr><td colspan="8" class="empty-state">Loading youth records...</td></tr>`;

  const snap = await getDocs(collection(db, "users"));
  youthList = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.role === "youth") {
      youthList.push({ id: d.id, ...data });
    }
  });

  renderStats();
  renderCharts();
  renderTable();
  renderReports();
}

// ---------- Stats cards ----------
function renderStats() {
  const total = youthList.length;
  const male = youthList.filter(y => y.gender === "Male").length;
  const female = youthList.filter(y => y.gender === "Female").length;
  const students = youthList.filter(y => y.employment === "Student").length;

  const cards = [
    { label: "Total Youth", value: total },
    { label: "Male", value: male },
    { label: "Female", value: female },
    { label: "Students", value: students }
  ];

  document.getElementById("statCards").innerHTML = cards.map(c => `
    <div class="panel stat-card">
      <small>${escapeHtml(c.label)}</small>
      <strong>${c.value}</strong>
    </div>
  `).join("");
}

// ---------- Charts ----------
function drawChart(canvasId, type, labels, data, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  // Manually size the canvas based on its wrapper's current box, instead of
  // letting Chart.js auto-watch/resize it. This avoids a resize feedback
  // loop that can make the canvas grow uncontrollably in some browsers.
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  charts[canvasId] = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors || ["#0a5255", "#d8ad76", "#5f8c8d", "#89babd", "#063f42", "#e8f2f1"]
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function renderCharts() {
  const gender = countBy(youthList, y => y.gender);
  drawChart("genderChart", "doughnut", Object.keys(gender), Object.values(gender));

  const ages = countBy(youthList, y => ageGroup(y.age));
  drawChart("ageChart", "bar", Object.keys(ages), Object.values(ages));

  const education = countBy(youthList, y => y.education);
  drawChart("educationChart", "bar", Object.keys(education), Object.values(education));

  const employment = countBy(youthList, y => y.employment);
  drawChart("employmentChart", "doughnut", Object.keys(employment), Object.values(employment));

  const voter = countBy(youthList, y => y.voterStatus);
  drawChart("voterChart", "doughnut", Object.keys(voter), Object.values(voter));

  const sportsCounts = {};
  youthList.forEach(y => {
    (y.sports || "").split(",").map(s => s.trim()).filter(Boolean).forEach(sport => {
      sportsCounts[sport] = (sportsCounts[sport] || 0) + 1;
    });
  });
  const topSports = Object.entries(sportsCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  drawChart("sportsChart", "bar", topSports.map(s => s[0]), topSports.map(s => s[1]));
}

// ---------- Youth Management table ----------
const searchInput = document.getElementById("youthSearch");
const filterGender = document.getElementById("filterGender");
const filterEducation = document.getElementById("filterEducation");
const filterEmployment = document.getElementById("filterEmployment");
const clearFiltersBtn = document.getElementById("clearFilters");

function populateFilterOptions() {
  const eduOptions = ["Elementary", "High School", "Senior High School", "College", "Vocational", "Graduate", "Out of School Youth"];
  const empOptions = ["Student", "Employed", "Unemployed", "Self-employed"];

  filterEducation.innerHTML = `<option value="">All Education</option>` +
    eduOptions.map(o => `<option value="${o}">${o}</option>`).join("");

  filterEmployment.innerHTML = `<option value="">All Employment</option>` +
    empOptions.map(o => `<option value="${o}">${o}</option>`).join("");
}

function getFilteredYouth() {
  const term = (searchInput.value || "").toLowerCase().trim();

  return youthList.filter(y => {
    const matchesSearch = !term ||
      (y.fullName || "").toLowerCase().includes(term) ||
      (y.email || "").toLowerCase().includes(term) ||
      (y.address || "").toLowerCase().includes(term);

    const matchesGender = !filterGender.value || y.gender === filterGender.value;
    const matchesEducation = !filterEducation.value || y.education === filterEducation.value;
    const matchesEmployment = !filterEmployment.value || y.employment === filterEmployment.value;

    return matchesSearch && matchesGender && matchesEducation && matchesEmployment;
  });
}

function renderTable() {
  const filtered = getFilteredYouth();

  document.getElementById("youthTableBody").innerHTML = filtered.map(y => `
    <tr>
      <td>${escapeHtml(y.fullName)}</td>
      <td>${escapeHtml(y.email)}</td>
      <td>${escapeHtml(y.age)}</td>
      <td>${escapeHtml(y.gender)}</td>
      <td>${escapeHtml(y.education)}</td>
      <td>${escapeHtml(y.employment)}</td>
      <td><span class="status-pill">Active</span></td>
      <td>
        <div class="action-row">
          <button class="action-btn edit" data-edit="${y.id}" title="Edit">✎</button>
          <button class="action-btn delete" data-delete="${y.id}" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join("");

  document.getElementById("youthCountText").textContent =
    `Showing ${filtered.length} of ${youthList.length} youth records`;

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openYouthDialog(btn.dataset.edit));
  });
  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteYouth(btn.dataset.delete));
  });
}

[searchInput, filterGender, filterEducation, filterEmployment].forEach(el => {
  el.addEventListener("input", renderTable);
  el.addEventListener("change", renderTable);
});

clearFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  filterGender.value = "";
  filterEducation.value = "";
  filterEmployment.value = "";
  renderTable();
});

// ---------- Add / Edit dialog ----------
const youthDialog = document.getElementById("youthDialog");
const youthDialogTitle = document.getElementById("youthDialogTitle");
const youthFieldsEl = document.getElementById("adminYouthFields");
const saveYouthBtn = document.getElementById("saveYouthAdminBtn");
const idInput = document.querySelector('#adminYouthForm [name="id"]');

document.getElementById("openAddYouth").addEventListener("click", () => openYouthDialog(null));

function buildYouthFields(data = {}) {
  youthFieldsEl.innerHTML = FIELDS.map(f => {
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

function openYouthDialog(youthId) {
  if (youthId) {
    const existing = youthList.find(y => y.id === youthId);
    youthDialogTitle.textContent = "Edit Youth Profile";
    idInput.value = youthId;
    buildYouthFields(existing || {});
  } else {
    youthDialogTitle.textContent = "Add Youth Profile";
    idInput.value = "";
    buildYouthFields({});
  }
  youthDialog.showModal();
}

saveYouthBtn.addEventListener("click", async () => {
  saveYouthBtn.disabled = true;
  saveYouthBtn.textContent = "Saving...";

  const payload = {};
  FIELDS.forEach(f => {
    const input = youthFieldsEl.querySelector(`[name="${f.key}"]`);
    if (!input) return;
    payload[f.key] = f.type === "number" ? Number(input.value) : input.value.trim();
  });
  payload.role = "youth";

  try {
    if (idInput.value) {
      await updateDoc(doc(db, "users", idInput.value), payload);
      await logActivity({
        email: auth.currentUser?.email,
        role: "admin",
        activity: "Edited youth profile",
        details: payload.fullName
      });
    } else {
      payload.createdAt = new Date();
      await addDoc(collection(db, "users"), payload);
      await logActivity({
        email: auth.currentUser?.email,
        role: "admin",
        activity: "Added youth profile",
        details: payload.fullName
      });
    }

    youthDialog.close();
    await loadYouth();
    alert("Youth profile saved!");

  } catch (error) {
    console.log(error.code);
    console.log(error.message);
    alert("Something went wrong while saving. Please try again.");
  } finally {
    saveYouthBtn.disabled = false;
    saveYouthBtn.textContent = "Save Profile";
  }
});

async function deleteYouth(youthId) {
  if (!confirm("Are you sure you want to delete this youth profile? This cannot be undone.")) return;

  const target = youthList.find(y => y.id === youthId);

  try {
    await deleteDoc(doc(db, "users", youthId));
    await logActivity({
      email: auth.currentUser?.email,
      role: "admin",
      activity: "Deleted youth profile",
      details: target?.fullName || youthId
    });
    await loadYouth();
  } catch (error) {
    console.log(error.code);
    console.log(error.message);
    alert("Something went wrong while deleting. Please try again.");
  }
}

// ---------- Reports tab ----------
function renderReports() {
  const gender = countBy(youthList, y => y.gender);
  const education = countBy(youthList, y => y.education);
  const employment = countBy(youthList, y => y.employment);
  const voter = countBy(youthList, y => y.voterStatus);

  function summaryBox(title, counts) {
    const items = Object.entries(counts).map(([k, v]) => `<li>${escapeHtml(k)}: <strong>${v}</strong></li>`).join("");
    return `
      <div class="summary-box">
        <h3>${escapeHtml(title)}</h3>
        <ul>${items || "<li>No data yet</li>"}</ul>
      </div>
    `;
  }

  document.getElementById("reportSummary").innerHTML =
    summaryBox("Gender Breakdown", gender) +
    summaryBox("Education Breakdown", education) +
    summaryBox("Employment Breakdown", employment) +
    summaryBox("Voter Registration Breakdown", voter);
}

document.getElementById("printReportBtn").addEventListener("click", () => window.print());

document.getElementById("downloadCsvBtn").addEventListener("click", () => {
  const headers = ["fullName", "email", "age", "gender", "address", "contact", "education", "educationStatus", "employment", "civic", "voterStatus", "newVoter", "voterParticipation", "specialNeeds", "assistance", "hobbies", "sports"];

  const rows = youthList.map(y => headers.map(h => `"${String(y[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bukal-youth-data.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- Audit Trail tab ----------
async function loadAuditLogs() {
  const snap = await getDocs(collection(db, "auditLogs"));
  const logs = [];
  snap.forEach(d => logs.push({ id: d.id, ...d.data() }));

  // newest first
  logs.sort((a, b) => {
    const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return bTime - aTime;
  });

  const tbody = document.getElementById("auditTableBody");

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No activity recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const time = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    return `
      <tr>
        <td>${escapeHtml(time.toLocaleString())}</td>
        <td>${escapeHtml(log.email)}</td>
        <td>${escapeHtml(log.role)}</td>
        <td>${escapeHtml(log.activity)}</td>
        <td>${escapeHtml(log.details)}</td>
      </tr>
    `;
  }).join("");
}

document.getElementById("clearAuditBtn").addEventListener("click", async () => {
  if (!confirm("Clear all audit log entries? This cannot be undone.")) return;

  try {
    const snap = await getDocs(collection(db, "auditLogs"));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "auditLogs", d.id))));
    await loadAuditLogs();
  } catch (error) {
    console.log(error.code);
    console.log(error.message);
    alert("Something went wrong while clearing logs. Please try again.");
  }
});

// ---------- Settings tab: admin accounts list ----------
async function loadAdminAccounts() {
  const snap = await getDocs(collection(db, "users"));
  const admins = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.role === "admin") admins.push({ id: d.id, ...data });
  });

  document.getElementById("accountsTableBody").innerHTML = admins.map(a => `
    <tr>
      <td>${escapeHtml(a.fullName)}</td>
      <td>${escapeHtml(a.email)}</td>
      <td>Admin</td>
      <td><span class="status-pill">Active</span></td>
      <td><span class="muted-text">Managed via Firebase Auth</span></td>
    </tr>
  `).join("");
}

// ---------- Init ----------
populateFilterOptions();
loadYouth();
loadAdminAccounts();
loadAuditLogs();

// Redraw charts on window resize (debounced), since we handle sizing
// manually instead of using Chart.js's built-in responsive watcher.
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderCharts, 200);
});