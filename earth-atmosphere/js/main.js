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
        const createLoop = (latStart, latEnd, color, isClockwise) => {
            const rInner = 1.02;
            const rOuter = 1.15;
            
            const points = [];
            const steps = 24;
            const startRad = THREE.MathUtils.degToRad(latStart);
            const endRad = THREE.MathUtils.degToRad(latEnd);
            
            for(let i=0; i<=steps; i++) {
                const t = i/steps;
                const lat = THREE.MathUtils.lerp(startRad, endRad, t);
                points.push(new THREE.Vector3(0, Math.sin(lat)*rInner, Math.cos(lat)*rInner));
            }
            for(let i=0; i<=steps; i++) {
                const t = i/steps;
                const lat = THREE.MathUtils.lerp(endRad, startRad, t);
                points.push(new THREE.Vector3(0, Math.sin(lat)*rOuter, Math.cos(lat)*rOuter));
            }
            points.push(points[0]);
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, 64, 0.01, 8, true);
            
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            const g = ctx.createLinearGradient(0,0,64,0);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.5, 'rgba(255,255,255,1)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 20, 64, 24);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 1);
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                map: texture,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            return new THREE.Mesh(geometry, material);
        };

        const hadley = createLoop(30, 5, COLOR_HADLEY, true);
        const ferrel = createLoop(30, 60, COLOR_FERREL, false);
        const polar = createLoop(88, 60, COLOR_POLAR, true);
        const sHadley = createLoop(-30, -5, COLOR_HADLEY, true);
        const sFerrel = createLoop(-30, -60, COLOR_FERREL, false);
        const sPolar = createLoop(-88, -60, COLOR_POLAR, true);
        
        const group = new THREE.Group();
        
        const count = 6; 
        for(let i=0; i<count; i++) {
            const angle = (i / count) * Math.PI * 2;
            
            const h = hadley.clone(); h.rotation.y = angle; h.userData = { speed: -0.5 };
            const f = ferrel.clone(); f.rotation.y = angle; f.userData = { speed: 0.5 };
            const p = polar.clone(); p.rotation.y = angle; p.userData = { speed: -0.5 };
            
            const sh = sHadley.clone(); sh.rotation.y = angle; sh.userData = { speed: -0.5 };
            const sf = sFerrel.clone(); sf.rotation.y = angle; sf.userData = { speed: 0.5 };
            const sp = sPolar.clone(); sp.rotation.y = angle; sp.userData = { speed: -0.5 };
            
            group.add(h, f, p, sh, sf, sp);
            this.cellLoops.push(h, f, p, sh, sf, sp);
        }
        
        this.fixedAtmosphere.add(group);
        this.cellGroup = group;
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

        if(toggleCells) {
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
        
        if(toggleLights) {
            toggleLights.addEventListener('change', () => {
                if(toggleLights.checked) {
                     this.sunLight.intensity = 2.0;
                } else {
                     this.sunLight.intensity = 0.5; 
                }
            });
        }

        if(speedRange) {
            speedRange.addEventListener('input', () => {
                this.speedMultiplier = parseFloat(speedRange.value);
            });
        }

        if(btnReset) {
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

        this.streamGroups.forEach(({ group, config }) => {
            group.children.forEach((mesh) => {
                const particle = mesh.userData;
                particle.longitude += particle.speed * speed * 100; 
                
                if(particle.longitude > 360) particle.longitude -= 360;
                if(particle.longitude < 0) particle.longitude += 360;

                const position = this.latLonToVector3(particle.latitude, particle.longitude, particle.radius);
                mesh.position.copy(position);
            });
        });

        this.cellLoops.forEach(mesh => {
            if (mesh.material.map) {
                mesh.material.map.offset.x -= mesh.userData.speed * speed * 1.0;
            }
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
