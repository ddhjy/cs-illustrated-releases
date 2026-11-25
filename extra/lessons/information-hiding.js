// Lesson 4 — Information Hiding and Leakage (A Philosophy of Software Design, ch. 5)
//
// The running example is the book's: students building the HTTP part of a small web server.
// Requests travel up the middle lane; from step 7 responses come back down a second lane.

import { L, LL, block, crowd, ghost, link, panel, path, store, tag } from '../kit.js';

const MID = -2;
const SIDE = 9;

const net = () => crowd({ x0: -2.6, x1: 2.6, y0: -21, y1: -17 }, 5, L('browsers', '浏览器'));
const app = (o = {}) => block(0, 14, { s: 4.2, h: 34, color: 'blue', glyph: 'server', label: LL(['Server', 'code'], ['服务器', '代码']), ...o });
const small = (y, glyph, name, o = {}) => block(0, y, { s: 3.6, h: 26, color: 'orange', glyph, label: [name], ...o });
const request = (o = {}) => block(0, MID, { s: 4, h: 66, color: 'green', glyph: 'lock', label: ['HttpRequest'], ...o });
const format = () => store(SIDE, MID, { label: L('HTTP format', 'HTTP 格式'), glyph: 'scroll' });
const params = (o = {}) => store(SIDE, MID, { label: 'params: Map', glyph: 'database', ...o });
const response = (o = {}) => block(-SIDE, MID, { s: 4, h: 50, color: 'green', glyph: 'send', label: ['HttpResponse'], ...o });

const knows = (to, o = {}) => link('fmt', to, { heads: 'none', style: 'dashed', ...o });
const arrive = (to) => link('net', to);
const ask = (label, o = {}) => link('app', 'req', { heads: 'both', ...(label ? { label, labelAt: 0.5 } : {}), ...o });

const returnLane = {
  ar: path('app', 'resp', ['app', [-SIDE, 'app'], 'resp']),
  rn: path('resp', 'net', ['resp', [-SIDE, 'net'], 'net']),
};

// Two classes, one per phase.
const splitScene = ({ card, changing = false } = {}) => {
  const hot = changing ? { heat: 0.8 } : {};
  const mark = (text) => [tag(text, 'red', changing ? 'alert' : 'eye')];
  const label = changing ? L('must change', '必须修改') : L('knows the format', '知道格式');
  return {
    entities: {
      net: net(),
      req: small(-8, 'scan', 'HttpReader', { ...hot, tags: mark(label), pills: 'below' }),
      parser: small(3, 'braces', 'HttpParser', { ...hot, tags: mark(label) }),
      app: app(),
      fmt: format(),
      ...(card ? { card } : {}),
    },
    links: {
      c: arrive('req'),
      rp: link('req', 'parser'),
      pa: link('parser', 'app'),
      k1: knows('req'),
      k2: knows('parser'),
    },
    flows: [
      { route: ['c', 'rp', 'pa'], rate: 1.2 },
      ...(changing ? [{ fanout: true, routes: [{ path: ['k1'] }, { path: ['k2'] }], kind: 'write', rate: 0.6 }] : []),
    ],
  };
};

// One class; `side` is whatever sits beside it (the format it owns, or its parameter map).
const oneScene = ({ reqO, side, links = {}, flows = [], card, extra = {} } = {}) => ({
  entities: { net: net(), req: request(reqO), app: app(), ...(side || {}), ...extra, ...(card ? { card } : {}) },
  links: { c: arrive('req'), ...links },
  flows: [{ route: ['c'], rate: 1.1 }, ...flows],
});

const two = L('two classes', '两个类');
const oneClass = L('one class', '一个类');
const everyone = L('every caller', '每个调用方');
const none = L('none', '没有');
const backDoor = L('back door', '走后门');
const viaApi = L('through the interface', '通过接口');
const oneCall = L('one call', '一次调用');
const twoCalls = L('two calls, in order', '两次调用，还要按顺序');
const unpack = L('unpack the Map', '自己拆 Map');
const little = L('status and body', '状态码和正文');

