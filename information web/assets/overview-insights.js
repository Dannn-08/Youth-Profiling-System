// =====================================================
// OVERVIEW INSIGHTS
// Description + highest/lowest text inside every chart card.
// Reads the charts that are already drawn, so it always
// matches the data shown on screen.
// =====================================================

const DESCRIPTIONS = {
  genderChart:
    "Shows how the active youth are divided by gender.",
  ageChart:
    "Shows the number of active youth in each age group (15–30 years old).",
  purokChart:
    "Shows how many active youth live in each Purok / Area of Barangay Bukal.",
  civilStatusChart:
    "Shows the civil status of the active youth.",
  educationChart:
    "Shows the highest educational attainment reached by the youth.",
  educationStatusChart:
    "Shows whether the youth are currently studying, not studying, or graduated.",
  employmentChart:
    "Shows the employment status of the youth, including students.",
  voterChart:
    "Shows how many youth are registered voters.",
  voterParticipationChart:
    "Shows how many registered youth voters participated in elections.",
  newVoterChart:
    "Shows how many youth are new voters.",
  skVoterChart:
    "Shows how many youth are registered Sangguniang Kabataan (SK) voters.",
  skElectionChart:
    "Shows how many youth voted in the last SK election.",
  kkAttendanceChart:
    "Shows how many youth have attended a Katipunan ng Kabataan (KK) Assembly.",
  kkFrequencyChart:
    "Shows how often attending youth have joined KK Assemblies.",
  kkReasonChart:
    "Shows why some youth have not attended a KK Assembly.",
  civicChart:
    "Shows how actively the youth take part in community and civic activities.",
  specialNeedsChart:
    "Shows how many youth reported special needs.",
  sportsChart:
    "Shows the most common sports interests listed by the youth.",
  hobbiesChart:
    "Shows the most common hobbies and skills listed by the youth.",
  registrationTrendChart:
    "Shows how many youth registered each month of the current year."
};

const MULTI_VALUE = new Set(["sportsChart", "hobbiesChart"]);


// =====================================================
// DATA HELPERS
// =====================================================

function readChart(id) {
  const chart = window.Chart?.getChart?.(id);

  if (!chart) {
    return null;
  }

  const labels = chart.data.labels || [];
  const data = chart.data.datasets?.[0]?.data || [];

  return labels.map((label, index) => ({
    label: String(label),
    value: Number(data[index]) || 0
  }));
}

function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

function nameList(entries) {
  const names = entries.map(entry => entry.label);

  if (names.length <= 3) {
    return names.join(", ");
  }

  return `${names.slice(0, 3).join(", ")} and ${names.length - 3} others`;
}

function analyze(entries) {
  if (!entries || !entries.length) {
    return null;
  }

  const total = entries.reduce((sum, e) => sum + e.value, 0);

  if (!total) {
    return null;
  }

  const max = Math.max(...entries.map(e => e.value));
  const min = Math.min(...entries.map(e => e.value));

  return {
    total,
    max,
    min,
    top: entries.filter(e => e.value === max),
    bottom: entries.filter(e => e.value === min),
    count: entries.length
  };
}

function chartSentence(id, entries) {
  const result = analyze(entries);

  if (!result) {
    return "No data available yet.";
  }

  const unit = MULTI_VALUE.has(id) ? "response" : "youth";
  const plural = value =>
    unit === "youth"
      ? `${value} youth`
      : `${value} response${value === 1 ? "" : "s"}`;

  // Registration trend: show the peak month and the yearly total.
  if (id === "registrationTrendChart") {
    return (
      `Peak month: ${nameList(result.top)} with ` +
      `${result.max} registration${result.max === 1 ? "" : "s"}. ` +
      `Total this year: ${result.total}.`
    );
  }

  if (result.count > 1 && result.max === result.min) {
    return `Evenly distributed: each group has ${plural(result.max)}.`;
  }

  let text =
    `Highest: ${nameList(result.top)} — ${plural(result.max)} ` +
    `(${percent(result.max, result.total)}%).`;

  if (result.count > 1 && result.min < result.max) {
    text +=
      ` Lowest: ${nameList(result.bottom)} — ${plural(result.min)} ` +
      `(${percent(result.min, result.total)}%).`;
  }

  return text;
}


// =====================================================
// DESCRIPTION UNDER EACH CHART
// =====================================================

function updateChartDescriptions() {
  document
    .querySelectorAll("#tab-overview .chart-panel")
    .forEach(panel => {
      const canvas = panel.querySelector("canvas");

      if (!canvas?.id) {
        return;
      }

      const entries = readChart(canvas.id);

      if (!entries) {
        return;
      }

      let caption = panel.querySelector(".chart-caption");

      if (!caption) {
        caption = document.createElement("p");
        caption.className = "chart-caption";

        // Small plain text at the bottom of the card, no box.
        caption.style.cssText = `
          margin:12px 0 0;
          padding-top:10px;
          border-top:1px solid rgba(10,82,85,.10);
          font-size:12px;
          line-height:1.5;
          color:#71838a;
        `;

        // Let the card grow so the chart is never cut off.
        panel.style.setProperty("height", "auto", "important");
        panel.style.setProperty("max-height", "none", "important");
        panel.style.setProperty("overflow", "visible", "important");

        panel.append(caption);
      }

      caption.textContent =
        `${DESCRIPTIONS[canvas.id] || ""} ` +
        `${chartSentence(canvas.id, entries)}`.trim();
    });
}


// =====================================================
// KEEP EVERYTHING UP TO DATE
// Charts are drawn after the data loads, so check
// regularly and refresh only when the data changed.
// =====================================================

let lastSignature = "";

function signature() {
  return Object.keys(DESCRIPTIONS)
    .map(id => JSON.stringify(readChart(id)))
    .join("|");
}

function refresh() {
  const current = signature();

  if (current === lastSignature) {
    return;
  }

  lastSignature = current;

  updateChartDescriptions();
}

document.getElementById("overviewHighlights")?.remove();

refresh();
setInterval(refresh, 1500);