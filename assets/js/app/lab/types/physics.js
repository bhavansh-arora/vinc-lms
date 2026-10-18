// Physics lab: simple machines with real physics (Matter.js), drawn on a canvas.
// Presets: catapult, balloon-car, ramp, lever, pulley, windmill, wheel-axle, propeller-boat.
// Matter.js does the dynamics (gravity, forces, torques, collisions, constraints); we draw every
// body ourselves with gradients and textures (no Matter debug renderer).
//
// Param keys per preset (any subset may be listed in cfg.params; missing ones use defaults):
//   catapult        arm (1–5), angle (pull-back °), load (1 paper · 2 rubber · 3 clay ball), release (launch °), bands (1–4)
//   balloon-car     balloon (1–5 size), mass (1–5), surface (1 tiles · 2 cardboard · 3 carpet)
//   ramp            angle (°), surface (1 glass · 2 wood · 3 sandpaper), load (kg)
//   lever           fulcrum (1–9 position, 1 = next to the load), load (kg), effort (kg)
//   pulley          pulleys (1–4 rope strands holding the load), load (kg)
//   windmill        blade (pitch °), wind (1–5), blades (2–8), load (clips)
//   wheel-axle      wheel (radius 1–5), axle (radius 1–3), load (kg)
//   propeller-boat  twists (rubber-band turns), prop (1–3 size), load (1–5 cargo)
// Goal kinds: hit (land/stop inside target), distance (reach target.x), lift (raise the load),
//   spin (reach goal.value rpm), least-force (succeed with effort <= goal.value newtons; lever: kg).
// Extra config: goal.value (rpm for spin, N for push/pull strength, kg for lever effort), params[].names
//   (labels for discrete slider steps).
import { h, esc } from '../kit.js';

export const meta = { title: 'Machine playground', needs: ['gsap', 'matter'] };

const W = 1000, H = 560, GY = 470, STEP = 1000 / 60, DT2 = STEP * STEP, G = 0.001 * DT2;
const TAU = Math.PI * 2, rad = d => d * Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const r1 = n => Math.round(n * 10) / 10;

/* ================================ drawing helpers ================================ */
function rr(g, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function shadow(g, x, y, rx, ry, a = .18) { g.save(); g.globalAlpha = a; g.fillStyle = '#1b0f05'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.restore(); }
/** A wooden plank / stick: rect centred on the origin (already transformed). */
function wood(g, x, y, w, h, r = 4, base = ['#E2AE6B', '#C98B4A', '#A86B33'], seed = 1) {
  rr(g, x, y, w, h, r); g.fillStyle = lin(g, 0, y, 0, y + h, [[0, base[0]], [.55, base[1]], [1, base[2]]]); g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(110,60,20,.28)'; g.lineWidth = 1.2;
  const n = Math.max(2, Math.round(h / 6));
  for (let i = 0; i < n; i++) {
    const yy = y + (i + .5) * h / n + (rnd(seed + i) - .5) * 2;
    g.beginPath(); g.moveTo(x, yy);
    for (let xx = x; xx <= x + w; xx += 24) g.lineTo(xx, yy + Math.sin(xx * .05 + seed + i) * 1.2);
    g.stroke();
  }
  g.restore(); rr(g, x, y, w, h, r); g.strokeStyle = 'rgba(90,45,12,.55)'; g.lineWidth = 1.5; g.stroke();
}
function cardboard(g, x, y, w, h, r = 3) {
  rr(g, x, y, w, h, r); g.fillStyle = lin(g, 0, y, 0, y + h, [[0, '#D9B27A'], [1, '#B98C52']]); g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(120,80,30,.2)'; g.lineWidth = 1;
  for (let xx = x + 4; xx < x + w; xx += 6) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
  g.restore(); rr(g, x, y, w, h, r); g.strokeStyle = 'rgba(100,60,20,.5)'; g.lineWidth = 1.5; g.stroke();
}
function ballDraw(g, x, y, r, col, ang = 0, kind = 'rubber') {
  shadow(g, x, Math.min(GY + 2, y + r + 2), r * .9, r * .3, .12 * clamp(1 - (GY - y) / 300, 0, 1));
  g.save(); g.translate(x, y); g.rotate(ang);
  const gr = g.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r);
  gr.addColorStop(0, '#fff'); gr.addColorStop(.25, col); gr.addColorStop(1, shade(col, -.35));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(40,20,5,.35)'; g.lineWidth = 1; g.stroke();
  if (kind === 'paper') { g.strokeStyle = 'rgba(80,70,50,.35)'; g.beginPath(); g.moveTo(-r * .6, -r * .2); g.lineTo(r * .2, r * .1); g.lineTo(-r * .1, r * .6); g.moveTo(r * .1, -r * .7); g.lineTo(r * .5, r * .3); g.stroke(); }
  if (kind === 'rubber') { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, r * .62, -.6, 1.4); g.stroke(); }
  if (kind === 'clay') { g.fillStyle = 'rgba(60,35,20,.25)'; g.beginPath(); g.arc(r * .3, r * .2, r * .18, 0, TAU); g.arc(-r * .3, r * .4, r * .12, 0, TAU); g.fill(); }
  g.restore();
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = n >> 8 & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); gg = Math.round((t - gg) * p + gg); b = Math.round((t - b) * p + b);
  return `rgb(${r},${gg},${b})`;
}
function flag(g, x, yb, t, col = '#C2502A', hgt = 110) {
  shadow(g, x, yb + 2, 14, 4);
  g.fillStyle = lin(g, x - 3, 0, x + 3, 0, [[0, '#8a8f99'], [.5, '#e9edf2'], [1, '#6c727c']]); rr(g, x - 3, yb - hgt, 6, hgt, 3); g.fill();
  g.fillStyle = '#F0B44C'; g.beginPath(); g.arc(x, yb - hgt - 3, 5, 0, TAU); g.fill();
  g.beginPath(); const fy = yb - hgt + 4, fw = 52, fh = 34;
  g.moveTo(x + 3, fy);
  for (let i = 0; i <= 10; i++) { const u = i / 10; g.lineTo(x + 3 + u * fw, fy + Math.sin(t * .006 + u * 4) * 4 * u); }
  for (let i = 10; i >= 0; i--) { const u = i / 10; g.lineTo(x + 3 + u * fw, fy + fh + Math.sin(t * .006 + u * 4 + .4) * 4 * u - u * 6); }
  g.closePath(); g.fillStyle = lin(g, x, fy, x + fw, fy + fh, [[0, col], [1, shade(col, -.25)]]); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x + 24, fy + fh / 2 - 2, 7, 0, TAU); g.fill();
}
function cloud(g, x, y, s, a = .9) {
  g.save(); g.globalAlpha = a; g.fillStyle = '#fff';
  g.beginPath(); g.arc(x, y, 22 * s, 0, TAU); g.arc(x + 26 * s, y - 12 * s, 28 * s, 0, TAU); g.arc(x + 56 * s, y, 22 * s, 0, TAU); g.rect(x, y - 4 * s, 56 * s, 26 * s); g.fill();
  g.globalAlpha = a * .25; g.fillStyle = '#9fb7c9'; g.beginPath(); g.ellipse(x + 28 * s, y + 18 * s, 44 * s, 6 * s, 0, 0, TAU); g.fill();
  g.restore();
}
/** A simple, friendly child figure. pose: { x, y (feet), lean, armA:[x,y], armB:[x,y], face: 1|-1, shirt } */
function kid(g, o) {
  const { x, y, face = 1, shirt = '#1F6F66', strain = 0 } = o;
  shadow(g, x, y + 2, 20, 5);
  g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round';
  const lean = o.lean || 0;
  // legs
  g.strokeStyle = '#3B4A6B'; g.lineWidth = 9;
  g.beginPath(); g.moveTo(-6 * face, -42); g.lineTo(-10 * face - lean * .3, -2); g.moveTo(5 * face, -42); g.lineTo(9 * face + lean * .2, -2); g.stroke();
  g.fillStyle = '#2B1A10'; rr(g, -16 * face - lean * .3 - 4, -6, 14, 7, 3); g.fill(); rr(g, 6 * face + lean * .2 - 4, -6, 14, 7, 3); g.fill();
  // body
  g.save(); g.translate(0, -42); g.rotate(lean * .012 * face);
  g.fillStyle = lin(g, -14, -46, 14, 0, [[0, shade(shirt, .15)], [1, shade(shirt, -.15)]]);
  rr(g, -14, -46, 28, 48, 12); g.fill();
  // head
  g.fillStyle = '#C98A5E'; g.beginPath(); g.arc(2 * face, -60, 15, 0, TAU); g.fill();
  g.fillStyle = '#2B1A10'; g.beginPath(); g.arc(0, -66, 15, Math.PI * 1.02, Math.PI * 2.05); g.fill();
  g.beginPath(); g.arc(-9 * face, -62, 6, 0, TAU); g.fill();
  g.fillStyle = '#2B1A10'; g.beginPath(); g.arc(8 * face, -60, 1.8, 0, TAU); g.fill();
  g.strokeStyle = '#2B1A10'; g.lineWidth = 1.6; g.beginPath();
  if (strain > .5) { g.moveTo(5 * face, -52); g.lineTo(12 * face, -52); } else g.arc(9 * face, -54, 4, .2, Math.PI - .2);
  g.stroke();
  if (strain > .5) { g.fillStyle = '#7EC8E3'; g.beginPath(); g.ellipse(-6 * face, -72, 2.2, 3.4, 0, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(240,120,100,.45)'; g.beginPath(); g.arc(12 * face, -56, 3, 0, TAU); g.fill();
  g.restore();
  // arms to hand targets (relative to feet)
  g.strokeStyle = '#C98A5E'; g.lineWidth = 7;
  const sh = [-4 * face + lean * .55, -80];
  for (const a of [o.armA, o.armB]) { if (!a) continue; g.beginPath(); g.moveTo(sh[0], sh[1]); g.quadraticCurveTo((sh[0] + a[0]) / 2, (sh[1] + a[1]) / 2 + 8, a[0], a[1]); g.stroke(); }
  g.restore();
}
function arrow(g, x0, y0, x1, y1, col, w = 5) {
  const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); if (L < 4) return;
  g.save(); g.translate(x0, y0); g.rotate(a); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(L - 10, 0); g.stroke(); g.beginPath(); g.moveTo(L + 2, 0); g.lineTo(L - 14, -9); g.lineTo(L - 14, 9); g.closePath(); g.fill(); g.restore();
}
function tag(g, x, y, text, bg = '#FFF9EF', fg = '#2B1A10', size = 14) {
  g.save(); g.font = `700 ${size}px "DM Sans", system-ui, sans-serif`; const w = g.measureText(text).width + 14;
  g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, x - w / 2 + 1, y - size + 1, w, size + 10, 8); g.fill();
  g.fillStyle = bg; rr(g, x - w / 2, y - size, w, size + 10, 8); g.fill();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - size / 2 + 5); g.restore();
}
function weightBlock(g, x, yb, kg, w = 40) {
  const hh = 16 + Math.min(40, kg * 1.6);
  shadow(g, x, yb + 1, w / 2, 3, .2);
  g.fillStyle = lin(g, x - w / 2, 0, x + w / 2, 0, [[0, '#4d5562'], [.35, '#9aa3b0'], [1, '#3a404a']]);
  g.beginPath(); g.moveTo(x - w / 2 + 5, yb - hh); g.lineTo(x + w / 2 - 5, yb - hh); g.lineTo(x + w / 2, yb); g.lineTo(x - w / 2, yb); g.closePath(); g.fill();
  g.strokeStyle = '#3a404a'; g.lineWidth = 3; g.beginPath(); g.arc(x, yb - hh, 7, Math.PI, 0); g.stroke();
  g.fillStyle = '#fff'; g.font = '700 12px "DM Sans", sans-serif'; g.textAlign = 'center'; g.fillText(`${kg} kg`, x, yb - hh / 2 + 4);
  return hh;
}
function sack(g, x, yb, kg, w = 56) {
  const hh = 40 + Math.min(30, kg * .9);
  shadow(g, x, yb + 1, w / 2 + 4, 4, .2);
  g.beginPath(); g.moveTo(x - w / 2, yb); g.bezierCurveTo(x - w / 2 - 6, yb - hh * .6, x - w / 3, yb - hh, x - 8, yb - hh); g.lineTo(x + 8, yb - hh);
  g.bezierCurveTo(x + w / 3, yb - hh, x + w / 2 + 6, yb - hh * .6, x + w / 2, yb); g.closePath();
  g.fillStyle = lin(g, x - w / 2, 0, x + w / 2, 0, [[0, '#B98A4E'], [.4, '#E3C08A'], [1, '#9C6E38']]); g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(110,70,30,.25)'; g.lineWidth = 1;
  for (let i = -w; i < w; i += 5) { g.beginPath(); g.moveTo(x + i, yb); g.lineTo(x + i + 20, yb - hh); g.stroke(); }
  g.restore();
  g.fillStyle = '#7A4E22'; rr(g, x - 9, yb - hh - 6, 18, 10, 4); g.fill();
  g.fillStyle = '#FFF4DE'; rr(g, x - 20, yb - hh * .55 - 10, 40, 18, 5); g.fill();
  g.fillStyle = '#7A3B12'; g.font = '700 12px "DM Sans", sans-serif'; g.textAlign = 'center'; g.fillText(`${kg} kg`, x, yb - hh * .55 + 3);
  return hh;
}
function bucket(g, x, yt, w, hh, label) {
  g.strokeStyle = '#555c66'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, yt + 2, w / 2 - 2, Math.PI, 0); g.stroke();
  g.beginPath(); g.moveTo(x - w / 2, yt); g.lineTo(x + w / 2, yt); g.lineTo(x + w / 2 - 6, yt + hh); g.lineTo(x - w / 2 + 6, yt + hh); g.closePath();
  g.fillStyle = lin(g, x - w / 2, 0, x + w / 2, 0, [[0, '#2f6fb0'], [.4, '#6db1ea'], [1, '#235a91']]); g.fill();
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x - w / 2 + 3, yt + 4, w - 6, 3);
  g.fillStyle = '#1d4f7f'; g.beginPath(); g.ellipse(x, yt, w / 2, 4, 0, 0, TAU); g.fill();
  if (label) { g.fillStyle = '#fff'; g.font = '700 11px "DM Sans", sans-serif'; g.textAlign = 'center'; g.fillText(label, x, yt + hh / 2 + 5); }
}
function pulleyWheel(g, x, y, r, ang) {
  g.fillStyle = lin(g, x - r, y - r, x + r, y + r, [[0, '#d8dde3'], [1, '#7b838e']]); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = '#59606a'; g.lineWidth = 2; g.stroke();
  g.strokeStyle = '#8f969f'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const a = ang + i * TAU / 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); g.stroke(); }
  g.fillStyle = '#3a404a'; g.beginPath(); g.arc(x, y, r * .25, 0, TAU); g.fill();
}

