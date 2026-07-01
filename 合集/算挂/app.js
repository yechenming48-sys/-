/**
 * 主程序控制逻辑
 */

// 音频控制中心
class AudioController {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.bgOscs = [];
        this.bgGains = [];
    }

    init() {
        if (this.ctx) return;
        // 兼容性创建 AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.enabled = true;
        this.startAmbientHum();
    }

    toggle() {
        if (!this.ctx) {
            this.init();
            return true;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
            this.enabled = true;
        } else if (this.ctx.state === 'running') {
            this.ctx.suspend();
            this.enabled = false;
        }
        return this.enabled;
    }

    // 播放敲罄/钟声 (神秘钟音)
    playBell(frequency = 220, duration = 2.5) {
        if (!this.enabled || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        // 使用正弦波和三角波混合，表现空灵的钟磬音
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, now);
        // 添加金属泛音
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(frequency, now + 0.5);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + duration);
    }

    // 绘制笔触音效 (电磁水墨摩擦声)
    playDrawingTick(pitchFactor = 1) {
        if (!this.enabled || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        // 频率随鼠标移动在300Hz-600Hz之间微颤
        osc.frequency.setValueAtTime(300 + pitchFactor * 200 + Math.random() * 50, now);
        
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 铜钱落地声 (金属碰撞脆响)
    playCoinClink() {
        if (!this.enabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        
        // 碰撞双音调
        const freqs = [880, 1200, 1500];
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            // 快速降音高，模拟反弹
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + idx * 0.05 + 0.08);

            gainNode.gain.setValueAtTime(0.12 - idx * 0.03, now + idx * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.2);
        });
    }

    // 符咒消散时的粒子风暴音
    playDissolveWind() {
        if (!this.enabled || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const duration = 1.8;
        
        // 用白噪声或滤波器扫频模拟风刮起
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration);
        
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + duration * 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + duration);
    }

    // 终端打字声
    playTypeTick() {
        if (!this.enabled || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 600, now);
        
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.03);
    }

    // ============================================================
    // 逐渐激昂的三幕 BGM 合成器
    // Phase 1 (0-20s):  太虚禅息 —— 低频空灵无人声铺底
    // Phase 2 (20-50s): 星盘运转 —— 低音脉冲 + 弦乐中频填充
    // Phase 3 (50s+):   天机开启 —— 高频琶音 + 节律鼓击，激昂上升
    // ============================================================
    startAmbientHum() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 3);
        masterGain.connect(ctx.destination);
        this._masterGain = masterGain;

        // --- 工具函数: 创建 ADSR 音符 ---
        const playNote = (freq, type, startTime, duration, vol, detune = 0) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            if (detune) osc.detune.setValueAtTime(detune, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.08);
            gain.gain.setValueAtTime(vol, startTime + duration - 0.12);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
            return { osc, gain };
        };

        // --- 工具函数: 创建滤波器 ---
        const makeFilter = (type, freq, q = 1) => {
            const f = ctx.createBiquadFilter();
            f.type = type;
            f.frequency.value = freq;
            f.Q.value = q;
            return f;
        };

        const now = ctx.currentTime;

        // ===========================================================
        // PHASE 1: 太虚禅息 (0 ~ 20s)
        // 两个低频正弦波形成五度空洞和声，极其宁静
        // ===========================================================
        const droneFreqs = [65.41, 98.00]; // C2, G2 空五度
        droneFreqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.022, now + 4 + i * 2);
            gain.gain.setValueAtTime(0.022, now + 48);
            gain.gain.linearRampToValueAtTime(0, now + 55);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 58);
            this.bgOscs.push(osc);
            this.bgGains.push(gain);
        });

        // 冥想钟鸣：定期微弱敲击
        [5, 12, 19].forEach(t => {
            playNote(220, 'triangle', now + t, 3.5, 0.028);
            playNote(330, 'triangle', now + t + 0.6, 2.5, 0.012);
        });

        // ===========================================================
        // PHASE 2: 星盘运转 (20 ~ 50s)
        // 低音脉冲 + 中频弦乐铺垫，逐渐丰满
        // ===========================================================

        // 低音脉冲 (每2秒一拍，4拍循环)
        const bassNotes = [65.41, 65.41, 98.00, 87.31]; // C2 C2 G2 F2
        for (let beat = 0; beat < 15; beat++) {
            const t = now + 20 + beat * 2;
            const freq = bassNotes[beat % bassNotes.length];
            const vol = 0.01 + Math.min(beat * 0.002, 0.025);
            playNote(freq, 'sawtooth', t, 1.6, vol);
        }

        // 中频弦鸣：和弦扩展 Am → F → C → G
        const chordSeq = [
            [220.00, 261.63, 329.63], // Am
            [174.61, 220.00, 261.63], // F
            [261.63, 329.63, 392.00], // C
            [196.00, 246.94, 293.66], // G
        ];
        for (let bar = 0; bar < 7; bar++) {
            const chord = chordSeq[bar % chordSeq.length];
            const barStart = now + 22 + bar * 4;
            const fadeVol = 0.008 + Math.min(bar * 0.0015, 0.015);
            chord.forEach((f, ci) => {
                playNote(f, 'sine', barStart + ci * 0.06, 3.8, fadeVol);
                // 高八度叠加轻微谐波
                playNote(f * 2, 'triangle', barStart + ci * 0.06, 3.6, fadeVol * 0.3);
            });
        }

        // 悬疑弦线 (上升滑音, 让人感到天机将动)
        (() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            const filter = makeFilter('lowpass', 600, 2);
            osc.frequency.setValueAtTime(196, now + 40);
            osc.frequency.linearRampToValueAtTime(392, now + 50);
            gain.gain.setValueAtTime(0, now + 40);
            gain.gain.linearRampToValueAtTime(0.014, now + 43);
            gain.gain.linearRampToValueAtTime(0, now + 50);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            osc.start(now + 40);
            osc.stop(now + 51);
        })();

        // ===========================================================
        // PHASE 3: 天机开启 (50s ~)
        // 高频琶音 + 鼓击节律，全面激昂
        // ===========================================================

        // 鼓击：Kick (低频冲击) + Snare (噪声敲击)
        const playKick = (t) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(t);
            osc.stop(t + 0.35);
        };

        const playSnare = (t) => {
            const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            const src = ctx.createBufferSource();
            const gain = ctx.createGain();
            const filter = makeFilter('bandpass', 2500, 1.5);
            src.buffer = buf;
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            src.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            src.start(t);
        };

        // 4/4节律: Kick 在 1,3拍, Snare 在 2,4拍
        const bpm = 88;
        const beat = 60 / bpm;
        const phase3Start = now + 50;
        for (let i = 0; i < 32; i++) {
            const t = phase3Start + i * beat;
            if (i % 2 === 0) playKick(t);
            else playSnare(t);
        }

        // 琶音旋律 (上行级进，越来越高亢)
        const arpNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5];
        for (let rep = 0; rep < 12; rep++) {
            const startT = phase3Start + rep * (beat * 2);
            const noteIdx = Math.min(rep, arpNotes.length - 1);
            const vol = 0.015 + rep * 0.002;
            playNote(arpNotes[noteIdx], 'triangle', startT, beat * 1.8, Math.min(vol, 0.04));
            // 和声下方三度
            if (rep > 2) {
                const harmony = arpNotes[Math.max(noteIdx - 2, 0)];
                playNote(harmony, 'sine', startT + 0.03, beat * 1.6, Math.min(vol * 0.6, 0.025));
            }
        }

        // 整体 Master 音量: Phase3 期间继续微微推高
        masterGain.gain.setValueAtTime(0.7, phase3Start);
        masterGain.gain.linearRampToValueAtTime(1.0, phase3Start + 20);

        // 循环: 约90s后重新从Phase1开始（无缝循环）
        this._bgmRestartTimer = setTimeout(() => {
            if (this.enabled && this.ctx && this.ctx.state === 'running') {
                this.startAmbientHum();
            }
        }, 92000);
    }
}

