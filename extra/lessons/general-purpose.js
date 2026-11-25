// Lesson 5 — General-Purpose Modules Are Deeper (A Philosophy of Software Design, ch. 6)
//
// The book's editor example: UI features in the front row, the text class's methods behind them,
// the text itself at the back. One link per (feature, method) pair makes the coupling visible.

import { L, LL, block, ghost, link, panel, path, store, tag, zone } from '../kit.js';

const UI_Y = -12;
const API_Y = 0;
const TEXT_Y = 11;
const BEND = -5.8;
const NEW_X = 18;

const FEATURES = [
  ['back', -9, 'keyboard', LL(['Backspace', 'key'], ['退格', '键'])],
  ['del', 0, 'keyboard', LL(['Delete', 'key'], ['删除', '键'])],
  ['sel', 9, 'scan', LL(['Delete', 'selection'], ['删除', '选区'])],
];

const feature = (x, glyph, label, o = {}) => block(x, UI_Y, { s: 3.4, h: 42, color: 'blue', glyph, label, ...o });
const features = (over = {}) => Object.fromEntries(FEATURES.map(([id, x, glyph, label]) => [`f_${id}`, feature(x, glyph, label, over[id])]));
const newFeature = () => feature(NEW_X, 'sparkles', LL(['New', 'feature'], ['新', '功能']), { color: 'purple' });
const tool = () => feature(NEW_X, 'search', LL(['Find and', 'replace'], ['查找', '替换']), { color: 'purple', pills: 'below', tags: [tag(L('a different program', '另一个程序'), 'violet', 'package')] });

const uiZone = (x1 = 13) => zone({ x0: -15, x1, y0: UI_Y - 3.8, y1: UI_Y + 3.8 }, L('Editor UI', '编辑器界面'));
const textZone = (x0 = -15, x1 = 13) => zone({ x0, x1, y0: API_Y - 3.8, y1: API_Y + 3.8 }, L('Text class', '文本类'));
const text = () => store(0, TEXT_Y, { label: L('text of the file', '文件的文本'), glyph: 'file' });

// No glyph: a flat block only has room for the two-line signature.
const method = (x, label, o = {}) => block(x, API_Y, { s: 4.4, h: 18, color: 'orange', glyph: '', label, ...o });
const general = (o = {}) => block(0, API_Y, { s: 4, h: 46, color: 'green', glyph: 'braces', label: ['delete', '(start, end)'], ...o });

const toText = (id) => (id === 'del' ? link('m_del', 'text') : path(`m_${id}`, 'text', [`m_${id}`, [`m_${id}`, 'text'], 'text']));
const toGeneral = (from) => (from === 'f_del' ? link(from, 'm_del') : path(from, 'm_del', [from, [from, BEND], ['m_del', BEND], 'm_del']));

// One method per UI feature.
const special = ({ extra = {}, links = {}, wide = false, card } = {}) => ({
  entities: {
    ui: uiZone(wide ? 22 : 13),
    tz: textZone(-15, wide ? 22 : 13),
    ...features(),
    m_back: method(-9, ['backspace', '(Cursor)']),
    m_del: method(0, ['delete', '(Cursor)']),
    m_sel: method(9, ['deleteSelection', '(Selection)'], { s: 3.8 }),
    text: text(),
    ...extra,
    ...(card ? { card } : {}),
  },
  links: {
    ...Object.fromEntries(FEATURES.flatMap(([id]) => [[`c_${id}`, link(`f_${id}`, `m_${id}`)], [`t_${id}`, toText(id)]])),
    ...links,
  },
  flows: [{ routes: FEATURES.map(([id]) => ({ path: [`c_${id}`, `t_${id}`] })), kind: 'write', rate: 1.6 }],
});

// Every feature composes the same few general methods.
const shared = ({ extra = {}, more = [], methodO, over, rate = 1.6, wide = false, card } = {}) => {
  const users = [...FEATURES.map(([id]) => `f_${id}`), ...more];
  return {
    entities: {
      ui: uiZone(wide ? 22 : 13),
      tz: textZone(-7.5, 5.5),
      ...features(over),
      m_del: general(methodO),
      text: text(),
      ...extra,
      ...(card ? { card } : {}),
    },
    links: { ...Object.fromEntries(users.map((id) => [`c_${id}`, toGeneral(id)])), t_del: link('m_del', 'text') },
    flows: [{ routes: users.map((id) => ({ path: [`c_${id}`, 't_del'] })), kind: 'write', rate }],
  };
};

