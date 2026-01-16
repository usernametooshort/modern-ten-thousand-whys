import * as THREE from 'three';
import { GrammarEngine, CASES, GENDERS, ARTICLES, GRAMMAR_TABLE, VERBS, K1_GRAMMAR_TABLE } from './grammar.js';

// Error Handler
window.onerror = function (msg, url, line, col, error) {
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
        title: "德语变格构建器",
        subtitle: "German Declension Constructor",
        mastery: "本关进度",
        streak: "连对",
        check: "检查",
        next: "下一题",
        table: "查看语法表",
        modal_title: "形容词词尾变化表",
        settings: "难度设置",
        case: "格",
        article: "冠词类型",
        nom: "主格 (Nom)",
        akk: "宾格 (Akk)",
        dat: "与格 (Dat)",
        gen: "属格 (Gen)",
        def: "定冠词 (der/die/das)",
        indef: "不定冠词 (ein/eine)",
        none: "无冠词 (Zero)",
        weak: "弱变化 (定冠词后)",
        mixed: "混合变化 (ein/kein)",
        strong: "强变化 (无冠词)",
        shapes_hint: "背景飘浮的几何体是 Minecraft 风格的像素方块。",
        masc: "阳性", fem: "阴性", neut: "中性", pl: "复数",
        ctx_that_is: "那是...",
        ctx_these_are: "那些是...",
        ctx_here_stands: "这里站着...",
        ctx_here_stand: "这里站着...",
        ctx_i_see: "我看见...",
        ctx_he_buys: "他买...",
        ctx_we_have: "我们有...",
        ctx_i_play: "我玩（用/和）...",
        ctx_gift_from: "礼物来自...",
        ctx_because_of: "因为...",
        ctx_despite: "尽管...",
        ctx_he_searches: "他寻找...",
        ctx_she_needs: "她需要...",
        ctx_we_thank: "我们感谢...",
        ctx_he_lives_with: "他住在...那里",
        ctx_inside: "在...里面",
        level_label: "当前等级",
        mode_label: "练习模式",
        mode_adj: "形容词词尾",
        mode_art: "名词定冠词 (Der/Die/Das)",
        back_home: "返回主页",
        save_bg: "💾 保存壁纸",
        next_bg: "🖼️ 换一张",
        unlock_hint: "掌握度达到 100% 可下载高清壁纸！",
        reason_label: "💡 语法解释",
        reason_case: "格",
        reason_gender: "性",
        reason_art: "类型",
        art_short_def: "定冠词",
        art_short_indef: "不定冠词",
        art_short_none: "无冠词",
        expl_fmt: "因为 <b>{noun}</b> 是<b>{gender}</b>名词，且此处处于<b>{case}</b>。在使用<b>{artType}</b>时，形容词词尾应为...",
        loading: "加载中...",
        mic_listening: "正在听...",
        mic_start: "按住说话",
        k1_mode: "Konjunktiv I (传声筒)",
        k1_hint: "听，然后用 'Er sagt, er...' 转述！",
        show_options: "💡 显示选项"
    },
    en: {
        title: "German Declension Constructor",
        subtitle: "Master Articles & Endings",
        mastery: "Level Progress",
        streak: "Streak",
        check: "Check",
        next: "Next",
        table: "Grammar Table",
        modal_title: "Adjective Endings Table",
        settings: "Settings",
        case: "Case",
        article: "Article Type",
        nom: "Nominative",
        akk: "Accusative",
        dat: "Dative",
        gen: "Genitive",
        def: "Definite (der/die/das)",
        indef: "Indefinite (ein/eine)",
        none: "Zero Article",
        weak: "Weak (after Definite)",
        mixed: "Mixed (ein/kein)",
        strong: "Strong (No Article)",
        shapes_hint: "Floating shapes are Minecraft-style blocks.",
        masc: "Masc", fem: "Fem", neut: "Neut", pl: "Plural",
        ctx_that_is: "That is...",
        ctx_these_are: "Those are...",
        ctx_here_stands: "Here stands...",
        ctx_here_stand: "Here stand...",
        ctx_i_see: "I see...",
        ctx_he_buys: "He buys...",
        ctx_we_have: "We have...",
        ctx_i_play: "I play with...",
        ctx_gift_from: "The gift is from...",
        ctx_because_of: "Because of...",
        ctx_despite: "Despite...",
        ctx_he_searches: "He searches for...",
        ctx_she_needs: "She needs...",
        ctx_we_thank: "We thank...",
        ctx_he_lives_with: "He lives with...",
        ctx_inside: "Inside...",
        level_label: "Current Level",
        mode_label: "Mode",
        mode_adj: "Adjective Endings",
        mode_art: "Articles (Der/Die/Das)",
        back_home: "Home",
        save_bg: "💾 Save Wallpaper",
        next_bg: "🖼️ Next Image",
        unlock_hint: "Reach 100% Mastery to download HD wallpaper!",
        reason_label: "💡 Explanation",
        reason_case: "Case",
        reason_gender: "Gender",
        reason_art: "Type",
        art_short_def: "definite article",
        art_short_indef: "indefinite article",
        art_short_none: "no article",
        expl_fmt: "Because <b>{noun}</b> is a <b>{gender}</b> noun, and here it is in the <b>{case}</b>. With <b>{artType}</b>, the adjective needs...",
        loading: "Loading...",
        mic_listening: "Listening...",
        mic_start: "Push to Talk",
        k1_mode: "Konjunktiv I (Rumor)",
        k1_hint: "Listen, then report with 'Er sagt, er...'",
        show_options: "💡 Show Options"
    },
    de: {
        title: "Deklinations-Baukasten",
        subtitle: "Meistere Artikel & Endungen",
        mastery: "Level-Fortschritt",
        streak: "Serie",
        check: "Prüfen",
        next: "Weiter",
        table: "Grammatik-Tabelle",
        modal_title: "Adjektivendungen-Tabelle",
        settings: "Einstellungen",
        case: "Kasus",
        article: "Artikelart",
        nom: "Nominativ",
        akk: "Akkusativ",
        dat: "Dativ",
        gen: "Genitiv",
        def: "Bestimmt (der/die/das)",
        indef: "Unbestimmt (ein/eine)",
        none: "Nullartikel",
        weak: "Schwach (nach Bestimmt)",
        mixed: "Gemischt (ein/kein)",
        strong: "Stark (Ohne Artikel)",
        shapes_hint: "Die schwebenden Formen sind Blöcke im Minecraft-Stil.",
        masc: "Mask", fem: "Fem", neut: "Neut", pl: "Plural",
        ctx_that_is: "Das ist...",
        ctx_these_are: "Das sind...",
        ctx_here_stands: "Hier steht...",
        ctx_here_stand: "Hier stehen...",
        ctx_i_see: "Ich sehe...",
        ctx_he_buys: "Er kauft...",
        ctx_we_have: "Wir haben...",
        ctx_i_play: "Ich spiele mit...",
        ctx_gift_from: "Das Geschenk ist von...",
        ctx_because_of: "Wegen...",
        ctx_despite: "Trotz...",
        ctx_he_searches: "Er sucht...",
        ctx_she_needs: "Sie braucht...",
        ctx_we_thank: "Wir danken...",
        ctx_he_lives_with: "Er wohnt bei...",
        ctx_inside: "Innerhalb...",
        level_label: "Aktuelles Level",
        mode_label: "Modus",
        mode_adj: "Adjektivendungen",
        mode_art: "Artikel (Der/Die/Das)",
        back_home: "Startseite",
        save_bg: "💾 Hintergrundbild speichern",
        next_bg: "🖼️ Nächstes Bild",
        unlock_hint: "Erreiche 100% Beherrschung für den HD-Download!",
        reason_label: "💡 Erklärung",
        reason_case: "Kasus",
        reason_gender: "Genus",
        reason_art: "Typ",
        art_short_def: "bestimmtem Artikel",
        art_short_indef: "unbestimmtem Artikel",
        art_short_none: "Nullartikel",
        expl_fmt: "Da <b>{noun}</b> ein <b>{gender}</b> Nomen ist, und hier im <b>{case}</b> steht. Mit <b>{artType}</b>...",
        loading: "Laden...",
        mic_listening: "Zuhören...",
        mic_start: "Sprechen",
        k1_mode: "Konjunktiv I (Gerücht)",
        k1_hint: "Hör zu und berichte: 'Er sagt, er...'",
        show_options: "💡 Optionen zeigen"

    }
};
let currentLang = 'zh';

