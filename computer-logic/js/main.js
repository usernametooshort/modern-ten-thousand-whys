import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Configuration ---
const COLORS = {
    bg: 0x050a10,
    module: 0x112233,
    moduleActive: 0x224466,
    text: 0xe0f0ff,
    data: 0x00f0ff,
    control: 0xff9d00,
    address: 0x00ff88,
    grid: 0x1a3a5a
};

const PROGRAM = [
    { op: 'LOAD_A', val: 3, hex: '1003' }, // Load 3 into A
    { op: 'LOAD_B', val: 5, hex: '2005' }, // Load 5 into B
    { op: 'ADD',    val: 0, hex: '3000' }, // ADD A + B -> ACC
    { op: 'STORE',  val: 8, hex: '4008' }, // Store ACC to Mem[8]
    { op: 'JUMP',   val: 0, hex: '5000' }  // Jump to 0 (Loop)
];

// --- Scene Setup ---
const canvas = document.querySelector('#canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.bg);
scene.fog = new THREE.FogExp2(COLORS.bg, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 40, 40);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.2; // Don't go below ground

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(COLORS.data, 1);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Grid
const gridHelper = new THREE.GridHelper(100, 50, COLORS.grid, COLORS.grid);
gridHelper.position.y = -0.1;
scene.add(gridHelper);

// --- Component Factory ---
const components = {};
const particles = [];

function createBox(name, x, z, w, d, color = COLORS.module) {
    const geometry = new THREE.BoxGeometry(w, 2, d);
    const material = new THREE.MeshPhongMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.9,
        shininess: 100
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 1, z);
    
    // Edges
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true }));
    mesh.add(line);

    // Label (Canvas Texture)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 64);
    
    const labelTex = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(w * 0.8, w * 0.4);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.y = 1.05;
    mesh.add(label);

    scene.add(mesh);
    components[name] = { mesh, material, baseColor: color };
    return mesh;
}

function createBus(fromName, toName, type = 'data') {
    const from = components[fromName].mesh.position;
    const to = components[toName].mesh.position;
    
    const points = [];
    points.push(new THREE.Vector3(from.x, 0.5, from.z));
    // Simple routing: go mid-way then turn
    const midZ = (from.z + to.z) / 2;
    points.push(new THREE.Vector3(from.x, 0.5, midZ));
    points.push(new THREE.Vector3(to.x, 0.5, midZ));
    points.push(new THREE.Vector3(to.x, 0.5, to.z));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color = type === 'data' ? COLORS.data : (type === 'addr' ? COLORS.address : COLORS.control);
    const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    return { points, color };
}

function spawnParticle(pathPoints, color, duration = 1000) {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    particles.push({
        mesh,
        path: pathPoints,
        progress: 0,
        speed: 1 / (duration / 16) // Approx 60fps
    });
}

// --- Build Layout ---
//     [RAM]
//       |
//    [BUS]
//       |
// [CU] [Regs] [ALU]

createBox('RAM', 0, -10, 8, 4);
createBox('CPU_CU', -8, 5, 6, 6);
createBox('CPU_REGS', 0, 5, 6, 6);
createBox('CPU_ALU', 8, 5, 6, 6);

const busRamToRegs = createBus('RAM', 'CPU_REGS', 'data');
const busCuToRegs = createBus('CPU_CU', 'CPU_REGS', 'control');
const busRegsToAlu = createBus('CPU_REGS', 'CPU_ALU', 'data');
const busAluToRegs = createBus('CPU_ALU', 'CPU_REGS', 'data');

// --- CPU Logic Simulator ---
const cpuState = {
    pc: 0,
    ir: 0,
    acc: 0,
    alu: 0,
    step: 0, // 0:Idle, 1:Fetch, 2:Decode, 3:Execute, 4:Writeback
    regs: { A: 0, B: 0 }
};

const UI = {
    instruction: document.getElementById('instruction-display'),
    step: document.getElementById('step-display'),
    pc: document.getElementById('reg-pc'),
    ir: document.getElementById('reg-ir'),
    acc: document.getElementById('reg-acc'),
    alu: document.getElementById('reg-alu'),
    speedVal: document.getElementById('speed-val')
};

function updateUI() {
    UI.pc.innerText = cpuState.pc.toString().padStart(4, '0');
    UI.ir.innerText = cpuState.ir.hex || '0000';
    UI.acc.innerText = cpuState.acc.toString().padStart(4, '0');
    UI.alu.innerText = cpuState.alu.toString().padStart(4, '0');
    
    if (cpuState.ir) {
        UI.instruction.innerText = `${cpuState.ir.op} ${cpuState.ir.val}`;
    } else {
        UI.instruction.innerText = "WAITING...";
    }
}

// Highlight logic
function highlight(componentName, active = true) {
    const comp = components[componentName];
    if(comp) {
        comp.mesh.material.color.setHex(active ? COLORS.moduleActive : comp.baseColor);
        comp.mesh.scale.setScalar(active ? 1.1 : 1.0);
    }
}

