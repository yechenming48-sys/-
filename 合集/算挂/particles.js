/**
 * 赛博周易 4.0 - 终极太虚水墨星盘引擎
 * 融合三维天体星盘 (Astrolabe)、流体水墨烟雾 (Fluid Ink)、及赛博粒子拖尾光轨
 */

const ParticleType = {
    COSMIC_DUST: 'COSMIC_DUST', // 太虚星尘 (慢速背景)
    INK_SMOKE: 'INK_SMOKE',     // 水墨洇染烟雾
    SPARK_TRAIL: 'SPARK_TRAIL', // 电流光轨粒子
    DISSOLVE: 'DISSOLVE',       // 符咒碎裂星尘
    SHOCKWAVE: 'SHOCKWAVE',     // 涟漪圈波纹
    GOLDEN_EMBERS: 'GOLDEN_EMBERS' // 铜钱飞溅金烬
};

class Particle {
    constructor(x, y, color, type = ParticleType.COSMIC_DUST) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.alpha = 1;
        this.dead = false;

        switch (type) {
            case ParticleType.COSMIC_DUST:
                // 背景微光粒子
                this.vx = (Math.random() - 0.5) * 0.1;
                this.vy = (Math.random() - 0.5) * 0.1 - 0.05;
                this.size = Math.random() * 1.5 + 0.3;
                this.alpha = Math.random() * 0.4 + 0.05;
                break;
                
            case ParticleType.INK_SMOKE:
                // 水墨流体烟雾：大而散，极慢扩散
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.4 + 0.1;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed - 0.05;
                this.size = Math.random() * 25 + 15;
                this.decay = Math.random() * 0.008 + 0.005; // 缓慢消散
                this.alpha = Math.random() * 0.25 + 0.1;
                break;
                
            case ParticleType.SPARK_TRAIL:
                // 鼠标/球体飘逸的高亮火花
                const sa = Math.random() * Math.PI * 2;
                const ss = Math.random() * 1.5 + 0.5;
                this.vx = Math.cos(sa) * ss;
                this.vy = Math.sin(sa) * ss - 0.2;
                this.size = Math.random() * 2.2 + 0.6;
                this.decay = Math.random() * 0.02 + 0.012;
                break;

            case ParticleType.DISSOLVE:
                // 符咒粒子风暴
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.size = Math.random() * 2.5 + 0.8;
                this.decay = 0;
                break;
                
            case ParticleType.SHOCKWAVE:
                this.size = 2;
                this.maxSize = Math.random() * 45 + 75;
                this.decay = 0.018;
                this.vx = 0;
                this.vy = 0;
                break;
                
            case ParticleType.GOLDEN_EMBERS:
                const ca = Math.random() * Math.PI * 2;
                const cs = Math.random() * 5 + 2;
                this.vx = Math.cos(ca) * cs;
                this.vy = Math.sin(ca) * cs - 2;
                this.size = Math.random() * 3 + 1;
                this.decay = Math.random() * 0.025 + 0.015;
                this.gravity = 0.16;
                break;
        }
    }

    update(mouseX, mouseY, targetX, targetY) {
        switch (this.type) {
            case ParticleType.COSMIC_DUST:
                this.x += this.vx;
                this.y += this.vy;
                if (this.y < -10) this.y = window.innerHeight + 10;
                if (this.x < -10) this.x = window.innerWidth + 10;
                if (this.x > window.innerWidth + 10) this.x = -10;
                break;
                
            case ParticleType.INK_SMOKE:
                // 流体缓慢流动
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.98;
                this.vy *= 0.98;
                this.size += 0.25; // 扩散变大
                this.alpha -= this.decay;
                if (this.alpha <= 0) this.dead = true;
                break;
                
            case ParticleType.SPARK_TRAIL:
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= this.decay;
                if (this.alpha <= 0) this.dead = true;
                break;
                
            case ParticleType.DISSOLVE:
                if (targetX !== undefined && targetY !== undefined) {
                    const dx = targetX - this.x;
                    const dy = targetY - this.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 15) {
                        this.dead = true;
                    } else {
                        const gravity = Math.min(4.5, 600 / dist);
                        const a = Math.atan2(dy, dx);
                        const oa = a + Math.PI / 2;
                        const spin = Math.max(1, 240 / dist);
                        
                        this.vx += Math.cos(a) * gravity * 0.18 + Math.cos(oa) * spin * 0.1;
                        this.vy += Math.sin(a) * gravity * 0.18 + Math.sin(oa) * spin * 0.1;
                        this.vx *= 0.92;
                        this.vy *= 0.92;
                        
                        this.x += this.vx;
                        this.y += this.vy;
                    }
                } else {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.alpha -= 0.01;
                    if (this.alpha <= 0) this.dead = true;
                }
                break;
                
            case ParticleType.SHOCKWAVE:
                this.size += 4;
                this.alpha -= this.decay;
                if (this.alpha <= 0 || this.size >= this.maxSize) this.dead = true;
                break;
                
            case ParticleType.GOLDEN_EMBERS:
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.97;
                this.vy *= 0.97;
                this.alpha -= this.decay;
                if (this.alpha <= 0) this.dead = true;
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        if (this.type === ParticleType.INK_SMOKE) {
            // 水墨烟雾渲染 (极度柔和的墨团)
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            grad.addColorStop(0, this.color);
            grad.addColorStop(0.3, this.color);
            grad.addColorStop(1, 'rgba(3, 3, 6, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === ParticleType.SHOCKWAVE) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = this.color;
            if (this.type !== ParticleType.COSMIC_DUST) {
                ctx.shadowBlur = this.size * 2.5 + 2;
                ctx.shadowColor = this.color;
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// 终极三维全息星盘
class Astrolabe3D {
    constructor(radius) {
        this.radius = radius;
        this.rotation = 0;
        this.pitch = 0.45; // 星盘倾斜视角
        
        // 刻度文本（八卦符号）
        this.trigrams = ['☰ 乾', '☱ 兑', '☲ 离', '☳ 震', '☴ 巽', '☵ 坎', '☶ 艮', '☷ 坤'];
        this.binaryMarks = ['000', '001', '010', '011', '100', '101', '110', '111'];
    }

    render(ctx, cx, cy, active, system) {
        if (!active) return;

        const now = Date.now();
        // 1. 不规则太虚漂浮
        const driftX = Math.sin(now * 0.0006) * 15 + Math.cos(now * 0.0013) * 8;
        const driftY = Math.cos(now * 0.0005) * 12 + Math.sin(now * 0.0011) * 6;
        const ax = cx + driftX;
        const ay = cy + driftY - 20;

        // 2. 多重嵌套旋转轨道
        this.rotation += 0.0022; // 基础速度
        this.pitch = 0.42 + Math.sin(now * 0.0004) * 0.05; // 倾角晃动

        const cosP = Math.cos(this.pitch);
        const sinP = Math.sin(this.pitch);

        ctx.save();
        
        // ==========================================
        // 轨道一：最外层八卦符文轨道 (反向慢速旋转)
        // ==========================================
        const rot1 = -this.rotation * 0.6;
        const radius1 = this.radius * 1.85;
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(88, 232, 204, 0.14)';
        ctx.shadowBlur = 0;
        
        // 绘制椭圆轨
        ctx.beginPath();
        ctx.ellipse(ax, ay, radius1, radius1 * cosP, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制刻度点与八卦文字
        this.trigrams.forEach((tg, idx) => {
            const angle = rot1 + (idx * Math.PI * 2) / this.trigrams.length;
            const x3d = radius1 * Math.cos(angle);
            const z3d = radius1 * Math.sin(angle);
            
            // 投影
            const y3d = z3d * sinP;
            const projY = ay + y3d * cosP; // 倾斜投影
            const projX = ax + x3d;
            
            // 深度变色与尺寸
            const alpha = Math.max(0.1, 0.55 * (radius1 - z3d) / (radius1 * 2));
            ctx.fillStyle = `rgba(243, 166, 59, ${alpha})`; // 金黄字
            ctx.font = '12px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tg, projX, projY);
            
            // 轨道节点小圆点
            ctx.fillStyle = `rgba(88, 232, 204, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(projX, projY - 12, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // ==========================================
        // 轨道二：中间层二进制刻度轨 (正向快速旋转)
        // ==========================================
        const rot2 = this.rotation * 1.2;
        const radius2 = this.radius * 1.45;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)'; // 幽紫轨
        ctx.beginPath();
        ctx.ellipse(ax, ay, radius2, radius2 * cosP, 0, 0, Math.PI * 2);
        ctx.stroke();

        this.binaryMarks.forEach((bm, idx) => {
            const angle = rot2 + (idx * Math.PI * 2) / this.binaryMarks.length;
            const x3d = radius2 * Math.cos(angle);
            const z3d = radius2 * Math.sin(angle);
            const projX = ax + x3d;
            const projY = ay + (z3d * sinP) * cosP;

            const alpha = Math.max(0.08, 0.5 * (radius2 - z3d) / (radius2 * 2));
            ctx.fillStyle = `rgba(88, 232, 204, ${alpha})`;
            ctx.font = '10px "Share Tech Mono", monospace';
            ctx.fillText(bm, projX, projY);
        });

        // ==========================================
        // 轨道三：内层偏角电子星线轨 (倾斜角不同)
        // ==========================================
        const radius3 = this.radius * 1.0;
        const pitch3 = this.pitch + 0.15 * Math.sin(now * 0.0006);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.beginPath();
        ctx.ellipse(ax, ay, radius3, radius3 * Math.cos(pitch3), 0.25, 0, Math.PI * 2);
        ctx.stroke();

        // ==========================================
        // 4. 一边自转，一边从星盘表面抛洒粒子
        // ==========================================
        if (system && Math.random() > 0.22) {
            const randomRing = Math.random() > 0.5 ? radius1 : radius2;
            const randAngle = Math.random() * Math.PI * 2;
            const rx = randomRing * Math.cos(randAngle);
            const rz = randomRing * Math.sin(randAngle);
            const px = ax + rx;
            const py = ay + (rz * sinP) * cosP;
            
            const outwardAngle = Math.atan2(py - ay, px - ax);
            const speed = Math.random() * 0.8 + 0.4;
            
            const color = Math.random() > 0.5 ? 'rgba(88, 232, 204, 0.75)' : 'rgba(243, 166, 59, 0.7)';
            const p = new Particle(px, py, color, ParticleType.SPARK_TRAIL);
            p.vx = Math.cos(outwardAngle) * speed;
            p.vy = Math.sin(outwardAngle) * speed - 0.2; // 带有微弱上升风阻
            p.size = Math.random() * 2 + 1;
            p.decay = Math.random() * 0.015 + 0.008; // 长轨道
            system.particles.push(p);
        }

        ctx.restore();
    }
}

// 远景透视网格
class PerspectiveGrid {
    constructor(yOffset) {
        this.yOffset = yOffset;
    }

    render(ctx, cx, cy, activeScreenId) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        ctx.save();
        
        const gridY = cy + this.yOffset;
        const horizonY = cy + 120;
        const D = 350;
        
        ctx.lineWidth = 0.5;

        // 纵向延长线
        const cols = 32;
        const gridWidth = w * 1.6;
        for (let i = 0; i <= cols; i++) {
            const pct = i / cols;
            const x3d = -gridWidth / 2 + pct * gridWidth;
            
            const scaleNear = D / (D + 40);
            const sxNear = cx + x3d * scaleNear;
            const syNear = gridY + (h - gridY) * scaleNear;

            const scaleFar = D / (D + 600);
            const sxFar = cx + x3d * scaleFar;
            const syFar = horizonY;

            const alpha = 0.12 * (1 - Math.abs(pct - 0.5) * 1.5);
            ctx.strokeStyle = `rgba(88, 232, 204, ${Math.max(0.01, alpha)})`;
            ctx.beginPath();
            ctx.moveTo(sxNear, syNear);
            ctx.lineTo(sxFar, syFar);
            ctx.stroke();
        }

        // 横向平行线
        const rows = 14;
        for (let j = 0; j <= rows; j++) {
            const zVal = 40 + (j / rows) * 560;
            const scale = D / (D + zVal);
            const yProj = horizonY + (gridY - horizonY) * scale;
            const xSpan = (w * 1.05) * scale;
            
            const depthAlpha = Math.max(0.008, 0.14 * (1 - (zVal - 40) / 560));
            ctx.strokeStyle = `rgba(88, 232, 204, ${depthAlpha})`;
            
            ctx.beginPath();
            ctx.moveTo(cx - xSpan, yProj);
            ctx.lineTo(cx + xSpan, yProj);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = undefined;
        this.mouseY = undefined;
        this.targetX = undefined;
        this.targetY = undefined;
        this.activeScreenId = 'screen-intro';
        this.matrixDrops = [];

        // 初始化全息星盘与地底网格
        this.astrolabe = new Astrolabe3D(180);
        this.grid = new PerspectiveGrid(140);

        this.initResize();
        this.initMouseEvents();
        this.spawnBackgroundParticles(120);
    }

    initMatrixDrops() {
        const fontSize = 14;
        const columns = Math.ceil(this.canvas.width / fontSize);
        this.matrixDrops = [];
        for (let i = 0; i < columns; i++) {
            this.matrixDrops.push({
                x: i * fontSize,
                y: Math.random() * -600,
                speed: Math.random() * 1.5 + 1.2,
                chars: ['☰','☱','☲','☳','☴','☵','☶','☷','0','1','0','1']
            });
        }
    }

    initResize() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.initMatrixDrops();
        };
        resize();
        window.addEventListener('resize', resize);
    }

    initMouseEvents() {
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            // 鼠标滑动呼出水墨烟雾与火花双重效果
            if (Math.random() > 0.4) {
                const color = Math.random() > 0.5 ? 'rgba(88, 232, 204, 0.45)' : 'rgba(168, 85, 247, 0.35)';
                this.particles.push(new Particle(e.clientX, e.clientY, color, ParticleType.SPARK_TRAIL));
            }
            if (Math.random() > 0.82) {
                // 泼出极淡的飘逸墨雾
                const inkColors = ['rgba(12, 10, 20, 0.15)', 'rgba(8, 12, 22, 0.12)'];
                const inkColor = inkColors[Math.floor(Math.random() * inkColors.length)];
                this.particles.push(new Particle(e.clientX, e.clientY, inkColor, ParticleType.INK_SMOKE));
            }
        });
        window.addEventListener('mouseout', () => {
            this.mouseX = undefined;
            this.mouseY = undefined;
        });
    }

    spawnBackgroundParticles(count) {
        const colors = [
            'rgba(88, 232, 204, 0.35)', // 乾天蓝
            'rgba(243, 166, 59, 0.25)', // 太极金
            'rgba(168, 85, 247, 0.22)'  // 赛博幽紫
        ];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, color, ParticleType.COSMIC_DUST));
        }
    }

    addBrushStroke(x, y, color) {
        // 泼散水墨烟雾
        this.particles.push(new Particle(x, y, 'rgba(8, 6, 12, 0.6)', ParticleType.INK_SMOKE));
        // 电流碎沫
        const count = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, ParticleType.BRUSH_SPARK));
        }
    }

    addExplosion(x, y, color, count = 25) {
        this.particles.push(new Particle(x, y, color, ParticleType.SHOCKWAVE));
        setTimeout(() => {
            if (this.particles) {
                this.particles.push(new Particle(x, y, 'rgba(88, 232, 204, 0.5)', ParticleType.SHOCKWAVE));
            }
        }, 150);

        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, ParticleType.GOLDEN_EMBERS));
        }
    }

    dissolvePoints(points, color, targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        points.forEach((pt, idx) => {
            if (idx % 2 === 0) {
                const p = new Particle(pt.x, pt.y, color, ParticleType.DISSOLVE);
                const a = Math.random() * Math.PI * 2;
                const spd = Math.random() * 3 + 1.5;
                p.vx = Math.cos(a) * spd;
                p.vy = Math.sin(a) * spd;
                this.particles.push(p);
            }
        });
    }

    update() {
        this.particles.forEach(p => {
            p.update(this.mouseX, this.mouseY, this.targetX, this.targetY);
        });
        this.particles = this.particles.filter(p => !p.dead);

        const bgCount = this.particles.filter(p => p.type === ParticleType.COSMIC_DUST).length;
        if (bgCount < 140) {
            this.spawnBackgroundParticles(140 - bgCount);
        }
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // 动态自适应调整星盘半径以适配手机端
        if (this.astrolabe) {
            const scaleFactor = Math.min(1.2, Math.max(0.55, w / 750));
            this.astrolabe.radius = 150 * scaleFactor;
        }

        // 拖尾遮罩：渲染出极为飘逸的水墨残余感
        this.ctx.fillStyle = 'rgba(3, 3, 6, 0.18)';
        this.ctx.fillRect(0, 0, w, h);

        // 0. 绘制易经二进制与卦爻数字雨 (仅在主页时显示)
        if (this.activeScreenId === 'screen-intro' && this.matrixDrops.length > 0) {
            this.ctx.save();
            this.ctx.font = '12px "Share Tech Mono", monospace';
            this.matrixDrops.forEach(drop => {
                const char = drop.chars[Math.floor(Math.random() * drop.chars.length)];
                
                // 越靠近屏幕两侧越清晰，越靠近中央星盘越模糊/透明，防内容重叠
                const distToCenter = Math.abs(drop.x - cx);
                const fadeFactor = Math.min(1, distToCenter / (w * 0.42));
                
                this.ctx.fillStyle = `rgba(88, 232, 204, ${0.11 * fadeFactor})`;
                this.ctx.fillText(char, drop.x, drop.y);
                
                drop.y += drop.speed;
                if (drop.y > h) {
                    drop.y = Math.random() * -120 - 20;
                    drop.speed = Math.random() * 1.5 + 1.2;
                }
            });
            this.ctx.restore();
        }

        // 1. 绘制 3D 远景地网格
        this.grid.render(this.ctx, cx, cy, this.activeScreenId);

        // 2. 绘制三维天体全息星盘 (包含轨道旋转、逸出微粒)
        this.astrolabe.render(this.ctx, cx, cy, this.activeScreenId === 'screen-intro', this);

        // 3. 绘制粒子
        this.particles.forEach(p => p.draw(this.ctx));
    }

    start() {
        const loop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        loop();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleType, Particle, ParticleSystem };
} else {
    window.CyberParticles = { ParticleType, Particle, ParticleSystem };
}
