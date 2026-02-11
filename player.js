/*
Player.js

A Player stores the avatar position in grid coordinates (row/col)
and knows how to:
- draw itself
- attempt a move (tile-by-tile) with collision rules

The Player does NOT:
- load JSON
- switch levels
Those are "game orchestration" responsibilities that belong in sketch.js. 
*/

class Player {
  constructor(tileSize) {
    this.ts = tileSize;

    // Current grid position (row/col).
    this.r = 0;
    this.c = 0;

    // Movement throttle (so a key press doesn't move 60 tiles per second).
    this.movedAt = 0;
    this.moveDelay = 90; // ms

    // Trail tracking: array of {r, c, createdAt} objects
    this.trail = [];
    this.trailFadeDuration = 400; // ms until trail fades completely
  }

  // Place the player at a specific grid location (e.g., the level's start).
  setCell(r, c) {
    this.r = r;
    this.c = c;
  }

  // Convert grid coords to pixel center (for drawing a circle).
  pixelX() {
    return this.c * this.ts + this.ts / 2;
  }

  pixelY() {
    return this.r * this.ts + this.ts / 2;
  }

  draw() {
    // Draw trail first (so it appears behind the player)
    this.drawTrail();

    // Same "simple high-contrast avatar" idea as your original.
    fill(20, 120, 255);
    rect(
      this.pixelX() - this.ts / 2,
      this.pixelY() - this.ts / 2,
      this.ts,
      this.ts,
    );
    // circle(this.pixelX(), this.pixelY(), this.ts * 0.6);
  }

  drawTrail() {
    const now = millis();
    const playerColor = [20, 120, 255];

    // Clean up old trail entries
    this.trail = this.trail.filter(
      (entry) => now - entry.createdAt < this.trailFadeDuration,
    );

    // Draw trail entries
    this.trail.forEach((entry, index) => {
      // How old is this entry?
      const age = now - entry.createdAt;
      const progress = age / this.trailFadeDuration; // 0 to 1

      // Determine opacity based on position in trail
      let baseOpacity;
      if (index === this.trail.length - 1) {
        // Last position: 50% opacity
        baseOpacity = 0.5;
      } else if (index === this.trail.length - 2) {
        // Position 2 moves ago: 25% opacity
        baseOpacity = 0.25;
      } else {
        // Older entries fade out quickly
        baseOpacity = 0;
      }

      // Apply fade over time
      const opacity = baseOpacity * (1 - progress);

      if (opacity > 0) {
        fill(playerColor[0], playerColor[1], playerColor[2], opacity * 255);
        rect(
          entry.c * this.ts + this.ts / 2 - this.ts / 2,
          entry.r * this.ts + this.ts / 2 - this.ts / 2,
          this.ts,
          this.ts,
        );
      }
    });
  }

  /*
  Try to move by (dr, dc) tiles.

  Inputs:
  - level: a Level instance, used for bounds + wall collision + goal detection
  - dr/dc: desired movement step, typically -1,0,1

  Returns:
  - true if the move happened
  - false if blocked or throttled
  */
  tryMove(level, dr, dc) {
    // Throttle discrete movement using millis()
    const now = millis();
    if (now - this.movedAt < this.moveDelay) return false;

    const nr = this.r + dr;
    const nc = this.c + dc;

    // Prevent walking off the map.
    if (!level.inBounds(nr, nc)) return false;

    // Prevent walking into walls.
    if (level.isWall(nr, nc)) return false;

    // Movement is allowed, so add current position to trail before moving
    this.trail.push({ r: this.r, c: this.c, createdAt: now });

    // Commit the movement
    this.r = nr;
    this.c = nc;
    this.movedAt = now;

    return true;
  }
}