// Init Logic
const engine = new GrammarEngine();
let currentQ = null;
let selectedGap = null; // 'art' or 'adj'
let userAnswers = { art: null, adjSuffix: null };
let isChecking = false;
let lastCheckResult = null;
let lastIncorrectExplanation = null;

// Speech Recognition
let recognition = null;
let isListening = false;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = true; // Changed to TRUE to match English module stability
    recognition.interimResults = true; // Changed to TRUE for visual feedback
}


// Stats
let streak = 0;
let level = 1;
let levelQCount = 0;
let levelCorrect = 0;
const Q_PER_LEVEL = 25;

const PASS_THRESHOLDS = {
    1: 0.60,
    2: 0.70,
    3: 0.80,
    4: 0.90,
    5: 0.95,
    6: 1.00
};

// Reward System - Minecraft ONLY
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
    "minecraft badlands mesa biome, terracotta layers, 4k, voxel art",
    "minecraft coral reef warm ocean, colorful, shaders, 4k, voxel art",
    "minecraft ice spikes biome, aurora borealis, 4k, voxel art",
    "minecraft swamp biome with witch hut, moon light, 4k, voxel art",
    "minecraft ravine with waterfalls and lava, dramatic lighting, 4k, voxel art",
    "minecraft stronghold library, dusty, mysterious, 4k, voxel art",
    "minecraft modern house with swimming pool, shaders, 4k, voxel art",
    "minecraft medieval town square, market stalls, 4k, voxel art",
    "minecraft steampunk airship floating in clouds, 4k, voxel art",
    "minecraft cyberpunk city street, neon blocks, rain, 4k, voxel art",
    "minecraft lighthouse on cliff, ocean waves, 4k, voxel art",
    "minecraft wizard tower, magic particles, 4k, voxel art",
    "minecraft viking longship, sea, shaders, 4k, voxel art",
    "minecraft japanese pagoda, cherry blossoms, 4k, voxel art",
    "minecraft pyramid interior, trap, gold, 4k, voxel art",
    "minecraft space station, earth view, 4k, voxel art"
];

const MC_TIPS = [
    "Obsidian can only be mined with a diamond pickaxe.",
    "Don't dig straight down!",
    "Creepers are afraid of cats.",
    "You can sleep only at night or during a thunderstorm.",
    "Gold tools have high enchantability but low durability.",
    "Netherite is stronger than diamond.",
    "Villagers will restock their trades twice a day.",
    "Always bring a bucket of water when mining.",
    "Phantoms only spawn if you haven't slept for 3 days.",
    "Beacons can provide powerful buffs.",
    "Use a hoe to harvest skulk sensors silently.",
    "Axolotls can help you fight underwater mobs.",
    "Press F3 to see debug information.",
    "Mushrooms can be placed on any block in low light.",
    "Snow golems leave a trail of snow behind them."
];

