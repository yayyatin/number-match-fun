class NumberGame {
  constructor() {
    // Initialize analytics first
    this.analytics = new GameAnalytics();

    // Level configurations
    this.levels = GAME_LEVELS;

    // Get initial level key (first level)
    this.levelKeys = Object.keys(this.levels);
    this.currentLevelIndex = 0;
    this.currentLevel = this.levelKeys[this.currentLevelIndex];
    this.levelConfig = this.levels[this.currentLevel];

    this.currentRound = 0;
    this.selectedCells = [];
    this.currentSum = 0;
    this.isAnimating = false;
    this.grid = [];

    // Initialize sounds
    this.sounds = {
      click: new Audio("sounds/click.wav"), // Light click when selecting a number
      select: new Audio("sounds/select.wav"), // When number is selected
      deselect: new Audio("sounds/deselect.wav"), // When number is deselected
      match: new Audio("sounds/match.wav"), // When numbers match to sum
      remove: new Audio("sounds/remove.wav"), // When numbers disappear
      wrong: new Audio("sounds/wrong.wav"), // When sum exceeds target
      gameOver: new Audio("sounds/gameover.wav"), // When game is over (no more moves)
      roundComplete: new Audio("sounds/round-complete.wav"),
      levelComplete: new Audio("sounds/level-complete.wav"),
      popper: new Audio("sounds/popper.wav"),
      background: new Audio("sounds/upbeat_bg.wav"),
    };

    // Setup background music
    this.sounds.background.loop = true;
    this.sounds.background.volume = 0.02; // Lower volume for background music

    this.isMusicMuted = false;
    this.isSoundMuted = false;
    this.initSoundControl();

    // Preload sounds
    Object.values(this.sounds).forEach((sound) => {
      sound.load();
      sound.volume = 0.5;
    });

    this.createBanner();
    this.init();
    this.celebrationManager = new CelebrationManager();

    // Add after other initializations
    this.secretWord = "";
    this.initSecretInput();

    // Add new properties for hint feature
    this.failedAttempts = 0;
    this.hintActive = false;
    this.hintFirstNumber = null;
    this.maxFailedAttempts = 3;
  }

  init() {
    // Set initial level indicator color
    document.querySelector(".level-indicator").style.color =
      this.levelConfig.gridColor;

    // Set background color
    document.body.style.backgroundColor = this.levelConfig.backgroundColor;

    this.createProgressBar();
    this.startRound(this.currentRound);
  }

  createGrid(startBlurred = false, roundIndex = null) {
    const roundConfig =
      this.levelConfig.rounds[
        roundIndex !== null ? roundIndex : this.currentRound
      ];
    this.gridSize = roundConfig.gridSize;
    this.targetNumber = roundConfig.targetSum;
    this.grid = [];

    // Shuffle the numbers array
    const shuffledNumbers = [...roundConfig.numbers].sort(
      () => Math.random() - 0.5
    );

    // Update target number display regardless of blur state
    document.querySelector(".target-number").textContent = this.targetNumber;

    const gridContainer = document.querySelector(".grid-container");
    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    gridContainer.className = "grid-container";
    gridContainer.classList.add(`grid-${this.gridSize}x${this.gridSize}`);

    if (startBlurred) {
      gridContainer.classList.add("grid-blur");
      gridContainer.classList.add("grid-disabled");
    }

    // Create and populate grid with shuffled numbers
    let numberIndex = 0;
    for (let i = 0; i < this.gridSize; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.dataset.row = i;
        cell.dataset.col = j;

        // Apply level-specific color
        cell.style.background = this.levelConfig.gridColor;
        cell.style.boxShadow = `0 6px 0 ${this.adjustColor(
          this.levelConfig.gridColor,
          -40
        )}`;

        const number = shuffledNumbers[numberIndex++];
        this.grid[i][j] = number;
        cell.textContent = number;

        cell.addEventListener("click", () => this.handleCellClick(cell, i, j));
        gridContainer.appendChild(cell);
      }
    }

    if (
      this.currentLevelIndex === 0 &&
      this.currentRound === 0 &&
      !this.tutorialComplete
    ) {
      const pointer = this.initTutorialPointer();

      // Add speech bubble with initial text
      const bubble = document.createElement("div");
      bubble.className = "tutorial-bubble";
      bubble.innerHTML = `
          <img src="images/speech-bubble.png" alt="tutorial">
          <div class="bubble-text">_ + _ = 3 ?</div>
      `;
      gridContainer.appendChild(bubble);

      // Show both pointer and bubble initially
      setTimeout(() => {
        bubble.classList.add("show");
        this.movePointerToNumber(2);
      }, 1000);

      this.firstNumberClicked = false;
    }
  }

  startRound(roundIndex) {
    if (this.analytics.isRecording) {
      this.analytics.recordEvent("roundStart", {
        level: this.currentLevelIndex + 1,
        round: roundIndex + 1,
      });
    }
    // Reset hint-related states when starting new round
    this.failedAttempts = 0;
    this.hintActive = false;
    this.hintFirstNumber = null;
    this.removeHintBubble();

    this.createGrid(false, roundIndex);
  }

  createProgressBar() {
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
  }

  updateProgress() {
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
  }

  completeRound() {
    this.playSound("roundComplete");

    // Update progress
    this.currentRound++;
    this.updateProgress();

    // Check if this was the last round
    if (this.currentRound === this.levelConfig.totalRounds) {
      // Last round - show level complete immediately
      this.playSound("levelComplete");
      this.launchSingleConfetti();
      this.showLevelComplete();
      return;
    }

    // Not last round - continue with normal round completion
    this.createGrid(true, this.currentRound);
    this.showRoundComplete();

    // Enable grid after delay
    setTimeout(() => {
      const gridContainer = document.querySelector(".grid-container");
      gridContainer.classList.remove("grid-blur");
      gridContainer.classList.remove("grid-disabled");
    }, 1500);
  }

  showRoundComplete() {
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
  }

  showLevelComplete() {
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
    messageDiv
      .querySelector(".confetti-button-wrapper")
      .appendChild(handPointer);

    // Add confetti button click handler
    const confettiButton = messageDiv.querySelector(".confetti-button");
    confettiButton.addEventListener("click", () => {
      // Remove hand pointer on first click
      handPointer.remove();
      this.launchConfetti(confettiButton);
    });
  }

  startNextLevel() {
    // Increment level index
    this.currentLevelIndex++;

    // Check if there are more levels
    if (this.currentLevelIndex < this.levelKeys.length) {
      this.currentLevel = this.levelKeys[this.currentLevelIndex];
      this.levelConfig = this.levels[this.currentLevel];
      this.currentRound = 0;

      // Update level indicator text and color
      const levelIndicator = document.querySelector(".level-indicator");
      levelIndicator.textContent = `Level ${this.currentLevelIndex + 1}`;
      levelIndicator.style.color = this.levelConfig.gridColor;

      // Hide level complete banner
      const bannerContainer = document.querySelector(".banner-container");
      const banner = document.querySelector(".game-banner");
      bannerContainer.classList.remove("show");
      banner.classList.remove("slide-in");

      // Start new level
      this.init();
    }
  }

  launchSingleConfetti() {
    this.playSound("popper");

    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#00b894", "#00cec9", "#0984e3", "#6c5ce7", "#fd79a8"],
        zIndex: 9999,
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#00b894", "#00cec9", "#0984e3", "#6c5ce7", "#fd79a8"],
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  showGameOverAnimation() {
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
  }

  showSuccessBanner() {
    this.playSound("victory"); // Play victory sound for successful completion
    const messageDiv = document.querySelector(".banner-message");
    messageDiv.innerHTML = "Well Done! 🎉<br>Would you like to play again?";
    const bannerContainer = document.querySelector(".banner-container");
    const banner = document.querySelector(".game-banner");
    bannerContainer.classList.add("show");
    banner.classList.add("slide-in");
  }

  generateNumbers() {
    const totalCells = this.gridSize * this.gridSize;
    let numbers = [];

    for (let i = 0; i < totalCells; i++) {
      let num;
      const rand = Math.random();
      if (rand < 0.6) {
        num = Math.floor(Math.random() * 6) + 2;
      } else {
        num = Math.random() < 0.5 ? 1 : 8;
      }
      numbers.push(num);
    }

    return numbers.sort(() => Math.random() - 0.5);
  }

  handleCellClick(cell, row, col) {
    // Add tutorial-specific logic at the start
    if (
      this.currentLevelIndex === 0 &&
      this.currentRound === 0 &&
      !this.tutorialComplete
    ) {
      const number = parseInt(cell.textContent);
      const bubbleText = document.querySelector(".bubble-text");

      // Only allow clicking the correct number in sequence
      if (!this.firstNumberClicked && number !== 2) return;
      if (this.firstNumberClicked && number !== 1) return;

      if (!this.firstNumberClicked && number === 2) {
        this.firstNumberClicked = true;
        bubbleText.textContent = `2 + _ = 3 ?`;
        this.movePointerToNumber(1);
      } else if (this.firstNumberClicked && number === 1) {
        bubbleText.textContent = `2 + 1 = 3`;
        const pointer = document.querySelector(".tutorial-pointer");
        if (pointer) pointer.remove();
        this.tutorialComplete = true;
      }
    }

    if (
      cell.classList.contains("empty") ||
      this.isAnimating ||
      document
        .querySelector(".grid-container")
        .classList.contains("grid-disabled")
    ) {
      return;
    }

    this.playSound("click");

    if (this.hintActive) {
      const number = parseInt(cell.textContent);

      if (!this.hintFirstNumber) {
        // First number selected during hint
        this.hintFirstNumber = number;
        // Find the matching number needed for target sum
        const neededNumber = this.targetNumber - number;
        this.showHintEquation(number, neededNumber);
      } else {
        // Second number selected during hint
        const selectedNumber = parseInt(cell.textContent);
        if (selectedNumber + this.hintFirstNumber !== this.targetNumber) {
          // Wrong second number - deactivate hint but keep failed attempts
          this.hintActive = false;
          this.hintFirstNumber = null;
          this.removeHintBubble();
        }
      }
    }

    // If cell is already selected
    if (cell.classList.contains("selected")) {
      cell.style.background = this.levelConfig.gridColor;
      cell.style.boxShadow = `0 6px 0 ${this.adjustColor(
        this.levelConfig.gridColor,
        -40
      )}`;
      cell.classList.remove("selected");
      const index = this.selectedCells.findIndex(
        (c) => c.row === row && c.col === col
      );
      this.currentSum -= this.grid[row][col];
      this.selectedCells.splice(index, 1);
      this.playSound("deselect");
    }
    // If trying to select a third cell, prevent it
    else if (this.selectedCells.length >= 2) {
      return;
    }
    // Select the cell
    else {
      cell.style.background = this.levelConfig.selectColor;
      cell.style.boxShadow = `0 6px 0 ${this.adjustColor(
        this.levelConfig.selectColor,
        -40
      )}`;
      cell.classList.add("selected");
      this.currentSum += this.grid[row][col];
      this.selectedCells.push({ row, col, cell });
      this.playSound("select");

      // Record second click if this is the second selection
      if (this.selectedCells.length === 2 && this.analytics.isRecording) {
        this.analytics.recordEvent("secondClick", {
          number: this.grid[row][col],
          level: this.currentLevelIndex + 1,
          round: this.currentRound + 1,
          matchResult:
            this.currentSum === this.targetNumber ? "correct" : "incorrect",
          targetSum: this.targetNumber,
          actualSum: this.currentSum,
        });
      }

      // Check sum only when exactly 2 cells are selected
      if (this.selectedCells.length === 2) {
        if (this.currentSum === this.targetNumber) {
          this.animateTargetNumber();
          this.handleCorrectMatch();
        } else {
          setTimeout(() => {
            this.resetSelection();
          }, 500);
        }
      }
    }

    // Record first click
    if (this.selectedCells.length === 1 && this.analytics.isRecording) {
      this.analytics.recordEvent("firstClick", {
        number: this.grid[row][col],
        level: this.currentLevelIndex + 1,
        round: this.currentRound + 1,
      });
    }
  }

  resetSelection() {
    this.playSound("wrong");

    // First, flash red background
    this.selectedCells.forEach(({ cell }) => {
      cell.style.transition = "background-color 0.3s ease";
      cell.style.background = "#ff645c"; // Red color for wrong selection
    });

    // After red flash, reset to normal
    setTimeout(() => {
      this.selectedCells.forEach(({ cell }) => {
        cell.style.background = this.levelConfig.gridColor;
        cell.style.boxShadow = `0 6px 0 ${this.adjustColor(
          this.levelConfig.gridColor,
          -40
        )}`;
        cell.classList.remove("selected");
      });
      this.currentSum = 0;
      this.selectedCells = [];

      // Increment failed attempts and check for hint activation
      this.failedAttempts++;
      if (this.failedAttempts >= this.maxFailedAttempts) {
        this.hintActive = true;
        this.showHintBubble();
      }
    }, 300);
  }

  handleCorrectMatch() {
    this.playSound("match");
    this.isAnimating = true;

    // Remove selected styling and add remove animation
    this.selectedCells.forEach(({ cell }) => {
      cell.classList.remove("selected");
      cell.classList.add("remove");
      this.grid[cell.dataset.row][cell.dataset.col] = 0;
    });

    // After removal animation completes
    setTimeout(() => {
      this.playSound("remove");
      this.selectedCells.forEach(({ cell }) => {
        cell.classList.add("empty");
        cell.classList.remove("remove");
      });

      this.isAnimating = false;

      // Check remaining numbers and combinations
      const remainingNumbers = this.grid.flat().filter((num) => num !== 0);
      if (remainingNumbers.length === 0) {
        this.completeRound();
      } else if (!this.checkRemainingCombinations()) {
        this.completeRound();
      }
    }, 500);

    this.currentSum = 0;
    this.selectedCells = [];

    // Reset failed attempts on successful match
    this.failedAttempts = 0;
    this.hintActive = false;
    this.hintFirstNumber = null;
    this.removeHintBubble();
  }

  checkRemainingCombinations() {
    // Get all remaining numbers in the grid
    const remainingNumbers = [];
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] !== 0) {
          remainingNumbers.push(this.grid[i][j]);
        }
      }
    }

    // Check all possible pairs
    for (let i = 0; i < remainingNumbers.length; i++) {
      for (let j = i + 1; j < remainingNumbers.length; j++) {
        if (remainingNumbers[i] + remainingNumbers[j] === this.targetNumber) {
          return true; // Found a valid combination
        }
      }
    }

    return false; // No valid combinations found
  }

  playSound(soundName) {
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
  }

  createBanner() {
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
  }

  launchConfetti(button) {
    const countSpan = button.querySelector(".confetti-count");
    let count = parseInt(countSpan.textContent);

    if (count > 0) {
      this.playSound("popper");

      const duration = 2000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#00b894", "#00cec9", "#0984e3", "#6c5ce7", "#fd79a8"],
          zIndex: 9999,
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#00b894", "#00cec9", "#0984e3", "#6c5ce7", "#fd79a8"],
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      count--;
      countSpan.textContent = count;

      if (count === 0) {
        button.disabled = true;
        button.style.opacity = "0.5";
      }
    }
  }

  initSoundControl() {
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
  }

  adjustColor(color, amount) {
    const hex = color.replace("#", "");
    const r = Math.max(
      Math.min(parseInt(hex.substring(0, 2), 16) + amount, 255),
      0
    );
    const g = Math.max(
      Math.min(parseInt(hex.substring(2, 4), 16) + amount, 255),
      0
    );
    const b = Math.max(
      Math.min(parseInt(hex.substring(4, 6), 16) + amount, 255),
      0
    );
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  initSecretInput() {
    document.addEventListener("keydown", (e) => {
      this.secretWord += e.key.toLowerCase();

      if (this.secretWord.length > 4) {
        this.secretWord = this.secretWord.slice(-4);
      }

      if (this.secretWord === "open") {
        const secretContainer = document.querySelector(
          ".secret-input-container"
        );
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
  }

  initTutorialPointer() {
    const pointer = document.createElement("div");
    pointer.className = "tutorial-pointer";
    pointer.innerHTML = '<img src="images/hand.png" alt="pointer">';
    document.body.appendChild(pointer);
    return pointer;
  }

  movePointerToNumber(number) {
    const cells = document.querySelectorAll(".grid-cell");
    const targetCell = Array.from(cells).find(
      (cell) => parseInt(cell.textContent) === number
    );
    const pointer = document.querySelector(".tutorial-pointer");

    if (targetCell) {
      const rect = targetCell.getBoundingClientRect();
      // Position more towards bottom of tile
      pointer.style.left = `${rect.left + rect.width / 2 - 30}px`; // Center horizontally
      pointer.style.top = `${rect.top + rect.height - 30}px`; // More towards bottom
      pointer.classList.add("show");
    }
  }

  animateTargetNumber() {
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
  }

  showHintBubble() {
    // Remove existing bubble if any
    this.removeHintBubble();

    const bubble = document.createElement("div");
    bubble.className = "tutorial-bubble hint-bubble";
    bubble.innerHTML = `
      <img src="images/speech-bubble.png" alt="hint">
      <div class="bubble-text initial-hint-text">Tap a number to get hint</div>
    `;
    document.querySelector(".grid-container").appendChild(bubble);
    setTimeout(() => bubble.classList.add("show"), 100);
  }

  showHintEquation(firstNumber, neededNumber) {
    const bubbleText = document.querySelector(".hint-bubble .bubble-text");
    if (bubbleText) {
      bubbleText.classList.remove("initial-hint-text"); // Remove the small text class
      bubbleText.textContent = `${firstNumber} + ${neededNumber} = ${this.targetNumber}`;
    }
  }

  removeHintBubble() {
    const existingBubble = document.querySelector(".hint-bubble");
    if (existingBubble) {
      existingBubble.remove();
    }
  }
}
// Initialize game
const game = new NumberGame();
