/*
Level.js

A Level represents ONE maze grid loaded from levels.json. 

Tile legend (from your original example): 
0 = floor
1 = wall
2 = start
3 = goal

Responsibilities:
- Store the grid
- Find the start tile
- Provide collision/meaning queries (isWall, isGoal, inBounds)
- Draw the tiles (including a goal highlight)
*/

class Level {
  constructor(grid, tileSize) {
    // Store the tile grid and tile size (pixels per tile).
    this.grid = grid;
    this.ts = tileSize;

    // Start position in grid coordinates (row/col).
    // We compute this by scanning for tile value 2.
    this.start = this.findStart();

    // Enemy position in grid coordinates (row/col).
    // We compute this by scanning for tile value 4.
    this.enemy = this.findEnemy();

    // Optional: if you don't want the start tile to remain "special"
    // after you've used it to spawn the player, you can normalize it
    // to floor so it draws like floor and behaves like floor.
    if (this.start) {
      this.grid[this.start.r][this.start.c] = 0;
    }

    // Normalize enemy tile to floor so it draws like floor.
    if (this.enemy) {
      this.grid[this.enemy.r][this.enemy.c] = 0;
    }
  }

  // ----- Size helpers -----

  rows() {
    return this.grid.length;
  }

  cols() {
    return this.grid[0].length;
  }

  pixelWidth() {
    return this.cols() * this.ts;
  }

  pixelHeight() {
    return this.rows() * this.ts;
  }

  // ----- Semantic helpers -----

  inBounds(r, c) {
    return r >= 0 && c >= 0 && r < this.rows() && c < this.cols();
  }

  tileAt(r, c) {
    // Caller should check inBounds first.
    return this.grid[r][c];
  }

  isWall(r, c) {
    return this.tileAt(r, c) === 1;
  }

  isGoal(r, c) {
    return this.tileAt(r, c) === 3;
  }

  isEnemy(r, c) {
    // Check if this position was originally marked as enemy (4)
    // Note: after construction, enemy tiles are normalized to 0 (floor)
    // So we use the stored this.enemy position instead
    return this.enemy && this.enemy.r === r && this.enemy.c === c;
  }

  // ----- Start-finding -----

  findStart() {
    // Scan entire grid to locate the tile value 2 (start).
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        if (this.grid[r][c] === 2) {
          return { r, c };
        }
      }
    }

    // If a level forgets to include a start tile, return null.
    // (Then the game can choose a default spawn.)
    return null;
  }

  findEnemy() {
    // Scan entire grid to locate the tile value 4 (enemy).
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        if (this.grid[r][c] === 4) {
          return { r, c };
        }
      }
    }

    // If a level doesn't have an enemy tile, return null.
    return null;
  }

  // ----- Drawing -----

  draw() {
    /*
    Draw each tile as a rectangle.

    Visual rules (matches your original logic): 
    - Walls (1): dark teal
    - Everything else: light floor
    - Goal tile (3): add a highlighted inset rectangle
    */
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        const v = this.grid[r][c];

        // Base tile fill - Wall
        if (v === 1) fill(125, 253, 254);
        else fill(1, 31, 38);

        rect(c * this.ts, r * this.ts, this.ts, this.ts);

        // Goal highlight overlay (only on tile 3). - Like the finish line
        if (v === 3) {
          noStroke();
          fill(242, 160, 7, 200);
          rect(c * this.ts + 4, r * this.ts + 4, this.ts - 8, this.ts - 8, 6);
        }
      }
    }
  }
}
