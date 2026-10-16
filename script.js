/* ===================================================================
   CKSTUDIO · 传康Kk 个人工作站 · 页面脚本
   数据（案例 / 开源仓库）在前，渲染与交互在后
   =================================================================== */
'use strict';

document.documentElement.classList.add('js');

const PAGE_TITLE = document.title;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const ICON_ARROW = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeExternalUrl(value) {
    try {
        const url = new URL(String(value), window.location.href);
        if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
            return url.href;
        }
    } catch (error) {
        return '#';
    }
    return '#';
}

const pad2 = n => String(n).padStart(2, '0');
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ===== 案例：已上线的自研项目（封面为示意插图） =====
const projects = [
    { name: "中国基金实时行情", desc: "国内基金实时估值、涨跌排行和自选列表，部署在 Cloudflare Workers 上。", url: "https://fund-cn.chuankangkk.top/", image: "assets/works/fund-cn.webp", category: "行情与数据", tags: ["基金", "Workers", "实时数据"] },
    { name: "黄金量化监控", desc: "黄金行情看板，均线与指标监控，接入 AI 生成简要的行情分析。", url: "https://gold.chuankangkk.top/", image: "assets/works/gold.webp", category: "量化", tags: ["量化", "AI 分析", "Vue3"] },
    { name: "全球基金估值", desc: "海外基金估值，双数据源交叉校验，支持中英文切换。", url: "https://fund.chuankangkk.top/", image: "assets/works/fund-global.webp", category: "行情与数据", tags: ["估值", "双数据源", "i18n"] },
    { name: "CK 3D", desc: "可拖拽、可旋转的三维交互页面，WebGL 实时渲染。", url: "https://3d.chuankangkk.top/", image: "assets/works/ck-3d.webp", category: "前端交互", tags: ["WebGL", "3D", "交互"] },
    { name: "传康烟花秀", desc: "Canvas 粒子烟花动效，点击画面即可触发。", url: "https://yanhua.chuankangkk.top/", image: "assets/works/fireworks.webp", category: "前端交互", tags: ["Canvas", "粒子", "动效"] },
    { name: "睡眠助手", desc: "白噪音页面，多种环境声，睡前或专注时播放。", url: "https://sleep-3s3.pages.dev/", image: "assets/works/sleep.webp", category: "工具", tags: ["白噪音", "音频", "工具"] }
];

// ===== 精选开源仓库（Star 数截至 2026-07 同步；没有数据的不显示数字） =====
const openSourceProjects = [
    { name: "vensim-system-dynamics-skill", desc: "Vensim 系统动力学工具：读写 .mdl 模型，从 JSON 生成存量流量图并自动整理布局。", language: "Python", stars: null, repo: "https://github.com/1837620622/vensim-system-dynamics-skill" },
    { name: "Super-Agent-Skills", desc: "面向 AI 编程助手的技能库，覆盖 Cloudflare、AWS、文档处理等常见场景。", language: "Skills", stars: null, repo: "https://github.com/1837620622/Super-Agent-Skills" },
    { name: "fund-cn", desc: "国内基金实时估值，运行在 Cloudflare Workers 上。", language: "JavaScript", stars: 22, repo: "https://github.com/1837620622/fund-cn", demo: "https://fund-cn.chuankangkk.top" },
    { name: "Gold-Price-Quantitative-Monitoring-System", desc: "黄金行情监控面板，接入 DeepSeek 做行情分析。", language: "JavaScript", stars: 12, repo: "https://github.com/1837620622/Gold-Price-Quantitative-Monitoring-System", demo: "https://gold.chuankangkk.top" },
    { name: "travel-diary-app", desc: "Android 旅行日记：账号体系、日记本、分类筛选与全文搜索。", language: "Android", stars: null, repo: "https://github.com/1837620622/travel-diary-app" },
    { name: "cloudflare-free-services-guide", desc: "Cloudflare 免费服务实践指南：Workers、Pages、D1、R2。", language: "Docs", stars: 6, repo: "https://github.com/1837620622/cloudflare-free-services-guide" }
];


