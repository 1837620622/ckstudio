/* ===================================================================
   CK Studio · 交互脚本
   数据区（作品 / 开源仓库）在下方原样保留；渲染与交互在数据之后
   =================================================================== */
'use strict';

document.documentElement.classList.add('js');

const PUBLIC_REPOS = 67; // GitHub 公开仓库数，手动同步
const PAGE_TITLE = document.title;

// ===== 分类与图标（统一 24 网格 · 1.6 描边 · 圆端点） =====
const projectCategories = {
    entertainment: {
        name: "娱乐",
        icon: '<rect x="3.5" y="6" width="17" height="12" rx="3.5"/><path d="M10.5 9.6v4.8l4-2.4-4-2.4Z"/>'
    },
    tools: {
        name: "工具",
        icon: '<path d="M4 7h8M16 7h4M4 17h3M11 17h9"/><circle cx="14" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
    },
    finance: {
        name: "行情",
        icon: '<path d="M4 17.5 9.2 12.3l3.6 3.6L20 8.6"/><path d="M15.4 8.6H20v4.6"/>'
    },
    ai: {
        name: "AI",
        icon: '<path d="M12 4.2 13.7 9.3 18.8 11 13.7 12.7 12 17.8l-1.7-5.1L5.2 11l5.1-1.7L12 4.2Z"/><path d="M18.5 16.8v3.4M16.8 18.5h3.4"/>'
    }
};

function svgIcon(paths) {
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
}

