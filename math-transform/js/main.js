import * as THREE from 'three';
import { MathEngine, Q_TYPES, TYPE_LABELS } from './math-engine.js';

// Error Handler
window.onerror = function(msg, url, line, col, error) {
    const log = document.getElementById('error-log');
    if (log) {
        log.style.display = 'block';
        log.innerText = `Error: ${msg}`;
    }
    console.error("Global Error:", msg, error);
};

// Dictionary
const DICT = {
    zh: {
        title: "数学符号变换",
        subtitle: "括号展开 · 移项变号 · 合并同类项",
        mastery: "本关进度",
        streak: "连对",
        next: "下一题",
        table: "查看公式表",
        modal_title: "数学符号变换公式表",
        settings: "题型设置",
        types_label: "题目类型",
        sign: "符号法则",
        bracket: "括号展开",
        bracket_nested: "嵌套括号",
        distribute: "分配律",
        move: "移项变号",
        combine: "合并同类项",
        fraction: "分数符号",
        level_label: "当前等级",
        back_home: "返回主页",
        save_bg: "💾 保存壁纸",
        next_bg: "🖼️ 换一张",
        unlock_hint: "掌握度达到 90% 可下载高清壁纸！",
        reason_label: "💡 解释",
        rule_label: "📐 公式",
        loading: "加载中...",
        // Formula table content
        formula: {
            sign_title: "符号法则",
            sign_pp: "正 × 正 = 正",
            sign_pn: "正 × 负 = 负",
            sign_np: "负 × 正 = 负",
            sign_nn: "负 × 负 = 正",
            bracket_title: "括号展开",
            nested_title: "嵌套括号 ⭐",
            nested_1: "减号分配到每一项",
            nested_2: "负负得正！",
            nested_3: "加号不改变符号",
            nested_4: "直接去括号",
            dist_title: "分配律",
            move_title: "移项法则",
            move_hint: "移项要变号！",
            combine_title: "合并同类项",
            combine_hint: "系数相加减，字母不变"
        }
    },
    en: {
        title: "Math Symbol Transform",
        subtitle: "Brackets · Signs · Equations",
        mastery: "Level Progress",
        streak: "Streak",
        next: "Next",
        table: "Formula Table",
        modal_title: "Math Symbol Transform Formulas",
        settings: "Settings",
        types_label: "Question Types",
        sign: "Sign Rules",
        bracket: "Bracket Expansion",
        bracket_nested: "Nested Brackets",
        distribute: "Distributive Law",
        move: "Equation Transposition",
        combine: "Combine Like Terms",
        fraction: "Fraction Signs",
        level_label: "Current Level",
        back_home: "Home",
        save_bg: "💾 Save Wallpaper",
        next_bg: "🖼️ Next Image",
        unlock_hint: "Reach 90% to download HD wallpaper!",
        reason_label: "💡 Explanation",
        rule_label: "📐 Formula",
        loading: "Loading...",
        // Formula table content
        formula: {
            sign_title: "Sign Rules",
            sign_pp: "Pos × Pos = Pos",
            sign_pn: "Pos × Neg = Neg",
            sign_np: "Neg × Pos = Neg",
            sign_nn: "Neg × Neg = Pos",
            bracket_title: "Bracket Expansion",
            nested_title: "Nested Brackets ⭐",
            nested_1: "Minus distributes to each term",
            nested_2: "Negative × Negative = Positive!",
            nested_3: "Plus doesn't change signs",
            nested_4: "Just remove brackets",
            dist_title: "Distributive Law",
            move_title: "Transposition Rule",
            move_hint: "Sign changes when moving!",
            combine_title: "Combine Like Terms",
            combine_hint: "Add/subtract coefficients, variable stays"
        }
    },
    de: {
        title: "Mathematische Umformungen",
        subtitle: "Klammern · Vorzeichen · Gleichungen",
        mastery: "Levelfortschritt",
        streak: "Serie",
        next: "Weiter",
        table: "Formelübersicht",
        modal_title: "Mathematische Umformungsregeln",
        settings: "Einstellungen",
        types_label: "Aufgabentypen",
        sign: "Vorzeichenregeln",
        bracket: "Klammerauflösung",
        bracket_nested: "Verschachtelte Klammern",
        distribute: "Distributivgesetz",
        move: "Äquivalenzumformung",
        combine: "Zusammenfassen",
        fraction: "Bruchvorzeichen",
        level_label: "Aktuelles Level",
        back_home: "Startseite",
        save_bg: "💾 Hintergrundbild speichern",
        next_bg: "🖼️ Nächstes Bild",
        unlock_hint: "Erreiche 90% für den HD-Download!",
        reason_label: "💡 Erklärung",
        rule_label: "📐 Formel",
        loading: "Laden...",
        // Formula table content
        formula: {
            sign_title: "Vorzeichenregeln",
            sign_pp: "Plus × Plus = Plus",
            sign_pn: "Plus × Minus = Minus",
            sign_np: "Minus × Plus = Minus",
            sign_nn: "Minus × Minus = Plus",
            bracket_title: "Klammerauflösung",
            nested_title: "Verschachtelte Klammern ⭐",
            nested_1: "Minus verteilt sich auf jeden Term",
            nested_2: "Minus mal Minus ergibt Plus!",
            nested_3: "Plus ändert keine Vorzeichen",
            nested_4: "Klammer einfach weglassen",
            dist_title: "Distributivgesetz",
            move_title: "Äquivalenzumformung",
            move_hint: "Beim Seitenwechsel ändert sich das Vorzeichen!",
            combine_title: "Zusammenfassen",
            combine_hint: "Koeffizienten addieren, Variable bleibt"
        }
    }
};

