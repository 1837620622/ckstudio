/* ===================================================================
   CKSTUDIO · 背景三维字标
   字形取自 Bodoni Moda Black（高反差 Didone）
   · 材质：黑色镜面正面（清漆层反射灯条）+ 亮银倒角，长焦镜头，产品摄影式布光
   · 台面：字标下方一块深色镜面，倒影向镜头方向渐隐
   · 入场：在黑暗中亮起并上升到位，K 滑入与 C 并拢，一道扫光掠过
   · 待机：缓慢摆动，灯条反射在正面上游走；指针用阻尼弹簧带动倾斜
   · 滚动：首屏之后退向深处并渐暗，中段完全隐去（停止渲染），到联系区重新浮现
   无 WebGL 或模块加载失败时，页面照常显示
   =================================================================== */
import * as THREE from './vendor/three-0.160.0/three.module.min.js';
import { EffectComposer } from './vendor/three-0.160.0/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three-0.160.0/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three-0.160.0/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three-0.160.0/addons/postprocessing/OutputPass.js';
import { Reflector } from './vendor/three-0.160.0/addons/objects/Reflector.js';
import { GLYPH_C, GLYPH_K, MONO_WIDTH } from './ck-glyphs.js';

const canvas = document.getElementById('scene-canvas');
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
const forceHigh = new URLSearchParams(window.location.search).get('quality') === 'high';

const SECTION_IDS = ['home', 'why', 'services', 'works', 'opensource', 'partner', 'about', 'contact'];

// 各区块的姿态：x / y / z 位置，s 缩放，ry / rx 转角，dim 亮度（0 即完全隐去）
const HIDDEN_WIDE = { x: 3.0, y: 0.7, z: -3.0, s: 0.8, ry: -1.1, rx: 0.14, dim: 0 };
const KEYS_WIDE = [
    { x: 1.80, y: 0.02, z:  0.0, s: 1.00, ry: -0.26, rx: 0.03, dim: 1.00 },
    { x: 2.90, y: 0.60, z: -2.2, s: 0.82, ry: -0.90, rx: 0.10, dim: 0.00 },
    HIDDEN_WIDE, HIDDEN_WIDE, HIDDEN_WIDE, HIDDEN_WIDE,
    { x: 2.40, y: 0.30, z: -2.0, s: 0.82, ry: -0.70, rx: 0.08, dim: 0.00 },
    { x: 1.90, y: 0.10, z:  0.0, s: 0.86, ry: -0.24, rx: 0.03, dim: 0.95 }
];

// 竖屏：首屏字标在上方，正文在下方；之后隐去
const HIDDEN_TALL = { x: 0, y: 2.0, z: -3.0, s: 0.5, ry: -1.0, rx: 0.16, dim: 0 };
const KEYS_TALL = [
    { x: 0, y: 0.92, z: 0.0, s: 0.72, ry: -0.20, rx: 0.04, dim: 1.00 },
    HIDDEN_TALL, HIDDEN_TALL, HIDDEN_TALL, HIDDEN_TALL, HIDDEN_TALL, HIDDEN_TALL, HIDDEN_TALL
];
const KEY_NAMES = Object.keys(KEYS_WIDE[0]);

const DEPTH = 0.22;
const MONO_SCALE = 2 / MONO_WIDTH * 1.22;
const FLOOR_Y = -MONO_SCALE - 0.12;   // 字标底边下方一点

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
        bevelSize: 0.014,
        bevelSegments: coarse ? 3 : 8,
        curveSegments: coarse ? 18 : 40
    });
    geo.translate(0, 0, -DEPTH / 2);
    geo.computeVertexNormals();
    return geo;
}

// ---------------------------------------------------------------
// 环境：黑色摄影棚，几条细长灯条
// 正面是近似镜面，反射的就是这些灯条；字标转动时，亮条会在表面滑过
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

    box(20, 1.6, 0, 9, 1, 6.0);       // 顶灯条
    box(1.4, 14, -10, 1, 3, 4.0);     // 左侧竖条
    box(0.9, 12, 10, 1, -4, 6.0);     // 右后轮廓光
    // 正面反射的方向落在镜头左前方：这里放一块大柔光板和一道细亮条，
    // 字标摆动时，正面上会有一道渐变高光缓慢滑过
    box(4.5, 11, -5.2, 1.2, 8.4, 1.5);  // 左前大柔光板
    box(0.5, 11, -2.6, 1.2, 9.6, 5.0);  // 左前细亮条
    box(0.8, 9, 5.5, 1, 9, 2.4);        // 右前细竖条
    box(16, 0.5, 0, -5.5, 6, 1.2);    // 底部细条

    const pmrem = new THREE.PMREMGenerator(renderer);
    const texture = pmrem.fromScene(env, 0.01).texture;
    pmrem.dispose();
    env.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    return texture;
}

