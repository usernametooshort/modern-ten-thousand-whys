import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ElasticRodApp {
    constructor() {
        this.canvas = document.getElementById('scene-canvas');
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        // Physics State (3D Vibration)
        this.tipDisp = new THREE.Vector3(0, 0, 0); // Y, Z displacement (X is ignored/0)
        this.tipVel = new THREE.Vector3(0, 0, 0);  // Y, Z velocity
        this.mass = 1.0;
        
        // Parameters
        this.k = 25; // Stiffness
        this.c = 0.05; // Damping (Lower default for more visible oscillation)
        this.rodLength = 6.0;
        this.fixedX = -3.0;
        
        // Interaction State
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragPlane = new THREE.Plane();
        this.isDragging = false;

        this.initRenderer();
        this.initCamera();
        this.initControls();
        this.addLights();
        this.addRod();
        this.addClamp();
        this.initCharts();
        this.bindUI();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('languageChanged', () => this.updateUI());
        
        // Initial UI Update for i18n
        if(window.i18n) this.updateUI();

        this.renderer.setAnimationLoop(() => this.render());
        
        console.log("ElasticRodApp initialized");
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
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 2, 12);
        this.scene.add(this.camera);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;
        this.controls.target.set(0, 0, 0);
    }

    addLights() {
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(5, 5, 10);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x5ad4ff, 0.6);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xffaa00, 0.3);
        backLight.position.set(0, 5, -10);
        this.scene.add(backLight);

        this.scene.add(new THREE.AmbientLight(0x111122, 0.8));
        
        // Helpers for reference
        const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        grid.position.y = -2; // Below the rod
        this.scene.add(grid);
        
        const axes = new THREE.AxesHelper(2);
        this.scene.add(axes);
    }

    addRod() {
        // Use CylinderGeometry for a round rod
        const segments = 60;
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, this.rodLength, 16, segments);
        
        // Rotate geometry so it lies along X axis [-L/2, L/2]
        geometry.rotateZ(-Math.PI / 2);

        // Store initial positions for bending calculation
        // Important: Clone the position attribute to ensure we have a stable reference
        const positions = geometry.attributes.position;
        const count = positions.count;
        const initialPositions = new Float32Array(count * 3);
        
        for(let i=0; i<count * 3; i++) {
            initialPositions[i] = positions.array[i];
        }
        
        geometry.userData.initialPositions = initialPositions;

        const material = new THREE.MeshStandardMaterial({
            color: 0x44aaff,
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0x001133,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide // Ensure visible from all angles
        });

        this.rod = new THREE.Mesh(geometry, material);
        this.rod.frustumCulled = false; // Critical for deforming meshes
        
        // Mark attribute as dynamic for frequent updates
        geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
        
        this.scene.add(this.rod);
        
        // Hit Box for easier dragging (invisible larger cylinder)
        const hitGeometry = new THREE.CylinderGeometry(0.6, 0.6, this.rodLength, 8, 1);
        hitGeometry.rotateZ(-Math.PI / 2);
        hitGeometry.computeBoundingSphere(); // Ensure raycasting works
        const hitMaterial = new THREE.MeshBasicMaterial({ 
            visible: true, 
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.hitRod = new THREE.Mesh(hitGeometry, hitMaterial);
        this.hitRod.visible = true; // Ensure it's reachable by raycaster
        this.scene.add(this.hitRod); 
        
        console.log("Rod added with points:", count);
    }

    addClamp() {
        // Visual clamp at the fixed end
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.7,
            metalness: 0.5
        });
        const clamp = new THREE.Mesh(geometry, material);
        clamp.position.set(this.fixedX - 0.5, 0, 0);
        this.scene.add(clamp);
    }

    initCharts() {
        this.amplitudeCanvas = document.getElementById('amplitude-chart');
        this.frequencyCanvas = document.getElementById('frequency-chart');
        this.amplitudeCtx = this.amplitudeCanvas.getContext('2d');
        this.frequencyCtx = this.frequencyCanvas.getContext('2d');
        this.chartData = {
            amplitude: [],
            frequency: []
        };
    }

    bindUI() {
        const kRange = document.getElementById('stiffness-range');
        const cRange = document.getElementById('damping-range');
        const kValue = document.getElementById('stiffness-value');
        const cValue = document.getElementById('damping-value');
        const btnPluck = document.getElementById('btn-pluck');
        const btnReset = document.getElementById('btn-reset');

        if(kRange) {
            kRange.addEventListener('input', () => {
                this.k = parseFloat(kRange.value);
                kValue.textContent = kRange.value;
            });
        }

        if(cRange) {
            cRange.addEventListener('input', () => {
                this.c = parseFloat(cRange.value);
                cValue.textContent = Number(cRange.value).toFixed(2);
            });
        }

        if(btnPluck) {
            btnPluck.addEventListener('click', () => {
                // Pluck in a random direction for 3D effect
                this.tipDisp.set(0, 1.5, (Math.random() - 0.5) * 1.0);
                this.tipVel.set(0, 0, 0);
            });
        }

        if(btnReset) {
            btnReset.addEventListener('click', () => {
                this.tipDisp.set(0, 0, 0);
                this.tipVel.set(0, 0, 0);
                this.chartData.amplitude = [];
                this.chartData.frequency = [];
                this.controls.reset();
            });
        }

        this.canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
        window.addEventListener('pointermove', (event) => this.onPointerMove(event));
        window.addEventListener('pointerup', () => this.onPointerUp());

        // Auto-pluck on start to show it's alive
        setTimeout(() => {
            this.tipDisp.set(0, 2.0, 1.0);
            this.tipVel.set(0, 0, 0);
        }, 800);

        // Mobile sidebar toggle (FAB)
        const sidebarToggle = document.getElementById('mobile-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
        
        // Initial camera adjustment
        this.onResize();
    }

    updateUI() {
        // const get = window.i18n ? window.i18n.get.bind(window.i18n) : (k) => k;
    }

    simulate(delta) {
        if (this.isDragging) {
            this.tipVel.set(0, 0, 0);
            return;
        }

        // SDOF system for each component: m*a + c*v + k*x = 0
        const steps = 20; 
        // Clamp delta to prevent explosion on frame drops
        const safeDelta = Math.min(delta, 0.1);
        const dt = safeDelta / steps;

        for(let i=0; i<steps; i++) {
            // Y axis
            const forceY = -(this.c * this.tipVel.y + this.k * this.tipDisp.y);
            const accY = forceY / this.mass;
            this.tipVel.y += accY * dt;
            this.tipDisp.y += this.tipVel.y * dt;

            // Z axis
            const forceZ = -(this.c * this.tipVel.z + this.k * this.tipDisp.z);
            const accZ = forceZ / this.mass;
            this.tipVel.z += accZ * dt;
            this.tipDisp.z += this.tipVel.z * dt;
        }

        // Safety check for NaN
        if (!isFinite(this.tipDisp.y) || !isFinite(this.tipDisp.z)) {
             console.warn("Physics exploded, resetting:", this.tipDisp);
            this.tipDisp.set(0, 0, 0);
            this.tipVel.set(0, 0, 0);
        }
    }

    updateRodGeometry() {
        if (!this.rod) return;

        const geometry = this.rod.geometry;
        const positions = geometry.attributes.position;
        const initialPositions = geometry.userData.initialPositions;
        
        if (!initialPositions) return;

        // Strict NaN/Infinite Check - Silent reset in render loop to avoid spam
        if (!isFinite(this.tipDisp.y) || !isFinite(this.tipDisp.z)) {
            this.tipDisp.set(0, 0, 0);
            this.tipVel.set(0, 0, 0);
        }

        // FAST PATH: If displacement is negligible, just reset positions and exit
        if (this.tipDisp.lengthSq() < 1e-6) {
             for (let i = 0; i < positions.count; i++) {
                positions.setXYZ(i, initialPositions[i*3], initialPositions[i*3+1], initialPositions[i*3+2]);
            }
            positions.needsUpdate = true;
            geometry.computeBoundingSphere();
            return;
        }

        const L = this.rodLength;
        const denom = 2 * Math.pow(L, 3);

        const tempVec = new THREE.Vector3();
        const tangent = new THREE.Vector3();
        const up = new THREE.Vector3(1, 0, 0); // Original X axis
        const q = new THREE.Quaternion();

        for (let i = 0; i < positions.count; i++) {
            const xInit = initialPositions[i * 3];
            const yInit = initialPositions[i * 3 + 1];
            const zInit = initialPositions[i * 3 + 2];

            // Calculate distance from fixed end
            let u = xInit - this.fixedX;
            
            // Safety clamp
            if (u < 0) u = 0;

            // Bending Shape functions
            const shapeVal = (u * u * (3 * L - u)) / denom;
            const shapeDeriv = (6 * L * u - 3 * u * u) / denom;

            // Centerline displacement
            const dy = this.tipDisp.y * shapeVal;
            const dz = this.tipDisp.z * shapeVal;

            // Tangent calculation
            tangent.set(1, this.tipDisp.y * shapeDeriv, this.tipDisp.z * shapeDeriv).normalize();

            // Rotation
            const dot = tangent.x; 
            if (dot > 0.99999) {
                q.set(0, 0, 0, 1);
            } else {
                q.setFromUnitVectors(up, tangent);
            }

            // Apply rotation to the cross-section vector (0, yInit, zInit)
            tempVec.set(0, yInit, zInit).applyQuaternion(q);

            // New position
            positions.setXYZ(i, 
                xInit + tempVec.x, 
                dy + tempVec.y, 
                dz + tempVec.z
            );
        }
        
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
    }

    updateCharts() {
        const currentFreq = (1 / (2 * Math.PI)) * Math.sqrt(this.k / this.mass);
        const currentAmp = this.tipDisp.length();

        this.chartData.amplitude.push(currentAmp);
        this.chartData.frequency.push(currentFreq);

        if (this.chartData.amplitude.length > 120) {
            this.chartData.amplitude.shift();
            this.chartData.frequency.shift();
        }

        this.drawChart(this.amplitudeCtx, this.chartData.amplitude, '#5ad4ff', 3.0); 
        this.drawChart(this.frequencyCtx, this.chartData.frequency, '#ff9f6e', 6.0); 
    }

    drawChart(ctx, data, color, maxVal) {
        if(!ctx) return;
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);
        
        if (data.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((value, idx) => {
            const x = (idx / 120) * width;
            let normalized = value / maxVal;
            if (normalized > 1) normalized = 1;
            const y = height - (normalized * height * 0.9) - (height * 0.05); 
            
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = '12px sans-serif';
        const lastVal = data[data.length - 1];
        ctx.fillText(lastVal.toFixed(2), width - 35, 20);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        if (this.camera.aspect < 1) {
            this.camera.position.z = 16 / this.camera.aspect * 0.8; // Increased distance for mobile
        } else {
            this.camera.position.z = 12;
        }
    }

    render() {
        const delta = this.clock.getDelta();
        this.simulate(delta);
        this.updateRodGeometry();
        this.updateCharts();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // Interaction
    getIntersects(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        return null; // Not used directly
    }

    onPointerDown(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Intersect against hitRod for easier grabbing
        const intersects = this.raycaster.intersectObject(this.hitRod || this.rod);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            // Only allow dragging if clicking the free half of the rod
            if (point.x > this.fixedX + this.rodLength * 0.3) {
                this.isDragging = true;
                this.controls.enabled = false;
                
                // Drag plane facing camera
                const normal = new THREE.Vector3();
                this.camera.getWorldDirection(normal);
                this.dragPlane.setFromNormalAndCoplanarPoint(normal, point);
                
                this.updateDrag(point);
            }
        }
    }

    onPointerMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (this.isDragging) {
            this.canvas.style.cursor = 'grabbing';
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const target = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, target);
            
            if (target) {
                this.updateDrag(target);
            }
        } else {
            // Hover effect
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.hitRod || this.rod);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                if (point.x > this.fixedX + this.rodLength * 0.3) {
                    this.canvas.style.cursor = 'grab';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    onPointerUp() {
        this.isDragging = false;
        this.controls.enabled = true;
    }

    updateDrag(point) {
        const u = Math.max(0.1, point.x - this.fixedX); 
        const L = this.rodLength;
        const denom = 2 * Math.pow(L, 3);
        const shapeVal = (u * u * (3 * L - u)) / denom;
        
        // Safe check
        if (Math.abs(shapeVal) < 0.0001) return;

        let newDispY = point.y / shapeVal;
        let newDispZ = point.z / shapeVal;
        
        const maxDisp = 3.5;
        const currentMag = Math.sqrt(newDispY*newDispY + newDispZ*newDispZ);
        if (currentMag > maxDisp) {
            const ratio = maxDisp / currentMag;
            newDispY *= ratio;
            newDispZ *= ratio;
        }
        
        this.tipDisp.set(0, newDispY, newDispZ);
        this.tipVel.set(0, 0, 0);
    }
}

new ElasticRodApp();
