/**
 * Enhanced Celestial Particle System with Meteors
 * Supports floating stars, mouse hover gravity, interactive click explosions,
 * mouse trail sparkles, ritual vortex swirling modes, and random shooting star meteors.
 */

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.particles = [];
        this.bursts = []; // Array for short-lived interactive sparkles/explosions
        this.meteors = []; // Array for shooting stars/meteors
        this.maxParticles = 220; // Increased density for richer starry night sky
        this.mouse = { x: null, y: null, radius: 150 };
        this.mode = 'normal'; // 'normal' or 'ritual'
        
        this.themeColors = [
            'rgba(236, 56, 188, ',  // Pink/Magenta
            'rgba(0, 242, 254, ',   // Cyan/Teal
            'rgba(115, 3, 192, ',   // Mystic Purple
            'rgba(253, 239, 249, ',  // Starlight White
            'rgba(243, 156, 18, ',   // Astral Gold
        ];

        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        this.resize();
        this.particles = [];
        this.bursts = [];
        this.meteors = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle(true));
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });

        // Track mouse and emit sparkles trail
        window.addEventListener('mousemove', (e) => {
            const oldX = this.mouse.x;
            const oldY = this.mouse.y;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            if (oldX !== null && oldY !== null) {
                const dist = Math.hypot(e.clientX - oldX, e.clientY - oldY);
                if (dist > 5) {
                    this.createTrailSparkle(e.clientX, e.clientY);
                }
            }
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // Trigger explosion on click anywhere
        window.addEventListener('mousedown', (e) => {
            this.createBurst(e.clientX, e.clientY, 15, 'mixed');
        });
    }

    createParticle(randomPos = false) {
        const size = Math.random() * 1.8 + 0.5; // various sizes of stars
        const colorPrefix = this.themeColors[Math.floor(Math.random() * this.themeColors.length)];
        
        let x, y, vx, vy;
        
        if (randomPos) {
            x = Math.random() * this.canvas.width;
            y = Math.random() * this.canvas.height;
        } else {
            // Respawn particles from screen boundaries
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { // Top
                x = Math.random() * this.canvas.width;
                y = -10;
            } else if (edge === 1) { // Right
                x = this.canvas.width + 10;
                y = Math.random() * this.canvas.height;
            } else if (edge === 2) { // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 10;
            } else { // Left
                x = -10;
                y = Math.random() * this.canvas.height;
            }
        }

        // Float drift velocities (very slow and gentle)
        vx = (Math.random() - 0.5) * 0.25;
        vy = (Math.random() - 0.5) * 0.25;

        // Spiral parameters (Vortex mode)
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (Math.max(this.canvas.width, this.canvas.height) * 0.65) + 50;

        return {
            x, y,
            vx, vy,
            size,
            colorPrefix,
            alpha: Math.random() * 0.6 + 0.15,
            twinkleSpeed: Math.random() * 0.012 + 0.003,
            twinkleDir: Math.random() > 0.5 ? 1 : -1,
            // Spiral variables
            angle,
            radius,
            radialSpeed: Math.random() * 1.2 + 0.6,
            angularSpeed: (Math.random() * 0.010 + 0.004) * (Math.random() > 0.5 ? 1 : -1)
        };
    }

    // Spawn tiny stardust trail from cursor
    createTrailSparkle(x, y) {
        const count = Math.random() > 0.6 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.8 + 0.2;
            this.bursts.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 0.1,
                size: Math.random() * 1.5 + 0.5,
                colorPrefix: this.themeColors[Math.floor(Math.random() * this.themeColors.length)],
                alpha: 1.0,
                decay: Math.random() * 0.02 + 0.015,
                friction: 0.98,
                gravity: 0.02
            });
        }
    }

    // Creates active explosion of particles
    createBurst(x, y, count = 20, colorType = 'mixed') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.5 + 1.2;
            let colorPrefix;
            
            if (colorType === 'gold') {
                colorPrefix = 'rgba(243, 156, 18, ';
            } else if (colorType === 'cosmic') {
                colorPrefix = Math.random() > 0.5 ? 'rgba(236, 56, 188, ' : 'rgba(0, 242, 254, ';
            } else {
                colorPrefix = this.themeColors[Math.floor(Math.random() * this.themeColors.length)];
            }

            this.bursts.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 2.8 + 1.2,
                colorPrefix,
                alpha: 1.0,
                decay: Math.random() * 0.022 + 0.012,
                friction: 0.95,
                gravity: 0.06
            });
        }
    }

    // Spawn a shooting star meteor
    spawnMeteor() {
        // Starts offscreen (top-right area) flying to bottom-left
        const startX = Math.random() * (this.canvas.width * 0.7) + this.canvas.width * 0.3;
        const startY = -40;
        const speed = Math.random() * 6 + 7; // high velocity
        const angle = Math.PI * 0.8 + (Math.random() - 0.5) * 0.15; // diagonal heading bottom-left

        this.meteors.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            length: Math.random() * 70 + 60, // length of stardust tail
            size: Math.random() * 1.5 + 1.0,
            alpha: 1.0,
            decay: Math.random() * 0.008 + 0.006 // fades slowly as it traverses
        });
    }

    setMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;

        if (mode === 'ritual') {
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;
            this.particles.forEach(p => {
                const dx = p.x - cx;
                const dy = p.y - cy;
                p.radius = Math.sqrt(dx * dx + dy * dy);
                p.angle = Math.atan2(dy, dx);
                p.angularSpeed = Math.abs(p.angularSpeed) * 1.5;
                p.radialSpeed = Math.abs(p.radialSpeed) * 1.2;
            });
        } else {
            this.particles.forEach(p => {
                p.vx = (Math.random() - 0.5) * 0.3;
                p.vy = (Math.random() - 0.5) * 0.3;
            });
        }
    }

    drawConstellation() {
        if (this.mode !== 'normal') return;
        
        const len = this.particles.length;
        // Limit number of checks to keep 60 FPS with 220 particles
        const step = Math.max(1, Math.floor(len / 80)); 
        for (let i = 0; i < len; i += step) {
            for (let j = i + 1; j < len; j += step * 2) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < 90) {
                    const alpha = (1 - dist / 90) * 0.11;
                    this.ctx.strokeStyle = `rgba(115, 3, 192, ${alpha})`;
                    this.ctx.lineWidth = 0.4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    update() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // 1. Randomly spawn a shooting star meteor
        if (this.mode === 'normal' && Math.random() < 0.003 && this.meteors.length < 2) {
            this.spawnMeteor();
        }

        // 2. Update background stars
        this.particles.forEach((p, index) => {
            p.alpha += p.twinkleSpeed * p.twinkleDir;
            if (p.alpha > 0.85 || p.alpha < 0.05) {
                p.twinkleDir *= -1;
            }

            if (this.mode === 'normal') {
                p.x += p.vx;
                p.y += p.vy;

                // Mouse gravitational attraction
                if (this.mouse.x !== null && this.mouse.y !== null) {
                    const dx = this.mouse.x - p.x;
                    const dy = this.mouse.y - p.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist < this.mouse.radius) {
                        const force = (this.mouse.radius - dist) / this.mouse.radius;
                        p.x += (dx / dist) * force * 0.4;
                        p.y += (dy / dist) * force * 0.4;
                    }
                }

                if (p.x < -20 || p.x > this.canvas.width + 20 || p.y < -20 || p.y > this.canvas.height + 20) {
                    this.particles[index] = this.createParticle(false);
                }

            } else if (this.mode === 'ritual') {
                p.angle += p.angularSpeed;
                p.radius -= p.radialSpeed;
                
                p.x = cx + Math.cos(p.angle) * p.radius;
                p.y = cy + Math.sin(p.angle) * p.radius;

                if (p.radius < 10) {
                    p.radius = Math.max(this.canvas.width, this.canvas.height) * 0.65 + Math.random() * 100;
                    p.angle = Math.random() * Math.PI * 2;
                    p.x = cx + Math.cos(p.angle) * p.radius;
                    p.y = cy + Math.sin(p.angle) * p.radius;
                }
            }
        });

        // 3. Update interactive bursts
        for (let i = this.bursts.length - 1; i >= 0; i--) {
            const p = this.bursts[i];
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.bursts.splice(i, 1);
            }
        }

        // 4. Update meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.alpha -= m.decay;

            if (m.x < -100 || m.y > this.canvas.height + 100 || m.alpha <= 0) {
                this.meteors.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw constellation lines
        this.drawConstellation();

        // Draw background starry particles
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.colorPrefix + p.alpha + ')';
            this.ctx.fill();
        });

        // Draw shooting stars/meteors
        this.meteors.forEach(m => {
            this.ctx.save();
            
            // Create linear fade for meteor trail
            const dx = m.vx;
            const dy = m.vy;
            const dist = Math.hypot(dx, dy);
            const tailX = m.x - (dx / dist) * m.length;
            const tailY = m.y - (dy / dist) * m.length;

            const grad = this.ctx.createLinearGradient(m.x, m.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255, 255, 255, ${m.alpha})`);
            grad.addColorStop(0.2, `rgba(0, 242, 254, ${m.alpha * 0.7})`);
            grad.addColorStop(0.6, `rgba(115, 3, 192, ${m.alpha * 0.3})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = m.size;
            this.ctx.lineCap = 'round';
            
            // Outer glow
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = 'rgba(0, 242, 254, 0.65)';
            
            this.ctx.beginPath();
            this.ctx.moveTo(m.x, m.y);
            this.ctx.lineTo(tailX, tailY);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Draw glowing interactive burst sparks
        this.bursts.forEach(p => {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.colorPrefix + p.alpha + ')';
            
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.colorPrefix + '0.8)';
            
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Instantiate particles globally
document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new ParticleSystem('particle-canvas');
});
