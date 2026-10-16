/* ===================================================================
   CKSTUDIO · 背景三维字标
   字形取自 Bodoni Moda Black（高反差 Didone），挤出为抛光铬金属
   · 入场：在黑暗中缓慢亮起，镜头推近，K 滑入与 C 并拢，一道扫光掠过
   · 待机：极慢的摆动与浮动，扫光间隔出现；指针用阻尼弹簧带动倾斜
   · 滚动：首屏之后退向深处并渐暗，中段完全隐去，到联系区重新浮现
   · 完全隐去时停止渲染，节省 GPU
   无 WebGL 或模块加载失败时，页面照常显示
   =================================================================== */
import * as THREE from './vendor/three-0.160.0/three.module.min.js';
import { EffectComposer } from './vendor/three-0.160.0/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three-0.160.0/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three-0.160.0/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three-0.160.0/addons/postprocessing/OutputPass.js';
import { GLYPH_C, GLYPH_K, MONO_WIDTH } from './ck-glyphs.js';

const canvas = document.getElementById('scene-canvas');
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
const forceHigh = new URLSearchParams(window.location.search).get('quality') === 'high';

const SECTION_IDS = ['home', 'why', 'services', 'works', 'opensource', 'partner', 'about', 'contact'];

// 各区块的姿态：x / y / z 位置，s 缩放，ry / rx 转角，dim 亮度（0 即完全隐去）
const KEYS_WIDE = [
    { x: 1.80, y: -0.02, z:  0.0, s: 1.00, ry: -0.40, rx:  0.04, dim: 1.00 },
    { x: 3.00, y:  0.70, z: -1.8, s: 0.80, ry: -1.10, rx:  0.12, dim: 0.14 },
    { x: 2.80, y:  0.55, z: -3.0, s: 0.80, ry: -1.35, rx:  0.18, dim: 0.00 },
    { x: 2.80, y:  0.55, z: -3.0, s: 0.80, ry: -1.35, rx:  0.18, dim: 0.00 },
    { x: 2.80, y:  0.55, z: -3.0, s: 0.80, ry: -1.35, rx:  0.18, dim: 0.00 },
    { x: 2.80, y:  0.55, z: -3.0, s: 0.80, ry: -1.35, rx:  0.18, dim: 0.00 },
    { x: 2.60, y:  0.40, z: -2.2, s: 0.80, ry: -0.90, rx:  0.10, dim: 0.00 },
    { x: 2.05, y:  0.20, z:  0.0, s: 0.78, ry: -0.34, rx:  0.04, dim: 0.95 }
];

// 竖屏：首屏字标在上方，正文在下方；之后隐去
const KEYS_TALL = [
    { x: 0, y: 0.88, z:  0.0, s: 0.70, ry: -0.30, rx: 0.06, dim: 1.00 },
    { x: 0, y: 1.80, z: -1.5, s: 0.55, ry: -0.90, rx: 0.14, dim: 0.00 },
    { x: 0, y: 2.20, z: -3.0, s: 0.50, ry: -1.20, rx: 0.18, dim: 0.00 },
    { x: 0, y: 2.20, z: -3.0, s: 0.50, ry: -1.20, rx: 0.18, dim: 0.00 },
    { x: 0, y: 2.20, z: -3.0, s: 0.50, ry: -1.20, rx: 0.18, dim: 0.00 },
    { x: 0, y: 2.20, z: -3.0, s: 0.50, ry: -1.20, rx: 0.18, dim: 0.00 },
    { x: 0, y: 2.20, z: -3.0, s: 0.50, ry: -1.20, rx: 0.18, dim: 0.00 },
    { x: 0, y: 2.20, z: -3.0, s: 0.50, ry: -1.20, rx: 0.18, dim: 0.00 }
];
const KEY_NAMES = Object.keys(KEYS_WIDE[0]);

const DEPTH = 0.42;