let currentLang = 'zh';

// Game Engine
const engine = new MathEngine();
let currentQ = null;
let selectedAnswer = null;
let isChecking = false;

// Stats
let streak = 0;
let level = 1;
let levelQCount = 0;
let levelCorrect = 0;
const Q_PER_LEVEL = 25;
const PASS_THRESHOLD = 0.9;

// Minecraft Reward System
const REWARD_PROMPTS = [
    "minecraft castle landscape at sunset with shaders, high detail, 4k, voxel art",
    "minecraft forest biomes with river, shaders, ray tracing, 4k, voxel art",
    "minecraft diamond mine underground cave, glowing ores, 4k, voxel art",
    "minecraft village on floating island, skyblock style, 4k, voxel art",
    "minecraft nether fortress with lava ocean, atmospheric lighting, 4k, voxel art",
    "minecraft ancient city deep dark biome, sculk sensors, 4k, voxel art",
    "minecraft snowy mountain peak with cabin, shaders, cozy, 4k, voxel art",
    "minecraft underwater ocean monument, glowing guardians, 4k, voxel art",
    "minecraft cherry blossom grove biome, pink leaves, shaders, 4k, voxel art",
    "minecraft lush cave biome with glow berries, magical atmosphere, 4k, voxel art",
    "minecraft desert temple oasis, sunset, shaders, 4k, voxel art",
    "minecraft jungle treehouse, vines, parrots, 4k, voxel art",
    "minecraft end city with ender dragon, purple sky, 4k, voxel art",
    "minecraft mushroom island biome, giant mushrooms, 4k, voxel art",
    "minecraft steampunk airship floating in clouds, 4k, voxel art",
    "minecraft cyberpunk city street, neon blocks, rain, 4k, voxel art",
    "minecraft wizard tower, magic particles, 4k, voxel art",
    "minecraft space station, earth view, 4k, voxel art"
];

const MC_TIPS = [
    "In math, two negatives make a positive!",
    "-(a+b) = -a-b, don't forget to distribute!",
    "Moving a term changes its sign.",
    "Same base, add the exponents!",
    "Coefficients add, variables stay.",
    "Obsidian can only be mined with a diamond pickaxe.",
    "Don't dig straight down!",
    "Creepers are afraid of cats.",
    "Netherite is stronger than diamond.",
    "Always bring a bucket of water when mining.",
    "Use a hoe to harvest skulk sensors silently.",
    "Press F3 to see debug information."
];

// UI Elements
let ui = {};

