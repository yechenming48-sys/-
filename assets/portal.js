(function () {
    const canvas = document.getElementById('bg-canvas');
    const spotlight = document.getElementById('spotlight');
    const runeLayer = document.getElementById('rune-layer');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let stars = [];
    let lines = [];
    let time = 0;

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initScene();
    }

    function initScene() {
        const count = Math.floor((width * height) / 2800);
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: rand(0.35, 1.8),
            alpha: rand(0.25, 0.95),
            speed: rand(0.0004, 0.0012),
            phase: Math.random() * Math.PI * 2,
            hue: Math.random() > 0.82 ? rand(200, 280) : null
        }));

        lines = [];
        for (let i = 0; i < Math.min(18, Math.floor(count / 12)); i++) {
            const a = stars[Math.floor(Math.random() * stars.length)];
            const b = stars[Math.floor(Math.random() * stars.length)];
            if (!a || !b) continue;
            lines.push({ a, b, alpha: rand(0.04, 0.12) });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        time += 0.016;

        lines.forEach((line) => {
            const dist = Math.hypot(line.a.x - line.b.x, line.a.y - line.b.y);
            if (dist > 180) return;
            ctx.strokeStyle = `rgba(120, 180, 255, ${line.alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(line.a.x, line.a.y);
            ctx.lineTo(line.b.x, line.b.y);
            ctx.stroke();
        });

        stars.forEach((star) => {
            const alpha = star.alpha * (0.55 + 0.45 * Math.sin(time * star.speed * 1000 + star.phase));
            ctx.save();
            ctx.globalAlpha = alpha;
            if (star.hue) {
                const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 3);
                gradient.addColorStop(0, `hsla(${star.hue}, 85%, 82%, 0.95)`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = '#ffffff';
            }
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();

    if (runeLayer) {
        const runes = ['☯', '☽', '☾', '✦', '乾', '坤', '坎', '離', '震', '巽', '艮', '兌', '☰', '☱', '☲', '☳'];
        runes.forEach((rune, index) => {
            const el = document.createElement('span');
            el.className = 'bg-rune';
            el.textContent = rune;
            el.style.left = `${(index * 6.2 + rand(0, 8)) % 98}%`;
            el.style.fontSize = `${rand(0.9, 2.1)}rem`;
            el.style.animationDuration = `${rand(18, 34)}s`;
            el.style.animationDelay = `${-rand(0, 30)}s`;
            runeLayer.appendChild(el);
        });
    }

    document.addEventListener('pointermove', (event) => {
        if (spotlight) {
            document.documentElement.style.setProperty('--mx', `${event.clientX}px`);
            document.documentElement.style.setProperty('--my', `${event.clientY}px`);
        }

        document.querySelectorAll('.portal-card').forEach((card) => {
            const rect = card.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--cx', `${x}%`);
            card.style.setProperty('--cy', `${y}%`);
        });
    });

    document.querySelectorAll('.portal-card').forEach((card) => {
        card.addEventListener('mousemove', (event) => {
            const rect = card.getBoundingClientRect();
            const dx = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const dy = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
            card.style.transform = `translateY(-8px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
})();
