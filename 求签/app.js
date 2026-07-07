/**
 * 紫微天枢 - 前端交互与渲染逻辑主控
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 初始化背景星空与星云动画
  initStarfield();

  // 2. 初始化页面导航与标签切换
  initNavigation();

  // 3. 初始化排盘表单交互与即时农历预览
  initCalcForm();

  // 4. 初始化学习课时切换与主星分类标签
  initLearnView();

  // 5. 初始化首页八卦盘手势与鼠标拖拽自转
  initZodiacGestures();
});

/* ==========================================
   1. Canvas 交互星空、星云与星座连接线系统
   ========================================== */
function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  let stars = [];
  const starCount = 120;
  let mouse = { x: null, y: null };

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });
  
  // 慢速运动的彩色星云定义
  let nebulae = [
    { x: 0.2, y: 0.3, r: 0.25, color: "rgba(106, 27, 154, 0.14)", vx: 0.0001, vy: 0.00005 },   // 深邃紫
    { x: 0.8, y: 0.7, r: 0.28, color: "rgba(0, 229, 255, 0.07)", vx: -0.00005, vy: 0.00008 },  // 极光青蓝
    { x: 0.5, y: 0.5, r: 0.32, color: "rgba(255, 224, 130, 0.03)", vx: 0.00003, vy: -0.00004 } // 流光金
  ];
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0.6 + Math.random() * 1.2,
        alpha: Math.random(),
        twinkleSpeed: 0.005 + Math.random() * 0.01,
        twinkleDirection: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制宇宙背景基色
    ctx.fillStyle = "#050308";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 绘制星云层
    nebulae.forEach(neb => {
      neb.x += neb.vx;
      neb.y += neb.vy;
      
      if (neb.x < 0.05 || neb.x > 0.95) neb.vx *= -1;
      if (neb.y < 0.05 || neb.y > 0.95) neb.vy *= -1;
      
      const px = neb.x * canvas.width;
      const py = neb.y * canvas.height;
      const radius = neb.r * Math.max(canvas.width, canvas.height);
      
      const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, neb.color);
      grad.addColorStop(1, "transparent");
      
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });

    // 2. 更新恒星位置与微引力偏移
    let renderedStars = stars.map(star => {
      let dx = star.x;
      let dy = star.y;
      
      // 鼠标微引力排斥效果
      if (mouse.x !== null && mouse.y !== null) {
        const xDist = mouse.x - star.x;
        const yDist = mouse.y - star.y;
        const dist = Math.sqrt(xDist * xDist + yDist * yDist);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          dx -= xDist * force * 0.12;
          dy -= yDist * force * 0.12;
        }
      }
      
      // Twinkle 闪烁计算
      star.alpha += star.twinkleSpeed * star.twinkleDirection;
      if (star.alpha >= 0.95) star.twinkleDirection = -1;
      if (star.alpha <= 0.05) star.twinkleDirection = 1;
      
      return { star, x: dx, y: dy };
    });

    // 3. 绘制星之网络 (漂移星座线)
    // 两个距离较近的星体之间会生成极其微弱的连线，模拟星盘的纽带关系
    for (let i = 0; i < renderedStars.length; i++) {
      for (let j = i + 1; j < renderedStars.length; j++) {
        const s1 = renderedStars[i];
        const s2 = renderedStars[j];
        const xDiff = s1.x - s2.x;
        const yDiff = s1.y - s2.y;
        const dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
        
        if (dist < 75) {
          const lineAlpha = (1 - dist / 75) * 0.06;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = `rgba(0, 229, 255, ${lineAlpha})`; // 璀璨青蓝星座线
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // 4. 绘制鼠标星座引力连线
    if (mouse.x !== null && mouse.y !== null) {
      renderedStars.forEach(s => {
        const xDiff = mouse.x - s.x;
        const yDiff = mouse.y - s.y;
        const dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
        if (dist < 110) {
          const lineAlpha = (1 - dist / 110) * 0.12;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = `rgba(255, 224, 130, ${lineAlpha})`; // 暖金色交互线
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      });
    }

    // 5. 绘制星体粒子本身
    renderedStars.forEach(rs => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(rs.x, rs.y, rs.star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${rs.star.alpha})`;
      if (rs.star.radius > 1.3) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#f3d078";
      }
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  draw();
}

/* ==========================================
   2. 页面主视图导航切换
   ========================================== */
function initNavigation() {
  const navLinks = document.querySelectorAll("header nav .nav-link");
  const sections = document.querySelectorAll(".view-section");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-target");
      
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      sections.forEach(sec => {
        sec.classList.remove("active");
        if (sec.id === targetId) {
          setTimeout(() => {
            sec.classList.add("active");
          }, 50);
        }
      });
    });
  });
}

function switchTab(targetId) {
  const link = document.querySelector(`header nav .nav-link[data-target="${targetId}"]`);
  if (link) {
    link.click();
  }
}

/* ==========================================
   3. 排盘表单逻辑、即时农历预览与动态渲染
   ========================================== */
let activeCalendarType = "solar";

function setCalendarType(type) {
  activeCalendarType = type;
  document.getElementById("calendarType").value = type;
  
  const buttons = document.querySelectorAll(".calendar-pact-group .btn-pact-toggle");
  buttons.forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("onclick").includes(type)) {
      btn.classList.add("active");
    }
  });

  const leapMonthBox = document.getElementById("leap-month-container");
  if (type === "lunar") {
    leapMonthBox.style.display = "flex";
  } else {
    leapMonthBox.style.display = "none";
    document.getElementById("isLeapMonth").checked = false;
  }

  updateLunarHelperText();
}

window.setCalendarType = setCalendarType;

function updateLunarHelperText() {
  const dateInput = document.getElementById("birthDate");
  const helper = document.getElementById("lunar-helper");
  if (!dateInput || !helper) return;

  const birthDateVal = dateInput.value;
  if (!birthDateVal) {
    helper.textContent = "请选择出生日期...";
    return;
  }

  const [year, month, day] = birthDateVal.split("-").map(Number);
  if (year < 1900 || year > 2100) {
    helper.textContent = "超出 1900-2100 计算范围！";
    return;
  }

  if (activeCalendarType === "solar") {
    const lunar = calendar.solar2lunar(year, month, day);
    if (lunar !== -1 && lunar) {
      helper.textContent = `农历：${lunar.gzYear}年${lunar.IMonthCn}${lunar.IDayCn} (生肖属${lunar.Animal})`;
    } else {
      helper.textContent = "计算中...";
    }
  } else {
    const isLeap = document.getElementById("isLeapMonth").checked;
    const solar = calendar.lunar2solar(year, month, day, isLeap);
    if (solar !== -1 && solar) {
      helper.textContent = `对应的阳历日期为：${solar.cYear}年${solar.cMonth}月${solar.cDay}日`;
    } else {
      helper.textContent = "输入的农历日期不存在，请仔细核对大/小月或闰月。";
    }
  }
}

function initCalcForm() {
  const form = document.getElementById("ziwei-form");
  const dateInput = document.getElementById("birthDate");
  const leapCheckbox = document.getElementById("isLeapMonth");

  if (dateInput) {
    dateInput.addEventListener("input", updateLunarHelperText);
    dateInput.addEventListener("change", updateLunarHelperText);
  }
  if (leapCheckbox) {
    leapCheckbox.addEventListener("change", updateLunarHelperText);
  }

  updateLunarHelperText();

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("username").value.trim();
    const gender = document.getElementById("pactGender").value; // 从契约卡片读取
    const calendarType = document.getElementById("calendarType").value;
    const birthDateVal = dateInput.value;
    const isLeapMonth = leapCheckbox.checked;
    const birthHourVal = parseInt(document.getElementById("birthHour").value);

    if (!birthDateVal) {
      alert("请选择出生日期！");
      return;
    }

    const [year, month, day] = birthDateVal.split("-").map(Number);

    try {
      const chartData = ziwei.calculateChart({
        name,
        gender,
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        birthHourIndex: birthHourVal,
        calendarType,
        isLeapMonth
      });

      // 渲染数据
      renderChart(chartData);

      // 进入激活召唤动效
      summonChartSequence(chartData);

    } catch (err) {
      alert("排盘出错: " + err.message);
      console.error(err);
    }
  });
}

function resetForm() {
  document.getElementById("chart-result-box").style.display = "none";
  document.getElementById("calc-form-box").style.display = "block";
  clearSanFangSiZheng();
  const plainEl = document.getElementById("plain-speak-output");
  if (plainEl) {
    plainEl.innerHTML = "";
    plainEl.classList.remove("plain-speak-visible");
  }
}

window.resetForm = resetForm;

function renderZiweiPlainSpeak() {
  const el = document.getElementById("plain-speak-output");
  if (!el || !window.PlainSpeak) return;

  const question = (document.getElementById("pactQuestion")?.value || "").trim();
  const category = document.getElementById("pactQuest")?.value || "general";
  const name = (document.getElementById("username")?.value || "").trim();
  const birthDate = document.getElementById("birthDate")?.value || "";
  const scores = window.PlainSpeak.scoresFromSeed(name + birthDate + category);

  window.PlainSpeak.render(el, {
    question,
    category,
    scores,
    seedText: name + birthDate + category
  });
}

// 星盘仪式召唤动画（星盘觉醒）
function summonChartSequence(chartData) {
  document.getElementById("calc-form-box").style.display = "none";
  document.getElementById("chart-result-box").style.display = "block";
  clearSanFangSiZheng();
  renderZiweiPlainSpeak();

  // 1. 获取所有单元格并初始设置为不可见
  const cells = [];
  for (let i = 0; i < 12; i++) {
    const cell = document.getElementById(`palace-${i}`);
    if (cell) {
      cell.style.opacity = "0";
      cell.classList.remove("summon-sparkle");
      cells.push(cell);
    }
  }

  // 中宫重置
  const centerPlate = document.getElementById("center-plate-info");
  if (centerPlate) {
    centerPlate.style.opacity = "0";
    centerPlate.style.transform = "scale(0.8) rotate(-15deg)";
  }

  // 2. 依次顺时针延迟召唤宫位格子
  cells.forEach((cell, idx) => {
    setTimeout(() => {
      cell.style.opacity = "1";
      cell.classList.add("summon-sparkle");
      
      // 动画播放完后清除类
      setTimeout(() => {
        cell.classList.remove("summon-sparkle");
      }, 800);
    }, idx * 60); // 每隔60ms召唤下一个宫位，顺时针环形划过
  });

  // 3. 中宫与大限连线召唤
  setTimeout(() => {
    if (centerPlate) {
      centerPlate.style.transition = "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      centerPlate.style.opacity = "1";
      centerPlate.style.transform = "scale(1) rotate(0deg)";
    }
  }, 12 * 60 + 50);

  // 4. 根据用户契约中“追求之间”所选领域自动点击相应宫位，勾勒三方四正并弹出详批
  setTimeout(() => {
    const questVal = document.getElementById("pactQuest").value;
    let targetPalaceName = "命宫"; // 默认综合运势
    
    if (questVal === "love") targetPalaceName = "夫妻宫";
    else if (questVal === "career") targetPalaceName = "官禄宫";
    else if (questVal === "wealth") targetPalaceName = "财帛宫";
    else if (questVal === "health") targetPalaceName = "疾厄宫";

    const targetIdx = chartData.palaces.findIndex(pal => pal.palaceName.includes(targetPalaceName));
    if (targetIdx !== -1) {
      const targetCell = document.getElementById(`palace-${targetIdx}`);
      if (targetCell) {
        targetCell.click();
      }
    }
    renderZiweiPlainSpeak();
  }, 12 * 60 + 350);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 清理三方四正SVG图层
function clearSanFangSiZheng() {
  const svg = document.getElementById("chart-lines-overlay");
  if (svg) svg.innerHTML = "";
}

// 绘制三方四正连接线
function drawSanFangSiZheng(clickedIndex) {
  const svg = document.getElementById("chart-lines-overlay");
  if (!svg) return;
  svg.innerHTML = ""; 

  const board = document.querySelector(".ziwei-board");
  const boardRect = board.getBoundingClientRect();

  const relatedIndices = [
    clickedIndex,
    (clickedIndex + 4) % 12,
    (clickedIndex + 6) % 12,
    (clickedIndex + 8) % 12
  ];

  const points = [];
  relatedIndices.forEach(idx => {
    const cell = document.getElementById(`palace-${idx}`);
    if (cell) {
      const cellRect = cell.getBoundingClientRect();
      const x = (cellRect.left - boardRect.left) + cellRect.width / 2;
      const y = (cellRect.top - boardRect.top) + cellRect.height / 2;
      points.push({ x, y });
    }
  });

  if (points.length < 4) return;

  const dPath = `
    M ${points[0].x} ${points[0].y}
    L ${points[1].x} ${points[1].y}
    L ${points[2].x} ${points[2].y}
    L ${points[3].x} ${points[3].y}
    Z
    M ${points[0].x} ${points[0].y}
    L ${points[2].x} ${points[2].y}
    M ${points[1].x} ${points[1].y}
    L ${points[3].x} ${points[3].y}
  `;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", dPath);
  path.setAttribute("class", "astrology-line");
  svg.appendChild(path);
}

// 绑定窗口改变时自动重画三方四正线条，防止错位
window.addEventListener("resize", () => {
  const activeCell = document.querySelector(".palace-cell.active-palace");
  if (activeCell) {
    const idx = parseInt(activeCell.getAttribute("data-index"));
    drawSanFangSiZheng(idx);
  }
});

// 绑定3D景深倾斜特效 (Parallax 3D Hover Tilt)
function apply3DTilt() {
  const cells = document.querySelectorAll(".palace-cell");
  cells.forEach(cell => {
    // 鼠标在格子内滑动时计算倾斜角
    cell.addEventListener("mousemove", (e) => {
      const rect = cell.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // 最大旋转角度为 7.5 度
      const rotateX = ((centerY - y) / centerY) * 7.5;
      const rotateY = ((x - centerX) / centerX) * 7.5;
      
      cell.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
      cell.style.boxShadow = `0 10px 25px rgba(0, 229, 255, 0.25), 0 0 15px rgba(212, 175, 55, 0.15)`;
      cell.style.zIndex = "4";
    });

    // 移开重置
    cell.addEventListener("mouseleave", () => {
      cell.style.transform = "";
      cell.style.boxShadow = "";
      cell.style.zIndex = "";
    });
  });
}

// 渲染命盘数据
function renderChart(chartData) {
  const info = chartData.info;
  const palaces = chartData.palaces;

  // 填充中宫
  const centerPlate = document.getElementById("center-plate-info");
  centerPlate.innerHTML = `
    <h3>${info.name}</h3>
    <span class="badge ${info.isMale ? 'badge-lu' : 'badge-ji'}">${info.isYangYear}${info.gender}命</span>
    
    <div class="bazi-title">乾坤八字</div>
    <div class="bazi-text">${info.bazi}</div>
    
    <div class="meta-grid">
      <div class="meta-item">公历：<span>${info.solarDate}</span></div>
      <div class="meta-item">农历：<span>${info.lunarDate}</span></div>
      <div class="meta-item">五行局：<span style="color:${getPhaseColor(info.phase)}">${info.phase}</span></div>
      <div class="meta-item">生肖属相：<span>${info.animal}</span></div>
    </div>
  `;

  // 填充12宫位
  palaces.forEach((pal, index) => {
    const cell = document.getElementById(`palace-${index}`);
    if (!cell) return;

    // 清空重置
    cell.className = "palace-cell";
    cell.setAttribute("data-index", index);
    cell.innerHTML = "";

    // 检查并标注命宫闪烁
    const cleanPalName = pal.palaceName.replace(" (身宫)", "");
    if (cleanPalName === "命宫") {
      cell.classList.add("life-palace-style");
    }

    // A. 顶部主星和吉凶星
    const topRow = document.createElement("div");
    topRow.className = "palace-top";

    const majorContainer = document.createElement("div");
    majorContainer.className = "major-stars-container";
    
    const majorStars = pal.stars.filter(s => s.type === "major");
    majorStars.forEach(star => {
      const starEl = document.createElement("div");
      starEl.className = "star-major-text";
      if (star.sihua) {
        starEl.classList.add("with-sihua");
      }
      starEl.textContent = star.rawName;
      majorContainer.appendChild(starEl);
    });

    const minorContainer = document.createElement("div");
    minorContainer.className = "minor-stars-container";
    
    const minorStars = pal.stars.filter(s => s.type !== "major");
    minorStars.forEach(star => {
      const starEl = document.createElement("div");
      starEl.className = `star-minor-text ${star.type}`;
      starEl.textContent = star.rawName;
      minorContainer.appendChild(starEl);

      if (star.sihua) {
        const shEl = document.createElement("div");
        shEl.className = `star-minor-text sihua-tag sihua-tag-${star.sihua}`;
        shEl.textContent = `化${star.sihua}`;
        minorContainer.appendChild(shEl);
      }
    });

    topRow.appendChild(majorContainer);
    topRow.appendChild(minorContainer);

    // B. 底部宫干与名称
    const bottomRow = document.createElement("div");
    bottomRow.className = "palace-bottom";

    const metaRow = document.createElement("div");
    metaRow.className = "palace-meta-row";

    const nameEl = document.createElement("div");
    nameEl.className = "palace-name-text";
    nameEl.textContent = pal.palaceName;
    
    const branchEl = document.createElement("div");
    branchEl.className = "palace-branch-text";
    branchEl.textContent = pal.stemCn + pal.branchCn;

    metaRow.appendChild(nameEl);
    metaRow.appendChild(branchEl);

    const decadeEl = document.createElement("div");
    decadeEl.className = "palace-decades-text";
    decadeEl.textContent = pal.decades;

    bottomRow.appendChild(metaRow);
    bottomRow.appendChild(decadeEl);

    cell.appendChild(topRow);
    cell.appendChild(bottomRow);

    // C. 绑定点击交互，绘制三方四正连线并展示释义
    cell.addEventListener("click", () => {
      document.querySelectorAll(".palace-cell").forEach(c => c.classList.remove("active-palace"));
      cell.classList.add("active-palace");

      // 1. 在命盘中动态勾勒三方四正几何线
      drawSanFangSiZheng(index);

      // 2. 加载详批
      const expHtml = interpretations.getExplanation(pal.palaceName, pal.stars);
      const expContent = document.getElementById("exp-content");
      const expPlaceholder = document.getElementById("exp-placeholder");

      expPlaceholder.style.display = "none";
      expContent.innerHTML = expHtml;
      expContent.style.display = "block";

      // 3. 移动端展开底部抽屉
      const drawer = document.getElementById("exp-drawer");
      const backdrop = document.getElementById("drawer-backdrop");
      if (drawer) drawer.classList.add("drawer-open");
      if (backdrop) backdrop.classList.add("active");
    });
  });

  // 渲染完所有格子后，绑定3D Perspective 倾斜动效
  apply3DTilt();
}

function getPhaseColor(phaseName) {
  if (phaseName.includes("金")) return "#ffd700";
  if (phaseName.includes("木")) return "#4caf50";
  if (phaseName.includes("水")) return "#2196f3";
  if (phaseName.includes("火")) return "#ff5252";
  if (phaseName.includes("土")) return "#ff9800";
  return "#fff";
}

/* ==========================================
   4. 斗数课堂 (学习视图) 交互
   ========================================== */
function initLearnView() {
  const menuItems = document.querySelectorAll(".sidebar-menu .menu-item");
  const lessonPanes = document.querySelectorAll(".learn-content .lesson-pane");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const lessonId = item.getAttribute("data-lesson");

      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      lessonPanes.forEach(pane => {
        pane.classList.remove("active");
        if (pane.id === lessonId) {
          pane.classList.add("active");
        }
      });
    });
  });
}

function switchStarTab(categoryId) {
  const tabButtons = document.querySelectorAll(".stars-tabs .star-tab-btn");
  const tabPanes = document.querySelectorAll(".stars-tabs-content .star-tab-pane");

  tabButtons.forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("onclick").includes(categoryId)) {
      btn.classList.add("active");
    }
  });

  tabPanes.forEach(pane => {
    pane.classList.remove("active");
    if (pane.id === categoryId) {
      pane.classList.add("active");
    }
  });
}

window.switchStarTab = switchStarTab;

// 移动端关闭底部详批抽屉
function closeMobileDrawer() {
  const drawer = document.getElementById("exp-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  if (drawer) drawer.classList.remove("drawer-open");
  if (backdrop) backdrop.classList.remove("active");
}
window.closeMobileDrawer = closeMobileDrawer;

// 设置性别契约卡片状态
function setGender(genderVal) {
  document.getElementById("pactGender").value = genderVal;
  const cards = document.querySelectorAll(".gender-pact-card");
  cards.forEach(card => {
    card.classList.remove("active");
    if (card.getAttribute("data-gender") === genderVal) {
      card.classList.add("active");
    }
  });
}
window.setGender = setGender;

// 设置追求之间契约卡片状态
function setQuest(questVal) {
  document.getElementById("pactQuest").value = questVal;
  const cards = document.querySelectorAll(".quest-pact-card");
  cards.forEach(card => {
    card.classList.remove("active");
    if (card.getAttribute("data-quest") === questVal) {
      card.classList.add("active");
    }
  });
}
window.setQuest = setQuest;

// 15. Web Audio API  procedurally generated Guzheng BGM
let audioCtx = null;
let bgmPlaying = false;
let padOscs = [];
let padGain = null;
let pluckTimeout = null;

function initBGM() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // 1. 产生暖色低频太空背景弦乐
  padGain = audioCtx.createGain();
  padGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
  
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(150, audioCtx.currentTime);
  
  padGain.connect(lowpass);
  lowpass.connect(audioCtx.destination);
  
  const freqs = [65.41, 98.00, 130.81]; // C2, G2, C3
  freqs.forEach(f => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, audioCtx.currentTime);
    osc.connect(padGain);
    osc.start();
    padOscs.push(osc);
  });
  
  // 2. 空间延时回音链 (Space Delay Line)
  const delayNode = audioCtx.createDelay(2.0);
  delayNode.delayTime.setValueAtTime(0.6, audioCtx.currentTime); // 600ms 延迟
  
  const delayGain = audioCtx.createGain();
  delayGain.gain.setValueAtTime(0.35, audioCtx.currentTime); // 35% 反馈量
  
  delayNode.connect(delayGain);
  delayGain.connect(delayNode);
  delayNode.connect(audioCtx.destination);
  
  // 古琴/古筝 五声调式音符宮商角徵羽
  const pentatonicNotes = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00  // A5
  ];
  
  function playPluck() {
    if (!bgmPlaying) return;
    
    const note = pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
    
    const osc = audioCtx.createOscillator();
    const pluckGain = audioCtx.createGain();
    
    // 三角波兼备暖度与古琴的弹拨音质
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note, audioCtx.currentTime);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    
    pluckGain.gain.setValueAtTime(0, audioCtx.currentTime);
    pluckGain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.05); // Attack
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.8); // Decay
    
    osc.connect(filter);
    filter.connect(pluckGain);
    
    pluckGain.connect(audioCtx.destination);
    pluckGain.connect(delayNode);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 2.0);
  }
  
  function schedulePlucks() {
    const nextTime = 2500 + Math.random() * 3500; // 每2.5-6秒拨弦一次
    pluckTimeout = setTimeout(() => {
      playPluck();
      schedulePlucks();
    }, nextTime);
  }
  
  schedulePlucks();
}

function toggleBGM() {
  const btn = document.getElementById("bgm-toggle");
  const mutedIcon = btn.querySelector(".bgm-icon-muted");
  const playingIcon = btn.querySelector(".bgm-icon-playing");
  
  if (!audioCtx) {
    initBGM();
  }
  
  if (bgmPlaying) {
    if (padGain) {
      padGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
    bgmPlaying = false;
    mutedIcon.style.display = "block";
    playingIcon.style.display = "none";
    btn.classList.remove("playing");
  } else {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (padGain) {
      padGain.gain.setTargetAtTime(0.015, audioCtx.currentTime, 0.2);
    }
    bgmPlaying = true;
    mutedIcon.style.display = "none";
    playingIcon.style.display = "block";
    btn.classList.add("playing");
  }
}
window.toggleBGM = toggleBGM;

// 16. 首页八卦星盘手势/鼠标滑屏拖拽自转交互
function initZodiacGestures() {
  const wrapper = document.querySelector(".zodiac-circle-wrapper");
  if (!wrapper) return;
  
  let touchStartX = 0;
  let baseRotation = 0;
  let activeOffset = 0;
  
  let isDragging = false;
  let dragStartX = 0;
  
  // 触屏滑动旋转
  wrapper.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    wrapper.style.transition = "none";
  });
  
  wrapper.addEventListener("touchmove", (e) => {
    const diff = e.touches[0].clientX - touchStartX;
    activeOffset = diff * 0.4;
    wrapper.style.transform = `scale(1) rotate(${baseRotation + activeOffset}deg)`;
  });
  
  wrapper.addEventListener("touchend", () => {
    baseRotation += activeOffset;
    activeOffset = 0;
    wrapper.style.transition = "transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
  });
  
  // 电脑端鼠标按住拖拽自转
  wrapper.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    wrapper.style.transition = "none";
    wrapper.style.cursor = "grabbing";
  });
  
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    activeOffset = diff * 0.4;
    wrapper.style.transform = `scale(1) rotate(${baseRotation + activeOffset}deg)`;
  });
  
  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    baseRotation += activeOffset;
    activeOffset = 0;
    wrapper.style.transition = "transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
    wrapper.style.cursor = "";
  });
}