// 3D Scene (Minecraft Blocks Background)
const scene = new THREE.Scene();
scene.background = null;
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Pixel Texture Creator
function createBlockTexture(type) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (type === 'emerald') {
        ctx.fillStyle = '#17dd62';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#0fa84a';
        for(let i=0; i<8; i++) {
            ctx.fillRect(Math.random()*size, Math.random()*size, 12, 12);
        }
        ctx.fillStyle = '#8ff5b4';
        ctx.fillRect(15, 15, 10, 10);
    } else if (type === 'redstone') {
        ctx.fillStyle = '#aa0f0f';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ff3333';
        for(let i=0; i<10; i++) {
            ctx.fillRect(Math.random()*size, Math.random()*size, 6, 6);
        }
    } else if (type === 'lapis') {
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#3b82f6';
        for(let i=0; i<12; i++) {
            ctx.fillRect(Math.random()*size, Math.random()*size, 8, 8);
        }
    } else if (type === 'gold') {
        ctx.fillStyle = '#fcee4b';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff7aa';
        ctx.fillRect(5, 5, 20, 20);
        ctx.fillStyle = '#d4c226';
        ctx.fillRect(size-10, size-10, 10, 10);
    } else if (type === 'tnt') {
        ctx.fillStyle = '#db382c';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, size/3, size, size/3);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('TNT', 15, size/2 + 6);
    } else if (type === 'smoke') {
        ctx.fillStyle = '#555555';
        ctx.fillRect(0, 0, size, size);
        for(let i=0; i<50; i++) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(Math.random()*size, Math.random()*size, 8, 8);
        }
    } else if (type === 'fire') {
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(10, 10, 20, 20);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

// Create floating blocks
const blockTypes = ['emerald', 'redstone', 'lapis', 'gold'];
const blockMaterials = blockTypes.map(type => new THREE.MeshStandardMaterial({ map: createBlockTexture(type) }));
const blockGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

const shapes = [];
for (let i = 0; i < 6; i++) {
    const mesh = new THREE.Mesh(
        blockGeometry,
        blockMaterials[Math.floor(Math.random() * blockMaterials.length)]
    );
    mesh.position.set(
        (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 8),
        (Math.random() - 0.5) * 15,
        -5 - Math.random() * 10
    );
    mesh.rotation.set(Math.random(), Math.random(), 0);
    scene.add(mesh);
    shapes.push({ mesh, speed: Math.random() * 0.01 + 0.005 });
}

camera.position.z = 5;

// Reward diamonds
const diamondLoot = [];

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    shapes.forEach(s => {
        s.mesh.rotation.x += s.speed;
        s.mesh.rotation.y += s.speed;
    });
    diamondLoot.forEach((d, index) => {
        d.mesh.rotation.y += 0.02;
        d.mesh.position.y = d.baseY + Math.sin(Date.now() * 0.003 + index) * 0.2;
    });
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// FX: TNT Explosion (Wrong Answer)
function triggerTNTExplosion() {
    const flash = document.createElement('div');
    flash.id = 'flash-overlay';
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;opacity:0.8;z-index:1000;pointer-events:none;transition:opacity 0.5s;';
    document.body.appendChild(flash);
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 500);
    }, 50);

    const tntMat = new THREE.MeshStandardMaterial({ map: createBlockTexture('tnt') });
    const tntGeo = new THREE.BoxGeometry(3, 3, 3);
    const tnt = new THREE.Mesh(tntGeo, tntMat);
    tnt.position.set(0, 0, 2);
    scene.add(tnt);

    let scale = 1;
    const expandAnim = setInterval(() => {
        scale += 0.2;
        tnt.scale.set(scale, scale, scale);
        tnt.rotation.x += 0.2;
        tnt.rotation.z += 0.2;
        if (scale > 2.0) {
            clearInterval(expandAnim);
            scene.remove(tnt);
            spawnExplosionParticles(tnt.position);
            playShake();
        }
    }, 30);
}

function spawnExplosionParticles(pos) {
    const smokeMat = new THREE.MeshBasicMaterial({ map: createBlockTexture('smoke') });
    const fireMat = new THREE.MeshBasicMaterial({ map: createBlockTexture('fire') });
    const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);

    for (let i = 0; i < 40; i++) {
        const mat = Math.random() > 0.5 ? smokeMat : fireMat;
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos);
        scene.add(p);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5
        );

        let frame = 0;
        const anim = () => {
            frame++;
            p.position.add(velocity);
            p.rotation.x += 0.3;
            p.rotation.y += 0.3;
            velocity.y -= 0.03;
            if (frame < 80) requestAnimationFrame(anim);
            else scene.remove(p);
        };
        anim();
    }
}

