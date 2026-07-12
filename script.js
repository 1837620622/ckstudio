/* ===== 传康KK Studio 脚本 ===== */

// ===== 项目分类数据 =====
const projectCategories = {
    entertainment: {
        name: "娱乐",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10.5h10l2.3 5.4c.5 1.2-.4 2.6-1.7 2.6-.6 0-1.1-.3-1.5-.7l-1.6-1.8h-5l-1.6 1.8c-.4.5-.9.7-1.5.7-1.3 0-2.2-1.4-1.7-2.6L7 10.5Z"/><path d="M9 13v3M7.5 14.5h3M15.5 14h.01M17.2 15.7h.01"/></svg>'
    },
    tools: {
        name: "工具",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4.5 4.5 0 0 0-5.6 5.6l-4.8 4.8a2 2 0 0 0 2.8 2.8l4.8-4.8a4.5 4.5 0 0 0 5.6-5.6l-3 3-3-3 3.2-2.8Z"/></svg>'
    },
    finance: {
        name: "行情",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M6 18V9M12 18V6M18 18v-5"/><path d="M4 9l8-5 8 5"/></svg>'
    },
    ai: {
        name: "AI",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M10 11.5h.01M14 11.5h.01M10 15h4"/></svg>'
    }
};

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

// ===== SVG 图标片段 =====
const iconExternal = '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M10 7h7v7"/></svg>';
const iconArrowRight = '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

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

// ===== 同步页眉数字（以数据数组为准） =====
function syncVaultMetrics() {
    const live = projects.length;
    const openRepos = openSourceProjects.length;
    const totalStars = openSourceProjects.reduce((sum, p) => sum + (Number(p.stars) || 0), 0);

    const worksCount = document.getElementById('worksCount');
    if (worksCount) worksCount.textContent = String(live);

    const sourceCount = document.getElementById('sourceCount');
    if (sourceCount) sourceCount.textContent = `${openRepos} 仓 · ${totalStars}+ stars`;

    document.querySelectorAll('.hero-stats .stat-num').forEach((el, idx) => {
        if (idx === 0) el.setAttribute('data-count', String(live));
        if (idx === 1) el.setAttribute('data-count', '67');
        if (idx === 2) el.setAttribute('data-count', String(Math.max(totalStars, 600)));
    });
}

