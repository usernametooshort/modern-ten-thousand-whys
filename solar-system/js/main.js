import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Configuration
const CONFIG = {
    orbitSpeedMultiplier: 0.2, // Slower orbits for cinematic feel
    visualScale: 1.0,
    cameraFOV: 45,
    cameraNear: 0.1,
    cameraFar: 5000, // Further view distance
    bgColor: 0x000000,
};

// Shaders
const AtmosphereVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const AtmosphereFragmentShader = `
varying vec3 vNormal;
uniform vec3 color;
uniform float intensity;
uniform float power;

void main() {
    float alpha = pow(intensity + dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
    gl_FragColor = vec4(color, alpha);
}
`;

const SunVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
uniform float time;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    // Subtle pulsation
    // pos += normal * sin(time * 2.0) * 0.05;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const SunFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
uniform float time;
uniform sampler2D noiseTexture;

// Simplex 3D Noise 
// (Simplified inline implementation or use texture for performance)
// We'll use a procedural noise approach based on UV and Time

float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    // Moving noise layers
    float n1 = noise(vUv * 10.0 + vec2(time * 0.1, time * 0.2));
    float n2 = noise(vUv * 20.0 - vec2(time * 0.2, time * 0.1));
    float n3 = noise(vUv * 5.0 + vec2(0.0, time * 0.05));
    
    float total = n1 * 0.5 + n2 * 0.25 + n3 * 0.25;
    
    vec3 baseColor = vec3(1.0, 0.5, 0.0); // Orange
    vec3 hotColor = vec3(1.0, 0.9, 0.4);  // Yellow-White
    vec3 darkColor = vec3(0.8, 0.1, 0.0); // Dark Red
    
    vec3 finalColor = mix(darkColor, baseColor, total);
    finalColor = mix(finalColor, hotColor, pow(total, 3.0));
    
    // Rim glow
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    finalColor += vec3(1.0, 0.6, 0.1) * intensity;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Planet Data with Translation Keys
const PLANET_DATA = [
    { 
        nameKey: "solar_planet_mercury", 
        type: "rocky",
        color: 0xA0958E, 
        size: 1.6, 
        distance: 32, 
        speed: 2.8, 
        rotationSpeed: 0.4,
        noiseScale: 15,
        bumpScale: 0.15,
        emissive: 0x221111,
        descKey: "solar_data_desc_mercury",
        facts: [
            { labelKey: "solar_fact_period", value: "88 d" },
            { labelKey: "solar_fact_surface", valueKey: "solar_val_rocky" },
            { labelKey: "solar_fact_atmos", value: "-" },
            { labelKey: "solar_fact_temp", value: "-180°C ~ 430°C" }
        ]
    },
    { 
        nameKey: "solar_planet_venus",   
        type: "atmosphere", 
        color: 0xE6C076, 
        size: 3.0, 
        distance: 48, 
        speed: 1.5, 
        rotationSpeed: 0.2,
        atmosphereColor: 0xF5D0A2,
        atmosphereGlow: true,
        descKey: "solar_data_desc_venus",
        facts: [
            { labelKey: "solar_fact_period", value: "225 d" },
            { labelKey: "solar_fact_rotation", value: "-" },
            { labelKey: "solar_fact_greenhouse", value: "+++" },
            { labelKey: "solar_fact_temp", value: "~ 465°C" }
        ]
    },
    { 
        nameKey: "solar_planet_earth",   
        type: "earth", 
        color: 0x2255AA, 
        size: 3.2, 
        distance: 68, 
        speed: 1.0, 
        rotationSpeed: 1.0,
        atmosphereColor: 0x6699FF,
        atmosphereGlow: true,
        bumpScale: 0.05,
        descKey: "solar_data_desc_earth",
        facts: [
            { labelKey: "solar_fact_period", value: "365.25 d" },
            { labelKey: "solar_fact_moons", value: "1" },
            { labelKey: "solar_fact_habitable", valueKey: "solar_val_yes" },
            { labelKey: "solar_fact_surface", valueKey: "solar_val_water" }
        ]
    },
    { 
        nameKey: "solar_planet_mars",    
        type: "rocky",
        color: 0xD1653E, 
        size: 1.8, 
        distance: 88, 
        speed: 0.53, 
        rotationSpeed: 0.9,
        noiseScale: 8,
        bumpScale: 0.2,
        atmosphereColor: 0xFF9966,
        atmosphereGlow: true, 
        descKey: "solar_data_desc_mars",
        facts: [
            { labelKey: "solar_fact_period", value: "687 d" },
            { labelKey: "solar_fact_features", valueKey: "solar_val_fe2o3" },
            { labelKey: "solar_fact_polar", valueKey: "solar_val_ice" },
            { labelKey: "solar_fact_moons", value: "2" }
        ]
    },
    { 
        nameKey: "solar_planet_jupiter", 
        type: "gas",
        color: 0xD9B890, 
        size: 9.0, 
        distance: 130, 
        speed: 0.08, 
        rotationSpeed: 2.4, 
        bandColor1: 0xC79E76,
        bandColor2: 0x7A6052,
        descKey: "solar_data_desc_jupiter",
        facts: [
            { labelKey: "solar_fact_period", value: "11.9 y" },
            { labelKey: "solar_fact_volume", value: "1300x Earth" },
            { labelKey: "solar_fact_comp", valueKey: "solar_val_h_he" },
            { labelKey: "solar_fact_spot", valueKey: "solar_val_yes" }
        ]
    },
    { 
        nameKey: "solar_planet_saturn",  
        type: "gas",
        color: 0xEBDDA9, 
        size: 7.6, 
        distance: 170, 
        speed: 0.03, 
        rotationSpeed: 2.2,
        bandColor1: 0xEBDDA9,
        bandColor2: 0xC9B589,
        rings: { inner: 1.3, outer: 2.2, color: 0xC9B589 },
        descKey: "solar_data_desc_saturn",
        facts: [
            { labelKey: "solar_fact_period", value: "29.5 y" },
            { labelKey: "solar_fact_rings", valueKey: "solar_val_yes" },
            { labelKey: "solar_fact_density", value: "0.687 g/cm³" },
            { labelKey: "solar_fact_moons", value: "80+" }
        ]
    },
    { 
        nameKey: "solar_planet_uranus",
        type: "gas",
        color: 0x9FE6FF, 
        size: 5.0, 
        distance: 215, 
        speed: 0.01, 
        rotationSpeed: 1.4,
        bandColor1: 0x9FE6FF,
        bandColor2: 0x7AD3FF,
        noiseScale: 2, 
        rings: { inner: 1.4, outer: 1.6, color: 0x8899AA, opacity: 0.4 },
        descKey: "solar_data_desc_uranus",
        facts: [
            { labelKey: "solar_fact_period", value: "84 y" },
            { labelKey: "solar_fact_tilt", value: "98°" },
            { labelKey: "solar_fact_appearance", valueKey: "solar_val_cyan" },
            { labelKey: "solar_fact_type", valueKey: "solar_val_ice_giant" }
        ]
    },
    { 
        nameKey: "solar_planet_neptune",
        type: "gas",
        color: 0x3355FF, 
        size: 4.8, 
        distance: 255, 
        speed: 0.006, 
        rotationSpeed: 1.5,
        bandColor1: 0x3355FF,
        bandColor2: 0x2244CC,
        noiseScale: 20, 
        descKey: "solar_data_desc_neptune",
        facts: [
            { labelKey: "solar_fact_period", value: "165 y" },
            { labelKey: "solar_fact_wind", value: "2100 km/h" },
            { labelKey: "solar_fact_darkspot", valueKey: "solar_val_yes" },
            { labelKey: "solar_fact_temp", valueKey: "solar_val_cold" }
        ]
    }
];