function playShake() {
    const originalPos = camera.position.clone();
    let frame = 0;
    const shake = () => {
        frame++;
        camera.position.x = originalPos.x + (Math.random() - 0.5) * 1.0;
        camera.position.y = originalPos.y + (Math.random() - 0.5) * 1.0;
        if (frame < 20) requestAnimationFrame(shake);
        else camera.position.copy(originalPos);
    };
    shake();
}

// FX: Diamond Reward (Correct Answer)
function spawnDiamondReward() {
    const diamMat = new THREE.MeshStandardMaterial({
        map: createBlockTexture('emerald'),
        emissive: 0x00ff88,
        emissiveIntensity: 0.4
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const diamond = new THREE.Mesh(geo, diamMat);

    const xPos = (diamondLoot.length % 10 - 4.5) * 1.5;
    const row = Math.floor(diamondLoot.length / 10);
    const yPos = -3 - (row * 1.2);

    diamond.position.set(xPos, -10, -5);
    diamond.baseY = yPos;

    scene.add(diamond);
    diamondLoot.push({ mesh: diamond, baseY: yPos });

    let t = 0;
    const popAnim = () => {
        t += 0.05;
        diamond.position.y = -10 + (yPos - (-10)) * Math.min(t, 1);
        if (t < 1) requestAnimationFrame(popAnim);
    };
    popAnim();

    spawnSparkles(diamond.position);
}

function spawnSparkles(pos) {
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    for (let i = 0; i < 8; i++) {
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos).add(new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)));
        scene.add(p);

        let frame = 0;
        const anim = () => {
            frame++;
            p.position.y += 0.02;
            p.material.opacity = 1 - (frame / 40);
            p.material.transparent = true;
            if (frame < 40) requestAnimationFrame(anim);
            else scene.remove(p);
        };
        anim();
    }
}

// Reward Image System
function updateRewardBlur() {
    const img = document.getElementById('reward-img');
    if(img) {
        const blurVal = Math.max(0, 20 - (levelCorrect / Q_PER_LEVEL * 20));
        img.style.filter = `blur(${blurVal}px)`;
    }

    const dlBtn = document.getElementById('btn-download-reward');
    if (dlBtn) {
        if (levelCorrect >= 23) {
            dlBtn.disabled = false;
            dlBtn.title = "";
        } else {
            dlBtn.disabled = true;
            dlBtn.title = DICT[currentLang].unlock_hint;
        }
    }
}

function changeRewardImage() {
    const btn = document.getElementById('btn-next-reward');
    if(btn && btn.disabled) return;

    const tipEl = document.getElementById('mc-tip-text');
    if(tipEl) {
        tipEl.innerText = MC_TIPS[Math.floor(Math.random() * MC_TIPS.length)];
    }

    showLoading();
    if(btn) {
        btn.innerText = DICT[currentLang].loading;
        btn.disabled = true;
    }

    let progress = 0;
    const bar = document.getElementById('loading-bar');

    const interval = setInterval(() => {
        let inc = 0.3;
        if (progress > 50) inc = 0.2;
        if (progress > 80) inc = 0.1;
        if (progress > 90) inc = 0.05;
        progress += Math.random() * inc * 2;
        if (progress > 95) progress = 95;
        if (bar) bar.style.width = progress + '%';
    }, 50);

    const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));

    const loadProcess = new Promise((resolve) => {
        loadNewImage(
            () => resolve(true),
            (err) => {
                console.log("Switching to offline mode:", err);
                const localId = Math.floor(Math.random() * 3) + 1;
                const img = document.getElementById('reward-img');
                if(img) {
                    img.src = `assets/rewards/img${localId}.jpg`;
                    img.style.opacity = 1;
                }
                resolve(false);
            }
        );
    });

    Promise.all([minTimePromise, loadProcess]).then(() => {
        clearInterval(interval);
        if (bar) bar.style.width = '100%';
        setTimeout(() => {
            hideLoading();
            if(btn) {
                btn.innerText = DICT[currentLang].next_bg;
                btn.disabled = false;
            }
        }, 500);
    });
}

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('fade-out');
        overlay.style.display = 'flex';
        const bar = document.getElementById('loading-bar');
        if (bar) bar.style.width = '0%';
        const uiContainer = document.getElementById('ui-container');
        if(uiContainer) uiContainer.style.pointerEvents = 'none';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.style.display = 'none';
            const uiContainer = document.getElementById('ui-container');
            if(uiContainer) uiContainer.style.pointerEvents = '';
        }, 500);
    }
}