// ===== 渲染项目卡片（支持分类） =====
function renderProjects() {
    const gridContainer = document.getElementById('projectGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    syncVaultMetrics();

    // 按分类分组项目
    const groupedProjects = {};
    projects.forEach(proj => {
        const cat = proj.category || 'other';
        if (!groupedProjects[cat]) {
            groupedProjects[cat] = [];
        }
        groupedProjects[cat].push(proj);
    });

    // 分类渲染顺序
    const categoryOrder = ['entertainment', 'tools', 'finance', 'ai'];

    categoryOrder.forEach(catKey => {
        const catProjects = groupedProjects[catKey];
        if (!catProjects || catProjects.length === 0) return;

        const catInfo = projectCategories[catKey];

        // 创建分类标题
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <span class="category-icon">${catInfo.icon}</span>
            <span class="category-name">${escapeHtml(catInfo.name)}</span>
            <span class="category-count">(${escapeHtml(catProjects.length)})</span>
        `;
        gridContainer.appendChild(categoryHeader);

        // 渲染该分类下的项目
        catProjects.forEach(proj => {
            const card = document.createElement('a');
            card.href = safeExternalUrl(proj.url);
            card.className = 'card' + (proj.featured ? ' card-featured' : '');
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.setAttribute('aria-label', `打开项目：${proj.name}`);

            const tagsHtml = renderTags(proj.tags);

            card.innerHTML = `
                <div class="card-top">
                    <div class="card-number">${escapeHtml(proj.code)}</div>
                    <div class="card-title">${escapeHtml(proj.name)}</div>
                    <div class="card-desc">${escapeHtml(proj.desc)}</div>
                    <div class="card-tags">${tagsHtml}</div>
                </div>
                <div class="card-bottom">
                    ${proj.featured ? '<span class="card-badge">精选</span>' : '<span></span>'}
                    <span class="card-arrow">${iconExternal}</span>
                </div>
            `;

            gridContainer.appendChild(card);
        });
    });
}

// ===== 渲染开源项目卡片 =====
function renderOpenSourceProjects() {
    const gridContainer = document.getElementById('openSourceGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    openSourceProjects.forEach((project, index) => {
        const card = document.createElement('article');
        card.className = 'repo-card' + (project.featured ? ' repo-card-featured' : '');
        card.style.setProperty('--repo-delay', `${index * 0.05}s`);

        const tagsHtml = renderTags(project.tags);
        const demoLink = project.demo ? `<a href="${safeExternalUrl(project.demo)}" target="_blank" rel="noopener noreferrer" class="repo-action repo-demo">在线预览 ${iconExternal}</a>` : '';

        card.innerHTML = `
            <div class="repo-card-top">
                <div class="repo-meta">
                    <span class="repo-language">${escapeHtml(project.language)}</span>
                    <span class="repo-stars"><span class="repo-metric-num">${escapeHtml(project.stars)}</span> stars</span>
                    <span class="repo-forks"><span class="repo-metric-num">${escapeHtml(project.forks)}</span> forks</span>
                </div>
                <h3>${escapeHtml(project.name)}</h3>
                <p>${escapeHtml(project.desc)}</p>
            </div>
            <div class="repo-tags">${tagsHtml}</div>
            <div class="repo-actions">
                <a href="${safeExternalUrl(project.repo)}" target="_blank" rel="noopener noreferrer" class="repo-action repo-source">仓库 ${iconExternal}</a>
                ${demoLink}
            </div>
        `;

        gridContainer.appendChild(card);
    });
}

let scrollRevealStarted = false;

function startScrollRevealOnce() {
    // 已迁移至 initReveal（基于 reveal class）
}

// ===== 加载动画控制（自主创新版） =====
function initLoader() {
    const loader = document.getElementById('loader');
    const numEl = loader ? loader.querySelector('.loader-num') : null;
    const fillEl = loader ? loader.querySelector('.progress-fill') : null;
    const dots = loader ? Array.from(loader.querySelectorAll('.loader-dots span')) : [];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = performance.now();
    const minDuration = reduceMotion ? 1200 : 3200;
    let completed = false;
    let windowLoaded = document.readyState === 'complete';

    window.addEventListener('load', () => {
        windowLoaded = true;
    }, { once: true });

    const finishLoading = () => {
        if (completed) return;
        completed = true;
        if (loader) loader.classList.add('hidden');
        document.body.classList.remove('is-loading');
        animateHero();
        animateNumbers();
        startScrollRevealOnce();
    };

    const requestFinish = () => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, minDuration - elapsed);
        const waitForWindow = windowLoaded ? 0 : 320;
        window.setTimeout(finishLoading, Math.max(remaining, waitForWindow));
    };

    if (!loader) {
        finishLoading();
        return;
    }

    // 进度驱动：RAF 平滑递进
    const totalSteps = Math.max(1, Math.floor(minDuration / 16));
    let stepIndex = 0;
    const tick = () => {
        if (completed) return;
        stepIndex++;
        const p = Math.min(stepIndex / totalSteps, 1);
        // 缓动（先快后慢）
        const eased = 1 - Math.pow(1 - p, 2.4);
        const value = Math.floor(eased * 100);

        if (numEl) numEl.textContent = value;
        if (fillEl) fillEl.style.width = `${value}%`;

        // 顶部点阵：根据进度点亮对应数量
        const activeCount = Math.floor((value / 100) * dots.length);
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-on', i < activeCount);
        });

        if (p < 1) {
            requestAnimationFrame(tick);
        } else {
            // 收尾：让最后一个点短暂亮起再结束
            dots.forEach(d => d.classList.add('is-on'));
            requestFinish();
        }
    };
    requestAnimationFrame(tick);
}

// ===== 数字递增动画 =====
function animateNumbers() {
    document.querySelectorAll('.stat-num[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        const duration = 900;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
            current += step;
            if (current < target) {
                el.textContent = Math.floor(current);
                requestAnimationFrame(update);
            } else {
                el.textContent = target + (target === 271 ? '+' : '');
            }
        };
        update();
    });
}

// ===== Hero 入场动画 =====
function animateHero() {
    const lines = document.querySelectorAll('h1 .line');
    const heroDesc = document.querySelector('.hero-desc');
    const heroStats = document.querySelector('.hero-stats');
    const heroTag = document.querySelector('.hero-tag');
    const heroBadge = document.querySelector('.hero-badge');
    const heroButtons = document.querySelector('.hero-buttons');
    const visualItems = document.querySelectorAll('.code-block, .repo-panel, .orbit-map');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (window.gsap && !reduceMotion) {
        const tl = gsap.timeline({ defaults: { duration: 0.44, ease: 'power3.out' } });
        tl.from([heroBadge, heroTag], { autoAlpha: 0, y: 18, stagger: 0.08 })
            .from(lines, { autoAlpha: 0, y: 34, stagger: 0.07 }, '-=0.18')
            .from(heroDesc, { autoAlpha: 0, y: 12 }, '-=0.18')
            .from(heroButtons, { autoAlpha: 0, y: 12 }, '-=0.24')
            .from(heroStats, { autoAlpha: 0, y: 16 }, '-=0.24')
            .from(visualItems, { autoAlpha: 0, scale: 0.94, y: 16, stagger: 0.08 }, '-=0.58');
        return;
    }

    [heroBadge, heroTag, heroDesc, heroButtons, heroStats, ...visualItems].forEach(el => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
    lines.forEach(line => {
        line.style.opacity = '1';
        line.style.transform = 'none';
    });
}

// ===== 装饰动效（已迁移至 three-scene.js） =====
function initGsapMotion() {
    // 原 GSAP 装饰动效已由 WebGL 3D 场景接管，此函数保留为空占位
}

// ===== 移动端菜单 =====
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuToggle && mobileMenu) {
        const setMenuOpen = isOpen => {
            mobileMenu.classList.toggle('active', isOpen);
            menuToggle.classList.toggle('active', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
            mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        };

        menuToggle.addEventListener('click', () => {
            setMenuOpen(!mobileMenu.classList.contains('active'));
        });

        // 点击链接关闭菜单
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                setMenuOpen(false);
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
                setMenuOpen(false);
                menuToggle.focus();
            }
        });
    }
}

function initExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.rel = 'noopener noreferrer';
    });
}

function initAvatarFallback() {
    document.querySelectorAll('img[data-fallback]').forEach(img => {
        img.addEventListener('error', () => {
            img.classList.add('avatar-hidden');
            const fallback = document.getElementById(img.dataset.fallback);
            if (fallback) fallback.classList.add('visible');
        }, { once: true });
    });
}

// ===== 复制联系方式 =====
function initCopyContact() {
    document.querySelectorAll('.contact-card[data-copy]').forEach(card => {
        card.addEventListener('click', function() {
            const text = this.getAttribute('data-copy');
            const hint = this.querySelector('.contact-hint');

            navigator.clipboard.writeText(text).then(() => {
                if (hint) {
                    const original = hint.textContent;
                    hint.textContent = '已复制';
                    hint.style.opacity = '1';
                    hint.style.color = '#ffffff';

                    setTimeout(() => {
                        hint.textContent = original;
                        hint.style.color = '';
                    }, 1500);
                }
            });
        });
    });
}

// ===== 鼠标跟随 =====
function initCursor() {
    // 已移除自定义光标（Active Theory 风格不需要）
}

// ===== 平滑滚动 =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== 滚动显示动画 =====
function initScrollReveal() {
    // 已迁移至 initReveal（基于 reveal class）
}

// ===== 页面可见性 =====
function initVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.title = 'CK Studio | Paused';
        } else {
            document.title = 'CK Studio | Motion Web Lab';
        }
    });
}

// =====================================================================
// Active Theory 风格新增功能
// =====================================================================

// ===== Three.js 3D 场景初始化 =====
function initThreeScene() {
    if (window.CKScene && typeof window.CKScene.init === 'function') {
        window.CKScene.init();
    }
}

// ===== 滚动时导航栏变实底 =====
function initScrollNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    let ticking = false;
    const update = () => {
        if (window.scrollY > 60) {
            nav.classList.add('is-stuck');
        } else {
            nav.classList.remove('is-stuck');
        }
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

// ===== 滚动入场动画（IntersectionObserver） =====
function initReveal() {
    if (!('IntersectionObserver' in window)) return;

    const targets = document.querySelectorAll(
        '.section-header, .works-intro, .opensource-intro, .work-card, ' +
        '.repo-row, .about-content, .about-card, .about-right, ' +
        '.contact-hero, .contact-grid, .contact-cta'
    );
    if (targets.length === 0) return;

    targets.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));
}

// ===== 数字滚动计数（用于卡片统计） =====
function initCountUp() {
    const nums = document.querySelectorAll('[data-count]');
    if (nums.length === 0) return;

    const animateNum = (el) => {
        const target = parseFloat(el.getAttribute('data-count')) || 0;
        const duration = 1400;
        const start = performance.now();
        const isFloat = target % 1 !== 0;

        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = target * eased;
            el.textContent = isFloat ? value.toFixed(1) : Math.floor(value);
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = isFloat ? target.toFixed(1) : target;
        };
        requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
        nums.forEach(animateNum);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNum(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    nums.forEach(n => observer.observe(n));
}

// ===== 页面可见性 =====
function initVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.title = 'CK Studio | Paused';
        } else {
            document.title = 'CK Studio | Motion Web Lab';
        }
    });
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    renderOpenSourceProjects();
    initExternalLinks();
    initAvatarFallback();
    initLoader();
    initMobileMenu();
    initCopyContact();
    initSmoothScroll();

    // Active Theory 风格新增
    initThreeScene();
    initScrollNav();
    initReveal();
    initCountUp();

    initVisibilityChange();

    console.log('%c\n  ██████╗██╗  ██╗\n ██╔════╝██║ ██╔╝\n ██║     █████╔╝ \n ██║     ██╔═██╗ \n  ██████╗██║  ██╗\n  ══════╝══╝  ══╝\n', 'color: #fff; font-size: 10px;');
    console.log('%cCK Studio', 'color: #c8ccd2; font-size: 12px;');
    console.log('%cGitHub: github.com/1837620622 | Email: 2040168455@qq.com | WeChat: 1837620622', 'color: #888;');
});
