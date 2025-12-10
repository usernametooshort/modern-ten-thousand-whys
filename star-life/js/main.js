import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Optimized Shaders ---

const StarVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

const StarFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
uniform float time;
uniform vec3 colorA;
uniform vec3 colorB;
uniform float noiseScale;

// Simplified Noise
float hash(float n) { return fract(sin(n) * 43758.5453123); }
float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(mix(mix( hash(n + 0.0), hash(n + 1.0), f.x),
                   mix( hash(n + 57.0), hash(n + 58.0), f.x), f.y),
               mix(mix( hash(n + 113.0), hash(n + 114.0), f.x),
                   mix( hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
}

void main() {
    // Animate noise with time
    vec3 p = vPosition * noiseScale;
    float n = noise(p + time * 0.5);
    float n2 = noise(p * 2.0 - time * 0.2);
    
    float total = n * 0.7 + n2 * 0.3;
    
    // Mix colors based on noise
    vec3 color = mix(colorA, colorB, total);
    
    // Heat glow
    color += vec3(0.2) * pow(total, 2.0);

    // Fresnel Rim (Atmosphere)
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 2.5);
    
    color += colorA * fresnel * 1.5;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// --- Configuration with I18n Keys ---

const STAGES = [
    {
        id: 'nebula',
        nameKey: 'star_stage_nebula',
        descKey: 'star_desc_nebula',
        temperature: '~ 10-100 K',
        starRadius: 0.1, 
        colorA: 0x000000, 
        colorB: 0x112233,
        noiseScale: 1.0,
        nebulaOp: 0.8,
        nebulaScale: 1.2,
        jetOp: 0.0,
        diskOp: 0.0,
        shockScl: 0.1,
        shockOp: 0.0,
        pulsar: false,
        glowSize: 0.5,
        facts: [
            { labelKey: 'star_fact_protagonist', value: 'Molecular Cloud' },
            { labelKey: 'star_fact_trigger', value: 'Gravity' },
            { labelKey: 'star_fact_state', value: 'Cold Gas' },
            { labelKey: 'star_fact_fate', value: 'Protostar' }
        ]
    },
    {
        id: 'protostar',
        nameKey: 'star_stage_protostar',
        descKey: 'star_desc_protostar',
        temperature: '~ 2,000 K',
        starRadius: 2.5,
        colorA: 0xff5500,
        colorB: 0x440000,
        noiseScale: 2.0,
        nebulaOp: 0.4,
        nebulaScale: 0.8,
        jetOp: 0.8,
        diskOp: 0.9,
        shockScl: 0.1,
        shockOp: 0.0,
        pulsar: false,
        glowSize: 2.0,
        facts: [
            { labelKey: 'star_fact_power', value: 'Gravity -> Heat' },
            { labelKey: 'star_fact_feature', value: 'Bipolar Jets' },
            { labelKey: 'star_fact_structure', value: 'Accretion Disk' },
            { labelKey: 'star_fact_duration', value: '~500k Years' }
        ]
    },
    {
        id: 'main-sequence',
        nameKey: 'star_stage_mainseq',
        descKey: 'star_desc_mainseq',
        temperature: '~ 5,800 K',
        starRadius: 4.0,
        colorA: 0xffcc00, // Yellow
        colorB: 0xff8800, // Orange
        noiseScale: 1.5,
        nebulaOp: 0.0,
        nebulaScale: 0.0,
        jetOp: 0.0,
        diskOp: 0.0,
        shockScl: 0.1,
        shockOp: 0.0,
        pulsar: false,
        glowSize: 6.0,
        facts: [
            { labelKey: 'star_fact_fuel', value: 'H -> He' },
            { labelKey: 'star_fact_balance', value: 'Hydrostatic' },
            { labelKey: 'star_fact_lifespan', value: '~10 Billion Yrs' },
            { labelKey: 'star_fact_color', value: 'Yellow Dwarf' }
        ]
    },
    {
        id: 'red-giant',
        nameKey: 'star_stage_redgiant',
        descKey: 'star_desc_redgiant',
        temperature: '~ 3,000 K',
        starRadius: 10.0, // Huge
        colorA: 0xff2200,
        colorB: 0x660000,
        noiseScale: 0.8, 
        nebulaOp: 0.0,
        nebulaScale: 0.0,
        jetOp: 0.0,
        diskOp: 0.0,
        shockScl: 0.1,
        shockOp: 0.0,
        pulsar: false,
        glowSize: 15.0,
        facts: [
            { labelKey: 'star_fact_volume', value: 'Expanded 100x' },
            { labelKey: 'star_fact_surface', value: 'Cooling Red' },
            { labelKey: 'star_fact_interior', value: 'He Fusion' },
            { labelKey: 'star_fact_storm', value: 'Stellar Winds' }
        ]
    },
    {
        id: 'supernova',
        nameKey: 'star_stage_supernova',
        descKey: 'star_desc_supernova',
        temperature: '> 1 Billion K',
        starRadius: 1.0, // Collapsed
        colorA: 0xffffff,
        colorB: 0xaaccff,
        noiseScale: 5.0, 
        nebulaOp: 0.0,
        nebulaScale: 0.0,
        jetOp: 0.0,
        diskOp: 0.0,
        shockScl: 30.0, // Explosion target
        shockOp: 1.0,
        pulsar: false,
        glowSize: 25.0,
        facts: [
            { labelKey: 'star_fact_brightness', value: '> Galaxy' },
            { labelKey: 'star_fact_product', value: 'Heavy Elements' },
            { labelKey: 'star_fact_mechanism', value: 'Core Collapse' },
            { labelKey: 'star_fact_remnant', value: 'Nebula' }
        ]
    },
    {
        id: 'neutron-star',
        nameKey: 'star_stage_neutron',
        descKey: 'star_desc_neutron',
        temperature: '~ 1 Million K',
        starRadius: 0.5, // Tiny but bright
        colorA: 0x88ffff, // Blue-white
        colorB: 0x0000ff,
        noiseScale: 0.1,
        nebulaOp: 0.3, 
        nebulaScale: 2.5,
        jetOp: 1.0, // Strong beams
        diskOp: 0.1, 
        shockScl: 40.0, 
        shockOp: 0.0,
        pulsar: true,
        glowSize: 4.0, // Large glow relative to size
        facts: [
            { labelKey: 'star_fact_density', value: 'Extreme' },
            { labelKey: 'star_fact_spin', value: 'Rapid' },
            { labelKey: 'star_fact_magnetic', value: 'Extreme' },
            { labelKey: 'star_fact_signal', value: 'Pulsar' }
        ]
    }
];

// --- App Class ---

class StarLifecycleApp {
    constructor() {
        this.container = document.getElementById('scene-canvas');
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        
        this.stageIndex = 0;
        this.isPlaying = false;
        this.autoTimer = 0;
        
        // Interpolation State
        this.state = {
            radius: 0.1,
            colorA: new THREE.Color(),
            colorB: new THREE.Color(),
            noiseScale: 1.0,
            nebulaOp: 1.0,
            nebulaScl: 1.0,
            jetOp: 0.0,
            diskOp: 0.0,
            shockScl: 0.1,
            shockOp: 0.0,
            glowSize: 1.0
        };
        
        this.targetState = null;

        this.init();
    }

    init() {
        this.initRenderer();
        this.initCamera();
        this.initControls();
        this.initLights();
        this.initObjects();
        this.initUI();
        
        // Initialize first stage
        this.setStage(0, false);
        
        window.addEventListener('resize', () => this.onResize());
        this.renderer.setAnimationLoop(() => this.render());
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.container, 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 10, 45);
        this.camera.lookAt(0, 0, 0);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }

    initLights() {
        this.starLight = new THREE.PointLight(0xffffff, 2, 200);
        this.scene.add(this.starLight);
        this.scene.add(new THREE.AmbientLight(0x111122, 0.5));
    }

    initObjects() {
        this.starUniforms = {
            time: { value: 0 },
            colorA: { value: new THREE.Color() },
            colorB: { value: new THREE.Color() },
            noiseScale: { value: 1.0 }
        };
        const starGeo = new THREE.SphereGeometry(1, 128, 128);
        const starMat = new THREE.ShaderMaterial({
            uniforms: this.starUniforms,
            vertexShader: StarVertexShader,
            fragmentShader: StarFragmentShader
        });
        this.starMesh = new THREE.Mesh(starGeo, starMat);
        this.scene.add(this.starMesh);

        const glowMap = this.createGlowTexture();
        const glowMat = new THREE.SpriteMaterial({ 
            map: glowMap, 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.starGlow = new THREE.Sprite(glowMat);
        this.starGlow.scale.set(5, 5, 1);
        this.scene.add(this.starGlow);

        // Nebula
        const pCount = 8000;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pSizes = new Float32Array(pCount);
        const cloudMap = this.createCloudTexture();
        
        for(let i=0; i<pCount; i++) {
            const r = 5 + Math.pow(Math.random(), 1.5) * 35;
            const branchAngle = (Math.random() * Math.PI * 2);
            const spiralAngle = r * 0.2;
            const theta = branchAngle + spiralAngle;
            
            const spread = 2.0;
            pPos[i*3] = r * Math.cos(theta) + (Math.random()-0.5)*spread;
            pPos[i*3+1] = (Math.random()-0.5) * (r * 0.2);
            pPos[i*3+2] = r * Math.sin(theta) + (Math.random()-0.5)*spread;
            pSizes[i] = Math.random() * 2.0 + 0.5;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));
        
        const pMat = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 1.0,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: cloudMap,
            sizeAttenuation: true
        });
        
        this.nebula = new THREE.Points(pGeo, pMat);
        this.scene.add(this.nebula);

        // Disk
        const diskGeo = new THREE.RingGeometry(3, 15, 128);
        const diskMat = new THREE.MeshBasicMaterial({
            color: 0xffaa66,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            map: this.createRingTexture()
        });
        this.disk = new THREE.Mesh(diskGeo, diskMat);
        this.disk.rotation.x = -Math.PI / 2;
        this.scene.add(this.disk);

        // Jets
        this.jets = new THREE.Group();
        const beamTexture = this.createBeamTexture();
        const beamGeo = new THREE.PlaneGeometry(2, 30);
        beamGeo.translate(0, 15, 0);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xaaccff,
            map: beamTexture,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const jet1 = new THREE.Mesh(beamGeo, beamMat);
        const jet2 = new THREE.Mesh(beamGeo, beamMat);
        jet2.rotation.y = Math.PI / 2;
        const topJet = new THREE.Group();
        topJet.add(jet1, jet2);
        const botJet = topJet.clone();
        botJet.rotation.x = Math.PI;
        this.jets.add(topJet, botJet);
        this.scene.add(this.jets);

        // Shockwave
        const shockGeo = new THREE.SphereGeometry(1, 64, 64);
        const shockMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.shockwave = new THREE.Mesh(shockGeo, shockMat);
        this.scene.add(this.shockwave);

        this.addBackground();
    }

    addBackground() {
        const count = 3000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            const r = 800 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
            pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.cos(phi);
            pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 1.5, color: 0xaaaaaa, transparent: true, opacity: 0.6, sizeAttenuation: false
        });
        this.scene.add(new THREE.Points(geo, mat));
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(256,256,0,256,256,256);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.2, 'rgba(255,255,255,0.4)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,512,512);
        return new THREE.CanvasTexture(canvas);
    }

    createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(64,64,0,64,64,64);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,128,128);
        return new THREE.CanvasTexture(canvas);
    }

    createBeamTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const g = ctx.createLinearGradient(0,0,0,512);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.1, 'rgba(255,255,255,1)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); 
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,128,512);
        const g2 = ctx.createLinearGradient(0,0,128,0);
        g2.addColorStop(0, 'rgba(255,255,255,0)');
        g2.addColorStop(0.5, 'rgba(255,255,255,1)');
        g2.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = g2;
        ctx.fillRect(0,0,128,512);
        return new THREE.CanvasTexture(canvas);
    }

    createRingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0,0,1024,128);
        for(let i=0; i<150; i++) {
            const x = Math.random() * 1024;
            const w = 50 + Math.random() * 200;
            const alpha = 0.1 + Math.random() * 0.4;
            const g = ctx.createLinearGradient(x,0,x+w,0);
            g.addColorStop(0, `rgba(255,200,150,0)`);
            g.addColorStop(0.5, `rgba(255,200,150,${alpha})`);
            g.addColorStop(1, `rgba(255,200,150,0)`);
            ctx.fillStyle = g;
            ctx.fillRect(x, 0, w, 128);
        }
        const t = new THREE.CanvasTexture(canvas);
        t.wrapS = THREE.RepeatWrapping;
        return t;
    }

    setStage(index, animate = true) {
        this.stageIndex = index;
        const data = STAGES[index];
        
        this.updateUI(data);

        this.targetState = {
            radius: data.starRadius,
            colorA: new THREE.Color(data.colorA),
            colorB: new THREE.Color(data.colorB),
            noiseScale: data.noiseScale,
            nebulaOp: data.nebulaOp,
            nebulaScl: data.nebulaScale,
            jetOp: data.jetOp,
            diskOp: data.diskOp,
            shockOp: data.shockOp,
            shockScl: data.shockScl,
            pulsar: data.pulsar,
            glowSize: data.glowSize
        };

        if(!animate) {
            Object.keys(this.targetState).forEach(k => {
                if(this.state[k] instanceof THREE.Color) {
                    this.state[k].copy(this.targetState[k]);
                } else {
                    this.state[k] = this.targetState[k];
                }
            });
        } else {
            if (data.id === 'supernova') {
                this.state.shockScl = 1.0; 
            }
        }
    }

    updateUI(data) {
        // Safe check if i18n loaded
        const get = window.i18n ? window.i18n.get.bind(window.i18n) : (k) => k;

        document.getElementById('stage-title').textContent = get(data.nameKey);
        document.getElementById('stage-description').textContent = get(data.descKey);
        document.getElementById('stage-temp').textContent = data.temperature;
        
        const facts = document.getElementById('stage-facts');
        facts.innerHTML = '';
        data.facts.forEach(f => {
            const li = document.createElement('li');
            // Use value from data, but could potentially translate values if needed
            li.innerHTML = `<strong>${get(f.labelKey)}</strong>${f.value}`;
            facts.appendChild(li);
        });

        document.querySelectorAll('.stage-chip').forEach((btn, i) => {
            btn.classList.toggle('active', i === this.stageIndex);
        });
    }

    initUI() {
        document.querySelectorAll('.stage-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.isPlaying = false;
                this.setStage(parseInt(btn.dataset.stage));
            });
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            this.isPlaying = false;
            this.nextStage();
        });
        
        document.getElementById('btn-prev').addEventListener('click', () => {
            this.isPlaying = false;
            let idx = this.stageIndex - 1;
            if(idx < 0) idx = STAGES.length - 1;
            this.setStage(idx);
        });

        document.getElementById('btn-play').addEventListener('click', (e) => {
            this.isPlaying = !this.isPlaying;
            const key = this.isPlaying ? 'btn_stop' : 'btn_auto';
            e.target.textContent = window.i18n ? window.i18n.get(key) : key;
        });

        const toggleBtn = document.getElementById('toggle-dock');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                const dock = document.getElementById('control-dock');
                if (dock) dock.classList.toggle('collapsed');
            });
        }

        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                const uiLayer = document.querySelector('.ui-layer');
                if (uiLayer) uiLayer.classList.toggle('collapsed');
            });
            // Auto collapse on mobile init
            if (window.innerWidth <= 980) {
                const uiLayer = document.querySelector('.ui-layer');
                if (uiLayer) uiLayer.classList.add('collapsed');
            }
        }

        // Language Listener
        window.addEventListener('languageChanged', () => {
            const data = STAGES[this.stageIndex];
            this.updateUI(data);
            
            const playBtn = document.getElementById('btn-play');
            if (playBtn) {
                const key = this.isPlaying ? 'btn_stop' : 'btn_auto';
                playBtn.textContent = window.i18n ? window.i18n.get(key) : (this.isPlaying ? "Stop" : "Auto Play");
            }
        });
    }

    nextStage() {
        let idx = (this.stageIndex + 1) % STAGES.length;
        this.setStage(idx);
    }

    update(delta) {
        if(this.isPlaying) {
            this.autoTimer += delta;
            if(this.autoTimer > 5) {
                this.autoTimer = 0;
                this.nextStage();
            }
        }

        const speed = 2.5 * delta;
        this.state.radius = THREE.MathUtils.lerp(this.state.radius, this.targetState.radius, speed);
        this.state.colorA.lerp(this.targetState.colorA, speed);
        this.state.colorB.lerp(this.targetState.colorB, speed);
        this.state.noiseScale = THREE.MathUtils.lerp(this.state.noiseScale, this.targetState.noiseScale, speed);
        
        this.state.nebulaOp = THREE.MathUtils.lerp(this.state.nebulaOp, this.targetState.nebulaOp, speed);
        this.state.nebulaScl = THREE.MathUtils.lerp(this.state.nebulaScl, this.targetState.nebulaScl, speed);
        this.state.jetOp = THREE.MathUtils.lerp(this.state.jetOp, this.targetState.jetOp, speed);
        this.state.diskOp = THREE.MathUtils.lerp(this.state.diskOp, this.targetState.diskOp, speed);
        this.state.glowSize = THREE.MathUtils.lerp(this.state.glowSize, this.targetState.glowSize, speed);

        if (this.stageIndex === 4) { // Supernova
            this.state.shockScl += delta * 20.0;
            this.state.shockOp = THREE.MathUtils.lerp(this.state.shockOp, 0, delta * 0.8);
        } else {
            this.state.shockOp = THREE.MathUtils.lerp(this.state.shockOp, this.targetState.shockOp, speed);
            this.state.shockScl = THREE.MathUtils.lerp(this.state.shockScl, this.targetState.shockScl, speed);
        }

        this.starMesh.scale.setScalar(this.state.radius);
        this.starUniforms.time.value += delta;
        this.starUniforms.colorA.value.copy(this.state.colorA);
        this.starUniforms.colorB.value.copy(this.state.colorB);
        this.starUniforms.noiseScale.value = this.state.noiseScale;
        
        this.starGlow.scale.setScalar(this.state.radius * 2.2 + this.state.glowSize);
        this.starGlow.material.color.copy(this.state.colorA);
        
        if (this.targetState.pulsar) {
            const spinSpeed = 20.0;
            this.starMesh.rotation.y += delta * spinSpeed; 
            this.jets.rotation.y = this.starMesh.rotation.y;
            this.jets.rotation.z = Math.sin(this.clock.elapsedTime * 5) * 0.2; 
        } else {
            this.starMesh.rotation.y += delta * 0.1;
            this.jets.rotation.y += delta * 0.1;
            this.jets.rotation.z = 0;
        }

        this.starLight.color.copy(this.state.colorA);
        this.starLight.intensity = this.state.radius * 0.8;

        this.nebula.visible = this.state.nebulaOp > 0.01;
        if(this.nebula.visible) {
            this.nebula.material.opacity = this.state.nebulaOp * 0.6;
            this.nebula.rotation.y += delta * 0.02;
            const ns = Math.max(0.1, this.state.nebulaScl * 5.0); 
            this.nebula.scale.setScalar(ns);
        }

        this.disk.visible = this.state.diskOp > 0.01;
        if(this.disk.visible) {
            this.disk.material.opacity = this.state.diskOp * 0.8;
            this.disk.rotation.z += delta * 0.8;
        }

        this.jets.visible = this.state.jetOp > 0.01;
        if(this.jets.visible) {
            const op = this.state.jetOp * (0.6 + Math.random()*0.4);
            this.jets.children.forEach(group => {
                group.children.forEach(mesh => mesh.material.opacity = op);
            });
            const s = 1 + Math.random() * 0.1;
            this.jets.scale.set(1, s, 1);
        }

        this.shockwave.visible = this.state.shockOp > 0.01;
        if(this.shockwave.visible) {
            this.shockwave.scale.setScalar(this.state.shockScl);
            this.shockwave.material.opacity = this.state.shockOp;
        }
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    render() {
        const delta = this.clock.getDelta();
        this.controls.update();
        this.update(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

new StarLifecycleApp();