/* ================================ presets ================================ */
const BALLS = [
  { name: 'paper', m: .6, r: 10, fa: .012, rest: .15, col: '#EDE6D2' },
  { name: 'rubber', m: 1, r: 10, fa: .004, rest: .5, col: '#E0533D' },
  { name: 'clay', m: 1.6, r: 10, fa: .002, rest: .04, col: '#9A7457' },
];
const SURF_CAR = [{ name: 'tiles', crr: .03 }, { name: 'cardboard', crr: .05 }, { name: 'carpet', crr: .09 }];
const SURF_RAMP = [{ name: 'glass', mu: .1, crr: .02 }, { name: 'wood', mu: .3, crr: .045 }, { name: 'sandpaper', mu: .6, crr: .1 }];
const idx3 = v => clamp(Math.round(v) - 1, 0, 2);

const PRESETS = {
  /* ---------------------------------------------------------------- catapult */
  catapult: {
    scene: 'outdoor', ground: 'grass', verb: 'Launch!', unit: { px: 2.5, label: 'cm' }, kinds: ['hit', 'distance'],
    params: [
      { key: 'arm', label: 'Arm length', min: 1, max: 5, step: 1, value: 3, names: ['Very short', 'Short', 'Medium', 'Long', 'Very long'] },
      { key: 'angle', label: 'Pull-back angle', min: 10, max: 60, step: 5, value: 35, unit: '°' },
      { key: 'load', label: 'Ball', min: 1, max: 3, step: 1, value: 2, names: ['Paper ball', 'Rubber ball', 'Clay ball'] },
    ],
    goal: { kind: 'hit', target: { x: .8, width: .09 }, text: 'Land the ball in the basket' },
    geo(P) {
      const L = 46 + 24 * clamp(P.arm, .5, 6);
      const stop = 90 - clamp(P.release ?? 40, 15, 75);
      return { HX: 238, HY: GY - 62, L, stop: rad(stop), pulled: rad(Math.max(stop - P.angle, -10)) };
    },
    ball(P) { const b = BALLS[idx3(P.load)]; return b; },
    speed(P) {
      const { L } = this.geo(P), b = this.ball(P);
      return .158 * L * rad(clamp(P.angle, 2, 85)) * Math.sqrt((P.bands ?? 2) / 2) / Math.sqrt(.7 + b.m);
    },
    launch(L) {
      const s = L.s; s.phase = 'swing'; s.a = this.geo(L.P).pulled; s.v = this.speed(L.P);
      s.w0 = 0; s.land = null; s.rest = 0; s.inBasket = 0;
      const { M } = L, tx = L.goal.target.x * W, bw = L.goal.target.width * W;
      L.addStatic(M.Bodies.rectangle(W / 2, GY + 60, 4000, 120, { isStatic: true, friction: .6, label: 'ground' }));
      if (L.goal.kind === 'hit') {
        const top = GY - 58;
        L.addStatic(M.Bodies.rectangle(tx - bw / 2 + 2, GY - 29, 6, 58, { isStatic: true, label: 'basket', restitution: .2 }));
        L.addStatic(M.Bodies.rectangle(tx + bw / 2 - 2, GY - 29, 6, 58, { isStatic: true, label: 'basket', restitution: .2 }));
        L.addStatic(M.Bodies.rectangle(tx, GY - 4, bw, 8, { isStatic: true, label: 'basket', friction: 1 }));
        s.basket = { x0: tx - bw / 2 + 5, x1: tx + bw / 2 - 5, top };
      }
      L.sound('whoosh');
    },
    step(L) {
      const s = L.s, P = L.P, geo = this.geo(P), b = this.ball(P);
      if (s.phase === 'swing') {
        const L0 = geo.L, w = s.v / L0, swing = geo.stop - geo.pulled;
        s.w0 = Math.min(w, s.w0 + w * w / (2 * Math.max(.05, swing)) * 1.0 + .002);
        s.a += s.w0;
        if (s.a >= geo.stop) {
          s.a = geo.stop; s.phase = 'fly'; s.wob = 1;
          const tip = tipOf(geo, s.a), n = [Math.sin(s.a), -Math.cos(s.a)];
          const body = L.M.Bodies.circle(tip[0] + n[0] * (b.r + 5), tip[1] + n[1] * (b.r + 5), b.r, { restitution: b.rest, friction: .5, frictionAir: b.fa, density: .001 * b.m, label: 'ball' });
          L.add(body); L.M.Body.setVelocity(body, { x: n[0] * s.v, y: n[1] * s.v });
          s.ball = body; L.sound('drop');
        }
        return;
      }
      s.wob *= .9;
      const ball = s.ball, p = ball.position; L.trail(p.x, p.y);
      L.read(Math.max(0, (p.x - geo.HX) / this.unit.px));
      const sp = Math.hypot(ball.velocity.x, ball.velocity.y);
      if (s.basket && p.x > s.basket.x0 && p.x < s.basket.x1 && p.y > s.basket.top + b.r) { if (++s.inBasket > 8) return L.finish({ hit: true, x: p.x, land: s.land ?? p.x }); }
      s.rest = sp < .15 ? s.rest + 1 : 0;
      if (s.rest > 30 || p.x > W + 60 || p.x < -60 || L.t > 900) L.finish({ hit: false, x: p.x, land: s.land ?? p.x });
    },
    collide(L, a, b) {
      const s = L.s; const other = a.label === 'ball' ? b : b.label === 'ball' ? a : null; if (!other) return;
      const ball = s.ball, sp = Math.hypot(ball.velocity.x, ball.velocity.y);
      if (other.label === 'ground') {
        if (s.land == null) { s.land = ball.position.x; L.sound('drop'); }
        if (sp > 1.2) L.puff(ball.position.x, GY, Math.min(14, 4 + sp * 1.2), '#C9A877');
      } else if (sp > 1) { L.sound('tick'); L.puff(ball.position.x, ball.position.y, 4, '#E8D3A6'); }
    },
    judge(L, r) {
      const tx = L.goal.target.x * W, bw = L.goal.target.width * W, d = (r.land - this.geo(L.P).HX) / this.unit.px;
      const miss = Math.round(Math.abs(r.land - tx) / this.unit.px);
      const ok = L.goal.kind === 'hit' ? r.hit : r.land >= tx - bw / 2;
      const val = `${Math.round(d)} cm`;
      if (ok) return { ok, val, text: L.goal.kind === 'hit' ? `In the basket! It flew ${val}.` : `It flew ${val}. Past the flag!` };
      const short = r.land < tx;
      const tip = short ? 'Pull the arm back further, or use a longer arm, to store more energy in the rubber band.' : 'Too much energy! Pull back a little less or use a shorter arm.';
      return { ok, val, close: 1 - Math.abs(r.land - tx) / tx, text: `${short ? 'Too short' : 'Too far'} by ${miss} cm. ${tip}` };
    },
    ghostOf(L) { return { trail: L.trailPts.slice(), land: L.s.land }; },
    draw(g, L, t) {
      const P = L.P, geo = this.geo(P), b = this.ball(P), s = L.s, run = L.state !== 'idle';
      const tx = L.goal.target.x * W, bw = L.goal.target.width * W;
      ruler(g, geo.HX, W - 10, this.unit.px, 'cm', 50, L);
      if (L.goal.kind === 'hit') basket(g, tx, GY, bw, 58, t, L.fx.basket || 0); else flag(g, tx, GY, t, '#C2502A');
      // the box it stands on
      shadow(g, 205, GY + 2, 80, 7);
      cardboard(g, 135, GY - 46, 140, 46, 4);
      g.fillStyle = 'rgba(200,170,120,.85)'; g.fillRect(196, GY - 46, 18, 46);
      // frame: base plank and uprights with crossbar stop
      wood(g, 118, GY - 56, 150, 10, 4, undefined, 3);
      const a = run ? (s.phase === 'swing' ? s.a : geo.stop + Math.sin(L.t * .7) * .08 * (s.wob || 0)) : geo.pulled;
      // stopper post
      const sx = geo.HX - Math.cos(geo.stop) * 64, sy = geo.HY - Math.sin(geo.stop) * 64;
      g.strokeStyle = '#8B5A2B'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(geo.HX - 20, GY - 52); g.lineTo(sx - 10, sy + 6); g.stroke();
      g.fillStyle = '#5b3a1e'; g.beginPath(); g.arc(sx - 9, sy + 5, 6, 0, TAU); g.fill();
      // arm
      g.save(); g.translate(geo.HX, geo.HY); g.rotate(Math.PI - a);
      wood(g, -4, -5, geo.L + 4, 10, 4, ['#F2D59A', '#DDB36E', '#B98A45'], 7);
      // spoon cup
      g.fillStyle = lin(g, geo.L - 8, -16, geo.L + 16, 6, [[0, '#F8F8F8'], [1, '#B9C2CC']]);
      g.beginPath(); g.ellipse(geo.L + 2, -9, 15, 9, 0, 0, Math.PI); g.lineTo(geo.L - 13, -9); g.fill();
      g.strokeStyle = '#8D97A3'; g.lineWidth = 1.5; g.stroke();
      g.restore();
      // rubber band + hinge
      g.fillStyle = '#C2502A'; g.beginPath(); g.ellipse(geo.HX - 6, geo.HY + 4, 9, 6, -.4, 0, TAU); g.fill();
      g.fillStyle = '#5b3a1e'; g.beginPath(); g.arc(geo.HX, geo.HY, 5, 0, TAU); g.fill();
      // ball
      if (!s.ball) {
        const tip = tipOf(geo, a), n = [Math.sin(a), -Math.cos(a)];
        ballDraw(g, tip[0] + n[0] * (b.r + 5) * .7, tip[1] + n[1] * (b.r + 5) * .7, b.r, b.col, 0, b.name);
      } else ballDraw(g, s.ball.position.x, s.ball.position.y, b.r, b.col, s.ball.angle, b.name);
      if (!run) {
        // aim hint: dotted arc of pull-back
        g.save(); g.setLineDash([3, 6]); g.strokeStyle = 'rgba(194,80,42,.6)'; g.lineWidth = 2; g.beginPath();
        g.arc(geo.HX, geo.HY, geo.L + 18, Math.PI + geo.pulled, Math.PI + geo.stop, true); g.stroke(); g.restore();
      }
    },
    drawGhost(g, gh) {
      if (!gh) return; dashed(g, gh.trail);
      if (gh.land != null) { g.save(); g.globalAlpha = .35; ballDraw(g, gh.land, GY - 10, 10, '#888888'); g.restore(); }
    },
  },

  /* ---------------------------------------------------------------- balloon car */
  'balloon-car': {
    scene: 'indoor', ground: P => ['tiles', 'cardboard', 'carpet'][surfIdx(P)], verb: 'Let go!', unit: { px: 200, label: 'm' }, kinds: ['distance', 'hit'],
    params: [
      { key: 'balloon', label: 'Balloon size', min: 1, max: 5, step: 1, value: 2, names: ['Tiny', 'Small', 'Medium', 'Big', 'Huge'] },
      { key: 'mass', label: 'Car mass', min: 1, max: 5, step: 1, value: 3, unit: ' coins' },
      { key: 'surface', label: 'Floor', min: 1, max: 3, step: 1, value: 2, names: ['Smooth tiles', 'Cardboard', 'Carpet'] },
    ],
    goal: { kind: 'distance', target: { x: .86, width: .1 }, text: 'Make the car reach the finish flag' },
    m(P) { return 1.2 + .35 * clamp(P.mass, 0, 8); },
    launch(L) {
      const { M } = L, s = L.s, P = L.P;
      L.addStatic(M.Bodies.rectangle(W / 2, GY + 60, 4000, 120, { isStatic: true, friction: 0, label: 'ground' }));
      const car = M.Bodies.rectangle(110, GY - 30, 120, 34, { chamfer: { radius: 12 }, friction: 0, frictionStatic: 0, frictionAir: 0, restitution: 0, label: 'car' });
      M.Body.setMass(car, this.m(P)); M.Body.setInertia(car, Infinity);
      L.add(car); s.car = car; s.x0 = car.position.x;
      const b = clamp(P.balloon, .5, 6);
      s.air = s.air0 = 30 + 16 * b; s.thrust = .052 + .014 * b; s.rest = 0; s.inflate = 30; s.spin = 0;
      L.sound('whoosh');
    },
    step(L) {
      const s = L.s, car = s.car, P = L.P, crr = .03 * Math.pow(3, rough(P));
      if (s.inflate > 0) { s.inflate--; M_set(L, car, 110); return; }
      const vx = car.velocity.x, m = car.mass;
      let a = 0;
      if (s.air > 0) { const f = Math.sqrt(s.air / s.air0); a += s.thrust * (0.55 + .45 * f) / m; s.air--; if (L.t % 3 === 0) L.puff(car.position.x - 78, car.position.y - 28, 1, '#ffffff', -2.5, 0); }
      a -= Math.sign(vx) * Math.min(Math.abs(vx), crr * G * (vx > .01 || s.air > 0 ? 1 : 0)) ;
      a -= .002 * vx * Math.abs(vx);
      L.push(car, a, 0);
      s.spin += vx / 15;
      L.trail(car.position.x + 60, GY - 4);
      L.read((car.position.x - s.x0) / this.unit.px);
      s.rest = (s.air <= 0 && Math.abs(vx) < .03) ? s.rest + 1 : 0;
      if (s.rest > 20 || car.position.x > W + 120 || L.t > 1500) { M_stop(L, car); L.finish({ x: car.position.x + 60, d: (car.position.x - s.x0) / this.unit.px }); }
    },
    judge(L, r) { return travelJudge(L, r, this, 'car', 'A bigger balloon stores more air to push with, a lighter car speeds up more, and a smoother floor wastes less energy on friction.'); },
    ghostOf(L) { return { x: L.s.car.position.x }; },
    draw(g, L, t) {
      const s = L.s, P = L.P, tx = L.goal.target.x * W;
      ruler(g, 170, W - 10, this.unit.px, 'm', .5, L, 170);
      finish(g, L, tx, t);
      const x = s.car ? s.car.position.x : 110, b = clamp(P.balloon, .5, 6);
      let bs = s.car ? (s.inflate > 0 ? lerp(.3, 1, 1 - s.inflate / 30) : Math.max(.12, Math.cbrt(s.air / s.air0))) : 1;
      if (s.car && s.inflate <= 0 && s.air > 0) bs *= 1 + Math.sin(L.t * 1.3) * .03;
      balloonCar(g, x, GY, 14 + 5 * b, bs, s.spin || 0, clamp(P.mass, 0, 8));
    },
    drawGhost(g, gh) { g.save(); g.globalAlpha = .28; balloonCar(g, gh.x, GY, 0, 0, 0, 0, true); g.restore(); },
  },

  /* ---------------------------------------------------------------- ramp */
  ramp: {
    scene: 'indoor', ground: 'tiles', verb: 'Go!', unit: { px: 200, label: 'm' }, kinds: ['distance', 'hit', 'least-force', 'lift'],
    params: [
      { key: 'angle', label: 'Ramp angle', min: 10, max: 45, step: 5, value: 20, unit: '°' },
      { key: 'surface', label: 'Ramp surface', min: 1, max: 3, step: 1, value: 2, names: ['Glass sheet', 'Wooden plank', 'Sandpaper'] },
      { key: 'load', label: 'Load', min: 5, max: 30, step: 5, value: 10, unit: ' kg' },
    ],
    goal: { kind: 'distance', target: { x: .85, width: .1 }, text: 'Roll the toy truck all the way to the flag' },
    push(L) { return L.goal.kind === 'least-force' || L.goal.kind === 'lift'; },
    geo(P, push) {
      const th = rad(clamp(P.angle, 5, 60));
      if (push) { const hp = 130, xr = 720, len = hp / Math.sin(th); return { th, x0: xr - hp / Math.tan(th), y0: GY, x1: xr, y1: GY - hp, len, hp }; }
      const len = 330, x0 = 40, y0 = GY - len * Math.sin(th); return { th, x0, y0, x1: x0 + len * Math.cos(th), y1: GY, len };
    },
    need(L) { const P = L.P, th = rad(clamp(P.angle, 5, 60)), mu = SURF_RAMP[surfIdx(P)].mu, m = this.massKg(P); return m * 10 * (Math.sin(th) + mu * Math.cos(th)); },
    launch(L) {
      const { M } = L, s = L.s, P = L.P, push = this.push(L), geo = this.geo(P, push);
      L.addStatic(M.Bodies.rectangle(W / 2, GY + 60, 4000, 120, { isStatic: true, friction: 0, frictionStatic: 0, label: 'ground' }));
      const T = 24, cx = (geo.x0 + geo.x1) / 2, cy = (geo.y0 + geo.y1) / 2, ang = Math.atan2(geo.y1 - geo.y0, geo.x1 - geo.x0);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      L.addStatic(M.Bodies.rectangle(cx + nx * T / 2, cy + ny * T / 2, geo.len + 40, T, { isStatic: true, angle: ang, friction: 0, frictionStatic: 0, label: 'ramp' }));
      if (push) L.addStatic(M.Bodies.rectangle(geo.x1 + 140, geo.y1 + 70, 280, 140, { isStatic: true, friction: 0, label: 'truck' }));
      const bw = push ? 64 : 70, bh = push ? 50 : 30;
      const along = push ? 40 : 40, px = geo.x0 + Math.cos(ang) * along - nx * (bh / 2 + 1), py = geo.y0 + Math.sin(ang) * along - ny * (bh / 2 + 1);
      const body = M.Bodies.rectangle(px, py, bw, bh, { angle: ang, chamfer: { radius: push ? 6 : 12 }, friction: 0, frictionStatic: 0, frictionAir: 0, restitution: 0, label: 'load' });
      M.Body.setMass(body, push ? 2 : 1 + .05 * clamp(P.load, 0, 100)); M.Body.setInertia(body, Infinity);
      L.add(body); s.body = body; s.rest = 0; s.spin = 0; s.x0 = geo.x1; s.ang = ang; s.geo = geo;
      if (push) { s.need = this.need(L); s.can = L.goal.value ?? 150; s.moved = 0; s.struggle = 0; }
      L.sound('whoosh');
    },
    step(L) {
      const s = L.s, body = s.body, P = L.P, surf = SURF_RAMP[surfIdx(P)], geo = s.geo;
      const onRamp = body.position.x < geo.x1 + (this.push(L) ? 0 : 10);
      const ang = onRamp ? s.ang : 0, v = body.velocity, sp = v.x * Math.cos(ang) + v.y * Math.sin(ang);
      if (this.push(L)) {
        if (s.need > s.can) {
          s.struggle++; M_set(L, body, body.position.x); s.strain = 1;
          if (s.struggle > 140) L.finish({ ok: false, stuck: true });
          return;
        }
        // a steady push: the push exactly balances gravity along the slope plus sliding friction
        if (onRamp) M_slide(L, body, ang, 1.3);
        else { M_slide(L, body, 0, s.rest < 12 ? .9 : 0); s.rest++; if (s.rest > 30) return L.finish({ ok: true, need: s.need }); }
        s.moved += 1; L.read(s.need, true);
        return;
      }
      const crr = surf.crr, fric = Math.sign(sp) * Math.min(Math.abs(sp), crr * G * Math.cos(ang) + .0025 * sp * sp);
      L.push(body, -fric * Math.cos(ang), -fric * Math.sin(ang));
      s.spin += sp / 9;
      L.trail(body.position.x, body.position.y + 12);
      L.read(Math.max(0, (body.position.x - geo.x1) / this.unit.px));
      if (!onRamp && L.s.landed !== true) { L.s.landed = true; L.puff(geo.x1 + 10, GY, 6, '#d8c9b0'); L.sound('drop'); }
      s.rest = (!onRamp && Math.abs(sp) < .03) ? s.rest + 1 : 0;
      if (s.rest > 20 || body.position.x > W + 80 || L.t > 1500) { M_stop(L, body); L.finish({ x: body.position.x + 35, d: (body.position.x - geo.x1) / this.unit.px }); }
    },
    judge(L, r) {
      if (this.push(L)) {
        const need = Math.round(this.need(L)), can = L.goal.value ?? 150, wt = this.massKg(L.P) * 10;
        if (r.stuck) return { ok: false, val: `${need} N`, close: can / need, text: `It needs ${need} N but you can push only ${can} N. A gentler slope or a smoother surface needs less force.` };
        return { ok: true, val: `${need} N`, text: `Up it goes with ${need} N instead of ${wt} N to lift it straight up. A long, gentle ramp trades distance for force.` };
      }
      return travelJudge(L, r, this, 'truck', 'A steeper ramp gives more speed at the bottom, and a smoother surface wastes less energy.');
    },
    ghostOf(L) { return this.push(L) ? null : { x: L.s.body.position.x, y: L.s.body.position.y, a: L.s.body.angle }; },
    draw(g, L, t) {
      const P = L.P, push = this.push(L), geo = this.geo(P, push), s = L.s, surf = surfIdx(P);
      if (!push) { ruler(g, geo.x1, W - 10, this.unit.px, 'm', .5, L, geo.x1); finish(g, L, L.goal.target.x * W, t); }
      // supports
      if (push) truckBed(g, geo.x1, geo.y1);
      else { books(g, geo.x0 - 6, geo.y0, 40); }
      // ramp plank
      g.save(); g.translate(geo.x0, geo.y0); g.rotate(Math.atan2(geo.y1 - geo.y0, geo.x1 - geo.x0));
      const len = Math.hypot(geo.x1 - geo.x0, geo.y1 - geo.y0) + (push ? 4 : 10);
      shadowRamp(g, len);
      wood(g, 0, 0, len, 16, 3, undefined, 11);
      const sc = ['rgba(190,230,255,.55)', null, 'rgba(120,90,50,.65)'][surf];
      if (sc) { g.fillStyle = sc; g.fillRect(2, 0, len - 4, 5); if (surf === 2) { g.fillStyle = 'rgba(60,40,20,.5)'; for (let i = 4; i < len; i += 5) g.fillRect(i, 1 + (i * 7 % 3), 1.6, 1.6); } else { g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(10, 1, len * .3, 1.2); } }
      g.restore();
      // angle marker
      g.save(); g.strokeStyle = 'rgba(31,111,102,.85)'; g.lineWidth = 2; g.beginPath();
      const cx = push ? geo.x0 : geo.x1, cy = GY;
      if (push) g.arc(cx, cy, 46, -geo.th, 0); else g.arc(cx, cy, 46, Math.PI, Math.PI + geo.th);
      g.stroke(); g.fillStyle = '#1F6F66'; g.font = '700 14px "DM Sans", sans-serif'; g.textAlign = 'center';
      g.fillText(`${Math.round(P.angle)}°`, push ? cx + 66 : cx - 66, cy - 10); g.restore();
      const body = s.body;
      const bx = body ? body.position.x : null, by = body ? body.position.y : null, ba = body ? (body.position.x < geo.x1 ? Math.atan2(geo.y1 - geo.y0, geo.x1 - geo.x0) : 0) : null;
      if (push) {
        const ang = Math.atan2(geo.y1 - geo.y0, geo.x1 - geo.x0), nx = -Math.sin(ang), ny = Math.cos(ang);
        const p = body ? [bx, by] : [geo.x0 + Math.cos(ang) * 40 - nx * 26, geo.y0 + Math.sin(ang) * 40 - ny * 26];
        const a = body ? ba : ang;
        g.save(); g.translate(p[0], p[1]); g.rotate(a); crate(g, 64, 50, Math.round(this.massKg(P))); g.restore();
        // pusher behind the crate
        const hx = p[0] - Math.cos(a) * 36, hy = p[1] - Math.sin(a) * 36;
        const fx = hx - 34, fy = (body && body.position.x >= geo.x1) ? geo.y1 : Math.min(GY, geo.y0 + (hx - 34 - geo.x0) * Math.tan(ang) * (hx - 34 > geo.x0 ? 1 : 0));
        kid(g, { x: fx, y: fy, face: 1, lean: 22, armA: [hx - fx, hy - fy - 6], armB: [hx - fx, hy - fy + 6], strain: s.strain || 0, shirt: '#8C3557' });
        const need = this.need(L);
        arrow(g, hx - 6 - Math.cos(a) * 60, hy - Math.sin(a) * 60 - 34, hx - 6, hy - 34, '#C2502A', 4);
        tag(g, hx - Math.cos(a) * 40, hy - 50, `${Math.round(need)} N`, '#C2502A', '#fff', 13);
      } else {
        const ang = Math.atan2(geo.y1 - geo.y0, geo.x1 - geo.x0), nx = -Math.sin(ang), ny = Math.cos(ang);
        const p = body ? [bx, by] : [geo.x0 + Math.cos(ang) * 40 - nx * 16, geo.y0 + Math.sin(ang) * 40 - ny * 16];
        g.save(); g.translate(p[0], p[1]); g.rotate(body ? ba : ang); toyTruck(g, s.spin || 0, Math.round(clamp(P.load, 0, 100) / 6)); g.restore();
      }
    },
    drawGhost(g, gh) { if (!gh) return; g.save(); g.globalAlpha = .25; g.translate(gh.x, GY - 15); toyTruck(g, 0, 0, true); g.restore(); },
  },

  /* ---------------------------------------------------------------- lever */
  lever: {
    scene: 'outdoor', ground: 'grass', verb: 'Let go!', kinds: ['lift', 'least-force'],
    params: [
      { key: 'fulcrum', label: 'Fulcrum position', min: 1, max: 9, step: 1, value: 5, names: ['Near the load', '2', '3', '4', 'Middle', '6', '7', '8', 'Near the effort'] },
      { key: 'load', label: 'Load (sack)', min: 10, max: 40, step: 5, value: 30, unit: ' kg' },
      { key: 'effort', label: 'Effort (weights)', min: 2, max: 30, step: 2, value: 10, unit: ' kg' },
    ],
    goal: { kind: 'lift', text: 'Lift the heavy sack off the ground' },
    geo(P) { const xl = 200, xr = 800, f = clamp(P.fulcrum, 1, 9); return { xl, xr, xf: xl + f * 60, py: GY - 64, lx: xl + 34, ex: xr - 30 }; },
    launch(L) {
      const { M } = L, s = L.s, P = L.P, geo = this.geo(P);
      L.addStatic(M.Bodies.rectangle(W / 2, GY + 60, 4000, 120, { isStatic: true, friction: .8, label: 'ground' }));
      const yc = geo.py - 7;
      const plank = M.Bodies.rectangle(500, yc, 620, 14, {});
      const load = M.Bodies.rectangle(geo.lx, yc - 25, 40, 36, {}), eff = M.Bodies.rectangle(geo.ex, yc - 25, 36, 36, {});
      M.Body.setMass(plank, 4); M.Body.setMass(load, clamp(P.load, .5, 500)); M.Body.setMass(eff, clamp(P.effort, .1, 500));
      const body = M.Body.create({ parts: [plank, load, eff], frictionAir: .03, friction: .8, restitution: .05, label: 'plank' });
      L.add(body);
      const off = { x: geo.xf - body.position.x, y: geo.py - body.position.y };
      L.add(M.Constraint.create({ pointA: { x: geo.xf, y: geo.py }, bodyB: body, pointB: off, stiffness: 1, length: 0 }));
      s.body = body; s.a0 = body.angle; s.rest = 0; s.peak = 0; s.creak = 0;
      L.sound('click');
    },
    step(L) {
      const s = L.s, b = s.body, a = b.angle - s.a0;
      const lift = Math.max(0, Math.sin(a) * (this.geo(L.P).xf - this.geo(L.P).lx));
      L.read(lift / 2, false, 'cm lifted');
      if (Math.abs(b.angularVelocity) > .004 && ++s.creak % 14 === 0) L.sound('tick');
      s.rest = Math.abs(b.angularVelocity) < .0008 ? s.rest + 1 : 0;
      if ((s.rest > 30 && L.t > 30) || L.t > 360) L.finish({ angle: a, lift });
    },
    collide(L, a, b) { const s = L.s; if (Math.abs(s.body.angularVelocity) > .01) { const geo = this.geo(L.P); const right = s.body.angle - s.a0 > 0; L.puff(right ? geo.xr - 10 : geo.xl + 10, GY, 8, '#C9A877'); L.sound('drop'); } },
    torque(P) { const geo = this.geo(P); return { tl: clamp(P.load, 0, 500) * (geo.xf - geo.lx), te: clamp(P.effort, 0, 500) * (geo.ex - geo.xf) + 4 * (500 - geo.xf) }; },
    judge(L, r) {
      const P = L.P, geo = this.geo(P), dl = r1((geo.xf - geo.lx) / 200), de = r1((geo.ex - geo.xf) / 200);
      const lifted = r.angle > .04, val = `${Math.round(r.lift / 2)} cm`;
      const why = `Load ${P.load} kg × ${dl} m = ${r1(P.load * dl)}, effort ${P.effort} kg × ${de} m = ${r1(P.effort * de)}.`;
      if (lifted && L.goal.kind === 'least-force' && P.effort > (L.goal.value ?? 10)) return { ok: false, val, close: .8, text: `Lifted, but with ${P.effort} kg. Can you do it with ${L.goal.value ?? 10} kg or less? Move the fulcrum closer to the load.` };
      if (lifted) return { ok: true, val, text: `Up goes the sack! ${why} The effort side turns harder.` };
      return { ok: false, val, close: clamp(this.torque(P).te / this.torque(P).tl, 0, .95), text: `The sack stays down. ${why} Move the fulcrum nearer the load or add more effort.` };
    },
    ghostOf(L) { return { angle: L.s.body.angle - L.s.a0, xf: this.geo(L.P).xf, py: this.geo(L.P).py }; },
    draw(g, L, t) {
      const P = L.P, geo = this.geo(P), s = L.s;
      const a = s.body ? s.body.angle - s.a0 : 0;
      // fulcrum wedge
      shadow(g, geo.xf, GY + 2, 40, 6);
      g.beginPath(); g.moveTo(geo.xf, geo.py); g.lineTo(geo.xf + 36, GY); g.lineTo(geo.xf - 36, GY); g.closePath();
      g.fillStyle = lin(g, geo.xf - 36, 0, geo.xf + 36, 0, [[0, '#9a9fa8'], [.5, '#c9ced6'], [1, '#6d737d']]); g.fill();
      g.strokeStyle = '#555b66'; g.lineWidth = 1.5; g.stroke();
      // plank + loads
      g.save(); g.translate(geo.xf, geo.py); g.rotate(a); g.translate(-geo.xf, -geo.py);
      const yt = geo.py - 14;
      wood(g, 190, yt, 620, 14, 4, undefined, 5);
      g.fillStyle = 'rgba(90,45,12,.6)'; g.font = '600 10px "DM Mono", monospace'; g.textAlign = 'center';
      for (let i = 1; i <= 9; i++) { const x = geo.xl + i * 60; g.fillRect(x - .75, yt + 2, 1.5, 5); }
      sack(g, geo.lx + 4, yt, Math.round(P.load), 60);
      let hy = yt; const n = Math.max(1, Math.round(P.effort / 5));
      const per = Math.round(P.effort / n * 10) / 10;
      for (let i = 0; i < Math.min(n, 4); i++) hy -= weightBlock(g, geo.ex, hy, i === Math.min(n, 4) - 1 ? r1(P.effort - per * (Math.min(n, 4) - 1)) : per, 40 - i * 3) - 1;
      g.restore();
      g.fillStyle = '#5b3a1e'; g.beginPath(); g.arc(geo.xf, geo.py, 5, 0, TAU); g.fill();
      // turning-effect meter
      const tq = this.torque(P), mx = Math.max(tq.tl, tq.te);
      const bx = 330, by = 74, bw2 = 150;
      g.save(); g.font = '700 12px "DM Sans", sans-serif'; g.textAlign = 'right'; g.fillStyle = 'rgba(255,249,239,.85)'; rr(g, bx - 120, by - 22, 460, 62, 12); g.fill();
      g.fillStyle = '#5E4634'; g.fillText('Load turning effect', bx - 8, by + 2); g.fillText('Effort turning effect', bx - 8, by + 26);
      g.fillStyle = '#B98A4E'; rr(g, bx, by - 9, bw2 * 2 * tq.tl / mx, 14, 6); g.fill();
      g.fillStyle = '#4d5562'; rr(g, bx, by + 15, bw2 * 2 * tq.te / mx, 14, 6); g.fill();
      g.restore();
    },
    drawGhost(g, gh) {
      g.save(); g.globalAlpha = .22; g.translate(gh.xf, gh.py); g.rotate(gh.angle); g.translate(-gh.xf, -gh.py);
      g.fillStyle = '#7a5a3a'; rr(g, 190, gh.py - 14, 620, 14, 4); g.fill(); g.restore();
    },
  },

  /* ---------------------------------------------------------------- pulley */
  pulley: {
    scene: 'outdoor', ground: 'grass', verb: 'Pull!', kinds: ['lift', 'least-force'],
    params: [
      { key: 'pulleys', label: 'Rope strands holding the load', min: 1, max: 4, step: 1, value: 1, names: ['1 (one fixed pulley)', '2 (add a moving pulley)', '3 (block and tackle)', '4 (block and tackle)'] },
      { key: 'load', label: 'Load', min: 10, max: 60, step: 5, value: 40, unit: ' kg' },
    ],
    goal: { kind: 'lift', value: 150, text: 'Lift the basket of mangoes up to the tree house' },
    beam: 96, top: GY - 250,
    need(P) { const n = clamp(Math.round(P.pulleys), 1, 4); return clamp(P.load, 0, 999) * 10 / n * (1 + .04 * (n - 1)); },
    launch(L) {
      const { M } = L, s = L.s, P = L.P, n = clamp(Math.round(P.pulleys), 1, 4);
      L.addStatic(M.Bodies.rectangle(W / 2, GY + 60, 4000, 120, { isStatic: true, friction: .8, label: 'ground' }));
      const load = M.Bodies.rectangle(470, GY - 30, 64, 56, { frictionAir: .02, label: 'load' });
      M.Body.setMass(load, clamp(P.load, 1, 500) / 10); M.Body.setInertia(load, load.inertia * 3);
      L.add(load);
      const rope = M.Constraint.create({ pointA: { x: 470, y: this.beam + 14 }, bodyB: load, pointB: { x: 0, y: -28 }, stiffness: .6, damping: .1 });
      L.add(rope); s.rope = rope; s.load = load; s.len0 = rope.length; s.n = n; s.need = this.need(P); s.can = L.goal.value ?? 150; s.pulled = 0; s.rest = 0; s.strain = 0;
      L.sound('click');
    },
    step(L) {
      const s = L.s, ok = s.need <= s.can;
      const h = GY - 2 - (s.load.position.y + 28);
      if (ok) { s.rope.length = Math.max(60, s.rope.length - 1.5); s.pulled += 1.5 * s.n; }
      else { const wob = Math.max(0, Math.sin(L.t * .1)) * 6 * (s.can / s.need); s.rope.length = s.len0 - wob; s.strain = 1; s.pulled = wob * s.n; }
      L.read(Math.max(0, h) / 100, false, 'm up');
      if (ok && s.load.position.y - 28 <= this.top + 6) { if (++s.rest > 30) L.finish({ ok: true }); }
      if (!ok && L.t > 200) L.finish({ ok: false });
    },
    judge(L, r) {
      const P = L.P, need = Math.round(this.need(P)), can = L.goal.value ?? 150, n = clamp(Math.round(P.pulleys), 1, 4);
      if (!r.ok) return { ok: false, val: `${need} N`, close: can / need, text: `Too heavy! You must pull ${need} N but can pull only ${can} N. More rope strands share the weight.` };
      if (L.goal.kind === 'least-force' && n > 1 && this.need({ ...P, pulleys: n - 1 }) <= can) return { ok: true, val: `${need} N`, text: `Lifted with ${need} N.` };
      return { ok: true, val: `${need} N`, text: `Up it goes with ${need} N! ${n} strands share the load, but you pulled ${n}× as much rope.` };
    },
    ghostOf() { return null; },
    draw(g, L, t) {
      const P = L.P, s = L.s, n = clamp(Math.round(P.pulleys), 1, 4), need = this.need(P), can = L.goal.value ?? 150;
      treehouse(g, this.top);
      // frame
      wood(g, 360, this.beam - 10, 260, 18, 5, undefined, 2);
      g.save(); g.translate(372, this.beam); wood(g, -9, 0, 18, GY - this.beam, 4, undefined, 8); g.restore();
      g.save(); g.translate(604, this.beam); wood(g, -9, 0, 18, GY - this.beam, 4, undefined, 9); g.restore();
      const lp = s.load ? s.load.position : { x: 470, y: GY - 30 }, la = s.load ? s.load.angle : 0;
      const blockY = lp.y - 28 - 34, cx = lp.x, rope = '#C9A36A';
      const xs = Array.from({ length: n }, (_, i) => cx - (n - 1) * 14 + i * 28);
      const topY = this.beam + 22, spin = (s.pulled || 0) / 14;
      g.strokeStyle = rope; g.lineWidth = 3;
      for (const x of xs) { g.beginPath(); g.moveTo(x, topY); g.lineTo(x, n === 1 ? lp.y - 28 : blockY); g.stroke(); }
      // free end over the top pulley to the puller
      const fx = xs[n - 1] + 28, hand = [700, GY - 112 + Math.sin((s.pulled || 0) * .05) * 8];
      g.beginPath(); g.moveTo(fx, topY); g.lineTo(hand[0], hand[1]); g.stroke();
      // fixed pulleys (top) and moving pulleys (bottom)
      pulleyWheel(g, xs[n - 1] + 14, topY, 14, spin);
      for (let i = n - 1; i > 0; i--) { const mid = (xs[i] + xs[i - 1]) / 2; const bottom = (n - 1 - i) % 2 === 0; if (bottom) { if (n > 1) pulleyWheel(g, mid, blockY, 14, -spin); } else pulleyWheel(g, mid, topY, 14, spin); }
      g.fillStyle = '#5b3a1e'; for (const x of [xs[n - 1] + 14]) { g.fillRect(x - 2, this.beam + 6, 4, 10); }
      if (n > 1) { g.fillStyle = '#6d737d'; rr(g, cx - (n - 1) * 14 - 6, blockY + 10, (n - 1) * 28 + 12, 8, 3); g.fill(); g.strokeStyle = '#6d737d'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, blockY + 16); g.lineTo(lp.x, lp.y - 28); g.stroke(); }
      // load: basket of mangoes
      g.save(); g.translate(lp.x, lp.y); g.rotate(la); mangoBasket(g, Math.round(P.load)); g.restore();
      // puller
      kid(g, { x: 724, y: GY, face: -1, lean: s.strain ? -8 + Math.sin(L.t * .5) * 3 : -6, armA: [hand[0] - 724, hand[1] - GY], armB: [hand[0] - 724 + 2, hand[1] - GY + 16], strain: s.strain || (need > can ? .6 : 0), shirt: '#D98A1C' });
      // spring balance tag
      tag(g, 700, GY - 160, `Pull ${Math.round(need)} N`, need > can ? '#B23A2A' : '#1F6F66', '#fff', 13);
      tag(g, 700, GY - 190, `You can pull ${can} N`, '#FFF9EF', '#5E4634', 12);
      if (s.pulled > 0 && need <= can) tag(g, 830, GY - 20, `Rope pulled ${r1(s.pulled / 100)} m`, '#FFF9EF', '#5E4634', 12);
    },
  },

  /* ---------------------------------------------------------------- windmill */
  windmill: {
    scene: 'outdoor', ground: 'grass', verb: 'Blow!', kinds: ['spin', 'lift'],
    params: [
      { key: 'blade', label: 'Blade angle', min: 0, max: 90, step: 5, value: 10, unit: '°' },
      { key: 'wind', label: 'Wind speed', min: 1, max: 5, step: 1, value: 2, names: ['Breeze', 'Light wind', 'Windy', 'Strong wind', 'Gale'] },
    ],
    goal: { kind: 'lift', text: 'Turn the windmill fast enough to lift the cup of clips' },
    hub: { x: 430, y: 170 },
    launch(L) {
      const { M } = L, s = L.s;
      const rotor = M.Bodies.circle(this.hub.x, this.hub.y, 40, { frictionAir: .025, collisionFilter: { mask: 0 }, label: 'rotor' });
      M.Body.setMass(rotor, 2); M.Body.setInertia(rotor, 2600);
      L.add(rotor); s.rotor = rotor; s.cup = GY - 30; s.spin = 0; s.done = 0; s.rpmMax = 0; s.wind = 0;
      L.sound('whoosh');
    },
    torque(P) { const w = clamp(P.wind, 0, 8), b = rad(clamp(P.blade, 0, 90)), nb = clamp(P.blades ?? 4, 1, 12); return .00042 * w * w * Math.sin(2 * b) * (1 - Math.exp(-nb / 2.2)); },
    step(L) {
      const s = L.s, r = s.rotor, P = L.P;
      s.wind = Math.min(1, s.wind + .02);
      L.M.Body.setPosition(r, this.hub); L.M.Body.setVelocity(r, { x: 0, y: 0 });
      let tq = this.torque(P) * s.wind - .00009 * Math.sign(r.angularVelocity);
      const lifting = L.goal.kind === 'lift' && s.cup > this.hub.y + 50;
      if (lifting) tq -= .00055 * clamp(P.load ?? 4, 0, 30) / 4;
      if (Math.abs(r.angularVelocity) < .0005 && tq < 0) tq = 0;
      L.spin(r, tq);
      if (lifting) s.cup = Math.min(GY - 30, s.cup - r.angularVelocity * 30);
      const rpm = Math.abs(r.angularVelocity) * 60 * 60 / TAU; s.rpmMax = Math.max(s.rpmMax, rpm);
      L.read(rpm, false, 'rpm');
      if (L.goal.kind === 'lift') { if (s.cup <= this.hub.y + 50) { if (++s.done > 20) L.finish({ ok: true, rpm }); } else if (L.t > 480) L.finish({ ok: false, rpm, cup: s.cup }); }
      else { if (rpm >= (L.goal.value ?? 60)) { if (++s.done > 90) L.finish({ ok: true, rpm }); } else s.done = 0; if (L.t > 540) L.finish({ ok: false, rpm: s.rpmMax }); }
    },
    judge(L, r) {
      const P = L.P, val = `${Math.round(r.rpm)} rpm`, b = P.blade;
      if (r.ok) return { ok: true, val, text: L.goal.kind === 'lift' ? `The thread wound up and lifted the cup! Blades at ${b}° catch the wind well.` : `Whirr! ${val}. Tilted blades turn the push of the wind into a spin.` };
      const tip = b < 20 ? 'Flat blades just get pushed backwards. Tilt them more.' : b > 70 ? 'Blades almost edge-on let the wind slip past. Tilt them less.' : 'Try a stronger wind, or fine-tune the blade angle.';
      return { ok: false, val, close: clamp(this.torque(P) / this.torque({ ...P, blade: 45, wind: 5 }), 0, .9), text: `${L.goal.kind === 'lift' ? 'Not enough turning force to lift the cup.' : `Only ${val}.`} ${tip}` };
    },
    ghostOf(L) { return { rpm: L.s.rpmMax }; },
    draw(g, L, t) {
      const P = L.P, s = L.s, hb = this.hub, ang = s.rotor ? s.rotor.angle : 0;
      // tower: bamboo pole on a base
      shadow(g, hb.x, GY + 2, 50, 7);
      g.fillStyle = lin(g, hb.x - 8, 0, hb.x + 8, 0, [[0, '#9b8a3c'], [.5, '#d9c56c'], [1, '#86742c']]);
      g.beginPath(); g.moveTo(hb.x - 6, hb.y); g.lineTo(hb.x + 6, hb.y); g.lineTo(hb.x + 12, GY - 20); g.lineTo(hb.x - 12, GY - 20); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(90,80,30,.5)'; g.lineWidth = 2; for (let y = hb.y + 60; y < GY - 20; y += 70) { g.beginPath(); g.moveTo(hb.x - 9, y); g.lineTo(hb.x + 9, y); g.stroke(); }
      cardboard(g, hb.x - 48, GY - 24, 96, 24, 4);
      // cup on thread
      if (L.goal.kind === 'lift') {
        const cy = s.rotor ? s.cup : GY - 30;
        g.strokeStyle = '#eee'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hb.x + 14, hb.y + 6); g.lineTo(hb.x + 14, cy - 18); g.stroke();
        g.fillStyle = lin(g, hb.x, 0, hb.x + 28, 0, [[0, '#f7f7f7'], [1, '#cfd5dc']]);
        g.beginPath(); g.moveTo(hb.x + 2, cy - 18); g.lineTo(hb.x + 26, cy - 18); g.lineTo(hb.x + 23, cy + 8); g.lineTo(hb.x + 5, cy + 8); g.closePath(); g.fill();
        g.strokeStyle = '#9aa3ad'; g.lineWidth = 1; g.stroke();
        g.strokeStyle = '#7E8792'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(hb.x + 10 + i * 4, cy - 20 - i, 4, 2, .3, 0, TAU); g.stroke(); }
        g.save(); g.setLineDash([4, 5]); g.strokeStyle = 'rgba(31,111,102,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(hb.x - 40, hb.y + 50); g.lineTo(hb.x + 70, hb.y + 50); g.stroke(); g.restore();
        tag(g, hb.x + 104, hb.y + 56, 'Lift to here', '#1F6F66', '#fff', 12);
      }
      // rotor
      const nb = clamp(Math.round(P.blades ?? 4), 2, 8), pitch = rad(clamp(P.blade, 0, 90)), cols = ['#C2502A', '#F0B44C', '#1F6F66', '#8C3557', '#4C7424', '#2f6fb0', '#D98A1C', '#5E4634'];
      g.save(); g.translate(hb.x, hb.y); g.rotate(ang);
      for (let i = 0; i < nb; i++) {
        g.save(); g.rotate(i * TAU / nb);
        const w = 34 * Math.max(.08, Math.cos(pitch));
        g.beginPath(); g.moveTo(10, -4); g.lineTo(118, -w / 2); g.quadraticCurveTo(124, 0, 118, w / 2); g.lineTo(10, 4); g.closePath();
        g.fillStyle = lin(g, 0, -w / 2, 0, w / 2, [[0, shade(cols[i % 8], .2)], [1, shade(cols[i % 8], -.2)]]); g.fill();
        g.strokeStyle = 'rgba(40,20,5,.3)'; g.lineWidth = 1; g.stroke();
        g.strokeStyle = '#e9d7b0'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, 0); g.lineTo(116, 0); g.stroke();
        g.restore();
      }
      g.fillStyle = '#5b3a1e'; g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fill(); g.fillStyle = '#F0B44C'; g.beginPath(); g.arc(-3, -3, 5, 0, TAU); g.fill();
      g.restore();
      // pitch diagram
      g.save(); g.translate(hb.x + 200, 80); g.fillStyle = 'rgba(255,249,239,.85)'; rr(g, -48, -40, 120, 92, 12); g.fill();
      g.fillStyle = '#5E4634'; g.font = '700 11px "DM Sans", sans-serif'; g.textAlign = 'center'; g.fillText('Blade seen from above', 12, -24);
      arrow(g, -38, 12, -8, 12, '#2f6fb0', 3);
      g.rotate(-pitch); g.fillStyle = '#C2502A'; rr(g, 2, -3, 40, 6, 3); g.fill(); g.restore();
      // wind fan at the left
      fanBox(g, 70, GY, s.rotor ? s.wind * clamp(P.wind, 0, 8) : 0, t);
    },
    drawGhost(g, gh) { if (gh?.rpm) tag(g, 640, 40, `Last try: ${Math.round(gh.rpm)} rpm`, 'rgba(255,249,239,.8)', '#6E5442', 12); },
  },

  /* ---------------------------------------------------------------- wheel and axle */
  'wheel-axle': {
    scene: 'outdoor', ground: 'grass', verb: 'Turn!', kinds: ['lift', 'least-force'],
    params: [
      { key: 'wheel', label: 'Wheel size', min: 1, max: 5, step: 1, value: 2, names: ['Tiny', 'Small', 'Medium', 'Big', 'Huge'] },
      { key: 'axle', label: 'Axle size', min: 1, max: 3, step: 1, value: 3, names: ['Thin', 'Medium', 'Thick'] },
      { key: 'load', label: 'Bucket of water', min: 5, max: 30, step: 5, value: 20, unit: ' kg' },
    ],
    goal: { kind: 'lift', value: 80, text: 'Wind the bucket up out of the well' },
    hub: { x: 560, y: GY - 150 },
    radii(P) { return { rw: 30 + 16 * clamp(P.wheel, .5, 6), ra: 6 + 5 * clamp(P.axle, .5, 4) }; },
    need(P) { const { rw, ra } = this.radii(P); return clamp(P.load, 0, 999) * 10 * ra / rw * 1.08; },
    launch(L) {
      const { M } = L, s = L.s, P = L.P;
      const rotor = M.Bodies.circle(this.hub.x, this.hub.y, 30, { frictionAir: .05, collisionFilter: { mask: 0 }, label: 'rotor' });
      M.Body.setMass(rotor, 3); M.Body.setInertia(rotor, 4000);
      L.add(rotor); s.rotor = rotor; s.depth = 0; s.need = this.need(P); s.can = L.goal.value ?? 80; s.rest = 0; s.strain = 0;
      L.sound('click');
    },
    step(L) {
      const s = L.s, r = s.rotor, P = L.P, { rw, ra } = this.radii(P), m = clamp(P.load, 0, 999);
      L.M.Body.setPosition(r, this.hub); L.M.Body.setVelocity(r, { x: 0, y: 0 });
      const F = Math.min(s.can, s.need * 1.15), wmax = .06;
      // torques (N·px scaled): effort at the wheel rim against the load hanging on the axle
      let tq = (F * rw - m * 10 * ra * 1.08) * 3e-6;
      if (r.angularVelocity > wmax) tq = Math.min(tq, 0);
      if (s.depth <= 0 && tq < 0) { tq = 0; L.M.Body.setAngularVelocity(r, 0); }
      L.spin(r, tq);
      s.depth = Math.max(0, s.depth + r.angularVelocity * ra);
      if (s.need > s.can) { s.strain = 1; }
      L.read(s.depth / 100, false, 'm up');
      if (s.depth >= 230) { if (++s.rest > 20) L.finish({ ok: true }); }
      else if (L.t > 360 && s.need > s.can) L.finish({ ok: false });
      else if (L.t > 900) L.finish({ ok: false });
    },
    judge(L, r) {
      const P = L.P, need = Math.round(this.need(P)), can = L.goal.value ?? 80, { rw, ra } = this.radii(P), k = r1(rw / ra);
      if (r.ok) return { ok: true, val: `${need} N`, text: `Up came the bucket with only ${need} N! The wheel is ${k}× wider than the axle, so your force is multiplied ${k} times.` };
      return { ok: false, val: `${need} N`, close: can / need, text: `The handle will not turn: it needs ${need} N and you have ${can} N. A bigger wheel or a thinner axle makes it easier.` };
    },
    ghostOf() { return null; },
    draw(g, L, t) {
      const P = L.P, s = L.s, hb = this.hub, { rw, ra } = this.radii(P), ang = s.rotor ? s.rotor.angle : 0, need = this.need(P), can = L.goal.value ?? 80;
      // well: cut-away shaft
      const wx0 = hb.x - 70, wx1 = hb.x + 70, depth = 250;
      g.fillStyle = lin(g, 0, GY, 0, GY + depth, [[0, '#3b2a1c'], [1, '#1d140c']]); g.fillRect(wx0 + 14, GY - 2, wx1 - wx0 - 28, depth);
      g.fillStyle = 'rgba(80,150,200,.75)'; g.fillRect(wx0 + 14, GY + 240 - 20, wx1 - wx0 - 28, 30);
      stoneWall(g, wx0, GY - 44, wx1 - wx0, 44);
      // posts
      g.save(); g.translate(hb.x - 92, hb.y - 14); wood(g, -9, 0, 18, GY - 44 - hb.y + 14, 4, undefined, 4); g.restore();
      g.save(); g.translate(hb.x + 92, hb.y - 14); wood(g, -9, 0, 18, GY - 44 - hb.y + 14, 4, undefined, 6); g.restore();
      // rope and bucket
      const by = GY + 200 - (s.depth || 0);
      g.strokeStyle = '#C9A36A'; g.lineWidth = 3; g.beginPath(); g.moveTo(hb.x + ra, hb.y); g.lineTo(hb.x + ra, by - 16); g.stroke();
      bucket(g, hb.x + ra, by - 16, 46, 38, `${Math.round(P.load)} kg`);
      // axle drum
      g.fillStyle = lin(g, 0, hb.y - ra, 0, hb.y + ra, [[0, '#d9b277'], [1, '#8f6430']]); g.beginPath(); g.arc(hb.x, hb.y, ra, 0, TAU); g.fill();
      g.strokeStyle = '#C9A36A'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(hb.x, hb.y, ra - 2 - i * 2, ang + i, ang + i + 4); g.stroke(); }
      // wheel
      g.save(); g.translate(hb.x, hb.y); g.rotate(ang);
      g.strokeStyle = '#8B5A2B'; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, rw, 0, TAU); g.stroke();
      g.strokeStyle = '#C98B4A'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, rw, 0, TAU); g.stroke();
      g.strokeStyle = '#A86B33'; g.lineWidth = 5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.cos(i * TAU / 6) * ra, Math.sin(i * TAU / 6) * ra); g.lineTo(Math.cos(i * TAU / 6) * rw, Math.sin(i * TAU / 6) * rw); g.stroke(); }
      g.fillStyle = '#5b3a1e'; g.beginPath(); g.arc(rw, 0, 8, 0, TAU); g.fill();
      g.restore();
      g.fillStyle = '#3a2a18'; g.beginPath(); g.arc(hb.x, hb.y, 5, 0, TAU); g.fill();
      // force arrow at the rim (handle)
      const hx = hb.x + Math.cos(ang) * rw, hy = hb.y + Math.sin(ang) * rw;
      kid(g, { x: hb.x - rw - 70, y: GY - 44 + 44, face: 1, lean: 10, armA: [hx - (hb.x - rw - 70), hy - GY], armB: [hx - (hb.x - rw - 70) - 4, hy - GY + 8], strain: s.strain || 0, shirt: '#4C7424' });
      tag(g, hb.x, hb.y - rw - 30, `Turning force ${Math.round(need)} N`, need > can ? '#B23A2A' : '#1F6F66', '#fff', 13);
      tag(g, hb.x, hb.y - rw - 58, `You can push ${can} N`, '#FFF9EF', '#5E4634', 12);
      // dimension labels
      g.save(); g.strokeStyle = 'rgba(31,111,102,.9)'; g.lineWidth = 2; g.setLineDash([4, 4]);
      g.beginPath(); g.moveTo(hb.x, hb.y); g.lineTo(hb.x - rw, hb.y); g.stroke(); g.restore();
    },
  },

  /* ---------------------------------------------------------------- propeller boat */
  'propeller-boat': {
    scene: 'outdoor', ground: 'water', verb: 'Let go!', unit: { px: 200, label: 'm' }, kinds: ['distance', 'hit'], gravity: 0,
    params: [
      { key: 'twists', label: 'Rubber-band twists', min: 5, max: 40, step: 5, value: 10, unit: ' turns' },
      { key: 'prop', label: 'Propeller size', min: 1, max: 3, step: 1, value: 2, names: ['Small', 'Medium', 'Large'] },
    ],
    goal: { kind: 'distance', target: { x: .86, width: .1 }, text: 'Sail the bottle boat across the pond to the flag' },
    wy: GY - 30,
    launch(L) {
      const { M } = L, s = L.s, P = L.P;
      const boat = M.Bodies.rectangle(120, this.wy - 6, 130, 26, { chamfer: { radius: 12 }, frictionAir: 0, label: 'boat' });
      M.Body.setMass(boat, 1.6 + .3 * clamp(P.load ?? 0, 0, 10)); M.Body.setInertia(boat, Infinity);
      L.add(boat); s.boat = boat; s.x0 = boat.position.x; s.rem = s.tw = clamp(P.twists, 1, 200); s.pa = 0; s.rest = 0; s.wake = 0;
      L.sound('whoosh');
    },
    step(L) {
      const s = L.s, b = s.boat, P = L.P, pf = .7 + .3 * clamp(P.prop ?? 2, .5, 4);
      L.M.Body.setPosition(b, { x: b.position.x, y: this.wy - 6 + Math.sin(L.t * .08) * 1.5 }); L.M.Body.setVelocity(b, { x: b.velocity.x, y: 0 });
      let a = 0;
      if (s.rem > 0) { const w = .09 * Math.sqrt(s.rem) / Math.sqrt(pf); s.rem = Math.max(0, s.rem - w); s.pa += w * TAU; a += .0012 * s.rem * pf / b.mass; if (L.t % 4 === 0) L.puff(b.position.x - 78, this.wy + 4, 1, '#ffffff', -1.5, -.5); }
      const v = b.velocity.x; a -= (.004 * v + .012 * v * Math.abs(v) * (.8 + .2 * pf)) / b.mass * 1.6;
      L.push(b, a, 0);
      if (L.t % 6 === 0 && Math.abs(v) > .3) L.ripple(b.position.x - 60, this.wy);
      L.trail(b.position.x + 65, this.wy + 2);
      L.read((b.position.x - s.x0) / this.unit.px);
      s.rest = (s.rem <= 0 && Math.abs(v) < .03) ? s.rest + 1 : 0;
      if (s.rest > 20 || b.position.x > W + 120 || L.t > 1800) { L.M.Body.setVelocity(b, { x: 0, y: 0 }); L.finish({ x: b.position.x + 65, d: (b.position.x - s.x0) / this.unit.px }); }
    },
    judge(L, r) { return travelJudge(L, r, this, 'boat', 'More twists store more energy in the rubber band, so the propeller pushes for longer.'); },
    ghostOf(L) { return { x: L.s.boat.position.x }; },
    draw(g, L, t) {
      const s = L.s, P = L.P, tx = L.goal.target.x * W;
      // far bank with flag
      g.fillStyle = lin(g, 0, GY - 40, 0, GY + 20, [[0, '#7FB04F'], [1, '#4f7d2a']]);
      g.beginPath(); g.moveTo(tx - 10, GY - 34); g.quadraticCurveTo(tx + 20, GY - 46, W + 400, GY - 46); g.lineTo(W + 400, GY + 40); g.lineTo(tx - 30, GY + 40); g.closePath(); g.fill();
      if (L.goal.kind === 'hit') { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(tx - L.goal.target.width * W / 2, this.wy - 6, L.goal.target.width * W, 18); }
      flag(g, tx + 26, GY - 42, t, '#1F6F66', 100);
      // left bank
      g.fillStyle = lin(g, 0, GY - 40, 0, GY + 20, [[0, '#7FB04F'], [1, '#4f7d2a']]);
      g.beginPath(); g.moveTo(-400, GY - 40); g.lineTo(40, GY - 40); g.quadraticCurveTo(70, GY - 34, 60, GY + 40); g.lineTo(-400, GY + 40); g.closePath(); g.fill();
      water(g, L, t, this.wy);
      const x = s.boat ? s.boat.position.x : 120, y = s.boat ? s.boat.position.y : this.wy - 6 + Math.sin(t * .003) * 1.5;
      boat(g, x, y, s.pa || 0, clamp(P.prop ?? 2, .5, 4), s.boat ? s.rem / s.tw : clamp(P.twists, 0, 200) / 40, clamp(P.load ?? 0, 0, 10));
      waterFront(g, L, t, this.wy);
      ruler(g, 185, W - 10, this.unit.px, 'm', .5, L, 185, GY + 30);
    },
    drawGhost(g, gh) { g.save(); g.globalAlpha = .25; boat(g, gh.x, this.wy - 6, 0, 2, 0, 0, true); g.restore(); },
  },
};
PRESETS.ramp.massKg = P => clamp(P.load, 1, 500);
const rough = P => P.friction != null ? clamp((P.friction - 1) / 4, 0, 1) : clamp((P.surface - 1) / 2, 0, 1);
const surfIdx = P => clamp(Math.round(rough(P) * 2), 0, 2);
// Defaults for optional keys that a config may add to any preset (names show on the slider).
const EXTRA = {
  friction: { label: 'Floor roughness', min: 1, max: 5, step: 1, value: 3, names: ['Very smooth', 'Smooth', 'Medium', 'Rough', 'Very rough'] },
  release: { label: 'Launch angle', min: 20, max: 70, step: 5, value: 40, unit: '°' },
  bands: { label: 'Rubber bands', min: 1, max: 4, step: 1, value: 2, unit: '' },
  blades: { label: 'Number of blades', min: 2, max: 8, step: 1, value: 4, unit: '' },
  prop: { label: 'Propeller size', min: 1, max: 3, step: 1, value: 2, names: ['Small', 'Medium', 'Large'] },
};

