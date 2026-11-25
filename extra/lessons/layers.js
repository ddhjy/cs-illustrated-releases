// Lesson 6 — Layers and Abstractions (A Philosophy of Software Design, ch. 7–8)
//
// Every scene is a stack along +y: whoever calls sits at the front, lower layers sit behind.

import { L, LL, block, crowd, link, panel, path, store, tag } from '../kit.js';

const front = (label, n = 5) => crowd({ x0: -2.6, x1: 2.6, y0: -21, y1: -17 }, n, label);
const layer = (y, o = {}) => block(0, y, { s: 4, h: 40, ...o });
const down = (from, to, o = {}) => link(from, to, { heads: 'both', ...o });

// --- the file system stack (steps 1 and 9) ---
const fileSystem = (card) => ({
  entities: {
    apps: front(L('applications', '应用程序')),
    files: layer(-8, { color: 'blue', glyph: 'file', label: [L('Files', '文件')] }),
    cache: layer(1.5, { color: 'yellow', glyph: 'boxes', label: LL(['Block', 'cache'], ['块', '缓存']) }),
    driver: layer(11, { color: 'purple', glyph: 'cpu', label: LL(['Device', 'driver'], ['设备', '驱动']) }),
    disk: store(0, 20, { label: L('disk', '磁盘') }),
    ...(card ? { card } : {}),
  },
  links: { a: down('apps', 'files'), b: down('files', 'cache'), c: down('cache', 'driver'), d: down('driver', 'disk') },
  flows: [{ route: ['a', 'b', 'c', 'd'], rate: 1.2, bounce: true }],
});

// --- TextDocument in front of TextArea (steps 2 and 3) ---
const area = () => block(0, 5, { s: 4.2, h: 62, color: 'blue', glyph: 'window', label: ['TextArea'] });

// --- the editor's text class (steps 4 and 5) ---
const editor = ({ uiO, textO, card }) => ({
  entities: {
    ui: block(0, -9, { s: 4.2, h: 40, color: 'blue', glyph: 'keyboard', label: LL(['Editor', 'UI'], ['编辑器', '界面']), ...uiO }),
    text: block(0, 2, { s: 4.2, glyph: 'braces', label: LL(['Text', 'class'], ['文本', '类']), ...textO }),
    lines: store(0, 13, { label: L('lines of text', '一行一行的文本'), glyph: 'listOrdered' }),
    ...(card ? { card } : {}),
  },
  links: { u: down('ui', 'text'), t: down('text', 'lines') },
  flows: [{ route: ['u', 't'], kind: 'write', rate: 1.4, bounce: true }],
});

// --- main → m1 → m2 → m3 (steps 6 and 7) ---
const CHAIN = [
  ['main', -14],
  ['m1', -5],
  ['m2', 4],
  ['m3', 13],
];
const chain = ({ passing, extra = {}, links = {}, flows = [], card }) => ({
  entities: {
    ...Object.fromEntries(
      CHAIN.map(([id, y]) => [
        id,
        block(0, y, { s: 3.6, h: 30, glyph: 'braces', label: [id], color: passing && (id === 'm1' || id === 'm2') ? 'orange' : 'blue' }),
      ]),
    ),
    ...extra,
    ...(card ? { card } : {}),
  },
  links: {
    ...Object.fromEntries(
      CHAIN.slice(1).map(([id], i) => [`c_${id}`, link(CHAIN[i][0], id, passing ? { label: 'cert', labelTone: 'amber', labelAt: 0.5 } : {})]),
    ),
    ...links,
  },
  flows: [{ route: ['c_m1', 'c_m2', 'c_m3'], rate: 1.1, kind: passing ? 'heavy' : 'req' }, ...flows],
});

const nothing = L('nothing', '没有');
const own = L('each layer, its own part', '每一层各管各的');