const clamp01 = v => Math.min(1, Math.max(0, v));
const easeOutQuart = p => 1 - Math.pow(1 - p, 4);
const easeOutExpo = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
const easeInOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// ---------------------------------------------------------------
// 字形 → 形状 → 挤出
// ---------------------------------------------------------------
function glyphShapes(data) {
    const path = new THREE.ShapePath();
    const t = data.split(' ');
    let i = 0;
    const n = () => parseFloat(t[i++]);
    while (i < t.length) {
        const op = t[i++];
        if (op === 'M') path.moveTo(n(), n());
        else if (op === 'L') path.lineTo(n(), n());
        else if (op === 'Q') path.quadraticCurveTo(n(), n(), n(), n());
        else if (op === 'C') path.bezierCurveTo(n(), n(), n(), n(), n(), n());
    }
    return path.toShapes(true);
}

function extrude(shapes) {
    const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.012,
        bevelSegments: coarse ? 3 : 6,
        curveSegments: coarse ? 18 : 40
    });
    geo.translate(0, 0, -DEPTH / 2);
    geo.computeVertexNormals();
    return geo;
}

// ---------------------------------------------------------------
// 环境：黑色摄影棚里的几条柔光灯条，铬面上形成干净的条状反射
// ---------------------------------------------------------------
function buildEnvironment(renderer) {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x000000);

    const box = (w, h, x, y, z, intensity) => {
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity), side: THREE.DoubleSide })
        );
        mesh.position.set(x, y, z);
        mesh.lookAt(0, 0, 0);
        env.add(mesh);
    };

    box(18, 2.2, 0, 9, 2, 5.0);       // 顶灯条
    box(1.6, 14, -10, 1, 4, 3.6);     // 左侧竖条
    box(1.1, 12, 10, 1, -4, 5.2);     // 右后轮廓光
    box(1.3, 10, 6.5, 2, 8, 2.2);     // 右前竖向灯条
    box(14, 0.6, 0, -4.8, 8, 1.4);    // 底部细条
    box(24, 10, 0, 3, 15, 0.26);      // 镜头后方大面柔光：正面的渐变光泽

    const pmrem = new THREE.PMREMGenerator(renderer);
    const texture = pmrem.fromScene(env, 0.02).texture;
    pmrem.dispose();
    env.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    return texture;
}

// ---------------------------------------------------------------
// 场景
// ---------------------------------------------------------------
let renderer;
let composer;
let useComposer = false;
let scene;
let camera;
let clock;

let rig;        // 位置与缩放
let tilt;       // 姿态
let letterC;
let letterK;
let keyLight;
let sweepLight;
const capMats = [];
const sideMats = [];

const state = {};
const goal = {};
let keys = KEYS_WIDE;

const springX = { p: 0, v: 0 };
const springY = { p: 0, v: 0 };
const pointer = { x: 0, y: 0 };
let lastScrollY = window.scrollY;
let scrollVel = 0;
let centers = [];
let introStart = -1;
let running = false;
let rafId = 0;
let blankFrames = 0;

const perf = { frames: 0, total: 0, decided: forceHigh || coarse };

function buildMonogram() {
    // 正面：抛光铬；侧壁：略暗的拉丝金属，转动时能读出厚度
    const cap = new THREE.MeshPhysicalMaterial({
        color: 0xf4f5f7,
        metalness: 1,
        roughness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.12
    });
    const side = new THREE.MeshPhysicalMaterial({
        color: 0xb7bbc2,
        metalness: 1,
        roughness: 0.32
    });
    capMats.push(cap);
    sideMats.push(side);

    letterC = new THREE.Mesh(extrude(glyphShapes(GLYPH_C)), [cap, side]);
    letterK = new THREE.Mesh(extrude(glyphShapes(GLYPH_K)), [cap, side]);

    const mono = new THREE.Group();
    mono.scale.setScalar(2 / MONO_WIDTH * 1.22);
    mono.add(letterC, letterK);
    tilt.add(mono);
}

