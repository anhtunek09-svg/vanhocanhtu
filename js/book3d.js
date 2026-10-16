/**
 * VĂN 12 PRO LAB — 3D TEXTBOOK CONTROLLER (Three.js WebGL)
 * Realistic 3D Model of "SGK Ngữ văn 12 - Kết nối tri thức với cuộc sống (Tập 1)"
 * Developer: Đỗ Anh Tú — THPT Yên Lãng
 */

(function (window) {
  'use strict';

  const Book3D = {
    scene: null,
    camera: null,
    renderer: null,
    bookGroup: null,
    shadowMesh: null,
    lights: {
      ambient: null,
      key: null,
      rim: null,
      fill: null
    },
    materials: [],
    geometries: [],
    textures: [],
    
    // Animation & State
    isInitialized: false,
    isRunning: false,
    animationFrameId: null,
    clock: null,
    isVisible: true,
    isAutoRotating: true,
    isDragging: false,
    hasReducedMotion: false,

    // Angles & Offsets (3/4 beauty view)
    baseAngles: { x: 0.06, y: -0.32, z: -0.015 },
    currentRotation: { x: 0.06, y: -0.32, z: -0.015 },
    targetRotation: { x: 0.06, y: -0.32, z: -0.015 },
    mouseOffset: { x: 0, y: 0 },
    dragStart: { x: 0, y: 0 },
    dragRotationStart: { x: 0, y: 0 },
    lastInteractionTime: 0,
    
    // Entrance animation
    entranceProgress: 0,

    /**
     * Check WebGL support
     */
    isWebGLAvailable() {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    },

    /**
     * Initialize Three.js scene & book model
     */
    init(canvasId = 'book-3d-canvas', containerId = 'book-3d-wrapper') {
      if (this.isInitialized) {
        this.isVisible = true;
        this.startAnimation();
        this.handleResize();
        this.render();
        return;
      }

      const canvas = document.getElementById(canvasId);
      const container = document.getElementById(containerId);
      const fallback = document.getElementById('book-fallback-container');

      if (!canvas || !container) {
        console.warn('[Book3D] Canvas or container not found.');
        return;
      }

      this.canvas = canvas;
      this.container = container;

      // Check Three.js availability & WebGL
      if (!window.THREE || !this.isWebGLAvailable()) {
        console.warn('[Book3D] Three.js or WebGL not available. Showing fallback image.');
        if (fallback) fallback.classList.remove('hidden');
        if (canvas) canvas.classList.add('hidden');
        return;
      }

      // Check prefers-reduced-motion
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.hasReducedMotion = mediaQuery.matches;
        if (this.hasReducedMotion) this.isAutoRotating = false;
        mediaQuery.addEventListener('change', (e) => {
          this.hasReducedMotion = e.matches;
          if (this.hasReducedMotion) this.isAutoRotating = false;
        });
      } catch (err) {}

      this.clock = new THREE.Clock();

      // Setup Scene
      this.scene = new THREE.Scene();

      // Setup Camera
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 480;
      this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 6.7);

      // Setup Renderer
      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        
        if (THREE.ACESFilmicToneMapping) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1.06;
        }
        if (THREE.SRGBColorSpace) {
          this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
          this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
      } catch (e) {
        console.error('[Book3D] WebGLRenderer init failed:', e);
        if (fallback) fallback.classList.remove('hidden');
        if (canvas) canvas.classList.add('hidden');
        return;
      }

      // Setup Lighting
      this.setupLighting();

      // Load Texture & Build Model
      this.loadBookCoverTexture('assets/bia-ngu-van-12.jpg', (texture, coverAspect) => {
        this.createBookModel(texture, coverAspect);
        this.setupEventListeners(container);
        this.isInitialized = true;
        this.startAnimation();
      });

      // Synchronize with current theme
      const isDark = document.documentElement.classList.contains('dark');
      this.setTheme(isDark);
    },

    /**
     * Lighting setup (Key, Rim, Fill, Ambient)
     */
    setupLighting() {
      const isDark = document.documentElement.classList.contains('dark');

      // Soft ambient light
      this.lights.ambient = new THREE.AmbientLight(0xFFFFFF, isDark ? 0.72 : 0.95);
      this.scene.add(this.lights.ambient);

      // Key light: crisp front-right illumination
      this.lights.key = new THREE.DirectionalLight(0xFFFFFF, 1.28);
      this.lights.key.position.set(3.5, 4.5, 5.0);
      this.scene.add(this.lights.key);

      // Rim light: electric indigo / slate rim for spine and paper edges
      const rimColor = isDark ? 0x818CF8 : 0x94A3B8;
      this.lights.rim = new THREE.DirectionalLight(rimColor, isDark ? 0.7 : 0.42);
      this.lights.rim.position.set(-4.8, 2.2, -2.8);
      this.scene.add(this.lights.rim);

      // Fill light: subtle cyan bounce from lower front
      this.lights.fill = new THREE.DirectionalLight(0x38BDF8, isDark ? 0.35 : 0.22);
      this.lights.fill.position.set(2.0, -3.0, 3.2);
      this.scene.add(this.lights.fill);
    },

    /**
     * Load & automatically trim textbook cover texture
     */
    loadBookCoverTexture(imageSrc, onLoaded) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        let finalTexture = null;
        let aspect = 2.4 / 3.3; // standard ~0.727

        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0);

          // Find non-white margins (crops white side bars from square product images)
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;
          let minX = w, maxX = 0;
          let minY = h, maxY = 0;

          // Sample pixels every 4px
          for (let y = 10; y < h - 10; y += 4) {
            for (let x = 0; x < w; x += 4) {
              const idx = (y * w + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              // If pixel is darker than off-white background
              if (r < 236 || g < 236 || b < 236) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          // If crop region detected
          if (maxX > minX + 50 && (minX > 10 || maxX < w - 10)) {
            const cropX = Math.min(minX + 1, maxX);
            const cropY = Math.min(minY + 1, maxY);
            const cropW = Math.max(20, maxX - cropX);
            const cropH = Math.max(20, maxY - cropY);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            const cropCtx = cropCanvas.getContext('2d');
            cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            finalTexture = new THREE.CanvasTexture(cropCanvas);
            aspect = cropW / cropH;
          }
        } catch (err) {
          console.warn('[Book3D] Auto-crop failed, loading texture directly:', err);
        }

        if (!finalTexture) {
          const loader = new THREE.TextureLoader();
          finalTexture = loader.load(imageSrc);
        }

        if (THREE.SRGBColorSpace) {
          finalTexture.colorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
          finalTexture.encoding = THREE.sRGBEncoding;
        }
        finalTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        this.textures.push(finalTexture);

        onLoaded(finalTexture, aspect);
      };

      img.onerror = () => {
        console.warn('[Book3D] Texture failed to load image element, using TextureLoader fallback.');
        const loader = new THREE.TextureLoader();
        loader.load(imageSrc, (texture) => {
          if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
          else if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
          onLoaded(texture, 2.4 / 3.3);
        }, undefined, () => {
          // If all texture loading fails, create an artistic procedural fallback texture
          const fallbackTexture = this.createFallbackProceduralTexture();
          onLoaded(fallbackTexture, 2.4 / 3.3);
        });
      };

      img.src = imageSrc;
    },

    /**
     * Create procedural page edges texture (stratified book paper)
     */
    createPageEdgeTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base warm ivory paper
      ctx.fillStyle = '#FAF7EE';
      ctx.fillRect(0, 0, 128, 512);

      // Fine stratified horizontal micro-lines
      for (let y = 0; y < 512; y += 2) {
        const shade = Math.random() > 0.4 ? 'rgba(215, 207, 190, 0.45)' : 'rgba(235, 229, 215, 0.35)';
        ctx.fillStyle = shade;
        ctx.fillRect(0, y, 128, 1);
      }

      // Subtle edge darkening on the spine side
      const grad = ctx.createLinearGradient(0, 0, 128, 0);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
      grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.04)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 512);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.textures.push(texture);
      return texture;
    },

    /**
     * Create soft drop shadow texture
     */
    createDropShadowTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      this.textures.push(texture);
      return texture;
    },

    /**
     * Procedural backup texture in case image file cannot be loaded
     */
    createFallbackProceduralTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 840;
      const ctx = canvas.getContext('2d');

      // Olive-brown background
      ctx.fillStyle = '#635B31';
      ctx.fillRect(0, 0, 600, 840);

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 58px serif';
      ctx.textAlign = 'center';
      ctx.fillText('NGỮ VĂN', 300, 220);

      // Orange badge 12
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(430, 260, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('12', 430, 275);

      const texture = new THREE.CanvasTexture(canvas);
      this.textures.push(texture);
      return texture;
    },

    /**
     * Build the realistic 3D book model
     */
    createBookModel(coverTexture, coverAspect = 0.727) {
      this.bookGroup = new THREE.Group();

      const bookHeight = 3.3;
      // Keep natural textbook proportions based on cover aspect ratio
      const bookWidth = Math.min(2.55, Math.max(2.2, bookHeight * coverAspect));
      const bookDepth = 0.25; // paper thickness + covers
      const coverThickness = 0.024;
      const coverOverhang = 0.038; // protruding hardcover edge

      // 1. RUỘT SÁCH (Page Block)
      const pageBlockW = bookWidth - coverOverhang;
      const pageBlockH = bookHeight - (2 * coverOverhang);
      const pageBlockD = bookDepth - (2 * coverThickness);
      const pageGeo = new THREE.BoxGeometry(pageBlockW, pageBlockH, pageBlockD);
      this.geometries.push(pageGeo);

      const pageEdgeTex = this.createPageEdgeTexture();
      const pageEdgeMat = new THREE.MeshStandardMaterial({
        map: pageEdgeTex,
        roughness: 0.9,
        metalness: 0.0
      });
      const pageCoverMat = new THREE.MeshStandardMaterial({
        color: 0xF7F4EB,
        roughness: 0.85,
        metalness: 0.0
      });
      this.materials.push(pageEdgeMat, pageCoverMat);

      // 6-face materials for page block
      // 0: Right (outer page edges), 1: Left (spine glued side), 2: Top (page edges), 3: Bottom (page edges), 4: Front, 5: Back
      const pageMaterials = [
        pageEdgeMat,  // right
        pageCoverMat, // left (spine glue)
        pageEdgeMat,  // top
        pageEdgeMat,  // bottom
        pageCoverMat, // front
        pageCoverMat  // back
      ];

      const pageMesh = new THREE.Mesh(pageGeo, pageMaterials);
      pageMesh.name = 'pageBlock';
      // Shift slightly forward to align with spine on the left
      pageMesh.position.set(coverOverhang / 2, 0, 0);
      this.bookGroup.add(pageMesh);

      // Olive-brown palette matching cover
      const oliveBrownColor = 0x645B32;
      const spineColor = 0x584F2A;
      const innerPaperColor = 0xF5F2E8;

      const coverSideMat = new THREE.MeshStandardMaterial({
        color: oliveBrownColor,
        roughness: 0.45,
        metalness: 0.04
      });
      const innerEndpaperMat = new THREE.MeshStandardMaterial({
        color: innerPaperColor,
        roughness: 0.82,
        metalness: 0.0
      });
      this.materials.push(coverSideMat, innerEndpaperMat);

      // 2. BÌA TRƯỚC (Front Cover)
      const frontCoverGeo = new THREE.BoxGeometry(bookWidth, bookHeight, coverThickness);
      this.geometries.push(frontCoverGeo);

      const frontFaceMat = new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.40,
        metalness: 0.03
      });
      this.materials.push(frontFaceMat);

      // 6 faces: [right, left, top, bottom, front (+z), back (-z)]
      const frontCoverMats = [
        coverSideMat,    // right edge
        coverSideMat,    // left edge
        coverSideMat,    // top edge
        coverSideMat,    // bottom edge
        frontFaceMat,    // front face (+z) -> Textbook Cover
        innerEndpaperMat // inside face (-z) -> Endpaper
      ];

      const frontCoverMesh = new THREE.Mesh(frontCoverGeo, frontCoverMats);
      frontCoverMesh.name = 'frontCover';
      frontCoverMesh.position.set(0, 0, (bookDepth / 2) - (coverThickness / 2));
      this.bookGroup.add(frontCoverMesh);

      // 3. BÌA SAU (Back Cover)
      const backCoverGeo = new THREE.BoxGeometry(bookWidth, bookHeight, coverThickness);
      this.geometries.push(backCoverGeo);

      const backFaceMat = new THREE.MeshStandardMaterial({
        color: oliveBrownColor,
        roughness: 0.48,
        metalness: 0.02
      });
      this.materials.push(backFaceMat);

      const backCoverMats = [
        coverSideMat,    // right edge
        coverSideMat,    // left edge
        coverSideMat,    // top edge
        coverSideMat,    // bottom edge
        innerEndpaperMat,// inside face (+z)
        backFaceMat      // back face (-z)
      ];

      const backCoverMesh = new THREE.Mesh(backCoverGeo, backCoverMats);
      backCoverMesh.name = 'backCover';
      backCoverMesh.position.set(0, 0, -(bookDepth / 2) + (coverThickness / 2));
      this.bookGroup.add(backCoverMesh);

      // 4. GÁY SÁCH (Book Spine)
      const spineWidth = coverThickness * 1.5;
      const spineGeo = new THREE.BoxGeometry(spineWidth, bookHeight, bookDepth + 0.004);
      this.geometries.push(spineGeo);

      const spineMat = new THREE.MeshStandardMaterial({
        color: spineColor,
        roughness: 0.46,
        metalness: 0.06
      });
      this.materials.push(spineMat);

      const spineMesh = new THREE.Mesh(spineGeo, spineMat);
      spineMesh.name = 'bookSpine';
      spineMesh.position.set(-(bookWidth / 2) - (spineWidth * 0.28), 0, 0);
      this.bookGroup.add(spineMesh);

      // 3 Decorative embossed ridge bands on the spine (gân gáy sách)
      const ridgeGeo = new THREE.BoxGeometry(spineWidth * 1.05, 0.028, bookDepth + 0.008);
      this.geometries.push(ridgeGeo);
      const ridgeMat = new THREE.MeshStandardMaterial({
        color: 0x766A39,
        roughness: 0.38,
        metalness: 0.12
      });
      this.materials.push(ridgeMat);

      [-0.9, 0.0, 0.9].forEach(yPos => {
        const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.position.set(-(bookWidth / 2) - (spineWidth * 0.28), yPos, 0);
        this.bookGroup.add(ridge);
      });

      // 5. MẶT BÓNG ĐỔ MỀM (Soft Ground Shadow Plane)
      const shadowTex = this.createDropShadowTexture();
      const shadowGeo = new THREE.PlaneGeometry(3.6, 2.4);
      this.geometries.push(shadowGeo);

      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: document.documentElement.classList.contains('dark') ? 0.48 : 0.22,
        depthWrite: false
      });
      this.materials.push(shadowMat);

      this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      this.shadowMesh.name = 'dropShadow';
      this.shadowMesh.rotation.x = -Math.PI / 2;
      this.shadowMesh.position.set(0, -(bookHeight / 2) - 0.28, 0);
      this.scene.add(this.shadowMesh);

      // Set initial entrance rotation (starts offset, smoothly eases into view)
      this.currentRotation.x = this.baseAngles.x;
      this.currentRotation.y = this.baseAngles.y - 0.45;
      this.currentRotation.z = this.baseAngles.z;
      this.bookGroup.rotation.set(this.currentRotation.x, this.currentRotation.y, this.currentRotation.z);
      this.bookGroup.position.set(0, -0.15, 0);

      this.scene.add(this.bookGroup);
    },

    /**
     * Setup user interactions (mouse parallax, touch/mouse drag, buttons)
     */
    setupEventListeners(container) {
      const hero = document.getElementById('hero') || container;

      // Mouse Parallax
      hero.addEventListener('mousemove', (e) => {
        if (this.isDragging) return;
        const rect = hero.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        this.mouseOffset.x = normX * 0.24;
        this.mouseOffset.y = -normY * 0.16;
      });

      hero.addEventListener('mouseleave', () => {
        this.mouseOffset.x = 0;
        this.mouseOffset.y = 0;
      });

      // Drag to rotate on canvas (pointer events)
      const canvas = this.renderer.domElement;
      canvas.style.touchAction = 'pan-y'; // Crucial: Never blocks vertical page scrolling

      const onPointerDown = (e) => {
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.dragRotationStart.x = this.currentRotation.x;
        this.dragRotationStart.y = this.currentRotation.y;
        this.lastInteractionTime = performance.now();
        canvas.style.cursor = 'grabbing';
      };

      const onPointerMove = (e) => {
        if (!this.isDragging) return;
        const deltaX = (e.clientX - this.dragStart.x) * 0.0075;
        const deltaY = (e.clientY - this.dragStart.y) * 0.005;

        // Limit angles so book never spins away or shows empty back for long
        const newY = this.dragRotationStart.y + deltaX;
        const newX = this.dragRotationStart.x - deltaY;

        this.targetRotation.y = THREE.MathUtils.clamp(newY, -1.25, 0.65);
        this.targetRotation.x = THREE.MathUtils.clamp(newX, -0.28, 0.38);
        this.lastInteractionTime = performance.now();
      };

      const onPointerUp = () => {
        if (this.isDragging) {
          this.isDragging = false;
          canvas.style.cursor = 'grab';
          this.lastInteractionTime = performance.now();
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      // WebGL Context Loss Recovery
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.pauseAnimation();
      }, false);
      canvas.addEventListener('webglcontextrestored', () => {
        this.isInitialized = false;
        this.init();
      }, false);

      // ResizeObserver
      const resizeObserver = new ResizeObserver(() => {
        this.handleResize(container);
      });
      resizeObserver.observe(container);

      // IntersectionObserver: Pause rendering when Hero is scrolled out of viewport
      const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
          if (this.isVisible) {
            if (!this.isRunning) {
              this.startAnimation();
            } else {
              this.render();
            }
          }
        });
      }, { threshold: 0.05 });
      intersectionObserver.observe(hero);

      // Window blur / focus
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAnimation();
        } else if (this.isVisible) {
          this.startAnimation();
        }
      });

      // Control Buttons
      const toggleRotateBtn = document.getElementById('btn-toggle-book-rotate');
      const rotateLabel = document.getElementById('label-book-rotate');
      if (toggleRotateBtn) {
        toggleRotateBtn.addEventListener('click', () => {
          this.isAutoRotating = !this.isAutoRotating;
          if (rotateLabel) {
            rotateLabel.textContent = this.isAutoRotating ? 'Tự xoay: Bật' : 'Tự xoay: Tắt';
          }
          toggleRotateBtn.classList.toggle('active', this.isAutoRotating);
        });
      }

      const resetViewBtn = document.getElementById('btn-reset-book-view');
      if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
          this.targetRotation.x = this.baseAngles.x;
          this.targetRotation.y = this.baseAngles.y;
          this.targetRotation.z = this.baseAngles.z;
          this.mouseOffset.x = 0;
          this.mouseOffset.y = 0;
          this.isAutoRotating = true;
          if (rotateLabel) rotateLabel.textContent = 'Tự xoay: Bật';
        });
      }
    },

    /**
     * Handle responsive container resize
     */
    handleResize(container) {
      const targetContainer = container || this.container || document.getElementById('book-3d-wrapper');
      if (!this.renderer || !this.camera || !targetContainer) return;
      const width = targetContainer.clientWidth;
      const height = targetContainer.clientHeight;
      if (!width || !height) return; // Ignore when container is hidden (display: none)

      this.camera.aspect = width / height;
      
      // Adjust camera distance for smaller mobile screens so the book fills view properly
      if (width < 480) {
        this.camera.position.z = 7.3;
      } else if (width < 768) {
        this.camera.position.z = 6.9;
      } else {
        this.camera.position.z = 6.6;
      }
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    },

    /**
     * Update lighting & shadows for Dark / Light mode
     */
    setTheme(isDark) {
      if (!this.lights.ambient) return;

      this.lights.ambient.intensity = isDark ? 0.72 : 0.95;
      this.lights.key.intensity = isDark ? 1.28 : 1.15;
      
      if (this.lights.rim) {
        this.lights.rim.color.setHex(isDark ? 0x818CF8 : 0x94A3B8);
        this.lights.rim.intensity = isDark ? 0.7 : 0.42;
      }
      if (this.lights.fill) {
        this.lights.fill.intensity = isDark ? 0.35 : 0.22;
      }
      if (this.shadowMesh) {
        this.shadowMesh.material.opacity = isDark ? 0.48 : 0.22;
      }
    },

    /**
     * Animation Loop
     */
    startAnimation() {
      this.isVisible = true;
      if (this.isRunning) {
        // Force an immediate render frame in case canvas was unhidden
        this.render();
        return;
      }
      this.isRunning = true;
      if (this.clock) this.clock.start();

      const loop = () => {
        if (!this.isRunning) return;
        this.animationFrameId = requestAnimationFrame(loop);
        if (this.isVisible) {
          this.render();
        }
      };
      loop();
    },

    pauseAnimation() {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    },

    /**
     * Single frame render
     */
    render() {
      if (!this.renderer || !this.scene || !this.camera || !this.bookGroup) return;

      const delta = this.clock ? this.clock.getDelta() : 0.016;
      const elapsed = this.clock ? this.clock.getElapsedTime() : 0;

      // 1. Entrance animation (smooth glide-in)
      if (this.entranceProgress < 1) {
        this.entranceProgress = Math.min(1, this.entranceProgress + delta * 1.2);
        const ease = 1 - Math.pow(1 - this.entranceProgress, 3);
        this.bookGroup.position.y = -0.15 + (ease * 0.15);
      } else {
        // Subtle floating oscillation
        if (!this.hasReducedMotion) {
          const floatOffset = Math.sin(elapsed * 1.35) * 0.045;
          this.bookGroup.position.y = floatOffset;
          if (this.shadowMesh) {
            // Shadow scale and opacity reacts to floating
            const shadowScale = 1.0 - (floatOffset * 1.4);
            this.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
          }
        }
      }

      // 2. Compute Target Rotation
      if (this.isDragging) {
        // Controlled directly by pointer
      } else {
        const timeSinceDrag = performance.now() - this.lastInteractionTime;
        // Resume auto-breathing rotation 2.2s after user stops dragging
        if (this.isAutoRotating && !this.hasReducedMotion && timeSinceDrag > 2200) {
          const autoYaw = Math.sin(elapsed * 0.72) * 0.18; // gentle oscillation
          this.targetRotation.y = this.baseAngles.y + autoYaw + this.mouseOffset.x;
          this.targetRotation.x = this.baseAngles.x + this.mouseOffset.y;
        } else {
          this.targetRotation.x = this.baseAngles.x + this.mouseOffset.y;
          this.targetRotation.y = this.baseAngles.y + this.mouseOffset.x;
        }
      }

      // 3. Smooth Damping (Lerp)
      const lerpSpeed = this.isDragging ? 0.14 : 0.055;
      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * lerpSpeed;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * lerpSpeed;
      this.currentRotation.z += (this.targetRotation.z - this.currentRotation.z) * lerpSpeed;

      this.bookGroup.rotation.x = this.currentRotation.x;
      this.bookGroup.rotation.y = this.currentRotation.y;
      this.bookGroup.rotation.z = this.currentRotation.z;

      // 4. Render Scene
      this.renderer.render(this.scene, this.camera);
    },

    /**
     * Clean disposal of Three.js resources
     */
    dispose() {
      this.pauseAnimation();
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.remove();
      }
      this.geometries.forEach(g => g.dispose());
      this.materials.forEach(m => m.dispose());
      this.textures.forEach(t => t.dispose());
      this.geometries = [];
      this.materials = [];
      this.textures = [];
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.bookGroup = null;
      this.isInitialized = false;
    }
  };

  // Expose to global window
  window.Book3D = Book3D;

})(window);
