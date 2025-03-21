// AnalyticsDashboard class manages the analytics dashboard UI and functionality
export class AnalyticsDashboard {
  constructor() {
    // Initialize Supabase client
    if (window.supabase) {
      this.supabase = window.supabase.createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
    }

    // Only do authentication check in constructor
    if (!this.checkAuth()) {
      return;
    }
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
        return true;
      } else {
        errorMsg.textContent = "Incorrect passcode";
        input.value = "";
      }
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        submit.click();
      }
    });

    return false;
  }

  async initializeDashboard() {
    // Initialize selectors
    this.orgSelect = document.getElementById("org-select");
    this.groupSelect = document.getElementById("group-select");
    this.playersList = document.getElementById("players-list");
    this.clickTimeStats = document.getElementById("click-time-stats");
    this.matchTimeStats = document.getElementById("match-time-stats");
    this.totalTimeStats = document.getElementById("total-time-stats");
    this.numberSequenceStats = document.getElementById("number-sequence-stats");
    this.spinnerContainer = document.querySelector(".spinner-container");
    this.metricsContainer = document.querySelector(".metrics-container");
    this.toggleButton = document.querySelector(".toggle-grid");
    this.gridContent = document.querySelector(".grid-content");
    this.levelSelectorContainer = document.querySelector(
      ".level-selector-container"
    );
    this.levelSelector = document.querySelector(".level-selector");
    this.exportExcelButton = document.getElementById("export-excel");

    // Initialize state variables
    this.activeRow = null;
    this.currentLevel = 1;
    this.availableLevels = new Set();
    this.currentSessionData = null;

    // Add toggle functionality for both grids
    const toggleButtons = document.querySelectorAll(".toggle-grid");
    toggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const gridContent = button
          .closest(".organizations-grid, .players-grid")
          .querySelector(".grid-content");
        button.classList.toggle("collapsed");
        gridContent.classList.toggle("collapsed");
      });
    });

    // Add Excel export functionality
    this.exportExcelButton.addEventListener("click", () =>
      this.exportToExcel()
    );

    // Initialize UI state
    this.hideMetrics();
    this.hideSpinner();
    this.hideLevelSelector();

    // Initialize event listeners
    this.initializeEventListeners();

    // Load initial data
    await Promise.all([
      this.loadOrganizations(),
      this.loadAllGroups(),
      this.loadOrganizationsGrid(),
    ]);
  }

  initializeEventListeners() {
    // Handle organization selection
    this.orgSelect.addEventListener("change", async () => {
      const selectedOrgId = this.orgSelect.value;
      this.groupSelect.innerHTML = '<option value="">Select Group</option>';
      this.playersList.innerHTML = "";
      this.exportExcelButton.disabled = true; // Disable when org changes

      // Hide metrics and level selector when organization changes
      this.hideMetrics();
      this.hideLevelSelector();
      this.clearStats();

      if (selectedOrgId) {
        this.groupSelect.disabled = false;
        // Filter groups for selected organization from memory
        const orgGroups = this.allGroups.filter(
          (group) => group.organization_id === parseInt(selectedOrgId)
        );

        // Populate groups dropdown
        orgGroups.forEach((group) => {
          const option = document.createElement("option");
          option.value = group.id;
          option.textContent = group.name;
          this.groupSelect.appendChild(option);
        });
      } else {
        this.groupSelect.disabled = true;
      }
    });

    // Handle group selection
    this.groupSelect.addEventListener("change", async () => {
      const selectedGroupId = this.groupSelect.value;
      this.exportExcelButton.disabled = !selectedGroupId;

      // Hide metrics and level selector when group changes
      this.hideMetrics();
      this.hideLevelSelector();
      this.clearStats();

      if (selectedGroupId) {
        await this.loadPlayers(selectedGroupId);
      } else {
        this.playersList.innerHTML = "";
      }
    });
  }

  async loadOrganizations() {
    try {
      this.showSpinner();

      const { data: organizations, error } = await this.supabase
        .from("organizations")
        .select("id, name")
        .order("name");

      if (error) throw error;

      // Clear existing options except the first one
      this.orgSelect.innerHTML =
        '<option value="">Select Organization</option>';

      // Populate organizations dropdown
      organizations.forEach((org) => {
        const option = document.createElement("option");
        option.value = org.id;
        option.textContent = org.name;
        this.orgSelect.appendChild(option);
      });

      console.log("Loaded organizations:", organizations); // Debug log
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      this.hideSpinner();
    }
  }

  async loadAllGroups() {
    try {
      this.showSpinner();

      const { data: groups, error } = await this.supabase
        .from("groups")
        .select("id, name, organization_id")
        .order("name");

      if (error) throw error;

      // Store all groups in memory for later use
      this.allGroups = groups;
      console.log("Loaded all groups:", groups); // Debug log
    } catch (error) {
      console.error("Error loading all groups:", error);
    } finally {
      this.hideSpinner();
    }
  }

  async loadPlayers(groupId) {
    try {
      this.showSpinner();
      this.playersList.innerHTML = "";

      const { data, error } = await this.supabase
        .from("game_analytics")
        .select("id, player_name, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Add all sessions to the grid
      data.forEach((session) => {
        const row = document.createElement("tr");
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

        const viewButton = row.querySelector(".view-button");
        viewButton.addEventListener("click", () =>
          this.selectPlayer(session.id, row)
        );

        this.playersList.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading players:", error);
    } finally {
      this.hideSpinner();
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

  async selectPlayer(sessionId, row) {
    try {
      if (this.activeRow) {
        this.activeRow.classList.remove("active");
      }
      row.classList.add("active");
      this.activeRow = row;

      const { data: session, error } = await this.supabase
        .from("game_analytics")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      this.currentSessionData = session;

      // Check if events data exists and is not empty
      if (!session.events || session.events.length === 0) {
        this.showMetrics();
        // Clear all stats
        this.clearStats();
        // Show "No events available" message in the first metric card
        this.numberSequenceStats.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #666;">
            No events available for this session
          </div>
        `;
        this.hideLevelSelector();
        return;
      }

      // If events exist, proceed with normal display
      this.updateDashboard(session);
    } catch (error) {
      console.error("Error selecting player:", error);
    }
  }

  updateDashboard(data) {
    this.clearStats();
    this.showMetrics();
    this.updateLevelSelector(data);

    const levelEvents = data.events.filter(
      (event) => event.level === this.currentLevel
    );

    this.displayClickTimeStats(levelEvents);
    this.displayMatchTimeStats(levelEvents);
    this.displayTotalTimeStats(levelEvents);
    this.displayNumberSequence(levelEvents);
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
    let timeFromFirstClick = null;

    events.forEach((event) => {
      if (!sequences[event.round]) {
        sequences[event.round] = {
          pairs: [],
          targetNumber: null,
        };
      }

      if (event.type === "secondClick") {
        sequences[event.round].targetNumber = event.targetSum;
        timeFromFirstClick = event.timeFromFirstClick; // Get time from second click event
      }

      if (event.type === "firstClick") {
        currentPair = [event.number];
      } else if (event.type === "secondClick") {
        currentPair.push(event.number);
        sequences[event.round].pairs.push({
          numbers: [...currentPair],
          result: event.matchResult,
          timeFromFirstClick: timeFromFirstClick, // Add time to the pair data
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
        const timeText = pair.timeFromFirstClick
          ? pair.timeFromFirstClick > 1000
            ? `${(pair.timeFromFirstClick / 1000).toFixed(1)}s`
            : `${pair.timeFromFirstClick}ms`
          : "";
        return `
            <div style="display: inline-flex; 
                        flex-direction: column;
                        align-items: center;
                        margin: 0 4px;">
                <div style="background-color: ${backgroundColor}; 
                           padding: 4px 8px; 
                           border-radius: 4px;">
                    <span style="margin-right: 4px;">${pair.numbers[0]}</span>
                    <span>+</span>
                    <span style="margin-left: 4px;">${pair.numbers[1]}</span>
                </div>
                <div style="font-size: 0.7em; color: #666; margin-top: 2px;">
                    ${timeText}
                </div>
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

  async exportToExcel() {
    try {
      const selectedGroupId = this.groupSelect.value;
      const selectedOrgId = this.orgSelect.value;

      this.showSpinner();

      // Fetch all players data for the selected group
      const { data: sessions, error } = await this.supabase
        .from("game_analytics")
        .select("*")
        .eq("group_id", selectedGroupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get organization and group names
      const orgName = this.orgSelect.options[this.orgSelect.selectedIndex].text;
      const groupName =
        this.groupSelect.options[this.groupSelect.selectedIndex].text;

      // Process data for Excel
      const excelData = [];

      sessions.forEach((session) => {
        // Group events by level
        const eventsByLevel = {};
        session.events.forEach((event) => {
          if (!eventsByLevel[event.level]) {
            eventsByLevel[event.level] = [];
          }
          eventsByLevel[event.level].push(event);
        });

        // Process each level separately
        Object.entries(eventsByLevel).forEach(([level, levelEvents]) => {
          const sequences = this.calculateNumberSequences(levelEvents);

          Object.entries(sequences).forEach(([round, data]) => {
            data.pairs.forEach((pair) => {
              excelData.push({
                Organization: orgName,
                Group: groupName,
                Player: session.player_name,
                Date: new Date(session.created_at).toLocaleString(),
                Level: level,
                Round: round,
                "Target Number": data.targetNumber,
                "First Number": pair.numbers[0],
                "Second Number": pair.numbers[1],
                Result: pair.result,
                "Time Taken (ms)": pair.timeFromFirstClick || "",
              });
            });
          });
        });
      });

      // Convert to Excel and download
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Number Matching Data");

      // Auto-size columns
      const colWidths = Object.keys(excelData[0]).map((key) => ({
        wch: Math.max(
          key.length,
          ...excelData.map((row) => String(row[key]).length)
        ),
      }));
      ws["!cols"] = colWidths;

      // Generate filename with org and group
      const filename = `${orgName}_${groupName}_data.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      this.hideSpinner();
    }
  }

  async loadOrganizationsGrid() {
    try {
      this.showSpinner();
      const organizationsList = document.getElementById("organizations-list");
      organizationsList.innerHTML = "";

      // Fetch organizations with their groups and players count
      const { data: organizations, error } = await this.supabase.from(
        "organizations"
      ).select(`
          id,
          name,
          groups:groups(
            id,
            name,
            players:game_analytics(count)
          )
        `);

      if (error) throw error;

      organizations.forEach((org) => {
        const row = document.createElement("tr");
        const groupCount = org.groups?.length || 0;
        const playerCount =
          org.groups?.reduce(
            (sum, group) => sum + (group.players?.[0]?.count || 0),
            0
          ) || 0;

        row.innerHTML = `
          <td>${org.name}</td>
          <td>${groupCount}</td>
          <td>${playerCount}</td>
          <td>
            <button class="delete-button" data-id="${org.id}" data-name="${org.name}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        `;

        const deleteButton = row.querySelector(".delete-button");
        deleteButton.addEventListener("click", () =>
          this.deleteOrganization(org.id, org.name)
        );

        organizationsList.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading organizations grid:", error);
    } finally {
      this.hideSpinner();
    }
  }

  async deleteOrganization(orgId, orgName) {
    if (
      !confirm(
        `Are you sure you want to delete "${orgName}" and all its associated data? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      this.showSpinner();

      // Delete all game analytics records for this organization's groups
      await this.supabase
        .from("game_analytics")
        .delete()
        .in(
          "group_id",
          this.allGroups
            .filter((group) => group.organization_id === orgId)
            .map((group) => group.id)
        );

      // Delete all groups
      await this.supabase.from("groups").delete().eq("organization_id", orgId);

      // Delete the organization
      const { error } = await this.supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      // Refresh the data
      await Promise.all([
        this.loadOrganizations(),
        this.loadAllGroups(),
        this.loadOrganizationsGrid(),
      ]);

      // Reset selections if the deleted org was selected
      if (this.orgSelect.value == orgId) {
        this.orgSelect.value = "";
        this.groupSelect.innerHTML = '<option value="">Select Group</option>';
        this.groupSelect.disabled = true;
        this.playersList.innerHTML = "";
        this.hideMetrics();
        this.hideLevelSelector();
        this.clearStats();
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Error deleting organization. Please try again.");
    } finally {
      this.hideSpinner();
    }
  }
}
