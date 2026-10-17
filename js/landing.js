/* ==========================================================================
   CKSTUDIO · 传康Kk — 落地页脚本
   加载页 → 光标 → 顶栏 → 标题拆字与自适应 → 首屏数字场与体素 <CK>
   → 30,000 粒子（球体 / 键盘 / <CK>）→ 整屏翻页 → 卡片与联系方式
   ========================================================================== */
import * as THREE from './vendor/three-0.160.0/three.module.min.js';
import { mergeGeometries } from './vendor/three-0.160.0/addons/utils/BufferGeometryUtils.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const fract = v => v - Math.floor(v);
const hash = (c, r) => fract(Math.sin(c * 127.1 + r * 311.7) * 43758.5453);
const pad2 = n => String(n).padStart(2, '0');

const root = document.documentElement;
const body = document.body;
// 效果设置：指针互动、画质、动效、按键音，只保存在本机浏览器
const FX_KEY = 'ck-fx';
const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = systemReduce.matches;
function loadFx() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(FX_KEY) || 'null'); } catch (err) { saved = null; }
    const s = saved && typeof saved === 'object' ? saved : {};
    return {
        pointer: s.pointer !== false,
        quality: ['auto', 'high', 'low'].includes(s.quality) ? s.quality : 'auto',
        motion: ['system', 'reduce', 'full'].includes(s.motion) ? s.motion : 'system',
        sound: s.sound === true
    };
}
const fx = loadFx();
function saveFx() {
    try { localStorage.setItem(FX_KEY, JSON.stringify(fx)); } catch (err) { /* 无痕模式 */ }
}
// 卡顿时自动降一档画质（像素比 → 粒子数）；选“高”或地址栏带 ?quality=high 时不降
const perf = { n: 0, acc: 0, level: fx.quality === 'low' ? 2 : 0, skip: 90 };
let lockQuality = fx.quality === 'high' || /[?&]quality=high\b/.test(location.search);
const mouseUI = window.matchMedia('(hover: hover) and (pointer: fine)');

const header = $('#siteHeader');
const mainEl = $('#main');
const navToggle = $('#navToggle');
const stageEl = $('#stage');
const rail = $('#rail');
const railFill = $('#railFill');
const railNum = $('#railNum');
const heroBg = $('#heroBg');
const sections = $$('#main > section');
const N = sections.length;
const HASHES = sections.map(s => s.dataset.hash);
function hashIndex() {
    let h = location.hash.slice(1);
    try { h = decodeURIComponent(h); } catch (err) { /* 残缺的转义序列，按原样比较 */ }
    return HASHES.indexOf(h);
}

// 每一屏对应的粒子形态：A 球体 / B 键盘 / C <CK>；首屏不显示粒子
const FORMS = [null, 'A', 'B', 'C', 'A', 'B', 'C'];
// 粒子层在各屏的不透明度：内容较多的后三屏压暗，让文字更好读
const STAGE_OP = [1, 1, 1, 1, 0.45, 0.14, 0.12];
const LEAVE_MS = 900;
// 竖排布局里能力屏的卡片压在球体上，粒子再暗一些
const stageOp = i => (i === 4 && (W <= 900 || H < 560) ? 0.2 : STAGE_OP[i]);

let W = window.innerWidth;
let H = window.innerHeight;
let cur = 0;
let busy = false;
let coolUntil = 0;
let view = 0;
let pendingGo = null;
let pointerX = 0;
let pointerY = 0;
let pxs = 0;
let pys = 0;
let loadedDone = false;
let hero = null;
let stage = null;

/* ---------- 安全区与内边距 ---------- */
const probe = document.createElement('div');
probe.setAttribute('aria-hidden', 'true');
probe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
body.appendChild(probe);
function safeArea() {
    const cs = getComputedStyle(probe);
    return {
        t: parseFloat(cs.paddingTop) || 0,
        r: parseFloat(cs.paddingRight) || 0,
        b: parseFloat(cs.paddingBottom) || 0,
        l: parseFloat(cs.paddingLeft) || 0
    };
}
const padPx = () => parseFloat(getComputedStyle(root).getPropertyValue('--pad')) || 22;
function syncHeader() {
    root.style.setProperty('--header-h', header.offsetHeight + 'px');
}

/* ===================================================================
   加载页：底图、字标、键盘采样、字体四项就绪后淡出
   =================================================================== */
const NEED = ['bg', 'glb', 'keys', 'font'];
const got = new Set();
const markReady = k => { got.add(k); };
const loader = $('#loader');
const ldFill = $('#ldFill');
const ldPct = $('#ldPct');
let shown = 6;

function loaderTick() {
    const real = got.size / NEED.length * 100;
    if (shown < real) shown = Math.min(real, shown + Math.max(0.5, (real - shown) * 0.10));
    const p = Math.min(100, shown);
    ldFill.style.width = p + '%';
    ldPct.style.left = `max(${p}%, ${ldPct.offsetWidth}px)`;
    ldPct.textContent = Math.floor(p) + '%';
    if (p >= 100) finishLoad();
}
setTimeout(() => NEED.forEach(markReady), 15000);

const plate = new Image();
plate.onload = plate.onerror = () => markReady('bg');
plate.src = 'assets/hero-plate.webp';

if (document.fonts && document.fonts.load) {
    Promise.all([
        document.fonts.load('400 100px "Schibsted Grotesk"'),
        document.fonts.load('500 20px "Schibsted Grotesk"'),
        document.fonts.load('400 100px "CK Sans SC"', '传康工作站')
    ]).catch(() => {}).then(() => document.fonts.ready).then(() => markReady('font'), () => markReady('font'));
} else {
    markReady('font');
}

function finishLoad() {
    if (loadedDone) return;
    loadedDone = true;
    loader.classList.add('done');
    body.classList.remove('loading');
    if (mouseUI.matches) root.classList.add('has-cursor');
    setTimeout(() => { loader.hidden = true; }, 800);
    W = window.innerWidth;
    H = window.innerHeight;
    syncHeader();
    fitHeadings();
    if (hero) hero.fit();
    if (stage) stage.resize();
    const start = hashIndex();
    if (start > 0) {
        jumpTo(start);
    } else {
        applyView(0);
        playSection(sections[0], true);
        updateNav(0);
    }
}

/* ===================================================================
   光标：差值混合的圆环，悬停首屏字标时变成实心点
   =================================================================== */
const cursorEl = $('#cursor');
const cursorLabel = $('#cursorLabel');
const cz = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2 };
const LABEL_DEFAULT = cursorLabel.textContent;
let labelText = LABEL_DEFAULT;
let hoverLabel = null;
let overLink = false;
let overHeroGL = false;
let heroDragging = false;

// 系统光标在加载完成后才隐藏（加载页盖在自定义光标上面）

window.addEventListener('pointermove', e => {
    pointerX = e.clientX / W - 0.5;
    pointerY = e.clientY / H - 0.5;
    if (e.pointerType === 'mouse') {
        cz.tx = e.clientX;
        cz.ty = e.clientY;
        if (!cursorEl.classList.contains('vis')) {
            cz.x = cz.tx;
            cz.y = cz.ty;
            cursorEl.classList.add('vis');
        }
    }
}, { passive: true });
root.addEventListener('mouseleave', () => cursorEl.classList.remove('vis'));
document.addEventListener('pointerover', e => {
    const el = e.target.closest ? e.target.closest('a, button, [data-cursor]') : null;
    overLink = !!el;
    hoverLabel = el && el.dataset.cursor ? el.dataset.cursor : null;
});

function updateCursor() {
    if (!mouseUI.matches) return;
    cz.x += (cz.tx - cz.x) * 0.22;
    cz.y += (cz.ty - cz.y) * 0.22;
    cursorEl.style.transform = `translate3d(${cz.x.toFixed(2)}px, ${cz.y.toFixed(2)}px, 0)`;
    cursorLabel.style.transform = `translate3d(${cz.x.toFixed(2)}px, ${cz.y.toFixed(2)}px, 0) translate(-50%, 25px)`;
    const big = view > H * 0.70;
    cursorEl.classList.toggle('dot', (overHeroGL || heroDragging || !!overKeyLabel) && !overLink);
    cursorEl.classList.toggle('big', big && !overLink && !overHeroGL && !overKeyLabel);
    cursorEl.classList.toggle('link', overLink);
    const want = hoverLabel || overKeyLabel || LABEL_DEFAULT;
    if (want !== labelText) {
        labelText = want;
        cursorLabel.textContent = want;
    }
    const on = hoverLabel || overKeyLabel ? true : (big && !overLink && view < (N - 1 - 0.45) * H);
    cursorLabel.classList.toggle('on', on);
}

/* ===================================================================
   顶栏：矮屏时折叠为汉堡菜单
   =================================================================== */
function setMenu(open) {
    header.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
}
navToggle.addEventListener('click', () => setMenu(!header.classList.contains('open')));
window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => {
    const a = e.target.closest ? e.target.closest('[data-go]') : null;
    if (!a) return;
    e.preventDefault();
    setMenu(false);
    go(Number(a.dataset.go));
});

function updateNav(n) {
    $$('.navpill a[data-go], .rail-hit a[data-go]').forEach(a => {
        if (Number(a.dataset.go) === n) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
    });
    railNum.innerHTML = `<b>${pad2(n + 1)}</b> / ${pad2(N)}`;
}

/* ===================================================================
   标题：拆成逐字（中文）/ 逐词（英文）的块，点阵字的网格跨字连续
   =================================================================== */
