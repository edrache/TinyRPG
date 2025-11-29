import Tile from './Tile.js';
import Perlin from './Perlin.js';

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
        const perlin = new Perlin();
        const scale = 0.1; // Controls the "zoom" of the noise

        // Random offsets to sample different parts of the noise space
        const xOffset = Math.random() * 10000;
        const yOffset = Math.random() * 10000;
        const moistureOffset = 5000; // Relative offset for moisture map

        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Generate Elevation and Moisture values (normalized to 0-1 roughly)
                // Perlin noise returns -1 to 1, so we map it to 0-1
                let elevation = (perlin.noise((x * scale) + xOffset, (y * scale) + yOffset) + 1) / 2;
                let moisture = (perlin.noise((x * scale) + xOffset + moistureOffset, (y * scale) + yOffset + moistureOffset) + 1) / 2;

                // Add some randomness/noise to edges
                elevation += (Math.random() * 0.1 - 0.05);
                moisture += (Math.random() * 0.1 - 0.05);

                // Determine Terrain Type
                let type = 'plains';

                if (elevation < 0.35) {
                    // Low Elevation (Water/Swamp)
                    if (moisture > 0.6) {
                        type = 'lake';
                    } else {
                        type = 'swamp';
                    }
                } else if (elevation < 0.7) {
                    // Medium Elevation (Flatlands)
                    if (moisture < 0.3) {
                        type = 'desert';
                    } else if (moisture < 0.7) {
                        type = 'plains';
                        // Chance for village in plains
                        if (Math.random() < 0.02) type = 'village';
                    } else {
                        type = 'forest';
                    }
                } else {
                    // High Elevation (Hills/Mountains)
                    if (moisture < 0.4) {
                        type = 'hills';
                        // Chance for ruins in hills
                        if (Math.random() < 0.05) type = 'ruins';
                    } else {
                        type = 'mountain';
                    }
                }

                // Force borders to be 'border' type
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    type = 'border';
                }

                row.push(new Tile(x, y, type));
            }
            this.tiles.push(row);
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
