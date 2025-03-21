// Tutorial-related methods from NumberGame
NumberGame.prototype.initTutorialPointer = function () {
  const pointer = document.createElement("div");
  pointer.className = "tutorial-pointer";
  pointer.innerHTML = '<img src="/images/hand.png" alt="pointer">';
  document.body.appendChild(pointer);
  return pointer;
};

NumberGame.prototype.movePointerToNumber = function (number) {
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
};