const SEG = /[A-Za-z0-9][A-Za-z0-9.'’-]*|\s+|[^\sA-Za-z0-9]/g;

function splitLines() {
    for (const h of $$('.disp')) {
        h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
        for (const line of $$('.rv', h)) {
            line.setAttribute('aria-hidden', 'true');
            const dot = line.dataset.dot === '1';
            const text = line.textContent.trim();
            line.textContent = '';
            for (const seg of text.match(SEG) || []) {
                const s = document.createElement('span');
                if (/^\s+$/.test(seg)) {
                    s.textContent = ' ';
                    s.className = 'sp';
                } else {
                    s.textContent = seg;
                    if (/[^\u0000-ɏ]/.test(seg)) s.className = 'zh';
                }
                if (dot) s.classList.add('dotfill');
                line.appendChild(s);
            }
        }
    }
}

function rangeWidth(el) {
    const r = document.createRange();
    r.selectNodeContents(el);
    return r.getBoundingClientRect().width;
}

function availFor(h) {
    const cs = getComputedStyle(h);
    const sa = safeArea();
    const pad = padPx();
    const pl = Math.max(pad, sa.l);
    const pr = Math.max(pad, sa.r);
    const r = h.getBoundingClientRect();
    if (cs.position === 'absolute') {
        if (h.id === 'heroTitle') return $('#heroAside').getBoundingClientRect().left - 28 - r.left;
        let room = cs.textAlign === 'right' ? r.right - pl : root.clientWidth - pr - r.left;
        if (h.dataset.avoid) {
            const o = $(h.dataset.avoid);
            if (o && o.getClientRects().length && getComputedStyle(o).position === 'absolute') room = Math.min(room, o.getBoundingClientRect().left - 40 - r.left);
        }
        return room;
    }
    const p = h.parentElement;
    const pcs = getComputedStyle(p);
    const inner = p.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
    if (pcs.display === 'flex' && pcs.flexDirection.indexOf('row') === 0) {
        const others = Array.from(p.children).filter(c => c !== h).reduce((s, c) => s + c.getBoundingClientRect().width, 0);
        return inner - others - (parseFloat(pcs.columnGap) || 0);
    }
    if (cs.alignSelf === 'flex-end' || cs.alignSelf === 'end') return inner;
    return r.width;
}

function fitHeadings() {
    for (const h of $$('.fit')) {
        h.style.fontSize = '';
        const lines = $$('.rv', h);
        let fs = parseFloat(getComputedStyle(h).fontSize);
        const avail = availFor(h);
        let wide = Math.max(...lines.map(rangeWidth));
        let guard = 0;
        while (wide > avail && fs > 20 && guard++ < 80) {
            fs = Math.max(20, fs * 0.96);
            h.style.fontSize = fs + 'px';
            wide = Math.max(...lines.map(rangeWidth));
        }
    }
    regrid();
}

function regrid() {
    for (const s of $$('.dotfill')) {
        const P = parseFloat(getComputedStyle(s).backgroundSize) || 6.5;
        s.style.backgroundPosition = `${-(s.offsetLeft % P)}px ${-(s.offsetTop % P)}px`;
    }
}

/* ---------- 显现：逐字模糊淡入，段落上浮 ---------- */
function playSection(sec, first) {
    if (sec.dataset.done) return;
    sec.dataset.done = '1';
    sec._timers = [];
    $$('.rv, .fade', sec).forEach((el, i) => {
        if (el.classList.contains('rv')) {
            const d = Number(el.dataset.d || 0);
            Array.from(el.children).forEach((s, j) => { s.style.transitionDelay = (d + j * 55) + 'ms'; });
        }
        const delay = first ? 140 + i * 110 : 40 + i * 90;
        sec._timers.push(setTimeout(() => el.classList.add('in'), delay));
    });
}

function resetSection(sec) {
    delete sec.dataset.done;
    (sec._timers || []).forEach(clearTimeout);
    sec._timers = [];
    $$('.rv, .fade', sec).forEach(el => el.classList.remove('in'));
    $$('.rv > span', sec).forEach(s => { s.style.transitionDelay = ''; });
}

/* ===================================================================
   首屏数字场：像行情屏一样缓慢起伏的两位数
   =================================================================== */
const numsEl = $('#heroNums');
const nctx = numsEl.getContext('2d');
let numT = 0;

function sizeNums() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    numsEl.width = Math.round(W * dpr);
    numsEl.height = Math.round(H * dpr);
    nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawNums();
}

function drawNums() {
    const COL = 47;
    const ROW = 33;
    nctx.clearRect(0, 0, W, H);
    nctx.font = '500 20px "Schibsted Grotesk", Helvetica, sans-serif';
    nctx.textBaseline = 'top';
    const cols = Math.ceil(W / COL) + 1;
    const rows = Math.ceil(H * 0.66 / ROW);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (hash(c, r) < 0.12) continue;
            const v = clamp(Math.round(50 + 49 * Math.sin(c * 0.19 + r * 0.075 + numT * 0.22) * Math.cos(r * 0.14 - numT * 0.09 + c * 0.03)), 0, 99);
            nctx.fillStyle = `rgba(255,255,255,${(0.12 + 0.24 * hash(r, c)).toFixed(3)})`;
            nctx.fillText(String(v), c * COL + 10, r * ROW + 7);
        }
    }
}
setInterval(() => {
    if (!reduceMotion && view < H && !document.hidden) {
        numT += 0.08;
        drawNums();
    }
}, 110);

/* ===================================================================
   体素字标 <CK>：手工点阵 → 带倒角的方块 → 合并成三块几何体
   =================================================================== */
const GLYPHS = {
    C: ['..#####', '.######', '###....', '##.....', '##.....', '##.....', '###....', '.######', '..#####'],
    K: ['##...##', '##..###', '##.###.', '#####..', '####...', '#####..', '##.###.', '##..###', '##...##'],
    V: ['...##', '..##.', '.##..', '##...', '.##..', '..##.', '...##']
};
const GLYPH_ROWS = 9;

const cellCache = new Map();
function cellGeometry(depth) {
    if (cellCache.has(depth)) return cellCache.get(depth);
    const size = 0.97;
    const bevel = 0.05;
    const half = size / 2 - bevel;
    const rr = 0.07;
    const s = new THREE.Shape();
    s.moveTo(-half + rr, -half);
    s.lineTo(half - rr, -half);
    s.quadraticCurveTo(half, -half, half, -half + rr);
    s.lineTo(half, half - rr);
    s.quadraticCurveTo(half, half, half - rr, half);
    s.lineTo(-half + rr, half);
    s.quadraticCurveTo(-half, half, -half, half - rr);
    s.lineTo(-half, -half + rr);
    s.quadraticCurveTo(-half, -half, -half + rr, -half);
    const inner = Math.max(0.02, depth - bevel * 2);
    const g = new THREE.ExtrudeGeometry(s, {
        depth: inner,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
        curveSegments: 3
    });
    g.translate(0, 0, -inner / 2);
    cellCache.set(depth, g);
    return g;
}

function glyphGeometry(rows, seed) {
    const R = rows.length;
    const parts = [];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < rows[r].length; c++) {
            if (rows[r][c] !== '#') continue;
            const hv = hash(c + seed * 7.0, r + seed * 3.0);
            let d = 0.82;
            let z = 0;
            if (hv < 0.14) { d = 1.15; z = 0.20; } else if (hv < 0.30) { d = 0.60; z = -0.10; }
            const g = cellGeometry(d).clone();
            g.translate(c + 0.5, R - 1 - r + 0.5, z);
            const n = g.attributes.position.count;
            const cell = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) {
                cell[i * 3] = c + 0.5;
                cell[i * 3 + 1] = R - 1 - r + 0.5;
                cell[i * 3 + 2] = z;
            }
            g.setAttribute('aCell', new THREE.BufferAttribute(cell, 3));
            parts.push(g);
        }
    }
    const geo = mergeGeometries(parts);
    parts.forEach(p => p.dispose());
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, 0);
    const cells = geo.attributes.aCell;
    for (let i = 0; i < cells.count; i++) cells.setXY(i, cells.getX(i) - c.x, cells.getY(i) - c.y);
    geo.computeBoundingBox();
    return geo;
}

const GEO = {
    V: glyphGeometry(GLYPHS.V, 1),
    C: glyphGeometry(GLYPHS.C, 2),
    K: glyphGeometry(GLYPHS.K, 3)
};

// 左尖括号、C、K、镜像的右尖括号；间距一格，整体高度归一为 1
function buildWordmark(matChev, matLetter) {
    const group = new THREE.Group();
    const GAP = 1;
    const wV = 5;
    const wL = 7;
    const total = wV + GAP + wL + GAP + wL + GAP + wV;
    let x = -total / 2;
    const place = (geo, mat, w, mirror) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.x = x + w / 2;
        if (mirror) m.scale.x = -1;
        group.add(m);
        x += w + GAP;
        return m;
    };
    place(GEO.V, matChev, wV, false);
    place(GEO.C, matLetter, wL, false);
    place(GEO.K, matLetter, wL, false);
    place(GEO.V, matChev, wV, true);
    group.scale.setScalar(1 / GLYPH_ROWS);
    return group;
}

/* ===================================================================
   首屏 3D：彩虹膜金属的体素字标，可拖动，随指针轻微转动
   =================================================================== */
function envCanvas() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const g = c.getContext('2d');
    let gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#eef5fb');
    gr.addColorStop(0.55, '#b6cddc');
    gr.addColorStop(1, '#6d8ea3');
    g.fillStyle = gr;
    g.fillRect(0, 0, 1024, 256);
    gr = g.createLinearGradient(0, 254, 0, 512);
    gr.addColorStop(0, '#f6efe6');
    gr.addColorStop(0.07, '#a8836c');
    gr.addColorStop(0.26, '#5a3b2e');
    gr.addColorStop(1, '#241812');
    g.fillStyle = gr;
    g.fillRect(0, 254, 1024, 258);
    const rg = g.createRadialGradient(300, 84, 0, 300, 84, 210);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 1024, 512);
    return c;
}