function updateRewardBlur() {
    const img = document.getElementById('reward-img');
    if (img) {
        // Blur decreases as you progress in level count
        // e.g. 0/25 -> 20px blur, 25/25 -> 0px blur
        const blurVal = Math.max(0, 20 - (levelCorrect / Q_PER_LEVEL * 20));
        img.style.filter = `blur(${blurVal}px)`;
    }

    const dlBtn = document.getElementById('btn-download-reward');
    if (dlBtn) {
        if (levelCorrect >= 23) { // Unlock at 90% progress
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
    if (btn && btn.disabled) return; // prevent double click

    // Set random tip
    const tipEl = document.getElementById('mc-tip-text');
    if (tipEl) {
        tipEl.innerText = MC_TIPS[Math.floor(Math.random() * MC_TIPS.length)];
    }

    showLoading();
    if (btn) {
        btn.innerText = DICT[currentLang].loading;
        btn.disabled = true;
    }

    // Simulate progress
    let progress = 0;
    const bar = document.getElementById('loading-bar');
    if (!bar) console.error("CRITICAL: Loading bar element not found!");

    const interval = setInterval(() => {
        // Slower Progress simulation (Target ~15s to reach 95%)
        // 50ms interval -> 300 ticks in 15s
        // 95 / 300 = 0.31 per tick avg

        let inc = 0.3;
        if (progress > 50) inc = 0.2;
        if (progress > 80) inc = 0.1;
        if (progress > 90) inc = 0.05;

        progress += Math.random() * inc * 2; // Random variance
        if (progress > 95) progress = 95; // Cap at 95% until load finishes

        if (bar) bar.style.width = progress + '%';
    }, 50);

    // Minimum display time (2 seconds)
    const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));

    // Image Load Promise with Fallback
    const loadProcess = new Promise((resolve) => {
        loadNewImage(
            () => resolve(true), // Success
            (err) => {
                console.log("Switching to offline mode:", err);

                // Fallback to local image immediately (No retry to save time)
                const localId = Math.floor(Math.random() * 3) + 1;
                const img = document.getElementById('reward-img');

                if (img) {
                    const localSrc = `assets/rewards/img${localId}.jpg`;
                    img.src = localSrc;
                    img.style.opacity = 1;
                }
                // Resolve immediately, don't wait for onload. UX > strict correctness here.
                resolve(false);
            }
        );
    });

    // Wait for both
    Promise.all([minTimePromise, loadProcess]).then(() => {
        clearInterval(interval);
        if (bar) bar.style.width = '100%';

        setTimeout(() => {
            hideLoading();
            if (btn) {
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

        // Show Skip button after 5s
        const skipBtn = document.getElementById('btn-skip-loading');
        if (skipBtn) {
            skipBtn.style.display = 'none'; // Reset
            setTimeout(() => {
                if (overlay.style.display !== 'none') {
                    skipBtn.style.display = 'block';
                }
            }, 5000);
        }

        // Block interaction
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) uiContainer.style.pointerEvents = 'none';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.style.display = 'none';
            // Restore interaction
            const uiContainer = document.getElementById('ui-container');
            if (uiContainer) uiContainer.style.pointerEvents = '';
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
    // Restore High Quality & Standard Model
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${seed}&t=${Date.now()}`;

    // RESTORED FUNCTIONS

    function getFilters() {
        return {
            nom: ui.settings.nom.checked,
            akk: ui.settings.akk.checked,
            dat: ui.settings.dat.checked,
            gen: ui.settings.gen.checked,
            def: ui.settings.def.checked,
            indef: ui.settings.indef.checked,
            none: ui.settings.none.checked
        };
    }

    function calcLevel() {
        // Note: Level is now primarily driven by Q_PER_LEVEL and Accuracy in checkAnswer, 
        // but this might be used for initial state or verification.
        // However, the main logic uses 'level' variable directly.
        // Restoring for safety if legacy calls exist.
        if (streak < 10) return 1;
        return level;
    }
    // TIMEOUT LIMIT - Wait until success or network error
    console.log("Starting AI generation (No Timeout)...");

    const tempImg = new Image();
    tempImg.onload = () => {
        img.style.opacity = 0;
        setTimeout(() => {
            img.src = url;
            img.onload = () => {
                img.style.opacity = 1;
                if (onSuccess) onSuccess();
            };
            img.onerror = () => {
                console.error("DOM Image load failed");
                if (onError) onError("DOM Error");
            };
        }, 200);
    };
    tempImg.onerror = () => {
        console.error("Failed to load image (Network/Server Error)");
        if (onError) onError("Network Error");
    };
    tempImg.src = url;
}

function downloadReward() {
    const link = document.createElement('a');
    link.href = document.getElementById('reward-img').src;
    link.download = `german-grammar-minecraft-reward-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Persistence
function loadProgress() {
    try {
        const saved = localStorage.getItem('german_grammar_progress_v2');
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
        localStorage.setItem('german_grammar_progress_v2', JSON.stringify({
            streak,
            level,
            levelQCount,
            levelCorrect
        }));
    } catch (e) {
        console.error("Failed to save progress", e);
    }
}

// UI Elements
let ui = {};

// 3D Scene Setup (Minecraft Background)
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

// Helper: Create Pixel Texture
function createBlockTexture(type) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fill Base Color
    if (type === 'grass') {
        ctx.fillStyle = '#5b8c28'; // Grass Green
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#4a7520' : '#6aa830';
            ctx.fillRect(Math.random() * size, Math.random() * size, 4, 4);
        }
    } else if (type === 'diamond') {
        ctx.fillStyle = '#64d4d2'; // Diamond Blue
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#cbf7f6'; // Shiny part
        ctx.fillRect(10, 10, 12, 12);
        ctx.fillRect(40, 45, 8, 8);
    } else if (type === 'wood') {
        ctx.fillStyle = '#704824'; // Wood Brown
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#57371b';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(0, i * 12 + 4, size, 4);
        }
    } else if (type === 'gold') {
        ctx.fillStyle = '#fcee4b'; // Gold
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff7aa';
        ctx.fillRect(5, 5, 20, 20);
        ctx.fillStyle = '#d4c226';
        ctx.fillRect(size - 10, size - 10, 10, 10);
    } else if (type === 'tnt') {
        // Top/Bottom Red
        ctx.fillStyle = '#db382c';
        ctx.fillRect(0, 0, size, size);
        // White band
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, size / 3, size, size / 3);
        // Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('TNT', 15, size / 2 + 6);
    } else if (type === 'smoke') {
        ctx.fillStyle = '#555555';
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(Math.random() * size, Math.random() * size, 8, 8);
        }
    } else if (type === 'fire') {
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(10, 10, 20, 20);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; // Pixelated look
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

// 3D Objects (Minecraft Blocks)
const blockTypes = ['grass', 'diamond', 'wood', 'gold', 'tnt'];
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

// Diamond Loot Collection
const diamondLoot = [];

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Background Shapes
    shapes.forEach(s => {
        s.mesh.rotation.x += s.speed;
        s.mesh.rotation.y += s.speed;
    });

    // Diamond Loot Animation
    diamondLoot.forEach((d, index) => {
        d.mesh.rotation.y += 0.02;
        // Bobbing
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

// FX Logic
function triggerTNTExplosion() {
    // 1. White Flash Overlay
    const flash = document.createElement('div');
    flash.id = 'flash-overlay';
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = '0.8';
    flash.style.zIndex = '1000';
    flash.style.pointerEvents = 'none';
    flash.style.transition = 'opacity 0.5s';
    document.body.appendChild(flash);
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 500);
    }, 50);

    // 2. Create TNT Block
    const tntMat = new THREE.MeshStandardMaterial({ map: createBlockTexture('tnt') });
    const tntGeo = new THREE.BoxGeometry(3, 3, 3); // Bigger TNT
    const tnt = new THREE.Mesh(tntGeo, tntMat);
    tnt.position.set(0, 0, 2); // Close to camera
    scene.add(tnt);

    // 3. Expand Animation
    let scale = 1;
    const expandAnim = setInterval(() => {
        scale += 0.2; // Faster expansion
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
    const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6); // Bigger particles

    for (let i = 0; i < 40; i++) { // More particles
        const mat = Math.random() > 0.5 ? smokeMat : fireMat;
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos);
        scene.add(p);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 1.5, // Faster spread
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5
        );

        let frame = 0;
        const anim = () => {
            frame++;
            p.position.add(velocity);
            p.rotation.x += 0.3;
            p.rotation.y += 0.3;
            // Gravity
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
        // Stronger shake
        camera.position.x = originalPos.x + (Math.random() - 0.5) * 1.0;
        camera.position.y = originalPos.y + (Math.random() - 0.5) * 1.0;
        if (frame < 20) requestAnimationFrame(shake);
        else camera.position.copy(originalPos);
    };
    shake();
}

function spawnDiamondReward() {
    const diamMat = new THREE.MeshStandardMaterial({
        map: createBlockTexture('diamond'),
        emissive: 0x00ffff,
        emissiveIntensity: 0.4
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const diamond = new THREE.Mesh(geo, diamMat);

    // Random position in the background "loot pile" area
    const xPos = (diamondLoot.length % 10 - 4.5) * 1.5;
    const row = Math.floor(diamondLoot.length / 10);
    const yPos = -3 - (row * 1.2);

    diamond.position.set(xPos, -10, -5); // Start from below
    diamond.baseY = yPos;

    scene.add(diamond);
    diamondLoot.push({ mesh: diamond, baseY: yPos });

    // Pop up animation
    let t = 0;
    const popAnim = () => {
        t += 0.05;
        const currentY = -10 + (yPos - (-10)) * Math.min(t, 1);
        diamond.position.y = currentY;

        if (t < 1) requestAnimationFrame(popAnim);
    };
    popAnim();

    // Add sparkles around it
    spawnSparkles(diamond.position);
}

function spawnSparkles(pos) {
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    for (let i = 0; i < 8; i++) {
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)));
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

// ... renderReferenceTables ...
function renderReferenceTables() {
    const container = document.getElementById('table-container');
    const t = DICT[currentLang];

    // Check Mode
    const isK1 = ui.settings.mode_k1 && ui.settings.mode_k1.checked;

    if (isK1) {
        // --- K1 TABLE ---
        const tableData = K1_GRAMMAR_TABLE;
        let html = `<div style="overflow-x:auto"><table class="grammar-table" style="width:100%; min-width:300px;">`;
        // Head
        html += `<thead><tr>`;
        tableData.headers.forEach(h => html += `<th>${h}</th>`);
        html += `</tr></thead>`;
        // Body
        html += `<tbody>`;
        tableData.rows.forEach(row => {
            html += `<tr>
                <td><b>${row.person}</b></td>
                <td><span class="highlight" style="color:#d97757">${row.end}</span></td>
                <td>${row.ex}</td>
                <td><i>${row.sein}</i></td>
            </tr>`;
        });
        html += `</tbody></table></div>`;

        container.innerHTML = `<div class="grammar-table-content">${html}</div>`;

        // Note
        const hint = document.createElement('p');
        hint.style.cssText = "font-size:0.85rem; color:#444; margin-top:10px; background:#fff3e0; padding:8px; border-radius:4px; border-left: 3px solid #d97757;";
        hint.innerHTML = "💡 " + tableData.note;
        container.appendChild(hint);

        // Update Modal Title
        const modalTitle = document.getElementById('modal-title-text'); // Corrected
        if (modalTitle) modalTitle.innerText = tableData.title;

        // Hide Tab Buttons for K1 (since there's only one table)
        const tabs = document.querySelector('.grammar-tabs'); // Corrected
        if (tabs) tabs.style.display = 'none';

    } else {
        // --- ADJECTIVE TABLES ---
        // Restore Tabs
        const tabs = document.querySelector('.grammar-tabs'); // Corrected
        if (tabs) tabs.style.display = 'flex';

        const weakHTML = createTableHTML(t.weak, GRAMMAR_TABLE[ARTICLES.DEF]);
        const mixedHTML = createTableHTML(t.mixed, GRAMMAR_TABLE[ARTICLES.INDEF]);
        const strongHTML = createTableHTML(t.strong, GRAMMAR_TABLE[ARTICLES.NONE]);

        container.innerHTML = `
            <div id="tab-weak" class="grammar-table-content">${weakHTML}</div>
            <div id="tab-mixed" class="grammar-table-content hidden">${mixedHTML}</div>
            <div id="tab-strong" class="grammar-table-content hidden">${strongHTML}</div>
        `;

        const hint = document.createElement('p');
        hint.style.fontSize = '0.8rem';
        hint.style.color = '#666';
        hint.style.marginTop = '15px';
        hint.style.fontStyle = 'italic';
        hint.innerText = t.shapes_hint;
        container.appendChild(hint);

        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn) {
            showTableTab(activeBtn.dataset.tab);
        } else {
            showTableTab('weak');
        }

        const modalTitle = document.getElementById('modal-title-text');
        if (modalTitle) modalTitle.innerText = t.modal_title;
    }
}

function showTableTab(tabName) {
    document.querySelectorAll('.grammar-table-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

function createTableHTML(title, data) {
    const t = DICT[currentLang];
    let html = `<h4>${title}</h4><table><thead><tr><th>${t.case}</th><th class="masc">${t.masc}</th><th class="fem">${t.fem}</th><th class="neut">${t.neut}</th><th class="pl">${t.pl}</th></tr></thead><tbody>`;

    const caseOrder = [CASES.NOM, CASES.AKK, CASES.DAT, CASES.GEN];
    const caseMap = { 'Nominative': 'nom', 'Accusative': 'akk', 'Dative': 'dat', 'Genitive': 'gen' };

    caseOrder.forEach(c => {
        const caseKey = caseMap[c];
        const caseLabel = t[caseKey] || c;
        html += `<tr><td><b>${caseLabel}</b></td>`;
        [GENDERS.MASC, GENDERS.FEM, GENDERS.NEUT, GENDERS.PL].forEach(g => {
            const rule = data[c][g];
            const art = rule.art ? rule.art : '∅';
            html += `<td>${art} <span style="color:#666">...</span><b>-${rule.adj}</b></td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table>`;
    return html;
}


function getFilters() {
    return {
        nom: ui.settings.nom.checked,
        akk: ui.settings.akk.checked,
        dat: ui.settings.dat.checked,
        gen: ui.settings.gen.checked,
        def: ui.settings.def.checked,
        indef: ui.settings.indef.checked,
        none: ui.settings.none.checked
    };
}

function calcLevel() {
    if (mastery < 15) return 1;
    if (mastery < 30) return 2;
    if (mastery < 50) return 3;
    if (mastery < 70) return 4;
    if (mastery < 90) return 5;
    return 6; // Max Level
}


function nextQuestion() {
    // Mode check
    if (ui.settings.mode_k1 && ui.settings.mode_k1.checked) {
        engine.setMode('konjunktiv_i');
    } else {
        const isArtDrill = ui.settings.mode_art.checked;
        engine.setMode(isArtDrill ? 'article_drill' : 'adjective');
    }

    // Generate Question
    currentQ = engine.generateQuestion(getFilters(), level);

    // Reset state
    userAnswers = { art: null, adjSuffix: null };
    selectedGap = null;
    isChecking = false;
    lastCheckResult = null;
    lastIncorrectExplanation = null;

    // UI Reset
    ui.sentence.innerHTML = '';
    ui.options.classList.add('hidden');
    ui.btnCheck.classList.remove('hidden');

    // Clear Hint/Explanation Box
    const explanationArea = document.getElementById('explanation-area');
    if (explanationArea) {
        explanationArea.innerHTML = '';
        explanationArea.classList.add('hidden'); // Ensure it hides
        explanationArea.style.display = 'none';  // double ensure
    }
    ui.btnNext.classList.add('hidden');
    ui.btnCheck.disabled = true;

    if (currentQ.mode === 'konjunktiv_i') {
        // K1 Display using Classes (Mobile Friendly)
        ui.sentence.innerHTML = `
            <div class="k1-prompt">${currentQ.prompt}</div>
            <div class="k1-report-label">Du berichtest:</div>
            <div class="k1-target">Er sagt, er <span class="k1-blank">?</span> ...</div>
        `;

        // Show Mic Button
        const btnMic = document.getElementById('btn-mic');
        if (btnMic) btnMic.classList.remove('hidden');

        // Options - HIDDEN BY DEFAULT per user request
        ui.options.innerHTML = '';
        ui.options.classList.add('hidden'); // Start hidden

        // "Show Hint" Button
        const btnHint = document.createElement('button');
        btnHint.className = 'btn';
        btnHint.innerText = DICT[currentLang].show_options || "💡 Options";
        btnHint.style.fontSize = '0.9rem';
        btnHint.style.marginBottom = '10px';
        btnHint.onclick = () => {
            btnHint.style.display = 'none';
            ui.options.classList.remove('hidden');
            ui.options.style.display = 'flex';
        };
        ui.sentence.appendChild(document.createElement('br'));
        ui.sentence.appendChild(btnHint);


        ui.options.style.flexWrap = 'wrap';
        ui.options.style.gap = '10px';
        ui.options.style.justifyContent = 'center';

        // Distractors
        let opts = [currentQ.verb.konj_er]; // Correct
        if (currentQ.verb.ind_ich !== currentQ.verb.konj_er) opts.push(currentQ.verb.ind_ich); // Distractor
        if (currentQ.verb.infinitive === 'sein') opts.push('ist');
        if (currentQ.verb.infinitive === 'haben') opts.push('hat');

        // Shuffle
        opts.sort(() => Math.random() - 0.5);

        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-chip';
            btn.innerText = opt;
            btn.onclick = () => checkK1Click(opt);
            ui.options.appendChild(btn);
        });

        ui.context.innerText = DICT[currentLang].k1_hint;
        ui.btnCheck.classList.add('hidden'); // No check button needed

        // Update tags
        const tagDecl = document.getElementById('tag-declension');
        const tagCase = document.getElementById('tag-case');
        if (tagDecl) tagDecl.innerText = "Konjunktiv I";
        if (tagCase) tagCase.innerText = "Indirect";

        return;
    } else {
        // Hide Mic if not K1
        const btnMic = document.getElementById('btn-mic');
        if (btnMic) btnMic.classList.add('hidden');
        ui.options.style.display = 'grid'; // Restore grid for standard mode
    }

    const expArea = document.getElementById('explanation-area');
    if (expArea) {
        expArea.classList.remove('visible');
        expArea.classList.add('hidden');
        expArea.style.display = 'none';
        expArea.innerHTML = ''; // Clear text content
    }

    renderSentence();
    updateStats(); // Update level display

    // Update Tags
    const tagsDiv = document.getElementById('question-tags');
    if (tagsDiv) {
        const t = DICT[currentLang];
        const tagDecl = document.getElementById('tag-declension');
        const tagCase = document.getElementById('tag-case');

        if (tagDecl && tagCase) {
            if (currentQ.mode === 'article_drill') {
                tagDecl.innerText = t.mode_art; // "Noun Articles"
                tagCase.innerText = t.nom; // "Nominative" (Always Nom for drill)
            } else {
                // Determine Declension Type (Weak/Mixed/Strong)
                let typeStr = "";
                if (currentQ.artType === ARTICLES.DEF) typeStr = t.weak;
                else if (currentQ.artType === ARTICLES.INDEF) typeStr = t.mixed;
                else typeStr = t.strong;

                tagDecl.innerText = typeStr;

                // Case
                const caseMap = { [CASES.NOM]: 'nom', [CASES.AKK]: 'akk', [CASES.DAT]: 'dat', [CASES.GEN]: 'gen' };
                tagCase.innerText = t[caseMap[currentQ.caseType]];
            }
        }
    }
}

function renderSentence() {
    if (currentQ.mode === 'konjunktiv_i') return; // Handled in nextQuestion
    const q = currentQ;
    const ctx = q.context;

    // Clear context hint initially to avoid persistence
    ui.context.innerText = '';

    // Render Context (if exists)
    if (ctx) {
        const ctxSpan = document.createElement('span');
        ctxSpan.innerText = ctx.text + ' ';
        ui.sentence.appendChild(ctxSpan);
        // Hint
        ui.context.innerText = `(${DICT[currentLang][ctx.meaningKey] || ctx.text})`;
    } else {
        // No sentence context (e.g. Article Drill)
        // Check if we should show noun meaning?
        if (q.noun && q.noun.meaning) {
            ui.context.innerText = `(${q.noun.meaning})`;
        }
    }

    if (q.mode === 'article_drill') {
        // [Gap] [Noun]
        const gapArt = document.createElement('span');
        gapArt.id = 'gap-art';
        gapArt.className = 'gap empty';
        gapArt.innerText = '___';
        gapArt.onclick = () => openOptions('art');
        ui.sentence.appendChild(gapArt);

        const nounSpan = document.createElement('span');
        nounSpan.className = 'noun';
        nounSpan.innerText = ' ' + q.noun.word;
        ui.sentence.appendChild(nounSpan);

    } else {
        // [Gap-Art] [Adj-Gap] [Noun]

        // Article Gap (or fixed text if none)
        if (q.artType === ARTICLES.NONE) {
            // No article gap needed
            userAnswers.art = ''; // Auto-fill
        } else {
            const gapArt = document.createElement('span');
            gapArt.id = 'gap-art';
            gapArt.className = 'gap empty';
            gapArt.innerText = '___';
            gapArt.onclick = () => openOptions('art');
            ui.sentence.appendChild(gapArt);
            ui.sentence.appendChild(document.createTextNode(' '));
        }

        // Adjective Gap
        const adjSpan = document.createElement('span');
        adjSpan.innerText = q.adj.word;
        ui.sentence.appendChild(adjSpan);

        const gapAdj = document.createElement('span');
        gapAdj.id = 'gap-adj';
        gapAdj.className = 'gap empty';
        gapAdj.innerText = '_';
        gapAdj.onclick = () => openOptions('adj');
        ui.sentence.appendChild(gapAdj);

        // Noun
        const nounSpan = document.createElement('span');
        nounSpan.className = 'noun';
        nounSpan.innerText = ' ' + q.noun.word;
        ui.sentence.appendChild(nounSpan);
    }
}

function openOptions(type) {
    if (isChecking) return;
    selectedGap = type;

    ui.options.innerHTML = '';
    ui.options.classList.remove('hidden');

    let opts = [];
    if (type === 'art') {
        if (currentQ.mode === 'article_drill') {
            opts = ['der', 'die', 'das', 'die (Pl)'];
        } else {
            // Depending on artType
            if (currentQ.artType === ARTICLES.DEF) opts = ['der', 'die', 'das', 'den', 'dem', 'des'];
            else if (currentQ.artType === ARTICLES.INDEF) opts = ['ein', 'eine', 'einen', 'einem', 'einer', 'eines', 'keine', 'keinen'];
        }
    } else {
        // Adjective Endings
        opts = ['e', 'en', 'er', 'es', 'em'];
    }

    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-chip';
        btn.innerText = opt;
        btn.onclick = () => selectOption(opt);
        ui.options.appendChild(btn);
    });
}

function selectOption(val) {
    if (selectedGap === 'art') {
        userAnswers.art = val.replace(' (Pl)', ''); // Handle special plural display
        const el = document.getElementById('gap-art');
        if (el) {
            el.innerText = val;
            el.classList.remove('empty');
            el.classList.add('filled');
        }
    } else {
        userAnswers.adjSuffix = val;
        const el = document.getElementById('gap-adj');
        if (el) {
            el.innerText = '-' + val;
            el.classList.remove('empty');
            el.classList.add('filled');
        }
    }
    ui.options.classList.add('hidden');
    checkReady();
}

function checkReady() {
    let ready = false;
    if (currentQ.mode === 'article_drill') {
        ready = !!userAnswers.art;
    } else {
        // Need art (if not NONE) and adj
        const artReady = (currentQ.artType === ARTICLES.NONE) || !!userAnswers.art;
        ready = artReady && !!userAnswers.adjSuffix;
    }
    ui.btnCheck.disabled = !ready;
}

// Helper to show notifications
function showNotification(msg, duration = 3000) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '20%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.background = 'rgba(0,0,0,0.8)';
    div.style.color = '#fff';
    div.style.padding = '20px 40px';
    div.style.border = '4px solid #fff';
    div.style.fontFamily = "'Minecraft', monospace";
    div.style.zIndex = '9999';
    div.style.fontSize = '24px';
    div.style.textAlign = 'center';
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => {
        if (div.parentNode) div.parentNode.removeChild(div);
    }, duration);
}

function checkAnswer() {
    isChecking = true;
    const res = engine.checkAnswer(userAnswers.art, userAnswers.adjSuffix);
    lastCheckResult = res;

    // Update Level Stats
    levelQCount++;

    // Visual Feedback
    if (currentQ.mode === 'article_drill') {
        const artGap = document.getElementById('gap-art');
        if (res.correct) {
            artGap.classList.add('correct');
            streak++;
            levelCorrect++;
            spawnDiamondReward();
        } else {
            artGap.classList.add('wrong');
            artGap.innerHTML = `<span style='text-decoration:line-through'>${artGap.innerText}</span> <br> ${res.correctArt}`;
            streak = 0;
            triggerTNTExplosion();
        }
    } else {
        const artGap = document.getElementById('gap-art');
        const adjGap = document.getElementById('gap-adj');

        if (currentQ.artType !== ARTICLES.NONE && artGap) {
            if (res.artCorrect) {
                artGap.classList.add('correct');
            } else {
                artGap.classList.add('wrong');
                const corrDisplay = res.correctArt === '' ? '∅' : res.correctArt;
                artGap.innerHTML = `<span style='text-decoration:line-through'>${artGap.innerText}</span> <br> ${corrDisplay}`;
            }
        }

        if (adjGap) {
            if (res.adjCorrect) {
                adjGap.classList.add('correct');
            } else {
                adjGap.classList.add('wrong');
                adjGap.innerHTML = `<span style='text-decoration:line-through'>${userAnswers.adjSuffix}</span> <br> -${res.correctAdjSuffix}`;
            }
        }

        if (res.correct) {
            streak++;
            levelCorrect++;
            spawnDiamondReward();
        } else {
            streak = 0;
            triggerTNTExplosion();
        }
    }

    if (!res.correct) {
        lastIncorrectExplanation = res;
        try {
            updateExplanationText(currentLang);
        } catch (e) {
            console.error("Failed to update explanation:", e);
        }
    }

    // CHECK LEVEL UP
    if (levelQCount >= Q_PER_LEVEL) {
        const score = levelCorrect / levelQCount;
        // Default to 1.0 if level > 6 (though we cap at 6)
        const threshold = PASS_THRESHOLDS[level] || 1.00;

        if (score >= threshold) {
            if (level < 6) {
                level++;
                showNotification(`LEVEL UP! \n You are now Level ${level}`);
                // Play sound?
            } else {
                showNotification(`MAX LEVEL MASTERED! \n You maintain Level 6!`);
            }
        } else {
            const need = Math.ceil(threshold * 100);
            showNotification(`Level Failed (${Math.floor(score * 100)}%). \n Need ${need}% to pass. \n Try Again!`);
        }
        // Reset for next round (either next level or retry)
        levelQCount = 0;
        levelCorrect = 0;
    }

    updateStats();
    updateRewardBlur();
    saveProgress();

    ui.btnCheck.classList.add('hidden');
    ui.btnNext.classList.remove('hidden');
}

function checkK1Click(answer) {
    if (!currentQ || currentQ.mode !== 'konjunktiv_i') return;

    const correct = answer === currentQ.answerKey;
    if (correct) {
        showResult(true);
        // Show full answer usage
        ui.sentence.innerHTML += `<div style="color:green; margin-top:10px;">✅ Correct! "Er sagt, er <strong>${currentQ.answerKey}</strong>..."</div>`;
    } else {
        handleK1Failure(null, answer);
    }
}


function updateExplanationText(lang) {
    if (!lastIncorrectExplanation) return;

    const t = DICT[lang];
    const keys = lastIncorrectExplanation.explanationKeys;
    const q = currentQ;

    const caseMap = { [CASES.NOM]: 'nom', [CASES.AKK]: 'akk', [CASES.DAT]: 'dat', [CASES.GEN]: 'gen' };
    const caseStr = t[caseMap[keys.case]];
    const genderStr = t[keys.gender]; // masc, fem, neut, pl

    let artTypeStr = "";
    if (keys.artType === ARTICLES.DEF) artTypeStr = t.art_short_def;
    else if (keys.artType === ARTICLES.INDEF) artTypeStr = t.art_short_indef;
    else artTypeStr = t.art_short_none;

    let text = t.expl_fmt
        .replace('{noun}', q.noun.word)
        .replace('{gender}', genderStr)
        .replace('{case}', caseStr)
        .replace('{artType}', artTypeStr);

    const expArea = document.getElementById('explanation-area');
    if (expArea) {
        expArea.classList.remove('hidden');
        expArea.innerHTML = `<strong>${t.reason_label}</strong><br>${text}`;
        expArea.style.display = 'block';
        // Force reflow
        void expArea.offsetWidth;
        expArea.classList.add('visible');
    }
}

function updateStats() {
    ui.streak.innerText = streak;

    // Mastery Bar now shows Progress within the current level batch (of 25)
    // We want it to fill up as we get Correct answers, so 23/25 = 92% -> Pass
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
    updateLabel('lbl-level', t.level_label || "Level"); // Fallback
    updateLabel('btn-check', t.check);
    updateLabel('btn-next', t.next);
    updateLabel('btn-table', t.table);

    // Settings labels
    updateLabel('lbl-settings', t.settings);
    updateLabel('lbl-case', t.case);
    updateLabel('lbl-art', t.article);
    updateLabel('lbl-mode', t.mode_label);
    updateLabel('lbl-nom', t.nom);
    updateLabel('lbl-akk', t.akk);
    updateLabel('lbl-dat', t.dat);
    updateLabel('lbl-gen', t.gen);
    updateLabel('lbl-def', t.def);
    updateLabel('lbl-indef', t.indef);
    updateLabel('lbl-none', t.none);
    updateLabel('lbl-mode-adj', t.mode_adj);
    updateLabel('lbl-mode-adj', t.mode_adj);
    updateLabel('lbl-mode-art', t.mode_art);
    updateLabel('lbl-mode-k1', t.k1_mode);


    // Context hint
    if (currentQ && currentQ.context) {
        ui.context.innerText = `(${t[currentQ.context.meaningKey] || currentQ.context.text})`;
    } else if (currentQ && currentQ.mode === 'konjunktiv_i') {
        ui.context.innerText = t.k1_hint;
    }

    const backBtnText = document.querySelector('#btn-home .text');
    if (backBtnText) backBtnText.innerText = t.back_home;

    if (currentQ) {
        const tagDecl = document.getElementById('tag-declension');
        const tagCase = document.getElementById('tag-case');
        if (tagDecl && tagCase) {
            if (currentQ.mode === 'article_drill') {
                tagDecl.innerText = t.mode_art;
                tagCase.innerText = t.nom;
            } else {
                let typeStr = "";
                if (currentQ.artType === ARTICLES.DEF) typeStr = t.weak;
                else if (currentQ.artType === ARTICLES.INDEF) typeStr = t.mixed;
                else typeStr = t.strong;
                tagDecl.innerText = typeStr;
                const caseMap = { [CASES.NOM]: 'nom', [CASES.AKK]: 'akk', [CASES.DAT]: 'dat', [CASES.GEN]: 'gen' };
                tagCase.innerText = t[caseMap[currentQ.caseType]];
            }
        }
    }

    if (document.getElementById('explanation-area').classList.contains('visible')) {
        updateExplanationText(lang);
    }

    updateLabel('btn-download-reward', t.save_bg);
    updateLabel('btn-next-reward', t.next_bg);

    // Update Mic Button if it exists
    const btnMic = document.getElementById('btn-mic');
    if (btnMic) {
        // Only update text if not currently listening (to avoid overwriting "Listening..." state)
        if (!btnMic.classList.contains('listening')) {
            btnMic.innerHTML = '🎤 ' + t.mic_start + ' (Space)';
        }
    }

    // Refresh K1 Sentence if active (to fix localized prompts if lang changes mid-game)
    if (currentQ && currentQ.mode === 'konjunktiv_i') {
        // We can't easily re-render the whole sentence without re-calling render logic, 
        // but we can update static parts like "Du berichtest:" if we wrapped them in spans with IDs.
        // For now, let's just ensure the Hint matches.
        ui.context.innerText = t.k1_hint;

        // Update Tag "Konjunktiv I" if needed
        const tagDecl = document.getElementById('tag-declension');
        if (tagDecl) tagDecl.innerText = t.k1_mode;
    }

    renderReferenceTables();
    updateLabel('modal-title-text', t.modal_title);

    // Update Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const key = btn.dataset.tab; // weak, mixed, strong
        if (t[key]) {
            btn.innerText = t[key];
        }
    });

    document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === lang);
    });
}

