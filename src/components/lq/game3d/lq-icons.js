/* eslint-disable */
// <lq-icon> and <lq-emblem> custom elements used inside the 3D HUD.
/* <lq-icon name="sun" size="20"> — Lucide-style line icons (24px grid, 1.75 stroke). <lq-emblem size="28"> — LunaQuest orbital mark. */
(function () {
  const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  const R = (x, y, w, h, rx = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
  const p = (...d) => d.map(x => `<path d="${x}"/>`).join('');
  const I = {
    sun: C(12, 12, 4) + p('M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'),
    battery: R(2, 7, 16, 10, 2) + p('M22 11v2'),
    shield: p('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'),
    droplets: p('M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z', 'M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97'),
    sprout: p('M7 20h10', 'M10 20c5.5-2.5.8-6.4 3-10', 'M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z', 'M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z'),
    wind: p('M12.8 19.6A2 2 0 1 0 14 16H2', 'M17.5 8a2.5 2.5 0 1 1 2 4H2', 'M9.8 4.4A2 2 0 1 1 11 8H2'),
    package: p('M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z', 'M12 22V12', 'm3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7', 'm7.5 4.27 9 5.15'),
    zap: p('M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'),
    heart: p('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z', 'M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27'),
    users: p('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75') + C(9, 7, 4),
    alert: p('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'),
    octagon: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86"/>' + p('M12 8v4', 'M12 16h.01'),
    check: p('M20 6 9 17l-5-5'),
    'check-circle': C(12, 12, 10) + p('m9 12 2 2 4-4'),
    info: C(12, 12, 10) + p('M12 16v-4', 'M12 8h.01'),
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: R(14, 4, 4, 16) + R(6, 4, 4, 16),
    'arrow-right': p('M5 12h14', 'm12 5 7 7-7 7'),
    'arrow-left': p('M19 12H5', 'm12 19-7-7 7-7'),
    'chevron-right': p('m9 18 6-6-6-6'), 'chevron-down': p('m6 9 6 6 6-6'), 'chevron-up': p('m18 15-6-6-6 6'),
    settings: p('M20 7h-9', 'M14 17H5') + C(17, 17, 3) + C(7, 7, 3),
    save: p('M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z', 'm9 14 2 2 4-4'),
    flask: p('M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2', 'M8.5 2h7', 'M7 16h10'),
    clock: C(12, 12, 10) + p('M12 6v6l4 2'),
    dashboard: R(3, 3, 7, 9) + R(14, 3, 7, 5) + R(14, 12, 7, 9) + R(3, 16, 7, 5),
    wrench: p('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'),
    book: p('M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'),
    activity: p('M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2'),
    'trend-down': p('M22 17 13.5 8.5 8.5 13.5 2 7', 'M16 17h6v-6'), 'trend-up': p('M22 7 13.5 15.5 8.5 10.5 2 17', 'M16 7h6v6'), minus: p('M5 12h14'),
    plus: p('M5 12h14', 'M12 5v14'),
    reset: p('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'),
    x: p('M18 6 6 18', 'm6 6 12 12'),
    history: p('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'),
    target: C(12, 12, 10) + C(12, 12, 6) + C(12, 12, 2),
    award: p('m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526') + C(12, 8, 6),
    thermo: p('M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z'),
    orbit: C(12, 12, 3) + C(19, 5, 2) + C(5, 19, 2) + p('M10.4 21.9a10 10 0 0 0 9.941-15.416', 'M13.5 2.1a10 10 0 0 0-9.841 15.416'),
    menu: p('M4 12h16', 'M4 6h16', 'M4 18h16'),
    external: p('M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'),
    lock: R(3, 11, 18, 11, 2) + p('M7 11V7a5 5 0 0 1 10 0v4'),
    rocket: p('M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z', 'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z', 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0', 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'),
    mountain: p('m8 3 4 8 5-5 5 15H2L8 3z'),
    moon: p('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'),
    gauge: p('m12 14 4-4', 'M3.34 19a10 10 0 1 1 17.32 0'),
    eye: p('M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0') + C(12, 12, 3),
    calendar: R(3, 4, 18, 18, 2) + p('M16 2v4', 'M8 2v4', 'M3 10h18'),
    home: p('M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
    layers: p('m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z', 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65', 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'),
  };
  class LQIcon extends HTMLElement {
    static get observedAttributes() { return ['name', 'size', 'stroke']; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() {
      const n = this.getAttribute('name') || 'info', s = this.getAttribute('size') || 18, w = this.getAttribute('stroke') || 1.75;
      this.style.display = 'inline-flex'; this.style.flex = 'none'; this.style.lineHeight = '0';
      (this.shadowRoot || this.attachShadow({ mode: 'open' })).innerHTML = `<svg style="display:block" xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || I.info}</svg>`;
    }
  }
  class LQEmblem extends HTMLElement {
    connectedCallback() {
      const s = this.getAttribute('size') || 28;
      this.style.display = 'inline-flex'; this.style.flex = 'none'; this.style.lineHeight = '0';
      (this.shadowRoot || this.attachShadow({ mode: 'open' })).innerHTML = `<svg style="display:block" width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="7.5" fill="#F3F7FC"/><circle cx="18.6" cy="14" r="6.4" fill="#070B14"/><ellipse cx="16" cy="16" rx="14" ry="5.2" transform="rotate(-24 16 16)" stroke="#5DE1FF" stroke-width="1.4"/><circle cx="28.2" cy="10.6" r="1.8" fill="#5DE1FF"/></svg>`;
    }
  }
  if (!customElements.get('lq-icon')) customElements.define('lq-icon', LQIcon);
  if (!customElements.get('lq-emblem')) customElements.define('lq-emblem', LQEmblem);
})();
