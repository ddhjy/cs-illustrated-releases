// Lesson 9 — Comments and Names (A Philosophy of Software Design, ch. 12–15)
//
// Steps 1–6: what the designer knows reaches the next developer along two lanes, the code and
// the comments. Steps 7–8: one vague name in a file system, and what it did to the disk.

import { L, LL, block, ghost, link, panel, path, store, tag } from '../kit.js';

const LANE = 8;
const FORK = -7;
const JOIN = 8;

const designer = (tags = []) => block(0, -13, { s: 4.2, h: 40, color: 'purple', glyph: 'bulb', label: [L('Designer', '设计者')], pills: 'below', tags });
const code = (o = {}) => block(-LANE, 0, { s: 4, h: 46, color: 'blue', glyph: 'code', label: [L('Code', '代码')], ...o });
const notes = (o = {}) => block(LANE, 0, { s: 4, h: 46, color: 'green', glyph: 'message', label: [L('Comments', '注释')], ...o });
const reader = (tags = [], o = {}) =>
  block(0, 15, { s: 4.2, h: 40, color: 'blue', glyph: 'userRound', label: LL(['Next', 'developer'], ['下一位', '开发者']), tags, ...o });

const fork = (to, o = {}) => path('dev', to, ['dev', ['dev', FORK], [to, FORK], to], o);
const join = (from) => path(from, 'reader', [from, [from, JOIN], ['reader', JOIN], 'reader']);

// kind: what travels along the comment lane (msg = something the code does not say).
const handoff = ({ devTags, codeO, notesO, readerTags, kind = 'msg', card }) => ({
  entities: { dev: designer(devTags), code: code(codeO), notes: notes(notesO), reader: reader(readerTags), ...(card ? { card } : {}) },
  links: { dc: fork('code'), cr: join('code'), dn: fork('notes'), nr: join('notes') },
  flows: [
    { route: ['dc', 'cr'], kind: 'req', rate: 1.2 },
    { route: ['dn', 'nr'], kind, rate: 1.2 },
  ],
});

const precision = tag(L('lower level: precision', '更低一层：精确'), 'green', 'zoomIn');
const intuition = tag(L('higher level: intuition', '更高一层：直觉'), 'green', 'zoomOut');

const fileSystem = (fixed) => ({
  entities: {
    reader: reader(
      [fixed ? tag(L('knows which is which', '分得清哪个是哪个'), 'green', 'check') : tag(L('sees block, assumes a disk block', '看到 block，就以为是磁盘块'), 'amber', 'eye')],
      { y: -13, pills: 'below' },
    ),
    fs: block(0, -1, {
      s: 4.4,
      h: 50,
      color: fixed ? 'green' : 'orange',
      glyph: 'file',
      label: LL(['File system', 'code'], ['文件系统', '代码']),
      tags: fixed
        ? [tag(L('diskBlock: number on disk', 'diskBlock：磁盘上的块号'), 'green', 'check'), tag(L('fileBlock: index within a file', 'fileBlock：文件内的块号'), 'green', 'check')]
        : [tag(L('block: number on disk', 'block：磁盘上的块号'), 'amber', 'alert'), tag(L('block: index within a file', 'block：文件内的块号'), 'amber', 'alert')],
    }),
    disk: store(0, 12, { label: L('disk', '磁盘'), tags: fixed ? [] : [tag(L('an unrelated block is zeroed', '一个不相干的块被清零'), 'red', 'alert')] }),
  },
  links: { rd: link('reader', 'fs', { style: 'dashed', label: L('reads', '阅读'), labelAt: 0.5 }), w: link('fs', 'disk') },
  flows: [{ route: ['w'], kind: 'write', rate: 1.6 }, ...(fixed ? [] : [{ route: ['w'], kind: 'poison', rate: 0.35 }])],
});

const none = L('none', '没有');