function initHero() {
    const canvas = $('#heroGL');
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
        canvas.style.display = 'none';
        return null;
    }
    let heroPR = 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, heroPR));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 1, 6000);
    camera.position.z = 600;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = new THREE.CanvasTexture(envCanvas());
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    scene.environment = pmrem.fromEquirectangular(envTex).texture;
    envTex.dispose();
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xe6f1fa, 0x4a352c, 0.22));
    const key = new THREE.DirectionalLight(0xffffff, 0.60);
    key.position.set(-3, 2.4, 3.4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe6c9, 0.22);
    fill.position.set(2.7, -1.5, 1.5);
    scene.add(fill);

    const matChev = new THREE.MeshPhysicalMaterial({
        color: 0xeef3f8, metalness: 0.88, roughness: 0.09,
        clearcoat: 1, clearcoatRoughness: 0.05,
        iridescence: 1, iridescenceIOR: 1.32, iridescenceThicknessRange: [130, 540],
        envMapIntensity: 1.45, reflectivity: 0.94
    });
    const matLetter = new THREE.MeshPhysicalMaterial({
        color: 0x4f6f8f, metalness: 1.0, roughness: 0.3,
        clearcoat: 1, clearcoatRoughness: 0.09,
        iridescence: 0.65, iridescenceIOR: 1.28, iridescenceThicknessRange: [160, 470],
        envMapIntensity: 1.55, reflectivity: 0.86
    });
    // 来自上后方的冷色轮廓光，让每块方格顶部的倒角亮起来
    const rim = new THREE.DirectionalLight(0xdfeaff, 0.9);
    rim.position.set(0.6, 2.2, -1.2);
    scene.add(rim);

    // 方格级的顶点位移：指针附近的方格向前顶出（像针板），点击时一圈波浪扫过，平时轻微起伏
    const heroU = {
        uHP: { value: new THREE.Vector3(99, 99, 0) },
        uHA: { value: 0 },
        uHR: { value: 0.17 },
        uT: { value: 0 },
        uRip: { value: new THREE.Vector4(0, 0, 0, -1) }
    };
    const patch = m => {
        m.onBeforeCompile = sh => {
            Object.assign(sh.uniforms, heroU);
            sh.vertexShader = sh.vertexShader
                .replace('#include <common>', `#include <common>
attribute vec3 aCell;
varying float vLift;
uniform vec3 uHP;
uniform float uHA;
uniform float uHR;
uniform float uT;
uniform vec4 uRip;`)
                .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  vec4 wc = modelMatrix * vec4(aCell, 1.0);
  float dd = distance(wc.xy, uHP.xy);
  float lift = uHA * exp(-dd * dd / (uHR * uHR)) * 1.15;
  lift += sin(uT * 1.3 + aCell.x * 0.55 + aCell.y * 0.4) * 0.045;
  if (uRip.w >= 0.0) {
    float rd = distance(wc.xy, uRip.xy);
    lift += exp(-pow((rd - uRip.w * 2.6) * 8.0, 2.0)) * (1.0 - uRip.w) * 1.5;
  }
  vLift = lift;
  transformed = aCell + (transformed - aCell) * (1.0 + lift * 0.16);
  transformed.z += lift;
}`);
            sh.fragmentShader = sh.fragmentShader
                .replace('#include <common>', `#include <common>
varying float vLift;`)
                .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(0.42, 0.62, 0.95) * clamp(vLift - 0.06, 0.0, 1.5) * 0.32;`);
        };
    };
    patch(matChev);
    patch(matLetter);

    const wordmark = buildWordmark(matChev, matLetter);
    const box = new THREE.Box3().setFromObject(wordmark);
    const span = box.getSize(new THREE.Vector3());

    const rig = new THREE.Group();
    const bobber = new THREE.Group();
    const spinner = new THREE.Group();
    spinner.add(wordmark);
    bobber.add(spinner);
    rig.add(bobber);
    scene.add(rig);

    const rot = { x: -0.07, y: 0.22 };
    const tgt = { x: -0.07, y: 0.22 };
    let bias = 0;
    let vY = 0;
    let wpp = 0.004;
    let last = null;
    let downAt = null;
    let ripT0 = -1;
    let touchUntil = 0;
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();

    // 屏幕坐标 → 字标所在平面上的世界坐标
    function planePoint(clientX, clientY, out) {
        ndc.set(clientX / W * 2 - 1, -(clientY / H * 2 - 1));
        ray.setFromCamera(ndc, camera);
        return ray.ray.intersectPlane(plane, out);
    }
    function heroRipple(clientX, clientY) {
        if (!planePoint(clientX, clientY, hit)) return;
        heroU.uRip.value.set(hit.x, hit.y, 0, 0);
        ripT0 = performance.now();
    }

    canvas.addEventListener('pointerenter', () => { overHeroGL = true; });
    canvas.addEventListener('pointerleave', () => { overHeroGL = false; });
    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') return;
        heroDragging = true;
        last = { x: e.clientX, y: e.clientY };
        downAt = { x: e.clientX, y: e.clientY };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 指针已释放 */ }
    });
    canvas.addEventListener('pointermove', e => {
        if (!heroDragging || !last) return;
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        last = { x: e.clientX, y: e.clientY };
        bias += dx * 0.0092;
        tgt.x = clamp(tgt.x + dy * 0.0062, -0.62, 0.62);
        vY = dx * 0.0007;
    });
    const release = () => { heroDragging = false; last = null; };
    canvas.addEventListener('pointerup', e => {
        if (fx.pointer && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 5) heroRipple(e.clientX, e.clientY);
        downAt = null;
        release();
    });
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture', release);

    const heroSec = $('#hero');
    heroSec.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'touch') return;
        touchUntil = performance.now() + 900;
        downAt = { x: e.clientX, y: e.clientY };
    }, { passive: true });
    heroSec.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') touchUntil = performance.now() + 900;
    }, { passive: true });
    heroSec.addEventListener('pointerup', e => {
        if (e.pointerType !== 'touch' || !downAt) return;
        if (fx.pointer && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 10) heroRipple(e.clientX, e.clientY);
        downAt = null;
    }, { passive: true });

    function heroTextTop() {
        const a = $('#heroTitle').getBoundingClientRect().top;
        const b = $('#heroAside').getBoundingClientRect().top;
        return Math.min(a, b);
    }

    function fit() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, heroPR));
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        const FRAC = 0.56;
        let frac = FRAC;
        let cy = null;
        if (W < 1100 || H < 700) {
            const top = header.offsetHeight + 8;
            const textTop = heroTextTop() - 46;
            const band = Math.max(60, textTop - top);
            const maxFrac = W < 800 ? 0.84 : (W < 1100 ? 0.64 : FRAC);
            frac = clamp(band * 0.52 * (span.x / span.y) / W, 0.16, maxFrac);
            cy = top + band * 0.32 + (band * 0.52 - frac * W * span.y / span.x) * 0.25;
            if (H < 560) {
                const flatH = Math.min(frac * W * span.y / span.x, band * 0.9);
                frac = flatH * (span.x / span.y) / W;
                cy = top + band / 2;
            }
        }
        wpp = span.x / (frac * W);
        camera.position.z = (H * wpp / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        camera.updateProjectionMatrix();
        rig.position.y = cy === null ? 84 * wpp : (H / 2 - cy) * wpp;
    }

    function frame(t) {
        const amp = reduceMotion ? 0 : (H < 560 ? 0.30 * 0.35 : 0.30);
        if (!heroDragging) {
            bias += vY;
            vY *= 0.955;
            bias *= 0.992;
            tgt.x += (-0.06 + pys * 0.10 - tgt.x) * 0.05;
        }
        tgt.y = 0.22 + Math.sin(t * Math.PI * 2 / 13) * amp + bias;
        rot.x += (tgt.x - rot.x) * 0.085;
        rot.y += (tgt.y - rot.y) * 0.085;
        spinner.rotation.set(rot.x, rot.y, 0);
        bobber.position.y = Math.sin(t * 0.62) * 7 * wpp;
        bobber.rotation.z = Math.sin(t * 0.43) * 0.012;
        bobber.rotation.y = pxs * 0.09;

        const now = performance.now();
        heroU.uT.value = reduceMotion ? 0 : t;
        const engaged = fx.pointer && (overHeroGL || heroDragging || now < touchUntil);
        heroU.uHA.value += ((engaged && !reduceMotion ? 1 : 0) - heroU.uHA.value) * 0.08;
        if (heroU.uHA.value > 0.002 && planePoint((pointerX + 0.5) * W, (pointerY + 0.5) * H, hit)) {
            heroU.uHP.value.lerp(hit, 0.35);
        }
        if (ripT0 >= 0) {
            const r = (now - ripT0) / 1300;
            if (r >= 1) { ripT0 = -1; heroU.uRip.value.w = -1; } else heroU.uRip.value.w = r;
        }
        renderer.render(scene, camera);
    }

    function setQuality(level) {
        heroPR = level >= 2 ? 1 : (level >= 1 ? 1.25 : 2);
        fit();
    }

    fit();
    return { fit, frame, setQuality };
}

/* ===================================================================
   粒子：30,000 个白点在球体、键盘、<CK> 三种形态之间变形
   =================================================================== */
// 顶点着色器：在原有的三形态混合之上，加入按键下沉、指针排开、点击涟漪与 <CK> 炸开
const VS = `
attribute vec3 pA;
attribute vec3 pB;
attribute vec3 pC;
attribute float sd;
attribute float sc;
attribute float al;
attribute float kid;
uniform float wA, wB, wC, squeeze, time, psize;
uniform vec4 uKeys[24];
uniform vec3 uKN;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uRepel;
uniform float uRad;
uniform float uCamZ;
uniform vec3 uRip;
uniform float uBurst;
uniform vec3 uCC;
varying float vA;
varying float vBoost;
void main(){
  float press = 0.0;
  if (kid >= 0.0) {
    vec4 kv = uKeys[int(kid / 4.0)];
    press = dot(kv, vec4(equal(vec4(mod(kid, 4.0)), vec4(0.0, 1.0, 2.0, 3.0))));
  }
  vec3 b = pB - uKN * press;
  vec3 c = pC;
  if (uBurst > 0.001) {
    vec3 jit = vec3(sin(sd * 41.0), cos(sd * 23.0), sin(sd * 17.0)) * 60.0;
    vec3 dir = normalize(pC - uCC + jit + vec3(0.0, 0.0, 1e-3));
    c += dir * uBurst * (90.0 + 300.0 * sd);
  }
  vec3 p = pA*wA + b*wB + c*wC;
  float s = sd*6.2831;
  p += vec3(sin(time*.55+s*3.1), cos(time*.47+s*2.3), sin(time*.61+s*4.7))*1.8;
  p.x *= squeeze;
  p.z *= squeeze;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  float px = -mv.z / uCamZ;
  vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
  float dist = length(d);
  float near = uRepel * (1.0 - smoothstep(0.0, uRad, dist));
  // 像放大镜一样把指针附近的点向外推开，中心不留空洞
  mv.xy += d * near * 0.26 * (-mv.z);
  float ring = 0.0;
  if (uRip.z >= 0.0) {
    vec2 dr = (ndc - uRip.xy) * vec2(uAspect, 1.0);
    float rr = length(dr);
    ring = exp(-pow((rr - uRip.z * 2.2) * 7.0, 2.0)) * (1.0 - uRip.z);
    mv.xy += (dr / max(rr, 1e-4)) * ring * 26.0 * px;
  }
  gl_Position = projectionMatrix * mv;
  float kp = press * wB;
  gl_PointSize = psize * sc * (760.0 / max(1.0, -mv.z)) * (1.0 + kp * 0.55 + ring * 0.7);
  vA = al * clamp(1.0 - (-mv.z - 520.0) / 2600.0, .22, 1.0) * (1.0 + kp * 1.8 + near * 0.8 + ring * 1.4);
  vBoost = clamp(wB + wC, 0.0, 1.0);
}`;

const FS = `
precision mediump float;
varying float vA;
varying float vBoost;
void main(){
  float m = 1.0 - smoothstep(.30, .5, length(gl_PointCoord - 0.5));
  if (m <= 0.002) discard;
  float a = m * vA * mix(1.0, 1.9, vBoost);
  gl_FragColor = vec4(1.0, 1.0, 1.0, min(a, 1.0));
}`;

/* ---------- 键盘模型：每颗键的位置、字符和对应的 KeyboardEvent.code ---------- */
const KEY_ROWS = [
    { h: 0.62, keys: [
        ['esc', 'Escape'], ['F1', 'F1'], ['F2', 'F2'], ['F3', 'F3'], ['F4', 'F4'], ['F5', 'F5'], ['F6', 'F6'],
        ['F7', 'F7'], ['F8', 'F8'], ['F9', 'F9'], ['F10', 'F10'], ['F11', 'F11'], ['F12', 'F12'], ['⏻', '']
    ].map(k => [15 / 14, ...k]) },
    { h: 1, keys: [
        [1, '`', 'Backquote'], [1, '1', 'Digit1'], [1, '2', 'Digit2'], [1, '3', 'Digit3'], [1, '4', 'Digit4'],
        [1, '5', 'Digit5'], [1, '6', 'Digit6'], [1, '7', 'Digit7'], [1, '8', 'Digit8'], [1, '9', 'Digit9'],
        [1, '0', 'Digit0'], [1, '-', 'Minus'], [1, '=', 'Equal'], [2, '⌫', 'Backspace']
    ] },
    { h: 1, keys: [
        [1.5, 'tab', 'Tab'], [1, 'q', 'KeyQ'], [1, 'w', 'KeyW'], [1, 'e', 'KeyE'], [1, 'r', 'KeyR'], [1, 't', 'KeyT'],
        [1, 'y', 'KeyY'], [1, 'u', 'KeyU'], [1, 'i', 'KeyI'], [1, 'o', 'KeyO'], [1, 'p', 'KeyP'],
        [1, '[', 'BracketLeft'], [1, ']', 'BracketRight'], [1.5, '\\', 'Backslash']
    ] },
    { h: 1, keys: [
        [1.75, 'caps', 'CapsLock'], [1, 'a', 'KeyA'], [1, 's', 'KeyS'], [1, 'd', 'KeyD'], [1, 'f', 'KeyF'],
        [1, 'g', 'KeyG'], [1, 'h', 'KeyH'], [1, 'j', 'KeyJ'], [1, 'k', 'KeyK', true], [1, 'l', 'KeyL'],
        [1, ';', 'Semicolon'], [1, "'", 'Quote'], [2.25, '⏎', 'Enter']
    ] },
    { h: 1, keys: [
        [2.25, 'shift', 'ShiftLeft'], [1, 'z', 'KeyZ'], [1, 'x', 'KeyX'], [1, 'c', 'KeyC', true], [1, 'v', 'KeyV'],
        [1, 'b', 'KeyB'], [1, 'n', 'KeyN'], [1, 'm', 'KeyM'], [1, ',', 'Comma'], [1, '.', 'Period'],
        [1, '/', 'Slash'], [2.75, 'shift', 'ShiftRight']
    ] },
    { h: 1, keys: [
        [1, 'fn', ''], [1, 'ctrl', 'ControlLeft'], [1, 'opt', 'AltLeft'], [1.25, 'cmd', 'MetaLeft'],
        [5.5, ' ', 'Space'], [1.25, 'cmd', 'MetaRight'], [1, 'opt', 'AltRight'],
        [1, '←', 'ArrowLeft'], [1, '↑↓', ''], [1, '→', 'ArrowRight']
    ] }
];

