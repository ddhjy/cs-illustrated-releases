// Lesson 7 — Define Errors Out of Existence (A Philosophy of Software Design, ch. 10)
//
// A row of callers in front of one module. A red "catch" pill on a caller is a handler somebody
// had to write; the lesson is about making those pills disappear.

import { L, LL, block, link, panel, path, store, tag } from '../kit.js';

const XS = [-12, -4, 4, 12];
const ROW_Y = -12;
const BEND = -6;

const row = (label, o = {}, y = ROW_Y) =>
  Object.fromEntries(XS.map((x, i) => [`c${i}`, block(x, y, { s: 3.2, h: 34, color: 'blue', glyph: 'code', label: [label], pills: 'below', ...o })]));
const fan = (to, o = {}, bend = BEND) => Object.fromEntries(XS.map((_, i) => [`l${i}`, path(`c${i}`, to, [`c${i}`, [`c${i}`, bend], [to, bend], to], { heads: 'both', ...o })]));
const each = (tail = []) => XS.map((_, i) => ({ path: [`l${i}`, ...tail] }));
const mod = (o = {}) => block(0, 0, { s: 4.2, h: 50, glyph: 'box', ...o });

const callersAnd = ({ label = L('caller', '调用方'), rowO, modO, fail = 0, behind, card, rate = 2 }) => ({
  entities: { ...row(label, rowO), mod: mod(modO), ...(behind ? { back: behind } : {}), ...(card ? { card } : {}) },
  links: { ...fan('mod', fail ? { fail } : {}), ...(behind ? { mb: link('mod', 'back', { heads: 'both' }) } : {}) },
  flows: [{ routes: each(), rate, bounce: true }],
});

const handler = (text, tone = 'red') => ({ tags: [tag(text, tone, 'alert')] });

const justCall = L('just call it', '直接调用就行');
const calm = { psdHandlers: 0, psdCallers: justCall };

