/* ===== 传康KK Studio 脚本 ===== */

// ===== 项目分类数据 =====
const projectCategories = {
    entertainment: {
        name: "PLAY",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10.5h10l2.3 5.4c.5 1.2-.4 2.6-1.7 2.6-.6 0-1.1-.3-1.5-.7l-1.6-1.8h-5l-1.6 1.8c-.4.5-.9.7-1.5.7-1.3 0-2.2-1.4-1.7-2.6L7 10.5Z"/><path d="M9 13v3M7.5 14.5h3M15.5 14h.01M17.2 15.7h.01"/></svg>'
    },
    tools: {
        name: "TOOLS",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4.5 4.5 0 0 0-5.6 5.6l-4.8 4.8a2 2 0 0 0 2.8 2.8l4.8-4.8a4.5 4.5 0 0 0 5.6-5.6l-3 3-3-3 3.2-2.8Z"/></svg>'
    },
    finance: {
        name: "MARKETS",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M6 18V9M12 18V6M18 18v-5"/><path d="M4 9l8-5 8 5"/></svg>'
    },
    ai: {
        name: "AI",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M10 11.5h.01M14 11.5h.01M10 15h4"/></svg>'
    }
};

// ===== 项目数据 =====
const projects = [
    // ===== 娱乐类 =====
    {
        name: "CKTV 传康播放器",
        desc: "打开就是片场，想看的内容先摆到眼前。",
        url: "https://tv.chuankangkk.top/",
        code: "01",
        tags: ["视频", "影视"],
        category: "entertainment",
        featured: true
    },
    {
        name: "CK Music",
        desc: "音乐、歌词、播放感放在一起，点开就能听。",
        url: "https://ckmusic.chuankangkk.top/",
        code: "02",
        tags: ["音乐", "播放器"],
        category: "entertainment"
    },
    {
        name: "传康云游戏平台",
        desc: "把游戏入口放进浏览器，少一步安装，多一点开局。",
        url: "https://game.chuankangkk.top/",
        code: "03",
        tags: ["游戏", "在线"],
        category: "entertainment",
        featured: true
    },
    {
        name: "传康烟花秀",
        desc: "黑场亮起来，光点和节奏一起炸开。",
        url: "https://yanhua.chuankangkk.top/",
        code: "04",
        tags: ["烟花", "Canvas"],
        category: "entertainment"
    },
    {
        name: "CK 3D 展示",
        desc: "拖动一下再看，空间感会自己说话。",
        url: "https://3d.chuankangkk.top/",
        code: "05",
        tags: ["3D", "可视化", "交互"],
        category: "entertainment"
    },

    // ===== 工具类 =====
    {
        name: "传康KKAPI",
        desc: "常用能力已经接好，拿接口就能继续做。",
        url: "https://api.chuankangkk.top/",
        code: "06",
        tags: ["API", "接口", "免费"],
        category: "tools",
        featured: true
    },
    {
        name: "CK 图床",
        desc: "图片上传，链接返回，素材流转不拖泥带水。",
        url: "https://ck-img.chuankangkk.top/",
        code: "07",
        tags: ["图床", "存储"],
        category: "tools"
    },
    {
        name: "小米运动刷步数",
        desc: "步数入口做得直接，需要时一键处理。",
        url: "https://sport.chuankangkk.top/",
        code: "08",
        tags: ["运动", "工具"],
        category: "tools"
    },
    {
        name: "睡眠助手",
        desc: "睡前打开，声音和节奏都往安静里走。",
        url: "https://sleep-3s3.pages.dev/",
        code: "09",
        tags: ["白噪音", "助眠"],
        category: "tools"
    },
    {
        name: "ProxyPool 代理池",
        desc: "代理采集和输出放在一处，需要就取。",
        url: "https://proxy.chuankangkk.top/",
        code: "10",
        tags: ["代理", "工具"],
        category: "tools"
    },
    {
        name: "IP检测工具",
        desc: "一屏看清出口网络，省掉反复排查。",
        url: "https://ip-check.chuankangkk.top/",
        code: "11",
        tags: ["IP检测", "网络"],
        category: "tools",
        featured: true
    },

    // ===== 金融类 =====
    {
        name: "黄金价格检测系统",
        desc: "金价变化放进看板，波动更早被看见。",
        url: "https://gold.chuankangkk.top/",
        code: "12",
        tags: ["金融", "AI", "量化"],
        category: "finance",
        featured: true
    },
    {
        name: "海外基金估值",
        desc: "海外基金盘中动向集中到一屏，打开就能判断。",
        url: "https://fund.chuankangkk.top/",
        code: "13",
        tags: ["基金", "估值"],
        category: "finance"
    },
    {
        name: "中国基金数据",
        desc: "自选、涨跌、数据入口放在一起，少来回翻。",
        url: "https://fund-cn.chuankangkk.top/",
        code: "14",
        tags: ["基金", "数据分析"],
        category: "finance",
        featured: true
    },

    // ===== AI智能类 =====
    {
        name: "CET6听力预测",
        desc: "把听力趋势做成预测入口，考前少盲猜。",
        url: "https://cet6.chuankangkk.top/",
        code: "15",
        tags: ["六级", "AI预测"],
        category: "ai"
    },
    {
        name: "CK Diviner 占卜师",
        desc: "丢进一个问题，让算法给出有趣的回声。",
        url: "https://diviner.chuankangkk.top/",
        code: "16",
        tags: ["AI", "占卜", "预测"],
        category: "ai"
    },
    {
        name: "Trump-X 情绪分析",
        desc: "一句动态拆成情绪和波动，放进图里看。",
        url: "https://trump-x.chuankangkk.top/",
        code: "17",
        tags: ["AI", "情绪分析", "社交"],
        category: "ai",
        featured: true
    }
];

