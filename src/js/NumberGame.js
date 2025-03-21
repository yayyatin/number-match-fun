// Import dependencies
import GameAnalytics from "./player-info-form.js";
import CelebrationManager from "./celebration-manager.js";
import GAME_LEVELS from "../config/levels.js";

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
      click: new Audio("/sounds/click.wav"), // Light click when selecting a number
      select: new Audio("/sounds/select.wav"), // When number is selected
      deselect: new Audio("/sounds/deselect.wav"), // When number is deselected
      match: new Audio("/sounds/match.wav"), // When numbers match to sum
      remove: new Audio("/sounds/remove.wav"), // When numbers disappear
      wrong: new Audio("/sounds/wrong.wav"), // When sum exceeds target
      gameOver: new Audio("/sounds/gameover.wav"), // When game is over (no more moves)
      roundComplete: new Audio("/sounds/round-complete.wav"),
      levelComplete: new Audio("/sounds/level-complete.wav"),
      popper: new Audio("/sounds/popper.wav"),
      background: new Audio("/sounds/upbeat_bg.wav"),
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
}

// Export the NumberGame class to make it available globally
window.NumberGame = NumberGame;
