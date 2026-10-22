// All Kaushal Bodh courses in one place. Views look projects up here, whatever the grade.
// In Hindi the same courses come from data/hi/ (same ids, numbers and structure; only the text differs).
import { isHi } from '../i18n.js';

const pick = async n => {
  if (isHi()) { try { return await import(`./hi/grade${n}.js`); } catch (e) { console.error(`Hindi Grade ${n} course missing; using English.`, e); } }
  return import(`./grade${n}.js`);
};
const [M6, M7, M8] = await Promise.all([pick(6), pick(7), pick(8)]);
const { GRADE6 } = M6, { GRADE7 } = M7, { GRADE8 } = M8;

export const { FORMS, WEIGHTS, LEARNING_OUTCOMES, VIVA_RUBRIC, OBSERVATION_RUBRIC, RUBRIC_LEVELS } = M6;

export const COURSES = { 6: GRADE6, 7: GRADE7, 8: GRADE8 };
export const GRADES = [6, 7, 8];
export const ALL_PROJECTS = GRADES.flatMap(g => COURSES[g].projects.map(p => Object.assign(p, { grade: g })));
const BY_ID = Object.fromEntries(ALL_PROJECTS.map(p => [p.id, p]));

export const projectById = id => BY_ID[id];
export const course = g => COURSES[g] || COURSES[6];
export const projectsOfGrade = g => course(g).projects;
