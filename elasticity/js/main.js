import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// NANO BANANA PRO - Spring-Damper System Visualization
// Professional Material Science & Mechanics Implementation
// ============================================================
//
// PHYSICS MODEL:
// Single Degree of Freedom (SDOF) Damped Harmonic Oscillator
// Equation of Motion: m*ẍ + c*ẋ + k*x = 0
//
// KEY PARAMETERS:
// - Natural Frequency: ωn = √(k/m)
// - Damping Ratio: ζ = c / (2*√(k*m))
// - Damped Frequency: ωd = ωn * √(1 - ζ²)
//
// DAMPING REGIMES:
// - ζ < 1: Underdamped (oscillatory decay)
// - ζ = 1: Critically damped (fastest return to equilibrium)
// - ζ > 1: Overdamped (slow exponential return)
//
// BEAM THEORY:
// Euler-Bernoulli beam bending with cantilever boundary conditions
// Shape function: φ(x) = x²(3L - x) / (2L³)
// ============================================================

class ElasticRodApp {
    constructor() {
        this.canvas = document.getElementById('scene-canvas');
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        // === PHYSICS STATE ===
        this.tipDisp = new THREE.Vector3(0, 0, 0);
        this.tipVel = new THREE.Vector3(0, 0, 0);

        // Physical properties
        this.mass = 1.0;        // kg
        this.k = 25;            // N/m (stiffness)
        this.c = 0.5;           // N·s/m (damping coefficient)

        // Derived quantities (updated in updatePhysicsProperties)
        this.naturalFreq = 0;   // ωn (rad/s)
        this.dampedFreq = 0;    // ωd (rad/s)
        this.dampingRatio = 0;  // ζ (dimensionless)
        this.period = 0;        // T (seconds)

        // Geometry
        this.rodLength = 6.0;
        this.fixedX = -3.0;

        // Energy tracking
        this.kineticEnergy = 0;
        this.potentialEnergy = 0;
        this.totalEnergy = 0;
        this.maxEnergy = 1;

        // Phase space history
        this.phaseHistory = [];
        this.maxPhasePoints = 500;

        // Time history
        this.timeHistory = [];
        this.maxTimePoints = 200;
        this.simTime = 0;

        // Interaction
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
        this.addSpringVisualization();
        this.addDamperVisualization();
        this.addStressColorBar();
        this.initCharts();
        this.bindUI();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('languageChanged', () => this.updateUI());

        if (window.i18n) this.updateUI();

        this.updatePhysicsProperties();
        this.renderer.setAnimationLoop(() => this.render());

        console.log("ElasticRodApp NANO BANANA PRO initialized");
    }

    // === PHYSICS CALCULATIONS ===

    updatePhysicsProperties() {
        // Natural frequency: ωn = √(k/m)
        this.naturalFreq = Math.sqrt(this.k / this.mass);

        // Critical damping coefficient: c_cr = 2√(km)
        const criticalDamping = 2 * Math.sqrt(this.k * this.mass);

        // Damping ratio: ζ = c / c_cr
        this.dampingRatio = this.c / criticalDamping;

        // Damped frequency (only valid for underdamped)
        if (this.dampingRatio < 1) {
            this.dampedFreq = this.naturalFreq * Math.sqrt(1 - this.dampingRatio * this.dampingRatio);
            this.period = (2 * Math.PI) / this.dampedFreq;
        } else {
            this.dampedFreq = 0;
            this.period = Infinity;
        }

        // Update UI displays
        this.updatePhysicsDisplay();
    }

    updatePhysicsDisplay() {
        const freqHz = this.naturalFreq / (2 * Math.PI);

        // Update derived values display
        const freqEl = document.getElementById('freq-value');
        const zetaEl = document.getElementById('zeta-value');
        const regimeEl = document.getElementById('regime-indicator');

        if (freqEl) freqEl.textContent = freqHz.toFixed(2) + ' Hz';
        if (zetaEl) zetaEl.textContent = this.dampingRatio.toFixed(3);

        if (regimeEl) {
            if (this.dampingRatio < 0.99) {
                regimeEl.textContent = 'Underdamped (欠阻尼)';
                regimeEl.className = 'regime underdamped';
            } else if (this.dampingRatio <= 1.01) {
                regimeEl.textContent = 'Critical (临界阻尼)';
                regimeEl.className = 'regime critical';
            } else {
                regimeEl.textContent = 'Overdamped (过阻尼)';
                regimeEl.className = 'regime overdamped';
            }
        }
    }

