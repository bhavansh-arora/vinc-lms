// Hindi text for VINC Lab, one file per part of the site. Each file exports
//   default: { 'English text': 'हिंदी पाठ', ... }   and optionally
//   patterns: [[/regex on the English text/, 'हिंदी with $1'], ...]
import landing, { patterns as pLanding } from './landing.js';
import app, { patterns as pApp } from './app.js';
import student, { patterns as pStudent } from './student.js';
import staff, { patterns as pStaff } from './staff.js';
import lab, { patterns as pLab } from './lab.js';
import labTypes, { patterns as pLabTypes } from './lab-types.js';
import titles from './data.js';

export { titles };

export const strings = Object.assign({}, titles, landing, app, student, staff, lab, labTypes);
export const patterns = [...(pApp || []), ...(pStaff || []), ...(pStudent || []), ...(pLanding || []), ...(pLab || []), ...(pLabTypes || [])];
