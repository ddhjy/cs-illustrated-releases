// Extra subjects & modules — starting with John Ousterhout's "A Philosophy of Software Design".
// The patched bundle (tools/patch-bundle.mjs) imports this file and splices the exports
// into the course list, the lesson registry, the HUD chips and the translation lookup.

import { L, zh } from './kit.js';
import metricDefs from './metrics.js';
import complexity from './lessons/complexity.js';
import strategic from './lessons/strategic.js';
import deepModules from './lessons/deep-modules.js';
import informationHiding from './lessons/information-hiding.js';
import generalPurpose from './lessons/general-purpose.js';
import layers from './lessons/layers.js';
import errors from './lessons/errors.js';
import designTwice from './lessons/design-twice.js';
import commentsNames from './lessons/comments-names.js';

export { prepare, tree, syncTree, crumb, mount } from './shell.js';

const list = [complexity, strategic, deepModules, informationHiding, generalPurpose, layers, errors, designTwice, commentsNames];
const pick = (items) => items.map(({ id, title }) => ({ id, title }));

const psd = { subject: L('Philosophy of Software Design', '软件设计哲学'), subjectId: 'software-design' };

// The title-bar suffix after each lesson name.
L('CS Illustrated', '图解计算机');

export const modules = [
  {
    id: 'psd-foundations',
    ...psd,
    num: '01',
    title: L('Complexity & Strategy', '复杂性与战略'),
    color: 'cocoa',
    lessons: pick([complexity, strategic, deepModules]),
  },
  {
    id: 'psd-abstractions',
    ...psd,
    num: '02',
    title: L('Hiding & Abstraction', '隐藏与抽象'),
    color: 'amber',
    lessons: pick([informationHiding, generalPurpose, layers]),
  },
  {
    id: 'psd-craft',
    ...psd,
    num: '03',
    title: L('Errors, Design & Naming', '容错、设计与命名'),
    color: 'indigo',
    lessons: pick([errors, designTwice, commentsNames]),
  },
];

export const lessons = Object.fromEntries(list.map((lesson) => [lesson.id, lesson]));

export const metrics = metricDefs;

// Only Simplified Chinese is written; every other language shows these lessons in English.
export const dict = (lang) => (lang === 'zh-Hans' ? zh : {});
