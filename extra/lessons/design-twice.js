// Lesson 8 — Design It Twice (A Philosophy of Software Design, ch. 11)
//
// The editor UI in front, candidate designs for the text class side by side behind it.
// Yellow is a sketch, green is the one that was chosen, washed-out is one that was set aside.

import { L, LL, block, link, panel, path, store, tag } from '../kit.js';

const BEND = -6.5;
const SIDE = 12;

const ui = () => block(0, -13, { s: 4.2, h: 40, color: 'blue', glyph: 'keyboard', label: LL(['Editor', 'UI'], ['编辑器', '界面']) });
const design = (x, o) => block(x, 0, { s: 4, h: 46, color: 'yellow', ...o });
const methods = (text) => [tag(text, 'paper', 'braces')];

const byLine = (o = {}, x = -SIDE) => design(x, { glyph: 'listOrdered', label: [L('By line', '按行')], tags: methods('insertLine · deleteLine'), ...o });
const byChar = (o = {}) => design(SIDE, { glyph: 'keyboard', label: [L('By character', '按字符')], tags: methods('insertChar · deleteChar'), ...o });
const byRange = (o = {}) => design(0, { glyph: 'scan', label: [L('By range', '按范围')], tags: methods('insert · delete(start, end)'), ...o });

const toSide = (id) => path('ui', id, ['ui', ['ui', BEND], [id, BEND], id], { heads: 'both' });
const edits = (id, rate) => ({ route: [`u_${id}`], kind: 'write', rate, bounce: true });

const text = () => store(0, 11, { label: L('text', '文本'), glyph: 'file' });
const chosen = (o = {}) => byRange({ color: 'green', ...o });
const built = ({ card, rangeO, extra = {}, links = {} } = {}) => ({
  entities: { ui: ui(), range: chosen(rangeO), text: text(), ...extra, ...(card ? { card } : {}) },
  links: { u_range: link('ui', 'range', { heads: 'both' }), t: link('range', 'text', { heads: 'both' }), ...links },
  flows: [{ route: ['u_range', 't'], kind: 'write', rate: 1.4, bounce: true }],
});

const open = L('still open', '还没定');
const best = L('the best of three', '三个里最好的');

