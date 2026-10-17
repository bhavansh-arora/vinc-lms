// All Kaushal Bodh courses in one place. Views look projects up here, whatever the grade.
import { GRADE6 } from './grade6.js';
import { GRADE7 } from './grade7.js';
import { GRADE8 } from './grade8.js';

export { FORMS, WEIGHTS, LEARNING_OUTCOMES, VIVA_RUBRIC, OBSERVATION_RUBRIC, RUBRIC_LEVELS } from './grade6.js';

export const COURSES = { 6: GRADE6, 7: GRADE7, 8: GRADE8 };
export const GRADES = [6, 7, 8];
export const ALL_PROJECTS = GRADES.flatMap(g => COURSES[g].projects.map(p => Object.assign(p, { grade: g })));
const BY_ID = Object.fromEntries(ALL_PROJECTS.map(p => [p.id, p]));

export const projectById = id => BY_ID[id];
export const course = g => COURSES[g] || COURSES[6];
export const projectsOfGrade = g => course(g).projects;
