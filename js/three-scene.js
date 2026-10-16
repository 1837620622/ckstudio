/* ===================================================================
   CKSTUDIO · 背景三维字标
   金属 CK：几何绘制（不依赖字体文件），环境反射由 PMREM 生成
   · 入场：C 与 K 依次从纵深浮现并转正
   · 待机：缓慢漂浮，光源缓慢扫过，指针带来轻微视差
   · 滚动：各区块之间连续插值，字标左右移动并转动
   依赖全局 THREE（r149）；无 WebGL 时静默降级
   =================================================================== */
(function () {
    'use strict';

    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

    const BG = 0x030304;
    const SECTION_IDS = ['home', 'works', 'opensource', 'about', 'contact'];

    // 各区块的字标姿态（x / y 为位置，s 为缩放，ry / rx 为转角）
    const KEYS = [
        { x:  1.75, y:  0.00, s: 0.92, ry: -0.42, rx:  0.10, op: 1.00, ring: 1.0, dust: 0.90, z: 7.0 },
        { x:  3.30, y:  2.00, s: 0.36, ry: -0.95, rx:  0.18, op: 0.45, ring: 0.6, dust: 0.60, z: 7.0 },
        { x:  3.30, y:  2.00, s: 0.36, ry:  0.80, rx: -0.10, op: 0.35, ring: 0.5, dust: 0.60, z: 7.0 },
        { x:  3.30, y:  1.80, s: 0.40, ry: -0.70, rx:  0.14, op: 0.40, ring: 0.4, dust: 0.55, z: 7.2 },
        { x:  3.30, y:  1.60, s: 0.50, ry:  0.00, rx:  0.00, op: 0.40, ring: 0.6, dust: 0.90, z: 8.0 }
    ];
    const KEY_NAMES = Object.keys(KEYS[0]);

    // 字形尺寸（字高 2）
    const STROKE = 0.26;
    const DEPTH = 0.3;
    const C_OUTER = 1.0;
    const C_INNER = C_OUTER - STROKE;
    const C_OPEN = THREE.MathUtils.degToRad(44);
    const K_X = 0.98;

    let renderer;
    let scene;
    let camera;
    let clock;
    let ck;
    let tilt;
    let ring;
    let dust;
    let keyLight;
    let rimLight;
    let introStart = -1;
    const letters = [];

    const state = {};
    const goal = {};
    KEY_NAMES.forEach(function (name) {
        state[name] = KEYS[0][name];
        goal[name] = KEYS[0][name];
    });

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let centers = [];
    let running = false;
    let rafId = 0;

    function clamp01(v) {
        return Math.min(1, Math.max(0, v));
    }

    function easeOutQuart(p) {
        return 1 - Math.pow(1 - p, 4);
    }

    // ---------------------------------------------------------------
    // 几何
    // ---------------------------------------------------------------
    function polyShape(points) {
        const shape = new THREE.Shape();
        points.forEach(function (p, i) {
            if (i === 0) shape.moveTo(p[0], p[1]);
            else shape.lineTo(p[0], p[1]);
        });
        shape.closePath();
        return shape;
    }

    // C：外圆弧 + 内圆弧，右侧开口 88°
    function cShape() {
        const shape = new THREE.Shape();
        shape.moveTo(C_OUTER * Math.cos(C_OPEN), C_OUTER * Math.sin(C_OPEN));
        shape.absarc(0, 0, C_OUTER, C_OPEN, -C_OPEN, false);
        shape.lineTo(C_INNER * Math.cos(-C_OPEN), C_INNER * Math.sin(-C_OPEN));
        shape.absarc(0, 0, C_INNER, -C_OPEN, C_OPEN, true);
        shape.closePath();
        return shape;
    }

    function extrude(shape, depth) {
        const geo = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.022,
            bevelOffset: 0,
            bevelSegments: isCoarse ? 2 : 4,
            curveSegments: isCoarse ? 32 : 72
        });
        geo.translate(0, 0, -depth / 2);
        return geo;
    }

    // ---------------------------------------------------------------
    // 环境反射：程序生成的天光 + 几条软箱，金属高光自然
    // ---------------------------------------------------------------
    function buildEnvironment() {
        const env = new THREE.Scene();

        const sky = new THREE.SphereGeometry(40, 48, 32);
        const pos = sky.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i) / 40;
            const v = 0.015 + Math.pow(Math.max(0, y), 2.2) * 0.85 + Math.max(0, -y) * 0.02;
            colors[i * 3] = v;
            colors[i * 3 + 1] = v;
            colors[i * 3 + 2] = v * 1.02;
        }
        sky.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        env.add(new THREE.Mesh(sky, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

        function softbox(w, h, x, y, z, intensity) {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(w, h),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(intensity, intensity, intensity),
                    side: THREE.DoubleSide
                })
            );
            mesh.position.set(x, y, z);
            mesh.lookAt(0, 0, 0);
            env.add(mesh);
        }

        softbox(34, 7, 0, 24, 6, 5.0);
        softbox(4, 34, -26, 2, 10, 3.6);
        softbox(3, 30, 26, 4, -8, 4.0);
        softbox(22, 3, 0, -6, 30, 1.1);

        const pmrem = new THREE.PMREMGenerator(renderer);
        const target = pmrem.fromScene(env, 0.03);
        pmrem.dispose();
        return target.texture;
    }

    // ---------------------------------------------------------------
    // 字母：C 为纯银，K 略深，形成两层金属对比
    // ---------------------------------------------------------------
    function buildLetters() {
        const cMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1,
            roughness: 0.1,
            envMapIntensity: 1.7,
            transparent: true,
            opacity: 0
        });
        const kMat = new THREE.MeshStandardMaterial({
            color: 0xe4e8ee,
            metalness: 1,
            roughness: 0.16,
            envMapIntensity: 1.6,
            transparent: true,
            opacity: 0
        });

        const unitC = new THREE.Group();
        unitC.add(new THREE.Mesh(extrude(cShape(), DEPTH), cMat));

        // K 由竖干与两条斜干组成；斜干略薄，避免在竖干处出现共面闪烁
        const x0 = K_X;
        const unitK = new THREE.Group();
        unitK.add(new THREE.Mesh(
            extrude(polyShape([[x0, -1], [x0 + STROKE, -1], [x0 + STROKE, 1], [x0, 1]]), DEPTH),
            kMat
        ));
        unitK.add(new THREE.Mesh(
            extrude(polyShape([[x0 + 0.1, 0], [x0 + 0.36, 0], [x0 + 1.0, 1], [x0 + 0.74, 1]]), DEPTH * 0.9),
            kMat
        ));
        unitK.add(new THREE.Mesh(
            extrude(polyShape([[x0 + 0.1, 0], [x0 + 0.36, 0], [x0 + 1.0, -1], [x0 + 0.74, -1]]), DEPTH * 0.9),
            kMat
        ));

        const word = new THREE.Group();
        word.position.x = -0.49; // 让整体字形居中
        word.add(unitC, unitK);
        tilt.add(word);

        letters.push(
            { unit: unitC, mat: cMat, delay: 0.0, dur: 1.9, swing: -1.1 },
            { unit: unitK, mat: kMat, delay: 0.22, dur: 1.9, swing: 1.1 }
        );
    }

    function buildRing() {
        const segments = 256;
        const pts = new Float32Array((segments + 1) * 3);
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pts[i * 3] = Math.cos(a) * 2.25;
            pts[i * 3 + 1] = Math.sin(a) * 2.25;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        ring = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            depthWrite: false
        }));
        ring.rotation.x = 1.2;
        tilt.add(ring);
    }

    function buildDust() {
        const count = isCoarse ? 280 : 1000;
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

            const b = 0.16 + Math.pow(Math.random(), 2.4) * 0.84;
            col[i * 3] = b;
            col[i * 3 + 1] = b;
            col[i * 3 + 2] = b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        dust = new THREE.Points(geo, new THREE.PointsMaterial({
            size: isCoarse ? 0.05 : 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            sizeAttenuation: true
        }));
        scene.add(dust);
    }

    // ---------------------------------------------------------------
    // 滚动目标
    // ---------------------------------------------------------------
    function measure() {
        centers = SECTION_IDS.map(function (id) {
            const el = document.getElementById(id);
            if (!el) return 0;
            const rect = el.getBoundingClientRect();
            return rect.top + window.scrollY + rect.height / 2;
        });
    }

    // 视口中线（略偏上）处在相邻区块中心之间时，用 smoothstep 插值
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

        KEY_NAMES.forEach(function (name) {
            goal[name] = a[name] + (b[name] - a[name]) * t;
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

    // ---------------------------------------------------------------
    // 渲染循环
    // ---------------------------------------------------------------
    function frame() {
        rafId = requestAnimationFrame(frame);

        const dt = Math.min(0.05, clock.getDelta());
        const t = clock.elapsedTime;
        const motion = reduceMotion ? 0 : 1;

        // 加载页收起后再开始入场
        if (introStart < 0 && root.classList.contains('is-ready')) introStart = t;
        const introT = reduceMotion ? 99 : (introStart < 0 ? -1 : t - introStart);
        const introE = introT < 0 ? 0 : easeOutQuart(clamp01(introT / 2.6));

        computeGoal();
        const k = 1 - Math.exp(-dt * 4.0);
        KEY_NAMES.forEach(function (name) {
            state[name] += (goal[name] - state[name]) * k;
        });

        const ease = 1 - Math.exp(-dt * 3.2);
        pointer.x += (pointer.tx - pointer.x) * ease;
        pointer.y += (pointer.ty - pointer.y) * ease;

        // 相机视差
        camera.position.set(pointer.x * 0.22, pointer.y * 0.16, state.z);
        camera.lookAt(0, 0, 0);

        // 竖屏：字标居中、缩小并压暗，贴在正文后方
        const aspect = camera.aspect;
        const portrait = aspect < 1;
        const xFit = Math.min(1, aspect / 1.5);
        const opacityMul = portrait ? 0.3 : 1;

        ck.position.set(
            portrait ? 0 : state.x * xFit,
            (portrait ? 0.35 : state.y) + Math.sin(t * 0.7) * 0.03 * motion,
            0
        );
        ck.scale.setScalar(state.s * (portrait ? 0.56 : 0.6 + 0.4 * xFit));

        tilt.rotation.set(
            state.rx + pointer.y * 0.1 + Math.sin(t * 0.45) * 0.015 * motion,
            state.ry + pointer.x * 0.16 + Math.sin(t * 0.37) * 0.05 * motion,
            0
        );

        // 字母入场
        letters.forEach(function (L) {
            const p = introT < 0 ? 0 : easeOutQuart(clamp01((introT - L.delay) / L.dur));
            L.unit.position.z = (1 - p) * -1.6;
            L.unit.rotation.y = (1 - p) * L.swing;
            L.unit.scale.setScalar(0.92 + 0.08 * p);
            L.mat.opacity = p * state.op * opacityMul;
        });

        ring.material.opacity = 0.14 * state.ring * introE * opacityMul;
        ring.rotation.z = t * 0.04 * motion;

        // 光源缓慢绕行，金属表面上的高光会自然地游走
        const a = t * 0.2 * motion;
        keyLight.position.set(Math.cos(a) * 6, 3.2 + Math.sin(a * 0.7) * 1.4, Math.sin(a) * 5 + 3);
        rimLight.position.set(-4 - Math.sin(a * 0.5) * 2, -2.5, -5);

        dust.rotation.y = t * 0.012 * motion;
        dust.material.opacity = state.dust * introE * 0.9;

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
            root.classList.add('no-webgl');
            return;
        }

        renderer.setClearColor(BG, 1);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.25 : 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        scene = new THREE.Scene();
        scene.environment = buildEnvironment();

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 120);
        camera.position.set(0, 0, 7);

        ck = new THREE.Group();
        tilt = new THREE.Group();
        ck.add(tilt);
        scene.add(ck);

        buildLetters();
        buildRing();
        buildDust();

        keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
        rimLight = new THREE.DirectionalLight(0xdfe6ff, 1.1);
        scene.add(keyLight);
        scene.add(rimLight);

        clock = new THREE.Clock();
        resize();

        let resizeTimer = 0;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 120);
        });
        window.addEventListener('load', measure);
        window.addEventListener('mousemove', function (event) {
            pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.ty = -((event.clientY / window.innerHeight) * 2 - 1);
        }, { passive: true });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else start();
        });

        start();
    }

    init();
})();
