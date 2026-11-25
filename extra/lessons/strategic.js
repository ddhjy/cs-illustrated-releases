// Lesson 2 — Strategic vs. Tactical Programming (A Philosophy of Software Design, ch. 3)

import { L, LL, backlog, block, crowd, link, panel, path, tag } from '../kit.js';

const TEAM_Y = -9;
const CODE_Y = 1;
const ROW_Y = 6;
const TX = -7;
const SX = 7;

const asks = () => crowd({ x0: -3, x1: 3, y0: -21, y1: -17 }, 6, L('feature requests', '功能需求'));
const team = { s: 4.4, h: 38, pills: 'below' };
const tac = (o = {}) => block(TX, TEAM_Y, { ...team, color: 'orange', glyph: 'zap', label: LL(['Tactical', 'team'], ['战术式', '团队']), ...o });
const str = (o = {}) => block(SX, TEAM_Y, { ...team, color: 'green', glyph: 'target', label: LL(['Strategic', 'team'], ['战略式', '团队']), ...o });
const code = (x, o = {}) => block(x, CODE_Y, { s: 4.6, h: 30, glyph: 'code', label: [L('Codebase', '代码库')], ...o });
// One dot per shipped feature. The counts are an illustration of the book's Figure 3.1, not data.
const shipped = (x, n, color) => backlog(x, ROW_Y, n, [0, 1], { gap: 0.85, color });

const scene = ({ t, s, tacO, strO, tcodeO, scodeO, card, tacFlow = {}, strFlow = {}, bugs = 0 }) => ({
  entities: {
    asks: asks(),
    tac: tac(tacO),
    str: str(strO),
    tcode: code(TX, tcodeO),
    scode: code(SX, scodeO),
    trow: shipped(TX, t, '#efb041'),
    srow: shipped(SX, s, '#7fc278'),
    ...(card ? { card } : {}),
  },
  links: {
    at: path('asks', 'tac', ['asks', ['asks', -14], ['tac', -14], 'tac']),
    as: path('asks', 'str', ['asks', ['asks', -14], ['str', -14], 'str']),
    tc: link('tac', 'tcode', bugs ? { fail: bugs } : {}),
    sc: link('str', 'scode'),
  },
  flows: [
    { route: ['at', 'tc'], rate: 1, ...tacFlow },
    { route: ['as', 'sc'], rate: 1, ...strFlow },
  ],
});

const clean = L('clean', '干净');
const shortcuts = L('a few shortcuts', '有些捷径');
const patchy = L('patched all over', '到处是补丁');
const mess = L('a mess', '一团乱');

const late = (o = {}) =>
  scene({
    t: 14,
    s: 18,
    tcodeO: { h: 46, heat: 0.9, tags: [tag(L('every change is risky', '每次改动都有风险'), 'red', 'alert')] },
    scodeO: { h: 54, tags: [tag(L('still easy to change', '依然容易修改'), 'green', 'check')] },
    tacFlow: { rate: 0.45, kind: 'slow' },
    strFlow: { rate: 1.5 },
    bugs: 0.4,
    ...o,
  });

