/* ============================================================
 * 玄机阁 · 中英文切换 (i18n)
 * ------------------------------------------------------------
 * - 默认中文，可切换 English
 * - 语言选择保存在 localStorage (xjg_lang)
 * - 静态文案用 data-i18n / data-i18n-placeholder / data-i18n-title
 * - 动态模块调用 I18N.t(key)，并监听 document 的 'i18n:changed'
 * ============================================================ */
(function (global) {
    'use strict';

    var LANG_KEY = 'xjg_lang';

    var DICT = {
        zh: {
            /* 通用 */
            'common.brandSubtitle': '东方命理门户',
            'common.navOracle': '星轨神谕',
            'common.navZiwei': '紫微天枢',
            'common.navIching': '赛博周易',
            'common.backHome': '玄机阁',
            'common.cost': '1 积分/次',

            /* 门户首页 */
            'portal.kicker': 'PREMIUM ORACLE EXPERIENCE',
            'portal.heroDesc': '一座为东方玄学与现代交互而生的高颜值命理门户。星轨、斗数、周易三条命运路径在此交汇，以光影、符印与 AI 神谕，为你呈现更具仪式感的探索体验。',
            'portal.metricCount': '命理系统',
            'portal.metricAI': '智能解读',
            'portal.metricLive': '沉浸交互',
            'portal.ctaEnter': '进入命理之门',
            'portal.ctaTry': '立即体验星轨神谕',
            'portal.sectionKicker': 'Choose Your Portal',
            'portal.sectionTitle': '选择命理之门',
            'portal.sectionNote': '三条不同气质的命运路径，从星盘契约到六爻起卦，为你提供高颜值、强沉浸的玄学体验。',
            'portal.card1Name': '星轨神谕',
            'portal.card1Desc': 'AI 融合西方星盘玄术，以星粒流光、塔罗镜像与契约仪式，解读你的宇宙运势与命运轨迹。',
            'portal.card1Meta1': '星盘契约',
            'portal.card1Meta2': '塔罗指引',
            'portal.card1Tag1': '星座占星',
            'portal.card1Tag2': 'AI神谕',
            'portal.card1Tag3': '宇宙运势',
            'portal.card1Cta': '进入神谕殿堂',
            'portal.card2Name': '紫微天枢',
            'portal.card2Desc': '皇家紫金美学下的紫微斗数排盘系统，以十二宫位与星曜流转，推演人生格局与运势脉络。',
            'portal.card2Meta1': '在线排盘',
            'portal.card2Meta2': '斗数课堂',
            'portal.card2Tag1': '紫微斗数',
            'portal.card2Tag2': '十二宫位',
            'portal.card2Tag3': '八字排盘',
            'portal.card2Cta': '进入天枢殿堂',
            'portal.card3Name': '赛博周易',
            'portal.card3Desc': '水墨玄学与赛博霓虹的终极融合。六十四卦演算、爻线推演与画符仪式，开启全息天机占卜之旅。',
            'portal.card3Meta1': '六爻起卦',
            'portal.card3Meta2': '画符仪式',
            'portal.card3Tag1': '六十四卦',
            'portal.card3Tag2': '爻线推演',
            'portal.card3Tag3': 'AI解卦',
            'portal.card3Cta': '进入易经殿堂',
            'portal.footer': '玄机阁 · XUAN JI GE · 东方命理门户 · 2026',

            /* 登录 / 积分 */
            'auth.login': '登录',
            'auth.logout': '退出登录',
            'auth.register': '注册',
            'auth.username': '用户名',
            'auth.password': '密码',
            'auth.usernamePh': '请输入用户名',
            'auth.passwordPh': '请输入密码',
            'auth.usernamePhReg': '2-16 个字符',
            'auth.passwordPhReg': '至少 4 位',
            'auth.submitLogin': '登 录',
            'auth.submitRegister': '注册并领取 10 积分',
            'auth.modalTitle': '玄机阁 · 账户',
            'auth.modalSub': '登录后即可使用积分占卜',
            'auth.balance': '剩余积分',
            'auth.panelRole': '命理行者',
            'auth.panelTip': '每次占卜消耗 1 积分，每日签到 +3',
            'auth.checkin': '每日签到 +3 积分',
            'auth.modalTip': '新用户注册即送 10 积分 · 每次占卜消耗 1 积分 · 每日签到 +3 积分',
            'auth.insufficient': '积分不足',
            'auth.insufficientSub': '每次占卜需要 1 积分',
            'auth.currentBalance': '当前余额：',
            'auth.points': '积分',
            'auth.goLogin': '去登录',
            'auth.localOnly': '积分仅存于本机浏览器，用于解锁占卜体验',
            'auth.errUserShort': '用户名至少 2 个字符',
            'auth.errPassShort': '密码至少 4 位',
            'auth.errUserExists': '该用户名已存在，请直接登录',
            'auth.errNoUser': '用户不存在，请先注册',
            'auth.errWrongPass': '密码错误',
            'auth.errLoginFirst': '请先登录',
            'auth.errCheckedToday': '今天已经签到过啦',
            'auth.msgLoginFirst': '请先登录，每次占卜消耗 1 积分',
            'auth.msgSpent': '已消耗 1 积分，剩余',
            'auth.msgRegisterOk': '注册成功，赠送 10 积分',
            'auth.msgLoginOk': '欢迎回来，',
            'auth.msgCheckinOk': '签到成功 +3 积分',
            'auth.msgLogout': '已退出登录',

            /* 多解读师 */
            'reader.badgePlain': '说人话解读',
            'reader.badgeAI': 'AI 深度解读',
            'reader.badgeAISub': '外接大模型 · 说人话',
            'reader.settings': '外接AI',
            'reader.offline': '外接AI未连接，已用本地解读',
            'reader.modalTitle': '外接 AI 解读',
            'reader.modalSub': '接入 OpenAI 兼容接口，让真·大模型来给你说人话',
            'reader.enabled': '是否启用外接 AI',
            'reader.endpoint': '接口地址 Endpoint',
            'reader.model': '模型 Model',
            'reader.apikey': 'API Key',
            'reader.save': '保存设置',
            'reader.warn': '纯静态站：Key 仅存在你本机浏览器，会随请求明文发出；浏览器直连可能被 CORS 拦截，正式上线请走你自己的后端代理转发。',

            /* 子页面通用 */
            'page.systemCount': '命理系统',
            'sub.home': '首页',
            'sub.learn': '斗数课堂',
            'sub.calc': '在线排盘',
            'sub.startDivination': '启动占卜',
            'sub.startOracle': '召唤星轨神谕',

            /* 星轨神谕 */
            'oracle.subtitle': 'AI 智能星盘与命运塔罗占卜',
            'oracle.tag1': '星盘契约',
            'oracle.tag2': '塔罗镜像',
            'oracle.tag3': 'AI 神谕',
            'oracle.desc': '基于星相物理量子偏振模拟，解译您此生与群星交汇的引力波。让古老占星密钥与 AI 智慧为您拨开命运的重重迷雾。',
            'oracle.enter': '开启命运之门',
            'oracle.contractTitle': '星盘契约',
            'oracle.contractSub': '请留下您的印记，以便AI读取对应的宇宙频率',
            'oracle.name': '您的称呼',
            'oracle.namePh': '输入名字或代号',
            'oracle.birth': '诞生之日',
            'oracle.autoZodiac': '自动测算星轨...',
            'oracle.question': '具体想问的事（写原话，回答才对题）',
            'oracle.questionPh': '例如：我是不是舔狗？要不要表白？他是不是渣？',
            'oracle.focus': '追寻之问（选择您最想探寻的运势领域）',
            'oracle.focusGeneral': '综合运势',
            'oracle.focusLove': '恋爱情感',
            'oracle.focusCareer': '事业学业',
            'oracle.focusWealth': '财富走势',
            'oracle.focusHealth': '健康指引',
            'oracle.submit': '召唤星轨神谕',
            'oracle.drawTitle': '手书契印',
            'oracle.drawSub': '请凭直觉在圆盘中画出您的命运符号（画完才会激发光芒）',
            'oracle.drawReset': '重置符印',
            'oracle.drawConfirm': '灌注星能并召唤',
            'oracle.loading': '正在呼唤星辰...',

            /* 赛博周易 */
            'iching.systemTag': '六十四卦 · 全息占卜',
            'iching.systemSub': '赛博纪元 · 古老智慧的数字回响。在0与1之间，寻找天地的启示。',
            'iching.tag1': '画符仪式',
            'iching.tag2': '六爻起卦',
            'iching.tag3': 'AI 解卦',
            'iching.ritualInput': 'RITUAL INPUT',
            'iching.formTitle': '起 卦',
            'iching.formSub': '心诚则灵，静心默念你的问题，点击起卦',
            'iching.category': '问事类别',
            'iching.categoryPh': '-- 请选择 --',
            'iching.catCareer': '事业前途',
            'iching.catLove': '情缘人际',
            'iching.catWealth': '财运亨通',
            'iching.catHealth': '身心行止',
            'iching.catGeneral': '终生大局',
            'iching.question': '你的问题或想说的话（可选）',
            'iching.questionPh': '写下原话，例如：我是不是舔狗？要不要跳槽？该不该分手？',
            'iching.talismanTitle': '✦ 画符请愿',
            'iching.talismanSub': '摹画符咒 · 以诚感天',
            'iching.drawHint': '泼墨绘符',
            'iching.clear': '✕ 清除',
            'iching.confirm': '✓ 符成',
            'iching.cast': '☯ 起 卦',
            'iching.coinTitle': '[ 乾坤抛币阵 ]',
            'iching.castCount': '已推演卦象：',
            'iching.castBtn': '投掷铜钱（寻爻）',
            'iching.yaoTitle': '天机爻位',
            'iching.restart': '再次占卜 (重置)',
            'iching.locked': '天机已锁 // SECURE HASH',
            'iching.thanks': '赛博天机台结缘',

            /* 紫微天枢 */
            'ziwei.pageKicker': 'IMPERIAL STAR CHART',
            'ziwei.subtitle': '洞察星盘奥秘 ✦ 解读宿命轨迹',
            'ziwei.desc': '紫微斗数是中华传统的星命学之首，以出生时间排定乾坤十二宫，分布诸星曜，推算人一生的性格、财运、事业、婚姻及健康。我们为您提供现代美学设计的排盘工具，以及系统科学的学习课堂。',
            'ziwei.feature1': '十二宫位',
            'ziwei.feature2': '精准排盘',
            'ziwei.feature3': '斗数课堂',
            'ziwei.btnCalc': '立即在线排盘',
            'ziwei.btnLearn': '进入斗数课堂',
            'ziwei.pactTitle': '星盘契约',
            'ziwei.pactSub': '请留下您的印记，以便AI读取对应的宇宙频率',
            'ziwei.name': '您的称呼',
            'ziwei.namePh': '输入名字或代号',
            'ziwei.gender': '您的性别',
            'ziwei.male': '乾造 (男)',
            'ziwei.female': '坤造 (女)',
            'ziwei.calendar': '历法选择',
            'ziwei.solar': '阳历 (公历)',
            'ziwei.lunar': '阴历 (农历)',
            'ziwei.birth': '诞生之日',
            'ziwei.hour': '出生时辰',
            'ziwei.focus': '追求之间 (选择您最想探寻的运势领域)',
            'ziwei.focusGeneral': '综合运势',
            'ziwei.focusLove': '恋爱情感',
            'ziwei.focusCareer': '事业学业',
            'ziwei.focusWealth': '财富走势',
            'ziwei.focusHealth': '健康指引',
            'ziwei.question': '具体想问的事（可选）',
            'ziwei.questionPh': '例如：我是不是舔狗？要不要表白？今年能发财吗？',
            'ziwei.submit': '召唤星轨神谕',
            'ziwei.footer': '© 2026 紫微天枢. 洞察乾坤，敬畏宿命.'
        },
        en: {
            /* common */
            'common.brandSubtitle': 'Eastern Divination Portal',
            'common.navOracle': 'Star Oracle',
            'common.navZiwei': 'Purple Star',
            'common.navIching': 'Cyber I Ching',
            'common.backHome': 'Xuan Ji Ge',
            'common.cost': '1 point/reading',

            /* portal */
            'portal.kicker': 'PREMIUM ORACLE EXPERIENCE',
            'portal.heroDesc': 'A premium divination portal blending Eastern mysticism with modern interaction. Three paths — star oracle, Zi Wei chart, and I Ching — converge here with light, sigils and AI guidance for a truly ritual experience.',
            'portal.metricCount': 'Systems',
            'portal.metricAI': 'AI Reading',
            'portal.metricLive': 'Immersive',
            'portal.ctaEnter': 'Enter the Gate',
            'portal.ctaTry': 'Try Star Orbit Oracle',
            'portal.sectionKicker': 'Choose Your Portal',
            'portal.sectionTitle': 'Choose Your Portal',
            'portal.sectionNote': 'Three paths with distinct characters — from a star contract to hexagram casting — for a polished, immersive mystic experience.',
            'portal.card1Name': 'Star Orbit Oracle',
            'portal.card1Desc': 'AI meets Western astrology. Starlight particles, tarot mirrors and ritual contracts decode your cosmic fortune and destiny.',
            'portal.card1Meta1': 'Star Contract',
            'portal.card1Meta2': 'Tarot Guide',
            'portal.card1Tag1': 'Astrology',
            'portal.card1Tag2': 'AI Oracle',
            'portal.card1Tag3': 'Cosmic Fortune',
            'portal.card1Cta': 'Enter the Oracle',
            'portal.card2Name': 'Purple Star Astrology',
            'portal.card2Desc': 'A royal Zi Wei Dou Shu charting system. Twelve palaces and shifting stars reveal your life pattern and fortune.',
            'portal.card2Meta1': 'Online Chart',
            'portal.card2Meta2': 'Lessons',
            'portal.card2Tag1': 'Zi Wei Dou Shu',
            'portal.card2Tag2': 'Twelve Palaces',
            'portal.card2Tag3': 'BaZi Chart',
            'portal.card2Cta': 'Enter the Palace',
            'portal.card3Name': 'Cyber Zhou Yi',
            'portal.card3Desc': 'Ink mysticism fused with cyber neon. 64 hexagrams, line casting and talisman rituals unlock a holographic divination journey.',
            'portal.card3Meta1': 'Hexagram Cast',
            'portal.card3Meta2': 'Talisman Rite',
            'portal.card3Tag1': '64 Hexagrams',
            'portal.card3Tag2': 'Line Reading',
            'portal.card3Tag3': 'AI Reading',
            'portal.card3Cta': 'Enter the I Ching',
            'portal.footer': 'XUAN JI GE · Eastern Divination Portal · 2026',

            /* auth */
            'auth.login': 'Sign In',
            'auth.logout': 'Sign Out',
            'auth.register': 'Sign Up',
            'auth.username': 'Username',
            'auth.password': 'Password',
            'auth.usernamePh': 'Enter username',
            'auth.passwordPh': 'Enter password',
            'auth.usernamePhReg': '2-16 characters',
            'auth.passwordPhReg': 'At least 4 characters',
            'auth.submitLogin': 'Sign In',
            'auth.submitRegister': 'Sign up & get 10 points',
            'auth.modalTitle': 'Xuan Ji Ge · Account',
            'auth.modalSub': 'Sign in to use point-based readings',
            'auth.balance': 'Balance',
            'auth.panelRole': 'Seeker',
            'auth.panelTip': 'Each reading costs 1 point · daily check-in +3',
            'auth.checkin': 'Daily check-in +3 points',
            'auth.modalTip': 'New users get 10 points · 1 point per reading · +3 daily check-in',
            'auth.insufficient': 'Not Enough Points',
            'auth.insufficientSub': 'Each reading costs 1 point',
            'auth.currentBalance': 'Balance: ',
            'auth.points': 'points',
            'auth.goLogin': 'Go to Sign In',
            'auth.localOnly': 'Points are stored only in this browser, used to unlock readings',
            'auth.errUserShort': 'Username must be at least 2 characters',
            'auth.errPassShort': 'Password must be at least 4 characters',
            'auth.errUserExists': 'That username already exists — sign in instead',
            'auth.errNoUser': 'User not found — sign up first',
            'auth.errWrongPass': 'Wrong password',
            'auth.errLoginFirst': 'Please sign in first',
            'auth.errCheckedToday': 'You already checked in today',
            'auth.msgLoginFirst': 'Please sign in first — each reading costs 1 point',
            'auth.msgSpent': '1 point used, balance ',
            'auth.msgRegisterOk': 'Signed up! 10 points gifted',
            'auth.msgLoginOk': 'Welcome back, ',
            'auth.msgCheckinOk': 'Check-in success, +3 points',
            'auth.msgLogout': 'Signed out',

            /* reader */
            'reader.badgePlain': 'Plain-speak reading',
            'reader.badgeAI': 'AI deep reading',
            'reader.badgeAISub': 'External LLM · plain speak',
            'reader.settings': 'AI Setup',
            'reader.offline': 'External AI offline — using local reading',
            'reader.modalTitle': 'External AI Reading',
            'reader.modalSub': 'Connect an OpenAI-compatible API for real LLM plain-speak readings',
            'reader.enabled': 'Enable external AI',
            'reader.endpoint': 'Endpoint',
            'reader.model': 'Model',
            'reader.apikey': 'API Key',
            'reader.save': 'Save',
            'reader.warn': 'Static site: the key is stored only in your browser and sent in plain text; direct browser calls may be blocked by CORS. Use your own backend proxy in production.',

            /* subpage common */
            'page.systemCount': 'Systems',
            'sub.home': 'Home',
            'sub.learn': 'Lessons',
            'sub.calc': 'Chart',
            'sub.startDivination': 'Start Reading',
            'sub.startOracle': 'Summon the Oracle',

            /* oracle */
            'oracle.subtitle': 'AI Astro Chart & Destiny Tarot',
            'oracle.tag1': 'Star Contract',
            'oracle.tag2': 'Tarot Mirror',
            'oracle.tag3': 'AI Oracle',
            'oracle.desc': 'Based on astro-physical quantum polarization simulation, decode the gravity waves between you and the stars. Let ancient astrology keys and AI wisdom clear the fog of fate.',
            'oracle.enter': 'Open the Gate of Fate',
            'oracle.contractTitle': 'Star Contract',
            'oracle.contractSub': 'Leave your mark so the AI can read your cosmic frequency',
            'oracle.name': 'Your name',
            'oracle.namePh': 'Name or alias',
            'oracle.birth': 'Date of birth',
            'oracle.autoZodiac': 'Detecting zodiac...',
            'oracle.question': 'Your specific question (write it in your own words)',
            'oracle.questionPh': 'e.g. Am I being too needy? Should I confess? Is he a player?',
            'oracle.focus': 'Your focus (pick the area you care about most)',
            'oracle.focusGeneral': 'Overall',
            'oracle.focusLove': 'Love',
            'oracle.focusCareer': 'Career & Study',
            'oracle.focusWealth': 'Wealth',
            'oracle.focusHealth': 'Health',
            'oracle.submit': 'Summon the Star Oracle',
            'oracle.drawTitle': 'Hand-drawn Seal',
            'oracle.drawSub': 'Draw your fate symbol in the circle by intuition (light activates only when drawn)',
            'oracle.drawReset': 'Reset',
            'oracle.drawConfirm': 'Infuse & Summon',
            'oracle.loading': 'Calling the stars...',

            /* iching */
            'iching.systemTag': '64 Hexagrams · Holographic Divination',
            'iching.systemSub': 'Cyber era · the digital echo of ancient wisdom. Between 0 and 1, seek the heavens\u2019 hint.',
            'iching.tag1': 'Talisman Rite',
            'iching.tag2': 'Hexagram Cast',
            'iching.tag3': 'AI Reading',
            'iching.ritualInput': 'RITUAL INPUT',
            'iching.formTitle': 'Cast',
            'iching.formSub': 'Quiet your mind, silently ask your question, then cast',
            'iching.category': 'Category',
            'iching.categoryPh': '-- Choose --',
            'iching.catCareer': 'Career',
            'iching.catLove': 'Love',
            'iching.catWealth': 'Wealth',
            'iching.catHealth': 'Health',
            'iching.catGeneral': 'Life',
            'iching.question': 'Your question or words (optional)',
            'iching.questionPh': 'e.g. Am I being needy? Should I quit? Should we break up?',
            'iching.talismanTitle': '✦ Draw a Talisman',
            'iching.talismanSub': 'Trace the charm · sincerity moves heaven',
            'iching.drawHint': 'Draw here',
            'iching.clear': '✕ Clear',
            'iching.confirm': '✓ Done',
            'iching.cast': '☯ Cast',
            'iching.coinTitle': '[ Coin Casting Array ]',
            'iching.castCount': 'Lines cast: ',
            'iching.castBtn': 'Toss Coins (draw a line)',
            'iching.yaoTitle': 'Hexagram Lines',
            'iching.restart': 'Cast Again (Reset)',
            'iching.locked': 'Fate locked // SECURE HASH',
            'iching.thanks': 'Cyber Divination Console',

            /* ziwei */
            'ziwei.pageKicker': 'IMPERIAL STAR CHART',
            'ziwei.subtitle': 'Read the star chart ✦ decode your destiny',
            'ziwei.desc': 'Zi Wei Dou Shu is the foremost Chinese star-destiny study. It lays out twelve palaces by birth time and distributes the stars to read character, wealth, career, marriage and health. We offer a beautifully modern charting tool and structured lessons.',
            'ziwei.feature1': '12 Palaces',
            'ziwei.feature2': 'Accurate Chart',
            'ziwei.feature3': 'Lessons',
            'ziwei.btnCalc': 'Chart Now',
            'ziwei.btnLearn': 'Enter Lessons',
            'ziwei.pactTitle': 'Star Contract',
            'ziwei.pactSub': 'Leave your mark so the AI can read your cosmic frequency',
            'ziwei.name': 'Your name',
            'ziwei.namePh': 'Name or alias',
            'ziwei.gender': 'Gender',
            'ziwei.male': 'Qian (Male)',
            'ziwei.female': 'Kun (Female)',
            'ziwei.calendar': 'Calendar',
            'ziwei.solar': 'Solar (Gregorian)',
            'ziwei.lunar': 'Lunar',
            'ziwei.birth': 'Date of birth',
            'ziwei.hour': 'Birth hour',
            'ziwei.focus': 'Your focus (pick the area you care about most)',
            'ziwei.focusGeneral': 'Overall',
            'ziwei.focusLove': 'Love',
            'ziwei.focusCareer': 'Career & Study',
            'ziwei.focusWealth': 'Wealth',
            'ziwei.focusHealth': 'Health',
            'ziwei.question': 'Your question (optional)',
            'ziwei.questionPh': 'e.g. Am I being needy? Should I confess? Will I get rich this year?',
            'ziwei.submit': 'Summon the Oracle',
            'ziwei.footer': '© 2026 Purple Star Astrology. Read the cosmos, respect destiny.'
        }
    };

    function readLang() {
        try { return localStorage.getItem(LANG_KEY) || 'zh'; } catch (e) { return 'zh'; }
    }
    function writeLang(lang) {
        try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    }

    var lang = readLang() === 'en' ? 'en' : 'zh';

    function t(key) {
        var d = DICT[lang] || DICT.zh;
        return (d[key] !== undefined && d[key] !== null) ? d[key] : ((DICT.zh && DICT.zh[key] !== undefined) ? DICT.zh[key] : key);
    }

    function apply() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
        });
    }

    function updateToggle() {
        var btn = document.getElementById('i18n-toggle-label');
        if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中';
        var globe = document.getElementById('i18n-toggle');
        if (globe) globe.setAttribute('title', lang === 'zh' ? 'Switch to English' : '切换到中文');
    }

    function setLang(next) {
        if (next !== 'zh' && next !== 'en') return;
        if (next === lang) return;
        lang = next;
        writeLang(lang);
        apply();
        updateToggle();
        document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: lang } }));
    }

    function mount() {
        if (document.getElementById('i18n-toggle')) return;

        var style = document.createElement('style');
        style.textContent =
            '#i18n-toggle{position:fixed;left:20px;bottom:20px;z-index:9998;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,6,28,0.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:rgba(247,243,255,0.82);cursor:pointer;font-size:0.78rem;letter-spacing:0.06em;box-shadow:0 10px 30px rgba(0,0,0,0.35);transition:border-color .22s ease,color .22s ease,transform .22s ease;}' +
            '#i18n-toggle:hover{border-color:rgba(232,200,114,0.45);color:#ffe7a8;transform:translateY(-2px);}' +
            '#i18n-toggle .globe{font-size:0.9rem;}' +
            '@media(max-width:700px){#i18n-toggle{left:16px;bottom:16px;padding:8px 12px;}}';
        document.head.appendChild(style);

        var btn = document.createElement('button');
        btn.id = 'i18n-toggle';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Switch language');
        btn.innerHTML = '<span class="globe">🌐</span><span id="i18n-toggle-label">EN</span>';
        btn.addEventListener('click', function () {
            setLang(lang === 'zh' ? 'en' : 'zh');
        });
        document.body.appendChild(btn);
        updateToggle();
    }

    var api = {
        get lang() { return lang; },
        t: t,
        setLang: setLang,
        apply: apply,
        mount: mount,
        DICT: DICT
    };

    global.I18N = api;

    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }
    ready(function () {
        mount();
        apply();
    });
})(typeof window !== 'undefined' ? window : globalThis);