/* ===================================================================
   渲染
   =================================================================== */
function renderProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    grid.innerHTML = projects.map((p, i) => `
        <a class="work reveal" href="${safeExternalUrl(p.url)}" target="_blank" rel="noopener noreferrer" data-cursor="查看">
            <div class="work-media">
                <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)} 封面示意图" loading="lazy" decoding="async" width="1200" height="800">
            </div>
            <div class="work-info">
                <span class="work-num">${pad2(i + 1)}</span>
                <h3 class="work-title">${escapeHtml(p.name)}</h3>
                <span class="work-cat">${escapeHtml(p.category)}</span>
            </div>
            <p class="work-desc">${escapeHtml(p.desc)}</p>
            <p class="work-tags">${p.tags.map(escapeHtml).join(' · ')}</p>
        </a>`).join('');
}

function renderOpenSource() {
    const list = document.getElementById('openSourceGrid');
    if (!list) return;

    list.innerHTML = openSourceProjects.map(p => {
        const demo = p.demo
            ? ` <a class="repo-demo" href="${safeExternalUrl(p.demo)}" target="_blank" rel="noopener noreferrer">在线版本</a>`
            : '';
        const stars = typeof p.stars === 'number' ? `★ ${escapeHtml(p.stars)}` : '';
        return `
            <li class="repo reveal">
                <a class="repo-name" href="${safeExternalUrl(p.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.name)}</a>
                <p class="repo-desc">${escapeHtml(p.desc)}${demo}</p>
                <span class="repo-lang">${escapeHtml(p.language)}</span>
                <span class="repo-stars">${stars}</span>
                ${ICON_ARROW}
            </li>`;
    }).join('');
}

// 标题拆成单字，用于逐字上升
function splitTitles() {
    document.querySelectorAll('.split').forEach(el => {
        const text = el.textContent.trim();
        el.setAttribute('aria-label', text);
        el.innerHTML = Array.from(text)
            .map((c, i) => `<span class="ch" aria-hidden="true" style="--i: ${i}">${escapeHtml(c)}</span>`)
            .join('');
    });
}

/* ===================================================================
   平滑滚动（Lenis）与锚点
   =================================================================== */
let lenis = null;

function initSmoothScroll() {
    if (!reduceMotion && typeof window.Lenis === 'function') {
        lenis = new window.Lenis({
            duration: 1.2,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });
    }

    document.addEventListener('click', event => {
        const link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
        if (!link) return;
        const id = link.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        if (lenis) lenis.scrollTo(target, { duration: 1.6 });
        else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
}

/* ===================================================================
   加载页
   =================================================================== */
function finishLoading() {
    document.documentElement.classList.add('is-ready');
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('is-done');
        setTimeout(() => { loader.hidden = true; }, 1400);
    }
}

function initLoader() {
    const loader = document.getElementById('loader');
    const numEl = document.getElementById('loaderNum');
    const barEl = document.getElementById('loaderBar');
    if (!loader) {
        finishLoading();
        return;
    }

    const duration = reduceMotion ? 300 : 2000;
    const start = performance.now();
    const tick = now => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        if (numEl) numEl.textContent = String(Math.round(eased * 100)).padStart(3, '0');
        if (barEl) barEl.style.transform = `scaleX(${eased})`;
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const minTime = new Promise(resolve => setTimeout(resolve, duration));
    const pageLoaded = new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
    });
    const cap = new Promise(resolve => setTimeout(resolve, 4000));
    Promise.all([minTime, Promise.race([pageLoaded, cap])]).then(finishLoading);
}

/* ===================================================================
   导航
   =================================================================== */