const none = L('none', '没有');
const uiIdeas = L('cursor, selection, keys', '光标、选区、按键');
const newMethod = L('a new text method', '文本类加新方法');
const noChange = L('no change to the text class', '文本类不用改');
const aLoop = L('a loop in the UI', '界面里写循环');

const good = { psdDelMethods: 1, psdUiLeak: none, psdNewFeature: noChange };

const api = () =>
  panel(
    L('The text class API', '文本类的 API'),
    ['void insert(Position position, String newText);', 'void delete(Position start, Position end);', 'Position changePosition(Position position, int numChars);'],
    'braces',
  );

export default {
  id: 'psd-general-purpose',
  title: L('General-Purpose Modules Are Deeper', '通用模块更深'),
  summary: L(
    'Should a class fit today’s feature exactly, or serve many? A text editor shows why a somewhat general-purpose interface is simpler and deeper.',
    '一个类应该严丝合缝地贴合今天的功能，还是能服务于多种用途？用一个文本编辑器来看看，为什么“有点通用”的接口更简单、也更深。',
  ),
  minutes: 10,
  level: 'intermediate',
  metrics: ['psdDelMethods', 'psdUiLeak', 'psdNewFeature'],
  legend: [['write', L('edit', '编辑操作')]],
  goals: [
    { text: L('What a special-purpose interface costs', '专用接口的代价'), step: 2 },
    { text: L('What “somewhat general-purpose” means', '“有点通用”是什么意思'), step: 3 },
    { text: L('Why explicit code can beat a hidden detail', '为什么写明白的代码好过被藏起来的细节'), step: 4 },
    { text: L('Three questions for finding the balance', '找到平衡点的三个问题'), step: 7 },
  ],
  steps: [
    {
      short: L('The choice', '选择'),
      chapter: 'setup',
      title: L('How general should a module be?', '模块应该做得多通用？'),
      body: [
        L(
          'Every new module comes with a choice. Build it <b>special-purpose</b>, shaped exactly around today’s need? Or <b>general-purpose</b>, able to serve many needs?',
          '每设计一个新模块，都要做一个选择。把它做成<b>专用</b>的，严丝合缝地贴合今天的需求？还是做成<b>通用</b>的，能服务于多种需求？',
        ),
        L(
          'Both sound reasonable. A general design may save time later, but the future is hard to predict and you may build things nobody uses. A special-purpose design builds only what is needed, and can be generalized later.',
          '两种说法听起来都有道理。通用的设计以后可能省时间，但未来很难预测，你可能做出没人用的东西。专用的设计只做需要的部分，以后还可以再改成通用的。',
        ),
        L(
          'The example is a GUI text editor. One class holds the text of the file, and the user interface calls it whenever the user edits. What should its API look like?',
          '例子是一个图形界面的文本编辑器。有一个类保存着文件的文本，用户每次编辑，界面代码都会调用它。它的 API 应该长什么样？',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'The book’s answer: make modules <b>somewhat general-purpose</b>. The functionality should reflect what you need today. The interface should not.',
          '书中的答案是：把模块做得<b>有点通用</b>。功能应该反映你今天的需求，接口则不应该。',
        ),
      },
      metrics: { psdDelMethods: '?', psdUiLeak: '—', psdNewFeature: '—' },
      scene: {
        entities: { ui: uiZone(), ...features(), draft: ghost(0, API_Y, 4, 30, L('Text class API?', '文本类的 API？')), text: text() },
        links: {},
        flows: [],
      },
    },
    {
      short: L('Special-purpose', '专用'),
      chapter: 'problem',
      title: L('One method per feature', '每个功能一个方法'),
      body: [
        L(
          'Many student teams shaped the text class around the editor’s features. Backspace deletes the character to the left of the cursor, so there is a <code>backspace(Cursor)</code>. The delete key gets <code>delete(Cursor)</code>. Deleting a selection gets <code>deleteSelection(Selection)</code>.',
          '很多学生团队照着编辑器的功能来设计文本类。退格键删除光标左边的字符，于是有了 <code>backspace(Cursor)</code>。删除键对应 <code>delete(Cursor)</code>。删除选区对应 <code>deleteSelection(Selection)</code>。',
        ),
        L(
          'It looks convenient: the UI calls the method that matches. But the text class fills up with shallow methods, each one called from a single place, and anyone working on the UI has to learn them all.',
          '看起来很方便：界面只要调用对应的方法就行。但文本类里塞满了浅方法，每个方法只在一个地方被调用，而做界面的人得把它们全都学一遍。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'A method designed for one particular use is a red flag: it may be too special-purpose.',
          '一个只为某一种特定用途设计的方法是危险信号：它可能太专用了。',
        ),
      },
      changes: [L('+ backspace(Cursor), delete(Cursor), deleteSelection(Selection)', '+ backspace(Cursor)、delete(Cursor)、deleteSelection(Selection)')],
      metrics: { psdDelMethods: 3, psdUiLeak: uiIdeas, psdNewFeature: newMethod },
      scene: special(),
    },
    {
      short: L('Tied together', '绑在一起'),
      chapter: 'problem',
      title: L('The UI leaks into the text class', '界面泄漏进了文本类'),
      body: [
        L(
          'Look at what the text class now knows: there is a cursor, there is a selection, there is a backspace key. Those are user-interface ideas. This is information leakage between the two classes.',
          '看看文本类现在都知道些什么：有光标，有选区，有退格键。这些都是用户界面的概念。这就是两个类之间的信息泄漏。',
        ),
        L(
          'So the two cannot evolve separately. Every new UI operation needs a new method in the text class, and whoever works on the UI ends up changing the text class as well.',
          '于是两者没法各自演进。每增加一个界面操作，文本类就得加一个新方法；做界面的人最后也得去改文本类。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'One goal of class design is that each class can be developed independently. The specialized API ties these two together.',
          '类设计的目标之一，是让每个类都能独立开发。专用的 API 把这两个类绑在了一起。',
        ),
      },
      changes: [L('~ A new UI feature: the text class has to grow too', '~ 界面加一个新功能：文本类也得跟着变大')],
      metrics: { psdDelMethods: 4, psdUiLeak: uiIdeas, psdNewFeature: newMethod },
      scene: special({
        wide: true,
        extra: { f_new: newFeature(), need: ghost(NEW_X, API_Y, 3.4, 18, L('new method', '新方法')) },
        links: { c_new: link('f_new', 'need', { style: 'dashed' }) },
        card: panel(
          L('What the text class knows about the UI', '文本类知道的界面细节'),
          [L('the cursor', '光标'), L('the selection', '选区'), L('the backspace key', '退格键'), L('! each new UI feature adds a method here', '! 每个新的界面功能都要在这里加一个方法')],
          'eye',
        ),
      }),
    },
    {
      short: L('General-purpose', '通用'),
      chapter: 'solution',
      title: L('A somewhat general-purpose API', '一个“有点通用”的 API'),
      body: [
        L(
          'Define the text class only in terms of basic text features. Two methods modify text: <code>insert(position, newText)</code>, and <code>delete(start, end)</code>, which removes the characters from <code>start</code> up to but not including <code>end</code>. A generic <code>Position</code> replaces <code>Cursor</code>.',
          '只用基本的文本特性来定义文本类。修改文本的方法只有两个：<code>insert(position, newText)</code>，以及 <code>delete(start, end)</code>——它删除从 <code>start</code> 开始、到 <code>end</code> 之前（不含 <code>end</code>）的字符。通用的 <code>Position</code> 取代了 <code>Cursor</code>。',
        ),
        L(
          'One helper moves around in the text: <code>changePosition(position, numChars)</code> returns the position that many characters later, or earlier if the number is negative, moving across lines as needed.',
          '还有一个在文本中移动的辅助方法：<code>changePosition(position, numChars)</code> 返回向后移动若干字符后的位置，数字为负则向前，需要时会自动跨行。',
        ),
        L(
          'All three delete features now use the same method. The new feature needs nothing from the text class.',
          '现在三个删除功能用的是同一个方法。新功能也不需要文本类做任何改动。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Fewer methods, each one deeper. That is what general-purpose buys, even if the class is never reused.',
          '方法更少，每个都更深。这就是通用带来的好处，哪怕这个类永远不会被复用。',
        ),
      },
      changes: [L('− Three delete methods', '− 三个删除方法'), L('+ delete(start, end) serves all of them', '+ delete(start, end) 一个顶三个'), L('~ Cursor → Position', '~ Cursor → Position')],
      metrics: good,
      scene: shared({ wide: true, extra: { f_new: newFeature() }, more: ['f_new'], card: api() }),
    },
    {
      short: L('Obvious code', '一目了然'),
      chapter: 'insight',
      title: L('More obvious at the call site', '在调用处更一目了然'),
      body: [
        L(
          'The UI code is a little longer than before. It is also more obvious. A UI developer cares which characters the backspace key deletes, and now the answer is right there in the code.',
          '界面代码比以前长了一点，但也更一目了然。做界面的人关心退格键到底删掉哪些字符，现在答案就写在代码里。',
        ),
        L(
          'The old <code>backspace</code> method was a <b>false abstraction</b>. It claimed to hide which characters are deleted, but UI developers need to know exactly that, and had to go and read the text class to find out.',
          '原来的 <code>backspace</code> 方法是一个<b>假抽象</b>。它声称隐藏了“删掉哪些字符”，可做界面的人恰恰需要知道这一点，只好跑去读文本类的代码。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'A big part of design is deciding who needs to know what, and when. When a detail matters to the caller, make it explicit and obvious.',
          '设计中很重要的一部分，是判断谁需要在什么时候知道什么。当某个细节对调用方很要紧时，就把它明明白白地写出来。',
        ),
      },
      metrics: good,
      scene: shared({
        wide: true,
        extra: { f_new: newFeature() },
        more: ['f_new'],
        card: panel(
          L('In the UI code', '界面代码里'),
          [
            L('# delete key', '# 删除键'),
            'text.delete(cursor, text.changePosition(cursor, 1));',
            L('# backspace key', '# 退格键'),
            'text.delete(text.changePosition(cursor, -1), cursor);',
          ],
          'keyboard',
        ),
      }),
    },
    {
      short: L('Reuse', '复用'),
      chapter: 'technique',
      title: L('Other uses come free', '别的用途是白送的'),
      body: [
        L(
          'Suppose you now write a tool that replaces every occurrence of one string with another in a file. <code>backspace</code> and <code>deleteSelection</code> would be of little use to it.',
          '假设你现在要写一个工具，把文件里某个字符串的每一处出现都替换成另一个字符串。<code>backspace</code> 和 <code>deleteSelection</code> 对它几乎没什么用。',
        ),
        L(
          'The general-purpose text class already has most of what the tool needs. One method is missing: <code>findNext(start, string)</code>, which an editor with search and replace would have anyway.',
          '而通用的文本类已经具备了这个工具需要的大部分功能。只差一个方法：<code>findNext(start, string)</code>——带查找替换功能的编辑器本来也会有它。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Reuse is a bonus. The main win was already there: a simpler interface and a cleaner separation between classes.',
          '复用只是额外的收获。主要的好处早就有了：更简单的接口，以及类与类之间更清晰的分离。',
        ),
      },
      changes: [L('+ A find-and-replace tool on the same class', '+ 用同一个类做出查找替换工具'), L('+ findNext(start, string)', '+ findNext(start, string)')],
      metrics: good,
      scene: shared({
        extra: { tool: tool() },
        more: ['tool'],
        card: panel(L('The only method missing', '唯一缺少的方法'), ['Position findNext(Position start, String string);'], 'search'),
      }),
    },
    {
      short: L('Too general', '太通用'),
      chapter: 'tradeoff',
      title: L('Too general is possible too', '也可能通用过头'),
      body: [
        L(
          'You can go too far. Imagine a text API built around single characters: <code>insert</code> adds one character, <code>delete</code> removes one. It is simple, and it is very general.',
          '也可能做过头。设想一套围绕单个字符设计的文本 API：<code>insert</code> 插入一个字符，<code>delete</code> 删除一个字符。它很简单，也非常通用。',
        ),
        L(
          'But it is not easy to use for an editor. Deleting a selection turns into a loop in the UI code, repeated wherever a range is edited, and large operations become slow. The text class should support ranges of characters directly.',
          '但拿它来做编辑器并不好用。删除一个选区变成了界面代码里的一个循环，凡是编辑一段范围的地方都要再写一遍，大的操作还会变慢。文本类应该直接支持对一段字符的操作。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'If you have to write a lot of extra code to use a class for your current purpose, its interface is not providing the right functionality.',
          '如果为了当前的用途使用一个类，还得额外写一大堆代码，说明它的接口没有提供合适的功能。',
        ),
      },
      changes: [L('~ delete(position): one character per call', '~ delete(position)：每次调用只删一个字符')],
      metrics: { psdDelMethods: 1, psdUiLeak: none, psdNewFeature: aLoop },
      scene: shared({
        rate: 5,
        over: { sel: { pills: 'below', tags: [tag(L('needs a loop', '得写循环'), 'amber', 'refresh')] } },
        methodO: { s: 3.4, h: 18, color: 'yellow', glyph: '', label: ['delete', '(position)'], tags: [tag(L('one character per call', '每次调用一个字符'), 'amber', 'alert')] },
      }),
    },
    {
      short: L('Three questions', '三个问题'),
      chapter: 'technique',
      title: L('Three questions to ask', '问自己三个问题'),
      body: [
        L(
          'A clean general-purpose design is easier to recognize than to produce. Three questions help find the balance.',
          '一个干净的通用设计，认出来比做出来容易。有三个问题能帮你找到平衡点。',
        ),
        L(
          '<b>What is the simplest interface that covers all my current needs?</b> Fewer methods with the same capability means more general ones. Stop if each method starts to need many extra arguments.',
          '<b>能满足我当前所有需求的最简单的接口是什么？</b>能力不变而方法更少，说明方法更通用了。但如果每个方法因此要多出一大堆参数，就该停下来。',
        ),
        L(
          '<b>In how many situations will this method be used?</b> Exactly one is a warning sign.',
          '<b>这个方法会在多少种情况下被用到？</b>如果只有一种，就是警告信号。',
        ),
        L(
          '<b>Is this API easy to use for my current needs?</b> If not, you have gone too far.',
          '<b>这个 API 对我当前的需求来说好用吗？</b>如果不好用，就是做过头了。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          '“Somewhat” is the important word: general enough for several uses, and still easy for the one you have today.',
          '“有点”是关键词：通用到能支持多种用途，同时对今天这一种用途依然好用。',
        ),
      },
      metrics: good,
      scene: shared({ card: api() }),
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<ul class="takeaways">
          <li>Make modules <b>somewhat general-purpose</b>: functionality for today, an interface that is not tied to today.</li>
          <li>General-purpose interfaces tend to be <b>simpler</b>: fewer methods, each one deeper.</li>
          <li>Special-purpose interfaces <b>leak information</b> between classes, so they cannot evolve separately.</li>
          <li>When a detail matters to the caller, keep it visible at the call site. Hiding it is a <b>false abstraction</b>.</li>
          <li>Ask: the simplest interface for my needs? How many uses for this method? Easy to use today?</li>
        </ul>`,
          `<ul class="takeaways">
          <li>把模块做得<b>有点通用</b>：功能满足今天的需求，接口却不绑死在今天的需求上。</li>
          <li>通用的接口往往<b>更简单</b>：方法更少，每个都更深。</li>
          <li>专用的接口会在类之间<b>泄漏信息</b>，让它们没法各自演进。</li>
          <li>当某个细节对调用方很要紧时，让它在调用处看得见。把它藏起来就是<b>假抽象</b>。</li>
          <li>问自己：满足需求的最简单接口是什么？这个方法有多少种用途？今天用起来方便吗？</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>Layers and Abstractions</b>. In a layered system, what should each layer add, and which layer should take on the hard parts?',
          '下一课：<b>分层与抽象</b>。在分层的系统里，每一层应该贡献什么？难办的部分又该由哪一层来承担？',
        ),
      },
      metrics: good,
      scene: shared(),
    },
  ],
};