class SolarSystemApp {
    constructor() {
        this.container = document.querySelector('#scene-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        this.planets = [];
        this.orbits = [];
        this.asteroids = [];
        
        this.isPlaying = true;
        this.timeScale = 1.0;
        this.selectedPlanetData = null; // Track selection for translation updates
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Uniforms for shader animation
        this.uniforms = {
            time: { value: 0 }
        };

        this.textureCache = new Map();

        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.createStarfield();
        this.createSun();
        this.createPlanets();
        this.createAsteroidBelt();
        this.setupEventListeners();
        
        this.renderer.setAnimationLoop(() => this.render());
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.bgColor);
        this.scene.fog = new THREE.FogExp2(0x020205, 0.0015);
    }

    createCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(CONFIG.cameraFOV, aspect, CONFIG.cameraNear, CONFIG.cameraFar);
        this.camera.position.set(0, 120, 220);
        this.camera.lookAt(0, 0, 0);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.2;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 800;
        this.controls.maxPolarAngle = Math.PI * 0.6;
    }

    createLights() {
        const sunLight = new THREE.PointLight(0xffffff, 2.5, 1000, 1.5);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.bias = -0.0005;
        this.scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0x404055, 0.5);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.3);
        this.scene.add(hemiLight);
    }

    createStarfield() {
        const count = 8000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorPalette = [
            new THREE.Color(0x9bb0ff), // O-type
            new THREE.Color(0xaabfff),
            new THREE.Color(0xcad7ff),
            new THREE.Color(0xf8f7ff),
            new THREE.Color(0xfff4ea),
            new THREE.Color(0xffd2a1),
            new THREE.Color(0xffcc6f)  // M-type
        ];

        for (let i = 0; i < count; i++) {
            const r = 1000 + Math.random() * 1000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
            
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.cos(phi);
            positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);

            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;

            sizes[i] = Math.random() * 1.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            map: this.createGlowTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        const starfield = new THREE.Points(geometry, material);
        this.scene.add(starfield);

        const dustCount = 3000;
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = new Float32Array(dustCount * 3);
        for(let i=0; i<dustCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 400 + Math.random() * 600;
            const spread = Math.random() * 100 * (Math.random() > 0.5 ? 1 : -1);
            dustPos[i*3] = Math.cos(angle) * radius;
            dustPos[i*3+1] = spread * Math.exp(-radius * 0.001);
            dustPos[i*3+2] = Math.sin(angle) * radius;
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        const dustMat = new THREE.PointsMaterial({
            color: 0x6633aa,
            size: 4,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: this.createGlowTexture()
        });
        const dust = new THREE.Points(dustGeo, dustMat);
        dust.rotation.x = Math.PI / 4;
        this.scene.add(dust);
    }

    createSun() {
        const geometry = new THREE.SphereGeometry(10, 64, 64);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: this.uniforms.time,
            },
            vertexShader: SunVertexShader,
            fragmentShader: SunFragmentShader,
            side: THREE.DoubleSide
        });
        const sun = new THREE.Mesh(geometry, material);
        this.scene.add(sun);

        const glowMat = new THREE.SpriteMaterial({
            map: this.createGlowTexture({ size: 256, inner: 'rgba(255,200,100,0.8)', outer: 'rgba(255,100,0,0)' }),
            color: 0xffaa00,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(45, 45, 1);
        sun.add(glow);

        const coreMat = new THREE.SpriteMaterial({
            map: this.createGlowTexture({ size: 128 }),
            color: 0xffffcc,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Sprite(coreMat);
        core.scale.set(22, 22, 1);
        sun.add(core);
    }

    createPlanets() {
        PLANET_DATA.forEach(data => {
            const group = new THREE.Group();
            this.scene.add(group);

            const orbitGeo = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 128);
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = -Math.PI / 2;
            this.scene.add(orbit);
            this.orbits.push(orbit);

            const planetGeo = new THREE.SphereGeometry(data.size, 64, 64);
            const texture = this.generatePlanetTexture(data);
            const material = new THREE.MeshStandardMaterial({
                map: texture.map,
                color: new THREE.Color(0xffffff),
                roughness: data.type === 'gas' ? 0.8 : 0.7,
                metalness: data.type === 'rocky' ? 0.2 : 0.0,
                bumpMap: texture.bump,
                bumpScale: data.bumpScale || 0.02
            });
            const planet = new THREE.Mesh(planetGeo, material);
            planet.position.x = data.distance;
            planet.castShadow = true;
            planet.receiveShadow = true;
            group.add(planet);

            if (data.atmosphereGlow) {
                const atmoGeo = new THREE.SphereGeometry(data.size * 1.15, 64, 64);
                const atmoMat = new THREE.ShaderMaterial({
                    uniforms: {
                        color: { value: new THREE.Color(data.atmosphereColor) },
                        intensity: { value: 0.5 },
                        power: { value: 4.0 }
                    },
                    vertexShader: AtmosphereVertexShader,
                    fragmentShader: AtmosphereFragmentShader,
                    transparent: true,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const atmo = new THREE.Mesh(atmoGeo, atmoMat);
                planet.add(atmo);
            }

            if (data.rings) {
                const ringGeo = new THREE.RingGeometry(data.size * data.rings.inner, data.size * data.rings.outer, 128);
                const ringTex = this.generateRingTexture(data.rings.color);
                const ringMat = new THREE.MeshStandardMaterial({
                    map: ringTex,
                    color: 0xffffff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: data.rings.opacity || 0.9
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                ring.rotation.y = -Math.PI / 8;
                ring.receiveShadow = true;
                planet.add(ring);
            }

            this.planets.push({
                mesh: planet,
                distance: data.distance,
                angle: Math.random() * Math.PI * 2,
                speed: data.speed,
                rotationSpeed: data.rotationSpeed,
                data: data
            });
        });
    }

    createAsteroidBelt() {
        const count = 2000;
        const geometry = new THREE.IcosahedronGeometry(0.3, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1
        });
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = THREE.MathUtils.randFloat(85, 95);
            const y = THREE.MathUtils.randFloatSpread(4);
            
            dummy.position.set(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r
            );
            dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
            const s = Math.random() * 0.5 + 0.5;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        
        this.scene.add(instancedMesh);
        this.asteroidBelt = instancedMesh;
    }

    generatePlanetTexture(data) {
        const width = 1024;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = new THREE.Color(data.color).getStyle();
        ctx.fillRect(0, 0, width, height);

        if (data.type === 'gas') {
            const bands = 20;
            for (let i = 0; i < bands; i++) {
                const y = (i / bands) * height;
                const h = (height / bands) + Math.random() * 10;
                const color1 = new THREE.Color(data.bandColor1 || data.color);
                const color2 = new THREE.Color(data.bandColor2 || data.color);
                
                const mix = Math.random();
                const bandColor = color1.clone().lerp(color2, mix);
                
                const noise = Math.random() * 0.1;
                bandColor.offsetHSL(0, 0, noise - 0.05);
                
                ctx.fillStyle = bandColor.getStyle();
                ctx.fillRect(0, y, width, h);
            }
        } else if (data.type === 'earth') {
            ctx.fillStyle = '#1144aa';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#338844';
            for(let i=0; i<40; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height * 0.8 + height*0.1;
                const r = Math.random() * 80 + 20;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            for(let i=0; i<60; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const w = Math.random() * 100 + 50;
                const h = Math.random() * 30 + 10;
                ctx.fillRect(x, y, w, h);
            }
        } else {
            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = imageData.data;
            const noiseScale = data.noiseScale || 10;
            for(let i=0; i<pixels.length; i+=4) {
                const n = (Math.random() - 0.5) * noiseScale;
                pixels[i] = Math.min(255, Math.max(0, pixels[i] + n));
                pixels[i+1] = Math.min(255, Math.max(0, pixels[i+1] + n));
                pixels[i+2] = Math.min(255, Math.max(0, pixels[i+2] + n));
            }
            ctx.putImageData(imageData, 0, 0);
        }

        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        return { map: map, bump: map };
    }

    generateRingTexture(hexColor) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const baseColor = new THREE.Color(hexColor);
        
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0,0,64,512);
        
        for(let y=0; y<512; y++) {
            const intensity = 0.5 + Math.random() * 0.5;
            const gap = Math.random() > 0.95;
            if(!gap) {
                const col = baseColor.clone().multiplyScalar(0.8 + Math.random()*0.4);
                ctx.fillStyle = `rgba(${col.r*255},${col.g*255},${col.b*255},${intensity})`;
                ctx.fillRect(0, y, 64, 1);
            }
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    createGlowTexture(options = {}) {
        const size = options.size || 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, options.inner || 'rgba(255,255,255,1)');
        gradient.addColorStop(1, options.outer || 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0,0,size,size);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    updatePlanets(delta) {
        if (!this.isPlaying) return;
        
        this.planets.forEach(p => {
            p.angle += p.speed * delta * CONFIG.orbitSpeedMultiplier * this.timeScale;
            p.mesh.position.x = Math.cos(p.angle) * p.distance;
            p.mesh.position.z = Math.sin(p.angle) * p.distance;
            p.mesh.rotation.y += p.rotationSpeed * delta * 0.5;
        });
        
        if(this.asteroidBelt) {
            this.asteroidBelt.rotation.y += delta * 0.02 * CONFIG.orbitSpeedMultiplier * this.timeScale;
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });

        window.addEventListener('click', (e) => {
            if(e.target.closest('.controls') || e.target.closest('.info-panel')) return;
            
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const meshes = this.planets.map(p => p.mesh);
            const intersects = this.raycaster.intersectObjects(meshes, false);
            
            if(intersects.length > 0) {
                const hit = intersects[0].object;
                const pData = this.planets.find(p => p.mesh === hit);
                if(pData) this.showInfo(pData.data);
            }
        });

        // Language Change Event
        window.addEventListener('languageChanged', () => {
            this.updateUI();
            if (this.selectedPlanetData) {
                this.showInfo(this.selectedPlanetData);
            }
        });

        document.getElementById('btn-pause').addEventListener('click', (e) => {
            this.isPlaying = !this.isPlaying;
            this.updateUI();
        });
        
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.controls.reset();
            this.camera.position.set(0, 120, 220);
        });
        
        document.getElementById('slider-speed').addEventListener('input', (e) => {
            this.timeScale = parseFloat(e.target.value);
        });
        
        document.getElementById('toggle-orbits').addEventListener('change', (e) => {
            this.orbits.forEach(o => o.visible = e.target.checked);
        });

        const mobileInfoToggle = document.getElementById('mobile-info-toggle');
        if (mobileInfoToggle) {
            mobileInfoToggle.addEventListener('click', () => {
                const panel = document.querySelector('.info-panel');
                if (panel) panel.classList.toggle('open');
            });
        }
    }

    updateUI() {
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            const key = this.isPlaying ? 'btn_pause' : 'btn_resume';
            pauseBtn.textContent = window.i18n.get(key);
        }
    }

    showInfo(data) {
        this.selectedPlanetData = data; // Store for re-translation
        const panel = document.getElementById('planet-info');
        const desc = document.querySelector('.description');
        const name = document.getElementById('info-name');
        const detail = document.getElementById('info-details');
        const facts = document.getElementById('info-facts');
        
        panel.classList.remove('hidden');
        if(desc) desc.style.display = 'none';
        
        name.textContent = window.i18n.get(data.nameKey);
        detail.textContent = window.i18n.get(data.descKey);
        
        facts.innerHTML = '';
        data.facts.forEach(f => {
            const div = document.createElement('div');
            div.className = 'fact-card';
            const label = window.i18n.get(f.labelKey);
            // Value might be a key or a value
            // If value starts with 'solar_', it's a key? Or check if translation exists?
            // Current data has some hardcoded values like "88 d" and some keys like "solar_planet_mercury".
            // Let's check if value exists in i18n, else use value.
            // A simple heuristic: if value looks like a key (contains underscore), try translating.
            // But "88 d" doesn't.
            let value = f.value;
            // Hardcoded values with units (d, y, etc) should ideally be formatted, but for now keeping as is unless it's a clear key.
            // Actually, keys were used for some values in my PLANET_DATA update above.
            // e.g., valueKey: "solar_planet_mercury"
            
            if (f.valueKey) {
                value = window.i18n.get(f.valueKey);
            }
            
            div.innerHTML = `<div class="fact-label">${label}</div><div class="fact-value">${value}</div>`;
            facts.appendChild(div);
        });
    }

    render() {
        const delta = this.clock.getDelta();
        this.uniforms.time.value += delta;
        
        this.updatePlanets(delta);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new SolarSystemApp();
