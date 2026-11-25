// HUD chips for the extra lessons. Keys are prefixed so they never collide with the site's own.
// Levels are looked up by the English value: the site grades a chip before translating it.

import { L, chip, count } from './kit.js';

const fewer = (good, warn) => (v) => (v <= good ? 'good' : v <= warn ? 'warn' : 'bad');

export default {
  // complexity
  psdEdits: count(L('Places to edit', '要改的地方'), 'code', fewer(1, 2)),
  psdLoad: chip(L('To keep in mind', '要记在脑子里的'), 'layers', { 'a lot': 'bad', 'very little': 'good' }),
  psdUnknown: chip(L('Unknown unknowns', '未知的未知'), 'eyeOff', { none: 'good', '1 hidden': 'bad' }),

  // strategic vs. tactical
  psdTacShip: count(L('Tactical: shipped', '战术式：已上线'), 'zap'),
  psdStrShip: count(L('Strategic: shipped', '战略式：已上线'), 'target'),
  psdMess: chip(L('Tactical codebase', '战术式代码库'), 'code', {
    clean: 'good',
    'a few shortcuts': 'warn',
    'patched all over': 'bad',
    'a mess': 'bad',
  }),

  // deep modules
  psdIface: chip(L('Interface to learn', '要学的接口'), 'eye', {
    '5 calls': 'good',
    '1 call': 'good',
    'as much as the code': 'bad',
    '3 classes to wire up': 'bad',
  }),
  psdInside: chip(L('Hidden inside', '藏在里面的'), 'eyeOff', { 'a great deal': 'good', 'almost nothing': 'bad', 'a little each': 'warn' }),
  psdDepth: chip(L('Depth', '深度'), 'layers', { deep: 'good', shallow: 'bad' }),

  // information hiding
  psdKnowers: chip(L('Who knows the secret', '谁知道这个秘密'), 'key', { 'one class': 'good', 'two classes': 'bad', 'every caller': 'bad' }),
  psdLeak: chip(L('Leakage', '泄漏'), 'eye', { none: 'good', 'back door': 'bad', 'through the interface': 'bad' }),
  psdCaller: chip(L('Caller’s work', '调用方要做的'), 'user', {
    'one call': 'good',
    'status and body': 'good',
    'two calls, in order': 'bad',
    'unpack the Map': 'bad',
  }),

  // general-purpose modules
  psdDelMethods: count(L('Methods that delete text', '删除文本的方法'), 'braces', fewer(1, 2)),
  psdUiLeak: chip(L('UI ideas in the text class', '文本类里的界面概念'), 'eye', { none: 'good', 'cursor, selection, keys': 'bad' }),
  psdNewFeature: chip(L('A new UI feature needs', '加一个界面功能需要'), 'sparkles', {
    'no change to the text class': 'good',
    'a new text method': 'bad',
    'a loop in the UI': 'warn',
  }),

  // layers and abstractions
  psdDup: chip(L('Repeated across layers', '跨层重复的东西'), 'layers', {
    nothing: 'good',
    '13 of 15 methods': 'bad',
    'lines, inside and out': 'bad',
    'cert, in every signature': 'bad',
  }),
  psdBurden: chip(L('Who carries the complexity', '复杂性由谁承担'), 'scale', {
    'each layer, its own part': 'good',
    'one class per job': 'good',
    'the text class': 'good',
    'main and m3 only': 'good',
    'the protocol itself': 'good',
    'two classes for one job': 'bad',
    'the UI code': 'bad',
    'every method on the path': 'bad',
  }),

  // define errors out of existence
  psdHandlers: count(L('Places that handle the error', '处理这个错误的地方'), 'shield', fewer(1, 2)),
  psdCallers: chip(L('What callers do', '调用方怎么做'), 'user', {
    'just call it': 'good',
    'wrap every call': 'bad',
    'catch and ignore': 'bad',
    'guess whether it worked': 'bad',
  }),

  // design it twice
  psdDesigns: count(L('Designs considered', '考虑过的设计'), 'layers', (v) => (v >= 2 ? 'good' : 'bad')),
  psdPick: chip(L('Design chosen', '选定的方案'), 'target', { 'the first idea': 'bad', 'the best of three': 'good' }),

  // comments and names
  psdWritten: chip(L('Design knowledge written down', '写下来的设计知识'), 'scroll', {
    none: 'bad',
    'hidden behind a vague name': 'bad',
    'the details': 'good',
    'details and intent': 'good',
    'the whole interface': 'good',
    'all of it, before the code': 'good',
    'in the names too': 'good',
    'in comments and names': 'good',
  }),
  psdReader: chip(L('The next developer', '下一位开发者'), 'userRound', {
    'has to guess': 'bad',
    'learns nothing new': 'bad',
    'assumes the wrong meaning': 'bad',
    'knows the units and limits': 'good',
    'knows what the code is for': 'good',
    'can call it without reading it': 'good',
    'gets comments that are finished': 'good',
    'knows which block it is': 'good',
    'understands it quickly': 'good',
  }),
};
