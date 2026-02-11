/*
Week 4 — Example 4: Playable Maze (JSON + Level class + Player class)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This is the "orchestrator" file:
- Loads JSON levels (preload)
- Builds Level objects
- Creates/positions the Player
- Handles input + level switching

It is intentionally light on "details" because those are moved into:
- Level.js (grid + drawing + tile meaning)
- Player.js (position + movement rules)

Based on the playable maze structure from Example 3
*/

const TS = 120; // Andreea updated

// Raw JSON data (from levels.json).
let levelsData;

// Array of Level instances.
let levels = [];

// Current level index.
let li = 0;

// Player instance (tile-based).
let player;

// Enemy movement tracking
let enemyMovedAt = 0;
let enemyMoveDelay = 667; // ms between moves (1.5x faster than 1000ms)
let enemyTrail = []; // Trail of faded positions
let enemyTrailFadeDuration = 400; // ms until trail fades completely

// Game state
let isGameOver = false;

function preload() {
  // Ensure level data is ready before setup runs.
  levelsData = loadJSON("levels.json");
}

function setup() {
  /*
  Convert raw JSON grids into Level objects.
  levelsData.levels is an array of 2D arrays. 
  */
  levels = levelsData.levels.map((grid) => new Level(copyGrid(grid), TS));

  // Create a player.
  player = new Player(TS);

  // Load the first level (sets player start + canvas size).
  loadLevel(0);

  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  background(240);

  // Draw current level, then enemy trail, enemy, then player on top.
  levels[li].draw();

  // Draw and move enemy if it exists on this level
  const level = levels[li];
  if (level.enemy) {
    drawEnemyTrail();

    // Only move enemy if game is not over
    if (!isGameOver) {
      moveEnemyRandomly(level);
    }

    fill(255, 150, 0); // Orange
    const enemyPixelX = level.enemy.c * TS + TS / 2;
    const enemyPixelY = level.enemy.r * TS + TS / 2;
    rect(enemyPixelX - TS / 2, enemyPixelY - TS / 2, TS, TS);

    // Check for collision between player and enemy
    if (
      !isGameOver &&
      player.r === level.enemy.r &&
      player.c === level.enemy.c
    ) {
      isGameOver = true;
    }
  }

  player.draw();

  // Draw game over popup if game is over
  if (isGameOver) {
    drawGameOverPopup();
  }

  drawHUD();
}

function moveEnemyRandomly(level) {
  // Move enemy 2 spaces randomly in any direction (including diagonals)
  const now = millis();
  if (now - enemyMovedAt < enemyMoveDelay) return;

  // Eight-directional movement: all directions (2 spaces each)
  const moves = [
    { dr: -2, dc: 0 }, // up 2
    { dr: 2, dc: 0 }, // down 2
    { dr: 0, dc: -2 }, // left 2
    { dr: 0, dc: 2 }, // right 2
    { dr: -2, dc: -2 }, // up-left 2
    { dr: -2, dc: 2 }, // up-right 2
    { dr: 2, dc: -2 }, // down-left 2
    { dr: 2, dc: 2 }, // down-right 2
  ];

  // Shuffle moves randomly
  const shuffled = moves.sort(() => Math.random() - 0.5);

  // Try each direction until one works
  for (const move of shuffled) {
    const nr = level.enemy.r + move.dr;
    const nc = level.enemy.c + move.dc;

    // Check bounds and that target is a floor tile (0) and not a wall (1)
    if (level.inBounds(nr, nc) && !level.isWall(nr, nc)) {
      // Add current position to trail before moving
      enemyTrail.push({ r: level.enemy.r, c: level.enemy.c, createdAt: now });

      level.enemy.r = nr;
      level.enemy.c = nc;
      enemyMovedAt = now;
      return;
    }
  }
}

function drawEnemyTrail() {
  const now = millis();
  const enemyColor = [255, 150, 0]; // Orange

  // Clean up old trail entries
  enemyTrail = enemyTrail.filter(
    (entry) => now - entry.createdAt < enemyTrailFadeDuration,
  );

  // Draw trail entries
  enemyTrail.forEach((entry, index) => {
    // How old is this entry?
    const age = now - entry.createdAt;
    const progress = age / enemyTrailFadeDuration; // 0 to 1

    // Determine opacity based on position in trail
    let baseOpacity;
    if (index === enemyTrail.length - 1) {
      // Last position: 50% opacity
      baseOpacity = 0.5;
    } else if (index === enemyTrail.length - 2) {
      // Position 2 moves ago: 25% opacity
      baseOpacity = 0.25;
    } else {
      // Older entries fade out quickly
      baseOpacity = 0;
    }

    // Apply fade over time
    const opacity = baseOpacity * (1 - progress);

    if (opacity > 0) {
      fill(enemyColor[0], enemyColor[1], enemyColor[2], opacity * 255);
      rect(
        entry.c * TS + TS / 2 - TS / 2,
        entry.r * TS + TS / 2 - TS / 2,
        TS,
        TS,
      );
    }
  });
}