export default {
  id: 'psd-strategic',
  title: L('Strategic vs. Tactical Programming', '战略式编程与战术式编程'),
  summary: L(
    'Two teams, one backlog: why working code is not enough, and what a steady 10–20% investment in design buys.',
    '两个团队，同一份需求：为什么代码能跑还不够，以及持续投入 10–20% 的时间做设计能换来什么。',
  ),
  minutes: 9,
  level: 'beginner',
  metrics: ['psdTacShip', 'psdStrShip', 'psdMess'],
  legend: [
    ['req', L('feature', '功能')],
    ['slow', L('slow feature', '做得很慢的功能')],
    ['fail', L('bug', 'bug')],
  ],
  goals: [
    { text: L('What tactical programming is, and why it tempts', '什么是战术式编程，它为什么诱人'), step: 1 },
    { text: L('How shortcuts turn into a slow codebase', '捷径如何变成一个改不动的代码库'), step: 2 },
    { text: L('What the strategic 10–20% is spent on', '战略式的 10–20% 花在哪里'), step: 4 },
    { text: L('When the investment pays off', '这笔投入什么时候回本'), step: 5 },
  ],
  steps: [
    {
      short: L('Two teams', '两个团队'),
      chapter: 'setup',
      title: L('Two teams, one backlog', '两个团队，同一份需求'),
      body: [
        L(
          'Two teams build the same product from the same list of feature requests. Same skills, same deadlines. The only difference is what each team counts as <em>done</em>.',
          '两个团队根据同一份需求清单做同一个产品。能力一样，期限一样。唯一的区别是：各自认为什么才算<em>做完</em>。',
        ),
        L(
          'The <span class="term">tactical</span> team is done when the feature works. The <span class="term">strategic</span> team is done when the feature works <b>and</b> the design is still good. Each dot that appears on the floor is a shipped feature.',
          '<span class="term">战术式</span>团队：功能能跑就算做完。<span class="term">战略式</span>团队：功能能跑，<b>而且</b>设计依然良好，才算做完。地面上每出现一个圆点，代表上线了一个功能。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Most code is written by extending code that already exists. So the most valuable thing a developer leaves behind is a structure the next change fits into easily.',
          '大部分代码都是在已有代码上扩展出来的。所以开发者留下的最有价值的东西，是一个让下一次修改能轻松放进去的结构。',
        ),
      },
      metrics: { psdTacShip: 0, psdStrShip: 0, psdMess: clean },
      scene: scene({ t: 0, s: 0 }),
    },
    {
      short: L('Get it working', '先跑起来'),
      chapter: 'technique',
      title: L('Tactical: just get it working', '战术式：先让它跑起来'),
      body: [
        L(
          'The tactical team takes the quickest route to each feature. A special case here, a copied block there. Every shortcut is small, and it saves real time today.',
          '战术式团队对每个功能都走最快的路。这里加个特例，那里复制一段代码。每个捷径都很小，而且今天确实省了时间。',
        ),
        L(
          'It works. In the first stretch they ship <b>10–20% more</b>. This is why the approach is so hard to give up, and why almost nobody chooses it on purpose. There is just a deadline, and then another one.',
          '这招管用。在最初一段时间里，他们多交付了 <b>10–20%</b>。这就是这种方式很难戒掉的原因，也是为什么几乎没有人是故意选择它的：只是有个期限，然后又是一个期限。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Tactical programming is not laziness. It is short-sightedness: the goal is the next working feature, and the future of the code is simply not part of the task.',
          '战术式编程不是懒，而是短视：目标是下一个能跑的功能，代码的将来根本不在任务范围里。',
        ),
      },
      changes: [L('+ Tactical: 6 shipped', '+ 战术式：上线 6 个'), L('+ Strategic: 5 shipped', '+ 战略式：上线 5 个')],
      metrics: { psdTacShip: 6, psdStrShip: 5, psdMess: shortcuts },
      scene: scene({
        t: 6,
        s: 5,
        tcodeO: { h: 34, heat: 0.2, tags: [tag(L('6 shortcuts', '6 个捷径'), 'amber', 'hammer')] },
        scodeO: { h: 34 },
        tacFlow: { rate: 1.3 },
      }),
    },
    {
      short: L('Shortcuts pile up', '捷径越积越多'),
      chapter: 'problem',
      title: L('The shortcuts pile up', '捷径越积越多'),
      body: [
        L(
          'Every shortcut stays in the code. The next feature has to get around it, and the easiest way around is another shortcut. A refactor would help, but it would slow down the task at hand, so it waits.',
          '每个捷径都留在了代码里。下一个功能得绕开它，而最省事的绕法就是再加一个捷径。重构会有帮助，但会拖慢手头的任务，于是就先放着。',
        ),
        L(
          'Now features take longer and break things that used to work. Nobody decided this. It is the sum of many decisions that each looked reasonable.',
          '现在做功能越来越慢，还会弄坏原本好好的东西。没有人做过这个决定。它是许多看起来都很合理的决定加在一起的结果。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          '“We’ll clean it up after this release.” There is always another release. Once design improvements start being postponed, the postponement tends to become permanent.',
          '“等这个版本发完就整理。”可永远有下一个版本。设计上的改进一旦开始往后拖，往往就永远拖下去了。',
        ),
      },
      changes: [L('~ Tactical codebase: 14 workarounds', '~ 战术式代码库：14 处变通做法'), L('~ New features slow down and start to break things', '~ 新功能变慢，并开始弄坏别的东西')],
      metrics: { psdTacShip: 10, psdStrShip: 9, psdMess: patchy },
      scene: scene({
        t: 10,
        s: 9,
        tcodeO: { h: 40, heat: 0.55, tags: [tag(L('14 workarounds', '14 处变通做法'), 'amber', 'hammer')] },
        scodeO: { h: 40 },
        tacFlow: { rate: 0.8, kind: 'slow' },
        bugs: 0.25,
      }),
    },
    {
      short: L('The tornado', '龙卷风'),
      chapter: 'problem',
      title: L('The tactical tornado', '战术龙卷风'),
      body: [
        L(
          'Most organisations have one: a prolific programmer who gets features out faster than anyone else. Managers often treat this person as a hero.',
          '大多数组织里都有这么一位：产出惊人的程序员，做功能比谁都快。管理层常常把这个人当成英雄。',
        ),
        L(
          'The engineers who work with that code later see it differently. They clean up what the tornado left behind, and it ends up looking as if <em>they</em> are the slow ones.',
          '后来要接手这些代码的工程师看法就不一样了。他们负责收拾龙卷风留下的烂摊子，结果看起来反倒是<em>他们</em>进度慢。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Counting features per week hides the cost. The bill arrives later, and someone else pays it.',
          '只数每周做了几个功能，会把代价藏起来。账单晚些时候才到，而且是别人来付。',
        ),
      },
      changes: [L('+ One very fast developer', '+ 一位速度极快的开发者'), L('~ The rest of the team cleans up', '~ 团队其他人负责收拾')],
      metrics: { psdTacShip: 10, psdStrShip: 9, psdMess: patchy },
      scene: scene({
        t: 10,
        s: 9,
        tacO: { tags: [tag(L('“our fastest developer”', '“我们最快的开发者”'), 'amber', 'zap')] },
        tcodeO: { h: 40, heat: 0.7, tags: [tag(L('someone else cleans up', '别人来收拾'), 'red', 'flame')] },
        scodeO: { h: 40 },
        tacFlow: { rate: 0.8, kind: 'slow' },
        bugs: 0.3,
      }),
    },
    {
      short: L('Invest', '投资'),
      chapter: 'solution',
      title: L('Strategic: invest 10–20%', '战略式：投入 10–20%'),
      body: [
        L(
          'The strategic team spends about <b>10–20% of its time</b> on design. Part of it is <b>proactive</b>: trying a second design before coding, writing the documentation, imagining how the code may have to change. Part is <b>reactive</b>: when a design problem shows up, fixing it properly instead of patching around it.',
          '战略式团队把大约 <b>10–20% 的时间</b>花在设计上。一部分是<b>主动</b>的：动手之前多试一种设计、把文档写好、设想代码将来可能怎么变。一部分是<b>被动</b>的：发现设计问题时，把它正经修好，而不是打个补丁绕过去。',
        ),
        L(
          'One big design phase up front would not work, because the right design only emerges as you learn about the system. So the investments are small and they never stop.',
          '一开始就做一次大设计是行不通的，因为合适的设计只有在你逐步了解系统之后才会浮现。所以这些投入每次都很小，但从不间断。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Working code isn’t enough. The primary goal is a great design, which also happens to work.',
          '代码能跑还不够。首要目标是一个出色的设计，同时它恰好也能跑。',
        ),
      },
      changes: [L('+ Strategic: 10–20% of the time goes into design', '+ 战略式：10–20% 的时间用于设计'), L('~ Strategic catches up', '~ 战略式追了上来')],
      metrics: { psdTacShip: 12, psdStrShip: 13, psdMess: patchy },
      scene: scene({
        t: 12,
        s: 13,
        strO: { tags: [tag(L('10–20% on design', '10–20% 用于设计'), 'green', 'target')] },
        tcodeO: { h: 43, heat: 0.75, tags: [tag(L('20 workarounds', '20 处变通做法'), 'red', 'hammer')] },
        scodeO: { h: 46, tags: [tag(L('reworked as it grew', '边长大边整理'), 'green', 'refresh')] },
        tacFlow: { rate: 0.6, kind: 'slow' },
        strFlow: { rate: 1.2 },
        bugs: 0.3,
        card: panel(
          L('Where the 10–20% goes', '这 10–20% 花在哪里'),
          [
            L('**proactive**   try a second design first', '**主动**   先多试一种设计'),
            L('**proactive**   write the documentation', '**主动**   把文档写好'),
            L('**reactive**    fix design problems when found', '**被动**   发现设计问题就修好'),
            L('# small steps, all the time', '# 每次一小步，一直不停'),
          ],
          'target',
        ),
      }),
    },
    {
      short: L('Crossover', '曲线交叉'),
      chapter: 'insight',
      title: L('The lines cross', '两条曲线交叉了'),
      body: [
        L(
          'The strategic team started slower. It is ahead now, and the gap keeps growing. Past investments save enough time to pay for the new ones, so from here on good design is effectively free.',
          '战略式团队起步更慢，现在却领先了，而且差距还在拉大。过去的投入省下的时间足以支付新的投入，所以从这里开始，好设计实际上是免费的。',
        ),
        L(
          'The tactical team has given back everything it gained at the start. For the rest of the system’s life it will be slower than it could have been.',
          '战术式团队已经把一开始赚到的全部还了回去。在系统余下的生命周期里，它都会比本来能达到的速度更慢。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'The book expects the benefits within a few months, and reports that badly degraded code slows work by at least 20%. The dots here show the shape of that effect. They are an illustration, not a measurement.',
          '书中认为几个月内就能看到收益，并提到严重劣化的代码至少会让开发慢 20%。这里的圆点展示的是这种效应的形状，是示意，不是测量数据。',
        ),
      },
      changes: [L('~ Strategic: 18 shipped · Tactical: 14 shipped', '~ 战略式：上线 18 个 · 战术式：上线 14 个')],
      metrics: { psdTacShip: 14, psdStrShip: 18, psdMess: mess },
      scene: late(),
    },
    {
      short: L('Under pressure', '压力之下'),
      chapter: 'tradeoff',
      title: L('Case: startups and deadlines', '案例：创业公司与期限'),
      body: [
        L(
          'A young company under pressure may feel that even 10–20% is too much. Facebook’s early motto was “Move fast and break things”. Engineers had great freedom, and much of the code ended up unstable and hard to understand. The motto later became “Move fast with solid infrastructure”.',
          '压力之下的年轻公司可能觉得连 10–20% 都拿不出来。Facebook 早期的口号是“快速行动，打破陈规”。工程师有很大的自由，而大量代码最后变得不稳定、难以理解。这句口号后来改成了“在稳固的基础设施上快速行动”。',
        ),
        L(
          'Google and VMware grew up in the same years with a more strategic culture, and built reliable systems for hard problems. Either road can lead to a successful company. But spaghetti code is nearly impossible to fix later, and design pays off soon enough that going tactical may not even speed up the first release.',
          'Google 和 VMware 在同一时期成长起来，文化更偏战略式，并且为很难的问题做出了可靠的系统。两条路都可能通向成功的公司。但面条式代码事后几乎没法修；而设计回本够快，战术式甚至未必能让第一个版本更早发布。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Good engineers care about design. Word of a wrecked codebase gets around, and it becomes harder to hire the people who could repair it.',
          '优秀的工程师在乎设计。代码库烂掉的名声会传开，于是更难招到能把它修好的人。',
        ),
      },
      changes: [L('~ The same choice, at company scale', '~ 同样的选择，放大到公司层面')],
      metrics: { psdTacShip: 14, psdStrShip: 18, psdMess: mess },
      scene: late({
        tacO: { tags: [tag(L('“move fast and break things”', '“快速行动，打破陈规”'), 'amber', 'zap')] },
        strO: { tags: [tag(L('“…with solid infrastructure”', '“……在稳固的基础设施上”'), 'green', 'shield')] },
      }),
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<table class="compare">
          <thead><tr><th></th><th>Tactical</th><th>Strategic</th></tr></thead>
          <tbody>
            <tr><td>Done means</td><td>It works</td><td>It works and the design is good</td></tr>
            <tr><td>Time on design</td><td>None</td><td>10–20%, all the time</td></tr>
            <tr><td>At the start</td><td>10–20% faster</td><td>A little slower</td></tr>
            <tr><td>Later</td><td>Slower, for good</td><td>Faster; investments pay for themselves</td></tr>
            <tr><td>A design problem</td><td>Patch around it</td><td>Fix the design</td></tr>
          </tbody>
        </table>`,
          `<table class="compare">
          <thead><tr><th></th><th>战术式</th><th>战略式</th></tr></thead>
          <tbody>
            <tr><td>“做完”的标准</td><td>能跑</td><td>能跑，而且设计良好</td></tr>
            <tr><td>花在设计上的时间</td><td>没有</td><td>10–20%，持续投入</td></tr>
            <tr><td>起步阶段</td><td>快 10–20%</td><td>稍慢一点</td></tr>
            <tr><td>之后</td><td>变慢，而且回不去</td><td>更快；投入自己回本</td></tr>
            <tr><td>遇到设计问题</td><td>打补丁绕过去</td><td>把设计修好</td></tr>
          </tbody>
        </table>`,
        ),
        L(
          'The rest of this module is about what to spend that 10–20% on.',
          '本模块余下的课程，讲的就是这 10–20% 该花在什么上。',
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>Modules Should Be Deep</b>. The most useful single idea for judging a design: how much a module hides behind how small an interface.',
          '下一课：<b>模块应该是深的</b>。评判设计时最有用的一个想法：一个模块用多小的接口，藏住了多少东西。',
        ),
      },
      metrics: { psdTacShip: 14, psdStrShip: 18, psdMess: mess },
      scene: late(),
    },
  ],
};
