/**
 * Puzzle Gift Experience - Core Engine
 */

const CONFIG = {
    totalStages: 5,
    assets: [
        'assets/images/stage_1.png',
        'assets/images/stage_2.png',
        'assets/images/stage_3.png',
        'assets/images/stage_4.png',
        'assets/images/stage_5.png',
    ],
    revealImage: 'assets/images/reveal.png',
    snapDistance: 60, // Pixels to snap
};

const STAGE_CONFIG = [
    { rows: 4, cols: 4, type: 'jigsaw', timeLimit: 60, title: "The Beginning", subtitle: "Piece together the first memory." },
    { rows: 5, cols: 5, type: 'jigsaw', timeLimit: 90, title: "Growing Stronger", subtitle: "Complexity increases." },
    { rows: 6, cols: 6, type: 'jigsaw', timeLimit: 120, title: "Vivid Colors", subtitle: "Focus on the details." },
    { rows: 6, cols: 6, type: 'jigsaw', timeLimit: 150, title: "Twists & Turns", subtitle: "Life isn't always straight lines." },
    { rows: 8, cols: 8, type: 'jigsaw', timeLimit: 180, title: "The Masterpiece", subtitle: "The final challenge." }
];

const SETTINGS = {
    timePerStage: 60, // Base time
    gridMultiplier: 1  // 1 = normal, 1.5 = hard, etc.
};

class Utils {
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

class JigsawGenerator {
    // Helper to generate jigsaw paths
    // Returns a Path2D object for a specific piece
    static createPiecePath(x, y, width, height, row, col, rows, cols, tabs) {
        const path = new Path2D();
        const startX = x;
        const startY = y;
        const w = width;
        const h = height;

        path.moveTo(startX, startY);

        // Top Edge
        if (row === 0) {
            path.lineTo(startX + w, startY);
        } else {
            JigsawGenerator.appendTab(path, startX, startY, w, 0, tabs.top); // 0 = horizontal
        }

        // Right Edge
        if (col === cols - 1) {
            path.lineTo(startX + w, startY + h);
        } else {
            JigsawGenerator.appendTab(path, startX + w, startY, h, 1, tabs.right); // 1 = vertical
        }

        // Bottom Edge
        if (row === rows - 1) {
            path.lineTo(startX, startY + h);
        } else {
            JigsawGenerator.appendTab(path, startX + w, startY + h, w, 2, tabs.bottom); // 2 = horizontal reverse
        }

        // Left Edge
        if (col === 0) {
            path.lineTo(startX, startY);
        } else {
            JigsawGenerator.appendTab(path, startX, startY + h, h, 3, tabs.left); // 3 = vertical reverse
        }

        path.closePath();
        return path;
    }

    // Improved Bezier Tab for Jigsaw Pieces
    static appendTab(path, x, y, len, side, type) {
        const t = type;
        const v = len / 10; // unit

        if (side === 0) { // Top (Horizontal L->R)
            path.lineTo(x + v * 3, y);
            path.bezierCurveTo(x + v * 2, y - t * v * 2.5, x + v * 4, y - t * v * 4.5, x + v * 5, y - t * v * 4.5);
            path.bezierCurveTo(x + v * 6, y - t * v * 4.5, x + v * 8, y - t * v * 2.5, x + v * 7, y);
            path.lineTo(x + len, y);
        }
        else if (side === 1) { // Right (Vertical T->B)
            path.lineTo(x, y + v * 3);
            path.bezierCurveTo(x + t * v * 2.5, y + v * 2, x + t * v * 4.5, y + v * 4, x + t * v * 4.5, y + v * 5);
            path.bezierCurveTo(x + t * v * 4.5, y + v * 6, x + t * v * 2.5, y + v * 8, x, y + v * 7);
            path.lineTo(x, y + len);
        }
        else if (side === 2) { // Bottom (Horizontal R->L)
            path.lineTo(x - v * 3, y);
            path.bezierCurveTo(x - v * 2, y + t * v * 2.5, x - v * 4, y + t * v * 4.5, x - v * 5, y + t * v * 4.5);
            path.bezierCurveTo(x - v * 6, y + t * v * 4.5, x - v * 8, y + t * v * 2.5, x - v * 7, y);
            path.lineTo(x - len, y);
        }
        else if (side === 3) { // Left (Vertical B->T)
            path.lineTo(x, y - v * 3);
            path.bezierCurveTo(x - t * v * 2.5, y - v * 2, x - t * v * 4.5, y - v * 4, x - t * v * 4.5, y - v * 5);
            path.bezierCurveTo(x - t * v * 4.5, y - v * 6, x - t * v * 2.5, y - v * 8, x, y - v * 7);
            path.lineTo(x, y - len);
        }
    }
}

class Confetti {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.running = false;
    }
    start() {
        this.running = true;
        this.particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * this.ctx.canvas.width,
            y: Math.random() * this.ctx.canvas.height - this.ctx.canvas.height,
            vx: Math.random() * 6 - 3,
            vy: Math.random() * 4 + 3,
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
            size: Math.random() * 6 + 3
        }));
    }
    stop() { this.running = false; this.particles = []; }
    draw() {
        if (!this.running) return;
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            if (p.y > this.ctx.canvas.height) {
                p.y = -10;
                p.x = Math.random() * this.ctx.canvas.width;
                p.vy = Math.random() * 4 + 2;
            }
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    }
}

