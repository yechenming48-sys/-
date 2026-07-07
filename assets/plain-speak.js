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
        if (prob >= 70) return '大概率会';
        if (prob >= 55) return '有机会，但要看行动';
        if (prob >= 40) return '一半一半';
        return '短期内比较难';
    }

    function verdictLabelHow(prob) {
        if (prob >= 70) return '整体偏顺';
        if (prob >= 55) return '还行，别摆烂';
        if (prob >= 40) return '平平无奇';
        return '需要多留意';
    }

    function pickVariant(arr, seed) {
        return arr[seed % arr.length];
    }

    const ANSWERS = {
        love: {
            yesno: {
                high: [
                    '今年感情线挺亮的，遇到心动对象的概率不低。不是电视剧里那种「命中注定」，更像是——你只要愿意多认识人、多回应一点，缘分很容易接上。',
                    '桃花运势在线。有人主动靠近、或者旧识重新联系的可能性都有。别把自己关太死，机会往往藏在日常社交里。',
                    '感情这块今年有戏。不一定马上脱单，但「有感觉、能聊得来」的人会出现，剩下就看你敢不敢往前迈一步。'
                ],
                mid: [
                    '有苗头，但别指望一帆风顺。可能暧昧一阵、或者对方态度忽冷忽热——不是没缘分，是节奏还没对齐。',
                    '感情运中等偏上。会遇到让你上心的人，但成不成还要看沟通、现实条件，以及你有没有耐心。',
                    '桃花不算爆棚，但也不是零。适合先扩大圈子，别急着定结论，给彼此一点时间。'
                ],
                low: [
                    '今年感情不是主旋律，短期内「立刻遇到真爱」的难度偏大。更适合先把自己状态调整好，别为了脱单而脱单。',
                    '缘分来得可能慢一点。眼下更适合专注自我成长，感情往往在你不那么焦虑的时候反而冒出来。',
                    '感情线偏淡，不是没机会，而是需要更主动、更清醒。别在烂桃花上耗太久。'
                ]
            },
            how: {
                high: ['感情运不错，单身有望脱单，有伴的适合推进关系。记得真诚比套路管用。'],
                mid: ['感情平平，有波动正常。少猜疑、多表达，比瞎猜星盘管用。'],
                low: ['感情容易卡壳，先稳住情绪。该聊的聊清楚，该放的放。']
            }
        },
        career: {
            yesno: {
                high: [
                    '事业/学业这块今年偏顺。换工作、面试、考证——成功率比你自己以为的高。关键是简历和准备要到位，别临阵怯场。',
                    '职场运势在线。有贵人、有项目机会，或者学习内容突然开窍。适合主动争取，别等别人来发现你。',
                    '今年适合动。跳槽、晋升、转方向都不算冒险，反而是停滞更亏。做好计划就可以冲。'
                ],
                mid: [
                    '有机会，但竞争也不小。面试可能要多试几家，项目可能要多熬一阵——不是不行，是得稳扎稳打。',
                    '事业运中等：有起色，也有波折。适合边做边调整，别一次押注全部筹码。',
                    '换工作/升学不是没戏，但别冲动裸辞。先骑驴找马，胜算更高。'
                ],
                low: [
                    '今年职场宜守不宜攻。大幅跳槽、激进创业风险偏高，更适合深耕现有赛道、攒技能和口碑。',
                    '事业线偏紧，容易遇到拖延、沟通成本或考试失利。先复盘短板，再谈下一步。',
                    '短期内「立刻翻盘」难度较大。把预期放低，小步快跑，比一口吃成胖子现实。'
                ]
            },
            how: {
                high: ['学业事业整体向上，适合定目标、冲一把。'],
                mid: ['有起伏，坚持节奏比赌运气重要。'],
                low: ['先稳住基本盘，别跟大环境硬刚。']
            }
        },
        wealth: {
            yesno: {
                high: [
                    '财运偏暖，正财稳、偏财也有机会。适合理性理财，别贪快钱——稳稳赚比一夜暴富靠谱。',
                    '钱景不错，可能有奖金、副业收入或意外小财。记得留应急金，别全砸高风险投资。',
                    '今年钱包比去年松一点。收入渠道可能增加，但消费欲望也会涨——管住手就是赚。'
                ],
                mid: [
                    '财运一般：饿不着，也难暴富。适合记账、控支出，小赚靠勤，大赚靠运和眼光。',
                    '有进有出，别乱投资。打工收入稳，副业可以试，但别押全部身家。',
                    '财路平平，大机会不多，小机会常出现。抓住确定性高的那部分就行。'
                ],
                low: [
                    '今年花钱的地方可能比较多，投资宜保守。先还债、先储蓄，比追涨杀跌明智。',
                    '偏财运弱，别信「稳赚不赔」。守住本金，比搏一把更重要。',
                    '财务压力可能上来，减少冲动消费，大额支出多想想。'
                ]
            },
            how: {
                high: ['财运尚可，量入为出就能过得舒服。'],
                mid: ['收支平衡，别乱加杠杆。'],
                low: ['宜节流，投资多看少动。']
            }
        },
        health: {
            yesno: {
                high: [
                    '身体和精神状态整体还行，精力充沛的日子居多。保持作息和运动，别熬夜硬扛。',
                    '健康运平稳偏上。小毛病可能有，但大无碍。注意颈椎、睡眠和情绪管理。',
                    '气色和心态都不错。适合培养运动习惯，比补品更管用。'
                ],
                mid: [
                    '身体没大问题，但容易累、容易焦虑。多半是压力堆积，该休息就休息。',
                    '健康中等：别透支。饮食作息乱一点，身体就会提醒你。',
                    '精神内耗可能比身体更拖后腿。找人聊聊、出去走走，比硬撑有效。'
                ],
                low: [
                    '今年要特别留意休息和情绪。失眠、焦虑、免疫力下降都可能来敲门——早发现早调整。',
                    '身体在发信号了，别忽视小毛病。体检、早睡、少熬夜，是最实在的「改运」。',
                    '压力偏大，宜慢下来。剧烈运动或极端节食都不建议，循序渐进。'
                ]
            },
            how: {
                high: ['身心状态不错，保持就好。'],
                mid: ['注意劳逸结合，别硬撑。'],
                low: ['优先休息和情绪，身体第一。']
            }
        },
        general: {
            yesno: {
                high: [
                    '整体运势偏顺，你想办的事大多能推进。不是事事完美，但大方向对你友好——主动一点，收获会比坐等多。',
                    '今年气场不错，人际、工作、生活有几块会明显好转。抓住窗口期，别犹豫太久。',
                    '大运小旺，适合尝试新事物。失败概率有，但成功的性价比更高。'
                ],
                mid: [
                    '运势平平，有喜有忧。关键节点选择要稳，别赌一口气，也别完全躺平。',
                    '今年像「爬坡期」：累，但往上走。耐心比急躁管用。',
                    '吉凶参半，好事要抓，坑要躲。多听靠谱的人意见。'
                ],
                low: [
                    '今年宜守不宜攻，大变动风险偏高。先稳住基本盘，再图后效。',
                    '整体偏紧，挫折感可能多一点。把它当成调整期，别急着下结论说「今年完了」。',
                    '运势平淡，少折腾、多积累。有时候「不动」就是最好的策略。'
                ]
            },
            how: {
                high: ['整体不错，顺势而为即可。'],
                mid: ['平稳过渡，别大起大落。'],
                low: ['低调行事，先熬过去。']
            }
        }
    };

    const TIPS = {
        love: ['多参加聚会、别总宅着；有感觉就聊两句，别等「完美时机」。', '别在明显不合适的人身上耗太久，及时止损也是桃花运。', '真诚比套路管用，做自己比扮演人设轻松。'],
        career: ['简历和作品集先打磨好，机会来了才能接住。', '骑驴找马往往比裸辞稳妥。', '把一个大目标拆成每周能完成的小步骤。'],
        wealth: ['记账一个月，你会惊讶钱去哪了。', '高收益必伴随高风险，别 All in。', '先留够 3–6 个月生活费再谈投资。'],
        health: ['早睡比补品管用，真的。', '情绪也是健康的一部分，难受就说出来。', '每周动三次，每次半小时，比突击健身可持续。'],
        general: ['遇事多问一句「最坏能怎样」，焦虑会少一半。', '好运气常留给有准备的人。', '今年少跟人比，多跟昨天的自己比。']
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
        if (prob >= 70) return `时间窗口大概在 ${m} 前后，那段时间多留意机会。`;
        if (prob >= 55) return `下半年比上半年更有戏，${m} 附近值得多行动。`;
        return `今年前半段可能平淡，${m} 之后再观察也不迟。`;
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
                    <span class="plain-speak-tag">直白解读 · 仅供参考</span>
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
