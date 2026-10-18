// One activity, start to finish, inside the portal: the lesson (what you need, steps you can tick,
// safety, a table to record in, questions to think about) and the activity's virtual lab.
import { FORMS, projectById } from '../../data/courses.js';
import { progress, save, log } from '../store.js';
import { $, $$, esc, icon, art, toast, confetti, fmtDate } from '../ui.js';

/* ---------- Lessons are loaded per project, on demand ---------- */
const cache = {};
export const lessonsFor = pid => cache[pid];
export function loadLessons(pid) {
  if (cache[pid]) return Promise.resolve(cache[pid]);
  return import(`../../data/lessons/${pid}.js`).then(m => (cache[pid] = m.LESSONS || {}), () => (cache[pid] = {}));
}
export const lessonOf = (pid, n) => cache[pid]?.[n] || null;

// How each lab type is named for children.
export const LAB_KIND = {
  sort: ['Sort it', '🧺'], sequence: ['Put in order', '🔢'], match: ['Match it', '🔗'], layers: ['Build it', '🧱'],
  mix: ['Mix it', '🧪'], grow: ['Grow it', '🌱'], calc: ['Work it out', '🧮'], chart: ['Survey it', '📊'],
  choice: ['Role-play', '💬'], explore: ['Explore', '🔍'], design: ['Design it', '🎨'], train: ['Train the AI', '🤖'],
  physics: ['Physics lab', '🎯'], circuit: ['Circuit lab', '💡'], blocks: ['Code it', '🧩'],
};
export const starsHtml = (n, cls = '') => `<span class="stars ${cls}" aria-label="${n} of 3 stars">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;

/** Open an activity's lab. Saves the best stars and any portfolio image. Resolves when the lab closes. */
export async function launchLab(ctx, p, n, lesson, { record = true } = {}) {
  const { openLab } = await import('../lab/runtime.js');
  const pr = record ? progress(ctx.me.id, p.id, true) : null;
  if (pr) pr.labs ||= {};
  const prev = pr?.labs[n];
  return openLab(lesson.lab, {
    form: p.form,
    label: `Activity ${n} · Virtual lab`,
    best: prev?.stars || 0,
    onComplete({ stars }) {
      if (!pr) return;
      const first = !prev;
      pr.labs[n] = { stars: Math.max(stars, prev?.stars || 0), at: Date.now(), tries: (prev?.tries || 0) + 1 };
      if (first) log(ctx.me.name, `finished the "${lesson.lab.title}" lab with ${stars}★`, ctx.me.schoolId);
      save();
    },
    async onPortfolio(dataUrl, title) {
      if (!pr) return;
      const img = await shrink(dataUrl);
      pr.portfolio.push({ id: `pf_${Date.now().toString(36)}`, kind: 'photo', img, title: title || lesson.lab.title, text: `Made in the ${lesson.lab.title} lab`, at: Date.now() });
      if (!save()) { pr.portfolio.pop(); toast('Storage is full, so the design was not saved.', 'bad'); return; }
      toast('Saved to your portfolio.');
    },
  });
}
// Keep portfolio images small so they fit in browser storage.
function shrink(dataUrl, max = 560) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', .82));
    };
    im.onerror = () => res(dataUrl);
    im.src = dataUrl;
  });
}

/* ---------- The activity page ---------- */
export function activityPage(ctx, pid, n) {
  const p = projectById(pid);
  const a = p.activities.find(x => x.n === n);
  if (!a) return { title: p.title, html: `<div class="empty"><p>That activity does not exist.</p><a class="btn btn-brand" href="#/student/p/${pid}">Back to the project</a></div>`, nav: 'projects' };
  const back = `<a class="back" href="#/student/p/${pid}/activities">← ${esc(p.title)}</a>`;
  if (!lessonsFor(pid)) {
    return { title: a.title, nav: 'projects',
      html: `${back}<div class="act-loading card"><span></span><span></span><span></span><p class="muted">Opening the lesson…</p></div>`,
      mount() { loadLessons(pid).then(() => ctx.rerender()); } };
  }
  const L = lessonOf(pid, n);
  const pr = progress(ctx.me.id, pid, true);
  pr.steps ||= {}; pr.records ||= {}; pr.labs ||= {};
  const st = pr.acts[n];
  const stepsDone = new Set(pr.steps[n] || []);
  const lab = pr.labs[n];
  const idx = p.activities.findIndex(x => x.n === n);
  const prevA = p.activities[idx - 1], nextA = p.activities[idx + 1];
  const kind = L?.lab ? LAB_KIND[L.lab.type] || ['Virtual lab', '🧪'] : null;
  const steps = L?.steps || [];
  const rec = L?.record;
  const recVals = pr.records[n] || [];

  const html = `
    ${back}
    <section class="act-hero f-${p.form}">
      <div class="ah-copy">
        <p class="eyebrow">Activity ${n} of ${p.activities.length} · ${esc(FORMS[p.form].short)}</p>
        <h2>${esc(a.title)}</h2>
        <p class="ah-intro">${esc(L?.intro || a.task)}</p>
        <div class="chips">
          ${L?.time ? `<span class="chip">${icon('clock')} ${esc(L.time)}</span>` : ''}
          ${L?.group ? `<span class="chip">${icon('users')} ${esc(L.group)}</span>` : ''}
          ${L?.where ? `<span class="chip">${icon('home')} ${esc(L.where)}</span>` : ''}
          <span class="chip" title="Where this activity is in the Kaushal Bodh book">${icon('book')} Book p. ${a.page}</span>
          ${st?.done ? `<span class="chip ok">${icon('check')} Done ${fmtDate(st.at)}</span>` : ''}
        </div>
      </div>
      ${L?.lab ? `<div class="ah-lab">
        <div class="lab-card-art">${art(p.art)}<span class="lab-kind" aria-hidden="true">${kind[1]}</span></div>
        <div class="ah-lab-copy">
          <p class="eyebrow">Virtual lab · ${esc(kind[0])}</p>
          <h3>${esc(L.lab.title)}</h3>
          <p>${esc(L.lab.mission)}</p>
          <div class="ah-lab-row"><button class="btn btn-brand" id="play-lab">${icon('play')} ${lab ? 'Play again' : 'Play the lab'}</button>${lab ? starsHtml(lab.stars, 'lg') : '<span class="muted small">Earn up to 3 stars</span>'}</div>
        </div>
      </div>` : ''}
    </section>
    <div class="act-grid">
      <div class="act-main">
        ${L ? `
        ${L.need?.length ? `<section class="card"><h3 class="h-card">${icon('flask')} You'll need</h3><ul class="need">${L.need.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
        <section class="card steps-card">
          <div class="card-head"><h3 class="h-card">${icon('check')} Steps</h3><span class="muted small" id="steps-count">${stepsDone.size} of ${steps.length} done</span></div>
          <ol class="steps">${steps.map((s, i) => `<li class="step ${stepsDone.has(i) ? 'on' : ''}">
            <button class="step-tick" data-step="${i}" aria-pressed="${stepsDone.has(i)}" aria-label="Step ${i + 1} done">${icon('check')}</button>
            <div class="step-body"><span class="step-n">Step ${i + 1}</span><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div>
          </li>`).join('')}</ol>
        </section>
        ${L.safety?.length ? `<section class="callout safety"><span class="callout-ic">${icon('shield')}</span><div><b>Stay safe</b><ul>${L.safety.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></section>` : ''}
        ${rec ? `<section class="card"><h3 class="h-card">${icon('book')} ${esc(rec.title || 'My record')}</h3>
          <div class="rec-wrap"><table class="rec"><thead><tr>${rec.cols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${Array.from({ length: Math.max(rec.rows || 3, recVals.length) }, (_, r) => `<tr>${rec.cols.map((c, ci) => `<td><input data-r="${r}" data-c="${ci}" aria-label="${esc(c)}, row ${r + 1}" value="${esc(recVals[r]?.[ci] || '')}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
          <div class="rec-foot"><button class="btn btn-ghost btn-sm" id="add-row">${icon('plus')} Add a row</button><span class="muted small" id="rec-saved"></span></div></section>` : ''}
        ${L.think?.length ? `<section class="card think"><h3 class="h-card">${icon('idea')} Think about it</h3><ul>${L.think.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
        ${L.fact ? `<aside class="fact-card"><span>💡</span><p><b>Did you know?</b> ${esc(L.fact)}</p></aside>` : ''}`
        : `<section class="card"><p>${esc(a.task)}</p><p class="book-ref">${icon('book')}<span>This activity is on <b>page ${a.page}</b> of your Kaushal Bodh book.</span></p></section>`}
      </div>
      <aside class="act-side">
        <section class="card reflect">
          <h3 class="h-card">${icon('star')} My reflection</h3>
          <label for="reflect" class="muted small">What did you do, and what did you learn?</label>
          <textarea id="reflect" rows="4" maxlength="600" placeholder="We… I learnt… Next time I will…">${esc(st?.note || '')}</textarea>
          ${st?.done
            ? `<div class="btn-row"><button class="btn btn-ghost btn-sm" id="save-note">Update reflection</button><button class="btn btn-sm linkish" id="undo">Mark as not done</button></div>`
            : `<button class="btn btn-brand" id="done">${icon('check')} Mark activity as done</button>`}
        </section>
        <nav class="act-nav" aria-label="Other activities">
          ${prevA ? `<a href="#/student/p/${pid}/a/${prevA.n}"><small>Previous</small><span>${esc(prevA.title)}</span></a>` : '<span></span>'}
          ${nextA ? `<a class="next" href="#/student/p/${pid}/a/${nextA.n}"><small>Next</small><span>${esc(nextA.title)}</span></a>` : `<a class="next" href="#/student/p/${pid}/quiz"><small>Next</small><span>Take the project quiz</span></a>`}
        </nav>
      </aside>
    </div>`;

  return {
    title: a.title, nav: 'projects', html,
    mount(el) {
      $('#play-lab', el)?.addEventListener('click', async () => { await launchLab(ctx, p, n, L); ctx.rerender(); });
      $$('[data-step]', el).forEach(b => b.addEventListener('click', () => {
        const i = +b.dataset.step;
        const set = new Set(pr.steps[n] || []);
        const on = !set.has(i);
        if (on) set.add(i); else set.delete(i);
        pr.steps[n] = [...set].sort((x, y) => x - y);
        save();
        b.setAttribute('aria-pressed', String(on));
        b.closest('.step').classList.toggle('on', on);
        $('#steps-count', el).textContent = `${set.size} of ${steps.length} done`;
        if (on && set.size === steps.length) toast(st?.done ? 'All steps ticked.' : 'All steps done! Write your reflection and mark the activity as done.');
      }));
      // Record table: saves as you type.
      let t;
      const saveRec = () => {
        const rows = [];
        $$('.rec tbody tr', el).forEach((tr, r) => { rows[r] = $$('input', tr).map(i => i.value.trim()); });
        while (rows.length && rows[rows.length - 1].every(v => !v)) rows.pop();
        pr.records[n] = rows; save();
        const s = $('#rec-saved', el); if (s) s.textContent = 'Saved';
      };
      $('.rec', el)?.addEventListener('input', () => { clearTimeout(t); t = setTimeout(saveRec, 400); });
      $('#add-row', el)?.addEventListener('click', () => {
        const tb = $('.rec tbody', el), r = tb.rows.length;
        tb.insertAdjacentHTML('beforeend', `<tr>${rec.cols.map((c, ci) => `<td><input data-r="${r}" data-c="${ci}" aria-label="${esc(c)}, row ${r + 1}"></td>`).join('')}</tr>`);
        tb.lastElementChild.querySelector('input').focus();
      });
      const note = $('#reflect', el);
      const finish = done => {
        const wasDone = !!pr.acts[n]?.done;
        const text = note.value.trim();
        if (done) pr.acts[n] = { done: true, at: pr.acts[n]?.at || Date.now(), note: text };
        else delete pr.acts[n];
        if (done && !wasDone) log(ctx.me.name, `completed "${a.title}"`, ctx.me.schoolId);
        save();
        if (done && !wasDone) {
          const all = p.activities.every(x => pr.acts[x.n]?.done);
          if (all) { confetti(); toast(`All ${p.activities.length} activities done! Time for the quiz.`); }
          else toast('Activity done. Nice work!');
        } else toast(done ? 'Reflection saved.' : 'Marked as not done.');
        ctx.rerender();
      };
      $('#done', el)?.addEventListener('click', () => {
        if (!note.value.trim()) { note.focus(); toast('Write a line or two about what you did first.', 'warn'); return; }
        finish(true);
      });
      $('#save-note', el)?.addEventListener('click', () => finish(true));
      $('#undo', el)?.addEventListener('click', () => finish(false));
    },
  };
}
