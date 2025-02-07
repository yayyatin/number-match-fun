class GameAnalytics {
  constructor() {
    // Initialize Supabase client
    this.supabase = supabase.createClient(
      "https://keolzlekolfnkgvzrazs.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlb2x6bGVrb2xmbmtndnpyYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDgxMTEsImV4cCI6MjA1MzkyNDExMX0.2GNQydxJRtbHwm9W8MGHccX-Ieyn9X7zaW-EzMehW-4"
    );

    this.playerName = "";
    this.isRecording = false;
    this.events = [];
    this.currentSession = null;
    this.lastClickTime = null;
    this.roundStartTime = null;

    this.initControls();
  }

  initControls() {
    const startBtn = document.querySelector(".start-recording");
    const stopBtn = document.querySelector(".stop-recording");
    const nameInput = document.querySelector(".player-name");

    startBtn.addEventListener("click", () => {
      if (!nameInput.value.trim()) {
        alert("Please enter player name");
        return;
      }
      this.startRecording(nameInput.value);
      startBtn.classList.add("hidden");
      stopBtn.classList.remove("hidden");
      nameInput.disabled = true;
    });

    stopBtn.addEventListener("click", () => {
      this.stopRecording();
      startBtn.classList.remove("hidden");
      stopBtn.classList.add("hidden");
      nameInput.disabled = false;
      nameInput.value = "";
    });
  }

  startRecording(playerName) {
    this.playerName = playerName;
    this.isRecording = true;
    this.currentSession = {
      playerName: playerName,
      startTime: Date.now(),
      events: [],
    };
    this.roundStartTime = Date.now();
  }

  stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.currentSession.endTime = Date.now();
    this.saveSession();
    this.resetSession();
  }

  recordEvent(eventType, data = {}) {
    if (!this.isRecording) return;

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

    this.currentSession.events.push(event);
  }

  async saveSession() {
    if (!this.currentSession) return;

    // Log the session data
    console.log("Saving analytics session:", {
      player_name: this.currentSession.playerName,
      start_time: new Date(this.currentSession.startTime).toISOString(),
      end_time: new Date(this.currentSession.endTime).toISOString(),
      events: this.currentSession.events,
    });

    try {
      const { data, error } = await this.supabase
        .from("game_analytics")
        .insert([
          {
            player_name: this.currentSession.playerName,
            start_time: new Date(this.currentSession.startTime).toISOString(),
            end_time: new Date(this.currentSession.endTime).toISOString(),
            events: this.currentSession.events,
          },
        ]);

      if (error) throw error;
      console.log("Analytics saved successfully");
    } catch (error) {
      console.error("Error saving analytics:", error);
    }
  }

  resetSession() {
    this.currentSession = null;
    this.lastClickTime = null;
    this.roundStartTime = null;
  }
}
