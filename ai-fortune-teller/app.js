/**
 * Star Orbit Oracle - Main Application Logic
 * Integrates zodiac logic, procedural tarot canvas drawing,
 * interactive screens, and typewriter effect for AI Oracle.
 */

// 1. Tarot Cards Dataset
const TAROT_DECK = [
    {
        id: "fool",
        name: "愚者 The Fool",
        upright: {
            meaning: "踏上新旅程、无限潜力、自发性、信念与纯真。",
            advice: "现在的你可以抛开过去的顾虑，像愚者一样怀揣纯真的信念踏上一段全新的旅程，即使前方未知，星轨也护佑着你的第一步。"
        },
        reversed: {
            meaning: "鲁莽、不负责任、迟疑不决、缺乏远见。",
            advice: "你可能有些过于盲目乐观或行动草率。宇宙提醒你在迈出下一步前，先看清脚下的悬崖，避免因冲动付出不必要的代价。"
        },
        drawIcon: (ctx, w, h) => {
            // Path, sun, and cliff
            drawMysticStars(ctx, w, h, 15);
            // Cliff
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            ctx.beginPath();
            ctx.moveTo(0, h * 0.7);
            ctx.lineTo(w * 0.5, h * 0.7);
            ctx.lineTo(w * 0.3, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();
            // Sun
            drawNeonCircle(ctx, w * 0.8, h * 0.3, 20, "#f39c12", "rgba(243,156,18,0.4)");
            // Sunrays
            drawSunrays(ctx, w * 0.8, h * 0.3, 20, 8, "#f39c12");
        }
    },
    {
        id: "magician",
        name: "魔术师 The Magician",
        upright: {
            meaning: "创造力、意志力、专注力、转化万物的力量。",
            advice: "你拥有达成目标所需的所有资源与才华。现在是专注意志、将心中构想转化为现实的黄金时刻，AI能感受到你体内正涌动着创造的磁场。"
        },
        reversed: {
            meaning: "意图不轨、怀才不遇、虚有其表、能量停滞。",
            advice: "注意提防身边华而不实的诱惑，或者审视自己是否在逃避行动。你并不缺少才华，只是缺少脚踏实地将能量聚焦的定力。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 10);
            // Infinity symbol
            ctx.strokeStyle = "#00f2fe";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00f2fe";
            ctx.lineWidth = 3;
            ctx.beginPath();
            const cx = w / 2, cy = h * 0.45;
            ctx.moveTo(cx, cy);
            // Left loop
            ctx.bezierCurveTo(cx - 30, cy - 25, cx - 60, cy - 25, cx - 60, cy);
            ctx.bezierCurveTo(cx - 60, cy + 25, cx - 30, cy + 25, cx, cy);
            // Right loop
            ctx.bezierCurveTo(cx + 30, cy - 25, cx + 60, cy - 25, cx + 60, cy);
            ctx.bezierCurveTo(cx + 60, cy + 25, cx + 30, cy + 25, cx, cy);
            ctx.stroke();
            ctx.shadowBlur = 0;
            // 4 tools glow points
            drawNeonCircle(ctx, cx, cy - 50, 4, "#ec38bc", "rgba(236,56,188,0.4)");
            drawNeonCircle(ctx, cx - 50, cy + 40, 4, "#ec38bc", "rgba(236,56,188,0.4)");
            drawNeonCircle(ctx, cx + 50, cy + 40, 4, "#ec38bc", "rgba(236,56,188,0.4)");
        }
    },
    {
        id: "priestess",
        name: "女祭司 The High Priestess",
        upright: {
            meaning: "直觉、潜意识、神秘、内省、以静制动。",
            advice: "现在的你不需要急于寻找外在的答案。静坐下来，聆听你内心的声音。你的直觉正处于最敏锐的状态，神谕与潜意识正向你低语。"
        },
        reversed: {
            meaning: "浮躁表面、压抑直觉、浅薄、隐藏的不安。",
            advice: "你可能在过度关注理性和外界的声音，而忽略了潜意识发出的预警。多留些时间独处，拂去心灵上的浮躁，方能看清真相。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 10);
            // Two pillars
            ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
            ctx.fillRect(w * 0.25, h * 0.25, 12, h * 0.5); // Pillar J
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.fillRect(w * 0.68, h * 0.25, 12, h * 0.5); // Pillar B
            
            // Crescent Moon in middle
            ctx.strokeStyle = "#fff";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w / 2, h * 0.45, 18, -Math.PI/2, Math.PI/2, false);
            ctx.arc(w / 2 + 8, h * 0.45, 18, Math.PI/2, -Math.PI/2, true);
            ctx.closePath();
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    },
    {
        id: "empress",
        name: "女皇 The Empress",
        upright: {
            meaning: "丰收、母爱、感官享受、自然孕育、物质富足。",
            advice: "当前代表着孕育与收获的高峰期。无论是感情的滋养、财富的增长，还是创意的构思，都会在宇宙的关怀下茁壮成长，尽情享受生活的丰饶吧。"
        },
        reversed: {
            meaning: "创造力受阻、过度依赖、荒芜、能量透支。",
            advice: "你可能在一段关系或项目里投入了过多的精力而导致自我透支。是时候放慢脚步，先滋养自己的身心，大地之母无法在干涸的土壤里播种。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 12);
            // Shield with eagle (styled abstractly as heart star)
            drawNeonCircle(ctx, w/2, h*0.42, 22, "#ec38bc", "rgba(236,56,188,0.5)");
            // Crown stars
            for (let i = 0; i < 7; i++) {
                const angle = -Math.PI * 0.2 - (i * Math.PI * 0.1);
                const sx = w/2 + Math.cos(angle) * 35;
                const sy = h*0.42 + Math.sin(angle) * 35;
                drawMiniStar(ctx, sx, sy, 3, "#f39c12");
            }
        }
    },
    {
        id: "emperor",
        name: "皇帝 The Emperor",
        upright: {
            meaning: "权威、控制、秩序、坚毅、长远规划与基石。",
            advice: "现在的你需要发挥理智与决断力。建立稳固的秩序、制定清晰合理的规则，以领袖的姿态去主导当前的局势，星轨正赋予你不可动摇的威信。"
        },
        reversed: {
            meaning: "暴政、缺乏自控、优柔寡断、掌控欲过强。",
            advice: "注意避免因执念于绝对的控制而导致关系紧张。在职场或人际中，以权压人只会招致反弹，真正强大的统御力来源于宽容与自律。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 8);
            // Throne and Orb symbols (Abstract geometric structure)
            ctx.strokeStyle = "#e2dff5";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(w * 0.3, h * 0.3, w * 0.4, h * 0.4);
            // Golden Ankh Cross in center
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#f39c12";
            ctx.beginPath();
            ctx.arc(w/2, h*0.42, 8, 0, Math.PI * 2);
            ctx.moveTo(w/2, h*0.5);
            ctx.lineTo(w/2, h*0.62);
            ctx.moveTo(w/2 - 10, h*0.54);
            ctx.lineTo(w/2 + 10, h*0.54);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    },
    {
        id: "lovers",
        name: "恋人 The Lovers",
        upright: {
            meaning: "和谐、完美契合、选择、相互吸引、精神契约。",
            advice: "这预示着你生命中将出现深刻的心灵共鸣。不仅代表美好的亲密关系，也代表你需要面临一次遵从内心的重要选择。选择那个能让你灵魂感到平静的方向。"
        },
        reversed: {
            meaning: "不和谐、关系错位、错误的决策、内心冲突。",
            advice: "感情中可能存在沟通隔阂或价值观对立；又或是你的某个决策并非发自内心。停下来检查你真正渴望的是什么，莫因外界眼光委曲求全。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 15);
            // Dual hearts overlapping
            ctx.strokeStyle = "#ec38bc";
            ctx.fillStyle = "rgba(236,56,188,0.15)";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ec38bc";
            
            // Draw heart 1
            drawHeart(ctx, w * 0.42, h * 0.45, 18);
            // Draw heart 2
            ctx.strokeStyle = "#00f2fe";
            ctx.fillStyle = "rgba(0,242,254,0.1)";
            ctx.shadowColor = "#00f2fe";
            drawHeart(ctx, w * 0.58, h * 0.45, 18);
            ctx.shadowBlur = 0;
        }
    },
    {
        id: "chariot",
        name: "战车 The Chariot",
        upright: {
            meaning: "意志力、胜利、克服障碍、专注执着、破浪前行。",
            advice: "不论当前你正经历何种风浪或竞争，紧紧握住你命运的缰绳！以无比坚毅的斗志去驾驭冲突的两股力量，胜利必将属于坚忍不拔的你。"
        },
        reversed: {
            meaning: "失去方向、失控、挫败、过度激进。",
            advice: "你的步伐有些凌乱，或者在盲目横冲直撞。当心因情绪失控而脱轨。现在最紧要的是踩下刹车，重新理清前进的目的地。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 10);
            // Winged emblem and shield
            ctx.strokeStyle = "#00f2fe";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w * 0.25, h * 0.4);
            ctx.lineTo(w * 0.35, h * 0.45);
            ctx.lineTo(w * 0.5, h * 0.35);
            ctx.lineTo(w * 0.65, h * 0.45);
            ctx.lineTo(w * 0.75, h * 0.4);
            ctx.stroke();
            
            // Center shield
            drawNeonCircle(ctx, w/2, h*0.5, 15, "#fff", "rgba(255,255,255,0.3)");
        }
    },
    {
        id: "wheel",
        name: "命运之轮 Wheel of Fortune",
        upright: {
            meaning: "命运转折、好运、业力循环、契机骤现、顺应变化。",
            advice: "一扇崭新的门正在向你敞开。周遭的局势正在发生戏剧化的重组，请顺应这一波宇宙潮汐的涌动，欣然接受变化，好运与机遇正悄然降临。"
        },
        reversed: {
            meaning: "厄运流转、阻碍、不甘被动、打破负面循环。",
            advice: "你可能感觉身处低谷，或者抗拒不可逆转的变革。宇宙提醒你：运势如同潮汐，起伏是宿命。顺势而为，积蓄力量，旧的循环终将被打破。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 8);
            // Concentric magical wheel
            const cx = w/2, cy = h*0.45;
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#f39c12";
            
            ctx.beginPath();
            ctx.arc(cx, cy, 32, 0, Math.PI*2);
            ctx.arc(cx, cy, 20, 0, Math.PI*2);
            ctx.stroke();
            
            // Spokes
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                ctx.moveTo(cx + Math.cos(angle)*8, cy + Math.sin(angle)*8);
                ctx.lineTo(cx + Math.cos(angle)*32, cy + Math.sin(angle)*32);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    },
    {
        id: "star",
        name: "星星 The Star",
        upright: {
            meaning: "希望、信念、洗礼、宁静与灵感、星轨指引。",
            advice: "经历风暴过后，星空终归宁静。这张卡片带来了无上的希望与治愈的能量。保持乐观，你的灵感与才华正得到神圣星轨的温柔庇护与滋养。"
        },
        reversed: {
            meaning: "失望、悲观、灵感枯竭、不切实际的幻想。",
            advice: "你可能陷入了自我怀疑或消极情绪的迷雾中，看不见远处的星光。试着抖落身上的疲惫，重新燃起心中的微光，黑夜终究会过去。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 20);
            // Giant central 8-pointed star
            const cx = w/2, cy = h*0.42;
            drawGlowStar8(ctx, cx, cy, 25, 10, "#00f2fe");
        }
    },
    {
        id: "sun",
        name: "太阳 The Sun",
        upright: {
            meaning: "成功、喜悦、生命力、光明坦途、真理昭然。",
            advice: "最耀眼的光芒笼罩着你！无论你询问什么，答案都充满了无限的活力与积极的肯定。现在的你尽可以展现自我，散发你的光与热，温暖身边的每一个人。"
        },
        reversed: {
            meaning: "短暂的阴霾、虚度光阴、傲慢自负、热情褪去。",
            advice: "好运虽在，但暂时被一丝阴云遮挡。或许是你近来有些张扬自负，引人侧目。保持谦逊，踏实前行，太阳的炽热终会驱散迷雾。"
        },
        drawIcon: (ctx, w, h) => {
            drawMysticStars(ctx, w, h, 8);
            const cx = w/2, cy = h*0.42;
            drawNeonCircle(ctx, cx, cy, 28, "#f39c12", "rgba(243,156,18,0.5)");
            drawSunrays(ctx, cx, cy, 28, 12, "#f39c12");
        }
    }
];

// Helper functions for canvas tarot designs
function drawMysticStars(ctx, w, h, count) {
    ctx.fillStyle = "rgba(253, 239, 249, 0.4)";
    for (let i = 0; i < count; i++) {
        const x = Math.random() * (w - 20) + 10;
        const y = Math.random() * (h - 20) + 10;
        ctx.fillRect(x, y, 1.2, 1.2);
    }
}

function drawMiniStar(ctx, cx, cy, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size*0.4, cy - size*0.4);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx + size*0.4, cy + size*0.4);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size*0.4, cy + size*0.4);
    ctx.lineTo(cx - size, cy);
    ctx.lineTo(cx - size*0.4, cy - size*0.4);
    ctx.closePath();
    ctx.fill();
}

