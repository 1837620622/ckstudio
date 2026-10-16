/* ===================================================================
   CKSTUDIO · 背景三维字标
   几何绘制的 CK，沿中线分为上下两半，中间是一道光缝
   · 材质：烟熏铬正面 + 亮银倒角，PMREM 环境反射，泛光（bloom）
   · 入场：光缝从中心拉开，上下两半沿光缝合拢，灯光亮起
   · 待机：缓慢摆动，光带周期性扫过金属表面
   · 交互：指针用弹簧阻尼带动倾斜；滚动越快，两半分得越开
   · 滚动：在各区块的姿态之间连续插值
   无 WebGL 或模块加载失败时，页面照常显示，只是没有背景
   =================================================================== */
import * as THREE from './vendor/three-0.160.0/three.module.min.js';
import { EffectComposer } from './vendor/three-0.160.0/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three-0.160.0/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three-0.160.0/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three-0.160.0/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('scene-canvas');
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
const forceHigh = new URLSearchParams(window.location.search).get('quality') === 'high';

const SECTION_IDS = ['home', 'services', 'works', 'opensource', 'partner', 'about', 'contact'];

// 各区块的字标姿态。x / y 为位置，s 缩放，ry / rx 转角，dim 亮度，split 分离量
const KEYS_WIDE = [
    { x:  2.10, y:  0.02, s: 0.86, ry: -0.36, rx:  0.06, dim: 1.00, split: 0.00 },
    { x:  3.45, y:  0.10, s: 0.62, ry: -0.95, rx:  0.14, dim: 0.24, split: 0.12 },
    { x:  3.45, y: -0.05, s: 0.62, ry: -0.55, rx: -0.08, dim: 0.20, split: 0.04 },
    { x:  3.45, y:  0.10, s: 0.62, ry: -1.10, rx:  0.12, dim: 0.20, split: 0.14 },
    { x:  3.45, y: -0.05, s: 0.62, ry: -0.70, rx:  0.02, dim: 0.22, split: 0.06 },
    { x:  3.45, y:  0.10, s: 0.62, ry: -0.90, rx:  0.10, dim: 0.20, split: 0.10 },
    { x:  2.25, y:  0.45, s: 0.60, ry: -0.32, rx:  0.04, dim: 0.80, split: 0.00 }
];

// 竖屏：首屏字标在上方，正文在下方；其余区块退到背景
const KEYS_TALL = [
    { x: 0, y:  1.22, s: 0.58, ry: -0.30, rx: 0.08, dim: 1.00, split: 0.00 },
    { x: 0, y:  0.50, s: 0.50, ry: -0.80, rx: 0.14, dim: 0.14, split: 0.10 },
    { x: 0, y:  0.50, s: 0.50, ry:  0.70, rx: 0.10, dim: 0.12, split: 0.05 },
    { x: 0, y:  0.50, s: 0.50, ry: -0.60, rx: 0.12, dim: 0.12, split: 0.12 },
    { x: 0, y:  0.50, s: 0.50, ry:  0.60, rx: 0.06, dim: 0.12, split: 0.06 },
    { x: 0, y:  0.50, s: 0.50, ry: -0.50, rx: 0.10, dim: 0.12, split: 0.10 },
    { x: 0, y:  1.30, s: 0.50, ry: -0.20, rx: 0.06, dim: 0.40, split: 0.00 }
];
const KEY_NAMES = Object.keys(KEYS_WIDE[0]);

// 字形（字高 2，以 C 的圆心为原点）
const STROKE = 0.32;
const DEPTH = 0.34;
const C_OUT = 1;
const C_IN = C_OUT - STROKE;
const C_TERM = 0.5;          // C 开口处的水平切口高度
const SEAM = 0.07;           // 中缝宽度
const HALF = SEAM / 2;
const K_X = 0.98;            // K 竖干左缘
const K_ARM = 0.38;          // K 斜干水平宽度
const K_R = K_X + 1.12;      // K 右缘
const K_FOOT = K_X + 0.1;    // 斜干在中线处的起点
const MONO_CENTER = (-C_OUT + K_R) / 2;