function keyboardModel() {
    const KW = 1200;
    const m = 26;
    const u = (KW - m * 2) / 15;
    const KH = Math.round(m * 2 + 5.62 * u);
    const gap = 0.12 * u;
    const keys = [];
    let y = m;
    for (const row of KEY_ROWS) {
        let x = m;
        const rh = row.h * u;
        for (const [kw, label, code, hot] of row.keys) {
            const w = kw * u;
            if (label === '↑↓') {
                const hh = (rh - gap) / 2;
                keys.push({ x: x + gap / 2, y: y + gap / 2, w: w - gap, h: hh - gap / 4, label: '↑', code: 'ArrowUp' });
                keys.push({ x: x + gap / 2, y: y + gap / 2 + hh + gap / 4, w: w - gap, h: hh - gap / 4, label: '↓', code: 'ArrowDown' });
            } else if (label === '←' || label === '→') {
                keys.push({ x: x + gap / 2, y: y + gap / 2 + rh / 2, w: w - gap, h: rh / 2 - gap, label, code });
            } else {
                keys.push({ x: x + gap / 2, y: y + gap / 2, w: w - gap, h: rh - gap, label, code, hot: !!hot });
            }
            x += w;
        }
        y += rh;
    }
    // 可打出的字符：字母、数字、标点与空格
    keys.forEach((k, i) => {
        k.id = i;
        k.ch = (k.label.length === 1 && /[\x20-\x7e]/.test(k.label)) ? k.label : '';
    });
    return { KW, KH, keys };
}

// 程序绘制的键盘俯视图（深色缝隙会被丢弃，键帽越亮粒子越密；C、K 两颗键最亮）
// 同时画一张不抗锯齿的“键位编号图”，让每个粒子知道自己属于哪颗键
function keyboardSites(model) {
    const { KW, KH, keys } = model;
    const c = document.createElement('canvas');
    c.width = KW;
    c.height = KH;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, KW, KH);
    const rrect = (x, y, w, h, r) => {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    };
    rrect(5, 5, KW - 10, KH - 10, 30);
    g.lineWidth = 7;
    g.strokeStyle = 'rgb(92,92,92)';
    g.stroke();
    for (const k of keys) {
        const top = k.hot ? 255 : 205;
        const bot = k.hot ? 235 : 160;
        const grad = g.createLinearGradient(0, k.y, 0, k.y + k.h);
        grad.addColorStop(0, `rgb(${top},${top},${top})`);
        grad.addColorStop(0.78, `rgb(${bot},${bot},${bot})`);
        grad.addColorStop(0.79, 'rgb(96,96,96)');
        grad.addColorStop(1, 'rgb(78,78,78)');
        g.fillStyle = grad;
        rrect(k.x, k.y, k.w, k.h, Math.min(9, k.h * 0.18));
        g.fill();
    }

    const SW = 300;
    const SH = Math.round(SW * KH / KW);
    const sc = SW / KW;
    const s = document.createElement('canvas');
    s.width = SW;
    s.height = SH;
    const sg = s.getContext('2d', { willReadFrequently: true });
    sg.drawImage(c, 0, 0, SW, SH);
    const data = sg.getImageData(0, 0, SW, SH).data;

    const idc = document.createElement('canvas');
    idc.width = SW;
    idc.height = SH;
    const ig = idc.getContext('2d', { willReadFrequently: true });
    ig.imageSmoothingEnabled = false;
    ig.fillStyle = '#000';
    ig.fillRect(0, 0, SW, SH);
    for (const k of keys) {
        ig.fillStyle = `rgb(${k.id + 1},0,0)`;
        ig.fillRect(Math.floor(k.x * sc), Math.floor(k.y * sc), Math.ceil(k.w * sc) + 1, Math.ceil(k.h * sc) + 1);
    }
    const ids = ig.getImageData(0, 0, SW, SH).data;

    const xs = [];
    const ys = [];
    const ls = [];
    const kids = [];
    for (let py = 0; py < SH; py++) {
        for (let px = 0; px < SW; px++) {
            const o = (py * SW + px) * 4;
            const L = (data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114) / 255;
            if (L > 0.12) {
                xs.push(px);
                ys.push(py);
                ls.push(L);
                kids.push(L > 0.33 ? ids[o] - 1 : -1);
            }
        }
    }
    const cum = new Float32Array(ls.length);
    let total = 0;
    for (let i = 0; i < ls.length; i++) { total += 0.25 + ls[i] * ls[i]; cum[i] = total; }
    return { sw: SW, sh: SH, xs, ys, ls, kids, cum, total };
}

function pickIndex(cum, r) {
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] < r) lo = mid + 1; else hi = mid;
    }
    return lo;
}

// 在字标表面按面积均匀撒点（不取背面，正面和侧面足够读出体积）
function wordmarkSamples(count) {
    const group = buildWordmark(null, null);
    group.updateMatrixWorld(true);
    const tris = [];
    const cum = [];
    let total = 0;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    group.children.forEach(mesh => {
        const pos = mesh.geometry.attributes.position;
        const nor = mesh.geometry.attributes.normal;
        for (let i = 0; i + 2 < pos.count; i += 3) {
            if (nor.getZ(i) < -0.5 && nor.getZ(i + 1) < -0.5 && nor.getZ(i + 2) < -0.5) continue;
            a.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
            b.fromBufferAttribute(pos, i + 1).applyMatrix4(mesh.matrixWorld);
            c.fromBufferAttribute(pos, i + 2).applyMatrix4(mesh.matrixWorld);
            const area = e1.subVectors(b, a).cross(e2.subVectors(c, a)).length() / 2;
            if (area <= 0) continue;
            total += area;
            cum.push(total);
            tris.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
        }
    });
    const cumArr = Float32Array.from(cum);
    const raw = new Float32Array(count * 3);
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
        const t = pickIndex(cumArr, Math.random() * total) * 9;
        let u = Math.random();
        let w = Math.random();
        if (u + w > 1) { u = 1 - u; w = 1 - w; }
        for (let k = 0; k < 3; k++) {
            raw[i * 3 + k] = tris[t + k] + (tris[t + 3 + k] - tris[t + k]) * u + (tris[t + 6 + k] - tris[t + k]) * w;
        }
        v.set(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]);
        min.min(v);
        max.max(v);
    }
    const center = min.clone().add(max).multiplyScalar(0.5);
    for (let i = 0; i < count; i++) {
        raw[i * 3] -= center.x;
        raw[i * 3 + 1] -= center.y;
        raw[i * 3 + 2] -= center.z;
    }
    return { raw, size: max.sub(min) };
}