export default {
  id: 'psd-design-twice',
  title: L('Design It Twice', '设计两次'),
  summary: L(
    'Your first idea is unlikely to be the best one. Sketch a few very different designs, compare them, and let their weaknesses point to a better one.',
    '第一个想到的方案不太可能是最好的。勾勒几个差别很大的设计，比较它们，让它们的弱点指引你找到更好的方案。',
  ),
  minutes: 8,
  level: 'intermediate',
  metrics: ['psdDesigns', 'psdPick'],
  legend: [
    ['write', L('edit', '编辑操作')],
    ['res', L('result', '结果')],
  ],
  goals: [
    { text: L('Why the first idea is not enough', '为什么只有第一个想法是不够的'), step: 0 },
    { text: L('Compare alternatives by what they cost the caller', '按“调用方要付出什么”来比较备选方案'), step: 2 },
    { text: L('Let the weaknesses drive a new design', '让弱点推动出新的设计'), step: 3 },
    { text: L('What designing twice costs', '设计两次要花多少代价'), step: 6 },
  ],
  steps: [
    {
      short: L('First idea', '第一个想法'),
      chapter: 'setup',
      title: L('The first idea', '第一个想法'),
      body: [
        L(
          'You are designing the class that manages the text of a file for a GUI editor. The first step is its interface: what the rest of the editor will call.',
          '你在给一个图形界面编辑器设计“管理文件文本”的类。第一步是确定它的接口：编辑器的其他部分会调用什么。',
        ),
        L(
          'An idea comes to mind at once. A file is a list of lines, so offer operations that insert, modify and delete whole lines. It sounds reasonable, and it is tempting to start coding.',
          '一个想法立刻冒了出来。文件就是一行一行的内容，那就提供插入、修改、删除整行的操作吧。听上去挺合理，让人很想马上开始写代码。',
        ),
        L(
          'Designing software is hard, so the first thoughts about how to structure a module are unlikely to produce the best design.',
          '软件设计很难，所以关于如何组织一个模块的最初想法，不太可能产生最好的设计。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'You get a much better result if you consider more than one option for each major design decision: <b>design it twice</b>.',
          '对每一个重大的设计决策，如果都多考虑几个选项，结果会好得多：<b>设计两次</b>。',
        ),
      },
      metrics: { psdDesigns: 1, psdPick: L('the first idea', '第一个想法') },
      scene: {
        entities: { ui: ui(), line: byLine({ color: 'orange' }, 0) },
        links: { u_line: link('ui', 'line', { heads: 'both' }) },
        flows: [edits('line', 1.4)],
      },
    },
    {
      short: L('A second', '第二个'),
      chapter: 'technique',
      title: L('Sketch a second design', '再勾勒一个设计'),
      body: [
        L(
          'Before building anything, sketch another design next to the first. Here is one: an interface based on inserting and deleting single characters.',
          '在动手实现之前，先在第一个设计旁边再勾勒一个。比如这个：基于单个字符的插入和删除的接口。',
        ),
        L(
          'Try to pick approaches that are <b>radically different</b> from each other. You learn more that way. A sketch does not have to pin down every feature. A few of the most important methods are enough.',
          '尽量挑选彼此<b>差别很大</b>的方案，这样学到的东西更多。草图不需要把每个功能都定下来，有几个最重要的方法就够了。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Even if you are sure there is only one reasonable approach, consider a second design anyway, however bad you expect it to be. Thinking about its weaknesses tells you something about the first.',
          '即使你确信只有一种合理的做法，也还是要考虑第二个设计，不管你觉得它会有多糟。琢磨它的弱点，能让你对第一个设计多一些了解。',
        ),
      },
      changes: [L('+ A second sketch: one character at a time', '+ 第二张草图：一次处理一个字符')],
      metrics: { psdDesigns: 2, psdPick: open },
      scene: {
        entities: { ui: ui(), line: byLine(), char: byChar() },
        links: { u_line: toSide('line'), u_char: toSide('char') },
        flows: [edits('line', 1), edits('char', 1)],
      },
    },
    {
      short: L('Compare', '比较'),
      chapter: 'tradeoff',
      title: L('List the pros and cons', '列出优点和缺点'),
      body: [
        L(
          'With the sketches side by side, list the pros and cons of each. For an interface, the most important question is how easy it is to use for the code above it.',
          '草图并排摆好之后，列出每一个的优点和缺点。对接口来说，最重要的问题是：上层代码用起来有多容易。',
        ),
        L(
          `<table class="compare">
          <thead><tr><th></th><th>What the UI has to do itself</th></tr></thead>
          <tbody>
            <tr><td>By line</td><td>Split and join lines whenever an edit covers part of a line or several lines, such as cutting the selection</td></tr>
            <tr><td>By character</td><td>Loop for any change longer than one character</td></tr>
          </tbody>
        </table>`,
          `<table class="compare">
          <thead><tr><th></th><th>界面代码要自己做的事</th></tr></thead>
          <tbody>
            <tr><td>按行</td><td>只要编辑涉及半行或者多行（比如剪切选区），就得自己拆行、并行</td></tr>
            <tr><td>按字符</td><td>任何超过一个字符的修改都要写循环</td></tr>
          </tbody>
        </table>`,
        ),
        L(
          'Other things are worth asking too. Is one interface simpler? Is one more general-purpose? Does one allow a more efficient implementation? Here the character interface is likely to be much slower, because every character needs its own call into the text class.',
          '还有几个问题也值得问。哪个接口更简单？哪个更通用？哪个能有更高效的实现？在这个例子里，按字符的接口很可能慢得多，因为每个字符都要单独调用一次文本类。',
        ),
      ],
      changes: [L('~ Each sketch now has its costs written down', '~ 每张草图的代价都写下来了')],
      metrics: { psdDesigns: 2, psdPick: open },
      scene: {
        entities: {
          ui: ui(),
          line: byLine({ tags: [tag(L('UI splits and joins lines', '界面要自己拆行、并行'), 'red', 'split')] }),
          char: byChar({ tags: [tag(L('UI loops, one call per character', '界面要写循环，每个字符调用一次'), 'red', 'refresh')] }),
        },
        links: { u_line: toSide('line'), u_char: toSide('char') },
        flows: [edits('line', 1), edits('char', 6)],
      },
    },
    {
      short: L('A third', '第三个'),
      chapter: 'solution',
      title: L('Let the problems drive a new design', '让问题推动出新的设计'),
      body: [
        L(
          'Sometimes none of the alternatives is attractive. Then use the problems you found to come up with another one.',
          '有时候，没有哪个备选方案让人满意。这时就利用已经发现的问题，再想一个出来。',
        ),
        L(
          'Both sketches are awkward for the same reason: they leave text manipulation to the code above. That is a red flag. If there is going to be a text class, it should handle all of the text manipulation.',
          '两张草图别扭的原因是同一个：它们都把一部分文本处理留给了上层代码。这是一个危险信号。既然要有一个文本类，所有的文本处理就都应该由它负责。',
        ),
        L(
          'So the interface has to match what the UI actually does, and those operations are not always one character or one line. That reasoning leads to a third design: operations on <b>arbitrary ranges</b> of characters, which may cross line boundaries.',
          '所以接口必须贴合界面真正在做的操作，而这些操作并不总是恰好一个字符或一行。顺着这个思路，就得到了第三个设计：对<b>任意范围</b>的字符进行操作，范围可以跨行。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'The third design did not come from nowhere. It came from comparing the first two.',
          '第三个设计不是凭空冒出来的，它来自对前两个设计的比较。',
        ),
      },
      changes: [L('+ A third sketch: any range of characters', '+ 第三张草图：任意范围的字符')],
      metrics: { psdDesigns: 3, psdPick: open },
      scene: {
        entities: {
          ui: ui(),
          line: byLine({ tags: [tag(L('UI splits and joins lines', '界面要自己拆行、并行'), 'red', 'split')] }),
          range: byRange({ tags: [...methods('insert · delete(start, end)'), tag(L('nothing left for the UI', '没有留给界面的活'), 'green', 'check')] }),
          char: byChar({ pills: 'below', tags: [tag(L('UI loops, one call per character', '界面要写循环，每个字符调用一次'), 'red', 'refresh')] }),
        },
        links: { u_line: toSide('line'), u_range: link('ui', 'range', { heads: 'both' }), u_char: toSide('char') },
        flows: [edits('line', 1), edits('range', 1), edits('char', 6)],
      },
    },
    {
      short: L('Choose', '选择'),
      chapter: 'solution',
      title: L('Choose, or combine', '选一个，或者组合'),
      body: [
        L(
          'Once the alternatives have been compared, you are in a much better position to pick. The best choice may be one of them. Or you may find that features of several can be combined into a design that is better than any of the originals.',
          '比较过各个备选方案之后，做选择就有把握得多。最好的选择可能是其中某一个。你也可能发现，可以把几个方案的特点组合起来，得到一个比原来任何一个都好的设计。',
        ),
        L(
          'Here the range-oriented interface wins. It is the one built, and the other two sketches are set aside. They cost a little time and have done their job.',
          '在这个例子里，按范围的接口胜出。真正去实现的是它，另外两张草图被放到一边。它们只花了一点时间，而且已经完成了使命。',
        ),
      ],
      changes: [L('+ The range-oriented design is built', '+ 实现按范围的设计'), L('− Two sketches, set aside', '− 两张草图，放到一边')],
      metrics: { psdDesigns: 3, psdPick: best },
      scene: built({
        extra: { line: byLine({ dim: 1, tags: [] }), char: byChar({ dim: 1, tags: [] }) },
      }),
    },
    {
      short: L('Again, inside', '内部再来一次'),
      chapter: 'technique',
      title: L('Do it again for the implementation', '对实现再来一次'),
      body: [
        L(
          'The principle applies at many levels. Having chosen the interface, use it again for the implementation. The text could be kept as a linked list of lines, as fixed-size blocks of characters, or in a gap buffer.',
          '这条原则适用于很多层面。接口选定之后，对实现再用一次。文本可以存成行的链表、定长的字符块，或者放在间隙缓冲区里。',
        ),
        L(
          'The goals are different this time. For an interface, what matters most is ease of use for the code above. For an implementation, it is simplicity and performance.',
          '这一次的目标不一样了。对接口来说，最重要的是上层代码用起来容易。对实现来说，最重要的是简单和性能。',
        ),
        L(
          'It is just as useful higher up: when choosing the features of a user interface, or when dividing a system into its major modules.',
          '在更高的层面上它同样有用：选择用户界面要有哪些功能的时候，或者把系统划分成几个主要模块的时候。',
        ),
      ],
      changes: [L('+ Three sketches for the implementation', '+ 给实现画三张草图')],
      metrics: { psdDesigns: 3, psdPick: best },
      scene: {
        entities: {
          ui: ui(),
          range: chosen({ label: LL(['Text', 'class'], ['文本', '类']) }),
          i_list: block(-SIDE, 12, { s: 3.6, h: 40, color: 'yellow', glyph: 'listOrdered', label: LL(['Linked list', 'of lines'], ['行的', '链表']) }),
          i_blocks: block(0, 12, { s: 3.6, h: 40, color: 'yellow', glyph: 'boxes', label: LL(['Fixed-size', 'blocks'], ['定长', '字符块']) }),
          i_gap: block(SIDE, 12, { s: 3.6, h: 40, color: 'yellow', glyph: 'split', label: LL(['Gap', 'buffer'], ['间隙', '缓冲区']) }),
        },
        links: {
          u_range: link('ui', 'range', { heads: 'both' }),
          r_list: path('range', 'i_list', ['range', ['range', 6], ['i_list', 6], 'i_list'], { style: 'dashed', heads: 'none' }),
          r_blocks: link('range', 'i_blocks', { style: 'dashed', heads: 'none', label: L('which one?', '选哪个？'), labelTone: 'amber', labelAt: 0.5 }),
          r_gap: path('range', 'i_gap', ['range', ['range', 6], ['i_gap', 6], 'i_gap'], { style: 'dashed', heads: 'none' }),
        },
        flows: [edits('range', 1.4)],
      },
    },
    {
      short: L('The cost', '代价'),
      chapter: 'insight',
      title: L('It does not take long', '花不了多少时间'),
      body: [
        L(
          'For a smaller module such as a class, considering alternatives may take no more than an hour or two. Implementing the class takes days or weeks. A noticeably better design more than pays for that time.',
          '对于类这样的小模块，考虑备选方案可能只需要一两个小时。而实现这个类要花几天甚至几周。一个明显更好的设计，足以把这点时间赚回来还有余。',
        ),
        L(
          'Ousterhout notes that very smart people sometimes find this hard to accept. Growing up, their first quick idea was always good enough, and trying a second can feel like admitting otherwise. But eventually everyone meets problems where the first idea is no longer good enough, and the design of large software systems is one of them: no one is good enough to get it right at the first try.',
          'Ousterhout 提到，特别聪明的人有时很难接受这一点。在成长过程中，他们随手想到的第一个主意总是够用，再去试第二个，就好像在承认自己不够聪明。但每个人迟早都会遇到第一个想法不再够用的问题，大型软件系统的设计就是这样的问题：没有人厉害到第一次就能做对。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Designing twice also improves your design skills. Devising and comparing alternatives teaches you what makes a design better or worse.',
          '设计两次还能提升你的设计能力。构思并比较多个方案的过程，会教给你是什么让一个设计变好或变差。',
        ),
      },
      metrics: { psdDesigns: 3, psdPick: best },
      scene: built({
        rangeO: { label: LL(['Text', 'class'], ['文本', '类']) },
        card: panel(
          L('For one class', '以一个类为例'),
          [
            L('considering alternatives   an hour or two', '考虑备选方案   一两个小时'),
            L('implementing the class    days or weeks', '实现这个类     几天到几周'),
            L('= the better design pays for the time', '= 更好的设计会把这点时间赚回来'),
          ],
          'clock',
        ),
      }),
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<ul class="takeaways">
          <li>Your first idea is unlikely to be the best design. Consider at least one more.</li>
          <li>Make the alternatives <b>radically different</b>, and only sketch them.</li>
          <li>Compare them by pros and cons. For an interface, <b>ease of use for the caller</b> comes first.</li>
          <li>If none is attractive, let their problems drive a new design.</li>
          <li>Apply it at every level: interfaces, implementations, module boundaries.</li>
          <li>It costs an hour or two for a class, and it trains your design sense.</li>
        </ul>`,
          `<ul class="takeaways">
          <li>第一个想法不太可能是最好的设计。至少再考虑一个。</li>
          <li>让备选方案之间<b>差别足够大</b>，而且只画草图。</li>
          <li>按优缺点来比较。对接口来说，<b>调用方用起来容易</b>排在第一位。</li>
          <li>如果哪个都不理想，就让它们的问题推动出一个新设计。</li>
          <li>在每个层面都用它：接口、实现、模块划分。</li>
          <li>对一个类来说只要一两个小时，而且它还在锻炼你的设计感觉。</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>Comments and Names</b>. The last part of a design is the part that cannot be written as code.',
          '下一课：<b>注释与命名</b>。设计的最后一部分，是那些没法用代码写出来的东西。',
        ),
      },
      metrics: { psdDesigns: 3, psdPick: best },
      scene: built({ rangeO: { label: LL(['Text', 'class'], ['文本', '类']) } }),
    },
  ],
};
