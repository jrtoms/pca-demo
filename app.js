const DATA_URL = "data/players.json";
const MISSING_VALUE = "\u2014";

const SUMMARY_CARDS = [
  { key: "playerCount", label: "Players In Dataset", type: "whole" },
  { key: "totalAtBats", label: "Total At-Bats", type: "whole" },
  { key: "totalHits", label: "Total Hits", type: "whole" },
  { key: "averageBattingAverage", label: "Average Team AVG", type: "rate" },
  { key: "bestObp", label: "Best OBP", type: "rate", detailKey: "bestObpPlayer" },
  { key: "topRbi", label: "Top RBI", type: "whole", detailKey: "topRbiPlayer" },
  {
    key: "highestImpactScore",
    label: "Highest Impact Score",
    type: "whole",
    detailKey: "highestImpactPlayer"
  }
];

const TABLE_COLUMNS = [
  "name",
  "gp",
  "pa",
  "ab",
  "h",
  "avg",
  "obp",
  "slg",
  "ops",
  "rbi",
  "sb",
  "bb",
  "k"
];

const DETAIL_STATS = [
  { key: "gp", label: "Games Played", type: "whole" },
  { key: "pa", label: "Plate Appearances", type: "whole" },
  { key: "ab", label: "At-Bats", type: "whole" },
  { key: "h", label: "Hits", type: "whole" },
  { key: "avg", label: "Batting Average", type: "rate" },
  { key: "obp", label: "On-Base %", type: "rate" },
  { key: "slg", label: "Slugging %", type: "rate" },
  { key: "ops", label: "OPS", type: "rate" },
  { key: "rbi", label: "RBI", type: "whole" },
  { key: "sb", label: "Stolen Bases", type: "whole" },
  { key: "bb", label: "Walks", type: "whole" },
  { key: "k", label: "Strikeouts", type: "whole" },
  { key: "fieldingPct", label: "Fielding %", type: "rate" },
  { key: "impactScore", label: "Impact Score", type: "whole" }
];

const COMPARE_STATS = [
  { key: "impactScore", label: "Impact", type: "whole", better: "higher" },
  { key: "h", label: "Hits", type: "whole", better: "higher" },
  { key: "avg", label: "AVG", type: "rate", better: "higher" },
  { key: "obp", label: "OBP", type: "rate", better: "higher" },
  { key: "slg", label: "SLG", type: "rate", better: "higher" },
  { key: "ops", label: "OPS", type: "rate", better: "higher" },
  { key: "rbi", label: "RBI", type: "whole", better: "higher" },
  { key: "sb", label: "SB", type: "whole", better: "higher" },
  { key: "bb", label: "BB", type: "whole", better: "higher" },
  { key: "k", label: "K", type: "whole", better: "lower" }
];

const state = {
  players: [],
  sort: {
    key: "impactScore",
    direction: "desc"
  },
  selectedPlayerName: null,
  compareLeftName: null,
  compareRightName: null
};

let elements = {};

document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  cacheElements();

  const rawPlayers = await loadPlayers();
  state.players = rawPlayers.map(enrichPlayer);

  if (!state.players.length) {
    showEmptyState();
    return;
  }

  state.selectedPlayerName = state.players[0].name;
  state.compareLeftName = state.players[0].name;
  state.compareRightName = state.players[1] ? state.players[1].name : state.players[0].name;

  bindEvents();
  populatePlayerSelects();
  renderAll();
}

function cacheElements() {
  elements = {
    summaryCards: document.getElementById("summaryCards"),
    tableBody: document.getElementById("playerTableBody"),
    playerDetail: document.getElementById("playerDetail"),
    leaderboard: document.getElementById("leaderboard"),
    comparePanel: document.getElementById("comparePanel"),
    compareLeftSelect: document.getElementById("compareLeftSelect"),
    compareRightSelect: document.getElementById("compareRightSelect"),
    whatIfPlayerSelect: document.getElementById("whatIfPlayerSelect"),
    futureAtBats: document.getElementById("futureAtBats"),
    futureHits: document.getElementById("futureHits"),
    whatIfResults: document.getElementById("whatIfResults"),
    whatIfMessage: document.getElementById("whatIfMessage"),
    sortButtons: Array.from(document.querySelectorAll(".sort-button"))
  };
}

