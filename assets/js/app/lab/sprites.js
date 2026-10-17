// Sprite library for the virtual labs. Every sprite is drawn in a 100x100 box and returned as an
// inline <svg>. The drawings live in sprites-life.js, sprites-make.js and sprites-people.js;
// this file merges them and draws the lab mascot, Vinci.
import { SPRITES as LIFE } from './sprites-life.js';
import { SPRITES as MAKE } from './sprites-make.js';
import { SPRITES as PEOPLE } from './sprites-people.js';

const MASCOT = `
  <ellipse cx="50" cy="92" rx="24" ry="5" fill="#000" opacity=".12"/>
  <path d="M50 8v10" stroke="#9A5B0A" stroke-width="4" stroke-linecap="round"/>
  <circle cx="50" cy="8" r="5" fill="#F0B44C"/>
  <rect x="18" y="18" width="64" height="58" rx="26" fill="#D98A1C"/>
  <rect x="18" y="18" width="64" height="58" rx="26" fill="url(#vinci-sheen)"/>
  <rect x="26" y="30" width="48" height="30" rx="15" fill="#FFF7EA"/>
  <g class="spr-blink"><ellipse cx="40" cy="45" rx="5" ry="6" fill="#2B1A10"/><ellipse cx="60" cy="45" rx="5" ry="6" fill="#2B1A10"/>
  <circle cx="42" cy="43" r="1.6" fill="#fff"/><circle cx="62" cy="43" r="1.6" fill="#fff"/></g>
  <path d="M43 54q7 5 14 0" stroke="#2B1A10" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="31" cy="55" r="4" fill="#F3A07A" opacity=".7"/><circle cx="69" cy="55" r="4" fill="#F3A07A" opacity=".7"/>
  <rect x="34" y="74" width="32" height="12" rx="6" fill="#1F6F66"/>
  <path d="M18 50q-10 4-8 16M82 50q10 4 8 16" stroke="#9A5B0A" stroke-width="6" fill="none" stroke-linecap="round"/>
  <defs><linearGradient id="vinci-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;

export const SPRITES = { ...LIFE, ...MAKE, ...PEOPLE, mascot: MASCOT };
export const hasSprite = name => Object.prototype.hasOwnProperty.call(SPRITES, name);
export const spriteNames = () => Object.keys(SPRITES);

/** <svg> markup for a sprite. opts: { size (px), cls, title } */
export function sprite(name, opts = {}) {
  const body = SPRITES[name];
  if (!body) return '';
  const size = opts.size ? ` width="${opts.size}" height="${opts.size}"` : '';
  const label = opts.title ? ` role="img" aria-label="${String(opts.title).replace(/"/g, '&quot;')}"` : ' aria-hidden="true"';
  return `<svg class="spr spr-${name} ${opts.cls || ''}" viewBox="0 0 100 100"${size}${label}>${body}</svg>`;
}
