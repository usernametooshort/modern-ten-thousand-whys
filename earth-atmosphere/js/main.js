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
        // === NANO BANANA PRO: Scientifically Accurate 3D Circulation Cells ===

        const rSurface = 1.02;
        const rTropopause = 1.18;

        // Create a single 3D cell with proper vertical structure
        const createCell = (latStart, latEnd, color, isClockwise, cellName) => {
            const group = new THREE.Group();
            group.userData.cellName = cellName;

            const startRad = THREE.MathUtils.degToRad(latStart);
            const endRad = THREE.MathUtils.degToRad(latEnd);

            // Cell boundary loop (2D cross-section in lat-altitude plane)
            const loopPoints = [];
            const steps = 32;

            // Bottom: surface level from latStart to latEnd
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const lat = THREE.MathUtils.lerp(startRad, endRad, t);
                loopPoints.push(new THREE.Vector3(0, Math.sin(lat) * rSurface, Math.cos(lat) * rSurface));
            }

            // Rising column at one end
            const riseLat = isClockwise ? endRad : startRad;
            for (let i = 0; i <= steps / 2; i++) {
                const t = i / (steps / 2);
                const r = THREE.MathUtils.lerp(rSurface, rTropopause, t);
                loopPoints.push(new THREE.Vector3(0, Math.sin(riseLat) * r, Math.cos(riseLat) * r));
            }

            // Top: tropopause level (reverse direction)
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const lat = THREE.MathUtils.lerp(endRad, startRad, t);
                loopPoints.push(new THREE.Vector3(0, Math.sin(lat) * rTropopause, Math.cos(lat) * rTropopause));
            }

            // Descending column
            const descLat = isClockwise ? startRad : endRad;
            for (let i = 0; i <= steps / 2; i++) {
                const t = i / (steps / 2);
                const r = THREE.MathUtils.lerp(rTropopause, rSurface, t);
                loopPoints.push(new THREE.Vector3(0, Math.sin(descLat) * r, Math.cos(descLat) * r));
            }

            // Close the loop
            loopPoints.push(loopPoints[0].clone());

            const curve = new THREE.CatmullRomCurve3(loopPoints, true);
            const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.012, 8, true);

            // Animated flow texture
            const flowTexture = this.createFlowTexture(color);
            flowTexture.wrapS = THREE.RepeatWrapping;
            flowTexture.repeat.set(8, 1);

            const tubeMat = new THREE.MeshBasicMaterial({
                color: color,
                map: flowTexture,
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const tube = new THREE.Mesh(tubeGeo, tubeMat);
            tube.userData = { speed: isClockwise ? -0.6 : 0.6 };
            group.add(tube);

            // Add directional arrows along the flow
            this.addFlowArrows(group, loopPoints, color, isClockwise);

            return { group, tube };
        };

        // === Create all 6 cells (3 per hemisphere) ===

        // Northern Hemisphere
        const hadleyN = createCell(0, 30, COLOR_HADLEY, true, 'Hadley');    // Rising at ITCZ (0°), sinking at 30°
        const ferrelN = createCell(30, 60, COLOR_FERREL, false, 'Ferrel');  // Indirect cell
        const polarN = createCell(60, 85, COLOR_POLAR, true, 'Polar');      // Rising at polar front, sinking at pole

        // Southern Hemisphere (mirrored)
        const hadleyS = createCell(-30, 0, COLOR_HADLEY, true, 'Hadley');
        const ferrelS = createCell(-60, -30, COLOR_FERREL, false, 'Ferrel');
        const polarS = createCell(-85, -60, COLOR_POLAR, true, 'Polar');

        this.cellGroup = new THREE.Group();

        // Distribute cells around the planet
        const cellInstances = 8;
        for (let i = 0; i < cellInstances; i++) {
            const angle = (i / cellInstances) * Math.PI * 2;

            [hadleyN, ferrelN, polarN, hadleyS, ferrelS, polarS].forEach(cell => {
                const clone = cell.group.clone();
                clone.rotation.y = angle;
                this.cellGroup.add(clone);

                // Store tube for animation
                clone.traverse(child => {
                    if (child.isMesh && child.userData.speed) {
                        this.cellLoops.push(child);
                    }
                });
            });
        }

        this.fixedAtmosphere.add(this.cellGroup);

        // === Add Jet Streams ===
        this.addJetStreams();

        // === Add ITCZ Visualization ===
        this.addITCZ();
    }

    createFlowTexture(baseColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Arrow pattern for flow visualization
        const g = ctx.createLinearGradient(0, 0, 128, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        g.addColorStop(0.5, 'rgba(255,255,255,1)');
        g.addColorStop(0.7, 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 8, 128, 16);

        // Add arrow heads
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(100, 16);
        ctx.lineTo(115, 8);
        ctx.lineTo(115, 24);
        ctx.closePath();
        ctx.fill();

        return new THREE.CanvasTexture(canvas);
    }

    addFlowArrows(group, points, color, isClockwise) {
        // Add 3D arrow heads at key positions
        const arrowPositions = [0.1, 0.3, 0.5, 0.7, 0.9];
        const arrowGeo = new THREE.ConeGeometry(0.02, 0.05, 6);
        const arrowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });

        const totalPoints = points.length;
        arrowPositions.forEach(t => {
            const idx = Math.floor(t * totalPoints);
            if (idx < totalPoints - 1) {
                const arrow = new THREE.Mesh(arrowGeo, arrowMat);
                arrow.position.copy(points[idx]);

                // Orient arrow in flow direction
                const nextIdx = Math.min(idx + 1, totalPoints - 1);
                const dir = new THREE.Vector3().subVectors(points[nextIdx], points[idx]).normalize();
                arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

                group.add(arrow);
            }
        });
    }

    addJetStreams() {
        // === Polar Jet Stream (~60° latitude) ===
        const createJetStream = (latitude, color, name, waveAmplitude) => {
            const group = new THREE.Group();
            const points = [];
            const segments = 128;
            const radius = 1.14; // Near tropopause

            for (let i = 0; i <= segments; i++) {
                const lon = (i / segments) * Math.PI * 2;
                // Rossby wave pattern
                const wavePhase = lon * 4 + this.clock.elapsedTime;
                const latVariation = waveAmplitude * Math.sin(wavePhase);
                const lat = THREE.MathUtils.degToRad(latitude + latVariation);

                const x = radius * Math.cos(lat) * Math.cos(lon);
                const y = radius * Math.sin(lat);
                const z = radius * Math.cos(lat) * Math.sin(lon);
                points.push(new THREE.Vector3(x, y, z));
            }

            const curve = new THREE.CatmullRomCurve3(points, true);
            const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.015, 8, true);

            const jetTexture = this.createJetTexture();
            jetTexture.wrapS = THREE.RepeatWrapping;
            jetTexture.repeat.set(16, 1);

            const jetMat = new THREE.MeshBasicMaterial({
                color: color,
                map: jetTexture,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const jet = new THREE.Mesh(tubeGeo, jetMat);
            jet.userData = {
                name: name,
                latitude: latitude,
                waveAmplitude: waveAmplitude,
                speed: 2.0 // Fast jet stream
            };
            group.add(jet);

            return { group, jet };
        };

        // Polar jets
        const polarJetN = createJetStream(60, 0x00ffff, 'Polar Jet (N)', 8);
        const polarJetS = createJetStream(-60, 0x00ffff, 'Polar Jet (S)', 8);

        // Subtropical jets
        const subtropJetN = createJetStream(30, 0xffaa00, 'Subtropical Jet (N)', 5);
        const subtropJetS = createJetStream(-30, 0xffaa00, 'Subtropical Jet (S)', 5);

        this.jetStreams = [polarJetN.jet, polarJetS.jet, subtropJetN.jet, subtropJetS.jet];

        this.fixedAtmosphere.add(polarJetN.group);
        this.fixedAtmosphere.add(polarJetS.group);
        this.fixedAtmosphere.add(subtropJetN.group);
        this.fixedAtmosphere.add(subtropJetS.group);
    }

    createJetTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');

        // Fast-moving streaks
        const g = ctx.createLinearGradient(0, 0, 64, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.2, 'rgba(255,255,255,1)');
        g.addColorStop(0.5, 'rgba(255,255,255,1)');
        g.addColorStop(0.8, 'rgba(255,255,255,0.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 4, 64, 8);

        return new THREE.CanvasTexture(canvas);
    }

    addITCZ() {
        // === Intertropical Convergence Zone ===
        // Visible rising air column at equator

        const itczGroup = new THREE.Group();

        // Rising air columns
        const columnCount = 16;
        for (let i = 0; i < columnCount; i++) {
            const lon = (i / columnCount) * Math.PI * 2;

            // Vertical arrow showing rising motion
            const arrowGeo = new THREE.ConeGeometry(0.02, 0.08, 6);
            const arrowMat = new THREE.MeshBasicMaterial({
                color: 0xff6622,
                transparent: true,
                opacity: 0.8
            });

            for (let h = 0; h < 3; h++) {
                const arrow = new THREE.Mesh(arrowGeo, arrowMat);
                const r = 1.04 + h * 0.04;
                arrow.position.set(
                    r * Math.cos(lon),
                    0.02 + h * 0.04, // Slightly above equator
                    r * Math.sin(lon)
                );
                itczGroup.add(arrow);
            }
        }

        // Glowing equatorial band
        const bandGeo = new THREE.TorusGeometry(1.03, 0.015, 8, 64);
        const bandMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.x = Math.PI / 2;
        itczGroup.add(band);

        this.itczGroup = itczGroup;
        this.fixedAtmosphere.add(itczGroup);
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
