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
        name: "金融",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M6 18V9M12 18V6M18 18v-5"/><path d="M4 9l8-5 8 5"/></svg>'
    },
    ai: {
        name: "AI智能",
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M10 11.5h.01M14 11.5h.01M10 15h4"/></svg>'
    }
};

// ===== 项目数据 =====
const projects = [
    // ===== 娱乐类 =====
    {
        name: "CKTV 传康播放器",
        desc: "片荒的时候点这里，热门内容和播放入口都准备好了。",
        url: "https://tv.chuankangkk.top/",
        code: "01",
        tags: ["视频", "影视"],
        category: "entertainment",
        featured: true
    },
    {
        name: "CK Music",
        desc: "戴上耳机再打开，歌、词和节奏会自己对上。",
        url: "https://ckmusic.chuankangkk.top/",
        code: "02",
        tags: ["音乐", "播放器"],
        category: "entertainment"
    },
    {
        name: "传康云游戏平台",
        desc: "不用安装，不用等待，点进去就能开一局。",
        url: "https://game.chuankangkk.top/",
        code: "03",
        tags: ["游戏", "在线"],
        category: "entertainment",
        featured: true
    },
    {
        name: "传康烟花秀",
        desc: "黑屏亮起来的那一刻，烟花会替你把气氛拉满。",
        url: "https://yanhua.chuankangkk.top/",
        code: "04",
        tags: ["烟花", "Canvas"],
        category: "entertainment"
    },
    {
        name: "CK 3D 展示",
        desc: "拖动一下，空间感会比文字更快说话。",
        url: "https://3d.chuankangkk.top/",
        code: "05",
        tags: ["3D", "可视化", "交互"],
        category: "entertainment"
    },

    // ===== 工具类 =====
    {
        name: "传康KKAPI",
        desc: "需要能力时别从零开始，这里已经接好一排接口。",
        url: "https://api.chuankangkk.top/",
        code: "06",
        tags: ["API", "接口", "免费"],
        category: "tools",
        featured: true
    },
    {
        name: "CK 图床",
        desc: "把素材丢进去，拿到链接就走，干净利落。",
        url: "https://ck-img.chuankangkk.top/",
        code: "07",
        tags: ["图床", "存储"],
        category: "tools"
    },
    {
        name: "小米运动刷步数",
        desc: "步数想动一下的时候，这个入口最直接。",
        url: "https://sport.chuankangkk.top/",
        code: "08",
        tags: ["运动", "工具"],
        category: "tools"
    },
    {
        name: "睡眠助手",
        desc: "把声音调低一点，给睡前留一块安静区域。",
        url: "https://sleep-3s3.pages.dev/",
        code: "09",
        tags: ["白噪音", "助眠"],
        category: "tools"
    },
    {
        name: "ProxyPool 代理池",
        desc: "代理不用到处翻，打开就能取。",
        url: "https://proxy.chuankangkk.top/",
        code: "10",
        tags: ["代理", "工具"],
        category: "tools"
    },
    {
        name: "IP检测工具",
        desc: "当前网络从哪里出去，一打开就看清楚。",
        url: "https://ip-check.chuankangkk.top/",
        code: "11",
        tags: ["IP检测", "网络"],
        category: "tools",
        featured: true
    },

    // ===== 金融类 =====
    {
        name: "黄金价格检测系统",
        desc: "金价跳动的时候，这块屏幕会先给出信号。",
        url: "https://gold.chuankangkk.top/",
        code: "12",
        tags: ["金融", "AI", "量化"],
        category: "finance",
        featured: true
    },
    {
        name: "海外基金估值",
        desc: "盘中想看海外基金动向，打开就有答案。",
        url: "https://fund.chuankangkk.top/",
        code: "13",
        tags: ["基金", "估值"],
        category: "finance"
    },
    {
        name: "中国基金数据",
        desc: "自选基金放到一张屏上，涨跌不用来回翻。",
        url: "https://fund-cn.chuankangkk.top/",
        code: "14",
        tags: ["基金", "数据分析"],
        category: "finance",
        featured: true
    },

    // ===== AI智能类 =====
    {
        name: "CET6听力预测",
        desc: "考前想抓重点，先让历史数据说话。",
        url: "https://cet6.chuankangkk.top/",
        code: "15",
        tags: ["六级", "AI预测"],
        category: "ai"
    },
    {
        name: "CK Diviner 占卜师",
        desc: "问一个问题，看看算法会给出什么暗号。",
        url: "https://diviner.chuankangkk.top/",
        code: "16",
        tags: ["AI", "占卜", "预测"],
        category: "ai"
    },
    {
        name: "Trump-X 情绪分析",
        desc: "一句动态背后的情绪和波动，放到图里看。",
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
        desc: "想研究浏览器自动化，这个仓库值得拆开看。",
        language: "Python",
        stars: 367,
        forks: 61,
        repo: "https://github.com/1837620622/cloudflare-bypass-2026",
        tags: ["自动化", "安全研究", "跨平台"],
        featured: true
    },
    {
        name: "windsurf-account-manager-releases",
        desc: "账号切换这件麻烦事，被整理成一个桌面面板。",
        language: "Desktop",
        stars: 66,
        forks: 5,
        repo: "https://github.com/1837620622/windsurf-account-manager-releases",
        tags: ["桌面工具", "账号管理", "效率"],
        featured: true
    },
    {
        name: "cto-new-openai-proxy",
        desc: "把模型接口、账号池和面板串起来，入口更像网关。",
        language: "Python",
        stars: 32,
        forks: 10,
        repo: "https://github.com/1837620622/cto-new-openai-proxy",
        tags: ["AI接口", "代理服务", "Dashboard"],
        featured: true
    },
    {
        name: "winsurf-switch",
        desc: "想切号快一点，这个小工具就是为它存在的。",
        language: "Python",
        stars: 32,
        forks: 3,
        repo: "https://github.com/1837620622/winsurf-switch",
        tags: ["效率工具", "跨平台", "自动化"]
    },
    {
        name: "fund-cn",
        desc: "行情怎么来、页面怎么跑、部署怎么接，都能看到。",
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
        desc: "偏硬核的无线安全工具箱，适合慢慢翻。",
        language: "Shell",
        stars: 16,
        forks: 5,
        repo: "https://github.com/1837620622/wifi-security-toolkit",
        tags: ["网络安全", "审计", "GPU"]
    },
    {
        name: "Gold-Price-Quantitative-Monitoring-System",
        desc: "把黄金行情做成开源看板，信号就在页面里跳。",
        language: "JavaScript",
        stars: 8,
        forks: 5,
        repo: "https://github.com/1837620622/Gold-Price-Quantitative-Monitoring-System",
        demo: "https://gold.chuankangkk.top",
        tags: ["量化分析", "Vue3", "AI"]
    },
    {
        name: "chatgpt-specimen-toolbox",
        desc: "敏感数据不出本地，转换动作就在浏览器里完成。",
        language: "JavaScript",
        stars: 5,
        forks: 2,
        repo: "https://github.com/1837620622/chatgpt-specimen-toolbox",
        tags: ["浏览器扩展", "本地处理", "工具箱"]
    },
    {
        name: "proxypool",
        desc: "从采集到接口输出，一套代理池的骨架都在这里。",
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
            <span class="category-name">${catInfo.name}</span>
            <span class="category-count">(${catProjects.length})</span>
        `;
        gridContainer.appendChild(categoryHeader);

        // 渲染该分类下的项目
        catProjects.forEach(proj => {
            const card = document.createElement('a');
            card.href = proj.url;
            card.className = 'card' + (proj.featured ? ' card-featured' : '');
            card.target = '_blank';

            const tagsHtml = proj.tags.map(tag => `<span>${tag}</span>`).join('');

            card.innerHTML = `
                <div class="card-top">
                    <div class="card-number">// ${proj.code}</div>
                    <div class="card-title">${proj.name}</div>
                    <div class="card-desc">${proj.desc}</div>
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

        const tagsHtml = project.tags.map(tag => `<span>${tag}</span>`).join('');
        const demoLink = project.demo ? `<a href="${project.demo}" target="_blank" class="repo-action repo-demo">在线预览 ${iconExternal}</a>` : '';

        card.innerHTML = `
            <div class="repo-card-top">
                <div class="repo-meta">
                    <span class="repo-language">${project.language}</span>
                    <span>${project.stars} stars</span>
                    <span>${project.forks} forks</span>
                </div>
                <h3>${project.name}</h3>
                <p>${project.desc}</p>
            </div>
            <div class="repo-tags">${tagsHtml}</div>
            <div class="repo-actions">
                <a href="${project.repo}" target="_blank" class="repo-action repo-source">开源地址 ${iconExternal}</a>
                ${demoLink}
            </div>
        `;

        gridContainer.appendChild(card);
    });
}

