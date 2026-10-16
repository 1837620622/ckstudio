/* ===================================================================
   CKSTUDIO · 交互脚本
   =================================================================== */
'use strict';

document.documentElement.classList.add('js');

const PAGE_TITLE = document.title;

// ===== 分类与图标（统一 24 网格 · 1.6 描边 · 圆端点） =====
const projectCategories = {
    finance: {
        name: "行情与数据",
        icon: '<path d="M4 17.5 9.2 12.3l3.6 3.6L20 8.6"/><path d="M15.4 8.6H20v4.6"/>'
    },
    creative: {
        name: "前端与交互",
        icon: '<path d="M12 4.2 13.7 9.3 18.8 11 13.7 12.7 12 17.8l-1.7-5.1L5.2 11l5.1-1.7L12 4.2Z"/><path d="M18.5 16.8v3.4M16.8 18.5h3.4"/>'
    },
    tools: {
        name: "工具",
        icon: '<path d="M4 7h8M16 7h4M4 17h3M11 17h9"/><circle cx="14" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
    }
};

function svgIcon(paths) {
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
}

const ICON = {
    arrow: svgIcon('<path d="M7 17 17 7M9 7h8v8"/>')
};

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

function renderTags(tags) {
    return tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
}

// ===== 在线作品（已部署，可直接打开） =====
const projects = [
    { name: "中国基金实时行情", desc: "国内基金实时估值、涨跌排行和自选列表。", url: "https://fund-cn.chuankangkk.top/", code: "01", tags: ["基金", "Workers"], category: "finance", featured: true },
    { name: "全球基金估值", desc: "海外基金估值，双数据源，支持中英文切换。", url: "https://fund.chuankangkk.top/", code: "02", tags: ["基金", "估值"], category: "finance" },
    { name: "黄金量化监控", desc: "黄金行情看板，接入 AI 做简单的行情分析。", url: "https://gold.chuankangkk.top/", code: "03", tags: ["金融", "AI", "量化"], category: "finance", featured: true },
    { name: "传康烟花秀", desc: "Canvas 烟花动效，点击画面即可触发。", url: "https://yanhua.chuankangkk.top/", code: "04", tags: ["Canvas", "动效"], category: "creative" },
    { name: "CK 3D", desc: "可拖拽的三维页面。", url: "https://3d.chuankangkk.top/", code: "05", tags: ["3D", "交互"], category: "creative", featured: true },
    { name: "睡眠助手", desc: "白噪音页面，适合睡前或专注时播放。", url: "https://sleep-3s3.pages.dev/", code: "06", tags: ["白噪音", "工具"], category: "tools" }
];

// ===== 精选开源仓库（Star 数截至 2026-07 同步；没有数据的不显示数字） =====
const openSourceProjects = [
    { name: "vensim-system-dynamics-skill", desc: "Vensim 系统动力学工具，读写 .mdl 模型，从 JSON 生成存量流量图并整理布局。", language: "Python", stars: null, forks: null, repo: "https://github.com/1837620622/vensim-system-dynamics-skill", tags: ["系统动力学", "AI Agent"], featured: true },
    { name: "Super-Agent-Skills", desc: "面向 AI 编程助手的技能库，覆盖 Cloudflare、AWS、文档处理等场景。", language: "Skills", stars: null, forks: null, repo: "https://github.com/1837620622/Super-Agent-Skills", tags: ["Agent", "技能库"] },
    { name: "fund-cn", desc: "国内基金实时估值，跑在 Cloudflare Workers 上。", language: "JavaScript", stars: 22, forks: 7, repo: "https://github.com/1837620622/fund-cn", demo: "https://fund-cn.chuankangkk.top", tags: ["金融", "Workers"], featured: true },
    { name: "Gold-Price-Quantitative-Monitoring-System", desc: "黄金行情监控面板，接入 DeepSeek 做简单分析。", language: "JavaScript", stars: 12, forks: 5, repo: "https://github.com/1837620622/Gold-Price-Quantitative-Monitoring-System", demo: "https://gold.chuankangkk.top", tags: ["量化", "Vue3"] },
    { name: "travel-diary-app", desc: "Android 旅行日记，支持账号、日记本、分类筛选和搜索。", language: "Android", stars: null, forks: null, repo: "https://github.com/1837620622/travel-diary-app", tags: ["Android", "应用"] },
    { name: "cloudflare-free-services-guide", desc: "Cloudflare 免费服务的使用说明：Workers、Pages、D1、R2。", language: "Docs", stars: 6, forks: 1, repo: "https://github.com/1837620622/cloudflare-free-services-guide", tags: ["Cloudflare", "教程"] }
];