export default {
  id: 'psd-comments-names',
  title: L('Comments and Names', '注释与命名'),
  summary: L(
    'Code cannot say everything its designer knew. What comments are for, how to write ones that add something, why to write them first, and how one vague name cost six months.',
    '代码说不完设计者知道的一切。注释是用来做什么的，怎样写出真正有信息量的注释，为什么要先写注释，以及一个含糊的名字如何耗掉了六个月。',
  ),
  minutes: 12,
  level: 'intermediate',
  metrics: ['psdWritten', 'psdReader'],
  legend: [
    ['req', L('what the code says', '代码说出来的')],
    ['msg', L('what only a comment can say', '只有注释能说的')],
    ['fail', L('lost', '丢失')],
    ['write', L('disk write', '写磁盘')],
    ['poison', L('wrong block number', '用错的块号')],
  ],
  goals: [
    { text: L('What comments are for', '注释是用来做什么的'), step: 0 },
    { text: L('Spot a comment that repeats the code', '认出重复代码的注释'), step: 1 },
    { text: L('Precision below the code, intuition above it', '比代码更低一层讲精确，更高一层讲直觉'), step: 3 },
    { text: L('Comments as a design tool', '把注释当作设计工具'), step: 5 },
    { text: L('Names that are precise and consistent', '精确而且一致的名字'), step: 7 },
  ],
  steps: [
    {
      short: L('Not in the code', '代码里没有'),
      chapter: 'setup',
      title: L('What code cannot say', '代码说不出来的东西'),
      body: [
        L(
          'Some people believe that well-written code is so obvious that it needs no comments. Ousterhout calls this a delicious myth. Good names help, but a significant amount of design information cannot be represented in code at all.',
          '有人相信，写得好的代码一目了然，不需要注释。Ousterhout 说这是一个美丽的神话。好名字有帮助，但有相当多的设计信息根本无法用代码来表达。',
        ),
        L(
          'Take a method that extracts a substring, with arguments <code>start</code> and <code>end</code>. The declaration does not tell you whether the character at <code>end</code> is included, or what happens if <code>start &gt; end</code>. Only the signature is formal. What the method does, what its result means and why it was designed this way can only be written in comments.',
          '比如一个提取子串的方法，参数是 <code>start</code> 和 <code>end</code>。光看声明，你不知道 <code>end</code> 位置的字符是否包含在内，也不知道 <code>start &gt; end</code> 时会怎样。只有签名是形式化的。方法做什么、返回结果是什么意思、为什么这样设计，都只能写在注释里。',
        ),
        L(
          'Comments capture what was in the designer’s mind but could not be put into the code. Without them, the next developer has to work that knowledge out again, or guess.',
          '注释记录的是设计者脑子里有、却没法写进代码的东西。没有注释，下一位开发者就只能把这些知识重新推导一遍，或者靠猜。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Comments are part of the abstraction. If callers must read a method’s code in order to use it, there is no abstraction: all of its complexity is exposed.',
          '注释是抽象的一部分。如果调用方必须读一个方法的代码才能使用它，那就没有抽象可言：它的全部复杂性都暴露在外。',
        ),
      },
      metrics: { psdWritten: none, psdReader: L('has to guess', '只能猜') },
      scene: {
        entities: {
          dev: designer([tag(L('knows why, and the rules', '知道为什么，也知道规则'), 'violet', 'bulb')]),
          code: code(),
          gap: ghost(LANE, 0, 4, 46, L('no comments', '没有注释')),
          reader: reader([tag(L('has to guess', '只能猜'), 'amber', 'alert')]),
          card: panel(
            L('From the declaration alone', '光看声明'),
            ['substring(start, end)', L('! is the character at end included?', '! end 位置的字符算不算在内？'), L('! what happens if start > end?', '! 如果 start > end 会怎样？')],
            'code',
          ),
        },
        links: { dc: fork('code'), cr: join('code'), dn: fork('gap', { style: 'dashed', fail: 1 }) },
        flows: [
          { route: ['dc', 'cr'], kind: 'req', rate: 1.2 },
          { route: ['dn'], kind: 'msg', rate: 1.2 },
        ],
      },
    },
    {
      short: L('Repeats', '重复代码'),
      chapter: 'problem',
      title: L('Comments that repeat the code', '重复代码的注释'),
      body: [
        L(
          'Writing comments is not enough. Many comments say only what the code next to them already says, which is why some people think comments are worthless.',
          '光是写了注释还不够。很多注释说的，只是旁边的代码已经说过的东西，所以才有人觉得注释毫无用处。',
        ),
        L(
          'The first comment in the panel sits above a line that creates a horizontal scroll bar. The second takes the words of the name <code>textHorizontalPadding</code> and arranges them into a sentence. What a reader needs is missing from it: what are the units, and is the padding on one side of each line or both?',
          '面板里的第一条注释，下面那行代码就是在创建一个水平滚动条。第二条只是把 <code>textHorizontalPadding</code> 这个名字里的词排成了一句话。读者真正需要的信息它一条也没有：单位是什么？留白是在每行的一侧，还是两侧都有？',
        ),
        L(
          'A test for any comment: could someone who has never seen the code write it just by looking at the code next to it? If so, it adds nothing.',
          '对任何一条注释都可以做个测试：一个从没见过这段代码的人，只看注释旁边的代码，能不能写出这条注释？如果能，它就没有增加任何信息。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Red flag: a comment repeats the code. One sign is a comment that uses the same words as the name of the thing it describes.',
          '危险信号：注释在重复代码。一个迹象是，注释用的词和它所描述的东西的名字一模一样。',
        ),
      },
      changes: [L('+ Comments, but they repeat the code', '+ 有了注释，但只是在重复代码')],
      metrics: { psdWritten: none, psdReader: L('learns nothing new', '没学到任何新东西') },
      scene: handoff({
        kind: 'req',
        notesO: { color: 'orange', tags: [tag(L('repeats the code', '在重复代码'), 'red', 'replay')] },
        readerTags: [tag(L('reads the same thing twice', '同样的东西读了两遍'), 'amber', 'replay')],
        card: panel(
          L('Comments that repeat the code', '重复代码的注释'),
          [
            '// Add a horizontal scroll bar',
            'hScrollBar = new JScrollBar(JScrollBar.HORIZONTAL);',
            '// The horizontal padding of each line in the text.',
            'private static final int textHorizontalPadding = 4;',
          ],
          'replay',
        ),
      }),
    },
    {
      short: L('Precision', '精确'),
      chapter: 'technique',
      title: L('Go lower: add precision', '往下一层：增加精确性'),
      body: [
        L(
          'Useful comments describe the code at a <b>different level of detail</b>. Comments at the same level as the code are the ones that repeat it.',
          '有用的注释是在<b>另一个细节层次</b>上描述代码。和代码处在同一层次的注释，正是那些重复代码的注释。',
        ),
        L(
          'Some comments go lower and add <span class="term">precision</span>. This matters most for declarations: variables, arguments and return values. A name and a type leave a lot open. What are the units? Are the boundaries inclusive or exclusive? If null is allowed, what does it mean? Who is responsible for freeing or closing the resource? What is always true of the value?',
          '有些注释比代码更低一层，增加<span class="term">精确性</span>。这对声明最重要：变量、参数和返回值。名字加类型留下了很多没说清的地方。单位是什么？边界是包含还是不包含？如果允许为 null，它代表什么？谁负责释放或关闭这个资源？这个值有什么始终成立的性质？',
        ),
        L(
          'A first step is to use different words in the comment from those in the name. The rewritten comment for <code>textHorizontalPadding</code> says what padding is, which sides it applies to, and in what units.',
          '第一步是让注释里用的词和名字里的不一样。<code>textHorizontalPadding</code> 重写后的注释说明了留白是什么、作用在哪几侧、单位是什么。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'When documenting a variable, think nouns, not verbs. Say what the variable represents, not how the code manipulates it.',
          '给变量写注释时，想名词，不要想动词。说明这个变量代表什么，而不是代码怎么操作它。',
        ),
      },
      changes: [L('~ The comment now says what the declaration cannot', '~ 注释现在说的是声明说不出来的东西')],
      metrics: { psdWritten: L('the details', '细节'), psdReader: L('knows the units and limits', '知道单位和边界') },
      scene: handoff({
        notesO: { tags: [precision] },
        readerTags: [tag(L('units, limits, ownership', '单位、边界、归属'), 'green', 'check')],
        card: panel(
          L('The same declaration, a better comment', '同一个声明，更好的注释'),
          [
            '// The amount of blank space to leave on the left and',
            '// right sides of each line of text, in pixels.',
            'private static final int textHorizontalPadding = 4;',
            L('= adds the units, and that it applies to both sides', '= 补上了单位，也说明了两侧都有'),
          ],
          'zoomIn',
        ),
      }),
    },
    {
      short: L('Intuition', '直觉'),
      chapter: 'technique',
      title: L('Go higher: give intuition', '往上一层：提供直觉'),
      body: [
        L(
          'Other comments sit above the code and give <span class="term">intuition</span>. They leave the details out and say what the code is trying to do, or why it is there.',
          '另一些注释比代码高一层，提供<span class="term">直觉</span>。它们略去细节，说明这段代码想做什么，或者它为什么存在。',
        ),
        L(
          'The comment in the panel describes a loop whose condition has four parts. It mentions none of them. With it, a reader can still explain almost everything the loop does.',
          '面板里的注释描述的是一个循环，循环里的条件有四个部分。注释一个都没提。可是有了它，读者几乎能解释这个循环做的每一件事。',
        ),
        L(
          'Higher-level comments are harder to write, because you have to think about the code in a different way. Ask: what is this code trying to do? What is the simplest thing I can say that explains everything in it?',
          '高层注释更难写，因为你必须换一种方式去看这段代码。问自己：这段代码想做什么？我能说出的、可以解释其中一切的最简单的一句话是什么？',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Stepping back from the details to find a simple way of thinking about something complex is what abstraction is. Writing a higher-level comment asks for the same thing.',
          '从细节里退后一步，为复杂的东西找到一种简单的思考方式，这就是抽象。写高层注释要求的是同一件事。',
        ),
      },
      changes: [L('+ A comment above the level of the code', '+ 一条比代码高一层的注释')],
      metrics: { psdWritten: L('details and intent', '细节和意图'), psdReader: L('knows what the code is for', '知道这段代码是干什么的') },
      scene: handoff({
        notesO: { tags: [precision, intuition] },
        readerTags: [tag(L('what it is for, and why', '它是干什么的，为什么'), 'green', 'check')],
        card: panel(
          L('One comment for a whole loop', '整个循环只用一条注释'),
          [
            '// Try to append the current key hash onto an existing',
            "// RPC to the desired server that hasn't been sent yet.",
            'for (int i = 0; i < NUM_READ_RPC; i++) { ... }',
            L('= no details: it says what the loop is for', '= 不讲细节：只说这个循环是干什么的'),
          ],
          'zoomOut',
        ),
      }),
    },
    {
      short: L('Interface', '接口'),
      chapter: 'technique',
      title: L('Interface comments and implementation comments', '接口注释与实现注释'),
      body: [
        L(
          'One of the most important jobs of comments is to define abstractions. Code cannot do it: it is too low-level, and it includes implementation details that should not be visible.',
          '注释最重要的工作之一是定义抽象。代码做不到这一点：它层次太低，而且包含了不该被看见的实现细节。',
        ),
        L(
          'So keep two kinds of comment apart. <span class="term">Interface comments</span> say what someone needs to know in order to use a class or method. <span class="term">Implementation comments</span> describe how it works inside.',
          '所以要把两种注释分开。<span class="term">接口注释</span>说明使用一个类或方法需要知道什么。<span class="term">实现注释</span>描述它内部是怎么工作的。',
        ),
        L(
          'The interface comment for a class describes the abstraction the class provides, what each instance represents, and its limitations. The one for a method covers the points in the panel.',
          '类的接口注释描述这个类提供的抽象、每个实例代表什么，以及它的局限。方法的接口注释要覆盖面板里列出的几点。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Red flag: implementation documentation contaminates the interface. If an interface comment has to describe how the method works, the method is shallow.',
          '危险信号：实现文档污染了接口。如果接口注释不得不描述方法是怎么实现的，这个方法就是浅的。',
        ),
      },
      changes: [L('~ Interface comments kept apart from implementation comments', '~ 接口注释和实现注释分开')],
      metrics: { psdWritten: L('the whole interface', '完整的接口'), psdReader: L('can call it without reading it', '不读代码也会调用') },
      scene: handoff({
        notesO: {
          tags: [tag(L('implementation: how it works', '实现注释：内部怎么工作'), 'paper', 'settings'), tag(L('interface: how to use it', '接口注释：怎么用'), 'green', 'eye')],
        },
        card: panel(
          L('A method’s interface comment', '方法的接口注释'),
          [
            L('what the method does, as callers see it', '调用方眼中，这个方法做什么'),
            L('each argument and the return value, precisely', '每个参数和返回值，要写精确'),
            L('side effects', '副作用'),
            L('exceptions it can throw', '可能抛出的异常'),
            L('preconditions', '前置条件'),
            L('! not how it works inside', '! 不写内部是怎么实现的'),
          ],
          'eye',
        ),
      }),
    },
    {
      short: L('Write first', '先写注释'),
      chapter: 'technique',
      title: L('Write the comments first', '先写注释'),
      body: [
        L(
          'Most developers put comments off until the code is finished. Delayed comments often never get written. When they are, the design ideas have faded and the author is looking at the code while writing, so the comments repeat the code.',
          '大多数开发者会把注释拖到代码写完之后。拖延的注释常常永远不会被写出来。即使写了，当初的设计思路已经模糊，作者又是一边看着代码一边写，于是注释就在重复代码。',
        ),
        L(
          'Ousterhout writes them first, in the order shown in the panel. When the code is done, the comments are done too.',
          'Ousterhout 的做法是先写注释，顺序如面板所示。代码写完的时候，注释也就写完了。',
        ),
        L(
          'The most important benefit is to the design. Comments are the only way to capture an abstraction fully, so writing them first lets you review the abstractions before any implementation exists.',
          '最重要的好处在设计上。注释是完整记录一个抽象的唯一方式，所以先写注释，你就能在任何实现出现之前先审视这些抽象。',
        ),
        L(
          'It costs little. Typing code and comments together is unlikely to take more than about 10% of development time, so delaying the comments saves only a fraction of that.',
          '这样做的代价很小。敲代码和敲注释加在一起，也不太可能超过开发时间的 10% 左右，所以把注释往后拖，省下的只是其中一小部分。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Comments are a canary in the coal mine of complexity. If a method or variable needs a long comment, that is a red flag: the abstraction is probably not a good one.',
          '注释是复杂性煤矿里的金丝雀。如果一个方法或变量需要很长的注释，这就是危险信号：这个抽象多半不够好。',
        ),
      },
      changes: [L('~ Comments are written before the method bodies', '~ 注释写在方法体之前')],
      metrics: { psdWritten: L('all of it, before the code', '全部，而且先于代码'), psdReader: L('gets comments that are finished', '拿到的是写完了的注释') },
      scene: handoff({
        codeO: { dim: 0.8, tags: [tag(L('bodies still empty', '方法体还空着'), 'paper', 'braces')] },
        notesO: { tags: [tag(L('written first', '先写的'), 'green', 'check')] },
        card: panel(
          L('Comments first', '注释在先'),
          [
            L('1  the class interface comment', '1  类的接口注释'),
            L('2  comments and signatures of the main methods', '2  主要方法的注释和签名'),
            L('3  revise until the structure feels right', '3  反复修改，直到结构看着对了'),
            L('4  the main instance variables, with comments', '4  主要的实例变量及其注释'),
            L('5  the method bodies', '5  方法体'),
          ],
          'listOrdered',
        ),
      }),
    },
    {
      short: L('A vague name', '含糊的名字'),
      chapter: 'problem',
      title: L('A name that cost six months', '一个耗掉六个月的名字'),
      body: [
        L(
          'Names are documentation too. In Sprite, an operating system Ousterhout built with his graduate students, files occasionally lost data: one block of a file suddenly became all zeroes. It happened rarely, and it took him six months to find the cause.',
          '名字也是文档。在 Ousterhout 和他的研究生们开发的操作系统 Sprite 里，文件偶尔会丢数据：文件的某一个块突然变成全零。这种情况很少发生，他花了六个月才找到原因。',
        ),
        L(
          'The file system used the name <code>block</code> for two things: sometimes a physical block number on disk, sometimes a logical block number within a file. At one point a variable holding a logical number was used where a physical one was needed, and an unrelated block on disk was overwritten with zeroes.',
          '文件系统的代码用 <code>block</code> 这个名字表示两种东西：有时是磁盘上的物理块号，有时是文件内的逻辑块号。在某一处，一个装着逻辑块号的变量被用在了需要物理块号的地方，于是磁盘上一个不相干的块被全零覆盖了。',
        ),
        L(
          'Several people read the faulty code and did not see it. When they saw <code>block</code> used as a physical block number, they assumed that was what it held.',
          '好几个人读过这段有问题的代码，都没有看出来。看到 <code>block</code> 被当作物理块号使用，他们就想当然地认为它装的就是物理块号。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Red flag: a vague name. If a name is broad enough to refer to many different things, it tells the reader little, and the thing it names is more likely to be misused.',
          '危险信号：含糊的名字。如果一个名字宽泛到可以指很多不同的东西，它就给不了读者多少信息，被它命名的东西也更容易被误用。',
        ),
      },
      changes: [L('+ One name, block, with two meanings', '+ 一个名字 block，两种含义')],
      metrics: { psdWritten: L('hidden behind a vague name', '被含糊的名字盖住了'), psdReader: L('assumes the wrong meaning', '想当然地理解错了') },
      scene: fileSystem(false),
    },
    {
      short: L('Good names', '好名字'),
      chapter: 'solution',
      title: L('Precise and consistent names', '精确而且一致的名字'),
      body: [
        L(
          'With two names, <code>fileBlock</code> and <code>diskBlock</code>, the error would have been unlikely. The programmer would have known that <code>fileBlock</code> could not be used in that place.',
          '如果用的是两个名字 <code>fileBlock</code> 和 <code>diskBlock</code>，这个错误就不太可能发生。程序员会知道 <code>fileBlock</code> 不能用在那个地方。',
        ),
        L(
          'A good name creates an image in the reader’s mind of what the thing is and, just as important, what it is not. Ask: if someone saw this name on its own, without the declaration or any documentation, how closely could they guess what it refers to?',
          '好名字会在读者脑子里形成一幅图像：这个东西是什么，以及同样重要的，它不是什么。问自己：如果有人只看到这个名字，看不到声明也看不到任何文档，他能把它指的东西猜到多准？',
        ),
        L(
          'Good names are <b>precise</b>. The panel shows names that were too vague and what replaced them. A name can also be too specific: a method that deletes any range of text should not call its argument <code>selection</code>.',
          '好名字是<b>精确</b>的。面板里是一些过于含糊的名字，以及替换它们的名字。名字也可能过于具体：一个可以删除任意范围文本的方法，不应该把参数叫做 <code>selection</code>。',
        ),
        L(
          'Good names are <b>consistent</b>. Use one name for one purpose everywhere, never use it for anything else, and keep the purpose narrow enough that every variable with that name behaves the same way.',
          '好名字是<b>一致</b>的。同一个用途在所有地方都用同一个名字，这个名字绝不用于别的用途，而且用途要窄到让所有叫这个名字的变量行为都一样。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Red flag: a name that is hard to pick. If you cannot find a simple name that gives a clear image, the thing being named may not have a clean design.',
          '危险信号：名字很难取。如果找不到一个简单、能给出清晰图像的名字，被命名的那个东西本身的设计可能就不够干净。',
        ),
      },
      changes: [L('− block, used for two different things', '− 表示两种不同东西的 block'), L('+ fileBlock and diskBlock', '+ fileBlock 和 diskBlock')],
      metrics: { psdWritten: L('in the names too', '名字里也有了'), psdReader: L('knows which block it is', '知道是哪一种块') },
      scene: {
        ...fileSystem(true),
        entities: {
          ...fileSystem(true).entities,
          card: panel(
            L('Vague, then precise', '从含糊到精确'),
            [
              'getCount()                →  numIndexlets()',
              'blinkStatus               →  cursorVisible',
              'VOTED_FOR_SENTINEL_VALUE  →  NOT_YET_VOTED',
              'x, y                      →  charIndex, lineIndex',
              'block                     →  fileBlock, diskBlock',
            ],
            'target',
          ),
        },
      },
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<ul class="takeaways">
          <li>Comments record what the designer knew and the code cannot say.</li>
          <li>A comment that repeats the code adds nothing. Use different words from the name.</li>
          <li>Go <b>lower</b> than the code for precision and <b>higher</b> for intuition.</li>
          <li>Keep interface comments apart from implementation comments.</li>
          <li><b>Write comments first</b>. A comment that is hard to write points at a problem in the design.</li>
          <li>Names should be <b>precise</b> and <b>consistent</b>. A name that is hard to choose is a warning too.</li>
        </ul>`,
          `<ul class="takeaways">
          <li>注释记录的是设计者知道、而代码说不出来的东西。</li>
          <li>重复代码的注释没有任何价值。注释用的词要和名字不同。</li>
          <li>比代码<b>低</b>一层讲精确，比代码<b>高</b>一层讲直觉。</li>
          <li>把接口注释和实现注释分开。</li>
          <li><b>先写注释</b>。一条很难写的注释，指向的是设计里的问题。</li>
          <li>名字要<b>精确</b>而且<b>一致</b>。一个很难取的名字同样是警告。</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'That is the end of this module. All nine lessons were about one thing: <b>complexity</b>, and the habits that keep it from building up.',
          '这个模块到这里就结束了。九节课讲的其实是同一件事：<b>复杂性</b>，以及那些能阻止它不断累积的习惯。',
        ),
      },
      metrics: { psdWritten: L('in comments and names', '在注释和名字里'), psdReader: L('understands it quickly', '很快就能看懂') },
      scene: handoff({ notesO: { tags: [precision, intuition] } }),
    },
  ],
};
