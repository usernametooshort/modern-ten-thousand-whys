import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Procedural Texture Generators ---

function createRockTexture(colorHex, scale = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#' + new THREE.Color(colorHex).getHexString();
    ctx.fillRect(0,0,512,512);
    
    for(let i=0; i<5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const s = Math.random() * 4 * scale;
        ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.3})`;
        ctx.fillRect(x,y,s,s);
        ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.2})`;
        ctx.fillRect(x+2,y+2,s,s);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// --- Custom Shaders for Mantle & Magma ---

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
uniform vec3 colorA;
uniform vec3 colorB;

// Simplex Noise (simplified)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    // Flowing lava noise
    float n = snoise(vPos * 0.5 + vec3(time * 0.2, 0.0, 0.0));
    float n2 = snoise(vPos * 2.0 - vec3(0.0, time * 0.5, 0.0));
    float intensity = n * 0.6 + n2 * 0.4;
    
    vec3 color = mix(colorA, colorB, intensity * 0.5 + 0.5);
    
    // Add glow based on intensity
    color += vec3(0.8, 0.3, 0.0) * pow(intensity, 3.0);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

class TectonicsApp {
    constructor() {
        this.container = document.getElementById('scene-canvas');
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.currentMode = 'divergent';
        this.waves = [];
        this.magmaParticles = [];
        
        this.params = {
            speed: 1.0,
            showWaves: false,
            showMagma: true
        };

        this.initRenderer();
        this.initCamera();
        this.initControls();
        this.initLights();
        this.initMaterials(); 
        this.initSceneObjects(); 
        this.bindUI();

        window.addEventListener('resize', () => this.onResize());
        
        // Make sure updateUI runs on language change
        window.addEventListener('languageChanged', () => this.updateUI());
        
        // Also check if i18n is already ready
        if (window.i18n) {
            this.updateUI();
        }
        
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
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 12, 25);
        this.camera.lookAt(0, 0, 0);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; 
        this.controls.minDistance = 10;
        this.controls.maxDistance = 60;
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        const bottomLight = new THREE.DirectionalLight(0xffaa00, 0.5);
        bottomLight.position.set(0, -10, 0);
        this.scene.add(bottomLight);
    }

    initMaterials() {
        const texCrust = createRockTexture(0x8b7355, 2);
        const texOceanic = createRockTexture(0x2f4f4f, 3);
        
        this.matCrust = new THREE.MeshStandardMaterial({ 
            map: texCrust,
            roughness: 0.9, 
            metalness: 0.1,
            bumpMap: texCrust,
            bumpScale: 0.5
        });
        
        this.matOceanic = new THREE.MeshStandardMaterial({ 
            map: texOceanic,
            roughness: 0.7, 
            metalness: 0.3,
            bumpMap: texOceanic,
            bumpScale: 0.2
        });

        this.matMantle = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorA: { value: new THREE.Color(0xff4500) },
                colorB: { value: new THREE.Color(0x880000) }
            },
            vertexShader: MantleVertexShader,
            fragmentShader: MantleFragmentShader
        });

        this.matOcean = new THREE.MeshPhysicalMaterial({ 
            color: 0x006994, 
            transmission: 0.6, 
            opacity: 0.8, 
            transparent: true, 
            roughness: 0.2,
            ior: 1.33,
            thickness: 2.0
        });
    }

    initSceneObjects() {
        this.plateGroup = new THREE.Group();
        this.scene.add(this.plateGroup);
        this.buildDivergent();
    }

    clearScene() {
        // Remove all children safely
        while(this.plateGroup.children.length > 0){ 
            const child = this.plateGroup.children[0];
            this.plateGroup.remove(child); 
            if(child.geometry) child.geometry.dispose();
        }
        this.waves = [];
        this.magmaParticles = [];
    }

    createTerrainBlock(w, h, d, material, roughness = 0.5) {
        const wSegs = Math.floor(w * 2);
        const dSegs = Math.floor(d * 2);
        const geo = new THREE.BoxGeometry(w, h, d, wSegs, 1, dSegs);
        
        const pos = geo.attributes.position;
        const count = pos.count;
        
        for (let i = 0; i < count; i++) {
            const y = pos.getY(i);
            if (y > h/2 - 0.01) {
                const x = pos.getX(i);
                const z = pos.getZ(i);
                const noise = Math.sin(x * 2) * Math.cos(z * 1.5) * 0.2 + (Math.random() - 0.5) * roughness;
                pos.setY(i, y + noise);
            }
        }
        geo.computeVertexNormals();
        
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    buildDivergent() {
        this.clearScene();
        this.currentMode = 'divergent';
        this.updateUI();

        const w = 10, h = 2, d = 10;
        
        this.plateL = this.createTerrainBlock(w, h, d, this.matOceanic, 0.2);
        this.plateL.position.set(-w/2 - 0.2, 0, 0);
        this.plateGroup.add(this.plateL);

        const waterL = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), this.matOcean);
        waterL.position.y = h/2 + 0.5;
        this.plateL.add(waterL);

        this.plateR = this.createTerrainBlock(w, h, d, this.matOceanic, 0.2);
        this.plateR.position.set(w/2 + 0.2, 0, 0);
        this.plateGroup.add(this.plateR);

        const waterR = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), this.matOcean);
        waterR.position.y = h/2 + 0.5;
        this.plateR.add(waterR);

        const mantleGeo = new THREE.BoxGeometry(30, 4, 14);
        this.mantle = new THREE.Mesh(mantleGeo, this.matMantle);
        this.mantle.position.set(0, -3.5, 0);
        this.plateGroup.add(this.mantle);
    }

    buildConvergent() {
        this.clearScene();
        this.currentMode = 'convergent';
        this.updateUI();

        this.plateL = this.createTerrainBlock(12, 1.5, 10, this.matOceanic, 0.1);
        this.plateL.rotation.z = -Math.PI / 12; 
        this.plateL.position.set(-6, 0, 0);
        this.plateGroup.add(this.plateL);
        
        const waterL = new THREE.Mesh(new THREE.BoxGeometry(12, 0.8, 10), this.matOcean);
        waterL.position.y = 1.5/2 + 0.4;
        this.plateL.add(waterL);

        this.plateR = this.createTerrainBlock(10, 3, 10, this.matCrust, 0.8);
        
        for(let i=0; i<4; i++) {
            const mh = 1.5 + Math.random();
            const mGeo = new THREE.ConeGeometry(1.2, mh, 16);
            const mMesh = new THREE.Mesh(mGeo, this.matCrust);
            mMesh.position.set(-3 + i*1.5 + (Math.random()-0.5), 1.5 + mh/2, (Math.random()-0.5)*6);
            mMesh.castShadow = true;
            this.plateR.add(mMesh);
        }

        this.plateR.position.set(5, 0.5, 0);
        this.plateGroup.add(this.plateR);

        const mantleGeo = new THREE.BoxGeometry(30, 5, 14);
        this.mantle = new THREE.Mesh(mantleGeo, this.matMantle);
        this.mantle.position.set(0, -4.5, 0);
        this.plateGroup.add(this.mantle);
    }

    buildTransform() {
        this.clearScene();
        this.currentMode = 'transform';
        this.updateUI();

        const w = 14, h = 2.5, d = 5;
        
        this.plateL = this.createTerrainBlock(w, h, d, this.matCrust, 0.4);
        this.plateL.position.set(0, 0, 2.6);
        this.plateGroup.add(this.plateL);

        this.plateR = this.createTerrainBlock(w, h, d, this.matCrust, 0.4);
        this.plateR.position.set(0, 0, -2.6);
        this.plateGroup.add(this.plateR);

        const mantleGeo = new THREE.BoxGeometry(20, 4, 14);
        this.mantle = new THREE.Mesh(mantleGeo, this.matMantle);
        this.mantle.position.set(0, -3.5, 0);
        this.plateGroup.add(this.mantle);
    }

    updateUI() {
        const el = document.getElementById('boundary-desc');
        if (!el) return;
        
        let key = 'tect_desc_div';
        if (this.currentMode === 'convergent') key = 'tect_desc_con';
        if (this.currentMode === 'transform') key = 'tect_desc_trans';
        
        // If i18n is ready, use it, otherwise fallback
        if (window.i18n) {
            el.textContent = window.i18n.get(key);
        }
    }

    spawnWave(position) {
        const geo = new THREE.SphereGeometry(0.2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff3333,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        const wave = new THREE.Mesh(geo, mat);
        wave.position.copy(position);
        wave.userData = { age: 0, maxAge: 1.5 };
        this.scene.add(wave);
        this.waves.push(wave);
    }

    spawnMagma(position) {
        const geo = new THREE.DodecahedronGeometry(0.15);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(position);
        p.position.x += (Math.random()-0.5)*0.5;
        p.position.z += (Math.random()-0.5)*4;
        
        p.userData = { 
            velocity: new THREE.Vector3(0, 1 + Math.random(), 0), 
            age: 0 
        };
        this.scene.add(p);
        this.magmaParticles.push(p);
    }

    update(delta) {
        const time = this.clock.getElapsedTime();
        this.matMantle.uniforms.time.value = time; 

        if (this.currentMode === 'divergent') {
            const offset = (time * 0.5) % 2; 
            this.plateL.position.x = -5 - offset;
            this.plateR.position.x = 5 + offset;
            
            if (this.params.showMagma && Math.random() < 0.1) {
                this.spawnMagma(new THREE.Vector3(0, -2, 0));
            }
            if (this.params.showWaves && Math.random() < 0.02) {
                this.spawnWave(new THREE.Vector3(0, -1, (Math.random()-0.5)*8));
            }

        } else if (this.currentMode === 'convergent') {
            const cycle = (time * 0.2) % 1;
            this.plateL.position.x = -6 + cycle * 0.5; 
            this.plateL.position.y = - cycle * 0.5;

            if (this.params.showMagma && Math.random() < 0.05) {
                this.spawnMagma(new THREE.Vector3(4, -2, 0));
            }
            if (this.params.showWaves && Math.random() < 0.03) {
                this.spawnWave(new THREE.Vector3(1 + Math.random()*2, -1 - Math.random()*2, (Math.random()-0.5)*8));
            }

        } else if (this.currentMode === 'transform') {
            const offset = (time * 1.0) % 4;
            this.plateL.position.x = -2 + offset;
            this.plateR.position.x = 2 - offset;
            
            if (this.params.showWaves && Math.random() < 0.05) {
                this.spawnWave(new THREE.Vector3((Math.random()-0.5)*10, 0, 0));
            }
        }

        for (let i = this.waves.length - 1; i >= 0; i--) {
            const w = this.waves[i];
            w.userData.age += delta;
            const scale = 1 + w.userData.age * 6;
            w.scale.setScalar(scale);
            w.material.opacity = 0.8 * (1 - w.userData.age / w.userData.maxAge);
            
            if (w.userData.age > w.userData.maxAge) {
                this.scene.remove(w);
                this.waves.splice(i, 1);
            }
        }

        for (let i = this.magmaParticles.length - 1; i >= 0; i--) {
            const p = this.magmaParticles[i];
            p.position.addScaledVector(p.userData.velocity, delta);
            p.scale.multiplyScalar(0.98); 
            p.userData.age += delta;
            
            if (p.userData.age > 2.5) { 
                this.scene.remove(p);
                this.magmaParticles.splice(i, 1);
            }
        }
    }

    bindUI() {
        const btns = document.querySelectorAll('.mode-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Mode button clicked:', btn.dataset.mode);
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                if (mode === 'divergent') this.buildDivergent();
                if (mode === 'convergent') this.buildConvergent();
                if (mode === 'transform') this.buildTransform();
            });
        });

        const toggleWaves = document.getElementById('toggle-waves');
        if (toggleWaves) {
            toggleWaves.addEventListener('change', (e) => {
                this.params.showWaves = e.target.checked;
            });
        }

        const toggleMagma = document.getElementById('toggle-magma');
        if (toggleMagma) {
            toggleMagma.addEventListener('change', (e) => {
                this.params.showMagma = e.target.checked;
            });
        }

        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.controls.reset();
            });
        }

        // Mobile sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
            // Auto collapse on mobile init
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
            }
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

new TectonicsApp();