/* ===================================================================
   渲染
   =================================================================== */
const metrics = {
    live: projects.length,
    repos: openSourceProjects.length
};

function renderProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    const order = ['finance', 'creative', 'tools'];
    const html = [];

    order.forEach(key => {
        const items = projects.filter(p => p.category === key);
        if (!items.length) return;
        const cat = projectCategories[key];

        html.push(`
            <div class="category-head reveal">
                <span class="category-icon">${svgIcon(cat.icon)}</span>
                <h3 class="category-name">${escapeHtml(cat.name)}</h3>
                <span class="category-count">${String(items.length).padStart(2, '0')}</span>
                <span class="category-line"></span>
            </div>`);

        items.forEach(p => {
            html.push(`
                <a class="card spot reveal${p.featured ? ' card-featured' : ''}" href="${safeExternalUrl(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="打开：${escapeHtml(p.name)}">
                    <div class="card-top">
                        <span class="card-icon">${svgIcon(cat.icon)}</span>
                        <span class="card-meta">
                            ${p.featured ? '<em class="badge">精选</em>' : ''}
                            <span class="card-code">${escapeHtml(p.code)}</span>
                        </span>
                    </div>
                    <h4 class="card-title">${escapeHtml(p.name)}</h4>
                    <p class="card-desc">${escapeHtml(p.desc)}</p>
                    <div class="card-foot">
                        <div class="card-tags">${renderTags(p.tags)}</div>
                        <span class="card-go">${ICON.arrow}</span>
                    </div>
                </a>`);
        });
    });

    grid.innerHTML = html.join('');
}

function renderOpenSource() {
    const grid = document.getElementById('openSourceGrid');
    if (!grid) return;

    grid.innerHTML = openSourceProjects.map(p => {
        const hasStars = typeof p.stars === 'number';
        const metricsHtml = hasStars
            ? `<span class="repo-metrics">
                        <span><b>${escapeHtml(p.stars)}</b>stars</span>
                        <span><b>${escapeHtml(p.forks)}</b>forks</span>
                    </span>`
            : '';
        const demo = p.demo
            ? `<a class="btn btn-ghost" href="${safeExternalUrl(p.demo)}" target="_blank" rel="noopener noreferrer">在线版本 ${ICON.arrow}</a>`
            : '';
        return `
            <article class="repo-card spot reveal${p.featured ? ' repo-card-featured' : ''}">
                <header class="repo-head">
                    <span class="repo-lang">${escapeHtml(p.language)}</span>
                    ${metricsHtml}
                </header>
                <h4 class="repo-name">${escapeHtml(p.name)}</h4>
                <p class="repo-desc">${escapeHtml(p.desc)}</p>
                <div class="repo-foot">
                    <div class="card-tags">${renderTags(p.tags)}</div>
                    <div class="repo-actions">
                        <a class="btn btn-ghost" href="${safeExternalUrl(p.repo)}" target="_blank" rel="noopener noreferrer">仓库 ${ICON.arrow}</a>
                        ${demo}
                    </div>
                </div>
            </article>`;
    }).join('');
}

