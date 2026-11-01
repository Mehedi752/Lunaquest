/* eslint-disable */
// LunaQuest 3D mission — same engine as /mission. Ported from the HTML prototype (lq-game.js).
// Requires window.LQSim (engine bridge) and optional window.LQData, both installed by game-3d.tsx.
/* LunaQuest 3D — Mission 01 "First Light". Real-time three.js world driven by lunaquest-sim.js (the only source of truth).
   Rendering reads engine state; every player action goes through the engine first, animations play after the engine confirms. */
(function () {
  const C = { cyan: '#5DE1FF', ok: '#57D9A3', warn: '#FFC66D', crit: '#FF6B78', ink: '#F3F7FC', mut: '#91A0B7', line: '#1E2A3D' };
  const M01KEY = 'lunaquest.m01', GFXKEY = 'lunaquest.gfx';
  const MOON_G = 1.62;
  const pad = n => String(n).padStart(2, '0');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ROOMS = {
    control: { name: 'Mission Control', x: -11.25, z: -3.6, side: -1 }, life: { name: 'Life Support', x: -3.75, z: -3.6, side: -1 },
    water: { name: 'Water Recycling', x: 3.75, z: -3.6, side: -1 }, power: { name: 'Power Control', x: 11.25, z: -3.6, side: -1 },
    quarters: { name: 'Crew Quarters', x: -11.25, z: 3.6, side: 1 }, science: { name: 'Science Lab', x: -3.75, z: 3.6, side: 1 },
    medical: { name: 'Medical Bay', x: 3.75, z: 3.6, side: 1 }, shelter: { name: 'Radiation Shelter', x: 11.25, z: 3.6, side: 1 },
    corridor: { name: 'Main Corridor', x: 0, z: 0 }, greenhouse: { name: 'Greenhouse', x: 19, z: 0 }, airlock: { name: 'Airlock', x: -16.2, z: 0 },
  };
  const CREW = [
    { id: 'cdr', name: 'Mehedi Hasan', role: 'Commander', color: '#5DE1FF', home: ['control', -11.25, -4.85, Math.PI] },
    { id: 'eng', name: 'Maimuna Rahman', role: 'Flight Engineer', color: '#FFC66D', home: ['power', 11.25, -4.85, Math.PI] },
    { id: 'sci', name: 'Nahid Hasan', role: 'Science Officer', color: '#57D9A3', home: ['science', -3.75, 4.85, 0] },
    { id: 'med', name: 'Joy Barua', role: 'Medical Officer', color: '#FF8A94', home: ['medical', 3.75, 4.85, 0] },
  ];
  const ROUTINE = { cdr: [['control', -12.6, -4.85, Math.PI], ['control', -9.9, -4.85, Math.PI], ['life', -3.75, -4.85, Math.PI]],
    eng: [['power', 12.6, -4.85, Math.PI], ['water', 2.2, -4.85, Math.PI], ['life', -2.4, -4.85, Math.PI]],
    sci: [['science', -5.1, 4.85, 0], ['greenhouse', 18.6, 1.6, -Math.PI / 2], ['science', -2.4, 4.85, 0]],
    med: [['medical', 2.4, 4.85, 0], ['quarters', -11.25, 4.6, 0], ['medical', 5.1, 4.85, 0]] };
  const SPOTS = { leak: ['water', 5.2, -4.95, Math.PI], valve: ['water', 1.3, -4.95, Math.PI], powerCab: ['power', 12.9, -4.95, Math.PI], ghBed: ['greenhouse', 19.2, -1.2, Math.PI],
    seats: [['shelter', 9.7, 4.7, Math.PI], ['shelter', 10.75, 4.7, Math.PI], ['shelter', 11.8, 4.7, Math.PI], ['shelter', 12.85, 4.7, Math.PI]],
    core: [['corridor', -6, 0, 0], ['corridor', -4.5, 0, 0], ['corridor', -3, 0, 0], ['corridor', -1.5, 0, 0]],
    airlock: [['airlock', -16, -0.5, -Math.PI / 2], ['airlock', -16, 0.5, -Math.PI / 2], ['airlock', -15.3, -0.5, -Math.PI / 2], ['airlock', -15.3, 0.5, -Math.PI / 2]] };
  const FACILITIES = {
    habitat: { name: 'Mission Control', room: 'control', icon: 'dashboard' }, oxygen: { name: 'Oxygen Generator', room: 'life', icon: 'wind', eq: 'oxygen', sw: 'oxygen' },
    recycler: { name: 'Water Recycler', room: 'water', icon: 'droplets', eq: 'recycler', sw: 'recycler' }, battery: { name: 'Battery Storage', room: 'power', icon: 'battery', eq: 'battery' },
    solar: { name: 'Solar Arrays', room: 'outside', icon: 'sun', eq: 'solar' }, greenhouse: { name: 'Greenhouse', room: 'greenhouse', icon: 'sprout', eq: 'greenhouse', sw: 'greenhouse' },
    shelter: { name: 'Radiation Shelter', room: 'shelter', icon: 'shield', eq: 'shielding' }, science: { name: 'Science Lab', room: 'science', icon: 'flask', sw: 'research' },
    medical: { name: 'Medical Bay & Reserves', room: 'medical', icon: 'heart', eq: 'reserves' }, comms: { name: 'Communication Antenna', room: 'outside', icon: 'orbit' },
    airlock: { name: 'Airlock', room: 'airlock', icon: 'home' }, quarters: { name: 'Crew Quarters', room: 'quarters', icon: 'users' },
  };

  class LQGame extends HTMLElement {
    connectedCallback() { if (this._started) return; this._started = true; this.init().catch(e => this.fail(e)); }
    disconnectedCallback() {
      this._dead = true; cancelAnimationFrame(this._raf);
      if (this._kd) removeEventListener('keydown', this._kd); if (this._ku) removeEventListener('keyup', this._ku);
      if (this.ro) this.ro.disconnect(); if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); }
    }

    fail(e) {
      console.error(e);
      this.innerHTML = `<div style="position:absolute;inset:0;display:grid;place-items:center;background:#070B14;color:#F3F7FC;font-family:Geist,system-ui,sans-serif;padding:24px;text-align:center">
        <div style="max-width:520px"><h1 style="font-size:28px;margin:0 0 12px">3D view unavailable</h1><p style="color:#C4CEDD;line-height:1.6">Your browser could not start 3D graphics (WebGL), or the 3D engine could not be downloaded. You can still play the same mission in the 2D Mission Control.</p>
        <a href="/mission" style="display:inline-block;margin-top:14px;padding:14px 22px;border-radius:10px;background:#5DE1FF;color:#04111A;font-weight:600;text-decoration:none">Open 2D Mission Control</a></div></div>`;
    }

    async init() {
      Object.assign(this.style, { position: 'absolute', inset: '0', display: 'block', overflow: 'hidden', background: '#000', fontFamily: 'Geist, system-ui, sans-serif', color: C.ink });
      this.innerHTML = `<div data-load style="position:absolute;inset:0;display:grid;place-items:center;background:#05080F;z-index:50"><div style="text-align:center"><div style="font:600 12px 'Geist Mono',monospace;letter-spacing:.18em;color:${C.cyan}">LOADING LUNAR OUTPOST</div><div style="width:240px;height:4px;border-radius:2px;background:#172235;margin:16px auto 0;overflow:hidden"><div data-bar style="height:100%;width:10%;background:${C.cyan};transition:width .3s"></div></div></div></div>`;
      const bar = p => { const b = this.querySelector('[data-bar]'); if (b) b.style.width = p + '%'; };
      await new Promise(r => { const t = () => (window.LQSim ? r() : setTimeout(t, 40)); t(); }); if (this._dead) return;
      this.S = window.LQSim; bar(30);
      this.T = await import('three'); if (this._dead) return; bar(70);
      const probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('No WebGL');
      this.gfx = localStorage.getItem(GFXKEY) || 'medium';
      this.sound = false; this.labels = true; this.autoSpeed = 2.5; this.auto = false; this.cinematicHud = false; this.paused = false; this.panelsOpen = { left: true, right: true };
      this.m01 = this.loadM01();
      this.buildRenderer(); bar(80);
      this.buildWorld(); bar(92);
      this.buildCrew(); this.buildFX(); this.buildHUD(); this.bindInput();
      this.sim = this.S.load(); if (window.LQData) window.LQData.getSpaceWeather();
      this.clock = new this.T.Clock(); this.time = 0;
      this.querySelector('[data-load]').remove();
      this.startIntro();
      const loop = () => { if (this._dead) return; this._raf = requestAnimationFrame(loop); this.frame(); };
      loop();
    }

    /* ---------------- renderer & world ---------------- */
    buildRenderer() {
      const T = this.T;
      this.renderer = new T.WebGLRenderer({ antialias: this.gfx !== 'low', powerPreference: 'high-performance', preserveDrawingBuffer: true });
      this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
      this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
      this.appendChild(this.renderer.domElement);
      this.scene = new T.Scene(); this.scene.background = new T.Color('#000003');
      this.camera = new T.PerspectiveCamera(45, 1, 0.1, 2000);
      this.cam = { target: new T.Vector3(0, 0, 0), r: 30, th: 0.35, ph: 0.85 }; this.goal = { target: new T.Vector3(0, 0, 0), r: 30, th: 0.35, ph: 0.85 };
      this.camMode = 'explore';
      this.applyGfx();
      this.ro = new ResizeObserver(() => { this.resize(); clearTimeout(this._rh); this._rh = setTimeout(() => this.renderHud(), 120); }); this.ro.observe(this); this.resize();
    }
    applyGfx() {
      const q = this.gfx, r = this.renderer;
      r.setPixelRatio(q === 'low' ? 1 : Math.min(devicePixelRatio, q === 'high' ? 2 : 1.5));
      r.shadowMap.enabled = q !== 'low'; r.shadowMap.type = this.T.PCFSoftShadowMap;
      if (this.sun) { this.sun.castShadow = q !== 'low'; this.sun.shadow.mapSize.set(q === 'high' ? 2048 : 1024, q === 'high' ? 2048 : 1024); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } }
      this.particleCount = q === 'low' ? 140 : q === 'high' ? 520 : 320;
      if (this.water) this.water.geo.setDrawRange(0, this.particleCount);
      this.resize();
    }
    resize() { const w = this.clientWidth || 1, h = this.clientHeight || 1; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

    mat(color, o = {}) { return new this.T.MeshStandardMaterial(Object.assign({ color, roughness: .7, metalness: .1 }, o)); }
    box(w, h, d, m, x, y, z, parent, tag) { const me = new this.T.Mesh(new this.T.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; if (tag) me.userData.facility = tag; (parent || this.scene).add(me); return me; }
    cyl(rt, rb, h, m, x, y, z, parent, tag, seg = 20) { const me = new this.T.Mesh(new this.T.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; if (tag) me.userData.facility = tag; (parent || this.scene).add(me); return me; }
    textTex(lines, o = {}) {
      const T = this.T, c = document.createElement('canvas'); c.width = o.w || 512; c.height = o.h || 128; const g = c.getContext('2d');
      g.fillStyle = o.bg || 'rgba(0,0,0,0)'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = o.color || '#9fb3c8'; g.textAlign = 'center'; g.textBaseline = 'middle';
      [].concat(lines).forEach((l, i, a) => { g.font = `${i === 0 ? 700 : 500} ${o.size || 46}px Geist, system-ui, sans-serif`; g.fillText(l, c.width / 2, c.height / 2 + (i - (a.length - 1) / 2) * (o.size || 46) * 1.2); });
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
    }

    buildWorld() {
      const T = this.T, S = this.scene;
      this.clickables = [];
      // lights: harsh low sun, no atmosphere
      this.sun = new T.DirectionalLight('#fff6ea', 3.2); this.sun.position.set(50, 32, -30); this.sun.castShadow = this.gfx !== 'low';
      Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 }); this.sun.shadow.bias = -0.0006; S.add(this.sun);
      S.add(new T.HemisphereLight('#42506a', '#0a0a0a', .35)); S.add(new T.AmbientLight('#ffffff', .08));
      // stars
      const sg = new T.BufferGeometry(), sp = new Float32Array(3000 * 3);
      for (let i = 0; i < 3000; i++) { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 700, s = Math.sqrt(1 - u * u); sp.set([r * s * Math.cos(th), Math.abs(r * u) * .9 + 20, r * s * Math.sin(th)], i * 3); }
      sg.setAttribute('position', new T.BufferAttribute(sp, 3));
      S.add(new T.Points(sg, new T.PointsMaterial({ color: '#dfe8ff', size: 1.4, sizeAttenuation: false })));
      // Earth (procedural texture)
      const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256; const eg = ec.getContext('2d');
      eg.fillStyle = '#1d4f9a'; eg.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 26; i++) { eg.fillStyle = i % 3 ? '#3f7d3a' : '#a08a5a'; eg.beginPath(); eg.ellipse(Math.random() * 512, 40 + Math.random() * 176, 18 + Math.random() * 46, 10 + Math.random() * 30, Math.random() * 3, 0, 7); eg.fill(); }
      eg.globalAlpha = .75; for (let i = 0; i < 60; i++) { eg.fillStyle = '#fff'; eg.beginPath(); eg.ellipse(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 40, 3 + Math.random() * 7, Math.random(), 0, 7); eg.fill(); }
      const et = new T.CanvasTexture(ec); et.colorSpace = T.SRGBColorSpace;
      this.earth = new T.Mesh(new T.SphereGeometry(14, 48, 32), new T.MeshStandardMaterial({ map: et, roughness: .9, emissive: '#0b1c38', emissiveIntensity: .25 }));
      this.earth.position.set(-150, 95, -330); S.add(this.earth);
      // terrain with craters and distant mountains; flat pad around the base
      const CR = [[-52, -40, 9, 2.4], [48, 30, 12, 2.8], [-38, 42, 7, 1.8], [70, -55, 16, 3.2], [-80, 10, 11, 2.6], [25, 70, 8, 2], [-20, -75, 14, 3], [95, 20, 9, 2]];
      const H = (x, z) => {
        let h = Math.sin(x * .05) * Math.cos(z * .045) * 1.1 + Math.sin(x * .13 + z * .07) * .45 + Math.sin(x * .37 - z * .29) * .15;
        const d = Math.hypot(x, z); h += smooth(110, 230, d) * (18 + Math.sin(x * .021) * Math.cos(z * .018) * 16);
        for (const [cx, cz, r, dep] of CR) { const q = Math.hypot(x - cx, z - cz) / r; if (q < 1) h -= (1 - q * q) * dep; else if (q < 1.35) h += (1.35 - q) / .35 * dep * .35; }
        const dx = Math.max(-26 - x, 0, x - 28), dz = Math.max(-32 - z, 0, z - 16); return h * smooth(1, 12, Math.hypot(dx, dz));
      };
      const tg = new T.PlaneGeometry(520, 520, 180, 180); tg.rotateX(-Math.PI / 2);
      const tp = tg.attributes.position, cols = new Float32Array(tp.count * 3);
      for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i), y = H(x, z); tp.setY(i, y - .02); const v = .5 + Math.sin(x * .7) * Math.cos(z * .6) * .04 + (Math.random() - .5) * .05; cols.set([v, v, v * 1.02], i * 3); }
      tg.setAttribute('color', new T.BufferAttribute(cols, 3)); tg.computeVertexNormals();
      const ter = new T.Mesh(tg, new T.MeshStandardMaterial({ color: '#a7a9ad', vertexColors: true, roughness: 1, flatShading: true })); ter.receiveShadow = true; S.add(ter);
      const rocks = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), this.mat('#8a8c90', { roughness: 1, flatShading: true }), 260), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
      let n = 0; while (n < 260) { const x = (Math.random() - .5) * 260, z = (Math.random() - .5) * 260; if (x > -30 && x < 32 && z > -36 && z < 20) continue; const s = .2 + Math.random() ** 3 * 1.6;
        q.setFromEuler(e.set(Math.random() * 3, Math.random() * 3, 0)); m4.compose(new T.Vector3(x, H(x, z) + s * .3, z), q, new T.Vector3(s, s * .7, s)); rocks.setMatrixAt(n++, m4); }
      rocks.castShadow = rocks.receiveShadow = true; S.add(rocks);
      this.buildHabitat(); this.buildExterior();
    }

    buildHabitat() {
      const T = this.T, hab = this.hab = new T.Group(); this.scene.add(hab);
      const wallM = this.mat('#c8d1db', { roughness: .55, metalness: .25 }), floorM = this.mat('#3a4556', { roughness: .8 }), corrM = this.mat('#2b3442', { roughness: .85 });
      const shelterM = this.mat('#7d8a99', { roughness: .6, metalness: .3 });
      this.box(30, .2, 12, floorM, 0, -0.1, 0, hab); this.box(30, .21, 2.4, corrM, 0, -0.095, 0, hab);
      // floor room labels
      for (const [id, r] of Object.entries(ROOMS)) { if (!r.side) continue;
        const p = new T.Mesh(new T.PlaneGeometry(4.6, 1.15), new T.MeshBasicMaterial({ map: this.textTex(r.name.toUpperCase(), { size: 44 }), transparent: true, opacity: .75, depthWrite: false }));
        p.rotation.x = -Math.PI / 2; p.position.set(r.x, .02, r.side * 2.2); hab.add(p); }
      this.cutWalls = [];
      const wall = (w, d, x, z, m = wallM, cut = false, h = 2.4) => { const me = this.box(w, h, d, m, x, h / 2, z, hab); if (cut) { me.userData.fullH = h; this.cutWalls.push(me); } return me; };
      // outer walls with gaps for airlock (west) and greenhouse (east)
      wall(30.3, .15, 0, -6.05); wall(30.3, .15, 0, 6.05, wallM, true);
      wall(.15, 4.8, -15.05, -3.6); wall(.15, 4.8, -15.05, 3.6); wall(.15, 4.8, 15.05, -3.6, wallM, true); wall(.15, 4.8, 15.05, 3.6, wallM, true);
      // partitions
      for (const x of [-7.5, 0, 7.5]) for (const s of [-1, 1]) wall(.15, 4.8, x, s * 3.6, x === 7.5 && s === 1 ? shelterM : wallM, false, 2.4);
      // corridor walls with door gaps (1.4 m) at each room
      for (const s of [-1, 1]) { const xs = [-15, -11.25, -3.75, 3.75, 11.25, 15], segs = [];
        for (let i = 0; i < xs.length - 1; i++) { const a = xs[i] + (i ? .7 : 0), b = xs[i + 1] - (i < xs.length - 2 ? .7 : 0); if (b > a) segs.push([a, b]); }
        for (const [a, b] of segs) wall(b - a, .15, (a + b) / 2, s * 1.2, s === 1 && a > 7 ? shelterM : wallM); }
      // shelter: thicker inner lining + water walls + sliding door
      this.box(7.2, 2.2, .35, shelterM, 11.25, 1.1, 5.7, hab); this.box(.35, 2.2, 4.4, shelterM, 7.75, 1.1, 3.6, hab); this.box(.35, 2.2, 4.4, shelterM, 14.75, 1.1, 3.6, hab);
      this.waterWalls = []; for (const [x, z, w, d] of [[11.25, 5.48, 6.6, .08], [7.95, 3.6, .08, 3.8], [14.55, 3.6, .08, 3.8]]) { const ww = this.box(w, 1.9, d, new T.MeshStandardMaterial({ color: '#2c6db0', emissive: '#1a5ad6', emissiveIntensity: 0, transparent: true, opacity: .55 }), x, 1.05, z, hab, 'shelter'); this.waterWalls.push(ww); }
      for (let i = 0; i < 4; i++) this.box(.8, .45, .5, this.mat('#4b5a6e'), 9.7 + i * 1.05, .22, 5.15, hab, 'shelter');
      this.shelterDoor = this.box(1.38, 2.3, .22, this.mat('#e0a640', { metalness: .5, roughness: .4 }), 11.25, 1.15, 1.2, hab, 'shelter'); this.doorOpen = 1; this.doorGoal = 1;
      // corridor ceiling lights & room lights
      this.roomLights = [];
      for (const [id, r] of Object.entries(ROOMS)) if (r.side) { const l = new T.PointLight('#dceaff', 22, 9, 1.6); l.position.set(r.x, 2.25, r.z); hab.add(l); this.roomLights.push(l); }
      for (const x of [-9, 0, 9]) { const l = new T.PointLight('#dceaff', 14, 8, 1.6); l.position.set(x, 2.2, 0); hab.add(l); this.roomLights.push(l); }
      this.emergency = []; for (const x of [-12, -4, 4, 12]) { const bulb = new T.Mesh(new T.SphereGeometry(.12, 12, 8), new T.MeshBasicMaterial({ color: '#ff3b4d' })); bulb.position.set(x, 2.3, 0); hab.add(bulb);
        const l = new T.PointLight('#ff2a3d', 0, 9, 1.4); l.position.copy(bulb.position); hab.add(l); this.emergency.push({ bulb, l }); }
      // ---- equipment ----
      const dark = this.mat('#1b2433', { roughness: .5, metalness: .4 }), screenM = c => new T.MeshBasicMaterial({ color: c });
      // mission control: desks, screens, big wall display
      this.box(5.2, .8, .9, dark, -11.25, .4, -5.3, hab, 'habitat');
      for (const x of [-12.9, -11.25, -9.6]) this.box(1.3, .75, .05, screenM('#0c3a52'), x, 1.25, -5.55, hab, 'habitat');
      this.wallCanvas = document.createElement('canvas'); this.wallCanvas.width = 512; this.wallCanvas.height = 256; this.wallTex = new T.CanvasTexture(this.wallCanvas); this.wallTex.colorSpace = T.SRGBColorSpace;
      const wd = new T.Mesh(new T.PlaneGeometry(4.2, 2.1), new T.MeshBasicMaterial({ map: this.wallTex })); wd.position.set(-11.25, 1.55, -5.95); wd.userData.facility = 'habitat'; hab.add(wd);
      // life support: O2 tanks + generator
      for (const x of [-5.6, -4.8]) this.cyl(.32, .32, 1.9, this.mat('#e8ecf1', { metalness: .3 }), x, .95, -5.4, hab, 'oxygen');
      this.box(1.6, 1.4, 1, dark, -2.6, .7, -5.3, hab, 'oxygen');
      this.o2Lamp = new T.Mesh(new T.SphereGeometry(.1, 12, 8), new T.MeshBasicMaterial({ color: C.ok })); this.o2Lamp.position.set(-2.6, 1.5, -4.78); hab.add(this.o2Lamp);
      // water recycling: recycler + pipe along north wall with leak joint
      this.box(1.8, 1.5, 1, this.mat('#2a5c8a', { metalness: .4 }), 2.4, .75, -5.3, hab, 'recycler');
      this.cyl(.38, .38, 1.5, this.mat('#9fb7cc', { metalness: .5 }), 4, .75, -5.4, hab, 'recycler');
      this.recLamp = new T.Mesh(new T.SphereGeometry(.1, 12, 8), new T.MeshBasicMaterial({ color: C.ok })); this.recLamp.position.set(2.4, 1.6, -4.78); hab.add(this.recLamp);
      const pipe = this.cyl(.09, .09, 7, this.mat('#b9c6d3', { metalness: .7, roughness: .3 }), 3.75, 1.65, -5.75, hab, 'recycler'); pipe.rotation.z = Math.PI / 2;
      this.joint = this.cyl(.16, .16, .32, this.mat('#b9c6d3', { metalness: .7, roughness: .3, emissive: '#000', emissiveIntensity: 1 }), 5.2, 1.65, -5.75, hab, 'recycler'); this.joint.rotation.z = Math.PI / 2;
      this.valve = this.cyl(.18, .18, .06, this.mat('#d04050'), 1.3, 1.65, -5.6, hab, 'recycler'); this.valve.rotation.x = Math.PI / 2;
      this.leakRing = new T.Mesh(new T.RingGeometry(.35, .45, 32), new T.MeshBasicMaterial({ color: '#FF6B78', transparent: true, opacity: 0, side: T.DoubleSide })); this.leakRing.position.set(5.2, 1.65, -5.62); hab.add(this.leakRing);
      this.puddle = new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshStandardMaterial({ color: '#5aa7ff', transparent: true, opacity: .45, roughness: .05, metalness: .2 })); this.puddle.rotation.x = -Math.PI / 2; this.puddle.position.set(5.3, .015, -5); this.puddle.scale.setScalar(.001); hab.add(this.puddle);
      // power control: cabinets + battery racks with level bars
      this.box(1.4, 1.9, .7, dark, 12.9, .95, -5.5, hab, 'battery');
      this.battBars = []; for (let i = 0; i < 4; i++) { this.box(.5, 1.6, .55, this.mat('#2b3a4f'), 9.2 + i * .65, .8, -5.5, hab, 'battery'); const b = new T.Mesh(new T.BoxGeometry(.3, 1, .02), new T.MeshBasicMaterial({ color: C.ok })); b.position.set(9.2 + i * .65, .3, -5.21); b.userData.facility = 'battery'; hab.add(b); this.battBars.push(b); }
      // quarters: four bunks in crew colours
      CREW.forEach((c, i) => { this.box(1.6, .35, .9, this.mat('#5b6575'), -13.8 + i * 1.75, .3, 5.2, hab, 'quarters'); this.box(1.5, .1, .82, this.mat(c.color, { roughness: .9 }), -13.8 + i * 1.75, .52, 5.2, hab, 'quarters'); });
      // science lab
      this.box(4.6, .85, .9, this.mat('#d9dfe6'), -3.75, .43, 5.35, hab, 'science');
      for (let i = 0; i < 5; i++) this.cyl(.07, .07, .3, new T.MeshStandardMaterial({ color: ['#5DE1FF', '#57D9A3', '#FFC66D', '#739CFF', '#FF8A94'][i], emissive: '#111', transparent: true, opacity: .85 }), -5.2 + i * .35, 1.02, 5.4, hab, 'science');
      // medical
      this.box(2, .55, .9, this.mat('#e7edf3'), 3.2, .3, 5.2, hab, 'medical'); this.box(.9, 1.6, .5, this.mat('#e7edf3'), 5.6, .8, 5.6, hab, 'medical');
      const cross = new T.Mesh(new T.PlaneGeometry(.5, .5), new T.MeshBasicMaterial({ map: this.textTex('+', { size: 120, color: '#FF6B78', w: 128, h: 128 }), transparent: true })); cross.position.set(5.6, 1.3, 5.34); cross.rotation.y = Math.PI; hab.add(cross);
      // airlock module + greenhouse dome + tunnel
      this.box(2.4, 2.6, 3, this.mat('#aeb8c4', { metalness: .3 }), -16.3, 1.3, 0, hab, 'airlock').material = new T.MeshStandardMaterial({ color: '#aeb8c4', metalness: .3, transparent: true, opacity: .35 });
      this.cyl(1.1, 1.1, 1.2, this.mat('#aeb8c4', { metalness: .3, transparent: true, opacity: .3 }), 15.6, 1.1, 0, hab, 'greenhouse').rotation.z = Math.PI / 2;
      const gh = this.gh = new T.Group(); gh.position.set(19.4, 0, 0); hab.add(gh);
      this.box(8.4, .2, 8.4, floorM, 0, -.1, 0, gh, 'greenhouse');
      const dome = new T.Mesh(new T.SphereGeometry(4.1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhysicalMaterial({ color: '#cfe9ff', transparent: true, opacity: .12, roughness: .05, metalness: 0, side: T.DoubleSide, depthWrite: false }));
      dome.userData.facility = 'greenhouse'; gh.add(dome);
      this.plants = []; this.growLights = [];
      for (const z of [-2, 0.2, 2.4]) { this.box(5, .5, 1, this.mat('#6b4f35', { roughness: 1 }), 0, .25, z, gh, 'greenhouse');
        const gl = new T.Mesh(new T.BoxGeometry(5, .06, .18), new T.MeshBasicMaterial({ color: '#ff5ce1' })); gl.position.set(0, 1.9, z); gh.add(gl); this.growLights.push(gl);
        for (let i = 0; i < 8; i++) { const p = new T.Mesh(new T.ConeGeometry(.18, .5, 7), new T.MeshStandardMaterial({ color: '#4caf50', roughness: .8 })); p.position.set(-2.2 + i * .63, .75, z); p.userData.facility = 'greenhouse'; gh.add(p); this.plants.push(p); } }
      this.ghLight = new T.PointLight('#ff7ae6', 10, 7, 1.5); this.ghLight.position.set(0, 2.2, 0); gh.add(this.ghLight);
      // exterior hull (shown in exterior/intro views)
      const hull = this.hull = new T.Group(); hab.add(hull);
      const hullM = new T.MeshStandardMaterial({ color: '#e9edf2', roughness: .45, metalness: .25, transparent: true, opacity: 1 });
      const hb = new T.Mesh(new T.BoxGeometry(30.6, 2.5, 12.6), hullM); hb.position.y = 1.25; hb.castShadow = true; hull.add(hb);
      const roof = new T.Mesh(new T.CylinderGeometry(6.3, 6.3, 30.6, 32), hullM); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, .5); roof.position.y = 2.5; roof.scale.set(.42, 1, 1); roof.castShadow = true; hull.add(roof);
      for (const s of [-1, 1]) for (let i = 0; i < 8; i++) { const w = new T.Mesh(new T.PlaneGeometry(1.4, .5), new T.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 1 })); w.position.set(-12.2 + i * 3.5, 1.7, s * 6.32); w.rotation.y = s > 0 ? 0 : Math.PI; hull.add(w); }
      hull.traverse(o => { if (o.isMesh) o.userData.facility = 'habitat'; });
      this.hullOpacity = 1;
      hab.traverse(o => { if (o.isMesh && o.userData.facility) this.clickables.push(o); });
    }

    buildExterior() {
      const T = this.T, S = this.scene;
      this.solarArrays = [];
      const panelM = new T.MeshStandardMaterial({ color: '#16295a', roughness: .25, metalness: .6, emissive: '#0a1430', emissiveIntensity: .4 });
      for (let i = 0; i < 9; i++) { const g = new T.Group(); g.position.set(-14 + (i % 3) * 9, 0, -15 - Math.floor(i / 3) * 6); S.add(g);
        this.cyl(.08, .08, 2.2, this.mat('#9aa4b2', { metalness: .6 }), 0, 1.1, 0, g, 'solar');
        const p = this.box(6, .08, 3, panelM, 0, 2.3, 0, g, 'solar'); p.rotation.x = -.55; g.userData.idx = i; this.solarArrays.push(g); }
      // battery container outside power room, antenna, rover
      this.box(3, 1.6, 1.8, this.mat('#d8dde4', { metalness: .3 }), 18, .8, -9, S, 'battery');
      const ant = new T.Group(); ant.position.set(-21, 0, -11); S.add(ant);
      this.cyl(.12, .16, 6, this.mat('#c7ced8', { metalness: .6 }), 0, 3, 0, ant, 'comms');
      const dish = new T.Mesh(new T.SphereGeometry(1.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3), this.mat('#f0f3f6', { side: T.DoubleSide, metalness: .3 })); dish.position.set(0, 6.1, 0); dish.rotation.x = -2.2; dish.userData.facility = 'comms'; ant.add(dish);
      this.antLamp = new T.Mesh(new T.SphereGeometry(.12, 10, 8), new T.MeshBasicMaterial({ color: '#ff3b4d' })); this.antLamp.position.set(0, 6.2, 0); ant.add(this.antLamp);
      const rover = new T.Group(); rover.position.set(-22, 0, 9); rover.rotation.y = .6; S.add(rover);
      this.box(2.8, .6, 1.6, this.mat('#e3e7ec', { metalness: .3 }), 0, .9, 0, rover); this.box(1.2, .5, 1.4, this.mat('#2a3445'), -.5, 1.4, 0, rover);
      for (const [x, z] of [[-1, -.9], [1, -.9], [-1, .9], [1, .9]]) { const w = this.cyl(.42, .42, .3, this.mat('#2b2e33', { roughness: 1 }), x, .42, z, rover); w.rotation.x = Math.PI / 2; }
      S.traverse(o => { if (o.isMesh && o.userData.facility && !this.clickables.includes(o)) this.clickables.push(o); });
    }

    /* ---------------- crew ---------------- */
    buildCrew() {
      const T = this.T; this.crew = [];
      CREW.forEach((c, i) => {
        const g = new T.Group(), suit = this.mat('#eef1f5', { roughness: .65 }), accent = this.mat(c.color, { roughness: .5, emissive: c.color, emissiveIntensity: .15 }), dark = this.mat('#2a3140');
        const part = (geo, m, x, y, z, parent = g) => { const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.userData.crewId = c.id; parent.add(me); return me; };
        const legs = [-1, 1].map(s => { const piv = new T.Group(); piv.position.set(s * .12, .9, 0); g.add(piv); part(new T.CapsuleGeometry(.1, .52, 4, 10), suit, 0, -.42, 0, piv); part(new T.BoxGeometry(.2, .14, .3), dark, 0, -.86, .04, piv); return piv; });
        part(new T.CapsuleGeometry(.23, .36, 6, 14), suit, 0, 1.2, 0); part(new T.TorusGeometry(.235, .035, 8, 24), accent, 0, .98, 0).rotation.x = Math.PI / 2;
        part(new T.BoxGeometry(.4, .52, .22), this.mat('#d5dbe3'), 0, 1.22, -.24); part(new T.BoxGeometry(.18, .12, .02), accent, 0, 1.3, .235);
        const arms = [-1, 1].map(s => { const piv = new T.Group(); piv.position.set(s * .31, 1.4, 0); g.add(piv); part(new T.CapsuleGeometry(.075, .42, 4, 10), suit, 0, -.26, 0, piv); part(new T.SphereGeometry(.085, 10, 8), dark, 0, -.53, 0, piv); part(new T.SphereGeometry(.09, 10, 8), accent, 0, 0, 0, piv); return piv; });
        part(new T.SphereGeometry(.21, 20, 16), suit, 0, 1.66, 0);
        part(new T.SphereGeometry(.185, 20, 16, -Math.PI * .45, Math.PI * .9, Math.PI * .25, Math.PI * .45), new T.MeshStandardMaterial({ color: '#d9a43a', metalness: .9, roughness: .15 }), 0, 1.67, .035);
        part(new T.TorusGeometry(.2, .03, 8, 24), accent, 0, 1.5, 0).rotation.x = Math.PI / 2;
        const tag = new T.Sprite(new T.SpriteMaterial({ map: this.textTex([c.name, c.role.toUpperCase()], { size: 40, color: '#fff', bg: 'rgba(7,11,20,.0)' }), depthTest: false, transparent: true }));
        tag.scale.set(2.2, .55, 1); tag.position.set(0, 2.25, 0); tag.renderOrder = 10; g.add(tag);
        const ring = new T.Mesh(new T.RingGeometry(.42, .52, 32), new T.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; g.add(ring);
        g.traverse(o => { if (o.isMesh) this.clickables.push(o); });
        const [room, x, z, yaw] = c.home; g.position.set(x, 0, z); g.rotation.y = yaw; this.hab.add(g);
        this.crew.push({ ...c, g, legs, arms, tag, ring, room, path: [], speed: 1.5, anim: 'work', task: 'Working at station', phase: Math.random() * 6, yaw, wait: 4 + Math.random() * 6, busy: null, onArrive: null, sheltered: false });
      });
    }

    pathTo(cr, room, x, z) {
      const T = this.T, P = []; const cur = cr.room, R = ROOMS;
      const leave = r => { if (R[r] && R[r].side) P.push([R[r].x, R[r].side * 1.2], [R[r].x, 0]); else if (r === 'greenhouse') P.push([16.6, 0], [14.6, 0]); else if (r === 'airlock') P.push([-14.6, 0]); };
      const enter = r => { if (R[r] && R[r].side) P.push([R[r].x, 0], [R[r].x, R[r].side * 1.2]); else if (r === 'greenhouse') P.push([14.6, 0], [16.6, 0]); else if (r === 'airlock') P.push([-14.6, 0]); };
      if (cur !== room) { leave(cur); enter(room); }
      P.push([x, z]);
      return P.map(([a, b]) => new T.Vector3(a, 0, b));
    }
    send(cr, spot, opts = {}) {
      const [room, x, z, yaw] = spot; cr.path = this.pathTo(cr, room, x, z); cr.targetRoom = room; cr.endYaw = yaw;
      cr.speed = opts.run ? 3.1 : 1.5; cr.anim = opts.run ? 'run' : 'walk'; cr.task = opts.task || cr.task; cr.onArrive = opts.then || null; cr.wait = 9999;
    }

    /* ---------------- FX ---------------- */
    buildFX() {
      const T = this.T, N = 520;
      const geo = new T.BufferGeometry(), pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
      geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setDrawRange(0, this.particleCount);
      const pts = new T.Points(geo, new T.PointsMaterial({ color: '#8fd0ff', size: .06, transparent: true, opacity: .9, depthWrite: false })); pts.visible = false; this.hab.add(pts);
      this.water = { geo, pos, vel, pts, on: false, N };
      for (let i = 0; i < N; i++) this.respawnDrop(i, true);
      const sg = new T.BufferGeometry(), sp = new Float32Array(160 * 3), sv = new Float32Array(160 * 3), sl = new Float32Array(160);
      sg.setAttribute('position', new T.BufferAttribute(sp, 3));
      const spk = new T.Points(sg, new T.PointsMaterial({ color: '#ffcc66', size: .07, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); this.hab.add(spk);
      this.sparks = { sg, sp, sv, sl, spk, emit: null };
    }
    respawnDrop(i, init) {
      const w = this.water, o = i * 3, a = (Math.random() - .5) * .9, sp = 1.1 + Math.random() * .9;
      w.pos[o] = 5.2 + (Math.random() - .5) * .06; w.pos[o + 1] = 1.65; w.pos[o + 2] = -5.6;
      w.vel[o] = Math.sin(a) * sp * .6; w.vel[o + 1] = (Math.random() - .2) * .8; w.vel[o + 2] = Math.cos(a) * sp;
      if (init) { const t = Math.random() * 1.4; w.pos[o] += w.vel[o] * t; w.pos[o + 2] += w.vel[o + 2] * t; w.pos[o + 1] += w.vel[o + 1] * t - .5 * MOON_G * t * t; if (w.pos[o + 1] < 0) w.pos[o + 1] = 1.65; }
    }

    /* ---------------- input & camera ---------------- */
    bindInput() {
      const el = this.renderer.domElement, ptrs = new Map(); let down = null, pinch = 0;
      el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); down = { x: e.clientX, y: e.clientY, b: e.button, moved: 0 }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
      el.addEventListener('pointermove', e => {
        const p = ptrs.get(e.pointerId);
        if (!p) { this.hoverAt(e.clientX, e.clientY); return; }
        const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; if (down) down.moved += Math.abs(dx) + Math.abs(dy);
        if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) this.zoom(pinch / d); pinch = d; return; }
        if (this.cineUntil) this.endCine();
        if (down && (down.b === 2 || e.shiftKey)) this.pan(-dx, -dy); else { this.goal.th -= dx * .006; this.goal.ph = clamp(this.goal.ph - dy * .005, .08, 1.45); }
      });
      const up = e => { ptrs.delete(e.pointerId); if (down && down.moved < 6 && ptrs.size === 0) this.pickAt(e.clientX, e.clientY); if (ptrs.size === 0) { down = null; pinch = 0; } };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      el.addEventListener('contextmenu', e => e.preventDefault());
      el.addEventListener('wheel', e => { e.preventDefault(); if (this.cineUntil) this.endCine(); this.zoom(Math.exp(e.deltaY * .0012)); }, { passive: false });
      this.keys = new Set();
      this._kd = e => {
        if (e.target.closest && e.target.closest('input,select,textarea')) return;
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { this.keys.add(k); if (this.camMode === 'follow') this.setMode('explore'); }
        if (k === 'escape') { e.preventDefault(); this.togglePause(); }
        if (k === ' ' && !this.introOn) { e.preventDefault(); this.advance(); }
        if (k === 'h') this.toggleCineHud();
        if (k === 'e' && this.hovered) this.openFacility(this.hovered);
        if (k === '1') this.setMode('explore'); if (k === '2') this.setMode('top'); if (k === '3') this.setMode('follow'); if (k === '4') this.setMode('exterior');
      };
      this._ku = e => this.keys.delete(e.key.toLowerCase());
      addEventListener('keydown', this._kd); addEventListener('keyup', this._ku);
    }
    zoom(f) { this.goal.r = clamp(this.goal.r * f, 4, 140); }
    pan(dx, dy) { const T = this.T, s = this.goal.r * .0016, f = new T.Vector3(Math.sin(this.goal.th), 0, Math.cos(this.goal.th)), r = new T.Vector3(f.z, 0, -f.x);
      this.goal.target.addScaledVector(r, -dx * s).addScaledVector(f, -dy * s); this.goal.target.x = clamp(this.goal.target.x, -40, 40); this.goal.target.z = clamp(this.goal.target.z, -40, 30); }
    setMode(m, opt) {
      this.camMode = m; this.cineUntil = 0;
      const G = this.goal;
      if (m === 'explore') Object.assign(G, { r: 26, ph: .85 }), G.target.set(1, 0, 0);
      if (m === 'top') Object.assign(G, { r: 34, ph: .09, th: 0 }), G.target.set(2, 0, 0);
      if (m === 'exterior') Object.assign(G, { r: 70, ph: 1.12 }), G.target.set(0, 0, -6);
      if (m === 'follow') { if (!this.selected) this.selected = this.crew[0]; Object.assign(G, { r: 7, ph: .95 }); }
      this.renderHud();
    }
    cine(x, z, r = 10, ph = .7, th, secs = 4) { if (RM()) secs = 2; this.camMode = 'cine'; const G = this.goal; const tt = th != null ? th : G.th; G.target.set(x + Math.cos(tt) * r * .28, 0.9, z - Math.sin(tt) * r * .28); G.r = r; G.ph = ph; if (th != null) G.th = th; this.cineUntil = this.time + secs; this.renderHud(); }
    endCine() { this.cineUntil = 0; this.camMode = 'explore'; this.renderHud(); }
    raycast(cx, cy) {
      const T = this.T, rect = this.renderer.domElement.getBoundingClientRect();
      this._ray = this._ray || new T.Raycaster(); this._ray.setFromCamera(new T.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1), this.camera);
      const hits = this._ray.intersectObjects(this.clickables.filter(o => o.visible && (!this.hull.visible || !o.userData.facility || this.hullOpacity < .5 || o.parent === this.hull || !this.isInside(o))), false);
      return hits[0] ? hits[0].object.userData : null;
    }
    isInside(o) { let p = o; while (p) { if (p === this.hab) return !this.solarArrays.includes(o.parent); p = p.parent; } return false; }
    hoverAt(x, y) {
      if (this._hoverT && performance.now() - this._hoverT < 60) return; this._hoverT = performance.now();
      const u = this.raycast(x, y), tip = this.$('[data-tip]');
      this.hovered = u && u.facility ? u.facility : null; const crewId = u && u.crewId;
      this.renderer.domElement.style.cursor = u && (u.facility || crewId) ? 'pointer' : 'grab';
      if (u && (u.facility || crewId)) { const label = crewId ? CREW.find(c => c.id === crewId).name : FACILITIES[u.facility].name;
        tip.textContent = label + (crewId ? ' · click for details' : ' · click to inspect'); tip.style.display = 'block'; tip.style.left = x + 14 + 'px'; tip.style.top = y + 14 + 'px'; } else tip.style.display = 'none';
    }
    pickAt(x, y) {
      if (this.introOn) return; const u = this.raycast(x, y); if (!u) { this.closePanel(); return; }
      if (u.crewId) { this.selected = this.crew.find(c => c.id === u.crewId); this.panel = { kind: 'crew', id: u.crewId }; this.renderPanel(); this.renderHud(); }
      else if (u.facility) this.openFacility(u.facility);
    }

    /* ---------------- mission flow ---------------- */
    loadM01() { try { return JSON.parse(localStorage.getItem(M01KEY)) || { inspected: [], power: false }; } catch (e) { return { inspected: [], power: false }; } }
    saveM01() { try { localStorage.setItem(M01KEY, JSON.stringify(this.m01)); } catch (e) {} }
    newMission(scen) {
      const S = this.S, id = S.SCENARIOS[scen] ? scen : S.loadScenario(), sc = S.SCENARIOS[id] || S.SCENARIOS.outpost;
      let cfg = S.loadConfig() || S.PRESETS.balanced; if (S.configCost(cfg) > sc.budget) cfg = S.PRESETS.balanced;
      const sw = window.LQData && window.LQData.peek ? window.LQData.peek() : null;
      const s = S.newMission(cfg, { scenario: sc.id, seed: Date.now() % 9973, spaceWeather: sw, comms: this.sim ? this.sim.comms : 'moon' });
      S.saveScenario(sc.id);
      this.m01 = { inspected: [], power: false }; this.saveM01(); this.endShown = false; this.decision = null; this.sequence = null;
      this.commit(s);
      this.crew.forEach((c, i) => { const [room, x, z, yaw] = c.home; c.g.position.set(x, 0, z); c.room = room; c.yaw = yaw; c.path = []; c.anim = 'work'; c.task = 'Working at station'; c.busy = null; c.sheltered = false; c.wait = 3 + i * 2; });
      this.doorGoal = 1;
    }
    commit(s) { this.sim = s; this.S.save(s); this.syncVisuals(); this.renderHud(); }

    advance() {
      const s = this.sim; if (!s || this.introOn || this.paused) return;
      if (s.status !== 'active') return this.toast('The mission has ended.', 'info');
      if (s.pendingEvent) return this.toast('An emergency needs your decision first.', 'warn');
      if (this.sequence) return this.toast('Wait for the crew to finish their task.', 'warn');
      if (!this._forceAdv && this.S.alerts(s).some(a => a.level === 'critical')) { this.auto = false; this.modal = 'confirm'; this.renderModal(); this.renderHud(); return; }
      this._forceAdv = false;
      const prevShelter = this.crew.some(c => c.sheltered);
      const n = this.S.advanceDay(s); this.commit(n);
      if (prevShelter && !(n.mods.sciencePausedUntil >= n.day)) this.releaseShelter();
      this.beep('tick');
      const why = n.lastDay && n.lastDay.why ? n.lastDay.why.slice(0, 2) : [];
      if (n.pendingEvent) this.startEvent(n.pendingEvent);
      else if (n.status !== 'active') this.endMission();
      else this.toast(`Day ${n.day} begins.` + (why.length ? ' ' + why.join(' ') : ''), 'info');
    }

    startEvent(id) {
      this.decision = { choice: null, assignee: id === 'leak' || id === 'power' ? 'eng' : id === 'crop' ? 'sci' : null };
      this.beep('alarm');
      if (id === 'leak') this.cine(5.2, -5.2, 6.5, .55, .5, 5);
      if (id === 'storm') this.cine(-11.25, -4.5, 8, .6, .2, 4);
      if (id === 'power') this.cine(11.5, -4.8, 7, .6, -.3, 4);
      if (id === 'crop') this.cine(19.4, 0, 9, .7, .4, 4);
      // crew stop optional work and look up
      this.crew.forEach(c => { if (!c.path.length && !c.busy) { c.anim = 'idle'; c.task = 'Alert received'; c.wait = 9999; } });
      this.renderHud();
    }

    decide() {
      const s = this.sim, d = this.decision; if (!s || !s.pendingEvent || !d || !d.choice) return;
      const v = this.S.eventView(s), ch = v.choices.find(c => c.id === d.choice);
      if (!ch) return;
      if (ch.disabled) return this.toast(ch.reason || 'That choice is not available.', 'warn');
      const needsCrew = (s.pendingEvent === 'leak') || (s.pendingEvent === 'power' && ch.id === 'repair');
      const cr = needsCrew ? this.crew.find(c => c.id === d.assignee) : null;
      if (needsCrew && (!cr || cr.sheltered)) return this.toast('Choose an astronaut who is free to go.', 'warn');
      const ev = s.pendingEvent, n = this.S.resolveEvent(s, ch.id);
      if (n === s) return this.toast('The simulation rejected this action (not enough credits or battery).', 'warn');
      this.commit(n); this.decision = null; this.renderHud();
      this.playResponse(ev, ch.id, cr, n.lastOutcome);
    }

    playResponse(ev, choice, cr, outcome) {
      const done = () => { this.sequence = null; this.syncVisuals(); this.renderHud(); if (outcome) this.toast(`${outcome.title}. ${outcome.why || outcome.text}`, outcome.tone === 'failure' ? 'crit' : outcome.tone === 'warning' ? 'warn' : 'ok', 7000); this.beep(outcome && outcome.tone === 'failure' ? 'bad' : 'ok'); if (this.sim.status !== 'active') this.endMission(); };
      this.sequence = { ev, choice, leakVisual: ev === 'leak' }; this.syncVisuals(); this.renderHud();
      if (ev === 'leak') {
        const spot = choice === 'shutdown' ? SPOTS.valve : SPOTS.leak;
        const verb = choice === 'repair' ? 'Repairing the pipe' : choice === 'shutdown' ? 'Closing the isolation valve' : 'Fitting a bypass hose';
        this.cine(4.2, -4.8, 7.5, .62, .6, 6);
        this.send(cr, spot, { run: true, task: 'Heading to the leak', then: () => { cr.anim = choice === 'repair' ? 'repair' : 'work'; cr.task = verb; cr.busy = { until: this.time + (choice === 'repair' ? 4.5 : 2.5), sparks: choice === 'repair' ? [5.2, 1.6, -5.55] : null,
          then: () => { this.sequence.leakVisual = false; this.water.stopAt = this.time; cr.task = 'Job done'; cr.anim = 'celebrate'; setTimeout(() => { this.returnHome(cr); }, 1400); done(); } }; } });
      } else if (ev === 'storm') {
        if (choice === 'shelter' || choice === 'reinforce') {
          this.doorGoal = 1; let inside = 0;
          this.cine(9, 2.4, 13, .7, -.2, 9);
          this.crew.forEach((c, i) => { c.busy = null; this.send(c, SPOTS.seats[i], { run: true, task: 'Moving to the radiation shelter', then: () => { c.anim = 'idle'; c.sheltered = true; c.task = 'Sheltering'; c.room = 'shelter'; if (++inside === 4) { this.doorGoal = 0; this.beep('door'); setTimeout(done, 1600); } } }); });
        } else if (choice === 'procedures') {
          let n = 0; this.crew.forEach((c, i) => this.send(c, SPOTS.core[i], { task: 'Working from the habitat core', then: () => { c.anim = 'work'; c.task = 'Essential work only'; if (++n === 4) done(); } }));
        } else { this.crew.forEach(c => { c.wait = 1; c.task = 'Continuing normal work'; }); setTimeout(done, 800); }
      } else if (ev === 'power') {
        const eng = cr || this.crew.find(c => c.id === 'eng');
        this.send(eng, SPOTS.powerCab, { run: true, task: 'Heading to Power Control', then: () => { eng.anim = choice === 'repair' ? 'repair' : 'work'; eng.task = choice === 'repair' ? 'Replacing the power unit' : 'Rerouting power';
          eng.busy = { until: this.time + (choice === 'repair' ? 4 : 2.5), sparks: choice === 'repair' ? [12.9, 1.2, -5.1] : null, then: () => { this.returnHome(eng); done(); } }; } });
      } else if (ev === 'crop') {
        const sci = this.crew.find(c => c.id === 'sci');
        this.send(sci, SPOTS.ghBed, { task: 'Heading to the greenhouse', then: () => { sci.anim = 'work'; sci.task = 'Tending the plants'; sci.busy = { until: this.time + 3, then: () => { this.returnHome(sci); done(); } }; } });
      } else done();
    }
    returnHome(c) { c.busy = null; this.send(c, c.home, { task: 'Returning to station', then: () => { c.anim = 'work'; c.task = 'Working at station'; c.wait = 6 + Math.random() * 6; } }); }
    releaseShelter() { this.doorGoal = 1; this.beep('door'); this.crew.forEach((c, i) => setTimeout(() => { c.sheltered = false; this.returnHome(c); }, 600 + i * 350)); }

    endMission() {
      const s = this.sim; this.endShown = true;
      if (s.status === 'complete') this.crew.forEach((c, i) => this.send(c, SPOTS.core[i], { task: 'Mission complete!', then: () => { c.anim = 'celebrate'; } }));
      else this.crew.forEach((c, i) => this.send(c, SPOTS.airlock[i], { task: 'Returning to the lander', then: () => { c.anim = 'idle'; } }));
      this.renderHud();
    }

    openFacility(id) {
      this.panel = { kind: 'facility', id };
      if (!this.m01.inspected.includes(id)) { this.m01.inspected.push(id); }
      if (['battery', 'solar'].includes(id)) this.m01.power = true;
      this.saveM01(); this.renderPanel(); this.renderHud();
    }
    closePanel() { this.panel = null; this.renderPanel(); }

    objectives() {
      const s = this.sim, S = this.S, m = this.m01; if (!s) return [];
      const N = S.daysOf(s), K = S.scenarioOf(s).objectivesRequired, em = (s.decisions || []).filter(x => x.tone !== 'info');
      const unsafe = em.filter(x => !x.safe).length, fired = s.log.filter(l => l.type === 'event').length;
      const ended = s.status !== 'active', o2ok = s.minO2Ratio >= .2, sci = s.objectives.filter(o => o.done).length;
      const minRes = Math.min(s.o2 / S.CAPS.o2, s.water / S.CAPS.water, s.food / S.CAPS.food);
      const st = (done, failed) => failed ? 'failed' : done ? 'done' : 'open';
      return [
        { t: 'Inspect the outpost', sub: `Click 3 facilities (${Math.min(3, m.inspected.length)}/3)`, s: st(m.inspected.length >= 3) },
        { t: 'Check the power system', sub: 'Inspect the solar arrays or batteries', s: st(m.power) },
        { t: 'Keep life support running', sub: `Oxygen stays above 20% · lowest ${Math.round(s.minO2Ratio * 100)}%`, s: st(ended && o2ok, !o2ok) },
        { t: 'Handle every emergency safely', sub: fired ? `${em.length} handled · ${unsafe} unsafe` : 'Emergencies are random — stay ready', s: st(ended && unsafe === 0 && em.length >= fired, unsafe > 0) },
        { t: `Finish ${K} science job${K > 1 ? 's' : ''}`, sub: `${sci} / ${K} done`, s: st(sci >= K, ended && sci < K) },
        { t: 'Finish with enough supplies', sub: `Reach day ${N} with every supply above 10%`, s: st(s.status === 'complete' && minRes >= .1, s.status === 'failed' || (ended && minRes < .1)) },
      ];
    }

    /* ---------------- visuals synced to engine ---------------- */
    syncVisuals() {
      const s = this.sim, S = this.S; if (!s) return;
      const R = S.resources(s), pw = S.powerOf(s), last = s.history[s.history.length - 1] || { shed: [] };
      this.sun.intensity = 3.2 * Math.max(.06, R.power.sun);
      this.powerLow = s.pendingEvent === 'power' || R.power.status === 'critical' || (last.shed && last.shed.length > 0);
      this.alarm = !!s.pendingEvent && s.pendingEvent !== 'crop';
      this.leaking = s.pendingEvent === 'leak' || !!(this.sequence && this.sequence.leakVisual);
      // solar arrays shown by level (3 per level), battery bars, greenhouse
      this.solarArrays.forEach((g, i) => g.visible = i < s.levels.solar * 3);
      const bp = R.power.value / R.power.cap; this.battBars.forEach((b, i) => { b.scale.y = clamp(bp * 1.6 - i * .05, .04, 1.6); b.position.y = .05 + b.scale.y * .5; b.material.color.set(R.power.status === 'critical' ? C.crit : R.power.status === 'warning' ? C.warn : C.ok); });
      const ghOn = s.levels.greenhouse > 0 && pw.greenhouse && !(last.shed || []).includes('greenhouse') && !this.powerLow;
      this.growLights.forEach(g => g.material.color.set(ghOn ? '#ff5ce1' : '#2a2030')); this.ghLight.intensity = ghOn ? 10 : 0;
      const mature = clamp((s.day - 1) / ((s.mods.ghMatureDay || S.P.ghMature) - 1), .15, 1), dead = s.mods.ghDeadUntil >= s.day;
      this.plants.forEach((p, i) => { const k = (dead ? .2 : mature) * (.85 + (i % 3) * .08); p.scale.set(k, k, k); p.position.y = .5 + .25 * k; p.material.color.set(dead ? '#8a6a3a' : R.water.status === 'critical' ? '#9aa24a' : '#4caf50'); });
      this.o2Lamp.material.color.set(!pw.oxygen ? '#556070' : R.o2.status === 'critical' ? C.crit : R.o2.status === 'warning' ? C.warn : C.ok);
      this.recLamp.material.color.set(!R.water.recOn ? C.warn : R.water.status === 'critical' ? C.crit : C.ok);
      this.waterWalls.forEach(w => w.material.emissiveIntensity = (s.decisions || []).some(x => x.choice === 'reinforce' && x.day === s.day) ? .8 : 0);
      this.drawWall();
    }
    drawWall() {
      const s = this.sim, g = this.wallCanvas.getContext('2d'); g.fillStyle = '#061420'; g.fillRect(0, 0, 512, 256);
      g.strokeStyle = '#1c4a63'; g.lineWidth = 4; g.strokeRect(6, 6, 500, 244);
      g.fillStyle = this.alarm ? '#ff6b78' : '#5DE1FF'; g.font = '700 30px Geist, system-ui'; g.textAlign = 'left';
      g.fillText(s ? `DAY ${pad(s.day)} / ${this.S.daysOf(s)}` : 'STANDBY', 24, 52);
      g.font = '600 22px Geist, system-ui'; g.fillStyle = '#c4cedd';
      const ev = s && s.pendingEvent ? this.S.EVENTS[s.pendingEvent].title.toUpperCase() : this.powerLow ? 'LOW POWER' : 'ALL SYSTEMS NOMINAL';
      g.fillText(ev, 24, 96);
      if (s) { const R = this.S.resources(s); [['O2', R.o2], ['H2O', R.water], ['PWR', R.power], ['FOOD', R.food]].forEach(([k, r], i) => {
        const y = 136 + i * 26, p = clamp(r.value / r.cap, 0, 1); g.fillStyle = '#91a0b7'; g.font = '500 18px Geist Mono, monospace'; g.fillText(k, 24, y + 6);
        g.fillStyle = '#12304a'; g.fillRect(110, y - 8, 360, 14); g.fillStyle = r.status === 'critical' ? '#ff6b78' : r.status === 'warning' ? '#ffc66d' : '#57d9a3'; g.fillRect(110, y - 8, 360 * p, 14); }); }
      this.wallTex.needsUpdate = true;
    }

    /* ---------------- per-frame ---------------- */
    frame() {
      const dt = Math.min(this.clock.getDelta(), .05), T = this.T; if (document.hidden) return;
      if (!this.paused) this.time += dt; const t = this.time;
      // camera
      if (this.keys && this.keys.size) { const sp = 60 * dt; if (this.keys.has('w') || this.keys.has('arrowup')) this.pan(0, sp); if (this.keys.has('s') || this.keys.has('arrowdown')) this.pan(0, -sp); if (this.keys.has('a') || this.keys.has('arrowleft')) this.pan(sp, 0); if (this.keys.has('d') || this.keys.has('arrowright')) this.pan(-sp, 0); }
      if (this.camMode === 'follow' && this.selected) this.goal.target.set(this.selected.g.position.x, .9, this.selected.g.position.z);
      if (this.cineUntil && t > this.cineUntil) this.endCine();
      if (!this.introOn) { const k = 1 - Math.exp(-dt * (this.camMode === 'cine' ? 2 : 4)); this.cam.target.lerp(this.goal.target, k); this.cam.r = lerp(this.cam.r, this.goal.r, k); this.cam.ph = lerp(this.cam.ph, this.goal.ph, k);
        let dth = this.goal.th - this.cam.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth)); this.cam.th += dth * k; }
      const c = this.cam; this.camera.position.set(c.target.x + c.r * Math.sin(c.ph) * Math.sin(c.th), c.target.y + c.r * Math.cos(c.ph), c.target.z + c.r * Math.sin(c.ph) * Math.cos(c.th)); this.camera.lookAt(c.target);
      // cutaway: hull fades when camera is close
      const wantHull = this.introOn || this.camMode === 'exterior' || c.r > 46; this.hullOpacity = lerp(this.hullOpacity, wantHull ? 1 : 0, 1 - Math.exp(-dt * 5));
      this.hull.visible = this.hullOpacity > .02; this.hull.traverse(o => { if (o.material) { o.material.opacity = this.hullOpacity; o.material.transparent = this.hullOpacity < .99; o.material.depthWrite = this.hullOpacity > .9; } });
      this.cutWalls.forEach(w => { const h = wantHull ? w.userData.fullH : .5; w.scale.y = lerp(w.scale.y, h / w.userData.fullH, .2); w.position.y = w.userData.fullH * w.scale.y / 2; });
      if (this.paused) { this.renderer.render(this.scene, this.camera); return; }
      if (this.auto && this.sim && this.sim.status === 'active' && !this.sim.pendingEvent && !this.sequence && !this.modal && !this.showBrief && t - (this._autoT || 0) > this.autoSpeed) { this._autoT = t;
        if (this.S.alerts(this.sim).some(a => a.level === 'critical')) { this.auto = false; this.toast('Auto stopped: a system is critical. Check it before continuing.', 'warn', 6000); this.renderHud(); } else this.advance(); }
      // lights: dim on power shortage, emergency pulse on alarms
      const pulse = RM() ? .6 : (Math.sin(t * 5) + 1) / 2, dim = this.powerLow ? .22 : 1;
      this.roomLights.forEach(l => l.intensity = lerp(l.intensity, (l.position.z === 0 ? 14 : 22) * dim, .08));
      const emerg = this.powerLow || this.alarm; this.emergency.forEach(e => { e.l.intensity = emerg ? 10 * pulse : 0; e.bulb.material.color.set(emerg ? (pulse > .5 ? '#ff3b4d' : '#5a0f18') : '#3a1a20'); });
      this.antLamp.visible = Math.sin(t * 3) > 0;
      this.leakRing.material.opacity = this.leaking ? .35 + .5 * pulse : 0; this.joint.material.emissive.set(this.leaking ? '#ff2a3d' : '#000'); this.joint.material.emissiveIntensity = this.leaking ? .4 + .6 * pulse : 0;
      // shelter door
      this.doorOpen = lerp(this.doorOpen, this.doorGoal, 1 - Math.exp(-dt * 3)); this.shelterDoor.position.x = 11.25 + this.doorOpen * 1.45;
      // water particles (lunar gravity)
      const w = this.water; w.pts.visible = this.leaking || (w.stopAt && t - w.stopAt < 2);
      if (w.pts.visible) { const live = this.leaking; for (let i = 0; i < this.particleCount; i++) { const o = i * 3; w.vel[o + 1] -= MOON_G * dt; w.pos[o] += w.vel[o] * dt; w.pos[o + 1] += w.vel[o + 1] * dt; w.pos[o + 2] += w.vel[o + 2] * dt;
          if (w.pos[o + 1] <= .02) { if (live) this.respawnDrop(i); else w.pos[o + 1] = -5; } } w.geo.attributes.position.needsUpdate = true; }
      const pg = this.leaking ? 1.7 : 0; this.puddle.scale.setScalar(Math.max(.001, lerp(this.puddle.scale.x, pg, dt * (this.leaking ? .25 : .5))));
      // sparks
      const sk = this.sparks; for (let i = 0; i < 160; i++) { if (sk.sl[i] > 0) { const o = i * 3; sk.sl[i] -= dt; sk.sv[o + 1] -= MOON_G * 2 * dt; sk.sp[o] += sk.sv[o] * dt; sk.sp[o + 1] += sk.sv[o + 1] * dt; sk.sp[o + 2] += sk.sv[o + 2] * dt; if (sk.sl[i] <= 0) sk.sp[o + 1] = -9; }
        else if (sk.emit && Math.random() < .25) { const o = i * 3; sk.sp.set(sk.emit, o); sk.sv.set([(Math.random() - .5) * 2, Math.random() * 1.5, (Math.random() - .2) * 2], o); sk.sl[i] = .3 + Math.random() * .4; } }
      sk.sg.attributes.position.needsUpdate = true; sk.emit = null;
      // crew
      this.crew.forEach(cr => this.updateCrew(cr, dt, t));
      this.earth.rotation.y += dt * .01;
      this.renderer.render(this.scene, this.camera);
      if (this._hudTick === undefined || t - this._hudTick > .5) { this._hudTick = t; this.renderCrewTasks(); }
    }

    updateCrew(cr, dt, t) {
      const g = cr.g, T = this.T;
      if (cr.path.length) {
        const tgt = cr.path[0], dx = tgt.x - g.position.x, dz = tgt.z - g.position.z, d = Math.hypot(dx, dz), step = cr.speed * dt;
        if (d <= step) { g.position.x = tgt.x; g.position.z = tgt.z; cr.path.shift(); if (!cr.path.length) { cr.room = cr.targetRoom; cr.yawGoal = cr.endYaw; cr.anim = 'idle'; const f = cr.onArrive; cr.onArrive = null; if (f) f(); else { cr.anim = 'work'; cr.wait = 6 + Math.random() * 8; } } }
        else { g.position.x += dx / d * step; g.position.z += dz / d * step; cr.yawGoal = Math.atan2(dx, dz); }
      } else if (!cr.busy && !cr.sheltered && this.sim && this.sim.status === 'active' && !this.sim.pendingEvent && !this.sequence) {
        cr.wait -= dt; if (cr.wait <= 0) { const list = ROUTINE[cr.id], spot = list[Math.floor(Math.random() * list.length)]; this.send(cr, spot, { task: spot[0] === 'greenhouse' ? 'Checking the plants' : `Work in ${ROOMS[spot[0]].name}`, then: () => { cr.anim = 'work'; cr.task = spot[0] === 'greenhouse' ? 'Checking the plants' : `Working in ${ROOMS[spot[0]].name}`; cr.wait = 7 + Math.random() * 9; } }); }
      }
      if (cr.busy) { if (cr.busy.sparks) this.sparks.emit = cr.busy.sparks; if (t >= cr.busy.until) { const f = cr.busy.then; cr.busy = null; f && f(); } }
      if (cr.yawGoal != null) { let dy = cr.yawGoal - cr.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); cr.yaw += dy * Math.min(1, dt * 8); g.rotation.y = cr.yaw; }
      // procedural animation
      cr.phase += dt * (cr.anim === 'run' ? 11 : cr.anim === 'walk' ? 7 : 2);
      const p = cr.phase, L = cr.legs, A = cr.arms; let la = 0, ra = 0, lleg = 0, rleg = 0, bob = 0, lz = 0, rz = 0;
      if (cr.anim === 'walk' || cr.anim === 'run') { const a = cr.anim === 'run' ? .75 : .5; lleg = Math.sin(p) * a; rleg = -lleg; la = -lleg * .8; ra = lleg * .8; bob = Math.abs(Math.sin(p)) * (cr.anim === 'run' ? .07 : .035); }
      else if (cr.anim === 'work') { la = -1 + Math.sin(p * 2) * .12; ra = -1.05 + Math.cos(p * 2.3) * .12; }
      else if (cr.anim === 'repair') { la = -1.35 + Math.sin(p * 9) * .25; ra = -1.2 + Math.cos(p * 7) * .2; bob = Math.sin(p * 9) * .01; }
      else if (cr.anim === 'celebrate') { la = -2.7 + Math.sin(p * 6) * .2; ra = -2.7 - Math.sin(p * 6) * .2; lz = .3; rz = -.3; bob = Math.abs(Math.sin(p * 3)) * .08; }
      else { la = Math.sin(p) * .04; ra = -la; bob = Math.sin(p) * .008; }
      L[0].rotation.x = lleg; L[1].rotation.x = rleg; A[0].rotation.x = la; A[1].rotation.x = ra; A[0].rotation.z = lz; A[1].rotation.z = rz; g.position.y = bob;
      const sel = this.selected === cr; cr.ring.material.opacity = sel ? .7 + .3 * Math.sin(t * 4) : 0; cr.tag.visible = this.labels && (sel || this.cam.r < 30); cr.tag.position.y = cr.sheltered ? 2.15 + (CREW.findIndex(c => c.id === cr.id) % 2) * .55 : 2.25;
    }

    /* ---------------- intro ---------------- */
    renderIntro() {
      const b = this.$('[data-introbody]'); if (!b) return; const S = this.S, sv = this.sim && this.sim.status === 'active' ? this.sim : null, cur = this.introScen || S.loadScenario();
      const cfg = S.loadConfig();
      b.innerHTML = `<div style="margin-top:26px;font:600 12px 'Geist Mono',monospace;letter-spacing:.16em;color:${C.warn}">CHOOSE A MISSION</div>
        <div style="margin-top:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px">${Object.values(S.SCENARIOS).map(c => `<button data-act="scen" data-id="${c.id}" aria-pressed="${c.id === cur}" style="all:unset;pointer-events:auto;cursor:pointer;padding:12px 14px;border-radius:12px;border:1.5px solid ${c.id === cur ? C.cyan : '#243247'};background:${c.id === cur ? 'rgba(93,225,255,.08)' : 'rgba(8,13,24,.82)'}"><span style="display:flex;justify-content:space-between;font:600 11px 'Geist Mono',monospace;letter-spacing:.1em;color:${C.mut}"><span>${c.difficulty.toUpperCase()}</span><span>${c.days} DAYS · ${c.budget} CR</span></span><b style="display:block;margin-top:5px;font-size:16px">${c.name}</b><span style="display:block;margin-top:4px;font-size:13px;line-height:1.45;color:#C4CEDD">${c.goal}</span></button>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px">
          ${sv ? `<button data-act="continue" style="${this.btn(true)};height:54px;padding:0 22px;font-size:15px">CONTINUE · DAY ${sv.day} <lq-icon name="arrow-right" size="18"></lq-icon></button>` : ''}
          <button data-act="begin" style="${this.btn(!sv)};height:54px;padding:0 22px;font-size:15px">${sv ? 'START NEW MISSION' : 'BEGIN MISSION'} <lq-icon name="rocket" size="18"></lq-icon></button>
          <a href="/missions/lunar-alpha/configure" style="${this.btn()};height:54px;text-decoration:none">Configure outpost</a>
          <button data-act="help" style="${this.btn()};height:54px">How to play</button>
        </div>
        <p style="margin:12px 0 0;font-size:12.5px;line-height:1.5;color:${C.mut}">${sv ? `Your current mission (${sv.mission}) is shared with the 2D view. ` : ''}Uses ${cfg ? 'your saved outpost setup' : 'the suggested outpost setup'} · emergencies are different every mission.</p>`;
    }
    startIntro() {
      this.renderIntro();
      this.introOn = true; this.introT0 = performance.now();
      const ov = this.$('[data-intro]'); ov.style.display = 'grid';
      this.cam.target.set(0, 2, -8); this.cam.r = 300; this.cam.ph = 1.38; this.cam.th = -.35;
      const run = () => { if (!this.introOn) return; const k = smooth(0, RM() ? 1 : 9000, performance.now() - this.introT0);
        this.cam.r = lerp(300, 46, k); this.cam.ph = lerp(1.38, 1.15, k); this.cam.th = lerp(-.35, .45, k); requestAnimationFrame(run); };
      run();
    }
    endIntro() {
      this.introOn = false; this.$('[data-intro]').style.display = 'none';
      Object.assign(this.goal, { r: 26, ph: .85, th: .35 }); this.goal.target.set(1, 0, 0); this.camMode = 'explore';
      if (this.introChoice === 'continue' && this.sim && this.sim.status === 'active') { this.syncVisuals(); if (this.sim.pendingEvent) this.startEvent(this.sim.pendingEvent); }
      else this.newMission(this.introScen || this.S.loadScenario());
      if (!this.sim.history || this.sim.day === 1) this.showBrief = true;
      this.renderHud();
    }

    /* ---------------- HUD (DOM) ---------------- */
    $(q) { return this.querySelector(q); }
    buildHUD() {
      const hud = document.createElement('div'); hud.setAttribute('data-hud', '');
      hud.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5';
      hud.innerHTML = `
        <div data-top></div><div data-left></div><div data-right></div><div data-bottom></div><div data-event></div><div data-panel></div><div data-toast style="position:absolute;left:50%;bottom:86px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;width:min(560px,92vw)"></div>
        <div data-modal></div>
        <div data-tip style="position:fixed;display:none;padding:6px 10px;border-radius:8px;background:rgba(6,10,19,.92);border:1px solid ${C.line};font-size:13px;pointer-events:none;z-index:20"></div>
        <div data-intro style="position:absolute;inset:0;display:none;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;place-items:end start;padding:clamp(24px,6vw,80px);pointer-events:auto;background:linear-gradient(90deg,rgba(3,5,10,.85),rgba(3,5,10,.2) 60%,rgba(3,5,10,0))">
          <div style="max-width:700px">
            <div style="font:600 13px 'Geist Mono',monospace;letter-spacing:.2em;color:${C.cyan}">NASA SPACE APPS CHALLENGE 2026 · JUNIOR ASTRONAUT MISSION SIMULATOR</div>
            <h1 style="margin:18px 0 6px;font-size:clamp(56px,9vw,120px);line-height:.9;font-weight:800;letter-spacing:-.04em">LUNAQUEST</h1>
            <div style="font-size:clamp(20px,2.4vw,30px);font-weight:500;color:#DCE4EF">Every Decision Shapes the Mission.</div>
            <div data-introbody></div>
          </div>
        </div>`;
      this.appendChild(hud); this.hud = hud;
      hud.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act, b.dataset); });
      hud.addEventListener('change', e => { const b = e.target.closest('[data-chg]'); if (b) this.act(b.dataset.chg, { value: e.target.value }); });
      this.renderHud();
    }
    btn(primary, extra = '') { return `pointer-events:auto;white-space:nowrap;flex:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 14px;border-radius:10px;font:600 13px Geist,sans-serif;cursor:pointer;${primary ? `background:${C.cyan};color:#04111A;border:0` : `background:rgba(8,13,24,.85);color:${C.ink};border:1px solid #2E3F58`};${extra}`; }
    glass(extra = '') { return `pointer-events:auto;background:rgba(7,12,22,.84);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid ${C.line};border-radius:14px;${extra}`; }

    act(a, d) {
      const S = this.S;
      if (a === 'begin') { this.introChoice = 'new'; this.endIntro(); }
      else if (a === 'continue') { this.introChoice = 'continue'; this.endIntro(); }
      else if (a === 'scen') { this.introScen = d.id; S.saveScenario(d.id); this.renderIntro(); }
      else if (a === 'build') { this.modal = 'build'; this.renderModal(); }
      else if (a === 'auto') { this.auto = !this.auto; this._autoT = this.time; this.renderHud(); }
      else if (a === 'speed') { this.autoSpeed = +d.v; this.renderModal(); }
      else if (a === 'force') { this.modal = null; this.renderModal(); this._forceAdv = true; this.advance(); }
      else if (a === 'timeline') { this.modal = 'timeline'; this.renderModal(); }
      else if (a === 'comms') { if (this.sim) this.commit(S.setComms(this.sim, d.v)); this.renderModal(); }
      else if (a === 'wait') { const n = S.waitForReply(this.sim); if (n !== this.sim) { this.commit(n); this.toast((n.lastDay && n.lastDay.why[0]) || 'You waited one day for Earth.', 'warn', 6000); if (n.status !== 'active') this.endMission(); } this.renderEvent(); }
      else if (a === 'bonus') { const n = S.bonusExperiment(this.sim); if (n === this.sim) this.toast(S.bonusInfo(this.sim).reason || 'Not available right now.', 'warn'); else { this.commit(n); const sci = this.crew.find(c => c.id === 'sci'); if (!sci.busy && !sci.sheltered) this.send(sci, SPOTS.airlock[0], { task: 'Bonus spacewalk experiment', then: () => { sci.anim = 'work'; sci.busy = { until: this.time + 3, then: () => this.returnHome(sci) }; } }); this.toast(`Bonus spacewalk: science moved forward, ${S.P.bonusO2} kg of oxygen used.`, 'ok'); this.beep('ok'); } }
      else if (a === 'skipCine') this.endCine();
      else if (a === 'advance') this.advance();
      else if (a === 'mode') this.setMode(d.mode);
      else if (a === 'pause') this.togglePause();
      else if (a === 'cineHud') this.toggleCineHud();
      else if (a === 'help') { this.modal = 'help'; this.renderModal(); }
      else if (a === 'settings') { this.modal = 'settings'; this.renderModal(); }
      else if (a === 'closeModal') { this.modal = null; this.renderModal(); if (this.paused && !this._userPaused) this.paused = false; }
      else if (a === 'closeBrief') { this.showBrief = false; this.renderHud(); }
      else if (a === 'toggle') { this.panelsOpen[d.side] = !this.panelsOpen[d.side]; this.renderHud(); }
      else if (a === 'choice') { this.decision.choice = d.id; this.renderEvent(); }
      else if (a === 'assign') { this.decision.assignee = d.value; this.renderEvent(); }
      else if (a === 'confirm') this.decide();
      else if (a === 'crew') { this.selected = this.crew.find(c => c.id === d.id); this.panel = { kind: 'crew', id: d.id }; this.renderPanel(); this.renderHud(); }
      else if (a === 'follow') { this.selected = this.crew.find(c => c.id === d.id); this.setMode('follow'); }
      else if (a === 'closePanel') this.closePanel();
      else if (a === 'goto') { const f = FACILITIES[d.id]; const r = ROOMS[f.room]; if (r) this.cine(r.x, r.z, 8, .7, null, 3); else this.setMode('exterior'); }
      else if (a === 'upgrade') { const n = S.purchase(this.sim, d.eq); if (n === this.sim) this.toast('Not enough credits for this upgrade.', 'warn'); else { this.commit(n); this.toast(`${S.EQUIPMENT.find(e => e.id === d.eq).name} upgraded to level ${n.levels[d.eq]}.`, 'ok'); this.beep('ok'); } this.renderPanel(); if (this.modal === 'build') this.renderModal(); }
      else if (a === 'switch') { const pw = S.powerOf(this.sim); this.commit(S.setPower(this.sim, d.sw, !pw[d.sw])); this.renderPanel(); }
      else if (a === 'gfx') { this.gfx = d.value; localStorage.setItem(GFXKEY, this.gfx); this.applyGfx(); this.renderModal(); }
      else if (a === 'sound') { this.sound = !this.sound; if (this.sound) this.beep('ok'); this.renderModal(); }
      else if (a === 'labels') { this.labels = !this.labels; this.renderModal(); }
      else if (a === 'replay') { this.endShown = false; this.modal = null; this.newMission(this.sim && this.sim.scenario); this.showBrief = true; this.setMode('explore'); }
      else if (a === 'ask') { const n = S.requestAdvice(this.sim); if (n !== this.sim) { this.commit(n); if (n.advice.status === 'transit') setTimeout(() => { this.commit(S.receiveAdvice(this.sim)); this.renderEvent(); }, S.COMMS.moon.roundTripSec * 1000); this.renderEvent(); } }
    }
    togglePause() { this.paused = !this.paused; this._userPaused = this.paused; this.modal = this.paused ? 'pause' : null; this.renderModal(); this.renderHud(); }
    toggleCineHud() { this.cinematicHud = !this.cinematicHud; this.renderHud(); }

    renderHud() {
      if (!this.hud) return; const s = this.sim, S = this.S, hide = this.introOn || this.cinematicHud, narrow = (this.clientWidth || 1200) < 1100;
      if (narrow && !this._narrowInit) { this._narrowInit = true; this.panelsOpen.left = false; }
      const top = this.$('[data-top]'), left = this.$('[data-left]'), right = this.$('[data-right]'), bot = this.$('[data-bottom]');
      const phase = !s ? '—' : s.status === 'complete' ? 'Mission complete' : s.status === 'failed' ? 'Mission ended' : s.pendingEvent ? 'Emergency' : S.forecast(s).some(f => f.kind === 'storm') ? 'Storm watch' : 'Normal operations';
      const pcol = !s ? C.mut : s.pendingEvent || s.status === 'failed' ? C.crit : phase === 'Storm watch' ? C.warn : C.ok;
      top.innerHTML = this.introOn ? '' : `<div style="position:absolute;left:12px;right:12px;top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;${this.glass('padding:8px 12px')}">
        <span style="display:flex;align-items:center;gap:9px"><lq-emblem size="26"></lq-emblem><b style="font-size:16px">LunaQuest</b></span>
        <span style="width:1px;height:22px;background:#243247"></span>
        ${narrow || !s ? '' : '<span style="font-size:14px;color:#C4CEDD">' + s.mission + '</span>'}
        ${s ? `<span style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">Day ${pad(s.day)} <span style="color:${C.mut};font-weight:400">/ ${S.daysOf(s)}</span><span style="width:70px;height:5px;border-radius:3px;background:#172235;overflow:hidden"><span style="display:block;height:100%;width:${s.day / S.daysOf(s) * 100}%;background:${C.cyan}"></span></span></span>` : ''}
        <span style="display:flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:99px;border:1px solid ${pcol}66;color:${pcol};font:600 11px 'Geist Mono',monospace;letter-spacing:.1em;text-transform:uppercase">${phase}</span>
        <span style="flex:1"></span>
        <button data-act="help" style="${this.btn()}"><lq-icon name="book" size="15"></lq-icon>${narrow ? '' : '<span>Help</span>'}</button>
        <button data-act="build" title="Build and upgrade equipment" style="${this.btn()}"><lq-icon name="wrench" size="15"></lq-icon>${narrow ? '' : '<span>Build</span>'}</button>
        <button data-act="timeline" title="Mission timeline and log" style="${this.btn()}"><lq-icon name="history" size="15"></lq-icon>${narrow ? '' : '<span>Timeline</span>'}</button>
        <button data-act="cineHud" title="Hide the interface (H)" style="${this.btn()}"><lq-icon name="eye" size="15"></lq-icon></button>
        <button data-act="pause" title="Pause (Esc)" style="${this.btn()}"><lq-icon name="${this.paused ? 'play' : 'pause'}" size="15"></lq-icon></button>
        <button data-act="settings" title="Settings" style="${this.btn()}"><lq-icon name="settings" size="15"></lq-icon></button>
        <a href="/mission" style="${this.btn()};text-decoration:none" title="Same mission as a 2D dashboard"><lq-icon name="dashboard" size="15"></lq-icon>${narrow ? '' : '<span>2D view</span>'}</a>
      </div>`;
      if (hide) { top.style.display = this.cinematicHud && !this.introOn ? 'none' : ''; left.innerHTML = right.innerHTML = bot.innerHTML = ''; if (this.cinematicHud && !this.introOn) bot.innerHTML = `<button data-act="cineHud" style="${this.btn()};position:absolute;right:14px;bottom:14px">Show interface (H)</button>`; this.renderEvent(); return; }
      top.style.display = '';
      if (!s) return;
      const R = S.resources(s), pw = S.powerOf(s), LABELS = { oxygen: 'Make air', recycler: 'Clean water', greenhouse: 'Grow lights', research: 'Do science' };
      // left: objectives, crew, active events
      const obj = this.objectives(), ic = { done: ['check-circle', C.ok], failed: ['octagon', C.crit], open: ['target', C.mut] };
      left.innerHTML = (narrow && (s.pendingEvent || this.panel)) ? '' : `<div style="position:absolute;left:12px;top:76px;width:${narrow ? 'min(250px,44vw)' : 'min(300px,42vw)'};max-height:calc(100% - 190px);overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;${this.glass('padding:12px')}">
        <div style="margin-bottom:10px;font-size:12.5px;line-height:1.45;color:#DCE4EF"><span style="font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">YOUR GOAL</span><br>${S.scenarioOf(s).goal}</div>
        <button data-act="toggle" data-side="left" style="all:unset;pointer-events:auto;cursor:pointer;display:flex;align-items:center;justify-content:space-between;width:100%;font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">MISSION OBJECTIVES<lq-icon name="${this.panelsOpen.left ? 'chevron-up' : 'chevron-down'}" size="14"></lq-icon></button>
        ${this.panelsOpen.left ? `<ul style="list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:8px">${obj.map(o => `<li style="display:flex;gap:9px"><span style="color:${ic[o.s][1]};margin-top:1px"><lq-icon name="${ic[o.s][0]}" size="16"></lq-icon></span><span><span style="display:block;font-size:13.5px;font-weight:600;color:${o.s === 'done' ? C.mut : C.ink};${o.s === 'done' ? 'text-decoration:line-through' : ''}">${o.t}</span><span style="font-size:12px;color:${C.mut}">${o.sub}</span></span></li>`).join('')}</ul>
        <div style="margin-top:14px;font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">SCIENCE JOBS · ${s.objectives.filter(o => o.done).length}/${S.scenarioOf(s).objectivesRequired} NEEDED</div><ul style="list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:7px">${s.objectives.map((o, i) => { const D = S.OBJECTIVES[i], act = !o.done && s.objectives.findIndex(x => !x.done) === i; return `<li style="font-size:12.5px"><div style="display:flex;justify-content:space-between;gap:8px;color:${o.done ? C.ok : act ? C.ink : C.mut}"><span>${o.done ? '✓ ' : act ? '▸ ' : ''}${D.name}</span><span style="font-family:'Geist Mono',monospace">${o.done ? 'done' : o.progress + '/' + D.days}</span></div><div style="height:3px;border-radius:2px;background:#172235;margin-top:4px"><div style="height:100%;width:${Math.min(100, o.progress / D.days * 100)}%;background:${o.done ? C.ok : C.cyan}"></div></div></li>`; }).join('')}</ul>
        ${(() => { const ins = S.insights(s); return ins.length ? `<div style="margin-top:14px;font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">INSIGHTS</div><ul style="margin:6px 0 0;padding-left:16px;font-size:12.5px;line-height:1.45;color:#C4CEDD">${ins.map(t => `<li>${t}</li>`).join('')}</ul>` : ''; })()}
        ${(() => { const al = S.alerts(s).slice(0, 3), fc = S.forecast(s); if (!al.length && !fc.length) return ''; return `<div style="margin-top:14px;font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">ALERTS &amp; FORECAST</div><ul style="list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:7px">${fc.map(f => `<li style="display:flex;gap:8px;font-size:12.5px;line-height:1.4"><span style="color:${C.warn}"><lq-icon name="${f.kind === 'night' ? 'moon' : 'sun'}" size="14"></lq-icon></span><span><b>${f.title}</b> · day ${f.day}<span style="display:block;color:${C.mut}">${f.text}</span></span></li>`).join('')}${al.map(x => `<li style="display:flex;gap:8px;font-size:12.5px;line-height:1.4"><span style="color:${x.level === 'critical' ? C.crit : C.warn}"><lq-icon name="${x.level === 'critical' ? 'octagon' : 'alert'}" size="14"></lq-icon></span><span><b>${x.title}</b><span style="display:block;color:${C.mut}">${x.text}</span></span></li>`).join('')}</ul>`; })()}
        <div style="margin-top:14px;font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">CREW</div>
        <div data-crewlist style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${this.crew.map(c => `<button data-act="crew" data-id="${c.id}" style="all:unset;pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:9px;padding:6px 8px;border-radius:9px;border:1px solid ${this.selected === c ? c.color : 'transparent'};background:${this.selected === c ? 'rgba(93,225,255,.06)' : 'transparent'}"><span style="width:10px;height:10px;border-radius:50%;background:${c.color}"></span><span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:600">${c.name}</span><span data-task="${c.id}" style="display:block;font-size:12px;color:${C.mut};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.task}</span></span></button>`).join('')}</div>` : ''}
      </div>`;
      // right: resources (hidden while an emergency panel occupies the right side)
      if (s.pendingEvent || this.showBrief) { right.innerHTML = ''; } else {
      const row = (icon, name, r, unit, extra) => { const st = r.status, col = st === 'critical' ? C.crit : st === 'warning' ? C.warn : C.ok, word = st === 'critical' ? 'Danger' : st === 'warning' ? 'Careful' : 'Good', p = clamp(r.value / r.cap, 0, 1) * 100;
        return `<div style="display:flex;flex-direction:column;gap:5px"><div style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="color:${col}"><lq-icon name="${icon}" size="15"></lq-icon></span><b style="flex:1">${name}</b><span style="font-size:12px;font-weight:700;color:${col}">${word}</span></div>
          <div style="height:7px;border-radius:4px;background:#172235;overflow:hidden"><div style="height:100%;width:${p}%;background:${col};transition:width .6s"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:${C.mut};font-variant-numeric:tabular-nums"><span><b style="color:${C.ink}">${Math.round(r.value)}</b> / ${Math.round(r.cap)} ${unit} max</span><span>${extra}</span></div></div>`; };
      const days = r => r.net >= 0 ? 'steady' : isFinite(r.days) ? `≈ ${Math.floor(r.days)} days` : '';
      const faults = (s.pendingEvent ? 1 : 0) + (R.water.recOn ? 0 : 1) + (s.mods.solarDerateUntil >= s.day ? 1 : 0);
      right.innerHTML = `<div style="position:absolute;right:12px;top:76px;width:min(280px,40vw);max-height:calc(100% - 168px);overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;${this.glass('padding:12px')}">
        <button data-act="toggle" data-side="right" style="all:unset;pointer-events:auto;cursor:pointer;display:flex;align-items:center;justify-content:space-between;width:100%;font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">OUTPOST SUPPLIES<lq-icon name="${this.panelsOpen.right ? 'chevron-up' : 'chevron-down'}" size="14"></lq-icon></button>
        ${this.panelsOpen.right ? `<div style="margin-top:10px;display:flex;flex-direction:column;gap:11px">
          ${row('battery', 'Power', R.power, 'kWh', R.power.sun < .5 ? 'low sun' : `${R.power.net >= 0 ? '+' : ''}${Math.round(R.power.net)}/day`)}
          ${row('wind', 'Oxygen', R.o2, 'kg', days(R.o2))}${row('droplets', 'Water', R.water, 'L', days(R.water))}${row('sprout', 'Food', R.food, 'kg', days(R.food))}
          ${(() => { const rc = R.radiation.status === 'critical' ? C.crit : R.radiation.status === 'warning' ? C.warn : C.ok; return `<div style="display:flex;flex-direction:column;gap:3px;font-size:13px"><div style="display:flex;align-items:center;gap:8px"><span style="color:${rc}"><lq-icon name="shield" size="15"></lq-icon></span><b style="flex:1">Radiation</b><span style="font-size:12px;font-weight:700;color:${rc}">${R.radiation.risk}</span></div><div style="font-size:12px;color:${C.mut}">${R.radiation.tier} · exposure ${R.crew.exposure.toLowerCase()}</div></div>`; })()}
          <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #172235;font-size:13px"><span style="color:${C.mut}">Credits</span><b>${s.credits}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:${C.mut}">Equipment faults</span><b style="color:${faults ? C.warn : C.ok}">${faults ? faults + ' active' : 'none'}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:${C.mut}">Crew health</span><b style="color:${s.health < 40 ? C.crit : s.health < 70 ? C.warn : C.ok}">${Math.round(s.health)} / 100</b></div>
          ${(() => { const LD = s.lastDay; if (!LD) return ''; const dd = (n, v, u) => `<span style="color:${v > .05 ? C.ok : v < -.05 ? '#FF8A94' : C.mut}">${n} ${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)} ${u}</span>`;
            return `<div style="padding-top:10px;border-top:1px solid #172235"><div style="font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">DAY ${pad(LD.day)} · WHAT CHANGED</div><div style="display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:6px;font:500 12px 'Geist Mono',monospace">${dd('O₂', LD.delta.o2, 'kg')}${dd('H₂O', LD.delta.water, 'L')}${dd('Food', LD.delta.food, 'kg')}${dd('Pwr', LD.delta.battery, 'kWh')}</div><ul style="margin:6px 0 0;padding-left:16px;font-size:12.5px;line-height:1.45;color:#C4CEDD">${(LD.why.length ? LD.why : ['A normal day. Everything ran at the rates shown.']).slice(0, 3).map(w => `<li>${w}</li>`).join('')}</ul></div>`; })()}
          <div style="padding-top:10px;border-top:1px solid #172235"><div style="font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">POWER SWITCHES</div>
            <div style="display:flex;flex-direction:column;gap:7px;margin-top:8px">${Object.keys(S.POWER_KEYS).map(k => { const inst = k === 'research' || s.levels[k] > 0, on = pw[k] && inst, dis = !inst || !!s.pendingEvent || s.status !== 'active';
              const kwh = { oxygen: S.P.o2Load * s.levels.oxygen, recycler: S.P.recLoad * s.levels.recycler, greenhouse: S.P.ghLoad * s.levels.greenhouse, research: S.P.researchLoad }[k];
              return `<button data-act="switch" data-sw="${k}" role="switch" aria-checked="${on}" ${dis ? 'disabled' : ''} title="${inst ? S.POWER_KEYS[k] + ' uses ' + kwh + ' kWh per day' : 'Not installed'}" style="all:unset;pointer-events:auto;cursor:${dis ? 'not-allowed' : 'pointer'};opacity:${inst ? 1 : .5};display:flex;align-items:center;gap:8px;font-size:12.5px"><span style="position:relative;flex:none;width:26px;height:15px;border-radius:8px;background:${on ? C.cyan : '#2E3F58'}"><span style="position:absolute;top:2px;left:${on ? 13 : 2}px;width:11px;height:11px;border-radius:6px;background:#F3F7FC;transition:left .15s"></span></span><span style="flex:1">${LABELS[k]}</span><span style="font-family:'Geist Mono',monospace;color:${C.mut}">${inst ? kwh + ' kWh' : 'not built'}</span></button>`; }).join('')}</div></div>
          ${(() => { const bi = S.bonusInfo(s); return `<button data-act="bonus" ${bi.available ? '' : 'disabled'} title="${bi.available ? 'Push science forward one extra day using spacesuit oxygen' : bi.reason}" style="${this.btn(false, bi.available ? '' : 'opacity:.5;cursor:not-allowed')};width:100%"><lq-icon name="rocket" size="14"></lq-icon>Bonus spacewalk · −${S.P.bonusO2} kg O₂</button>`; })()}
        </div>` : ''}</div>`; }
      // bottom bar
      const blocked = s.status !== 'active' || !!s.pendingEvent || !!this.sequence || this.paused;
      const hint = this.paused ? 'Paused. Press Esc to resume.' : s.pendingEvent ? 'Emergency! Choose a response in the panel.' : this.sequence ? 'The crew is carrying out your decision…' : s.status !== 'active' ? 'Mission over — see your debrief.' : 'Drag to look around · scroll to zoom · click a facility or astronaut · Space = next day';
      bot.innerHTML = `<div style="position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;${this.glass('padding:8px 10px')}">
        <div role="group" aria-label="Camera" style="display:flex;gap:4px">${[['explore', 'layers', 'Explore'], ['top', 'dashboard', 'Top-down'], ['follow', 'users', 'Follow'], ['exterior', 'mountain', 'Outside']].map(([m, ic, l]) => `<button data-act="mode" data-mode="${m}" aria-pressed="${this.camMode === m}" style="${this.btn(false, this.camMode === m ? `border-color:${C.cyan};color:${C.cyan}` : '')}"><lq-icon name="${ic}" size="15"></lq-icon>${narrow ? '' : `<span>${l}</span>`}</button>`).join('')}
          ${this.camMode === 'cine' ? `<button data-act="skipCine" style="${this.btn(false, `border-color:${C.warn};color:${C.warn}`)}">Skip camera</button>` : ''}</div>
        <span style="flex:1;min-width:160px;font-size:13px;color:#C4CEDD">${narrow && !s.pendingEvent && !this.sequence && !this.paused && s.status === 'active' ? 'Click things to inspect · Space = next day' : hint}</span>
        <button data-act="auto" aria-pressed="${!!this.auto}" title="Advance days automatically" ${s.status !== 'active' ? 'disabled' : ''} style="${this.btn(false, this.auto ? `border-color:${C.cyan};color:${C.cyan}` : '')}"><lq-icon name="${this.auto ? 'pause' : 'play'}" size="15"></lq-icon>${narrow ? '' : (this.auto ? 'Auto on' : 'Auto')}</button>
        <button data-act="advance" ${blocked ? 'disabled' : ''} style="${this.btn(!blocked, `height:48px;padding:0 22px;font-size:15px;${blocked ? 'opacity:.5;cursor:not-allowed' : ''}`)}">NEXT DAY <lq-icon name="chevron-right" size="17"></lq-icon></button>
      </div>`;
      this.renderEvent(); this.renderPanel(); this.renderEnd();
    }
    renderCrewTasks() { if (!this.hud) return; this.crew.forEach(c => { const el = this.$(`[data-task="${c.id}"]`); if (el && el.textContent !== c.task) el.textContent = c.task; }); if (this.panel && this.panel.kind === 'crew') this.renderPanel(); }

    renderEvent() {
      const box = this.$('[data-event]'), s = this.sim, S = this.S;
      if (this.showBrief && s && !this.introOn) {
        box.innerHTML = `<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,92vw);${this.glass('padding:22px 24px;border-color:#2E4560')}">
          <div style="font:600 12px 'Geist Mono',monospace;letter-spacing:.16em;color:${C.warn}">${s.mission.toUpperCase()} · BRIEFING</div>
          <h2 style="margin:10px 0 8px;font-size:26px">Welcome to the outpost, Commander.</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#C4CEDD">Four astronauts — Mehedi, Maimuna, Nahid and Joy — live here for ${S.daysOf(s)} days. <b>Goal:</b> ${S.scenarioOf(s).goal} Each press of <b>Next Day</b> moves time forward. The crew uses air, water, food and power every day. Something will go wrong. When it does, the clock stops and you decide.</p>
          <ol style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;color:#DCE4EF"><li>Look around: drag to rotate, scroll to zoom.</li><li>Click facilities and astronauts to inspect them.</li><li>Watch the supplies on the right.</li><li>Press Next Day when you are ready.</li></ol>
          <button data-act="closeBrief" style="${this.btn(true)};height:48px;padding:0 22px">Start exploring <lq-icon name="arrow-right" size="16"></lq-icon></button></div>`;
        return;
      }
      if (!s || !s.pendingEvent || this.introOn) { box.innerHTML = ''; return; }
      const v = S.eventView(s), d = this.decision || (this.decision = { choice: null, assignee: 'eng' }), crit = v.severity === 'critical', col = crit ? C.crit : C.warn;
      const needsCrew = v.id === 'leak' || v.id === 'power';
      const free = this.crew.filter(c => !c.sheltered);
      const A = v.advice, rec = A && A.status === 'ready' ? A.recommend : null;
      const TONE = { good: C.ok, warn: C.warn, bad: '#FF8A94' };
      const sw = v.id === 'storm' && s.spaceWeather && s.spaceWeather.status && s.spaceWeather.status !== 'curated' ? `<div style="font-size:12px;color:${C.mut};margin-top:8px">Real data: NASA DONKI (${s.spaceWeather.status}) — ${s.spaceWeather.label}. The storm in this mission is a game event; exposure is a simplified game index.</div>` : '';
      box.innerHTML = `<div role="alertdialog" aria-labelledby="ev-t" style="position:absolute;right:12px;top:76px;width:min(470px,calc(100vw - 24px));max-height:calc(100% - 168px);overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;${this.glass(`border:1.5px solid ${col};padding:0`)}">
        <div style="height:3px;background:${col}"></div>
        <div style="padding:16px 18px 10px">
          <div style="font:700 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${col}">${crit ? 'CRITICAL' : 'WARNING'} · ${v.kind.toUpperCase()} · DAY ${pad(s.day)} · TIME IS PAUSED</div>
          <h2 id="ev-t" style="margin:6px 0 6px;font-size:24px">${v.title}</h2>
          <p style="margin:0;font-size:14.5px;line-height:1.5;color:#DCE4EF">${v.situation}${v.id === 'leak' ? ' Look: water falls slowly here — the Moon’s gravity is about one-sixth of Earth’s.' : ''}</p>${sw}<details style="margin-top:8px;font-size:13px;color:#C4CEDD"><summary style="cursor:pointer;color:${C.cyan}">Why this matters</summary><p style="margin:6px 0 0;line-height:1.55">${v.science}</p></details>
        </div>
        <div style="padding:4px 18px 12px;display:flex;flex-direction:column;gap:8px">
          ${v.choices.map(c => { const on = d.choice === c.id; return `<button data-act="choice" data-id="${c.id}" ${c.disabled ? 'disabled' : ''} style="all:unset;pointer-events:auto;cursor:${c.disabled ? 'not-allowed' : 'pointer'};opacity:${c.disabled ? .5 : 1};display:flex;flex-direction:column;gap:6px;padding:11px 13px;border-radius:11px;border:1.5px solid ${on ? C.cyan : '#243247'};background:${on ? 'rgba(93,225,255,.07)' : 'rgba(10,16,28,.9)'}">
            <span style="display:flex;align-items:center;gap:10px"><span style="width:16px;height:16px;border-radius:50%;border:2px solid ${on ? C.cyan : '#3A4E6B'};display:grid;place-items:center">${on ? `<span style="width:7px;height:7px;border-radius:50%;background:${C.cyan}"></span>` : ''}</span><b style="flex:1;font-size:14.5px">${c.label}</b><span style="font-size:12px;font-weight:600;color:${c.disabled ? '#FF8A94' : rec === c.id ? C.cyan : !c.safe ? '#FF8A94' : C.mut}">${c.disabled ? c.reason : rec === c.id ? '★ Earth recommends' : !c.safe ? 'Unsafe for crew' : ''}</span></span>
            <span style="display:flex;flex-wrap:wrap;gap:6px;padding-left:26px">${c.preview.map(p => `<span style="font-size:12px;padding:3px 8px;border-radius:6px;background:#121D2E;color:${C.mut}">${p.label} <b style="color:${TONE[p.tone]}">${p.value}</b></span>`).join('')}</span></button>`; }).join('')}
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 18px;border-top:1px solid #172235">
          ${needsCrew ? `<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#C4CEDD">Send<select data-chg="assign" style="pointer-events:auto;height:36px;border-radius:8px;background:#0A101C;color:${C.ink};border:1px solid #2E3F58;padding:0 8px;font:500 13px Geist,sans-serif">${free.map(c => `<option value="${c.id}" ${d.assignee === c.id ? 'selected' : ''}>${c.name} · ${c.role}</option>`).join('')}</select></label>` : ''}
          ${!A ? `<button data-act="ask" style="${this.btn()}"><lq-icon name="orbit" size="15"></lq-icon>Ask Mission Control</button>` : `<span style="font-size:12.5px;color:${A.status === 'ready' ? C.ink : C.cyan};max-width:330px">${A.status === 'ready' ? 'Earth says: ' + A.text : A.status === 'transit' ? 'Signal travelling to Earth and back…' : 'Reply arrives tomorrow (Mars drill).'}</span>`}
          ${A && A.status === 'waiting' && s.day < S.daysOf(s) ? `<button data-act="wait" style="${this.btn(false, `border-color:${C.warn};color:${C.warn}`)}"><lq-icon name="clock" size="15"></lq-icon>Wait one day for Earth</button>` : ''}
          <span style="flex:1"></span>
          <button data-act="confirm" ${d.choice ? '' : 'disabled'} style="${this.btn(!!d.choice, `height:46px;padding:0 20px;${d.choice ? '' : 'opacity:.5;cursor:not-allowed'}`)}"><lq-icon name="check" size="16"></lq-icon>CONFIRM</button>
        </div></div>`;
    }

    renderPanel() {
      const box = this.$('[data-panel]'), s = this.sim, S = this.S, p = this.panel;
      if (!p || !s || this.introOn || this.cinematicHud) { box.innerHTML = ''; return; }
      const wrap = (title, sub, icon, color, body) => `<div style="position:absolute;right:12px;top:76px;width:min(320px,90vw);max-height:calc(100% - 170px);overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;z-index:2;${this.glass('padding:14px;border-color:#2E4560')}">
        <div style="display:flex;align-items:center;gap:10px"><span style="width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:rgba(93,225,255,.08);color:${color}"><lq-icon name="${icon}" size="19"></lq-icon></span><div style="flex:1"><div style="font-size:16px;font-weight:700">${title}</div><div style="font-size:12px;color:${C.mut}">${sub}</div></div><button data-act="closePanel" aria-label="Close" style="${this.btn(false, 'width:34px;height:34px;padding:0')}"><lq-icon name="x" size="15"></lq-icon></button></div>${body}</div>`;
      const dl = rows => `<dl style="margin:12px 0 0;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:13px">${rows.map(([k, v, c]) => `<dt style="color:${C.mut}">${k}</dt><dd style="margin:0;text-align:right;color:${c || C.ink}">${v}</dd>`).join('')}</dl>`;
      if (p.kind === 'crew') {
        const c = this.crew.find(x => x.id === p.id), loc = ROOMS[c.path.length ? c.targetRoom : c.room];
        box.innerHTML = wrap(c.name, c.role, 'users', c.color, dl([['Current task', c.task], ['Location', (c.path.length ? 'Walking to ' : '') + (loc ? loc.name : '—')], ['Status', c.sheltered ? 'In the radiation shelter' : c.busy ? 'Busy' : c.path.length ? 'Moving' : 'Available', c.busy ? C.warn : C.ok], ['Crew health', `${Math.round(s.health)} / 100`]]) +
          `<div style="display:flex;gap:8px;margin-top:12px"><button data-act="follow" data-id="${c.id}" style="${this.btn(true)}"><lq-icon name="eye" size="15"></lq-icon>Follow with camera</button></div><p style="margin:10px 0 0;font-size:12px;color:${C.mut}">Crew act on your decisions. During an emergency you choose who to send.</p>`);
        return;
      }
      const f = FACILITIES[p.id], R = S.resources(s), rt = S.rates(s), pw = S.powerOf(s), eq = f.eq && S.EQUIPMENT.find(e => e.id === f.eq), lvl = eq ? s.levels[eq.id] : null;
      let rows = [], status = ['Good', C.ok];
      const stat = r => r.status === 'critical' ? ['Danger', C.crit] : r.status === 'warning' ? ['Careful', C.warn] : ['Good', C.ok];
      if (p.id === 'oxygen') { status = !pw.oxygen ? ['Switched off', C.mut] : stat(R.o2); rows = [['Makes', `${R.o2.production} kg O₂/day`], ['Crew breathes', `${R.o2.consumption.toFixed(1)} kg/day`], ['Uses', `${S.P.o2Load * s.levels.oxygen} kWh + ${(R.o2.production * S.P.electrolysis).toFixed(1)} L water/day`], ['Oxygen stored', `${Math.round(R.o2.value)} / ${R.o2.cap} kg max`]]; }
      else if (p.id === 'recycler') { status = s.pendingEvent === 'leak' ? ['Leaking!', C.crit] : !R.water.recOn ? ['Offline', C.warn] : stat(R.water); rows = [['Recovers', `${Math.round(R.water.recycling * 100)}% of used water`], ['Crew uses', `${R.water.consumption} L/day`], ['Uses', `${S.P.recLoad * s.levels.recycler} kWh/day`], ['Water stored', `${Math.round(R.water.value)} / ${R.water.cap} L max`]]; }
      else if (p.id === 'battery') { status = stat(R.power); rows = [['Charge', `${Math.round(R.power.value)} / ${R.power.cap} kWh max`], ['Daily use', `${Math.round(R.power.load)} kWh`], ['Solar today', `${Math.round(R.power.gen)} kWh`]]; }
      else if (p.id === 'solar') { status = R.power.sun < .5 ? ['Low sunlight', C.warn] : s.mods.solarDerateUntil >= s.day ? ['Half output (fault)', C.warn] : ['Good', C.ok]; rows = [['Arrays', `${s.levels.solar * 3} panels`], ['Sunlight', `${Math.round(R.power.sun * 100)}%`], ['Making', `${Math.round(R.power.gen)} kWh/day`]]; }
      else if (p.id === 'greenhouse') { status = s.mods.ghDeadUntil >= s.day ? ['Crop failed', C.crit] : !pw.greenhouse ? ['Lights off', C.mut] : ['Growing', C.ok]; rows = [['Food made', `${R.food.production.toFixed(1)} kg/day`], ['First harvest', `Day ${s.mods.ghMatureDay || S.P.ghMature}`], ['Uses', `${S.P.ghLoad * s.levels.greenhouse} kWh + ${S.P.ghWater * s.levels.greenhouse} L/day`]]; }
      else if (p.id === 'shelter') { status = this.crew.some(c => c.sheltered) ? ['Occupied', C.cyan] : ['Ready', C.ok]; rows = [['Protection', eq.effect(lvl)], ['Door', this.doorGoal < .5 ? 'Closed' : 'Open'], ['Space weather', R.radiation.risk]]; }
      else if (p.id === 'science') { status = pw.research ? ['Running', C.ok] : ['Paused', C.mut]; const o = s.objectives.find(x => !x.done); rows = [['Current job', o ? S.OBJECTIVES.find(x => x.id === o.id).name : 'All done'], ['Jobs done', `${s.objectives.filter(x => x.done).length} / 5`], ['Uses', `${S.P.researchLoad} kWh/day`]]; }
      else if (p.id === 'medical') rows = [['Crew health', `${Math.round(s.health)} / 100`], ['Morale', `${Math.round(s.morale)} / 100`], ['Emergency cache', lvl ? eq.effect(lvl) : 'None']];
      else if (p.id === 'habitat') rows = [['Crew aboard', '4'], ['Base power', `${S.P.baseLoad} kWh/day`], ['Day', `${s.day} of ${S.daysOf(s)}`]];
      else if (p.id === 'comms') rows = [['Link to Earth', s.comms === 'mars' ? 'Mars drill (reply next day)' : 'About 1.3 s each way'], ['Use', 'Ask Mission Control during emergencies']];
      else if (p.id === 'airlock') rows = [['Purpose', 'Moves people between the habitat and the surface'], ['Spacewalks today', s.bonusDay === s.day ? '1' : '0']];
      else if (p.id === 'quarters') rows = [['Bunks', '4'], ['Morale', `${Math.round(s.morale)} / 100`]];
      const nc = eq ? S.nextCost(eq.id, lvl) : null;
      const up = eq ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #172235;display:flex;flex-direction:column;gap:8px"><div style="font-size:13px"><span style="color:${C.mut}">Level</span> <b>${lvl} / ${eq.max}</b>${lvl ? ` · ${eq.effect(lvl)}` : ''}</div>
        ${nc != null ? `<button data-act="upgrade" data-eq="${eq.id}" ${s.credits < nc || s.status !== 'active' ? 'disabled' : ''} style="${this.btn(s.credits >= nc, s.credits < nc ? 'opacity:.5;cursor:not-allowed' : '')}"><lq-icon name="wrench" size="15"></lq-icon>Upgrade to level ${lvl + 1} · ${nc} credits</button><span style="font-size:12px;color:${C.mut}">Next: ${eq.effect(lvl + 1)}. ${eq.tradeoff}</span>` : `<span style="font-size:12px;color:${C.mut}">Fully upgraded.</span>`}</div>` : '';
      const sw = f.sw && (f.sw === 'research' || s.levels[f.sw] > 0) ? `<button data-act="switch" data-sw="${f.sw}" ${s.status !== 'active' || s.pendingEvent ? 'disabled' : ''} style="${this.btn(false)};margin-top:10px"><lq-icon name="zap" size="15"></lq-icon>${pw[f.sw] ? 'Switch off to save power' : 'Switch back on'}</button>` : '';
      box.innerHTML = wrap(f.name, `${status[0]} · ${(ROOMS[f.room] || { name: 'Lunar surface' }).name}`, f.icon, status[1], dl(rows) + sw + up + `<button data-act="goto" data-id="${p.id}" style="${this.btn()};margin-top:10px">Show me</button>`);
    }

    renderEnd() {
      const m = this.$('[data-modal]'); if (this.modal) return; const s = this.sim;
      if (!s || s.status === 'active' || !this.endShown || this.introOn) { if (!this.modal) m.innerHTML = ''; return; }
      const sc = this.S.score(s), ok = s.status === 'complete', col = ok ? (sc.result === 'partial' ? C.warn : C.ok) : C.crit;
      const obj = this.objectives(), done = obj.filter(o => o.s === 'done').length;
      m.innerHTML = `<div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(3,6,12,.55);pointer-events:auto"><div style="width:min(560px,92vw);text-align:center;${this.glass(`padding:26px;border:1.5px solid ${col}`)}">
        <div style="font:700 12px 'Geist Mono',monospace;letter-spacing:.16em;color:${col}">${ok ? (sc.result === 'partial' ? 'PARTIAL SUCCESS' : 'MISSION COMPLETE') : 'MISSION ENDED'}</div>
        <h2 style="margin:10px 0 8px;font-size:30px">${ok ? `The crew made it through ${s.mission}!` : (s.failure ? s.failure.system + ' ran out on day ' + s.failure.day : 'Mission stopped')}</h2>
        <p style="margin:0 0 6px;font-size:15px;color:#C4CEDD">${done} of ${obj.length} objectives completed · score ${sc.total} / 1000</p>
        <p style="margin:0 0 18px;font-size:14px;color:${C.mut}">Your debrief explains which decisions helped and what to try next time.</p>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap"><a href="/mission/debrief" style="${this.btn(true)};height:48px;text-decoration:none">Mission debrief <lq-icon name="arrow-right" size="16"></lq-icon></a><button data-act="replay" style="${this.btn()};height:48px">Play again</button></div></div></div>`;
    }

    renderModal() {
      const m = this.$('[data-modal]'); if (!this.modal) { m.innerHTML = ''; this.renderEnd(); return; }
      const card = (body, w = 560) => `<div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(3,6,12,.6);pointer-events:auto;z-index:30"><div style="width:min(${w}px,92vw);max-height:90%;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;scrollbar-gutter:stable;${this.glass('padding:22px')}">${body}</div></div>`;
      if (this.modal === 'build' && this.sim) { const s = this.sim, S = this.S;
        m.innerHTML = card(`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="margin:0;font-size:22px">Build &amp; upgrade</h2><span style="font-size:14px">Credits <b>${s.credits}</b></span></div><p style="margin:6px 0 12px;font-size:13px;color:${C.mut}">Finish science jobs to earn credits. Every upgrade has a trade-off.</p>
          <div style="display:flex;flex-direction:column;gap:8px">${S.EQUIPMENT.map(e => { const l = s.levels[e.id], c = S.nextCost(e.id, l), ok = c != null && s.credits >= c && s.status === 'active';
            return `<div style="display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center;padding:10px 12px;border-radius:10px;border:1px solid #1B273A;background:rgba(10,16,28,.8)"><div><div style="display:flex;align-items:center;gap:8px;font-weight:600"><lq-icon name="${e.icon}" size="15"></lq-icon>${e.name} <span style="font:500 11px 'Geist Mono',monospace;color:${C.mut}">L${l}/${e.max}</span></div><div style="font-size:12.5px;color:#C4CEDD;margin-top:3px">${l ? e.effect(l, s) : 'Not installed'}${c != null ? ` → <span style="color:${C.cyan}">${e.effect(l + 1, s)}</span>` : ''}</div><div style="font-size:12px;color:#C9B48D;margin-top:2px">${e.tradeoff}</div></div>${c == null ? `<span style="font-size:12px;color:${C.mut}">Max</span>` : `<button data-act="upgrade" data-eq="${e.id}" ${ok ? '' : 'disabled'} style="${this.btn(ok, ok ? '' : 'opacity:.5;cursor:not-allowed')}">${c} cr</button>`}</div>`; }).join('')}</div>
          <div style="margin-top:14px"><button data-act="closeModal" style="${this.btn(true)}">Done</button></div>`, 640); }
      if (this.modal === 'confirm' && this.sim) { const crit = this.S.alerts(this.sim).filter(a => a.level === 'critical');
        m.innerHTML = card(`<div style="display:flex;align-items:center;gap:10px;color:${C.crit};font:700 12px 'Geist Mono',monospace;letter-spacing:.14em"><lq-icon name="octagon" size="18"></lq-icon>CRITICAL SYSTEM WARNING</div><h2 style="margin:10px 0 8px;font-size:22px">Advance with a system in danger?</h2><p style="margin:0 0 10px;font-size:14px;color:#C4CEDD">Another day will use more air, water, food and power.</p><ul style="list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:6px">${crit.map(c => `<li style="padding:9px 12px;border-radius:8px;background:rgba(255,107,120,.08);font-size:13px">${c.title}. ${c.text}</li>`).join('')}</ul><div style="display:flex;gap:10px;flex-wrap:wrap"><button data-act="closeModal" style="${this.btn()}">Review the outpost first</button><button data-act="force" style="${this.btn(false, `background:${C.crit};color:#1A0508;border:0`)}">Advance anyway</button></div>`); }
      if (this.modal === 'timeline' && this.sim) { const s = this.sim, S = this.S, H = s.history, N = S.daysOf(s);
        const X = d => 40 + (d - 1) / Math.max(1, N - 1) * 620, Y = v => 20 + (1 - clamp(v, 0, 1)) * 180;
        const SER = [['Oxygen', C.cyan, h => h.o2 / S.CAPS.o2, '0'], ['Water', '#739CFF', h => h.water / S.CAPS.water, '6 4'], ['Food', C.ok, h => h.food / S.CAPS.food, '2 4'], ['Battery', C.ink, h => h.battery / h.batteryCap, '10 4 2 4']];
        const path = f => H.map((h, i) => `${i ? 'L' : 'M'}${X(h.day).toFixed(1)},${Y(f(h)).toFixed(1)}`).join(' ');
        const ev = s.log.filter(l => l.type === 'event' || l.type === 'failure');
        const ticks = Array.from({ length: N }, (_, i) => i + 1).filter(d => d === 1 || d % 5 === 0 || d === N);
        const svg = `<svg viewBox="0 0 680 230" style="width:100%;height:auto;display:block" role="img" aria-label="Supplies as percent of their maximum, by mission day"><rect x="40" y="${Y(.1)}" width="620" height="${Y(0) - Y(.1)}" fill="rgba(255,107,120,.08)"></rect>${[0, .25, .5, .75, 1].map(v => `<line x1="40" x2="660" y1="${Y(v)}" y2="${Y(v)}" stroke="#1B273A"></line><text x="34" y="${Y(v) + 4}" fill="#6F7D93" font-size="10" text-anchor="end" font-family="Geist Mono">${v * 100}%</text>`).join('')}${ev.map(l => `<line x1="${X(l.day)}" x2="${X(l.day)}" y1="20" y2="200" stroke="${l.severity === 'critical' || l.type === 'failure' ? C.crit : C.warn}" stroke-dasharray="3 4"></line>`).join('')}${SER.map(([n, c, f, d]) => `<path d="${path(f)}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${d}"></path>`).join('')}${ticks.map(d => `<text x="${X(d)}" y="218" fill="#6F7D93" font-size="10" text-anchor="middle" font-family="Geist Mono">D${d}</text>`).join('')}</svg>`;
        const legend = SER.map(([n, c, , d]) => `<span style="display:flex;align-items:center;gap:6px;font-size:12px"><svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="${c}" stroke-width="2" stroke-dasharray="${d}"></line></svg>${n}</span>`).join('');
        const log = s.log.slice(-12).reverse().map(l => `<li style="display:grid;grid-template-columns:58px 1fr;gap:8px;padding:7px 0;border-top:1px solid #172235;font-size:12.5px"><span style="font-family:'Geist Mono',monospace;color:${C.mut}">DAY ${pad(l.day)}</span><span>${l.text}${l.cause ? `<span style="display:block;color:${C.mut}">${l.cause}</span>` : ''}</span></li>`).join('');
        m.innerHTML = card(`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="margin:0;font-size:22px">Mission timeline</h2><button data-act="closeModal" style="${this.btn()}">Close</button></div><div style="display:flex;flex-wrap:wrap;gap:12px;margin:10px 0">${legend}</div>${svg}<p style="font-size:12px;color:${C.mut};margin:6px 0 12px">Each line shows a supply as a percent of its maximum. Dashed lines mark emergencies. The red band is the danger zone (below 10%).</p><div style="font:600 11px 'Geist Mono',monospace;letter-spacing:.14em;color:${C.cyan}">MISSION LOG</div><ul style="list-style:none;margin:6px 0 0;padding:0">${log}</ul>`, 760); }
      if (this.modal === 'pause') m.innerHTML = card(`<h2 style="margin:0 0 8px;font-size:26px">Paused</h2><p style="color:#C4CEDD;margin:0 0 16px">Nothing changes while the game is paused.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button data-act="pause" style="${this.btn(true)}"><lq-icon name="play" size="15"></lq-icon>Resume</button><button data-act="help" style="${this.btn()}">Controls</button><button data-act="settings" style="${this.btn()}">Settings</button><button data-act="replay" style="${this.btn()}">Restart mission</button></div>`);
      if (this.modal === 'help') m.innerHTML = card(`<h2 style="margin:0 0 12px;font-size:24px">How to play</h2>
        <ul style="margin:0 0 14px;padding-left:18px;line-height:1.8;font-size:14.5px;color:#DCE4EF"><li><b>Look around:</b> drag (or one finger) to rotate · right-drag / Shift-drag to pan · scroll or pinch to zoom · WASD / arrows to move the camera.</li><li><b>Inspect:</b> click or tap any facility or astronaut. Press <b>E</b> to inspect what the mouse points at.</li><li><b>Time:</b> press <b>Next Day</b> (or Space). Time never moves on its own.</li><li><b>Emergencies:</b> the clock stops. Read the choices, choose who to send, then Confirm. The crew carries it out.</li><li><b>Manage:</b> power switches and the bonus spacewalk are in the right panel · <b>Build</b> upgrades equipment · <b>Timeline</b> shows supply history and the mission log · <b>Auto</b> plays days for you and stops if something becomes critical.</li><li><b>Cameras:</b> 1 Explore · 2 Top-down · 3 Follow · 4 Outside. <b>H</b> hides the interface. <b>Esc</b> pauses.</li></ul>
        <p style="font-size:13px;color:${C.mut};margin:0 0 14px">Numbers are simplified game values for learning, not real engineering data.</p><button data-act="closeModal" style="${this.btn(true)}">Got it</button>`);
      if (this.modal === 'settings') m.innerHTML = card(`<h2 style="margin:0 0 14px;font-size:24px">Settings</h2>
        <div style="display:flex;flex-direction:column;gap:14px;font-size:14px"><label style="display:flex;justify-content:space-between;align-items:center;gap:12px">Graphics quality<select data-chg="gfx" style="height:36px;border-radius:8px;background:#0A101C;color:${C.ink};border:1px solid #2E3F58;padding:0 8px">${['low', 'medium', 'high'].map(q => `<option value="${q}" ${this.gfx === q ? 'selected' : ''}>${q[0].toUpperCase() + q.slice(1)}</option>`).join('')}</select></label>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">Communication delay<span style="display:flex;gap:6px"><button data-act="comms" data-v="moon" style="${this.btn(!this.sim || this.sim.comms !== 'mars')}">Moon · 1.3 s</button><button data-act="comms" data-v="mars" style="${this.btn(!!this.sim && this.sim.comms === 'mars')}">Mars drill</button></span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">Auto speed<span style="display:flex;gap:6px">${[['4', 'Slow'], ['2.5', 'Normal'], ['1.2', 'Fast']].map(([v, l]) => `<button data-act="speed" data-v="${v}" style="${this.btn(String(this.autoSpeed) === v)}">${l}</button>`).join('')}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center">Sound effects<button data-act="sound" style="${this.btn(this.sound)}">${this.sound ? 'On' : 'Off'}</button></div>
        <div style="display:flex;justify-content:space-between;align-items:center">Astronaut name tags<button data-act="labels" style="${this.btn(this.labels)}">${this.labels ? 'On' : 'Off'}</button></div>
        <p style="margin:0;font-size:12.5px;color:${C.mut}">Low quality turns off shadows and uses fewer water particles — best for older laptops. Motion is reduced automatically if your device asks for it.</p></div>
        <div style="margin-top:16px"><button data-act="closeModal" style="${this.btn(true)}">Done</button></div>`);
    }

    toast(text, tone = 'info', ms = 4500) {
      const box = this.$('[data-toast]'); if (!box) return; const col = { ok: C.ok, warn: C.warn, crit: C.crit, info: C.cyan }[tone];
      const el = document.createElement('div'); el.setAttribute('role', 'status');
      el.style.cssText = `${this.glass(`padding:10px 14px;border-left:3px solid ${col};font-size:14px;line-height:1.45;color:#DCE4EF;transition:opacity .4s`)};pointer-events:none`;
      el.textContent = text; box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
      setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 450); }, ms);
    }

    /* ---------------- sound (synthesised, off by default) ---------------- */
    beep(kind) {
      if (!this.sound) return; const A = this.ac || (this.ac = new (window.AudioContext || window.webkitAudioContext)()), now = A.currentTime;
      const tone = (f, t0, d, type = 'sine', v = .08) => { const o = A.createOscillator(), g = A.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, now + t0); g.gain.exponentialRampToValueAtTime(.0001, now + t0 + d); o.connect(g).connect(A.destination); o.start(now + t0); o.stop(now + t0 + d + .02); };
      if (kind === 'alarm') [0, .32, .64].forEach(t => { tone(880, t, .14, 'square', .05); tone(660, t + .16, .14, 'square', .05); });
      if (kind === 'ok') { tone(660, 0, .12); tone(990, .12, .2); }
      if (kind === 'bad') { tone(300, 0, .25, 'sawtooth', .05); }
      if (kind === 'tick') tone(520, 0, .06, 'triangle', .05);
      if (kind === 'door') tone(140, 0, .5, 'sawtooth', .04);
    }
  }
  if (!customElements.get('lq-game')) customElements.define('lq-game', LQGame);
})();