let scrollRevealStarted = false;

function startScrollRevealOnce() {
    if (scrollRevealStarted) return;
    scrollRevealStarted = true;
    window.setTimeout(initScrollReveal, 180);
}

// ===== 加载动画控制 =====
function initLoader() {
    const loader = document.getElementById('loader');
    const percent = document.querySelector('.loader-percent');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = performance.now();
    const minDuration = reduceMotion ? 1200 : 5000;
    let completed = false;
    let windowLoaded = document.readyState === 'complete';

    window.addEventListener('load', () => {
        windowLoaded = true;
    }, { once: true });

    const finishLoading = () => {
        if (completed) return;
        completed = true;
        if (loader) loader.classList.add('hidden');
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

    if (percent) percent.textContent = '0%';

    if (window.gsap && !reduceMotion) {
        window.setTimeout(requestFinish, 6500);
        const progressState = { value: 0 };
        const drawTargets = loader.querySelectorAll('.loader-draw, .loader-ring');

        drawTargets.forEach(target => {
            const length = typeof target.getTotalLength === 'function' ? target.getTotalLength() : 680;
            gsap.set(target, {
                strokeDasharray: length,
                strokeDashoffset: length
            });
        });

        gsap.set('.loader-starfield circle', { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' });
        gsap.set('.loader-frame-line, .loader-shard', { autoAlpha: 0 });
        gsap.set('.loader-core-frame, .loader-core-grid, .loader-ck-text, .loader-halo', { autoAlpha: 0, scale: 0.92, transformOrigin: '50% 50%' });
        gsap.set('.loader-scan', { autoAlpha: 0, x: -44 });
        gsap.set('.loader-hud', { autoAlpha: 0, y: 16 });
        gsap.set('.progress-fill', { scaleX: 0, transformOrigin: 'left center' });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.to(progressState, {
            value: 100,
            duration: 4.45,
            ease: 'power2.inOut',
            onUpdate: () => {
                if (percent) percent.textContent = `${Math.round(progressState.value)}%`;
            }
        }, 0)
            .to('.progress-fill', { scaleX: 1, duration: 4.45, ease: 'power2.inOut' }, 0)
            .to('.loader-starfield circle', {
                autoAlpha: 1,
                scale: 1,
                duration: 0.9,
                stagger: { each: 0.035, from: 'random' }
            }, 0.05)
            .to(drawTargets, {
                strokeDashoffset: 0,
                duration: 2.0,
                stagger: { each: 0.055, from: 'center' }
            }, 0.22)
            .to('.loader-frame-line, .loader-shard', {
                autoAlpha: 1,
                duration: 0.7,
                stagger: { each: 0.05, from: 'center' }
            }, 0.62)
            .to('.loader-halo', { autoAlpha: 1, scale: 1, duration: 0.9 }, 0.82)
            .to('.loader-core-frame, .loader-core-grid', {
                autoAlpha: 1,
                scale: 1,
                duration: 1.0,
                stagger: 0.08
            }, 1.05)
            .to('.loader-ck-text', { autoAlpha: 1, scale: 1, duration: 0.76, ease: 'back.out(1.35)' }, 1.52)
            .to('.loader-scan', { autoAlpha: 1, x: 44, duration: 1.2, ease: 'power2.inOut' }, 1.75)
            .to('.loader-hud', { autoAlpha: 1, y: 0, duration: 0.62 }, 2.05)
            .to('.loader-ring-a', { rotation: 42, transformOrigin: '50% 50%', duration: 2.25 }, 2.0)
            .to('.loader-ring-b', { rotation: -48, transformOrigin: '50% 50%', duration: 2.25 }, 2.0)
            .to('.loader-ring-c', { rotation: 34, transformOrigin: '50% 50%', duration: 2.25 }, 2.0)
            .to('.loader-scene', { scale: 1.045, duration: 1.15, ease: 'power2.inOut' }, 3.42)
            .to(loader, { autoAlpha: 0, duration: 0.62, ease: 'power2.inOut' }, 4.72)
            .call(requestFinish);
        return;
    }

    let progress = 0;
    const interval = setInterval(() => {
        progress += 8;
        if (progress > 100) progress = 100;
        if (percent) percent.textContent = `${progress}%`;

        if (progress >= 100) {
            clearInterval(interval);
            requestFinish();
        }
    }, 48);
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

// ===== GSAP 装饰动效 =====
function initGsapMotion() {
    if (!window.gsap) return;

    const mm = gsap.matchMedia();
    mm.add(
        {
            canMove: '(prefers-reduced-motion: no-preference)',
            isDesktop: '(min-width: 861px)',
            finePointer: '(hover: hover) and (pointer: fine)'
        },
        context => {
            const { canMove, isDesktop, finePointer } = context.conditions;
            if (!canMove) {
                gsap.set('.bg-letter, .orbit-ring, .ck-backdrop-svg *', { clearProps: 'all' });
                return;
            }

            gsap.set('.ck-vector-lines path, .ck-scan-bars path, .ck-data-arcs path', {
                strokeDasharray: '18 24'
            });
            gsap.set('.ck-starfield circle', {
                autoAlpha: isDesktop ? 0.5 : 0.28,
                scale: 1,
                transformOrigin: '50% 50%'
            });
            gsap.set('.ck-nodes circle, .orbit-nodes circle', {
                autoAlpha: isDesktop ? 0.74 : 0.42,
                scale: 1,
                transformOrigin: '50% 50%'
            });

            if (!isDesktop) {
                gsap.to('.ck-backdrop-svg', { autoAlpha: 0.42, duration: 0.8, ease: 'power2.out' });
                gsap.to('.bg-letter', {
                    autoAlpha: 0.24,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: 'power2.out'
                });
                return;
            }

            gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 7.5, ease: 'sine.inOut' } })
                .to('.bg-letter:first-child', { y: -10, rotationY: -5 }, 0)
                .to('.bg-letter:nth-child(2)', { y: 10, rotationY: 5 }, 0)
                .to('.hero-bg-text', { scale: 1.025 }, 0);

            gsap.to('.ck-orbit-lines ellipse', {
                rotation: index => (index % 2 === 0 ? 360 : -360),
                transformOrigin: '50% 50%',
                duration: index => 72 + index * 16,
                repeat: -1,
                ease: 'none'
            });

            gsap.to('.ck-vector-lines path, .ck-scan-bars path', {
                strokeDashoffset: '-=160',
                duration: index => 16 + index * 0.8,
                repeat: -1,
                ease: 'none',
                stagger: { amount: 0.7, from: 'center' }
            });

            gsap.to('.ck-data-arcs path', {
                autoAlpha: 0.24,
                duration: 5.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: { amount: 1.2, from: 'edges' }
            });

            gsap.to('.ck-starfield circle', {
                autoAlpha: 0.18,
                scale: 1.28,
                transformOrigin: '50% 50%',
                duration: 4.4,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: { amount: 1.8, from: 'random' }
            });

            gsap.to('.ck-nodes circle', {
                scale: 1.18,
                autoAlpha: 0.42,
                transformOrigin: '50% 50%',
                repeat: -1,
                yoyo: true,
                duration: 3.8,
                stagger: { amount: 1.0, from: 'random' },
                ease: 'sine.inOut'
            });

            gsap.to('.orbit-ring-1', { rotation: 360, transformOrigin: '50% 50%', duration: 82, repeat: -1, ease: 'none' });
            gsap.to('.orbit-ring-2', { rotation: -360, transformOrigin: '50% 50%', duration: 96, repeat: -1, ease: 'none' });
            gsap.to('.orbit-ring-3', { rotation: 360, transformOrigin: '50% 50%', duration: 112, repeat: -1, ease: 'none' });

            if (finePointer) {
                gsap.to('.repo-panel', { y: -6, duration: 4.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            }
            gsap.to('.brand-scan', {
                x: 18,
                autoAlpha: 0.34,
                duration: 4.6,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            gsap.to('.logo-mark', {
                y: -1,
                duration: 5.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }
    );
}

// ===== 移动端菜单 =====
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // 点击链接关闭菜单
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }
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
                    hint.textContent = '✓ 已复制!';
                    hint.style.opacity = '1';
                    hint.style.color = '#00ff88';

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
    const cursor = document.querySelector('.cursor-follower');
    if (!cursor) return;

    const canUseCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canUseCustomCursor) {
        cursor.style.display = 'none';
        document.body.style.cursor = 'auto';
        return;
    }

    document.body.style.cursor = 'none';

    let latestX = window.innerWidth / 2;
    let latestY = window.innerHeight / 2;
    let cssVarFrame = 0;
    let fallbackFrame = 0;
    let hoverScale = 1;

    const syncSpotlight = () => {
        document.documentElement.style.setProperty('--cursor-x', `${latestX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${latestY}px`);
        cssVarFrame = 0;
    };

    const moveFallback = () => {
        cursor.style.transform = `translate3d(${latestX}px, ${latestY}px, 0) scale(${hoverScale})`;
        fallbackFrame = 0;
    };

    let moveX = value => {
        latestX = value;
        if (!fallbackFrame) fallbackFrame = requestAnimationFrame(moveFallback);
    };
    let moveY = value => {
        latestY = value;
        if (!fallbackFrame) fallbackFrame = requestAnimationFrame(moveFallback);
    };

    if (window.gsap) {
        gsap.set(cursor, { x: latestX, y: latestY, scale: 1 });
        moveX = gsap.quickTo(cursor, 'x', { duration: 0.14, ease: 'power3.out' });
        moveY = gsap.quickTo(cursor, 'y', { duration: 0.14, ease: 'power3.out' });
    }

    document.addEventListener('mousemove', (e) => {
        latestX = e.clientX;
        latestY = e.clientY;
        moveX(e.clientX);
        moveY(e.clientY);
        if (!cssVarFrame) cssVarFrame = requestAnimationFrame(syncSpotlight);
    }, { passive: true });

    // 悬停效果
    document.querySelectorAll('a, button, .card, .repo-card, .contact-card, .skill-tag, .github-source-link').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            hoverScale = 1.14;
            if (window.gsap) gsap.to(cursor, { scale: 1.14, duration: 0.16, ease: 'power2.out', overwrite: 'auto' });
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            hoverScale = 1;
            if (window.gsap) gsap.to(cursor, { scale: 1, duration: 0.16, ease: 'power2.out', overwrite: 'auto' });
        });
    });
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
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 观察项目卡片
    document.querySelectorAll('.card, .repo-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.05}s`;
        observer.observe(card);
    });

    // 观察区块
    document.querySelectorAll('.about-content, .contact-content, .opensource-intro').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s ease';
        observer.observe(el);
    });
}

// ===== 页面可见性 =====
function initVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.title = '快回来看看 | CK Studio';
        } else {
            document.title = '传康KK Studio | Creative Developer';
        }
    });
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    renderOpenSourceProjects();
    initLoader();
    initGsapMotion();
    initMobileMenu();
    initCopyContact();
    initSmoothScroll();
    initCursor();

    initVisibilityChange();

    console.log('%c\n  ██████╗██╗  ██╗\n ██╔════╝██║ ██╔╝\n ██║     █████╔╝ \n ██║     ██╔═██╗ \n  ██████╗██║  ██╗\n  ══════╝══╝  ══╝\n', 'color: #fff; font-size: 10px;');
    console.log('%cCK Studio 已加载完成!', 'color: #fff; font-size: 14px; font-weight: bold;');
    console.log('%cGitHub: github.com/1837620622 | Email: 2040168455@qq.com', 'color: #888;');
});