function syncHeadlines() {
    const worksCount = document.getElementById('worksCount');
    if (worksCount) worksCount.textContent = String(metrics.live);

    const sourceCount = document.getElementById('sourceCount');
    if (sourceCount) sourceCount.textContent = `${metrics.repos} 个精选仓库`;

    document.querySelectorAll('[data-metric]').forEach(el => {
        el.dataset.count = metrics[el.dataset.metric];
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
        setTimeout(() => { loader.hidden = true; }, 1200);
    }

    document.querySelectorAll('.hero [data-metric]').forEach(countUp);
}

function initLoader() {
    const loader = document.getElementById('loader');
    const numEl = document.getElementById('loaderNum');
    const barEl = document.getElementById('loaderBar');

    if (!loader) {
        finishLoading();
        return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 300 : 2100;
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
        document.body.style.overflow = open ? 'hidden' : '';
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

function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 当前所在区块对应的导航项高亮
    if (!('IntersectionObserver' in window)) return;
    const links = Array.from(nav.querySelectorAll('.menu a[href^="#"]'));
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

    ['works', 'opensource', 'about', 'contact'].forEach(id => {
        const section = document.getElementById(id);
        if (section) spy.observe(section);
    });
}

function initProgress() {
    const bar = document.getElementById('progress');
    if (!bar) return;

    let ticking = false;
    const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        bar.style.transform = `scaleX(${p})`;
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
    update();
}

/* ===================================================================
   指针效果
   =================================================================== */
// 卡片聚光：把指针坐标写进元素的 --mx / --my
function initSpotlight() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.addEventListener('pointermove', event => {
        const el = event.target.closest ? event.target.closest('.spot') : null;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        el.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }, { passive: true });
}

// 鼠标光晕：缓动跟随
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow || !window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let frame = 0;

    const loop = () => {
        x += (tx - x) * 0.16;
        y += (ty - y) * 0.16;
        glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        const settled = Math.abs(tx - x) < 0.3 && Math.abs(ty - y) < 0.3;
        frame = settled ? 0 : requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', event => {
        tx = event.clientX;
        ty = event.clientY;
        glow.classList.add('is-on');
        if (!frame) frame = requestAnimationFrame(loop);
    }, { passive: true });
}

// 按钮磁吸：靠近时轻微跟随
function initMagnetic() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('pointermove', event => {
            const rect = el.getBoundingClientRect();
            const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.2;
            const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.28;
            el.style.setProperty('--tx', `${dx.toFixed(1)}px`);
            el.style.setProperty('--ty', `${dy.toFixed(1)}px`);
        });
        el.addEventListener('pointerleave', () => {
            el.style.setProperty('--tx', '0px');
            el.style.setProperty('--ty', '0px');
        });
    });
}

/* ===================================================================
   滚动入场与数字
   =================================================================== */
function initReveal() {
    const items = Array.from(document.querySelectorAll('.reveal'));
    items.forEach((el, i) => el.style.setProperty('--d', `${(i % 3) * 90}ms`));

    if (!('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-in'));
        return;
    }

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(el => io.observe(el));
}

function countUp(el) {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
        el.textContent = `${target}${suffix}`;
        return;
    }

    const duration = 1600;
    const begin = performance.now();
    const step = now => {
        const p = Math.min(1, (now - begin) / duration);
        const value = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = `${value}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = `0${suffix}`;
    requestAnimationFrame(step);
}

function initCounters() {
    const els = Array.from(document.querySelectorAll('[data-metric]')).filter(el => !el.closest('.hero'));
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
        els.forEach(countUp);
        return;
    }

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            countUp(entry.target);
            io.unobserve(entry.target);
        });
    }, { threshold: 0.6 });

    els.forEach(el => io.observe(el));
}

/* ===================================================================
   其它交互
   =================================================================== */
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
    syncHeadlines();

    initLoader();
    initNav();
    initMobileMenu();
    initProgress();

    initSpotlight();
    initCursorGlow();
    initMagnetic();
    initCopy();
    initAvatar();

    initReveal();
    initCounters();
    initVisibility();

    console.log('%cCKSTUDIO · 传康Kk', 'color: #f2f3f5; font-size: 13px; font-weight: 600;');
    console.log('%cgithub.com/1837620622', 'color: #888;');
});
