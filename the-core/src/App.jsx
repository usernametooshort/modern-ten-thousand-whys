import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Zap, Activity, Power, Binary, CheckCircle2, AlertTriangle, ArrowDown, Play, Pause, RefreshCw, StepForward } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// --- Utility ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Components ---

// 1. Hero Section
const Hero = ({ onStart }) => {
  const [text, setText] = useState('');
  const fullText = "Welcome, Operator. Initializing System...";
  const [isReady, setIsReady] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setIsReady(true);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setIsBooting(true);
    // Simulate boot sequence
    const steps = [
      "Checking Memory Integrity...",
      "Loading Kernel Modules...",
      "Establishing Neural Link...",
      "System Online."
    ];
    
    let step = 0;
    const bootInterval = setInterval(() => {
      setBootStep(step);
      step++;
      if (step >= steps.length) {
        clearInterval(bootInterval);
        setTimeout(onStart, 800);
      }
    }, 600);
  };

  const bootLogs = [
    "Checking Memory Integrity...",
    "Loading Kernel Modules...",
    "Establishing Neural Link...",
    "System Online."
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-cyber-bg">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center"
      >
        <div className="mb-8 font-mono text-cyber-blue text-xl md:text-3xl tracking-widest min-h-[40px]">
          {text}
          <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-3 h-6 bg-cyber-green ml-1 align-middle"
          />
        </div>

        {!isBooting ? (
          <AnimatePresence>
            {isReady && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 243, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="group relative px-8 py-4 bg-transparent border-2 border-cyber-blue text-cyber-blue font-bold text-lg uppercase tracking-widest overflow-hidden transition-all duration-300"
              >
                <span className="absolute inset-0 w-full h-full bg-cyber-blue/10 group-hover:bg-cyber-blue/20 transition-all duration-300" />
                <span className="relative flex items-center gap-2">
                  <Power className="w-5 h-5" />
                  Initialize Core
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        ) : (
          <div className="w-80 font-mono text-left text-sm space-y-2">
            {bootLogs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: index <= bootStep ? 1 : 0, 
                  x: index <= bootStep ? 0 : -20,
                  color: index === bootStep ? '#00f3ff' : index < bootStep ? '#00ff41' : '#333'
                }}
                className="flex items-center gap-2"
              >
                 {index < bootStep ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4 animate-pulse" />}
                 {log}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// 2. Binary Switch Component
const BinarySwitch = ({ value, onChange, label }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="font-mono text-xs text-cyber-blue/50 mb-1"
      >
        {label}
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!value)}
        className={cn(
          "w-12 h-20 rounded-sm border-2 relative transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)]",
          value 
            ? "bg-cyber-green/20 border-cyber-green shadow-[0_0_15px_rgba(0,255,65,0.4)]" 
            : "bg-cyber-panel border-gray-700 hover:border-cyber-red/50"
        )}
      >
        <div className={cn(
          "absolute w-full h-1/2 left-0 transition-all duration-300 flex items-center justify-center",
          value ? "top-0" : "bottom-0"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full shadow-inner",
            value ? "bg-cyber-green box-glow-green" : "bg-gray-800"
          )} />
        </div>
        <div className="absolute inset-0 flex flex-col justify-between py-2 items-center pointer-events-none">
          <span className={cn("text-[10px] font-bold", value ? "text-cyber-green" : "text-gray-600")}>1</span>
          <span className={cn("text-[10px] font-bold", !value ? "text-cyber-red" : "text-gray-600")}>0</span>
        </div>
      </motion.button>
      <div className={cn(
        "font-mono text-lg font-bold transition-colors",
        value ? "text-cyber-green text-glow-green" : "text-gray-600"
      )}>
        {value ? 1 : 0}
      </div>
    </div>
  );
};

// 3. Module 1: The Language of Machines
const BinaryModule = () => {
  const [bits, setBits] = useState(Array(8).fill(false));
  const [inputValue, setInputValue] = useState('');

  const decimalValue = bits.reduce((acc, bit, index) => {
    return acc + (bit ? Math.pow(2, 7 - index) : 0);
  }, 0);

  const toggleBit = (index) => {
    const newBits = [...bits];
    newBits[index] = !newBits[index];
    setBits(newBits);
    setInputValue(String.fromCharCode(
        newBits.reduce((acc, bit, idx) => acc + (bit ? Math.pow(2, 7 - idx) : 0), 0)
    ));
  };

  const handleInputChange = (e) => {
    const char = e.target.value.slice(-1); // Get last char
    if (!char) {
        setInputValue('');
        setBits(Array(8).fill(false));
        return;
    }
    setInputValue(char);
    const code = char.charCodeAt(0);
    // Convert to binary array
    const newBits = Array(8).fill(false).map((_, i) => {
        return ((code >> (7 - i)) & 1) === 1;
    });
    setBits(newBits);
  };

  return (
    <section id="module-binary" className="min-h-screen py-20 px-4 md:px-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-cyber-blue/10 rounded-lg border border-cyber-blue/30">
            <Binary className="w-8 h-8 text-cyber-blue" />
        </div>
        <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Module 1: <span className="text-cyber-blue">The Language of Machines</span>
            </h2>
            <p className="text-gray-400 max-w-2xl">
                Computers don't understand words or decimal numbers. They only speak in High Voltage (1) and Low Voltage (0). This is Binary.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Interaction Area */}
        <div className="lg:col-span-2 bg-cyber-panel border border-gray-800 rounded-xl p-8 relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyber-red rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse delay-150" />
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
                {bits.map((bit, index) => (
                    <BinarySwitch 
                        key={index} 
                        value={bit} 
                        onChange={() => toggleBit(index)}
                        label={`2^${7-index}`}
                    />
                ))}
            </div>

            <div className="flex flex-col items-center justify-center">
                <div className="text-gray-500 font-mono text-sm mb-2">DECIMAL VALUE</div>
                <motion.div 
                    key={decimalValue}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl md:text-8xl font-bold text-white font-mono tracking-tighter"
                >
                    <span className="text-cyber-blue text-glow">{decimalValue}</span>
                </motion.div>
            </div>
        </div>

        {/* Translator / Side Panel */}
        <div className="bg-cyber-panel border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
            <div>
                <h3 className="text-xl font-bold text-cyber-green mb-4 flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    ASCII Translator
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    Every letter you type is stored as a number. Type a letter below to see its binary DNA.
                </p>
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={handleInputChange}
                    maxLength={1}
                    placeholder="Type A-Z..."
                    className="w-full bg-black border border-cyber-green/50 text-center text-4xl font-bold text-cyber-green py-4 rounded focus:outline-none focus:border-cyber-green focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] uppercase placeholder:text-gray-800"
                />
            </div>

            <div className="mt-auto bg-black/50 p-4 rounded border border-gray-800">
                <div className="text-xs text-gray-500 font-mono mb-2">SYSTEM STATUS</div>
                <div className="flex justify-between items-center text-sm font-mono text-cyber-blue">
                    <span>VOLTAGE:</span>
                    <span>{decimalValue > 0 ? "HIGH" : "IDLE"}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-mono text-cyber-blue">
                    <span>BITS ACTIVE:</span>
                    <span>{bits.filter(b => b).length}/8</span>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

// 4. Module 2: The Brain (CPU Logic with Three.js)
const CpuModule = () => {
    const mountRef = useRef(null);
    // UI State for React to render (synced from simulation)
    const [uiState, setUiState] = useState({
        pc: 0,
        ir: { op: 'WAIT', val: 0, hex: '0000' },
        acc: 0,
        alu: 0,
        step: "IDLE",
        regs: { A: 0, B: 0 }
    });
    
    // Config for Three.js
    const COLORS = {
        bg: 0x0a0a0a, // Match Tailwind bg-cyber-bg
        module: 0x111111, // Dark panel
        moduleActive: 0x222222,
        data: 0x00f3ff, // Cyber Blue
        control: 0xff0055, // Cyber Red
        address: 0x00ff41, // Cyber Green
        grid: 0x1a3a5a
    };

    const PROGRAM = [
        { op: 'LOAD_A', val: 3, hex: '1003' },
        { op: 'LOAD_B', val: 5, hex: '2005' },
        { op: 'ADD',    val: 0, hex: '3000' },
        { op: 'STORE',  val: 8, hex: '4008' },
        { op: 'JUMP',   val: 0, hex: '5000' } 
    ];

    // Refs to control simulation from outside React render cycle
    const simRef = useRef({
        scene: null,
        camera: null,
        renderer: null,
        components: {},
        particles: [],
        cpuState: { pc: 0, ir: 0, acc: 0, alu: 0, regs: { A: 0, B: 0 } },
        isRunning: false,
        timer: null,
        step: null,
        clockSpeed: 1000,
        currentStepIdx: -1
    });

    useEffect(() => {
        if (!mountRef.current) return;

        // Init Three.js
        const width = mountRef.current.clientWidth;
        const height = 500; // Fixed height for the canvas container
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(COLORS.bg);
        scene.fog = new THREE.FogExp2(COLORS.bg, 0.02);

        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
        camera.position.set(0, 40, 40);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.maxPolarAngle = Math.PI / 2.2;
        controls.enableZoom = false; // Disable zoom to avoid scrolling conflicts

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

        simRef.current.scene = scene;
        simRef.current.camera = camera;
        simRef.current.renderer = renderer;

        // Helpers
        const createBox = (name, x, z, w, d, color = COLORS.module) => {
            const geometry = new THREE.BoxGeometry(w, 2, d);
            const material = new THREE.MeshPhongMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.9,
                shininess: 100
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, 1, z);
            
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true }));
            mesh.add(line);

            // Label
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#00f3ff';
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
            simRef.current.components[name] = { mesh, material, baseColor: color };
            return mesh;
        };

        const createBus = (fromName, toName, type = 'data') => {
            const from = simRef.current.components[fromName].mesh.position;
            const to = simRef.current.components[toName].mesh.position;
            
            const points = [];
            points.push(new THREE.Vector3(from.x, 0.5, from.z));
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
        };

        // Build Scene
        createBox('RAM', 0, -10, 8, 4);
        createBox('CPU_CU', -8, 5, 6, 6);
        createBox('CPU_REGS', 0, 5, 6, 6);
        createBox('CPU_ALU', 8, 5, 6, 6);

        const busRamToRegs = createBus('RAM', 'CPU_REGS', 'data');
        // const busCuToRegs = createBus('CPU_CU', 'CPU_REGS', 'control'); // Unused variable
        const busRegsToAlu = createBus('CPU_REGS', 'CPU_ALU', 'data');
        // const busAluToRegs = createBus('CPU_ALU', 'CPU_REGS', 'data'); // Unused variable

        // Animation Logic
        const spawnParticle = (pathPoints, color, duration = 1000) => {
            const geometry = new THREE.SphereGeometry(0.3, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: color });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            simRef.current.particles.push({
                mesh, path: pathPoints, progress: 0, speed: 1 / (duration / 16)
            });
        };

        const highlight = (componentName, active = true) => {
            const comp = simRef.current.components[componentName];
            if(comp) {
                comp.mesh.material.color.setHex(active ? COLORS.moduleActive : comp.baseColor);
                comp.mesh.scale.setScalar(active ? 1.1 : 1.0);
            }
        };

        const flashBus = (bus, count = 3) => {
            for(let i=0; i<count; i++) {
                setTimeout(() => spawnParticle(bus.points, bus.color, 800), i * 200);
            }
        };

        // Micro-operations
        const STEPS = [
            // FETCH
            () => {
                setUiState(prev => ({ ...prev, step: "FETCH (取指)" }));
                highlight('CPU_CU', true);
                highlight('RAM', true);
                flashBus(busRamToRegs, 5);
                const rawInstr = PROGRAM[simRef.current.cpuState.pc];
                simRef.current.cpuState.ir = rawInstr;
                setUiState(prev => ({ ...prev, pc: simRef.current.cpuState.pc, ir: rawInstr }));
            },
            // DECODE
            () => {
                setUiState(prev => ({ ...prev, step: "DECODE (译码)" }));
                highlight('CPU_CU', true);
                highlight('RAM', false);
                highlight('CPU_REGS', true);
            },
            // EXECUTE
            () => {
                setUiState(prev => ({ ...prev, step: "EXECUTE (执行)" }));
                highlight('CPU_CU', false);
                const { op, val } = simRef.current.cpuState.ir;
                const state = simRef.current.cpuState;
                
                if (op === 'LOAD_A') {
                    highlight('CPU_REGS', true);
                    state.regs.A = val;
                    state.acc = val;
                    flashBus(busRamToRegs, 3);
                } else if (op === 'LOAD_B') {
                    highlight('CPU_REGS', true);
                    state.regs.B = val;
                    flashBus(busRamToRegs, 3);
                } else if (op === 'ADD') {
                    highlight('CPU_ALU', true);
                    highlight('CPU_REGS', true);
                    flashBus(busRegsToAlu, 3);
                    state.alu = state.regs.A + state.regs.B;
                    state.acc = state.alu;
                } else if (op === 'STORE') {
                    highlight('RAM', true);
                    highlight('CPU_REGS', true);
                    flashBus(busRegsToAlu, 3);
                }
                setUiState(prev => ({ ...prev, acc: state.acc, alu: state.alu, regs: {...state.regs} }));
            },
            // UPDATE
            () => {
                setUiState(prev => ({ ...prev, step: "UPDATE (更新)" }));
                highlight('CPU_ALU', false);
                highlight('CPU_REGS', false);
                highlight('RAM', false);
                const { op, val } = simRef.current.cpuState.ir;
                if (op === 'JUMP') {
                    simRef.current.cpuState.pc = val;
                } else {
                    simRef.current.cpuState.pc = (simRef.current.cpuState.pc + 1) % PROGRAM.length;
                }
                setUiState(prev => ({ ...prev, pc: simRef.current.cpuState.pc }));
            }
        ];

        simRef.current.step = () => {
            Object.keys(simRef.current.components).forEach(k => highlight(k, false));
            simRef.current.currentStepIdx = (simRef.current.currentStepIdx + 1) % 4;
            STEPS[simRef.current.currentStepIdx]();
        };

        // Render Loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            // Particles
            for (let i = simRef.current.particles.length - 1; i >= 0; i--) {
                const p = simRef.current.particles[i];
                p.progress += p.speed;
                if (p.progress >= 1) {
                    scene.remove(p.mesh);
                    simRef.current.particles.splice(i, 1);
                } else {
                    const point = new THREE.Vector3();
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
        };
        animate();

        return () => {
            mountRef.current?.removeChild(renderer.domElement);
            renderer.dispose();
        }
    }, []);

    // Controls
    const handleStep = () => {
        if (simRef.current.step) simRef.current.step();
    };

    const handleRun = () => {
        if (simRef.current.isRunning) {
            simRef.current.isRunning = false;
            clearTimeout(simRef.current.timer);
            setUiState(prev => ({ ...prev, isRunning: false }));
        } else {
            simRef.current.isRunning = true;
            setUiState(prev => ({ ...prev, isRunning: true }));
            const loop = () => {
                if(!simRef.current.isRunning) return;
                simRef.current.step();
                simRef.current.timer = setTimeout(loop, 1000);
            };
            loop();
        }
    };

    const handleReset = () => {
        simRef.current.isRunning = false;
        clearTimeout(simRef.current.timer);
        simRef.current.cpuState = { pc: 0, ir: { op: 'WAIT', val: 0 }, acc: 0, alu: 0, regs: { A: 0, B: 0 } };
        simRef.current.currentStepIdx = -1;
        setUiState({
            pc: 0,
            ir: { op: 'WAIT', val: 0, hex: '0000' },
            acc: 0,
            alu: 0,
            step: "RESET",
            regs: { A: 0, B: 0 },
            isRunning: false
        });
    };

    return (
        <section id="module-cpu" className="min-h-screen py-20 px-4 md:px-10 max-w-7xl mx-auto flex flex-col">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-cyber-red/10 rounded-lg border border-cyber-red/30">
                    <Cpu className="w-8 h-8 text-cyber-red" />
                </div>
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Module 2: <span className="text-cyber-red">The Brain</span>
                    </h2>
                    <p className="text-gray-400">
                        The Central Processing Unit (CPU) follows a strict rhythm: Fetch, Decode, Execute.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                {/* 3D Canvas Area */}
                <div className="lg:col-span-2 bg-black border border-gray-800 rounded-xl overflow-hidden relative min-h-[500px]" ref={mountRef}>
                    <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur px-3 py-1 rounded border border-gray-700 text-xs text-gray-400">
                        Interactive 3D View (Drag to Rotate)
                    </div>
                </div>

                {/* Cyber Dashboard */}
                <div className="bg-cyber-panel border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
                    <div className="border-b border-gray-800 pb-4">
                        <div className="text-xs text-gray-500 font-mono mb-1">CURRENT INSTRUCTION</div>
                        <div className="font-mono text-2xl text-cyber-blue font-bold tracking-wider">
                            {uiState.ir.op} {uiState.ir.val !== undefined ? uiState.ir.val : ''}
                        </div>
                        <div className="text-xs text-cyber-green mt-1 flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            STATUS: {uiState.step}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-3 rounded border border-gray-800">
                            <div className="text-xs text-gray-500">PC (COUNTER)</div>
                            <div className="text-xl font-mono text-white">{uiState.pc.toString().padStart(4, '0')}</div>
                        </div>
                        <div className="bg-black/40 p-3 rounded border border-gray-800">
                            <div className="text-xs text-gray-500">ACC (ACCUM)</div>
                            <div className="text-xl font-mono text-white">{uiState.acc.toString().padStart(4, '0')}</div>
                        </div>
                        <div className="bg-black/40 p-3 rounded border border-gray-800">
                            <div className="text-xs text-gray-500">REG A</div>
                            <div className="text-xl font-mono text-cyber-green">{uiState.regs.A}</div>
                        </div>
                         <div className="bg-black/40 p-3 rounded border border-gray-800">
                            <div className="text-xs text-gray-500">REG B</div>
                            <div className="text-xl font-mono text-cyber-green">{uiState.regs.B}</div>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                         <div className="flex gap-2">
                            <button 
                                onClick={handleStep}
                                className="flex-1 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue text-cyber-blue py-3 rounded flex items-center justify-center gap-2 font-bold transition-all"
                            >
                                <StepForward className="w-4 h-4" /> STEP
                            </button>
                            <button 
                                onClick={handleRun}
                                className={cn(
                                    "flex-1 border py-3 rounded flex items-center justify-center gap-2 font-bold transition-all",
                                    uiState.isRunning 
                                        ? "bg-cyber-red/10 border-cyber-red text-cyber-red"
                                        : "bg-cyber-green/10 border-cyber-green text-cyber-green hover:bg-cyber-green/20"
                                )}
                            >
                                {uiState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {uiState.isRunning ? "PAUSE" : "AUTO"}
                            </button>
                         </div>
                         <button 
                            onClick={handleReset}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded flex items-center justify-center gap-2 text-sm transition-all"
                        >
                            <RefreshCw className="w-3 h-3" /> RESET SYSTEM
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};


// --- Main App ---
function App() {
  // Check hash IMMEDIATELY during initialization (not in useEffect)
  const [appState, setAppState] = useState(() => {
    // If there's a hash, skip Hero and go directly to MAIN
    return window.location.hash ? 'MAIN' : 'HERO';
  });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && appState === 'MAIN') {
      // Scroll to target element after React renders the content
      const attemptScroll = () => {
          const el = document.querySelector(hash);
          if (el) {
              el.scrollIntoView({ behavior: 'auto', block: 'start' });
              return true;
          }
          return false;
      };

      // Retry loop until element is found
      const interval = setInterval(() => {
          if (attemptScroll()) clearInterval(interval);
      }, 50);
      
      // Stop retrying after 3 seconds
      setTimeout(() => clearInterval(interval), 3000);
    }
  }, [appState]);

  const handleStart = () => {
    setAppState('MAIN');
  };

  // Navigation Handler
  const scrollToModule = (id) => {
      const el = document.getElementById(id);
      if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-white font-sans selection:bg-cyber-blue selection:text-black">
      <AnimatePresence mode="wait">
        {appState === 'HERO' && (
          <motion.div
            key="hero"
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Hero onStart={handleStart} />
          </motion.div>
        )}
        
        {appState === 'MAIN' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <nav className="fixed top-0 w-full z-50 bg-cyber-bg/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div className="font-mono font-bold text-xl tracking-tighter flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse" />
                    THE CORE
                </div>
                <div className="flex gap-4">
                    <button onClick={() => scrollToModule('module-binary')} className="text-xs font-mono text-gray-400 hover:text-cyber-blue transition-colors">
                        MOD 1: BINARY
                    </button>
                    <button onClick={() => scrollToModule('module-cpu')} className="text-xs font-mono text-gray-400 hover:text-cyber-red transition-colors">
                        MOD 2: CPU
                    </button>
                </div>
            </nav>

            <main className="pt-20">
                <BinaryModule />
                <div className="flex justify-center py-10">
                    <ArrowDown className="w-6 h-6 text-gray-700 animate-bounce" />
                </div>
                <CpuModule />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