function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    const setOpen = open => {
        menu.classList.toggle('active', open);
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
        menu.setAttribute('aria-hidden', String(!open));
        if (lenis) {
            if (open) lenis.stop();
            else lenis.start();
        } else {
            document.body.style.overflow = open ? 'hidden' : '';
        }
    };

    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('active')));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu.classList.contains('active')) {
            setOpen(false);
            toggle.focus();
        }
    });
}

function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const links = Array.from(document.querySelectorAll('.menu-link'));
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));

    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(a => {
                a.classList.remove('is-active');
                a.removeAttribute('aria-current');
            });
            const active = byId.get(entry.target.id);
            if (active) {
                active.classList.add('is-active');
                active.setAttribute('aria-current', 'true');
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main > header, main > section').forEach(s => spy.observe(s));
}

/* ===================================================================
   渐入与渐出：进入视口出现，离开视口淡出
   =================================================================== */
function initReveal() {
    const items = Array.from(document.querySelectorAll('.reveal'));

    // 同一容器内的相邻元素依次错开
    items.forEach(el => {
        const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
        el.style.setProperty('--d', `${(siblings.indexOf(el) % 4) * 90}ms`);
    });

    if (!('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-in'));
        return;
    }

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.target.classList.toggle('is-in', entry.isIntersecting));
    }, { rootMargin: '-6% 0px -6% 0px', threshold: 0 });

    items.forEach(el => io.observe(el));
}

/* ===================================================================
   指针：磁吸与案例跟随标签
   =================================================================== */
function initMagnetic() {
    if (!finePointer || reduceMotion) return;

    document.querySelectorAll('.magnetic').forEach(el => {
        const strength = el.classList.contains('btn') ? 0.3 : 0.18;
        el.addEventListener('pointermove', event => {
            const rect = el.getBoundingClientRect();
            const dx = (event.clientX - (rect.left + rect.width / 2)) * strength;
            const dy = (event.clientY - (rect.top + rect.height / 2)) * strength;
            el.style.setProperty('--mx', `${dx.toFixed(1)}px`);
            el.style.setProperty('--my', `${dy.toFixed(1)}px`);
        });
        el.addEventListener('pointerleave', () => {
            el.style.setProperty('--mx', '0px');
            el.style.setProperty('--my', '0px');
        });
    });
}

const cursor = { x: -200, y: -200, tx: -200, ty: -200, on: false, el: null };

function initCursorLabel() {
    const el = document.getElementById('cursorLabel');
    if (!el || !finePointer || reduceMotion) return;
    cursor.el = el;
    const text = el.querySelector('span');

    window.addEventListener('pointermove', event => {
        cursor.tx = event.clientX;
        cursor.ty = event.clientY;
        if (cursor.x < -100) {
            cursor.x = cursor.tx;
            cursor.y = cursor.ty;
        }
    }, { passive: true });

    document.addEventListener('pointerover', event => {
        const target = event.target.closest ? event.target.closest('[data-cursor]') : null;
        cursor.on = Boolean(target);
        if (target && text) text.textContent = target.dataset.cursor;
    });
}

/* ===================================================================
   滚动驱动：首屏淡出、进度线、导航隐藏、跑马灯
   =================================================================== */