function M_set(L, b, x) { L.M.Body.setPosition(b, { x, y: b.position.y }); L.M.Body.setVelocity(b, { x: 0, y: 0 }); }
function M_stop(L, b) { L.M.Body.setVelocity(b, { x: 0, y: 0 }); }
/** Move a body along a slope at a steady speed (pushing): velocity is set, gravity still acts via Matter. */
function M_slide(L, b, ang, sp) { L.M.Body.setVelocity(b, { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp }); L.push(b, 0, -G); }
function tipOf(geo, a) { return [geo.HX - Math.cos(a) * geo.L, geo.HY - Math.sin(a) * geo.L]; }
function travelJudge(L, r, pr, what, tip) {
  const tx = L.goal.target.x * W, bw = (L.goal.target.width || .1) * W, val = `${r1(r.d)} m`;
  const ok = L.goal.kind === 'hit' ? Math.abs(r.x - tx) <= bw / 2 : r.x >= tx;
  if (ok) return { ok, val, text: L.goal.kind === 'hit' ? `Parked right in the zone after ${val}!` : `The ${what} went ${val} and crossed the flag!` };
  const short = r.x < tx, by = r1(Math.abs(r.x - tx) / pr.unit.px);
  return { ok, val, close: clamp(1 - Math.abs(r.x - tx) / tx, 0, .95), text: `${short ? 'Stopped' : 'Rolled on'} ${by} m ${short ? 'before' : 'past'} the ${L.goal.kind === 'hit' ? 'zone' : 'flag'}. ${tip}` };
}
function dashed(g, pts, col = 'rgba(94,70,52,.45)') {
  if (!pts || pts.length < 2) return;
  g.save(); g.setLineDash([2, 7]); g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) g.lineTo(p[0], p[1]); g.stroke(); g.restore();
}
function ruler(g, x0, x1, px, unit, every, L, origin = x0, y = GY + 26) {
  g.save(); const dark = L.dark;
  g.fillStyle = dark ? 'rgba(240,180,76,.85)' : 'rgba(240,180,76,.92)'; rr(g, x0, y - 9, x1 - x0, 18, 4); g.fill();
  g.strokeStyle = 'rgba(80,50,10,.7)'; g.fillStyle = '#4a2f0c'; g.font = '600 10px "DM Mono", monospace'; g.textAlign = 'center';
  const stepPx = every * px;
  for (let i = 0, x = origin; x <= x1; i++, x = origin + i * stepPx / 2) {
    const major = i % 2 === 0; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x, y - 9 + (major ? 8 : 4)); g.stroke();
    if (major && x + 14 < x1) g.fillText(`${r1(i / 2 * every)}${i === 0 ? ' ' + unit : ''}`, x, y + 7);
  }
  g.restore();
}
function finish(g, L, tx, t) {
  if (L.goal.kind === 'hit') {
    const bw = (L.goal.target.width || .1) * W;
    g.save(); g.fillStyle = 'rgba(31,111,102,.18)'; g.fillRect(tx - bw / 2, GY - 2, bw, 14); g.strokeStyle = 'rgba(31,111,102,.8)'; g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeRect(tx - bw / 2, GY - 2, bw, 14); g.restore();
    flag(g, tx + bw / 2, GY, t, '#1F6F66', 90);
  } else {
    g.save(); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#2B1A10' : '#FFF9EF'; g.fillRect(tx - 4, GY + i * 3.5 - 1, 8, 3.5); } g.restore();
    flag(g, tx, GY, t, '#C2502A');
  }
}
function basket(g, cx, yb, w, hh, t, wig) {
  g.save(); g.translate(cx, yb); g.rotate(Math.sin(t * .03) * .05 * wig);
  shadow(g, 0, 2, w / 2 + 8, 5);
  g.beginPath(); g.moveTo(-w / 2 - 4, -hh); g.lineTo(w / 2 + 4, -hh); g.lineTo(w / 2 - 4, 0); g.lineTo(-w / 2 + 4, 0); g.closePath();
  g.fillStyle = lin(g, -w / 2, 0, w / 2, 0, [[0, '#9C6A2E'], [.5, '#D9A55C'], [1, '#8a5a22']]); g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(90,50,15,.45)'; g.lineWidth = 2;
  for (let y = -hh + 6; y < 0; y += 8) { g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); }
  for (let x = -w; x < w; x += 10) { g.beginPath(); g.moveTo(x, -hh); g.lineTo(x + 3, 0); g.stroke(); }
  g.restore();
  g.fillStyle = '#7A4E22'; rr(g, -w / 2 - 7, -hh - 5, w + 14, 9, 4); g.fill();
  g.restore();
}
function balloonCar(g, x, yb, br, bs, spin, coins, ghost) {
  const y = yb - 30;
  shadow(g, x, yb + 1, 66, 5, .18);
  // balloon
  if (!ghost && bs > 0) {
    const r = br * bs;
    g.strokeStyle = '#d9d9d9'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 20, y - 14); g.lineTo(x - 78, y - 28); g.stroke();
    g.save(); g.translate(x - 4, y - 18 - r * .8); g.rotate(-.2);
    const gr = g.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r * 1.1); gr.addColorStop(0, '#ff9a9a'); gr.addColorStop(.4, '#E0433D'); gr.addColorStop(1, '#8e1e1a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r * 1.05, r, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-r * .4, -r * .45, r * .22, r * .12, -.6, 0, TAU); g.fill();
    g.restore();
  }
  // bottle body
  g.save(); g.translate(x, y);
  rr(g, -60, -17, 112, 34, 15); g.fillStyle = ghost ? '#888' : 'rgba(150,205,235,.55)'; g.fill();
  if (!ghost) {
    g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, -50, -12, 90, 5, 3); g.fill();
    g.fillStyle = '#4C7424'; g.fillRect(-20, -17, 34, 34); g.fillStyle = '#FFF9EF'; g.font = '700 9px "DM Sans", sans-serif'; g.textAlign = 'center'; g.fillText('AQUA', -3, 4);
    g.fillStyle = '#2f6fb0'; rr(g, 50, -8, 14, 16, 3); g.fill();
    g.strokeStyle = 'rgba(40,90,120,.5)'; g.lineWidth = 1.5; rr(g, -60, -17, 112, 34, 15); g.stroke();
    for (let i = 0; i < Math.min(coins, 6); i++) { g.fillStyle = '#E8B84A'; g.beginPath(); g.ellipse(-40 + i * 7, 12 - i % 2 * 2, 6, 2.5, 0, 0, TAU); g.fill(); g.strokeStyle = '#9a6f12'; g.lineWidth = .8; g.stroke(); }
  }
  g.restore();
  // straw axles + bottle-cap wheels
  for (const wx of [x - 38, x + 34]) {
    g.save(); g.translate(wx, yb - 14); g.rotate(spin);
    g.fillStyle = ghost ? '#777' : lin(g, -14, -14, 14, 14, [[0, '#f26d5b'], [1, '#a8291c']]); g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 9, 0, 1.5); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill(); g.fillStyle = '#5a1810'; g.fillRect(-1, -12, 2, 5);
    g.restore();
  }
}
function toyTruck(g, spin, load, ghost) {
  g.fillStyle = ghost ? '#888' : lin(g, 0, -15, 0, 8, [[0, '#F0B44C'], [1, '#C77A12']]); rr(g, -35, -15, 46, 18, 4); g.fill();
  g.fillStyle = ghost ? '#999' : lin(g, 0, -22, 0, 8, [[0, '#E0533D'], [1, '#a8291c']]); rr(g, 10, -22, 25, 25, 5); g.fill();
  if (!ghost) { g.fillStyle = '#bfe4f7'; rr(g, 18, -18, 13, 9, 2); g.fill(); for (let i = 0; i < Math.min(load, 5); i++) { g.fillStyle = ['#C2502A', '#4C7424', '#2f6fb0'][i % 3]; rr(g, -32 + i * 8.5, -24, 8, 9, 2); g.fill(); } }
  for (const wx of [-22, 22]) { g.save(); g.translate(wx, 6); g.rotate(spin); g.fillStyle = '#2B2B2B'; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.fillStyle = '#c9ced6'; g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill(); g.fillStyle = '#2B2B2B'; g.fillRect(-1, -4, 2, 3); g.restore(); }
}
function crate(g, w, h, kg) {
  g.save(); g.translate(-w / 2, -h / 2); wood(g, 0, 0, w, h, 3, ['#E0B070', '#C08440', '#9a6428'], 21);
  g.strokeStyle = 'rgba(90,45,12,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, 4); g.lineTo(w - 4, h - 4); g.moveTo(w - 4, 4); g.lineTo(4, h - 4); g.stroke();
  g.fillStyle = '#FFF4DE'; rr(g, w / 2 - 18, h / 2 - 9, 36, 18, 4); g.fill(); g.fillStyle = '#7A3B12'; g.font = '700 12px "DM Sans", sans-serif'; g.textAlign = 'center'; g.fillText(`${kg} kg`, w / 2, h / 2 + 4);
  g.restore();
}
function books(g, x, ytop, w) {
  const cols = ['#C2502A', '#1F6F66', '#D98A1C', '#8C3557', '#4C7424', '#2f6fb0'];
  let y = GY, i = 0; shadow(g, x + w / 2, GY + 2, w * .8, 5);
  while (y > ytop + 2 && i < 40) { const hh = Math.min(16, y - ytop); g.fillStyle = cols[i % 6]; rr(g, x - 4 + (i % 3) * 2, y - hh, w + 8, hh, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x + w + 2 + (i % 3) * 2, y - hh + 2, 2, hh - 4); y -= hh; i++; }
}
function shadowRamp(g, len) { g.save(); g.globalAlpha = .15; g.fillStyle = '#000'; g.fillRect(4, 14, len, 6); g.restore(); }
function truckBed(g, x, y) {
  shadow(g, x + 150, GY + 3, 170, 8);
  g.fillStyle = lin(g, 0, y, 0, GY, [[0, '#3f7fbf'], [1, '#235a91']]); rr(g, x, y, 260, GY - y - 20, 6); g.fill();
  g.fillStyle = '#d9b277'; g.fillRect(x, y - 4, 260, 8);
  for (const wx of [x + 50, x + 210]) { g.fillStyle = '#222'; g.beginPath(); g.arc(wx, GY - 22, 22, 0, TAU); g.fill(); g.fillStyle = '#aab'; g.beginPath(); g.arc(wx, GY - 22, 9, 0, TAU); g.fill(); }
}
function mangoBasket(g, kg) {
  g.beginPath(); g.moveTo(-34, -28); g.lineTo(34, -28); g.lineTo(26, 28); g.lineTo(-26, 28); g.closePath();
  g.fillStyle = lin(g, -34, 0, 34, 0, [[0, '#9C6A2E'], [.5, '#D9A55C'], [1, '#8a5a22']]); g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(90,50,15,.45)'; g.lineWidth = 2; for (let y = -24; y < 28; y += 8) { g.beginPath(); g.moveTo(-40, y); g.lineTo(40, y); g.stroke(); } g.restore();
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#F2B33D' : '#E58A1F'; g.beginPath(); g.ellipse(-22 + i * 11, -30 - (i % 2) * 5, 8, 10, .4, 0, TAU); g.fill(); g.fillStyle = '#4C7424'; g.beginPath(); g.ellipse(-20 + i * 11, -40 - (i % 2) * 5, 4, 2, -.6, 0, TAU); g.fill(); }
  g.strokeStyle = '#7A4E22'; g.lineWidth = 3; g.beginPath(); g.moveTo(-28, -28); g.quadraticCurveTo(0, -60, 28, -28); g.stroke();
  g.fillStyle = '#FFF4DE'; rr(g, -18, -2, 36, 16, 4); g.fill(); g.fillStyle = '#7A3B12'; g.font = '700 11px "DM Sans", sans-serif'; g.textAlign = 'center'; g.fillText(`${kg} kg`, 0, 10);
}
function treehouse(g, top) {
  // tree trunk and canopy at the left, platform at "top"
  g.fillStyle = lin(g, 120, 0, 200, 0, [[0, '#6b4423'], [1, '#8f5f33']]); rr(g, 130, top - 40, 56, GY - top + 40, 10); g.fill();
  g.fillStyle = '#3f7a2c'; for (const [cx, cy, r] of [[120, top - 90, 70], [200, top - 120, 80], [260, top - 70, 60], [60, top - 50, 50]]) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); }
  g.fillStyle = '#58993b'; for (const [cx, cy, r] of [[150, top - 120, 40], [230, top - 140, 36]]) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); }
  wood(g, 120, top, 300, 14, 3, undefined, 17);
  g.fillStyle = '#C2502A'; g.beginPath(); g.moveTo(140, top - 60); g.lineTo(210, top - 105); g.lineTo(280, top - 60); g.closePath(); g.fill();
  cardboard(g, 150, top - 60, 120, 60, 3); g.fillStyle = '#3b2a1c'; rr(g, 196, top - 44, 28, 44, 4); g.fill();
  g.save(); g.setLineDash([5, 5]); g.strokeStyle = 'rgba(31,111,102,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(300, top); g.lineTo(560, top); g.stroke(); g.restore();
}
function stoneWall(g, x, y, w, hh) {
  g.fillStyle = '#8d8d86'; rr(g, x, y, w, hh, 6); g.fill();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const sx = x + c * w / 6 + (r % 2) * w / 12 - 4, sy = y + r * hh / 3;
    g.fillStyle = ['#a9a9a1', '#9b9b92', '#b6b5ad'][(r + c) % 3]; rr(g, sx + 1, sy + 1, w / 6 - 2, hh / 3 - 2, 4); g.fill();
  }
  g.fillStyle = '#2a1d12'; g.fillRect(x + 14, y + hh - 2, w - 28, 4);
}
function fanBox(g, x, yb, power, t) {
  shadow(g, x, yb + 2, 34, 5);
  g.fillStyle = '#5E4634'; rr(g, x - 6, yb - 70, 12, 70, 4); g.fill(); g.fillStyle = '#3a2a1c'; rr(g, x - 26, yb - 8, 52, 8, 4); g.fill();
  g.save(); g.translate(x, yb - 100); g.fillStyle = 'rgba(200,210,220,.35)'; g.beginPath(); g.arc(0, 0, 36, 0, TAU); g.fill();
  g.rotate(t * .02 * power); g.fillStyle = '#2f6fb0'; for (let i = 0; i < 3; i++) { g.rotate(TAU / 3); g.beginPath(); g.ellipse(0, -18, 9, 17, 0, 0, TAU); g.fill(); }
  g.restore(); g.strokeStyle = '#8f969f'; g.lineWidth = 2; g.beginPath(); g.arc(x, yb - 100, 38, 0, TAU); g.stroke();
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + 8, yb - 100 + i * 14); g.lineTo(x + 8, yb - 100 + i * 14); g.stroke(); }
}
function water(g, L, t, wy) {
  g.fillStyle = lin(g, 0, wy - 6, 0, GY + 60, [[0, L.dark ? '#2b5f7f' : '#5bb4d8'], [1, L.dark ? '#163449' : '#2a7aa6']]);
  g.beginPath(); g.moveTo(-500, GY + 60); g.lineTo(-500, wy);
  for (let x = -500; x <= W + 500; x += 20) g.lineTo(x, wy + Math.sin(x * .03 + t * .002) * 2.5);
  g.lineTo(W + 500, GY + 60); g.closePath(); g.fill();
  for (const r of L.ripples) { g.strokeStyle = `rgba(255,255,255,${.5 * (1 - r.age / 60)})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(r.x, r.y + 4, 8 + r.age * .8, 2 + r.age * .1, 0, 0, TAU); g.stroke(); }
}
function waterFront(g, L, t, wy) {
  g.fillStyle = 'rgba(91,180,216,.35)'; g.beginPath(); g.moveTo(-500, GY + 60); g.lineTo(-500, wy + 6);
  for (let x = -500; x <= W + 500; x += 20) g.lineTo(x, wy + 6 + Math.sin(x * .05 - t * .003) * 2);
  g.lineTo(W + 500, GY + 60); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const x = (i * 137 + t * .02) % (W + 100) - 50; g.beginPath(); g.moveTo(x, wy + 22 + i % 3 * 10); g.lineTo(x + 26, wy + 22 + i % 3 * 10); g.stroke(); }
}
function boat(g, x, y, pa, prop, wind, cargo, ghost) {
  g.save(); g.translate(x, y);
  // hull: bottle on its side, with a cardboard deck
  rr(g, -64, -14, 128, 28, 13); g.fillStyle = ghost ? '#888' : lin(g, 0, -14, 0, 14, [[0, 'rgba(210,240,255,.9)'], [1, 'rgba(110,180,215,.9)']]); g.fill();
  if (!ghost) {
    g.strokeStyle = 'rgba(40,90,120,.5)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; rr(g, -52, -10, 96, 4, 2); g.fill();
    g.fillStyle = '#2f6fb0'; rr(g, 62, -7, 10, 14, 3); g.fill();
    cardboard(g, -50, -26, 80, 12, 3);
    for (let i = 0; i < Math.min(cargo, 5); i++) { g.fillStyle = ['#C2502A', '#4C7424', '#F0B44C'][i % 3]; rr(g, -44 + i * 14, -38, 12, 12, 2); g.fill(); }
    // ice-cream-stick frame and rubber band
    g.fillStyle = '#E9C88A'; rr(g, -78, -40, 6, 48, 2); g.fill(); rr(g, -70, -40, 30, 6, 2); g.fill();
    g.strokeStyle = '#C2502A'; g.lineWidth = 2.5; g.beginPath();
    const n = 3 + Math.round(wind * 8);
    g.moveTo(-74, -36); for (let i = 0; i <= n; i++) g.lineTo(-74 + (i % 2 ? 3 : -3), -36 + i * 34 / n); g.stroke();
    // propeller (blur when fast)
    g.save(); g.translate(-75, 6); const ps = 10 + 6 * prop;
    g.fillStyle = '#F0B44C'; g.beginPath(); g.ellipse(0, Math.cos(pa) * ps * .5, 3, Math.abs(Math.cos(pa)) * ps + 2, 0, 0, TAU); g.fill();
    g.fillStyle = '#D98A1C'; g.beginPath(); g.ellipse(0, -Math.cos(pa) * ps * .5, 3, Math.abs(Math.cos(pa)) * ps + 2, 0, 0, TAU); g.fill();
    g.restore();
  }
  g.restore();
}

/* ================================ the lab ================================ */
export function mount(stage, cfg, api) {
  const M = api.Matter, gsap = api.gsap;
  const name = PRESETS[cfg.preset] ? cfg.preset : 'catapult', PR = PRESETS[name];
  const g0 = PR.goal, cg = cfg.goal || {};
  const goal = { ...g0, ...cg, target: { ...(g0.target || { x: .8, width: .1 }), ...(cg.target || {}) } };
  if (!PR.kinds.includes(goal.kind)) goal.kind = g0.kind;
  const triesMax = Math.max(1, cfg.tries || 5);
  const defs = (cfg.params?.length ? cfg.params : PR.params).map(p => {
    const d = PR.params.find(x => x.key === p.key) || EXTRA[p.key] || {};
    return { ...d, ...p, names: p.names || (p.min == null || p.min === d.min) && (p.max == null || p.max === d.max) ? (p.names || d.names) : p.names };
  });
  const P = {}; PR.params.forEach(p => { P[p.key] = p.value; }); defs.forEach(p => { P[p.key] = +p.value; });

  const root = h(`<div class="lab-physics">
    <div class="lp-view">
      <canvas class="lp-canvas" role="img" aria-label="${esc(cfg.title || 'Machine')} simulation"></canvas>
      <div class="lp-hud">
        <div class="lp-goal"><span class="lp-goal-ic" aria-hidden="true">🎯</span><span>${esc(goal.text)}</span></div>
        <div class="lp-tries" aria-live="polite"><span>Try</span> <b>1</b><span class="lp-of"> of ${triesMax}</span></div>
      </div>
      <div class="lp-read" aria-live="polite"><small>${esc(readLabel(name, goal))}</small><b>—</b></div>
      <div class="lp-banner" aria-hidden="true"></div>
    </div>
    <div class="lp-panel">
      <p class="lp-ptitle">Change the machine</p>
      <div class="lp-sliders">${defs.map((p, i) => `
        <label class="lp-sl" for="lp-${i}">
          <span class="lp-sl-top"><span>${esc(p.label || p.key)}</span><output>${esc(fmtVal(p, P[p.key]))}</output></span>
          <input id="lp-${i}" type="range" min="${p.min ?? 0}" max="${p.max ?? 10}" step="${p.step ?? 1}" value="${P[p.key]}" data-k="${esc(p.key)}">
        </label>`).join('')}</div>
      <button type="button" class="lp-go"><span class="lp-go-ic" aria-hidden="true">▶</span><span class="lp-go-t">${esc(PR.verb)}</span></button>
      <ol class="lp-log" aria-label="Your tries"></ol>
    </div>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const view = $('.lp-view'), cv = $('.lp-canvas'), g = cv.getContext('2d'), bg = document.createElement('canvas');
  const readB = $('.lp-read b'), readS = $('.lp-read small'), banner = $('.lp-banner'), goBtn = $('.lp-go'), log = $('.lp-log');
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');

  const engine = M.Engine.create({ gravity: { x: 0, y: PR.gravity ?? 1, scale: .001 } });
  const L = {
    M, engine, P, goal, state: 'idle', s: {}, t: 0, trailPts: [], particles: [], ripples: [], fx: {}, dark: darkMQ.matches,
    add(b) { M.Composite.add(engine.world, b); }, addStatic(b) { M.Composite.add(engine.world, b); },
    push(b, ax, ay) { M.Body.applyForce(b, b.position, { x: ax * b.mass / DT2, y: ay * b.mass / DT2 }); },
    spin(b, alpha) { b.torque += alpha * b.inertia / DT2; }, // alpha: angular acceleration in rad/step²
    trail(x, y) { const p = L.trailPts, l = p[p.length - 1]; if (!l || Math.hypot(l[0] - x, l[1] - y) > 6) p.push([x, y]); },
    puff(x, y, n, col, vx0 = 0, vy0 = 0) {
      if (api.reduced) n = Math.min(n, 2);
      for (let i = 0; i < n; i++) L.particles.push({ x: x + (Math.random() - .5) * 10, y: y - Math.random() * 4, vx: vx0 + (Math.random() - .5) * 2.4, vy: vy0 - Math.random() * 1.6, r: 3 + Math.random() * 5, life: 0, max: 30 + Math.random() * 25, col });
    },
    ripple(x, y) { L.ripples.push({ x, y, age: 0 }); },
    sound: k => api.sound(k),
    read(v, force, unit) { readB.textContent = force ? `${Math.round(v)} N` : unit ? `${unit === 'rpm' ? Math.round(v) : r1(v)} ${unit}` : PR.unit ? `${PR.unit.label === 'cm' ? Math.round(v) : r1(v)} ${PR.unit.label}` : r1(v); },
    finish(res) { if (L.state !== 'run') return; L.state = 'done'; onFinish(res); },
  };
  // torque helper (alpha = angular acceleration in rad/step²)
  const onCollide = e => { if (L.state !== 'run' || !PR.collide) return; for (const p of e.pairs) PR.collide(L, p.bodyA.parent, p.bodyB.parent); };
  M.Events.on(engine, 'collisionStart', onCollide);

  let tries = 0, ghost = null, best = 0, done = false, raf = 0, last = 0, acc = 0, cw = 0, ch = 0, dpr = 1, sc = 1, ox = 0, oy = 0, bgKey = '';
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 230 + rnd(i) * 120, y: 50 + rnd(i + 9) * 90, s: .7 + rnd(i + 4) * .6, v: .05 + rnd(i + 2) * .08 }));

  function readLabelSet() { readS.textContent = readLabel(name, goal); }
  readLabelSet();

  /* ---- sizing ---- */
  const ro = new ResizeObserver(() => size()); ro.observe(view);
  function size() {
    const r = view.getBoundingClientRect(); if (!r.width || !r.height) return;
    dpr = Math.min(2, devicePixelRatio || 1); cw = r.width; ch = r.height;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); bg.width = cv.width; bg.height = cv.height;
    sc = Math.min(cw / W, ch / H); ox = (cw - W * sc) / 2; oy = ch - H * sc; bgKey = ''; draw(performance.now());
  }
  const onTheme = () => { L.dark = darkMQ.matches; bgKey = ''; };
  darkMQ.addEventListener?.('change', onTheme);

  /* ---- background (cached) ---- */
  function paintBg() {
    const gk = typeof PR.ground === 'function' ? PR.ground(P) : PR.ground, key = `${gk}|${L.dark}|${cw}|${ch}`;
    if (key === bgKey) return; bgKey = key;
    const b = bg.getContext('2d'), dark = L.dark;
    b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, bg.width, bg.height);
    b.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
    const x0 = -ox / sc - 2, x1 = (cw - ox) / sc + 2, y0 = -oy / sc - 2, y1 = (ch - oy) / sc + 2;
    if (PR.scene === 'indoor') {
      b.fillStyle = lin(b, 0, y0, 0, GY, dark ? [[0, '#2c2420'], [1, '#3a2e27']] : [[0, '#F4E6CF'], [1, '#EBD6B4']]); b.fillRect(x0, y0, x1 - x0, GY - y0);
      // window
      const wx = 560, wy = 70; b.fillStyle = '#8B5A2B'; rr(b, wx - 8, wy - 8, 236, 186, 10); b.fill();
      b.fillStyle = lin(b, 0, wy, 0, wy + 170, dark ? [[0, '#14203a'], [1, '#3b3352']] : [[0, '#8fd0ef'], [1, '#d8f0fa']]); b.fillRect(wx, wy, 220, 170);
      if (dark) { b.fillStyle = '#f4ead0'; b.beginPath(); b.arc(wx + 170, wy + 40, 16, 0, TAU); b.fill(); for (let i = 0; i < 14; i++) { b.fillStyle = 'rgba(255,255,255,.8)'; b.fillRect(wx + rnd(i) * 220, wy + rnd(i + 3) * 120, 1.6, 1.6); } }
      else { cloud(b, wx + 30, wy + 50, .7); b.fillStyle = '#7fb04f'; b.beginPath(); b.ellipse(wx + 110, wy + 190, 160, 50, 0, 0, TAU); b.fill(); }
      b.fillStyle = '#8B5A2B'; b.fillRect(wx + 106, wy, 8, 170); b.fillRect(wx, wy + 82, 220, 8);
      // chart on the wall
      b.save(); b.translate(170, 90); b.rotate(-.03); b.fillStyle = dark ? '#d9cdb4' : '#FFF9EF'; rr(b, 0, 0, 150, 110, 4); b.fill();
      b.fillStyle = '#C2502A'; b.fillRect(14, 70, 22, 26); b.fillStyle = '#1F6F66'; b.fillRect(46, 46, 22, 50); b.fillStyle = '#D98A1C'; b.fillRect(78, 26, 22, 70); b.fillStyle = '#8C3557'; b.fillRect(110, 56, 22, 40);
      b.fillStyle = '#5E4634'; b.fillRect(70, -6, 10, 10); b.restore();
      // skirting
      b.fillStyle = dark ? '#4a382c' : '#B98A55'; b.fillRect(x0, GY - 22, x1 - x0, 22);
    } else {
      const sky = dark ? [[0, '#141b33'], [.6, '#2d2c4a'], [1, '#4a3a52']] : [[0, '#7cc4ea'], [.65, '#c4e6f3'], [1, '#FCEFD6']];
      b.fillStyle = lin(b, 0, y0, 0, GY, sky); b.fillRect(x0, y0, x1 - x0, GY - y0 + 2);
      if (dark) { for (let i = 0; i < 60; i++) { b.fillStyle = `rgba(255,255,255,${.4 + rnd(i) * .5})`; b.fillRect(x0 + rnd(i * 3) * (x1 - x0), y0 + rnd(i * 7) * (GY - 200 - y0), 1.8, 1.8); } b.fillStyle = '#f4ead0'; b.beginPath(); b.arc(860, 80, 26, 0, TAU); b.fill(); b.fillStyle = 'rgba(244,234,208,.15)'; b.beginPath(); b.arc(860, 80, 48, 0, TAU); b.fill(); }
      else { const sg = b.createRadialGradient(860, 80, 10, 860, 80, 110); sg.addColorStop(0, 'rgba(255,240,180,1)'); sg.addColorStop(.3, 'rgba(255,220,120,.6)'); sg.addColorStop(1, 'rgba(255,220,120,0)'); b.fillStyle = sg; b.fillRect(740, -40, 240, 240); b.fillStyle = '#FFE08A'; b.beginPath(); b.arc(860, 80, 30, 0, TAU); b.fill(); }
      hills(b, x0, x1, GY - 90, dark ? '#2f4a3a' : '#a9cf8a', 1.0, 3);
      hills(b, x0, x1, GY - 45, dark ? '#2a3f2a' : '#86b866', 1.6, 7);
      // a few trees on the hill
      for (let i = 0; i < 6; i++) { const tx = x0 + 80 + i * 210 + rnd(i) * 60, ty = GY - 50 - rnd(i + 2) * 20; b.fillStyle = dark ? '#3a2a1c' : '#6b4423'; b.fillRect(tx - 2, ty, 4, 16); b.fillStyle = dark ? '#24402a' : '#4f8f3a'; b.beginPath(); b.arc(tx, ty - 4, 13, 0, TAU); b.fill(); }
    }
    // ground
    if (gk === 'water') { b.fillStyle = dark ? '#2a3f2a' : '#6fa544'; b.fillRect(x0, GY - 40, x1 - x0, 10); }
    else if (gk === 'grass') {
      b.fillStyle = lin(b, 0, GY, 0, y1, dark ? [[0, '#3b2c1e'], [1, '#22180f']] : [[0, '#a87a4d'], [1, '#6e4b2c']]); b.fillRect(x0, GY, x1 - x0, y1 - GY);
      for (let i = 0; i < 120; i++) { const px = x0 + rnd(i * 5) * (x1 - x0), py = GY + 16 + rnd(i * 11) * (y1 - GY - 16); b.fillStyle = `rgba(${dark ? '255,240,220' : '60,35,15'},${.08 + rnd(i) * .12})`; b.beginPath(); b.ellipse(px, py, 2 + rnd(i * 2) * 4, 1.5 + rnd(i * 3) * 2, 0, 0, TAU); b.fill(); }
      b.fillStyle = lin(b, 0, GY - 4, 0, GY + 14, dark ? [[0, '#4f7d3a'], [1, '#2f5a26']] : [[0, '#8fcf5a'], [1, '#5d9a34']]); b.fillRect(x0, GY - 3, x1 - x0, 16);
      b.strokeStyle = dark ? '#5f8f45' : '#79b84a'; b.lineWidth = 1.6; b.lineCap = 'round';
      for (let x = x0; x < x1; x += 5) { const hh = 4 + rnd(x) * 7; b.beginPath(); b.moveTo(x, GY); b.lineTo(x + (rnd(x + 1) - .5) * 4, GY - hh); b.stroke(); }
    } else {
      const C = { tiles: dark ? ['#5a4c40', '#4d4036'] : ['#EFE6D6', '#E2D4BD'], cardboard: ['#C9A06A', '#B98C52'], carpet: dark ? ['#5a2b34', '#4a222a'] : ['#B5485A', '#9d3a4b'] }[gk] || ['#ddd', '#ccc'];
      b.fillStyle = C[0]; b.fillRect(x0, GY, x1 - x0, y1 - GY);
      if (gk === 'tiles') { for (let x = Math.floor(x0 / 60) * 60, i = 0; x < x1; x += 60, i++) { b.fillStyle = i % 2 ? C[1] : C[0]; b.fillRect(x, GY, 60, y1 - GY); b.fillStyle = 'rgba(0,0,0,.12)'; b.fillRect(x, GY, 1.5, y1 - GY); } b.fillStyle = 'rgba(255,255,255,.35)'; b.fillRect(x0, GY, x1 - x0, 3); }
      if (gk === 'cardboard') { b.strokeStyle = 'rgba(120,80,30,.25)'; for (let x = x0; x < x1; x += 7) { b.beginPath(); b.moveTo(x, GY); b.lineTo(x, y1); b.stroke(); } b.fillStyle = 'rgba(160,110,50,.5)'; b.fillRect(x0, GY, x1 - x0, 3); }
      if (gk === 'carpet') { for (let i = 0; i < 900; i++) { b.fillStyle = `rgba(${rnd(i) > .5 ? '255,255,255' : '0,0,0'},.08)`; b.fillRect(x0 + rnd(i * 3) * (x1 - x0), GY + rnd(i * 5) * (y1 - GY), 2, 2); } b.fillStyle = 'rgba(0,0,0,.18)'; b.fillRect(x0, GY, x1 - x0, 3); }
    }
  }
  function hills(b, x0, x1, base, col, f, seed) {
    b.fillStyle = col; b.beginPath(); b.moveTo(x0, GY + 2);
    for (let x = x0; x <= x1 + 20; x += 20) b.lineTo(x, base + Math.sin(x * .004 * f + seed) * 22 + Math.sin(x * .011 * f + seed * 2) * 10);
    b.lineTo(x1 + 20, GY + 2); b.closePath(); b.fill();
  }

  /* ---- render ---- */
  function draw(t) {
    if (!cw) return;
    paintBg();
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(bg, 0, 0);
    g.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
    if (PR.scene !== 'indoor') for (const c of clouds) { if (!api.reduced) c.x += c.v; if (c.x > (cw - ox) / sc + 60) c.x = -ox / sc - 140; cloud(g, c.x, c.y, c.s, L.dark ? .18 : .9); }
    if (ghost && PR.drawGhost) PR.drawGhost(g, ghost);
    // live trail
    const tp = L.trailPts;
    if (tp.length > 1) { g.save(); g.lineCap = 'round'; for (let i = 1; i < tp.length; i++) { const f = i / tp.length; g.strokeStyle = `rgba(217,138,28,${.15 + .6 * f})`; g.lineWidth = 2 + 4 * f; g.beginPath(); g.moveTo(tp[i - 1][0], tp[i - 1][1]); g.lineTo(tp[i][0], tp[i][1]); g.stroke(); } g.restore(); }
    PR.draw(g, L, t);
    // particles
    for (const p of L.particles) { const f = p.life / p.max; g.fillStyle = p.col; g.globalAlpha = .6 * (1 - f); g.beginPath(); g.arc(p.x, p.y, p.r * (1 + f * 1.4), 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    if (L.fx.stars) for (const s of L.fx.stars) { g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.globalAlpha = Math.max(0, 1 - s.life / 60); g.fillStyle = s.col; star(g, 7); g.restore(); }
  }
  function star(gg, r) { gg.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr2 = i % 2 ? r * .45 : r; gg.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } gg.closePath(); gg.fill(); }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(64, t - (last || t)); last = t;
    if (L.state === 'run') {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 4 && L.state === 'run') { PR.step(L); if (L.state !== 'run') break; M.Engine.update(engine, STEP); L.t++; acc -= STEP; n++; }
      if (n === 4) acc = 0;
    } else acc = 0;
    for (const p of L.particles) { p.life++; p.x += p.vx; p.y += p.vy; p.vx *= .95; p.vy *= .95; }
    L.particles = L.particles.filter(p => p.life < p.max);
    for (const r of L.ripples) r.age++; L.ripples = L.ripples.filter(r => r.age < 60);
    if (L.fx.stars) { for (const s of L.fx.stars) { s.life++; s.x += s.vx; s.y += s.vy; s.vy += .12; s.a += .1; } L.fx.stars = L.fx.stars.filter(s => s.life < 60); }
    if (L.fx.basket) L.fx.basket = Math.max(0, L.fx.basket - .01);
    draw(t);
  }
  raf = requestAnimationFrame(frame);

  /* ---- controls ---- */
  let tickT = 0;
  root.querySelectorAll('.lp-sl input').forEach(inp => {
    const p = defs.find(d => d.key === inp.dataset.k), out = inp.closest('.lp-sl').querySelector('output');
    const fill = () => inp.style.setProperty('--p', `${(inp.value - inp.min) / (inp.max - inp.min) * 100}%`);
    fill();
    inp.addEventListener('input', () => {
      P[p.key] = +inp.value; out.textContent = fmtVal(p, P[p.key]); fill();
      if (L.state === 'done') resetMachine();
      const now = performance.now(); if (now - tickT > 70) { api.sound('tick'); tickT = now; }
      if (gsap && !api.reduced) gsap.fromTo(out, { scale: 1.25 }, { scale: 1, duration: .3, ease: 'back.out(3)' });
    });
  });
  goBtn.addEventListener('click', () => {
    if (L.state === 'run' || done) return;
    if (L.state === 'done') resetMachine();
    tries++; updTries();
    L.state = 'run'; L.t = 0; acc = 0; L.trailPts = []; L.s = {};
    root.classList.add('running'); setDisabled(true);
    if (gsap && !api.reduced) gsap.fromTo(goBtn, { scale: .92 }, { scale: 1, duration: .4, ease: 'elastic.out(1,.4)' });
    banner.classList.remove('show');
    PR.launch(L);
  });
  function setDisabled(on) { root.querySelectorAll('.lp-sl input').forEach(i => { i.disabled = on; }); goBtn.disabled = on; }
  function updTries() { $('.lp-tries b').textContent = tries || 1; $('.lp-tries').classList.toggle('over', tries > triesMax); }
  function resetMachine() {
    if (L.state === 'done') ghost = PR.ghostOf?.(L) ?? ghost;
    M.Composite.clear(engine.world, false, true); L.s = {}; L.state = 'idle'; L.trailPts = []; root.classList.remove('running');
    $('.lp-go-t').textContent = PR.verb;
  }

  function onFinish(res) {
    const j = PR.judge(L, res);
    readB.textContent = j.val;
    root.classList.remove('running'); setDisabled(false);
    const li = document.createElement('li'); li.className = j.ok ? 'ok' : 'no';
    li.innerHTML = `<b>${tries}</b><span>${esc(paramSummary())}</span><em>${esc(j.val)}</em>`;
    log.prepend(li); if (gsap && !api.reduced) gsap.from(li, { x: -16, opacity: 0, duration: .35, ease: 'back.out(2)' });
    banner.textContent = j.ok ? 'Goal!' : (j.text.split(/[.!]/)[0] + '!'); banner.className = `lp-banner show ${j.ok ? 'ok' : 'no'}`;
    if (gsap && !api.reduced) gsap.fromTo(banner, { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2.2)' });
    if (j.ok) {
      done = true; goBtn.disabled = true;
      api.say(j.text, 'good'); api.progress(1);
      celebrate();
      const stars = tries <= Math.ceil(triesMax * .6) ? 3 : tries <= triesMax ? 2 : 1;
      timer = setTimeout(() => api.complete({ stars, message: cfg.win || `${j.text}` }), api.reduced ? 300 : 2200);
    } else {
      api.mistake(); api.say(j.text, tries >= 2 ? 'hint' : 'bad');
      if (tries < 2) {/* bad already played */ } else api.sound('bad');
      best = Math.max(best, clamp(j.close ?? 0, 0, .9)); api.progress(best * .9);
      $('.lp-go-t').textContent = 'Try again';
      if (gsap && !api.reduced) gsap.fromTo(view, { x: 0 }, { x: 0, duration: .4, keyframes: { x: [0, -6, 5, -3, 0] } });
    }
  }
  let timer = 0;
  function celebrate() {
    const c = ['#F0B44C', '#C2502A', '#1F6F66', '#4C7424', '#8C3557'];
    const fx = goal.target ? goal.target.x * W : 500;
    L.fx.stars = Array.from({ length: api.reduced ? 6 : 26 }, (_, i) => ({ x: fx, y: GY - 80, vx: (Math.random() - .5) * 7, vy: -3 - Math.random() * 5, a: 0, life: 0, col: c[i % 5] }));
    L.fx.basket = 1; api.sound('pop');
  }
  function paramSummary() { return defs.map(p => fmtVal(p, P[p.key])).join(' · '); }

  api.say(cfg.mission || goal.text);
  return {
    destroy() {
      cancelAnimationFrame(raf); raf = 0; clearTimeout(timer); ro.disconnect();
      darkMQ.removeEventListener?.('change', onTheme);
      M.Events.off(engine, 'collisionStart', onCollide);
      M.Composite.clear(engine.world, false, true); M.Engine.clear(engine);
      root.remove();
    },
  };
}
function fmtVal(p, v) {
  if (p.names && Number.isInteger((v - (p.min ?? 0)) / (p.step || 1))) { const i = Math.round((v - (p.min ?? 0)) / (p.step || 1)); if (p.names[i] != null) return p.names[i]; }
  return `${+(+v).toFixed(2)}${p.unit || ''}`;
}
function readLabel(name, goal) {
  return { catapult: 'Distance', 'balloon-car': 'Distance', ramp: goal.kind === 'least-force' || goal.kind === 'lift' ? 'Push needed' : 'Distance', lever: 'Load lifted', pulley: 'Height', windmill: 'Speed', 'wheel-axle': 'Height', 'propeller-boat': 'Distance' }[name] || 'Result';
}

export const demo = {
  title: 'Ice-cream Stick Catapult',
  preset: 'catapult',
  mission: 'Your catapult is made of ice-cream sticks, rubber bands and a bottle-cap spoon. Change the arm length, the pull-back angle and the ball, then launch. Can you land the ball in the basket?',
  fact: 'A catapult stores energy when you bend the arm and stretch the rubber band. Letting go turns that stored energy into the energy of motion.',
  params: [
    { key: 'arm', label: 'Arm length', min: 1, max: 5, step: 1, value: 3, names: ['Very short', 'Short', 'Medium', 'Long', 'Very long'] },
    { key: 'angle', label: 'Pull-back angle', min: 10, max: 60, step: 5, value: 30, unit: '°' },
    { key: 'load', label: 'Ball', min: 1, max: 3, step: 1, value: 2, names: ['Paper ball', 'Rubber ball', 'Clay ball'] },
  ],
  goal: { kind: 'hit', text: 'Land the ball in the basket', target: { x: .8, width: .09 } },
  tries: 5,
  win: 'Bullseye! More pull-back and a longer arm store more energy, so the ball flies further.',
};