// Data loading falls back to inline JSON so the app still works from file://
async function loadPlayers() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error("Could not load data/players.json");
    }

    return await response.json();
  } catch (error) {
    const fallbackElement = document.getElementById("players-fallback");
    return fallbackElement ? JSON.parse(fallbackElement.textContent) : [];
  }
}

function enrichPlayer(player) {
  return {
    ...player,
    impactScore: calculateImpactScore(player)
  };
}

function bindEvents() {
  elements.sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updateSort(button.dataset.key);
    });
  });

  elements.compareLeftSelect.addEventListener("change", (event) => {
    state.compareLeftName = event.target.value;
    renderComparison();
  });

  elements.compareRightSelect.addEventListener("change", (event) => {
    state.compareRightName = event.target.value;
    renderComparison();
  });

  elements.whatIfPlayerSelect.addEventListener("change", renderWhatIfCalculator);
  elements.futureAtBats.addEventListener("input", renderWhatIfCalculator);
  elements.futureHits.addEventListener("input", renderWhatIfCalculator);
}

function populatePlayerSelects() {
  const options = state.players
    .map((player) => `<option value="${escapeHtml(player.name)}">${escapeHtml(player.name)}</option>`)
    .join("");

  elements.whatIfPlayerSelect.innerHTML = options;
  elements.compareLeftSelect.innerHTML = options;
  elements.compareRightSelect.innerHTML = options;

  elements.whatIfPlayerSelect.value = state.players[0].name;
  elements.compareLeftSelect.value = state.compareLeftName;
  elements.compareRightSelect.value = state.compareRightName;
}

function renderAll() {
  renderSummaryCards();
  renderTable();
  renderPlayerDetail();
  renderComparison();
  renderWhatIfCalculator();
  renderLeaderboard();
  updateSortIndicators();
}

// Summary cards help students see that software can turn raw data into quick insights.
function renderSummaryCards() {
  const metrics = calculateSummaryMetrics(state.players);

  elements.summaryCards.innerHTML = SUMMARY_CARDS.map((card) => {
    const detailText = card.detailKey ? metrics[card.detailKey] || "Available dataset" : "Available dataset";

    return `
      <article class="summary-card">
        <h3>${card.label}</h3>
        <div class="summary-value">${formatValue(metrics[card.key], card.type)}</div>
        <div class="metric-subtext">${escapeHtml(detailText)}</div>
      </article>
    `;
  }).join("");
}

function calculateSummaryMetrics(players) {
  const bestObpPlayer = findBestPlayer(players, "obp", "higher");
  const topRbiPlayer = findBestPlayer(players, "rbi", "higher");
  const highestImpactPlayer = findBestPlayer(players, "impactScore", "higher");

  return {
    playerCount: players.length,
    totalAtBats: sumStat(players, "ab"),
    totalHits: sumStat(players, "h"),
    averageBattingAverage: averageOf(players.map((player) => player.avg)),
    bestObp: bestObpPlayer ? bestObpPlayer.obp : null,
    bestObpPlayer: bestObpPlayer ? bestObpPlayer.name : null,
    topRbi: topRbiPlayer ? topRbiPlayer.rbi : null,
    topRbiPlayer: topRbiPlayer ? topRbiPlayer.name : null,
    highestImpactScore: highestImpactPlayer ? highestImpactPlayer.impactScore : null,
    highestImpactPlayer: highestImpactPlayer ? highestImpactPlayer.name : null
  };
}

function renderTable() {
  const sortedPlayers = getSortedPlayers();

  elements.tableBody.innerHTML = sortedPlayers
    .map((player) => {
      const isSelected = player.name === state.selectedPlayerName ? "is-selected" : "";

      return `
        <tr class="${isSelected}" data-player-name="${escapeHtml(player.name)}">
          ${TABLE_COLUMNS.map((column) => `<td>${formatTableValue(player, column)}</td>`).join("")}
        </tr>
      `;
    })
    .join("");

  Array.from(elements.tableBody.querySelectorAll("tr")).forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedPlayerName = row.dataset.playerName;
      renderTable();
      renderPlayerDetail();
    });
  });
}

