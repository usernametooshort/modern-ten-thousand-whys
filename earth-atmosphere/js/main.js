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
        // === NANO BANANA PRO v3: Fluid Particle Circulation ===
        // Thousands of flowing particles creating real fluid effect

        this.cellGroup = new THREE.Group();
        this.flowParticles = [];

        // === MAIN FLOWING PARTICLE SYSTEM ===
        this.createFluidParticleSystem();

        // === VERTICAL CIRCULATION PARTICLES ===
        this.createVerticalCirculationParticles();

        this.fixedAtmosphere.add(this.cellGroup);
    }

    createFluidParticleSystem() {
        // === SURFACE WIND PARTICLES ===
        // Trade Winds, Westerlies, Polar Easterlies - all as flowing particles

        const particleCount = 8000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);
        const particleData = [];

        for (let i = 0; i < particleCount; i++) {
            // Random latitude distribution weighted by zone
            const zoneRand = Math.random();
            let lat, windDir, color;

            if (zoneRand < 0.35) {
                // Trade winds zone (0-30°) - most particles here
                lat = (Math.random() - 0.5) * 60; // -30 to 30
                windDir = lat > 0 ? -1 : -1; // NE trades in NH, SE trades in SH (both easterly)
                color = new THREE.Color(COLOR_HADLEY);
            } else if (zoneRand < 0.7) {
                // Westerlies zone (30-60°)
                const sign = Math.random() > 0.5 ? 1 : -1;
                lat = sign * (30 + Math.random() * 30);
                windDir = 1; // Westerly (blowing west to east)
                color = new THREE.Color(COLOR_FERREL);
            } else {
                // Polar zone (60-90°)
                const sign = Math.random() > 0.5 ? 1 : -1;
                lat = sign * (60 + Math.random() * 25);
                windDir = -1; // Polar easterlies
                color = new THREE.Color(COLOR_POLAR);
            }

            const lon = Math.random() * 360;
            const r = 1.02 + Math.random() * 0.03; // Slight altitude variation

            const pos = this.latLonToVector3(lat, lon, r);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = 0.008 + Math.random() * 0.012;

            // Store particle data for animation
            particleData.push({
                lat: lat,
                lon: lon,
                radius: r,
                speed: (0.5 + Math.random() * 0.5) * windDir,
                latDrift: (Math.random() - 0.5) * 0.02 // Slight meridional drift
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create glow texture for particles
        const particleTexture = this.createParticleTexture();

        const material = new THREE.PointsMaterial({
            size: 0.015,
            map: particleTexture,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.windParticles = new THREE.Points(geometry, material);
        this.windParticleData = particleData;
        this.cellGroup.add(this.windParticles);
    }

    createVerticalCirculationParticles() {
        // === PARTICLES SHOWING VERTICAL MOTION ===
        // Rising at ITCZ and polar front, sinking at subtropical and poles

        const verticalCount = 2000;
        const positions = new Float32Array(verticalCount * 3);
        const colors = new Float32Array(verticalCount * 3);
        const particleData = [];

        for (let i = 0; i < verticalCount; i++) {
            const zoneRand = Math.random();
            let lat, isRising, color, baseRadius;

            if (zoneRand < 0.3) {
                // ITCZ rising (equator)
                lat = (Math.random() - 0.5) * 10;
                isRising = true;
                color = new THREE.Color(0xff6644);
                baseRadius = 1.02;
            } else if (zoneRand < 0.5) {
                // Subtropical sinking (30°)
                lat = (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 10);
                isRising = false;
                color = new THREE.Color(0x4488ff);
                baseRadius = 1.12;
            } else if (zoneRand < 0.75) {
                // Polar front rising (60°)
                lat = (Math.random() > 0.5 ? 1 : -1) * (55 + Math.random() * 10);
                isRising = true;
                color = new THREE.Color(0x44ff88);
                baseRadius = 1.02;
            } else {
                // Polar sinking
                lat = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 8);
                isRising = false;
                color = new THREE.Color(0x88ccff);
                baseRadius = 1.12;
            }

            const lon = Math.random() * 360;
            const altOffset = Math.random() * 0.1;
            const r = isRising ? baseRadius + altOffset : baseRadius - altOffset;

            const pos = this.latLonToVector3(lat, lon, r);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            particleData.push({
                lat: lat,
                lon: lon,
                radius: r,
                baseRadius: baseRadius,
                isRising: isRising,
                speed: 0.02 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.012,
            map: this.createParticleTexture(),
            transparent: true,
            opacity: 0.9,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.verticalParticles = new THREE.Points(geometry, material);
        this.verticalParticleData = particleData;
        this.cellGroup.add(this.verticalParticles);
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Soft glowing dot
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    updateFlowParticles(delta) {
        if (!this.windParticles || !this.windParticleData) return;

        const positions = this.windParticles.geometry.attributes.position.array;
        const speed = delta * this.speedMultiplier * 50;

        // === SEASONAL FACTORS ===
        // yearTime cycles through a full year; sin(yearTime) gives seasonal shift
        // Positive = NH summer (ITCZ north), Negative = NH winter (ITCZ south)
        const seasonFactor = Math.sin(this.yearTime); // -1 to 1
        const itczShift = seasonFactor * 10; // ITCZ migrates ±10° with seasons
        const jetShift = seasonFactor * 5; // Jet streams shift ±5°
        const tradeWindIntensity = 1 + seasonFactor * 0.3; // Monsoon effect

        for (let i = 0; i < this.windParticleData.length; i++) {
            const p = this.windParticleData[i];

            // === SEASONAL WIND SPEED MODULATION ===
            let seasonalSpeed = p.speed;

            // Trade wind zone - stronger in winter hemisphere (monsoon)
            if (Math.abs(p.lat) < 30) {
                // NH trades stronger in NH winter, SH trades stronger in SH winter
                const hemisphereSign = Math.sign(p.lat) || 1;
                seasonalSpeed *= (1 - hemisphereSign * seasonFactor * 0.4);
            }

            // Westerlies - stronger in winter
            if (Math.abs(p.lat) >= 30 && Math.abs(p.lat) < 60) {
                const hemisphereSign = Math.sign(p.lat);
                seasonalSpeed *= (1 - hemisphereSign * seasonFactor * 0.3);
            }

            // Update longitude (main flow)
            p.lon += seasonalSpeed * speed;
            if (p.lon > 360) p.lon -= 360;
            if (p.lon < 0) p.lon += 360;

            // === SEASONAL LATITUDE DRIFT ===
            // ITCZ particles drift toward seasonal thermal equator
            if (Math.abs(p.lat) < 30) {
                // Trade wind zone - drift toward ITCZ
                const targetLat = itczShift; // ITCZ position
                p.lat += (targetLat - p.lat) * 0.001 * speed;
            } else if (Math.abs(p.lat) < 60) {
                // Westerly zone - slight poleward drift, affected by season
                const driftRate = 0.001 * (1 + Math.abs(seasonFactor) * 0.5);
                p.lat += Math.sign(p.lat) * driftRate * speed;
            }

            // Clamp latitude
            p.lat = THREE.MathUtils.clamp(p.lat, -88, 88);

            const pos = this.latLonToVector3(p.lat, p.lon, p.radius);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
        }

        this.windParticles.geometry.attributes.position.needsUpdate = true;
    }

    updateVerticalParticles(delta) {
        if (!this.verticalParticles || !this.verticalParticleData) return;

        const positions = this.verticalParticles.geometry.attributes.position.array;
        const speed = delta * this.speedMultiplier;

        for (let i = 0; i < this.verticalParticleData.length; i++) {
            const p = this.verticalParticleData[i];

            // Animate vertical movement
            p.phase += speed * 2;

            if (p.isRising) {
                // Rising: move outward from surface to tropopause
                p.radius = p.baseRadius + Math.abs(Math.sin(p.phase)) * 0.1;
            } else {
                // Sinking: move inward from tropopause to surface
                p.radius = p.baseRadius - Math.abs(Math.sin(p.phase)) * 0.1;
            }

            // Slight longitude drift
            p.lon += speed * 5;
            if (p.lon > 360) p.lon -= 360;

            const pos = this.latLonToVector3(p.lat, p.lon, p.radius);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
        }

        this.verticalParticles.geometry.attributes.position.needsUpdate = true;
    }

    updateSeasonDisplay() {
        // Update the season indicator UI
        const seasonFactor = Math.sin(this.yearTime); // -1 to 1
        const itczLat = seasonFactor * 10; // ITCZ position
        const jetLat = 60 + seasonFactor * 5; // Jet stream position

        // Determine season (NH perspective)
        // yearTime 0 = spring, π/2 = summer, π = fall, 3π/2 = winter
        const phase = (this.yearTime % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        let seasonIcon, seasonName;

        if (phase < Math.PI / 2) {
            // Spring (NH) / Fall (SH)
            seasonIcon = '🌸';
            seasonName = window.i18n ? window.i18n.get('season_spring') : '春季 (北半球)';
        } else if (phase < Math.PI) {
            // Summer (NH) / Winter (SH)
            seasonIcon = '☀️';
            seasonName = window.i18n ? window.i18n.get('season_summer') : '夏季 (北半球)';
        } else if (phase < Math.PI * 1.5) {
            // Fall (NH) / Spring (SH)
            seasonIcon = '🍂';
            seasonName = window.i18n ? window.i18n.get('season_fall') : '秋季 (北半球)';
        } else {
            // Winter (NH) / Summer (SH)
            seasonIcon = '❄️';
            seasonName = window.i18n ? window.i18n.get('season_winter') : '冬季 (北半球)';
        }

        // Update UI elements
        const iconEl = document.getElementById('season-icon');
        const nameEl = document.getElementById('season-name');
        const itczEl = document.getElementById('itcz-position');
        const jetEl = document.getElementById('jet-position');

        if (iconEl) iconEl.textContent = seasonIcon;
        if (nameEl) nameEl.textContent = seasonName;
        if (itczEl) itczEl.textContent = `${itczLat.toFixed(1)}°${itczLat >= 0 ? 'N' : 'S'}`;
        if (jetEl) jetEl.textContent = `${jetLat.toFixed(0)}°N / ${jetLat.toFixed(0)}°S`;
    }

    // Empty stubs for removed methods (keep API compatible)
    addMeridionalSection() { }
    addSurfaceWinds() { }
    addJetStreamBands() { }
    addVerticalMotionMarkers() { }

    // Keep cellLoops for compatibility
    cellLoopsPlaceholder() {
        this.cellLoops = [];
    }

    addWindBelts() {
        // === NANO BANANA PRO: Professional Gradient Pressure Bands ===
        // Replace thin rings with beautiful gradient bands that move seasonally

        this.pressureBands = []; // Store for seasonal animation

        const createPressureBand = (baseLat, width, color, labelKey, isNorth) => {
            const group = new THREE.Group();

            // Create gradient torus for the band
            const lat = THREE.MathUtils.degToRad(baseLat);
            const y = 1.015 * Math.sin(lat);
            const r = 1.015 * Math.cos(lat);

            if (r < 0.05) return null;

            // Use TorusGeometry for smoother, more professional look
            const torusGeo = new THREE.TorusGeometry(r, width, 8, 96);

            // Create gradient texture for the band
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');

            // Smooth gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 32);
            const baseColor = new THREE.Color(color);
            gradient.addColorStop(0, `rgba(${baseColor.r * 255}, ${baseColor.g * 255}, ${baseColor.b * 255}, 0)`);
            gradient.addColorStop(0.3, `rgba(${baseColor.r * 255}, ${baseColor.g * 255}, ${baseColor.b * 255}, 0.6)`);
            gradient.addColorStop(0.5, `rgba(${baseColor.r * 255}, ${baseColor.g * 255}, ${baseColor.b * 255}, 0.8)`);
            gradient.addColorStop(0.7, `rgba(${baseColor.r * 255}, ${baseColor.g * 255}, ${baseColor.b * 255}, 0.6)`);
            gradient.addColorStop(1, `rgba(${baseColor.r * 255}, ${baseColor.g * 255}, ${baseColor.b * 255}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 32);

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            const torusMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const torus = new THREE.Mesh(torusGeo, torusMat);
            torus.rotation.x = Math.PI / 2;
            torus.position.y = y;
            group.add(torus);

            // Add label
            const text = window.i18n ? window.i18n.get(labelKey) : labelKey;
            const label = this.createLabelSprite(text);
            label.position.set(r + 0.25, y, 0);
            group.add(label);

            this.fixedAtmosphere.add(group);

            return {
                group,
                torus,
                label,
                baseLat,
                currentLat: baseLat,
                labelKey,
                isNorth
            };
        };

        // === CREATE PRESSURE BANDS ===
        // Equatorial Low (ITCZ)
        const itcz = createPressureBand(0, 0.02, 0xff6644, 'earth_lbl_equator', true);
        if (itcz) this.pressureBands.push(itcz);

        // Subtropical Highs (30°)
        const subHighN = createPressureBand(30, 0.018, 0x4488ff, 'earth_lbl_subtrop', true);
        const subHighS = createPressureBand(-30, 0.018, 0x4488ff, 'earth_lbl_subtrop', false);
        if (subHighN) this.pressureBands.push(subHighN);
        if (subHighS) this.pressureBands.push(subHighS);

        // Subpolar Lows (60°)  
        const subpolarN = createPressureBand(60, 0.015, 0xff7ad1, 'earth_lbl_subpolar', true);
        const subpolarS = createPressureBand(-60, 0.015, 0xff7ad1, 'earth_lbl_subpolar', false);
        if (subpolarN) this.pressureBands.push(subpolarN);
        if (subpolarS) this.pressureBands.push(subpolarS);

        // Polar Highs (85°)
        const polarN = createPressureBand(85, 0.012, 0x6ee7c8, 'earth_lbl_polar', true);
        const polarS = createPressureBand(-85, 0.012, 0x6ee7c8, 'earth_lbl_polar', false);
        if (polarN) this.pressureBands.push(polarN);
        if (polarS) this.pressureBands.push(polarS);

        // Store windLabels for compatibility
        this.windLabels = this.pressureBands.map(b => ({
            ring: b.torus,
            label: b.label,
            key: b.labelKey
        }));
    }

    updateWindBelts() {
        // === SEASONAL MIGRATION OF PRESSURE BANDS ===
        if (!this.pressureBands) return;

        const seasonFactor = Math.sin(this.yearTime);

        this.pressureBands.forEach(band => {
            // Calculate seasonal shift based on base latitude
            let seasonalShift = 0;
            const absLat = Math.abs(band.baseLat);

            if (absLat < 10) {
                // ITCZ: ±10°
                seasonalShift = seasonFactor * 10;
            } else if (absLat < 40) {
                // Subtropical: ±5°
                seasonalShift = seasonFactor * 5;
            } else if (absLat < 70) {
                // Subpolar: ±3°
                seasonalShift = seasonFactor * 3;
            } else {
                // Polar: ±1°
                seasonalShift = seasonFactor * 1;
            }

            // Apply shift in the correct direction
            const newLat = band.baseLat + seasonalShift;
            band.currentLat = newLat;

            // Update torus position
            const latRad = THREE.MathUtils.degToRad(newLat);
            const y = 1.015 * Math.sin(latRad);
            const r = 1.015 * Math.cos(latRad);

            if (band.torus) {
                band.torus.position.y = y;
                // Update torus radius for new latitude
                // We need to recreate geometry or scale it
                const scale = r / (1.015 * Math.cos(THREE.MathUtils.degToRad(band.baseLat)));
                band.torus.scale.x = scale;
                band.torus.scale.z = scale;
            }

            if (band.label) {
                band.label.position.set(r + 0.25, y, 0);
            }
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
        if (this.cellLoops) {
            this.cellLoops.forEach(mesh => {
                if (mesh.material && mesh.material.map) {
                    mesh.material.map.offset.x -= mesh.userData.speed * speed * 1.0;
                }
            });
        }

        // === FLUID PARTICLE ANIMATION ===
        this.updateFlowParticles(delta);
        this.updateVerticalParticles(delta);

        // === SEASON DISPLAY UPDATE ===
        this.updateSeasonDisplay();

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

        // === PRESSURE BELT SEASONAL MIGRATION ===
        this.updatePressureBelts();

        // === WIND BELT SEASONAL MIGRATION ===
        this.updateWindBelts();
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

        // ITCZ Low pressure (these will move most dramatically)
        const itczLow1 = createPressureMarker(0, 0, false, 'ITCZ');
        const itczLow2 = createPressureMarker(0, 120, false, 'ITCZ');
        const itczLow3 = createPressureMarker(0, -120, false, 'ITCZ');

        const allPressure = [
            azoresHigh, pacificHigh, bermudaHigh,
            stHelenaHigh, mascareneHigh, eastPacificHigh,
            icelandLow, aleutianLow,
            arcticHigh, antarcticHigh,
            itczLow1, itczLow2, itczLow3
        ];

        this.pressureGroup = new THREE.Group();
        allPressure.forEach(p => {
            // Store base latitude for seasonal migration
            p.baseLat = p.lat;
            this.pressureGroup.add(p.group);
            this.pressureMarkers.push(p);
        });

        this.fixedAtmosphere.add(this.pressureGroup);
    }

    updatePressureBelts() {
        // === SEASONAL MIGRATION OF PRESSURE BELTS ===
        if (!this.pressureMarkers) return;

        const seasonFactor = Math.sin(this.yearTime); // -1 to 1

        this.pressureMarkers.forEach(marker => {
            // Different migration amounts based on pressure type
            let seasonalShift = 0;

            if (marker.label === 'ITCZ') {
                // ITCZ moves most dramatically: ±10°
                seasonalShift = seasonFactor * 10;
            } else if (Math.abs(marker.baseLat) < 40) {
                // Subtropical highs: ±5°
                seasonalShift = seasonFactor * 5;
            } else if (Math.abs(marker.baseLat) < 70) {
                // Subpolar lows: ±3°
                seasonalShift = seasonFactor * 3;
            } else {
                // Polar highs: minimal movement ±1°
                seasonalShift = seasonFactor * 1;
            }

            // Calculate new latitude
            const newLat = marker.baseLat + seasonalShift;

            // Update position
            const newPos = this.latLonToVector3(newLat, marker.lon, 1.08);

            // Update group position (contains sprite and arrows)
            marker.group.position.set(0, 0, 0);
            marker.group.children.forEach(child => {
                if (child.isSprite) {
                    child.position.copy(newPos);
                }
            });

            // Store current lat for reference
            marker.currentLat = newLat;
        });
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
