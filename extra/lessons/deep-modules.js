// Lesson 3 — Modules Should Be Deep (A Philosophy of Software Design, ch. 4)
//
// The drawing convention for this lesson: a block's footprint is its interface (what callers
// must learn) and its height is the functionality behind it. Deep = narrow and tall.

import { L, LL, block, crowd, link, panel, path, store, tag } from '../kit.js';


const callers = (label = L('callers', '调用方')) => crowd({ x0: -2.6, x1: 2.6, y0: -18, y1: -14 }, 5, label);
const mod = (o = {}) => block(0, 0, { s: 5, h: 60, glyph: 'box', label: [L('Module', '模块')], ...o });
const call = (to, o = {}) => link('callers', to, { heads: 'both', ...o });
const fork = (to, o = {}) => path('callers', to, ['callers', ['callers', -9], [to, -9], to], { heads: 'both', ...o });

const one = (o = {}, card) => ({
  entities: { callers: callers(), mod: mod(o), ...(card ? { card } : {}) },
  links: { c: call('mod') },
  flows: [{ route: ['c'], rate: 1.6, bounce: true }],
});

const deep = (o = {}) => block(-7, 0, { s: 3.2, h: 112, color: 'green', glyph: 'layers', label: [L('Deep', '深')], ...o });
const shallow = (o = {}) => block(7, 0, { s: 7.6, h: 13, color: 'orange', glyph: 'layers', label: [L('Shallow', '浅')], ...o });
const pair = (card) => ({
  entities: {
    callers: callers(),
    deep: deep({ tags: [tag(L('small interface', '接口小'), 'green', 'check')] }),
    shallow: shallow({ tags: [tag(L('large interface', '接口大'), 'red', 'alert')] }),
    ...(card ? { card } : {}),
  },
  links: { cd: fork('deep'), cs: fork('shallow') },
  flows: [{ routes: [{ path: ['cd'] }, { path: ['cs'] }], rate: 1.8, bounce: true }],
});

const stream = (y, name, o = {}) => block(0, y, { s: 4, h: 22, color: 'yellow', glyph: '', label: [name, 'InputStream'], ...o });
const file = (y) => store(0, y, { label: L('file', '文件'), glyph: 'file' });

const five = L('5 calls', '5 个调用');
const three = L('3 classes to wire up', '要组装 3 个类');
const lot = L('a great deal', '非常多');
const nothing = L('almost nothing', '几乎没有');
const isDeep = L('deep', '深');
const isShallow = L('shallow', '浅');