function flashBus(bus, count = 3) {
    for(let i=0; i<count; i++) {
        setTimeout(() => {
            spawnParticle(bus.points, bus.color, 800);
        }, i * 200);
    }
}

// --- Micro-Operation Steps ---
// Simplified 4-stage cycle
const STEPS = [
    // 0: FETCH (PC -> RAM -> IR)
    () => {
        UI.step.innerText = "1. 取指 (FETCH)";
        highlight('CPU_CU', true);
        highlight('RAM', true);
        flashBus(busRamToRegs, 5); // Simulate reading instruction
        
        // Logic
        const rawInstr = PROGRAM[cpuState.pc];
        cpuState.ir = rawInstr;
        updateUI();
    },
    // 1: DECODE (IR -> CU)
    () => {
        UI.step.innerText = "2. 译码 (DECODE)";
        highlight('CPU_CU', true);
        highlight('RAM', false);
        highlight('CPU_REGS', true); // Preparing registers
        
        // Logic
        // Just visual update
    },
    // 2: EXECUTE (Actual work)
    () => {
        UI.step.innerText = "3. 执行 (EXECUTE)";
        highlight('CPU_CU', false);
        
        const op = cpuState.ir.op;
        const val = cpuState.ir.val;

        if (op === 'LOAD_A') {
            highlight('CPU_REGS', true);
            cpuState.regs.A = val;
            cpuState.acc = val; // Simply show in ACC for visual
            flashBus(busRamToRegs, 3);
        } 
        else if (op === 'LOAD_B') {
            highlight('CPU_REGS', true);
            cpuState.regs.B = val;
            flashBus(busRamToRegs, 3);
        }
        else if (op === 'ADD') {
            highlight('CPU_ALU', true);
            highlight('CPU_REGS', true);
            flashBus(busRegsToAlu, 3);
            cpuState.alu = cpuState.regs.A + cpuState.regs.B;
            cpuState.acc = cpuState.alu;
        }
        else if (op === 'STORE') {
            highlight('RAM', true);
            highlight('CPU_REGS', true);
            flashBus(busRegsToAlu, 3); // Visualize data moving out
        }
        else if (op === 'JUMP') {
             // Logic handled in next step
        }
        updateUI();
    },
    // 3: WRITEBACK / UPDATE PC
    () => {
        UI.step.innerText = "4. 更新 (UPDATE)";
        highlight('CPU_ALU', false);
        highlight('CPU_REGS', false);
        highlight('RAM', false);
        
        const op = cpuState.ir.op;
        if (op === 'JUMP') {
            cpuState.pc = cpuState.ir.val;
        } else {
            cpuState.pc = (cpuState.pc + 1) % PROGRAM.length;
        }
        updateUI();
    }
];

let currentStepIdx = -1;
let isRunning = false;
let clockSpeed = 1000;
let timer = null;

function step() {
    // Reset highlights
    Object.keys(components).forEach(k => highlight(k, false));
    
    currentStepIdx = (currentStepIdx + 1) % 4;
    STEPS[currentStepIdx]();
}

function runLoop() {
    if(!isRunning) return;
    step();
    timer = setTimeout(runLoop, clockSpeed);
}

// --- Interaction ---
document.getElementById('btn-step').addEventListener('click', () => {
    isRunning = false;
    clearTimeout(timer);
    step();
});

document.getElementById('btn-run').addEventListener('click', () => {
    if(isRunning) {
        isRunning = false;
        clearTimeout(timer);
        document.getElementById('btn-run').innerText = "自动运行 (Auto)";
    } else {
        isRunning = true;
        document.getElementById('btn-run').innerText = "暂停 (Pause)";
        runLoop();
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    isRunning = false;
    clearTimeout(timer);
    cpuState.pc = 0;
    cpuState.regs.A = 0;
    cpuState.regs.B = 0;
    cpuState.acc = 0;
    cpuState.alu = 0;
    cpuState.ir = 0;
    currentStepIdx = -1;
    updateUI();
    document.getElementById('btn-run').innerText = "自动运行 (Auto)";
    document.getElementById('instruction-display').innerText = "READY";
    document.getElementById('step-display').innerText = "RESET";
});

const slider = document.getElementById('speed-slider');
slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    clockSpeed = 2000 / val; // 1 = 2000ms, 10 = 200ms
    UI.speedVal.innerText = val + "Hz";
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        } else {
            const point = new THREE.Vector3();
            // Simple path interpolation
            const totalLength = p.path.length;
            const scaledProg = p.progress * (totalLength - 1);
            const idx = Math.floor(scaledProg);
            const t = scaledProg - idx;
            
            if (idx < totalLength - 1) {
                point.lerpVectors(p.path[idx], p.path[idx+1], t);
                p.mesh.position.copy(point);
            }
        }
    }

    renderer.render(scene, camera);
}

// Init
updateUI();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

