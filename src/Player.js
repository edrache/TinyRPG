export default class Player {
    constructor(x, y, grid) {
        this.x = x;
        this.y = y;
        this.grid = grid;
        this.color = '#00ff00';
        this.stats = this.generateStats();

        // Animation state
        this.isMoving = false;
        this.moveProgress = 0;
        this.moveDuration = 250; // ms
        this.startX = x;
        this.startY = y;
        this.targetX = x;
        this.targetY = y;
        this.visualX = x;
        this.visualY = y;
        this.scale = 1;
        this.rotation = 0;
    }

    generateStats() {
        // Stats: Strength, Agility, Intelligence, Charisma
        // Constraints: Sum = 8, Range = [1, 3]

        // Start with minimum 1 for each
        let stats = [1, 1, 1, 1];
        let pointsLeft = 4;

        while (pointsLeft > 0) {
            const index = Math.floor(Math.random() * 4);
            if (stats[index] < 3) {
                stats[index]++;
                pointsLeft--;
            }
        }

        return {
            strength: stats[0],
            agility: stats[1],
            intelligence: stats[2],
            charisma: stats[3]
        };
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    move(dx, dy) {
        if (this.isMoving) return false;

        const newX = this.x + dx;
        const newY = this.y + dy;

        const targetTile = this.grid.getTile(newX, newY);

        if (targetTile && !targetTile.hasTag('impassable')) {
            this.isMoving = true;
            this.moveProgress = 0;
            this.startX = this.x;
            this.startY = this.y;
            this.targetX = newX;
            this.targetY = newY;

            this.x = newX;
            this.y = newY;
            return true; // Move successful
        }
        return false; // Move blocked
    }

    update(deltaTime) {
        if (!this.isMoving) {
            // Idle Animation
            this.idleTime = (this.idleTime || 0) + deltaTime;
            const idleSpeed = 0.002;
            const rotationAmplitude = 0.05; // Radians
            const scaleAmplitude = 0.05;

            this.rotation = Math.sin(this.idleTime * idleSpeed) * rotationAmplitude;
            this.scale = 1 + Math.sin(this.idleTime * idleSpeed * 1.5) * scaleAmplitude;
            return;
        }

        // Reset idle time when moving
        this.idleTime = 0;

        this.moveProgress += deltaTime / this.moveDuration;
        if (this.moveProgress >= 1) {
            this.moveProgress = 1;
            this.isMoving = false;
            this.visualX = this.targetX;
            this.visualY = this.targetY;
            this.scale = 1;
            this.rotation = 0;
        } else {
            const t = this.easeInOutQuad(this.moveProgress);
            this.visualX = this.startX + (this.targetX - this.startX) * t;
            this.visualY = this.startY + (this.targetY - this.startY) * t;

            // Animation effects
            // Peak at 0.5
            const peak = Math.sin(this.moveProgress * Math.PI);
            this.scale = 1 + peak * 0.2; // Scale up to 1.2
            this.rotation = peak * 0.2; // Rotate up to ~0.2 radians
        }
    }

    draw(ctx, tileSize, image, camera) {
        const screenX = (this.visualX - camera.x) * tileSize;
        const screenY = (this.visualY - camera.y) * tileSize;

        ctx.save();
        // Translate to bottom-center of player
        ctx.translate(screenX + tileSize / 2, screenY + tileSize);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        if (image) {
            // Draw relative to bottom-center (0,0)
            // Image top-left is (-width/2, -height)
            ctx.drawImage(image, -tileSize / 2, -tileSize, tileSize, tileSize);
        } else {
            // Draw player as a circle or square (Fallback)
            ctx.fillStyle = this.color;
            // Slightly smaller than tile
            const padding = 4;
            ctx.fillRect(
                -tileSize / 2 + padding,
                -tileSize + padding,
                tileSize - padding * 2,
                tileSize - padding * 2
            );
        }
        ctx.restore();
    }
}