    calculateEnergy() {
        // Kinetic Energy: KE = (1/2)mv²
        const v = this.tipVel.length();
        this.kineticEnergy = 0.5 * this.mass * v * v;

        // Potential Energy: PE = (1/2)kx²
        const x = this.tipDisp.length();
        this.potentialEnergy = 0.5 * this.k * x * x;

        // Total mechanical energy
        this.totalEnergy = this.kineticEnergy + this.potentialEnergy;

        // Track max for scaling
        if (this.totalEnergy > this.maxEnergy) {
            this.maxEnergy = this.totalEnergy;
        }
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
            45, window.innerWidth / window.innerHeight, 0.1, 100
        );
        this.camera.position.set(0, 3, 14);
        this.scene.add(this.camera);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;
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

        this.scene.add(new THREE.AmbientLight(0x222233, 0.8));

        // Grid
        const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        grid.position.y = -2.5;
        this.scene.add(grid);

        // Axes
        const axes = new THREE.AxesHelper(2);
        axes.position.set(-4, -2, 0);
        this.scene.add(axes);
    }

    addRod() {
        const segments = 80;
        const geometry = new THREE.CylinderGeometry(0.12, 0.12, this.rodLength, 24, segments);
        geometry.rotateZ(-Math.PI / 2);

        // Store initial positions
        const positions = geometry.attributes.position;
        const count = positions.count;
        const initialPositions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            initialPositions[i] = positions.array[i];
        }
        geometry.userData.initialPositions = initialPositions;

        // Create vertex colors for stress visualization
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            colors[i * 3] = 0.3;     // R
            colors[i * 3 + 1] = 0.6; // G
            colors[i * 3 + 2] = 1.0; // B
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            metalness: 0.4,
            roughness: 0.3,
            side: THREE.DoubleSide
        });

        this.rod = new THREE.Mesh(geometry, material);
        this.rod.frustumCulled = false;
        geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
        geometry.attributes.color.setUsage(THREE.DynamicDrawUsage);

        this.scene.add(this.rod);

        // Hit box
        const hitGeometry = new THREE.CylinderGeometry(0.8, 0.8, this.rodLength, 8, 1);
        hitGeometry.rotateZ(-Math.PI / 2);
        const hitMaterial = new THREE.MeshBasicMaterial({
            visible: false,
            side: THREE.DoubleSide
        });
        this.hitRod = new THREE.Mesh(hitGeometry, hitMaterial);
        this.scene.add(this.hitRod);
    }

    addClamp() {
        const geometry = new THREE.BoxGeometry(1.2, 2.5, 1.2);
        const material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.6
        });
        const clamp = new THREE.Mesh(geometry, material);
        clamp.position.set(this.fixedX - 0.6, 0, 0);
        this.scene.add(clamp);

        // Add spring symbol on clamp
        this.addFormulaLabel('k', new THREE.Vector3(this.fixedX - 1.5, 1.5, 0));
    }

    addSpringVisualization() {
        // Helical spring visual beside the rod
        const springGroup = new THREE.Group();
        this.springCoils = [];

        const coilCount = 12;
        const coilRadius = 0.3;
        const coilHeight = 4;

        const springMat = new THREE.MeshStandardMaterial({
            color: 0x66ff66,
            metalness: 0.5,
            roughness: 0.4
        });

        for (let i = 0; i < coilCount; i++) {
            const torusGeo = new THREE.TorusGeometry(coilRadius, 0.03, 8, 24);
            const coil = new THREE.Mesh(torusGeo, springMat);
            coil.rotation.x = Math.PI / 2;
            coil.position.y = -coilHeight / 2 + (i / coilCount) * coilHeight;
            springGroup.add(coil);
            this.springCoils.push(coil);
        }

        springGroup.position.set(this.fixedX - 2, 0, 0);
        springGroup.rotation.z = Math.PI / 2;
        this.scene.add(springGroup);
        this.springGroup = springGroup;
    }

    addDamperVisualization() {
        // Dashpot (damper) visualization
        const damperGroup = new THREE.Group();

        const cylinderMat = new THREE.MeshStandardMaterial({
            color: 0xff6666,
            metalness: 0.3,
            roughness: 0.5
        });

        // Outer cylinder
        const outerGeo = new THREE.CylinderGeometry(0.25, 0.25, 2, 16);
        const outer = new THREE.Mesh(outerGeo, cylinderMat);
        damperGroup.add(outer);

        // Piston
        const pistonMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.7,
            roughness: 0.3
        });
        const pistonGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 12);
        this.piston = new THREE.Mesh(pistonGeo, pistonMat);
        damperGroup.add(this.piston);

        damperGroup.position.set(this.fixedX - 2.8, 0, 0);
        damperGroup.rotation.z = Math.PI / 2;
        this.scene.add(damperGroup);
        this.damperGroup = damperGroup;
    }

    addStressColorBar() {
        // Color bar legend for stress
        const barWidth = 0.3;
        const barHeight = 3;
        const segments = 20;

        const geometry = new THREE.PlaneGeometry(barWidth, barHeight, 1, segments);
        const colors = new Float32Array((segments + 1) * 2 * 3);

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const color = this.stressToColor(t);
            const idx = i * 2 * 3;
            colors[idx] = colors[idx + 3] = color.r;
            colors[idx + 1] = colors[idx + 4] = color.g;
            colors[idx + 2] = colors[idx + 5] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
        const bar = new THREE.Mesh(geometry, material);
        bar.position.set(5, 0, 0);
        this.scene.add(bar);

        // Labels
        this.addFormulaLabel('σ_max', new THREE.Vector3(5.5, 1.5, 0));
        this.addFormulaLabel('σ=0', new THREE.Vector3(5.5, -1.5, 0));
    }

    stressToColor(normalizedStress) {
        // Blue (low) -> Green -> Yellow -> Red (high)
        const t = Math.max(0, Math.min(1, normalizedStress));

        let r, g, b;
        if (t < 0.33) {
            const s = t / 0.33;
            r = 0.2;
            g = 0.4 + s * 0.4;
            b = 1.0 - s * 0.5;
        } else if (t < 0.66) {
            const s = (t - 0.33) / 0.33;
            r = s * 0.8;
            g = 0.8 + s * 0.2;
            b = 0.5 - s * 0.4;
        } else {
            const s = (t - 0.66) / 0.34;
            r = 0.8 + s * 0.2;
            g = 1.0 - s * 0.6;
            b = 0.1;
        }

        return new THREE.Color(r, g, b);
    }

    addFormulaLabel(text, position) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.roundRect(0, 0, 128, 64, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(position);
        sprite.scale.set(1, 0.5, 1);
        this.scene.add(sprite);
    }

    initCharts() {
        // Multiple chart canvases
        this.timeCanvas = document.getElementById('amplitude-chart');
        this.phaseCanvas = document.getElementById('frequency-chart');

        if (this.timeCanvas) this.timeCtx = this.timeCanvas.getContext('2d');
        if (this.phaseCanvas) this.phaseCtx = this.phaseCanvas.getContext('2d');
    }

    bindUI() {
        const kRange = document.getElementById('stiffness-range');
        const cRange = document.getElementById('damping-range');
        const kValue = document.getElementById('stiffness-value');
        const cValue = document.getElementById('damping-value');
        const btnPluck = document.getElementById('btn-pluck');
        const btnReset = document.getElementById('btn-reset');

        if (kRange) {
            kRange.addEventListener('input', () => {
                this.k = parseFloat(kRange.value);
                if (kValue) kValue.textContent = kRange.value;
                this.updatePhysicsProperties();
            });
        }

        if (cRange) {
            cRange.addEventListener('input', () => {
                this.c = parseFloat(cRange.value);
                if (cValue) cValue.textContent = Number(cRange.value).toFixed(2);
                this.updatePhysicsProperties();
            });
        }

        if (btnPluck) {
            btnPluck.addEventListener('click', () => {
                this.tipDisp.set(0, 2.0, (Math.random() - 0.5) * 1.5);
                this.tipVel.set(0, 0, 0);
                this.phaseHistory = [];
                this.timeHistory = [];
                this.simTime = 0;
                this.maxEnergy = this.potentialEnergy || 1;
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.tipDisp.set(0, 0, 0);
                this.tipVel.set(0, 0, 0);
                this.phaseHistory = [];
                this.timeHistory = [];
                this.simTime = 0;
                this.maxEnergy = 1;
                this.controls.reset();
            });
        }

        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', () => this.onPointerUp());

        // Auto-pluck
        setTimeout(() => {
            this.tipDisp.set(0, 2.5, 1.0);
            this.tipVel.set(0, 0, 0);
        }, 500);

        // Mobile toggle
        const sidebarToggle = document.getElementById('mobile-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        this.onResize();
    }

    updateUI() { }

    simulate(delta) {
        if (this.isDragging) {
            this.tipVel.set(0, 0, 0);
            return;
        }

        // Euler-Cromer integration for stability
        const steps = 20;
        const safeDelta = Math.min(delta, 0.05);
        const dt = safeDelta / steps;

        for (let i = 0; i < steps; i++) {
            // F = -kx - cv (Spring-Damper equation)
            // a = F/m

            // Y-axis
            const forceY = -(this.k * this.tipDisp.y + this.c * this.tipVel.y);
            const accY = forceY / this.mass;
            this.tipVel.y += accY * dt;
            this.tipDisp.y += this.tipVel.y * dt;

            // Z-axis
            const forceZ = -(this.k * this.tipDisp.z + this.c * this.tipVel.z);
            const accZ = forceZ / this.mass;
            this.tipVel.z += accZ * dt;
            this.tipDisp.z += this.tipVel.z * dt;
        }

        // Update time
        this.simTime += safeDelta;

        // NaN check
        if (!isFinite(this.tipDisp.y) || !isFinite(this.tipDisp.z)) {
            this.tipDisp.set(0, 0, 0);
            this.tipVel.set(0, 0, 0);
        }

        // Calculate energy
        this.calculateEnergy();

        // Store history for phase plot
        this.phaseHistory.push({ x: this.tipDisp.y, v: this.tipVel.y });
        if (this.phaseHistory.length > this.maxPhasePoints) {
            this.phaseHistory.shift();
        }

        // Store time history
        this.timeHistory.push({ t: this.simTime, y: this.tipDisp.y });
        if (this.timeHistory.length > this.maxTimePoints) {
            this.timeHistory.shift();
        }
    }

    updateRodGeometry() {
        if (!this.rod) return;

        const geometry = this.rod.geometry;
        const positions = geometry.attributes.position;
        const colors = geometry.attributes.color;
        const initialPositions = geometry.userData.initialPositions;

        if (!initialPositions) return;

        if (!isFinite(this.tipDisp.y) || !isFinite(this.tipDisp.z)) {
            this.tipDisp.set(0, 0, 0);
            this.tipVel.set(0, 0, 0);
        }

        const L = this.rodLength;
        const denom = 2 * Math.pow(L, 3);

        // Calculate max stress for normalization
        const maxCurvature = 6 * this.tipDisp.length() / (L * L);

        const tempVec = new THREE.Vector3();
        const tangent = new THREE.Vector3();
        const up = new THREE.Vector3(1, 0, 0);
        const q = new THREE.Quaternion();

        for (let i = 0; i < positions.count; i++) {
            const xInit = initialPositions[i * 3];
            const yInit = initialPositions[i * 3 + 1];
            const zInit = initialPositions[i * 3 + 2];

            let u = xInit - this.fixedX;
            if (u < 0) u = 0;

            // Beam shape functions
            const shapeVal = (u * u * (3 * L - u)) / denom;
            const shapeDeriv = (6 * L * u - 3 * u * u) / denom;

            // Curvature for stress (d²w/dx²)
            const shapeSecond = (6 * L - 6 * u) / denom;
            const curvature = Math.abs(this.tipDisp.y * shapeSecond + this.tipDisp.z * shapeSecond);
            const normalizedStress = curvature / (maxCurvature + 0.001);

            // Displacement
            const dy = this.tipDisp.y * shapeVal;
            const dz = this.tipDisp.z * shapeVal;

            // Tangent and rotation
            tangent.set(1, this.tipDisp.y * shapeDeriv, this.tipDisp.z * shapeDeriv).normalize();

            if (tangent.x > 0.99999) {
                q.set(0, 0, 0, 1);
            } else {
                q.setFromUnitVectors(up, tangent);
            }

            tempVec.set(0, yInit, zInit).applyQuaternion(q);

            positions.setXYZ(i,
                xInit + tempVec.x,
                dy + tempVec.y,
                dz + tempVec.z
            );

            // Update color based on stress
            const stressColor = this.stressToColor(normalizedStress);
            colors.setXYZ(i, stressColor.r, stressColor.g, stressColor.b);
        }

        positions.needsUpdate = true;
        colors.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
    }

    updateSpringDamperVisuals() {
        // Animate spring compression
        if (this.springCoils) {
            const stretch = this.tipDisp.y * 0.1;
            this.springCoils.forEach((coil, i) => {
                const baseY = -2 + (i / this.springCoils.length) * 4;
                coil.position.y = baseY + stretch * (i / this.springCoils.length);
            });
        }

        // Animate damper piston
        if (this.piston) {
            this.piston.position.x = this.tipDisp.y * 0.2;
        }
    }

    updateCharts() {
        this.drawTimeHistoryChart();
        this.drawPhaseSpaceChart();
    }

    drawTimeHistoryChart() {
        if (!this.timeCtx) return;
        const { width, height } = this.timeCanvas;
        const ctx = this.timeCtx;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        if (this.timeHistory.length < 2) return;

        // Find max amplitude for scaling
        let maxAmp = 0.1;
        this.timeHistory.forEach(p => {
            if (Math.abs(p.y) > maxAmp) maxAmp = Math.abs(p.y);
        });

        // Draw displacement curve
        ctx.strokeStyle = '#5ad4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        this.timeHistory.forEach((point, idx) => {
            const x = (idx / this.maxTimePoints) * width;
            const y = height / 2 - (point.y / (maxAmp * 1.2)) * (height / 2 - 10);

            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Envelope (exponential decay)
        if (this.dampingRatio < 1 && this.dampingRatio > 0) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1;
            ctx.beginPath();

            const A0 = maxAmp;
            const lambda = this.dampingRatio * this.naturalFreq;

            for (let x = 0; x < width; x++) {
                const t = (x / width) * (this.simTime - (this.timeHistory[0]?.t || 0));
                const envelope = A0 * Math.exp(-lambda * t);
                const y = height / 2 - (envelope / (maxAmp * 1.2)) * (height / 2 - 10);

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText('y(t)', 5, 15);
    }

    drawPhaseSpaceChart() {
        if (!this.phaseCtx) return;
        const { width, height } = this.phaseCanvas;
        const ctx = this.phaseCtx;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        if (this.phaseHistory.length < 2) return;

        // Find scale
        let maxX = 0.1, maxV = 0.1;
        this.phaseHistory.forEach(p => {
            if (Math.abs(p.x) > maxX) maxX = Math.abs(p.x);
            if (Math.abs(p.v) > maxV) maxV = Math.abs(p.v);
        });

        // Draw phase trajectory with gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(90, 212, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(90, 212, 255, 1)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();

        this.phaseHistory.forEach((point, idx) => {
            const x = width / 2 + (point.x / (maxX * 1.2)) * (width / 2 - 10);
            const y = height / 2 - (point.v / (maxV * 1.2)) * (height / 2 - 10);

            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Current point
        if (this.phaseHistory.length > 0) {
            const last = this.phaseHistory[this.phaseHistory.length - 1];
            const x = width / 2 + (last.x / (maxX * 1.2)) * (width / 2 - 10);
            const y = height / 2 - (last.v / (maxV * 1.2)) * (height / 2 - 10);

            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText('Phase Space (x, ẋ)', 5, 15);
        ctx.fillText('x →', width - 25, height / 2 - 5);
        ctx.fillText('ẋ ↑', width / 2 + 5, 15);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        if (this.camera.aspect < 1) {
            this.camera.position.z = 18;
        } else {
            this.camera.position.z = 14;
        }
    }

    render() {
        const delta = this.clock.getDelta();
        this.simulate(delta);
        this.updateRodGeometry();
        this.updateSpringDamperVisuals();
        this.updateCharts();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // === INTERACTION ===

    onPointerDown(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.hitRod || this.rod);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            if (point.x > this.fixedX + this.rodLength * 0.3) {
                this.isDragging = true;
                this.controls.enabled = false;

                const normal = new THREE.Vector3();
                this.camera.getWorldDirection(normal);
                this.dragPlane.setFromNormalAndCoplanarPoint(normal, point);

                this.phaseHistory = [];
                this.timeHistory = [];
                this.simTime = 0;

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
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.hitRod || this.rod);
            if (intersects.length > 0 && intersects[0].point.x > this.fixedX + this.rodLength * 0.3) {
                this.canvas.style.cursor = 'grab';
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

        if (Math.abs(shapeVal) < 0.0001) return;

        let newDispY = point.y / shapeVal;
        let newDispZ = point.z / shapeVal;

        const maxDisp = 4.0;
        const currentMag = Math.sqrt(newDispY * newDispY + newDispZ * newDispZ);
        if (currentMag > maxDisp) {
            const ratio = maxDisp / currentMag;
            newDispY *= ratio;
            newDispZ *= ratio;
        }

        this.tipDisp.set(0, newDispY, newDispZ);
        this.tipVel.set(0, 0, 0);

        this.calculateEnergy();
        this.maxEnergy = this.totalEnergy;
    }
}

new ElasticRodApp();