function renderPlayerDetail() {
  const player = getPlayerByName(state.selectedPlayerName);

  if (!player) {
    elements.playerDetail.innerHTML = "";
    return;
  }

  const insights = generateInsights(player);

  elements.playerDetail.innerHTML = `
    <article class="detail-card">
      <div>
        <h3>${escapeHtml(player.name)}</h3>
        <p class="stat-note">A quick software-generated scouting summary for the selected player.</p>
      </div>
      <div class="detail-stats">
        ${DETAIL_STATS.map((stat) => {
          return `
            <div class="detail-stat">
              <span>${stat.label}</span>
              <strong>${formatValue(player[stat.key], stat.type)}</strong>
            </div>
          `;
        }).join("")}
      </div>
      <div>
        <h3>Rule-Based Insights</h3>
        <ul class="insights-list">
          ${insights.map((insight) => `<li>${escapeHtml(insight)}</li>`).join("")}
        </ul>
      </div>
    </article>
  `;
}

// Comparison highlights which player leads each key stat.
function renderComparison() {
  const leftPlayer = getPlayerByName(elements.compareLeftSelect.value);
  const rightPlayer = getPlayerByName(elements.compareRightSelect.value);

  if (!leftPlayer || !rightPlayer) {
    elements.comparePanel.innerHTML = "";
    return;
  }

  const leftWins = countComparisonWins(leftPlayer, rightPlayer);
  const rightWins = countComparisonWins(rightPlayer, leftPlayer);

  elements.comparePanel.innerHTML = `
    <div class="compare-players">
      <article class="compare-player ${leftWins > rightWins ? "highlight" : ""}">
        <h3>${escapeHtml(leftPlayer.name)}</h3>
        <p>${leftWins} category wins</p>
      </article>
      <article class="compare-player ${rightWins > leftWins ? "highlight" : ""}">
        <h3>${escapeHtml(rightPlayer.name)}</h3>
        <p>${rightWins} category wins</p>
      </article>
    </div>
    <div class="compare-grid">
      ${COMPARE_STATS.map((stat) => renderComparisonMetric(leftPlayer, rightPlayer, stat)).join("")}
    </div>
  `;
}

function renderComparisonMetric(leftPlayer, rightPlayer, stat) {
  const leftValue = valueOrNull(leftPlayer[stat.key]);
  const rightValue = valueOrNull(rightPlayer[stat.key]);
  const winner = getBetterSide(leftValue, rightValue, stat.better);

  return `
    <div class="compare-metric">
      <div class="compare-value ${winner === "left" ? "better" : ""}">
        ${formatValue(leftValue, stat.type)}
      </div>
      <div class="compare-metric-label">${stat.label}</div>
      <div class="compare-value ${winner === "right" ? "better" : ""}">
        ${formatValue(rightValue, stat.type)}
      </div>
    </div>
  `;
}

