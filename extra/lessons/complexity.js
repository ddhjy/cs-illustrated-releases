// Lesson 1 — The Nature of Complexity (A Philosophy of Software Design, ch. 2)

import { L, block, crowd, ghost, panel, path, tag } from '../kit.js';

const OLD = '#2f6fde';
const NEW = '#1f9d55';

const PAGES = [
  ['home', -16, L('Home', '首页')],
  ['search', -8, L('Search', '搜索')],
  ['cart', 0, L('Cart', '购物车')],
  ['profile', 8, L('Profile', '个人资料')],
];
const PAGE_Y = 5;
const CHECKOUT_X = 16;

const you = () => crowd({ x0: -1.6, x1: 1.6, y0: -18, y1: -15 }, 1, L('you', '你'));
const page = (x, label, o = {}) => block(x, PAGE_Y, { s: 3.4, h: 28, glyph: 'window', label: [label], ...o });
const pages = (each = () => ({})) => Object.fromEntries(PAGES.map(([id, x, label], i) => [id, page(x, label, each(id, i))]));
const checkout = (o = {}) => page(CHECKOUT_X, L('Checkout', '结账'), o);
const theme = (o = {}) => block(0, -6, { s: 4.4, h: 40, color: 'green', glyph: 'component', label: ['Theme'], pills: 'below', ...o });

const hardCoded = () => ({ tags: [tag(OLD, 'paper', 'code')] });
const edit = (id, from = 'you', o = {}) => path(from, id, [from, [from, -10], [id, -10], id], o);
const editLinks = (o = {}) => Object.fromEntries(PAGES.map(([id]) => [`e_${id}`, edit(id, 'you', o)]));
const editAll = (rate = 0.55) => ({ fanout: true, routes: PAGES.map(([id]) => ({ path: [`e_${id}`] })), kind: 'write', rate });

const useLinks = () =>
  Object.fromEntries([...PAGES.map(([id]) => id), 'checkout'].map((id) => [`u_${id}`, path('theme', id, ['theme', ['theme', -1], [id, -1], id], { heads: 'none' })]));

const fixed = (card) => ({
  entities: {
    you: you(),
    theme: theme({ tags: [tag(`bannerBg = ${NEW}`, 'green', 'check')] }),
    ...pages(() => ({ tags: [tag('theme.bannerBg', 'green')] })),
    checkout: checkout({ tags: [tag('theme.emphasisBg', 'green')] }),
    ...(card ? { card } : {}),
  },
  links: { edit: path('you', 'theme', ['you', 'theme']), ...useLinks() },
  flows: [
    { route: ['edit'], kind: 'write', rate: 0.5 },
    { fanout: true, routes: [...PAGES.map(([id]) => id), 'checkout'].map((id) => ({ path: [`u_${id}`] })), kind: 'push', rate: 0.5 },
  ],
});

const lots = L('a lot', '很多');
const little = L('very little', '很少');
const none = L('none', '没有');
const hidden = L('1 hidden', '1 处隐藏');