const hidden = { psdKnowers: oneClass, psdLeak: none, psdCaller: oneCall };

export default {
  id: 'psd-information-hiding',
  title: L('Information Hiding', '信息隐藏'),
  summary: L(
    'Deep modules come from hiding design decisions. See how knowledge leaks between classes in a small HTTP server, and how to keep it in one place.',
    '深模块来自对设计决策的隐藏。用一个小型 HTTP 服务器看看知识是怎么在类之间泄漏的，又该怎么把它留在一个地方。',
  ),
  minutes: 10,
  level: 'intermediate',
  metrics: ['psdKnowers', 'psdLeak', 'psdCaller'],
  legend: [
    ['req', L('request', '请求')],
    ['res', L('response', '响应')],
    ['write', L('change', '改动')],
  ],
  goals: [
    { text: L('What information hiding buys you', '信息隐藏能带来什么'), step: 0 },
    { text: L('Information leakage and temporal decomposition', '信息泄漏与时间分解'), step: 2 },
    { text: L('Keeping internal data structures out of the interface', '不让内部数据结构出现在接口里'), step: 5 },
    { text: L('Where hiding should stop', '隐藏应该到哪里为止'), step: 7 },
  ],
  steps: [
    {
      short: L('A secret', '一个秘密'),
      chapter: 'setup',
      title: L('Every module keeps a secret', '每个模块都守着一个秘密'),
      body: [
        L(
          'The most important technique for making modules deep is <span class="term">information hiding</span>. Each module holds a few pieces of knowledge, which are design decisions, inside its implementation. They do not appear in its interface.',
          '让模块变深，最重要的技术是<span class="term">信息隐藏</span>。每个模块把几项知识（也就是设计决策）装在自己的实现里，它们不会出现在接口上。',
        ),
        L(
          'This pays twice. The interface gets simpler, so callers have less to learn. And the system gets easier to change: a decision known in one place can be changed in one place.',
          '这有两重好处。接口变简单了，调用方要学的更少。系统也更容易修改：只有一个地方知道的决策，只需要在一个地方改。',
        ),
        L(
          'The example in this lesson is from the book: a small web server needs a module that receives HTTP requests. What should that module keep to itself?',
          '这一课的例子来自书中：一个小型 Web 服务器需要一个接收 HTTP 请求的模块。这个模块应该把什么留给自己？',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'Hidden information is usually about <em>how</em>: a data structure, a file format, an algorithm, a detail of a protocol.',
          '被隐藏的信息通常是关于<em>怎么做</em>的：一种数据结构、一种文件格式、一个算法、协议的某个细节。',
        ),
      },
      metrics: { psdKnowers: '—', psdLeak: '—', psdCaller: '—' },
      scene: {
        entities: {
          net: net(),
          draft: ghost(0, MID, 4, 60, L('HTTP module?', 'HTTP 模块？')),
          app: app(),
          card: panel(
            L('Knowledge to hide', '要藏起来的知识'),
            [
              L('how a request is laid out', '请求的格式是怎样的'),
              L('where a request ends', '一个请求到哪里结束'),
              L('how parameter values are encoded', '参数值是如何编码的'),
              L('how parameters are stored', '参数是如何存储的'),
            ],
            'lock',
          ),
        },
        links: { c: link('net', 'app') },
        flows: [{ route: ['c'], rate: 1.1 }],
      },
    },
    {
      short: L('Read, then parse', '先读再解析'),
      chapter: 'problem',
      title: L('Splitting by the order things happen', '按事情发生的先后来拆分'),
      body: [
        L(
          'A natural first design follows the order of events: first read the request from the network, then parse it. That gives two classes, <code>HttpReader</code> and <code>HttpParser</code>.',
          '很自然的第一版设计，是照着事情发生的顺序来：先从网络上读出请求，再解析它。于是有了两个类：<code>HttpReader</code> 和 <code>HttpParser</code>。',
        ),
        L(
          'But a request cannot be read without parsing it. The <code>Content-Length</code> header gives the length of the body, so the reader must parse the headers to find where the request ends. Both classes end up understanding the format, and parsing code is written twice. Callers have to invoke two methods in two classes, in the right order.',
          '但不解析就没法把请求读完整。<code>Content-Length</code> 头给出了正文的长度，所以读取类必须先解析请求头，才知道请求在哪里结束。结果两个类都得懂这种格式，解析代码写了两遍。调用方还得按正确的顺序，调用两个类里的两个方法。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'This is <span class="term">temporal decomposition</span>: structuring code by <em>when</em> things happen. The order of operations is on your mind while you code, which makes it an easy trap.',
          '这就是<span class="term">时间分解</span>：按事情<em>发生的时间</em>来组织代码。写代码时脑子里想的正是操作的先后顺序，所以很容易掉进这个陷阱。',
        ),
      },
      changes: [L('+ HttpReader: reads the request off the network', '+ HttpReader：从网络读出请求'), L('+ HttpParser: parses the text', '+ HttpParser：解析文本')],
      metrics: { psdKnowers: two, psdLeak: backDoor, psdCaller: twoCalls },
      scene: splitScene({
        card: panel(
          L('One request', '一个请求'),
          [
            'POST /comments/create?photo_id=246 HTTP/1.1',
            L('**Content-Length: 38**   ← where the body ends', '**Content-Length: 38**   ← 正文到哪里结束'),
            L('# (empty line)', '# （空行）'),
            'comment=What+a+cute+baby%21&priority=1',
          ],
          'scroll',
        ),
      }),
    },
    {
      short: L('Leakage', '泄漏'),
      chapter: 'problem',
      title: L('Information leakage', '信息泄漏'),
      body: [
        L(
          '<span class="term">Information leakage</span> is the opposite of hiding: one design decision is reflected in several modules. That makes them depend on each other. Change the decision, and every one of them has to change.',
          '<span class="term">信息泄漏</span>是隐藏的反面：同一个设计决策体现在多个模块里。这让它们彼此依赖。决策一变，每一个都得跟着改。',
        ),
        L(
          'This leak goes through the <b>back door</b>. Neither class mentions the HTTP format in its interface, yet both depend on it. That is worse than a leak through an interface, because nothing in the code shows it.',
          '这种泄漏是<b>走后门</b>的。两个类的接口里都没有提到 HTTP 格式，却都依赖它。这比通过接口泄漏更糟，因为代码里没有任何地方把它显示出来。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          '<b>Red flag: Information Leakage.</b> When the same knowledge shows up in two places, ask: how can I reorganize these classes so it affects only one?',
          '<b>危险信号：信息泄漏。</b>当同一项知识出现在两个地方时，问问自己：怎样重新组织这些类，才能让它只影响其中一个？',
        ),
      },
      changes: [L('~ The format changes: two classes to edit', '~ 格式变了：要改两个类')],
      metrics: { psdKnowers: two, psdLeak: backDoor, psdCaller: twoCalls },
      scene: splitScene({
        changing: true,
        card: panel(
          L('One decision, two homes', '一个决策，两个落脚点'),
          [
            L('HttpReader   finds the end of the request', 'HttpReader   找出请求在哪里结束'),
            L('HttpParser   splits it into fields', 'HttpParser   把它拆成各个字段'),
            L('! both need to understand the format', '! 两者都得懂这种格式'),
          ],
          'alert',
        ),
      }),
    },
    {
      short: L('Merge', '合并'),
      chapter: 'solution',
      title: L('One class owns the knowledge', '让一个类拥有这项知识'),
      body: [
        L(
          'The two classes are small and tied to the same knowledge, so merge them. One <code>HttpRequest</code> class reads and parses. The format now lives in exactly one place.',
          '这两个类都很小，又都绑在同一项知识上，所以把它们合并。由一个 <code>HttpRequest</code> 类同时负责读取和解析。现在，格式只存在于一个地方。',
        ),
        L(
          'The class got bigger and the design got simpler. Callers make one call instead of two. Information hiding can often be improved by making a class <b>slightly larger</b>.',
          '类变大了，设计却变简单了。调用方只需要一次调用，而不是两次。把类做得<b>稍微大一点</b>，往往能改善信息隐藏。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'When you split a system into modules, do not follow the order of operations. Think about the pieces of knowledge the job needs, and give each one a single home.',
          '把系统拆分成模块时，不要跟着操作的顺序走。想一想完成这件事需要哪些知识，给每一项知识安排唯一的归宿。',
        ),
      },
      changes: [L('− HttpReader and HttpParser', '− HttpReader 和 HttpParser'), L('+ HttpRequest: reads and parses', '+ HttpRequest：读取并解析')],
      metrics: hidden,
      scene: oneScene({
        reqO: { tags: [tag(L('the only one that knows', '只有它知道'), 'green', 'check')] },
        side: { fmt: format() },
        links: { k1: knows('req'), ra: link('req', 'app') },
        flows: [{ route: ['ra'], rate: 1.1 }],
      }),
    },
    {
      short: L('getParams()', 'getParams()'),
      chapter: 'problem',
      title: L('Handing out the internals', '把内部结构交了出去'),
      body: [
        L(
          'Next, the server code needs the parameters of a request. Many projects gave <code>HttpRequest</code> a single method for this: <code>getParams()</code>, which returns the <code>Map</code> the class uses internally.',
          '接下来，服务器代码需要拿到请求里的参数。很多项目给 <code>HttpRequest</code> 提供了唯一的一个方法：<code>getParams()</code>，它返回这个类内部使用的那个 <code>Map</code>。',
        ),
        L(
          'Now the way parameters are stored is part of the interface. Change the representation and every caller breaks. Callers also do more work: fetch the Map, then look up the value. And they must know not to modify it, because it is the request’s own state.',
          '这样一来，参数的存储方式就成了接口的一部分。存储方式一改，所有调用方都会出问题。调用方的活也更多了：先拿到 Map，再去查值。它们还得知道不能修改这个 Map，因为那是请求自己的内部状态。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          'This is a leak through the interface. The method is shallow: it hides nothing about how parameters are kept.',
          '这是通过接口发生的泄漏。这个方法很浅：关于参数如何保存，它什么也没藏住。',
        ),
      },
      changes: [L('+ getParams() returns the internal Map', '+ getParams() 返回内部的 Map')],
      metrics: { psdKnowers: everyone, psdLeak: viaApi, psdCaller: unpack },
      scene: oneScene({
        side: { map: params({ tags: [tag(L('exposed', '暴露了'), 'red', 'eye')] }) },
        links: {
          aq: ask('getParams()'),
          rm: link('req', 'map', { heads: 'none', style: 'dashed' }),
          leak: path('app', 'map', ['app', [SIDE, 'app'], 'map'], { label: L('callers hold the Map', '调用方直接拿着 Map'), labelTone: 'red', labelAt: 0.6 }),
        },
        flows: [
          { route: ['aq'], rate: 0.8, bounce: true },
          { route: ['leak'], kind: 'write', rate: 0.8 },
        ],
        card: panel(L('The whole method', '整个方法'), ['public Map<String, String> getParams() {', '    return this.params;', '}'], 'braces'),
      }),
    },
    {
      short: L('getParameter()', 'getParameter()'),
      chapter: 'solution',
      title: L('Ask for what you need', '要什么，就问什么'),
      body: [
        L(
          'A better interface: <code>getParameter(name)</code> returns one value as a string, and <code>getIntParameter(name)</code> returns it as an integer. The Map is no longer visible, so it is free to change.',
          '更好的接口是：<code>getParameter(name)</code> 以字符串形式返回一个值，<code>getIntParameter(name)</code> 以整数形式返回。Map 不再对外可见，可以随意修改。',
        ),
        L(
          'The module hides more than storage. Parameters can arrive in the URL or in the body; callers do not care which, so the module merges them. Values arrive URL-encoded; the module decodes them, and the caller gets <code>What a cute baby!</code>, not <code>What+a+cute+baby%21</code>.',
          '这个模块藏起来的不只是存储方式。参数可能在 URL 里，也可能在正文里；调用方并不关心是哪一种，所以模块把它们合在一起。参数值到达时是 URL 编码的；模块负责解码，调用方拿到的是 <code>What a cute baby!</code>，而不是 <code>What+a+cute+baby%21</code>。',
        ),
      ],
      callout: {
        kind: 'tip',
        text: L(
          'Each thing a module hides is one thing fewer for every caller to know and to get right.',
          '模块每多藏住一样东西，每个调用方要了解、要做对的事情就少一样。',
        ),
      },
      changes: [L('− getParams()', '− getParams()'), L('+ getParameter(name), getIntParameter(name)', '+ getParameter(name)、getIntParameter(name)')],
      metrics: hidden,
      scene: oneScene({
        side: { map: params({ tags: [tag(L('internal', '内部'), 'green', 'lock')] }) },
        links: { aq: ask('getParameter("comment")'), rm: link('req', 'map', { heads: 'both', style: 'dashed' }) },
        flows: [{ route: ['aq', 'rm'], rate: 0.9, bounce: true }],
        card: panel(
          L('Hidden by the module', '模块藏起来的'),
          [
            L('URL or body        merged', 'URL 还是正文   已合并'),
            L('URL encoding       decoded', 'URL 编码      已解码'),
            L('string → integer   getIntParameter', '字符串 → 整数   getIntParameter'),
            L('= "What+a+cute+baby%21" → "What a cute baby!"', '= "What+a+cute+baby%21" → "What a cute baby!"'),
          ],
          'eyeOff',
        ),
      }),
    },
    {
      short: L('Defaults', '默认值'),
      chapter: 'technique',
      title: L('Defaults hide things too', '默认值也是一种隐藏'),
      body: [
        L(
          'Responses travel the other way. Every HTTP response has to state a protocol version, and one team made callers pass it in when creating a response object.',
          '响应走的是相反的方向。每个 HTTP 响应都必须写明协议版本，有一个团队要求调用方在创建响应对象时把它传进来。',
        ),
        L(
          'But the version must match the one in the request, and the library already has the request. A caller is unlikely to know the right value. The library should fill it in, and the <code>Date</code> header as well.',
          '可是这个版本必须和请求里的一致，而库本来就拿着请求。调用方多半不知道该填什么。这应该由库自己填上，<code>Date</code> 头也一样。',
        ),
      ],
      callout: {
        kind: 'warn',
        text: L(
          '<b>Red flag: Overexposure.</b> If using a common feature forces callers to learn about rarely used ones, the interface exposes too much.',
          '<b>危险信号：过度暴露。</b>如果使用一个常用功能，却迫使调用方去了解那些很少用到的功能，这个接口就暴露得太多了。',
        ),
      },
      changes: [L('+ HttpResponse fills in the version and the date', '+ HttpResponse 自动填上版本和日期')],
      metrics: { psdKnowers: oneClass, psdLeak: none, psdCaller: little },
      scene: oneScene({
        extra: { resp: response({ tags: [tag(L('sensible defaults', '合理的默认值'), 'green', 'check')] }) },
        links: { aq: ask(), ...returnLane },
        flows: [
          { route: ['aq'], rate: 0.8, bounce: true },
          { route: ['ar', 'rn'], kind: 'res', rate: 1 },
        ],
        card: panel(
          L('Who fills in what', '谁来填什么'),
          [
            L('caller    status, body', '调用方   状态码、正文'),
            L('library   HTTP version ← same as the request', '库       HTTP 版本 ← 与请求一致'),
            L('library   Date ← now', '库       Date ← 当前时间'),
          ],
          'listChecks',
        ),
      }),
    },
    {
      short: L('Limits', '边界'),
      chapter: 'tradeoff',
      title: L('Where hiding stops', '隐藏到哪里为止'),
      body: [
        L(
          '<code>private</code> is not the same as hidden. A private variable with a public getter and setter is as exposed as a public one: callers still know that it exists and how it is used.',
          '<code>private</code> 并不等于隐藏。一个带着公开 getter 和 setter 的私有变量，和公开变量一样暴露：调用方照样知道它存在，也知道它是怎么用的。',
        ),
        L(
          'And hiding only makes sense for information that is not needed outside the module. If different uses of a module need different settings for something that affects its performance, that setting belongs in the interface. A module that tunes itself is better still. But what callers really need, they must be able to see.',
          '另外，只有模块外部不需要的信息，才谈得上隐藏。如果某个会影响性能的配置在不同的使用场景下需要不同的取值，它就应该出现在接口里。模块能自己调好当然更好。但调用方真正需要的东西，必须让它们看得到。',
        ),
      ],
      callout: {
        kind: 'insight',
        text: L(
          'The goal is to minimize what is needed outside a module. It is not to hide things that are needed.',
          '目标是尽量减少模块外部需要的信息，而不是把需要的东西藏起来。',
        ),
      },
      metrics: hidden,
      scene: oneScene({
        side: { map: params({ tags: [tag(L('internal', '内部'), 'green', 'lock')] }) },
        links: { aq: ask(), rm: link('req', 'map', { heads: 'both', style: 'dashed' }) },
        flows: [{ route: ['aq', 'rm'], rate: 0.9, bounce: true }],
        card: panel(
          L('Hidden, or not?', '算不算隐藏？'),
          [
            L('! private field + getter and setter: still exposed', '! 私有字段 + getter 和 setter：仍然暴露'),
            L('= callers need it: put it in the interface', '= 调用方需要：放进接口'),
            L('= nobody outside needs it: hide it', '= 外部没人需要：藏起来'),
          ],
          'keyhole',
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
          <li><b>Information hiding</b>: each module keeps a few design decisions inside its implementation.</li>
          <li><b>Information leakage</b>: the same knowledge in several modules. Back-door leaks are the hardest to see.</li>
          <li><b>Temporal decomposition</b> causes leaks. Split by knowledge, not by order of execution.</li>
          <li>A slightly <b>larger class</b> often hides more.</li>
          <li>Keep internal data structures out of interfaces, and supply sensible <b>defaults</b>.</li>
          <li>Hide only what callers do not need.</li>
        </ul>`,
          `<ul class="takeaways">
          <li><b>信息隐藏</b>：每个模块把几项设计决策留在自己的实现里。</li>
          <li><b>信息泄漏</b>：同一项知识出现在多个模块里。走后门的泄漏最难发现。</li>
          <li><b>时间分解</b>会导致泄漏。按知识来拆分，不要按执行顺序。</li>
          <li><b>稍大一点的类</b>往往能藏住更多东西。</li>
          <li>不要让内部数据结构出现在接口里，并提供合理的<b>默认值</b>。</li>
          <li>只隐藏调用方不需要的东西。</li>
        </ul>`,
        ),
      ],
      callout: {
        kind: 'next',
        text: L(
          'Next up: <b>General-Purpose Modules</b>. How general should an interface be? A text editor shows why “somewhat general-purpose” tends to be both simpler and deeper.',
          '下一课：<b>通用模块</b>。接口应该做得多通用？用一个文本编辑器来看看，为什么“有点通用”往往既更简单，也更深。',
        ),
      },
      metrics: hidden,
      scene: oneScene({
        side: { map: params({ tags: [tag(L('internal', '内部'), 'green', 'lock')] }) },
        extra: { resp: response() },
        links: { aq: ask(), rm: link('req', 'map', { heads: 'both', style: 'dashed' }), ...returnLane },
        flows: [
          { route: ['aq', 'rm'], rate: 0.9, bounce: true },
          { route: ['ar', 'rn'], kind: 'res', rate: 1 },
        ],
      }),
    },
  ],
};