// 拉丝金属：水平方向的细密划痕写进粗糙度贴图（绿色通道），
// 反射因此带上细微的条纹，正面不再是一整块平的颜色
function brushedTexture() {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = 'rgb(0,96,0)';
    g.fillRect(0, 0, size, size);
    let seed = 7;
    const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    };
    for (let i = 0; i < 4200; i++) {
        const y = rnd() * size;
        const v = Math.round(70 + rnd() * 60);
        g.strokeStyle = `rgba(0,${v},0,${(0.15 + rnd() * 0.3).toFixed(2)})`;
        g.lineWidth = 0.4 + rnd() * 0.6;
        const x = rnd() * size;
        const len = 80 + rnd() * 380;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + len, y + (rnd() - 0.5) * 1.5);
        g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.9, 0.9);
    tex.anisotropy = 4;
    return tex;
}

// 台面倒影：在字标脚下最清楚，向镜头方向与两侧渐隐
const FloorShader = {
    name: 'CKFloorShader',
    uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        strength: { value: 0 }
    },
    vertexShader: /* glsl */`
        uniform mat4 textureMatrix;
        varying vec4 vUv;
        varying vec2 vPlane;
        void main() {
            vUv = textureMatrix * vec4(position, 1.0);
            vPlane = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float strength;
        varying vec4 vUv;
        varying vec2 vPlane;
        void main() {
            vec3 base = texture2DProj(tDiffuse, vUv).rgb;
            float depthFade = smoothstep(0.08, 0.5, vPlane.y);
            float sideFade = 1.0 - smoothstep(0.22, 0.5, abs(vPlane.x - 0.5));
            gl_FragColor = vec4(base * strength * depthFade * sideFade, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }`
};

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
let lift;       // 入场上升
let letterC;
let letterK;
let floor = null;
let keyLight;
let sweepLight;
let softLight;   // 左前上方近处的点光源：正面的渐变光泽
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
let blankFrames = 0;

const perf = { frames: 0, total: 0, decided: forceHigh || coarse };

function buildMonogram() {
    // 正面：拉丝钛金属 + 薄清漆层
    const face = new THREE.MeshPhysicalMaterial({
        color: 0xa4a9b1,
        metalness: 1,
        roughness: 0.62,
        roughnessMap: brushedTexture(),
        clearcoat: 0.35,
        clearcoatRoughness: 0.08
    });
    // 侧壁与倒角：亮银镜面，勾出字形轮廓
    const edge = new THREE.MeshPhysicalMaterial({
        color: 0xf2f3f5,
        metalness: 1,
        roughness: 0.08
    });
    faceMats.push(face);
    edgeMats.push(edge);

    letterC = new THREE.Mesh(extrude(glyphShapes(GLYPH_C)), [face, edge]);
    letterK = new THREE.Mesh(extrude(glyphShapes(GLYPH_K)), [face, edge]);

    const mono = new THREE.Group();
    mono.scale.setScalar(MONO_SCALE);
    mono.add(letterC, letterK);
    tilt.add(mono);
}

