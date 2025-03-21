// Import all necessary modules
import "../styles.css";
import "./NumberGame.js";
import "./grid.js";
import "./ui.js";
import "./sounds.js";
import "./tutorial.js";
import "./hints.js";
import "./celebration.js";
import "./secretInput.js";

// Initialize game when document is ready
document.addEventListener("DOMContentLoaded", () => {
  // Create and initialize NumberGame instance
  const game = new NumberGame();
});