// The what-if calculator recomputes totals using future at-bats and hits.
function renderWhatIfCalculator() {
  const player = getPlayerByName(elements.whatIfPlayerSelect.value);
  const futureAtBats = parseInputNumber(elements.futureAtBats.value);
  const futureHits = parseInputNumber(elements.futureHits.value);

  if (!player) {
    elements.whatIfResults.innerHTML = "";
    return;
  }

  if (futureHits > futureAtBats) {
    elements.whatIfMessage.textContent = "Future hits cannot be greater than future at-bats.";
    elements.whatIfMessage.classList.add("error");
    elements.whatIfResults.innerHTML = "";
    return;
  }

  elements.whatIfMessage.textContent = "Software recalculates the batting average instantly.";
  elements.whatIfMessage.classList.remove("error");

  const projection = calculateWhatIfAverage(player, futureAtBats, futureHits);

  elements.whatIfResults.innerHTML = `
    <article class="result-card">
      <span class="muted">Current Total AB</span>
      <strong>${formatValue(projection.currentAtBats, "whole")}</strong>
    </article>
    <article class="result-card">
      <span class="muted">Current Total H</span>
      <strong>${formatValue(projection.currentHits, "whole")}</strong>
    </article>
    <article class="result-card">
      <span class="muted">Projected Total AB</span>
      <strong>${formatValue(projection.projectedAtBats, "whole")}</strong>
    </article>
    <article class="result-card">
      <span class="muted">Projected Total H</span>
      <strong>${formatValue(projection.projectedHits, "whole")}</strong>
    </article>
    <article class="result-card">
      <span class="muted">Current AVG</span>
      <strong>${formatValue(projection.currentAverage, "rate")}</strong>
    </article>
    <article class="result-card">
      <span class="muted">Projected AVG</span>
      <strong>${formatValue(projection.projectedAverage, "rate")}</strong>
    </article>
    <article class="result-card">
      <span class="muted">Future AB Added</span>
      <strong>${formatValue(futureAtBats, "whole")}</strong>
    </article>
    <article class="result-card">
      <span class="muted">Future Hits Added</span>
      <strong>${formatValue(futureHits, "whole")}</strong>
    </article>
  `;
}

function renderLeaderboard() {
  const rankedPlayers = [...state.players].sort((left, right) => right.impactScore - left.impactScore);

  elements.leaderboard.innerHTML = rankedPlayers
    .map((player, index) => {
      return `
        <article class="leaderboard-item">
          <div class="leaderboard-rank">#${index + 1}</div>
          <div>
            <h3>${escapeHtml(player.name)}</h3>
            <p>H: ${formatValue(player.h, "whole")} | RBI: ${formatValue(player.rbi, "whole")} | SB: ${formatValue(player.sb, "whole")} | BB: ${formatValue(player.bb, "whole")} | K: ${formatValue(player.k, "whole")}</p>
          </div>
          <div class="leaderboard-score">${player.impactScore}</div>
        </article>
      `;
    })
    .join("");
}

function updateSort(key) {
  if (state.sort.key === key) {
    state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
  } else {
    state.sort.key = key;
    state.sort.direction = key === "name" ? "asc" : "desc";
  }

  renderTable();
  updateSortIndicators();
}

function updateSortIndicators() {
  elements.sortButtons.forEach((button) => {
    if (button.dataset.key === state.sort.key) {
      button.dataset.indicator = state.sort.direction === "asc" ? "\u2191" : "\u2193";
      button.setAttribute("aria-sort", state.sort.direction === "asc" ? "ascending" : "descending");
    } else {
      button.dataset.indicator = "";
      button.removeAttribute("aria-sort");
    }
  });
}

function getSortedPlayers() {
  const sortedPlayers = [...state.players];
  sortedPlayers.sort((left, right) => comparePlayers(left, right, state.sort.key, state.sort.direction));
  return sortedPlayers;
}

// Missing values stay at the bottom for both ascending and descending sorts.
function comparePlayers(left, right, key, direction) {
  const leftValue = sortableValue(left[key]);
  const rightValue = sortableValue(right[key]);
  const leftMissing = leftValue === null;
  const rightMissing = rightValue === null;

  if (leftMissing && rightMissing) {
    return left.name.localeCompare(right.name);
  }

  if (leftMissing) {
    return 1;
  }

  if (rightMissing) {
    return -1;
  }

  if (typeof leftValue === "string" && typeof rightValue === "string") {
    const result = leftValue.localeCompare(rightValue);
    return direction === "asc" ? result : -result;
  }

  const result = leftValue - rightValue;
  return direction === "asc" ? result : -result;
}

function calculateImpactScore(player) {
  return (
    safeNumber(player.h) * 3 +
    safeNumber(player.rbi) * 2 +
    safeNumber(player.sb) * 2 +
    safeNumber(player.bb) * 1 -
    safeNumber(player.k) * 1
  );
}

