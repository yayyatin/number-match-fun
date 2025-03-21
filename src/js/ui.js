// UI-related methods from NumberGame
// No imports needed - methods are added to NumberGame prototype which is globally available

NumberGame.prototype.createProgressBar = function () {
  // Remove existing progress bar if any
  const existingProgress = document.querySelector(".progress-container");
  if (existingProgress) {
    existingProgress.remove();
  }

  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.style.backgroundColor = this.levelConfig.gridColor;

  const progressText = document.createElement("div");
  progressText.className = "progress-text";
  progressText.textContent = `Round ${this.currentRound + 1} of ${
    this.levelConfig.totalRounds
  }`;

  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressText);

  document.querySelector(".game-info").appendChild(progressContainer);
};

NumberGame.prototype.updateProgress = function () {
  const progressBar = document.querySelector(".progress-bar");
  const progressText = document.querySelector(".progress-text");
  const progress = (this.currentRound / this.levelConfig.totalRounds) * 100;

  progressBar.style.backgroundColor = this.levelConfig.gridColor;
  progressBar.style.width = `${progress}%`;

  const displayRound = Math.min(
    this.currentRound,
    this.levelConfig.totalRounds
  );
  progressText.textContent = `Round ${displayRound} of ${this.levelConfig.totalRounds}`;
};

NumberGame.prototype.createBanner = function () {
  const existingBanner = document.querySelector(".banner-container");
  if (existingBanner) {
    existingBanner.remove();
  }

  const bannerContainer = document.createElement("div");
  bannerContainer.className = "banner-container";

  const banner = document.createElement("div");
  banner.className = "game-banner";

  const contentDiv = document.createElement("div");
  contentDiv.className = "banner-content";

  const messageDiv = document.createElement("div");
  messageDiv.className = "banner-message";

  const buttonsDiv = document.createElement("div");
  buttonsDiv.className = "banner-buttons";

  contentDiv.appendChild(messageDiv);
  contentDiv.appendChild(buttonsDiv);
  banner.appendChild(contentDiv);
  bannerContainer.appendChild(banner);
  document.querySelector(".game-container").appendChild(bannerContainer);
};

NumberGame.prototype.showRoundComplete = function () {
  const celebratoryWords = [
    "AMAZING!",
    "SWEET!",
    "COOL!",
    "SUPERB!",
    "WELL DONE!",
  ];
  const randomWord =
    celebratoryWords[Math.floor(Math.random() * celebratoryWords.length)];

  const message = document.createElement("div");
  message.className = "floating-message";
  message.textContent = randomWord;
  message.style.color = this.levelConfig.gridColor;
  document.querySelector(".game-container").appendChild(message);

  // Launch confetti from both sides
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0, y: 0.6 }, // left side
  });
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 1, y: 0.6 }, // right side
  });

  setTimeout(() => {
    message.remove();
  }, 1500);
};

NumberGame.prototype.showLevelComplete = function () {
  const messageDiv = document.querySelector(".banner-message");
  const isLastLevel = this.currentLevelIndex === this.levelKeys.length - 1;

  messageDiv.innerHTML = `
      <div class="victory-content">
          <div class="victory-text">
              You are amazing! 🎉<br>
              Completed Level ${this.currentLevelIndex + 1} very smoothly!<br>
              ${
                isLastLevel
                  ? "You've completed all levels!"
                  : `Ready for Level ${this.currentLevelIndex + 2}?`
              }
          </div>
          ${this.celebrationManager.createGifElement().outerHTML}
          <div class="confetti-button-wrapper">
              <button class="confetti-button">
                  <span class="confetti-count">5</span>
                  <span class="buzzer-icon">🎉</span>
              </button>
          </div>
      </div>
  `;

  const bannerContainer = document.querySelector(".banner-container");
  const banner = document.querySelector(".game-banner");
  bannerContainer.classList.add("show");
  banner.classList.add("slide-in");

  // Add buttons div
  const buttonsDiv = document.createElement("div");
  buttonsDiv.className = "banner-buttons";
  messageDiv.querySelector(".victory-content").appendChild(buttonsDiv);

  if (!isLastLevel) {
    // Add next level button
    const nextLevelBtn = document.createElement("button");
    nextLevelBtn.className = "play-again-btn next-level-btn";
    nextLevelBtn.textContent = `Start Level ${this.currentLevelIndex + 2}`;
    nextLevelBtn.addEventListener("click", () => this.startNextLevel());
    buttonsDiv.appendChild(nextLevelBtn);
  } else {
    // Only show Play Again button for last level
    const playAgainBtn = document.createElement("button");
    playAgainBtn.className = "play-again-btn";
    playAgainBtn.textContent = "Play Again";
    playAgainBtn.addEventListener("click", () => {
      // Simple page refresh to restart the game
      window.location.reload();
    });
    buttonsDiv.appendChild(playAgainBtn);
  }

  // Add hand pointer
  const handPointer = document.createElement("div");
  handPointer.className = "hand-pointer";
  messageDiv.querySelector(".confetti-button-wrapper").appendChild(handPointer);

  // Add confetti button click handler
  const confettiButton = messageDiv.querySelector(".confetti-button");
  confettiButton.addEventListener("click", () => {
    // Remove hand pointer on first click
    handPointer.remove();
    this.launchConfetti(confettiButton);
  });
};

NumberGame.prototype.showGameOverAnimation = function () {
  const remainingCells = document.querySelectorAll(".grid-cell:not(.empty)");

  // First pop and remove remaining numbers
  remainingCells.forEach((cell) => {
    cell.classList.add("pop-animation");
  });

  // Show game over banner after pop animation starts
  setTimeout(() => {
    const messageDiv = document.querySelector(".banner-message");
    messageDiv.innerHTML = "Game Over! 🎮<br>Would you like to play again?";
    const bannerContainer = document.querySelector(".banner-container");
    const banner = document.querySelector(".game-banner");
    bannerContainer.classList.add("show");
    banner.classList.add("slide-in");
  }, 300);
};

NumberGame.prototype.showSuccessBanner = function () {
  this.playSound("victory"); // Play victory sound for successful completion
  const messageDiv = document.querySelector(".banner-message");
  messageDiv.innerHTML = "Well Done! 🎉<br>Would you like to play again?";
  const bannerContainer = document.querySelector(".banner-container");
  const banner = document.querySelector(".game-banner");
  bannerContainer.classList.add("show");
  banner.classList.add("slide-in");
};

NumberGame.prototype.animateTargetNumber = function () {
  const targetNumber = document.querySelector(".target-number");

  // Remove existing pulse class if it exists
  targetNumber.classList.remove("pulse");

  // Force a reflow before adding the class again
  void targetNumber.offsetWidth;

  // Add pulse class
  targetNumber.classList.add("pulse");

  // Remove pulse class after animation completes
  setTimeout(() => {
    targetNumber.classList.remove("pulse");
  }, 600);
};