function loadNewImage(onSuccess, onError) {
    const img = document.getElementById('reward-img');
    if (!img) {
        if (onSuccess) onSuccess();
        return;
    }

    const prompt = REWARD_PROMPTS[Math.floor(Math.random() * REWARD_PROMPTS.length)];
    const seed = Math.floor(Math.random() * 10000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${seed}&t=${Date.now()}`;

    const tempImg = new Image();
    tempImg.onload = () => {
        img.style.opacity = 0;
        setTimeout(() => {
            img.src = url;
            img.onload = () => {
                img.style.opacity = 1;
                if(onSuccess) onSuccess();
            };
            img.onerror = () => {
                if(onError) onError("DOM Error");
            };
        }, 200);
    };
    tempImg.onerror = () => {
        if(onError) onError("Network Error");
    };
    tempImg.src = url;
}

function downloadReward() {
    const link = document.createElement('a');
    link.href = document.getElementById('reward-img').src;
    link.download = `math-transform-minecraft-reward-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Persistence
function loadProgress() {
    try {
        const saved = localStorage.getItem('math_transform_progress_v1');
        if (saved) {
            const data = JSON.parse(saved);
            streak = data.streak || 0;
            level = data.level || 1;
            levelQCount = data.levelQCount || 0;
            levelCorrect = data.levelCorrect || 0;
        }
    } catch (e) {
        console.error("Failed to load progress", e);
    }
}

function saveProgress() {
    try {
        localStorage.setItem('math_transform_progress_v1', JSON.stringify({
            streak, level, levelQCount, levelCorrect
        }));
    } catch (e) {
        console.error("Failed to save progress", e);
    }
}

// Notification
function showNotification(msg, duration=3000) {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;top:20%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:#fff;padding:20px 40px;border:4px solid #fff;font-family:'VT323',monospace;z-index:9999;font-size:24px;text-align:center;white-space:pre-line;`;
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), duration);
}

// Game Logic
function nextQuestion() {
    currentQ = engine.generateQuestion(level);
    selectedAnswer = null;
    isChecking = false;

    // Reset UI
    ui.questionPrompt.innerText = currentQ.prompt;
    ui.questionBlank.innerText = '?';
    ui.questionBlank.className = '';

    // Update tag
    const tagEl = document.getElementById('tag-type');
    if (tagEl) {
        const labels = TYPE_LABELS[currentLang] || TYPE_LABELS.zh;
        tagEl.innerText = labels[currentQ.type] || currentQ.type;
    }

    // Hide explanation
    const expArea = document.getElementById('explanation-area');
    if (expArea) {
        expArea.classList.remove('visible');
        expArea.classList.add('hidden');
    }

    // Render options
    renderOptions();
    updateStats();
}

function renderOptions() {
    ui.optionsGrid.innerHTML = '';
    currentQ.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-chip';
        btn.innerText = opt.text;
        btn.onclick = () => selectOption(opt);
        ui.optionsGrid.appendChild(btn);
    });
}