function buildFloor() {
    if (coarse) return;
    const w = Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5) * 0.5);
    const h = Math.round(window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.5) * 0.5);
    floor = new Reflector(new THREE.PlaneGeometry(9, 4.5), {
        shader: FloorShader,
        textureWidth: w,
        textureHeight: h,
        clipBias: 0.003,
        color: 0xffffff,
        multisample: 0
    });
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    rig.add(floor);
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
    if (floor) {
        const r = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
        floor.getRenderTarget().setSize(Math.round(w * r), Math.round(h * r));
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
    const riseIn = it < 0 ? 0 : easeOutExpo(clamp01(it / 3.0));
    const kIn = it < 0 ? 0 : easeOutQuart(clamp01((it - 0.35) / 2.4));

    computeGoal();
    const k = 1 - Math.exp(-dt * 3.4);
    KEY_NAMES.forEach(name => {
        state[name] += (goal[name] - state[name]) * k;
    });

    // 滚动速度 → 轻微侧倾与 K 的前后错位
    const sy = window.scrollY;
    const raw = (sy - lastScrollY) / Math.max(dt, 1 / 240);
    lastScrollY = sy;
    scrollVel += (raw - scrollVel) * (1 - Math.exp(-dt * 5));
    const vel = Math.max(-1, Math.min(1, scrollVel / 5000)) * motion;

    spring(springX, pointer.x, dt, 24, 7);
    spring(springY, pointer.y, dt, 24, 7);

    // 金属反射的是很亮的灯条，线性压暗在色调映射后不明显，所以按 1.6 次方压暗
    const dim = Math.pow(Math.max(0, state.dim), 1.6) * lightIn;

    // 接近完全隐去时：先隐藏字标并清空几帧画面，然后停止渲染，节省 GPU
    const hidden = dim < 0.006 && it > 3.5;
    rig.visible = !hidden;
    if (hidden) {
        if (blankFrames > 2) return;
        blankFrames += 1;
    } else {
        blankFrames = 0;
    }

    const aspect = camera.aspect;
    const tall = aspect < 0.8;
    const fit = tall ? 1 : Math.min(1, aspect / 1.6);

    rig.position.set(state.x * fit, state.y, state.z);
    rig.scale.setScalar(state.s * (tall ? 1 : 0.62 + 0.38 * fit));

    // 入场：从台面下方缓慢升起
    lift.position.y = (1 - riseIn) * -0.5 + Math.sin(t * 0.5) * 0.025 * motion;

    tilt.rotation.set(
        state.rx - springY.p * 0.08 + (1 - swingIn) * 0.18 + Math.sin(t * 0.31) * 0.015 * motion,
        state.ry + springX.p * 0.16 + (1 - swingIn) * -0.8 + Math.sin(t * 0.19) * 0.12 * motion,
        vel * -0.04
    );

    // K 从右后方滑入，与 C 并拢；滚动时前后轻微错位
    letterK.position.set((1 - kIn) * 0.9, 0, (1 - kIn) * -0.9 + vel * 0.1);
    letterC.position.z = vel * -0.05;

    faceMats.forEach(m => { m.envMapIntensity = 0.45 * dim; });
    edgeMats.forEach(m => { m.envMapIntensity = 1.0 * dim; });
    keyLight.intensity = 0.6 * dim;
    softLight.intensity = 34 * dim;

    if (floor) {
        floor.visible = dim > 0.01;
        floor.material.uniforms.strength.value = 0.7 * clamp01(riseIn * 1.2);
    }

    // 近处柔光跟随字标，位置随时间缓慢漂移，正面的渐变随之流动
    softLight.position.set(rig.position.x - 1.6 + Math.sin(t * 0.21) * 0.6 * motion, rig.position.y + 1.6, rig.position.z + 3.2);

    // 主光缓慢绕行
    const a = t * 0.18 * motion;
    keyLight.position.set(Math.cos(a) * 5, 3.5 + Math.sin(a * 0.7) * 1.2, 4 + Math.sin(a) * 2);

    // 扫光：入场 1.4 秒时第一次，之后每 8 秒一次
    if (it > 1.4 && motion) {
        const cycle = (it - 1.4) % 8;
        const p = clamp01(cycle / 2.2);
        const e = easeInOutCubic(p);
        sweepLight.position.set(rig.position.x - 3.6 + e * 7.2, rig.position.y + 0.9 - e * 0.5, rig.position.z + 2.4);
        sweepLight.intensity = Math.sin(Math.PI * p) * 14 * dim;
    } else {
        sweepLight.intensity = 0;
    }

    camera.position.set(springX.p * 0.3, 0.35 + springY.p * 0.2, 10.5);
    camera.lookAt(0, 0, 0);

    if (useComposer) composer.render();
    else renderer.render(scene, camera);

    // 自适应画质：入场后统计帧时间，太慢就关掉泛光、倒影并降低分辨率
    if (!perf.decided && it > 3) {
        perf.frames += 1;
        perf.total += dt;
        if (perf.frames >= 90) {
            perf.decided = true;
            if (perf.total / perf.frames > 0.03) {
                useComposer = false;
                if (floor) {
                    rig.remove(floor);
                    floor.dispose();
                    floor = null;
                }
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

    // 长焦镜头：透视变形小，更接近产品摄影
    camera = new THREE.PerspectiveCamera(24, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0.35, 10.5);

    rig = new THREE.Group();
    lift = new THREE.Group();
    tilt = new THREE.Group();
    rig.add(lift);
    lift.add(tilt);
    scene.add(rig);
    buildMonogram();
    buildFloor();

    keyLight = new THREE.DirectionalLight(0xffffff, 0);
    sweepLight = new THREE.PointLight(0xffffff, 0, 8, 1.6);
    softLight = new THREE.PointLight(0xffffff, 0, 14, 2);
    scene.add(keyLight, sweepLight, softLight);

    // 泛光只保留金属上的高光闪点；触屏设备默认关闭
    if (!coarse) {
        const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
        composer = new EffectComposer(renderer, target);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.2, 0.0, 0.94));
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
