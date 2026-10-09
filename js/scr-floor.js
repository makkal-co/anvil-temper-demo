// Lab floor: the pump durability lab as a simplified isometric plan, for someone seeing it for
// the first time. Four bays of two stands, each stand with its controller cabinet, a station PC
// per bay, and a control room holding the lab service and the remote-access gateway. Everything
// is live: stack lights, motors turning, test progress, alarms, shutdowns and stands with their
// power off. Click a stand for its live trend, the server for run history, the gateway for the
// remote view.
(function (M) {
  const ui = M.ui, esc = ui.esc;

  // ---- Isometric projection: floor units x (to the right, back) and y (to the left, front) ----
  const SC = 19, C30 = 0.866;
  const P = (x, y, z = 0) => [(x - y) * C30 * SC, (x + y) * 0.5 * SC - z * SC];
  const pts = (a) => a.map((p) => P(...p).map((v) => v.toFixed(1)).join(',')).join(' ');
  const quad = (a, fill, cls = '') => `<polygon${cls ? ` class="${cls}"` : ''} points="${pts(a)}" fill="${fill}"/>`;

  // Visible faces from this viewpoint: top, front-left (y + d) and front-right (x + w).
  function box(x, y, z, w, d, h, c, attrs = '') {
    return `<g${attrs}>` +
      quad([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], c[1]) +
      quad([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], c[2]) +
      quad([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], c[0]) + '</g>';
  }
  const COL = {
    skid: ['#6b7580', '#47505a', '#57606a'], motor: ['#6f8fae', '#3f5f7e', '#527290'], guard: ['#f0c23a', '#b88a12', '#d2a21f'],
    pump: ['#a7b1bc', '#6f7a86', '#8994a0'], tank: ['#d8cba6', '#a39469', '#bbad84'], cab: ['#e3e7eb', '#aab3bc', '#c3cad1'],
    legacy: ['#c9c3b8', '#948d80', '#aaa398'], desk: ['#b7a184', '#8a7457', '#a08a6c'], mon: ['#2a323c', '#151a20', '#1f262e'],
    wall: ['#e3e7eb', '#c2c9d0', '#d2d8de'], rack: ['#3a424d', '#20262d', '#2c333b'], gw: ['#4a5561', '#2c343d', '#3a434e'],
  };
  const LIGHT = { ok: '#1f9d55', idle: '#5b8fd9', warn: '#e0a100', bad: '#d0312d', off: '#8a939e' };

  const BAYS = { 1: [1, 1], 2: [17, 1], 3: [1, 15], 4: [17, 15] };
  const SERVER = { x: 34.6, y: 2.6 }, GATE = { x: 35.6, y: 21.2 };
  // A stand's origin: two per bay, side by side.
  function origin(r) {
    const [bx, by] = BAYS[r.cell], first = M.sim.stands.filter((s) => s.cell === r.cell)[0] === r;
    return [bx + (first ? 1 : 7.6), by + 1.2];
  }
  const desk = (cell) => { const [bx, by] = BAYS[cell]; return [bx + 5.2, by + 7.4]; };

  function stand(r) {
    const [x, y] = origin(r);
    let s = '';
    if (r.legacy) {
      s += box(x, y, 0, 5.4, 3.2, 0.4, COL.skid) + box(x + 0.4, y + 0.9, 0.4, 2.2, 1.4, 1.3, COL.legacy) + box(x + 3.1, y + 1, 0.4, 1.2, 1.2, 1.1, COL.legacy);
      s += box(x + 0.1, y + 3.5, 0, 1.4, 0.7, 2.0, COL.legacy);                                   // the old panel controller
      s += quad([[x - 0.2, y - 0.2, 0.02], [x + 5.6, y - 0.2, 0.02], [x + 5.6, y + 4.4, 0.02], [x - 0.2, y + 4.4, 0.02]], 'url(#flHatch)');
    } else {
      s += box(x, y, 0, 5.4, 3.2, 0.4, COL.skid);
      s += box(x + 4.5, y + 0.2, 0.4, 0.8, 2.8, 1.7, COL.tank);                                  // oil tank
      s += box(x + 0.4, y + 0.9, 0.4, 2.2, 1.4, 1.3, COL.motor);                                 // drive motor
      s += box(x + 2.6, y + 1.1, 0.4, 0.5, 1.0, 1.0, COL.guard);                                 // coupling guard
      s += box(x + 3.1, y + 1.0, 0.4, 1.2, 1.2, 1.1, COL.pump, ` id="flPump-${r.id}"`);           // pump under test
      // The motor's fan end turns while the stand is running.
      const c = P(x + 0.4, y + 1.6, 1.05);
      s += `<ellipse id="flSpin-${r.id}" class="spin" cx="${(c[0] - 0.1).toFixed(1)}" cy="${c[1].toFixed(1)}" rx="5" ry="8.5"/>`;
      s += box(x + 0.1, y + 3.5, 0, 1.3, 0.8, 2.3, COL.cab);                                     // controller cabinet (cRIO)
      s += quad([[x + 0.35, y + 4.3, 1.4], [x + 1.15, y + 4.3, 1.4], [x + 1.15, y + 4.3, 2.0], [x + 0.35, y + 4.3, 2.0]], '#26303a');   // cabinet display
      // Guarding: a light screen on the two near sides.
      s += `<g class="cage">${quad([[x - 0.2, y + 3.35, 0], [x + 5.6, y + 3.35, 0], [x + 5.6, y + 3.35, 2.1], [x + 1.6, y + 3.35, 2.1], [x + 1.6, y + 3.35, 2.1], [x - 0.2, y + 3.35, 2.1]], 'rgba(120,160,200,.10)')}${quad([[x + 5.6, y - 0.2, 0], [x + 5.6, y + 3.35, 0], [x + 5.6, y + 3.35, 2.1], [x + 5.6, y - 0.2, 2.1]], 'rgba(120,160,200,.08)')}</g>`;
    }
    const b0 = P(x + 1.2, y + 3.6, 2.3), b1 = P(x + 1.2, y + 3.6, 3.3);
    s += `<line x1="${b0[0]}" y1="${b0[1]}" x2="${b1[0]}" y2="${b1[1]}" stroke="#6b7580" stroke-width="1.6"/>`;
    s += `<circle id="flB-${r.id}" class="beacon" cx="${b1[0]}" cy="${b1[1]}" r="5.5" fill="${LIGHT.off}"/>`;
    return `<g class="stn" data-rack="${r.id}">${s}</g>`;
  }

  function cables() {
    let s = '';
    M.sim.stands.forEach((r, i) => {
      if (r.legacy) return;
      const [x, y] = origin(r), [dx, dy] = desk(r.cell);
      const p = [[x + 0.8, y + 4.3], [x + 0.8, dy + 0.6], [dx, dy + 0.6]].map((q) => P(q[0], q[1], 0.02).map((v) => v.toFixed(1)).join(',')).join(' ');
      s += `<polyline id="flC-${r.id}" class="cab" points="${p}"/>`;
    });
    [1, 2, 3, 4].forEach((cell, i) => {
      const [dx, dy] = desk(cell), yy = 13 + i * 0.25;
      const p = [[dx + 2.6, dy + 0.6], [dx + 2.6, yy], [32.4 + i * 0.25, yy], [32.4 + i * 0.25, SERVER.y + 0.6], [SERVER.x, SERVER.y + 0.6]].map((q) => P(q[0], q[1], 0.02).map((v) => v.toFixed(1)).join(',')).join(' ');
      s += `<polyline class="cab bay" points="${p}"/>`;
    });
    const gp = [[SERVER.x + 0.7, SERVER.y + 1.2], [SERVER.x + 0.7, GATE.y], [GATE.x, GATE.y]].map((q) => P(q[0], q[1], 0.02).map((v) => v.toFixed(1)).join(',')).join(' ');
    return s + `<polyline class="cab gw" points="${gp}"/>`;
  }

  function bayFurniture(cell) {
    const [x, y] = desk(cell);
    return `<g data-go="overview">${box(x, y, 0, 2.6, 1.2, 0.9, COL.desk)}${box(x + 0.7, y + 0.2, 0.9, 1.2, 0.12, 0.8, COL.mon)}</g>`;
  }

  function controlRoom() {
    let s = quad([[33, 1, 0], [39, 1, 0], [39, 25, 0], [33, 25, 0]], '#e4e8ec');
    s += box(32.8, 1, 0, 0.2, 24, 2.4, COL.wall);
    s += `<g data-go="data">${box(SERVER.x, SERVER.y, 0, 1.4, 1.2, 3.8, COL.rack)}`;
    for (let k = 0; k < 6; k++) { const p = P(SERVER.x + 0.3, SERVER.y + 1.2, 0.6 + k * 0.52); s += `<circle class="led l${k % 3}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.6"/>`; }
    s += '</g>';
    s += `<g data-go="overview">${box(34.2, 11, 0, 3.2, 1.4, 0.9, COL.desk)}${box(34.5, 11.2, 0.9, 1.1, 0.12, 0.75, COL.mon)}${box(35.9, 11.2, 0.9, 1.1, 0.12, 0.75, COL.mon)}</g>`;
    s += `<g data-go="remote">${box(GATE.x, GATE.y - 0.4, 0, 1.2, 0.9, 1.4, COL.gw)}`;
    const g = P(GATE.x + 0.6, GATE.y, 1.9);
    s += `<path class="wave" d="M${g[0] - 9},${g[1]} q9,-9 18,0 M${g[0] - 14},${g[1] - 3} q14,-14 28,0" /></g>`;
    return s;
  }

  function painted(text, x, y, size = 12, col = '#8a939e') {
    const p = P(x, y);
    return `<text class="paint" transform="matrix(${C30} 0.5 ${-C30} 0.5 ${p[0].toFixed(1)} ${p[1].toFixed(1)})" font-size="${size}" fill="${col}">${text}</text>`;
  }
  const zone = (x, y, w, d) => `<polygon class="zone" points="${pts([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]])}"/>`;

  function labelSlot(r) {
    const [x, y] = origin(r), b = P(x + 1.2, y + 3.6, 3.3);
    return `<g class="lbl" data-rack="${r.id}" transform="translate(${(b[0] + 9).toFixed(1)},${(b[1] - 40).toFixed(1)})">
      <rect id="flLr-${r.id}" width="184" height="46" rx="3"/><text x="7" y="13" class="l1" id="flL1-${r.id}"></text><text x="7" y="27" class="l2" id="flL2-${r.id}"></text>
      <rect x="7" y="34" width="170" height="4" rx="2" class="pbg"/><rect x="7" y="34" width="0" height="4" rx="2" class="pfill" id="flLp-${r.id}"/></g>`;
  }
  function tag(id, x, y, z, w, go) {
    const p = P(x, y, z);
    return `<g class="lbl" data-go="${go}" transform="translate(${(p[0] - w / 2).toFixed(1)},${(p[1] - 36).toFixed(1)})"><rect id="${id}r" width="${w}" height="34" rx="3"/><text x="7" y="13" class="l1" id="${id}1"></text><text x="7" y="27" class="l2" id="${id}2"></text></g>`;
  }

  function scene() {
    let s = `<defs><pattern id="flHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(138,147,158,.06)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(138,147,158,.45)" stroke-width="2"/></pattern></defs>`;
    s += quad([[0, 0, 0], [40, 0, 0], [40, 26, 0], [0, 26, 0]], '#eef1f4', 'slab');
    for (let i = 2; i < 40; i += 2) s += `<line class="grid" x1="${P(i, 0)[0]}" y1="${P(i, 0)[1]}" x2="${P(i, 26)[0]}" y2="${P(i, 26)[1]}"/>`;
    for (let j = 2; j < 26; j += 2) s += `<line class="grid" x1="${P(0, j)[0]}" y1="${P(0, j)[1]}" x2="${P(40, j)[0]}" y2="${P(40, j)[1]}"/>`;
    s += box(0, -0.3, 0, 40, 0.3, 2.8, COL.wall) + box(-0.3, 0, 0, 0.3, 26, 2.8, COL.wall);
    Object.entries(BAYS).forEach(([c, [x, y]]) => { s += zone(x, y, 14, 9.6) + painted('BAY ' + c, x + 0.4, y + 9.2, 13, '#7d8794'); });
    s += painted('CONTROL ROOM', 33.4, 24.6, 11) + painted('CORRIDOR', 6, 13.6, 10, '#a3abb4');
    s += cables();
    s += controlRoom();
    const all = [...M.sim.stands.map((r) => ({ k: 'stand', r, o: origin(r) })), ...[1, 2, 3, 4].map((c) => ({ k: 'desk', c, o: desk(c) }))];
    all.sort((a, b) => (a.o[0] + a.o[1]) - (b.o[0] + b.o[1]));
    all.forEach((e) => { s += e.k === 'stand' ? stand(e.r) : bayFurniture(e.c); });
    M.sim.stands.forEach((r) => { s += labelSlot(r); });
    [1, 2, 3, 4].forEach((c) => { const [x, y] = desk(c), p = P(x + 1.3, y + 1.2, 0.2);
      s += `<g class="lbl bay" data-go="overview" transform="translate(${(p[0] - 20).toFixed(1)},${(p[1] + 6).toFixed(1)})"><rect id="flD${c}r" width="162" height="19" rx="3"/><text x="6" y="13" class="l2" id="flD${c}2"></text></g>`; });
    s += tag('flSrv', SERVER.x + 0.7, SERVER.y + 0.6, 4.0, 190, 'data') + tag('flGw', GATE.x + 0.6, GATE.y, 2.6, 196, 'remote');
    return s;
  }

  function light(r) {
    const st = ui.rackState(r);
    if (st.led.startsWith('bad')) return 'bad';
    return st.led;
  }

  function paint(root) {
    const $ = (id) => root.querySelector('#' + id);
    M.sim.stands.forEach((r) => {
      const st = ui.rackState(r), l = light(r);
      const b = $('flB-' + r.id); b.setAttribute('fill', LIGHT[l] || LIGHT.off); b.classList.toggle('blink', st.blink === 'R' || r.status === 'poweroff');
      const spin = $('flSpin-' + r.id); if (spin) spin.classList.toggle('on', (r.v.speed || 0) > 50 && r.power !== false);
      const cab = $('flC-' + r.id); if (cab) cab.classList.toggle('off', r.status === 'offline' || r.power === false);
      const hot = (r.lvl.dispT || 0);
      const pump = $('flPump-' + r.id); if (pump) pump.setAttribute('class', hot === 2 ? 'hot2' : hot === 1 ? 'hot1' : '');

      let l1 = `${r.name}`, l2 = '', cls = '', frac = 0;
      if (r.setup) { l1 += ` · ${r.setup.name}_Rev${r.setup.rev}`; const total = M.prof.total(r.setup); frac = Math.min(1, M.sim.elapsed(r) / total); }
      const act = r.alarms.filter((a) => a.state === 'ACTIVE');
      if (r.legacy) { l2 = 'Not migrated — legacy panel controller'; cls = 'off'; }
      else if (r.status === 'offline') { l2 = 'Controller unreachable'; cls = 'off'; }
      else if (r.status === 'poweroff') { l2 = 'Safety relay open — power OFF'; cls = 'bad'; }
      else if (r.status === 'shutdown') { l2 = `Shutting down — step ${r.sd.i + 1} of ${r.sd.steps.length}`; cls = 'bad'; }
      else if (r.status === 'stopped') { l2 = r.stopReason || 'Stopped'; cls = 'bad'; }
      else if (act.length) {
        const a = act[act.length - 1], ch = M.chById[a.ch];
        l2 = `⚠ ${ch ? ch.name : 'Braking resistor'} ${a.sev === 'R' ? 'trip' : 'high'} · ${ui.hours(M.sim.elapsed(r))}`; cls = a.sev === 'R' ? 'bad' : 'warn';
      } else if (r.status === 'running') l2 = `${ui.hours(M.sim.elapsed(r))} of ${Math.round(M.prof.total(r.setup) / 3600).toLocaleString()} h · ${ui.fmtU('speed', r.v.speed)}`;
      else if (r.status === 'manual') { l2 = `Manual control · ${r.manual.user}`; cls = 'warn'; }
      else if (r.status === 'complete') l2 = 'Test complete';
      else l2 = 'Idle · ready for a test';
      if (l2.length > 35) l2 = l2.slice(0, 34) + '…';
      $('flL1-' + r.id).textContent = l1.length > 31 ? l1.slice(0, 30) + '…' : l1;
      const t2 = $('flL2-' + r.id); t2.textContent = l2; t2.setAttribute('class', 'l2 ' + cls);
      $('flLr-' + r.id).setAttribute('class', (ui.state.rackId === r.id ? 'sel ' : '') + cls);
      const pf = $('flLp-' + r.id); pf.setAttribute('width', (170 * frac).toFixed(1)); pf.setAttribute('class', 'pfill ' + (r.status === 'running' && !cls ? '' : 'idle'));
    });
    [1, 2, 3, 4].forEach((c) => {
      const rs = M.sim.stands.filter((r) => r.cell === c);
      $('flD' + c + '2').textContent = `Bay ${c} station${M.scope.cell === c ? ' · you are here' : ''}`;
      $('flD' + c + 'r').setAttribute('class', M.scope.cell === c ? 'sel' : '');
    });
    const running = M.sim.stands.filter((r) => r.status === 'running').length;
    $('flSrv1').textContent = 'Lab service · run history';
    $('flSrv2').textContent = `${running} tests logging · mirrored off the controllers`;
    $('flGw1').textContent = 'Remote access (VPN)';
    $('flGw2').textContent = 'view and stop only — never start';
    const bad = M.sim.stands.filter((r) => ['stopped', 'shutdown', 'poweroff'].includes(r.status)).length;
    $('flSum').textContent = `— 4 bays · 8 stands · ${running} running${bad ? ` · ${bad} stopped` : ''} · ${M.sim.stands.filter((r) => r.status === 'offline').length} not on the system yet`;
  }

  let root, n = 0;
  ui.screens.floor = {
    render(el) {
      root = el;
      el.innerHTML = `<div class="pad fl-pad"><div class="fl-bar"><b>Lab floor</b><span class="muted" id="flSum"></span><span class="sp"></span>
          <span class="fl-key">${[['ok', 'running'], ['idle', 'idle'], ['warn', 'yellow alarm / manual'], ['bad', 'red alarm / stopped'], ['off', 'offline']].map(([k, l]) => `<span><i class="led ${k}"></i>${l}</span>`).join('')}<span><i class="cabkey"></i>data link</span></span></div>
        <div class="fl-wrap" id="flWrap" data-tour="floor"><svg class="fl" viewBox="-480 -100 1250 780" preserveAspectRatio="xMidYMid meet">${scene()}</svg>
          <div class="fl-note">A simplified plan of an invented lab, not to scale. Click a stand for its live trend, a bay station for the overview, the server for run history, the gateway for the remote view.</div></div></div>`;
      el.onclick = (e) => {
        const t = e.target.closest('[data-rack],[data-go]');
        if (!t) return;
        if (t.dataset.rack) { const r = M.sim.rack(+t.dataset.rack); return r.status === 'offline' ? ui.go('overview', null) : ui.go('graph', r.id); }
        if (t.dataset.go === 'remote') return M.remote.open();
        ui.go(t.dataset.go, t.dataset.go === 'overview' ? null : undefined);
      };
      paint(root);
    },
    tick() { if (++n % 2 === 0) paint(root); },
  };
})(globalThis.M = globalThis.M || {});