function initStage() {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas: stageEl, alpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch (err) {
        stageEl.style.display = 'none';
        return null;
    }
    let maxPR = 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPR));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 1, 8000);
    camera.position.z = (H / 2) / Math.tan(22.5 * Math.PI / 180);

    const PN = 30000;
    const pA = new Float32Array(PN * 3);
    const sd = new Float32Array(PN);
    const sc = new Float32Array(PN);
    const al = new Float32Array(PN);
    const R = 302;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < PN; i++) {
        sd[i] = Math.random();
        sc[i] = 0.50 + Math.random() * 0.85;
        const u = Math.random();
        al[i] = 0.22 + 0.78 * u * u;
        const y = 1 - (i / (PN - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        const j = 1 + (Math.random() - 0.5) * 0.06;
        pA[i * 3] = Math.cos(theta) * r * R * j;
        pA[i * 3 + 1] = y * R * j;
        pA[i * 3 + 2] = Math.sin(theta) * r * R * j;
    }
    // 打乱球面点的顺序：降低画质时只画前一部分粒子，球体依然完整
    for (let i = PN - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        for (let k = 0; k < 3; k++) {
            const t = pA[i * 3 + k];
            pA[i * 3 + k] = pA[j * 3 + k];
            pA[j * 3 + k] = t;
        }
    }
    const pA0 = pA.slice();
    const pB = pA.slice();
    const pC = pA.slice();
    const kidArr = new Float32Array(PN).fill(-1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pA.slice(), 3));
    const attrA = new THREE.BufferAttribute(pA, 3);
    const attrB = new THREE.BufferAttribute(pB, 3);
    const attrC = new THREE.BufferAttribute(pC, 3);
    geo.setAttribute('pA', attrA);
    geo.setAttribute('pB', attrB);
    geo.setAttribute('pC', attrC);
    geo.setAttribute('sd', new THREE.BufferAttribute(sd, 1));
    geo.setAttribute('sc', new THREE.BufferAttribute(sc, 1));
    geo.setAttribute('al', new THREE.BufferAttribute(al, 1));
    const attrK = new THREE.BufferAttribute(kidArr, 1);
    geo.setAttribute('kid', attrK);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3000);

    const keyVec = Array.from({ length: 24 }, () => new THREE.Vector4());
    const uni = {
        wA: { value: 1 }, wB: { value: 0 }, wC: { value: 0 },
        squeeze: { value: 1 }, time: { value: 0 }, psize: { value: 2.2 },
        uKeys: { value: keyVec },
        uKN: { value: new THREE.Vector3() },
        uMouse: { value: new THREE.Vector2(9, 9) },
        uAspect: { value: W / H },
        uRepel: { value: 0 },
        uRad: { value: 0.24 },
        uCamZ: { value: camera.position.z },
        uRip: { value: new THREE.Vector3(0, 0, -1) },
        uBurst: { value: 0 },
        uCC: { value: new THREE.Vector3() }
    };
    const mat = new THREE.ShaderMaterial({
        uniforms: uni,
        vertexShader: VS,
        fragmentShader: FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    // 键盘：每个粒子绑定一个采样点和三个抖动值，尺寸变化时只重新排布
    const model = keyboardModel();
    const NK = model.keys.length;
    let kb = null;
    const kSite = new Int32Array(PN);
    const kJit = new Float32Array(PN * 3);
    try {
        kb = keyboardSites(model);
        for (let i = 0; i < PN; i++) {
            kSite[i] = pickIndex(kb.cum, Math.random() * kb.total);
            kJit[i * 3] = Math.random() - 0.5;
            kJit[i * 3 + 1] = Math.random() - 0.5;
            kJit[i * 3 + 2] = Math.random() - 0.5;
            kidArr[i] = kb.kids[kSite[i]];
        }
        attrK.needsUpdate = true;
    } catch (err) {
        kb = null;
    }
    markReady('keys');

    const mark = wordmarkSamples(PN);

    const film = () => W >= 1100 && H >= 700;
    // 竖排布局（手机、竖屏平板、横屏手机）里，形态放进标题与正文之间的空档
    const stacked = () => W <= 900 || H < 560;

    // 某一屏里：上方元素的底边与下方元素的顶边之间的空档（相对该屏，单位 px）
    function band(secId, upperSel, lowerSel) {
        const sec = document.getElementById(secId);
        const s0 = sec.getBoundingClientRect().top;
        // 直接在该屏下的元素用 offsetTop（不受显现动画的位移影响），其他用包围盒
        const rel = el => {
            if (el.offsetParent === sec) return { top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight, h: el.offsetHeight };
            const r = el.getBoundingClientRect();
            return { top: r.top - s0, bottom: r.bottom - s0, h: r.height };
        };
        let top = header.offsetHeight + 8;
        let bottom = H - 8;
        if (upperSel) $$(upperSel, sec).forEach(el => { const r = rel(el); if (r.h > 0) top = Math.max(top, r.bottom + 10); });
        $$(lowerSel, sec).forEach(el => { const r = rel(el); if (r.h > 0) bottom = Math.min(bottom, r.top - 10); });
        if (bottom - top < 70) {
            const mid = (top + bottom) / 2;
            top = mid - 35;
            bottom = mid + 35;
        }
        return { h: bottom - top, cy: (top + bottom) / 2 };
    }

    function layoutA() {
        let s = film() ? 1 : Math.min(1, W / 1100, H / 780);
        let oy = 0;
        if (stacked()) {
            const b = band('s2', 'h2', '.stats, .note');
            s = Math.min(1, W / 860, (b.h / 2) * 0.84 / R);
            oy = H / 2 - b.cy;
        } else {
            // 桌面：球体可以压在标题后面，但不压住底部的数字
            const b = band('s2', null, '.stats');
            s = Math.min(s, (b.h / 2) / (R * 1.04));
            oy = H / 2 - b.cy;
        }
        for (let i = 0; i < PN; i++) {
            pA[i * 3] = pA0[i * 3] * s;
            pA[i * 3 + 1] = pA0[i * 3 + 1] * s + oy;
            pA[i * 3 + 2] = pA0[i * 3 + 2] * s;
        }
        attrA.needsUpdate = true;
    }

    // 键盘在世界坐标里的摆放参数，命中测试也用它
    const kbPose = { srcW: 1, srcH: 1, cy: 0, ct: 1, st: 0, zS: 1 };
    const keyQuads = new Float32Array(NK * 12);

    function layoutB() {
        if (!kb) return;
        const tilt = 0.70;
        const ct = Math.cos(tilt);
        const st = Math.sin(tilt);
        const aspect = kb.sh / kb.sw;
        let srcW;
        let cy;
        if (stacked()) {
            const b = band('s3', 'h2', '.kbd, .s3-foot');
            srcW = Math.min(W * 0.96, 1300);
            // 透视会让近处一排略放大，按 1.12 倍留余量
            if (srcW * aspect * ct * 1.12 > b.h * 0.9) srcW = b.h * 0.9 / (aspect * ct * 1.12);
            cy = H / 2 - b.cy;
        } else {
            srcW = film() ? Math.min(1300, W * 0.9) : Math.min(W * 0.92, 1300);
            if (srcW * aspect * ct > H * 0.46) srcW = H * 0.46 / (aspect * ct);
            cy = film() ? -H * 0.05 : -H * 0.02;
        }
        const srcH = srcW * aspect;
        const k = srcW / kb.sw;
        const zS = Math.max(0.45, Math.min(1, srcW / 1300));
        Object.assign(kbPose, { srcW, srcH, cy, ct, st, zS });
        for (let i = 0; i < PN; i++) {
            const s = kSite[i];
            const L = kb.ls[s];
            const fx = (kb.xs[s] / kb.sw - 0.5) * srcW + kJit[i * 3] * k * 0.34;
            const fy = (0.5 - kb.ys[s] / kb.sh) * srcH + kJit[i * 3 + 1] * k * 0.34;
            const h = (L * 16 + kJit[i * 3 + 2] * 10) * zS;
            pB[i * 3] = fx;
            pB[i * 3 + 1] = fy * ct + h * st + cy;
            pB[i * 3 + 2] = -fy * st + h * ct;
        }
        attrB.needsUpdate = true;
        // 按下的方向是键盘面的法线，深度随键盘大小缩放
        uni.uKN.value.set(0, st, ct).multiplyScalar(14 * zS);
        // 每颗键四个角的世界坐标
        const h = 13 * zS;
        model.keys.forEach((key, i) => {
            const cs = [[key.x, key.y], [key.x + key.w, key.y], [key.x + key.w, key.y + key.h], [key.x, key.y + key.h]];
            cs.forEach(([x, y], j) => {
                const fx = (x / model.KW - 0.5) * srcW;
                const fy = (0.5 - y / model.KH) * srcH;
                const o = i * 12 + j * 3;
                keyQuads[o] = fx;
                keyQuads[o + 1] = fy * ct + h * st + cy;
                keyQuads[o + 2] = -fy * st + h * ct;
            });
        });
    }

    function layoutC() {
        const ky = 0.86;
        const b = band('s4', 'h2' + (stacked() ? ', .note' : ''), '#steps');
        let markW = Math.min(W * 0.88, 1108);
        const capH = b.h * 0.86;
        if (markW * (mark.size.y * ky) / mark.size.x > capH) markW = capH * mark.size.x / (mark.size.y * ky);
        const OY = H / 2 - b.cy;
        const KX = markW / mark.size.x;
        const KY = KX * ky;
        for (let i = 0; i < PN; i++) {
            pC[i * 3] = mark.raw[i * 3] * KX;
            pC[i * 3 + 1] = mark.raw[i * 3 + 1] * KY + OY;
            pC[i * 3 + 2] = mark.raw[i * 3 + 2] * KX;
        }
        uni.uCC.value.set(0, OY, 0);
        attrC.needsUpdate = true;
    }

    function resize() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPR));
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.position.z = (H / 2) / Math.tan(22.5 * Math.PI / 180);
        camera.updateProjectionMatrix();
        uni.uAspect.value = W / H;
        uni.uCamZ.value = camera.position.z;
        uni.uRad.value = W < 700 ? 0.3 : 0.24;
        // 相机距离随视口高度变化，点的像素大小按高度归一，矮屏不会显得更粗更亮
        // 高分屏上点会变细，按像素比的 0.75 次方补偿一部分
        uni.psize.value = 2.2 * clamp(H / 900, 0.55, 1.5) * Math.pow(renderer.getPixelRatio(), 0.75);
        layoutA();
        layoutB();
        layoutC();
    }

    // 画质分级：卡顿时先降像素比，再减少粒子数
    function setQuality(level) {
        maxPR = level >= 1 ? 1 : 1.75;
        geo.setDrawRange(0, level >= 2 ? 16000 : PN);
        resize();
    }

    /* ---------- 交互状态 ---------- */
    const base = { A: 1, B: 0, C: 0, sq: 1 };
    const keyCur = new Float32Array(96);
    const tapUntil = new Float32Array(96);
    const held = new Set();
    let hoverKey = -1;
    let waveT0 = -1;
    let eggT0 = -1;
    let ripT0 = -1;
    let burstT0 = -1;
    let repel = 0;
    let lastMove = -1e9;
    const mouse = new THREE.Vector2(9, 9);
    const mouseT = new THREE.Vector2(9, 9);
    const keyX = model.keys.map(k => (k.x + k.w / 2) / model.KW);
    const v3 = new THREE.Vector3();
    const quad = new Float32Array(8);

    function setBase(w, sq) {
        base.A = w.A;
        base.B = w.B;
        base.C = w.C;
        base.sq = sq;
    }

    function pointer(clientX, clientY) {
        mouseT.set(clientX / W * 2 - 1, -(clientY / H * 2 - 1));
        if (lastMove < 0 || mouse.x > 5) mouse.copy(mouseT);
        lastMove = performance.now();
    }

    // 指针下是哪颗键（投影四个角，做凸四边形包含测试）
    function keyAt(clientX, clientY) {
        if (!kb || base.B < 0.9) return -1;
        points.updateMatrixWorld();
        for (let i = 0; i < NK; i++) {
            for (let j = 0; j < 4; j++) {
                const o = i * 12 + j * 3;
                v3.set(keyQuads[o], keyQuads[o + 1], keyQuads[o + 2]).applyMatrix4(points.matrixWorld).project(camera);
                quad[j * 2] = (v3.x + 1) / 2 * W;
                quad[j * 2 + 1] = (1 - v3.y) / 2 * H;
            }
            let inside = true;
            let sign = 0;
            for (let j = 0; j < 4 && inside; j++) {
                const ax = quad[j * 2];
                const ay = quad[j * 2 + 1];
                const bx = quad[((j + 1) % 4) * 2];
                const by = quad[((j + 1) % 4) * 2 + 1];
                const cr = (bx - ax) * (clientY - ay) - (by - ay) * (clientX - ax);
                if (cr !== 0) {
                    if (sign === 0) sign = Math.sign(cr);
                    else if (Math.sign(cr) !== sign) inside = false;
                }
            }
            if (inside) return i;
        }
        return -1;
    }

    const keyByCode = new Map(model.keys.filter(k => k.code).map(k => [k.code, k.id]));

    function tap(i, ms = 150) {
        if (i < 0) return;
        tapUntil[i] = performance.now() + ms;
    }
    function hold(i, on) {
        if (i < 0) return;
        if (on) held.add(i); else held.delete(i);
    }
    function setHover(i) { hoverKey = i; }
    function wave() { waveT0 = performance.now(); }
    function egg() { eggT0 = performance.now(); }
    function ripple(clientX, clientY) {
        ripT0 = performance.now();
        uni.uRip.value.set(clientX / W * 2 - 1, -(clientY / H * 2 - 1), 0);
    }
    function burst() { burstT0 = performance.now(); }
    function release() {
        held.clear();
        hoverKey = -1;
    }

    let spin = 0;
    function frame(now, dt) {
        uni.time.value = now / 1000;

        // 彩蛋：键盘短暂变成 <CK> 再变回来
        let wA = base.A;
        let wB = base.B;
        let wC = base.C;
        let sq = base.sq;
        if (eggT0 >= 0) {
            const e = (now - eggT0) / 2800;
            if (e >= 1) {
                eggT0 = -1;
            } else {
                const k = e < 0.28 ? smooth(e / 0.28) : (e < 0.72 ? 1 : 1 - smooth((e - 0.72) / 0.28));
                const moved = wB * k;
                wB -= moved;
                wC += moved;
                sq = Math.min(sq, 1 - 0.93 * Math.sin(Math.PI * k) * (e < 0.28 || e > 0.72 ? 1 : 0));
            }
        }
        uni.wA.value = wA;
        uni.wB.value = wB;
        uni.wC.value = wC;
        uni.squeeze.value = Math.max(sq, 0.02);

        // 指针排开：球体和 <CK> 上生效，静止 2 秒后慢慢收回
        const active = fx.pointer && now - lastMove < 2200 ? 1 : 0;
        repel += (active - repel) * 0.06;
        mouse.lerp(mouseT, 0.25);
        uni.uMouse.value.copy(mouse);
        uni.uRepel.value = reduceMotion ? 0 : repel * clamp(wA + wC * 0.8, 0, 1);

        // 涟漪与炸开
        if (ripT0 >= 0) {
            const r = (now - ripT0) / 1400;
            if (r >= 1) { ripT0 = -1; uni.uRip.value.z = -1; } else uni.uRip.value.z = r;
        }
        if (burstT0 >= 0) {
            const b = (now - burstT0) / 1000;
            if (b >= 1.6) { burstT0 = -1; uni.uBurst.value = 0; } else uni.uBurst.value = b < 0.2 ? smooth(b / 0.2) : Math.exp(-(b - 0.2) * 3.4);
        }

        // 按键：按住、点按、悬停、回车波浪
        if (kb && (wB > 0.01 || held.size || hoverKey >= 0)) {
            const wp = waveT0 >= 0 ? (now - waveT0) / 650 : -9;
            if (wp > 1.5) waveT0 = -1;
            for (let i = 0; i < NK; i++) {
                let t = held.has(i) || now < tapUntil[i] ? 1 : 0;
                if (i === hoverKey) t = Math.max(t, 0.4);
                if (wp > -1) t = Math.max(t, 1 - Math.abs(wp - keyX[i]) * 5);
                const c = keyCur[i];
                keyCur[i] = c + (t - c) * (t > c ? 0.45 : 0.16);
            }
            for (let v = 0; v < 24; v++) keyVec[v].fromArray(keyCur, v * 4);
        }

        spin += dt * (0.085 * wA + 0.006 * (wB + wC)) * (reduceMotion ? 0.3 : 1);
        const sp = ((spin + Math.PI) % (Math.PI * 2)) - Math.PI;
        points.rotation.y = sp * wA + pxs * 0.16;
        points.rotation.x = pys * 0.09;
        renderer.render(scene, camera);
    }

    resize();
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    return {
        uni, resize, frame, setQuality, setBase, pointer, keyAt, keyByCode, tap, hold, setHover,
        wave, egg, ripple, burst, release, keys: model.keys, ready: !!kb
    };
}

