// Secret input-related methods from NumberGame
// No imports needed - methods are added to NumberGame prototype which is globally available

NumberGame.prototype.initSecretInput = function () {
  document.addEventListener("keydown", (e) => {
    this.secretWord += e.key.toLowerCase();

    if (this.secretWord.length > 4) {
      this.secretWord = this.secretWord.slice(-4);
    }

    if (this.secretWord === "open") {
      const secretContainer = document.querySelector(".secret-input-container");
      secretContainer.classList.remove("hidden");
      this.secretWord = "";
    }
  });

  // Update submit button handler
  const submitBtn = document.querySelector(".secret-submit");
  submitBtn.addEventListener("click", () => {
    const input = document.querySelector(".secret-input");
    const levelNumber = parseInt(input.value);

    // Check if input is a valid level number
    if (levelNumber > 0 && levelNumber <= this.levelKeys.length) {
      // Switch to the specified level
      this.currentLevelIndex = levelNumber - 1;
      this.currentLevel = this.levelKeys[this.currentLevelIndex];
      this.levelConfig = this.levels[this.currentLevel];
      this.currentRound = 0;

      // Update level indicator
      const levelIndicator = document.querySelector(".level-indicator");
      levelIndicator.textContent = `Level ${this.currentLevelIndex + 1}`;
      levelIndicator.style.color = this.levelConfig.gridColor;

      // Hide the secret input
      input.value = "";
      input.parentElement.classList.add("hidden");

      // Start the new level
      this.init();
    }
  });
};