// ===== GitHub 开源精选数据 =====
const openSourceProjects = [
    {
        name: "cloudflare-bypass-2026",
        desc: "浏览器自动化的硬核样本，流程和实战痕迹都在。",
        language: "Python",
        stars: 367,
        forks: 61,
        repo: "https://github.com/1837620622/cloudflare-bypass-2026",
        tags: ["自动化", "安全研究", "跨平台"],
        featured: true
    },
    {
        name: "windsurf-account-manager-releases",
        desc: "账号切换做成桌面工具，少来回折腾。",
        language: "Desktop",
        stars: 66,
        forks: 5,
        repo: "https://github.com/1837620622/windsurf-account-manager-releases",
        tags: ["桌面工具", "账号管理", "效率"],
        featured: true
    },
    {
        name: "cto-new-openai-proxy",
        desc: "模型接口、账号池、面板连成网关，适合拆架构。",
        language: "Python",
        stars: 32,
        forks: 10,
        repo: "https://github.com/1837620622/cto-new-openai-proxy",
        tags: ["AI接口", "代理服务", "Dashboard"],
        featured: true
    },
    {
        name: "winsurf-switch",
        desc: "更轻的切换入口，动手快，逻辑也清楚。",
        language: "Python",
        stars: 32,
        forks: 3,
        repo: "https://github.com/1837620622/winsurf-switch",
        tags: ["效率工具", "跨平台", "自动化"]
    },
    {
        name: "fund-cn",
        desc: "基金看板从数据到部署都能拆，适合拿来改。",
        language: "JavaScript",
        stars: 21,
        forks: 6,
        repo: "https://github.com/1837620622/fund-cn",
        demo: "https://fund-cn.chuankangkk.top",
        tags: ["金融数据", "实时行情", "Workers"],
        featured: true
    },
    {
        name: "wifi-security-toolkit",
        desc: "无线安全工具箱，偏实战，适合慢慢翻。",
        language: "Shell",
        stars: 16,
        forks: 5,
        repo: "https://github.com/1837620622/wifi-security-toolkit",
        tags: ["网络安全", "审计", "GPU"]
    },
    {
        name: "Gold-Price-Quantitative-Monitoring-System",
        desc: "黄金行情的开源版本，看板和信号都能追。",
        language: "JavaScript",
        stars: 8,
        forks: 5,
        repo: "https://github.com/1837620622/Gold-Price-Quantitative-Monitoring-System",
        demo: "https://gold.chuankangkk.top",
        tags: ["量化分析", "Vue3", "AI"]
    },
    {
        name: "chatgpt-specimen-toolbox",
        desc: "敏感文本留在本地，转换动作在浏览器里完成。",
        language: "JavaScript",
        stars: 5,
        forks: 2,
        repo: "https://github.com/1837620622/chatgpt-specimen-toolbox",
        tags: ["浏览器扩展", "本地处理", "工具箱"]
    },
    {
        name: "proxypool",
        desc: "采集、清洗、接口输出都在，代理池骨架完整。",
        language: "JavaScript",
        stars: 5,
        forks: 1,
        repo: "https://github.com/1837620622/proxypool",
        demo: "https://proxy.chuankangkk.top/",
        tags: ["代理池", "REST API", "Web界面"]
    }
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

// ===== 渲染项目卡片（支持分类） =====
function renderProjects() {
    const gridContainer = document.getElementById('projectGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

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
                    <div class="card-number">// ${escapeHtml(proj.code)}</div>
                    <div class="card-title">${escapeHtml(proj.name)}</div>
                    <div class="card-desc">${escapeHtml(proj.desc)}</div>
                    <div class="card-tags">${tagsHtml}</div>
                </div>
                <div class="card-bottom">
                    ${proj.featured ? '<span class="card-badge">FEATURED</span>' : '<span></span>'}
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
                    <span>${escapeHtml(project.stars)} stars</span>
                    <span>${escapeHtml(project.forks)} forks</span>
                </div>
                <h3>${escapeHtml(project.name)}</h3>
                <p>${escapeHtml(project.desc)}</p>
            </div>
            <div class="repo-tags">${tagsHtml}</div>
            <div class="repo-actions">
                <a href="${safeExternalUrl(project.repo)}" target="_blank" rel="noopener noreferrer" class="repo-action repo-source">开源地址 ${iconExternal}</a>
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
    console.log('%cCK Studio ready.', 'color: #fff; font-size: 14px; font-weight: bold;');
    console.log('%cGitHub: github.com/1837620622 | Email: 2040168455@qq.com', 'color: #888;');
});
