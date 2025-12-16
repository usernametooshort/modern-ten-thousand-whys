import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// NANO BANANA PRO: Post-processing from CDN (local libs don't have these)
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

// --- NANO BANANA PRO: Advanced Star Shaders ---

const StarVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vFresnel;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    // Pre-compute fresnel for limb darkening
    vec3 viewDir = normalize(-mvPosition.xyz);
    vFresnel = dot(vNormal, viewDir);
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

const StarFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vFresnel;

uniform float time;
uniform vec3 colorA;
uniform vec3 colorB;
uniform float noiseScale;
uniform float limbDarkening;
uniform float coronaIntensity;

// Advanced 3D Simplex Noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion for turbulence
float fbm(vec3 p) {
    float f = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 5; i++) {
        f += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return f;
}

void main() {
    // Multi-octave plasma turbulence
    vec3 p = vPosition * noiseScale;
    float slowTime = time * 0.15;
    float fastTime = time * 0.4;
    
    // Large-scale convection cells
    float cells = fbm(p * 0.5 + slowTime);
    
    // Medium turbulence
    float turb1 = fbm(p * 1.5 + vec3(slowTime, 0.0, slowTime));
    
    // Fast small-scale granulation
    float granulation = snoise(p * 4.0 + fastTime) * 0.3;
    
    // Combine for plasma effect
    float plasma = cells * 0.5 + turb1 * 0.35 + granulation * 0.15;
    plasma = plasma * 0.5 + 0.5; // Normalize to 0-1
    
    // Hot spots (solar flares hint)
    float hotspots = pow(max(0.0, snoise(p * 2.0 + slowTime * 2.0)), 3.0);
    
    // Color mixing with temperature gradient
    vec3 coolColor = colorB;
    vec3 hotColor = colorA;
    vec3 superHot = vec3(1.0, 1.0, 0.9); // White-hot for peaks
    
    vec3 baseColor = mix(coolColor, hotColor, plasma);
    baseColor = mix(baseColor, superHot, hotspots * 0.5);
    
    // LIMB DARKENING - realistic stellar edge darkening
    float limbFactor = pow(max(0.0, vFresnel), limbDarkening);
    baseColor *= 0.3 + 0.7 * limbFactor;
    
    // Corona glow at edges
    float corona = pow(1.0 - max(0.0, vFresnel), 3.0);
    vec3 coronaColor = mix(hotColor, vec3(1.0, 0.9, 0.7), 0.5);
    baseColor += coronaColor * corona * coronaIntensity;
    
    // Intensity boost for stellar brightness
    baseColor *= 1.5;
    
    gl_FragColor = vec4(baseColor, 1.0);
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
        this.initPostProcessing();  // NANO BANANA PRO: Initialize bloom after camera
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
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 10, 45);
        this.camera.lookAt(0, 0, 0);
    }

    // NANO BANANA PRO: Bloom Post-Processing for stellar glow
    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,   // strength
            0.4,   // radius
            0.85   // threshold
        );
        this.composer.addPass(this.bloomPass);
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
            noiseScale: { value: 1.0 },
            limbDarkening: { value: 0.6 },     // NANO BANANA PRO: Realistic limb darkening
            coronaIntensity: { value: 0.5 }    // Corona glow at edges
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

        for (let i = 0; i < pCount; i++) {
            const r = 5 + Math.pow(Math.random(), 1.5) * 35;
            const branchAngle = (Math.random() * Math.PI * 2);
            const spiralAngle = r * 0.2;
            const theta = branchAngle + spiralAngle;

            const spread = 2.0;
            pPos[i * 3] = r * Math.cos(theta) + (Math.random() - 0.5) * spread;
            pPos[i * 3 + 1] = (Math.random() - 0.5) * (r * 0.2);
            pPos[i * 3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * spread;
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
        for (let i = 0; i < count; i++) {
            const r = 800 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
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
        const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.2, 'rgba(255,255,255,0.4)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);
        return new THREE.CanvasTexture(canvas);
    }

    createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }

    createBeamTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.1, 'rgba(255,255,255,1)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 512);
        const g2 = ctx.createLinearGradient(0, 0, 128, 0);
        g2.addColorStop(0, 'rgba(255,255,255,0)');
        g2.addColorStop(0.5, 'rgba(255,255,255,1)');
        g2.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, 128, 512);
        return new THREE.CanvasTexture(canvas);
    }

    createRingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, 1024, 128);
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * 1024;
            const w = 50 + Math.random() * 200;
            const alpha = 0.1 + Math.random() * 0.4;
            const g = ctx.createLinearGradient(x, 0, x + w, 0);
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

        if (!animate) {
            Object.keys(this.targetState).forEach(k => {
                if (this.state[k] instanceof THREE.Color) {
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
            if (idx < 0) idx = STAGES.length - 1;
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
        if (this.isPlaying) {
            this.autoTimer += delta;
            if (this.autoTimer > 5) {
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
        if (this.nebula.visible) {
            this.nebula.material.opacity = this.state.nebulaOp * 0.6;
            this.nebula.rotation.y += delta * 0.02;
            const ns = Math.max(0.1, this.state.nebulaScl * 5.0);
            this.nebula.scale.setScalar(ns);
        }

        this.disk.visible = this.state.diskOp > 0.01;
        if (this.disk.visible) {
            this.disk.material.opacity = this.state.diskOp * 0.8;
            this.disk.rotation.z += delta * 0.8;
        }

        this.jets.visible = this.state.jetOp > 0.01;
        if (this.jets.visible) {
            const op = this.state.jetOp * (0.6 + Math.random() * 0.4);
            this.jets.children.forEach(group => {
                group.children.forEach(mesh => mesh.material.opacity = op);
            });
            const s = 1 + Math.random() * 0.1;
            this.jets.scale.set(1, s, 1);
        }

        this.shockwave.visible = this.state.shockOp > 0.01;
        if (this.shockwave.visible) {
            this.shockwave.scale.setScalar(this.state.shockScl);
            this.shockwave.material.opacity = this.state.shockOp;
        }
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    render() {
        const delta = this.clock.getDelta();
        this.controls.update();
        this.update(delta);
        // NANO BANANA PRO: Use bloom compositor instead of direct render
        this.composer.render();
    }
}

new StarLifecycleApp();
