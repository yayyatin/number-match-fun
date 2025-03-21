const GAME_LEVELS = {
  level1: {
    totalRounds: 6,
    gridColor: "#FFA07A", // Coral base color
    selectColor: "#AFF8DB", // Mint color for selection
    backgroundColor: "#FFE5D4", // Light peachy background
    rounds: [
      {
        gridSize: 2,
        targetSum: 3,
        numbers: [2, 1, 2, 1],
        validCombinations: [[2, 1]],
      },
      {
        gridSize: 2,
        targetSum: 4,
        numbers: [2, 2, 3, 1],
        validCombinations: [
          [2, 2],
          [3, 1],
        ],
      },
      {
        gridSize: 2,
        targetSum: 5,
        numbers: [3, 2, 4, 1],
        validCombinations: [
          [3, 2],
          [4, 1],
        ],
      },
      {
        gridSize: 3,
        targetSum: 4,
        numbers: [2, 2, 3, 1, 3, 1, 2, 1, 2],
        validCombinations: [
          [2, 2],
          [3, 1],
        ],
      },
      {
        gridSize: 3,
        targetSum: 5,
        numbers: [3, 2, 4, 1, 2, 3, 4, 1, 3],
        validCombinations: [
          [3, 2],
          [4, 1],
        ],
      },
      {
        gridSize: 3,
        targetSum: 6,
        numbers: [3, 3, 4, 2, 2, 4, 5, 1, 3],
        validCombinations: [
          [3, 3],
          [4, 2],
          [5, 1],
        ],
      },
    ],
  },
  level2: {
    totalRounds: 6,
    gridColor: "#4ECDC4", // Turquoise base color
    selectColor: "#FFB5E8", // Pink color for selection
    backgroundColor: "#E8F8F7", // Light turquoise background
    rounds: [
      {
        gridSize: 3,
        targetSum: 7,
        numbers: [6, 1, 4, 3, 5, 2, 6, 1, 4],
        validCombinations: [
          [6, 1],
          [5, 2],
          [4, 3],
        ],
      },
      {
        gridSize: 3,
        targetSum: 8,
        numbers: [6, 2, 5, 3, 4, 4, 6, 2, 5],
        validCombinations: [
          [6, 2],
          [5, 3],
          [4, 4],
        ],
      },
      {
        gridSize: 3,
        targetSum: 9,
        numbers: [6, 3, 5, 4, 4, 5, 6, 3, 5],
        validCombinations: [
          [6, 3],
          [5, 4],
        ],
      },
      {
        gridSize: 4,
        targetSum: 7,
        numbers: [6, 1, 4, 3, 5, 2, 6, 1, 4, 3, 5, 2, 4, 3, 6, 1],
        validCombinations: [
          [6, 1],
          [5, 2],
          [4, 3],
        ],
      },
      {
        gridSize: 4,
        targetSum: 8,
        numbers: [6, 2, 5, 3, 4, 4, 6, 2, 5, 3, 4, 4, 6, 2, 5, 3],
        validCombinations: [
          [6, 2],
          [5, 3],
          [4, 4],
        ],
      },
      {
        gridSize: 4,
        targetSum: 9,
        numbers: [6, 3, 5, 4, 4, 5, 6, 3, 5, 4, 4, 5, 6, 3, 5, 4],
        validCombinations: [
          [6, 3],
          [5, 4],
        ],
      },
    ],
  },
  level3: {
    totalRounds: 6,
    gridColor: "#9B59B6", // Medium purple for grid
    selectColor: "#FAD7A0", // Soft orange for selection
    backgroundColor: "#F5EEF8", // Light lavender background
    rounds: [
      {
        gridSize: 3,
        targetSum: 11,
        numbers: [6, 5, 7, 4, 8, 3, 6, 5, 4],
        validCombinations: [
          [6, 5],
          [7, 4],
          [8, 3],
        ],
      },
      {
        gridSize: 3,
        targetSum: 12,
        numbers: [6, 6, 7, 5, 8, 4, 7, 5, 6],
        validCombinations: [
          [6, 6],
          [7, 5],
          [8, 4],
        ],
      },
      {
        gridSize: 3,
        targetSum: 13,
        numbers: [7, 6, 8, 5, 9, 4, 8, 5, 6],
        validCombinations: [
          [7, 6],
          [8, 5],
          [9, 4],
        ],
      },
      {
        gridSize: 4,
        targetSum: 13,
        numbers: [7, 6, 8, 5, 9, 4, 8, 5, 7, 6, 8, 5, 9, 4, 7, 6],
        validCombinations: [
          [7, 6],
          [8, 5],
          [9, 4],
        ],
      },
      {
        gridSize: 4,
        targetSum: 14,
        numbers: [7, 7, 8, 6, 9, 5, 10, 4, 8, 6, 9, 5, 10, 4, 7, 7],
        validCombinations: [
          [7, 7],
          [8, 6],
          [9, 5],
          [10, 4],
        ],
      },
      {
        gridSize: 4,
        targetSum: 15,
        numbers: [8, 7, 9, 6, 10, 5, 11, 4, 8, 7, 9, 6, 10, 5, 8, 7],
        validCombinations: [
          [8, 7],
          [9, 6],
          [10, 5],
          [11, 4],
        ],
      },
    ],
  },
  level4: {
    totalRounds: 6,
    gridColor: "#27AE60", // Emerald green for grid
    selectColor: "#F7DC6F", // Soft yellow for selection
    backgroundColor: "#E9F7EF", // Light mint background
    rounds: [
      {
        gridSize: 4,
        targetSum: 14,
        numbers: [8, 6, 7, 7, 9, 5, 10, 4, 8, 6, 9, 5, 7, 6, 8, 6],
        validCombinations: [
          [8, 6],
          [7, 7],
          [9, 5],
          [10, 4],
        ],
      },
      {
        gridSize: 4,
        targetSum: 15,
        numbers: [8, 7, 9, 6, 10, 5, 11, 4, 8, 7, 9, 6, 10, 5, 9, 6],
        validCombinations: [
          [8, 7],
          [9, 6],
          [10, 5],
          [11, 4],
        ],
      },
      {
        gridSize: 4,
        targetSum: 16,
        numbers: [9, 7, 10, 6, 11, 5, 12, 4, 9, 7, 10, 6, 11, 5, 9, 7],
        validCombinations: [
          [9, 7],
          [10, 6],
          [11, 5],
          [12, 4],
        ],
      },
      {
        gridSize: 5,
        targetSum: 16,
        numbers: [
          9, 7, 10, 6, 11, 5, 12, 4, 8, 7, 9, 7, 10, 6, 11, 5, 9, 7, 10, 6, 12,
          4, 11, 5, 9,
        ],
        validCombinations: [
          [9, 7],
          [10, 6],
          [11, 5],
          [12, 4],
        ],
      },
      {
        gridSize: 5,
        targetSum: 17,
        numbers: [
          10, 7, 11, 6, 12, 5, 13, 4, 9, 8, 11, 6, 10, 7, 9, 7, 10, 6, 11, 5,
          13, 4, 12, 5, 9,
        ],
        validCombinations: [
          [10, 7],
          [11, 6],
          [12, 5],
          [13, 4],
        ],
      },
      {
        gridSize: 5,
        targetSum: 18,
        numbers: [
          10, 8, 12, 6, 13, 5, 14, 4, 9, 8, 12, 6, 10, 8, 12, 6, 13, 5, 14, 4,
          9, 8, 13, 4, 10,
        ],
        validCombinations: [
          [10, 8],
          [12, 6],
          [13, 5],
          [14, 4],
        ],
      },
    ],
  },
};

export default GAME_LEVELS;
