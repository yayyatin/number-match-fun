// Celebration-related methods from NumberGame
// No imports needed - methods are added to NumberGame prototype which is globally available

NumberGame.prototype.launchConfetti = function (button) {
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
};

NumberGame.prototype.launchSingleConfetti = function () {
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
};