function updateLabel(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function setupEventListeners() {
    ui.btnCheck.addEventListener('click', checkAnswer);
    ui.btnNext.addEventListener('click', nextQuestion);

    // Skip Loading Button
    const btnSkip = document.getElementById('btn-skip-loading');
    if (btnSkip) {
        btnSkip.addEventListener('click', () => {
            hideLoading();
            // Also try to cancel current image load if possible or just ignore it
        });
    }

    // Level Slider
    const levelSlider = document.getElementById('level-slider');
    const levelDisplay = document.getElementById('level-display');
    if (levelSlider && levelDisplay) {
        levelSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            levelDisplay.innerText = val;
            level = val;
            levelQCount = 0; // Reset progress in level
            levelCorrect = 0;
            updateStats();
        });
        levelSlider.addEventListener('change', () => {
            // Refresh question on release
            nextQuestion();
        });
    }

    // Modal Close
    document.querySelectorAll('.close-panel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent body click closing immediately?
            const panel = btn.closest('#settings-panel');
            if (panel) panel.classList.remove('active');
        });
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (!btn.dataset.lang) return; // Skip buttons without language data (like settings toggle)
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateLanguage(btn.dataset.lang);
        });
    });

    const btnTable = document.getElementById('btn-table');
    if (btnTable) {
        btnTable.addEventListener('click', (e) => {
            console.log("Opening Grammar Table");
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('modal-table');
            if (modal) {
                renderReferenceTables(); // Refresh content based on current mode!
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

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showTableTab(btn.dataset.tab);
        });
    });

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
    if (closeSettings) {
        closeSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            if (panel) panel.classList.remove('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (panel && panel.classList.contains('active')) {
            if (!panel.contains(e.target) && e.target !== btnToggleSettings) {
                panel.classList.remove('active');
            }
        }
    });

    ui.settings.mode_adj.addEventListener('change', () => { engine.setMode('adjective'); nextQuestion(); });
    ui.settings.mode_art.addEventListener('change', () => { engine.setMode('article_drill'); nextQuestion(); });
    if (ui.settings.mode_k1) ui.settings.mode_k1.addEventListener('change', () => { engine.setMode('konjunktiv_i'); nextQuestion(); });

    // Voice Control
    const btnMic = document.getElementById('btn-mic');
    if (btnMic && recognition) {
        btnMic.classList.remove('hidden');
        btnMic.disabled = true; // Disabled by default
        btnMic.style.opacity = '0.5';
        btnMic.innerHTML = '🎤 Connecting...';

        // Check availability
        checkMicAvailability(btnMic);

        btnMic.addEventListener('mousedown', startListening);
        btnMic.addEventListener('mouseup', stopListening);
        // Touch support
        btnMic.addEventListener('touchstart', (e) => { e.preventDefault(); startListening(); });
        btnMic.addEventListener('touchend', (e) => { e.preventDefault(); stopListening(); });

        recognition.onstart = () => {
            isListening = true;
            updateMicVisuals();
            console.log("Speech Recognition Started");
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            // Visual Feedback
            const btn = document.getElementById('btn-mic');
            if (btn) {
                if (final || interim) {
                    // Show what's being heard (truncated)
                    const display = (final + interim).slice(-15);
                    btn.innerHTML = '👂 ' + display + '...';
                }
            }

            // Logic Check (Only on final or sufficiently long interim?)
            // German Grammar is usually short snippets. 
            // If final result is ready, check it.
            if (final) {
                console.log("Final Heard:", final);
                checkVoiceAnswer(final);
                // Optional: Stop after first sentence for drill mode?
                // stopListening(); 
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            isListening = false;
            updateMicVisuals();

            if (event.error === 'network') {
                showNotification("Network Error (VPN/Web Speech API needed)");
            } else if (event.error === 'not-allowed') {
                showNotification("Microphone Access Denied (Check Settings)");
            } else if (event.error === 'no-speech') {
                // Common, ignore or subtle hint
                // showNotification("No speech detected.");
            } else {
                showNotification("Mic Error: " + event.error);
            }
        };

        recognition.onend = () => {
            isListening = false;
            updateMicVisuals();
            console.log("Speech Recognition Ended");
        };
    }

    // Spacebar to talk
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.repeat && !isListening && currentQ && currentQ.mode === 'konjunktiv_i') {
            const btn = document.getElementById('btn-mic');
            if (btn && !btn.disabled) startListening();
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && isListening) {
            stopListening();
        }
    });
}