/* ===================================================================
   翻页：y（像素）是唯一的进度量，粒子形态、首屏视差、进度轨都由它决定
   =================================================================== */
function stateAt(y) {
    const u = clamp(y / H, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(u));
    const t = u - i;
    const from = FORMS[i] || FORMS[i + 1];
    const to = FORMS[i + 1];
    const w = { A: 0, B: 0, C: 0 };
    let sq = 1;
    if (t < 0.30 || from === to) {
        w[from] = 1;
    } else if (t < 0.70) {
        const k = smooth((t - 0.30) / 0.40);
        w[from] = 1 - k;
        w[to] = k;
        sq = 1 - 0.93 * Math.sin(Math.PI * clamp(k, 0, 1));
    } else {
        w[to] = 1;
    }
    return { w, sq, op: lerp(stageOp(i), stageOp(i + 1), smooth(t)) };
}
const dominant = s => (s.w.A >= s.w.B && s.w.A >= s.w.C ? 'A' : (s.w.B >= s.w.C ? 'B' : 'C'));

function applyView(y, mix) {
    view = y;
    heroBg.style.transform = `translate3d(0, ${(y * 0.30).toFixed(1)}px, 0)`;
    let s = stateAt(y);
    if (mix) {
        // 跨多屏跳转：不逐个经过中间形态，直接从起点形态变到终点形态
        const k = mix.k;
        s = {
            w: { A: lerp(mix.a.w.A, mix.b.w.A, k), B: lerp(mix.a.w.B, mix.b.w.B, k), C: lerp(mix.a.w.C, mix.b.w.C, k) },
            sq: mix.same ? 1 : 1 - 0.93 * Math.sin(Math.PI * k),
            op: lerp(mix.a.op, mix.b.op, k)
        };
    }
    if (stage) stage.setBase(s.w, s.sq);
    stageEl.style.setProperty('--so', s.op.toFixed(3));
    stageEl.classList.toggle('on', y > H * 0.55);
    rail.classList.toggle('on', y > H * 0.75);
    railFill.style.height = (clamp(y / (H * (N - 1)), 0, 1) * 100).toFixed(2) + '%';
}

let tw = null;
function startTween(from, to, n) {
    let mix = null;
    if (Math.abs(to - from) > H * 1.01) {
        const a = stateAt(from);
        const b = stateAt(to);
        mix = { a, b, k: 0, same: dominant(a) === dominant(b) };
    }
    tw = { from, to, n, t0: performance.now(), mix };
}
function tweenFrame(now) {
    if (!tw) return;
    const p = clamp((now - tw.t0) / LEAVE_MS, 0, 1);
    if (tw.mix) tw.mix.k = p < 0.3 ? 0 : (p < 0.7 ? smooth((p - 0.3) / 0.4) : 1);
    applyView(lerp(tw.from, tw.to, p), tw.mix);
    if (p >= 1) tw = null;
}

function go(n) {
    if (!loadedDone) return;
    n = clamp(Math.round(n), 0, N - 1);
    if (busy) { pendingGo = n; return; }
    if (n === cur) return;
    busy = true;
    needGap = true;
    const dir = n > cur ? 1 : -1;
    const old = sections[cur];
    onLeave(cur);
    old.classList.add(dir > 0 ? 'out-up' : 'out-down');
    startTween(view, n * H, n);
    // 旧屏用 0.9 秒的缓出曲线离场，到 0.64 秒时已基本淡出；此时粒子变形也已过半，新屏接着出现，节奏不拖沓
    setTimeout(() => {
        old.classList.remove('show', 'out-up', 'out-down');
        resetSection(old);
        present(n, dir);
    }, reduceMotion ? 200 : 640);
}

function present(n, dir) {
    const s = sections[n];
    cur = n;
    const fi = s.querySelector('.flow-in');
    if (fi) fi.scrollTop = dir < 0 ? fi.scrollHeight : 0;
    s.style.transition = 'none';
    s.style.opacity = '0';
    s.classList.add('show');
    void s.offsetWidth;
    s.style.opacity = '';
    s.style.transition = '';
    playSection(s, false);
    onEnter(n);
    updateNav(n);
    if (!s.contains(document.activeElement)) {
        try { s.focus({ preventScroll: true }); } catch (err) { /* 旧浏览器 */ }
    }
    try {
        history.replaceState(null, '', n === 0 ? location.pathname + location.search : '#' + HASHES[n]);
    } catch (err) { /* file:// 下不支持 */ }
    let unlocked = false;
    const te = e => { if (e.target === s && e.propertyName === 'opacity') un(); };
    const un = () => {
        if (unlocked) return;
        unlocked = true;
        s.removeEventListener('transitionend', te);
        busy = false;
        coolUntil = performance.now() + 420;
        if (pendingGo !== null) {
            const p = pendingGo;
            pendingGo = null;
            if (p !== cur) go(p);
        }
    };
    s.addEventListener('transitionend', te);
    setTimeout(un, 600);
}

function jumpTo(n) {
    if (busy) { pendingGo = n; return; }
    busy = true;
    const old = sections[cur];
    old.classList.remove('show');
    resetSection(old);
    applyView(n * H);
    present(n, 1);
}

window.addEventListener('hashchange', () => {
    const i = hashIndex();
    if (i >= 0 && i !== cur) go(i);
});

/* ---------- 屏内可滚动的盒子优先消费手势 ---------- */
const V_SEL = '.vscroll, .note, .step, #heroAside p, .navpill';
const H_SEL = '.hscroll, #steps, .navpill';
const canY = (el, d) => (d > 0 ? el.scrollTop < el.scrollHeight - el.clientHeight - 1 : el.scrollTop > 1);
const canX = (el, d) => {
    const x = el._hs && el._hs.raf ? el._hs.t : el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    return d > 0 ? x < max - 1 : x > 1;
};
const scrollsY = el => {
    if (el.scrollHeight <= el.clientHeight + 1) return false;
    const o = getComputedStyle(el).overflowY;
    return o === 'auto' || o === 'scroll';
};
const scrollsX = el => {
    if (el.scrollWidth <= el.clientWidth + 1) return false;
    const o = getComputedStyle(el).overflowX;
    return o === 'auto' || o === 'scroll';
};
function findV(t) {
    for (let el = t; el && el.nodeType === 1 && el !== body; el = el.parentElement) {
        if (el.matches(V_SEL) && scrollsY(el)) return el;
    }
    return null;
}
function findH(t) {
    for (let el = t; el && el.nodeType === 1 && el !== body; el = el.parentElement) {
        if (el.matches(H_SEL) && scrollsX(el)) return el;
    }
    return null;
}

// 横向列表的平滑滚动：竖向滚轮也能翻案例
function hsBy(el, d) {
    const max = el.scrollWidth - el.clientWidth;
    if (!el._hs) el._hs = { t: el.scrollLeft, x: el.scrollLeft, raf: 0 };
    const hs = el._hs;
    if (!hs.raf) { hs.t = el.scrollLeft; hs.x = el.scrollLeft; }
    hs.t = clamp(hs.t + d, 0, max);
    if (hs.raf) return;
    const step = () => {
        const dx = hs.t - hs.x;
        if (Math.abs(dx) < 0.5) {
            el.scrollLeft = hs.t;
            hs.x = hs.t;
            hs.raf = 0;
            return;
        }
        hs.x += dx * (reduceMotion ? 1 : 0.18);
        el.scrollLeft = hs.x;
        hs.raf = requestAnimationFrame(step);
    };
    hs.raf = requestAnimationFrame(step);
}

/* ---------- 滚轮：累积到阈值才翻一屏；触控板惯性需要一次停顿或新的发力 ---------- */
let wheelAcc = 0;
let lastWheel = 0;
let lastAbs = 0;
let needGap = false;

function claimWheel(now, d) {
    needGap = true;
    lastWheel = now;
    lastAbs = Math.abs(d);
    wheelAcc = 0;
}