function initScrollEffects() {
    const heroInner = document.getElementById('heroInner');
    const progress = document.getElementById('progress');
    const nav = document.getElementById('nav');
    const menu = document.getElementById('mobileMenu');
    const track = document.getElementById('marqueeTrack');

    let lastY = window.scrollY;
    let lastT = performance.now();
    let vel = 0;
    let marqueeX = 0;
    let direction = 1;

    const loop = now => {
        if (lenis) lenis.raf(now);

        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;
        vel += ((dy / Math.max(dt, 1 / 240)) - vel) * 0.12;

        // 首屏随滚动淡出、上移
        if (heroInner && !reduceMotion) {
            const vh = window.innerHeight;
            if (y < vh * 1.2) {
                const p = clamp(y / (vh * 0.85), 0, 1);
                heroInner.style.opacity = String(clamp(1 - p * 1.15, 0, 1));
                heroInner.style.transform = `translate3d(0, ${(-p * 90).toFixed(1)}px, 0)`;
            }
        }

        // 顶部进度线
        if (progress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        }

        // 导航：向下滚动时收起，向上时出现
        if (nav) {
            nav.classList.toggle('is-stuck', y > 40);
            const menuOpen = menu && menu.classList.contains('active');
            if (menuOpen || y < 200) nav.classList.remove('is-hidden');
            else if (dy > 4) nav.classList.add('is-hidden');
            else if (dy < -4) nav.classList.remove('is-hidden');
        }

        // 跑马灯：滚动越快走得越快，方向跟随滚动方向
        if (track && !reduceMotion) {
            if (dy > 0.5) direction = 1;
            else if (dy < -0.5) direction = -1;
            const speed = 46 + Math.min(900, Math.abs(vel) * 0.35);
            const groupW = track.scrollWidth / 2;
            marqueeX -= speed * dt * direction;
            if (groupW > 0) {
                if (marqueeX <= -groupW) marqueeX += groupW;
                if (marqueeX > 0) marqueeX -= groupW;
            }
            track.style.transform = `translate3d(${marqueeX.toFixed(1)}px, 0, 0)`;
        }

        // 案例跟随标签
        if (cursor.el) {
            cursor.x += (cursor.tx - cursor.x) * 0.18;
            cursor.y += (cursor.ty - cursor.y) * 0.18;
            cursor.el.style.setProperty('--x', `${cursor.x.toFixed(1)}px`);
            cursor.el.style.setProperty('--y', `${cursor.y.toFixed(1)}px`);
            cursor.el.style.setProperty('--s', cursor.on ? '1' : '0');
        }

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}

/* ===================================================================
   其它
   =================================================================== */
function initClock() {
    const el = document.getElementById('clock');
    if (!el || typeof Intl === 'undefined') return;
    const fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false });
    const update = () => { el.textContent = fmt.format(new Date()); };
    update();
    setInterval(update, 15000);
}

function initCopy() {
    const toast = document.getElementById('toast');
    let timer = 0;

    const show = message => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-on');
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove('is-on'), 1800);
    };

    const fallbackCopy = text => {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
    };

    document.querySelectorAll('[data-copy]').forEach(button => {
        button.addEventListener('click', () => {
            const text = button.dataset.copy;
            const done = () => show(`已复制：${text}`);
            const failed = () => show('复制失败，请手动复制');
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(done, () => (fallbackCopy(text) ? done() : failed()));
            } else {
                (fallbackCopy(text) ? done : failed)();
            }
        });
    });
}

function initAvatar() {
    document.querySelectorAll('img[data-fallback]').forEach(img => {
        const fallback = document.getElementById(img.dataset.fallback);
        const fail = () => {
            img.hidden = true;
            if (fallback) fallback.classList.add('visible');
        };
        img.addEventListener('error', fail, { once: true });
        if (img.complete && img.naturalWidth === 0) fail();
    });
}

function initVisibility() {
    document.addEventListener('visibilitychange', () => {
        document.title = document.hidden ? 'CKSTUDIO' : PAGE_TITLE;
    });
}

/* ===================================================================
   启动
   =================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    renderOpenSource();
    splitTitles();

    initSmoothScroll();
    initLoader();
    initMobileMenu();
    initScrollSpy();
    initReveal();

    initMagnetic();
    initCursorLabel();
    initScrollEffects();

    initClock();
    initCopy();
    initAvatar();
    initVisibility();

    console.log('%cCKSTUDIO · 传康Kk 个人工作站', 'color: #ecebe8; font-size: 13px; font-weight: 600;');
    console.log('%c合作联系：2040168455@qq.com', 'color: #888;');
});