function checkMicAvailability(btn) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        btn.innerHTML = '🎤 Mic Not Supported';
        return;
    }

    // Attempt to open channel
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
            // Success
            console.log("Mic Channel Open");
            btn.disabled = false;
            btn.style.opacity = '1';
            updateMicVisuals(); // Will set text to "Push to Talk"

            // EXPERIMENTAL: Keep track open to prevent iOS dropping permission? 
            // Or stop it to free resource?
            // User reported "Cannot record", implying silence. 
            // Let's try keeping it open if it helps connectivity. 
            // Side effect: Red recording pill will stay on. 
            // stream.getTracks().forEach(track => track.stop());  <-- COMMENTED OUT FOR TEST

            // Actually, if we keep it open, SpeechRecognition might fail with "Concurrent".
            // Let's try stopping it with a delay? 
            // Or just verify that we REACHED here.
            stream.getTracks().forEach(track => track.stop()); // Re-enabled stop, but rely on onstart for status.
        })
        .catch(function (err) {
            console.error("Mic Access Error:", err);
            btn.innerHTML = '🎤 Mic Access Denied';
            btn.style.backgroundColor = '#555';
        });
}

function startListening() {
    if (!recognition || isListening) return;
    try {
        recognition.start();
        // isListening = true; // Moved to onstart
        // updateMicVisuals(); // Moved to onstart
    } catch (e) {
        console.error(e);
        showNotification("Mic Start Error: " + e.message);
    }
}

