import Tile from './Tile.js';

export default class Grid {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];

        this.generateMap();
    }

    generateMap() {
        this.tiles = [];

        // Initialize with plains
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(new Tile(x, y, 'plains'));
            }
            this.tiles.push(row);
        }

        // Generate clusters for other terrains
        const terrainTypes = ['forest', 'mountain', 'river', 'village', 'swamp', 'desert', 'hills', 'lake', 'ruins'];

        terrainTypes.forEach(type => {
            this.generateCluster(type);
        });

        // Ensure borders are mountains (impassable)
        for (let x = 0; x < this.width; x++) {
            this.tiles[0][x] = new Tile(x, 0, 'mountain');
            this.tiles[this.height - 1][x] = new Tile(x, this.height - 1, 'mountain');
        }
        for (let y = 0; y < this.height; y++) {
            this.tiles[y][0] = new Tile(0, y, 'mountain');
            this.tiles[y][this.width - 1] = new Tile(this.width - 1, y, 'mountain');
        }
    }

    generateCluster(type) {
        // Random center
        const centerX = Math.floor(Math.random() * (this.width - 2)) + 1;
        const centerY = Math.floor(Math.random() * (this.height - 2)) + 1;

        // Random size
        const size = Math.floor(Math.random() * 5) + 3; // 3 to 7

        for (let y = centerY - size; y <= centerY + size; y++) {
            for (let x = centerX - size; x <= centerX + size; x++) {
                if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
                    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    if (distance < size) {
                        // Add some noise/randomness to edges
                        if (Math.random() > 0.2) {
                            this.tiles[y][x] = new Tile(x, y, type);
                        }
                    }
                }
            }
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return null; // Out of bounds
    }

    draw(ctx, images) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const screenX = x * this.tileSize;
                const screenY = y * this.tileSize;

                if (tile.properties.image && images[tile.properties.image]) {
                    ctx.drawImage(images[tile.properties.image], screenX, screenY, this.tileSize, this.tileSize);
                } else {
                    // Fallback to color
                    ctx.fillStyle = tile.properties.color;
                    ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }

                // Overlay for non-walkable tiles
                if (!tile.hasTag('walkable')) {
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                    ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }

        // Draw grid crosses
        const crossColor = 'rgba(0, 0, 0, 0.3)';
        const crossSize = 6; // Arm length in pixels
        ctx.strokeStyle = crossColor;
        ctx.lineWidth = 0.5;

        for (let y = 0; y <= this.height; y++) {
            for (let x = 0; x <= this.width; x++) {
                const cx = x * this.tileSize;
                const cy = y * this.tileSize;

                ctx.beginPath();
                // Horizontal line
                ctx.moveTo(cx - crossSize, cy);
                ctx.lineTo(cx + crossSize, cy);
                // Vertical line
                ctx.moveTo(cx, cy - crossSize);
                ctx.lineTo(cx, cy + crossSize);
                ctx.stroke();
            }
        }
    }
}