// ---------------------------------------------------------------
// 滚动目标
// ---------------------------------------------------------------
function measure() {
    centers = SECTION_IDS.map(id => {
        const el = document.getElementById(id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return rect.top + window.scrollY + rect.height / 2;
    });
}

function computeGoal() {
    const y = window.scrollY + window.innerHeight * 0.45;
    const list = [];
    centers.forEach((c, i) => {
        if (c !== null) list.push([c, keys[i]]);
    });
    if (!list.length) return;

    let a = list[0][1];
    let b = a;
    let t = 0;
    if (y >= list[list.length - 1][0]) {
        a = list[list.length - 1][1];
        b = a;
    } else if (y > list[0][0]) {
        for (let i = 0; i < list.length - 1; i++) {
            if (y <= list[i + 1][0]) {
                a = list[i][1];
                b = list[i + 1][1];
                t = (y - list[i][0]) / (list[i + 1][0] - list[i][0]);
                t = t * t * (3 - 2 * t);
                break;
            }
        }
    }
    KEY_NAMES.forEach(name => {
        goal[name] = a[name] + (b[name] - a[name]) * t;
    });
}

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (composer) {
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(w, h);
    }
    keys = camera.aspect < 0.8 ? KEYS_TALL : KEYS_WIDE;
    measure();
    blankFrames = 0;
}

// 阻尼弹簧：略带回弹，让指针带来的倾斜有重量感
function spring(s, target, dt, k, c) {
    const a = (target - s.p) * k - s.v * c;
    s.v += a * dt;
    s.p += s.v * dt;
}