export default {
  id: 'psd-complexity',
  title: L('The Nature of Complexity', '复杂性的本质'),
  summary: L(
    'What makes software hard to change: three symptoms, two causes, and why it always arrives in small steps.',
    '软件为什么难改：三个症状、两个成因，以及它为什么总是一点一点积累起来的。',
  ),
  minutes: 9,
  level: 'beginner',
  metrics: ['psdEdits', 'psdLoad', 'psdUnknown'],
  legend: [
    ['write', L('an edit', '一次修改')],
    ['push', L('value in use', '被使用的值')],
    ['fail', L('missed spot', '漏改的地方')],
  ],
  goals: [
    { text: L('What complexity is, and how to recognise it', '什么是复杂性，如何认出它'), step: 1 },
    { text: L('Why unknown unknowns are the worst symptom', '为什么“未知的未知”是最糟的症状'), step: 3 },
    { text: L('The two causes: dependencies and obscurity', '两个成因：依赖与隐晦'), step: 4 },
    { text: L('Why complexity arrives in small steps', '为什么复杂性总是一点点积累'), step: 5 },
  ],
  steps: [
    {
      short: L('A small change', '一个小改动'),
      chapter: 'setup',
      title: L('A one-line change?', '只改一行？'),
      body: [
        L(
          'A shop website with a handful of pages. Each has a coloured banner across the top. The request sounds trivial: <b>make the banner green instead of blue</b>.',
          '一个商城网站，有若干个页面，每个页面顶部都有一条彩色横幅。需求听起来再简单不过：<b>把横幅从蓝色改成绿色</b>。',
        ),
        L(
          'How long this takes says a lot about the code. John Ousterhout defines <span class="term">complexity</span> as anything in the structure of a system that makes it <b>hard to understand and modify</b>. It is not about size: a large system that is easy to work on is, by this definition, simple.',
          '这件事要花多久，很能说明代码的状况。John Ousterhout 把<span class="term">复杂性</span>定义为：系统结构中任何让它<b>难以理解、难以修改</b>的东西。它和规模无关：一个很大但改起来很轻松的系统，按这个定义就是简单的。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Complexity is easier for readers to see than for writers. If others find your code hard to follow, it is complex, however clear it looks to you.',
          '复杂性读者比作者更容易看出来。如果别人觉得你的代码难懂，那它就是复杂的，不管你自己看着多清楚。',
        ),
      },
      metrics: { psdEdits: '?', psdLoad: '?', psdUnknown: '?' },
      scene: {
        entities: { you: you(), ...pages() },
        links: { e_home: edit('home') },
        flows: [{ route: ['e_home'], kind: 'write', rate: 0.6 }],
      },
    },
    {
      short: L('Amplification', '修改放大'),
      chapter: 'problem',
      title: L('Symptom 1: change amplification', '症状一：修改放大'),
      body: [
        L(
          `You open the Home page and find the colour written right there: <code>${OLD}</code>. Then you open the next page. The same value is typed into <b>every one of them</b>.`,
          `你打开首页，颜色就直接写在那里：<code>${OLD}</code>。再打开下一个页面，同样的值在<b>每个页面里都写了一遍</b>。`,
        ),
        L(
          'One decision, four edits. This is <span class="term">change amplification</span>: a change that is simple in your head needs code changes in many different places.',
          '一个决定，要改四处。这就是<span class="term">修改放大</span>：脑子里很简单的一个改动，落到代码上却要改很多不同的地方。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'A good design keeps the amount of code touched by each design decision small.',
          '好的设计会让每个设计决定牵动的代码量尽量小。',
        ),
      },
      changes: [L('~ The banner colour is hard-coded in every page', '~ 横幅颜色在每个页面里都是写死的')],
      metrics: { psdEdits: 4, psdLoad: '?', psdUnknown: '?' },
      scene: {
        entities: { you: you(), ...pages(hardCoded) },
        links: editLinks(),
        flows: [editAll()],
      },
    },
    {
      short: L('Cognitive load', '认知负荷'),
      chapter: 'problem',
      title: L('Symptom 2: cognitive load', '症状二：认知负荷'),
      body: [
        L(
          'Before you can edit safely you need answers. Which pages have a banner? Does each one spell the colour the same way? Is that blue used for anything else?',
          '在放心动手之前，你得先弄清几件事：哪些页面有横幅？每个页面写颜色的方式一样吗？这个蓝色还用在别的什么地方吗？',
        ),
        L(
          '<span class="term">Cognitive load</span> is how much a developer has to know to finish a task. More to know means more time, and more chances to miss something and ship a bug.',
          '<span class="term">认知负荷</span>是指开发者要完成一项任务，必须知道多少东西。要知道的越多，花的时间越多，漏掉什么、带着 bug 上线的机会也越多。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Fewer lines is not the same as simpler. A longer version that needs less knowledge to change is the simpler one.',
          '行数少不等于简单。写得长一点、但改起来需要了解的东西更少的版本，才是更简单的那个。',
        ),
      },
      changes: [L('+ A list of things you must know before editing', '+ 动手之前必须知道的一串事情')],
      metrics: { psdEdits: 4, psdLoad: lots, psdUnknown: '?' },
      scene: {
        entities: {
          you: you(),
          ...pages(hardCoded),
          card: panel(
            L('Before you edit, you must know', '动手之前，你得知道'),
            [
              L('which pages draw a banner', '哪些页面会画横幅'),
              L('how each one writes the colour', '每个页面是怎么写这个颜色的'),
              L('what else uses the same blue', '还有什么地方用了同一个蓝色'),
              L('# none of it is written down', '# 这些都没有写在任何地方'),
            ],
            'listChecks',
          ),
        },
        links: editLinks(),
        flows: [editAll()],
      },
    },
    {
      short: L('Unknown unknowns', '未知的未知'),
      chapter: 'problem',
      title: L('Symptom 3: unknown unknowns', '症状三：未知的未知'),
      body: [
        L(
          'You change all four and ship. A week later someone notices that Checkout still has a dark blue strip. That page highlights its total in a <b>darker shade of the banner colour</b>, picked by hand long ago.',
          '你把四处都改了，上线。一周后有人发现，结账页上还留着一条深蓝色。那个页面用<b>比横幅深一号的颜色</b>来突出总价，是很久以前有人手工挑的。',
        ),
        L(
          'Nothing in the code linked the two. An <span class="term">unknown unknown</span> means it is not obvious what must be changed, or what you need to know, to do the job. You find out when a bug appears.',
          '代码里没有任何东西把这两者联系起来。<span class="term">未知的未知</span>是指：要完成这件事，必须改哪些地方、必须知道哪些信息，并不明显。等 bug 出现了你才知道。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'This is the worst of the three. Amplification and cognitive load cost time, but at least you know what to do. Here there is something you need to know and no way to find out that it exists.',
          '这是三者中最糟的。修改放大和认知负荷只是费时间，至少你知道该做什么。而这里有一件你必须知道的事，却没有任何办法发现它的存在。',
        ),
      },
      changes: [L('~ 4 pages updated', '~ 4 个页面已更新'), L('− Checkout was missed', '− 漏掉了结账页')],
      metrics: { psdEdits: 5, psdLoad: lots, psdUnknown: hidden },
      scene: {
        entities: {
          you: you(),
          ...pages(() => ({ tags: [tag(NEW, 'green', 'check')] })),
          lost: ghost(CHECKOUT_X, PAGE_Y, 3.4, 28, L('who else?', '还有谁？')),
        },
        links: { ...editLinks(), e_lost: edit('lost', 'you', { style: 'dashed', fail: 1 }) },
        flows: [editAll(), { route: ['e_lost'], kind: 'write', rate: 0.5 }],
      },
    },
    {
      short: L('Two causes', '两个成因'),
      chapter: 'insight',
      title: L('The causes: dependencies and obscurity', '成因：依赖与隐晦'),
      body: [
        L(
          'A <span class="term">dependency</span> exists when a piece of code cannot be understood or changed on its own. All five pages depend on one decision, the banner colour, so touching one means touching the rest.',
          '当一段代码无法单独被理解或修改时，就存在<span class="term">依赖</span>。五个页面都依赖同一个决定：横幅颜色。所以动一个，就得动其余的。',
        ),
        L(
          '<span class="term">Obscurity</span> is when important information is not obvious. The Checkout shade was derived from the banner colour, and nothing said so. Dependencies cause amplification and load; obscurity turns them into unknown unknowns.',
          '<span class="term">隐晦</span>是指重要的信息不明显。结账页的深色是从横幅颜色推出来的，却没有任何地方说明这一点。依赖带来修改放大和认知负荷；隐晦则把它们变成未知的未知。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Dependencies cannot be removed entirely: software is made of parts that use each other. The aim is to have fewer of them, and to make the ones that remain simple and obvious.',
          '依赖不可能彻底消除：软件本来就是由互相使用的部分组成的。目标是让依赖更少，并让剩下的依赖简单而明显。',
        ),
      },
      changes: [L('+ Checkout turns out to depend on the colour too', '+ 原来结账页也依赖这个颜色')],
      metrics: { psdEdits: 5, psdLoad: lots, psdUnknown: hidden },
      scene: {
        entities: {
          you: you(),
          ...pages(() => ({ tags: [tag(L('depends on the colour', '依赖这个颜色'), 'amber', 'network')] })),
          checkout: checkout({ tags: [tag(L('darker shade, picked by hand', '手工挑的深色'), 'red', 'eyeOff')] }),
          card: panel(
            L('Where complexity comes from', '复杂性从哪里来'),
            [
              L('**dependency**   5 pages, 1 decision', '**依赖**   5 个页面，1 个决定'),
              L('**obscurity**    the link is written nowhere', '**隐晦**   这层关系没写在任何地方'),
              L('# dependencies → amplification, load', '# 依赖 → 修改放大、认知负荷'),
              L('# obscurity → unknown unknowns', '# 隐晦 → 未知的未知'),
            ],
            'network',
          ),
        },
        links: { ...editLinks({ style: 'dashed', heads: 'none' }), e_checkout: edit('checkout', 'you', { style: 'dashed', heads: 'none' }) },
        flows: [],
      },
    },
    {
      short: L('Small steps', '一点一点'),
      chapter: 'insight',
      title: L('Complexity is incremental', '复杂性是一点点积累的'),
      body: [
        L(
          'Nobody decided to scatter the colour across five files. The first page typed it in, which was fine. The second copied the first. The darker shade was a five-minute job.',
          '没有人决定要把颜色散落到五个文件里。第一个页面直接写了进去，这没问题。第二个页面照抄了第一个。那个深色只是个五分钟的小活。',
        ),
        L(
          'No single step made the system complex. Hundreds of small ones did, and once they have piled up, no single fix makes much difference. That is why the book argues for <b>zero tolerance</b>: deal with each small bit while it is still small.',
          '没有哪一步单独让系统变复杂，是成百上千个小步骤一起造成的。而一旦堆积起来，任何单独的修补都起不了多大作用。所以书里主张<b>零容忍</b>：趁每一小点还小的时候就处理掉。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Not all complexity costs the same. What counts is how complex a part is multiplied by how much time developers spend in it. A mess in code nobody ever reads or changes costs little.',
          '不是所有复杂性的代价都一样。真正要紧的是：某个部分有多复杂，乘以开发者在它上面花多少时间。没人读也没人改的代码即使乱一点，代价也很小。',
        ),
      },
      changes: [L('~ Every shortcut looked harmless on its own', '~ 每个捷径单独看都没什么大不了')],
      metrics: { psdEdits: 5, psdLoad: lots, psdUnknown: hidden },
      scene: {
        entities: {
          you: you(),
          ...pages((id, i) => ({ heat: 0.25 + i * 0.12, tags: [tag(i === 0 ? L('typed it in', '直接写进去') : L('copied', '照抄'), 'amber', 'file')] })),
          checkout: checkout({ heat: 0.85, tags: [tag(L('a quick special case', '顺手加的特例'), 'red', 'flame')] }),
          card: panel(
            L('“Just this once”', '“就这一次”'),
            [
              L('× 1      nobody notices', '× 1      没人注意'),
              L('× 10     every change takes longer', '× 10     每次修改都变慢'),
              L('! × 100    nobody dares touch it', '! × 100    没人敢动'),
              L('= fix each one while it is small', '= 趁每一处还小就修掉'),
            ],
            'trendingUp',
          ),
        },
        links: { ...editLinks({ style: 'dashed', heads: 'none' }), e_checkout: edit('checkout', 'you', { style: 'dashed', heads: 'none' }) },
        flows: [],
      },
    },
    {
      short: L('One place', '只在一处'),
      chapter: 'solution',
      title: L('The fix: one obvious place', '解法：放在一个显而易见的地方'),
      body: [
        L(
          'Put the decision in one place. A <code>Theme</code> module holds <code>bannerBg</code>, and every page reads it. The darker shade becomes <code>emphasisBg</code>, computed from <code>bannerBg</code> right next to it.',
          '把这个决定放到一个地方。<code>Theme</code> 模块保存 <code>bannerBg</code>，每个页面都去读它。那个深色变成 <code>emphasisBg</code>，就在旁边由 <code>bannerBg</code> 计算出来。',
        ),
        L(
          'Changing the colour is now one edit. The pages still depend on the colour, but through a name anyone can search for, and the relationship between the two shades is written down instead of remembered.',
          '现在改颜色只需要改一处。页面仍然依赖这个颜色，但依赖的是一个谁都能搜到的名字；两种颜色之间的关系也是写下来的，而不是靠人记住。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'The opposite of complex is <b>obvious</b>: a developer can understand the code quickly, guess what to change, and be right.',
          '复杂的反面是<b>显而易见</b>：开发者能很快看懂代码，猜出该改哪里，而且猜得对。',
        ),
      },
      changes: [
        L('+ Theme: bannerBg, emphasisBg', '+ Theme：bannerBg、emphasisBg'),
        L('− Five hard-coded colours', '− 五处写死的颜色'),
        L('~ One edit reaches every page', '~ 改一处，所有页面生效'),
      ],
      metrics: { psdEdits: 1, psdLoad: little, psdUnknown: none },
      scene: fixed(
        panel(
          'Theme',
          [`bannerBg   = ${NEW}`, '= emphasisBg = darken(bannerBg)', L('# pages read both by name', '# 页面按名字读取这两个值')],
          'braces',
        ),
      ),
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<ul class="takeaways">
          <li><b>Complexity</b> is whatever makes a system hard to understand and modify.</li>
          <li>Three symptoms: <b>change amplification</b>, <b>cognitive load</b>, and <b>unknown unknowns</b>, the worst of them.</li>
          <li>Two causes: <b>dependencies</b> and <b>obscurity</b>.</li>
          <li>It is <b>incremental</b>: no single shortcut causes it, so each small one matters.</li>
          <li>The goal is an <b>obvious</b> system, where a quick guess about the code is a correct one.</li>
        </ul>`,
          `<ul class="takeaways">
          <li><b>复杂性</b>是任何让系统难以理解、难以修改的东西。</li>
          <li>三个症状：<b>修改放大</b>、<b>认知负荷</b>，以及最糟的<b>未知的未知</b>。</li>
          <li>两个成因：<b>依赖</b>与<b>隐晦</b>。</li>
          <li>它是<b>一点点积累</b>的：没有哪个捷径单独造成它，所以每个小捷径都要紧。</li>
          <li>目标是一个<b>显而易见</b>的系统：对代码的快速猜测就是正确的猜测。</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>Strategic vs. Tactical Programming</b>. If complexity arrives in small steps, what stops it is a habit, not a clean-up project.',
          '下一课：<b>战略式编程与战术式编程</b>。既然复杂性是一小步一小步来的，能挡住它的是一种习惯，而不是一次大扫除。',
        ),
      },
      metrics: { psdEdits: 1, psdLoad: little, psdUnknown: none },
      scene: fixed(),
    },
  ],
};