window.addEventListener('wheel', e => {
    if (e.ctrlKey || modalOpen()) return;
    const f = e.deltaMode === 1 ? 32 : (e.deltaMode === 2 ? H : 1);
    const dx = e.deltaX * f;
    const dy = e.deltaY * f;
    const now = performance.now();
    const vertical = Math.abs(dy) >= Math.abs(dx);
    for (let el = e.target; el && el.nodeType === 1 && el !== body; el = el.parentElement) {
        if (el.matches(H_SEL) && scrollsX(el)) {
            if (!vertical && canX(el, dx)) { claimWheel(now, dx); return; }
            if (vertical && el.classList.contains('hscroll') && canX(el, dy)) {
                e.preventDefault();
                if (getComputedStyle(el).scrollSnapType.indexOf('mandatory') >= 0) {
                    // 有吸附时逐张翻，避免小步滚动被吸附弹回原位
                    if (now - (el._lastStep || 0) > 260) {
                        el._lastStep = now;
                        el.scrollBy({ left: Math.sign(dy) * caseStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
                    }
                } else {
                    hsBy(el, dy);
                }
                claimWheel(now, dy);
                return;
            }
        }
        if (vertical && el.matches(V_SEL) && scrollsY(el) && canY(el, dy)) { claimWheel(now, dy); return; }
    }
    e.preventDefault();
    if (!vertical) return;
    const abs = Math.abs(dy);
    const gap = now - lastWheel;
    lastWheel = now;
    if (busy || now < coolUntil) { lastAbs = abs; wheelAcc = 0; return; }
    if (needGap) {
        if (gap > 180 || (abs > lastAbs * 1.6 + 4 && abs > 12)) needGap = false;
        else { lastAbs = Math.min(lastAbs, abs) || abs; return; }
    }
    lastAbs = abs;
    if (gap > 160) {
        wheelAcc = 0;
        if (abs >= 25 || e.deltaMode === 1) {
            go(cur + Math.sign(dy));
            return;
        }
    }
    wheelAcc += dy;
    if (Math.abs(wheelAcc) >= 48) {
        const d = Math.sign(wheelAcc);
        wheelAcc = 0;
        go(cur + d);
    }
}, { passive: false });

/* ---------- 触摸：竖向滑动超过 48px 翻页，横滑交给列表 ---------- */
let ts = null;
window.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || modalOpen()) { ts = null; return; }
    const t = e.touches[0];
    const v = findV(e.target);
    ts = {
        x: t.clientX,
        y: t.clientY,
        v,
        h: findH(e.target),
        canDown: v ? canY(v, 1) : false,
        canUp: v ? canY(v, -1) : false
    };
}, { passive: true });
window.addEventListener('touchmove', e => {
    if (!ts || !e.cancelable) return;
    const t = e.touches[0];
    const mdx = t.clientX - ts.x;
    const mdy = ts.y - t.clientY;
    const verticalMove = Math.abs(mdy) > Math.abs(mdx);
    if (!ts.v && !ts.h) { e.preventDefault(); return; }
    if (verticalMove && (!ts.v || !canY(ts.v, Math.sign(mdy) || 1))) e.preventDefault();
}, { passive: false });
window.addEventListener('touchend', e => {
    if (!ts) return;
    const s = ts;
    ts = null;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = s.y - t.clientY;
    if (busy || performance.now() < coolUntil) return;
    if (Math.abs(dx) > Math.abs(dy)) return;
    if (s.v && ((dy > 0 && s.canDown) || (dy < 0 && s.canUp))) return;
    if (Math.abs(dy) > 48) go(cur + (dy > 0 ? 1 : -1));
}, { passive: true });
window.addEventListener('touchcancel', () => { ts = null; }, { passive: true });

/* ===================================================================
   粒子键盘：真实键盘、鼠标悬停与点击、手指点按都能把键按下去
   =================================================================== */
const KBD_SEC = sections.findIndex(s => s.id === 's3');
const kbdText = $('#kbdText');
const kbdTip = $('#kbdTip');
const kbdSoundBtn = $('#kbdSound');
const TIP_DEFAULT = mouseUI.matches ? '敲几个字母，或直接点上方的键盘。' : '点按上方的粒子键盘试试。';
let typed = '';
let tipTimer = 0;
let soundOn = fx.sound;
let actx = null;
let noiseBuf = null;
kbdTip.textContent = TIP_DEFAULT;
const kbdLive = () => !!(stage && stage.ready && cur === KBD_SEC && !busy);

function syncSoundBtn() {
    kbdSoundBtn.setAttribute('aria-pressed', String(soundOn));
    kbdSoundBtn.textContent = soundOn ? '按键音 · 开' : '按键音 · 关';
}
syncSoundBtn();
kbdSoundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    fx.sound = soundOn;
    saveFx();
    syncSoundBtn();
    if (soundOn) keySound(true);
});

// 合成的机械键盘声：一小段带通噪声加一个低频“咚”
function keySound(strong) {
    if (!soundOn) return;
    try {
        if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        const t = actx.currentTime;
        if (!noiseBuf) {
            const len = Math.floor(actx.sampleRate * 0.035);
            noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
            const d = noiseBuf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        }
        const src = actx.createBufferSource();
        src.buffer = noiseBuf;
        const bp = actx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2200 + Math.random() * 900;
        bp.Q.value = 1.1;
        const g = actx.createGain();
        g.gain.value = strong ? 0.42 : 0.28;
        src.connect(bp).connect(g).connect(actx.destination);
        src.start(t);
        const o = actx.createOscillator();
        o.frequency.setValueAtTime(strong ? 150 : 190, t);
        o.frequency.exponentialRampToValueAtTime(60, t + 0.07);
        const og = actx.createGain();
        og.gain.setValueAtTime(strong ? 0.22 : 0.14, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        o.connect(og).connect(actx.destination);
        o.start(t);
        o.stop(t + 0.1);
    } catch (err) { /* 浏览器不支持音频 */ }
}

function showTip(text, ms) {
    kbdTip.textContent = text;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { kbdTip.textContent = TIP_DEFAULT; }, ms);
}

function renderTyped() {
    kbdText.textContent = typed;
}

// 处理一次按键：字符进入命令行，退格删除，回车提交
function typeKey(label, ch) {
    if (label === '⌫' || label === 'Backspace') {
        typed = typed.slice(0, -1);
    } else if (label === '⏎' || label === 'Enter') {
        if (stage) stage.wave();
        const cmd = typed.trim().toLowerCase();
        typed = '';
        if (cmd === 'contact' || cmd === 'hire' || cmd === 'mail') {
            showTip('带你去联系页。', 2000);
            setTimeout(() => go(N - 1), 500);
        } else if (cmd === 'works' || cmd === 'case') {
            showTip('带你去看案例。', 2000);
            setTimeout(() => go(sections.findIndex(s => s.id === 's6')), 500);
        } else if (cmd) {
            showTip('收到。试试输入 ck、works 或 contact 再回车。', 3600);
        }
    } else if (ch) {
        typed = (typed + ch).slice(-28);
        if (/ck$/i.test(typed) && stage) {
            stage.egg();
            showTip('彩蛋：键盘变成了 <CK>。', 2800);
        }
    }
    renderTyped();
}

// 真实键盘：在第 3 屏按下的键会同步按下粒子键；空格只当作空格，不翻页
window.addEventListener('keydown', e => {
    if (!kbdLive() || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    const id = stage.keyByCode.get(e.code);
    if (id === undefined) return;
    stage.hold(id, true);
    if (e.repeat && e.key !== 'Backspace') return;
    if (e.code === 'Space') {
        if (tag === 'button' || tag === 'a') return;
        e.preventDefault();
    }
    keySound(e.key === 'Enter' || e.code === 'Space');
    if (e.key === 'Backspace' || e.key === 'Enter') typeKey(e.key, '');
    else if (e.key.length === 1) typeKey('', e.key);
});
window.addEventListener('keyup', e => {
    if (!stage || !stage.ready) return;
    const id = stage.keyByCode.get(e.code);
    if (id !== undefined) stage.hold(id, false);
});
window.addEventListener('blur', () => { if (stage) stage.release(); });

// 指针：悬停时键微微下沉并在光标旁显示键名；点按（不是滑动）才算输入
let keyDown = null;
let overKeyLabel = null;
window.addEventListener('pointermove', e => {
    if (stage) stage.pointer(e.clientX, e.clientY);
    if (e.pointerType !== 'mouse' || !kbdLive()) {
        if (overKeyLabel !== null && stage) { stage.setHover(-1); overKeyLabel = null; }
        return;
    }
    const id = stage.keyAt(e.clientX, e.clientY);
    stage.setHover(id);
    const k = id >= 0 ? stage.keys[id] : null;
    overKeyLabel = k ? (k.label === ' ' ? 'space' : k.label.toUpperCase()) : null;
}, { passive: true });
const INTERACTIVE = 'a, button, input, textarea, select, label, dialog, .step, .case, .cap, .kbd';
window.addEventListener('pointerdown', e => {
    if (e.button > 0 || !kbdLive()) return;
    if (e.target.closest && e.target.closest(INTERACTIVE + ', header')) return;
    const id = stage.keyAt(e.clientX, e.clientY);
    if (id < 0) return;
    stage.hold(id, true);
    keyDown = { id, x: e.clientX, y: e.clientY };
}, { passive: true });
window.addEventListener('pointerup', e => {
    if (!keyDown || !stage) return;
    const k = keyDown;
    keyDown = null;
    stage.hold(k.id, false);
    if (Math.hypot(e.clientX - k.x, e.clientY - k.y) > 10) return;
    stage.tap(k.id);
    const key = stage.keys[k.id];
    keySound(key.label === '⏎' || key.label === ' ');
    typeKey(key.label, key.ch);
});
window.addEventListener('pointercancel', () => {
    if (keyDown && stage) stage.hold(keyDown.id, false);
    keyDown = null;
});

/* ---------- 球体点一下起涟漪，<CK> 点一下炸开再聚拢 ---------- */
mainEl.addEventListener('click', e => {
    if (!stage || !fx.pointer || busy || cur === 0 || cur === KBD_SEC) return;
    if (e.target.closest && e.target.closest(INTERACTIVE)) return;
    const f = FORMS[cur];
    if (f === 'A') stage.ripple(e.clientX, e.clientY);
    else if (f === 'C') stage.burst();
});

/* ---------- 键盘 ---------- */
window.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || modalOpen()) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    // 左右方向键：流程屏切换卡片，案例屏翻案例
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const id = sections[cur].id;
        if (id === 's4' && !busy) {
            e.preventDefault();
            stepPauseUntil = performance.now() + 12000;
            stepActivate((Math.max(0, stepI) + dir + stepEls.length) % stepEls.length);
        } else if (id === 's6' && !busy) {
            e.preventDefault();
            caseScroll(dir);
        }
        return;
    }
    let d = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) d = -1;
    else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        go(e.key === 'Home' ? 0 : N - 1);
        return;
    }
    if (!d) return;
    if (e.key === ' ' && tag === 'button') return;
    e.preventDefault();
    const fi = sections[cur].querySelector('.flow-in');
    if (fi && scrollsY(fi) && canY(fi, d)) {
        fi.scrollBy({ top: d * fi.clientHeight * 0.7, behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
    }
    if (busy || performance.now() < coolUntil) return;
    go(cur + d);
});

/* ===================================================================
   合作流程卡片：每 4.2 秒推进一张，进度条走满
   =================================================================== */
const stepsEl = $('#steps');
const stepEls = $$('.step');
let stepI = -1;
let stepTimer = 0;
let stepPauseUntil = 0;

