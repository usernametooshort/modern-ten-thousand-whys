import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Data & Configuration ---

const PROMPTS_DATA = {
    en: {
        sky: { 
            start: ["The", "sky", "is"], 
            steps: [
                { next: ["blue", "gray", "limit"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.9, 0.5] },
                { next: [".", "and", ","], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.2, 0.3, 0.9] },
                { next: ["I", "The", "It"], weights: [0.6, 0.2, 0.2], attention: [0.1, 0.5, 0.1, 0.1, 0.8] },
                { next: ["love", "see", "like"], weights: [0.7, 0.2, 0.1], attention: [0.8, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["it", "stars", "nature"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.9, 0.1, 0.1, 0.1, 0.8, 0.9] },
                { next: ["!", ".", "?"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] }
            ]
        },
        code: { 
            start: ["if", "(", "x", ">", "0", ")", "{"],
            steps: [
                { next: ["print", "return", "x"], weights: [0.7, 0.2, 0.1], attention: [0.9, 0.1, 0.8, 0.8, 0.8, 0.1, 0.9] },
                { next: ["(", " ", "x"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["'Hi'", "x", "error"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: [")", " ", ";"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: [";", ".", "{"], weights: [0.95, 0.02, 0.03], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["}", "print", "return"], weights: [0.9, 0.05, 0.05], attention: [0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1] }
            ]
        },
        story: { 
            start: ["Once", "upon", "a"],
            steps: [
                { next: ["time", "day", "midnight"], weights: [0.95, 0.02, 0.03], attention: [0.9, 0.9, 0.9] },
                { next: [",", ".", "there"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.9] },
                { next: ["there", "a", "the"], weights: [0.7, 0.2, 0.1], attention: [0.5, 0.1, 0.1, 0.1, 0.1] },
                { next: ["was", "lived", "is"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["a", "three", "one"], weights: [0.7, 0.2, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["dragon", "king", "frog"], weights: [0.5, 0.3, 0.2], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] }
            ]
        }
    },
    zh: {
        sky: { 
            start: ["天", "空", "是"], 
            steps: [
                { next: ["蓝", "灰", "广"], weights: [0.9, 0.05, 0.05], attention: [0.8, 0.9, 0.6] },
                { next: ["色", "的", "阔"], weights: [0.95, 0.03, 0.02], attention: [0.1, 0.1, 0.1, 0.9] },
                { next: ["的", "。", ","], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["。", "！", "美丽"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["我", "它", "云"], weights: [0.7, 0.2, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
                { next: ["喜", "看", "爱"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["欢", "见", "它"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] }
            ]
        },
        code: { 
            start: ["if", "(", "x", ">", "0", ")", "{"],
            steps: [
                { next: ["print", "return", "x"], weights: [0.7, 0.2, 0.1], attention: [0.9, 0.1, 0.8, 0.8, 0.8, 0.1, 0.9] },
                { next: ["(", " ", "x"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["'Hi'", "x", "error"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: [")", " ", ";"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: [";", ".", "{"], weights: [0.95, 0.02, 0.03], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["}", "print", "return"], weights: [0.9, 0.05, 0.05], attention: [0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1] }
            ]
        },
        story: { 
            start: ["很", "久", "以"], 
            steps: [
                { next: ["前", "后", "往"], weights: [0.95, 0.02, 0.03], attention: [0.9, 0.9, 0.9] },
                { next: ["，", "。", "有"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.9] },
                { next: ["有", "一", "在"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.5] },
                { next: ["一", "个", "座"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["座", "个", "位"], weights: [0.6, 0.3, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["大", "高", "古"], weights: [0.5, 0.3, 0.2], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["山", "楼", "庙"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] }
            ]
        }
    },
    de: {
        sky: { 
            start: ["Der", "Himmel", "ist"], 
            steps: [
                { next: ["blau", "grau", "weit"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.9, 0.6] },
                { next: [".", "und", ","], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.9] },
                { next: ["Ich", "Es", "Er"], weights: [0.6, 0.2, 0.2], attention: [0.1, 0.5, 0.1, 0.1, 0.8] },
                { next: ["liebe", "sehe", "mag"], weights: [0.7, 0.2, 0.1], attention: [0.8, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["es", "ihn", "sie"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.9, 0.1, 0.1, 0.1, 0.8, 0.9] },
                { next: ["!", ".", "?"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] }
            ]
        },
        code: { 
            start: ["if", "(", "x", ">", "0", ")", "{"],
            steps: [
                { next: ["print", "return", "x"], weights: [0.7, 0.2, 0.1], attention: [0.9, 0.1, 0.8, 0.8, 0.8, 0.1, 0.9] },
                { next: ["(", " ", "x"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["'Hi'", "x", "error"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: [")", " ", ";"], weights: [0.9, 0.05, 0.05], attention: [0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: [";", ".", "{"], weights: [0.95, 0.02, 0.03], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["}", "print", "return"], weights: [0.9, 0.05, 0.05], attention: [0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1] }
            ]
        },
        story: { 
            start: ["Es", "war", "einmal"], 
            steps: [
                { next: ["ein", "eine", "einen"], weights: [0.5, 0.4, 0.1], attention: [0.9, 0.9, 0.9] },
                { next: ["König", "Prinz", "Frosch"], weights: [0.4, 0.3, 0.3], attention: [0.1, 0.1, 0.1, 0.9] },
                { next: [",", ".", "der"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["der", "in", "und"], weights: [0.7, 0.2, 0.1], attention: [0.5, 0.1, 0.1, 0.1, 0.1, 0.1] },
                { next: ["in", "einem", "sehr"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["einem", "Schloss", "Land"], weights: [0.6, 0.2, 0.2], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] },
                { next: ["Schloss", "Turm", "Haus"], weights: [0.8, 0.1, 0.1], attention: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9] }
            ]
        }
    }
};

const COLORS = {
    tokenBase: 0x2a2a4a,
    tokenFace: 0x4488ff,
    attention: 0xffcc00,
    prediction: 0x202020,
    predictionText: 0xffffff,
    predictionBar: 0x00ff88,
    bg: 0x050510
};

// --- Utils ---

function createTextTexture(text, color = 'white', bgColor = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 512, 512);
    }

    // Dynamic font size calculation
    let fontSize = 180;
    ctx.font = `bold ${fontSize}px Inter, Arial`;
    let textMetrics = ctx.measureText(text);
    const maxWidth = 440; // Inside the 472px border with some padding

    // Shrink until it fits
    while (textMetrics.width > maxWidth && fontSize > 40) {
        fontSize -= 10;
        ctx.font = `bold ${fontSize}px Inter, Arial`;
        textMetrics = ctx.measureText(text);
    }
    
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 256);
    
    // Add border
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 20;
    ctx.strokeRect(20, 20, 472, 472);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

function createMenuTexture(word, percent, isSelected = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = isSelected ? '#004422' : '#202020';
    ctx.fillRect(0, 0, 512, 128);
    
    // Text
    ctx.font = 'bold 60px Inter, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 40, 64);
    
    // Percent Text
    ctx.textAlign = 'right';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText((percent * 100).toFixed(0) + '%', 470, 64);
    
    // Progress Bar Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(40, 100, 432, 10);
    
    // Progress Bar Fill
    ctx.fillStyle = isSelected ? '#00ff88' : '#4488ff';
    ctx.fillRect(40, 100, 432 * percent, 10);
    
    // Border
    if (isSelected) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 504, 120);
    }

    return new THREE.CanvasTexture(canvas);
}

class LLMApp {
    constructor() {
        this.container = document.getElementById('scene-canvas');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.bg);
        this.scene.fog = new THREE.FogExp2(COLORS.bg, 0.015);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 6, 22);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        this.clock = new THREE.Clock();
        this.tokens = [];
        this.attentionLines = [];
        this.particles = [];
        this.predictionGroup = new THREE.Group();
        this.scene.add(this.predictionGroup);

        this.currentLang = 'zh'; // Default, will be updated on init
        this.currentPromptKey = 'sky';
        this.currentPromptData = null;
        this.currentTokens = [];
        this.isAnimating = false;

        this.initLights();
        this.initScene(); // Will load prompt based on current language
        this.bindUI();
        this.renderer.setAnimationLoop(() => this.render());

        window.addEventListener('resize', () => this.onResize());
        
        window.addEventListener('languageChanged', (e) => {
            // Fix: e.detail is directly the language string in i18n.js
            this.currentLang = typeof e.detail === 'string' ? e.detail : (e.detail && e.detail.lang);
            if (!this.currentLang) this.currentLang = 'en';
            
            // Need to reset to initial state of current prompt in new language
            this.resetScene();
        });
        
        // Initial lang check
        if(window.i18n) {
            this.currentLang = window.i18n.currentLang || 'zh';
            // Re-init
            this.resetScene();
        }
    }

    getPrompts() {
        return PROMPTS_DATA[this.currentLang] || PROMPTS_DATA['en'];
    }

    resetScene() {
        const prompts = this.getPrompts();
        // Fallback if key doesn't exist in new lang
        this.currentPromptData = prompts[this.currentPromptKey] || prompts['sky'];
        this.currentTokens = [...this.currentPromptData.start];
        
        // Reset UI button text
        const btnGen = document.getElementById('btn-generate');
        if(btnGen) {
            btnGen.disabled = false;
            const key = 'llm_btn_generate';
            btnGen.textContent = window.i18n ? window.i18n.get(key) : "Generate Next Token";
        }
        
        this.initScene();
    }

    initLights() {
        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(amb);
        
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(5, 10, 10);
        this.scene.add(dir);

        const spot = new THREE.SpotLight(COLORS.tokenFace, 10);
        spot.position.set(0, 10, 0);
        spot.angle = 0.5;
        spot.penumbra = 1;
        this.scene.add(spot);
    }

    initScene() {
        this.clearScene();
        // Ensure data is loaded
        if(!this.currentPromptData) {
            const prompts = this.getPrompts();
            this.currentPromptData = prompts[this.currentPromptKey];
            this.currentTokens = [...this.currentPromptData.start];
        }
        
        this.visualizeTokens(this.currentTokens);
        this.updateTokenStream();
        this.updateStatus('llm_step_ready', 'llm_step_ready_desc');
    }

    clearScene() {
        this.tokens.forEach(t => this.scene.remove(t.mesh));
        this.tokens = [];
        this.clearAttention();
        this.clearPredictions();
    }

    clearAttention() {
        this.attentionLines.forEach(l => this.scene.remove(l));
        this.attentionLines = [];
        this.particles.forEach(p => this.scene.remove(p));
        this.particles = [];
    }

    clearPredictions() {
        while(this.predictionGroup.children.length > 0) {
            this.predictionGroup.remove(this.predictionGroup.children[0]);
        }
    }

    createTokenMesh(text, index) {
        const group = new THREE.Group();
        
        // Tile Geometry
        const w = 2, h = 2.4, d = 0.3;
        const geo = new THREE.BoxGeometry(w, h, d);
        
        const matDark = new THREE.MeshStandardMaterial({ color: COLORS.tokenBase, roughness: 0.6 });
        const tex = createTextTexture(text, '#ffffff', '#4488ff');
        const matFace = new THREE.MeshStandardMaterial({ 
            map: tex, 
            roughness: 0.2, 
            metalness: 0.1,
            emissive: 0x001133
        });

        const materials = [matDark, matDark, matDark, matDark, matFace, matDark];
        const mesh = new THREE.Mesh(geo, materials);
        group.add(mesh);

        const spacing = 2.6;
        const startX = -((this.currentTokens.length * spacing) / 2) + spacing/2;
        group.position.set(startX + index * spacing, 0, 0);
        
        group.userData = { index: index, text: text, basePos: group.position.clone() };
        
        this.scene.add(group);
        return { mesh: group, text: text, material: matFace };
    }

    visualizeTokens(tokenList) {
        tokenList.forEach((text, i) => {
            const token = this.createTokenMesh(text, i);
            this.tokens.push(token);
            
            token.mesh.scale.set(0,0,0);
            new TWEEN.Tween(token.mesh.scale)
                .to({ x: 1, y: 1, z: 1 }, 600)
                .easing(TWEEN.Easing.Elastic.Out)
                .delay(i * 100)
                .start();
        });
    }

    getCurrentStepData() {
        const startIndex = this.currentPromptData.start.length;
        const currentLen = this.currentTokens.length;
        const stepIndex = currentLen - startIndex;
        
        if (stepIndex < this.currentPromptData.steps.length) {
            return this.currentPromptData.steps[stepIndex];
        }
        return null;
    }

    async generateNextToken() {
        if (this.isAnimating) return;
        
        const stepData = this.getCurrentStepData();
        if (!stepData) {
            // Should not happen if button handled correctly, but safe guard
            return;
        }

        this.isAnimating = true;
        document.getElementById('btn-generate').disabled = true;

        // Phase 1: Context
        this.updateStatus('llm_step_1', 'llm_step_1_desc');
        await this.highlightContext();

        // Phase 2: Attention
        this.updateStatus('llm_step_2', 'llm_step_2_desc');
        await this.visualizeAttention(stepData.attention); // Pass simulated weights

        // Phase 3: Prediction
        this.updateStatus('llm_step_3', 'llm_step_3_desc');
        await this.visualizePrediction(stepData);

        // Phase 4: Selection
        const nextWord = stepData.next[0]; 
        // Pass dynamic word param
        this.updateStatus('llm_step_4', 'llm_step_4_desc', { word: nextWord });
        this.currentTokens.push(nextWord);
        
        await this.delay(1000);
        this.clearScene();
        this.visualizeTokens(this.currentTokens);
        this.updateTokenStream();

        document.getElementById('btn-generate').disabled = false;
        this.isAnimating = false;
        
        // Check if we reached end
        if (!this.getCurrentStepData()) {
            this.updateStatus('llm_demo_end_title', 'llm_demo_end_desc');
            const btn = document.getElementById('btn-generate');
            btn.textContent = window.i18n ? window.i18n.get('btn_reset') : "Reset";
            btn.disabled = false;
            
            // Mark as ended so next click resets
            this.isEnded = true;
        }
    }

    highlightContext() {
        return new Promise(resolve => {
            this.tokens.forEach((t, i) => {
                new TWEEN.Tween(t.mesh.position)
                    .to({ y: 0.5 }, 300)
                    .yoyo(true)
                    .repeat(1)
                    .delay(i * 100)
                    .start();
                
                const originalEmissive = t.material.emissive.getHex();
                new TWEEN.Tween(t.material.emissive)
                    .to({ r: 0.5, g: 0.5, b: 1.0 }, 300)
                    .yoyo(true)
                    .repeat(1)
                    .delay(i * 100)
                    .onComplete(() => {
                        t.material.emissive.setHex(originalEmissive);
                        if (i === this.tokens.length - 1) setTimeout(resolve, 200);
                    })
                    .start();
            });
        });
    }

    visualizeAttention(weights) {
        return new Promise(resolve => {
            this.clearAttention();
            const lastToken = this.tokens[this.tokens.length - 1];
            const nextSlotPos = lastToken.mesh.position.clone().add(new THREE.Vector3(2.6, 0, 0));

            this.tokens.forEach((source, i) => {
                const weight = (weights && weights[i] !== undefined) ? weights[i] : 0.1;
                
                // If weight is very low, maybe skip drawing or make very faint
                if (weight < 0.05) return;

                const startPos = source.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                const endPos = nextSlotPos.clone().add(new THREE.Vector3(0, 1.2, 0));
                
                const midX = (startPos.x + endPos.x) / 2;
                const height = 4 + Math.abs(startPos.x - endPos.x) * 0.5; 
                const curve = new THREE.QuadraticBezierCurve3(
                    startPos,
                    new THREE.Vector3(midX, height, 0),
                    endPos
                );

                const points = curve.getPoints(30);
                const geo = new THREE.BufferGeometry().setFromPoints(points);
                const mat = new THREE.LineBasicMaterial({ 
                    color: COLORS.attention, 
                    transparent: true, 
                    opacity: 0,
                    linewidth: Math.max(1, weight * 5) // Line width doesn't work on all WebGL, but opacity will help
                });
                const line = new THREE.Line(geo, mat);
                this.scene.add(line);
                this.attentionLines.push(line);

                // Animate opacity based on weight
                new TWEEN.Tween(mat)
                    .to({ opacity: 0.2 + weight * 0.8 }, 600)
                    .delay(i * 100)
                    .start();

                // Pulse the source token if high weight
                if (weight > 0.6) {
                    new TWEEN.Tween(source.mesh.scale)
                        .to({ x: 1.2, y: 1.2, z: 1.2 }, 200)
                        .yoyo(true)
                        .repeat(1)
                        .delay(i * 100 + 300)
                        .start();
                }

                this.spawnParticles(curve, i * 100, weight);
            });

            setTimeout(resolve, 2500);
        });
    }

    spawnParticles(curve, delay, weight) {
        // More particles for higher weight
        const count = Math.floor(weight * 5) + 1;
        
        const particleGeo = new THREE.SphereGeometry(0.08 + weight * 0.05);
        const particleMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        
        for(let k=0; k<count; k++) { 
            const p = new THREE.Mesh(particleGeo, particleMat);
            p.visible = false;
            this.scene.add(p);
            this.particles.push(p);

            const speed = 1500;
            const startDelay = delay + k * 300;

            new TWEEN.Tween({ t: 0 })
                .to({ t: 1 }, speed)
                .delay(startDelay)
                .onStart(() => { p.visible = true; })
                .onUpdate((obj) => {
                    const pos = curve.getPoint(obj.t);
                    p.position.copy(pos);
                })
                .onComplete(() => { p.visible = false; })
                .start();
        }
    }

    visualizePrediction(stepData) {
        return new Promise(resolve => {
            this.clearPredictions();
            
            const nextWords = stepData.next;
            const weights = stepData.weights;
            const lastToken = this.tokens[this.tokens.length - 1];
            const basePos = lastToken.mesh.position.clone().add(new THREE.Vector3(2.6, 0, 0));

            // Autocomplete Menu
            const menuGroup = new THREE.Group();
            menuGroup.position.set(basePos.x, 4.5, 0);
            this.predictionGroup.add(menuGroup);

            nextWords.forEach((word, i) => {
                const isSelected = (i === 0);
                const tex = createMenuTexture(word, weights[i], isSelected);
                const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
                const geo = new THREE.PlaneGeometry(5, 1.25);
                const mesh = new THREE.Mesh(geo, mat);
                
                mesh.position.y = (nextWords.length - 1 - i) * 1.4 - (nextWords.length * 0.7);
                menuGroup.add(mesh);

                mesh.position.x = -2;
                mesh.scale.set(0, 1, 1);
                new TWEEN.Tween(mesh.position).to({ x: 0 }, 400).delay(i*100).easing(TWEEN.Easing.Quart.Out).start();
                new TWEEN.Tween(mesh.scale).to({ x: 1 }, 400).delay(i*100).easing(TWEEN.Easing.Quart.Out).start();
            });

            // Ghost Token
            const ghostTex = createTextTexture("?", "#888", "#222");
            const ghostGeo = new THREE.BoxGeometry(2, 2.4, 0.3);
            const ghostMat = new THREE.MeshBasicMaterial({ map: ghostTex, transparent: true, opacity: 0.3 });
            const ghost = new THREE.Mesh(ghostGeo, ghostMat);
            ghost.position.copy(basePos);
            this.predictionGroup.add(ghost);
            
            new TWEEN.Tween(ghost.material).to({ opacity: 0.6 }, 500).yoyo(true).repeat(3).start();

            setTimeout(resolve, 2500);
        });
    }

    updateTokenStream() {
        const container = document.getElementById('token-output');
        if(!container) return;
        container.innerHTML = '';
        const startLen = this.currentPromptData.start.length;
        
        this.currentTokens.forEach((t, i) => {
            const span = document.createElement('span');
            span.className = 'stream-token';
            if (i >= startLen) span.classList.add('new');
            span.textContent = t;
            container.appendChild(span);
        });
    }

    updateStatus(titleKey, descKey, params = {}) {
        const get = window.i18n ? window.i18n.get.bind(window.i18n) : (k) => k;
        const titleEl = document.getElementById('step-title');
        const descEl = document.getElementById('step-desc');
        
        if(titleEl) titleEl.textContent = get(titleKey, params);
        if(descEl) descEl.textContent = get(descKey, params);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    bindUI() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if(this.isAnimating) return;
                
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentPromptKey = btn.dataset.prompt;
                this.resetScene();
                this.isEnded = false;
            });
        });

        const btnGen = document.getElementById('btn-generate');
        if(btnGen) {
            btnGen.addEventListener('click', () => {
                if(this.isEnded) {
                    this.resetScene();
                    this.isEnded = false;
                } else {
                    this.generateNextToken();
                }
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
        TWEEN.update();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

const TWEEN = {
    tweens: [],
    update() {
        const now = performance.now();
        this.tweens = this.tweens.filter(t => t.update(now));
    },
    Easing: { 
        Elastic: { Out: k => {
            if (k === 0) return 0; if (k === 1) return 1;
            return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
        }},
        Quart: { Out: k => 1 - Math.pow(1 - k, 4) }
    },
    Tween: class {
        constructor(target) { this.target = target; this.tweens = TWEEN.tweens; this._onComplete = null; this._onStart = null; this._onUpdate = null; }
        to(props, duration) { this.toProps = props; this.duration = duration; return this; }
        easing(fn) { this.easingFn = fn; return this; }
        delay(ms) { this.delayTime = ms; return this; }
        yoyo(bool) { this.isYoyo = bool; return this; }
        repeat(count) { this.repeatCount = count; return this; }
        onComplete(fn) { this._onComplete = fn; return this; }
        onStart(fn) { this._onStart = fn; return this; }
        onUpdate(fn) { this._onUpdate = fn; return this; }
        start() {
            this.startTime = performance.now() + (this.delayTime || 0);
            this.startProps = {};
            for(let k in this.toProps) {
                this.startProps[k] = this.target[k];
            }
            this.isPlaying = true;
            this.started = false;
            TWEEN.tweens.push(this);
            return this;
        }
        update(now) {
            if (now < this.startTime) return true;
            if (!this.started) {
                this.started = true;
                if (this._onStart) this._onStart();
            }

            let progress = (now - this.startTime) / this.duration;
            if (progress > 1) {
                if (this.isYoyo && !this.yoyoBack) {
                    this.yoyoBack = true;
                    this.startTime = now;
                    [this.startProps, this.toProps] = [this.toProps, this.startProps];
                    return true;
                }
                progress = 1;
                this.isPlaying = false;
            }
            const val = this.easingFn ? this.easingFn(progress) : progress;
            
            for(let k in this.toProps) {
                if (typeof this.startProps[k] === 'number') {
                    this.target[k] = this.startProps[k] + (this.toProps[k] - this.startProps[k]) * val;
                } else if (this.target[k] && this.target[k].isColor) {
                    if (this.toProps.r !== undefined) this.target.r = this.startProps.r + (this.toProps.r - this.startProps.r) * val;
                    if (this.toProps.g !== undefined) this.target.g = this.startProps.g + (this.toProps.g - this.startProps.g) * val;
                    if (this.toProps.b !== undefined) this.target.b = this.startProps.b + (this.toProps.b - this.startProps.b) * val;
                }
            }

            if (this._onUpdate) this._onUpdate({ t: val });
            if (!this.isPlaying && this._onComplete) this._onComplete();
            return this.isPlaying;
        }
    }
};

new LLMApp();
