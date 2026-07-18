/**
 * 说人话区 —— 把玄学解读翻成大白话 + 概率判断
 */
(function (global) {
    'use strict';

    const TOPIC_KEYWORDS = {
        love: ['真爱', '结婚', '脱单', '表白', '分手', '复合', '桃花', '对象', '男朋友', '女朋友', '暗恋', '姻缘', '感情', '恋爱', '喜欢', '相亲', '异地恋', '婚姻', '伴侣', '暧昧'],
        career: ['工作', '换工作', '跳槽', '升职', '面试', '学业', '考试', '考研', '事业', '创业', '老板', '同事', 'offer', '离职', '转行', '上岸', '编制', '留学'],
        wealth: ['财运', '发财', '赚钱', '投资', '破财', '偏财', '工资', '理财', '股票', '基金', '副业', '负债', '借钱'],
        health: ['健康', '身体', '生病', '睡眠', '焦虑', '抑郁', '休息', '养生', '失眠', '压力', '情绪']
    };

    const CATEGORY_LABELS = {
        general: '综合运势',
        love: '感情',
        career: '事业学业',
        wealth: '财运',
        health: '健康'
    };

    const DEFAULT_QUESTIONS = {
        general: '我最近整体运势怎么样？',
        love: '我今年会不会遇到真爱？',
        career: '我今年适合换工作吗？',
        wealth: '我接下来财运好不好？',
        health: '我最近身体和精神状态怎么样？'
    };

    function hashString(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    }

    function detectTopic(question, category) {
        const q = (question || '').trim();
        if (q) {
            for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
                if (words.some(w => q.includes(w))) return topic;
            }
        }
        if (category && category !== 'general') return category;
        return 'general';
    }

    function detectQuestionType(question) {
        const q = (question || '').trim();
        if (/会不会|能不能|是否|有没有|行吗|好吗|适合吗|能成吗|会成吗/.test(q)) return 'yesno';
        if (/什么时候|何时|几月|哪天|多久|今年|明年|下半年|上半年/.test(q)) return 'when';
        if (/怎么样|如何|咋样|好不好/.test(q)) return 'how';
        return 'open';
    }

    function getScoreForTopic(topic, scores) {
        if (!scores) return 62;
        if (topic === 'general') {
            const vals = [scores.love, scores.career, scores.wealth, scores.health].filter(v => typeof v === 'number');
            if (!vals.length) return scores.general || 62;
            return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
        return scores[topic] ?? scores.general ?? 62;
    }

    function adjustProbability(base, signals) {
        let p = base;
        if (!signals) return p;
        if (signals.positive === true) p += 6;
        if (signals.positive === false) p -= 10;
        if (signals.hasChange) p -= 4;
        if (signals.hexLucky) p += 5;
        if (typeof signals.bias === 'number') p += signals.bias;
        return Math.max(28, Math.min(92, p));
    }

    function roundProb(p) {
        return Math.round(p / 5) * 5;
    }

    function verdictLabel(prob) {
        if (prob >= 70) return '大概率会，别再装死了';
        if (prob >= 55) return '有戏，但别指望天上掉';
        if (prob >= 40) return '一半一半，别瞎自信';
        return '短期内悬，醒醒吧';
    }

    function verdictLabelHow(prob) {
        if (prob >= 70) return '整体偏顺，别糟践';
        if (prob >= 55) return '凑合能过，别躺平';
        if (prob >= 40) return '平平无奇，别做梦';
        return '挺难的，先照镜子';
    }

    function pickVariant(arr, seed) {
        return arr[seed % arr.length];
    }

    const ANSWERS = {
        love: {
            yesno: {
                high: [
                    '行，今年感情这块挺给脸的。真爱不是快递，不会自己敲你家门——你要是还继续装高冷、只敢在对话框里演深情，那这概率白给你。',
                    '桃花有，别急着写成小说结局。有人靠近你、旧识找你，多半是真的；你要是继续「再等等」「先看感觉」，机会会先嫌你烦。',
                    '有戏。不一定立刻官宣，但能让你心跳的人会出现。问题不在天上，在你敢不敢开口——继续内耗，概率再高也是摆设。'
                ],
                mid: [
                    '有苗头，但别美得太早。暧昧一阵就飘、对方忽冷忽热，你还在那儿「是不是命中注定」——不是，是你太爱脑补。',
                    '感情运半吊子。能遇到让你上心的人，成不成另说：沟通不行、现实条件不行、你耐心不行，三个里你占几个自己数。',
                    '桃花有一点，谈不上爆。还宅着等「对的人」自己撞上来？醒醒。先把圈子打开，再谈真爱不真爱。'
                ],
                low: [
                    '今年感情别硬冲。真爱像你想象的那么容易？短期内悬。先把自己收拾利索，别把「脱单」当人生KPI。',
                    '缘分慢点来。你越焦虑、越四处试探，越像在赶业绩。先把状态搞好，别把烂桃花当救命稻草。',
                    '感情线偏淡。不是宇宙亏你，是你要么太被动，要么太不挑。再在烂局里耗，明年还是这句。'
                ]
            },
            how: {
                high: ['感情运还行。单身的别装神秘，有伴的别冷暴力。真诚比你那点小心思值钱。'],
                mid: ['感情平平，波动正常。少猜忌、多说话。继续闷着演，最后只剩你自己。'],
                low: ['感情容易卡死。该断就断，该谈就谈。装没事最没用。']
            }
        },
        career: {
            yesno: {
                high: [
                    '事业/学业今年偏顺。换工作、面试、考证——别比你以为的难。前提是：简历别糊弄、准备别裸奔。临阵怯场那是你自己的锅。',
                    '职场运在线。有机会、有贵人，甚至可能突然开窍。别再等「别人来发现你」——没人欠你赏识。',
                    '今年适合动。跳槽、晋升、转方向，比原地耗着强。还在「再观望一下」？观望到别人升完了再哭。'
                ],
                mid: [
                    '有机会，竞争也老实不客气。面试多试几家、项目多熬一阵——不是命运为难你，是你还不够稳。',
                    '事业运中等：有起色也有坑。一次押全部筹码那种操作，先问问你抗不抗得住。',
                    '换工作/升学不是没戏，但裸辞冲动是给自己挖坑。骑驴找马，比你「凭感觉」靠谱。'
                ],
                low: [
                    '今年职场宜守。大幅跳槽、激进创业？风险给你写在脸上了。先把现有赛道啃透，别幻想一夜翻盘。',
                    '事业线偏紧：拖延、沟通烂、考试翻车都可能。先照镜子找短板，别怪环境。',
                    '短期内想立刻翻盘？难。预期放低，小步推进。一口吃成胖子那是段子，不是你的策略。'
                ]
            },
            how: {
                high: ['事业学业向上。定目标就冲，别光转发励志文。'],
                mid: ['有起伏。坚持比赌运气重要——你赌运气赌输过几次自己清楚。'],
                low: ['先稳住基本盘。跟大环境硬刚，输了别喊不公平。']
            }
        },
        wealth: {
            yesno: {
                high: [
                    '财运偏暖。正财稳，偏财也有缝。别一听「有机会」就上头追涨——稳稳赚你嫌慢？那你配暴富吗。',
                    '钱景不错：奖金、副业、小意外都可能有。留应急金，别把存款当赌场筹码。',
                    '钱包比去年松一点。收入涨了，手也别跟着松——管不住手，再旺也是过路财神。'
                ],
                mid: [
                    '财运一般：饿不着，也别做梦暴富。记账、控支出，听起来土？土的东西往往管用。',
                    '有进有出。打工稳一点，副业可以试；All in 那种操作，请先准备好哭的姿势。',
                    '大机会不多，小机会常在。确定性高的抓牢，其余少听「内幕」。'
                ],
                low: [
                    '今年花钱口子可能开得大，投资宜怂。先还债、先存钱，比追热点体面。',
                    '偏财运弱。有人跟你说「稳赚不赔」？那是在考验你智商。守本金。',
                    '财务压力可能上来。冲动消费少来，大额支出多想想——你的钱包经不起你「开心一下」。'
                ]
            },
            how: {
                high: ['财运尚可。量入为出，别装阔。'],
                mid: ['收支勉强平衡。加杠杆之前先问问自己扛不扛得住。'],
                low: ['节流。投资多看少动——你手痒，钱会先痒。']
            }
        },
        health: {
            yesno: {
                high: [
                    '身体精神整体还行。别用「我还年轻」当熬夜执照——年轻也经不起你这么造。',
                    '健康偏稳。小毛病可能有，大问题暂时没有。颈椎、睡眠、情绪：三个里你先毁哪个？',
                    '气色心态都不错。补品堆一堆不如动一动——懒得动就别装养生博主。'
                ],
                mid: [
                    '身体没大问题，就是容易累、容易焦虑。压力堆积是你自己堆的，该休息就休息，别硬充。',
                    '健康中等。饮食作息乱一点，身体会提醒你——别等提醒变成警告。',
                    '精神内耗比身体更拖后腿。闷着硬撑很酷？酷到最后只有体检单陪你。'
                ],
                low: [
                    '今年多留意休息和情绪。失眠、焦虑、免疫力滑坡可能排队来——早处理，别等趴了才懂。',
                    '身体在发信号了。忽视小毛病很勇敢？勇敢得无聊。体检、早睡，比你算卦实在。',
                    '压力偏大。慢下来。极端节食、突击爆肝，都是给自己添乱。'
                ]
            },
            how: {
                high: ['身心还行。保持，别作死。'],
                mid: ['劳逸结合。硬撑不是勤快，是蠢。'],
                low: ['休息和情绪优先。身体垮了，啥运势都白搭。']
            }
        },
        general: {
            yesno: {
                high: [
                    '整体偏顺。你想办的事大多推得动——前提是你得动。继续坐等「时机成熟」，那时机永远不成熟。',
                    '今年气场不错，好几块会好转。窗口期就这么长，犹豫太久，好运也嫌你磨叽。',
                    '大运小旺，适合尝试。失败有，但比你原地打转划算。怕失败就别问运势了。'
                ],
                mid: [
                    '运势平平，有喜有忧。关键节点别赌一口气，也别彻底躺平——两个极端你好像都挺擅长。',
                    '今年像爬坡：累，但往上。急躁没用，耐心比你那点小聪明管用。',
                    '吉凶参半。好事要抓，坑要躲。靠谱的人多听两句，不靠谱的段子少信。'
                ],
                low: [
                    '今年宜守。大变动风险偏高。先稳住基本盘，别把「搏一把」当性格。',
                    '整体偏紧，挫折感可能多。当成调整期行，当成「今年完了」那是你自己加戏。',
                    '运势平淡。少折腾、多积累。有时候不动不是怂，是你终于学会了。'
                ]
            },
            how: {
                high: ['整体不错。顺势做，别乱作。'],
                mid: ['平稳过渡。大起大落那是电视剧，不是你的剧本。'],
                low: ['低调。先熬过去，再谈风生水起。']
            }
        }
    };

    const TIPS = {
        love: ['别等完美时机，时机嫌你矫情。有感觉就聊，废了也好过憋着。', '明显不合适还耗着？那不是深情，是浪费。', '套路玩得再花，不如一句老实话。做人设很累，做自己至少省电。'],
        career: ['简历糊成那样还怨没机会？先打磨，再喊不公。', '裸辞很爽，找下家很痛。骑驴找马不丢人。', '大目标拆成每周能做完的小事——你连小事都拖，就别谈梦想。'],
        wealth: ['记账一个月，你会发现钱不是没了，是被你亲手送走的。', '高收益配高风险。想稳赚？醒醒。', '没留应急金就投资？那是在赌自己不会出事。'],
        health: ['早睡比你囤的补品管用。真的。', '情绪也是病。难受就说，装坚强没人给你发奖状。', '每周动三次，半小时起步。突击三天又躺一周，别自我感动。'],
        general: ['遇事先问「最坏怎样」——你焦虑一大半是瞎演。', '好运留给有准备的人。没准备的人，只配当旁白。', '少跟人比。昨天的你要是都比不过，别人更没义务安慰你。']
    };

    function buildAnswer(topic, qType, prob, seed) {
        const band = prob >= 70 ? 'high' : prob >= 55 ? 'mid' : 'low';
        const pool = ANSWERS[topic] || ANSWERS.general;

        if (qType === 'how' || qType === 'open') {
            const howBand = prob >= 70 ? 'high' : prob >= 55 ? 'mid' : 'low';
            return pickVariant(pool.how[howBand] || pool.how.mid, seed);
        }
        return pickVariant(pool.yesno[band], seed);
    }

    function buildWhenHint(topic, prob, seed) {
        const months = ['三四月', '五六月', '七八月', '九十月', '年底前后'];
        const m = pickVariant(months, seed);
        if (prob >= 70) return `时间窗口大概在 ${m} 前后——到时候别又装忙错过。`;
        if (prob >= 55) return `下半年比上半年有戏，${m} 附近该动就动，别光看日历。`;
        return `今年前半段大概率平淡，${m} 之后再盯着点。急也没用。`;
    }

    function generate(context) {
        const {
            question = '',
            category = 'general',
            scores = {},
            signals = {},
            seedText = ''
        } = context;

        const displayQuestion = (question || '').trim() || DEFAULT_QUESTIONS[category] || DEFAULT_QUESTIONS.general;
        const topic = detectTopic(displayQuestion, category);
        const qType = detectQuestionType(displayQuestion);
        const seed = hashString(seedText + displayQuestion + topic);

        let prob = adjustProbability(getScoreForTopic(topic, scores), signals);
        prob = roundProb(prob);

        const label = qType === 'how' || qType === 'open'
            ? verdictLabelHow(prob)
            : verdictLabel(prob);

        let body = buildAnswer(topic, qType, prob, seed);
        if (qType === 'when') {
            body += ' ' + buildWhenHint(topic, prob, seed + 3);
        }

        const tip = pickVariant(TIPS[topic] || TIPS.general, seed + 7);

        return {
            question: displayQuestion,
            topic,
            probability: prob,
            label,
            body,
            tip,
            qType
        };
    }

    function render(container, context) {
        if (!container) return null;
        const data = generate(context);
        const probClass = data.probability >= 70 ? 'prob-high' : data.probability >= 55 ? 'prob-mid' : 'prob-low';

        container.innerHTML = `
            <div class="plain-speak-card ${probClass}">
                <div class="plain-speak-header">
                    <span class="plain-speak-badge">说人话</span>
                    <span class="plain-speak-tag">毒舌直说 · 不负责哄你</span>
                </div>
                <p class="plain-speak-question">你问：${escapeHtml(data.question)}</p>
                <div class="plain-speak-verdict">
                    <span class="plain-speak-prob">${data.probability}%</span>
                    <span class="plain-speak-label">${escapeHtml(data.label)}</span>
                </div>
                <p class="plain-speak-body">${escapeHtml(data.body)}</p>
                <p class="plain-speak-tip">💡 ${escapeHtml(data.tip)}</p>
            </div>
        `;
        container.classList.add('plain-speak-visible');
        return data;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function scoresFromSeed(text) {
        const h = hashString(text);
        return {
            love: 40 + (h % 61),
            career: 40 + ((h >> 3) % 61),
            wealth: 40 + ((h >> 6) % 61),
            health: 40 + ((h >> 9) % 61),
            general: 40 + ((h >> 12) % 61)
        };
    }

    global.PlainSpeak = {
        generate,
        render,
        detectTopic,
        scoresFromSeed,
        DEFAULT_QUESTIONS,
        CATEGORY_LABELS
    };
})(typeof window !== 'undefined' ? window : globalThis);