function stopListening() {
    if (!recognition || !isListening) return;
    try {
        recognition.stop();
    } catch (e) {
        console.error("Stop Error:", e);
    }
    // isListening set to false on 'end' event
}

function updateMicVisuals() {
    const btn = document.getElementById('btn-mic');
    // const t = DICT[currentLang]; // Removed dependency for safety or redefine
    if (btn) {
        if (isListening) {
            btn.classList.add('listening');
            btn.innerHTML = '⏹ Stop'; // Clear toggle indicator
            btn.style.backgroundColor = '#cc0000'; // Standard recording red
        } else {
            btn.classList.remove('listening');
            btn.innerHTML = '🎤 Start'; // "Click to Start"
            btn.style.backgroundColor = ''; // Reset
        }
    }
}

function checkVoiceAnswer(text) {
    if (!currentQ || currentQ.mode !== 'konjunktiv_i') return;

    const lowerText = text.toLowerCase();
    const key = currentQ.answerKey.toLowerCase();

    // Check for key word (the Konjunktiv verb)
    if (lowerText.includes(key)) {
        // Success!
        showResult(true, true); // (correct, voiceMode)
        // Explicitly show the full sentence for reinforcement
        ui.sentence.innerHTML += `<div style="color:green; margin-top:10px; font-size:1.3rem;">✅ "Er sagt, er <strong>${currentQ.answerKey}</strong>..."</div>`;
    } else {
        // Failure
        // Diagnostic: Did they use Indikativ?
        let feedback = null;
        if (currentQ.verb.ind_ich !== currentQ.verb.konj_er && lowerText.includes(currentQ.verb.ind_ich.toLowerCase())) {
            feedback = "Don't use Indikativ!";
        } else if (lowerText.includes("ist") && key === "sei") {
            feedback = "No, 'ist' is Indikativ. Use K1!";
        }

        handleK1Failure(feedback, text);
    }
}