const clamp01 = v => Math.min(1, Math.max(0, v));
const easeOutQuart = p => 1 - Math.pow(1 - p, 4);
const easeOutExpo = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
const easeInOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// ---------------------------------------------------------------
// 形状
// ---------------------------------------------------------------
function cHalf(sign) {
    const aOutT = Math.asin(C_TERM / C_OUT);
    const aInT = Math.asin(C_TERM / C_IN);
    const aOutS = Math.PI - Math.asin(HALF / C_OUT);
    const aInS = Math.PI - Math.asin(HALF / C_IN);
    const s = new THREE.Shape();

    if (sign > 0) {
        s.moveTo(C_OUT * Math.cos(aOutT), C_OUT * Math.sin(aOutT));
        s.absarc(0, 0, C_OUT, aOutT, aOutS, false);
        s.lineTo(C_IN * Math.cos(aInS), C_IN * Math.sin(aInS));
        s.absarc(0, 0, C_IN, aInS, aInT, true);
    } else {
        s.moveTo(C_OUT * Math.cos(-aOutT), C_OUT * Math.sin(-aOutT));
        s.absarc(0, 0, C_OUT, -aOutT, -aOutS, true);
        s.lineTo(C_IN * Math.cos(-aInS), C_IN * Math.sin(-aInS));
        s.absarc(0, 0, C_IN, -aInS, -aInT, false);
    }
    s.closePath();
    return s;
}

// K 的半边：竖干与斜干合成一个多边形，交接处倒角干净
function kHalf(sign) {
    const slopeL = (K_R - K_ARM - K_FOOT);          // 斜干左缘每单位 y 的 x 增量
    const slopeR = (K_R - (K_FOOT + K_ARM));
    const yJoin = (K_X + STROKE - K_FOOT) / slopeL;  // 斜干左缘与竖干右缘的交点
    const xSeamR = K_FOOT + K_ARM + slopeR * HALF;

    const pts = [
        [K_X, HALF],
        [K_X, 1],
        [K_X + STROKE, 1],
        [K_X + STROKE, yJoin],
        [K_R - K_ARM, 1],
        [K_R, 1],
        [xSeamR, HALF]
    ];
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => {
        if (i === 0) s.moveTo(x, y * sign);
        else s.lineTo(x, y * sign);
    });
    s.closePath();
    return s;
}

function extrude(shape) {
    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.045,
        bevelSize: 0.032,
        bevelSegments: coarse ? 3 : 6,
        curveSegments: coarse ? 40 : 96
    });
    geo.translate(0, 0, -DEPTH / 2);
    return geo;
}

// ---------------------------------------------------------------
// 贴图：水平渐隐的光缝、柔光、圆点
// ---------------------------------------------------------------
function canvasTexture(w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

const seamTexture = () => canvasTexture(512, 4, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(0.82, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
});

const glowTexture = () => canvasTexture(256, 256, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
});

// ---------------------------------------------------------------
// 环境：黑色空间里几条软箱，金属上会出现清晰的条状高光
// ---------------------------------------------------------------
function buildEnvironment(renderer) {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x030304);

    const box = (w, h, x, y, z, intensity) => {
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity), side: THREE.DoubleSide })
        );
        mesh.position.set(x, y, z);
        mesh.lookAt(0, 0, 0);
        env.add(mesh);
    };

    box(16, 2.4, 0, 9, 3, 5.5);    // 顶灯条
    box(1.8, 14, -10, 1, 4, 4.5);  // 左侧竖条
    box(1.2, 11, 10, 2, -3, 6);    // 右后轮廓光
    box(1.4, 10, 6, 2, 8, 2.4);    // 右前竖向灯条
    box(12, 0.7, 0, -4.5, 8, 1.6); // 底部细条
    box(22, 9, 0, 4, 15, 0.32);    // 镜头后方的大面柔光，让正面有一层渐变光泽

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
let bloom;
let useComposer = false;
let scene;
let camera;
let clock;

let ck;          // 位置与缩放
let tilt;        // 姿态
let topHalf;
let bottomHalf;
let seam;
let seamGlow;
let backGlow;
let dust;
let keyLight;
let sweepLight;
const faceMats = [];
const edgeMats = [];

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

