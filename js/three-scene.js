/* ===================================================================
   CK Studio · 全局 3D 背景
   三条倾斜轨道环（带发光节点）+ 线框二十面体 + 细尘粒子
   滚动驱动：按 section 中心点做连续插值，没有跳变
   依赖全局 THREE（r149）；无 WebGL 时静默降级
   =================================================================== */
(function () {
    'use strict';

    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

    const BG = 0x030304;
    const INK = 0xe6e9ee;
    const SECTION_IDS = ['home', 'works', 'opensource', 'about', 'contact'];

    // 每个 section 的目标姿态：x 为轨道水平偏移（宽屏生效，左右交替）
    const KEYS = [
        { x:  1.6, s: 1.00, ring: 1.00, ico: 0.00, dust: 0.85, z: 7.0, tilt:  0.00 },
        { x: -1.6, s: 0.80, ring: 0.70, ico: 0.00, dust: 0.65, z: 7.0, tilt:  0.30 },
        { x:  1.6, s: 0.95, ring: 0.85, ico: 0.12, dust: 0.65, z: 7.0, tilt: -0.22 },
        { x:  2.1, s: 0.66, ring: 0.50, ico: 0.85, dust: 0.55, z: 7.2, tilt:  0.50 },
        { x:  0.0, s: 1.30, ring: 0.60, ico: 0.25, dust: 0.90, z: 8.0, tilt:  0.00 }
    ];
    const KEY_NAMES = Object.keys(KEYS[0]);

    const RINGS = [
        { r: 1.30, rot: [1.18,  0.10,  0.25], op: 0.55, spin:  0.18, node: 0.034 },
        { r: 1.90, rot: [0.55,  0.40, -0.45], op: 0.26, spin: -0.11, node: 0.028 },
        { r: 2.55, rot: [1.42, -0.20,  0.85], op: 0.12, spin:  0.07, node: 0.022 }
    ];

    let renderer;
    let scene;
    let camera;
    let orbit;
    let dust;
    let ico;
    let icoMat;
    let clock;
    const rings = [];

    const state = {};
    const goal = {};
    KEY_NAMES.forEach(name => {
        state[name] = KEYS[0][name];
        goal[name] = KEYS[0][name];
    });

    let centers = [];
    let pointerX = 0;
    let pointerY = 0;
    let camX = 0;
    let camY = 0;
    let intro = 0;
    let running = false;
    let rafId = 0;

    function circlePoints(radius, segments) {
        const arr = new Float32Array((segments + 1) * 3);
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            arr[i * 3] = Math.cos(a) * radius;
            arr[i * 3 + 1] = Math.sin(a) * radius;
        }
        return arr;
    }

    function buildRings() {
        const segments = isCoarse ? 128 : 256;
        RINGS.forEach((spec, i) => {
            const holder = new THREE.Group();
            holder.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(circlePoints(spec.r, segments), 3));
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: INK,
                transparent: true,
                opacity: spec.op,
                depthWrite: false
            }));

            const node = new THREE.Mesh(
                new THREE.SphereGeometry(spec.node, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false })
            );
            const halo = new THREE.Mesh(
                new THREE.SphereGeometry(spec.node * 3.4, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false })
            );
            node.add(halo);

            holder.add(line);
            holder.add(node);
            orbit.add(holder);
            rings.push({ spec, line, node, halo, angle: i * 2.1 });
        });
    }

    function buildIco() {
        const base = new THREE.IcosahedronGeometry(0.95, 0);
        const edges = new THREE.EdgesGeometry(base);
        base.dispose();
        icoMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false });
        ico = new THREE.LineSegments(edges, icoMat);
        orbit.add(ico);
    }

    function buildDust() {
        const count = isCoarse ? 280 : 1100;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const r = 9 + Math.random() * 7;
            const u = Math.random() * 2 - 1;
            const th = Math.random() * Math.PI * 2;
            const s = Math.sqrt(1 - u * u);
            pos[i * 3] = r * s * Math.cos(th) * 1.3;
            pos[i * 3 + 1] = r * u * 0.85;
            pos[i * 3 + 2] = r * s * Math.sin(th);

            // 多数暗、少数亮，形成景深
            const b = 0.16 + Math.pow(Math.random(), 2.4) * 0.84;
            col[i * 3] = b;
            col[i * 3 + 1] = b;
            col[i * 3 + 2] = b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
            size: isCoarse ? 0.05 : 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            sizeAttenuation: true
        });
        dust = new THREE.Points(geo, mat);
        scene.add(dust);
    }

    function measure() {
        centers = SECTION_IDS.map(id => {
            const el = document.getElementById(id);
            if (!el) return 0;
            const rect = el.getBoundingClientRect();
            return rect.top + window.scrollY + rect.height / 2;
        });
    }

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        measure();
    }

    // 视口中线（略偏上）所在位置，在相邻 section 中心之间做 smoothstep 插值
    function computeGoal() {
        const y = window.scrollY + window.innerHeight * 0.45;
        const c = centers;
        let a = KEYS[0];
        let b = KEYS[0];
        let t = 0;

        if (y <= c[0]) {
            a = KEYS[0];
            b = KEYS[0];
        } else if (y >= c[c.length - 1]) {
            a = KEYS[c.length - 1];
            b = a;
        } else {
            for (let i = 0; i < c.length - 1; i++) {
                if (y <= c[i + 1]) {
                    a = KEYS[i];
                    b = KEYS[i + 1];
                    t = (y - c[i]) / (c[i + 1] - c[i]);
                    t = t * t * (3 - 2 * t);
                    break;
                }
            }
        }

        KEY_NAMES.forEach(name => {
            goal[name] = a[name] + (b[name] - a[name]) * t;
        });
    }

    function frame() {
        rafId = requestAnimationFrame(frame);

        const dt = Math.min(0.05, clock.getDelta());
        const t = clock.elapsedTime;
        const motion = reduceMotion ? 0 : 1;
        const k = 1 - Math.exp(-dt * 4.2);

        computeGoal();
        KEY_NAMES.forEach(name => {
            state[name] += (goal[name] - state[name]) * k;
        });

        intro = Math.min(1, intro + dt / 2.2);
        const eased = 1 - Math.pow(1 - intro, 3);

        // 宽屏左右交替；竖屏居中并缩小
        const aspect = camera.aspect;
        const fit = Math.max(0.6, Math.min(1, aspect / 1.35));
        const shift = aspect > 1 ? state.x * Math.min(1, aspect / 1.35) : 0;
        orbit.position.x = shift;
        orbit.scale.setScalar(state.s * fit * (0.92 + 0.08 * eased));
        orbit.rotation.y = state.tilt * 0.6 + Math.sin(t * 0.18) * 0.035 * motion;

        // 竖屏时轨道居中且更贴近正文，整体压暗，避免线条穿过文字
        const vis = eased * (aspect < 1 ? 0.5 : 1);
        rings.forEach(r => {
            r.angle += r.spec.spin * dt * motion;
            r.node.position.set(Math.cos(r.angle) * r.spec.r, Math.sin(r.angle) * r.spec.r, 0);
            r.line.material.opacity = r.spec.op * state.ring * vis;
            r.node.material.opacity = Math.min(1, state.ring * vis);
            r.halo.material.opacity = 0.12 * state.ring * vis;
        });

        ico.rotation.y += dt * 0.12 * motion;
        ico.rotation.x += dt * 0.05 * motion;
        icoMat.opacity = state.ico * 0.4 * vis;

        dust.rotation.y = t * 0.012 * motion;
        dust.material.opacity = state.dust * vis * 0.9;

        // 指针视差
        camX += (pointerX - camX) * 0.04;
        camY += (pointerY - camY) * 0.04;
        camera.position.set(camX * 0.4, camY * 0.3, state.z);
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

    function start() {
        if (running) return;
        running = true;
        clock.getDelta();
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(rafId);
    }

    function init() {
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: !isCoarse,
                alpha: false,
                powerPreference: 'high-performance'
            });
        } catch (error) {
            document.documentElement.classList.add('no-webgl');
            return;
        }

        renderer.setClearColor(BG, 1);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.25 : 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 120);
        camera.position.set(0, 0, 7);

        orbit = new THREE.Group();
        scene.add(orbit);

        buildRings();
        buildIco();
        buildDust();

        clock = new THREE.Clock();
        resize();

        let resizeTimer = 0;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 120);
        });
        window.addEventListener('load', measure);
        window.addEventListener('mousemove', event => {
            pointerX = (event.clientX / window.innerWidth) * 2 - 1;
            pointerY = -((event.clientY / window.innerHeight) * 2 - 1);
        }, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else start();
        });

        start();
    }

    init();
})();