function handleK1Failure(feedback, heardText) {
    streak = 0;
    levelCorrect = 0; // Punish slightly or just reset streak?
    updateStats();

    const expArea = document.getElementById('explanation-area');
    if (expArea) {
        expArea.classList.remove('hidden');
        expArea.classList.add('visible');
        expArea.style.display = 'block';
        expArea.innerHTML = `
            <strong>Not quite!</strong><br>
            You said: "<em>${heardText}</em>"<br>
            Expected: "<strong>Er sagt, er ${currentQ.answerKey}...</strong>"<br>
            <span style="color:orange">${feedback || "Remember to use Konjunktiv I!"}</span>
        `;
    }
}

function showResult(correct, isVoice = false) {
    if (correct) {
        streak++;
        levelCorrect++;
        if (streak % 5 === 0) triggerTNTExplosion();
        else spawnDiamondReward();

        if (isVoice) {
            showNotification("Correct! 🎤✨");
            // No auto-advance. Show next button.
            ui.btnCheck.classList.add('hidden');
            ui.btnNext.classList.remove('hidden');
        } else {
            // Standard button logic
            ui.btnCheck.classList.add('hidden');
            ui.btnNext.classList.remove('hidden');
        }
    }
    updateStats();
    saveProgress();
}


function initGame() {
    ui = {
        sentence: document.getElementById('sentence-container'),
        options: document.getElementById('options-grid'),
        context: document.getElementById('context-hint'),
        btnCheck: document.getElementById('btn-check'),
        btnNext: document.getElementById('btn-next'),
        streak: document.getElementById('streak-val'),
        masteryBar: document.getElementById('mastery-bar'),
        settings: {
            nom: document.getElementById('opt-nom'),
            akk: document.getElementById('opt-akk'),
            dat: document.getElementById('opt-dat'),
            gen: document.getElementById('opt-gen'),
            def: document.getElementById('opt-def'),
            indef: document.getElementById('opt-indef'),
            none: document.getElementById('opt-none'),
            mode_adj: document.getElementById('mode-adj'),
            mode_adj: document.getElementById('mode-adj'),
            mode_art: document.getElementById('mode-art'),
            mode_k1: document.getElementById('mode-k1')
        }
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
    renderReferenceTables();
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        initGame();
        // Initial load with loading screen
        showLoading();
        changeRewardImage();
    } catch (e) {
        console.error("Main Init Error:", e);
        const log = document.getElementById('error-log');
        if (log) {
            log.innerText = "Critical Error: " + e.message;
            log.style.display = 'block';
        }
    }
});