class PuzzleGame {
    constructor() {
        this.currentStageIndex = 0;
        this.canvas = document.getElementById('puzzle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.pieces = [];
        this.img = null;

        // State
        this.isDragging = false;
        this.selectedPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isStageComplete = false;
        this.zIndexCounter = 1;
        this.timerId = null;
        this.timeLeft = 0;

        // UI Refs
        this.ui = {
            title: document.getElementById('stage-title'),
            subtitle: document.getElementById('stage-subtitle'),
            modal: document.getElementById('stage-complete-modal'),
            nextBtn: document.getElementById('next-stage-btn'),
            pills: document.querySelectorAll('.pill'),
            loader: document.getElementById('loading-indicator'),
            reveal: document.getElementById('final-reveal'),
            progressBar: document.getElementById('progress-fill'),
            timer: document.getElementById('timer-display'),
            failureModal: document.getElementById('failure-modal'),
            retryBtn: document.getElementById('retry-btn'),
            settingsModal: document.getElementById('settings-modal'),
            settingsBtn: document.getElementById('settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            timeVal: document.getElementById('time-val'),
            pieceVal: document.getElementById('piece-val')
        };

        this.init();
        this.confetti = new Confetti(this.ctx);
    }

    init() {
        // Resize listener
        window.addEventListener('resize', this.handleResize.bind(this));

        // Input listeners
        this.canvas.addEventListener('mousedown', this.handleInputStart.bind(this));
        this.canvas.addEventListener('touchstart', this.handleInputStart.bind(this), { passive: false });

        window.addEventListener('mousemove', this.handleInputMove.bind(this));
        window.addEventListener('touchmove', this.handleInputMove.bind(this), { passive: false });

        window.addEventListener('mouseup', this.handleInputEnd.bind(this));
        window.addEventListener('touchend', this.handleInputEnd.bind(this));

        // UI Listeners
        this.ui.nextBtn.addEventListener('click', this.nextStage.bind(this));
        this.ui.retryBtn.addEventListener('click', () => this.loadStage(this.currentStageIndex));
        this.ui.settingsBtn.addEventListener('click', () => this.toggleSettings(true));
        this.ui.closeSettingsBtn.addEventListener('click', () => {
            this.toggleSettings(false);
            this.loadStage(this.currentStageIndex);
        });

        document.getElementById('time-inc').addEventListener('click', () => this.adjustTime(10));
        document.getElementById('time-dec').addEventListener('click', () => this.adjustTime(-10));
        document.getElementById('piece-inc').addEventListener('click', () => this.adjustPiece(1));
        document.getElementById('piece-dec').addEventListener('click', () => this.adjustPiece(-1));

        document.getElementById('help-btn').addEventListener('mousedown', () => this.showHint(true));
        document.getElementById('help-btn').addEventListener('mouseup', () => this.showHint(false));
        document.getElementById('help-btn').addEventListener('touchstart', () => this.showHint(true));
        document.getElementById('help-btn').addEventListener('touchend', () => this.showHint(false));

        // Start
        this.handleResize();
        this.loadStage(0);
    }

    handleResize() {
        const area = document.getElementById('game-area');
        this.canvas.width = area.clientWidth;
        this.canvas.height = area.clientHeight;
        this.draw();
    }

    async loadStage(index) {
        if (index >= CONFIG.totalStages) {
            this.showFinalReveal();
            return;
        }

        this.currentStageIndex = index;
        this.isStageComplete = false;
        this.pieces = [];
        this.updateUI();
        this.ui.loader.classList.remove('hidden');

        // Load Image
        const imgSrc = CONFIG.assets[index];
        this.img = new Image();
        this.img.crossOrigin = "Anonymous"; // In case we use external URLs later
        this.img.src = imgSrc;

        const config = STAGE_CONFIG[index];
        this.img.onload = () => {
            this.ui.loader.classList.add('hidden');
            this.generatePuzzle(index);
            // Use User Setting for time
            this.startTimer(SETTINGS.timePerStage);
            this.draw();
        };

        this.img.onerror = () => {
            this.ui.loader.innerText = "Error loading image. Using placeholder.";
            // Create a placeholder image functionality or just draw colors?
            // For now, let's just use canvas drawing in generate if img fails? 
            // Better to have a backup.
            this.generatePuzzle(index); // Will run but might be empty if drawImage fails.
            this.draw();
        };
    }

    generatePuzzle(index) {
        const config = STAGE_CONFIG[index];
        const rows = Math.round(config.rows * SETTINGS.gridMultiplier);
        const cols = Math.round(config.cols * SETTINGS.gridMultiplier);

        // Puzzle size (60% of screen)
        const puzzleDimension = Math.min(this.canvas.width, this.canvas.height) * 0.6;
        let targetW = puzzleDimension;
        let targetH = puzzleDimension;

        const maxW = this.canvas.width * 0.9;
        const maxH = this.canvas.height * 0.8;
        if (targetW > maxW) { targetW = maxW; targetH = targetW; }
        if (targetH > maxH) { targetH = maxH; targetW = targetH; }

        // Calculate Crop
        let cropX = 0, cropY = 0, cropW = 100, cropH = 100;
        if (this.img && this.img.width) {
            cropW = this.img.width;
            cropH = this.img.height;
            const imgRatio = this.img.width / this.img.height;
            const canvasRatio = targetW / targetH;
            if (imgRatio > canvasRatio) {
                cropH = this.img.height;
                cropW = cropH * canvasRatio;
                cropX = (this.img.width - cropW) / 2;
            } else {
                cropW = this.img.width;
                cropH = cropW / canvasRatio;
                cropY = (this.img.height - cropH) / 2;
            }
        }
        this.crop = { x: cropX, y: cropY, w: cropW, h: cropH };

        const headerHeight = 110; // Extra room for the glass header
        const availableHeight = this.canvas.height - headerHeight;

        const startX = (this.canvas.width - targetW) / 2;
        const startY = headerHeight + (availableHeight - targetH) / 2;

        this.puzzleBounds = { x: startX, y: startY, w: targetW, h: targetH };

        const pieceW = targetW / cols;
        const pieceH = targetH / rows;

        this.pieces = [];

        // Tab registration for jigsaw
        const tabs = { v: [], h: [] };
        if (config.type === 'jigsaw') {
            for (let r = 0; r < rows; r++) {
                tabs.v[r] = [];
                for (let c = 0; c < cols - 1; c++) {
                    tabs.v[r][c] = Math.random() > 0.5 ? 1 : -1;
                }
            }
            for (let r = 0; r < rows - 1; r++) {
                tabs.h[r] = [];
                for (let c = 0; c < cols; c++) {
                    tabs.h[r][c] = Math.random() > 0.5 ? 1 : -1;
                }
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const pieceTabs = { top: 0, right: 0, bottom: 0, left: 0 };
                if (config.type === 'jigsaw') {
                    if (r > 0) pieceTabs.top = -tabs.h[r - 1][c];
                    if (c < cols - 1) pieceTabs.right = tabs.v[r][c];
                    if (r < rows - 1) pieceTabs.bottom = tabs.h[r][c];
                    if (c > 0) pieceTabs.left = -tabs.v[r][c - 1];
                }

                // Random scatter position - respect header safe zone
                let scatterX, scatterY;
                const margin = 20;

                if (Math.random() > 0.5) {
                    scatterX = Math.random() > 0.5 ?
                        Utils.getRandomInt(margin, startX - pieceW - margin) :
                        Utils.getRandomInt(startX + targetW + margin, this.canvas.width - pieceW - margin);
                    scatterY = Utils.getRandomInt(headerHeight + margin, this.canvas.height - pieceH - margin);
                } else {
                    scatterX = Utils.getRandomInt(margin, this.canvas.width - pieceW - margin);
                    scatterY = Math.random() > 0.5 ?
                        Utils.getRandomInt(headerHeight + margin, startY - pieceH - margin) :
                        Utils.getRandomInt(startY + targetH + margin, this.canvas.height - pieceH - margin);
                }

                // Fallback
                if (isNaN(scatterX) || isNaN(scatterY)) {
                    scatterX = Math.random() * (this.canvas.width - pieceW);
                    scatterY = headerHeight + Math.random() * (this.canvas.height - pieceH - headerHeight);
                }

                this.pieces.push({
                    id: `${r}-${c}`,
                    correctC: c,
                    correctR: r,
                    correctX: startX + (c * pieceW),
                    correctY: startY + (r * pieceH),
                    currentX: scatterX,
                    currentY: scatterY,
                    width: pieceW,
                    height: pieceH,
                    row: r,
                    col: c,
                    tabs: pieceTabs,
                    isLocked: false,
                    zIndex: 0,
                    path: config.type === 'jigsaw' ?
                        JigsawGenerator.createPiecePath(0, 0, pieceW, pieceH, r, c, rows, cols, pieceTabs)
                        : null
                });
            }
        }
    }

    updateUI() {
        this.ui.title.innerText = STAGE_CONFIG[this.currentStageIndex].title;
        this.ui.subtitle.innerText = STAGE_CONFIG[this.currentStageIndex].subtitle;
        this.ui.pills.forEach((pill, i) => {
            pill.classList.toggle('active', i === this.currentStageIndex);
        });
        this.ui.modal.classList.add('hidden');
        this.ui.progressBar.style.width = `${(this.currentStageIndex / CONFIG.totalStages) * 100}%`;
    }

    // Input Handling
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    handleInputStart(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);

        // Check pieces from top z-index to bottom
        // We filter out locked pieces
        const moveablePieces = this.pieces.filter(p => !p.isLocked).sort((a, b) => b.zIndex - a.zIndex);

        for (let p of moveablePieces) {
            // Hit test
            // Simple rect test for click selection, even for jigsaw (bounding box is close enough)
            if (pos.x >= p.currentX && pos.x <= p.currentX + p.width &&
                pos.y >= p.currentY && pos.y <= p.currentY + p.height) {

                this.isDragging = true;
                this.selectedPiece = p;
                p.zIndex = ++this.zIndexCounter; // Bring to front

                this.dragOffset = {
                    x: pos.x - p.currentX,
                    y: pos.y - p.currentY
                };

                this.draw();
                return;
            }
        }
    }

    handleInputMove(e) {
        if (!this.isDragging || !this.selectedPiece) return;
        e.preventDefault();

        const pos = this.getMousePos(e);
        this.selectedPiece.currentX = pos.x - this.dragOffset.x;
        this.selectedPiece.currentY = pos.y - this.dragOffset.y;

        this.draw();
    }

    handleInputEnd(e) {
        if (!this.isDragging || !this.selectedPiece) return;

        // Snap logic
        const p = this.selectedPiece;

        // 1. Snap to Target Grid
        const distToTarget = Math.hypot(p.currentX - p.correctX, p.currentY - p.correctY);
        let snapped = false;

        if (distToTarget < CONFIG.snapDistance) {
            p.currentX = p.correctX;
            p.currentY = p.correctY;
            snapped = true;
        }
        // 2. Snap to already locked neighbors (Magnetic feel)
        else {
            const neighbors = this.pieces.filter(n => n.isLocked && (
                (n.row === p.row && Math.abs(n.col - p.col) === 1) ||
                (n.col === p.col && Math.abs(n.row - p.row) === 1)
            ));

            for (let n of neighbors) {
                const expectedX = n.currentX + (p.col - n.col) * p.width;
                const expectedY = n.currentY + (p.row - n.row) * p.height;
                const distToNeighbor = Math.hypot(p.currentX - expectedX, p.currentY - expectedY);

                if (distToNeighbor < CONFIG.snapDistance / 2) {
                    p.currentX = expectedX;
                    p.currentY = expectedY;
                    snapped = true;
                    break;
                }
            }
        }

        if (snapped) {
            p.isLocked = true;
            p.zIndex = 0;
            this.checkCompletion();
        }

        this.isDragging = false;
        this.selectedPiece = null;
        this.draw();
    }

    checkCompletion() {
        if (this.pieces.every(p => p.isLocked)) {
            this.isStageComplete = true;
            this.onStageComplete();
        }
    }

    onStageComplete() {
        this.stopTimer();
        // Confetti effect or animation trigger
        // Re-draw full image without grid lines
        this.draw();

        // Show modal after small delay
        this.confetti.start();
        setTimeout(() => {
            this.ui.modal.classList.remove('hidden');
        }, 800);
    }

    startTimer(seconds) {
        this.stopTimer();
        this.timeLeft = seconds;
        this.ui.timer.classList.remove('hidden');
        this.ui.failureModal.classList.add('hidden');
        this.updateTimerDisplay();

        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.ui.timer.classList.add('hidden');
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        this.ui.timer.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    handleTimeout() {
        this.stopTimer();
        this.ui.failureModal.classList.remove('hidden');
    }

    // Settings logic
    toggleSettings(show) {
        this.ui.settingsModal.classList.toggle('hidden', !show);
        if (show) this.updateSettingsUI();
    }

    adjustTime(delta) {
        SETTINGS.timePerStage = Math.max(10, Math.min(600, SETTINGS.timePerStage + delta));
        this.updateSettingsUI();
    }

    adjustPiece(delta) {
        SETTINGS.gridMultiplier = Math.max(0.5, Math.min(2, SETTINGS.gridMultiplier + (delta * 0.1)));
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        this.ui.timeVal.innerText = SETTINGS.timePerStage;
        const currentConfig = STAGE_CONFIG[this.currentStageIndex];
        const rows = Math.round(currentConfig.rows * SETTINGS.gridMultiplier);
        const cols = Math.round(currentConfig.cols * SETTINGS.gridMultiplier);
        this.ui.pieceVal.innerText = `${rows}x${cols} (${rows * cols} pieces)`;
    }

    showHint(show) {
        // Optionally show ghost image
        // We can handle this in draw()
        this.isHinting = show;
        this.draw();
    }

    draw() {
        if (!this.puzzleBounds) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const config = STAGE_CONFIG[this.currentStageIndex];

        // Draw Target Box (White outline)
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]); // Dashed line
        this.ctx.strokeRect(this.puzzleBounds.x, this.puzzleBounds.y, this.puzzleBounds.w, this.puzzleBounds.h);

        // Draw hint background if requested (more prominent now)
        if (this.isHinting && this.img && this.pieces.length > 0) {
            this.ctx.globalAlpha = 0.35; // Increased prominence
            this.ctx.drawImage(
                this.img,
                this.crop.x, this.crop.y, this.crop.w, this.crop.h,
                this.puzzleBounds.x, this.puzzleBounds.y, this.puzzleBounds.w, this.puzzleBounds.h
            );
        }
        this.ctx.restore();


        // Sort pieces by zIndex (0 is locked/back, higher is dragged)
        const sortedPieces = [...this.pieces].sort((a, b) => a.zIndex - b.zIndex);

        // Draw confetti behind? No, top.
        if (this.confetti) this.confetti.draw();

        sortedPieces.forEach(p => {
            this.ctx.save();

            // Translate to piece position
            this.ctx.translate(p.currentX, p.currentY);

            if (config.type === 'jigsaw') {
                // Clip logic
                // We stored the path relative to 0,0 of the piece
                this.ctx.stroke(p.path); // border
                this.ctx.clip(p.path);
            } else {
                // Rect clip
                this.ctx.beginPath();
                this.ctx.rect(0, 0, p.width, p.height);
                this.ctx.clip();
            }

            // Draw content
            if (this.img) {
                // Global Alignment Strategy:
                // Draw the whole cropped image at the offset that aligns the piece's 'correct' position
                // with its (0,0) local coordinate. This ensures 'outie' tabs show the image properly.
                const dx = -(p.correctX - this.puzzleBounds.x);
                const dy = -(p.correctY - this.puzzleBounds.y);

                this.ctx.drawImage(
                    this.img,
                    this.crop.x, this.crop.y, this.crop.w, this.crop.h, // Source
                    dx, dy, this.puzzleBounds.w, this.puzzleBounds.h   // Destination
                );
            } else {
                // Placeholder gradient
                this.ctx.fillStyle = `hsl(${(p.row * 50) + (p.col * 50)}, 70%, 50%)`;
                this.ctx.fillRect(0, 0, p.width, p.height);
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(`${p.row},${p.col}`, 10, 20);
            }

            // Border/Stroke
            this.ctx.strokeStyle = p.isLocked ? '#333' : '#fff';
            this.ctx.lineWidth = 2;
            if (config.type !== 'jigsaw') {
                this.ctx.strokeRect(0, 0, p.width, p.height);
            } else {
                this.ctx.stroke(p.path);
            }

            this.ctx.restore();
        });

    }

    nextStage() {
        if (this.confetti) this.confetti.stop();
        this.loadStage(this.currentStageIndex + 1);
    }

    showFinalReveal() {
        this.ui.reveal.classList.remove('hidden');
        if (this.ui.reveal.querySelector('img') === null) {
            const img = new Image();
            img.src = CONFIG.revealImage;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            img.style.boxShadow = '0 0 20px gold';
            document.getElementById('final-image-container').appendChild(img);
        }
    }
}

// Global Game Instance
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PuzzleGame();
});