export default {
  id: 'psd-layers',
  title: L('Layers and Abstractions', '分层与抽象'),
  summary: L(
    'Each layer should offer a different abstraction. Spot pass-through methods and variables, and learn why the hard parts belong in the lower layer.',
    '每一层都应该提供不同的抽象。学会识别透传方法和透传变量，并理解为什么难办的部分应该放在下层。',
  ),
  minutes: 11,
  level: 'intermediate',
  metrics: ['psdDup', 'psdBurden'],
  legend: [
    ['req', L('call', '调用')],
    ['res', L('result', '结果')],
    ['heavy', L('call carrying cert', '带着 cert 的调用')],
    ['write', L('edit', '编辑操作')],
  ],
  goals: [
    { text: L('Different layer, different abstraction', '不同的层，不同的抽象'), step: 0 },
    { text: L('Pass-through methods and what to do about them', '透传方法以及该怎么处理'), step: 2 },
    { text: L('Pull complexity downwards', '把复杂性往下拉'), step: 4 },
    { text: L('Pass-through variables and context objects', '透传变量与上下文对象'), step: 6 },
  ],
  steps: [
    {
      short: L('Layers', '分层'),
      chapter: 'setup',
      title: L('Different layer, different abstraction', '不同的层，不同的抽象'),
      body: [
        L(
          'Systems are built in <span class="term">layers</span>: higher layers use what lower layers provide. In a well-designed system, each layer offers a different abstraction from the layers above and below it.',
          '系统是<span class="term">分层</span>构建的：上层使用下层提供的能力。在设计良好的系统里，每一层提供的抽象都和它的上一层、下一层不同。',
        ),
        L(
          'Take a file system. The top layer offers files: arrays of bytes that can be read and written at any offset. Below it, a cache keeps fixed-size disk blocks in memory. At the bottom, device drivers move blocks between memory and the storage device.',
          '以文件系统为例。最上层提供的是文件：可以在任意偏移处读写的字节数组。它的下面，是一个把固定大小的磁盘块保存在内存里的缓存。最底层是设备驱动，负责在内存和存储设备之间搬运数据块。',
        ),
        L('Follow one operation down through the layers and the abstraction changes at every call.', '跟着一次操作一层层往下走，每经过一次调用，抽象都会变一次。'),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Two adjacent layers with similar abstractions are a red flag. One of them is probably not earning its place.',
          '相邻的两层如果抽象相似，就是危险信号。其中一层很可能配不上它占的位置。',
        ),
      },
      metrics: { psdDup: nothing, psdBurden: own },
      scene: fileSystem(
        panel(
          L('What each layer offers', '每一层提供什么'),
          [
            L('**Files**           bytes, at any offset', '**文件**       任意偏移处的字节'),
            L('**Block cache**     fixed-size blocks in memory', '**块缓存**     内存里固定大小的块'),
            L('**Device driver**   blocks to and from the device', '**设备驱动**   在设备与内存间搬运块'),
          ],
          'layers',
        ),
      ),
    },
    {
      short: L('Pass-through', '透传方法'),
      chapter: 'problem',
      title: L('Pass-through methods', '透传方法'),
      body: [
        L(
          'A student’s text editor had a class called <code>TextDocument</code> in front of <code>TextArea</code>. Thirteen of its fifteen public methods did nothing except call the method with the same signature in <code>TextArea</code>.',
          '有位学生的文本编辑器里，在 <code>TextArea</code> 前面放了一个叫 <code>TextDocument</code> 的类。它的 15 个公开方法里有 13 个什么也不做，只是调用 <code>TextArea</code> 里签名相同的方法。',
        ),
        L(
          'A <span class="term">pass-through method</span> makes a class shallower: more interface to learn, no new functionality. It also couples the two classes. Change a signature in <code>TextArea</code> and <code>TextDocument</code> has to change to match.',
          '<span class="term">透传方法</span>让类变得更浅：要学的接口多了，功能却没有增加。它还把两个类耦合在一起。<code>TextArea</code> 里某个签名一改，<code>TextDocument</code> 就得跟着改。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          '<b>Red flag: Pass-Through Method.</b> It usually means that responsibility is not cleanly divided between the classes.',
          '<b>危险信号：透传方法。</b>它通常说明类与类之间的职责划分不清晰。',
        ),
      },
      changes: [L('+ TextDocument: 13 of 15 methods pass straight through', '+ TextDocument：15 个方法里有 13 个只是透传')],
      metrics: { psdDup: L('13 of 15 methods', '15 个方法里的 13 个'), psdBurden: L('two classes for one job', '一件事要两个类') },
      scene: {
        entities: {
          callers: front(L('callers', '调用方')),
          doc: block(0, -6, {
            s: 4.6,
            h: 16,
            color: 'orange',
            glyph: '',
            label: ['TextDocument'],
            pills: 'below',
            tags: [tag(L('13 of 15 pass through', '15 个里 13 个是透传'), 'red', 'flag')],
          }),
          area: area(),
          card: panel(
            L('A pass-through method', '一个透传方法'),
            ['public void insertString(String textToInsert, int offset) {', '    textArea.insertString(textToInsert, offset);', '}', L('! same signature, no new functionality', '! 签名相同，没有任何新功能')],
            'braces',
          ),
        },
        links: { c: down('callers', 'doc'), p: down('doc', 'area') },
        flows: [{ route: ['c', 'p'], rate: 1.5, bounce: true }],
      },
    },
    {
      short: L('One job each', '各司其职'),
      chapter: 'solution',
      title: L('Give each class its own job', '让每个类各司其职'),
      body: [
        L(
          'Ask: exactly which features and abstractions is each class responsible for? Where there are pass-through methods, the answers overlap. The interface to a piece of functionality should be in the class that implements it.',
          '问一问：每个类到底负责哪些功能和抽象？有透传方法的地方，答案总是有重叠的。某项功能的接口，应该放在实现这项功能的那个类里。',
        ),
        L(
          'There are three ways out. Let callers use the lower class directly. Move functionality between the classes so they stop calling each other for it. Or, if they cannot be untangled, merge them.',
          '有三条出路。让调用方直接使用下层的类。在两个类之间重新分配功能，让它们不必再为此互相调用。或者，如果实在分不开，就把它们合并。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Sharing a signature is fine when each method adds something. A <b>dispatcher</b> has the same signature as the methods it calls, and it does real work: it chooses which one runs.',
          '只要每个方法都有所贡献，签名相同并没有问题。<b>分发器</b>和它调用的方法签名相同，但它做了实事：决定由哪个方法来执行。',
        ),
      },
      changes: [L('− TextDocument’s pass-through methods', '− TextDocument 的透传方法'), L('~ Callers use TextArea directly', '~ 调用方直接使用 TextArea')],
      metrics: { psdDup: nothing, psdBurden: L('one class per job', '一件事一个类') },
      scene: {
        entities: {
          callers: front(L('callers', '调用方')),
          area: area(),
          card: panel(
            L('Three ways out', '三条出路'),
            [
              L('expose         callers use the lower class directly', '直接暴露   调用方直接使用下层的类'),
              L('redistribute   move functionality between the two', '重新分配   在两个类之间调整功能'),
              L('merge          one class, if they cannot be untangled', '合并       分不开就合成一个类'),
            ],
            'route',
          ),
        },
        links: { c: down('callers', 'area') },
        flows: [{ route: ['c'], rate: 1.5, bounce: true }],
      },
    },
    {
      short: L('Mirror', '照搬实现'),
      chapter: 'problem',
      title: L('An interface that mirrors the implementation', '照搬实现的接口'),
      body: [
        L(
          'The rule applies inside a single class too: its interface should normally differ from its implementation. In the editor project, most teams stored the text as separate lines. Some designed the API around lines as well, with methods like <code>getLine</code> and <code>putLine</code>.',
          '这条规则在单个类的内部同样适用：类的接口通常应该和它的实现不同。在编辑器项目里，大多数团队把文本按行分开存储。有些团队把 API 也设计成面向行的，提供 <code>getLine</code>、<code>putLine</code> 这样的方法。',
        ),
        L(
          'That made the class easy to write and awkward to use. Typing inserts text in the middle of a line, and deleting a selection can span several lines. The UI code had to split and join lines itself, and that code was duplicated and scattered around the UI.',
          '这让这个类写起来容易，用起来别扭。打字是在一行的中间插入文本，删除选区可能跨好几行。界面代码只好自己去拆分、合并行，而这些代码在界面里到处重复、七零八落。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'When the interface and the implementation use similar abstractions, the class is probably not very deep.',
          '当接口和实现使用相似的抽象时，这个类多半不怎么深。',
        ),
      },
      changes: [L('+ A line-oriented API over line-oriented storage', '+ 面向行的存储之上，是面向行的 API')],
      metrics: { psdDup: L('lines, inside and out', '行：里外都一样'), psdBurden: L('the UI code', '界面代码') },
      scene: editor({
        uiO: { heat: 0.6, pills: 'below', tags: [tag(L('splits and joins lines', '自己拆分、合并行'), 'red', 'alert')] },
        textO: { h: 18, color: 'orange', glyph: '', label: ['getLine', 'putLine'] },
      }),
    },
    {
      short: L('Pull down', '往下拉'),
      chapter: 'solution',
      title: L('Pull complexity downwards', '把复杂性往下拉'),
      body: [
        L(
          'Give the text class a character-oriented interface: insert any string at any position, delete the text between any two positions. Inside, the text is still stored as lines. The splitting and joining now happens inside the class, in one place.',
          '给文本类一个面向字符的接口：在任意位置插入任意字符串，删除任意两个位置之间的文本。在内部，文本依然按行存储。拆分和合并现在发生在类的内部，只在一个地方。',
        ),
        L(
          'The class became harder to write and the system became simpler. Most modules have more users than developers, so it is better for the developers to take the pain. <b>It is more important for a module to have a simple interface than a simple implementation.</b>',
          '这个类变得更难写了，整个系统却变简单了。大多数模块的使用者都比开发者多，所以让开发者来吃这个苦更划算。<b>对一个模块来说，接口简单比实现简单更重要。</b>',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'When you meet unavoidable complexity while building a module, ask who should deal with it: you, once, or every user of the module.',
          '开发模块时遇到躲不开的复杂性，问一问该由谁来处理：是你处理一次，还是模块的每个使用者各处理一次。',
        ),
      },
      changes: [L('~ The API works on characters and positions', '~ API 改为面向字符和位置'), L('~ Line splitting and joining moves into the text class', '~ 行的拆分与合并搬进了文本类')],
      metrics: { psdDup: nothing, psdBurden: L('the text class', '文本类') },
      scene: editor({
        uiO: {},
        textO: { h: 72, color: 'green', glyph: 'braces', label: LL(['Text', 'class'], ['文本', '类']), tags: [tag('insert · delete', 'green', 'check')] },
        card: panel(
          L('Now inside the text class', '现在在文本类内部'),
          [
            L('split a line when the new text has a newline', '插入的文本带换行时，拆分行'),
            L('join lines when a deletion spans them', '删除跨行时，合并行'),
            L('= written once, hidden from every caller', '= 只写一次，对所有调用方隐藏'),
          ],
          'eyeOff',
        ),
      }),
    },
    {
      short: L('Pass-through data', '透传变量'),
      chapter: 'problem',
      title: L('Pass-through variables', '透传变量'),
      body: [
        L(
          'Duplication across layers happens with data too. In a datacenter service, a command-line argument names the certificates to use for secure communication. Only one low-level method, <code>m3</code>, needs them, to open a socket. Yet <code>cert</code> is handed down through every method on the way from <code>main</code>.',
          '跨层的重复同样会发生在数据上。在一个数据中心服务里，有个命令行参数指定了安全通信要用的证书。只有一个底层方法 <code>m3</code> 在打开套接字时需要它。可是 <code>cert</code> 却从 <code>main</code> 开始，沿途经过的每个方法都要往下传。',
        ),
        L(
          '<code>m1</code> and <code>m2</code> have no use for it and still have to know about it. Add another variable like this later, and every signature on the path changes again.',
          '<code>m1</code> 和 <code>m2</code> 根本用不到它，却不得不知道它的存在。以后再加一个这样的变量，这条路径上的每个签名又得改一遍。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'A pass-through variable forces every method in between to be aware of something it does not use.',
          '透传变量迫使中间的每个方法都要知道一个它根本不用的东西。',
        ),
      },
      changes: [L('+ cert in the signatures of m1, m2 and m3', '+ cert 出现在 m1、m2、m3 的签名里')],
      metrics: { psdDup: L('cert, in every signature', 'cert：每个签名里都有'), psdBurden: L('every method on the path', '路径上的每个方法') },
      scene: chain({
        passing: true,
        card: panel(L('Who uses cert?', '谁在用 cert？'), [L('main   reads it from the command line', 'main   从命令行读到它'), L('! m1     passes it on', '! m1     只是往下传'), L('! m2     passes it on', '! m2     只是往下传'), L('m3     opens the socket with it', 'm3     用它打开套接字')], 'key'),
      }),
    },
    {
      short: L('Context', '上下文'),
      chapter: 'solution',
      title: L('A context object', '上下文对象'),
      body: [
        L(
          'The fix the author uses most often is a <span class="term">context</span> object: one object per instance of the system that holds its global state, such as configuration options, shared subsystems and performance counters. <code>main</code> stores the certificate there and <code>m3</code> reads it.',
          '作者最常用的办法是<span class="term">上下文</span>对象：系统的每个实例有一个，里面保存它的全局状态，比如配置项、共享的子系统、性能计数器。<code>main</code> 把证书存进去，<code>m3</code> 从里面读出来。',
        ),
        L(
          'The system’s major objects keep a reference to the context, so it shows up as an explicit argument only in constructors. A new variable goes into the context without touching any method in between.',
          '系统里的主要对象各自保存一个指向上下文的引用，所以它只会作为显式参数出现在构造函数里。新增一个变量，只需放进上下文，中间的方法一个都不用动。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Contexts are far from ideal. They share most drawbacks of global variables and can grow into a grab-bag of data. Keeping what is in them immutable avoids the worst problems. The author has not found a better solution.',
          '上下文远谈不上理想。它有全局变量的大部分缺点，还可能膨胀成一个什么都往里塞的大杂烩。让里面的内容保持不可变，可以避开最严重的问题。作者也没有找到更好的办法。',
        ),
      },
      changes: [L('− The cert parameter of m1, m2 and m3', '− m1、m2、m3 的 cert 参数'), L('+ A context object holds system-wide state', '+ 用上下文对象保存系统级的状态')],
      metrics: { psdDup: nothing, psdBurden: L('main and m3 only', '只有 main 和 m3') },
      scene: chain({
        passing: false,
        extra: { ctx: store(9, 0, { label: L('context', '上下文'), glyph: 'key' }) },
        links: {
          put: path('main', 'ctx', ['main', ['ctx', 'main'], 'ctx'], { style: 'dashed', label: L('stores cert', '存入 cert'), labelAt: 0.4 }),
          get: path('ctx', 'm3', ['ctx', ['ctx', 'm3'], 'm3'], { style: 'dashed', label: L('reads cert', '读取 cert'), labelAt: 0.6 }),
        },
        flows: [{ route: ['put', 'get'], kind: 'heavy', rate: 0.6 }],
        card: panel(
          L('In the context', '上下文里有什么'),
          ['cert', L('timeout value', '超时时间'), L('performance counters', '性能计数器'), L('# one per instance of the system', '# 系统的每个实例一个')],
          'key',
        ),
      }),
    },
    {
      short: L('Settings', '配置参数'),
      chapter: 'tradeoff',
      title: L('Configuration parameters push complexity up', '配置参数是把复杂性往上推'),
      body: [
        L(
          'A configuration parameter moves complexity the other way: up, to every user. A network protocol has to resend a request when no response arrives in time. How long should it wait? The easy answer is to add a setting for the retry interval.',
          '配置参数是把复杂性往相反的方向移：往上，推给每一个使用者。网络协议在没有及时收到响应时必须重发请求。该等多久呢？省事的做法是加一个“重试间隔”的配置项。',
        ),
        L(
          'But the protocol can measure how long successful requests take and use a multiple of that. Users no longer have to guess, and the value adapts when conditions change. Before exporting a parameter, ask: <em>will users be able to determine a better value than we can determine here?</em>',
          '但协议完全可以测量成功请求的响应时间，再取它的若干倍。使用者不必再去猜，运行状况变了，这个值也会跟着调整。在导出一个参数之前，问一问：<em>使用者能确定出一个比我们在这里确定的更好的值吗？</em>',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Do not overdo it. Pull complexity down when it is closely related to what the class already does, when it simplifies code elsewhere, and when it simplifies the interface. A <code>backspace</code> method in the text class met none of these: it only leaked UI knowledge downwards.',
          '也别做过头。只有当这份复杂性和类已有的功能密切相关、能简化别处的代码、并且能简化接口时，才把它往下拉。文本类里的 <code>backspace</code> 方法一条也不符合：它只是把界面的知识泄漏到了下层。',
        ),
      },
      changes: [L('− A retry-interval setting', '− “重试间隔”配置项'), L('+ The protocol measures and decides', '+ 协议自己测量、自己决定')],
      metrics: { psdDup: nothing, psdBurden: L('the protocol itself', '协议自己') },
      scene: {
        entities: {
          admins: front(L('administrators', '管理员'), 4),
          proto: block(0, -4, {
            s: 4.2,
            h: 64,
            color: 'green',
            glyph: 'network',
            label: LL(['Network', 'protocol'], ['网络', '协议']),
            tags: [tag(L('retry interval: measured', '重试间隔：自己测出来'), 'green', 'timer')],
          }),
          peer: block(0, 9, { s: 4, h: 34, color: 'blue', glyph: 'server', label: [L('Server', '服务器')] }),
          card: panel(
            L('Who picks the retry interval?', '重试间隔由谁来定？'),
            [
              L('! a setting: every administrator has to guess', '! 做成配置：每个管理员都得去猜'),
              L('= measure successful requests, use a multiple', '= 测量成功的请求，取其若干倍'),
              L('= adapts when conditions change', '= 运行状况变了会自动调整'),
            ],
            'timer',
          ),
        },
        links: {
          cfg: link('admins', 'proto', { style: 'dashed', heads: 'none', label: L('nothing to set', '什么都不用配'), labelTone: 'green', labelAt: 0.5 }),
          rq: link('proto', 'peer', { heads: 'both', fail: 0.25 }),
        },
        flows: [{ route: ['rq'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<ul class="takeaways">
          <li>Each layer should provide a <b>different abstraction</b> from its neighbours.</li>
          <li><b>Pass-through methods</b> and <b>pass-through variables</b> add interface without adding functionality.</li>
          <li>Give each class a distinct job: expose the lower class, redistribute, or merge.</li>
          <li>A class’s interface should differ from its implementation.</li>
          <li><b>Pull complexity downwards</b>: a simple interface matters more than a simple implementation.</li>
          <li>Avoid configuration parameters when the module can work out a good value itself.</li>
        </ul>`,
          `<ul class="takeaways">
          <li>每一层都应该提供与相邻层<b>不同的抽象</b>。</li>
          <li><b>透传方法</b>和<b>透传变量</b>只增加接口，不增加功能。</li>
          <li>让每个类各司其职：直接暴露下层的类、重新分配功能，或者合并。</li>
          <li>类的接口应该和它的实现不同。</li>
          <li><b>把复杂性往下拉</b>：接口简单比实现简单更重要。</li>
          <li>模块自己能算出合适的值时，就不要做成配置参数。</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>Errors and Special Cases</b>. Exception handling is one of the worst sources of complexity. The best way to handle exceptions is to have fewer of them.',
          '下一课：<b>错误与特殊情况</b>。异常处理是复杂性最糟糕的来源之一。处理异常的最好办法，是让异常变少。',
        ),
      },
      metrics: { psdDup: nothing, psdBurden: own },
      scene: fileSystem(),
    },
  ],
};
