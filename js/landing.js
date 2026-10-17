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
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouseUI = window.matchMedia('(hover: hover) and (pointer: fine)');

const header = $('#siteHeader');
const navToggle = $('#navToggle');
const stageEl = $('#stage');
const rail = $('#rail');
const railFill = $('#railFill');
const railNum = $('#railNum');
const heroBg = $('#heroBg');
const sections = $$('#main > section');
const N = sections.length;
const HASHES = sections.map(s => s.dataset.hash);

// 每一屏对应的粒子形态：A 球体 / B 键盘 / C <CK>；首屏不显示粒子
const FORMS = [null, 'A', 'B', 'C', 'A', 'B', 'C'];
// 粒子层在各屏的不透明度：内容较多的后三屏压暗，让文字更好读
const STAGE_OP = [1, 1, 1, 1, 0.32, 0.3, 0.2];
const LEAVE_MS = 900;

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
    setTimeout(() => { loader.hidden = true; }, 800);
    W = window.innerWidth;
    H = window.innerHeight;
    syncHeader();
    fitHeadings();
    if (hero) hero.fit();
    if (stage) stage.resize();
    const start = HASHES.indexOf(decodeURIComponent(location.hash.slice(1)));
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

if (mouseUI.matches) root.classList.add('has-cursor');

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
    cursorEl.classList.toggle('dot', (overHeroGL || heroDragging) && !overLink);
    cursorEl.classList.toggle('big', big && !overLink && !overHeroGL);
    cursorEl.classList.toggle('link', overLink);
    const want = hoverLabel || LABEL_DEFAULT;
    if (want !== labelText) {
        labelText = want;
        cursorLabel.textContent = want;
    }
    const on = hoverLabel ? true : (big && !overLink && view < (N - 1 - 0.45) * H);
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
    $$('.navpill a[data-go]').forEach(a => {
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
            if (o && getComputedStyle(o).position === 'absolute') room = Math.min(room, o.getBoundingClientRect().left - 40 - r.left);
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
            nctx.fillStyle = `rgba(255,255,255,${(0.17 + 0.33 * hash(r, c)).toFixed(3)})`;
            nctx.fillText(String(v), c * COL + 10, r * ROW + 7);
        }
    }
}
setInterval(() => {
    if (view < H && !document.hidden) {
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
            parts.push(g);
        }
    }
    const geo = mergeGeometries(parts);
    parts.forEach(p => p.dispose());
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, 0);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
        color: 0x5d768d, metalness: 0.94, roughness: 0.15,
        clearcoat: 1, clearcoatRoughness: 0.09,
        iridescence: 0.45, iridescenceIOR: 1.28, iridescenceThicknessRange: [160, 470],
        envMapIntensity: 1.15, reflectivity: 0.86
    });

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

    canvas.addEventListener('pointerenter', () => { overHeroGL = true; });
    canvas.addEventListener('pointerleave', () => { overHeroGL = false; });
    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') return;
        heroDragging = true;
        last = { x: e.clientX, y: e.clientY };
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
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture', release);

    function heroTextTop() {
        const a = $('#heroTitle').getBoundingClientRect().top;
        const b = $('#heroAside').getBoundingClientRect().top;
        return Math.min(a, b);
    }

    function fit() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
        const amp = H < 560 ? 0.30 * 0.35 : 0.30;
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
        renderer.render(scene, camera);
    }

    fit();
    return { fit, frame };
}

/* ===================================================================
   粒子：30,000 个白点在球体、键盘、<CK> 三种形态之间变形
   =================================================================== */