function drawNeonCircle(ctx, cx, cy, r, strokeCol, shadowCol) {
    ctx.strokeStyle = strokeCol;
    ctx.shadowBlur = 12;
    ctx.shadowColor = shadowCol;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawSunrays(ctx, cx, cy, innerR, count, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        const x1 = cx + Math.cos(angle) * (innerR + 4);
        const y1 = cy + Math.sin(angle) * (innerR + 4);
        const x2 = cx + Math.cos(angle) * (innerR + 12);
        const y2 = cy + Math.sin(angle) * (innerR + 12);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function drawGlowStar8(ctx, cx, cy, outerR, innerR, color) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const nextAngle = ((i + 0.5) * Math.PI * 2) / 8;
        
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.lineTo(cx + Math.cos(nextAngle) * innerR, cy + Math.sin(nextAngle) * innerR);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 4);
    // Left curve
    ctx.bezierCurveTo(x - size/2, y - size, x - size, y - size/3, x, y + size * 0.8);
    // Right curve
    ctx.bezierCurveTo(x + size, y - size/3, x + size/2, y - size, x, y - size / 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}


// 2. Zodiac calculation & details
const ZODIAC_METRICS = [
    { name: "摩羯座", start: [12, 22], end: [1, 19], ruler: "土星", color: "玄青/深褐", element: "土", icon: "fa-regular fa-gem" },
    { name: "水瓶座", start: [1, 20], end: [2, 18], ruler: "天王星", color: "极光靛/海蓝", element: "风", icon: "fa-solid fa-wind" },
    { name: "双鱼座", start: [2, 19], end: [3, 20], ruler: "海王星", color: "丁香紫/水粉", element: "水", icon: "fa-solid fa-water" },
    { name: "白羊座", start: [3, 21], end: [4, 19], ruler: "火星", color: "朱砂红/烈焰金", element: "火", icon: "fa-solid fa-fire" },
    { name: "金牛座", start: [4, 20], end: [5, 20], ruler: "金星", color: "翡翠绿/奶白", element: "土", icon: "fa-solid fa-seedling" },
    { name: "双子座", start: [5, 21], end: [6, 21], ruler: "水星", color: "明黄/浅空蓝", element: "风", icon: "fa-solid fa-shuffle" },
    { name: "巨蟹座", start: [6, 22], end: [7, 22], ruler: "月亮", color: "珍珠银/月光白", element: "水", icon: "fa-solid fa-moon" },
    { name: "狮子座", start: [7, 23], end: [8, 22], ruler: "太阳", color: "帝王金/曜红", element: "火", icon: "fa-solid fa-sun" },
    { name: "处女座", start: [8, 23], end: [9, 22], ruler: "水星", color: "橄榄绿/砂金", element: "土", icon: "fa-solid fa-feather-pointed" },
    { name: "天秤座", start: [9, 23], end: [10, 23], ruler: "金星", color: "玫瑰粉/黛青", element: "风", icon: "fa-solid fa-scale-balanced" },
    { name: "天蝎座", start: [10, 24], end: [11, 22], ruler: "冥王星", color: "深绯红/墨黑", element: "水", icon: "fa-solid fa-skull-crossbones" },
    { name: "射手座", start: [11, 23], end: [12, 21], ruler: "木星", color: "紫罗兰/深海蓝", element: "火", icon: "fa-solid fa-compass" }
];

function getZodiac(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    for (const z of ZODIAC_METRICS) {
        const [sm, sd] = z.start;
        const [em, ed] = z.end;

        if (sm === 12 && month === 12 && day >= sd) return z;
        if (sm === 12 && month === 1 && day <= ed) return z;

        if (month === sm && day >= sd) return z;
        if (month === em && day <= ed) return z;
    }
    return ZODIAC_METRICS[0]; // fallback Capricorn
}

// 3. Application State & Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const screenLanding = document.getElementById('screen-landing');
    const screenInput = document.getElementById('screen-input');
    const screenDraw = document.getElementById('screen-draw');
    const screenLoading = document.getElementById('screen-loading');
    const screenResults = document.getElementById('screen-results');
    const screenOracle = document.getElementById('screen-oracle');

    const btnEnter = document.getElementById('btn-enter');
    const btnRestart = document.getElementById('btn-restart');
    const btnShare = document.getElementById('btn-share');
    const fortuneForm = document.getElementById('fortune-form');
    const btnClearCanvas = document.getElementById('btn-clear-canvas');
    const btnConfirmCanvas = document.getElementById('btn-confirm-canvas');
    const drawingCanvas = document.getElementById('drawing-canvas');
    
    // Audio elements
    const audioToggle = document.getElementById('audio-toggle');
    const bgMusic = document.getElementById('bg-music');
    let isMusicPlaying = false;

    // Form items
    const birthDateInput = document.getElementById('birth-date');
    const zodiacBadge = document.getElementById('zodiac-badge');
    const zodiacText = document.getElementById('zodiac-text');
    const focusOptions = document.querySelectorAll('.focus-option');
    let selectedCategory = 'general';

    // Results items
    const resName = document.getElementById('res-name');
    const resZodiacName = document.getElementById('res-zodiac-name');
    const resCategoryName = document.getElementById('res-category-name');
    const resZodiacIcon = document.getElementById('res-zodiac-icon');
    const resRuler = document.getElementById('res-ruler');
    const resColor = document.getElementById('res-color');
    const resNumber = document.getElementById('res-number');
    
    // Ratings
    const rateLoveVal = document.getElementById('rate-love-val');
    const rateLoveBar = document.getElementById('rate-love-bar');
    const rateCareerVal = document.getElementById('rate-career-val');
    const rateCareerBar = document.getElementById('rate-career-bar');
    const rateWealthVal = document.getElementById('rate-wealth-val');
    const rateWealthBar = document.getElementById('rate-wealth-bar');
    const rateHealthVal = document.getElementById('rate-health-val');
    const rateHealthBar = document.getElementById('rate-health-bar');

    // Tarot Selection System
    const cardContainers = document.querySelectorAll('.tarot-card-container');
    const tarotPromptText = document.getElementById('tarot-prompt-text');
    let userHasChosenCard = false;
    let resultsChosenCards = [];
    let userNameInput = '';
    let userZodiac = null;
    let userReport = null;
    let savedUserQuestion = '';

    // AI Oracle Typewriter
    const oracleTextOutput = document.getElementById('oracle-text-output');
    const oracleCursor = document.getElementById('oracle-cursor');
    let typewriterInterval = null;

    // Initial audio configuration
    audioToggle.addEventListener('click', () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            audioToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            audioToggle.setAttribute('title', '开启背景音乐');
        } else {
            bgMusic.play().catch(e => console.log("Audio autoplay prevented", e));
            audioToggle.innerHTML = '<i class="fa-solid fa-volume-high animate-pulse"></i>';
            audioToggle.setAttribute('title', '关闭背景音乐');
        }
        isMusicPlaying = !isMusicPlaying;
    });

    // Power-up stargate on enter button hover
    const landingStargate = document.getElementById('landing-stargate');
    
    btnEnter.addEventListener('mouseenter', () => {
        if (landingStargate) landingStargate.classList.add('power-up');
        if (window.particleSystem) {
            window.particleSystem.setMode('ritual');
        }
    });

    btnEnter.addEventListener('mouseleave', () => {
        if (landingStargate) landingStargate.classList.remove('power-up');
        if (window.particleSystem) {
            window.particleSystem.setMode('normal');
        }
    });

    // Enter Application with Cinematic Warp Transition
    btnEnter.addEventListener('click', () => {
        // Try playing music on user interaction
        if (!isMusicPlaying) {
            bgMusic.volume = 0.45;
            bgMusic.play()
                .then(() => {
                    isMusicPlaying = true;
                    audioToggle.innerHTML = '<i class="fa-solid fa-volume-high animate-pulse"></i>';
                })
                .catch(() => {});
        }

        // Add warp effect to landing screen
        screenLanding.classList.add('warp-out');

        setTimeout(() => {
            // Restore stargate classes
            if (landingStargate) landingStargate.classList.remove('power-up');
            
            // Switch screen
            switchScreen(screenLanding, screenInput);
            
            // Clear warp state for next restart
            setTimeout(() => {
                screenLanding.classList.remove('warp-out');
            }, 500);

            // Restore particle normal mode for the form view
            if (window.particleSystem) {
                window.particleSystem.setMode('normal');
            }
        }, 850);
    });

    // Auto update zodiac badge when date changes
    birthDateInput.addEventListener('change', () => {
        const zodiac = getZodiac(birthDateInput.value);
        if (zodiac) {
            zodiacBadge.classList.add('detected');
            zodiacText.innerHTML = `<i class="${zodiac.icon}"></i> ${zodiac.name}`;
        } else {
            zodiacBadge.classList.remove('detected');
            zodiacText.textContent = "自动测算星轨...";
        }
    });

    // Handle Focus Category selection
    focusOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            focusOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedCategory = opt.dataset.category;
        });
    });

    // Talisman Drawing Canvas Engine
    const ctxDraw = drawingCanvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let savedUserName = '';
    let savedBirthDate = '';

    // Initialize canvas drawing settings
    function resizeDrawingCanvas() {
        const rect = drawingCanvas.getBoundingClientRect();
        // Adjust resolution to bounds for crisp vectors
        drawingCanvas.width = rect.width;
        drawingCanvas.height = rect.height;

        ctxDraw.strokeStyle = '#f39c12'; // Mystic gold stroke
        ctxDraw.lineWidth = 2.0;         // Small fine stroke width as requested
        ctxDraw.lineCap = 'round';
        ctxDraw.lineJoin = 'round';
    }

    // Window resize handler
    window.addEventListener('resize', () => {
        if (screenDraw.classList.contains('active')) {
            resizeDrawingCanvas();
        }
    });

    // Helper: get touch coordinates relative to canvas
    function getTouchPos(canvasDom, touchEvent) {
        const rect = canvasDom.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top
        };
    }

    // Mouse events
    drawingCanvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    drawingCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        ctxDraw.beginPath();
        ctxDraw.moveTo(lastX, lastY);
        ctxDraw.lineTo(e.offsetX, e.offsetY);
        ctxDraw.stroke();
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    drawingCanvas.addEventListener('mouseup', () => isDrawing = false);
    drawingCanvas.addEventListener('mouseleave', () => isDrawing = false);

    // Touch events for mobile
    drawingCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // prevent scrolling
        isDrawing = true;
        const pos = getTouchPos(drawingCanvas, e);
        lastX = pos.x;
        lastY = pos.y;
    });

    drawingCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // prevent scrolling
        if (!isDrawing) return;
        const pos = getTouchPos(drawingCanvas, e);
        ctxDraw.beginPath();
        ctxDraw.moveTo(lastX, lastY);
        ctxDraw.lineTo(pos.x, pos.y);
        ctxDraw.stroke();
        lastX = pos.x;
        lastY = pos.y;
    });

    drawingCanvas.addEventListener('touchend', () => isDrawing = false);

    // Clear canvas
    btnClearCanvas.addEventListener('click', () => {
        ctxDraw.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCanvas.classList.remove('charged');
    });

    // Confirm canvas: Glow and transition
    btnConfirmCanvas.addEventListener('click', () => {
        // 1. Talisman starts glowing only after drawing is finished and confirmed
        drawingCanvas.classList.add('charged');

        // 2. Play particle burst at the center of the canvas
        const rect = drawingCanvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        if (window.particleSystem) {
            window.particleSystem.createBurst(centerX, centerY, 40, 'gold');
        }

        // 3. Switch screen after glow payoff
        setTimeout(() => {
            switchScreen(screenDraw, screenLoading);
            if (window.particleSystem) {
                window.particleSystem.setMode('ritual');
            }
            
            // Run animation divination
            runRitualAnimation(savedUserName, savedBirthDate, selectedCategory);
        }, 900);
    });

    // Form Submission: Proceed to Talisman Drawing Screen
    fortuneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        savedUserName = document.getElementById('user-name').value.trim();
        savedBirthDate = birthDateInput.value;
        savedUserQuestion = (document.getElementById('user-question')?.value || '').trim();

        if (!savedUserName || !savedBirthDate) return;

        // Transition to Drawing Screen
        switchScreen(screenInput, screenDraw);
        
        // Setup canvas sizing on transition
        setTimeout(() => {
            resizeDrawingCanvas();
            drawingCanvas.classList.remove('charged');
        }, 450);
    });

    // Restart sequence
    btnRestart.addEventListener('click', () => {
        // Reset all 3 tarot cards
        cardContainers.forEach(container => {
            container.classList.remove('flipped', 'dimmed', 'selected');
            const cardInner = container.querySelector('.tarot-card');
            if (cardInner) cardInner.classList.remove('flipped');
            
            const imgPlaceholder = container.querySelector('.tarot-image-placeholder');
            if (imgPlaceholder) imgPlaceholder.innerHTML = '';
            
            const titleEl = container.querySelector('.tarot-info h4');
            if (titleEl) titleEl.textContent = '卡牌';
            
            const stateEl = container.querySelector('.tarot-state');
            if (stateEl) {
                stateEl.textContent = '正位';
                stateEl.className = 'tarot-state';
            }
        });
        
        userHasChosenCard = false;
        tarotPromptText.textContent = "感应内心共鸣，点击选择一张命运塔罗";
        
        // Reset typing
        if (typewriterInterval) clearInterval(typewriterInterval);
        oracleTextOutput.textContent = '';
        oracleCursor.style.display = 'inline-block';
        const plainSpeakEl = document.getElementById('plain-speak-output');
        if (plainSpeakEl) {
            plainSpeakEl.innerHTML = '';
            plainSpeakEl.classList.remove('plain-speak-visible');
        }

        const fromScreen = screenOracle.classList.contains('active') ? screenOracle : screenResults;
        switchScreen(fromScreen, screenInput);
    });

    // Bind click events on all 3 cards
    cardContainers.forEach((container, k) => {
        container.addEventListener('click', () => {
            if (userHasChosenCard) return;
            userHasChosenCard = true;

            const clickedCard = resultsChosenCards[k];
            
            // Mark selected
            container.classList.add('selected');
            const cardInner = container.querySelector('.tarot-card');
            if (cardInner) cardInner.classList.add('flipped');

            // Dim the other unchosen cards
            cardContainers.forEach((c, idx) => {
                if (idx !== k) {
                    c.classList.add('dimmed');
                }
            });

            // Draw procedural card front vector graphics
            const placeholder = container.querySelector('.tarot-image-placeholder');
            renderProceduralTarot(placeholder, clickedCard.tarot, clickedCard.isUpright);

            // Populate titles
            container.querySelector('.tarot-info h4').textContent = clickedCard.tarot.name;
            const stateEl = container.querySelector('.tarot-state');
            stateEl.textContent = clickedCard.isUpright ? "正位" : "逆位";
            stateEl.className = clickedCard.isUpright ? "tarot-state" : "tarot-state reversed";

            // Trigger explosive shockwave centered at card coordinates
            const rect = container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            if (window.particleSystem) {
                window.particleSystem.createBurst(centerX, centerY, 50, 'cosmic');
                window.particleSystem.createBurst(centerX, centerY, 25, 'gold');
            }

            tarotPromptText.textContent = "已选中。正在进入解读…";

            // Compile reading, then jump to interpretation screen
            compileOracleSpeech(userNameInput, userZodiac, clickedCard, userReport);

            setTimeout(() => {
                openOracleStage(clickedCard);
            }, 900);
        });
    });

    function openOracleStage(clickedCard) {
        const artEl = document.getElementById('chosen-card-art');
        const nameEl = document.getElementById('chosen-card-name');
        const stateEl = document.getElementById('chosen-card-state');
        const oracleName = document.getElementById('oracle-res-name');
        const oracleZodiac = document.getElementById('oracle-res-zodiac');

        if (artEl) {
            artEl.innerHTML = '';
            renderProceduralTarot(artEl, clickedCard.tarot, clickedCard.isUpright);
        }
        if (nameEl) nameEl.textContent = clickedCard.tarot.name;
        if (stateEl) {
            stateEl.textContent = clickedCard.isUpright ? '正位' : '逆位';
            stateEl.className = clickedCard.isUpright ? 'tarot-state' : 'tarot-state reversed';
        }
        if (oracleName) oracleName.textContent = userNameInput || '探索者';
        if (oracleZodiac) oracleZodiac.textContent = userZodiac ? userZodiac.name : '';

        if (typewriterInterval) clearInterval(typewriterInterval);
        oracleTextOutput.textContent = '';
        oracleCursor.style.display = 'inline-block';

        switchScreen(screenResults, screenOracle);

        setTimeout(() => {
            renderPlainSpeak({ positive: clickedCard.isUpright });
            revealOracleReading();
            screenOracle.scrollTop = 0;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 450);
    }

    // Share button
    btnShare.addEventListener('click', () => {
        alert("🪐 星轨能量已封装！您可以截屏当前屏幕，将您的【命运之镜】分享给同行之人。");
    });

    // Helper: Switch Screens with transition
    function switchScreen(from, to) {
        from.style.opacity = '0';
        from.style.transform = 'scale(0.96) translateY(-10px)';
        
        setTimeout(() => {
            from.classList.remove('active');
            to.classList.add('active');
            
            to.offsetHeight; // force reflow
            
            to.style.opacity = '1';
            to.style.transform = 'scale(1) translateY(0)';
        }, 400);
    }

    // Helper: Ritual Loading Animations & Computations
    function runRitualAnimation(name, date, category) {
        const consoleDynamic = document.getElementById('console-dynamic');
        const loadingTitle = document.querySelector('.loading-title');
        
        const phases = [
            { text: "正在捕获以太流星信号...", time: 600 },
            { text: "读取生命线与星图排列...", time: 1300 },
            { text: "引导并共鸣卡巴拉塔罗牌魂...", time: 2000 },
            { text: "AI 命运推衍矩阵运转中...", time: 2800 }
        ];

        phases.forEach(phase => {
            setTimeout(() => {
                consoleDynamic.textContent = phase.text;
                if (phase.time === 2000) {
                    loadingTitle.textContent = "魔阵汇聚中...";
                }
            }, phase.time);
        });

        // Compute stable pseudo-random reports (Zodiac details + Name hash)
        const zodiac = getZodiac(date);
        const report = generateOracleReport(name, zodiac, category);

        setTimeout(() => {
            // Apply computed values to Results Screen DOM
            applyResults(name, zodiac, report);

            // Transition to result page
            switchScreen(screenLoading, screenResults);
            if (window.particleSystem) {
                window.particleSystem.setMode('normal');
            }
        }, 3600);
    }

    // Draw three stable random unique tarot cards
    function generateOracleReport(name, zodiac, category) {
        // Name character sum hash
        let nameHash = 0;
        for (let i = 0; i < name.length; i++) {
            nameHash += name.charCodeAt(i);
        }

        // Draw stable random unique tarot deck cards
        const deckIndices = [...Array(TAROT_DECK.length).keys()];
        const chosenCards = [];
        let hash = nameHash;

        for (let i = 0; i < 3; i++) {
            hash = (hash * 31 + zodiac.name.charCodeAt(0) + i) % deckIndices.length;
            const idx = deckIndices.splice(hash, 1)[0];
            const upright = ((nameHash + i) % 2) === 0;
            chosenCards.push({ tarot: TAROT_DECK[idx], isUpright: upright });
        }

        // Compute scores
        const scoreLove = Math.floor(Math.sin(nameHash + 1) * 30 + 70); // 40-100
        const scoreCareer = Math.floor(Math.cos(nameHash + 2) * 30 + 70);
        const scoreWealth = Math.floor(Math.sin(nameHash + 3) * 30 + 70);
        const scoreHealth = Math.floor(Math.cos(nameHash + 4) * 30 + 70);

        const luckyNum = (nameHash % 9) + 1;
        const starIndex = (nameHash + 7) % 100;

        return {
            chosenCards,
            scores: { love: scoreLove, career: scoreCareer, wealth: scoreWealth, health: scoreHealth },
            luckyNum,
            starIndex,
            category
        };
    }

    // Apply values to Results UI
    function applyResults(name, zodiac, report) {
        resName.textContent = name;
        resZodiacName.textContent = zodiac.name;
        resZodiacIcon.innerHTML = `<i class="${zodiac.icon}"></i>`;
        resRuler.textContent = zodiac.ruler;
        resColor.textContent = zodiac.color;
        resNumber.textContent = `${report.starIndex}%`;

        // Category Chinese mapping
        const catMap = {
            general: "综合运势",
            love: "恋爱情感",
            career: "事业学业",
            wealth: "财富走势",
            health: "健康指引"
        };
        resCategoryName.textContent = catMap[report.category] || "命运之轨";

        // Ratings rendering helper
        const renderStars = (score) => {
            const starCount = Math.round(score / 20); // 1-5
            return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
        };

        rateLoveVal.textContent = renderStars(report.scores.love);
        rateLoveBar.style.width = `${report.scores.love}%`;

        rateCareerVal.textContent = renderStars(report.scores.career);
        rateCareerBar.style.width = `${report.scores.career}%`;

        rateWealthVal.textContent = renderStars(report.scores.wealth);
        rateWealthBar.style.width = `${report.scores.wealth}%`;

        rateHealthVal.textContent = renderStars(report.scores.health);
        rateHealthBar.style.width = `${report.scores.health}%`;

        // Save details for selection click events
        resultsChosenCards = report.chosenCards;
        userHasChosenCard = false;
        userNameInput = name;
        userZodiac = zodiac;
        userReport = report;

        // Interpretation waits until a tarot card is chosen
        const plainSpeakEl = document.getElementById('plain-speak-output');
        if (plainSpeakEl) {
            plainSpeakEl.innerHTML = '';
            plainSpeakEl.classList.remove('plain-speak-visible');
        }
        if (typewriterInterval) clearInterval(typewriterInterval);
        oracleTextOutput.textContent = '';
        oracleCursor.style.display = 'inline-block';

        // Reset visual card parameters
        cardContainers.forEach((container, i) => {
            container.classList.remove('flipped', 'dimmed', 'selected');
            const cardInner = container.querySelector('.tarot-card');
            if (cardInner) cardInner.classList.remove('flipped');
            
            // Clean placeholders
            const imgPlaceholder = container.querySelector('.tarot-image-placeholder');
            if (imgPlaceholder) imgPlaceholder.innerHTML = '';
            
            const titleEl = container.querySelector('.tarot-info h4');
            if (titleEl) titleEl.textContent = `卡牌 ${i+1}`;
            
            const stateEl = container.querySelector('.tarot-state');
            if (stateEl) {
                stateEl.textContent = '正位';
                stateEl.className = 'tarot-state';
            }
        });

        tarotPromptText.textContent = "已定位星宿频段。请感应内心，选择一张代表您宿命的塔罗牌";
    }

    // Procedural Tarot Card Art drawer
    function renderProceduralTarot(containerEl, tarot, upright) {
        // Create canvas inside container
        containerEl.innerHTML = '<canvas class="tarot-canvas-art"></canvas>';
        const cvs = containerEl.querySelector('.tarot-canvas-art');
        const ctx = cvs.getContext('2d');
        
        // Define canvas sizing (internally high-res, scaled down via CSS)
        cvs.width = 194;
        cvs.height = 246;

        const w = cvs.width;
        const h = cvs.height;

        // Apply flip transformation if reversed
        ctx.save();
        if (!upright) {
            ctx.translate(w, h);
            ctx.rotate(Math.PI);
        }

        // Draw card background
        const grad = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w);
        grad.addColorStop(0, '#0c072b');
        grad.addColorStop(1, '#020108');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw Golden Border lines
        ctx.strokeStyle = "rgba(243, 156, 18, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(6, 6, w - 12, h - 12);
        
        ctx.strokeStyle = "rgba(243, 156, 18, 0.2)";
        ctx.strokeRect(10, 10, w - 20, h - 20);

        // Call the card's specific geometric artwork drawing routine
        if (tarot.drawIcon) {
            tarot.drawIcon(ctx, w, h);
        }

        // Restore context state
        ctx.restore();
    }

    let compiledOracleText = '';

    function renderPlainSpeak(signals = {}) {
        if (!window.PlainSpeak || !userReport) return;
        window.PlainSpeak.render(document.getElementById('plain-speak-output'), {
            question: savedUserQuestion,
            category: userReport.category,
            scores: userReport.scores,
            signals,
            seedText: userNameInput + savedBirthDate
        });
    }

    // Create custom mystical text
    function compileOracleSpeech(name, zodiac, chosenCard, report) {
        const t = chosenCard.tarot;
        const stateStr = chosenCard.isUpright ? "正位" : "逆位";
        const meaning = chosenCard.isUpright ? t.upright.meaning : t.reversed.meaning;
        const advice = chosenCard.isUpright ? t.upright.advice : t.reversed.advice;

        const introTemplates = [
            `【${name}】，星盘读完了。你是【${zodiac.name}】，守护星【${zodiac.ruler}】今天挺忙——忙着照见你那些还没想清楚的事。别急着感动，先听完。`,
            `契约生效。【${name}】，【${zodiac.name}】的相位已经对上了：不是宇宙突然偏爱你，是你终于肯认真问一次。`
        ];

        const relationTemplates = {
            general: `你问的是【综合运势】。今日星盘指数 ${report.starIndex}%——数字好看不代表你躺着就能赢，齿轮咬合得再顺，你不踩油门也白搭。`,
            love: `你问的是【恋爱情感】。共鸣指数 ${report.scores.love}%。守护星【${zodiac.ruler}】往情感宫砸了一脚——机会有没有另说，你敢不敢接才是重点。`,
            career: `你问的是【事业学业】。同频度 ${report.scores.career}%。土星不吃「我努力了」这种空话，吃结果。该冲就冲，别光自我感动。`,
            wealth: `你问的是【财富走势】。物质频段 ${report.scores.wealth}%。金色三角听着漂亮，手还是别往高风险里乱伸——财运帮懒人，不帮赌徒。`,
            health: `你问的是【健康指引】。共鸣度 ${report.scores.health}%。平稳不等于你可以继续作。身体记账很准，熬夜、内耗它都会算利息。`
        };

        const outText = relationTemplates[report.category] || relationTemplates['general'];

        compiledOracleText = `${introTemplates[Math.floor(Math.random() * introTemplates.length)]}

${outText}

你抽到的是【${t.name} · ${stateStr}】。

${meaning}

别装没听见：${advice}

幸运数字 ${report.luckyNum}，幸运色 ${zodiac.color}。选择是你的，别回头怪牌。`;
    }

    // Reveal output via Typewriter effect
    function revealOracleReading() {
        let index = 0;
        oracleTextOutput.textContent = '';
        oracleCursor.style.display = 'inline-block';

        if (typewriterInterval) clearInterval(typewriterInterval);

        const container = document.querySelector('.oracle-output-container');

        typewriterInterval = setInterval(() => {
            if (index < compiledOracleText.length) {
                // Add character
                oracleTextOutput.textContent += compiledOracleText.charAt(index);
                index++;
                
                // Auto scroll container
                container.scrollTop = container.scrollHeight;
            } else {
                clearInterval(typewriterInterval);
                oracleCursor.style.display = 'none'; // hide cursor when done
            }
        }, 22); // typing speed ms
    }
});
