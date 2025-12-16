import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================
// NANO BANANA PRO - Plate Tectonics Visualization
// Professional Geological Accuracy + Stunning Visual Effects
// ============================================================

// --- GLSL Shaders ---

const MantleVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const MantleFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
uniform float time;
uniform vec3 colorHot;
uniform vec3 colorCool;

// Simplex noise functions
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
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
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
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
    // Convection cell pattern
    vec3 flowPos = vPos * 0.3 + vec3(0.0, time * 0.1, 0.0);
    float convection = snoise(flowPos);
    float convection2 = snoise(vPos * 0.6 - vec3(time * 0.05, 0.0, 0.0));
    
    // Temperature based on depth (y position)
    float depth = 1.0 - (vPos.y + 5.0) / 10.0;
    depth = clamp(depth, 0.0, 1.0);
    
    // Mix colors based on temperature and convection
    float temp = depth + convection * 0.3;
    vec3 color = mix(colorCool, colorHot, temp);
    
    // Add bright veins for rising magma
    float veins = pow(max(0.0, convection2), 3.0);
    color += vec3(1.0, 0.5, 0.1) * veins * 0.5;
    
    // Emissive glow
    float glow = pow(temp, 2.0) * 0.5;
    color += vec3(1.0, 0.3, 0.0) * glow;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// Volcanic eruption shader
