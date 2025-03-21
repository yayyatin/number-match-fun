// Hint-related methods from NumberGame
NumberGame.prototype.showHintBubble = function () {
  // Remove existing bubble if any
  this.removeHintBubble();

  const bubble = document.createElement("div");
  bubble.className = "tutorial-bubble hint-bubble";
  bubble.innerHTML = `
    <img src="/images/speech-bubble.png" alt="hint">
    <div class="bubble-text initial-hint-text">Tap a number to get hint</div>
  `;
  document.querySelector(".grid-container").appendChild(bubble);
  setTimeout(() => bubble.classList.add("show"), 100);
};

NumberGame.prototype.showHintEquation = function (firstNumber, neededNumber) {
  const bubbleText = document.querySelector(".hint-bubble .bubble-text");
  if (bubbleText) {
    bubbleText.classList.remove("initial-hint-text"); // Remove the small text class
    bubbleText.textContent = `${firstNumber} + ${neededNumber} = ${this.targetNumber}`;
  }
};

NumberGame.prototype.removeHintBubble = function () {
  const existingBubble = document.querySelector(".hint-bubble");
  if (existingBubble) {
    existingBubble.remove();
  }
};