const audio = new AudioController();

// UI 流程控制与状态
const App = {
    // 画符模块数据
    drawing: {
        canvas: null,
        ctx: null,
        isDrawing: false,
        points: [], // 保存画符的所有坐标点，用于崩解粒子
        lastX: 0,
        lastY: 0,
        energy: 0,
        colors: {
            cyan: '#00f0ff',
            pink: '#ff3c00',
            gold: '#ffd700'
        },
        activeColor: '#ff3c00',
        stats: {
            speed: 50,
            count: 0,
            area: 0,
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
            totalLength: 0,
            startTime: 0
        }
    },

    // 算卦投掷模块数据
    divination: {
        castCount: 0,   // 当前投掷次数 (最大6)
        casts: [],      // 六爻投掷结果记录: 6=老阴, 7=少阳, 8=少阴, 9=老阳
        isCasting: false
    },

    particleSystem: null,

    init() {
        // 初始化 Canvas 粒子系统
        this.particleSystem = new window.CyberParticles.ParticleSystem('particle-canvas');
        this.particleSystem.start();

        this.initDOM();
        this.initDrawingCanvas();
    },

    initDOM() {
        // 声音控制
        const audioBtn = document.getElementById('audio-toggle-btn');
        audioBtn.addEventListener('click', () => {
            const active = audio.toggle();
            audioBtn.textContent = active ? '🔊 气场振动' : '🔇 静音法界';
            audioBtn.style.color = active ? 'var(--neon-blue)' : 'var(--text-muted)';
            audioBtn.style.borderColor = active ? 'var(--neon-blue)' : 'var(--border-color)';
        });

        // 启阵按钮与中央太极核心
        const enterBtn = document.getElementById('btn-enter');
        const taijiBtn = document.getElementById('taiji-core-btn');
        const startAction = () => {
            audio.init();
            audio.playBell(293.66); // D4 调起磬
            this.switchScreen('screen-drawing');
        };
        if (enterBtn) enterBtn.addEventListener('click', startAction);
        if (taijiBtn) taijiBtn.addEventListener('click', startAction);


        // 画符颜色切换
        const colorBtns = document.querySelectorAll('.brush-color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.drawing.activeColor = this.drawing.colors[btn.dataset.color];
                audio.playDrawingTick(0.8);
            });
        });

        // 画符清空
        document.getElementById('btn-clear').addEventListener('click', () => {
            this.clearDrawingCanvas();
        });

        // 符成按钮
        const btnConfirmDrawing = document.getElementById('btn-confirm-drawing');
        if (btnConfirmDrawing) {
            btnConfirmDrawing.addEventListener('click', () => {
                this.confirmDrawing();
            });
        }

        // 注入意念，起卦
        const btnCastInit = document.getElementById('btn-cast-init');
        if (btnCastInit) {
            btnCastInit.addEventListener('click', () => {
                this.startDivinationCasting();
            });
        }

        // 硬币起卦投掷按钮
        document.getElementById('btn-cast-coin').addEventListener('click', () => {
            this.castCoins();
        });

        // 结缘完成，重置系统
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.resetSystem();
        });
    },

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');

        // 同步当前屏幕给粒子系统，控制3D球体渲染
        if (this.particleSystem) {
            this.particleSystem.activeScreenId = screenId;
        }

        // 特殊屏幕触发特定动作
        if (screenId === 'screen-divination') {
            audio.playBell(329.63); // E4 钟鸣
        }
    },

    // ==========================================
    // 画符核心逻辑
    // ==========================================
    initDrawingCanvas() {
        const cContainer = document.querySelector('.canvas-wrapper');
        const c = document.getElementById('drawing-canvas');
        this.drawing.canvas = c;
        this.drawing.ctx = c.getContext('2d');

        // 设置画布物理尺寸
        const resizeCanvas = () => {
            c.width = cContainer.clientWidth;
            c.height = cContainer.clientHeight;
            // 重新绘制已有笔墨（若有需要，在此省略以简化）
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 绘图动作绑定 (支持 mouse 和 touch)
        const getPos = (e) => {
            const rect = c.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDraw = (e) => {
            e.preventDefault();
            this.drawing.isDrawing = true;
            const pos = getPos(e);
            this.drawing.lastX = pos.x;
            this.drawing.lastY = pos.y;
            this.drawing.points.push(pos);

            // 画布提示消除
            const hint = document.getElementById('canvas-hint');
            if (hint) hint.style.opacity = 0;

            // 绘图时间起始
            if (this.drawing.stats.startTime === 0) {
                this.drawing.stats.startTime = Date.now();
            }
            this.drawing.stats.count++; // 笔画数增加
        };

        const draw = (e) => {
            if (!this.drawing.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            
            const ctx = this.drawing.ctx;
            ctx.beginPath();
            ctx.moveTo(this.drawing.lastX, this.drawing.lastY);
            ctx.lineTo(pos.x, pos.y);

            // 毛笔感官：线条越快越细，模拟洇染
            const dist = Math.hypot(pos.x - this.drawing.lastX, pos.y - this.drawing.lastY);
            const lineWidth = Math.max(4, 12 - (dist / 1.5));

            // 毛笔水墨电荧光特效果
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = this.drawing.activeColor;
            ctx.lineWidth = lineWidth;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.drawing.activeColor;
            ctx.stroke();

            // 在画布留下轨迹的同时，向粒子系统喷射洇染粒子
            this.particleSystem.addBrushStroke(
                pos.x + this.drawing.canvas.getBoundingClientRect().left,
                pos.y + this.drawing.canvas.getBoundingClientRect().top,
                this.drawing.activeColor
            );

            // 音效微滴答
            audio.playDrawingTick(dist / 25);

            // 统计累加
            this.drawing.stats.totalLength += dist;
            this.drawing.points.push(pos);
            this.updateEnergy(dist);

            // 包围框统计
            if (pos.x < this.drawing.stats.minX) this.drawing.stats.minX = pos.x;
            if (pos.x > this.drawing.stats.maxX) this.drawing.stats.maxX = pos.x;
            if (pos.y < this.drawing.stats.minY) this.drawing.stats.minY = pos.y;
            if (pos.y > this.drawing.stats.maxY) this.drawing.stats.maxY = pos.y;

            this.drawing.lastX = pos.x;
            this.drawing.lastY = pos.y;
        };

        const stopDraw = () => {
            this.drawing.isDrawing = false;
        };

        c.addEventListener('mousedown', startDraw);
        c.addEventListener('mousemove', draw);
        c.addEventListener('mouseup', stopDraw);
        c.addEventListener('mouseleave', stopDraw);

        c.addEventListener('touchstart', startDraw, { passive: false });
        c.addEventListener('touchmove', draw, { passive: false });
        c.addEventListener('touchend', stopDraw);
    },

    updateEnergy(dist) {
        this.drawing.energy += dist * 0.12;
        if (this.drawing.energy > 100) this.drawing.energy = 100;
    },

    clearDrawingCanvas() {
        const c = this.drawing.canvas;
        this.drawing.ctx.clearRect(0, 0, c.width, c.height);
        this.drawing.points = [];
        this.drawing.energy = 0;
        
        const hint = document.getElementById('canvas-hint');
        if (hint) hint.style.opacity = 1;

        const btnConfirm = document.getElementById('btn-confirm-drawing');
        if (btnConfirm) {
            btnConfirm.textContent = '✓ 符成';
            btnConfirm.style.color = 'var(--neon-pink)';
        }

        // 重置绘图统计
        this.drawing.stats = {
            speed: 50,
            count: 0,
            area: 0,
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
            totalLength: 0,
            startTime: 0
        };
    },

    // 崩解符咒，化作粒子漩涡
    dissolveTalisman() {
        if (this.drawing.points.length === 0) return;

        const rect = this.drawing.canvas.getBoundingClientRect();
        
        // 计算物理屏幕绝对坐标点集
        const absolutePoints = this.drawing.points.map(pt => ({
            x: pt.x + rect.left,
            y: pt.y + rect.top
        }));

        // 计算画符统计信息以用于AI解卦
        const durationSec = (Date.now() - this.drawing.stats.startTime) / 1000;
        const rawSpeed = durationSec > 0 ? this.drawing.stats.totalLength / durationSec : 50;
        this.drawing.stats.speed = Math.min(100, Math.max(10, rawSpeed / 8));
        
        if (this.drawing.stats.maxX > -Infinity) {
            const w = this.drawing.stats.maxX - this.drawing.stats.minX;
            const h = this.drawing.stats.maxY - this.drawing.stats.minY;
            const scrollArea = this.drawing.canvas.width * this.drawing.canvas.height;
            this.drawing.stats.area = Math.min(100, Math.max(5, ((w * h) / scrollArea) * 100));
        } else {
            this.drawing.stats.area = 25;
        }

        // 清除 Canvas，将痕迹以崩解粒子的形式展示
        this.drawing.ctx.clearRect(0, 0, this.drawing.canvas.width, this.drawing.canvas.height);
        
        const targetX = window.innerWidth / 2;
        const targetY = window.innerHeight / 2;

        this.particleSystem.dissolvePoints(
            absolutePoints, 
            this.drawing.activeColor, 
            targetX, 
            targetY
        );

        // 播放风暴汇聚音效
        audio.playDissolveWind();
    },

    // 符成确定
    confirmDrawing() {
        if (this.drawing.points.length === 0) return;
        this.dissolveTalisman();
        this.drawing.points = []; // 崩解后清空，防二次触发

        const btnConfirm = document.getElementById('btn-confirm-drawing');
        if (btnConfirm) {
            btnConfirm.textContent = '✓ 已成';
            btnConfirm.style.color = 'var(--neon-blue)';
        }
    },

    // 确认起卦并切换界面
    startDivinationCasting() {
        if (this.drawing.points.length > 0) {
            this.dissolveTalisman();
            this.drawing.points = [];
            
            // 播放粒子风暴后切屏
            setTimeout(() => {
                this.switchScreen('screen-divination');
            }, 1100);
        } else {
            this.switchScreen('screen-divination');
        }
    },

    // ==========================================
    // 投掷铜钱仪式
    // ==========================================
    castCoins() {
        if (this.divination.isCasting || this.divination.castCount >= 6) return;
        
        this.divination.isCasting = true;
        const btn = document.getElementById('btn-cast-coin');
        btn.setAttribute('disabled', 'true');

        // 音效与投币冲击粒子爆发
        audio.playCoinClink();
        const rect = document.querySelector('.coins-row').getBoundingClientRect();
        this.particleSystem.addExplosion(rect.left + rect.width/2, rect.top + rect.height/2, 'var(--neon-gold)', 25);

        // 3D 旋转硬币样式
        const coins = document.querySelectorAll('.coin');
        coins.forEach(c => c.classList.add('spin'));

        // 生成3枚硬币的随机结果 (0为满文/背/阴，1为汉字/面/阳)
        const flips = [
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0
        ];

        // 1.2s 旋转后展示结果
        setTimeout(() => {
            coins.forEach((c, idx) => {
                c.classList.remove('spin');
                // 1为正面，0为背面。正面朝上不旋转(0deg)，背面朝上旋转180deg
                const targetRot = flips[idx] === 1 ? 'rotateY(0deg)' : 'rotateY(180deg)';
                c.style.transform = targetRot;
            });

            // 统计此轮爻性
            // 汉字正面(阳)=3, 满文背面(阴)=2
            // 3个阳(1+1+1) -> 9 (老阳)
            // 2个阳1个阴 (1+1+0) -> 8 (少阴)
            // 1个阳2个阴 (1+0+0) -> 7 (少阳)
            // 3个阴(0+0+0) -> 6 (老阴)
            const sumVal = flips.reduce((a, b) => a + b, 0);
            let yaoType = 8; // 默认
            if (sumVal === 3) yaoType = 9;      // 老阳
            else if (sumVal === 2) yaoType = 8; // 少阴
            else if (sumVal === 1) yaoType = 7; // 少阳
            else if (sumVal === 0) yaoType = 6; // 老阴

            this.divination.casts.push(yaoType);
            this.divination.castCount++;

            // 绘制生成的爻线
            this.renderYaoLine(this.divination.castCount, yaoType);

            // 更新 HUD 计数
            document.getElementById('cast-count').textContent = this.divination.castCount;

            this.divination.isCasting = false;
            
            if (this.divination.castCount < 6) {
                btn.removeAttribute('disabled');
            } else {
                btn.textContent = '天机已现，解卦中...';
                // 6爻完毕，短暂延时后进入解卦终局
                setTimeout(() => {
                    this.finishDivination();
                }, 1500);
            }
        }, 1200);
    },

    renderYaoLine(lineIdx, type) {
        const list = document.getElementById('yao-lines');
        const item = document.createElement('div');
        item.className = 'yao-line-wrapper';

        // 爻名 labels (初爻、二爻...上爻)
        const labels = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
        let labelHTML = `<div class="yao-line-label">${labels[lineIdx - 1]}</div>`;
        
        let blockHTML = '';
        let markerHTML = '';

        if (type === 7 || type === 9) {
            // 阳爻或老阳 (一条整线)
            blockHTML = `<div class="yao-line-blocks"><div class="yao-block-yang"></div></div>`;
        } else {
            // 阴爻或老阴 (分段线)
            blockHTML = `<div class="yao-line-blocks">
                <div class="yao-block-yin-segment"></div>
                <div class="yao-block-yin-segment"></div>
            </div>`;
        }

        if (type === 9) {
            markerHTML = `<div class="moving-yao-marker">○ (动)</div>`;
        } else if (type === 6) {
            markerHTML = `<div class="moving-yao-marker">✗ (动)</div>`;
        }

        item.innerHTML = labelHTML + blockHTML + markerHTML;
        list.appendChild(item);

        // 播放爻线生成音效
        audio.playBell(330 + lineIdx * 40, 1.0);
    },

    // ==========================================
    // 终局算卦报告生成
    // ==========================================
    finishDivination() {
        // 根据 casts 六个爻计算本卦和变卦二进制串
        // 爻线是从底往上生成的，casts 数组中 casts[0] 为初爻，casts[5] 为上爻
        // 二进制串：1=阳/少阳/老阳，0=阴/少阴/老阴
        let hexCode = "";
        let changeCode = "";

        this.divination.casts.forEach(type => {
            // 本卦二进制爻性
            if (type === 7 || type === 9) hexCode += "1";
            else hexCode += "0";

            // 变卦二进制爻性 (老阳9变阴0，老阴6变阳1，其它不变)
            if (type === 9) changeCode += "0";
            else if (type === 6) changeCode += "1";
            else if (type === 7) changeCode += "1";
            else changeCode += "0";
        });

        // 获取 AI 解卦文本
        const strokeData = {
            speed: this.drawing.stats.speed,
            count: this.drawing.stats.count,
            area: this.drawing.stats.area
        };
        const result = window.CyberIChing.generateAICyberOracle(hexCode, changeCode, strokeData);

        // 渲染左侧卡片信息
        document.getElementById('card-hex-name').textContent = result.hexName;
        document.getElementById('card-hex-cyber').textContent = result.cyberTitle;
        document.getElementById('card-hex-symbol').textContent = result.hexSymbol;
        document.getElementById('card-judgment-text').textContent = result.judgment;

        // 渲染卡片右侧的六爻线（克隆一份展示在卡片中央）
        const cardLines = document.getElementById('card-lines');
        cardLines.innerHTML = document.getElementById('yao-lines').innerHTML;

        // 切屏
        this.switchScreen('screen-result');
        audio.playBell(392.00, 3.5); // G4 磬声，震荡人心

        // 启动右侧控制台的 AI 打字机
        this.startAITyping(result);
    },

    startAITyping(result) {
        const consoleBody = document.getElementById('console-text-body');
        consoleBody.innerHTML = ''; // 清空

        // 结构化需要输出的各个模块
        const sections = [
            { id: 'sec-talisman', title: '符咒念力场共振分析', text: result.talismanAnalysis },
            { id: 'sec-hex', title: '天机卦象精解', text: result.hexAnalysis },
            { id: 'sec-career', title: '赛博事业/学业宏图', text: result.career },
            { id: 'sec-love', title: '信息流情缘/社交同频', text: result.love },
            { id: 'sec-self', title: '心性修剪/行止算法', text: result.self }
        ];

        let secIdx = 0;

        const typeSection = () => {
            if (secIdx >= sections.length) {
                // 打字完成，追加一句话
                const finishText = document.createElement('p');
                finishText.style.color = 'var(--neon-gold)';
                finishText.style.marginTop = '20px';
                finishText.style.fontStyle = 'italic';
                finishText.textContent = '—— 天机已泄，凝神结缘。';
                consoleBody.appendChild(finishText);
                consoleBody.scrollTop = consoleBody.scrollHeight;
                return;
            }

            const sec = sections[secIdx];
            
            // 创建节点
            const secNode = document.createElement('div');
            secNode.className = 'ai-section';
            secNode.innerHTML = `
                <div class="ai-sec-title">${sec.title}</div>
                <div class="ai-sec-content" id="${sec.id}-content"></div>
            `;
            consoleBody.appendChild(secNode);
            consoleBody.scrollTop = consoleBody.scrollHeight;

            // 平滑进入
            setTimeout(() => secNode.classList.add('visible'), 50);

            // 逐字打字
            const contentNode = document.getElementById(`${sec.id}-content`);
            let charIdx = 0;
            const fullText = sec.text;

            // 建立打字机光标
            const cursor = document.createElement('span');
            cursor.className = 'typer-cursor';
            contentNode.appendChild(cursor);

            const typeChar = () => {
                if (charIdx < fullText.length) {
                    const char = fullText[charIdx++];
                    
                    // 插入字，并始终把光标放最后
                    if (char === '\n') {
                        cursor.before(document.createElement('br'));
                    } else {
                        cursor.before(char);
                    }

                    // 播放微弱打字滴答声 (只在部分字数发声，防刺耳)
                    if (charIdx % 2 === 0) {
                        audio.playTypeTick();
                    }

                    // 自动滚屏
                    consoleBody.scrollTop = consoleBody.scrollHeight;

                    setTimeout(typeChar, Math.random() * 15 + 10);
                } else {
                    // 完成当前小节，移除光标，进入下一小节
                    cursor.remove();
                    secIdx++;
                    setTimeout(typeSection, 400); // 间隔一会儿打下一段
                }
            };

            setTimeout(typeChar, 100);
        };

        // 稍微缓冲后启动打字机
        setTimeout(typeSection, 800);
    },

    // ==========================================
    // 重置系统
    // ==========================================
    resetSystem() {
        // 重置画符
        this.clearDrawingCanvas();

        // 重置爻数与六爻线
        this.divination = {
            castCount: 0,
            casts: [],
            isCasting: false
        };
        document.getElementById('yao-lines').innerHTML = '';
        document.getElementById('cast-count').textContent = '0';
        document.getElementById('btn-cast-coin').textContent = '掷铜钱（投三次）';
        document.getElementById('btn-cast-coin').removeAttribute('disabled');

        // 切回主界面
        this.switchScreen('screen-intro');
        audio.playBell(196.00); // 低音降钟声
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
