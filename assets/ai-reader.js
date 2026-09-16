/* ============================================================
 * 玄机阁 · 多 AI 解读师 + 外接 AI 连接器（说人话版）
 * ------------------------------------------------------------
 * 1. 内置 5 位「解读师」，各有各的说话方式，但都讲人话：
 *    - 毒舌直男（原有丰富数据库）
 *    - 温柔姐姐
 *    - 江湖老师傅
 *    - 理性分析师
 *    - 过来人教练
 * 2. 支持外接 OpenAI 兼容接口（如 DeepSeek / OpenAI），
 *    配好 Endpoint + Key 后可切换到「真 AI」深度解读；
 *    未配置或请求失败时自动回落到本地解读师，保证永远有答案。
 *
 * 注意：纯静态站，API Key 只存在本机 localStorage，浏览器直连
 * 可能被 CORS 拦截，正式上线请走自己的后端代理转发。
 * ============================================================ */
(function (global) {
    'use strict';

    var CFG_KEY = 'xjg_ai_reader_cfg';

    function readJSON(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) { return fallback; }
    }
    function writeJSON(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* 中英文文案 */
    function t(key, zh) {
        return (typeof I18N !== 'undefined' && I18N && I18N.t) ? I18N.t(key) : zh;
    }

    function hashString(str) {
        var h = 0;
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    }

    function band(prob) { return prob >= 70 ? 'high' : prob >= 55 ? 'mid' : 'low'; }
    function pick(arr, seed) { return arr[seed % arr.length]; }

    // 判断问题类型，确保「是不是/该不该」这类问题答对题
    function questionKind(q) {
        q = (q || '').trim();
        if (/是不是|算不算|我是|我在|像不像|到底是不是|究竟是不是|我舔|我渣|我太/.test(q)) return 'affirm';
        if (/该不该|要不要|能不能|可不可以|值不值得|适合吗|会不会|要不要追|要不要分|要不要辞|要不要跳|要不要表/.test(q)) return 'decide';
        return 'other';
    }

    /* ---------- 本地解读师 ---------- */

    // 「毒舌直男」直接复用 PlainSpeak 的丰富数据库
    var PERSONA_STRAIGHT = {
        id: 'straight',
        name: '毒舌直男',
        emoji: '🗿',
        desc: '一针见血，专治自我感动'
    };

    var PERSONAS = [
        PERSONA_STRAIGHT,
        {
            id: 'gentle',
            name: '温柔姐姐',
            emoji: '🌸',
            desc: '不骂你，但句句说透',
            openers: [
                '来，我先把话说前面：我不是来吓你的，是想让你心里有底。',
                '你愿意认真问，我就认真答，不绕弯子。',
                '别紧张，这卦不玄乎，咱就当朋友之间聊个明白。'
            ],
            labelYesno: {
                high: ['大概率是可以的，别自己先泄气', '机会挺大，关键看你敢不敢接'],
                mid: ['一半一半，别急着下结论', '有戏但没那么稳，得你自己补一把'],
                low: ['短期内有点悬，先把心态放平', '眼下不太顺，但也不是判死刑']
            },
            labelAffirm: {
                high: ['基本是的，别急着否认', '挺像的，你自己也感觉到了'],
                mid: ['有点那个意思，还没到实锤', '一半一半，别给自己扣帽子'],
                low: ['还不像，先别多想', '不太是，放松点']
            },
            labelDecide: {
                high: ['可以试，别怕', '值得去做，往前迈一步'],
                mid: ['能做，但先想清楚', '别冲动，稳一点'],
                low: ['先别急着做，缓一缓', '这步先停，想明白再说']
            },
            labelHow: {
                high: ['整体偏顺，好好把握就行', '状态不错，别自己加戏'],
                mid: ['平平淡淡，不用太焦虑', '有起有落，正常'],
                low: ['这段会累一点，多照顾自己', '偏紧，先稳住别硬撑']
            },
            body: {
                love: {
                    high: [
                        '感情上是有好消息的，前提是你别老躲在屏幕后面猜。喜欢就大大方方聊，想见就约出来。机会是给敢开口的人留的，不是给「再等等」的人留的。',
                        '桃花不弱，但你得动起来。别把「顺其自然」当成不努力的借口，顺其自然也得先有互动。'
                    ],
                    mid: [
                        '感情这事急不来，先把自己状态调好，再谈谁配谁。对方对你忽冷忽热，多半是还没到那份上，别急着掏心。',
                        '有苗头，但别太早感动。多见面、多聊天，真实相处比脑补靠谱。'
                    ],
                    low: [
                        '这段更适合一个人待着，把上段情绪收拾干净。硬凑来的关系，最后累的是你自己。先把自己过舒服了。',
                        '别急着脱单，也别美化不合适的人。空窗期是补课，不是惩罚。'
                    ]
                },
                career: {
                    high: [
                        '工作或学业上是有进展的，抓住就冲，别临门一脚又怂。机会不等人，尤其不等「我再准备准备」的人。',
                        '适合往前迈一步。换工作、考试、提加薪，都比你原地纠结强。'
                    ],
                    mid: [
                        '有起色也有坑，稳着走。骑驴找马不丢人，别裸辞赌气。一步一步来，比你指望一次翻盘实在。',
                        '别把焦虑当努力。把眼前该做的做完，结果自然会往前挪一点。'
                    ],
                    low: [
                        '这段宜守不宜冲。先把手里的事做扎实，攒够筹码再谈换赛道。硬跳风险大。',
                        '压力会有点大，但别把「我撑不住」挂在嘴边。拆成小事一件件做，会缓过来的。'
                    ]
                },
                wealth: {
                    high: [
                        '财运是有起色的，但别一上头就乱投。赚到钱先留应急金，再谈折腾。钱最会教育手飘的人。',
                        '有进账的机会，记得守。能花也能存，才叫真的宽裕。'
                    ],
                    mid: [
                        '钱够用，但别乱花。先记账，把不必要的支出砍掉，比想暴富实在得多。',
                        '正财稳，偏财一般。别听人吹什么稳赚不赔，那多半是坑。'
                    ],
                    low: [
                        '这阵子手头会紧一点，先节流。不该买的先别买，不该投的先别投。守住现金比什么都强。',
                        '别想着靠运气翻本。先稳住基本盘，再慢慢攒。'
                    ]
                },
                health: {
                    high: [
                        '身体和精神都还撑得住，但也别仗着年轻就乱熬。规律作息，比吃啥补品都管用。',
                        '状态不错，继续保持。动一动、早点睡，你会更轻松。'
                    ],
                    mid: [
                        '容易累、容易烦，是身体在提醒你该休息了。别硬撑装没事，该歇就歇。',
                        '少刷手机早点睡，情绪会稳很多。健康这事，欠的账早晚要还。'
                    ],
                    low: [
                        '这段要重点照顾自己。失眠、焦虑别一个人扛，该休息休息，该找人聊找人聊。',
                        '先停掉熬夜和硬撑。身体垮了，啥运势都白搭。'
                    ]
                },
                general: {
                    high: [
                        '整体是往好走的，但路得你自己迈。别把好运当背景板，该出手就出手。',
                        '偏顺的一段，抓住节奏往前推。少犹豫，多行动，结果不会差。'
                    ],
                    mid: [
                        '平平顺顺，有喜有忧，正常。别把平淡过成苦情剧，也别把小确幸吹成人生巅峰。',
                        '能过，别作。最大的风险不是运气，是手欠和想太多。'
                    ],
                    low: [
                        '这段宜低调，先把基本盘稳住。别急着搏一把，先把能控的控好。',
                        '有点难，但只是调整期，不是终点。一件件做，会缓过来。'
                    ]
                }
            },
            analysis: {
                love: [
                    '说到底，感情里你容易想太多、又说得太少。想要的没讲出口，对方自然猜不到；对方一没回应，你又先自我怀疑。这样下去，本来有的缘分也会被你自己慢慢耗掉。',
                    '你这段感情的问题，往往不在对方，而在你把太多安全感押在了别人身上。他回得快你就安心，回得慢你就慌，这种状态本身就很累人。'
                ],
                career: [
                    '工作上的卡顿，很多时候不是能力问题，是方向没定、又急着要结果。想得太多做得太少，时间一久就成了内耗，机会来了也接不住。',
                    '你其实不是没机会，是总在「准备好了吗」和「会不会尴尬」之间反复横跳。等你想清楚，机会已经走了一半。'
                ],
                wealth: [
                    '钱的进出，背后其实是情绪。高兴了买一点、焦虑了再买一点，小钱一笔笔流走，月底才发现攒不下。不是赚得少，是留不住。',
                    '你对钱的规划偏随性，想起来才管一下。没有「节流」这根弦，再多的进账也经不起漏。'
                ],
                health: [
                    '身体的累，多半是情绪和作息一起欠下的账。白天硬撑着，晚上又舍不得睡，第二天更累，循环就这么转起来了。',
                    '你不是不想休息，是习惯了把「忙完再说」当理由。可身体不等人，它只会用越来越明显的信号提醒你。'
                ],
                general: [
                    '这段时间的起伏，很大程度来自你对自己要求太高，又容易因为一点不顺就否定全部。心态一乱，判断就跟着乱。',
                    '你总想在「完全准备好」之后再行动，但生活不会给你这个空档。越想稳妥，反而越容易原地打转。'
                ]
            },
            action: {
                love: [
                    '这周可以试一件事：把想说的话直接说一次，把想问的直接问一次。结果不管好坏，都比你自己在心里猜一百遍强。',
                    '先把节奏慢下来，别再秒回、别再反复翻聊天记录。给自己和对方都留点空间，关系反而会轻松起来。'
                ],
                career: [
                    '把大目标拆成这周能完成的三件小事，做完一件划掉一件。真正动起来，焦虑会小很多。',
                    '简历、作品、要谈的内容，先准备起来。每准备好一点，就多一分底气。'
                ],
                wealth: [
                    '先记一个月的账，把花销看清楚，再决定哪里能省。别小看这一步，它比你到处找发财门路有用得多。',
                    '给自己定条规矩：超过一定金额的消费，冷静一天再决定。冲动少一点，钱包就厚一点。'
                ],
                health: [
                    '从今晚开始，比昨天早睡半小时。坚持一周，你会明显感觉到状态不一样。',
                    '每天抽二十分钟动一动，散散步也行。身体动起来，情绪也会跟着松下来。'
                ],
                general: [
                    '先把眼前最小的一件事做完，别管它大不大。完成感会帮你找回节奏。',
                    '遇事先问自己「最坏能怎样」，把答案写下来。你会发现，多数焦虑没你想的那么严重。'
                ]
            },
            tail: {
                love: ['记住：喜欢就好好说，不合适就体面走。别耗着，耗的是你自己。', '最后一句：先爱自己，再爱人。这话老，但真。'],
                career: ['把大目标拆成这周能完成的小事，做完一件就往前挪一点。', '别用「我不适合」提前投降。不会就学，学了就会。'],
                wealth: ['记账一个月，你会发现钱不是没了，是被你亲手送走的。', '守钱比追风口重要。手稳的人，财运才留得住。'],
                health: ['早点睡，比囤补品管用。身体记账很准的。', '情绪也是需要照顾的，别只顾着身体。'],
                general: ['遇事先问「最坏能怎样」，你会发现一大半焦虑是瞎演。', '别把算一卦当行动替代品。卦算完，事还得你做。']
            }
        },
        {
            id: 'master',
            name: '江湖老师傅',
            emoji: '🧧',
            desc: '大白话给你捋得明明白白',
            openers: [
                '我给人看这行当久了，最烦绕圈子。就按你问的，给你捋一捋。',
                '不用整那些玄的，咱就事说事。',
                '你且听好，我这嘴没那么多弯弯绕。'
            ],
            labelYesno: {
                high: ['这事啊，八成能成', '能行，别自己吓自己'],
                mid: ['五五开，得看你怎么做', '成不成，一半靠天一半靠你'],
                low: ['眼下难成，先别硬来', '这事悬，缓缓更妥当']
            },
            labelAffirm: {
                high: ['八九不离十，就是这样', '差不离，别不认'],
                mid: ['有点那味，还不深', '一半对一半'],
                low: ['还不至于，别瞎想', '不像，放宽心']
            },
            labelDecide: {
                high: ['该动就动', '能成，放心干'],
                mid: ['做也行，稳着点', '五五开，看你自己'],
                low: ['先别动，缓缓', '这事先搁一搁']
            },
            labelHow: {
                high: ['顺当，放心干', '不错，别糟蹋了好势头'],
                mid: ['凑合，能过', '一般，别指望大起'],
                low: ['偏紧，先熬着', '不顺，先稳住']
            },
            body: {
                love: {
                    high: ['感情这块有门道，就看你会不会走。喜欢就吭声，别闷着，闷到最后黄了你还怪命。', '有戏。但光有戏没用，你得动。见个面、说句话，比你在心里演一百集强。'],
                    mid: ['这事急不得，火候没到。对方不上心，你就先晾一晾，别上赶着。', '一半机会。看准了再下注，别脑子一热就把话说满。'],
                    low: ['眼下这情分还浅，硬凑没意思。先把自己日子过利索了，人自然就来。', '别较劲。该走的留不住，该来的挡不住。']
                },
                career: {
                    high: ['工作上能往前拱一拱，该争取就争取。机会来了你缩着，那谁都救不了你。', '适合动。但动之前把手艺备齐，空着手去碰运气，那是给自己挖坑。'],
                    mid: ['有起有落，正常。别赌气跳槽，先骑驴找马，稳当。', '能往前挪，就是慢。慢就慢，别停。'],
                    low: ['这阵子宜守。先把手里活干漂亮了，再想别的。硬跳，容易摔。', '别逞能。先攒本事，本事在手，到哪都有口饭吃。']
                },
                wealth: {
                    high: ['财运有起色，但记住：钱是挣的，不是赌的。稳着点，别见风就上。', '能进账。进账了先攒着点，别左手进右手出。'],
                    mid: ['钱够花，就是不宽裕。省着点，别跟风乱买。', '正财稳，偏财少。别听人瞎咧咧，守住自己的钱袋子。'],
                    low: ['手头紧，先别折腾。该省的省，不该借的别借。', '别想着捞偏门翻身，十有八九是坑。']
                },
                health: {
                    high: ['身子骨还硬朗，但别作。熬夜这事，年轻时候不当回事，老了都给你记着。', '状态行，保持住。多动弹动弹，比啥都强。'],
                    mid: ['有点虚，是累的。该歇就歇，别硬扛，扛不出名堂。', '作息乱，身体自然闹脾气。早点睡，比吃药强。'],
                    low: ['这段得多当心。身体给你提了醒，别不当回事。该查查，该养养。', '先别谈啥运势了，把觉睡好、把饭吃饱，比啥都实在。']
                },
                general: {
                    high: ['整体是往上走的，就看你迈不迈腿。别光看，光看不下场，啥都白搭。', '顺当的一段。该办的事赶紧办，别磨蹭。'],
                    mid: ['不好不坏，稳着来。别折腾，折腾容易出岔子。', '能过。少想点有的没的，该干啥干啥。'],
                    low: ['这段低着点头，先把底子打牢。别急着翻本，翻不好更难看。', '难是难了点，但也就是一阵。熬过去就好了。']
                }
            },
            analysis: {
                love: [
                    '说白了吧，感情这事你吃亏就吃亏在「闷」和「急」两个字上。平时不吭声，憋到受不了又一下子全倒出来，对方还没反应过来，你先把自己搞难受了。',
                    '缘分这东西，有就有，没有就是没到。你现在是拿「喜欢」当执念，越够不着越想要，反而把自个儿架在半空，下不来。'
                ],
                career: [
                    '你这行当的事，一半靠本事，一半靠熬。你现在是本事有三分，心气有七分，老想着一口吃成胖子，脚下反而站不稳。',
                    '机会没来，不是你运气差，是时候没到。时候没到，你就先把地里的庄稼伺候好，别的先别想。'
                ],
                wealth: [
                    '钱这玩意儿跟人一样，留不住是因为你没把它当回事。手一松，它就往外跑；管得紧点，它才慢慢攒得下。',
                    '你不是穷，是散。这儿漏一点，那儿漏一点，年底一算账，自己都吓一跳。'
                ],
                health: [
                    '身体这事，年轻时候糟蹋，老了都给你记着。你现在这点小毛病，多半是熬夜和懒一点点攒出来的。',
                    '人呐，能扛是能扛，但别把「能扛」当本钱。等真扛不动那天，后悔就晚了。'
                ],
                general: [
                    '人这一辈子，起起落落是常事。你现在是心里乱，看啥都觉得没谱，其实路还在脚下，就是你自个儿不肯低头看路。',
                    '别总想着把什么都攥在手里。该放的放一放，该慢的慢一慢，日子才过得顺当。'
                ]
            },
            action: {
                love: [
                    '听我一句：喜欢的就去说，不合适的就趁早放。拖得越久，越不值当。',
                    '别老盯着手机等人回信，该干嘛干嘛去。把自己日子过好了，缘分自己会找上门。'
                ],
                career: [
                    '把手头的活儿先干利索，别挑肥拣瘦。本事攒下了，到哪都有口饭吃。',
                    '想换地方，先把下家看好了再动。骑驴找马不丢人，饿肚子才丢人。'
                ],
                wealth: [
                    '先记一个月的账，把漏的地方找出来。省下的，就是赚下的。',
                    '手头紧就别乱动，更别借钱去博。稳稳当当，比啥都强。'
                ],
                health: [
                    '早点睡，少熬夜。别的养生都是虚的，睡够了比啥都管用。',
                    '每天动一动，哪怕下楼走两圈。人勤快，身子就轻快。'
                ],
                general: [
                    '一步一步来，饭要一口一口吃。先把眼前的小事办妥了，别的慢慢说。',
                    '少想那些没影的，多干点看得见的。心定下来了，路就顺了。'
                ]
            },
            tail: {
                love: ['说句实在的：强扭的瓜不甜。顺其自然，是你的跑不了。', '缘分这事，一半看命，一半看你怎么待人家。'],
                career: ['记住：本事长在自己身上，谁也拿不走。', '别怕慢，就怕站。一步一步来。'],
                wealth: ['手要稳，心要定。财这东西，越急越不来。', '省一分是一分，攒下来的才是自己的。'],
                health: ['身体是本钱，别的都是零。本钱没了，啥都白搭。', '早睡早起，百病不欺。老话不骗人。'],
                general: ['路要一步一步走，饭要一口一口吃。别慌。', '人这一辈子，起起落落，稳着点总没错。']
            }
        },
        {
            id: 'logic',
            name: '理性分析师',
            emoji: '🧠',
            desc: '不讲玄学，只讲逻辑和概率',
            openers: [
                '我先说清楚：下面给你的是基于概率和常识的判断，不是玄学承诺。',
                '不绕了，直接给你拆开看。',
                '把情绪先放一边，我们用理性过一遍。'
            ],
            labelYesno: {
                high: ['从概率看，偏向可行', '有利因素更多，值得推进'],
                mid: ['各占一半，变量在你手里', '结果不确定，取决于你的动作'],
                low: ['目前条件不充分，建议观望', '概率偏低，先别下重注']
            },
            analysis: {
                love: [
                    '从信息角度看，你当前的主要问题是「反馈不足」：投入的信号多，回收的信号少，于是大脑自动用猜测填补空白，而猜测往往偏向最坏的可能。',
                    '这段关系的期望值偏低，核心变量是「对方的投入意愿」，而这个变量目前没有足够证据支撑。'
                ],
                career: [
                    '职业卡顿的本质，通常是「能力存量」与「机会窗口」的错配。你现在更需要的不是更多选择，而是可验证的成果，用来抬高自己的议价能力。',
                    '你面临的是一个典型的不确定决策：信息不足、路径不清。这种情况下，盲目行动和原地等待都不是最优解。'
                ],
                wealth: [
                    '财务紧张的根源大多不是收入太低，而是「现金流管理缺失」：支出无预算、应急金为零、消费由情绪驱动。',
                    '从风险收益比看，你现在处于「防守期」，任何高波动操作都会放大你的脆弱性。'
                ],
                health: [
                    '疲劳和情绪波动，本质是「恢复不足」的信号。身体有明确的反馈机制，你透支多少，它就会以效率和情绪的形式索回多少。',
                    '焦虑多数来自「无法掌控感」：事情悬而未决，大脑反复空转，消耗比实际解决问题还多。'
                ],
                general: [
                    '当前的混乱，主要源于「目标过多、优先级不清」。资源被摊薄，每个方向都推进缓慢，反馈自然变差。',
                    '你处在一个需要「做减法」的阶段：减少并行任务，集中资源，才能重新获得掌控感。'
                ]
            },
            action: {
                love: [
                    '设定一条止损线：明确表达一次，观察回应；无回应即停止投入。用事实替代猜测。',
                    '把注意力从「对方怎么想」转移到「我的边界是什么」。边界清晰了，决策自然容易。'
                ],
                career: [
                    '列三件本周能交付的成果，优先完成。成果是议价能力的唯一来源。',
                    '收集信息：投简历、聊同行、看岗位。信息足够，决策质量自然提高。'
                ],
                wealth: [
                    '先建应急金：存下三个月的基本开销，再谈任何投资。',
                    '记账 30 天，砍掉非必要支出。先止血，再开源。'
                ],
                health: [
                    '把睡眠作为最高优先级：固定上床时间，睡前一小时远离屏幕。',
                    '每天安排二十分钟运动。运动是最低成本的抗焦虑手段。'
                ],
                general: [
                    '本周只定一个最重要的目标，其他先搁置。完成它，再谈下一个。',
                    '把「担心」写下来，拆成可执行的动作。写在纸上的焦虑，威力减半。'
                ]
            },
            labelAffirm: {
                high: ['证据偏向「是」', '大概率成立'],
                mid: ['信号各半，尚不能定论', '部分成立，部分存疑'],
                low: ['证据不足，不宜下结论', '倾向于否']
            },
            labelDecide: {
                high: ['收益大于风险，可推进', '值得做'],
                mid: ['期望中性，小步试错', '条件不足，先收集信息'],
                low: ['风险偏高，建议观望', '先别下注']
            },
            labelHow: {
                high: ['整体处于上升区间', '数据面偏暖，稳中有进'],
                mid: ['处于震荡期，正常波动', '中性，无明显趋势'],
                low: ['处于收缩期，需控制预期', '压力偏高，宜防守']
            },
            body: {
                love: {
                    high: ['从信号看，对方有回应、有窗口，这是正反馈。下一步是提高确认度：明确表达一次，观察回应。不要用「顺其自然」掩盖不行动——顺其自然也需要一个清晰的起点。', '理性讲，好感是有的，但好感不等于结果。把模糊地带变清楚，收益远大于风险。'],
                    mid: ['信号混杂，说明信息不足。信息不足时，最该做的是收集信息而不是下结论：正常互动、提出见面，用事实替代猜测。', '这件事的期望值中等，投入要有上限。设一条止损线，别让情绪接管决策。'],
                    low: ['客观看，投入产出比目前偏低。与其追问对方，不如先把自己的状态和边界整理清楚。错的人，越用力越难看。', '理性建议：暂停投入，观察。低概率事件上反复下注，是不划算的。']
                },
                career: {
                    high: ['机会成本在下降，窗口在打开。把简历、作品、面试准备到位，行动比纠结更接近结果。', '数据面支持你推进：换工作、考试、争取资源，都是高性价比动作。'],
                    mid: ['有空间但不确定。建议分散尝试，别把希望押在单一选项上；同时保留现有位置，骑驴找马是最优解。', '当前期望值中性，策略上以「小步试错」为主，别做不可逆的大决定。'],
                    low: ['当前不宜激进。先积累可验证的成果，再谈跳槽或转型。没有筹码的谈判，通常以失败告终。', '把目标下调到「先稳住」，而不是「立刻翻盘」。防御也是一种策略。']
                },
                wealth: {
                    high: ['现金流入有改善空间，但波动风险同步存在。策略：先建应急金，再考虑进攻性配置，仓位要可控。', '收益预期可以乐观一点，但杠杆要克制。赚钱靠复利，不靠一把梭。'],
                    mid: ['收支接近平衡，弹性不足。优先做现金流管理：记账、砍掉非必要支出，比追求高收益更实际。', '中等预期下，最稳的策略是「少亏」而非「多赚」。先守住本金。'],
                    low: ['财务压力偏高，首要目标是止损。暂停高风险操作，控制消费，保留流动性。', '不要在低谷期做高风险决策。现金流比账面收益重要得多。']
                },
                health: {
                    high: ['状态良好，但「良好」是维持出来的。规律睡眠和适量运动是性价比最高的投入。', '可以适度增加负荷，但别透支。身体对透支的反馈是滞后的。'],
                    mid: ['疲劳和情绪波动说明恢复不足。把睡眠当作第一优先级，减少高刺激信息输入，会明显改善。', '中性状态需要主动维护。设定固定的休息时间，比临时补觉有效。'],
                    low: ['警报已经出现。建议减少负荷、保证睡眠，必要时求助专业，而不是硬扛。健康是复利，透支是高利贷。', '先把「不继续恶化」作为第一目标。其他都往后放。']
                },
                general: {
                    high: ['整体处于有利区间。把优势转化为具体行动：列三件本周能完成的事，做完再评估。', '趋势向上，但趋势不自动兑现。行动密度决定结果。'],
                    mid: ['中性的阶段，策略是「控制方差」：少做大决定，多做小推进。稳定比惊喜重要。', '把期望值定在「保住并小幅前进」，而不是「逆风翻盘」。'],
                    low: ['收缩期。优先做减法：减少承诺、减少消耗、保留资源。熬过这段再谈进攻。', '低点不是终点。把能控制的事控制好，剩下的交给时间。']
                }
            },
            tail: {
                love: ['用行为做判断，不用想象做判断。', '设定边界，比猜测对方更重要。'],
                career: ['用结果证明，不用态度证明。', '把大目标拆成可执行的下一步。'],
                wealth: ['先保本，再谈收益。', '现金流比账面好看更重要。'],
                health: ['睡眠是性价比最高的投资。', '身体给你的信号，要当回事。'],
                general: ['控制你能控制的，接受你不能控制的。', '一次只解决一件事，别空转。']
            }
        },
        {
            id: 'coach',
            name: '过来人教练',
            emoji: '🏀',
            desc: '像老大哥，给方向也给你打气',
            openers: [
                '兄弟/姐妹，我跟你掏心窝子说两句。',
                '这事我见多了，给你指个方向，听不听在你。',
                '别慌，咱把这事当个具体问题，一件件解决。'
            ],
            labelYesno: {
                high: ['放手去干，这事有谱', '机会在你这边，冲'],
                mid: ['能成，但你得出力', '有戏，别指望躺赢'],
                low: ['先缓一缓，别硬上', '这关先过好，别急着翻']
            },
            labelAffirm: {
                high: ['基本是这么回事，面对它', '差不多是了，别躲'],
                mid: ['有点那个苗头，别慌', '一半一半'],
                low: ['还没那么严重，别吓自己', '不太像，打起精神']
            },
            labelDecide: {
                high: ['干就完了', '该上就上，别磨叽'],
                mid: ['能上，但备好后路', '小步先试，别梭哈'],
                low: ['先按兵不动', '这关先过，别急着冲']
            },
            labelHow: {
                high: ['势头不错，趁热打铁', '在上升期，加油干'],
                mid: ['中规中矩，稳住就行', '正常节奏，别掉队'],
                low: ['先调整，再出发', '低谷期，攒着点劲']
            },
            body: {
                love: {
                    high: ['感情这事有戏，但你别当观众。主动一点、真诚一点，把想法说清楚。成了是赚，没成也落个明白，不丢人。', '窗口在，就看你敢不敢接。别老想着完美开场，先聊起来比啥都强。'],
                    mid: ['别急着定性，多相处。是喜欢还是将就，处一处就知道。别被一时上头带节奏。', '有苗头就慢慢来，感情是处出来的，不是想出来的。'],
                    low: ['这段先把自己照顾好。不适合的人别强求，把心腾干净，好的人才能进来。', '别灰心。低谷里先修炼自己，你会感谢现在没将就。']
                },
                career: {
                    high: ['该上的时候就上。机会来了，把你最拿手的东西亮出来。怕输的人赢不了。', '方向对了就大步走。别让「我还没准备好」挡住你，准备是边做边有的。'],
                    mid: ['稳扎稳打。把手头的事做出色，机会会慢慢找上你。别东张西望。', '有想法可以试，但别押上全部。小步快跑，错了也来得及调。'],
                    low: ['现在先别折腾。沉下心来把基本功打牢，比你到处找捷径强。', '难的时候，更要守住自己的节奏。熬过去，你会变强。']
                },
                wealth: {
                    high: ['财运抬头了，但赚了钱先存下点。会赚更要会守，钱才能留得住。', '有进账就好好规划。先攒应急金，再谈投资，别一有钱就飘。'],
                    mid: ['收支平衡就不错。少点冲动消费，多攒点底气。日子是攒出来的。', '别羡慕别人赚快钱，那大多不长久。稳着来，你的节奏最重要。'],
                    low: ['紧的时候就省着点，不丢人。先保证正常生活，再想办法开源。', '别借钱投资，别碰自己不懂的。守住底线，慢慢会缓过来。']
                },
                health: {
                    high: ['状态不错，继续保持。运动和早睡是你最好的队友。', '趁状态好，把好习惯固定下来。身体是长期的本钱。'],
                    mid: ['累了就歇，别硬扛。你不是机器，该充电就充电。', '少熬夜，多喝水，情绪会好很多。照顾好自己，比啥都重要。'],
                    low: ['这段把健康放第一位。该睡睡，该动动，该看医生看医生，别拖。', '别一个人硬撑。需要帮助就说，这不丢人。']
                },
                general: {
                    high: ['整体在往上走，抓住这股劲。定个目标，干就完了。', '好时机不常有，别浪费在犹豫上。行动，是唯一答案。'],
                    mid: ['平常心，稳着来。把每天的小事做好，结果自然来。', '别急着和别人比。你按自己的节奏走，就不算落后。'],
                    low: ['这段低调攒劲。别急着证明什么，先把自己顾好。', '低谷是暂时的。熬过去这段，你会感谢没放弃的自己。']
                }
            },
            analysis: {
                love: [
                    '兄弟/姐妹，你这感情里的问题，说到底是「太把对方当回事，太不把自己当回事」。对方一个动作你能想半天，自己的底线却一退再退。',
                    '感情这事，最怕的就是「自我感动」。你觉得付出很多，对方却未必需要，最后累的是自己，失望的也是自己。'
                ],
                career: [
                    '你不是没能力，是太想证明自己，结果反而乱了节奏。东一榔头西一棒子，哪样都没做出名堂。',
                    '工作这事，方向比速度重要。你现在是跑得挺快，但可能跑错了道。'
                ],
                wealth: [
                    '钱留不住，根子在习惯。挣得不算少，可花得更快，月底一看，啥也没剩下。',
                    '你不是不会赚钱，是还没学会「让钱停下来」。钱一到手就急着花，那它当然不跟你亲。'
                ],
                health: [
                    '身体发出的信号，你一直在忽视。总觉得自己还年轻、还能扛，可扛也是有极限的。',
                    '你累，不光是身体累，是心也累。心和身体一起透支，状态自然越来越差。'
                ],
                general: [
                    '你现在是「想得多、动得少、还总怀疑自己」。这么耗着，能量全内耗光了，哪还有力气往前走。',
                    '你其实不差，就是太着急看到结果。路才走一半，你就开始怀疑终点到不到得了。'
                ]
            },
            action: {
                love: [
                    '今天起，把自己的底线写下来：什么能忍，什么不能忍。越过底线，就大大方方说再见。',
                    '多把时间花在自己身上：运动、学习、见朋友。你越完整，好的感情越容易来。'
                ],
                career: [
                    '这周把最重要的一件事做到位，做到能拿出手的程度。一件就够了。',
                    '想清楚你要的到底是什么，再决定怎么走。方向对了，慢一点也没关系。'
                ],
                wealth: [
                    '先给自己定个储蓄目标，哪怕每个月只存一点。存钱这事，开始了就赢了。',
                    '买东西前先问一句：这是需要，还是一时上头？想清楚再下单。'
                ],
                health: [
                    '从今晚开始，早点睡。别拿「再刷一会」骗自己，身体会记仇。',
                    '每周运动三次，每次半小时。动起来，你会发现很多烦恼都没那么重了。'
                ],
                general: [
                    '把大目标拆成今天就能做的小事，先做起来。行动是焦虑的解药。',
                    '每天给自己一点肯定：做成一件小事，就记一笔。信心是攒出来的。'
                ]
            },
            tail: {
                love: ['记住：对的人，是让你越来越像自己，不是越来越累。', '敢爱也敢放手，才是成年人的感情。'],
                career: ['把每一天过扎实，结果不会亏待你。', '方向比速度重要，先想清楚再跑。'],
                wealth: ['存下的才是自己的，花掉的是别人的。', '会赚钱是本事，会守钱是修行。'],
                health: ['身体是1，其他是0。', '对自己好一点，从早睡开始。'],
                general: ['别怕慢，就怕停。', '每一次低谷，都是下一次起飞前的助跑。']
            }
        }
    ];

    /* ---------- 英文版内容（紧凑版，同样说人话） ---------- */

    var EN_PERSONA_META = {
        straight: { name: 'Blunt Bro', desc: 'Sharp and honest, no sugarcoating' },
        gentle: { name: 'Gentle Sis', desc: 'Won\u2019t scold you, but tells it straight' },
        master: { name: 'Old Master', desc: 'Plain talk, no fuss' },
        logic: { name: 'Analyst', desc: 'Logic and probability, not mysticism' },
        coach: { name: 'Coach', desc: 'Like a big brother, direction and support' }
    };

    var EN_SHARED = {
        love: {
            high: 'There is real potential here, but it only becomes something if you actually move. Speak plainly, meet in person, and stop over-reading every message.',
            mid: 'The signals are mixed, so do not rush to a conclusion. Spend real time together and let actual interactions decide — not your imagination.',
            low: 'This period is better spent on your own. Sort out your own state first; forcing a connection will only exhaust you.'
        },
        career: {
            high: 'Things can move forward — seize the opening. Prepare your resume or work samples and take the step instead of waiting for a perfect moment.',
            mid: 'There is progress but also risk. Move step by step, keep your options open, and do not make a big irreversible jump on impulse.',
            low: 'Play defense for now. Solidify your current position and build up evidence before making any major change.'
        },
        wealth: {
            high: 'Money flow is improving, but do not chase quick wins. Save an emergency fund first, then invest only within limits you can afford to lose.',
            mid: 'Income and spending are roughly balanced. Track your spending and cut non-essentials — that beats chasing overnight riches.',
            low: 'Money will be tight, so cut back first. Protect your cash and avoid risky bets; slow and steady is the only way out.'
        },
        health: {
            high: 'You are holding up well, but do not use youth as an excuse to burn out. Regular sleep and light exercise are your best investment.',
            mid: 'Fatigue and low mood mean you are not recovering enough. Prioritize sleep and cut the doom-scrolling — it will help a lot.',
            low: 'Take care of yourself seriously. Cut the late nights and overwork; if it does not improve, do not hesitate to get help.'
        },
        general: {
            high: 'The overall trend is up, but you still have to act. Turn the tailwind into concrete steps instead of hesitating.',
            mid: 'Things are average — stable but unspectacular. Make small, steady progress rather than chasing drama.',
            low: 'Stay low-key and protect your base. Do less, focus on what you can control, and ride this phase out.'
        }
    };

    var EN_SHARED_ANALYSIS = {
        love: 'The core issue is usually too much guessing and too little honest communication. When the other person does not respond, your mind fills the gap with worst-case stories.',
        career: 'Career stalls are usually a mismatch between your current ability and the window you are chasing. What you need most is verifiable results, not more options.',
        wealth: 'Money problems rarely come from low income alone — they come from no budget, no emergency fund, and spending driven by emotion.',
        health: 'Fatigue is a signal of insufficient recovery. Your body keeps score: whatever you overdraw, it collects back in energy and mood.',
        general: 'The chaos comes from too many goals and no clear priority. Scattered effort means slow feedback everywhere.'
    };

    var EN_SHARED_ACTION = {
        love: 'Set one boundary this week: say what you want once, watch the response, and stop if there is none. Act on facts, not guesses.',
        career: 'List three deliverables you can finish this week and do them. Results are the only thing that raises your bargaining power.',
        wealth: 'Build a small emergency fund and track spending for 30 days. Stop the bleeding before you try to grow.',
        health: 'Make sleep the top priority: a fixed bedtime and no screens an hour before. Add 20 minutes of movement a day.',
        general: 'Pick just one important goal this week and finish it. Write your worries down and turn them into actions — anxiety halves when it is on paper.'
    };

    var EN_PERSONAS = {
        straight: {
            openers: ["Alright, I\u2019ll be blunt \u2014 don\u2019t get defensive, just listen.", "You actually came to ask. Fine, let me spell it out.", "I don\u2019t sugarcoat. You want the truth? Keep reading."],
            labelYesno: { high: ["Very likely yes \u2014 stop pretending", "The odds say yes, so act"], mid: ["Coin flip \u2014 it depends on you", "Could go either way, don\u2019t get cocky"], low: ["Not happening soon \u2014 wake up", "Unlikely \u2014 forcing it is self-harm"] },
            labelAffirm: { high: ["Yeah, it\u2019s pretty obvious", "Basically yes \u2014 own it"], mid: ["A little bit, not full-blown", "Half and half"], low: ["Not really \u2014 stop labeling yourself", "Not quite"] },
            labelDecide: { high: ["Just do it", "Go for it"], mid: ["You can, but be smart about it", "Proceed, but with a plan"], low: ["Don\u2019t", "Hold off \u2014 it\u2019s not worth it"] },
            labelHow: { high: ["Good \u2014 don\u2019t waste it", "Solid \u2014 don\u2019t self-sabotage"], mid: ["Mediocre \u2014 deal with it", "So-so, don\u2019t dramatize it"], low: ["Rough \u2014 look in the mirror first", "Tough \u2014 stop pretending it\u2019s fine"] },
            tail: { love: "Stop over-reading every reply. Act, don\u2019t perform.", career: "Do the work. Results beat speeches.", wealth: "Track your spending. Your wallet is leaking.", health: "Sleep. You\u2019re not an insomniac, you\u2019re glued to your phone.", general: "Stop making excuses and do one small thing today." }
        },
        gentle: {
            openers: ["Let me be upfront: I\u2019m not here to scare you, just to give you a clear picture.", "You asked seriously, so I\u2019ll answer plainly, no detours.", "Relax \u2014 this isn\u2019t mystical. Let\u2019s just talk it through like friends."],
            labelYesno: { high: ["Most likely yes \u2014 don\u2019t talk yourself out of it", "The odds are good if you actually go for it"], mid: ["Fifty-fifty \u2014 don\u2019t rush the conclusion", "There\u2019s a chance, but it needs your effort"], low: ["It\u2019s shaky short-term \u2014 steady yourself first", "Not smooth right now, but not a dead end"] },
            labelAffirm: { high: ["Pretty much yes \u2014 no need to deny it", "It fits \u2014 you can feel it yourself"], mid: ["A bit of that, not fully confirmed", "Half and half \u2014 don\u2019t label yourself yet"], low: ["Not quite \u2014 don\u2019t overthink it", "Not really \u2014 relax"] },
            labelDecide: { high: ["Worth trying \u2014 don\u2019t be afraid", "Go for it, take the step"], mid: ["You can, but think it through first", "Don\u2019t rush \u2014 keep it steady"], low: ["Hold off for now", "Pause this step until it\u2019s clearer"] },
            labelHow: { high: ["Overall good \u2014 make the most of it", "Your state is solid \u2014 don\u2019t overcomplicate it"], mid: ["Plain and steady, no need to worry", "Ups and downs \u2014 that\u2019s normal"], low: ["This stretch will be tiring \u2014 take care of yourself", "Tight \u2014 steady yourself before pushing"] },
            tail: { love: "Remember: say it if you like them, walk away gracefully if it doesn\u2019t fit.", career: "Break the big goal into small things you can finish this week.", wealth: "Track a month of spending \u2014 you\u2019ll see where the money goes.", health: "Sleep earlier. It beats any supplement.", general: "Ask yourself the worst case \u2014 most anxiety is just drama." }
        },
        master: {
            openers: ["I\u2019ve seen this line of work for years \u2014 I hate beating around the bush.", "No mystical fluff. Let\u2019s just talk straight.", "Listen up \u2014 my mouth doesn\u2019t do detours."],
            labelYesno: { high: ["This one\u2019s mostly a yes", "It can work \u2014 stop scaring yourself"], mid: ["Fifty-fifty, depends on what you do", "Half heaven, half you"], low: ["Hard to make it work now, don\u2019t force it", "It\u2019s shaky \u2014 better to wait"] },
            labelAffirm: { high: ["More or less, yes", "Close enough \u2014 don\u2019t deny it"], mid: ["A hint of it, not deep yet", "Half and half"], low: ["Not really \u2014 stop overthinking", "Doesn\u2019t look like it \u2014 relax"] },
            labelDecide: { high: ["Move when it\u2019s time to move", "It\u2019ll work \u2014 just do it"], mid: ["Can do it, but steady does it", "Fifty-fifty, watch your step"], low: ["Hold off, take it slow", "Set this aside for now"] },
            labelHow: { high: ["Smooth \u2014 go with confidence", "Good \u2014 don\u2019t spoil a good thing"], mid: ["So-so, you\u2019ll get by", "Average \u2014 don\u2019t expect a big swing"], low: ["Tight \u2014 grind it out first", "Rough \u2014 steady yourself first"] },
            tail: { love: "Straight talk: what\u2019s forced won\u2019t stay. Let it be.", career: "Skill is the only thing nobody can take from you.", wealth: "Steady hands, steady mind. Money comes to the patient.", health: "Health is the root; everything else is zeros.", general: "One step at a time, one bite at a time. Don\u2019t panic." }
        },
        logic: {
            openers: ["To be clear: what follows is probability and common sense, not a mystical promise.", "No detours \u2014 let\u2019s break it down.", "Set the emotion aside and let\u2019s reason through it."],
            labelYesno: { high: ["Probabilistically, it leans doable", "Favorable factors dominate \u2014 worth pursuing"], mid: ["Fifty-fifty, and the variable is you", "Outcome is uncertain \u2014 it depends on your actions"], low: ["Conditions are insufficient \u2014 wait and watch", "Low probability \u2014 don\u2019t bet heavy"] },
            labelAffirm: { high: ["Evidence points to \u201cyes\u201d", "Mostly true"], mid: ["Signals are mixed, inconclusive", "Partially true, partially doubtful"], low: ["Insufficient evidence \u2014 don\u2019t conclude", "Leans \u201cno\u201d"] },
            labelDecide: { high: ["Expected gain exceeds risk \u2014 proceed", "Worth doing"], mid: ["Neutral expectation \u2014 test with small steps", "Not enough info \u2014 gather more first"], low: ["Risk is high \u2014 hold off", "Don\u2019t bet yet"] },
            labelHow: { high: ["In an uptrend \u2014 steady progress", "Data is warm, keep it stable"], mid: ["In a choppy phase \u2014 normal swings", "Neutral, no clear trend"], low: ["In a contraction \u2014 manage expectations", "Pressure is high \u2014 play defense"] },
            tail: { love: "Judge by behavior, not imagination.", career: "Prove with results, not attitude.", wealth: "Protect principal first, then talk returns.", health: "Sleep is the highest-return investment.", general: "Control what you can, accept what you can\u2019t." }
        },
        coach: {
            openers: ["Hey, let me level with you for a minute.", "I\u2019ve seen this plenty \u2014 here\u2019s the direction, take it or leave it.", "Don\u2019t panic. Let\u2019s treat this as a concrete problem and solve it step by step."],
            labelYesno: { high: ["Go for it \u2014 this one has legs", "The edge is yours \u2014 charge"], mid: ["It can work, but you\u2019ve got to put in the work", "There\u2019s a shot, don\u2019t expect it on a plate"], low: ["Ease off for now, don\u2019t force it", "Get through this round first, don\u2019t rush the comeback"] },
            labelAffirm: { high: ["Pretty much the case \u2014 face it", "Close enough \u2014 don\u2019t duck it"], mid: ["A hint of it \u2014 don\u2019t panic", "Half and half"], low: ["Not that bad \u2014 don\u2019t scare yourself", "Not quite \u2014 chin up"] },
            labelDecide: { high: ["Just do it", "Step up \u2014 stop stalling"], mid: ["You can go, but line up a plan", "Try small first, don\u2019t go all-in"], low: ["Stand down for now", "Clear this hurdle first, don\u2019t rush"] },
            labelHow: { high: ["Momentum is good \u2014 strike while it\u2019s hot", "On the upswing \u2014 keep pushing"], mid: ["Steady as she goes \u2014 hold the line", "Normal rhythm, don\u2019t fall behind"], low: ["Regroup first, then restart", "In a dip \u2014 conserve your energy"] },
            tail: { love: "The right person makes you more yourself, not more tired.", career: "Make each day count \u2014 results will follow.", wealth: "What you save is yours; what you spend is gone.", health: "Your body is the 1, everything else is zeros.", general: "Don\u2019t fear slow \u2014 fear stopping." }
        }
    };

    function personaName(p) {
        var en = (typeof I18N !== 'undefined' && I18N && I18N.lang === 'en');
        if (en && EN_PERSONA_META[p.id]) return EN_PERSONA_META[p.id].name;
        return p.name;
    }
    function personaDesc(p) {
        var en = (typeof I18N !== 'undefined' && I18N && I18N.lang === 'en');
        if (en && EN_PERSONA_META[p.id]) return EN_PERSONA_META[p.id].desc;
        return p.desc;
    }

    function getPersona(id) {
        for (var i = 0; i < PERSONAS.length; i++) {
            if (PERSONAS[i].id === id) return PERSONAS[i];
        }
        return PERSONA_STRAIGHT;
    }

    function personaBuild(p, data) {
        var isEn = (typeof I18N !== 'undefined' && I18N && I18N.lang === 'en');
        var voice = (isEn && EN_PERSONAS[p.id]) ? EN_PERSONAS[p.id] : null;
        var seed = hashString(data.question + data.topic + p.id);
        var b = band(data.probability);
        var qType = data.qType || 'open';
        var kind = questionKind(data.question);
        var label;

        if (voice) {
            if (kind === 'affirm') label = pick(voice.labelAffirm[b], seed);
            else if (kind === 'decide') label = pick(voice.labelDecide[b], seed);
            else if (qType === 'how' || qType === 'open' || qType === 'when') label = pick(voice.labelHow[b], seed);
            else label = pick(voice.labelYesno[b], seed);
        } else {
            if (kind === 'affirm') label = pick(p.labelAffirm[b], seed);
            else if (kind === 'decide') label = pick(p.labelDecide[b], seed);
            else if (qType === 'how' || qType === 'open' || qType === 'when') label = pick(p.labelHow[b], seed);
            else label = pick(p.labelYesno[b], seed);
        }

        var opener, paragraph, analysis, action, tip, head;
        if (voice) {
            opener = pick(voice.openers, seed + 1);
            var shared = EN_SHARED[data.topic] || EN_SHARED.general;
            paragraph = shared[b] || shared.mid;
            analysis = EN_SHARED_ANALYSIS[data.topic] || EN_SHARED_ANALYSIS.general;
            action = EN_SHARED_ACTION[data.topic] || EN_SHARED_ACTION.general;
            tip = voice.tail[data.topic] || voice.tail.general;
            head = opener + ' You asked "' + data.question + '" \u2014 ' + label + ' (' + data.probability + '%).';
        } else {
            opener = pick(p.openers, seed + 1);
            var bodyTopic = p.body[data.topic] || p.body.general;
            paragraph = pick(bodyTopic[b] || bodyTopic.mid, seed + 2);
            var analysisPool = p.analysis[data.topic] || p.analysis.general;
            analysis = pick(analysisPool, seed + 4);
            var actionPool = p.action[data.topic] || p.action.general;
            action = pick(actionPool, seed + 5);
            tip = pick(p.tail[data.topic] || p.tail.general, seed + 3);
            head = opener + '你问的是「' + data.question + '」——' + label + '（' + data.probability + '%）。';
        }

        return {
            question: data.question,
            topic: data.topic,
            probability: data.probability,
            label: label,
            body: [head, paragraph, analysis, action, tip].join('\n\n'),
            qType: qType,
            intentId: data.intentId || '',
            personaId: p.id
        };
    }

    function buildLocal(context, personaId) {
        // 复用 PlainSpeak 的意图/话题/概率引擎
        var data = (global.PlainSpeak && global.PlainSpeak.generate)
            ? global.PlainSpeak.generate(context)
            : {
                question: (context.question || '').trim() || '我最近整体运势怎么样？',
                topic: context.category || 'general',
                probability: 62,
                label: '平平无奇',
                body: '没拿到具体信息，我也只能给你个大概。',
                qType: 'open',
                intentId: ''
            };

        if (personaId === 'straight') {
            var isEn = (typeof I18N !== 'undefined' && I18N && I18N.lang === 'en');
            if (!isEn) return data; // 中文：直接使用毒舌直男的完整数据库
        }
        return personaBuild(getPersona(personaId), data);
    }

    /* ---------- 外接 AI（OpenAI 兼容） ---------- */

    function readCfg() {
        return Object.assign({
            enabled: false,
            provider: 'deepseek',
            endpoint: 'https://api.deepseek.com/v1',
            model: 'deepseek-chat',
            apiKey: ''
        }, readJSON(CFG_KEY, {}));
    }

    function saveCfg(patch) {
        var cfg = Object.assign(readCfg(), patch);
        writeJSON(CFG_KEY, cfg);
        return cfg;
    }

    var SYSTEM_PROMPT = [
        '你是玄机阁的AI命理解读师。',
        '请务必用最直白、最口语的大白话回答，像朋友聊天一样。',
        '禁止堆砌玄学术语、禁止套话、禁止「天机不可泄露」这类废话。',
        '结构：先直接给结论，再给1-2句理由，最后给一句具体可做的建议。',
        '总字数控制在120字以内。'
    ].join('');

    function buildUserPrompt(data) {
        return '用户问的问题：' + (data.question || '（没写具体问题）') +
            '\n所属领域：' + ((global.PlainSpeak && global.PlainSpeak.CATEGORY_LABELS && global.PlainSpeak.CATEGORY_LABELS[data.topic]) || data.topic) +
            '\n运势评分：' + data.probability + '分（满分100）' +
            '\n请用大白话直接回答TA。';
    }

    function tryExternal(container, context, data) {
        var cfg = readCfg();
        if (!cfg.enabled || !cfg.apiKey || !cfg.endpoint) return;

        var endpoint = String(cfg.endpoint).replace(/\/+$/, '');
        var payload = {
            model: cfg.model || 'deepseek-chat',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(data) }
            ],
            temperature: 0.8,
            stream: false
        };

        fetch(endpoint + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + cfg.apiKey
            },
            body: JSON.stringify(payload)
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).then(function (json) {
            var text = json && json.choices && json.choices[0] &&
                json.choices[0].message && json.choices[0].message.content;
            if (!text || !text.trim()) throw new Error('empty');
            renderAIText(container, data, text.trim());
        }).catch(function () {
            markAIStatus(container, 'offline');
        });
    }

    function renderAIText(container, data, text) {
        var stage = container.querySelector('.ai-reader-stage');
        if (!stage) return;
        var probClass = data.probability >= 70 ? 'prob-high' : data.probability >= 55 ? 'prob-mid' : 'prob-low';
        stage.innerHTML =
            '<div class="plain-speak-card ' + probClass + ' ai-reader-card-ai">' +
            '  <div class="plain-speak-header">' +
            '    <span class="plain-speak-badge ai-badge">✦ ' + t('reader.badgeAI', 'AI 深度解读') + '</span>' +
            '    <span class="plain-speak-tag">' + t('reader.badgeAISub', '外接大模型 · 说人话') + '</span>' +
            '  </div>' +
            '  <p class="plain-speak-question">' + escapeHtml(data.question) + '</p>' +
            '  <div class="plain-speak-body">' + escapeHtml(text).replace(/\n/g, '<br>') + '</div>' +
            '</div>';
        container.classList.add('plain-speak-visible');
    }

    function markAIStatus(container, status) {
        var tag = container.querySelector('.ai-reader-status');
        if (!tag) return;
        if (status === 'offline') {
            tag.textContent = t('reader.offline', '外接AI未连接，已用本地解读');
            tag.classList.add('is-offline');
        }
    }

    /* ---------- 渲染 ---------- */

    var lastContext = null;
    var lastContainer = null;

    function renderSync(container, context, personaId) {
        if (!container) return null;
        personaId = personaId || currentPersona();
        var data = buildLocal(context, personaId);
        var probClass = data.probability >= 70 ? 'prob-high' : data.probability >= 55 ? 'prob-mid' : 'prob-low';
        var bodyHtml = escapeHtml(data.body).replace(/\n/g, '<br>');
        var p = getPersona(personaId);

        container.innerHTML =
            '<div class="ai-reader-wrap">' +
            '  <div class="ai-reader-bar">' +
            '    <div class="ai-reader-personas">' + personaChips(personaId) + '</div>' +
            '    <button class="ai-reader-settings" type="button" title="' + t('reader.settings', '外接AI设置') + '">⚙ ' + t('reader.settings', '外接AI') + '</button>' +
            '  </div>' +
            '  <div class="ai-reader-stage">' +
            '    <div class="plain-speak-card ' + probClass + '">' +
            '      <div class="plain-speak-header">' +
            '        <span class="plain-speak-badge">' + escapeHtml(p.emoji + ' ' + personaName(p)) + '</span>' +
            '        <span class="plain-speak-tag ai-reader-status">' + t('reader.badgePlain', '说人话解读') + '</span>' +
            '      </div>' +
            '      <p class="plain-speak-question">' + escapeHtml(data.question) + '</p>' +
            '      <div class="plain-speak-verdict">' +
            '        <span class="plain-speak-prob">' + data.probability + '%</span>' +
            '        <span class="plain-speak-label">' + escapeHtml(data.label) + '</span>' +
            '      </div>' +
            '      <div class="plain-speak-body">' + bodyHtml + '</div>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        container.classList.add('plain-speak-visible');

        // 绑定切换事件
        container.querySelectorAll('.ai-reader-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                var pid = chip.getAttribute('data-persona');
                saveCfg({ persona: pid });
                renderSync(container, lastContext, pid);
                if (pid === 'straight') return;
                var next = buildLocal(lastContext, pid);
                tryExternal(container, lastContext, next);
            });
        });
        var settingsBtn = container.querySelector('.ai-reader-settings');
        if (settingsBtn) settingsBtn.addEventListener('click', function () { openSettings(); });

        // 外接 AI 增强
        tryExternal(container, context, data);

        return data;
    }

    function personaChips(activeId) {
        var html = '';
        for (var i = 0; i < PERSONAS.length; i++) {
            var p = PERSONAS[i];
            html += '<button class="ai-reader-chip' + (p.id === activeId ? ' active' : '') + '" data-persona="' + p.id + '" type="button" title="' + escapeHtml(personaDesc(p)) + '">' +
                escapeHtml(p.emoji + ' ' + personaName(p)) + '</button>';
        }
        return html;
    }

    function currentPersona() {
        return readCfg().persona || 'straight';
    }

    function render(container, context) {
        lastContext = context || {};
        lastContainer = container;
        return renderSync(container, lastContext, currentPersona());
    }

    /* ---------- 外接 AI 设置弹窗 ---------- */

    function openSettings() {
        if (document.getElementById('ai-reader-settings-overlay')) {
            document.getElementById('ai-reader-settings-overlay').classList.add('open');
            syncSettingsForm();
            return;
        }

        var overlay = document.createElement('div');
        overlay.id = 'ai-reader-settings-overlay';
        overlay.className = 'ai-reader-overlay';
        overlay.innerHTML =
            '<div class="ai-reader-modal">' +
            '  <button class="ai-reader-close" type="button" data-close aria-label="关闭">×</button>' +
            '  <div class="ai-reader-modal-head"><div class="ai-reader-modal-sigil">🤖</div>' +
            '    <div><h3 data-i18n="reader.modalTitle">外接 AI 解读</h3><p data-i18n="reader.modalSub">接入 OpenAI 兼容接口，让真·大模型来给你说人话</p></div></div>' +
            '  <label class="ai-reader-field"><span data-i18n="reader.enabled">是否启用外接 AI</span>' +
            '    <label class="ai-reader-switch"><input type="checkbox" id="ai-enabled"><i></i></label></label>' +
            '  <label class="ai-reader-field"><span data-i18n="reader.endpoint">接口地址 Endpoint</span>' +
            '    <input id="ai-endpoint" type="text" placeholder="https://api.deepseek.com/v1"></label>' +
            '  <label class="ai-reader-field"><span data-i18n="reader.model">模型 Model</span>' +
            '    <input id="ai-model" type="text" placeholder="deepseek-chat"></label>' +
            '  <label class="ai-reader-field"><span data-i18n="reader.apikey">API Key</span>' +
            '    <input id="ai-key" type="password" placeholder="sk-..."></label>' +
            '  <button class="ai-reader-save" id="ai-save" type="button" data-i18n="reader.save">保存设置</button>' +
            '  <p class="ai-reader-warn" data-i18n="reader.warn">⚠️ 纯静态站：Key 仅存在你本机浏览器，会随请求明文发出；浏览器直连可能被 CORS 拦截，正式上线请走你自己的后端代理转发。</p>' +
            '</div>';

        document.body.appendChild(overlay);

        overlay.querySelector('[data-close]').addEventListener('click', function () { overlay.classList.remove('open'); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('open'); });
        document.addEventListener('keydown', function escClose(e) {
            if (e.key === 'Escape') overlay.classList.remove('open');
        });

        document.getElementById('ai-save').addEventListener('click', function () {
            var cfg = saveCfg({
                enabled: document.getElementById('ai-enabled').checked,
                endpoint: document.getElementById('ai-endpoint').value.trim(),
                model: document.getElementById('ai-model').value.trim(),
                apiKey: document.getElementById('ai-key').value.trim()
            });
            overlay.classList.remove('open');
            var msg = cfg.enabled && cfg.apiKey ? '已保存，外接 AI 已启用' : '已保存';
            if (global.XJGAuth && global.XJGAuth.toast) global.XJGAuth.toast(msg);
        });

        overlay.classList.add('open');
        syncSettingsForm();
    }

    function syncSettingsForm() {
        var cfg = readCfg();
        var enabled = document.getElementById('ai-enabled');
        var endpoint = document.getElementById('ai-endpoint');
        var model = document.getElementById('ai-model');
        var key = document.getElementById('ai-key');
        if (enabled) enabled.checked = !!cfg.enabled;
        if (endpoint) endpoint.value = cfg.endpoint || '';
        if (model) model.value = cfg.model || '';
        if (key) key.value = cfg.apiKey || '';
    }

    document.addEventListener('i18n:changed', function () {
        if (lastContainer && lastContext) {
            renderSync(lastContainer, lastContext, currentPersona());
        }
    });

    global.AIReader = {
        PERSONAS: PERSONAS,
        render: render,
        renderSync: renderSync,
        buildLocal: buildLocal,
        getPersona: getPersona,
        currentPersona: currentPersona,
        getConfig: readCfg,
        saveConfig: saveCfg,
        openSettings: openSettings
    };
})(typeof window !== 'undefined' ? window : globalThis);