function drawGameOverPopup() {
  // Draw semi-transparent dark background
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  // Draw white rectangle popup in the center
  const popupWidth = 300;
  const popupHeight = 220;
  const popupX = (width - popupWidth) / 2;
  const popupY = (height - popupHeight) / 2;

  fill(255); // White
  rect(popupX, popupY, popupWidth, popupHeight);

  // Draw "Gameover" text in the center
  fill(0); // Black text
  textAlign(CENTER, CENTER);
  textSize(40);
  textFont("sans-serif");
  text("Gameover", width / 2, popupY + 60);

  // Draw "Redo" button
  const buttonWidth = 100;
  const buttonHeight = 50;
  const buttonX = (width - buttonWidth) / 2;
  const buttonY = popupY + 130;

  fill(100, 150, 255); // Blue button of pop-up
  rect(buttonX, buttonY, buttonWidth, buttonHeight);

  fill(255); // White text
  textSize(18);
  textAlign(CENTER, CENTER);
  text("Redo", width / 2, buttonY + buttonHeight / 2);

  // Check if mouse is over button and draw hover effect
  if (
    mouseX > buttonX &&
    mouseX < buttonX + buttonWidth &&
    mouseY > buttonY &&
    mouseY < buttonY + buttonHeight
  ) {
    fill(80, 120, 220); // Darker blue on hover
    rect(buttonX, buttonY, buttonWidth, buttonHeight);
    fill(255);
    text("Redo", width / 2, buttonY + buttonHeight / 2);
  }

  // Reset text alignment
  textAlign(LEFT);
  textSize(14);
}

function mousePressed() {
  if (isGameOver) {
    // Check if Redo button was clicked
    const popupWidth = 300;
    const popupHeight = 220;
    const popupX = (width - popupWidth) / 2;
    const popupY = (height - popupHeight) / 2;

    const buttonWidth = 100;
    const buttonHeight = 50;
    const buttonX = (width - buttonWidth) / 2;
    const buttonY = popupY + 130;

    if (
      mouseX > buttonX &&
      mouseX < buttonX + buttonWidth &&
      mouseY > buttonY &&
      mouseY < buttonY + buttonHeight
    ) {
      location.reload();
    }
  }
}

function drawHUD() {
  // HUD matches your original idea: show level count and controls.
  fill(0);
  text(
    `Level ${li + 1}/${levels.length} — WASD/Arrows to move - Avoid the Enemy`,
    10,
    16,
  );
}

function keyPressed() {
  /*
  Convert key presses into a movement direction. (WASD + arrows)
  */
  // Don't process input if game is over
  if (isGameOver) return;

  let dr = 0;
  let dc = 0;

  if (keyCode === LEFT_ARROW || key === "a" || key === "A") dc = -1;
  else if (keyCode === RIGHT_ARROW || key === "d" || key === "D") dc = 1;
  else if (keyCode === UP_ARROW || key === "w" || key === "W") dr = -1;
  else if (keyCode === DOWN_ARROW || key === "s" || key === "S") dr = 1;
  else return; // not a movement key

  // Try to move. If blocked, nothing happens.
  const moved = player.tryMove(levels[li], dr, dc);

  // If the player moved onto a goal tile, advance levels.
  if (moved && levels[li].isGoal(player.r, player.c)) {
    nextLevel();
  }
}

// ----- Level switching -----

function loadLevel(idx) {
  li = idx;

  const level = levels[li];

  // Place player at the level's start tile (2), if present.
  if (level.start) {
    player.setCell(level.start.r, level.start.c);
  } else {
    // Fallback spawn: top-left-ish (but inside bounds).
    player.setCell(1, 1);
  }
  // Reset enemy trail when switching levels
  enemyTrail = [];
  // Reset game over state
  isGameOver = false;
  // Ensure the canvas matches this level’s dimensions.
  resizeCanvas(level.pixelWidth(), level.pixelHeight());
}

function nextLevel() {
  // Wrap around when we reach the last level.
  const next = (li + 1) % levels.length;
  loadLevel(next);
}

// ----- Utility -----

function copyGrid(grid) {
  /*
  Make a deep-ish copy of a 2D array:
  - new outer array
  - each row becomes a new array

  Why copy?
  - Because Level constructor may normalize tiles (e.g., replace 2 with 0)
  - And we don’t want to accidentally mutate the raw JSON data object. 
  */
  return grid.map((row) => row.slice());
}
