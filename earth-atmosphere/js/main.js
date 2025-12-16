import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLOR_HADLEY = 0xf3a45a;
const COLOR_FERREL = 0xff7ad1;
const COLOR_POLAR = 0x6ee7c8;

// Fallback URLs for textures
const TEXTURE_EARTH = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
const TEXTURE_CLOUDS = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png';
const TEXTURE_NORMAL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg';
const TEXTURE_SPECULAR = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg';

const LATITUDES = [
    { lat: 0, labelKey: 'earth_lbl_equator', color: COLOR_HADLEY },
    { lat: 30, labelKey: 'earth_lbl_subtrop', color: COLOR_HADLEY },
    { lat: 60, labelKey: 'earth_lbl_subpolar', color: COLOR_FERREL },
    { lat: 90, labelKey: 'earth_lbl_polar', color: COLOR_POLAR }
];

class GlobalCirculationApp {
    constructor() {
        this.canvas = document.getElementById('scene-canvas');
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.streamGroups = [];
        this.windLabels = [];
        this.cellLoops = [];
        this.speedMultiplier = 1;
        this.textureLoader = new THREE.TextureLoader();

        // State
        this.earthTilt = 23.5 * (Math.PI / 180);
        this.yearTime = 0;

        this.initRenderer();
        this.initCamera();
        this.initControls();
        this.addLights();
        this.addEarthSystem();
        this.addStarBackground();
        this.bindUI();

        window.addEventListener('resize', () => this.onResize());

        // Listen for language changes
        window.addEventListener('languageChanged', () => this.updateLabels());

        this.renderer.setAnimationLoop(() => this.render());
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 0.5, 4.2);
        this.scene.add(this.camera);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 2.0;
        this.controls.maxDistance = 8;
    }

    addLights() {
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.sunLight.position.set(5, 2, 0);
        this.scene.add(this.sunLight);

        this.ambientLight = new THREE.AmbientLight(0x111122, 0.6);
        this.scene.add(this.ambientLight);

        const rimLight = new THREE.DirectionalLight(0x4455ff, 0.4);
        rimLight.position.set(-5, 0, -2);
        this.scene.add(rimLight);
    }

    addEarthSystem() {
        this.earthSystem = new THREE.Group();
        this.earthSystem.rotation.z = this.earthTilt;
        this.scene.add(this.earthSystem);

        this.rotatingEarth = new THREE.Group();
        this.earthSystem.add(this.rotatingEarth);

        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            map: this.textureLoader.load(TEXTURE_EARTH),
            specularMap: this.textureLoader.load(TEXTURE_SPECULAR),
            normalMap: this.textureLoader.load(TEXTURE_NORMAL),
            specular: new THREE.Color(0x333333),
            shininess: 15
        });
        this.earth = new THREE.Mesh(geometry, material);
        this.rotatingEarth.add(this.earth);

        const cloudGeo = new THREE.SphereGeometry(1.01, 64, 64);
        const cloudMat = new THREE.MeshPhongMaterial({
            map: this.textureLoader.load(TEXTURE_CLOUDS),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.clouds = new THREE.Mesh(cloudGeo, cloudMat);
        this.rotatingEarth.add(this.clouds);

        this.fixedAtmosphere = new THREE.Group();
        this.earthSystem.add(this.fixedAtmosphere);

        this.addAtmosphereMesh();
        this.addVerticalCells();
        this.addWindBelts();
        this.addParticleStreams();
        this.addPressureSystems();  // NANO BANANA PRO: H/L pressure markers
    }

    addAtmosphereMesh() {
        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
            }
        `;

        const geometry = new THREE.SphereGeometry(1.15, 64, 64);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });

        const atmosphere = new THREE.Mesh(geometry, material);
        this.fixedAtmosphere.add(atmosphere);
    }

    addVerticalCells() {
        // === NANO BANANA PRO v2: Clean Scientific Visualization ===
        // Elegant flowing streamlines instead of cluttered geometry

        this.cellGroup = new THREE.Group();

        // === CROSS-SECTION VISUALIZATION (Single elegant slice) ===
        // Show ONE clear meridional cross-section for educational clarity
        this.addMeridionalSection();

        // === SURFACE WIND STREAMLINES ===
        // Smooth flowing lines showing Trade Winds, Westerlies, Polar Easterlies
        this.addSurfaceWinds();

        // === JET STREAMS (Elegant wavy bands) ===
        this.addJetStreamBands();

        // === VERTICAL MOTION INDICATORS ===
        // Subtle rising/sinking markers at key latitudes
        this.addVerticalMotionMarkers();

        this.fixedAtmosphere.add(this.cellGroup);
    }

    addMeridionalSection() {
        // Single elegant cross-section showing the 3 cells
        const sectionGroup = new THREE.Group();

        const rInner = 1.02;
        const rOuter = 1.12;

        // Create flowing curve for each cell (smooth Bezier curves)
        const createCellCurve = (latStart, latEnd, color, label) => {
            const startRad = THREE.MathUtils.degToRad(latStart);
            const endRad = THREE.MathUtils.degToRad(latEnd);
            const midRad = (startRad + endRad) / 2;

            // Smooth elliptical path
            const points = [];
            const segments = 48;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const angle = t * Math.PI * 2;

                // Parametric ellipse in lat-alt plane
                const latRange = endRad - startRad;
                const lat = startRad + (latRange / 2) + (latRange / 2) * Math.cos(angle);
                const altFactor = (Math.sin(angle) + 1) / 2; // 0 at bottom, 1 at top
                const r = THREE.MathUtils.lerp(rInner, rOuter, altFactor);

                points.push(new THREE.Vector3(0, Math.sin(lat) * r, Math.cos(lat) * r));
            }

            const curve = new THREE.CatmullRomCurve3(points, true);
            const lineGeo = new THREE.TubeGeometry(curve, 64, 0.004, 6, true);

            const lineMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(lineGeo, lineMat);
            return mesh;
        };

        // Northern Hemisphere cells
        const hadleyN = createCellCurve(0, 30, COLOR_HADLEY, 'Hadley');
        const ferrelN = createCellCurve(30, 60, COLOR_FERREL, 'Ferrel');
        const polarN = createCellCurve(60, 90, COLOR_POLAR, 'Polar');

        // Southern Hemisphere cells
        const hadleyS = createCellCurve(-30, 0, COLOR_HADLEY, 'Hadley');
        const ferrelS = createCellCurve(-60, -30, COLOR_FERREL, 'Ferrel');
        const polarS = createCellCurve(-90, -60, COLOR_POLAR, 'Polar');

        sectionGroup.add(hadleyN, ferrelN, polarN, hadleyS, ferrelS, polarS);

        // Add 3 more sections at 90° intervals for 3D effect
        for (let i = 1; i < 4; i++) {
            const clone = sectionGroup.clone();
            clone.rotation.y = (i / 4) * Math.PI * 2;
            this.cellGroup.add(clone);
        }

        this.cellGroup.add(sectionGroup);
        this.cellLoops = []; // No animation needed for thin lines
    }

    addSurfaceWinds() {
        // === Trade Winds (0-30°): Easterly ===
        // === Westerlies (30-60°): Westerly ===  
        // === Polar Easterlies (60-90°): Easterly ===

        const windGroup = new THREE.Group();

        const createWindBand = (latCenter, latWidth, color, isEasterly, numStreams) => {
            const group = new THREE.Group();

            for (let i = 0; i < numStreams; i++) {
                const lon = (i / numStreams) * Math.PI * 2;
                const lat = THREE.MathUtils.degToRad(latCenter + (Math.random() - 0.5) * latWidth);
                const r = 1.025;

                // Create curved wind arrow
                const arrowLen = 0.15;
                const curve = new THREE.QuadraticBezierCurve3(
                    this.latLonToVector3(THREE.MathUtils.radToDeg(lat), THREE.MathUtils.radToDeg(lon), r),
                    this.latLonToVector3(THREE.MathUtils.radToDeg(lat), THREE.MathUtils.radToDeg(lon + (isEasterly ? -0.1 : 0.1)), r + 0.005),
                    this.latLonToVector3(THREE.MathUtils.radToDeg(lat), THREE.MathUtils.radToDeg(lon + (isEasterly ? -0.2 : 0.2)), r)
                );

                const lineGeo = new THREE.TubeGeometry(curve, 16, 0.003, 4, false);
                const lineMat = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.6
                });

                group.add(new THREE.Mesh(lineGeo, lineMat));
            }

            return group;
        };

        // Trade winds (NE in NH, SE in SH)
        windGroup.add(createWindBand(15, 20, COLOR_HADLEY, true, 24));
        windGroup.add(createWindBand(-15, 20, COLOR_HADLEY, true, 24));

        // Westerlies
        windGroup.add(createWindBand(45, 20, COLOR_FERREL, false, 24));
        windGroup.add(createWindBand(-45, 20, COLOR_FERREL, false, 24));

        // Polar easterlies
        windGroup.add(createWindBand(75, 15, COLOR_POLAR, true, 16));
        windGroup.add(createWindBand(-75, 15, COLOR_POLAR, true, 16));

        this.cellGroup.add(windGroup);
    }

    addJetStreamBands() {
        // Elegant ribbon-like jet streams
        const createJetRibbon = (latitude, color, width) => {
            const points = [];
            const segments = 96;
            const r = 1.10;

            for (let i = 0; i <= segments; i++) {
                const lon = (i / segments) * Math.PI * 2;
                // Gentle Rossby wave undulation
                const wave = Math.sin(lon * 5) * 3;
                const lat = THREE.MathUtils.degToRad(latitude + wave);

                const x = r * Math.cos(lat) * Math.cos(lon);
                const y = r * Math.sin(lat);
                const z = r * Math.cos(lat) * Math.sin(lon);
                points.push(new THREE.Vector3(x, y, z));
            }

            const curve = new THREE.CatmullRomCurve3(points, true);
            const tubeGeo = new THREE.TubeGeometry(curve, 96, width, 8, true);

            const tubeMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });

            const mesh = new THREE.Mesh(tubeGeo, tubeMat);
            mesh.userData = { speed: 1.5 };
            return mesh;
        };

        // Polar jets (cyan)
        const polarJetN = createJetRibbon(60, 0x00ccff, 0.008);
        const polarJetS = createJetRibbon(-60, 0x00ccff, 0.008);

        // Subtropical jets (gold)
        const subJetN = createJetRibbon(30, 0xffcc00, 0.006);
        const subJetS = createJetRibbon(-30, 0xffcc00, 0.006);

        this.cellGroup.add(polarJetN, polarJetS, subJetN, subJetS);
        this.jetStreams = [polarJetN, polarJetS, subJetN, subJetS];
    }

    addVerticalMotionMarkers() {
        // Subtle indicators for rising/sinking air
        const markerGroup = new THREE.Group();

        const createMarker = (lat, isRising, color) => {
            const r = 1.03;
            const count = 12;
            const group = new THREE.Group();

            for (let i = 0; i < count; i++) {
                const lon = (i / count) * Math.PI * 2;

                // Small arrow
                const arrowGeo = new THREE.ConeGeometry(0.008, 0.025, 4);
                const arrowMat = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.7
                });

                const arrow = new THREE.Mesh(arrowGeo, arrowMat);
                const pos = this.latLonToVector3(lat, THREE.MathUtils.radToDeg(lon), r);
                arrow.position.copy(pos);

                // Point up for rising, down for sinking
                if (!isRising) arrow.rotation.x = Math.PI;

                // Orient radially
                arrow.lookAt(0, 0, 0);
                arrow.rotateX(isRising ? Math.PI / 2 : -Math.PI / 2);

                group.add(arrow);
            }

            return group;
        };

        // ITCZ - Rising (equator)
        markerGroup.add(createMarker(0, true, 0xff6644));

        // Subtropical - Sinking (30°)
        markerGroup.add(createMarker(30, false, 0x4488ff));
        markerGroup.add(createMarker(-30, false, 0x4488ff));

        // Polar Front - Rising (60°)
        markerGroup.add(createMarker(60, true, 0x44ff88));
        markerGroup.add(createMarker(-60, true, 0x44ff88));

        // Poles - Sinking
        markerGroup.add(createMarker(85, false, 0x88ccff));
        markerGroup.add(createMarker(-85, false, 0x88ccff));

        this.cellGroup.add(markerGroup);
    }

    addWindBelts() {
        LATITUDES.forEach(info => {
            const rad = THREE.MathUtils.degToRad(info.lat);
            const y = 1.01 * Math.sin(rad);
            const r = 1.01 * Math.cos(rad);

            if (r < 0.01) return;

            const ringGeometry = new THREE.RingGeometry(r - 0.015, r + 0.015, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: info.color,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = y;
            this.fixedAtmosphere.add(ring);

            if (info.lat > 0) {
                const southRing = ring.clone();
                southRing.position.y = -y;
                this.fixedAtmosphere.add(southRing);
                // Store with no label key, or handle south labels separately if needed (same usually)
                this.windLabels.push({ ring: southRing, label: null });
            }

            // Get text via i18n if available
            const text = window.i18n ? window.i18n.get(info.labelKey) : info.labelKey;
            const label = this.createLabelSprite(text);
            label.position.set(r + 0.3, y, 0);
            this.fixedAtmosphere.add(label);

            this.windLabels.push({ ring, label, key: info.labelKey });
        });
    }

    createLabelSprite(text) {
        const texture = this.createLabelTexture(text);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.6, 0.15, 1);
        return sprite;
    }

    createLabelTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Clear
        ctx.clearRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Source Han Sans", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    updateLabels() {
        this.windLabels.forEach(item => {
            if (item.label && item.key) {
                const text = window.i18n.get(item.key);
                const oldMap = item.label.material.map;
                item.label.material.map = this.createLabelTexture(text);
                if (oldMap) oldMap.dispose();
            }
        });
    }

    addParticleStreams() {
        const streamConfigs = [
            { latMin: 0, latMax: 30, color: COLOR_HADLEY, direction: -1 },
            { latMin: 30, latMax: 60, color: COLOR_FERREL, direction: 1 },
            { latMin: 60, latMax: 90, color: COLOR_POLAR, direction: -1 },
            { latMin: -30, latMax: 0, color: COLOR_HADLEY, direction: -1 },
            { latMin: -60, latMax: -30, color: COLOR_FERREL, direction: 1 },
            { latMin: -90, latMax: -60, color: COLOR_POLAR, direction: -1 }
        ];

        streamConfigs.forEach(config => {
            const group = new THREE.Group();
            for (let i = 0; i < 500; i++) {
                const particle = this.createParticle(config);
                group.add(particle.mesh);
            }
            this.fixedAtmosphere.add(group);
            this.streamGroups.push({ group, config });
        });
    }

    createParticle(config) {
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.9
        });
        const geometry = new THREE.SphereGeometry(0.015, 6, 6);
        const mesh = new THREE.Mesh(geometry, material);

        const latitude = THREE.MathUtils.randFloat(config.latMin, config.latMax);
        const longitude = THREE.MathUtils.randFloat(0, 360);
        const radius = 1.04 + Math.random() * 0.02;

        const speed = THREE.MathUtils.randFloat(0.05, 0.1) * config.direction;

        const position = this.latLonToVector3(latitude, longitude, radius);
        mesh.position.copy(position);

        return { mesh, latitude, longitude, radius, speed };
    }

    latLonToVector3(lat, lon, radius) {
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        return new THREE.Vector3(x, y, z);
    }

    addStarBackground() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 3000;
        const positions = [];
        for (let i = 0; i < starCount; i++) {
            const radius = THREE.MathUtils.randFloat(10, 20);
            const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
            const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
            positions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            transparent: true,
            opacity: 0.8
        });
        this.scene.add(new THREE.Points(starGeo, starMat));
    }

    bindUI() {
        const toggleStreams = document.getElementById('toggle-streams');
        const toggleCells = document.getElementById('toggle-cells');
        const toggleBelts = document.getElementById('toggle-belts');
        const toggleLights = document.getElementById('toggle-lights');
        const speedRange = document.getElementById('speed-range');
        const btnReset = document.getElementById('btn-reset');

        toggleStreams.addEventListener('change', () => {
            this.streamGroups.forEach(({ group }) => group.visible = toggleStreams.checked);
        });

        if (toggleCells) {
            toggleCells.addEventListener('change', () => {
                this.cellGroup.visible = toggleCells.checked;
            });
        }

        toggleBelts.addEventListener('change', () => {
            this.windLabels.forEach(({ ring, label }) => {
                ring.visible = toggleBelts.checked;
                if (label) label.visible = toggleBelts.checked;
            });
        });

        if (toggleLights) {
            toggleLights.addEventListener('change', () => {
                if (toggleLights.checked) {
                    this.sunLight.intensity = 2.0;
                } else {
                    this.sunLight.intensity = 0.5;
                }
            });
        }

        if (speedRange) {
            speedRange.addEventListener('input', () => {
                this.speedMultiplier = parseFloat(speedRange.value);
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.controls.reset();
            });
        }

        // Mobile sidebar toggle (FAB logic)
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Initial state: closed on mobile, open on desktop
            // CSS handles visibility, but JS ensures class sync if needed
        }
    }

    updateParticles(delta) {
        const speed = delta * this.speedMultiplier;

        this.rotatingEarth.rotation.y += speed * 0.5;
        this.clouds.rotation.y += speed * 0.05;

        this.yearTime += delta * 0.1 * this.speedMultiplier;
        const sunDist = 10;
        this.sunLight.position.x = Math.cos(this.yearTime) * sunDist;
        this.sunLight.position.z = Math.sin(this.yearTime) * sunDist;
        this.sunLight.position.y = 0;

        // === PARTICLE STREAMS ===
        this.streamGroups.forEach(({ group, config }) => {
            group.children.forEach((mesh) => {
                const particle = mesh.userData;
                particle.longitude += particle.speed * speed * 100;

                if (particle.longitude > 360) particle.longitude -= 360;
                if (particle.longitude < 0) particle.longitude += 360;

                const position = this.latLonToVector3(particle.latitude, particle.longitude, particle.radius);
                mesh.position.copy(position);
            });
        });

        // === CELL FLOW ANIMATION ===
        this.cellLoops.forEach(mesh => {
            if (mesh.material && mesh.material.map) {
                mesh.material.map.offset.x -= mesh.userData.speed * speed * 1.0;
            }
        });

        // === JET STREAM ANIMATION (Dynamic Rossby Waves) ===
        if (this.jetStreams) {
            this.jetStreams.forEach(jet => {
                if (jet.material && jet.material.map) {
                    jet.material.map.offset.x -= jet.userData.speed * speed;
                }
            });
        }

        // === SEASONAL ITCZ MIGRATION ===
        if (this.itczGroup) {
            // ITCZ shifts north in NH summer, south in SH summer
            // yearTime represents sun position; ITCZ follows thermal equator
            const itczShift = Math.sin(this.yearTime) * 0.05; // ~5° migration
            this.itczGroup.position.y = itczShift;
        }

        // === PRESSURE SYSTEM ANIMATION ===
        if (this.pressureMarkers) {
            this.pressureMarkers.forEach(marker => {
                // Pressure systems slowly drift
                marker.mesh.rotation.y += delta * 0.1;
            });
        }
    }

    // === PRESSURE SYSTEMS (H/L markers) ===
    addPressureSystems() {
        this.pressureMarkers = [];

        const createPressureMarker = (lat, lon, isHigh, label) => {
            const group = new THREE.Group();

            // Create H or L text sprite
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            // Background circle
            ctx.beginPath();
            ctx.arc(32, 32, 28, 0, Math.PI * 2);
            ctx.fillStyle = isHigh ? 'rgba(0, 150, 255, 0.8)' : 'rgba(255, 100, 50, 0.8)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Letter
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isHigh ? 'H' : 'L', 32, 32);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(0.15, 0.15, 1);

            const pos = this.latLonToVector3(lat, lon, 1.08);
            sprite.position.copy(pos);

            group.add(sprite);

            // Add rotating arrows for circulation direction
            const arrowCount = isHigh ? 6 : 6;
            for (let i = 0; i < arrowCount; i++) {
                const angle = (i / arrowCount) * Math.PI * 2;
                const arrowGeo = new THREE.ConeGeometry(0.01, 0.03, 4);
                const arrowMat = new THREE.MeshBasicMaterial({
                    color: isHigh ? 0x00aaff : 0xff6644,
                    transparent: true,
                    opacity: 0.8
                });
                const arrow = new THREE.Mesh(arrowGeo, arrowMat);

                // Position around the H/L
                const dist = 0.06;
                arrow.position.set(
                    pos.x + Math.cos(angle) * dist,
                    pos.y,
                    pos.z + Math.sin(angle) * dist
                );

                // Rotate to show clockwise (H in NH) or counterclockwise (L in NH)
                const tangent = isHigh ? angle + Math.PI / 2 : angle - Math.PI / 2;
                arrow.rotation.z = -tangent;

                group.add(arrow);
            }

            return { group, mesh: sprite, isHigh, lat, lon, label };
        };

        // === SEMI-PERMANENT PRESSURE SYSTEMS ===

        // Subtropical Highs (30° latitude - descending air)
        const azoresHigh = createPressureMarker(30, -30, true, 'Azores High');
        const pacificHigh = createPressureMarker(30, -150, true, 'Pacific High');
        const bermudaHigh = createPressureMarker(30, -60, true, 'Bermuda High');

        // Southern Hemisphere Highs
        const stHelenaHigh = createPressureMarker(-30, -10, true, 'St Helena High');
        const mascareneHigh = createPressureMarker(-30, 60, true, 'Mascarene High');
        const eastPacificHigh = createPressureMarker(-30, -100, true, 'E Pacific High');

        // Subpolar Lows (60° latitude - rising air at polar front)
        const icelandLow = createPressureMarker(60, -20, false, 'Icelandic Low');
        const aleutianLow = createPressureMarker(55, 180, false, 'Aleutian Low');

        // Polar Highs
        const arcticHigh = createPressureMarker(85, 0, true, 'Arctic High');
        const antarcticHigh = createPressureMarker(-85, 0, true, 'Antarctic High');

        // ITCZ Low pressure
        const itczLow1 = createPressureMarker(5, 0, false, 'ITCZ');
        const itczLow2 = createPressureMarker(5, 120, false, 'ITCZ');
        const itczLow3 = createPressureMarker(5, -120, false, 'ITCZ');

        const allPressure = [
            azoresHigh, pacificHigh, bermudaHigh,
            stHelenaHigh, mascareneHigh, eastPacificHigh,
            icelandLow, aleutianLow,
            arcticHigh, antarcticHigh,
            itczLow1, itczLow2, itczLow3
        ];

        this.pressureGroup = new THREE.Group();
        allPressure.forEach(p => {
            this.pressureGroup.add(p.group);
            this.pressureMarkers.push(p);
        });

        this.fixedAtmosphere.add(this.pressureGroup);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    render() {
        const delta = this.clock.getDelta();
        this.updateParticles(delta);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new GlobalCirculationApp();