const VS = `
attribute vec3 pA;
attribute vec3 pB;
attribute vec3 pC;
attribute float sd;
attribute float sc;
attribute float al;
uniform float wA, wB, wC, squeeze, time, psize;
varying float vA;
varying float vBoost;
void main(){
  vec3 p = pA*wA + pB*wB + pC*wC;
  float s = sd*6.2831;
  p += vec3(sin(time*.55+s*3.1), cos(time*.47+s*2.3), sin(time*.61+s*4.7))*1.8;
  p.x *= squeeze;
  p.z *= squeeze;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = psize * sc * (760.0 / max(1.0, -mv.z));
  vA = al * clamp(1.0 - (-mv.z - 520.0) / 2600.0, .22, 1.0);
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

// 程序绘制的键盘俯视图（深色缝隙会被丢弃，键帽越亮粒子越密；C、K 两颗键最亮）
function keyboardSites() {
    const KW = 1200;
    const m = 26;
    const u = (KW - m * 2) / 15;
    const KH = Math.round(m * 2 + 5.62 * u);
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
    // 外壳只画一圈轮廓
    rrect(5, 5, KW - 10, KH - 10, 30);
    g.lineWidth = 7;
    g.strokeStyle = 'rgb(92,92,92)';
    g.stroke();

    const fnW = 15 / 14;
    const rows = [
        { h: 0.62, keys: Array(14).fill(fnW) },
        { h: 1, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2] },
        { h: 1, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
        { h: 1, keys: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], hot: [8] },
        { h: 1, keys: [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], hot: [3] },
        { h: 1, keys: [1, 1, 1, 1.25, 5.5, 1.25, 1, 1, 1, 1], arrows: true }
    ];
    const gap = 0.12 * u;
    let y = m;
    for (const row of rows) {
        let x = m;
        const rh = row.h * u;
        row.keys.forEach((kw, i) => {
            const w = kw * u;
            const isArrowUD = row.arrows && i === 8;
            const hot = row.hot && row.hot.includes(i);
            const draw = (kx, ky, kw2, kh2) => {
                const top = hot ? 255 : 205;
                const bot = hot ? 235 : 160;
                const grad = g.createLinearGradient(0, ky, 0, ky + kh2);
                grad.addColorStop(0, `rgb(${top},${top},${top})`);
                grad.addColorStop(0.78, `rgb(${bot},${bot},${bot})`);
                grad.addColorStop(0.79, 'rgb(96,96,96)');
                grad.addColorStop(1, 'rgb(78,78,78)');
                g.fillStyle = grad;
                rrect(kx, ky, kw2, kh2, Math.min(9, kh2 * 0.18));
                g.fill();
            };
            if (isArrowUD) {
                const hh = (rh - gap) / 2;
                draw(x + gap / 2, y + gap / 2, w - gap, hh - gap / 4);
                draw(x + gap / 2, y + gap / 2 + hh + gap / 4, w - gap, hh - gap / 4);
            } else if (row.arrows && (i === 7 || i === 9)) {
                draw(x + gap / 2, y + gap / 2 + rh / 2, w - gap, rh / 2 - gap);
            } else {
                draw(x + gap / 2, y + gap / 2, w - gap, rh - gap);
            }
            x += w;
        });
        y += rh;
    }

    const SW = 300;
    const SH = Math.round(SW * KH / KW);
    const s = document.createElement('canvas');
    s.width = SW;
    s.height = SH;
    const sg = s.getContext('2d', { willReadFrequently: true });
    sg.drawImage(c, 0, 0, SW, SH);
    const data = sg.getImageData(0, 0, SW, SH).data;
    const xs = [];
    const ys = [];
    const ls = [];
    for (let py = 0; py < SH; py++) {
        for (let px = 0; px < SW; px++) {
            const o = (py * SW + px) * 4;
            const L = (data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114) / 255;
            if (L > 0.12) { xs.push(px); ys.push(py); ls.push(L); }
        }
    }
    const cum = new Float32Array(ls.length);
    let total = 0;
    for (let i = 0; i < ls.length; i++) { total += 0.25 + ls[i] * ls[i]; cum[i] = total; }
    return { sw: SW, sh: SH, xs, ys, ls, cum, total };
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
    for (let i = 0; i < count; i++) {
        const t = pickIndex(cumArr, Math.random() * total) * 9;
        let u = Math.random();
        let w = Math.random();
        if (u + w > 1) { u = 1 - u; w = 1 - w; }
        for (let k = 0; k < 3; k++) {
            const v = tris[t + k] + (tris[t + 3 + k] - tris[t + k]) * u + (tris[t + 6 + k] - tris[t + k]) * w;
            raw[i * 3 + k] = v;
        }
        min.min(new THREE.Vector3(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]));
        max.max(new THREE.Vector3(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]));
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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
    const pA0 = pA.slice();
    const pB = pA.slice();
    const pC = pA.slice();

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
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3000);

    const uni = {
        wA: { value: 1 }, wB: { value: 0 }, wC: { value: 0 },
        squeeze: { value: 1 }, time: { value: 0 }, psize: { value: 2.2 }
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
    let kb = null;
    const kSite = new Int32Array(PN);
    const kJit = new Float32Array(PN * 3);
    try {
        kb = keyboardSites();
        for (let i = 0; i < PN; i++) {
            kSite[i] = pickIndex(kb.cum, Math.random() * kb.total);
            kJit[i * 3] = Math.random() - 0.5;
            kJit[i * 3 + 1] = Math.random() - 0.5;
            kJit[i * 3 + 2] = Math.random() - 0.5;
        }
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
        const rel = el => {
            const r = el.getBoundingClientRect();
            return { top: r.top - s0, bottom: r.bottom - s0, h: r.height };
        };
        let top = header.offsetHeight + 8;
        let bottom = H - 8;
        $$(upperSel, sec).forEach(el => { const r = rel(el); if (r.h > 0) top = Math.max(top, r.bottom + 10); });
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
            const b = band('s2', 'h2', '.facts, .note');
            s = Math.min(1, W / 860, (b.h / 2) * 0.84 / R);
            oy = H / 2 - b.cy;
        }
        for (let i = 0; i < PN; i++) {
            pA[i * 3] = pA0[i * 3] * s;
            pA[i * 3 + 1] = pA0[i * 3 + 1] * s + oy;
            pA[i * 3 + 2] = pA0[i * 3 + 2] * s;
        }
        attrA.needsUpdate = true;
    }

    function layoutB() {
        if (!kb) return;
        const tilt = 0.70;
        const ct = Math.cos(tilt);
        const st = Math.sin(tilt);
        const aspect = kb.sh / kb.sw;
        let srcW;
        let cy;
        if (stacked()) {
            const b = band('s3', 'h2', '.note, .chips');
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
        attrC.needsUpdate = true;
    }

    function resize() {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.position.z = (H / 2) / Math.tan(22.5 * Math.PI / 180);
        camera.updateProjectionMatrix();
        // 相机距离随视口高度变化，点的像素大小按高度归一，矮屏不会显得更粗更亮
        // 高分屏上点会变细，按像素比的 0.75 次方补偿一部分
        uni.psize.value = 2.2 * clamp(H / 900, 0.55, 1.5) * Math.pow(renderer.getPixelRatio(), 0.75);
        layoutA();
        layoutB();
        layoutC();
    }

    let spin = 0;
    function frame(now, dt) {
        uni.time.value = now / 1000;
        spin += dt * (0.085 * uni.wA.value + 0.006 * (uni.wB.value + uni.wC.value));
        const sp = ((spin + Math.PI) % (Math.PI * 2)) - Math.PI;
        points.rotation.y = sp * uni.wA.value + pxs * 0.16;
        points.rotation.x = pys * 0.09;
        renderer.render(scene, camera);
    }

    resize();
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    return { uni, resize, frame };
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
    return { w, sq, op: lerp(STAGE_OP[i], STAGE_OP[i + 1], smooth(t)) };
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
    if (stage) {
        stage.uni.wA.value = s.w.A;
        stage.uni.wB.value = s.w.B;
        stage.uni.wC.value = s.w.C;
        stage.uni.squeeze.value = Math.max(s.sq, 0.02);
    }
    stageEl.style.setProperty('--so', s.op.toFixed(3));
    stageEl.classList.toggle('on', y > H * 0.55);
    rail.classList.toggle('on', y > H * 0.75);
    railFill.style.height = (clamp(y / (H * (N - 1)), 0, 1) * 100).toFixed(2) + '%';
}

let tw = null;
function startTween(from, to) {
    let mix = null;
    if (Math.abs(to - from) > H * 1.01) {
        const a = stateAt(from);
        const b = stateAt(to);
        mix = { a, b, k: 0, same: dominant(a) === dominant(b) };
    }
    tw = { from, to, t0: performance.now(), mix };
}
function tweenFrame(now) {
    if (!tw) return;
    const p = clamp((now - tw.t0) / LEAVE_MS, 0, 1);
    if (tw.mix) tw.mix.k = p < 0.3 ? 0 : (p < 0.7 ? smooth((p - 0.3) / 0.4) : 1);
    applyView(lerp(tw.from, tw.to, p), tw.mix);
    if (p >= 1) tw = null;
}

function go(n) {
    n = clamp(Math.round(n), 0, N - 1);
    if (busy) { pendingGo = n; return; }
    if (n === cur) return;
    busy = true;
    needGap = true;
    const dir = n > cur ? 1 : -1;
    const old = sections[cur];
    onLeave(cur);
    old.classList.add(dir > 0 ? 'out-up' : 'out-down');
    startTween(view, n * H);
    let done = false;
    const te = e => { if (e.target === old && e.propertyName === 'transform') fin(); };
    const fin = () => {
        if (done) return;
        done = true;
        old.removeEventListener('transitionend', te);
        old.classList.remove('show', 'out-up', 'out-down');
        resetSection(old);
        present(n, dir);
    };
    old.addEventListener('transitionend', te);
    setTimeout(fin, 980);
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
    setTimeout(un, 830);
}

function jumpTo(n) {
    busy = true;
    const old = sections[cur];
    old.classList.remove('show');
    resetSection(old);
    applyView(n * H);
    present(n, 1);
}

window.addEventListener('hashchange', () => {
    const i = HASHES.indexOf(decodeURIComponent(location.hash.slice(1)));
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
    if (e.ctrlKey) return;
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
                hsBy(el, dy);
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
    if (gap > 160) wheelAcc = 0;
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
    if (e.touches.length !== 1) { ts = null; return; }
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
    if (!ts) return;
    if (!ts.v && !ts.h && e.cancelable) e.preventDefault();
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

/* ---------- 键盘 ---------- */
window.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    let d = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) d = -1;
    else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        go(e.key === 'Home' ? 0 : N - 1);
        return;
    }
    if (!d) return;
    if (e.key === ' ' && (tag === 'button' || tag === 'a')) return;
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
caseBtns.forEach(b => b.addEventListener('click', () => hsBy(casesEl, Number(b.dataset.dir) * caseStep())));

let drag = null;
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
    }
    if (drag.moved) {
        casesEl.scrollLeft = drag.left - dx;
        if (casesEl._hs) { casesEl._hs.t = casesEl.scrollLeft; casesEl._hs.x = casesEl.scrollLeft; }
    }
});
window.addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    casesEl.classList.remove('dragging');
    if (moved) {
        casesEl._suppress = true;
        setTimeout(() => { casesEl._suppress = false; }, 0);
    }
});
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
   尺寸变化：顶栏高度、标题字号、点阵网格、字标取景、三种粒子形态
   =================================================================== */
let rzRaf = 0;
function onResize() {
    cancelAnimationFrame(rzRaf);
    rzRaf = requestAnimationFrame(() => {
        W = window.innerWidth;
        H = window.innerHeight;
        syncHeader();
        fitHeadings();
        sizeNums();
        if (hero) hero.fit();
        if (stage) stage.resize();
        if (!busy && !tw) applyView(cur * H);
        if (getComputedStyle(navToggle).display === 'none') setMenu(false);
        caseUpdate();
    });
}
window.addEventListener('resize', onResize);
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
applyView(0);

let lastT = performance.now();
document.addEventListener('visibilitychange', () => { lastT = performance.now(); });
function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    if (!loadedDone) loaderTick();
    tweenFrame(now);
    pxs += (pointerX - pxs) * 0.06;
    pys += (pointerY - pys) * 0.06;
    updateCursor();
    if (hero && view < H - 1) hero.frame(now / 1000);
    if (stage && view > H * 0.3) stage.frame(now, dt);
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
