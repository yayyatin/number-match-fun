// Sound-related methods from NumberGame
// No imports needed - methods are added to NumberGame prototype which is globally available

NumberGame.prototype.initSoundControl = function () {
  const bgMusicToggle = document.querySelector(".sound-toggle.bg-music");
  const gameSoundToggle = document.querySelector(".sound-toggle.game-sound");

  // Background music control
  bgMusicToggle.addEventListener("click", () => {
    this.isMusicMuted = !this.isMusicMuted;
    bgMusicToggle.querySelector(".music-on").classList.toggle("hidden");
    bgMusicToggle.querySelector(".music-off").classList.toggle("hidden");
    this.sounds.background.muted = this.isMusicMuted;
  });

  // Game sound effects control
  gameSoundToggle.addEventListener("click", () => {
    this.isSoundMuted = !this.isSoundMuted;
    gameSoundToggle.querySelector(".sound-on").classList.toggle("hidden");
    gameSoundToggle.querySelector(".sound-off").classList.toggle("hidden");
  });

  // Start background music on first user interaction
  document.addEventListener(
    "click",
    () => {
      if (!this.musicStarted) {
        this.sounds.background
          .play()
          .catch((e) => console.log("Background music play failed:", e));
        this.musicStarted = true;
      }
    },
    { once: true }
  );
};

NumberGame.prototype.playSound = function (soundName) {
  const sound = this.sounds[soundName];
  if (!sound) return;

  if (soundName === "background") {
    if (!this.isMusicMuted) {
      sound.play().catch((e) => console.log("Sound play failed:", e));
    }
  } else {
    if (!this.isSoundMuted) {
      sound.currentTime = 0;
      sound.play().catch((e) => console.log("Sound play failed:", e));
    }
  }
};