export default {
  id: 'psd-errors',
  title: L('Define Errors Out of Existence', '通过定义消除错误'),
  summary: L(
    'Exception handling is one of the worst sources of complexity. Four ways to need fewer handlers, and where each one stops working.',
    '异常处理是复杂性最糟糕的来源之一。四种减少异常处理代码的办法，以及它们各自的适用边界。',
  ),
  minutes: 11,
  level: 'intermediate',
  metrics: ['psdHandlers', 'psdCallers'],
  legend: [
    ['req', L('call', '调用')],
    ['res', L('result', '结果')],
    ['fail', L('error', '错误')],
  ],
  goals: [
    { text: L('Why exception handling is so costly', '为什么异常处理的代价这么高'), step: 0 },
    { text: L('Define errors out of existence', '通过定义消除错误'), step: 2 },
    { text: L('Mask, aggregate, or just crash', '屏蔽、聚合，或者干脆崩溃'), step: 4 },
    { text: L('Which errors must stay visible', '哪些错误必须让调用方看到'), step: 7 },
  ],
  steps: [
    {
      short: L('The cost', '代价'),
      chapter: 'setup',
      title: L('Exceptions are expensive', '异常的代价很高'),
      body: [
        L(
          'An <span class="term">exception</span> here means any uncommon condition that changes the normal flow of a program: bad arguments, a failed I/O operation, a lost packet, a detected bug. A thrown error counts, and so does a special return value.',
          '这里说的<span class="term">异常</span>，是指任何改变程序正常流程的不常见情况：错误的参数、失败的 I/O 操作、丢失的数据包、被检测到的 bug。抛出的错误算，特殊的返回值也算。',
        ),
        L(
          'Code that handles exceptions is harder to write than normal code. It has to push on despite the problem, or undo work that was half done, and either path can raise new exceptions. It also runs rarely, so it is hard to test. One study found that more than 90% of catastrophic failures in distributed data-intensive systems were caused by incorrect error handling.',
          '处理异常的代码比正常流程的代码更难写。它要么顶着问题继续往下做，要么撤销做到一半的工作，而这两条路都可能引出新的异常。它又很少运行，所以很难测试。有研究发现，在分布式数据密集型系统里，超过 90% 的灾难性故障是由错误处理不当造成的。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Throwing an exception is easy. Handling it is hard. So the goal is to reduce the number of places where exceptions have to be handled.',
          '抛出异常很容易，处理异常很难。所以目标是减少必须处理异常的地方。',
        ),
      },
      metrics: { psdHandlers: 4, psdCallers: L('wrap every call', '每次调用都要包一层') },
      scene: callersAnd({
        rowO: handler('try / catch'),
        modO: { color: 'orange', label: [L('Module', '模块')], tags: [tag(L('throws', '会抛异常'), 'red', 'zap')] },
        fail: 0.4,
        card: panel(
          L('Why handlers go wrong', '异常处理代码为什么容易出错'),
          [
            L('they run rarely, so they are rarely tested', '很少运行，所以很少被测试'),
            L('they can raise exceptions of their own', '它们自己也可能引发异常'),
            L('state may be half-updated when they start', '开始处理时，状态可能只更新了一半'),
            L('# “code that hasn’t been executed doesn’t work”', '# “没有执行过的代码是不能用的”'),
          ],
          'bug',
        ),
      }),
    },
    {
      short: L('Too many', '太多了'),
      chapter: 'problem',
      title: L('Too many exceptions', '异常太多了'),
      body: [
        L(
          'Programmers are taught that detecting errors is good, and often conclude that the more errors detected, the better. The result is an over-defensive style that rejects anything that looks a bit suspicious.',
          '程序员从小被教导：检测错误是好事。于是常常得出结论：检测的错误越多越好。结果就是一种过度防御的风格，任何看上去有点可疑的东西都被拒绝。',
        ),
        L(
          'John Ousterhout made this mistake when he designed the Tcl language. Its <code>unset</code> command removes a variable, and throws an error if the variable does not exist. But <code>unset</code> is mostly used to clean up after an earlier operation, when it is hard to know which variables were created. So callers wrap <code>unset</code> in <code>catch</code> and ignore the error. He calls it one of his biggest mistakes in Tcl.',
          'John Ousterhout 在设计 Tcl 语言时就犯了这个错误。Tcl 的 <code>unset</code> 命令用来删除变量，如果变量不存在就抛出错误。可是 <code>unset</code> 最常见的用途是给前面的操作做清理，而那时往往很难知道到底创建了哪些变量。于是调用方只好把 <code>unset</code> 包在 <code>catch</code> 里，再把错误忽略掉。他说这是自己在 Tcl 设计中犯过的最大错误之一。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'The exceptions a class throws are part of its interface. More exceptions mean a larger interface and a shallower class.',
          '一个类抛出的异常是它接口的一部分。异常越多，接口越大，类就越浅。',
        ),
      },
      changes: [L('+ unset throws when the variable does not exist', '+ 变量不存在时，unset 抛出错误')],
      metrics: { psdHandlers: 4, psdCallers: L('catch and ignore', '捕获，然后忽略') },
      scene: callersAnd({
        label: L('cleanup', '清理代码'),
        rowO: handler(L('catch, ignore', '捕获并忽略'), 'amber'),
        modO: { color: 'orange', glyph: 'ban', label: ['unset'], tags: [tag(L('error: no such variable', '错误：变量不存在'), 'red', 'alert')] },
        fail: 0.5,
        behind: store(0, 11, { label: L('variables', '变量') }),
      }),
    },
    {
      short: L('Define away', '定义掉'),
      chapter: 'solution',
      title: L('Define the error out of existence', '通过定义把错误消除掉'),
      body: [
        L(
          'The fix is a small change of definition. Instead of “delete this variable”, <code>unset</code> should mean “<b>make sure this variable no longer exists</b>”. If the variable is already gone, the work is already done, and the command simply returns.',
          '解决办法只是稍微改一下定义。<code>unset</code> 的含义不应该是“删除这个变量”，而应该是“<b>确保这个变量不再存在</b>”。如果变量本来就不在了，那活儿已经干完了，命令直接返回即可。',
        ),
        L(
          'No error case is left to report, so nobody has to handle one. This is the best way to deal with exception-handling complexity: define the API so that its normal behaviour covers every situation.',
          '没有什么错误情况需要报告了，也就没有人需要去处理它。这是对付异常处理复杂性的最好办法：把 API 定义成“正常行为就能覆盖所有情况”。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'It works for special cases in general. An editor whose selection always exists, and is sometimes empty, needs no “is there a selection?” checks.',
          '这个办法对一般的特殊情况同样有效。如果编辑器里的选区始终存在、只是有时为空，就不需要到处检查“有没有选区”。',
        ),
      },
      changes: [L('~ unset: “make sure the variable no longer exists”', '~ unset：“确保这个变量不再存在”'), L('− Four catch-and-ignore wrappers', '− 四处“捕获并忽略”的包装')],
      metrics: calm,
      scene: callersAnd({
        label: L('cleanup', '清理代码'),
        modO: { color: 'green', glyph: 'check', label: ['unset'], tags: [tag(L('already gone? done', '已经不在了？那就完成了'), 'green', 'check')] },
        behind: store(0, 11, { label: L('variables', '变量') }),
      }),
    },
    {
      short: L('Unix delete', 'Unix 删除'),
      chapter: 'technique',
      title: L('The same idea in Unix', 'Unix 里的同一个思路'),
      body: [
        L(
          'Windows does not let you delete a file that a process has open. Users hunt for the process, kill it, and sometimes reboot just to delete a file.',
          'Windows 不允许删除一个正被某个进程打开的文件。用户得去找出那个进程，把它杀掉，有时候为了删一个文件甚至要重启。',
        ),
        L(
          'Unix defines deletion differently. The name is removed from its directory at once and the call succeeds. Processes that have the file open keep reading and writing it, and the data is freed when the last one closes it. Two errors disappear: delete never fails because a file is open, and the processes using the file never see it vanish.',
          'Unix 对删除的定义不一样。文件名立刻从目录里移除，调用成功返回。已经打开这个文件的进程可以继续读写，等最后一个进程关闭它时，数据才被释放。两种错误就此消失：删除不会因为文件被打开而失败，正在使用文件的进程也不会发现文件突然没了。',
        ),
        L(
          'Java’s <code>substring</code> throws <code>IndexOutOfBoundsException</code> when an index is out of range. If it returned whatever characters fall inside the range, the way Python slices do, that exception would not exist.',
          'Java 的 <code>substring</code> 在下标越界时会抛出 <code>IndexOutOfBoundsException</code>。如果它像 Python 的切片那样，返回落在范围内的那些字符，这个异常就不存在了。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Does throwing more errors catch more bugs? Sometimes. It also forces extra code to avoid or ignore those errors, which causes other bugs. Overall, the best way to reduce bugs is to make software simpler.',
          '多抛一些错误，能多抓到一些 bug 吗？有时候能。但它也逼着人写更多代码去规避或忽略这些错误，而这又会带来别的 bug。总的来说，减少 bug 的最好办法是让软件更简单。',
        ),
      },
      metrics: calm,
      scene: {
        entities: {
          pa: block(-6, ROW_Y, { s: 3.6, h: 36, color: 'blue', glyph: 'eye', label: LL(['Process', 'A'], ['进程', 'A']), tags: [tag(L('has the file open', '打开着这个文件'), 'paper', 'file')] }),
          pb: block(6, ROW_Y, { s: 3.6, h: 36, color: 'purple', glyph: 'close', label: LL(['Process', 'B'], ['进程', 'B']), pills: 'below', tags: [tag(L('deletes the file', '删除这个文件'), 'violet', 'close')] }),
          mod: mod({ color: 'green', glyph: 'file', label: LL(['Unix', 'file system'], ['Unix', '文件系统']) }),
          back: store(0, 10, { label: L('file data', '文件数据'), glyph: 'file', tags: [tag(L('freed after the last close', '最后一次关闭后才释放'), 'green', 'clock')] }),
          card: panel(
            L('Deleting an open file', '删除一个打开着的文件'),
            [
              L('Windows   the delete fails', 'Windows   删除失败'),
              L('Unix      the name goes now, the data later', 'Unix      文件名立刻移除，数据稍后释放'),
              L('= no error for B, and none for A', '= B 不会出错，A 也不会'),
            ],
            'file',
          ),
        },
        links: {
          la: path('pa', 'mod', ['pa', ['pa', BEND], ['mod', BEND], 'mod'], { heads: 'both' }),
          lb: path('pb', 'mod', ['pb', ['pb', BEND], ['mod', BEND], 'mod']),
          mb: link('mod', 'back', { heads: 'both' }),
        },
        flows: [
          { route: ['la', 'mb'], rate: 1.2, bounce: true },
          { route: ['lb'], kind: 'kill', rate: 0.4 },
        ],
      },
    },
    {
      short: L('Mask', '屏蔽'),
      chapter: 'technique',
      title: L('Mask exceptions', '屏蔽异常'),
      body: [
        L(
          'Some exceptions cannot be defined away. The next option is to <span class="term">mask</span> them: detect and handle the condition at a low level, so that the layers above never hear about it.',
          '有些异常没法靠定义消除。下一个选择是<span class="term">屏蔽</span>它们：在底层就把这种情况检测出来并处理掉，让上面的各层根本不知道发生过什么。',
        ),
        L(
          'TCP does this. Packets are dropped by corruption and congestion all the time. TCP resends them inside its implementation, so all the data eventually arrives and applications never know anything was lost.',
          'TCP 就是这么做的。数据包随时可能因为损坏或拥塞而被丢弃。TCP 在自己的实现内部重发它们，所以所有数据最终都会送达，应用程序完全不知道丢过包。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Masking makes a class deeper: fewer exceptions in its interface, more functionality inside. It is another way of pulling complexity downwards.',
          '屏蔽让类变得更深：接口上的异常更少，内部的功能更多。这是把复杂性往下拉的又一种方式。',
        ),
      },
      changes: [L('+ TCP resends lost packets itself', '+ TCP 自己重发丢失的包')],
      metrics: { psdHandlers: 1, psdCallers: justCall },
      scene: {
        entities: {
          ...row(L('app', '应用')),
          mod: mod({ color: 'green', h: 70, glyph: 'refresh', label: ['TCP'], tags: [tag(L('resends inside', '在内部重发'), 'green', 'refresh')] }),
          back: block(0, 12, { s: 4, h: 34, color: 'blue', glyph: 'server', label: [L('Peer', '对端')] }),
        },
        links: { ...fan('mod'), mb: link('mod', 'back', { heads: 'both', fail: 0.35, label: L('packets get lost here', '包会在这里丢失'), labelTone: 'amber', labelAt: 0.5 }) },
        flows: [{ routes: each(['mb']), rate: 2.4, bounce: true }],
      },
    },
    {
      short: L('Aggregate', '聚合'),
      chapter: 'technique',
      title: L('Aggregate exceptions', '聚合异常'),
      body: [
        L(
          'When exceptions must surface, handle many of them in one place. A web server dispatches each URL to a service method, and each service method calls <code>getParameter</code>, which throws if a parameter is missing. Students often wrapped every one of those calls in its own <code>try</code>/<code>catch</code>, each producing the same kind of error response.',
          '当异常不得不冒出来时，就在一个地方处理很多个。Web 服务器把每个 URL 分发给一个服务方法，每个服务方法都会调用 <code>getParameter</code>，参数缺失时它会抛异常。学生们常常给每一处调用都单独包一层 <code>try</code>/<code>catch</code>，而它们生成的都是同一类错误响应。',
        ),
        L(
          'It is better to let the exceptions travel up to the dispatcher and catch them there, once. Each exception carries its own message, such as “parameter ‘quantity’ not present in URL”, and the one top-level handler turns any of them into an error response.',
          '更好的做法是让异常一路向上传到分发器，在那里统一捕获一次。每个异常自带消息，比如“parameter ‘quantity’ not present in URL”，顶层那一个处理器把它们都变成错误响应。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Masking works best low down, in code that many others call. Aggregation works best high up, where one handler can catch exceptions from many methods. Both put the handler where it catches the most.',
          '屏蔽在底层效果最好，也就是在很多代码都会调用的地方。聚合在高层效果最好，一个处理器能接住来自许多方法的异常。两者都是把处理器放在能接住最多异常的位置。',
        ),
      },
      changes: [L('− A try/catch around every getParameter call', '− 每处 getParameter 调用外面的 try/catch'), L('+ One handler in the dispatcher', '+ 分发器里的一个处理器')],
      metrics: { psdHandlers: 1, psdCallers: justCall },
      scene: {
        entities: {
          disp: block(0, -22, { s: 4.2, h: 44, color: 'green', glyph: 'signpost', label: [L('Dispatcher', '分发器')], pills: 'below', tags: [tag(L('one handler', '一个处理器'), 'green', 'shield')] }),
          ...row(L('service', '服务方法')),
          mod: mod({ color: 'yellow', h: 34, glyph: 'braces', label: ['getParameter'], tags: [tag(L('throws NoSuchParameter', '抛出 NoSuchParameter'), 'amber', 'zap')] }),
        },
        links: {
          ...Object.fromEntries(XS.map((_, i) => [`d${i}`, path('disp', `c${i}`, ['disp', ['disp', -17], [`c${i}`, -17], `c${i}`], { heads: 'both' })])),
          ...fan('mod', { fail: 0.3 }),
        },
        flows: [{ routes: XS.map((_, i) => ({ path: [`d${i}`, `l${i}`] })), rate: 2.2, bounce: true }],
      },
    },
    {
      short: L('Just crash', '干脆崩溃'),
      chapter: 'technique',
      title: L('Just crash', '干脆崩溃'),
      body: [
        L(
          'Some errors are not worth handling: they are rare, and there is little a program can do about them. C’s <code>malloc</code> returns <code>NULL</code> when memory runs out, which assumes that every caller checks. Applications call it in countless places. Forget one check, and the program later dereferences a null pointer, which hides the real cause.',
          '有些错误不值得处理：它们很少发生，程序对它们也无能为力。C 的 <code>malloc</code> 在内存耗尽时返回 <code>NULL</code>，这等于假定每个调用方都会检查返回值。应用程序里调用它的地方数不胜数。漏掉一处检查，程序之后就会解引用空指针，把真正的原因掩盖掉。',
        ),
        L(
          'A simpler approach is a wrapper, <code>ckalloc</code>, that calls <code>malloc</code>, checks the result, and aborts with a clear message if memory is exhausted. The application always calls <code>ckalloc</code>.',
          '更简单的做法是写一个包装函数 <code>ckalloc</code>：它调用 <code>malloc</code>，检查结果，内存耗尽时打印清楚的错误信息并终止程序。应用程序一律调用 <code>ckalloc</code>。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'Whether crashing is acceptable depends on the application. A replicated storage system must not abort on an I/O error: recovering from it is the value the system provides.',
          '崩溃能不能接受，取决于具体的应用。带副本的存储系统不能因为一次 I/O 错误就终止：从错误中恢复正是它提供的价值。',
        ),
      },
      changes: [L('+ ckalloc: check once, abort with a clear message', '+ ckalloc：只检查一次，出错时给出清楚的信息并终止')],
      metrics: { psdHandlers: 1, psdCallers: justCall },
      scene: {
        entities: {
          ...row(L('caller', '调用方')),
          mod: mod({ color: 'green', glyph: 'shield', label: ['ckalloc'], tags: [tag(L('no memory? say so and abort', '没内存了？说清楚，然后终止'), 'green', 'power')] }),
          back: block(0, 11, { s: 3.8, h: 30, color: 'yellow', glyph: 'cpu', label: ['malloc'] }),
          card: panel(
            L('Out of memory', '内存耗尽时'),
            [
              L('malloc    returns NULL', 'malloc    返回 NULL'),
              L('! every caller has to remember to check', '! 每个调用方都得记得检查'),
              L('= ckalloc checks in one place', '= ckalloc 只在一个地方检查'),
            ],
            'cpu',
          ),
        },
        links: { ...fan('mod'), mb: link('mod', 'back', { heads: 'both' }) },
        flows: [{ routes: each(['mb']), rate: 2.2, bounce: true }],
      },
    },
    {
      short: L('Too far', '过头了'),
      chapter: 'tradeoff',
      title: L('Taking it too far', '做过头了'),
      body: [
        L(
          'Defining an exception away, or masking it, only makes sense when the information is not needed outside the module.',
          '把异常定义掉，或者把它屏蔽掉，前提是模块外部并不需要这份信息。',
        ),
        L(
          'One student team’s network module masked <em>every</em> network exception: it caught the error, discarded it, and carried on as if nothing had happened. Applications had no way to find out that messages were lost or that a peer had failed, so robust applications could not be built on it.',
          '有个学生团队的网络模块把<em>所有</em>网络异常都屏蔽了：捕获错误、丢掉它，然后像什么都没发生一样继续运行。应用程序没有任何办法知道消息丢了、对端挂了，也就没法在它上面构建健壮的应用。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Decide what is important and what is not. What is not important should be hidden, and the more of it the better. What is important must be exposed.',
          '要判断什么重要、什么不重要。不重要的东西应该藏起来，藏得越多越好。重要的东西必须暴露出来。',
        ),
      },
      changes: [L('~ The network module swallows every error', '~ 网络模块吞掉了所有错误')],
      metrics: { psdHandlers: 0, psdCallers: L('guess whether it worked', '只能猜成没成功') },
      scene: {
        entities: {
          ...row(L('app', '应用'), handler(L('did it arrive?', '送到了吗？'), 'amber')),
          mod: mod({ color: 'orange', glyph: 'eyeOff', label: LL(['Network', 'module'], ['网络', '模块']), tags: [tag(L('catches every error, drops it', '捕获所有错误，然后丢掉'), 'red', 'eyeOff')] }),
          back: block(0, 12, { s: 4, h: 34, color: 'blue', glyph: 'server', label: [L('Peer', '对端')], dead: 1, tags: [tag(L('down', '已宕机'), 'red', 'power')] }),
        },
        links: { ...fan('mod'), mb: link('mod', 'back', { fail: 1 }) },
        flows: [{ routes: each(['mb']), rate: 2.2 }],
      },
    },
    {
      short: L('Recap', '回顾'),
      chapter: 'recap',
      title: L('Recap', '回顾'),
      body: [
        L(
          `<ul class="takeaways">
          <li>Exception handling is one of the worst sources of complexity: handlers are hard to write and rarely tested.</li>
          <li>The goal is <b>fewer places</b> where exceptions have to be handled.</li>
          <li><b>Define errors out of existence</b>: choose a definition whose normal case covers everything.</li>
          <li><b>Mask</b> exceptions low down, and <b>aggregate</b> the rest in one handler high up.</li>
          <li>For rare errors that nothing can fix, <b>crash</b> with a clear message.</li>
          <li>Never hide an error that callers need to know about.</li>
        </ul>`,
          `<ul class="takeaways">
          <li>异常处理是复杂性最糟糕的来源之一：处理代码难写，又很少被测试。</li>
          <li>目标是让必须处理异常的<b>地方更少</b>。</li>
          <li><b>通过定义消除错误</b>：选一种定义，让正常情况覆盖所有情形。</li>
          <li>在底层<b>屏蔽</b>异常，其余的在高层用一个处理器<b>聚合</b>处理。</li>
          <li>对那些罕见又无法补救的错误，给出清楚的信息后<b>直接崩溃</b>。</li>
          <li>调用方需要知道的错误，绝不能藏起来。</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>Design It Twice</b>. Your first idea is rarely the best one. A cheap habit that makes every design in this module better.',
          '下一课：<b>设计两次</b>。第一个想到的方案很少是最好的。一个成本很低的习惯，能让这个模块里讲到的每一种设计都变得更好。',
        ),
      },
      metrics: calm,
      scene: callersAnd({ modO: { color: 'green', label: [L('Module', '模块')] } }),
    },
  ],
};
