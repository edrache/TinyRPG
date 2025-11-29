import Grid from './Grid.js';
import Player from './Player.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.tileSize = 100;
        // Calculate grid size based on canvas size
        const gridWidth = Math.floor(this.width / this.tileSize);
        const gridHeight = Math.floor(this.height / this.tileSize);

        this.grid = new Grid(gridWidth, gridHeight, this.tileSize);

        // Find a valid starting position for the player
        let startX = 1;
        let startY = 1;
        while (this.grid.getTile(startX, startY).hasTag('impassable')) {
            startX++;
            if (startX >= gridWidth - 1) {
                startX = 1;
                startY++;
            }
        }

        this.player = new Player(startX, startY, this.grid);

        this.lastTime = 0;
        this.setupInput();

        // UI Elements
        this.uiTags = document.getElementById('tile-tags');

        // Preload images
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 0;
        this.preloadImages();
    }

    preloadImages() {
        const types = ['plains', 'forest', 'mountain', 'river', 'village', 'swamp', 'desert', 'hills', 'lake', 'ruins'];
        // Get unique image paths
        const imagePaths = new Set();
        types.forEach(type => {
            const props = this.grid.tiles[0][0].constructor.getProperties(type); // Access static method via instance or class if imported
            if (props.image) {
                imagePaths.add(props.image);
            }
        });

        // Add hero image
        imagePaths.add('assets/hero.png');
        // Add overlays
        imagePaths.add('assets/OverlayMultiply.png');
        imagePaths.add('assets/OverlayScreen.png');

        this.totalImages = imagePaths.size;

        imagePaths.forEach(path => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                this.imagesLoaded++;
                if (this.imagesLoaded === this.totalImages) {
                    this.createPatterns();
                    this.start();
                }
            };
            this.images[path] = img;
        });
    }

    createPatterns() {
        if (this.images['assets/OverlayMultiply.png']) {
            this.multiplyPattern = this.ctx.createPattern(this.images['assets/OverlayMultiply.png'], 'repeat');
        }
        if (this.images['assets/OverlayScreen.png']) {
            this.screenPattern = this.ctx.createPattern(this.images['assets/OverlayScreen.png'], 'repeat');
        }
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            let dx = 0;
            let dy = 0;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    dy = -1;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    dy = 1;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    dx = -1;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    dx = 1;
                    break;
            }

            if (dx !== 0 || dy !== 0) {
                if (this.player.move(dx, dy)) {
                    this.updateUI();
                }
            }
        });
    }

    updateUI() {
        const currentTile = this.grid.getTile(this.player.x, this.player.y);
        if (currentTile) {
            this.uiTags.textContent = `Tags: ${currentTile.tags.join(', ')}`;
        }

        // Update Stats UI
        const statsList = document.getElementById('stats-list');
        if (statsList) {
            statsList.innerHTML = `
                <li>Strength: ${this.player.stats.strength}</li>
                <li>Agility: ${this.player.stats.agility}</li>
                <li>Intelligence: ${this.player.stats.intelligence}</li>
                <li>Charisma: ${this.player.stats.charisma}</li>
            `;
        }
    }

    start() {
        requestAnimationFrame((timestamp) => this.loop(timestamp));
        this.updateUI(); // Initial UI update
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    update(deltaTime) {
        // Game logic updates (animations, etc.)
        this.player.update(deltaTime);
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.grid.draw(this.ctx, this.images);

        // Draw player
        this.player.draw(this.ctx, this.tileSize, this.images['assets/hero.png']);

        // Draw Overlays
        this.ctx.save();

        // Multiply Layer
        if (this.multiplyPattern) {
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillStyle = this.multiplyPattern;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Screen Layer
        if (this.screenPattern) {
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fillStyle = this.screenPattern;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        this.ctx.restore();
    }
}
