// Grid-related methods from NumberGame
// No imports needed - methods are added to NumberGame prototype which is globally available

NumberGame.prototype.createGrid = function (
  startBlurred = false,
  roundIndex = null
) {
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
        <img src="/images/speech-bubble.png" alt="tutorial">
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
};

NumberGame.prototype.handleCellClick = function (cell, row, col) {
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
};

NumberGame.prototype.resetSelection = function () {
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
};

NumberGame.prototype.handleCorrectMatch = function () {
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
};
