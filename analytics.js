class AnalyticsDashboard {
  constructor() {
    // Check for authentication first
    if (!this.checkAuth()) {
      return;
    }

    this.supabase = supabase.createClient(
      "https://keolzlekolfnkgvzrazs.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlb2x6bGVrb2xmbmtndnpyYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDgxMTEsImV4cCI6MjA1MzkyNDExMX0.2GNQydxJRtbHwm9W8MGHccX-Ieyn9X7zaW-EzMehW-4"
    );

    // Initialize all DOM element selectors first
    this.clickTimeStats = document.getElementById("click-time-stats");
    this.matchTimeStats = document.getElementById("match-time-stats");
    this.totalTimeStats = document.getElementById("total-time-stats");
    this.numberSequenceStats = document.getElementById("number-sequence-stats");
    this.spinnerContainer = document.querySelector(".spinner-container");
    this.metricsContainer = document.querySelector(".metrics-container");
    this.playersList = document.getElementById("players-list");
    this.toggleButton = document.querySelector(".toggle-grid");
    this.gridContent = document.querySelector(".grid-content");
    this.levelSelectorContainer = document.querySelector(
      ".level-selector-container"
    );
    this.levelSelector = document.querySelector(".level-selector");
    this.exportButton = document.getElementById("export-button");

    // Initialize state variables
    this.activeRow = null;
    this.currentLevel = 1;
    this.availableLevels = new Set();
    this.currentSessionData = null; // Add this to store the current session data

    // Add toggle functionality
    this.toggleButton.addEventListener("click", () => this.toggleGrid());
    this.exportButton.addEventListener("click", () => this.exportStats());

    // Initialize UI state
    this.hideMetrics();
    this.hideSpinner();
    this.hideLevelSelector();

    // Load initial data
    this.loadPlayers();
  }

  checkAuth() {
    const overlay = document.querySelector(".passcode-overlay");
    const input = document.getElementById("passcode-input");
    const submit = document.getElementById("passcode-submit");
    const errorMsg = document.querySelector(".error-message");
    const dashboard = document.querySelector(".dashboard-container");

    submit.addEventListener("click", () => {
      if (input.value === "1121") {
        overlay.style.display = "none";
        dashboard.style.display = "block";
        this.initializeDashboard();
      } else {
        errorMsg.textContent = "Incorrect passcode";
        input.value = "";
      }
    });

    // Also allow Enter key to submit
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        submit.click();
      }
    });

    return false;
  }

  initializeDashboard() {
    // Move all constructor initialization here
    this.supabase = supabase.createClient(
      "https://keolzlekolfnkgvzrazs.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlb2x6bGVrb2xmbmtndnpyYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDgxMTEsImV4cCI6MjA1MzkyNDExMX0.2GNQydxJRtbHwm9W8MGHccX-Ieyn9X7zaW-EzMehW-4"
    );

    // Initialize all DOM element selectors
    this.clickTimeStats = document.getElementById("click-time-stats");
    this.matchTimeStats = document.getElementById("match-time-stats");
    this.totalTimeStats = document.getElementById("total-time-stats");
    this.numberSequenceStats = document.getElementById("number-sequence-stats");
    this.spinnerContainer = document.querySelector(".spinner-container");
    this.metricsContainer = document.querySelector(".metrics-container");
    this.playersList = document.getElementById("players-list");
    this.toggleButton = document.querySelector(".toggle-grid");
    this.gridContent = document.querySelector(".grid-content");
    this.levelSelectorContainer = document.querySelector(
      ".level-selector-container"
    );
    this.levelSelector = document.querySelector(".level-selector");
    this.exportButton = document.getElementById("export-button");

    // Initialize state variables
    this.activeRow = null;
    this.currentLevel = 1;
    this.availableLevels = new Set();
    this.currentSessionData = null;

    // Add toggle functionality
    this.toggleButton.addEventListener("click", () => this.toggleGrid());
    this.exportButton.addEventListener("click", () => this.exportStats());

    // Initialize UI state
    this.hideMetrics();
    this.hideSpinner();
    this.hideLevelSelector();

    // Load initial data
    this.loadPlayers();
  }

  async loadPlayers() {
    try {
      this.showSpinner(); // Show spinner before loading

      const { data, error } = await this.supabase
        .from("game_analytics")
        .select("id, player_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Clear existing players
      this.playersList.innerHTML = "";

      // Add all sessions to the grid
      data.forEach((session) => {
        const row = document.createElement("tr");

        // Format the date
        const date = new Date(session.created_at);
        const formattedDate = date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        row.innerHTML = `
          <td>${session.player_name}</td>
          <td>${formattedDate}</td>
          <td>
            <button class="view-button" data-id="${session.id}">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        `;

        // Add click handler for the view button
        const viewButton = row.querySelector(".view-button");
        viewButton.addEventListener("click", () =>
          this.selectPlayer(session.id, row)
        );

        this.playersList.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading players:", error);
    } finally {
      this.hideSpinner(); // Hide spinner after loading (whether successful or not)
    }
  }

  showSpinner() {
    this.spinnerContainer.classList.remove("hidden");
  }

  hideSpinner() {
    this.spinnerContainer.classList.add("hidden");
  }

  showMetrics() {
    this.metricsContainer.classList.remove("hidden");
  }

  hideMetrics() {
    this.metricsContainer.classList.add("hidden");
  }

  showLevelSelector() {
    this.levelSelectorContainer.classList.remove("hidden");
  }

  hideLevelSelector() {
    this.levelSelectorContainer.classList.add("hidden");
  }

  selectPlayer(id, row) {
    // Remove active class from previous row
    if (this.activeRow) {
      this.activeRow.classList.remove("active");
    }

    // Add active class to current row
    row.classList.add("active");
    this.activeRow = row;

    // Reset to level 1 when selecting a new player
    this.currentLevel = 1;

    // Update all level buttons to show level 1 as active
    document.querySelectorAll(".level-button").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.textContent) === 1);
    });

    // Update dashboard with selected player's data
    this.updateDashboard(id);
  }

  async updateDashboard(id) {
    if (!id) {
      this.hideMetrics();
      this.hideLevelSelector();
      this.hideExportButton();
      this.clearStats();
      this.currentSessionData = null;
      return;
    }

    try {
      this.hideMetrics();
      this.hideLevelSelector();
      this.hideExportButton();
      this.showSpinner();

      // Only fetch data if we don't have it or if it's for a different session
      if (!this.currentSessionData || this.currentSessionData.id !== id) {
        const { data, error } = await this.supabase
          .from("game_analytics")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        this.currentSessionData = data;
      }

      if (this.currentSessionData) {
        this.updateLevelSelector(this.currentSessionData);

        // Filter events for current level
        const levelEvents = this.currentSessionData.events.filter(
          (event) => event.level === this.currentLevel
        );

        this.displayClickTimeStats(levelEvents);
        this.displayMatchTimeStats(levelEvents);
        this.displayTotalTimeStats(levelEvents);
        this.displayNumberSequence(levelEvents);
        this.showMetrics();
        this.showExportButton();
      }
    } catch (error) {
      console.error("Error updating dashboard:", error);
      this.hideMetrics();
      this.hideLevelSelector();
      this.hideExportButton();
    } finally {
      this.hideSpinner();
    }
  }

  displayClickTimeStats(events) {
    this.clickTimeStats.innerHTML = "";
    const roundTimes = this.calculateClickTimes(events);

    Object.entries(roundTimes).forEach(([round, data]) => {
      const roundItem = document.createElement("div");
      roundItem.className = "round-item";

      roundItem.innerHTML = `
            <div class="round-label">
                Round ${round}:
                <div style="font-size: 0.7em; color: #666; margin-top: 2px;">
                    (Target: ${data.targetNumber})
                </div>
            </div>
            <div class="round-value">
                ${this.formatTime(data.avgTime)}
            </div>
        `;

      this.clickTimeStats.appendChild(roundItem);
    });
  }

  displayMatchTimeStats(events) {
    this.matchTimeStats.innerHTML = "";
    const matchTimes = this.calculateMatchTimes(events);

    Object.entries(matchTimes).forEach(([round, times]) => {
      if (times.count > 0) {
        const roundItem = document.createElement("div");
        roundItem.className = "round-item";

        roundItem.innerHTML = `
                <div class="round-label">
                    Round ${round}:
                    <div style="font-size: 0.7em; color: #666; margin-top: 2px;">
                        (Target: ${times.targetNumber})
                    </div>
                </div>
                <div class="round-value">
                    ${this.formatTime(times.avgTime)} 
                    <span style="font-size: 0.8em; color: #666;">
                        (${times.count} matches)
                    </span>
                </div>
            `;

        this.matchTimeStats.appendChild(roundItem);
      }
    });
  }

  calculateClickTimes(events) {
    const roundTimes = {};

    events.forEach((event) => {
      if (event.type === "roundStart") {
        roundTimes[event.round] = {
          total: 0,
          count: 0,
          targetNumber: event.targetSum,
        };
      }

      if (
        event.type === "secondClick" &&
        event.timeFromFirstClick &&
        event.round
      ) {
        if (!roundTimes[event.round]) {
          roundTimes[event.round] = {
            total: 0,
            count: 0,
            targetNumber: event.targetSum,
          };
        }
        roundTimes[event.round].total += event.timeFromFirstClick;
        roundTimes[event.round].count++;
      }
    });

    // Calculate averages
    Object.entries(roundTimes).forEach(([round, data]) => {
      data.avgTime = data.count > 0 ? data.total / data.count : 0;
    });

    return roundTimes;
  }

  calculateMatchTimes(events) {
    const roundTimes = {};
    let currentRound = null;

    events.forEach((event) => {
      if (event.type === "roundStart") {
        currentRound = event.round;

        // Initialize round data
        roundTimes[currentRound] = {
          matches: [], // Store match times
          count: 0, // Count of complete matches
          targetNumber: event.targetSum, // Store target number
        };
      }

      // Track successful matches
      if (event.type === "secondClick" && event.matchResult === "correct") {
        if (!roundTimes[event.round]) {
          roundTimes[event.round] = {
            matches: [],
            count: 0,
            targetNumber: event.targetSum,
          };
        }

        // Store the time between clicks for this match
        roundTimes[event.round].matches.push(event.timeFromFirstClick);
      }
    });

    // Calculate averages for each round
    Object.entries(roundTimes).forEach(([round, data]) => {
      // Calculate average time for the round
      const totalTime = data.matches.reduce((sum, time) => sum + time, 0);
      const numMatches = data.matches.length;

      roundTimes[round] = {
        avgTime: numMatches > 0 ? totalTime / numMatches : 0,
        count: numMatches,
        targetNumber: data.targetNumber,
      };
    });

    return roundTimes;
  }

  calculateTotalTimes(events) {
    const roundTimes = {};

    events.forEach((event) => {
      if (!roundTimes[event.round]) {
        roundTimes[event.round] = {
          firstTimestamp: null,
          lastTimestamp: null,
          targetNumber: null,
        };
      }

      // Store target number
      if (event.type === "secondClick") {
        roundTimes[event.round].targetNumber = event.targetSum;
      }

      // Track timestamps
      if (event.timestamp) {
        if (roundTimes[event.round].firstTimestamp === null) {
          roundTimes[event.round].firstTimestamp = event.timestamp;
        }
        roundTimes[event.round].lastTimestamp = event.timestamp;
      }
    });

    // Calculate total time for each round
    Object.entries(roundTimes).forEach(([round, data]) => {
      data.totalTime = data.lastTimestamp - data.firstTimestamp;
    });

    return roundTimes;
  }

  displayTotalTimeStats(events) {
    this.totalTimeStats.innerHTML = "";
    const totalTimes = this.calculateTotalTimes(events);

    Object.entries(totalTimes).forEach(([round, data]) => {
      if (data.targetNumber !== null) {
        const roundItem = document.createElement("div");
        roundItem.className = "round-item";

        roundItem.innerHTML = `
                <div class="round-label">
                    Round ${round}:
                    <div style="font-size: 0.7em; color: #666; margin-top: 2px;">
                        (Target: ${data.targetNumber})
                    </div>
                </div>
                <div class="round-value">
                    ${this.formatTime(data.totalTime)}
                </div>
            `;

        this.totalTimeStats.appendChild(roundItem);
      }
    });
  }

  displayNumberSequence(events) {
    this.numberSequenceStats.innerHTML = "";
    const sequences = this.calculateNumberSequences(events);

    Object.entries(sequences).forEach(([round, data]) => {
      const roundItem = document.createElement("div");
      roundItem.className = "round-item";

      const numbersHtml = this.formatNumberSequence(data.pairs);

      roundItem.innerHTML = `
            <div class="round-label">
                Round ${round}:
                <div style="font-size: 0.7em; color: #666; margin-top: 2px;">
                    (Target: ${data.targetNumber})
                </div>
            </div>
            <div class="round-value">
                ${numbersHtml}
            </div>
        `;

      this.numberSequenceStats.appendChild(roundItem);
    });
  }

  calculateNumberSequences(events) {
    const sequences = {};
    let currentPair = [];

    events.forEach((event) => {
      if (!sequences[event.round]) {
        sequences[event.round] = {
          pairs: [],
          targetNumber: null,
        };
      }

      if (event.type === "secondClick") {
        sequences[event.round].targetNumber = event.targetSum;
      }

      if (event.type === "firstClick") {
        currentPair = [event.number];
      } else if (event.type === "secondClick") {
        currentPair.push(event.number);
        sequences[event.round].pairs.push({
          numbers: [...currentPair],
          result: event.matchResult,
        });
        currentPair = [];
      }
    });

    return sequences;
  }

  formatNumberSequence(pairs) {
    return pairs
      .map((pair) => {
        const backgroundColor =
          pair.result === "correct" ? "#90EE90" : "#FFE4B5";
        return `
            <div style="display: inline-flex; 
                        background-color: ${backgroundColor}; 
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        margin: 0 4px;">
                <span style="margin-right: 4px;">${pair.numbers[0]}</span>
                <span>+</span>
                <span style="margin-left: 4px;">${pair.numbers[1]}</span>
            </div>
        `;
      })
      .join(" ");
  }

  formatTime(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  }

  clearStats() {
    this.clickTimeStats.innerHTML = "";
    this.matchTimeStats.innerHTML = "";
    this.totalTimeStats.innerHTML = "";
    this.numberSequenceStats.innerHTML = "";
  }

  toggleGrid() {
    this.toggleButton.classList.toggle("collapsed");
    this.gridContent.classList.toggle("collapsed");
  }

  updateLevelSelector(data) {
    // Clear existing levels
    this.levelSelector.innerHTML = "";
    this.availableLevels.clear();

    // Find available levels in the data
    data.events.forEach((event) => {
      this.availableLevels.add(event.level);
    });

    // Sort levels to ensure they appear in order
    const sortedLevels = Array.from(this.availableLevels).sort();

    // Create buttons only for levels that exist in the data
    sortedLevels.forEach((level) => {
      const button = this.createLevelButton(level, true);
      this.levelSelector.appendChild(button);
    });

    this.showLevelSelector();
  }

  createLevelButton(level, isAvailable) {
    const button = document.createElement("button");
    button.className = `level-button ${level === 1 ? "active" : ""}`;
    button.textContent = level;
    button.addEventListener("click", () => this.switchLevel(level));
    return button;
  }

  switchLevel(level) {
    if (this.currentLevel === level) return;

    this.currentLevel = level;

    // Update active state of level buttons
    document.querySelectorAll(".level-button").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.textContent) === level);
    });

    // Just update the UI with the stored data, no need for API call
    if (this.currentSessionData) {
      const levelEvents = this.currentSessionData.events.filter(
        (event) => event.level === this.currentLevel
      );
      this.displayClickTimeStats(levelEvents);
      this.displayMatchTimeStats(levelEvents);
      this.displayTotalTimeStats(levelEvents);
      this.displayNumberSequence(levelEvents);
    }
  }

  showExportButton() {
    this.exportButton.classList.remove("hidden");
  }

  hideExportButton() {
    this.exportButton.classList.add("hidden");
  }

  async exportStats() {
    if (!this.currentSessionData) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const playerName = this.currentSessionData.player_name;
    const date = new Date(this.currentSessionData.created_at).toLocaleString();

    // Add title
    doc.setFontSize(16);
    doc.text(`Player Stats: ${playerName}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Session Date: ${date}`, 14, 30);
    doc.text(`Level: ${this.currentLevel}`, 14, 40);

    let yOffset = 50;

    // Export Number Sequence
    doc.setFontSize(14);
    doc.text("Number Selection Sequence", 14, yOffset);
    yOffset += 10;

    const levelEvents = this.currentSessionData.events.filter(
      (event) => event.level === this.currentLevel
    );

    const sequences = this.calculateNumberSequences(levelEvents);
    Object.entries(sequences).forEach(([round, data]) => {
      doc.setFontSize(12);
      doc.text(`Round ${round} (Target: ${data.targetNumber})`, 14, yOffset);
      yOffset += 10;

      const pairs = data.pairs
        .map((pair) => `${pair.numbers[0]}+${pair.numbers[1]} (${pair.result})`)
        .join(", ");

      doc.setFontSize(10);
      doc.text(pairs, 14, yOffset, { maxWidth: 180 });
      yOffset += 15;
    });

    // Export Click Time Stats
    yOffset += 10;
    doc.setFontSize(14);
    doc.text("Click Time Stats", 14, yOffset);
    yOffset += 10;

    const clickTimes = this.calculateClickTimes(levelEvents);
    Object.entries(clickTimes).forEach(([round, data]) => {
      doc.setFontSize(10);
      doc.text(
        `Round ${round} (Target: ${data.targetNumber}): ${this.formatTime(
          data.avgTime
        )}`,
        14,
        yOffset
      );
      yOffset += 8;
    });

    // Export Total Time Stats
    yOffset += 10;
    doc.setFontSize(14);
    doc.text("Total Time per Round", 14, yOffset);
    yOffset += 10;

    const totalTimes = this.calculateTotalTimes(levelEvents);
    Object.entries(totalTimes).forEach(([round, data]) => {
      if (data.targetNumber !== null) {
        doc.setFontSize(10);
        doc.text(
          `Round ${round} (Target: ${data.targetNumber}): ${this.formatTime(
            data.totalTime
          )}`,
          14,
          yOffset
        );
        yOffset += 8;
      }
    });

    // Save the PDF
    doc.save(`${playerName}_level${this.currentLevel}_stats.pdf`);
  }
}

// Initialize dashboard
const dashboard = new AnalyticsDashboard();