export default {
  id: 'psd-deep-modules',
  title: L('Modules Should Be Deep', '模块应该是深的'),
  summary: L(
    'An interface is a cost and the functionality behind it is the benefit. The best modules hide a lot behind very little.',
    '接口是成本，接口背后的功能是收益。最好的模块用很小的接口，藏住了很多东西。',
  ),
  minutes: 9,
  level: 'beginner',
  metrics: ['psdIface', 'psdInside', 'psdDepth'],
  legend: [
    ['req', L('call', '调用')],
    ['res', L('result', '结果')],
  ],
  goals: [
    { text: L('Interface and implementation: the two halves of a module', '接口与实现：模块的两半'), step: 0 },
    { text: L('What makes a module deep or shallow', '模块的深与浅由什么决定'), step: 2 },
    { text: L('How to spot a shallow module, and classitis', '如何认出浅模块和“类泛滥”'), step: 4 },
    { text: L('Designing for the common case', '为常见情况而设计'), step: 6 },
  ],
  steps: [
    {
      short: L('Two halves', '两半'),
      chapter: 'setup',
      title: L('A module is an interface plus an implementation', '模块 = 接口 + 实现'),
      body: [
        L(
          'A <span class="term">module</span> is any unit of code with a boundary: a class, a function, a service. Its <span class="term">interface</span> is everything another developer must know to use it. Its <span class="term">implementation</span> is the code that keeps the promises the interface makes.',
          '<span class="term">模块</span>是任何有边界的代码单元：类、函数、服务。它的<span class="term">接口</span>是别的开发者要使用它所必须知道的一切。它的<span class="term">实现</span>是兑现接口承诺的那些代码。',
        ),
        L(
          'The interface is more than signatures. The formal part is names, parameters and types. The informal part is behaviour a compiler cannot check: what the call does, its side effects, the order calls must happen in.',
          '接口不只是函数签名。正式的部分是名字、参数和类型。非正式的部分是编译器检查不了的行为：这个调用做了什么、有什么副作用、各个调用必须按什么顺序进行。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'A developer working on one module should need to understand its interface and implementation, plus only the <em>interfaces</em> of the others.',
          '在某个模块上工作的开发者，应该只需要理解它的接口和实现，再加上其他模块的<em>接口</em>。',
        ),
      },
      metrics: { psdIface: '—', psdInside: '—', psdDepth: '—' },
      scene: one(
        {},
        panel(
          L('Two halves', '两半'),
          [
            L('**interface**        what it does · everyone sees it', '**接口**   它做什么 · 所有人都看得到'),
            L('**implementation**   how it does it · hidden', '**实现**   它怎么做 · 藏在里面'),
          ],
          'split',
        ),
      ),
    },
    {
      short: L('Abstraction', '抽象'),
      chapter: 'technique',
      title: L('An abstraction leaves things out', '抽象就是省略'),
      body: [
        L(
          'An <span class="term">abstraction</span> is a simplified view of something that omits unimportant details. A module’s interface is an abstraction of the module. The more details it can safely leave out, the less there is for callers to learn.',
          '<span class="term">抽象</span>是对某个东西的简化视图，它省略了不重要的细节。模块的接口就是这个模块的抽象。它能安全省略的细节越多，调用方要学的就越少。',
        ),
        L(
          'It can go wrong in two directions. Keep a detail nobody needs, and every caller carries extra weight. Leave out one that matters, and the abstraction is <b>false</b>: it looks simple and it isn’t. A file system can hide which disk blocks hold a file. It cannot hide <em>when</em> data reaches the disk, because a database needs to know.',
          '它可能朝两个方向出错。留下一个没人需要的细节，每个调用方都要多背一份负担。漏掉一个要紧的细节，这个抽象就是<b>假</b>的：看起来简单，其实不是。文件系统可以隐藏一个文件占用了哪些磁盘块；却不能隐藏数据<em>何时</em>真正落盘，因为数据库需要知道这一点。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          '“Unimportant” is the key word. Designing an abstraction is deciding what the users of a module really need to know.',
          '“不重要”是关键词。设计抽象，就是在判断模块的使用者真正需要知道什么。',
        ),
      },
      changes: [L('+ The interface as a simplified view', '+ 接口是一个简化的视图')],
      metrics: { psdIface: '—', psdInside: '—', psdDepth: '—' },
      scene: one(
        { tags: [tag(L('what callers see', '调用方看到的'), 'paper', 'eye')] },
        panel(
          L('What to leave out', '该省略什么'),
          [
            L('keep   what callers need in order to use it', '保留   调用方使用它所需要的'),
            L('drop   everything else', '省略   其余的一切'),
            L('! keep too much: more for everyone to learn', '! 留得太多：所有人都要多学'),
            L('! drop too much: a false abstraction', '! 省得太多：假抽象'),
          ],
          'filter',
        ),
      ),
    },
    {
      short: L('Deep or shallow', '深与浅'),
      chapter: 'insight',
      title: L('Deep modules and shallow modules', '深模块与浅模块'),
      body: [
        L(
          'Think of a module as a block. Its footprint is the interface, which is a <b>cost</b>: every caller has to learn it. Its height is the functionality behind the interface, which is the <b>benefit</b>.',
          '把模块想象成一个方块。它的占地面积是接口，这是<b>成本</b>：每个调用方都得学会它。它的高度是接口背后的功能，这是<b>收益</b>。',
        ),
        L(
          'A <span class="term">deep</span> module is narrow and tall: lots of functionality behind a small interface. A <span class="term">shallow</span> module is wide and flat: its interface is nearly as complicated as what it does, so it hides almost nothing.',
          '<span class="term">深</span>模块又窄又高：很小的接口背后是大量功能。<span class="term">浅</span>模块又宽又扁：它的接口几乎和它做的事情一样复杂，所以几乎什么也没藏住。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Depth is a way to compare cost with benefit. The best modules give the most functionality for the least interface.',
          '深度是一种比较成本与收益的方式。最好的模块用最少的接口提供最多的功能。',
        ),
      },
      changes: [L('+ Footprint = interface · height = functionality', '+ 占地 = 接口 · 高度 = 功能')],
      metrics: { psdIface: '—', psdInside: '—', psdDepth: '—' },
      scene: pair(
        panel(
          L('Reading the blocks', '怎么看这些方块'),
          [
            L('footprint   interface · the cost', '占地   接口 · 成本'),
            L('height      functionality · the benefit', '高度   功能 · 收益'),
            L('= deep: large benefit, small cost', '= 深：收益大，成本小'),
          ],
          'layers',
        ),
      ),
    },
    {
      short: L('Unix file I/O', 'Unix 文件 I/O'),
      chapter: 'technique',
      title: L('A deep module: Unix file I/O', '深模块：Unix 文件 I/O'),
      body: [
        L(
          'Unix gives programs five basic calls for files: <code>open</code>, <code>read</code>, <code>write</code>, <code>lseek</code> and <code>close</code>. Each takes a handful of arguments.',
          'Unix 给程序提供了五个基本的文件调用：<code>open</code>、<code>read</code>、<code>write</code>、<code>lseek</code> 和 <code>close</code>。每个调用只有寥寥几个参数。',
        ),
        L(
          'Behind them sit hundreds of thousands of lines: how files map to disk blocks, directories and path lookup, permissions, caching, device drivers, concurrent access. The implementation has been rewritten many times. The five calls stayed the same, so programs kept working.',
          '它们背后是几十万行代码：文件如何映射到磁盘块、目录和路径查找、权限、缓存、设备驱动、并发访问。这套实现被重写过很多次，而这五个调用始终不变，所以程序一直能正常运行。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'A garbage collector is deeper still. It has no interface at all: it works behind the scenes and removes a whole class of work from every program.',
          '垃圾回收器还要更深。它完全没有接口：在幕后工作，从每个程序里拿走了一整类工作。',
        ),
      },
      changes: [L('+ File I/O: 5 calls in front of an entire file system', '+ 文件 I/O：5 个调用挡在整个文件系统前面')],
      metrics: { psdIface: five, psdInside: lot, psdDepth: isDeep },
      scene: {
        entities: {
          callers: callers(L('programs', '程序')),
          io: block(0, 0, {
            s: 3.4,
            h: 118,
            color: 'green',
            glyph: 'file',
            label: LL(['File', 'I/O'], ['文件', 'I/O']),
            tags: [tag('open · read · write · lseek · close', 'green', 'braces')],
          }),
          disk: store(0, 10, { label: L('disk', '磁盘') }),
          card: panel(
            L('Hidden behind five calls', '藏在五个调用背后'),
            [
              L('files → blocks on disk', '文件 → 磁盘块'),
              L('directories and path lookup', '目录与路径查找'),
              L('permissions', '权限'),
              L('caching', '缓存'),
              L('device drivers', '设备驱动'),
              L('# hundreds of thousands of lines', '# 几十万行代码'),
            ],
            'eyeOff',
          ),
        },
        links: { c: call('io'), d: link('io', 'disk', { heads: 'both' }) },
        flows: [{ route: ['c', 'd'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: L('A shallow method', '一个浅方法'),
      chapter: 'problem',
      title: L('A shallow module hides nothing', '浅模块什么也没藏住'),
      body: [
        L(
          'This method stores <code>null</code> for an attribute. It is one line long. To call it you must know its name, its argument, and that it writes into <code>data</code>, which is everything there is to know about it.',
          '这个方法给某个属性存入 <code>null</code>。它只有一行。要调用它，你得知道它的名字、它的参数，以及它会写入 <code>data</code>——而这就是关于它的全部了。',
        ),
        L(
          'It adds an interface to learn and removes nothing. Calling <code>data.put(attribute, null)</code> directly would be just as clear. Small is not the goal: a small module with a large interface relative to what it does is a net cost.',
          '它增加了一个要学的接口，却没有省掉任何东西。直接调用 <code>data.put(attribute, null)</code> 同样清楚。“小”不是目标：一个模块如果相对于它做的事来说接口很大，那它就是净成本。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          '<b>Red flag: Shallow Module.</b> If the interface is not much simpler than the implementation, the module is not paying for itself.',
          '<b>危险信号：浅模块。</b>如果接口并不比实现简单多少，这个模块就不值它的成本。',
        ),
      },
      changes: [L('+ A one-line method with its own interface', '+ 一个只有一行、却自带接口的方法')],
      metrics: { psdIface: L('as much as the code', '和代码一样多'), psdInside: nothing, psdDepth: isShallow },
      scene: {
        entities: {
          callers: callers(),
          wrap: block(0, 0, {
            s: 7.2,
            h: 12,
            color: 'orange',
            glyph: 'braces',
            label: ['addNullValue', 'ForAttribute'],
            tags: [tag(L('shallow module', '浅模块'), 'red', 'flag')],
          }),
          data: store(0, 11, { label: 'data' }),
          card: panel(
            L('The whole method', '整个方法'),
            ['void addNullValueForAttribute(String attribute) {', '    data.put(attribute, null);', '}', L('! nothing is hidden', '! 什么也没藏住')],
            'braces',
          ),
        },
        links: { c: call('wrap'), d: link('wrap', 'data', { heads: 'both' }) },
        flows: [{ route: ['c', 'd'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: L('Classitis', '类泛滥'),
      chapter: 'problem',
      title: L('Classitis: many small classes', '类泛滥：一大堆小类'),
      body: [
        L(
          '“Classes should be small” is common advice. Taken to the extreme it produces <span class="term">classitis</span>: many classes, each simple by itself, that together are a lot to learn.',
          '“类应该小”是很常见的建议。把它推到极端，就会得到<span class="term">类泛滥</span>：一大堆类，每个单看都很简单，合起来却要学很多。',
        ),
        L(
          'In Java, reading serialized objects from a file takes three objects: a <code>FileInputStream</code>, wrapped in a <code>BufferedInputStream</code>, wrapped in an <code>ObjectInputStream</code>. Buffering is its own class. Forget that line and the code still works, only slowly.',
          '在 Java 里，从文件读取序列化对象要用三个对象：一个 <code>FileInputStream</code>，外面包一个 <code>BufferedInputStream</code>，再包一个 <code>ObjectInputStream</code>。缓冲是一个单独的类。忘了那一行，代码照样能跑，只是很慢。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Each class is shallow, so the complexity did not go away. It moved into the wiring, which every caller now has to write and get right.',
          '每个类都很浅，所以复杂性并没有消失。它转移到了“组装”里，现在每个调用方都得自己写，而且得写对。',
        ),
      },
      changes: [L('+ Three classes to read one file', '+ 读一个文件要三个类'), L('~ Buffering is opt-in', '~ 缓冲要自己加')],
      metrics: { psdIface: three, psdInside: L('a little each', '每个一点点'), psdDepth: isShallow },
      scene: {
        entities: {
          callers: callers(),
          ois: stream(-7, 'Object'),
          bis: stream(2, 'Buffered', { tags: [tag(L('easy to forget', '很容易忘'), 'amber', 'alert')] }),
          fis: stream(11, 'File'),
          file: file(20),
          card: panel(
            L('What every caller writes', '每个调用方都要写的'),
            [
              'new ObjectInputStream(',
              '  new BufferedInputStream(',
              '    new FileInputStream(fileName)));',
              L('! drop the middle line: slow, and no warning', '! 少了中间那行：变慢，而且没有任何提示'),
            ],
            'braces',
          ),
        },
        links: {
          c: call('ois'),
          ob: link('ois', 'bis', { heads: 'both' }),
          bf: link('bis', 'fis', { heads: 'both' }),
          ff: link('fis', 'file', { heads: 'both' }),
        },
        flows: [{ route: ['c', 'ob', 'bf', 'ff'], rate: 1.3, bounce: true }],
      },
    },
    {
      short: L('Common case', '常见情况'),
      chapter: 'solution',
      title: L('Make the common case simple', '让常见情况变简单'),
      body: [
        L(
          'Almost everyone who reads a file wants buffering. So it should be there by default, and the few who do not want it can turn it off. Interfaces should be designed so that the <b>common case is as simple as possible</b>.',
          '几乎所有读文件的人都想要缓冲。所以它应该默认就有，少数不需要的人可以把它关掉。接口的设计应该让<b>常见情况尽可能简单</b>。',
        ),
        L(
          'Unix does this. Reading a file from start to end needs nothing but <code>read</code>. Random access is possible, through <code>lseek</code>, and only the programs that need it ever learn that call.',
          'Unix 就是这么做的。从头到尾读一个文件，只需要 <code>read</code>。随机访问也可以做到，通过 <code>lseek</code>，而只有需要它的程序才会去了解这个调用。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'An interface can have many features and still be simple, as long as the ones most callers need are easy and the rest stay out of the way.',
          '接口可以有很多功能而依然简单，只要大多数调用方需要的那些用起来容易，其余的不挡路。',
        ),
      },
      changes: [L('− Three classes to assemble', '− 要组装的三个类'), L('+ One deep class, buffering on by default', '+ 一个深的类，默认带缓冲')],
      metrics: { psdIface: L('1 call', '1 个调用'), psdInside: lot, psdDepth: isDeep },
      scene: {
        entities: {
          callers: callers(),
          bis: block(0, 3, {
            s: 3.6,
            h: 104,
            color: 'green',
            glyph: 'file',
            label: LL(['File', 'reader'], ['文件', '读取器']),
            tags: [tag(L('buffering: on by default', '缓冲：默认开启'), 'green', 'check')],
          }),
          file: file(20),
          card: panel(
            L('Designing the interface', '设计接口'),
            [
              L('common case    nothing to choose', '常见情况   不需要做任何选择'),
              L('special case   an option, when you need it', '特殊情况   需要时才用的选项'),
              L('# Unix: sequential by default, lseek for the rest', '# Unix：默认顺序读写，其余用 lseek'),
            ],
            'target',
          ),
        },
        links: { c: call('bis'), ff: link('bis', 'file', { heads: 'both' }) },
        flows: [{ route: ['c', 'ff'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<ul class="takeaways">
          <li>A module is an <b>interface</b> (what callers must know) plus an <b>implementation</b> (how it works).</li>
          <li>An interface is an <b>abstraction</b>: it should omit every detail callers do not need, and none that they do.</li>
          <li><b>Deep</b> modules hide a lot of functionality behind a small interface. <b>Shallow</b> ones add an interface and hide little.</li>
          <li>Small classes are not a goal. Too many of them is <b>classitis</b>.</li>
          <li>Design interfaces so the <b>common case is simple</b>.</li>
        </ul>`,
          `<ul class="takeaways">
          <li>模块 = <b>接口</b>（调用方必须知道的）+ <b>实现</b>（它如何工作）。</li>
          <li>接口是一种<b>抽象</b>：调用方不需要的细节都应省略，需要的一个也不能少。</li>
          <li><b>深</b>模块用很小的接口藏住大量功能。<b>浅</b>模块多出一个接口，却没藏住什么。</li>
          <li>类小不是目标。小类太多就是<b>类泛滥</b>。</li>
          <li>设计接口时，要让<b>常见情况变简单</b>。</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>Information Hiding</b>. Depth comes from what a module keeps to itself. The next lesson looks at how knowledge leaks out, and how to keep it in.',
          '下一课：<b>信息隐藏</b>。深度来自模块自己保守的那些东西。下一课看看知识是怎么泄漏出去的，又该怎么把它留在里面。',
        ),
      },
      metrics: { psdIface: '—', psdInside: '—', psdDepth: '—' },
      scene: pair(),
    },
  ],
};