const ICON = {
    arrow: svgIcon('<path d="M7 17 17 7M9 7h8v8"/>'),
    arrowRight: svgIcon('<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>')
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

// ===== 在线作品（仅收录 2026-07 实测 HTTP 2xx 的自有站点） =====
// 已剔除失效：api.chuankangkk.top / proxy.chuankangkk.top / cet6 railway / sport.chuankangkk.top
const projects = [
    // PLAY
    { name: "CKTV 传康播放器", desc: "多源影视聚合播放，网页里直接看。", url: "https://tv.chuankangkk.top/", code: "01", tags: ["视频", "Next.js"], category: "entertainment", featured: true },
    { name: "CK Music", desc: "多源音乐播放，支持搜歌和在线听。", url: "https://ckmusic.chuankangkk.top/", code: "02", tags: ["音乐", "播放器"], category: "entertainment", featured: true },
    { name: "传康云游戏", desc: "浏览器里的小游戏合集，打开就能玩。", url: "https://game.chuankangkk.top/", code: "03", tags: ["游戏", "H5"], category: "entertainment", featured: true },
    { name: "传康烟花秀", desc: "Canvas 烟花动效，点一下满屏绽放。", url: "https://yanhua.chuankangkk.top/", code: "04", tags: ["Canvas", "动效"], category: "entertainment" },
    { name: "CK 3D 展示", desc: "可拖拽的 3D 展示页，随便逛。", url: "https://3d.chuankangkk.top/", code: "05", tags: ["3D", "交互"], category: "entertainment" },

    // TOOLS
    { name: "CK 图床", desc: "上传图片，马上拿到可外链的地址。", url: "https://ck-img.chuankangkk.top/", code: "06", tags: ["图床", "存储"], category: "tools", featured: true },
    { name: "IP 质量检测", desc: "查 IP 质量，顺带测流媒体能不能看。", url: "https://ip-check.chuankangkk.top/", code: "07", tags: ["IP", "网络"], category: "tools", featured: true },
    { name: "免费 VPN 情报站", desc: "免费节点和试用机场汇总，尽量每天更新。", url: "https://free-vpn.chuankangkk.top/", code: "08", tags: ["VPN", "订阅"], category: "tools", featured: true },
    { name: "Stripe 邮箱风控", desc: "测邮箱风险，粗估支付能不能过。", url: "https://stripe-email.chuankangkk.top/", code: "09", tags: ["风控", "支付"], category: "tools", featured: true },
    { name: "小米运动刷步", desc: "改微信 / 支付宝运动步数的小工具。", url: "https://sport-xiaomi.vercel.app/", code: "10", tags: ["运动", "工具"], category: "tools" },
    { name: "睡眠助手", desc: "白噪音页面，睡觉或工作时放着听。", url: "https://sleep-3s3.pages.dev/", code: "11", tags: ["白噪音", "助眠"], category: "tools" },
    { name: "CK Card Tools", desc: "虚拟卡号生成和校验，中英界面。", url: "https://ck-card-tools.vercel.app/", code: "12", tags: ["工具", "React"], category: "tools" },
    { name: "Codex Inviter", desc: "批量发 ChatGPT Codex 邀请，可一键部署。", url: "https://codex-inviter.vercel.app/", code: "13", tags: ["Codex", "邀请"], category: "tools" },

    // MARKETS
    { name: "黄金量化监控", desc: "黄金行情看板，带一点 AI 分析。", url: "https://gold.chuankangkk.top/", code: "14", tags: ["金融", "AI", "量化"], category: "finance", featured: true },
    { name: "中国基金实时行情", desc: "国内基金估值、涨跌榜和自选。", url: "https://fund-cn.chuankangkk.top/", code: "15", tags: ["基金", "Workers"], category: "finance", featured: true },
    { name: "全球基金估值", desc: "海外基金估值，双数据源，中英双语。", url: "https://fund.chuankangkk.top/", code: "16", tags: ["基金", "估值"], category: "finance" },

    // AI
    { name: "谁是 AI 大嘉豪", desc: "测你是不是 AI 大嘉豪，随机出题打段位。", url: "https://ai-jiahao.chuankangkk.top/", code: "17", tags: ["AI", "测评"], category: "ai", featured: true },
    { name: "Trump Tracker", desc: "盯 Truth Social 动态，有更新就推。", url: "https://trump-x.chuankangkk.top/", code: "18", tags: ["监控", "社交"], category: "ai", featured: true },
    { name: "玄机子 Diviner", desc: "拿 AI 算命玩一玩，别当真。", url: "https://diviner.chuankangkk.top/", code: "19", tags: ["AI", "趣味"], category: "ai" }
];

// ===== GitHub 开源精选（原创 + Stars 降序；demo 仅保留实测可访问地址） =====
const openSourceProjects = [
    { name: "cloudflare-bypass-2026", desc: "Cloudflare Turnstile 绕过研究，跨平台可跑。", language: "Python", stars: 391, forks: 71, repo: "https://github.com/1837620622/cloudflare-bypass-2026", tags: ["安全研究", "自动化"], featured: true },
    { name: "windsurf-account-manager-releases", desc: "Windsurf 多账号桌面端：切换账号、刷 Token、看额度。", language: "Desktop", stars: 65, forks: 5, repo: "https://github.com/1837620622/windsurf-account-manager-releases", tags: ["桌面工具", "账号管理"], featured: true },
    { name: "chatgpt-specimen-toolbox", desc: "ChatGPT Session 和九种登录格式互转，全程本地。", language: "JavaScript", stars: 50, forks: 18, repo: "https://github.com/1837620622/chatgpt-specimen-toolbox", tags: ["扩展", "本地处理"], featured: true },
    { name: "cto-new-openai-proxy", desc: "兼容 OpenAI / Anthropic 的代理网关，带账号池和后台。", language: "Python", stars: 35, forks: 9, repo: "https://github.com/1837620622/cto-new-openai-proxy", tags: ["AI网关", "代理"], featured: true },
    { name: "winsurf-switch", desc: "Windsurf 账号快速切换，少等限流。", language: "Python", stars: 33, forks: 3, repo: "https://github.com/1837620622/winsurf-switch", tags: ["效率", "跨平台"] },
    { name: "wifi-security-toolkit", desc: "WPA 研究 + hashcat 流水线，可上云 GPU。", language: "Shell", stars: 23, forks: 7, repo: "https://github.com/1837620622/wifi-security-toolkit", tags: ["安全", "GPU"] },
    { name: "fund-cn", desc: "国内基金实时估值，跑在 Cloudflare Workers 上。", language: "JavaScript", stars: 22, forks: 7, repo: "https://github.com/1837620622/fund-cn", demo: "https://fund-cn.chuankangkk.top", tags: ["金融", "Workers"], featured: true },
    { name: "free-vps", desc: "二十多个免费 VPS / 容器平台，对比和部署说明。", language: "Docs", stars: 15, forks: 7, repo: "https://github.com/1837620622/free-vps", tags: ["运维", "文档"] },
    { name: "Gold-Price-Quantitative-Monitoring-System", desc: "黄金行情监控，接 DeepSeek 做简单分析。", language: "JavaScript", stars: 12, forks: 5, repo: "https://github.com/1837620622/Gold-Price-Quantitative-Monitoring-System", demo: "https://gold.chuankangkk.top", tags: ["量化", "Vue3"] },
    { name: "windsurf-unlimited-cknb", desc: "Windsurf 辅助工具链，跨平台。", language: "TypeScript", stars: 9, forks: 0, repo: "https://github.com/1837620622/windsurf-unlimited-cknb", tags: ["Windsurf", "工具"] },
    { name: "codex-red-team-prompt", desc: "Codex 系统提示注入实验，给红队研究用。", language: "Python", stars: 8, forks: 1, repo: "https://github.com/1837620622/codex-red-team-prompt", tags: ["安全研究", "Codex"] },
    { name: "codex-inviter", desc: "发 ChatGPT Codex 邀请的页面，可丢 Vercel。", language: "HTML", stars: 6, forks: 3, repo: "https://github.com/1837620622/codex-inviter", demo: "https://codex-inviter.vercel.app/", tags: ["工具", "Vercel"] },
    { name: "cloudflare-free-services-guide", desc: "Cloudflare 免费服务怎么用：Workers / Pages / D1 / R2。", language: "Docs", stars: 6, forks: 1, repo: "https://github.com/1837620622/cloudflare-free-services-guide", tags: ["Cloudflare", "教程"] },
    { name: "Overseas-fund-valuation-system", desc: "海外基金估值，两路数据源。", language: "HTML", stars: 5, forks: 0, repo: "https://github.com/1837620622/Overseas-fund-valuation-system", demo: "https://fund.chuankangkk.top/", tags: ["基金", "估值"] },
    { name: "proxypool", desc: "代理池：抓源、测活、再提供 REST API。", language: "JavaScript", stars: 5, forks: 2, repo: "https://github.com/1837620622/proxypool", tags: ["代理池", "API"] },
    { name: "Credit-Card-Generator-and-Validator", desc: "虚拟卡生成和校验（CK Card Tools 源码）。", language: "JavaScript", stars: 2, forks: 0, repo: "https://github.com/1837620622/Credit-Card-Generator-and-Validator", demo: "https://ck-card-tools.vercel.app", tags: ["工具", "React"] },
    { name: "ip-quality-check", desc: "IP 质量 + 流媒体解锁检测。", language: "TypeScript", stars: 0, forks: 0, repo: "https://github.com/1837620622/ip-quality-check", demo: "https://ip-check.chuankangkk.top", tags: ["网络", "检测"] },
    { name: "free-vpn-cknb", desc: "免费 VPN 节点站，订阅源按天同步。", language: "TypeScript", stars: 0, forks: 0, repo: "https://github.com/1837620622/free-vpn-cknb", demo: "https://free-vpn.chuankangkk.top", tags: ["VPN", "情报"] },
    { name: "stripe-email", desc: "邮箱风控检测，给支付场景用。", language: "TypeScript", stars: 1, forks: 0, repo: "https://github.com/1837620622/stripe-email", demo: "https://stripe-email.chuankangkk.top", tags: ["风控", "支付"] },
    { name: "trump", desc: "Truth Social 动态监控和推送。", language: "HTML", stars: 1, forks: 0, repo: "https://github.com/1837620622/trump", demo: "https://trump-x.chuankangkk.top", tags: ["监控", "Workers"] },
    { name: "ai-jiahao", desc: "「谁是 AI 大嘉豪」测评站源码。", language: "JavaScript", stars: 0, forks: 0, repo: "https://github.com/1837620622/ai-jiahao", demo: "https://ai-jiahao.chuankangkk.top/", tags: ["AI", "测评"] },
    { name: "Diviner", desc: "玄机子 AI 算命页源码。", language: "JavaScript", stars: 0, forks: 0, repo: "https://github.com/1837620622/Diviner", demo: "https://diviner.chuankangkk.top/", tags: ["AI", "趣味"] },
    { name: "ck_tv", desc: "CKTV 播放器源码（Next.js）。", language: "TypeScript", stars: 0, forks: 0, repo: "https://github.com/1837620622/ck_tv", demo: "https://tv.chuankangkk.top/", tags: ["视频", "Next.js"] },
    { name: "sport-xiaomi", desc: "小米运动刷步 Web 工具源码。", language: "JavaScript", stars: 0, forks: 0, repo: "https://github.com/1837620622/sport-xiaomi", demo: "https://sport-xiaomi.vercel.app", tags: ["工具", "Vercel"] }
];


/* ===================================================================
   渲染
   =================================================================== */
const totalStars = openSourceProjects.reduce((sum, p) => sum + (Number(p.stars) || 0), 0);
const metrics = {
    live: projects.length,
    repos: PUBLIC_REPOS,
    stars: totalStars
};

function renderProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    const order = ['entertainment', 'tools', 'finance', 'ai'];
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
                <a class="card spot reveal${p.featured ? ' card-featured' : ''}" href="${safeExternalUrl(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="打开项目：${escapeHtml(p.name)}">
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
        const demo = p.demo
            ? `<a class="btn btn-ghost" href="${safeExternalUrl(p.demo)}" target="_blank" rel="noopener noreferrer">在线预览 ${ICON.arrow}</a>`
            : '';
        return `
            <article class="repo-card spot reveal${p.featured ? ' repo-card-featured' : ''}">
                <header class="repo-head">
                    <span class="repo-lang">${escapeHtml(p.language)}</span>
                    <span class="repo-metrics">
                        <span><b>${escapeHtml(p.stars)}</b>stars</span>
                        <span><b>${escapeHtml(p.forks)}</b>forks</span>
                    </span>
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
    if (sourceCount) sourceCount.textContent = `${openSourceProjects.length} 仓 · ${metrics.stars}+ stars`;

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

    // 滚动监听：当前所在区块对应的导航项高亮
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
    const els = Array.from(document.querySelectorAll('[data-metric]:not(.hero [data-metric])'));
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
        document.title = document.hidden ? 'CK Studio | Paused' : PAGE_TITLE;
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

    console.log('%cCK Studio', 'color: #f2f3f5; font-size: 13px; font-weight: 600;');
    console.log('%cGitHub: github.com/1837620622', 'color: #888;');
});