function stepActivate(i) {
    stepEls.forEach(s => s.classList.remove('act'));
    stepI = i;
    const el = stepEls[i];
    el.style.setProperty('--dwell', '4200ms');
    void el.offsetWidth;
    el.classList.add('act');
    if (stepsEl.scrollWidth > stepsEl.clientWidth + 2) {
        const pl = parseFloat(getComputedStyle(stepsEl).paddingLeft) || 0;
        stepsEl.scrollTo({ left: el.offsetLeft - pl, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
}
function stepsStart() {
    stepsStop();
    stepActivate(0);
    stepTimer = setInterval(() => {
        if (performance.now() < stepPauseUntil) return;
        stepActivate((stepI + 1) % stepEls.length);
    }, 4200);
}
function stepsStop() {
    clearInterval(stepTimer);
    stepTimer = 0;
    stepEls.forEach(s => s.classList.remove('act'));
}
stepsEl.addEventListener('pointerdown', () => { stepPauseUntil = performance.now() + 12000; });

/* ===================================================================
   案例横向列表：滚轮、按钮、鼠标拖动三种方式
   =================================================================== */
const casesEl = $('#cases');
const caseNow = $('#caseNow');
const caseBtns = $$('.cases-btns .circ');
const caseCards = $$('.case', casesEl);

function caseStep() {
    const c = caseCards[0];
    const gap = parseFloat(getComputedStyle(casesEl).columnGap) || 14;
    return c ? c.getBoundingClientRect().width + gap : 320;
}
function caseUpdate() {
    const max = casesEl.scrollWidth - casesEl.clientWidth;
    const x = casesEl.scrollLeft;
    const i = max <= 1 ? 0 : (x >= max - 2 ? caseCards.length - 1 : Math.round(x / caseStep()));
    caseNow.textContent = pad2(clamp(i, 0, caseCards.length - 1) + 1);
    caseBtns[0].disabled = x <= 1;
    caseBtns[1].disabled = x >= max - 1;
}
casesEl.addEventListener('scroll', caseUpdate, { passive: true });
function caseScroll(dir) {
    if (getComputedStyle(casesEl).scrollSnapType.indexOf('mandatory') >= 0) {
        casesEl.scrollBy({ left: dir * caseStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
        hsBy(casesEl, dir * caseStep());
    }
}
caseBtns.forEach(b => b.addEventListener('click', () => caseScroll(Number(b.dataset.dir))));

let drag = null;
casesEl.addEventListener('dragstart', e => e.preventDefault());
casesEl.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: casesEl.scrollLeft, moved: false };
});
window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        casesEl.classList.add('dragging');
        casesEl.style.scrollSnapType = 'none';
    }
    if (drag.moved) {
        casesEl.scrollLeft = drag.left - dx;
        if (casesEl._hs) { casesEl._hs.t = casesEl.scrollLeft; casesEl._hs.x = casesEl.scrollLeft; }
    }
});
function endDrag() {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    casesEl.classList.remove('dragging');
    casesEl.style.scrollSnapType = '';
    if (moved) {
        casesEl._suppress = true;
        setTimeout(() => { casesEl._suppress = false; }, 0);
    }
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);
casesEl.addEventListener('click', e => {
    if (casesEl._suppress) {
        e.preventDefault();
        e.stopPropagation();
    }
}, true);

function onEnter(n) {
    if (sections[n].id === 's4') stepsStart();
    if (sections[n].id === 's6') caseUpdate();
}
function onLeave(n) {
    if (sections[n].id === 's4') stepsStop();
    if (n === KBD_SEC && stage) stage.release();
}

/* ===================================================================
   联系方式：复制微信与邮箱
   =================================================================== */
const toastEl = $('#toast');
let toastTimer = 0;
function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2200);
}
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
        return ok;
    }
}
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const ok = await copyText(b.dataset.copy);
    toast(ok ? `已复制：${b.dataset.copy}` : '复制失败，请手动复制');
}));

/* ===================================================================
   合作需求表单：生成邮件或复制到微信，草稿只存在本机浏览器
   =================================================================== */
const composer = $('#composer');
const cmpStatus = $('#cmpErr');
const CMP_KEY = 'ck-compose';
const MAIL = 'chuankangkk1@gmail.com';
const fxDlg = $('#fxDlg');
const modalOpen = () => !!((composer && composer.open) || (fxDlg && fxDlg.open));

function cmpData() {
    const pick = name => { const el = composer.querySelector(`input[name="${name}"]:checked`); return el ? el.value : ''; };
    return {
        type: pick('cmpType'),
        budget: pick('cmpBudget'),
        name: $('#cmpName').value.trim(),
        contact: $('#cmpContact').value.trim(),
        msg: $('#cmpMsg').value.trim()
    };
}
function cmpSave() {
    try { localStorage.setItem(CMP_KEY, JSON.stringify(cmpData())); } catch (err) { /* 无痕模式 */ }
}
function cmpRestore() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CMP_KEY) || 'null'); } catch (err) { d = null; }
    if (!d || typeof d !== 'object') return;
    const setRadio = (name, value) => {
        const el = Array.from(composer.querySelectorAll(`input[name="${name}"]`)).find(r => r.value === value);
        if (el) el.checked = true;
    };
    setRadio('cmpType', d.type);
    setRadio('cmpBudget', d.budget);
    $('#cmpName').value = String(d.name || '').slice(0, 40);
    $('#cmpContact').value = String(d.contact || '').slice(0, 80);
    $('#cmpMsg').value = String(d.msg || '').slice(0, 1500);
}
function cmpText(d) {
    return [
        `合作类型：${d.type}`,
        `预算 / 规模：${d.budget}`,
        `称呼：${d.name || '（未填）'}`,
        `联系方式：${d.contact || '（未填）'}`,
        '',
        '需求简述：',
        d.msg,
        '',
        '—— 来自 chuankangkk.top'
    ].join('\n');
}
function cmpSay(msg, ok) {
    cmpStatus.textContent = msg;
    cmpStatus.classList.toggle('ok', !!ok);
}
function cmpValid(d) {
    if (d.msg.length < 6) {
        cmpSay('简单写几句需求吧，至少 6 个字。', false);
        $('#cmpMsg').focus();
        return false;
    }
    cmpSay('', false);
    return true;
}
function openComposer() {
    if (!composer || typeof composer.showModal !== 'function') {
        location.href = `mailto:${MAIL}`;
        return;
    }
    cmpRestore();
    cmpSay('', false);
    composer.showModal();
}
document.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('[data-compose]') : null;
    if (!b) return;
    e.preventDefault();
    openComposer();
});
if (composer) {
    composer.addEventListener('click', e => {
        if (e.target === composer || (e.target.closest && e.target.closest('[data-close]'))) composer.close();
    });
    composer.addEventListener('input', cmpSave);
    composer.addEventListener('change', cmpSave);
    $('#cmpMail').addEventListener('click', () => {
        const d = cmpData();
        if (!cmpValid(d)) return;
        const subject = `【CKSTUDIO】${d.type}${d.name ? ' · ' + d.name : ''}`;
        location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cmpText(d))}`;
        cmpSay('已尝试打开邮件应用。如果没有反应，点“复制内容”发到微信或邮箱。', true);
    });
    $('#cmpCopy').addEventListener('click', async () => {
        const d = cmpData();
        if (!cmpValid(d)) return;
        const ok = await copyText(cmpText(d));
        cmpSay(ok ? '已复制，可以直接粘贴到微信（1837620622）或邮件里。' : '复制失败，请手动选择文字复制。', ok);
    });
}

/* ---------- 首屏标签里的北京时间 ---------- */
const bjEl = $('#bjTime');
let bjFmt = null;
try {
    bjFmt = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false });
} catch (err) {
    bjFmt = null;
}
function tickBJ() {
    if (bjFmt && bjEl) bjEl.textContent = '北京时间 ' + bjFmt.format(new Date());
}
tickBJ();
setInterval(tickBJ, 20000);

/* ---------- 点选流程卡片 ---------- */
stepEls.forEach((el, i) => el.addEventListener('click', () => {
    stepPauseUntil = performance.now() + 12000;
    stepActivate(i);
}));

/* ===================================================================
   效果设置：指针互动、画质、动效、按键音；改动立即生效并保存在本机
   =================================================================== */
function syncFxForm() {
    const set = (name, value) => {
        const el = fxDlg.querySelector(`input[name="${name}"][value="${value}"]`);
        if (el) el.checked = true;
    };
    set('fxPointer', fx.pointer ? 'on' : 'off');
    set('fxQuality', fx.quality);
    set('fxMotion', fx.motion);
    set('fxSound', fx.sound ? 'on' : 'off');
}
let appliedLevel = -1;
function applyFx() {
    reduceMotion = fx.motion === 'reduce' || (fx.motion === 'system' && systemReduce.matches);
    root.classList.toggle('fx-off', !fx.pointer);
    lockQuality = fx.quality === 'high' || /[?&]quality=high\b/.test(location.search);
    let level = perf.level;
    if (fx.quality === 'low') level = 2;
    else if (fx.quality === 'high') level = 0;
    if (level !== appliedLevel) {
        appliedLevel = level;
        perf.level = level;
        perf.skip = 60;
        if (stage) stage.setQuality(level);
        if (hero) hero.setQuality(level);
    }
    syncFxForm();
    syncSoundBtn();
}
systemReduce.addEventListener('change', () => { if (fx.motion === 'system') applyFx(); });
document.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('[data-fx-open]') : null;
    if (!b) return;
    e.preventDefault();
    syncFxForm();
    if (typeof fxDlg.showModal === 'function') fxDlg.showModal();
    else fxDlg.setAttribute('open', '');
});
fxDlg.addEventListener('click', e => {
    if (e.target === fxDlg || (e.target.closest && e.target.closest('[data-close]'))) fxDlg.close();
});
fxDlg.addEventListener('change', e => {
    const el = e.target;
    if (!el.name || !el.checked) return;
    if (el.name === 'fxPointer') fx.pointer = el.value === 'on';
    else if (el.name === 'fxQuality') fx.quality = el.value;
    else if (el.name === 'fxMotion') fx.motion = el.value;
    else if (el.name === 'fxSound') {
        fx.sound = el.value === 'on';
        soundOn = fx.sound;
        if (soundOn) keySound(true);
    }
    saveFx();
    applyFx();
});

/* ===================================================================
   尺寸变化：顶栏高度、标题字号、点阵网格、字标取景、三种粒子形态
   =================================================================== */
let rzRaf = 0;
function onResize() {
    cancelAnimationFrame(rzRaf);
    rzRaf = requestAnimationFrame(() => {
        // 双指放大时视觉视口会变，但布局没变，此时不重新排版
        if (window.visualViewport && window.visualViewport.scale > 1.01) return;
        const oldH = H;
        W = window.innerWidth;
        H = window.innerHeight;
        syncHeader();
        fitHeadings();
        sizeNums();
        if (hero) hero.fit();
        if (stage) stage.resize();
        if (tw) {
            tw.from = tw.from / oldH * H;
            tw.to = tw.n * H;
        } else {
            applyView(cur * H);
        }
        if (getComputedStyle(navToggle).display === 'none') setMenu(false);
        caseUpdate();
    });
}
window.addEventListener('resize', onResize);
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onResize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

/* ===================================================================
   启动
   =================================================================== */
splitLines();
syncHeader();
sizeNums();
try { hero = initHero(); } catch (err) { hero = null; $('#heroGL').style.display = 'none'; }
markReady('glb');
try { stage = initStage(); } catch (err) { stage = null; stageEl.style.display = 'none'; }
markReady('keys');
applyFx();
applyView(0);

let lastT = performance.now();
document.addEventListener('visibilitychange', () => { lastT = performance.now(); });
function perfSample(dt) {
    if (lockQuality || perf.level >= 2 || !loadedDone || document.hidden) return;
    if (perf.skip > 0) { perf.skip--; return; }
    perf.acc += dt;
    perf.n++;
    if (perf.n < 150) return;
    const avg = perf.acc / perf.n;
    perf.acc = 0;
    perf.n = 0;
    if (avg > 1 / 36) {
        perf.level++;
        perf.skip = 120;
        if (stage) stage.setQuality(perf.level);
        if (hero) hero.setQuality(perf.level);
    }
}

function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    if (!loadedDone) loaderTick();
    tweenFrame(now);
    pxs += (pointerX - pxs) * 0.06;
    pys += (pointerY - pys) * 0.06;
    updateCursor();
    let drew = false;
    if (hero && view < H - 1) { hero.frame(now / 1000); drew = true; }
    if (stage && view > H * 0.3) { stage.frame(now, dt); drew = true; }
    if (drew) perfSample(dt);
}
requestAnimationFrame(frame);