function calculateWhatIfAverage(player, futureAtBats, futureHits) {
  const currentAtBats = safeNumber(player.ab);
  const currentHits = safeNumber(player.h);
  const projectedAtBats = currentAtBats + futureAtBats;
  const projectedHits = currentHits + futureHits;

  return {
    currentAtBats,
    currentHits,
    projectedAtBats,
    projectedHits,
    currentAverage: currentAtBats > 0 ? currentHits / currentAtBats : null,
    projectedAverage: projectedAtBats > 0 ? projectedHits / projectedAtBats : null
  };
}

function generateInsights(player) {
  const insights = [];
  const plateAppearances = valueOrNull(player.pa);
  const atBats = valueOrNull(player.ab);

  if (valueOrNull(player.obp) !== null && player.obp >= 0.5) {
    insights.push("Gets on base a lot.");
  }

  if (safeNumber(player.bb) >= 3 || safeNumber(player.bb) > safeNumber(player.k)) {
    insights.push("Disciplined at the plate.");
  }

  if (safeNumber(player.sb) >= 1) {
    insights.push("Aggressive baserunner.");
  }

  if (
    (valueOrNull(player.slg) !== null && player.slg >= 0.4) ||
    (valueOrNull(player.ops) !== null && player.ops >= 0.8) ||
    safeNumber(player.rbi) >= 2
  ) {
    insights.push("Power potential.");
  }

  if ((atBats !== null && atBats <= 5) || (plateAppearances !== null && plateAppearances <= 8)) {
    insights.push("Limited sample size.");
  }

  if (safeNumber(player.k) === 0 && safeNumber(player.h) >= 1) {
    insights.push("Makes contact without many strikeouts.");
  }

  if (!insights.length) {
    insights.push("Still building a profile from the available data.");
  }

  if (insights.length === 1) {
    insights.push("Useful example for talking about missing data in software.");
  }

  return insights.slice(0, 3);
}

function countComparisonWins(leftPlayer, rightPlayer) {
  return COMPARE_STATS.reduce((wins, stat) => {
    const winner = getBetterSide(leftPlayer[stat.key], rightPlayer[stat.key], stat.better);
    return winner === "left" ? wins + 1 : wins;
  }, 0);
}

function getBetterSide(leftValue, rightValue, direction) {
  const left = valueOrNull(leftValue);
  const right = valueOrNull(rightValue);

  if (left === null || right === null || left === right) {
    return null;
  }

  if (direction === "lower") {
    return left < right ? "left" : "right";
  }

  return left > right ? "left" : "right";
}

function findBestPlayer(players, key, direction) {
  const availablePlayers = players.filter((player) => valueOrNull(player[key]) !== null);

  if (!availablePlayers.length) {
    return null;
  }

  return [...availablePlayers].sort((left, right) => {
    const leftValue = left[key];
    const rightValue = right[key];
    return direction === "lower" ? leftValue - rightValue : rightValue - leftValue;
  })[0];
}

function sumStat(players, key) {
  return players.reduce((sum, player) => sum + safeNumber(player[key]), 0);
}

function averageOf(values) {
  const numericValues = values.filter((value) => valueOrNull(value) !== null);

  if (!numericValues.length) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function formatTableValue(player, key) {
  if (key === "name") {
    return escapeHtml(player.name);
  }

  const isRateStat = ["avg", "obp", "slg", "ops"].includes(key);
  return formatValue(player[key], isRateStat ? "rate" : "whole");
}

// Formatting helpers keep missing data easy to explain in the UI.
function formatValue(value, type) {
  const cleanValue = valueOrNull(value);

  if (cleanValue === null) {
    return MISSING_VALUE;
  }

  if (type === "rate") {
    return formatRate(cleanValue);
  }

  return String(cleanValue);
}

function formatRate(value) {
  const fixed = Number(value).toFixed(3);
  return fixed.startsWith("0.") ? fixed.replace("0.", ".") : fixed;
}

function safeNumber(value) {
  return typeof value === "number" && !Number.isNaN(value) ? value : 0;
}

function valueOrNull(value) {
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

function sortableValue(value) {
  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return valueOrNull(value);
}

function parseInputNumber(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getPlayerByName(name) {
  return state.players.find((player) => player.name === name) || null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showEmptyState() {
  elements.summaryCards.innerHTML = '<p class="muted">No player data was found.</p>';
}
