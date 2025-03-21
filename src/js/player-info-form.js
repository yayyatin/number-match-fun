class GameAnalytics {
  constructor() {
    // Initialize Supabase client if supabase exists
    if (window.supabase) {
      this.supabase = window.supabase.createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
    }

    this.playerName = "";
    this.isRecording = false;
    this.events = [];
    this.currentSession = null;
    this.lastClickTime = null;
    this.roundStartTime = null;
    this.gameOverlay = document.getElementById("game-overlay");
    this.sessionId = null; // Add this to store the current session ID

    this.initControls();
    this.loadOrganizations();
  }

  async loadOrganizations() {
    try {
      const { data: organizations, error } = await this.supabase
        .from("organizations")
        .select("name")
        .order("name");

      if (error) throw error;

      const datalist = document.getElementById("organizations-list");
      datalist.innerHTML = ""; // Clear existing options

      organizations.forEach((org) => {
        const option = document.createElement("option");
        option.value = org.name;
        datalist.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  }

  async getOrCreateOrganization(orgName) {
    let { data: org, error: orgError } = await this.supabase
      .from("organizations")
      .select("id")
      .eq("name", orgName)
      .single();

    if (orgError && orgError.code === "PGRST116") {
      const { data: newOrg, error: createOrgError } = await this.supabase
        .from("organizations")
        .insert({ name: orgName })
        .select("id")
        .single();

      if (createOrgError) throw createOrgError;
      org = newOrg;
    } else if (orgError) {
      throw orgError;
    }

    return org;
  }

  async getOrCreateGroup(groupName, orgId) {
    let { data: group, error: groupError } = await this.supabase
      .from("groups")
      .select("id")
      .eq("name", groupName)
      .eq("organization_id", orgId)
      .single();

    if (groupError && groupError.code === "PGRST116") {
      const { data: newGroup, error: createGroupError } = await this.supabase
        .from("groups")
        .insert({
          name: groupName,
          organization_id: orgId,
        })
        .select("id")
        .single();

      if (createGroupError) throw createGroupError;
      group = newGroup;
    } else if (groupError) {
      throw groupError;
    }

    return group;
  }

  async initControls() {
    const startBtn = document.querySelector(".start-recording");
    const stopBtn = document.querySelector(".stop-recording");
    const nameInput = document.querySelector(".player-name");
    const organizationInput = document.querySelector(".organization-name");
    const groupInput = document.querySelector(".group-name");

    // Prevent the input from triggering any keydown events at document level
    organizationInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
    });

    organizationInput.addEventListener("input", (e) => {
      e.stopPropagation();
      // Only trim leading and trailing whitespace when losing focus
    });

    // Add blur event to trim only when user leaves the field
    organizationInput.addEventListener("blur", (e) => {
      e.target.value = e.target.value.trim();
    });

    organizationInput.addEventListener("change", (e) => {
      e.stopPropagation();
    });

    // Also prevent any key events from bubbling up
    organizationInput.addEventListener("keyup", (e) => {
      e.stopPropagation();
    });

    organizationInput.addEventListener("keypress", (e) => {
      e.stopPropagation();
    });

    startBtn.addEventListener("click", async () => {
      const playerName = nameInput.value.trim();
      const orgName = organizationInput.value.trim();
      const groupName = groupInput.value.trim();

      if (!playerName || !orgName || !groupName) {
        alert("Please enter player name, organization and group");
        return;
      }

      try {
        startBtn.textContent = "Wait...";
        startBtn.disabled = true;

        const org = await this.getOrCreateOrganization(orgName);
        const group = await this.getOrCreateGroup(groupName, org.id);

        this.currentGroupId = group.id;
        this.gameOverlay.classList.add("hidden");

        await this.startRecording(playerName);

        startBtn.classList.add("hidden");
        stopBtn.classList.remove("hidden");
        nameInput.disabled = true;
        organizationInput.disabled = true;
        groupInput.disabled = true;
      } catch (error) {
        alert(`Error starting session: ${error.message || "Unknown error"}`);
      } finally {
        startBtn.textContent = "Start";
        startBtn.disabled = false;
      }
    });

    stopBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to stop the events recording?")) {
        this.gameOverlay.classList.remove("hidden");
        this.stopRecording();
        this.resetUI(
          startBtn,
          stopBtn,
          nameInput,
          organizationInput,
          groupInput
        );
      }
    });
  }

  resetUI(startBtn, stopBtn, nameInput, organizationInput, groupInput) {
    startBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");
    nameInput.disabled = false;
    nameInput.value = "";
    organizationInput.disabled = false;
    organizationInput.value = "";
    groupInput.disabled = false;
    groupInput.value = "";
  }

  async startRecording(playerName) {
    try {
      this.playerName = playerName;
      this.isRecording = true;
      this.currentSession = {
        playerName: playerName,
        startTime: Date.now(),
        events: [],
      };
      this.roundStartTime = Date.now();

      // Create initial session in DB
      const { data, error } = await this.supabase
        .from("game_analytics")
        .insert([
          {
            player_name: playerName,
            start_time: new Date(this.currentSession.startTime).toISOString(),
            end_time: new Date(this.currentSession.startTime).toISOString(), // Set initial end_time same as start_time
            events: [],
            group_id: this.currentGroupId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error("Failed to create session in database");
      }

      this.sessionId = data.id;
    } catch (error) {
      // Reset recording state on error
      this.isRecording = false;
      this.currentSession = null;
      this.roundStartTime = null;
      console.error("Error in startRecording:", error);
      throw error; // Re-throw to be caught by click handler
    }
  }

  async recordEvent(eventType, data = {}) {
    if (!this.isRecording || !this.sessionId) return;

    const timestamp = Date.now();
    const event = {
      type: eventType,
      timestamp,
      ...data,
    };

    // Add time-based calculations based on event type
    switch (eventType) {
      case "firstClick":
        event.timeFromRoundStart = timestamp - this.roundStartTime;
        this.lastClickTime = timestamp;
        break;
      case "secondClick":
        event.timeFromFirstClick = timestamp - this.lastClickTime;
        break;
      case "matchComplete":
        event.totalMatchTime = timestamp - this.lastClickTime;
        break;
      case "roundStart":
        this.roundStartTime = timestamp;
        break;
    }

    // Add event to local array
    this.currentSession.events.push(event);

    // Update session in DB with new event
    try {
      const { error } = await this.supabase
        .from("game_analytics")
        .update({
          events: this.currentSession.events,
        })
        .eq("id", this.sessionId);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving event:", error);
    }
  }

  async stopRecording() {
    if (!this.isRecording || !this.sessionId) return;

    this.isRecording = false;
    this.currentSession.endTime = Date.now();

    try {
      // Update session with end time
      const { error } = await this.supabase
        .from("game_analytics")
        .update({
          end_time: new Date(this.currentSession.endTime).toISOString(),
        })
        .eq("id", this.sessionId);

      if (error) throw error;

      // Show success message and reload
      alert("Session recorded successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error ending session:", error);
      alert("Error saving session. Please try again.");
    }
  }

  resetSession() {
    this.currentSession = null;
    this.lastClickTime = null;
    this.roundStartTime = null;
  }
}

export default GameAnalytics;