function selectOption(opt) {
    if (isChecking) return;
    isChecking = true;

    // Find clicked button and mark it
    const buttons = ui.optionsGrid.querySelectorAll('.option-chip');
    buttons.forEach(btn => {
        if (btn.innerText === opt.text) {
            btn.classList.add('selected');
        }
    });

    // Check answer
    const result = engine.checkAnswer(opt.value);
    levelQCount++;

    if (result.correct) {
        streak++;
        levelCorrect++;

        // Visual feedback
        ui.questionBlank.innerText = opt.text;
        ui.questionBlank.classList.add('correct');
        buttons.forEach(btn => {
            if (btn.innerText === opt.text) {
                btn.classList.add('correct');
            }
        });

        spawnDiamondReward();
    } else {
        streak = 0;

        // Visual feedback
        ui.questionBlank.innerText = result.correctAnswer;
        ui.questionBlank.classList.add('wrong');
        buttons.forEach(btn => {
            if (btn.innerText === opt.text) {
                btn.classList.add('wrong');
            }
            if (btn.innerText === result.correctAnswer) {
                btn.classList.add('correct');
            }
        });

        triggerTNTExplosion();

        // Show explanation
        showExplanation(result);
    }

    // Check level up
    if (levelQCount >= Q_PER_LEVEL) {
        const score = levelCorrect / levelQCount;
        if (score >= PASS_THRESHOLD) {
            if (level < 6) {
                level++;
                showNotification(`LEVEL UP! \n 进入等级 ${level}`);
            } else {
                showNotification(`最高等级已达成！\n MAX LEVEL MASTERED!`);
            }
        } else {
            showNotification(`等级挑战失败 (${Math.floor(score*100)}%)\n 重新开始本等级！`);
        }
        levelQCount = 0;
        levelCorrect = 0;
    }

    updateStats();
    updateRewardBlur();
    saveProgress();

    // Auto-next after delay
    setTimeout(() => {
        nextQuestion();
    }, result.correct ? 1500 : 3000);
}

function showExplanation(result) {
    const expArea = document.getElementById('explanation-area');
    if (!expArea) return;

    const t = DICT[currentLang];
    const explanation = result.explanation[currentLang] || result.explanation.zh;
    const rule = result.rule[currentLang] || result.rule.zh;

    expArea.innerHTML = `
        <strong>${t.reason_label}</strong> ${explanation}<br>
        <strong>${t.rule_label}</strong> ${rule}
    `;
    expArea.classList.remove('hidden');
    expArea.classList.add('visible');
}

function updateStats() {
    ui.streak.innerText = streak;
    const percentage = Math.min(100, Math.floor((levelCorrect / Q_PER_LEVEL) * 100));
    ui.masteryBar.style.width = percentage + '%';
    ui.masteryBar.innerText = `${levelCorrect}/${Q_PER_LEVEL}`;

    const levelEl = document.getElementById('level-val');
    if (levelEl) levelEl.innerText = level;
}

function updateLanguage(lang) {
    currentLang = lang;
    const t = DICT[lang];

    updateLabel('main-title', t.title);
    updateLabel('sub-title', t.subtitle);
    updateLabel('lbl-streak', t.streak);
    updateLabel('lbl-mastery', t.mastery);
    updateLabel('lbl-level', t.level_label);
    updateLabel('btn-next', t.next);
    updateLabel('btn-table', t.table);
    updateLabel('lbl-settings', t.settings);
    updateLabel('lbl-types', t.types_label);
    updateLabel('lbl-sign', t.sign);
    updateLabel('lbl-bracket', t.bracket);
    updateLabel('lbl-nested', t.bracket_nested);
    updateLabel('lbl-distribute', t.distribute);
    updateLabel('lbl-move', t.move);
    updateLabel('lbl-combine', t.combine);
    updateLabel('lbl-fraction', t.fraction);
    updateLabel('btn-download-reward', t.save_bg);
    updateLabel('btn-next-reward', t.next_bg);
    updateLabel('modal-title-text', t.modal_title);
    
    // Render formula table with current language
    renderFormulaTable(t.formula);

    const backBtnText = document.querySelector('#btn-home .text');
    if(backBtnText) backBtnText.innerText = t.back_home;

    // Update tag
    if (currentQ) {
        const tagEl = document.getElementById('tag-type');
        if (tagEl) {
            const labels = TYPE_LABELS[lang] || TYPE_LABELS.zh;
            tagEl.innerText = labels[currentQ.type] || currentQ.type;
        }
    }

    document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === lang);
    });
}

