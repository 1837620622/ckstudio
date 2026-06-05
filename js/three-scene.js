// =====================================================================
// three-scene.js
// 全屏 WebGL 3D 沉浸式背景（参考 activetheory.net 风格）
// 跨 section 渐进式动画：Hero→Works→OpenSource→About→Contact
// 升级版：多层粒子 + 金属切片 + 颗粒 + 鼠标切线闪光
// 中心 CK：多层金属文字 + 抽象切片场，保持黑场里的高级识别度
// =====================================================================

(function () {
  'use strict';

  // ---------------------------------------------------------------
  // 配置参数
  // ---------------------------------------------------------------
  const CONFIG = {
    // 抽象切片场
    ringRadius: 1.6,
    ringTube: 0.045,
    ringColor: 0xd8dce2,
    ringSegments: 256,

    // CK 中心（多层）
    coreSize: 0.95,
    coreColor: '#f5f7fa',
    coreGlowColor: 'rgba(255, 255, 255, 0.55)',

    // 粒子（3 层：远/中/近）
    particleFarCount: 1200,
    particleMidCount: 800,
    particleNearCount: 350,
    particleFarRange: 8.0,
    particleMidRange: 5.0,
    particleNearRange: 2.4,
    particleSize: 0.018,
    particleColors: [
      new THREE.Color(0xffffff),
      new THREE.Color(0xd9dde4),
      new THREE.Color(0x9ca3af),
      new THREE.Color(0x6b7280)
    ],
    particleNearColor: new THREE.Color(0xffffff), // 近景白色

    // 网络节点
    networkNodeCount: 28,
    networkConnectDist: 1.4,

    // 相机
    cameraFov: 45,
    cameraDistance: 5.5,
    parallaxStrength: 0.18,

    // 鼠标波纹
    rippleMax: 5,
    rippleLifeMs: 1800,

    // 状态过渡
    lerpRate: 0.06
  };

  // ---------------------------------------------------------------
  // 状态
  // ---------------------------------------------------------------
  let scene, camera, renderer;
  let ringMesh, ringInnerMesh, ringFarMesh, shardGroup;
  let coreFrontMesh, coreBackMesh, coreGlowMesh;
  let particleSystemFar, particleSystemMid, particleSystemNear;
  let networkGroup, icoMesh, pulseGroup;
  let targetRotation = { x: 0, y: 0 };
  let currentRotation = { x: 0, y: 0 };
  let mouseNDC = { x: 0, y: 0 };
  let scrollY = 0;
  let rafId = null;
  let isVisible = true;
  let isMobile = false;
  let clock = null;

  // 滚动状态
  let scrollProgress = 0;
  let currentScene = 0;

  // 鼠标波纹队列
  const ripples = [];
  let lastRippleTime = 0;

  // 所有可控制对象的当前状态
  const live = {
    ringOpacity: 1,
    ringScale: 1,
    ringTilt: 0,
    ringOffsetX: 0,
    coreOpacity: 1,
    coreScale: 1,
    particleOpacity: 1,
    particleRange: CONFIG.particleFarRange,
    networkOpacity: 0,
    icoOpacity: 0,
    pulseOpacity: 0,
    cameraZ: CONFIG.cameraDistance
  };

  // 目标状态
  const target = {
    ringOpacity: 1,
    ringScale: 1,
    ringTilt: 0,
    ringOffsetX: 0,
    coreOpacity: 1,
    coreScale: 1,
    particleOpacity: 1,
    particleRange: CONFIG.particleFarRange,
    networkOpacity: 0,
    icoOpacity: 0,
    pulseOpacity: 0,
    cameraZ: CONFIG.cameraDistance
  };

  // ---------------------------------------------------------------
  // 设备检测
  // ---------------------------------------------------------------
  function detectDevice() {
    isMobile = window.matchMedia('(max-width: 768px)').matches;
    const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    if (lowPower) isMobile = true;

    if (isMobile) {
      CONFIG.ringRadius = 1.05;
      CONFIG.ringTube = 0.034;
      CONFIG.ringSegments = 144;
      CONFIG.coreSize = 0.92;
      CONFIG.particleFarCount = 150;
      CONFIG.particleMidCount = 80;
      CONFIG.particleNearCount = 28;
      CONFIG.networkNodeCount = 12;
      CONFIG.cameraDistance = 7.0;
      CONFIG.parallaxStrength = 0.06;
      CONFIG.rippleMax = 0;
      CONFIG.lerpRate = 0.05;
    }
  }

  // ---------------------------------------------------------------
  // 初始化
  // ---------------------------------------------------------------
  function init() {
    if (typeof THREE === 'undefined') {
      console.warn('[three-scene] Three.js 未加载，跳过 3D 场景');
      return;
    }
    if (scene) return; // 防重复

    const canvas = document.getElementById('scene-canvas');
    if (!canvas) {
      console.warn('[three-scene] 未找到 #scene-canvas 元素');
      return;
    }

    detectDevice();
    clock = new THREE.Clock();

    // 场景 + 雾化
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 4, 14);

    // 相机
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, aspect, 0.1, 100);
    camera.position.set(0, 0, CONFIG.cameraDistance);

    // 渲染器
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // 灯光
    setupLights();

    // 创建场景对象
    createRings();
    createCoreCK();
    createParticles();
    createNetwork();
    createIcosahedron();
    createPulseRings();

    // 事件
    bindEvents();
    animate();
  }

  // ---------------------------------------------------------------
  // 灯光
  // ---------------------------------------------------------------
  function setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(-3, 4, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd9dde4, 0.36);
    fillLight.position.set(4, -2, 3);
    scene.add(fillLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 14, 1.2);
    pointLight.position.set(0, 3, 2);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x9ca3af, 0.45, 12, 1.4);
    pointLight2.position.set(0, -3, 1.5);
    scene.add(pointLight2);
  }

  // ---------------------------------------------------------------
  // 抽象 CK 切片场：不用圆形轨道，用金属笔画和碎片形成 CK 识别
  // ---------------------------------------------------------------
  function createRings() {
    ringMesh = null;
    ringInnerMesh = null;
    ringFarMesh = null;
    shardGroup = new THREE.Group();

    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const shardMat = new THREE.MeshBasicMaterial({
      color: 0xc7ccd4,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const markMotion = function (mesh, baseY, baseOpacity, speed, phase) {
      mesh.userData.baseY = baseY;
      mesh.userData.baseOpacity = baseOpacity;
      mesh.userData.floatSpeed = speed;
      mesh.userData.floatPhase = phase;
      return mesh;
    };

    const addLine = function (x, y, w, h, rotation, opacity, z) {
      const material = lineMat.clone();
      material.opacity = opacity;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      mesh.position.set(x, y, z || -0.08);
      mesh.rotation.z = rotation || 0;
      markMotion(mesh, y, mesh.material.opacity, 0.18 + Math.random() * 0.18, Math.random() * Math.PI * 2);
      shardGroup.add(mesh);
      return mesh;
    };

    const s = isMobile ? 0.74 : 1;

    // 只保留少量线性扫光，让注意力回到 CK 字体本身。
    addLine(-0.10 * s,  0.42 * s, 1.34 * s, 0.010 * s, -0.05, 0.11, -0.10);
    addLine( 0.10 * s, -0.43 * s, 1.46 * s, 0.010 * s,  0.04, 0.13, -0.10);
    addLine(-0.46 * s,  0.06 * s, 0.54 * s, 0.008 * s, -0.58, 0.12, -0.09);
    addLine( 0.54 * s, -0.05 * s, 0.60 * s, 0.008 * s,  0.62, 0.12, -0.09);
    addLine( 0.18 * s,  0.00 * s, 1.05 * s, 0.006 * s,  0.00, 0.07, -0.12);

    // 少量微碎片只负责空间深度，不再堆成图案。
    const count = isMobile ? 5 : 10;
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963 + 0.72;
      const radius = (isMobile ? 0.72 : 0.95) + ((i % 4) * 0.11);
      const x = Math.cos(angle) * radius * 0.82;
      const y = Math.sin(angle) * radius * 0.46;
      const z = -0.20 - (i % 4) * 0.055;
      const size = (isMobile ? 0.035 : 0.050) + (i % 3) * 0.012;
      const geometry = new THREE.BufferGeometry();
      const skew = (i % 3 - 1) * size * 0.45;
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -size, -size * 0.35, 0,
         size, -size * 0.20, 0,
         skew,  size * 0.65, 0
      ]), 3));
      geometry.computeBoundingSphere();
      const shard = new THREE.Mesh(geometry, shardMat.clone());
      shard.position.set(x, y, z);
      shard.rotation.z = angle * 0.5;
      shard.material.opacity = 0.035 + (i % 3) * 0.015;
      markMotion(shard, y, shard.material.opacity, 0.16 + (i % 5) * 0.045, angle);
      shardGroup.add(shard);
    }

    scene.add(shardGroup);
  }

  // ---------------------------------------------------------------
  // 中心 CK 文字（多层金属质感：背面 + 正面 + 边缘辉光）
  // ---------------------------------------------------------------
  function createCoreCK() {
    // 高分辨率 Canvas 绘制 CK（带多重发光层）
    const c = document.createElement('canvas');
    const W = 1024, H = 512;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    // 透明背景
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2 + 8;
    ctx.font = '900 382px "Space Grotesk", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1) 错位暗面，让 CK 有实体厚度。
    ctx.shadowColor = 'rgba(255, 255, 255, 0.18)';
    ctx.shadowBlur = 48;
    ctx.fillStyle = 'rgba(80, 86, 96, 0.34)';
    ctx.fillText('CK', cx + 18, cy + 18);

    // 2) 外层白光，控制在字体边缘，不铺满画面。
    ctx.shadowColor = 'rgba(255, 255, 255, 0.72)';
    ctx.shadowBlur = 34;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.fillText('CK', cx, cy);

    // 3) 金属主体。
    ctx.shadowBlur = 0;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 18;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeText('CK', cx, cy);

    const grad = ctx.createLinearGradient(160, 70, W - 120, H - 80);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.18, '#9aa1ad');
    grad.addColorStop(0.38, '#ffffff');
    grad.addColorStop(0.58, '#2f333b');
    grad.addColorStop(0.78, '#f8fafc');
    grad.addColorStop(1, '#8a909b');
    ctx.fillStyle = grad;
    ctx.fillText('CK', cx, cy);

    // 4) 内切线：直接切在 CK 字体里，质感来自字本身。
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.translate(cx, cy);
    ctx.rotate(-0.18);
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = '#020309';
    for (let i = -4; i <= 4; i++) {
      ctx.fillRect(-520, i * 58 - 8, 1040, 10);
    }
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = '#ffffff';
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(-500, i * 78 + 12, 1000, 4);
    }
    ctx.restore();

    // 5) 收边高光和深色压边，避免发虚。
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.strokeText('CK', cx + 2, cy + 3);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.strokeText('CK', cx, cy);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
    ctx.strokeText('CK', cx - 4, cy - 4);

    // 共享纹理
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // 文字宽高比 2:1
    const w = CONFIG.coreSize * 1.92;
    const h = w * 0.5;

    // 正面文字（亮 + 可见）
    const frontMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    });
    coreFrontMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), frontMat);
    scene.add(coreFrontMesh);

    // 背面文字（轻暗，制造深度）
    const backMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.20,
      blending: THREE.AdditiveBlending,
      color: 0xd9dde4
    });
    coreBackMesh = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.08, h * 1.08), backMat);
    coreBackMesh.position.z = -0.04;
    scene.add(coreBackMesh);

    // 辉光层（最外层光晕，由 Bloom 放大）
    const glowMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      color: 0xffffff
    });
    coreGlowMesh = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.4, h * 1.4), glowMat);
    coreGlowMesh.position.z = 0.02;
    scene.add(coreGlowMesh);
  }

  // ---------------------------------------------------------------
  // 多层粒子系统（远/中/近 3 层）
  // ---------------------------------------------------------------
  function createParticleLayer(count, range, opacityMultiplier) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const offsets = new Float32Array(count); // 用于动画偏移

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = Math.pow(Math.random(), 0.6) * range;
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = CONFIG.particleColors[Math.floor(Math.random() * CONFIG.particleColors.length)];
      colors[i * 3]     = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = CONFIG.particleSize * (0.3 + Math.random() * 1.8) * opacityMultiplier;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));

    const vertexShader = `
      attribute float aSize;
      attribute float aOffset;
      uniform float uTime;
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec3 pos = position;
        // 微微浮动
        pos.y += sin(uTime * 0.6 + aOffset) * 0.03;
        pos.x += cos(uTime * 0.4 + aOffset * 1.3) * 0.02;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (320.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fragmentShader = `
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, alpha * 0.85 * uOpacity);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1.0 }
      }
    });

    return new THREE.Points(geometry, material);
  }

  function createParticles() {
    // 远层（最暗、最多、最广）
    particleSystemFar = createParticleLayer(
      isMobile ? 400 : CONFIG.particleFarCount,
      CONFIG.particleFarRange,
      0.6
    );
    scene.add(particleSystemFar);

    // 中层
    particleSystemMid = createParticleLayer(
      isMobile ? 250 : CONFIG.particleMidCount,
      CONFIG.particleMidRange,
      1.0
    );
    scene.add(particleSystemMid);

    // 近层（最大、最亮，靠近中心）
    particleSystemNear = createParticleLayer(
      isMobile ? 100 : CONFIG.particleNearCount,
      CONFIG.particleNearRange,
      1.8
    );
    scene.add(particleSystemNear);
  }

  // ---------------------------------------------------------------
  // 网络节点
  // ---------------------------------------------------------------
  function createNetwork() {
    networkGroup = new THREE.Group();
    const nodeGeom = new THREE.SphereGeometry(0.04, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0xd9dde4,
      transparent: true,
      opacity: 0
    });

    const positions = [];
    for (let i = 0; i < CONFIG.networkNodeCount; i++) {
      const x = (Math.random() - 0.5) * 5;
      const y = (Math.random() - 0.5) * 3.5;
      const z = (Math.random() - 0.5) * 2.5;
      positions.push(new THREE.Vector3(x, y, z));
      const node = new THREE.Mesh(nodeGeom, nodeMat.clone());
      node.position.set(x, y, z);
      networkGroup.add(node);
    }

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xd9dde4,
      transparent: true,
      opacity: 0.25
    });
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < CONFIG.networkConnectDist) {
          const geom = new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]);
          const line = new THREE.Line(geom, lineMat);
          line.userData.baseOpacity = 0.25;
          networkGroup.add(line);
        }
      }
    }

    scene.add(networkGroup);
  }

  // ---------------------------------------------------------------
  // 二十面体
  // ---------------------------------------------------------------
  function createIcosahedron() {
    const geom = new THREE.IcosahedronGeometry(1.2, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xb8bec8,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x1a1c21,
      emissiveIntensity: 0.25,
      wireframe: true,
      transparent: true,
      opacity: 0
    });
    icoMesh = new THREE.Mesh(geom, mat);
    scene.add(icoMesh);
  }

  // ---------------------------------------------------------------
  // 联系区弱光切线组
  // ---------------------------------------------------------------
  function createPulseRings() {
    pulseGroup = new THREE.Group();
    const count = isMobile ? 4 : 7;
    for (let i = 0; i < count; i++) {
      const geom = new THREE.PlaneGeometry(0.7 + i * 0.12, 0.006);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xd9dde4,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const line = new THREE.Mesh(geom, mat);
      line.position.y = (i - (count - 1) / 2) * 0.13;
      line.rotation.z = -0.24 + i * 0.08;
      line.userData.phase = i / count;
      line.userData.baseY = line.position.y;
      pulseGroup.add(line);
    }
    pulseGroup.position.z = -0.2;
    scene.add(pulseGroup);
  }

  // ---------------------------------------------------------------
  // 鼠标切线闪光（点击/移动时在中心 CK 周围快速掠过）
  // ---------------------------------------------------------------
  function spawnRipple() {
    if (ripples.length >= CONFIG.rippleMax) return;
    const geom = new THREE.PlaneGeometry(0.34 + Math.random() * 0.18, 0.009);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const slash = new THREE.Mesh(geom, mat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.34 + Math.random() * 0.38;
    slash.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.04);
    slash.rotation.z = angle + Math.PI * 0.35;
    slash.userData.bornAt = performance.now();
    slash.userData.baseX = slash.position.x;
    slash.userData.baseY = slash.position.y;
    slash.userData.driftX = Math.cos(angle) * 0.42;
    slash.userData.driftY = Math.sin(angle) * 0.28;
    scene.add(slash);
    ripples.push(slash);
  }

  function updateRipples(nowMs) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      const age = nowMs - r.userData.bornAt;
      const t = age / CONFIG.rippleLifeMs;
      if (t >= 1) {
        scene.remove(r);
        r.geometry.dispose();
        r.material.dispose();
        ripples.splice(i, 1);
        continue;
      }
      r.position.x = r.userData.baseX + r.userData.driftX * t;
      r.position.y = r.userData.baseY + r.userData.driftY * t;
      r.scale.x = 1 + t * 2.4;
      r.scale.y = Math.max(0.25, 1 - t * 0.55);
      r.material.opacity = (1 - t) * 0.55;
    }
  }

  // ---------------------------------------------------------------
  // 后处理方案（不依赖 jsm 模块，纯几何多层 + 自发光）
  // 视觉增强：
  //   1. 3 层 CK 自发光（背面/正面/辉光层）通过 AdditiveBlending 叠加
  //   2. 金属切片 + 3 层粒子（远/中/近）
  //   3. 鼠标点击触发切线闪光
  //   4. ACES Filmic Tone Mapping 提供电影感色调
  // ---------------------------------------------------------------

  // ---------------------------------------------------------------
  // 事件绑定
  // ---------------------------------------------------------------
  function bindEvents() {
    if (!isMobile) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('click', onClick, { passive: true });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 150);
    });

    document.addEventListener('visibilitychange', function () {
      isVisible = !document.hidden;
      if (isVisible && !rafId) animate();
    });
  }

  function onMouseMove(e) {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    targetRotation.y = mouseNDC.x * CONFIG.parallaxStrength;
    targetRotation.x = mouseNDC.y * CONFIG.parallaxStrength;

    // 移动时偶尔触发波纹
    const now = performance.now();
    if (now - lastRippleTime > 220 && Math.random() < 0.04) {
      spawnRipple();
      lastRippleTime = now;
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    mouseNDC.x = (t.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(t.clientY / window.innerHeight) * 2 + 1;
    targetRotation.y = mouseNDC.x * CONFIG.parallaxStrength * 0.6;
    targetRotation.x = mouseNDC.y * CONFIG.parallaxStrength * 0.6;
  }

  function onClick() {
    spawnRipple();
  }

  function onScroll() {
    scrollY = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
    currentScene = Math.min(4, Math.floor(scrollProgress * 5));
    updateSceneTargets();
  }

  function onResize() {
    if (!camera || !renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  // ---------------------------------------------------------------
  // 跨 section 目标状态
  // ---------------------------------------------------------------
  function updateSceneTargets() {
    if (currentScene === 0) {
      target.ringOpacity = 1; target.ringScale = 1; target.ringTilt = 0; target.ringOffsetX = 0;
      target.coreOpacity = 1; target.coreScale = 1;
      target.particleOpacity = 1; target.particleRange = CONFIG.particleFarRange;
      target.networkOpacity = 0; target.icoOpacity = 0; target.pulseOpacity = 0;
      target.cameraZ = CONFIG.cameraDistance;
    } else if (currentScene === 1) {
      target.ringOpacity = 0.3; target.ringScale = 0.6; target.ringTilt = 0.5; target.ringOffsetX = 2.0;
      target.coreOpacity = 0.35; target.coreScale = 0.6;
      target.particleOpacity = 0.75; target.particleRange = CONFIG.particleFarRange * 1.2;
      target.networkOpacity = 0; target.icoOpacity = 0; target.pulseOpacity = 0;
      target.cameraZ = CONFIG.cameraDistance * 0.95;
    } else if (currentScene === 2) {
      target.ringOpacity = 0.15; target.ringScale = 0.5; target.ringTilt = 0.8; target.ringOffsetX = -2.0;
      target.coreOpacity = 0.2; target.coreScale = 0.4;
      target.particleOpacity = 0.55; target.particleRange = CONFIG.particleFarRange * 1.1;
      target.networkOpacity = 0.95; target.icoOpacity = 0; target.pulseOpacity = 0;
      target.cameraZ = CONFIG.cameraDistance * 1.05;
    } else if (currentScene === 3) {
      target.ringOpacity = 0.12; target.ringScale = 0.45; target.ringTilt = -0.4; target.ringOffsetX = 2.0;
      target.coreOpacity = 0.15; target.coreScale = 0.35;
      target.particleOpacity = 0.6; target.particleRange = CONFIG.particleFarRange * 0.9;
      target.networkOpacity = 0.3; target.icoOpacity = 1; target.pulseOpacity = 0;
      target.cameraZ = CONFIG.cameraDistance * 0.9;
    } else if (currentScene === 4) {
      target.ringOpacity = 0.18; target.ringScale = 0.4; target.ringTilt = 0; target.ringOffsetX = 0;
      target.coreOpacity = 0.45; target.coreScale = 0.6;
      target.particleOpacity = 0.85; target.particleRange = CONFIG.particleFarRange * 0.8;
      target.networkOpacity = 0.15; target.icoOpacity = 0.15; target.pulseOpacity = 1;
      target.cameraZ = CONFIG.cameraDistance;
    }
  }

  // ---------------------------------------------------------------
  // 渲染循环
  // ---------------------------------------------------------------
  function animate() {
    if (!isVisible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(animate);

    const dt = clock ? clock.getDelta() : 0.016;
    const t = clock ? clock.elapsedTime : performance.now() * 0.001;
    const rate = CONFIG.lerpRate;

    // 状态插值
    live.ringOpacity   += (target.ringOpacity   - live.ringOpacity)   * rate;
    live.ringScale     += (target.ringScale     - live.ringScale)     * rate;
    live.ringTilt      += (target.ringTilt      - live.ringTilt)      * rate;
    live.ringOffsetX   += (target.ringOffsetX   - live.ringOffsetX)   * rate;
    live.coreOpacity   += (target.coreOpacity   - live.coreOpacity)   * rate;
    live.coreScale     += (target.coreScale     - live.coreScale)     * rate;
    live.particleOpacity += (target.particleOpacity - live.particleOpacity) * rate;
    live.particleRange += (target.particleRange - live.particleRange) * rate;
    live.networkOpacity += (target.networkOpacity - live.networkOpacity) * rate;
    live.icoOpacity    += (target.icoOpacity    - live.icoOpacity)    * rate;
    live.pulseOpacity  += (target.pulseOpacity  - live.pulseOpacity)  * rate;
    live.cameraZ       += (target.cameraZ       - live.cameraZ)       * rate;

    // 鼠标视差
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;

    // 主外环
    if (ringMesh) {
      ringMesh.rotation.z = t * 0.3 + currentRotation.y * 0.4;
      ringMesh.rotation.y = currentRotation.x * 0.5 + live.ringTilt;
      ringMesh.position.x = live.ringOffsetX;
      ringMesh.material.opacity = live.ringOpacity;
      ringMesh.scale.setScalar(live.ringScale);
    }
    if (ringInnerMesh) {
      ringInnerMesh.rotation.z = -t * 0.5 + Math.PI / 4 + currentRotation.y * 0.3;
      ringInnerMesh.rotation.x = 0.3 + currentRotation.x * 0.4 - live.ringTilt * 0.3;
      ringInnerMesh.position.x = live.ringOffsetX;
      ringInnerMesh.material.opacity = live.ringOpacity * 0.9;
      ringInnerMesh.scale.setScalar(live.ringScale);
    }
    if (ringFarMesh) {
      ringFarMesh.rotation.z = t * 0.15;
      ringFarMesh.rotation.y = -t * 0.1 + currentRotation.x * 0.2;
      ringFarMesh.position.x = live.ringOffsetX;
      ringFarMesh.material.opacity = live.ringOpacity * 0.4;
      ringFarMesh.scale.setScalar(live.ringScale);
    }

    if (shardGroup) {
      const shardScale = (isMobile ? 0.92 : 1) * (0.9 + live.ringScale * 0.1);
      const coreX = isMobile ? 0 : 0.48;
      shardGroup.scale.setScalar(shardScale);
      shardGroup.rotation.z = Math.sin(t * 0.28) * 0.025 + currentRotation.y * 0.08 + live.ringTilt * 0.04;
      shardGroup.rotation.x = currentRotation.x * 0.05;
      shardGroup.position.x = coreX + live.ringOffsetX * 0.08;
      shardGroup.children.forEach(function (child, i) {
        if (!child.material) return;
        const base = child.userData.baseOpacity !== undefined ? child.userData.baseOpacity : 0.16;
        const speed = child.userData.floatSpeed || 0.25;
        const phase = child.userData.floatPhase || i;
        const pulse = 0.84 + Math.sin(t * speed + phase) * 0.16;
        child.material.opacity = base * live.ringOpacity * live.coreOpacity * pulse;
        child.position.y = child.userData.baseY + Math.sin(t * speed + phase) * 0.014;
      });
    }

    // 中心 CK（三层）
    const breath = 1 + Math.sin(t * 1.5) * 0.04;
    [coreFrontMesh, coreBackMesh, coreGlowMesh].forEach((m, i) => {
      if (!m) return;
      const coreX = isMobile ? 0 : 0.48;
      m.lookAt(camera.position);
      m.scale.setScalar(live.coreScale * breath);
      m.position.x = coreX + live.ringOffsetX * 0.05;
      const factor = i === 0 ? 1.0 : (i === 1 ? 0.5 : 0.4);
      m.material.opacity = live.coreOpacity * factor;
    });

    // 粒子（3 层）
    [
      { sys: particleSystemFar,  speed: 0.04, range: CONFIG.particleFarRange },
      { sys: particleSystemMid,  speed: 0.07, range: CONFIG.particleMidRange },
      { sys: particleSystemNear, speed: 0.12, range: CONFIG.particleNearRange }
    ].forEach(({ sys, speed, range }) => {
      if (!sys) return;
      sys.rotation.y = t * speed;
      sys.rotation.x = currentRotation.x * 0.3;
      sys.rotation.z = currentRotation.y * 0.3;
      if (sys.material && sys.material.uniforms) {
        sys.material.uniforms.uTime.value = t;
        sys.material.uniforms.uOpacity.value = live.particleOpacity;
      }
    });

    // 网络节点
    if (networkGroup) {
      networkGroup.rotation.y = t * 0.12;
      networkGroup.rotation.x = -t * 0.05 + currentRotation.x * 0.2;
      networkGroup.children.forEach(function (child) {
        if (child.material) {
          const base = child.userData.baseOpacity !== undefined ? child.userData.baseOpacity : 0.95;
          child.material.opacity = base * live.networkOpacity;
        }
      });
    }

    // 二十面体
    if (icoMesh) {
      icoMesh.rotation.x = t * 0.4;
      icoMesh.rotation.y = t * 0.3;
      icoMesh.material.opacity = live.icoOpacity;
    }

    // 联系区弱光切线
    if (pulseGroup) {
      const pulseT = t;
      pulseGroup.children.forEach(function (line, i) {
        const phase = (pulseT * 0.45 + line.userData.phase) % 1;
        line.position.y = line.userData.baseY + Math.sin(pulseT * 0.55 + i) * 0.03;
        line.position.x = (phase - 0.5) * 0.7;
        line.scale.x = 0.7 + phase * 1.2;
        line.material.opacity = (1 - phase) * live.pulseOpacity * 0.36;
      });
    }

    // 鼠标波纹
    updateRipples(performance.now());

    // 相机
    if (camera) {
      camera.position.z = live.cameraZ;
      camera.lookAt(0, 0, 0);
    }

    // 渲染
    renderer.render(scene, camera);
  }

  // ---------------------------------------------------------------
  // 销毁
  // ---------------------------------------------------------------
  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
    }
    if (scene) {
      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          if (obj.material.uniforms) {
            // ShaderMaterial 释放
          }
          obj.material.dispose();
        }
      });
    }
  }
  window.addEventListener('beforeunload', destroy);

  // ---------------------------------------------------------------
  // 暴露 API
  // ---------------------------------------------------------------
  window.CKScene = {
    init: init,
    destroy: destroy,
    isReady: function () { return scene !== undefined; },
    getScene: function () { return currentScene; }
  };

  function bootstrap() {
    if (typeof THREE !== 'undefined') {
      init();
      onScroll();
    } else {
      let attempts = 0;
      const timer = setInterval(function () {
        attempts++;
        if (typeof THREE !== 'undefined') {
          clearInterval(timer);
          init();
          onScroll();
        } else if (attempts > 50) {
          clearInterval(timer);
          console.warn('[three-scene] Three.js 加载超时');
        }
      }, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
