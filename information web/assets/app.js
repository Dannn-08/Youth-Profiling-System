import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseLogoutBtn = document.querySelector("[data-logout]");

if (firebaseLogoutBtn) {
  firebaseLogoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("Logged out!");
    window.location.href = "login.html";
  });
}

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
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: ["", "Male", "Female", "Prefer not to say"]
    },
    { name: "address", label: "Address / Purok", type: "text", required: true, full: true },
    { name: "contact", label: "Contact Number", type: "text", required: true, full: true },
    {
      name: "education",
      label: "Educational Attainment",
      type: "select",
      required: true,
      options: [
        "",
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
      name: "educationStatus",
      label: "Current Education Status",
      type: "select",
      required: true,
      options: ["", "Currently Studying", "Not Studying", "Graduated"]
    },
    {
      name: "employment",
      label: "Employment Status",
      type: "select",
      required: true,
      options: ["", "Student", "Employed", "Unemployed", "Self-employed"]
    },
    {
      name: "civic",
      label: "Civic Participation",
      type: "select",
      required: true,
      options: ["", "Active", "Occasional", "Not Active"]
    },
    {
      name: "voterStatus",
      label: "Voter Registration Status",
      type: "select",
      required: true,
      options: ["", "Registered Voter", "Not Registered"]
    },
    {
      name: "newVoter",
      label: "New Voter Status",
      type: "select",
      required: true,
      options: ["", "New Voter", "Existing Voter", "Not Applicable"]
    },
    {
      name: "voterParticipation",
      label: "Voter Participation",
      type: "select",
      required: true,
      options: ["", "Participated", "Not Participated", "Not Applicable"]
    },
    {
      name: "specialNeeds",
      label: "Special Needs",
      type: "select",
      required: true,
      options: ["", "No", "Yes"]
    },
    {
      name: "assistance",
      label: "Specific Assistance Needed",
      type: "text",
      required: false,
      full: true
    },
    {
      name: "hobbies",
      label: "Hobbies / Skills",
      type: "text",
      required: true,
      full: true
    },
    {
      name: "sports",
      label: "Sports Interests",
      type: "text",
      required: true,
      full: true
    }
  ];

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function makeProfile(
    userId,
    fullName,
    email,
    age,
    gender,
    address,
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
    sports
  ) {
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
        {
          id: "admin_default",
          fullName: "SK Administrator",
          email: "admin@bukal.gov.ph",
          password: "admin12345",
          role: "admin",
          active: true,
          createdAt
        },
        {
          id: "youth_sample_1",
          fullName: "Test Youth",
          email: "youth_2160@example.com",
          password: "password123",
          role: "youth",
          active: true,
          createdAt
        }
      ],

      youthProfiles: [
        makeProfile(
          "youth_sample_1",
          "Test Youth",
          "youth_2160@example.com",
          22,
          "Male",
          "Purok 1, Barangay Bukal",
          "College",
          "Currently Studying",
          "Student",
          "Active",
          "Registered Voter",
          "New Voter",
          "Participated",
          "No",
          "N/A",
          "Coding, drawing",
          "Basketball"
        )
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
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: user.id,
        role: user.role,
        email: user.email,
        fullName: user.fullName
      })
    );
  }

  function currentUser() {
    const db = getDB();
    const session = getSession();

    if (!session) return null;

    return db.users.find((u) => u.id === session.userId) || null;
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

    const el = document.createElement("div");

    el.className = `toast ${type}`;
    el.textContent = message;

    document.body.appendChild(el);

    setTimeout(() => el.remove(), 3300);
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
        location.href = "login.html";
      }, 600);

      return null;
    }

    return user;
  }

  /* =====================================================
     HERO BACKGROUND SLIDESHOW
  ===================================================== */

  function initHeroSlideshow() {
    const slides = document.querySelectorAll(".hero-slide");

    if (slides.length <= 1) return;

    let currentSlide = 0;

    setInterval(() => {
      slides[currentSlide].classList.remove("active");

      currentSlide = (currentSlide + 1) % slides.length;

      slides[currentSlide].classList.add("active");
    }, 5000);
  }

  function initHome() {
    getDB();

    initHeroSlideshow();
  }

  function initLogin(defaultRole) {
    getDB();

    const form = document.querySelector("#loginForm");
    const roleInput = document.querySelector("#role");

    if (roleInput && defaultRole) roleInput.value = defaultRole;

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = formToObject(form);
      const db = getDB();

      const user = db.users.find(
        (u) =>
          normalizeEmail(u.email) === normalizeEmail(data.email) &&
          u.password === data.password &&
          u.role === data.role
      );

      if (!user) {
        toast("Invalid email, password, or role.", "danger");
        return;
      }

      if (!user.active) {
        toast("This account is inactive.", "danger");
        return;
      }

      setSession(user);

      logActivity(
        "Login",
        `${user.role === "admin" ? "Administrator" : "Youth"} logged in.`
      );

      location.href =
        user.role === "admin"
          ? "admin-dashboard.html"
          : "youth-dashboard.html";
    });
  }

  function initYouthRegister() {
    getDB();

    const form = document.querySelector("#youthRegisterForm");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = formToObject(form);
      const db = getDB();

      const email = normalizeEmail(data.email);

      if (db.users.some((u) => normalizeEmail(u.email) === email)) {
        toast("Email already exists.", "danger");
        return;
      }

      if (String(data.password || "").length < 8) {
        toast("Password must be at least 8 characters.", "danger");
        return;
      }

      const user = {
        id: uid("youth"),
        fullName: data.fullName.trim(),
        email,
        password: data.password,
        role: "youth",
        active: true,
        createdAt: now()
      };

      db.users.push(user);

      saveDB(db);

      logActivity("Youth Registration", `Created account for ${user.fullName}.`);

      toast("Registration successful. You can now login.");

      form.reset();

      setTimeout(() => {
        location.href = "login.html";
      }, 900);
    });
  }

  function initAdminRegister() {
    getDB();

    const form = document.querySelector("#adminRegisterForm");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = formToObject(form);

      if (data.adminCode !== ADMIN_CODE) {
        toast("Invalid admin registration code.", "danger");
        return;
      }

      const db = getDB();
      const email = normalizeEmail(data.email);

      if (db.users.some((u) => normalizeEmail(u.email) === email)) {
        toast("Email already exists.", "danger");
        return;
      }

      if (String(data.password || "").length < 8) {
        toast("Password must be at least 8 characters.", "danger");
        return;
      }

      const user = {
        id: uid("admin"),
        fullName: data.fullName.trim(),
        email,
        password: data.password,
        role: "admin",
        active: true,
        createdAt: now()
      };

      db.users.push(user);

      saveDB(db);

      logActivity(
        "Admin Registration",
        `Created admin account for ${user.fullName}.`
      );

      toast("Admin account created. You can now login.");

      form.reset();

      setTimeout(() => {
        location.href = "login.html";
      }, 900);
    });
  }

  function renderProfileForm(container, profile, includePassword = false) {
    if (!container) return;

    const fields = profileFields
      .filter((field) => includePassword || field.name !== "password")
      .map((field) => {
        const value = profile?.[field.name] ?? "";

        if (field.type === "select") {
          return `
            <label class="field ${field.full ? "full" : ""}">
              <span>${field.label}</span>

              <select name="${field.name}" ${field.required ? "required" : ""}>
                ${field.options
                  .map(
                    (option) =>
                      `<option value="${option}" ${
                        option === value ? "selected" : ""
                      }>${option || "Select"}</option>`
                  )
                  .join("")}
              </select>
            </label>
          `;
        }

        return `
          <label class="field ${field.full ? "full" : ""}">
            <span>${field.label}</span>

            <input
              type="${field.type}"
              name="${field.name}"
              value="${field.type === "password" ? "" : String(value)}"
              ${field.required ? "required" : ""}
              ${field.attrs || ""}
            />
          </label>
        `;
      })
      .join("");

    container.innerHTML = fields;
  }

  function initYouthDashboard() {
    const user = requireRole("youth");

    if (!user) return;

    const db = getDB();

    let profile =
      db.youthProfiles.find((p) => p.userId === user.id) || {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        age: "",
        gender: "",
        address: "",
        contact: "",
        education: "",
        educationStatus: "",
        employment: "",
        civic: "",
        voterStatus: "",
        newVoter: "",
        voterParticipation: "",
        specialNeeds: "",
        assistance: "",
        hobbies: "",
        sports: "",
        active: true
      };

    document.querySelector("[data-youth-name]")?.replaceChildren(
      document.createTextNode(user.fullName)
    );

    const form = document.querySelector("#youthProfileForm");
    const fieldsWrap = document.querySelector("#youthProfileFields");

    renderProfileForm(fieldsWrap, profile);

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = formToObject(form);
      const fresh = getDB();

      const index = fresh.youthProfiles.findIndex(
        (p) => p.userId === user.id
      );

      const updated = {
        ...profile,
        ...data,
        age: Number(data.age),
        id: profile.id || user.id,
        userId: user.id,
        email: user.email,
        active: profile.active !== false,
        updatedAt: now(),
        createdAt: profile.createdAt || now()
      };

      if (index >= 0) {
        fresh.youthProfiles[index] = updated;
      } else {
        fresh.youthProfiles.push(updated);
      }

      const userIndex = fresh.users.findIndex((u) => u.id === user.id);

      if (userIndex >= 0) {
        fresh.users[userIndex].fullName = updated.fullName;
      }

      saveDB(fresh);

      profile = updated;

      setSession({
        ...user,
        fullName: updated.fullName
      });

      logActivity(
        "Profile Updated",
        "Youth updated personal profile information."
      );

      toast("Profile saved successfully.");
    });

    const status = document.querySelector("[data-profile-status]");

    if (status) {
      status.textContent = profile.createdAt
        ? "Profile is on file. Keep your information updated."
        : "Complete your profile to help Barangay Bukal maintain accurate records.";
    }
  }

  function ageGroup(age) {
    const n = Number(age);

    if (n <= 17) return "15–17";
    if (n <= 21) return "18–21";
    if (n <= 25) return "22–25";

    return "26–30";
  }

  function countBy(items, getter) {
    const result = {};

    items.forEach((item) => {
      const key = getter(item) || "Unspecified";
      result[key] = (result[key] || 0) + 1;
    });

    return result;
  }

  function renderBars(container, counts) {
    if (!container) return;

    const entries = Object.entries(counts);

    if (!entries.length) {
      container.innerHTML = '<div class="empty-state">No data available yet.</div>';
      return;
    }

    const max = Math.max(...entries.map(([, value]) => value), 1);

    container.innerHTML = entries
      .map(([label, value]) => {
        const width = Math.max(5, (value / max) * 100);

        return `
          <div class="bar-row">
            <div class="bar-meta">
              <span>${label}</span>
              <strong>${value}</strong>
            </div>

            <div class="bar-track">
              <div class="bar-fill" style="width:${width}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderYouthTable() {
    const tbody = document.querySelector("#youthTableBody");

    if (!tbody) return;

    const db = getDB();

    const query = normalizeEmail(
      document.querySelector("#youthSearch")?.value || ""
    );

    const filter =
      document.querySelector("#youthFilter")?.value || "all";

    let rows = db.youthProfiles.slice();

    if (query) {
      rows = rows.filter((p) =>
        [
          p.fullName,
          p.email,
          p.address,
          p.contact,
          p.education,
          p.employment,
          p.voterStatus
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    if (filter === "active") {
      rows = rows.filter((p) => p.active !== false);
    }

    if (filter === "inactive") {
      rows = rows.filter((p) => p.active === false);
    }

    if (filter === "voter") {
      rows = rows.filter((p) => p.voterStatus === "Registered Voter");
    }

    if (filter === "new-voter") {
      rows = rows.filter((p) => p.newVoter === "New Voter");
    }

    if (filter === "special") {
      rows = rows.filter((p) => p.specialNeeds === "Yes");
    }

    tbody.innerHTML = rows.length
      ? rows
          .map(
            (p) => `
              <tr>
                <td>${p.fullName || "—"}</td>
                <td>${p.age || "—"}</td>
                <td>${p.gender || "—"}</td>
                <td>${p.address || "—"}</td>
                <td>${p.education || "—"}</td>
                <td>${p.employment || "—"}</td>
                <td>${p.voterStatus || "—"}</td>

                <td>
                  <span class="status-pill ${
                    p.active === false ? "inactive" : "active"
                  }">
                    ${p.active === false ? "Inactive" : "Active"}
                  </span>
                </td>

                <td>
                  <button
                    class="table-action"
                    type="button"
                    data-view-youth="${p.userId}"
                  >
                    View
                  </button>
                </td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              No youth records match the selected filters.
            </div>
          </td>
        </tr>
      `;

    tbody.querySelectorAll("[data-view-youth]").forEach((button) => {
      button.addEventListener("click", () => {
        openYouthModal(button.dataset.viewYouth);
      });
    });
  }

  function openYouthModal(userId) {
    const db = getDB();

    const profile = db.youthProfiles.find((p) => p.userId === userId);

    if (!profile) return;

    const modal = document.querySelector("#youthModal");

    if (!modal) return;

    modal.querySelector("[data-modal-title]").textContent =
      profile.fullName || "Youth Record";

    const body = modal.querySelector("[data-modal-body]");

    const items = [
      ["Email", profile.email],
      ["Age", profile.age],
      ["Gender", profile.gender],
      ["Address", profile.address],
      ["Contact", profile.contact],
      ["Educational Attainment", profile.education],
      ["Education Status", profile.educationStatus],
      ["Employment", profile.employment],
      ["Civic Participation", profile.civic],
      ["Voter Status", profile.voterStatus],
      ["New Voter", profile.newVoter],
      ["Voter Participation", profile.voterParticipation],
      ["Special Needs", profile.specialNeeds],
      ["Assistance Needed", profile.assistance],
      ["Hobbies / Skills", profile.hobbies],
      ["Sports Interests", profile.sports]
    ];

    body.innerHTML = items
      .map(
        ([label, value]) => `
          <div class="detail-item">
            <span>${label}</span>
            <strong>${value || "—"}</strong>
          </div>
        `
      )
      .join("");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    const modal = document.querySelector("#youthModal");

    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function initAdminDashboard() {
    const admin = requireRole("admin");

    if (!admin) return;

    const db = getDB();

    const profiles = db.youthProfiles;

    const active = profiles.filter((p) => p.active !== false);

    const registeredVoters = profiles.filter(
      (p) => p.voterStatus === "Registered Voter"
    ).length;

    const newVoters = profiles.filter(
      (p) => p.newVoter === "New Voter"
    ).length;

    const employed = profiles.filter(
      (p) => p.employment === "Employed"
    ).length;

    const students = profiles.filter(
      (p) =>
        p.employment === "Student" ||
        p.educationStatus === "Currently Studying"
    ).length;

    const setText = (selector, value) => {
      const el = document.querySelector(selector);

      if (el) el.textContent = value;
    };

    setText("[data-admin-name]", admin.fullName);
    setText("[data-stat-total]", profiles.length);
    setText("[data-stat-active]", active.length);
    setText("[data-stat-voters]", registeredVoters);
    setText("[data-stat-new-voters]", newVoters);
    setText("[data-stat-students]", students);
    setText("[data-stat-employed]", employed);

    renderBars(
      document.querySelector("#ageChart"),
      countBy(profiles, (p) => ageGroup(p.age))
    );

    renderBars(
      document.querySelector("#genderChart"),
      countBy(profiles, (p) => p.gender)
    );

    renderBars(
      document.querySelector("#educationChart"),
      countBy(profiles, (p) => p.education)
    );

    renderBars(
      document.querySelector("#employmentChart"),
      countBy(profiles, (p) => p.employment)
    );

    renderYouthTable();

    document.querySelector("#youthSearch")?.addEventListener(
      "input",
      renderYouthTable
    );

    document.querySelector("#youthFilter")?.addEventListener(
      "change",
      renderYouthTable
    );

    document.querySelector("[data-close-modal]")?.addEventListener(
      "click",
      closeModal
    );

    document.querySelector("#youthModal")?.addEventListener(
      "click",
      (event) => {
        if (event.target.id === "youthModal") {
          closeModal();
        }
      }
    );

    document.querySelector("#exportCsv")?.addEventListener(
      "click",
      exportYouthCSV
    );

    document.querySelector("#printReport")?.addEventListener(
      "click",
      () => window.print()
    );

    renderAudit();
  }

  function csvEscape(value) {
    const text = String(value ?? "");

    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  }

  function exportYouthCSV() {
    const db = getDB();

    const headers = [
      "Full Name",
      "Email",
      "Age",
      "Gender",
      "Address",
      "Contact",
      "Educational Attainment",
      "Education Status",
      "Employment Status",
      "Civic Participation",
      "Voter Status",
      "New Voter",
      "Voter Participation",
      "Special Needs",
      "Assistance Needed",
      "Hobbies / Skills",
      "Sports Interests",
      "Record Status"
    ];

    const lines = [
      headers.map(csvEscape).join(","),
      ...db.youthProfiles.map((p) =>
        [
          p.fullName,
          p.email,
          p.age,
          p.gender,
          p.address,
          p.contact,
          p.education,
          p.educationStatus,
          p.employment,
          p.civic,
          p.voterStatus,
          p.newVoter,
          p.voterParticipation,
          p.specialNeeds,
          p.assistance,
          p.hobbies,
          p.sports,
          p.active === false ? "Inactive" : "Active"
        ]
          .map(csvEscape)
          .join(",")
      )
    ];

    const blob = new Blob(
      [lines.join("\n")],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `bukal-youth-data-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    logActivity(
      "Exported CSV",
      "Administrator exported youth profiling records."
    );

    toast("CSV report downloaded.");
  }

  function renderAudit() {
    const tbody = document.querySelector("#auditTableBody");

    if (!tbody) return;

    const db = getDB();

    tbody.innerHTML = db.audit
      .slice(0, 50)
      .map(
        (log) => `
          <tr>
            <td>${new Date(log.at).toLocaleString()}</td>
            <td>${log.user}</td>
            <td>${log.role}</td>
            <td>${log.activity}</td>
            <td>${log.details || "—"}</td>
          </tr>
        `
      )
      .join("");
  }

  function bindLogout() {
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", () => {
        logActivity(
          "Logout",
          "User signed out."
        );

        sessionStorage.removeItem(SESSION_KEY);

        location.href = "index.html";
      });
    });
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

      case "admin-register":
        initAdminRegister();
        break;

      case "login":
        initLogin("youth");
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