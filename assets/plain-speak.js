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

    const VERDICT_YESNO = {
        high: ['大概率会，别再装死了', '挺有戏，别又怂回去', '机会砸脸上了，接不接随你', '大概率成，再拖就搞笑了'],
        mid: ['有戏，但别指望天上掉', '半吊子机会，别飘', '能成也能黄，看你作不作', '有苗头，别急着发朋友圈'],
        lowish: ['一半一半，别瞎自信', '悬，别自我感动', '五五开，少点幻觉', '说不好，你那点运气别透支'],
        low: ['短期内悬，醒醒吧', '悬得很，别硬冲', '难，先面对现实', '概率给你看清楚了，别装没看见']
    };

    const VERDICT_HOW = {
        high: ['整体偏顺，别糟践', '还行，别搞砸', '风向对你，别装可怜', '偏旺，别躺着等夸'],
        mid: ['凑合能过，别躺平', '一般般，别做梦', '中不溜，少点戏', '能过，别演苦情'],
        lowish: ['平平无奇，别做梦', '无聊的一年，认了吧', '没惊喜，少期待', '平淡到尴尬，别硬找意义'],
        low: ['挺难的，先照镜子', '偏紧，别硬刚', '难熬，少加戏', '不太好看，醒着点']
    };

    function verdictLabel(prob, seed) {
        const band = prob >= 70 ? 'high' : prob >= 55 ? 'mid' : prob >= 40 ? 'lowish' : 'low';
        return pickVariant(VERDICT_YESNO[band], seed);
    }

    function verdictLabelHow(prob, seed) {
        const band = prob >= 70 ? 'high' : prob >= 55 ? 'mid' : prob >= 40 ? 'lowish' : 'low';
        return pickVariant(VERDICT_HOW[band], seed);
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
                    '有戏。不一定立刻官宣，但能让你心跳的人会出现。问题不在天上，在你敢不敢开口——继续内耗，概率再高也是摆设。',
                    '挺讽刺的：你天天算「会不会遇到真爱」，运势还给你绿灯。结果呢？你大概还在删了又写、写了又删那句「在吗」。',
                    '感情线亮着。别一上来就演深情男主/女主，对方又不是来给你颁影帝的。正常聊天，比你那点小心机管用。',
                    '脱单窗口开着。你要是还在等「感觉对了」，那感觉大概在排队等你先像个正常人一样出现。'
                ],
                mid: [
                    '有苗头，但别美得太早。暧昧一阵就飘、对方忽冷忽热，你还在那儿「是不是命中注定」——不是，是你太爱脑补。',
                    '感情运半吊子。能遇到让你上心的人，成不成另说：沟通不行、现实条件不行、你耐心不行，三个里你占几个自己数。',
                    '桃花有一点，谈不上爆。还宅着等「对的人」自己撞上来？醒醒。先把圈子打开，再谈真爱不真爱。',
                    '半吊子桃花：够你心动，不够你躺赢。对方回慢了你就分析三天？恭喜，你在跟自己谈恋爱。',
                    '有人会出现，别急着喊真爱。先分清是喜欢你，还是喜欢有人陪他/她打发时间——你以前分不清的次数，自己心里有数。',
                    '缘分在晃，你也在晃。一个犹豫的人碰上另一个犹豫的人，最后往往只剩「算了」两个字。'
                ],
                low: [
                    '今年感情别硬冲。真爱像你想象的那么容易？短期内悬。先把自己收拾利索，别把「脱单」当人生KPI。',
                    '缘分慢点来。你越焦虑、越四处试探，越像在赶业绩。先把状态搞好，别把烂桃花当救命稻草。',
                    '感情线偏淡。不是宇宙亏你，是你要么太被动，要么太不挑。再在烂局里耗，明年还是这句。',
                    '短期内谈真爱？挺难为运势的。你现在更像在找安慰剂，不是找对象。先把空窗期过明白。',
                    '嘲讽一句：你问会不会遇到真爱，答案是——先别把「谁回我消息」当成命运启示录。',
                    '今年感情像堵车：能动，但慢，还容易插队插错。别急着官宣「命中注定」，先看看对方是不是临时挪过来的。'
                ]
            },
            how: {
                high: [
                    '感情运还行。单身的别装神秘，有伴的别冷暴力。真诚比你那点小心思值钱。',
                    '风向偏甜。你要是还玩若即若离那套，对方未必陪你演第二季。',
                    '感情这块给面子。别把「考验对方」当情趣，那叫精神内耗双人版。'
                ],
                mid: [
                    '感情平平，波动正常。少猜忌、多说话。继续闷着演，最后只剩你自己。',
                    '不甜不苦，尴尬档。少刷前任动态，多看看自己怎么把聊天聊死的。',
                    '一般。别动不动「我们是不是没缘分」——有时候是你太难相处。'
                ],
                low: [
                    '感情容易卡死。该断就断，该谈就谈。装没事最没用。',
                    '这阵子别硬谈恋爱。你情绪像地雷，谁靠近谁倒霉——先拆自己的雷。',
                    '偏淡、易踩坑。烂桃花笑着向你招手呢，你别假装看不懂。'
                ]
            }
        },
        career: {
            yesno: {
                high: [
                    '事业/学业今年偏顺。换工作、面试、考证——别比你以为的难。前提是：简历别糊弄、准备别裸奔。临阵怯场那是你自己的锅。',
                    '职场运在线。有机会、有贵人，甚至可能突然开窍。别再等「别人来发现你」——没人欠你赏识。',
                    '今年适合动。跳槽、晋升、转方向，比原地耗着强。还在「再观望一下」？观望到别人升完了再哭。',
                    '挺有意思：你一边焦虑「适不适合换」，一边什么都没准备。运势把门开了，你鞋都没穿好。',
                    '事业绿灯。别把「我考虑考虑」当智慧——有些机会只等一次，不等你的仪式感。',
                    '能冲。考证、面试、谈涨薪，都比你在被窝里刷「如何成功」强一百倍。'
                ],
                mid: [
                    '有机会，竞争也老实不客气。面试多试几家、项目多熬一阵——不是命运为难你，是你还不够稳。',
                    '事业运中等：有起色也有坑。一次押全部筹码那种操作，先问问你抗不抗得住。',
                    '换工作/升学不是没戏，但裸辞冲动是给自己挖坑。骑驴找马，比你「凭感觉」靠谱。',
                    '半吊子运势：够你进步，不够你躺赢。还在等「完美岗位」？完美岗位在招比你靠谱的人。',
                    '能成也能翻车。翻车原因通常不是命，是你准备比口号少。',
                    '职场像拼图，缺的那块多半是执行力。别怪老板瞎，先问问自己交出去的是不是半成品。'
                ],
                low: [
                    '今年职场宜守。大幅跳槽、激进创业？风险给你写在脸上了。先把现有赛道啃透，别幻想一夜翻盘。',
                    '事业线偏紧：拖延、沟通烂、考试翻车都可能。先照镜子找短板，别怪环境。',
                    '短期内想立刻翻盘？难。预期放低，小步推进。一口吃成胖子那是段子，不是你的策略。',
                    '嘲讽一下：你问适不适合换工作，更像在问「能不能逃避现状」。逃避可以，别包装成「听从内心」。',
                    '这阵子硬冲像拿鸡蛋碰石头——石头没意见，鸡蛋有意见。',
                    '宜攒技能、攒口碑。还想靠运气空降？空降的通常是问题，不是你。'
                ]
            },
            how: {
                high: [
                    '事业学业向上。定目标就冲，别光转发励志文。',
                    '顺风。别拿「我佛系」当偷懒借口。',
                    '能出成绩。少开会空谈，多交可验证的结果。'
                ],
                mid: [
                    '有起伏。坚持比赌运气重要——你赌运气赌输过几次自己清楚。',
                    '中游。别抱怨卷，你卷的强度大概只够发朋友圈。',
                    '能过。想突围可以，先把基础作业做完再谈天赋。'
                ],
                low: [
                    '先稳住基本盘。跟大环境硬刚，输了别喊不公平。',
                    '偏紧。少作大决定，多补短板——短板比你想象的显眼。',
                    '这阵子别作英雄。低调做事，比你发牢骚有用。'
                ]
            }
        },
        wealth: {
            yesno: {
                high: [
                    '财运偏暖。正财稳，偏财也有缝。别一听「有机会」就上头追涨——稳稳赚你嫌慢？那你配暴富吗。',
                    '钱景不错：奖金、副业、小意外都可能有。留应急金，别把存款当赌场筹码。',
                    '钱包比去年松一点。收入涨了，手也别跟着松——管不住手，再旺也是过路财神。',
                    '财运给你面子了。你要是再「随便买买」「先享受」，钱会用离开教育你什么叫自由。',
                    '能赚。别把「我值得」当消费理由——值得的是存折变厚，不是快递盒堆高。',
                    '偏财有缝，正财更稳。追风口可以，把家当押上就别喊惨。'
                ],
                mid: [
                    '财运一般：饿不着，也别做梦暴富。记账、控支出，听起来土？土的东西往往管用。',
                    '有进有出。打工稳一点，副业可以试；All in 那种操作，请先准备好哭的姿势。',
                    '大机会不多，小机会常在。确定性高的抓牢，其余少听「内幕」。',
                    '钱景中等。你不是没钱，是钱在你手里像过客——来得快，走得比你决断还快。',
                    '别问「会不会发财」。先问「这个月又为情绪买了多少单」。答案比卦准。',
                    '能维持。想暴富的心可以有，暴富的操作建议你先删掉。'
                ],
                low: [
                    '今年花钱口子可能开得大，投资宜怂。先还债、先存钱，比追热点体面。',
                    '偏财运弱。有人跟你说「稳赚不赔」？那是在考验你智商。守本金。',
                    '财务压力可能上来。冲动消费少来，大额支出多想想——你的钱包经不起你「开心一下」。',
                    '嘲讽一句：你问财运好不好，手还停在购物车结算页——这叫双向奔赴破产。',
                    '偏紧。投资少动，消费少浪。想靠运气翻本？运气看你笑话呢。',
                    '先止损。再「搏一把」之前，问问上一次搏完剩多少。'
                ]
            },
            how: {
                high: [
                    '财运尚可。量入为出，别装阔。',
                    '有进账空间。别把奖金当免费的空气。',
                    '偏暖。贪快钱之前先数数自己扛不扛得住亏。'
                ],
                mid: [
                    '收支勉强平衡。加杠杆之前先问问自己扛不扛得住。',
                    '平平。少听「躺赚」，多看账单。',
                    '不穷不富，尴尬档。你的消费欲望比财运积极多了。'
                ],
                low: [
                    '节流。投资多看少动——你手痒，钱会先痒。',
                    '偏紧。再「奖励自己」就奖励到吃土了。',
                    '宜守财。想发财可以，先学会不送钱。'
                ]
            }
        },
        health: {
            yesno: {
                high: [
                    '身体精神整体还行。别用「我还年轻」当熬夜执照——年轻也经不起你这么造。',
                    '健康偏稳。小毛病可能有，大问题暂时没有。颈椎、睡眠、情绪：三个里你先毁哪个？',
                    '气色心态都不错。补品堆一堆不如动一动——懒得动就别装养生博主。',
                    '运势给身体开了绿灯。你要是继续日夜颠倒，绿灯也会变「人走茶凉」。',
                    '还撑得住。别把撑得住当成可以继续作的许可证。',
                    '状态能打。少云养生，多落地——散步都比你收藏一百篇「如何好睡」强。'
                ],
                mid: [
                    '身体没大问题，就是容易累、容易焦虑。压力堆积是你自己堆的，该休息就休息，别硬充。',
                    '健康中等。饮食作息乱一点，身体会提醒你——别等提醒变成警告。',
                    '精神内耗比身体更拖后腿。闷着硬撑很酷？酷到最后只有体检单陪你。',
                    '半健康状态：表面没事，底子在透支。你最擅长的运动大概是「再刷一会儿」。',
                    '能过。但你那套「忙完再睡」「明天开始健身」，明天已经拖成年了。',
                    '警报还没响。你要是非要听到警报才停，身体会成全你。'
                ],
                low: [
                    '今年多留意休息和情绪。失眠、焦虑、免疫力滑坡可能排队来——早处理，别等趴了才懂。',
                    '身体在发信号了。忽视小毛病很勇敢？勇敢得无聊。体检、早睡，比你算卦实在。',
                    '压力偏大。慢下来。极端节食、突击爆肝，都是给自己添乱。',
                    '嘲讽一下：你一边问身体怎么样，一边准备再熬通宵——这叫边求救边放火。',
                    '偏紧。别跟身体赌气，你赌不赢。',
                    '先停作死项目：熬夜、乱吃、硬撑。运势救不了主动找死的人。'
                ]
            },
            how: {
                high: [
                    '身心还行。保持，别作死。',
                    '状态能打。别因为「还能撑」就继续浪。',
                    '不错。养生别停在嘴上。'
                ],
                mid: [
                    '劳逸结合。硬撑不是勤快，是蠢。',
                    '一般。情绪比身体更需要管理——你最会忽视的也是它。',
                    '能过。少内耗，多睡觉，少自我感动。'
                ],
                low: [
                    '休息和情绪优先。身体垮了，啥运势都白搭。',
                    '偏紧。先体检，再谈玄学。',
                    '别硬刚。你不是铁，铁都有疲劳极限。'
                ]
            }
        },
        general: {
            yesno: {
                high: [
                    '整体偏顺。你想办的事大多推得动——前提是你得动。继续坐等「时机成熟」，那时机永远不成熟。',
                    '今年气场不错，好几块会好转。窗口期就这么长，犹豫太久，好运也嫌你磨叽。',
                    '大运小旺，适合尝试。失败有，但比你原地打转划算。怕失败就别问运势了。',
                    '运势挺给脸。你要是还用「我命苦」当口头禅，那是在浪费一张好牌。',
                    '偏顺。别把好运当背景板——该出手时还在算计「会不会尴尬」，好运会先尴尬。',
                    '能成事。少抱怨、多行动。抱怨很省力，成事很费劲，你选哪个自己清楚。'
                ],
                mid: [
                    '运势平平，有喜有忧。关键节点别赌一口气，也别彻底躺平——两个极端你好像都挺擅长。',
                    '今年像爬坡：累，但往上。急躁没用，耐心比你那点小聪明管用。',
                    '吉凶参半。好事要抓，坑要躲。靠谱的人多听两句，不靠谱的段子少信。',
                    '中不溜。别把平淡过成苦情剧，也别把小确幸吹成人生高潮。',
                    '能过，别作。你最大的风险通常不是运气差，是手欠。',
                    '五五开。你问「会不会好」，更该问「我准备好承担责任了吗」。'
                ],
                low: [
                    '今年宜守。大变动风险偏高。先稳住基本盘，别把「搏一把」当性格。',
                    '整体偏紧，挫折感可能多。当成调整期行，当成「今年完了」那是你自己加戏。',
                    '运势平淡。少折腾、多积累。有时候不动不是怂，是你终于学会了。',
                    '嘲讽一句：你把希望寄托在算一卦上，却不愿改一个习惯——那卦再准也救不了你。',
                    '偏紧。少立flag，多做小事。flag倒得比你起得还快。',
                    '宜低调。高调招的不一定是好运，也可能是你还没准备好的麻烦。'
                ]
            },
            how: {
                high: [
                    '整体不错。顺势做，别乱作。',
                    '偏旺。别用焦虑浪费顺风局。',
                    '能推得动。少演戏，多交付。'
                ],
                mid: [
                    '平稳过渡。大起大落那是电视剧，不是你的剧本。',
                    '一般。接受平淡，比硬找刺激安全。',
                    '中游。别抱怨无聊——无聊往往是你还没开始做事。'
                ],
                low: [
                    '低调。先熬过去，再谈风生水起。',
                    '偏紧。少折腾，多复盘——复盘比算命便宜。',
                    '难一点。认清现实不丢人，装看不见才丢人。'
                ]
            }
        }
    };

    const TIPS = {
        love: [
            '别等完美时机，时机嫌你矫情。有感觉就聊，废了也好过憋着。',
            '明显不合适还耗着？那不是深情，是浪费。',
            '套路玩得再花，不如一句老实话。做人设很累，做自己至少省电。',
            '对方已读不回你就崩溃？先问问自己是不是把聊天当打卡任务了。',
            '别用「我只是不好意思」掩盖怂。怂可以，别美化。',
            '先把自己过得像个人，再谈谁配不配——你现在这副样子，宇宙也嫌累。'
        ],
        career: [
            '简历糊成那样还怨没机会？先打磨，再喊不公。',
            '裸辞很爽，找下家很痛。骑驴找马不丢人。',
            '大目标拆成每周能做完的小事——你连小事都拖，就别谈梦想。',
            '少在群里表演努力，多在结果里留下证据。',
            '不会就学，别用「我不适合」提前投降。',
            '反馈刺耳？刺耳往往比拍马屁接近真相。'
        ],
        wealth: [
            '记账一个月，你会发现钱不是没了，是被你亲手送走的。',
            '高收益配高风险。想稳赚？醒醒。',
            '没留应急金就投资？那是在赌自己不会出事。',
            '购物车清空前先冷静十分钟——你的冲动消费比星盘准。',
            '别把「我赚回来就好」当口头禅，赚回来之前先别花。',
            '听别人吹票前，先看自己扛不扛得住归零。'
        ],
        health: [
            '早睡比你囤的补品管用。真的。',
            '情绪也是病。难受就说，装坚强没人给你发奖状。',
            '每周动三次，半小时起步。突击三天又躺一周，别自我感动。',
            '手机放远点。你不是失眠，是沉迷。',
            '体检比算卦便宜，也比你硬撑有用。',
            '少用咖啡续命。续的不是命，是透支账单。'
        ],
        general: [
            '遇事先问「最坏怎样」——你焦虑一大半是瞎演。',
            '好运留给有准备的人。没准备的人，只配当旁白。',
            '少跟人比。昨天的你要是都比不过，别人更没义务安慰你。',
            '别把算一卦当行动替代品。卦算完，事还得你做。',
            '抱怨很解压，解决不了问题。你选哪个？',
            '运气再好，也救不了反复踩同一坑的人。'
        ]
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
        const high = [
            `时间窗口大概在 ${m} 前后——到时候别又装忙错过。`,
            `${m} 前后机会更明显。还在「再等等」？等着看别人拿结果吧。`,
            `盯着 ${m}。窗口不等人，尤其不等磨叽的人。`
        ];
        const mid = [
            `下半年比上半年有戏，${m} 附近该动就动，别光看日历。`,
            `${m} 前后值得试。试之前先准备，别空着手去碰运气。`,
            `节奏偏后。 ${m} 再冲，比你现在瞎扑腾强。`
        ];
        const low = [
            `今年前半段大概率平淡，${m} 之后再盯着点。急也没用。`,
            `别逼 ${m} 之前硬开花。花没开你先薅，最后只剩杆。`,
            `${m} 之前宜攒实力。急着验证运势，运势会用打脸验证你。`
        ];
        if (prob >= 70) return pickVariant(high, seed);
        if (prob >= 55) return pickVariant(mid, seed);
        return pickVariant(low, seed);
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
            ? verdictLabelHow(prob, seed + 11)
            : verdictLabel(prob, seed + 11);

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
                <p class="plain-speak-question">${escapeHtml(data.question)}</p>
                <div class="plain-speak-verdict">
                    <span class="plain-speak-prob">${data.probability}%</span>
                    <span class="plain-speak-label">${escapeHtml(data.label)}</span>
                </div>
                <p class="plain-speak-body">${escapeHtml(data.body)}</p>
                <p class="plain-speak-tip">${escapeHtml(data.tip)}</p>
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
