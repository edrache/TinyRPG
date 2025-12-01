import Grid from './Grid.js';
import Player from './Player.js';
import CardManager from './CardManager.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.tileSize = 64; // Adjusted for better visibility

        // Map Dimensions (World Size)
        this.mapWidth = 50;
        this.mapHeight = 50;

        // Viewport Dimensions (in tiles)
        this.viewportWidth = Math.ceil(this.width / this.tileSize);
        this.viewportHeight = Math.ceil(this.height / this.tileSize);

        this.grid = new Grid(this.mapWidth, this.mapHeight, this.tileSize);

        // Find a valid starting position for the player
        let startX = Math.floor(this.mapWidth / 2);
        let startY = Math.floor(this.mapHeight / 2);

        // Ensure start is valid
        while (this.grid.getTile(startX, startY).hasTag('impassable')) {
            startX++;
            if (startX >= this.mapWidth - 1) {
                startX = 1;
                startY++;
            }
        }

        this.player = new Player(startX, startY, this.grid);
        this.cardManager = new CardManager();

        // Camera Position (Top-Left coordinate in tiles, can be fractional)
        this.camera = {
            x: 0,
            y: 0
        };

        this.lastTime = 0;
        this.isCardActive = false;
        this.setupInput();

        // UI Elements
        this.uiTags = document.getElementById('tile-tags');
        this.cardDisplay = document.getElementById('card-display');
        this.cardType = document.getElementById('card-type');
        this.cardImage = document.getElementById('card-image');
        this.cardText = document.getElementById('card-text');
        this.cardActions = document.getElementById('card-actions');
        this.cardsRemaining = document.getElementById('cards-remaining');

        // Preload images
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 0;
        this.totalImages = 0;
        this.preloadImages();
        this.setupDraggableCard();
        this.setupMinimization();
        this.setupImageTooltip();
        this.setupDebugControls();

        this.fowEnabled = true;
    }

    setupDebugControls() {
        const fowToggle = document.getElementById('fow-toggle');
        if (fowToggle) {
            fowToggle.addEventListener('click', () => {
                this.fowEnabled = !this.fowEnabled;
                this.draw(); // Redraw immediately
            });
        }
    }

    setupImageTooltip() {
        const cardImage = document.getElementById('card-image');
        const tooltip = document.getElementById('image-zoom-tooltip');
        const zoomedImage = document.getElementById('zoomed-image');

        if (cardImage && tooltip && zoomedImage) {
            cardImage.addEventListener('mouseenter', () => {
                if (cardImage.src && !cardImage.classList.contains('hidden')) {
                    zoomedImage.src = cardImage.src;
                    tooltip.classList.remove('hidden');
                }
            });

            cardImage.addEventListener('mousemove', (e) => {
                if (!tooltip.classList.contains('hidden')) {
                    const offset = 20;
                    // Keep tooltip within window bounds logic could be added here
                    tooltip.style.left = `${e.clientX + offset}px`;
                    tooltip.style.top = `${e.clientY + offset}px`;
                }
            });

            cardImage.addEventListener('mouseleave', () => {
                tooltip.classList.add('hidden');
            });
        }
    }

    setupMinimization() {
        const minimizeBtn = document.getElementById('minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.cardDisplay.classList.toggle('minimized');
                if (this.cardDisplay.classList.contains('minimized')) {
                    minimizeBtn.textContent = '+';
                } else {
                    minimizeBtn.textContent = '−';
                }
            });
        }
    }

    setupDraggableCard() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const cardHeader = document.getElementById('card-header');

        const dragStart = (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            // Only allow dragging from the header
            if (e.target === cardHeader || cardHeader.contains(e.target)) {
                // Prevent dragging if clicking the minimize button
                if (e.target.id !== 'minimize-btn') {
                    isDragging = true;
                }
            }
        };

        const dragEnd = (e) => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, this.cardDisplay);
            }
        };

        const setTranslate = (xPos, yPos, el) => {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        };

        // Attach listeners
        if (cardHeader) {
            cardHeader.addEventListener("mousedown", dragStart);
            window.addEventListener("mouseup", dragEnd);
            window.addEventListener("mousemove", drag);
        }
    }

    preloadImages() {
        const types = ['plains', 'forest', 'mountain', 'river', 'village', 'swamp', 'desert', 'hills', 'lake', 'ruins', 'border'];
        // Get unique image paths
        const imagePaths = new Set();
        types.forEach(type => {
            const props = this.grid.tiles[0][0].constructor.getProperties(type);
            if (props.image) {
                imagePaths.add(props.image);
            }
        });

        // Add hero image
        imagePaths.add('assets/hero.png');
        // Add overlays
        imagePaths.add('assets/OverlayMultiply.png');
        imagePaths.add('assets/OverlayScreen.png');
        imagePaths.add('assets/impassable.png');

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
            if (this.isCardActive) return; // Block movement if card is active

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
                    this.handleCardDraw();
                }
            }
        });
    }

    handleCardDraw() {
        const currentTile = this.grid.getTile(this.player.x, this.player.y);
        if (currentTile) {
            const card = this.cardManager.drawCard(currentTile.type);
            if (card) {
                this.showCard(card);
            } else {
                this.hideCard();
            }
        }
    }

    showCard(card) {
        if (this.cardDisplay) {
            // Clear previous content
            this.cardType.innerHTML = '';
            this.cardActions.innerHTML = ''; // Clear previous actions

            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = card.type;
            tagSpan.style.backgroundColor = this.getTagColor(card.type);
            this.cardType.appendChild(tagSpan);

            this.cardText.textContent = card.text;

            const cardTitle = document.getElementById('card-title');
            if (cardTitle) {
                cardTitle.textContent = card.title || 'Unknown';
            }

            if (card.image) {
                this.cardImage.src = card.image;
                this.cardImage.classList.remove('hidden');
            } else {
                this.cardImage.classList.add('hidden');
            }

            // Render Actions
            // 33% chance to have an encounter
            const hasEncounter = Math.random() < 0.33;

            if (hasEncounter) {
                this.isCardActive = true; // Block movement only if there is an encounter

                if (card.actions && card.actions.length > 0) {
                    card.actions.forEach(action => {
                        const btn = document.createElement('button');
                        btn.className = 'action-btn';
                        btn.textContent = action.label;
                        btn.onclick = () => this.handleCardAction(action);
                        this.cardActions.appendChild(btn);
                    });
                } else {
                    // Fallback if no actions
                    const btn = document.createElement('button');
                    btn.className = 'action-btn';
                    btn.textContent = 'Continue';
                    btn.onclick = () => this.handleCardAction(null);
                    this.cardActions.appendChild(btn);
                }
            } else {
                this.isCardActive = false; // Allow movement
                // Optional: Add a visual indicator that it's safe to move?
                // For now, just no buttons.
            }

            this.cardsRemaining.textContent = `Cards left: ${this.cardManager.getCardsRemaining(card.type)}`;
            this.cardDisplay.classList.remove('hidden');
        }
    }

    handleCardAction(action) {
        if (action && action.effects) {
            if (action.effects.physicalFatigue) {
                this.player.stats.physicalFatigue.current += action.effects.physicalFatigue;
                // Clamp
                this.player.stats.physicalFatigue.current = Math.min(
                    this.player.stats.physicalFatigue.current,
                    this.player.stats.physicalFatigue.max
                );
                this.player.stats.physicalFatigue.current = Math.max(0, this.player.stats.physicalFatigue.current);
            }
            if (action.effects.mentalFatigue) {
                this.player.stats.mentalFatigue.current += action.effects.mentalFatigue;
                // Clamp
                this.player.stats.mentalFatigue.current = Math.min(
                    this.player.stats.mentalFatigue.current,
                    this.player.stats.mentalFatigue.max
                );
                this.player.stats.mentalFatigue.current = Math.max(0, this.player.stats.mentalFatigue.current);
            }
        }

        this.updateStats();
        this.hideCard();
    }

    hideCard() {
        if (this.cardDisplay) {
            this.cardDisplay.classList.add('hidden');
            this.isCardActive = false;
        }
    }

    updateUI() {
        const currentTile = this.grid.getTile(this.player.x, this.player.y);
        if (currentTile) {
            this.uiTags.innerHTML = ''; // Clear previous content
            currentTile.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.style.backgroundColor = this.getTagColor(tag);
                this.uiTags.appendChild(tagElement);
            });
        }
        this.updateStats();
    }

    getTagColor(tag) {
        // Map specific tags to dark, unique colors
        const colorMap = {
            'plains': '#2e4a2e',    // Dark Green
            'forest': '#1a331a',    // Deep Forest Green
            'mountain': '#4a4a4a',  // Dark Grey
            'river': '#1a2e4a',     // Dark Blue
            'village': '#4a332a',   // Dark Brown
            'swamp': '#333a2a',     // Dark Olive
            'desert': '#5c4033',    // Dark Ochre
            'hills': '#3a332a',     // Brownish
            'lake': '#1a1a33',      // Deep Navy
            'ruins': '#332a3a',     // Dark Purple
            'wall': '#1a1a1a',      // Almost Black
            'walkable': '#2a4a4a',  // Dark Teal
            'impassable': '#4a1a1a', // Dark Red
            'border': '#000000'     // Pure Black
        };

        if (colorMap[tag]) {
            return colorMap[tag];
        }

        // Generate a consistent dark color for unknown tags
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Hue: 0-360 based on hash
        const h = Math.abs(hash % 360);
        // Saturation: 40-60% (muted)
        const s = 40 + (Math.abs(hash) % 20);
        // Lightness: 20-35% (dark)
        const l = 20 + (Math.abs(hash) % 15);

        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    updateStats() {
        // Update Stats UI
        const statsList = document.getElementById('stats-list');
        if (statsList) {
            statsList.innerHTML = `
                <li><span class="stat-label">💪 Strength:</span> <span class="stat-value">${this.player.stats.strength}</span></li>
                <li><span class="stat-label">🏃 Agility:</span> <span class="stat-value">${this.player.stats.agility}</span></li>
                <li><span class="stat-label">🧠 Intelligence:</span> <span class="stat-value">${this.player.stats.intelligence}</span></li>
                <li><span class="stat-label">🗣️ Charisma:</span> <span class="stat-value">${this.player.stats.charisma}</span></li>
            `;
        }

        // Update Fatigue Bars
        const physicalBar = document.getElementById('physical-fatigue-bar');
        const physicalText = document.getElementById('physical-fatigue-text');
        if (physicalBar && physicalText) {
            const current = this.player.stats.physicalFatigue.current;
            const max = this.player.stats.physicalFatigue.max;
            const percentage = Math.max(0, Math.min(100, (current / max) * 100));
            physicalBar.style.width = `${percentage}%`;
            physicalText.textContent = `${current}/${max}`;
        }

        const mentalBar = document.getElementById('mental-fatigue-bar');
        const mentalText = document.getElementById('mental-fatigue-text');
        if (mentalBar && mentalText) {
            const current = this.player.stats.mentalFatigue.current;
            const max = this.player.stats.mentalFatigue.max;
            const percentage = Math.max(0, Math.min(100, (current / max) * 100));
            mentalBar.style.width = `${percentage}%`;
            mentalText.textContent = `${current}/${max}`;
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
        this.updateCamera();
    }

    updateCamera() {
        // Center camera on player
        // We want the player to be in the middle of the viewport
        // Camera x/y is the top-left corner of the viewport in tile coordinates

        // Use visual coordinates for smooth tracking
        const targetX = this.player.visualX - this.viewportWidth / 2;
        const targetY = this.player.visualY - this.viewportHeight / 2;

        // Smooth camera movement using Lerp
        const lerpFactor = 0.1;
        this.camera.x += (targetX - this.camera.x) * lerpFactor;
        this.camera.y += (targetY - this.camera.y) * lerpFactor;

        // Clamp camera to map bounds
        // The camera should not show outside (0,0) to (mapWidth, mapHeight)
        // But since we want to show the border, we clamp so the viewport stays within map

        this.camera.x = Math.max(0, Math.min(this.camera.x, this.mapWidth - this.viewportWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.mapHeight - this.viewportHeight));
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid with camera offset and player for FoW
        this.grid.draw(this.ctx, this.images, this.camera, this.player, this.fowEnabled);

        // Draw player with camera offset
        this.player.draw(this.ctx, this.tileSize, this.images['assets/hero.png'], this.camera);

        // Draw Overlays
        this.ctx.save();

        // Translate context so patterns are anchored to the map, not the screen
        const camX = this.camera.x * this.tileSize;
        const camY = this.camera.y * this.tileSize;
        this.ctx.translate(-camX, -camY);

        // Multiply Layer
        if (this.multiplyPattern) {
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillStyle = this.multiplyPattern;
            // Draw rect covering the visible area (which is now at camX, camY in this coordinate system)
            this.ctx.fillRect(camX, camY, this.width, this.height);
        }

        // Screen Layer
        if (this.screenPattern) {
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fillStyle = this.screenPattern;
            this.ctx.fillRect(camX, camY, this.width, this.height);
        }

        this.ctx.restore();
    }
}