// 自适应画质：入场后统计帧时间，太慢就关掉泛光并降低分辨率
const perf = { frames: 0, total: 0, decided: forceHigh || coarse };

function buildMonogram() {
    const face = new THREE.MeshPhysicalMaterial({
        color: 0x7d838d,
        metalness: 1,
        roughness: 0.26,
        clearcoat: 1,
        clearcoatRoughness: 0.2
    });
    const edge = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.1
    });
    faceMats.push(face);
    edgeMats.push(edge);

    // ExtrudeGeometry：组 0 是正反面，组 1 是侧壁与倒角
    const half = sign => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(extrude(cHalf(sign)), [face, edge]));
        g.add(new THREE.Mesh(extrude(kHalf(sign)), [face, edge]));
        return g;
    };

    const mono = new THREE.Group();
    mono.position.x = -MONO_CENTER;
    topHalf = half(1);
    bottomHalf = half(-1);
    mono.add(topHalf, bottomHalf);
    tilt.add(mono);

    // 光缝：一条细亮线 + 一层柔光
    const seamTex = seamTexture();
    seam = new THREE.Mesh(
        new THREE.PlaneGeometry(4.8, 0.014),
        new THREE.MeshBasicMaterial({
            map: seamTex,
            color: new THREE.Color().setScalar(1.7),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        })
    );
    seamGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(4.8, 0.42),
        new THREE.MeshBasicMaterial({
            map: glowTexture(),
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    seamGlow.scale.y = 1;
    tilt.add(seam, seamGlow);

    // 字标背后的一团极淡的光，拉开前后层次
    backGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 7),
        new THREE.MeshBasicMaterial({
            map: glowTexture(),
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    backGlow.position.z = -2.4;
    ck.add(backGlow);
}

function buildDust() {
    const count = coarse ? 260 : 900;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 8 + Math.random() * 8;
        const u = Math.random() * 2 - 1;
        const th = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        pos[i * 3] = r * s * Math.cos(th) * 1.3;
        pos[i * 3 + 1] = r * u * 0.8;
        pos[i * 3 + 2] = r * s * Math.sin(th) - 2;
        const b = 0.12 + Math.pow(Math.random(), 2.6) * 0.7;
        col[i * 3] = b;
        col[i * 3 + 1] = b;
        col[i * 3 + 2] = b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    dust = new THREE.Points(geo, new THREE.PointsMaterial({
        size: coarse ? 0.06 : 0.045,
        map: glowTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    }));
    scene.add(dust);
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

    const seamIn = it < 0 ? 0 : easeOutExpo(clamp01((it - 0.05) / 1.2));
    const topIn = it < 0 ? 0 : easeOutQuart(clamp01((it - 0.35) / 1.9));
    const botIn = it < 0 ? 0 : easeOutQuart(clamp01((it - 0.5) / 1.9));
    const lightIn = it < 0 ? 0 : easeInOutCubic(clamp01((it - 0.3) / 2.2));
    const swingIn = it < 0 ? 0 : easeOutQuart(clamp01((it - 0.2) / 2.8));

    // 区块姿态
    computeGoal();
    const k = 1 - Math.exp(-dt * 3.4);
    KEY_NAMES.forEach(name => {
        state[name] += (goal[name] - state[name]) * k;
    });

    // 滚动速度 → 两半分离、轻微侧倾
    const sy = window.scrollY;
    const raw = (sy - lastScrollY) / Math.max(dt, 1 / 240);
    lastScrollY = sy;
    scrollVel += (raw - scrollVel) * (1 - Math.exp(-dt * 6));
    const velSplit = Math.min(0.22, Math.abs(scrollVel) / 7000) * motion;
    const velRoll = Math.max(-0.07, Math.min(0.07, scrollVel / 14000)) * motion;

    // 指针
    spring(springX, pointer.x, dt, 30, 7.5);
    spring(springY, pointer.y, dt, 30, 7.5);

    // 位置与缩放
    const aspect = camera.aspect;
    const tall = aspect < 0.8;
    const fit = tall ? 1 : Math.min(1, aspect / 1.6);
    ck.position.set(
        state.x * fit,
        state.y + Math.sin(t * 0.6) * 0.035 * motion,
        0
    );
    ck.scale.setScalar(state.s * (tall ? 1 : 0.62 + 0.38 * fit));

    tilt.rotation.set(
        state.rx - springY.p * 0.12 + Math.sin(t * 0.43) * 0.02 * motion,
        state.ry + springX.p * 0.2 + Math.sin(t * 0.29) * 0.08 * motion + (1 - swingIn) * -1.1,
        velRoll
    );

    // 上下两半：入场合拢 + 区块分离 + 速度分离
    const split = (state.split + velSplit) / 2;
    topHalf.position.set(0, split + (1 - topIn) * 0.95, (1 - topIn) * -1.4);
    topHalf.rotation.x = (1 - topIn) * -0.7;
    bottomHalf.position.set(0, -split - (1 - botIn) * 0.95, (1 - botIn) * -1.4);
    bottomHalf.rotation.x = (1 - botIn) * 0.7;

    // 亮度
    // 金属反射的是很亮的灯条，线性压暗在色调映射后不明显，所以按 1.6 次方压暗
    const dim = Math.pow(state.dim, 1.6) * lightIn;
    faceMats.forEach(m => { m.envMapIntensity = 1.05 * dim; });
    edgeMats.forEach(m => { m.envMapIntensity = 1.15 * dim; });
    keyLight.intensity = 1.5 * dim;

    const pulse = 0.88 + Math.sin(t * 1.3) * 0.12 * motion;
    seam.scale.x = Math.max(0.0001, seamIn);
    seam.material.opacity = state.dim * pulse * (it < 0 ? 0 : 1);
    seamGlow.scale.x = Math.max(0.0001, seamIn);
    seamGlow.material.opacity = 0.14 * state.dim * pulse * seamIn;
    backGlow.material.opacity = 0.02 * dim;

    // 主光缓慢绕行
    const a = t * 0.22 * motion;
    keyLight.position.set(Math.cos(a) * 5, 3.5 + Math.sin(a * 0.7) * 1.2, 4 + Math.sin(a) * 2);

    // 扫光：入场 1.7 秒时第一次，之后每 9 秒一次
    if (it > 1.7 && motion) {
        const cycle = (it - 1.7) % 9;
        const p = clamp01(cycle / 1.9);
        const e = easeInOutCubic(p);
        sweepLight.position.set(-4.2 + e * 8.4, 0.6 - e * 0.4, 2.1);
        sweepLight.intensity = Math.sin(Math.PI * p) * 34 * dim;
    } else {
        sweepLight.intensity = 0;
    }

    dust.rotation.y = t * 0.01 * motion;
    dust.material.opacity = 0.85 * Math.max(0.4, state.dim) * lightIn;

    // 相机视差
    camera.position.set(springX.p * 0.25, springY.p * 0.18, 7);
    camera.lookAt(0, 0, 0);

    if (useComposer) composer.render();
    else renderer.render(scene, camera);

    // 自适应画质
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene = new THREE.Scene();
    scene.environment = buildEnvironment(renderer);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0, 7);

    ck = new THREE.Group();
    tilt = new THREE.Group();
    ck.add(tilt);
    scene.add(ck);

    buildMonogram();
    buildDust();

    keyLight = new THREE.DirectionalLight(0xffffff, 0);
    sweepLight = new THREE.PointLight(0xffffff, 0, 7, 1.6);
    scene.add(keyLight, sweepLight);

    // 泛光：触屏设备默认关闭
    if (!coarse) {
        const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
        composer = new EffectComposer(renderer, target);
        composer.addPass(new RenderPass(scene, camera));
        bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.36, 0.42, 0.9);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
        useComposer = true;
    }

    const start0 = (camera.aspect < 0.8 ? KEYS_TALL : KEYS_WIDE)[0];
    KEY_NAMES.forEach(name => {
        state[name] = start0[name];
        goal[name] = start0[name];
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