function renderFormulaTable(f) {
    const container = document.getElementById('formula-container');
    if (!container || !f) return;
    
    container.innerHTML = `
        <div class="formula-section">
            <h4>1. ${f.sign_title}</h4>
            <table>
                <tr><td>+(+a) = +a</td><td>${f.sign_pp}</td></tr>
                <tr><td>+(-a) = -a</td><td>${f.sign_pn}</td></tr>
                <tr><td>-(+a) = -a</td><td>${f.sign_np}</td></tr>
                <tr><td>-(-a) = +a</td><td>${f.sign_nn}</td></tr>
            </table>
        </div>
        
        <div class="formula-section">
            <h4>2. ${f.bracket_title}</h4>
            <table>
                <tr><td>-(a + b) = -a - b</td></tr>
                <tr><td>-(a - b) = -a + b</td></tr>
                <tr><td>+(a + b) = a + b</td></tr>
                <tr><td>+(a - b) = a - b</td></tr>
            </table>
        </div>
        
        <div class="formula-section">
            <h4>3. ${f.nested_title}</h4>
            <table>
                <tr><td>a - (b + c) = a - b - c</td><td><em>${f.nested_1}</em></td></tr>
                <tr><td>a - (b - c) = a - b + c</td><td><em>${f.nested_2}</em></td></tr>
                <tr><td>a + (b - c) = a + b - c</td><td><em>${f.nested_3}</em></td></tr>
                <tr><td>a + (b + c) = a + b + c</td><td><em>${f.nested_4}</em></td></tr>
            </table>
        </div>
        
        <div class="formula-section">
            <h4>4. ${f.dist_title}</h4>
            <table>
                <tr><td>a(b + c) = ab + ac</td></tr>
                <tr><td>a(b - c) = ab - ac</td></tr>
                <tr><td>-a(b + c) = -ab - ac</td></tr>
                <tr><td>-a(b - c) = -ab + ac</td></tr>
            </table>
        </div>
        
        <div class="formula-section">
            <h4>5. ${f.move_title}</h4>
            <table>
                <tr><td>a + b = c → a = c - b</td></tr>
                <tr><td>a - b = c → a = c + b</td></tr>
                <tr><td colspan="2"><em>${f.move_hint}</em></td></tr>
            </table>
        </div>
        
        <div class="formula-section">
            <h4>6. ${f.combine_title}</h4>
            <table>
                <tr><td>2a + 3a = 5a</td></tr>
                <tr><td>5x - 2x = 3x</td></tr>
                <tr><td colspan="2"><em>${f.combine_hint}</em></td></tr>
            </table>
        </div>
    `;
}

function updateLabel(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function setupEventListeners() {
    ui.btnNext.addEventListener('click', nextQuestion);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if(!btn.dataset.lang) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateLanguage(btn.dataset.lang);
        });
    });

    const btnTable = document.getElementById('btn-table');
    if (btnTable) {
        btnTable.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('modal-table');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        });
    }

    const btnCloseModal = document.querySelector('#modal-table .close-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('modal-table');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
    }

    document.getElementById('btn-download-reward').addEventListener('click', downloadReward);
    document.getElementById('btn-next-reward').addEventListener('click', changeRewardImage);

    const btnToggleSettings = document.getElementById('btn-toggle-settings');
    const panel = document.getElementById('settings-panel');

    if (btnToggleSettings && panel) {
        btnToggleSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('active');
        });
    }

    const closeSettings = document.querySelector('.close-panel-btn');
    if(closeSettings) {
        closeSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            if(panel) panel.classList.remove('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (panel && panel.classList.contains('active')) {
            if (!panel.contains(e.target) && e.target !== btnToggleSettings) {
                panel.classList.remove('active');
            }
        }
    });
}

function initGame() {
    ui = {
        questionPrompt: document.getElementById('question-prompt'),
        questionBlank: document.getElementById('question-blank'),
        optionsGrid: document.getElementById('options-grid'),
        btnNext: document.getElementById('btn-next'),
        streak: document.getElementById('streak-val'),
        masteryBar: document.getElementById('mastery-bar')
    };

    const container = document.getElementById('canvas-container');
    if (container) {
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
    }

    setupEventListeners();
    loadProgress();
    updateStats();
    updateRewardBlur();
    updateLanguage('zh');
    nextQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        initGame();
        showLoading();
        changeRewardImage();
    } catch (e) {
        console.error("Main Init Error:", e);
        const log = document.getElementById('error-log');
        if(log) {
            log.innerText = "Critical Error: " + e.message;
            log.style.display = 'block';
        }
    }
});

