/* ===== 传康KK Studio 脚本 ===== */

// ===== 项目数据 =====
const projects = [
    { 
        name: "CKTV 传康播放器", 
        desc: "在线视频播放平台，支持电影、剧集、综艺分类浏览，豆瓣热门推荐", 
        url: "https://tv.chuankangkk.top/", 
        code: "01",
        tags: ["视频", "影视"],
        featured: true
    },
    { 
        name: "CK Music", 
        desc: "在线音乐播放器，支持多音源切换，歌词同步显示", 
        url: "https://ckmusic.chuankangkk.top/", 
        code: "02",
        tags: ["音乐", "播放器"]
    },
    { 
        name: "CK 图床", 
        desc: "免费图片/视频托管服务，基于Cloudflare构建", 
        url: "https://ck-img.chuankangkk.top/", 
        code: "03",
        tags: ["图床", "存储"]
    },
    { 
        name: "小米运动刷步数", 
        desc: "智能运动数据管理工具，支持Zepp API", 
        url: "https://sport.chuankangkk.top/", 
        code: "04",
        tags: ["运动", "工具"]
    },
    { 
        name: "传康KKAPI", 
        desc: "稳定、快速、免费的API接口服务平台，收录271+个实用接口", 
        url: "https://api.chuankangkk.top/", 
        code: "05",
        tags: ["API", "接口", "免费"],
        featured: true
    },
    { 
        name: "传康烟花秀", 
        desc: "精美的在线烟花动画效果，沉浸式视听体验", 
        url: "https://yanhua.chuankangkk.top/", 
        code: "06",
        tags: ["烟花", "Canvas"]
    },
    { 
        name: "睡眠助手", 
        desc: "白噪音助眠应用，30+精选声音，定时关闭", 
        url: "https://sleep-3s3.pages.dev/", 
        code: "07",
        tags: ["白噪音", "助眠"]
    },
    { 
        name: "CET6听力预测", 
        desc: "AI驱动的六级听力预测系统，9年历史数据分析", 
        url: "https://cet6.chuankangkk.top/", 
        code: "08",
        tags: ["六级", "AI预测"]
    },
    { 
        name: "ProxyPool 代理池", 
        desc: "高质量免费代理池，45000+代理IP", 
        url: "https://proxy.chuankangkk.top/", 
        code: "09",
        tags: ["代理", "工具"]
    },
    { 
        name: "海外基金估值", 
        desc: "实时海外基金估值查询，数据分析可视化", 
        url: "https://fund.chuankangkk.top/", 
        code: "10",
        tags: ["基金", "估值"]
    },
    { 
        name: "传康云游戏平台", 
        desc: "80+款在线小游戏，涵盖益智、动作、射击等多种类型", 
        url: "https://game.chuankangkk.top/", 
        code: "11",
        tags: ["游戏", "在线"],
        featured: true
    },
    { 
        name: "黄金价格检测系统", 
        desc: "AI量化分析黄金价格，实时行情监控，DeepSeek驱动", 
        url: "https://gold.chuankangkk.top/", 
        code: "12",
        tags: ["金融", "AI", "量化"],
        featured: true
    }
];

// ===== 渲染项目卡片 =====
function renderProjects() {
    const gridContainer = document.getElementById('projectGrid');
    if (!gridContainer) return;

    projects.forEach(proj => {
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
                <span class="card-arrow">↗</span>
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

// ===== 加载动画控制 =====
function initLoader() {
    const loader = document.getElementById('loader');
    const percent = document.querySelector('.loader-percent');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        if (percent) percent.textContent = Math.floor(progress) + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                if (loader) loader.classList.add('hidden');
                animateHero();
                animateNumbers();
            }, 500);
        }
    }, 100);
}

// ===== 数字递增动画 =====
function animateNumbers() {
    document.querySelectorAll('.stat-num[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        const duration = 2000;
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
    
    // 简单的CSS动画
    if (heroTag) {
        heroTag.style.opacity = '0';
        heroTag.style.transform = 'translateY(20px)';
        setTimeout(() => {
            heroTag.style.transition = 'all 0.8s ease';
            heroTag.style.opacity = '1';
            heroTag.style.transform = 'translateY(0)';
        }, 100);
    }
    
    lines.forEach((line, index) => {
        line.style.opacity = '0';
        line.style.transform = 'translateY(50px)';
        setTimeout(() => {
            line.style.transition = 'all 0.8s ease';
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
        }, 200 + index * 150);
    });
    
    if (heroDesc) {
        heroDesc.style.opacity = '0';
        setTimeout(() => {
            heroDesc.style.transition = 'all 0.8s ease';
            heroDesc.style.opacity = '1';
        }, 600);
    }
    
    if (heroStats) {
        heroStats.style.opacity = '0';
        heroStats.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroStats.style.transition = 'all 0.8s ease';
            heroStats.style.opacity = '1';
            heroStats.style.transform = 'translateY(0)';
        }, 800);
    }
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
    
    let mouseX = 0, mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });
    
    // 悬停效果
    document.querySelectorAll('a, button, .card, .contact-card, .skill-tag').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
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
    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.05}s`;
        observer.observe(card);
    });
    
    // 观察区块
    document.querySelectorAll('.about-content, .contact-content').forEach(el => {
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
            document.title = '快回来看看 👀 | CK Studio';
        } else {
            document.title = '传康KK Studio | Creative Developer';
        }
    });
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    initLoader();
    initMobileMenu();
    initCopyContact();
    initSmoothScroll();
    initCursor();
    
    // 延迟执行滚动动画初始化
    setTimeout(initScrollReveal, 2500);
    
    initVisibilityChange();
    
    console.log('%c\n  ██████╗██╗  ██╗\n ██╔════╝██║ ██╔╝\n ██║     █████╔╝ \n ██║     ██╔═██╗ \n  ██████╗██║  ██╗\n  ══════╝══╝  ══╝\n', 'color: #fff; font-size: 10px;');
    console.log('%cCK Studio 已加载完成!', 'color: #fff; font-size: 14px; font-weight: bold;');
    console.log('%cGitHub: github.com/1837620622 | Email: 2040168455@qq.com', 'color: #888;');
});