const LavaFragmentShader = `
varying vec2 vUv;
varying vec3 vPos;
uniform float time;

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
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
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
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
    float n = snoise(vPos * 2.0 + vec3(time * 0.5, 0.0, 0.0));
    float n2 = snoise(vPos * 4.0 - vec3(0.0, time * 0.3, 0.0));
    
    // Lava colors
    vec3 hotLava = vec3(1.0, 0.8, 0.0);
    vec3 coolLava = vec3(0.8, 0.1, 0.0);
    vec3 blackCrust = vec3(0.1, 0.05, 0.02);
    
    float heat = n * 0.5 + n2 * 0.5;
    vec3 color = mix(coolLava, hotLava, heat * 0.5 + 0.5);
    
    // Add cooled crust patches
    float crust = step(0.6, n);
    color = mix(color, blackCrust, crust * 0.5);
    
    // Emissive glow
    color += vec3(1.0, 0.5, 0.0) * pow(max(heat, 0.0), 2.0);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// --- Texture Generators ---
function createRockTexture(colorHex, type = 'continental') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const baseColor = new THREE.Color(colorHex);
    ctx.fillStyle = '#' + baseColor.getHexString();
    ctx.fillRect(0, 0, 1024, 1024);

    if (type === 'oceanic') {
        // Basalt-like texture with pillow lava patterns
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const r = 20 + Math.random() * 40;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
            gradient.addColorStop(0, 'rgba(40, 50, 60, 0.3)');
            gradient.addColorStop(0.7, 'rgba(30, 40, 50, 0.2)');
            gradient.addColorStop(1, 'rgba(20, 30, 40, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Continental crust with granite-like speckles
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const s = Math.random() * 6;
            const colors = ['rgba(0,0,0,0.15)', 'rgba(255,255,255,0.1)', 'rgba(180,160,140,0.1)'];
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillRect(x, y, s, s);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.8)');
    gradient.addColorStop(0.6, 'rgba(200, 50, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
}

function createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(80, 80, 80, 0.8)');
    gradient.addColorStop(0.5, 'rgba(60, 60, 60, 0.4)');
    gradient.addColorStop(1, 'rgba(40, 40, 40, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
}

// ============================================================
// MAIN APPLICATION CLASS
// ============================================================

class TectonicsApp {
    constructor() {
        this.container = document.getElementById('scene-canvas');
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.currentMode = 'divergent';

        // Particle systems
        this.magmaParticles = [];
        this.smokeParticles = [];
        this.seismicWaves = [];
        this.hydrothermalVents = [];

        this.params = {
            speed: 1.0,
            showEarthquakes: true,
            showMagma: true,
            showConvection: true,
            showLabels: true
        };

        this.initRenderer();
        this.initCamera();
        this.initControls();
        this.initPostProcessing();
        this.initLights();
        this.initMaterials();
        this.initSceneObjects();
        this.bindUI();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('languageChanged', () => this.updateUI());

        if (window.i18n) this.updateUI();

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
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 80;
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        // Bloom for magma glow
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.composer.addPass(bloomPass);
        this.bloomPass = bloomPass;
    }

    initLights() {
        // Ambient
        const ambient = new THREE.AmbientLight(0x404050, 0.4);
        this.scene.add(ambient);

        // Main directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(15, 30, 15);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 100;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -30;
        sun.shadow.bias = -0.0001;
        this.scene.add(sun);

        // Under-lighting from mantle
        const mantleGlow = new THREE.PointLight(0xff4400, 2, 20);
        mantleGlow.position.set(0, -5, 0);
        this.scene.add(mantleGlow);
        this.mantleLight = mantleGlow;

        // Rim light
        const rim = new THREE.DirectionalLight(0x4488ff, 0.5);
        rim.position.set(-10, 5, -10);
        this.scene.add(rim);
    }

    initMaterials() {
        // Continental crust (granite-like)
        const texContinental = createRockTexture(0x8b7355, 'continental');
        this.matContinental = new THREE.MeshStandardMaterial({
            map: texContinental,
            roughness: 0.85,
            metalness: 0.05,
            bumpMap: texContinental,
            bumpScale: 0.3
        });

        // Oceanic crust (basalt-like)
        const texOceanic = createRockTexture(0x2a3a4a, 'oceanic');
        this.matOceanic = new THREE.MeshStandardMaterial({
            map: texOceanic,
            roughness: 0.7,
            metalness: 0.15,
            bumpMap: texOceanic,
            bumpScale: 0.2
        });

        // Lithospheric mantle
        this.matLithosphere = new THREE.MeshStandardMaterial({
            color: 0x4a3a2a,
            roughness: 0.9,
            metalness: 0.1
        });

        // Asthenosphere (convecting mantle)
        this.matMantle = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorHot: { value: new THREE.Color(0xff4400) },
                colorCool: { value: new THREE.Color(0x661100) }
            },
            vertexShader: MantleVertexShader,
            fragmentShader: MantleFragmentShader
        });

        // Lava material
        this.matLava = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: MantleVertexShader,
            fragmentShader: LavaFragmentShader
        });

        // Ocean water
        this.matOcean = new THREE.MeshPhysicalMaterial({
            color: 0x0066aa,
            transmission: 0.8,
            opacity: 0.7,
            transparent: true,
            roughness: 0.1,
            ior: 1.33,
            thickness: 3.0,
            metalness: 0.0
        });

        // Particle materials
        this.glowTexture = createGlowTexture();
        this.smokeTexture = createSmokeTexture();
    }

    initSceneObjects() {
        this.plateGroup = new THREE.Group();
        this.scene.add(this.plateGroup);

        this.labelGroup = new THREE.Group();
        this.scene.add(this.labelGroup);

        this.buildDivergent();
    }

    clearScene() {
        // Clear plates
        while (this.plateGroup.children.length > 0) {
            const child = this.plateGroup.children[0];
            this.plateGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
        }

        // Clear labels
        while (this.labelGroup.children.length > 0) {
            this.labelGroup.remove(this.labelGroup.children[0]);
        }

        // Clear particles
        this.magmaParticles.forEach(p => this.scene.remove(p));
        this.smokeParticles.forEach(p => this.scene.remove(p));
        this.seismicWaves.forEach(w => this.scene.remove(w));
        this.hydrothermalVents.forEach(v => this.scene.remove(v.group));

        this.magmaParticles = [];
        this.smokeParticles = [];
        this.seismicWaves = [];
        this.hydrothermalVents = [];
    }

    // ============================================================
    // TERRAIN CREATION
    // ============================================================

    createLayeredPlate(w, d, options = {}) {
        const group = new THREE.Group();
        const {
            crustMaterial = this.matOceanic,
            crustThickness = 1,
            lithosphereThickness = 2,
            roughness = 0.3,
            hasMountains = false,
            hasWater = false,
            waterDepth = 0.5
        } = options;

        // Create crust with terrain
        const crustGeo = this.createTerrainGeometry(w, crustThickness, d, roughness, hasMountains);
        const crust = new THREE.Mesh(crustGeo, crustMaterial);
        crust.position.y = lithosphereThickness / 2;
        crust.castShadow = true;
        crust.receiveShadow = true;
        group.add(crust);

        // Lithospheric mantle layer
        const lithoGeo = new THREE.BoxGeometry(w, lithosphereThickness, d);
        const litho = new THREE.Mesh(lithoGeo, this.matLithosphere);
        litho.position.y = -lithosphereThickness / 2;
        litho.castShadow = true;
        group.add(litho);

        // Water layer if oceanic
        if (hasWater) {
            const waterGeo = new THREE.BoxGeometry(w * 1.02, waterDepth, d * 1.02);
            const water = new THREE.Mesh(waterGeo, this.matOcean);
            water.position.y = crustThickness + lithosphereThickness / 2 + waterDepth / 2;
            group.add(water);
        }

        return group;
    }

    createTerrainGeometry(w, h, d, roughness, hasMountains) {
        const wSegs = Math.max(Math.floor(w * 4), 8);
        const dSegs = Math.max(Math.floor(d * 4), 8);
        const geo = new THREE.BoxGeometry(w, h, d, wSegs, 1, dSegs);

        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            if (y > h / 2 - 0.01) {
                const x = pos.getX(i);
                const z = pos.getZ(i);

                // Multi-octave noise
                let noise = Math.sin(x * 0.5) * Math.cos(z * 0.3) * 0.2;
                noise += Math.sin(x * 2) * Math.cos(z * 1.5) * 0.1;
                noise += (Math.random() - 0.5) * roughness * 0.5;

                // Mountain range
                if (hasMountains && x > w * 0.2) {
                    const mountainHeight = Math.exp(-Math.pow((x - w * 0.35) / 2, 2)) * 2;
                    noise += mountainHeight * (0.8 + Math.random() * 0.4);
                }

                pos.setY(i, y + noise);
            }
        }

        geo.computeVertexNormals();
        return geo;
    }

    createMidOceanRidge(length, width) {
        const group = new THREE.Group();

        // Create rift valley shape
        const ridgeGeo = new THREE.PlaneGeometry(width, length, 32, 64);
        const pos = ridgeGeo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);

            // V-shaped valley at center
            const valleyDepth = Math.exp(-Math.pow(x / (width * 0.1), 2)) * 0.5;
            const ridgeHeight = Math.abs(x) / (width * 0.5) * 0.3;

            pos.setZ(i, ridgeHeight - valleyDepth + (Math.random() - 0.5) * 0.1);
        }

        ridgeGeo.computeVertexNormals();
        ridgeGeo.rotateX(-Math.PI / 2);

        const ridge = new THREE.Mesh(ridgeGeo, this.matLava);
        group.add(ridge);

        return group;
    }

    // ============================================================
    // DIVERGENT BOUNDARY (MID-OCEAN RIDGE)
    // ============================================================

    buildDivergent() {
        this.clearScene();
        this.currentMode = 'divergent';
        this.updateUI();

        const plateWidth = 12;
        const plateDepth = 14;

        // Left oceanic plate
        this.plateL = this.createLayeredPlate(plateWidth, plateDepth, {
            crustMaterial: this.matOceanic,
            crustThickness: 0.8,
            lithosphereThickness: 2,
            roughness: 0.15,
            hasWater: true,
            waterDepth: 0.8
        });
        this.plateL.position.set(-plateWidth / 2 - 0.5, 0, 0);
        this.plateGroup.add(this.plateL);

        // Right oceanic plate
        this.plateR = this.createLayeredPlate(plateWidth, plateDepth, {
            crustMaterial: this.matOceanic,
            crustThickness: 0.8,
            lithosphereThickness: 2,
            roughness: 0.15,
            hasWater: true,
            waterDepth: 0.8
        });
        this.plateR.position.set(plateWidth / 2 + 0.5, 0, 0);
        this.plateGroup.add(this.plateR);

        // Mid-ocean ridge (central rift)
        this.ridge = this.createMidOceanRidge(plateDepth, 3);
        this.ridge.position.set(0, 1.5, 0);
        this.plateGroup.add(this.ridge);

        // Asthenosphere (convecting mantle)
        const mantleGeo = new THREE.BoxGeometry(40, 8, 18);
        this.mantle = new THREE.Mesh(mantleGeo, this.matMantle);
        this.mantle.position.set(0, -6, 0);
        this.plateGroup.add(this.mantle);

        // Add hydrothermal vents
        this.addHydrothermalVent(new THREE.Vector3(0, 2, -3));
        this.addHydrothermalVent(new THREE.Vector3(0, 2, 3));

        // Add labels
        this.addLabel('Spreading Center', new THREE.Vector3(0, 4, 0));
        this.addLabel('New Oceanic Crust', new THREE.Vector3(-4, 3, 0));
        this.addLabel('Asthenosphere', new THREE.Vector3(0, -4, 8));
    }

    addHydrothermalVent(position) {
        const group = new THREE.Group();
        group.position.copy(position);

        // Vent chimney
        const chimneyGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.8, 8);
        const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
        const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimney.position.y = 0.4;
        group.add(chimney);

        this.scene.add(group);
        this.hydrothermalVents.push({
            group,
            spawnTimer: 0,
            position
        });
    }

    // ============================================================
    // CONVERGENT BOUNDARY (SUBDUCTION ZONE)
    // ============================================================

    buildConvergent() {
        this.clearScene();
        this.currentMode = 'convergent';
        this.updateUI();

        // Subducting oceanic plate
        this.plateL = this.createLayeredPlate(14, 12, {
            crustMaterial: this.matOceanic,
            crustThickness: 0.7,
            lithosphereThickness: 2,
            roughness: 0.1,
            hasWater: true,
            waterDepth: 1
        });
        this.plateL.rotation.z = -Math.PI / 10;
        this.plateL.position.set(-8, 0, 0);
        this.plateGroup.add(this.plateL);

        // Overriding continental plate with volcanic arc
        this.plateR = this.createLayeredPlate(12, 12, {
            crustMaterial: this.matContinental,
            crustThickness: 2,
            lithosphereThickness: 3,
            roughness: 0.4,
            hasMountains: true
        });
        this.plateR.position.set(6, 1, 0);
        this.plateGroup.add(this.plateR);

        // Add volcanic arc
        this.addVolcanicArc();

        // Asthenosphere
        const mantleGeo = new THREE.BoxGeometry(40, 10, 16);
        this.mantle = new THREE.Mesh(mantleGeo, this.matMantle);
        this.mantle.position.set(0, -8, 0);
        this.plateGroup.add(this.mantle);

        // Add Benioff zone earthquake markers
        this.addBenioffZone();

        // Labels
        this.addLabel('Volcanic Arc', new THREE.Vector3(4, 6, 0));
        this.addLabel('Subducting Plate', new THREE.Vector3(-6, -1, 0));
        this.addLabel('Trench', new THREE.Vector3(-2, 1, 0));
        this.addLabel('Benioff Zone', new THREE.Vector3(0, -4, 6));
    }

    addVolcanicArc() {
        this.volcanoes = [];

        for (let i = 0; i < 4; i++) {
            const z = -4 + i * 2.5;
            const x = 3 + Math.random() * 2;

            // Volcano cone
            const height = 1.5 + Math.random() * 1;
            const coneGeo = new THREE.ConeGeometry(1.2, height, 16);
            const coneMat = new THREE.MeshStandardMaterial({
                color: 0x4a3a2a,
                roughness: 0.9
            });
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.position.set(x, 4 + height / 2, z);
            cone.castShadow = true;
            this.plateGroup.add(cone);

            // Crater with lava
            const craterGeo = new THREE.CylinderGeometry(0.3, 0.5, 0.3, 16);
            const crater = new THREE.Mesh(craterGeo, this.matLava);
            crater.position.set(x, 4 + height - 0.1, z);
            this.plateGroup.add(crater);

            this.volcanoes.push({ cone, crater, x, z, height });
        }
    }

    addBenioffZone() {
        // Create earthquake focus markers along subduction path
        this.benioffMarkers = [];

        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const x = -5 + t * 8;
            const y = -t * 6;
            const z = (Math.random() - 0.5) * 8;

            const markerGeo = new THREE.SphereGeometry(0.15, 8, 8);
            const markerMat = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.7
            });
            const marker = new THREE.Mesh(markerGeo, markerMat);
            marker.position.set(x, y, z);
            this.plateGroup.add(marker);

            this.benioffMarkers.push({ marker, baseOpacity: 0.5 + Math.random() * 0.3 });
        }
    }

    // ============================================================
    // TRANSFORM BOUNDARY (STRIKE-SLIP FAULT)
    // ============================================================

    buildTransform() {
        this.clearScene();
        this.currentMode = 'transform';
        this.updateUI();

        const plateWidth = 16;
        const plateDepth = 6;

        // North plate (moving east)
        this.plateL = this.createLayeredPlate(plateWidth, plateDepth, {
            crustMaterial: this.matContinental,
            crustThickness: 2,
            lithosphereThickness: 3,
            roughness: 0.3
        });
        this.plateL.position.set(0, 0, plateDepth / 2 + 0.3);
        this.plateGroup.add(this.plateL);

        // South plate (moving west)
        this.plateR = this.createLayeredPlate(plateWidth, plateDepth, {
            crustMaterial: this.matContinental,
            crustThickness: 2,
            lithosphereThickness: 3,
            roughness: 0.3
        });
        this.plateR.position.set(0, 0, -plateDepth / 2 - 0.3);
        this.plateGroup.add(this.plateR);

        // Fault zone
        this.addFaultZone();

        // Asthenosphere
        const mantleGeo = new THREE.BoxGeometry(24, 6, 18);
        this.mantle = new THREE.Mesh(mantleGeo, this.matMantle);
        this.mantle.position.set(0, -6, 0);
        this.plateGroup.add(this.mantle);

        // Labels
        this.addLabel('Strike-Slip Fault', new THREE.Vector3(0, 4, 0));
        this.addLabel('Plate Motion →', new THREE.Vector3(-6, 2, 4));
        this.addLabel('← Plate Motion', new THREE.Vector3(6, 2, -4));
    }

    addFaultZone() {
        // Crushed rock zone along fault
        const faultGeo = new THREE.BoxGeometry(18, 0.5, 0.6);
        const faultMat = new THREE.MeshStandardMaterial({
            color: 0x332211,
            roughness: 1.0
        });
        const fault = new THREE.Mesh(faultGeo, faultMat);
        fault.position.set(0, 2, 0);
        this.plateGroup.add(fault);

        // Add offset features (rivers/geological markers)
        for (let i = 0; i < 3; i++) {
            const x = -6 + i * 6;

            // North side marker
            const markerN = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.5, 1),
                new THREE.MeshStandardMaterial({ color: 0x2244aa })
            );
            markerN.position.set(x + 1, 2.5, 2);
            this.plateGroup.add(markerN);

            // South side marker (offset)
            const markerS = markerN.clone();
            markerS.position.set(x - 1, 2.5, -2);
            this.plateGroup.add(markerS);
        }
    }

    // ============================================================
    // PARTICLE EFFECTS
    // ============================================================

    spawnMagmaParticle(position, velocity) {
        const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 0.5 + Math.random() * 0.5, 0),
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.copy(position);
        particle.userData = {
            velocity: velocity.clone(),
            age: 0,
            maxAge: 2 + Math.random()
        };
        this.scene.add(particle);
        this.magmaParticles.push(particle);
    }

    spawnSmokeParticle(position) {
        const mat = new THREE.SpriteMaterial({
            map: this.smokeTexture,
            transparent: true,
            opacity: 0.6,
            blending: THREE.NormalBlending
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(position);
        sprite.scale.setScalar(0.3);
        sprite.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                0.5 + Math.random() * 0.3,
                (Math.random() - 0.5) * 0.2
            ),
            age: 0,
            maxAge: 3 + Math.random() * 2
        };
        this.scene.add(sprite);
        this.smokeParticles.push(sprite);
    }

    spawnSeismicWave(position, intensity = 1) {
        const geo = new THREE.RingGeometry(0.1, 0.3, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff3333,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(geo, mat);
        wave.position.copy(position);
        wave.rotation.x = -Math.PI / 2;
        wave.userData = {
            age: 0,
            maxAge: 1.5,
            intensity
        };
        this.scene.add(wave);
        this.seismicWaves.push(wave);
    }

    // ============================================================
    // LABELS
    // ============================================================

    addLabel(text, position) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(0, 0, 512, 128, 16);
        ctx.fill();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(position);
        sprite.scale.set(4, 1, 1);
        this.labelGroup.add(sprite);
    }

    // ============================================================
    // UPDATE LOOP
    // ============================================================

    update(delta) {
        const time = this.clock.getElapsedTime();
        const speed = this.params.speed;

        // Update shader uniforms
        this.matMantle.uniforms.time.value = time;
        this.matLava.uniforms.time.value = time;

        // Animate mantle light
        this.mantleLight.intensity = 2 + Math.sin(time * 2) * 0.5;

        // Mode-specific updates
        if (this.currentMode === 'divergent') {
            this.updateDivergent(time, delta, speed);
        } else if (this.currentMode === 'convergent') {
            this.updateConvergent(time, delta, speed);
        } else if (this.currentMode === 'transform') {
            this.updateTransform(time, delta, speed);
        }

        // Update particles
        this.updateParticles(delta);
    }

    updateDivergent(time, delta, speed) {
        // Plates spreading apart
        const offset = (time * 0.3 * speed) % 3;
        this.plateL.position.x = -7 - offset;
        this.plateR.position.x = 7 + offset;

        // Hydrothermal vent smoke
        this.hydrothermalVents.forEach(vent => {
            vent.spawnTimer += delta;
            if (vent.spawnTimer > 0.1) {
                vent.spawnTimer = 0;
                this.spawnSmokeParticle(vent.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
            }
        });

        // Magma at ridge
        if (this.params.showMagma && Math.random() < 0.1 * speed) {
            this.spawnMagmaParticle(
                new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.5, (Math.random() - 0.5) * 10),
                new THREE.Vector3(0, 0.5 + Math.random() * 0.5, 0)
            );
        }
    }

    updateConvergent(time, delta, speed) {
        // Subducting plate motion
        const cycle = (time * 0.15 * speed) % 1.5;
        this.plateL.position.x = -8 + cycle * 2;
        this.plateL.position.y = -cycle * 1.5;

        // Benioff zone earthquakes
        if (this.benioffMarkers && this.params.showEarthquakes) {
            this.benioffMarkers.forEach((b, i) => {
                const pulse = Math.sin(time * 3 + i) * 0.5 + 0.5;
                b.marker.material.opacity = b.baseOpacity * pulse;
                b.marker.scale.setScalar(1 + pulse * 0.3);

                // Random earthquake
                if (Math.random() < 0.002) {
                    this.spawnSeismicWave(b.marker.position.clone());
                }
            });
        }

        // Volcanic eruptions
        if (this.volcanoes && this.params.showMagma) {
            this.volcanoes.forEach((v, i) => {
                if (Math.random() < 0.02 * speed) {
                    const pos = new THREE.Vector3(v.x, 4 + v.height, v.z);
                    this.spawnMagmaParticle(
                        pos,
                        new THREE.Vector3(
                            (Math.random() - 0.5) * 2,
                            3 + Math.random() * 2,
                            (Math.random() - 0.5) * 2
                        )
                    );
                    this.spawnSmokeParticle(pos);
                }
            });
        }
    }

    updateTransform(time, delta, speed) {
        // Plates sliding past each other
        const offset = (time * 0.5 * speed) % 4;
        this.plateL.position.x = -2 + offset;
        this.plateR.position.x = 2 - offset;

        // Earthquakes along fault
        if (this.params.showEarthquakes && Math.random() < 0.02 * speed) {
            this.spawnSeismicWave(
                new THREE.Vector3((Math.random() - 0.5) * 12, 2, 0)
            );
        }
    }

    updateParticles(delta) {
        // Update magma particles
        for (let i = this.magmaParticles.length - 1; i >= 0; i--) {
            const p = this.magmaParticles[i];
            p.userData.velocity.y -= 3 * delta; // Gravity
            p.position.addScaledVector(p.userData.velocity, delta);
            p.userData.age += delta;

            const life = 1 - p.userData.age / p.userData.maxAge;
            p.material.opacity = life;
            p.scale.setScalar(1 + (1 - life) * 0.5);

            // Color cooling
            const coolFactor = Math.pow(life, 2);
            p.material.color.setRGB(1, 0.3 + coolFactor * 0.5, coolFactor * 0.2);

            if (p.userData.age > p.userData.maxAge || p.position.y < -10) {
                this.scene.remove(p);
                this.magmaParticles.splice(i, 1);
            }
        }

        // Update smoke particles
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.position.addScaledVector(p.userData.velocity, delta);
            p.userData.age += delta;

            const life = 1 - p.userData.age / p.userData.maxAge;
            p.material.opacity = life * 0.5;
            p.scale.setScalar(0.3 + (1 - life) * 1.5);

            if (p.userData.age > p.userData.maxAge) {
                this.scene.remove(p);
                this.smokeParticles.splice(i, 1);
            }
        }

        // Update seismic waves
        for (let i = this.seismicWaves.length - 1; i >= 0; i--) {
            const w = this.seismicWaves[i];
            w.userData.age += delta;

            const t = w.userData.age / w.userData.maxAge;
            const scale = 1 + t * 10 * w.userData.intensity;
            w.scale.setScalar(scale);
            w.material.opacity = (1 - t) * 0.8;

            if (w.userData.age > w.userData.maxAge) {
                this.scene.remove(w);
                this.seismicWaves.splice(i, 1);
            }
        }
    }

    // ============================================================
    // UI & CONTROLS
    // ============================================================

    updateUI() {
        const el = document.getElementById('boundary-desc');
        if (!el) return;

        const keys = {
            divergent: 'tect_desc_div',
            convergent: 'tect_desc_con',
            transform: 'tect_desc_trans'
        };

        if (window.i18n) {
            el.textContent = window.i18n.get(keys[this.currentMode]);
        }
    }

    bindUI() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const mode = btn.dataset.mode;
                if (mode === 'divergent') this.buildDivergent();
                else if (mode === 'convergent') this.buildConvergent();
                else if (mode === 'transform') this.buildTransform();
            });
        });

        // Toggle switches
        const toggleEq = document.getElementById('toggle-waves');
        if (toggleEq) {
            toggleEq.addEventListener('change', e => this.params.showEarthquakes = e.target.checked);
        }

        const toggleMagma = document.getElementById('toggle-magma');
        if (toggleMagma) {
            toggleMagma.addEventListener('change', e => this.params.showMagma = e.target.checked);
        }

        // Reset button
        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.controls.reset());
        }

        // Mobile sidebar
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
            if (window.innerWidth <= 768) sidebar.classList.add('collapsed');
        }
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        this.composer.setSize(w, h);
        this.bloomPass.resolution.set(w, h);
    }

    render() {
        const delta = this.clock.getDelta();
        this.controls.update();
        this.update(delta);
        this.composer.render();
    }
}

new TectonicsApp();