// ---------------------------------------------------------------
// 渲染循环
// ---------------------------------------------------------------
function frame() {
    rafId = requestAnimationFrame(frame);

    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    const motion = reduceMotion ? 0 : 1;

    // 入场在加载页收起后开始
    if (introStart < 0 && root.classList.contains('is-ready')) introStart = t;
    const it = reduceMotion ? 99 : (introStart < 0 ? -1 : t - introStart);

    const lightIn = it < 0 ? 0 : easeInOutCubic(clamp01((it - 0.1) / 2.6));
    const swingIn = it < 0 ? 0 : easeOutQuart(clamp01(it / 3.4));
    const dollyIn = it < 0 ? 0 : easeOutExpo(clamp01(it / 3.0));
    const kIn = it < 0 ? 0 : easeOutQuart(clamp01((it - 0.35) / 2.4));

    computeGoal();
    const k = 1 - Math.exp(-dt * 3.0);
    KEY_NAMES.forEach(name => {
        state[name] += (goal[name] - state[name]) * k;
    });

    // 滚动速度 → 轻微侧倾与 K 的前后错位
    const sy = window.scrollY;
    const raw = (sy - lastScrollY) / Math.max(dt, 1 / 240);
    lastScrollY = sy;
    scrollVel += (raw - scrollVel) * (1 - Math.exp(-dt * 5));
    const vel = Math.max(-1, Math.min(1, scrollVel / 5000)) * motion;

    spring(springX, pointer.x, dt, 26, 7);
    spring(springY, pointer.y, dt, 26, 7);

    // 金属反射的是很亮的灯条，线性压暗在色调映射后不明显，所以按 1.6 次方压暗
    const dim = Math.pow(Math.max(0, state.dim), 1.6) * lightIn;

    // 完全隐去时不再渲染（先补几帧黑场，确保画面清空）
    if (dim < 0.002 && it > 3.5) {
        if (blankFrames > 2) return;
        blankFrames += 1;
    } else {
        blankFrames = 0;
    }

    const aspect = camera.aspect;
    const tall = aspect < 0.8;
    const fit = tall ? 1 : Math.min(1, aspect / 1.6);

    rig.position.set(
        state.x * fit,
        state.y + Math.sin(t * 0.55) * 0.03 * motion,
        state.z + (1 - dollyIn) * -1.6
    );
    rig.scale.setScalar(state.s * (tall ? 1 : 0.62 + 0.38 * fit));

    tilt.rotation.set(
        state.rx - springY.p * 0.1 + (1 - swingIn) * 0.22 + Math.sin(t * 0.37) * 0.018 * motion,
        state.ry + springX.p * 0.18 + (1 - swingIn) * -0.95 + Math.sin(t * 0.23) * 0.07 * motion,
        vel * -0.05
    );

    // K 从右后方滑入，与 C 并拢；滚动时前后轻微错位
    letterK.position.set((1 - kIn) * 0.9, 0, (1 - kIn) * -0.9 + vel * 0.12);
    letterC.position.z = vel * -0.06;

    capMats.forEach(m => { m.envMapIntensity = 1.0 * dim; });
    sideMats.forEach(m => { m.envMapIntensity = 0.9 * dim; });
    keyLight.intensity = 1.0 * dim;

    // 主光缓慢绕行
    const a = t * 0.2 * motion;
    keyLight.position.set(Math.cos(a) * 5, 3.5 + Math.sin(a * 0.7) * 1.2, 4 + Math.sin(a) * 2);

    // 扫光：入场 1.4 秒时第一次，之后每 8 秒一次
    if (it > 1.4 && motion) {
        const cycle = (it - 1.4) % 8;
        const p = clamp01(cycle / 2.0);
        const e = easeInOutCubic(p);
        sweepLight.position.set(rig.position.x - 3.6 + e * 7.2, rig.position.y + 0.8 - e * 0.6, rig.position.z + 2.2);
        sweepLight.intensity = Math.sin(Math.PI * p) * 18 * dim;
    } else {
        sweepLight.intensity = 0;
    }

    camera.position.set(springX.p * 0.22, springY.p * 0.16, 7);
    camera.lookAt(0, 0, 0);

    if (useComposer) composer.render();
    else renderer.render(scene, camera);

    // 自适应画质：入场后统计帧时间，太慢就关掉泛光并降低分辨率
    if (!perf.decided && it > 3) {
        perf.frames += 1;
        perf.total += dt;
        if (perf.frames >= 90) {
            perf.decided = true;
            if (perf.total / perf.frames > 0.03) {
                useComposer = false;
                renderer.setPixelRatio(1);
                resize();
            }
        }
    }
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
    if (!canvas) return;

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !coarse,
        alpha: false,
        powerPreference: 'high-performance'
    });
    // 清屏用纯黑：后期管线里非零的清屏色会被色调映射抬成灰色
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    scene = new THREE.Scene();
    scene.environment = buildEnvironment(renderer);

    camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0, 7);

    rig = new THREE.Group();
    tilt = new THREE.Group();
    rig.add(tilt);
    scene.add(rig);
    buildMonogram();

    keyLight = new THREE.DirectionalLight(0xffffff, 0);
    sweepLight = new THREE.PointLight(0xffffff, 0, 7, 1.6);
    scene.add(keyLight, sweepLight);

    // 泛光只保留金属上的高光闪点；触屏设备默认关闭
    if (!coarse) {
        const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
        composer = new EffectComposer(renderer, target);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.0, 0.92));
        composer.addPass(new OutputPass());
        useComposer = true;
    }

    const first = (camera.aspect < 0.8 ? KEYS_TALL : KEYS_WIDE)[0];
    KEY_NAMES.forEach(name => {
        state[name] = first[name];
        goal[name] = first[name];
    });

    clock = new THREE.Clock();
    resize();

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 120);
    });
    window.addEventListener('load', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

    window.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch') return;
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });

    root.classList.add('has-scene');
    start();
}

try {
    init();
} catch (error) {
    root.classList.add('no-webgl');
    console.warn('[scene] 3D 背景未启用：', error);
}
