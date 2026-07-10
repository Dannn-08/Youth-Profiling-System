import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_KEY",
  authDomain: "PASTE_YOUR_DOMAIN",
  projectId: "PASTE_YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);

(function () {
  "use strict";

  const DB_KEY = "bukal_youth_data_v1";
  const SESSION_KEY = "bukal_youth_session_v1";
  const ADMIN_CODE = "BUKAL-SK-2026";

  const profileFields = [
    { name: "fullName", label: "Full Name", type: "text", required: true, full: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Password", type: "password", required: false },
    { name: "age", label: "Age", type: "number", required: true, attrs: 'min="15" max="30"' },
    { name: "gender", label: "Gender", type: "select", required: true, options: ["", "Male", "Female", "Prefer not to say"] },
    { name: "address", label: "Address / Purok", type: "text", required: true, full: true },
    { name: "contact", label: "Contact Number", type: "text", required: true, full: true },
    { name: "education", label: "Educational Attainment", type: "select", required: true, options: ["", "Elementary", "High School", "Senior High School", "College", "Vocational", "Graduate", "Out of School Youth"] },
    { name: "educationStatus", label: "Current Education Status", type: "select", required: true, options: ["", "Currently Studying", "Not Studying", "Graduated"] },
    { name: "employment", label: "Employment Status", type: "select", required: true, options: ["", "Student", "Employed", "Unemployed", "Self-employed"] },
    { name: "civic", label: "Civic Participation", type: "select", required: true, options: ["", "Active", "Occasional", "Not Active"] },
    { name: "voterStatus", label: "Voter Registration Status", type: "select", required: true, options: ["", "Registered Voter", "Not Registered"] },
    { name: "newVoter", label: "New Voter Status", type: "select", required: true, options: ["", "New Voter", "Existing Voter", "Not Applicable"] },
    { name: "voterParticipation", label: "Voter Participation", type: "select", required: true, options: ["", "Participated", "Not Participated", "Not Applicable"] },
    { name: "specialNeeds", label: "Special Needs", type: "select", required: true, options: ["", "No", "Yes"] },
    { name: "assistance", label: "Specific Assistance Needed", type: "text", required: false, full: true },
    { name: "hobbies", label: "Hobbies / Skills", type: "text", required: true, full: true },
    { name: "sports", label: "Sports Interests", type: "text", required: true, full: true }
  ];

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function makeProfile(userId, fullName, email, age, gender, address, education, educationStatus, employment, civic, voterStatus, newVoter, voterParticipation, specialNeeds, assistance, hobbies, sports) {
    return {
      id: userId,
      userId,
      fullName,
      email,
      age: Number(age),
      gender,
      address,
      contact: "09XX XXX XXXX",
      education,
      educationStatus,
      employment,
      civic,
      voterStatus,
      newVoter,
      voterParticipation,
      specialNeeds,
      assistance,
      hobbies,
      sports,
      active: true,
      createdAt: now(),
      updatedAt: now()
    };
  }

  function seedDB() {
    const createdAt = now();

    return {
      users: [
        { id: "admin_default", fullName: "SK Administrator", email: "admin@bukal.gov.ph", password: "admin12345", role: "admin", active: true, createdAt },
        { id: "youth_sample_1", fullName: "Test Youth", email: "youth_2160@example.com", password: "password123", role: "youth", active: true, createdAt },
        { id: "youth_sample_2", fullName: "Mama", email: "mama@gmail.com", password: "password123", role: "youth", active: true, createdAt },
        { id: "youth_sample_3", fullName: "John", email: "john@gmail.com", password: "password123", role: "youth", active: true, createdAt },
        { id: "youth_sample_4", fullName: "Mar", email: "mar@gmail.com", password: "password123", role: "youth", active: true, createdAt },
        { id: "youth_sample_5", fullName: "Mar John Ayala", email: "marjohnyala0707@gmail.com", password: "password123", role: "youth", active: true, createdAt },
        { id: "youth_sample_6", fullName: "Missy", email: "missy@gmail.com", password: "password123", role: "youth", active: true, createdAt },
        { id: "youth_sample_7", fullName: "Missy Dequina Ayala", email: "ayala@gmail.com", password: "password123", role: "youth", active: true, createdAt }
      ],

      youthProfiles: [
        makeProfile("youth_sample_1", "Test Youth", "youth_2160@example.com", 22, "Male", "Purok 1, Barangay Bukal", "College", "Currently Studying", "Student", "Active", "Registered Voter", "New Voter", "Participated", "No", "N/A", "Coding, drawing", "Basketball"),
        makeProfile("youth_sample_2", "Mama", "mama@gmail.com", 17, "Female", "Purok 2, Barangay Bukal", "Senior High School", "Currently Studying", "Student", "Occasional", "Not Registered", "Not Applicable", "Not Applicable", "No", "N/A", "Dancing, singing", "Volleyball"),
        makeProfile("youth_sample_3", "John", "john@gmail.com", 24, "Male", "Purok 3, Barangay Bukal", "College", "Graduated", "Employed", "Active", "Registered Voter", "Existing Voter", "Participated", "No", "N/A", "Music, driving", "Basketball"),
        makeProfile("youth_sample_4", "Mar", "mar@gmail.com", 25, "Male", "Purok 4, Barangay Bukal", "College", "Graduated", "Self-employed", "Active", "Registered Voter", "Existing Voter", "Participated", "No", "N/A", "Photography, editing", "Badminton"),
        makeProfile("youth_sample_5", "Mar John Ayala", "marjohnyala0707@gmail.com", 22, "Male", "Purok 5, Barangay Bukal", "College", "Currently Studying", "Student", "Active", "Registered Voter", "Existing Voter", "Participated", "No", "N/A", "Web development", "Basketball"),
        makeProfile("youth_sample_6", "Missy", "missy@gmail.com", 21, "Female", "Purok 6, Barangay Bukal", "College", "Currently Studying", "Student", "Occasional", "Registered Voter", "Existing Voter", "Participated", "No", "N/A", "Reading, cooking", "Volleyball"),
        makeProfile("youth_sample_7", "Missy Dequina Ayala", "ayala@gmail.com", 17, "Female", "Berana Compound", "N/A", "N/A", "N/A", "Not Active", "Not Registered", "Not Applicable", "Not Applicable", "No", "N/A", "No skills added", "No interest added")
      ],

      audit: [
        {
          id: uid("log"),
          at: createdAt,
          user: "System",
          role: "system",
          activity: "Seed Data Created",
          details: "Initial records were prepared for capstone presentation."
        }
      ]
    };
  }

  function getDB() {
    const raw = localStorage.getItem(DB_KEY);

    if (!raw) {
      const db = seedDB();
      saveDB(db);
      return db;
    }

    try {
      const db = JSON.parse(raw);
      db.users ||= [];
      db.youthProfiles ||= [];
      db.audit ||= [];
      return db;
    } catch {
      const db = seedDB();
      saveDB(db);
      return db;
    }
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      userId: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    }));
  }

  function currentUser() {
    const db = getDB();
    const session = getSession();

    if (!session) return null;

    return db.users.find(user => user.id === session.userId) || null;
  }

  function logActivity(activity, details = "") {
    const db = getDB();
    const user = currentUser();

    db.audit.unshift({
      id: uid("log"),
      at: now(),
      user: user ? user.fullName : "Guest",
      role: user ? user.role : "guest",
      activity,
      details
    });

    db.audit = db.audit.slice(0, 500);
    saveDB(db);
  }

  function toast(message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const element = document.createElement("div");
    element.className = `toast ${type}`;
    element.textContent = message;

    document.body.appendChild(element);

    setTimeout(() => element.remove(), 3300);
  }

  function formToObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function requireRole(role) {
    const user = currentUser();

    if (!user || user.role !== role || !user.active) {
      toast("Please login first.", "warn");
      setTimeout(() => {
        location.href = role === "admin" ? "admin-login.html" : "youth-login.html";
      }, 600);
      return null;
    }

    return user;
  }

  function login(email, password, role) {
    const db = getDB();

    const user = db.users.find(item =>
      normalizeEmail(item.email) === normalizeEmail(email) &&
      item.password === password &&
      item.role === role
    );

    if (!user) throw new Error("Invalid email or password.");
    if (!user.active) throw new Error("This account is deactivated. Please contact the administrator.");

    setSession(user);
    logActivity("Login", `${user.fullName} signed in.`);

    location.href = role === "admin" ? "admin-dashboard.html" : "youth-dashboard.html";
  }

  function registerYouth(data, createdByAdmin = false) {
    const db = getDB();

    data.email = normalizeEmail(data.email);
    data.fullName = String(data.fullName || "").trim();
    data.age = Number(data.age);

    if (!data.fullName || !data.email || !data.age || !data.gender || !data.address) {
      throw new Error("Please complete all required fields.");
    }

    if (data.age < 15 || data.age > 30) {
      throw new Error("Only youth residents aged 15 to 30 are accepted in the system.");
    }

    if (db.users.some(user => normalizeEmail(user.email) === data.email && user.id !== data.id)) {
      throw new Error("Email address is already registered.");
    }

    const id = data.id || uid("youth");
    const existingUser = db.users.find(user => user.id === id);
    const password = data.password || (existingUser ? existingUser.password : "password123");

    if (existingUser) {
      Object.assign(existingUser, {
        fullName: data.fullName,
        email: data.email,
        password,
        active: data.active !== false
      });
    } else {
      db.users.push({
        id,
        fullName: data.fullName,
        email: data.email,
        password,
        role: "youth",
        active: true,
        createdAt: now()
      });
    }

    const profile = {
      id,
      userId: id,
      fullName: data.fullName,
      email: data.email,
      age: data.age,
      gender: data.gender,
      address: data.address,
      contact: data.contact || "",
      education: data.education || "N/A",
      educationStatus: data.educationStatus || "N/A",
      employment: data.employment || "N/A",
      civic: data.civic || "N/A",
      voterStatus: data.voterStatus || "N/A",
      newVoter: data.newVoter || "N/A",
      voterParticipation: data.voterParticipation || "N/A",
      specialNeeds: data.specialNeeds || "No",
      assistance: data.assistance || "N/A",
      hobbies: data.hobbies || "N/A",
      sports: data.sports || "N/A",
      active: data.active !== false,
      createdAt: data.createdAt || now(),
      updatedAt: now()
    };

    const index = db.youthProfiles.findIndex(profile => profile.id === id);

    if (index >= 0) {
      db.youthProfiles[index] = { ...db.youthProfiles[index], ...profile };
    } else {
      db.youthProfiles.push(profile);
    }

    saveDB(db);

    logActivity(
      createdByAdmin ? "Youth Profile Saved by Admin" : "Youth Registration",
      `${profile.fullName} profile saved.`
    );

    return profile;
  }

  function registerAdmin(data) {
    const db = getDB();
    const email = normalizeEmail(data.email);

    if (data.securityCode !== ADMIN_CODE) {
      throw new Error("Invalid admin security code.");
    }

    if (db.users.some(user => normalizeEmail(user.email) === email)) {
      throw new Error("Email address is already registered.");
    }

    const user = {
      id: uid("admin"),
      fullName: String(data.fullName || "").trim(),
      email,
      password: data.password,
      role: "admin",
      active: true,
      createdAt: now()
    };

    db.users.push(user);
    saveDB(db);

    logActivity("Admin Registration", `${user.fullName} admin account created.`);

    return user;
  }

  function getYouthProfileByUser(userId) {
    const db = getDB();
    return db.youthProfiles.find(profile => profile.userId === userId || profile.id === userId) || null;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#039;",
      '"': "&quot;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function createField(field, value = "") {
    const label = document.createElement("label");
    label.className = `field ${field.full ? "full" : ""}`;

    const required = field.required ? "required" : "";
    const attrs = field.attrs || "";

    let input = "";

    if (field.type === "select") {
      input = `
        <select name="${field.name}" ${required}>
          ${field.options.map(option => `
            <option value="${escapeHtml(option)}" ${String(value) === option ? "selected" : ""}>
              ${option || "Select"}
            </option>
          `).join("")}
        </select>
      `;
    } else {
      const fieldValue = field.name === "password" ? "" : value;
      const placeholder = field.name === "password" ? "Leave blank to keep current password" : "";

      input = `
        <input
          type="${field.type}"
          name="${field.name}"
          value="${escapeAttr(fieldValue)}"
          ${required}
          ${attrs}
          placeholder="${placeholder}"
        />
      `;
    }

    label.innerHTML = `<span>${field.label}</span>${input}`;

    return label;
  }

  function buildProfileForm(container, profile = {}) {
    container.innerHTML = "";
    profileFields.forEach(field => {
      container.appendChild(createField(field, profile[field.name] || ""));
    });
  }

  function groupCount(items, key) {
    return items.reduce((acc, item) => {
      const value = item[key] || "N/A";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  function countTerms(items, key) {
    const counts = {};

    items.forEach(item => {
      String(item[key] || "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean)
        .forEach(term => {
          counts[term] = (counts[term] || 0) + 1;
        });
    });

    return Object.fromEntries(
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    );
  }

  function ageGroups(items) {
    const groups = {
      "15-18": 0,
      "19-24": 0,
      "25-30": 0,
      "31+": 0
    };

    items.forEach(profile => {
      const age = Number(profile.age);

      if (age <= 18) groups["15-18"]++;
      else if (age <= 24) groups["19-24"]++;
      else if (age <= 30) groups["25-30"]++;
      else groups["31+"]++;
    });

    return groups;
  }

  function activeYouth() {
    return getDB().youthProfiles.filter(profile => profile.active !== false);
  }

  function initHome() {
    getDB();
  }

  function initYouthRegister() {
    getDB();

    const form = document.getElementById("youthRegisterForm");

    form?.addEventListener("submit", event => {
      event.preventDefault();

      try {
        const profile = registerYouth(formToObject(form));
        const user = getDB().users.find(user => user.id === profile.userId);

        setSession(user);

        toast("Registration successful. Redirecting to your dashboard...");

        setTimeout(() => {
          location.href = "youth-dashboard.html";
        }, 700);
      } catch (error) {
        toast(error.message, "error");
      }
    });
  }

  function initLogin(role) {
    getDB();

    document.querySelector("[data-forgot]")?.addEventListener("click", event => {
      event.preventDefault();
      toast("Ask the SK administrator to update your account password.", "warn");
    });

    const form = document.getElementById(role === "admin" ? "adminLoginForm" : "youthLoginForm");

    form?.addEventListener("submit", event => {
      event.preventDefault();

      try {
        const data = formToObject(form);
        login(data.email, data.password, role);
      } catch (error) {
        toast(error.message, "error");
      }
    });
  }

  function initAdminRegister() {
    getDB();

    const form = document.getElementById("adminRegisterForm");

    form?.addEventListener("submit", event => {
      event.preventDefault();

      try {
        registerAdmin(formToObject(form));
        toast("Admin account created. Please login.");

        setTimeout(() => {
          location.href = "admin-login.html";
        }, 900);
      } catch (error) {
        toast(error.message, "error");
      }
    });
  }

  function initYouthDashboard() {
    const user = requireRole("youth");
    if (!user) return;

    const profile = getYouthProfileByUser(user.id);

    document.getElementById("youthWelcome").textContent = `Welcome, ${user.fullName}`;

    renderYouthProfile(profile);

    const dialog = document.getElementById("profileDialog");
    const fields = document.getElementById("profileEditFields");

    document.getElementById("editProfileBtn")?.addEventListener("click", () => {
      buildProfileForm(fields, getYouthProfileByUser(user.id));
      dialog.showModal();
    });

    document.getElementById("saveProfileBtn")?.addEventListener("click", () => {
      const data = formToObject(document.getElementById("profileEditForm"));
      data.id = user.id;
      data.createdAt = profile.createdAt;

      try {
        registerYouth(data);
        logActivity("Youth Profile Updated", `${data.fullName} updated personal profile.`);

        dialog.close();
        renderYouthProfile(getYouthProfileByUser(user.id));

        toast("Profile updated successfully.");
      } catch (error) {
        toast(error.message, "error");
      }
    });
  }

  function renderYouthProfile(profile) {
    const view = document.getElementById("youthProfileView");

    if (!profile) {
      view.innerHTML = `<p class="empty-state">No profile found.</p>`;
      return;
    }

    view.innerHTML = `
      ${infoSection("Basic Information", [
        ["Full Name", profile.fullName],
        ["Email", profile.email],
        ["Age", profile.age],
        ["Gender", profile.gender],
        ["Address", profile.address],
        ["Contact Number", profile.contact]
      ])}

      ${infoSection("Education & Employment", [
        ["Education Level", profile.education],
        ["Current Education Status", profile.educationStatus],
        ["Employment Status", profile.employment],
        ["Civic Participation", profile.civic]
      ])}

      ${infoSection("Voter & Support Information", [
        ["Voter Registration Status", profile.voterStatus],
        ["New Voter Status", profile.newVoter],
        ["Voter Participation", profile.voterParticipation],
        ["Special Needs", profile.specialNeeds],
        ["Assistance Needed", profile.assistance]
      ])}

      ${infoSection("Skills & Interests", [
        ["Skills / Hobbies", profile.hobbies],
        ["Sports Interests", profile.sports]
      ])}
    `;
  }

  function infoSection(title, pairs) {
    return `
      <section class="info-section">
        <h3>${title}</h3>
        <div class="info-grid">
          ${pairs.map(([label, value]) => `
            <div class="info-item">
              <small>${label}</small>
              <span>${escapeHtml(value || "Not specified")}</span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function initAdminDashboard() {
    const user = requireRole("admin");
    if (!user) return;

    bindLogout();
    bindTabs();
    bindAdminActions();
    renderAllAdmin();
  }

  function bindTabs() {
    document.querySelectorAll("[data-tab]").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-tab]").forEach(item => item.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));

        button.classList.add("active");
        document.getElementById(`tab-${button.dataset.tab}`).classList.add("active");

        if (button.dataset.tab === "overview") {
          setTimeout(renderCharts, 40);
        }
      });
    });
  }

  function bindLogout() {
    document.querySelectorAll("[data-logout]").forEach(button => {
      button.addEventListener("click", () => {
        logActivity("Logout", "User signed out.");
        sessionStorage.removeItem(SESSION_KEY);
        location.href = "index.html";
      });
    });
  }

  function bindAdminActions() {
    document.getElementById("youthSearch")?.addEventListener("input", renderYouthTable);

    ["filterGender", "filterEducation", "filterEmployment"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", renderYouthTable);
    });

    document.getElementById("clearFilters")?.addEventListener("click", () => {
      ["youthSearch", "filterGender", "filterEducation", "filterEmployment"].forEach(id => {
        document.getElementById(id).value = "";
      });

      renderYouthTable();
    });

    document.getElementById("openAddYouth")?.addEventListener("click", () => openYouthDialog());
    document.getElementById("saveYouthAdminBtn")?.addEventListener("click", saveYouthFromAdmin);
    document.getElementById("downloadCsvBtn")?.addEventListener("click", downloadCSV);
    document.getElementById("printReportBtn")?.addEventListener("click", printReport);

    document.getElementById("clearAuditBtn")?.addEventListener("click", () => {
      if (!confirm("Clear audit logs ?")) return;

      const db = getDB();
      db.audit = [];
      saveDB(db);

      logActivity("Audit Trail Cleared.");
      renderAuditTable();
    });

    document.getElementById("backupDataBtn")?.addEventListener("click", downloadBackup);

    document.getElementById("resetDemoBtn")?.addEventListener("click", () => {
      if (!confirm("")) return;

      localStorage.removeItem(DB_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      getDB();

      toast("Login again using the default admin account.");

      setTimeout(() => {
        location.href = "admin-login.html";
      }, 1200);
    });
  }

  function renderAllAdmin() {
    populateFilters();
    renderStats();
    renderCharts();
    renderYouthTable();
    renderReportSummary();
    renderAuditTable();
    renderAccounts();
  }

  function renderStats() {
    const youth = activeYouth();
    const genders = Object.keys(groupCount(youth, "gender")).length;
    const education = Object.keys(groupCount(youth, "education")).length;
    const employment = Object.keys(groupCount(youth, "employment")).length;

    document.getElementById("statCards").innerHTML = [
      ["Total Youth", youth.length, "people"],
      ["Gender Distribution", `${genders} categories`, "chart"],
      ["Education Levels", `${education} levels`, "cap"],
      ["Employment Types", `${employment} types`, "briefcase"]
    ].map(([label, value, icon]) => `
      <article class="panel stat-card">
        <small>${label}<span>${iconSymbol(icon)}</span></small>
        <strong>${value}</strong>
      </article>
    `).join("");
  }

  function iconSymbol(type) {
    return {
      people: "♙",
      chart: "⌁",
      cap: "◈",
      briefcase: "▣"
    }[type] || "•";
  }

  function populateFilters() {
    const youth = activeYouth();

    fillSelect("filterEducation", unique(youth.map(profile => profile.education)));
    fillSelect("filterEmployment", unique(youth.map(profile => profile.employment)));
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))].sort();
  }

  function fillSelect(id, values) {
    const select = document.getElementById(id);
    if (!select) return;

    const first = select.options[0].outerHTML;
    select.innerHTML = first + values.map(value => `<option>${escapeHtml(value)}</option>`).join("");
  }

  function filteredYouth() {
    const query = normalizeEmail(document.getElementById("youthSearch")?.value || "");
    const gender = document.getElementById("filterGender")?.value || "";
    const education = document.getElementById("filterEducation")?.value || "";
    const employment = document.getElementById("filterEmployment")?.value || "";

    return getDB().youthProfiles.filter(profile => {
      const text = `${profile.fullName} ${profile.email} ${profile.address}`.toLowerCase();

      return (
        (!query || text.includes(query)) &&
        (!gender || profile.gender === gender) &&
        (!education || profile.education === education) &&
        (!employment || profile.employment === employment)
      );
    });
  }

  function renderYouthTable() {
    const rows = filteredYouth();
    const tbody = document.getElementById("youthTableBody");

    if (!tbody) return;

    tbody.innerHTML = rows.length
      ? rows.map(profile => `
        <tr>
          <td><strong>${escapeHtml(profile.fullName)}</strong></td>
          <td>${escapeHtml(profile.email)}</td>
          <td>${escapeHtml(profile.age)}</td>
          <td>${escapeHtml(profile.gender)}</td>
          <td>${escapeHtml(profile.education)}</td>
          <td>${escapeHtml(profile.employment)}</td>
          <td>
            <span class="status-pill ${profile.active === false ? "off" : ""}">
              ${profile.active === false ? "Inactive" : "Active"}
            </span>
          </td>
          <td>
            <div class="action-row">
              <button class="action-btn view" title="View" data-view="${profile.id}">View</button>
              <button class="action-btn edit" title="Edit" data-edit="${profile.id}">✎</button>
              <button class="action-btn delete" title="Delete" data-delete="${profile.id}">🗑</button>
            </div>
          </td>
        </tr>
      `).join("")
      : `<tr><td colspan="8" class="empty-state">No youth records found.</td></tr>`;

    document.getElementById("youthCountText").textContent =
      `Showing ${rows.length} of ${getDB().youthProfiles.length} youth profiles`;

    tbody.querySelectorAll("[data-view]").forEach(button => {
      button.addEventListener("click", () => viewYouth(button.dataset.view));
    });

    tbody.querySelectorAll("[data-edit]").forEach(button => {
      button.addEventListener("click", () => {
        openYouthDialog(getDB().youthProfiles.find(profile => profile.id === button.dataset.edit));
      });
    });

    tbody.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", () => deleteYouth(button.dataset.delete));
    });
  }

  function viewYouth(id) {
    const profile = getDB().youthProfiles.find(item => item.id === id);

    if (!profile) return;

    const text = `
${profile.fullName}
${profile.email}

Age: ${profile.age}
Gender: ${profile.gender}
Address: ${profile.address}
Education: ${profile.education}
Employment: ${profile.employment}
Voter Status: ${profile.voterStatus}
Special Needs: ${profile.specialNeeds}
Hobbies: ${profile.hobbies}
Sports: ${profile.sports}
    `.trim();

    alert(text);
    logActivity("Youth Record Viewed", `${profile.fullName} record was viewed.`);
  }

  function openYouthDialog(profile = null) {
    const dialog = document.getElementById("youthDialog");
    const form = document.getElementById("adminYouthForm");
    const fields = document.getElementById("adminYouthFields");

    form.reset();

    document.getElementById("youthDialogTitle").textContent = profile ? "Edit Youth Profile" : "Add Youth Profile";

    buildProfileForm(fields, profile || {});

    form.elements.id.value = profile?.id || "";

    dialog.showModal();
  }

  function saveYouthFromAdmin() {
    const form = document.getElementById("adminYouthForm");
    const data = formToObject(form);
    const existing = data.id ? getDB().youthProfiles.find(profile => profile.id === data.id) : null;

    if (existing) data.createdAt = existing.createdAt;

    try {
      registerYouth(data, true);
      document.getElementById("youthDialog").close();

      renderAllAdmin();

      toast("Youth profile saved.");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function deleteYouth(id) {
    const db = getDB();
    const profile = db.youthProfiles.find(item => item.id === id);

    if (!profile) return;

    if (!confirm(`Delete ${profile.fullName}'s youth profile?`)) return;

    db.youthProfiles = db.youthProfiles.filter(item => item.id !== id);
    db.users = db.users.filter(user => user.id !== id);

    saveDB(db);

    logActivity("Youth Record Deleted", `${profile.fullName} record was deleted.`);

    renderAllAdmin();

    toast("Youth record deleted.");
  }

  function renderCharts() {
    const youth = activeYouth();

    drawPie("genderChart", groupCount(youth, "gender"));
    drawBar("ageChart", ageGroups(youth));
    drawBar("educationChart", groupCount(youth, "education"));
    drawPie("employmentChart", groupCount(youth, "employment"));
    drawBar("voterChart", groupCount(youth, "voterStatus"));
    drawBar("sportsChart", countTerms(youth, "sports"));
  }

  const palette = [
    "#0a5255",
    "#d8ad76",
    "#6a8d8f",
    "#b8c8a5",
    "#8d6b4f",
    "#b95f5f",
    "#557a95"
  ];

  function drawPie(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const entries = Object.entries(data).filter(([, value]) => value > 0);

    clearCanvas(ctx, canvas);

    if (!entries.length) {
      emptyChart(ctx, canvas);
      return;
    }

    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 5;
    const radius = Math.min(canvas.width, canvas.height) * 0.28;

    let start = -Math.PI / 2;

    entries.forEach(([label, value], index) => {
      const end = start + (value / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = palette[index % palette.length];
      ctx.fill();

      const angle = (start + end) / 2;
      const labelX = centerX + Math.cos(angle) * (radius + 60);
      const labelY = centerY + Math.sin(angle) * (radius + 26);

      ctx.fillStyle = palette[index % palette.length];
      ctx.font = "14px Segoe UI, Arial";
      ctx.textAlign = labelX < centerX ? "right" : "left";
      ctx.fillText(`${label}: ${Math.round((value / total) * 100)}%`, labelX, labelY);

      start = end;
    });

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
  }

  function drawBar(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const entries = Object.entries(data).filter(([, value]) => value >= 0);

    clearCanvas(ctx, canvas);

    if (!entries.length) {
      emptyChart(ctx, canvas);
      return;
    }

    const pad = {
      left: 58,
      right: 20,
      top: 20,
      bottom: 54
    };

    const width = canvas.width - pad.left - pad.right;
    const height = canvas.height - pad.top - pad.bottom;
    const max = Math.max(1, ...entries.map(([, value]) => value));

    ctx.strokeStyle = "#d7dee0";
    ctx.lineWidth = 1;
    ctx.font = "13px Segoe UI, Arial";
    ctx.fillStyle = "#5d6f78";

    for (let i = 0; i <= max; i++) {
      const y = pad.top + height - (i / max) * height;

      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + width, y);
      ctx.stroke();

      ctx.fillText(i, 24, y + 4);
    }

    const gap = 16;
    const barWidth = Math.max(22, (width - gap * (entries.length + 1)) / entries.length);

    entries.forEach(([label, value], index) => {
      const x = pad.left + gap + index * (barWidth + gap);
      const barHeight = (value / max) * height;
      const y = pad.top + height - barHeight;

      ctx.fillStyle = palette[index % palette.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = "#5d6f78";
      ctx.textAlign = "center";

      const shortLabel = label.length > 13 ? label.slice(0, 12) + "…" : label;
      ctx.fillText(shortLabel, x + barWidth / 2, pad.top + height + 24);
    });
  }

  function clearCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function emptyChart(ctx, canvas) {
    ctx.fillStyle = "#7b8b92";
    ctx.font = "15px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("No data available", canvas.width / 2, canvas.height / 2);
  }

  function renderReportSummary() {
    const youth = activeYouth();

    const total = youth.length;
    const registered = youth.filter(profile => profile.voterStatus === "Registered Voter").length;
    const special = youth.filter(profile => profile.specialNeeds === "Yes").length;
    const unemployed = youth.filter(profile => profile.employment === "Unemployed").length;

    const topSports = Object.entries(countTerms(youth, "sports"))
      .slice(0, 4)
      .map(([key, value]) => `${key} (${value})`)
      .join(", ") || "N/A";

    const topHobbies = Object.entries(countTerms(youth, "hobbies"))
      .slice(0, 4)
      .map(([key, value]) => `${key} (${value})`)
      .join(", ") || "N/A";

    document.getElementById("reportSummary").innerHTML = `
      <div class="summary-box">
        <h3>Demographic Summary</h3>
        <ul>
          <li>Total registered youth: <strong>${total}</strong></li>
          <li>Male: <strong>${youth.filter(profile => profile.gender === "Male").length}</strong></li>
          <li>Female: <strong>${youth.filter(profile => profile.gender === "Female").length}</strong></li>
        </ul>
      </div>

      <div class="summary-box">
        <h3>Education & Employment</h3>
        <ul>
          <li>Students: <strong>${youth.filter(profile => profile.employment === "Student").length}</strong></li>
          <li>Unemployed youth: <strong>${unemployed}</strong></li>
          <li>College level records: <strong>${youth.filter(profile => profile.education === "College").length}</strong></li>
        </ul>
      </div>

      <div class="summary-box">
        <h3>Civic & Voter Data</h3>
        <ul>
          <li>Registered voters: <strong>${registered}</strong></li>
          <li>New voters: <strong>${youth.filter(profile => profile.newVoter === "New Voter").length}</strong></li>
          <li>Active civic participants: <strong>${youth.filter(profile => profile.civic === "Active").length}</strong></li>
        </ul>
      </div>

      <div class="summary-box">
        <h3>Program Planning Basis</h3>
        <ul>
          <li>Special needs records: <strong>${special}</strong></li>
          <li>Common sports: <strong>${escapeHtml(topSports)}</strong></li>
          <li>Common hobbies: <strong>${escapeHtml(topHobbies)}</strong></li>
        </ul>
      </div>
    `;
  }

  function renderAuditTable() {
    const tbody = document.getElementById("auditTableBody");

    if (!tbody) return;

    const logs = getDB().audit;

    tbody.innerHTML = logs.length
      ? logs.map(log => `
        <tr>
          <td>${formatDate(log.at)}</td>
          <td>${escapeHtml(log.user)}</td>
          <td>${escapeHtml(log.role)}</td>
          <td>${escapeHtml(log.activity)}</td>
          <td>${escapeHtml(log.details)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="5" class="empty-state">No audit logs available.</td></tr>`;
  }

  function renderAccounts() {
    const tbody = document.getElementById("accountsTableBody");

    if (!tbody) return;

    const users = getDB().users;

    tbody.innerHTML = users.map(user => `
      <tr>
        <td><strong>${escapeHtml(user.fullName)}</strong></td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td>
          <span class="status-pill ${user.active ? "" : "off"}">
            ${user.active ? "Active" : "Inactive"}
          </span>
        </td>
        <td>
          <button class="action-btn edit" data-toggle-account="${user.id}">
            ${user.active ? "Deactivate" : "Activate"}
          </button>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll("[data-toggle-account]").forEach(button => {
      button.addEventListener("click", () => toggleAccount(button.dataset.toggleAccount));
    });
  }

  function toggleAccount(id) {
    const db = getDB();
    const user = db.users.find(item => item.id === id);

    if (!user) return;

    if (user.id === currentUser()?.id) {
      toast("You cannot deactivate your own logged-in account.", "warn");
      return;
    }

    user.active = !user.active;

    const profile = db.youthProfiles.find(item => item.id === id);
    if (profile) profile.active = user.active;

    saveDB(db);

    logActivity("Account Status Updated", `${user.fullName} set to ${user.active ? "active" : "inactive"}.`);

    renderAllAdmin();
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  function downloadCSV() {
    const headers = [
      "Full Name",
      "Email",
      "Age",
      "Gender",
      "Address",
      "Contact",
      "Education",
      "Education Status",
      "Employment",
      "Civic Participation",
      "Voter Status",
      "New Voter",
      "Voter Participation",
      "Special Needs",
      "Assistance",
      "Hobbies",
      "Sports"
    ];

    const rows = activeYouth().map(profile => [
      profile.fullName,
      profile.email,
      profile.age,
      profile.gender,
      profile.address,
      profile.contact,
      profile.education,
      profile.educationStatus,
      profile.employment,
      profile.civic,
      profile.voterStatus,
      profile.newVoter,
      profile.voterParticipation,
      profile.specialNeeds,
      profile.assistance,
      profile.hobbies,
      profile.sports
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    downloadFile("bukal-youth-report.csv", "text/csv", csv);

    logActivity("Report Exported", "Youth report exported as CSV for Excel.");
  }

  function printReport() {
    const youth = activeYouth();
    const win = window.open("", "_blank");
    const summary = document.getElementById("reportSummary").innerHTML;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukal Youth Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #102a33;
            padding: 32px;
          }

          h1 {
            color: #0a5255;
          }

          .summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .summary-box {
            border: 1px solid #ddd;
            padding: 14px;
            border-radius: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
            font-size: 12px;
          }

          th,
          td {
            border: 1px solid #ddd;
            padding: 7px;
            text-align: left;
          }

          th {
            background: #eef5f5;
          }
        </style>
      </head>
      <body>
        <h1>Bukal Youth Data Report</h1>
        <p>Generated on ${formatDate(now())}</p>

        <div class="summary">${summary}</div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Education</th>
              <th>Employment</th>
              <th>Voter Status</th>
              <th>Sports</th>
            </tr>
          </thead>
          <tbody>
            ${youth.map(profile => `
              <tr>
                <td>${escapeHtml(profile.fullName)}</td>
                <td>${profile.age}</td>
                <td>${escapeHtml(profile.gender)}</td>
                <td>${escapeHtml(profile.education)}</td>
                <td>${escapeHtml(profile.employment)}</td>
                <td>${escapeHtml(profile.voterStatus)}</td>
                <td>${escapeHtml(profile.sports)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();

    logActivity("PDF / Print Report Generated", "Youth report opened for PDF printing.");
  }

function downloadBackup() {
    const db = getDB();

    if (typeof XLSX === "undefined") {
      toast("Excel library is missing. Please check your script tags.", "error");
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      const wsProfiles = XLSX.utils.json_to_sheet(db.youthProfiles || []);
      const wsUsers = XLSX.utils.json_to_sheet(db.users || []);
      const wsAudit = XLSX.utils.json_to_sheet(db.audit || []);

      XLSX.utils.book_append_sheet(workbook, wsProfiles, "Youth Information");
      XLSX.utils.book_append_sheet(workbook, wsUsers, "System Users");
      XLSX.utils.book_append_sheet(workbook, wsAudit, "Audit Logs");

      XLSX.writeFile(workbook, "Bukal_Youth_Information_Backup.xlsx");

      logActivity("Backup Downloaded", "System data backup was downloaded as an Excel file.");
      toast("Excel backup downloaded successfully.");
    } catch (error) {
      toast("Failed to generate Excel backup.", "error");
      console.error(error);
    }
  }

  function downloadFile(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(link.href);
  }

  function bindGlobalLogout() {
    bindLogout();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    bindGlobalLogout();

    switch (page) {
      case "home":
        initHome();
        break;

      case "youth-register":
        initYouthRegister();
        break;

      case "youth-login":
        initLogin("youth");
        break;

      case "admin-login":
        initLogin("admin");
        break;

      case "admin-register":
        initAdminRegister();
        break;

      case "youth-dashboard":
        initYouthDashboard();
        break;

      case "admin-dashboard":
        initAdminDashboard();
        break;

      default:
        getDB();
    }
  });
})();