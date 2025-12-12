/**
 * Chinese Stroke Order Training - Main Application
 * 
 * Uses MediaPipe Hands for finger tracking or touch/mouse input
 * to train users on Chinese character stroke order.
 */

import { 
    getCharacterSet, 
    getRandomCharacter, 
    findCharacter, 
    STROKE_NAMES,
    BASIC_CHARS 
} from './stroke-data.js';

// ============================================
// Global State
// ============================================
const state = {
    // App state
    currentScreen: 'loading', // loading, permission, calibration, tutorial, training
    inputMode: 'touch', // 'camera' or 'touch'
    language: 'zh',
    
    // Game settings
    difficulty: 'easy',
    charSet: 'basic',
    timeLimit: 30,
    
    // Current game
    currentChar: null,
    currentStrokeIndex: 0,
    correctStrokes: 0,
    wrongAttempts: 0,
    score: 0,
    timeRemaining: 30,
    timerInterval: null,
    gameActive: false,
    
    // Tutorial state
    tutorialSteps: ['heng', 'shu', 'pie', 'na', 'dian'],
    tutorialStepIndex: 0,
    tutorialCompleted: {},
    tutorialActive: false,
    
    // Tracking
    isDrawing: false,
    currentPath: [],
    lastPoint: null,
    fingerDetected: false,
    fingerTrail: [], // Store recent finger positions for trail effect
    isPinching: false, // Pinch gesture for stroke control
    pinchStarted: false,
    lastPinchState: false,
    pinchConfirmFrames: 0, // Frames to confirm pinch state change
    pinchReleaseFrames: 0, // Frames to confirm release
    pinchCooldownFrames: 0, // Small cooldown after state flip to prevent flapping
    pinchRatioEMA: null, // Smoothed pinch ratio (thumb-index distance / palm size)
    drawingTrail: [], // Persistent trail for current stroke
    handSize: 100, // Estimated hand size for adaptive threshold
    filteredIndexPoint: null, // Smoothed index fingertip in pixels
    
    // MediaPipe
    hands: null,
    camera: null,
    
    // Canvas contexts
    trackingCtx: null,
    writingCtx: null,
    characterCtx: null,
    calibCtx: null,
    tutorialCtx: null,
    
    // Dimensions
    canvasWidth: 0,
    canvasHeight: 0,

    // Fullscreen FX (explosion / shockwave / particles)
    fx: {
        canvas: null,
        ctx: null,
        dpr: 1,
        w: 0,
        h: 0,
        raf: null,
        startTime: 0,
        lastTime: 0,
        origin: { x: 0, y: 0 },
        sparks: [],
        smoke: []
    }
};

// ============================================
// Small math helpers
// ============================================
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

function safeLandmarkDist(a, b) {
    if (!a || !b) return null;
    if (typeof a.x !== 'number' || typeof a.y !== 'number') return null;
    if (typeof b.x !== 'number' || typeof b.y !== 'number') return null;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    return Number.isFinite(d) ? d : null;
}

function avgPoints(points) {
    if (!points || points.length === 0) return null;
    let sx = 0, sy = 0, n = 0;
    for (const p of points) {
        if (!p) continue;
        const x = p[0], y = p[1];
        if (typeof x !== 'number' || typeof y !== 'number') continue;
        sx += x; sy += y; n++;
    }
    if (n === 0) return null;
    return [sx / n, sy / n];
}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

// ============================================
// Translations
// ============================================
const T = {
    zh: {
        loading: '正在初始化...',
        loadingMediaPipe: '正在加载手势识别模型...',
        loadingComplete: '加载完成！',
        permTitle: '需要摄像头权限',
        permDesc: '本应用需要使用摄像头追踪您的手指动作来识别书写笔画。',
        permItem1: '✓ 仅用于手指追踪，不录制视频',
        permItem2: '✓ 所有处理在本地完成',
        permItem3: '✓ 不会上传任何数据',
        grantPerm: '授权摄像头',
        skipCamera: '跳过（使用触屏/鼠标模式）',
        calibTitle: '手指校准',
        calibDesc: '请将您的食指放在摄像头前方，保持稳定。',
        calibStatus: '未检测到手指',
        calibDetected: '✓ 检测到手指！',
        startTraining: '开始训练',
        navBack: '返回',
        appTitle: '笔顺训练',
        lblStrokes: '笔画',
        lblTime: '剩余时间',
        lblScore: '得分',
        strokeHint: '第 {n} 笔：{name}',
        writingHint: '在空中用手指书写笔画',
        writingHintTouch: '用手指或鼠标在屏幕上书写',
        clear: '清除',
        hint: '提示',
        skip: '跳过',
        resultSuccess: '恭喜完成！',
        resultSuccessMsg: '你成功写出了正确的笔顺！',
        resultFail: '时间到！',
        resultFailMsg: '炸弹爆炸了！再试一次吧。',
        resCharLabel: '汉字',
        resTimeLabel: '用时',
        resAccuracyLabel: '准确率',
        retry: '再试一次',
        nextChar: '下一个字',
        settingsTitle: '设置',
        lblDifficulty: '难度',
        diffEasy: '简单',
        diffNormal: '普通',
        diffHard: '困难',
        lblCharSet: '字库',
        charsetBasic: '基础字',
        charsetCommon: '常用字',
        charsetHsk1: 'HSK1',
        lblInputMode: '输入模式',
        inputCamera: '摄像头',
        inputTouch: '触屏/鼠标',
        lblTimer: '时间限制',
        timerOff: '无限',
        charSelectTitle: '选择练习汉字',
        random: '随机选择',
        cameraError: '无法访问摄像头',
        cameraErrorMsg: '请检查摄像头权限设置，或使用触屏/鼠标模式。'
    },
    en: {
        loading: 'Initializing...',
        loadingMediaPipe: 'Loading gesture recognition model...',
        loadingComplete: 'Loading complete!',
        permTitle: 'Camera Permission Required',
        permDesc: 'This app uses the camera to track your finger movements for stroke recognition.',
        permItem1: '✓ Only used for finger tracking, no video recording',
        permItem2: '✓ All processing done locally',
        permItem3: '✓ No data uploaded',
        grantPerm: 'Grant Camera Access',
        skipCamera: 'Skip (Use Touch/Mouse Mode)',
        calibTitle: 'Finger Calibration',
        calibDesc: 'Hold your index finger in front of the camera and keep it steady.',
        calibStatus: 'Finger not detected',
        calibDetected: '✓ Finger detected!',
        startTraining: 'Start Training',
        navBack: 'Back',
        appTitle: 'Stroke Training',
        lblStrokes: 'Strokes',
        lblTime: 'Time Left',
        lblScore: 'Score',
        strokeHint: 'Stroke {n}: {name}',
        writingHint: 'Write stroke in the air with your finger',
        writingHintTouch: 'Write with finger or mouse on screen',
        clear: 'Clear',
        hint: 'Hint',
        skip: 'Skip',
        resultSuccess: 'Congratulations!',
        resultSuccessMsg: 'You completed the correct stroke order!',
        resultFail: 'Time\'s Up!',
        resultFailMsg: 'The bomb exploded! Try again.',
        resCharLabel: 'Character',
        resTimeLabel: 'Time',
        resAccuracyLabel: 'Accuracy',
        retry: 'Try Again',
        nextChar: 'Next Character',
        settingsTitle: 'Settings',
        lblDifficulty: 'Difficulty',
        diffEasy: 'Easy',
        diffNormal: 'Normal',
        diffHard: 'Hard',
        lblCharSet: 'Character Set',
        charsetBasic: 'Basic',
        charsetCommon: 'Common',
        charsetHsk1: 'HSK1',
        lblInputMode: 'Input Mode',
        inputCamera: 'Camera',
        inputTouch: 'Touch/Mouse',
        lblTimer: 'Time Limit',
        timerOff: 'Unlimited',
        charSelectTitle: 'Select Character',
        random: 'Random',
        cameraError: 'Camera Access Failed',
        cameraErrorMsg: 'Please check camera permissions or use touch/mouse mode.'
    }
};

function t(key) {
    return T[state.language][key] || T.en[key] || key;
}

// ============================================
// DOM Elements
// ============================================
let elements = {};

function initElements() {
    elements = {
        // Screens
        loadingScreen: document.getElementById('loading-screen'),
        permissionScreen: document.getElementById('permission-screen'),
        calibrationScreen: document.getElementById('calibration-screen'),
        tutorialScreen: document.getElementById('tutorial-screen'),
        trainingScreen: document.getElementById('training-screen'),
        
        // Loading
        loadingProgress: document.querySelector('.loading-progress'),
        loadingStatus: document.querySelector('.loading-status'),
        
        // Permission
        btnGrantPerm: document.getElementById('btn-grant-permission'),
        btnSkipCamera: document.getElementById('btn-skip-camera'),
        
        // Calibration
        calibVideo: document.getElementById('calib-video'),
        calibCanvas: document.getElementById('calib-canvas'),
        fingerDetected: document.getElementById('finger-detected'),
        calibStatusText: document.getElementById('calib-status-text'),
        btnStartTraining: document.getElementById('btn-start-training'),
        
        // Tutorial
        tutorialVideo: document.getElementById('tutorial-video'),
        tutorialCanvas: document.getElementById('tutorial-canvas'),
        tutorialStrokeName: document.getElementById('tutorial-stroke-name'),
        tutorialDirection: document.getElementById('tutorial-direction'),
        tutorialHint: document.getElementById('tutorial-hint'),
        tutorialFeedback: document.getElementById('tutorial-feedback'),
        strokeArrow: document.getElementById('stroke-arrow'),
        guideLine: document.getElementById('guide-line'),
        btnClearTutorial: document.getElementById('btn-clear-tutorial'),
        btnSkipTutorial: document.getElementById('btn-skip-tutorial'),
        progressSteps: document.querySelectorAll('.progress-step'),
        
        // Training
        cameraVideo: document.getElementById('camera-video'),
        trackingCanvas: document.getElementById('tracking-canvas'),
        writingCanvas: document.getElementById('writing-canvas'),
        characterCanvas: document.getElementById('character-canvas'),
        
        // Game info
        targetCharacter: document.getElementById('target-character'),
        traceCharacter: document.getElementById('trace-character'),
        strokeGuideCanvas: document.getElementById('stroke-guide-canvas'),
        strokeHint: document.getElementById('stroke-hint'),
        strokesDone: document.getElementById('strokes-done'),
        strokesTotal: document.getElementById('strokes-total'),
        timeRemaining: document.getElementById('time-remaining'),
        scoreValue: document.getElementById('score-value'),
        writingHint: document.getElementById('writing-hint'),
        correctMark: document.getElementById('correct-mark'),
        dangerText: document.getElementById('danger-text'),
        fuseLine: document.getElementById('fuse-line'),
        bombContainer: document.getElementById('bomb-container'),
        
        // Animation
        bucket: document.getElementById('bucket'),
        water: document.getElementById('water'),
        waterDrops: document.getElementById('water-drops'),
        bomb: document.getElementById('bomb'),
        fuse: document.getElementById('fuse'),
        spark: document.getElementById('spark'),
        explosion: document.getElementById('explosion'),
        fxCanvas: document.getElementById('fx-canvas'),
        tiltBar: document.getElementById('tilt-bar'),
        wrongMark: document.getElementById('wrong-mark'),
        
        // Controls
        btnClear: document.getElementById('btn-clear'),
        btnHint: document.getElementById('btn-hint'),
        btnSkip: document.getElementById('btn-skip'),
        btnSettings: document.getElementById('btn-settings'),
        
        // Modals
        resultModal: document.getElementById('result-modal'),
        resultIcon: document.getElementById('result-icon'),
        resultTitle: document.getElementById('result-title'),
        resultMessage: document.getElementById('result-message'),
        resCharacter: document.getElementById('res-character'),
        resTime: document.getElementById('res-time'),
        resAccuracy: document.getElementById('res-accuracy'),
        btnRetry: document.getElementById('btn-retry'),
        btnNextChar: document.getElementById('btn-next-char'),
        
        settingsModal: document.getElementById('settings-modal'),
        closeSettings: document.getElementById('close-settings'),
        
        charSelectModal: document.getElementById('char-select-modal'),
        charGrid: document.getElementById('char-grid'),
        btnRandomChar: document.getElementById('btn-random-char'),
        closeCharSelect: document.getElementById('close-char-select'),
        
        // Language
        langBtns: document.querySelectorAll('.lang-btn')
    };
}

// ============================================
// Initialization
// ============================================
async function init() {
    initElements();
    updateLoadingProgress(10, t('loading'));
    
    // Setup event listeners
    setupEventListeners();
    
    // Load MediaPipe (but don't require it)
    updateLoadingProgress(30, t('loadingMediaPipe'));
    
    try {
        await loadMediaPipe();
        updateLoadingProgress(80, t('loadingComplete'));
    } catch (e) {
        console.warn('MediaPipe failed to load, using touch mode:', e);
    }
    
    // Initialize canvases
    initCanvases();
    
    updateLoadingProgress(100, t('loadingComplete'));
    
    // Short delay then show permission screen
    setTimeout(() => {
        showScreen('permission');
    }, 500);
}

function updateLoadingProgress(percent, status) {
    if (elements.loadingProgress) {
        elements.loadingProgress.style.width = percent + '%';
    }
    if (elements.loadingStatus) {
        elements.loadingStatus.textContent = status;
    }
}

// ============================================
// MediaPipe Setup
// ============================================
async function loadMediaPipe() {
    return new Promise((resolve, reject) => {
        // Check if Hands is available
        if (typeof Hands === 'undefined') {
            reject(new Error('MediaPipe Hands not loaded'));
            return;
        }
        
        state.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        state.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0, // Faster model
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        state.hands.onResults(onHandResults);
        
        // Initialize
        state.hands.initialize().then(resolve).catch(reject);
    });
}

function onHandResults(results) {
    // Get the active canvas context based on current screen
    let ctx = state.trackingCtx;
    let writingCtx = state.writingCtx;
    let canvas = elements.trackingCanvas;
    let width = state.canvasWidth || 640;
    let height = state.canvasHeight || 480;
    
    // For tutorial screen, use tutorial canvas
    if (state.currentScreen === 'tutorial' && state.tutorialCtx) {
        ctx = state.tutorialCtx;
        writingCtx = state.tutorialCtx;
        canvas = elements.tutorialCanvas;
        if (canvas) {
            width = canvas.width || 640;
            height = canvas.height || 480;
        }
    }
    
    // Ensure valid dimensions
    if (width <= 0) width = 640;
    if (height <= 0) height = 480;
    
    // Clear tracking canvas (but not writing canvas - that keeps the strokes)
    if (ctx) {
        try {
            ctx.clearRect(0, 0, width, height);
        } catch (e) {
            // Ignore clear errors
        }
    }
    
    if (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Safety check for landmarks
        if (!landmarks || !landmarks[8] || !landmarks[4]) {
            return;
        }
        
        // Get finger tips
        const indexTip = landmarks[8];   // Index finger tip
        const thumbTip = landmarks[4];   // Thumb tip
        const indexMcp = landmarks[5];   // Index finger base
        const indexPip = landmarks[6];   // Index finger middle joint
        
        // Validate coordinates
        if (typeof indexTip.x !== 'number' || typeof indexTip.y !== 'number') {
            return;
        }
        
        // Raw fingertip position (mirrored)
        const rawX = (1 - indexTip.x) * width;
        const rawY = indexTip.y * height;
        
        // Smooth fingertip position to reduce jitter (helps both drawing + stroke classification)
        const POS_ALPHA = 0.45; // higher = more responsive; lower = smoother
        if (!state.filteredIndexPoint) {
            state.filteredIndexPoint = { x: rawX, y: rawY };
        } else {
            state.filteredIndexPoint.x += POS_ALPHA * (rawX - state.filteredIndexPoint.x);
            state.filteredIndexPoint.y += POS_ALPHA * (rawY - state.filteredIndexPoint.y);
        }
        const x = state.filteredIndexPoint.x;
        const y = state.filteredIndexPoint.y;
        
        // Update finger detection state
        state.fingerDetected = true;
        updateCalibrationStatus(true);
        
        // ===== STABLE PINCH DETECTION (LESS FALSE POSITIVES) =====
        // Use hand-relative scale: (thumb-index distance) / (palm width)
        // This is more stable than using the whole screen size.
        const pinchDistanceNorm = safeLandmarkDist(thumbTip, indexTip) ?? 1;
        const palmWidthNorm =
            safeLandmarkDist(landmarks[5], landmarks[17]) ?? // index MCP to pinky MCP
            safeLandmarkDist(landmarks[0], landmarks[9]) ??  // wrist to middle MCP
            0.25;
        
        let pinchRatio = pinchDistanceNorm / Math.max(palmWidthNorm, 1e-6);
        pinchRatio = clamp(pinchRatio, 0, 2);
        
        // Smooth ratio over time to avoid flicker
        const RATIO_ALPHA = 0.35;
        if (typeof state.pinchRatioEMA === 'number') {
            state.pinchRatioEMA += RATIO_ALPHA * (pinchRatio - state.pinchRatioEMA);
        } else {
            state.pinchRatioEMA = pinchRatio;
        }
        
        // Hysteresis thresholds (ratio)
        // Smaller ratio = fingers closer.
        const ENTER_RATIO = 0.28; // start drawing when below this
        const EXIT_RATIO  = 0.36; // stop drawing when above this
        
        // Determine desired (raw) pinch based on current stable state
        let desiredPinch = state.isPinching
            ? (state.pinchRatioEMA < EXIT_RATIO)
            : (state.pinchRatioEMA < ENTER_RATIO);
        
        // Cooldown to prevent rapid toggles
        if (state.pinchCooldownFrames > 0) {
            state.pinchCooldownFrames--;
            desiredPinch = state.isPinching;
        }
        
        // Frame confirmation (debounce)
        const CONFIRM_ON_FRAMES = 2;
        const CONFIRM_OFF_FRAMES = 3;
        if (desiredPinch === state.isPinching) {
            state.pinchConfirmFrames = 0;
            state.pinchReleaseFrames = 0;
        } else if (desiredPinch) {
            state.pinchConfirmFrames++;
            state.pinchReleaseFrames = 0;
            if (state.pinchConfirmFrames >= CONFIRM_ON_FRAMES) {
                state.isPinching = true;
                state.pinchConfirmFrames = 0;
                state.pinchCooldownFrames = 2;
            }
        } else {
            state.pinchReleaseFrames++;
            state.pinchConfirmFrames = 0;
            if (state.pinchReleaseFrames >= CONFIRM_OFF_FRAMES) {
                state.isPinching = false;
                state.pinchReleaseFrames = 0;
                state.pinchCooldownFrames = 2;
            }
        }
        
        const isPinching = state.isPinching;
        
        // Calculate pixel distance for display
        const thumbX = (1 - thumbTip.x) * width;
        const thumbY = thumbTip.y * height;
        const pinchDistancePx = dist2(rawX, rawY, thumbX, thumbY);
        
        // Debug info
        if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(5, 5, 220, 70);
            
            ctx.fillStyle = isPinching ? '#2ecc71' : '#e74c3c';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(isPinching ? '✏️ 书写中' : '✋ 松开', 15, 30);
            
            // Show distance value
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText(`比值(平滑): ${(state.pinchRatioEMA * 100).toFixed(1)}%`, 15, 50);
            ctx.fillText(`阈值: 入<${(ENTER_RATIO * 100).toFixed(0)}% 出<${(EXIT_RATIO * 100).toFixed(0)}%`, 15, 65);
        }
        
        // ===== DRAWING STATE MACHINE =====
        const shouldDraw = isPinching;
        
        // Add to finger trail (always, for visual feedback)
        if (!isNaN(x) && !isNaN(y)) {
            state.fingerTrail.push({ x, y, time: Date.now(), isPinching });
            if (state.fingerTrail.length > 80) {
                state.fingerTrail.shift();
            }
        }
        
        // Draw hand skeleton and finger trail on tracking canvas
        if (ctx) {
            try {
                drawHandLandmarks(landmarks, ctx, width, height);
                drawFingerTrail(ctx, isPinching);
            } catch (e) {
                console.warn('Draw error:', e);
            }
        }
        
        // Handle drawing based on current screen
        if (state.inputMode === 'camera') {
            // Detect pinch start/end transitions
            const pinchJustStarted = isPinching && !state.lastPinchState;
            const pinchJustEnded = !isPinching && state.lastPinchState;
            state.lastPinchState = isPinching;
            
            if (state.tutorialActive && state.currentScreen === 'tutorial') {
                if (pinchJustStarted) {
                    startTutorialDrawing(x, y);
                } else if (isPinching && state.isDrawing) {
                    continueTutorialDrawing(x, y);
                    // Also draw on the persistent canvas
                    drawPersistentTrail(writingCtx, x, y);
                } else if (pinchJustEnded) {
                    handleTutorialFingerUp();
                }
            } else if (state.gameActive && state.currentScreen === 'training') {
                if (pinchJustStarted) {
                    startDrawing(x, y);
                } else if (isPinching && state.isDrawing) {
                    continueDrawing(x, y);
                    // Also draw on the persistent canvas
                    drawPersistentTrail(writingCtx, x, y);
                } else if (pinchJustEnded) {
                    endDrawing();
                }
            }
        }
    } else {
        state.fingerDetected = false;
        updateCalibrationStatus(false);
        
        // Clear trail when no finger detected
        state.fingerTrail = [];
        state.lastPinchState = false;
        state.isPinching = false;
        state.pinchConfirmFrames = 0;
        state.pinchReleaseFrames = 0;
        
        if (state.inputMode === 'camera') {
            if (state.tutorialActive && state.isDrawing) {
                handleTutorialFingerUp();
            } else if (state.gameActive && state.isDrawing) {
                endDrawing();
            }
        }
    }
}

// Draw persistent stroke trail on writing canvas
function drawPersistentTrail(ctx, x, y) {
    if (!ctx || !state.lastPoint) return;
    
    try {
        // Draw the stroke with ink effect
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        
        ctx.beginPath();
        ctx.moveTo(state.lastPoint.x, state.lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Add glow effect
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 208, 63, 0.4)';
        ctx.lineWidth = 18;
        ctx.shadowColor = 'rgba(244, 208, 63, 0.6)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(state.lastPoint.x, state.lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
    } catch (e) {
        // Ignore errors
    }
}

function drawHandLandmarks(landmarks, ctx, width, height) {
    if (!ctx) {
        ctx = state.trackingCtx;
        width = state.canvasWidth;
        height = state.canvasHeight;
    }
    
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.5)';
    ctx.lineWidth = 2;
    
    // Draw connections
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Palm
    ];
    
    connections.forEach(([i, j]) => {
        const start = landmarks[i];
        const end = landmarks[j];
        ctx.beginPath();
        ctx.moveTo((1 - start.x) * width, start.y * height);
        ctx.lineTo((1 - end.x) * width, end.y * height);
        ctx.stroke();
    });
    
    // Highlight index finger tip with glow effect
    const indexTip = landmarks[8];
    const tipX = (1 - indexTip.x) * width;
    const tipY = indexTip.y * height;
    
    // Outer glow
    ctx.fillStyle = 'rgba(244, 208, 63, 0.3)';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle glow
    ctx.fillStyle = 'rgba(244, 208, 63, 0.6)';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner bright point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawFingerTrail(ctx, isPinching = false) {
    if (!ctx || !state.fingerTrail || state.fingerTrail.length < 2) return;
    
    const now = Date.now();
    
    // Draw trail with fading effect
    for (let i = 1; i < state.fingerTrail.length; i++) {
        const prev = state.fingerTrail[i - 1];
        const curr = state.fingerTrail[i];
        
        // Safety check
        if (!prev || !curr || typeof prev.x !== 'number' || typeof curr.x !== 'number') continue;
        
        const age = now - curr.time;
        const alpha = Math.max(0, 1 - age / 1000); // Fade over 1 second
        
        // Skip if too old
        if (alpha <= 0) continue;
        
        // Different color based on pinching state - red when drawing, gold when not
        const color = curr.isPinching ? '231, 76, 60' : '244, 208, 63'; // Red or Gold
        
        // Draw segment with gradient
        try {
            const gradient = ctx.createLinearGradient(prev.x, prev.y, curr.x, curr.y);
            gradient.addColorStop(0, `rgba(${color}, ${alpha * 0.3})`);
            gradient.addColorStop(1, `rgba(${color}, ${alpha * 0.8})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = curr.isPinching ? 14 : 8 + (i / state.fingerTrail.length) * 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        } catch (e) {
            // Ignore gradient errors
        }
    }
    
    // Draw cursor at current position
    if (state.fingerTrail.length > 0) {
        const last = state.fingerTrail[state.fingerTrail.length - 1];
        
        // Safety check
        if (last && typeof last.x === 'number') {
            // Draw cursor - different style when pinching
            if (isPinching) {
                // Active drawing cursor - red pulsing circle
                ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
                ctx.beginPath();
                ctx.arc(last.x, last.y, 20, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(last.x, last.y, 20, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner dot
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Idle cursor - gold circle
                ctx.fillStyle = 'rgba(244, 208, 63, 0.6)';
                ctx.beginPath();
                ctx.arc(last.x, last.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(last.x, last.y, 15, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Add shimmer particles occasionally
            if (Math.random() > 0.7) {
                ctx.fillStyle = isPinching ? 'rgba(255, 100, 100, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                const offsetX = (Math.random() - 0.5) * 30;
                const offsetY = (Math.random() - 0.5) * 30;
                ctx.beginPath();
                ctx.arc(last.x + offsetX, last.y + offsetY, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// ============================================
// Camera Setup
// ============================================
async function setupCamera(videoElement) {
    try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        const constraints = {
            video: {
                facingMode: isMobile ? 'user' : 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        
        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve(stream);
            };
        });
    } catch (error) {
        console.error('Camera setup failed:', error);
        throw error;
    }
}

async function startCameraTracking() {
    if (!state.hands) {
        console.warn('MediaPipe not available');
        return;
    }
    
    const video = elements.cameraVideo;
    
    if (typeof Camera !== 'undefined') {
        state.camera = new Camera(video, {
            onFrame: async () => {
                await state.hands.send({ image: video });
            },
            width: 640,
            height: 480
        });
        state.camera.start();
    }
}

function stopCameraTracking() {
    if (state.camera) {
        state.camera.stop();
        state.camera = null;
    }
}

// ============================================
// Canvas Setup
// ============================================
function initCanvases() {
    // Calibration canvas
    if (elements.calibCanvas) {
        state.calibCtx = elements.calibCanvas.getContext('2d');
    }
    
    // Training canvases
    if (elements.trackingCanvas) {
        state.trackingCtx = elements.trackingCanvas.getContext('2d');
    }
    
    if (elements.writingCanvas) {
        state.writingCtx = elements.writingCanvas.getContext('2d');
        setupWritingCanvas();
    }
    
    if (elements.characterCanvas) {
        state.characterCtx = elements.characterCanvas.getContext('2d');
    }

    // Fullscreen FX canvas
    initFxCanvas();
}

function initFxCanvas() {
    const canvas = elements.fxCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    state.fx.canvas = canvas;
    state.fx.ctx = ctx;

    const resize = () => {
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        state.fx.dpr = dpr;
        state.fx.w = Math.floor(window.innerWidth);
        state.fx.h = Math.floor(window.innerHeight);
        canvas.width = Math.floor(state.fx.w * dpr);
        canvas.height = Math.floor(state.fx.h * dpr);
        canvas.style.width = state.fx.w + 'px';
        canvas.style.height = state.fx.h + 'px';
        if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, state.fx.w, state.fx.h);
        }
    };

    resize();
    window.addEventListener('resize', resize);
}

function playExplosionSfx() {
    // Best-effort: some browsers block audio until user interaction.
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ac = new AudioCtx();
        const now = ac.currentTime;

        // Rumble
        const osc = ac.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.35);
        const rumbleGain = ac.createGain();
        rumbleGain.gain.setValueAtTime(0.0001, now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
        rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(rumbleGain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.65);

        // Noise burst (spark / crack)
        const noiseLen = Math.floor(ac.sampleRate * 0.25);
        const buffer = ac.createBuffer(1, noiseLen, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
            const t = i / noiseLen;
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
        }
        const noise = ac.createBufferSource();
        noise.buffer = buffer;
        const hp = ac.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(800, now);
        const noiseGain = ac.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.45, now + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        noise.connect(hp).connect(noiseGain).connect(ac.destination);
        noise.start(now);
        noise.stop(now + 0.25);

        setTimeout(() => {
            ac.close().catch(() => {});
        }, 1200);
    } catch (e) {
        // ignore
    }
}

function playExtinguishSfx() {
    // Hiss / steam: filtered noise + quick decay
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ac = new AudioCtx();
        const now = ac.currentTime;

        const noiseLen = Math.floor(ac.sampleRate * 0.5);
        const buffer = ac.createBuffer(1, noiseLen, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
            const t = i / noiseLen;
            // "steam" = softer noise, decays
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * 0.8;
        }
        const src = ac.createBufferSource();
        src.buffer = buffer;

        const lp = ac.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1400, now);
        lp.frequency.exponentialRampToValueAtTime(500, now + 0.45);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        src.connect(lp).connect(gain).connect(ac.destination);
        src.start(now);
        src.stop(now + 0.5);

        setTimeout(() => {
            ac.close().catch(() => {});
        }, 900);
    } catch (e) {
        // ignore
    }
}

function startExplosionFx(screenX, screenY) {
    const fx = state.fx;
    if (!fx.canvas || !fx.ctx) return;

    fx.canvas.classList.add('active');
    fx.origin.x = screenX;
    fx.origin.y = screenY;
    fx.startTime = performance.now();
    fx.lastTime = fx.startTime;
    fx.sparks = [];
    fx.smoke = [];

    // Sparks
    const sparkCount = 160;
    for (let i = 0; i < sparkCount; i++) {
        const ang = rand(0, Math.PI * 2);
        const spd = rand(520, 980);
        fx.sparks.push({
            x: screenX + rand(-6, 6),
            y: screenY + rand(-6, 6),
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - rand(0, 180),
            life: rand(0.25, 0.75),
            age: 0,
            w: rand(1.0, 2.6),
            hue: rand(22, 48)
        });
    }

    // Smoke
    const smokeCount = 70;
    for (let i = 0; i < smokeCount; i++) {
        fx.smoke.push({
            x: screenX + rand(-30, 30),
            y: screenY + rand(-20, 20),
            vx: rand(-60, 60),
            vy: rand(-220, -80),
            life: rand(1.3, 2.6),
            age: 0,
            r: rand(18, 60),
            a: rand(0.25, 0.45)
        });
    }

    const ctx = fx.ctx;

    const draw = (t) => {
        const dt = Math.min(0.033, Math.max(0.001, (t - fx.lastTime) / 1000));
        fx.lastTime = t;
        const p = (t - fx.startTime) / 1000;

        // Fade previous frame slightly (motion blur)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.fillRect(0, 0, fx.w, fx.h);

        // Initial flash
        if (p < 0.12) {
            const a = 1 - (p / 0.12);
            const g = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 360);
            g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
            g.addColorStop(0.18, `rgba(255,210,120,${0.75 * a})`);
            g.addColorStop(0.5, `rgba(255,80,20,${0.25 * a})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, fx.w, fx.h);
        }

        // Shockwave ring
        const ringT = clamp((p - 0.03) / 0.75, 0, 1);
        if (ringT > 0 && ringT < 1) {
            const r = ringT * 620;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(255,200,120,${0.35 * (1 - ringT)})`;
            ctx.lineWidth = 10 * (1 - ringT) + 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Sparks
        ctx.globalCompositeOperation = 'lighter';
        for (const s of fx.sparks) {
            s.age += dt;
            if (s.age > s.life) continue;
            s.vx *= 0.985;
            s.vy = s.vy * 0.985 + 980 * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;

            const k = 1 - (s.age / s.life);
            const a = 0.75 * k;
            ctx.strokeStyle = `hsla(${s.hue}, 100%, 60%, ${a})`;
            ctx.lineWidth = s.w;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * dt * 0.06, s.y - s.vy * dt * 0.06);
            ctx.stroke();
        }

        // Smoke
        ctx.globalCompositeOperation = 'source-over';
        for (const m of fx.smoke) {
            m.age += dt;
            if (m.age > m.life) continue;
            m.vx *= 0.99;
            m.vy *= 0.99;
            m.x += m.vx * dt;
            m.y += m.vy * dt;

            const k = 1 - (m.age / m.life);
            const r = m.r * (1 + (1 - k) * 1.6);
            const a = m.a * k;
            const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
            g.addColorStop(0, `rgba(40,40,40,${a})`);
            g.addColorStop(0.6, `rgba(20,20,20,${a * 0.6})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        if (p > 2.6) {
            fx.canvas.classList.remove('active');
            ctx.clearRect(0, 0, fx.w, fx.h);
            fx.raf = null;
            return;
        }

        fx.raf = requestAnimationFrame(draw);
    };

    if (fx.raf) cancelAnimationFrame(fx.raf);
    fx.raf = requestAnimationFrame(draw);
}

function setupWritingCanvas() {
    const canvas = elements.writingCanvas;
    const container = canvas.parentElement;
    
    // Match container size
    const updateSize = () => {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        state.canvasWidth = rect.width;
        state.canvasHeight = rect.height;
        
        // Also update tracking canvas
        if (elements.trackingCanvas) {
            elements.trackingCanvas.width = rect.width;
            elements.trackingCanvas.height = rect.height;
        }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Touch/mouse events for writing
    canvas.addEventListener('mousedown', handlePointerStart);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerEnd);
    canvas.addEventListener('mouseleave', handlePointerEnd);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
}

// ============================================
// Input Handlers
// ============================================
function handlePointerStart(e) {
    if (state.inputMode !== 'touch' || !state.gameActive) return;
    
    e.preventDefault();
    const rect = elements.writingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    startDrawing(x, y);
}

function handlePointerMove(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    
    const rect = elements.writingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    continueDrawing(x, y);
}

function handlePointerEnd(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    endDrawing();
}

function handleTouchStart(e) {
    if (state.inputMode !== 'touch' || !state.gameActive) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = elements.writingCanvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    startDrawing(x, y);
}

function handleTouchMove(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = elements.writingCanvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    continueDrawing(x, y);
}

function handleTouchEnd(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    endDrawing();
}

// Camera finger tracking handlers
function handleFingerMove(x, y) {
    if (!state.isDrawing) {
        startDrawing(x, y);
    } else {
        continueDrawing(x, y);
    }
}

function handleFingerUp() {
    if (state.isDrawing) {
        endDrawing();
    }
}

// ============================================
// Drawing Logic
// ============================================
function startDrawing(x, y) {
    state.isDrawing = true;
    state.currentPath = [[x, y]];
    state.lastPoint = { x, y };
    
    // Start drawing on canvas with ink brush effect
    const ctx = state.writingCtx;
    
    // Create gradient for brush stroke
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Draw start point indicator
    ctx.fillStyle = 'rgba(244, 208, 63, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
}

function continueDrawing(x, y) {
    if (!state.isDrawing) return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    
    // Debounce sampling: only add a point if the finger moved enough
    const MIN_POINT_DIST = 4; // px
    if (state.lastPoint) {
        const dx = x - state.lastPoint.x;
        const dy = y - state.lastPoint.y;
        if ((dx * dx + dy * dy) < (MIN_POINT_DIST * MIN_POINT_DIST)) {
            return;
        }
    }
    
    state.currentPath.push([x, y]);
    
    // Draw line with brush effect
    const ctx = state.writingCtx;
    
    // Main stroke
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 12;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Add glow effect on top
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.3)';
    ctx.lineWidth = 20;
    ctx.shadowColor = 'rgba(244, 208, 63, 0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(state.lastPoint.x, state.lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    
    state.lastPoint = { x, y };
}

function endDrawing() {
    if (!state.isDrawing || state.currentPath.length < 5) {
        state.isDrawing = false;
        state.currentPath = [];
        return;
    }
    
    state.isDrawing = false;
    
    // Analyze the stroke
    analyzeStroke(state.currentPath);
    
    state.currentPath = [];
}

function clearWritingCanvas() {
    if (state.writingCtx) {
        state.writingCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    }
    state.currentPath = [];
}

// ============================================
// Stroke Analysis
// ============================================
function analyzeStroke(path) {
    if (!state.currentChar || state.currentStrokeIndex >= state.currentChar.strokes.length) {
        return;
    }
    
    const expectedStroke = state.currentChar.strokes[state.currentStrokeIndex];
    
    // Get stroke characteristics
    const strokeInfo = analyzeStrokeCharacteristics(path);
    
    // Debug log
    console.log('Stroke analysis:', {
        expected: expectedStroke.type,
        direction: strokeInfo.direction,
        angle: strokeInfo.angle,
        aspectRatio: strokeInfo.aspectRatio,
        length: strokeInfo.length
    });
    
    // Check if stroke matches expected type
    const isCorrect = matchStrokeType(strokeInfo, expectedStroke);
    
    if (isCorrect) {
        handleCorrectStroke();
    } else {
        handleWrongStroke();
    }
    
    // Clear canvas for next stroke
    setTimeout(clearWritingCanvas, 300);
}

function analyzeStrokeCharacteristics(path) {
    if (path.length < 2) {
        return { direction: [0, 0], angle: 0, aspectRatio: 1, length: 0 };
    }
    
    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    path.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const aspectRatio = width / (height || 1);
    
    // Calculate direction from averaged start/end segments (more robust than single points)
    const n = path.length;
    const k = clamp(Math.floor(n * 0.15), 1, 8); // first/last ~15% (cap to avoid over-smoothing)
    const start = avgPoints(path.slice(0, k)) || path[0];
    const end = avgPoints(path.slice(n - k)) || path[n - 1];
    
    let dx = end[0] - start[0];
    let dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction
    if (length > 0) {
        dx /= length;
        dy /= length;
    }
    
    // Calculate angle in degrees (-180 to 180)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return {
        direction: [dx, dy],
        angle: angle,
        aspectRatio: aspectRatio,
        length: length,
        width: width,
        height: height,
        startX: start[0],
        startY: start[1],
        endX: end[0],
        endY: end[1]
    };
}

function matchStrokeType(strokeInfo, expectedStroke) {
    const type = expectedStroke.type;
    const length = strokeInfo.length;
    
    // Minimum stroke length
    if (length < 15) {
        console.log('笔画太短:', length);
        return false;
    }
    
    // Get start and end points (use raw coordinates, not normalized)
    const dx = strokeInfo.endX - strokeInfo.startX;  // Positive = right, Negative = left
    const dy = strokeInfo.endY - strokeInfo.startY;  // Positive = down, Negative = up
    
    // Calculate which direction dominates
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const isHorizontal = absDx > absDy;  // More horizontal than vertical
    const isVertical = absDy > absDx;    // More vertical than horizontal
    
    const goingRight = dx > 0;
    const goingLeft = dx < 0;
    const goingDown = dy > 0;
    const goingUp = dy < 0;
    
    console.log('笔画分析:', { 
        type, 
        dx: dx.toFixed(0), 
        dy: dy.toFixed(0), 
        isHorizontal, 
        isVertical,
        goingRight,
        goingDown,
        length: length.toFixed(0)
    });
    
    // SIMPLE direction-based matching
    switch (type) {
        case 'heng': // 横 - Horizontal (left to right OR right to left)
            // Just needs to be mostly horizontal
            const hengPass = isHorizontal || absDx > 30;
            console.log('横 判断:', hengPass ? '✓' : '✗');
            return hengPass;
            
        case 'shu': // 竖 - Vertical (top to bottom)
            // Mostly vertical AND going down
            const shuPass = (isVertical || absDy > 30) && goingDown;
            console.log('竖 判断:', shuPass ? '✓' : '✗');
            return shuPass;
            
        case 'pie': // 撇 - Left-falling (top-right to bottom-left)
            // Going down AND going left
            const piePass = goingDown && goingLeft;
            console.log('撇 判断:', piePass ? '✓' : '✗');
            return piePass;
            
        case 'na': // 捺 - Right-falling (top-left to bottom-right)
            // Going down AND going right
            const naPass = goingDown && goingRight;
            console.log('捺 判断:', naPass ? '✓' : '✗');
            return naPass;
            
        case 'dian': // 点 - Dot (short stroke, usually downward)
            // Short stroke, any direction mostly downward
            const dianPass = length < 100 || goingDown;
            console.log('点 判断:', dianPass ? '✓' : '✗');
            return dianPass;
            
        case 'ti': // 提 - Rising stroke (bottom-left to top-right)
            // Going up AND going right
            const tiPass = goingUp && goingRight;
            console.log('提 判断:', tiPass ? '✓' : '✗');
            return tiPass;
            
        case 'hengzhe': // 横折
        case 'hengzhegou': // 横折钩
        case 'shuzhe': // 竖折
        case 'shugou': // 竖钩
        case 'wangou': // 弯钩
        case 'hengpie': // 横撇
        case 'piedian': // 撇点
            // Complex strokes - accept if reasonable length
            console.log('复杂笔画 - 自动通过');
            return true;
            
        default:
            console.log('未知笔画类型 - 自动通过');
            return true;
    }
}

function detectTurningPoint(strokeInfo) {
    // Simple heuristic: if both width and height are significant, 
    // there's likely a turn
    return strokeInfo.width > 30 && strokeInfo.height > 30;
}

function normalizePath(path) {
    if (path.length === 0) return [];
    
    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    path.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });
    
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    
    // Normalize to 0-1
    return path.map(([x, y]) => [
        (x - minX) / width,
        (y - minY) / height
    ]);
}

function calculateDirection(path) {
    if (path.length < 2) return [0, 0];
    
    const start = path[0];
    const end = path[path.length - 1];
    
    let dx = end[0] - start[0];
    let dy = end[1] - start[1];
    
    // Normalize
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= length;
    dy /= length;
    
    return [dx, dy];
}

// ============================================
// Game Logic
// ============================================
function handleCorrectStroke() {
    state.correctStrokes++;
    state.currentStrokeIndex++;
    state.score += 10 * getDifficultyMultiplier();
    
    // Show correct mark
    showCorrectMark();
    
    // Update UI
    updateGameUI();
    updateBucketTilt();
    
    // Flash feedback
    flashFeedback(true);
    
    // Redraw stroke guide for next stroke
    setTimeout(() => {
        drawStrokeGuide();
    }, 300);
    
    // Check if character is complete
    if (state.currentStrokeIndex >= state.currentChar.strokes.length) {
        handleCharacterComplete();
    }
}

function showCorrectMark() {
    if (!elements.correctMark) return;
    
    elements.correctMark.classList.remove('hidden');
    
    setTimeout(() => {
        elements.correctMark.classList.add('hidden');
    }, 600);
}

function handleWrongStroke() {
    state.wrongAttempts++;
    
    // Show wrong mark
    showWrongMark();
    
    // Flash feedback
    flashFeedback(false);
}

function handleCharacterComplete() {
    state.gameActive = false;
    clearInterval(state.timerInterval);
    
    // Pour water animation
    pourWater();
    
    // Show success result after animation
    setTimeout(() => {
        showResult(true);
    }, 1500);
}

function handleTimeUp() {
    state.gameActive = false;
    clearInterval(state.timerInterval);
    
    // Explode bomb
    explodeBomb();
    
    // Show failure result
    setTimeout(() => {
        showResult(false);
    }, 1500);
}

function getDifficultyMultiplier() {
    switch (state.difficulty) {
        case 'hard': return 2;
        case 'normal': return 1.5;
        default: return 1;
    }
}

// ============================================
// UI Updates
// ============================================
function updateGameUI() {
    if (elements.strokesDone) {
        elements.strokesDone.textContent = state.currentStrokeIndex;
    }
    if (elements.strokesTotal) {
        elements.strokesTotal.textContent = state.currentChar ? state.currentChar.strokeCount : 0;
    }
    if (elements.scoreValue) {
        elements.scoreValue.textContent = state.score;
    }
    if (elements.timeRemaining) {
        elements.timeRemaining.textContent = state.timeRemaining;
        
        // Warning state
        const timerItem = elements.timeRemaining.closest('.stat-item');
        if (timerItem) {
            timerItem.classList.toggle('warning', state.timeRemaining <= 10);
        }
    }
    
    // Update stroke hint
    if (elements.strokeHint && state.currentChar) {
        const strokeIndex = state.currentStrokeIndex;
        if (strokeIndex < state.currentChar.strokes.length) {
            const stroke = state.currentChar.strokes[strokeIndex];
            elements.strokeHint.textContent = t('strokeHint')
                .replace('{n}', strokeIndex + 1)
                .replace('{name}', stroke.name);
        } else {
            elements.strokeHint.textContent = '✓ 完成！';
        }
    }
}

function updateBucketTilt() {
    if (!state.currentChar || !elements.bucket) return;
    
    const progress = state.currentStrokeIndex / state.currentChar.strokes.length;
    
    // Remove all tilt classes
    elements.bucket.className = 'bucket';
    
    // Add appropriate tilt
    if (progress >= 1) {
        elements.bucket.classList.add('pouring');
    } else if (progress >= 0.8) {
        elements.bucket.classList.add('tilt-5');
    } else if (progress >= 0.6) {
        elements.bucket.classList.add('tilt-4');
    } else if (progress >= 0.4) {
        elements.bucket.classList.add('tilt-3');
    } else if (progress >= 0.2) {
        elements.bucket.classList.add('tilt-2');
    } else if (progress > 0) {
        elements.bucket.classList.add('tilt-1');
    }
    
    // Update tilt bar
    if (elements.tiltBar) {
        elements.tiltBar.style.width = (progress * 100) + '%';
    }
}

function showWrongMark() {
    if (!elements.wrongMark) return;
    
    elements.wrongMark.classList.remove('hidden');
    
    // Remove and re-add to restart animation
    setTimeout(() => {
        elements.wrongMark.classList.add('hidden');
    }, 500);
}

function flashFeedback(success) {
    const container = document.querySelector('.camera-container');
    if (!container) return;
    
    container.style.boxShadow = success 
        ? '0 0 30px rgba(46, 204, 113, 0.5)' 
        : '0 0 30px rgba(231, 76, 60, 0.5)';
    
    setTimeout(() => {
        container.style.boxShadow = '';
    }, 300);
}

function pourWater() {
    const bombContainer = document.querySelector('.bomb-container');
    const bucketContainer = document.querySelector('.bucket-container');
    
    // Tilt bucket to pour
    if (elements.bucket) {
        elements.bucket.classList.add('pouring');
    }
    
    // Create water stream (richer look: strands + shimmer)
    if (bucketContainer) {
        const waterStream = document.createElement('div');
        waterStream.className = 'water-stream';
        
        // Add multiple strands to simulate breakup of water column
        for (let i = 0; i < 6; i++) {
            const strand = document.createElement('div');
            strand.className = 'water-strand';
            strand.style.setProperty('--w', (6 + Math.random() * 10).toFixed(1) + 'px');
            strand.style.setProperty('--h', (210 + Math.random() * 120).toFixed(0) + 'px');
            strand.style.left = (40 + Math.random() * 20).toFixed(0) + '%';
            strand.style.animationDelay = (Math.random() * 0.15).toFixed(2) + 's';
            waterStream.appendChild(strand);
        }

        bucketContainer.appendChild(waterStream);
        
        setTimeout(() => waterStream.remove(), 1900);
    }
    
    // After delay, show splash on bomb
    setTimeout(() => {
        if (bombContainer) {
            // Wet look immediately when water hits
            if (elements.bomb) {
                elements.bomb.classList.add('wet');
            }

            // Impact FX: spray + ripples + drips (more satisfying extinguish)
            const impact = document.createElement('div');
            impact.className = 'water-impact';
            bombContainer.appendChild(impact);

            const spray = document.createElement('div');
            spray.className = 'water-spray';
            for (let i = 0; i < 36; i++) {
                const d = document.createElement('div');
                d.className = 'spray-drop';
                d.style.setProperty('--dx', ((Math.random() - 0.5) * 220).toFixed(0) + 'px');
                d.style.setProperty('--dy', (-(60 + Math.random() * 140)).toFixed(0) + 'px');
                d.style.animationDelay = (Math.random() * 0.08).toFixed(2) + 's';
                d.style.width = (4 + Math.random() * 8).toFixed(1) + 'px';
                d.style.height = d.style.width;
                spray.appendChild(d);
            }
            impact.appendChild(spray);

            for (let i = 0; i < 3; i++) {
                const r = document.createElement('div');
                r.className = 'water-ripple';
                r.style.animationDelay = (i * 0.12).toFixed(2) + 's';
                impact.appendChild(r);
            }

            // Dripping water after impact
            const drips = document.createElement('div');
            drips.className = 'bomb-drips';
            for (let i = 0; i < 7; i++) {
                const drip = document.createElement('div');
                drip.className = 'bomb-drip';
                drip.style.left = (35 + Math.random() * 30).toFixed(0) + '%';
                drip.style.animationDelay = (0.08 + Math.random() * 0.35).toFixed(2) + 's';
                drip.style.width = (4 + Math.random() * 6).toFixed(1) + 'px';
                drips.appendChild(drip);
            }
            bombContainer.appendChild(drips);

            // Create splash effect
            const splash = document.createElement('div');
            splash.className = 'water-splash';
            for (let i = 0; i < 8; i++) {
                const drop = document.createElement('div');
                drop.className = 'splash-drop';
                splash.appendChild(drop);
            }
            bombContainer.appendChild(splash);
            
            // Create steam effect
            const steamContainer = document.createElement('div');
            steamContainer.style.cssText = 'position: absolute; top: 0; left: 50%; transform: translateX(-50%);';
            for (let i = 0; i < 10; i++) {
                const steam = document.createElement('div');
                steam.className = 'steam';
                steamContainer.appendChild(steam);
            }
            bombContainer.appendChild(steamContainer);
            
            // Create puddle
            const puddle = document.createElement('div');
            puddle.className = 'water-puddle';
            bombContainer.appendChild(puddle);
            
            // Extinguish the fuse/bomb (keep fuse element, switch to extinguished style)
            if (elements.fuse) {
                elements.fuse.classList.remove('burning');
                elements.fuse.classList.add('extinguished');
            }
            if (elements.bomb) {
                elements.bomb.classList.add('extinguished');
            }

            // Sound: steam hiss (best-effort)
            playExtinguishSfx();
            
            // Clean up after animation
            setTimeout(() => {
                splash.remove();
                steamContainer.remove();
                impact.remove();
                drips.remove();
            }, 2500);
        }
    }, 650);
    
    // Success flash - blue water effect
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at center, 
            rgba(100, 200, 255, 0.5) 0%, 
            rgba(50, 150, 255, 0.3) 30%,
            rgba(46, 204, 113, 0.2) 60%,
            transparent 80%);
        pointer-events: none;
        z-index: 1000;
        animation: flash-screen 1s ease-out forwards;
    `;
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 1000);
    
    // Celebration vibration
    if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50, 30, 100]);
    }
}

function explodeBomb() {
    const bombContainer = document.querySelector('.bomb-container');
    
    // ===== FULL SCREEN FLASH =====
    const fullFlash = document.createElement('div');
    fullFlash.className = 'explosion-fullscreen-flash';
    document.body.appendChild(fullFlash);
    setTimeout(() => fullFlash.remove(), 1000);
    
    // ===== CREATE MASSIVE EXPLOSION =====
    if (bombContainer) {
        // Clear existing content
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        
        // Add 16 fire particles
        for (let i = 0; i < 16; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            explosion.appendChild(particle);
        }
        
        // Add smoke clouds
        for (let i = 0; i < 5; i++) {
            const smoke = document.createElement('div');
            smoke.className = 'smoke-cloud';
            explosion.appendChild(smoke);
        }
        
        // Add flying debris
        for (let i = 0; i < 10; i++) {
            const debris = document.createElement('div');
            debris.className = 'debris';
            explosion.appendChild(debris);
        }
        
        bombContainer.appendChild(explosion);
        
        // Clean up after animation
        setTimeout(() => explosion.remove(), 3000);
    }
    
    // ===== HIDE BOMB =====
    if (elements.bomb) {
        elements.bomb.style.opacity = '0';
        elements.bomb.style.transform = 'scale(0)';
        elements.bomb.style.transition = 'all 0.05s ease';
    }
    if (elements.fuse) {
        elements.fuse.style.display = 'none';
    }
    
    // ===== INTENSE SCREEN SHAKE =====
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.add('explosion-shake');
        gameContainer.classList.add('explosion-impact');
        setTimeout(() => {
            gameContainer.classList.remove('explosion-shake');
            gameContainer.classList.remove('explosion-impact');
        }, 1000);
    }
    
    // Also shake the whole page
    document.body.style.animation = 'screen-shake-intense 1s ease-out';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 1000);
    
    // ===== SECONDARY FLASH =====
    setTimeout(() => {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, 
                rgba(255, 50, 0, 0.7) 0%, 
                rgba(200, 0, 0, 0.4) 40%,
                rgba(100, 0, 0, 0.2) 70%,
                transparent 100%);
            pointer-events: none;
            z-index: 999;
            animation: flash-screen 0.5s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }, 100);
    
    // ===== HEAVY VIBRATION =====
    if (navigator.vibrate) {
        navigator.vibrate([200, 50, 200, 50, 300, 100, 400]);
    }

    // ===== CINEMATIC PARTICLE FX + SOUND =====
    try {
        const rect = elements.bombContainer?.getBoundingClientRect?.();
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth * 0.75;
        const cy = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.6;
        startExplosionFx(cx, cy);
        playExplosionSfx();
    } catch (e) {
        // ignore
    }
    
    // Add flash animation style if not exists
    if (!document.getElementById('flash-style')) {
        const style = document.createElement('style');
        style.id = 'flash-style';
        style.textContent = `
            @keyframes flash-screen {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function updateCalibrationStatus(detected) {
    if (!elements.fingerDetected) return;
    
    if (detected) {
        elements.fingerDetected.classList.add('detected');
        elements.calibStatusText.textContent = t('calibDetected');
        elements.btnStartTraining.disabled = false;
    } else {
        elements.fingerDetected.classList.remove('detected');
        elements.calibStatusText.textContent = t('calibStatus');
        elements.btnStartTraining.disabled = true;
    }
}

// ============================================
// Screens
// ============================================
function showScreen(screen) {
    state.currentScreen = screen;
    
    // Hide all screens
    elements.loadingScreen?.classList.add('hidden');
    elements.permissionScreen?.classList.add('hidden');
    elements.calibrationScreen?.classList.add('hidden');
    elements.tutorialScreen?.classList.add('hidden');
    elements.trainingScreen?.classList.add('hidden');
    
    // Show target screen
    switch (screen) {
        case 'loading':
            elements.loadingScreen?.classList.remove('hidden');
            break;
        case 'permission':
            elements.permissionScreen?.classList.remove('hidden');
            break;
        case 'calibration':
            elements.calibrationScreen?.classList.remove('hidden');
            startCalibration();
            break;
        case 'tutorial':
            elements.tutorialScreen?.classList.remove('hidden');
            startTutorial();
            break;
        case 'training':
            elements.trainingScreen?.classList.remove('hidden');
            break;
    }
}

// ============================================
// Tutorial (Stroke Training)
// ============================================
const TUTORIAL_STROKES = {
    heng: {
        name: '横',
        direction: '从左到右 →',
        hint: '用手指画一个横 →',
        arrowClass: 'heng'
    },
    shu: {
        name: '竖',
        direction: '从上到下 ↓',
        hint: '用手指画一个竖 ↓',
        arrowClass: 'shu'
    },
    pie: {
        name: '撇',
        direction: '从右上到左下 ↙',
        hint: '用手指画一个撇 ↙',
        arrowClass: 'pie'
    },
    na: {
        name: '捺',
        direction: '从左上到右下 ↘',
        hint: '用手指画一个捺 ↘',
        arrowClass: 'na'
    },
    dian: {
        name: '点',
        direction: '短促向下 •',
        hint: '用手指画一个点 •',
        arrowClass: 'dian'
    }
};

function startTutorial() {
    state.tutorialStepIndex = 0;
    state.tutorialCompleted = {};
    state.tutorialActive = true;
    state.currentPath = [];
    
    // Setup tutorial canvas
    if (elements.tutorialCanvas) {
        const container = elements.tutorialCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        elements.tutorialCanvas.width = rect.width;
        elements.tutorialCanvas.height = rect.height;
        state.tutorialCtx = elements.tutorialCanvas.getContext('2d');
        
        // Add touch/mouse events
        setupTutorialCanvas();
    }
    
    // Start camera for tutorial if in camera mode
    if (state.inputMode === 'camera' && elements.tutorialVideo) {
        setupCamera(elements.tutorialVideo).then(() => {
            if (state.hands) {
                const tutorialCamera = new Camera(elements.tutorialVideo, {
                    onFrame: async () => {
                        if (state.currentScreen === 'tutorial') {
                            await state.hands.send({ image: elements.tutorialVideo });
                        }
                    },
                    width: 640,
                    height: 480
                });
                tutorialCamera.start();
            }
        }).catch(err => {
            console.warn('Tutorial camera setup failed:', err);
        });
    }
    
    updateTutorialStep();
}

function setupTutorialCanvas() {
    const canvas = elements.tutorialCanvas;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleTutorialPointerStart);
    canvas.addEventListener('mousemove', handleTutorialPointerMove);
    canvas.addEventListener('mouseup', handleTutorialPointerEnd);
    canvas.addEventListener('mouseleave', handleTutorialPointerEnd);
    
    canvas.addEventListener('touchstart', handleTutorialTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTutorialTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTutorialTouchEnd);
}

function handleTutorialPointerStart(e) {
    if (state.inputMode !== 'touch' || !state.tutorialActive) return;
    e.preventDefault();
    const rect = elements.tutorialCanvas.getBoundingClientRect();
    startTutorialDrawing(e.clientX - rect.left, e.clientY - rect.top);
}

function handleTutorialPointerMove(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    const rect = elements.tutorialCanvas.getBoundingClientRect();
    continueTutorialDrawing(e.clientX - rect.left, e.clientY - rect.top);
}

function handleTutorialPointerEnd(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    endTutorialDrawing();
}

function handleTutorialTouchStart(e) {
    if (state.inputMode !== 'touch' || !state.tutorialActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = elements.tutorialCanvas.getBoundingClientRect();
    startTutorialDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
}

function handleTutorialTouchMove(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = elements.tutorialCanvas.getBoundingClientRect();
    continueTutorialDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
}

function handleTutorialTouchEnd(e) {
    if (state.inputMode !== 'touch' || !state.isDrawing) return;
    endTutorialDrawing();
}

function handleTutorialFingerMove(x, y) {
    if (!state.isDrawing) {
        startTutorialDrawing(x, y);
    } else {
        continueTutorialDrawing(x, y);
    }
}

function handleTutorialFingerUp() {
    if (state.isDrawing) {
        endTutorialDrawing();
    }
}

function startTutorialDrawing(x, y) {
    state.isDrawing = true;
    state.currentPath = [[x, y]];
    state.lastPoint = { x, y };
    
    const ctx = state.tutorialCtx;
    if (!ctx) return;
    
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function continueTutorialDrawing(x, y) {
    if (!state.isDrawing) return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    
    // Debounce sampling: only add a point if the finger moved enough
    const MIN_POINT_DIST = 4; // px
    if (state.lastPoint) {
        const dx = x - state.lastPoint.x;
        const dy = y - state.lastPoint.y;
        if ((dx * dx + dy * dy) < (MIN_POINT_DIST * MIN_POINT_DIST)) {
            return;
        }
    }
    
    state.currentPath.push([x, y]);
    
    const ctx = state.tutorialCtx;
    if (!ctx) return;
    
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 12;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Add glow
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.4)';
    ctx.lineWidth = 20;
    ctx.shadowColor = 'rgba(244, 208, 63, 0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(state.lastPoint.x, state.lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    
    state.lastPoint = { x, y };
}

function endTutorialDrawing() {
    state.isDrawing = false;
    
    if (state.currentPath.length < 5) {
        state.currentPath = [];
        return;
    }
    
    // Analyze the stroke
    const strokeInfo = analyzeStrokeCharacteristics(state.currentPath);
    const currentStrokeType = state.tutorialSteps[state.tutorialStepIndex];
    
    // Check if it matches
    const isCorrect = checkTutorialStroke(strokeInfo, currentStrokeType);
    
    if (isCorrect) {
        handleTutorialCorrect();
    } else {
        handleTutorialWrong();
    }
    
    state.currentPath = [];
    
    // Clear after delay
    setTimeout(clearTutorialCanvas, 500);
}

function checkTutorialStroke(strokeInfo, expectedType) {
    const angle = strokeInfo.angle;
    const aspectRatio = strokeInfo.aspectRatio;
    const length = strokeInfo.length;
    
    if (length < 30) return false;
    
    switch (expectedType) {
        case 'heng':
            return (angle >= -45 && angle <= 45) || (angle >= 135 || angle <= -135);
        case 'shu':
            return (angle >= 45 && angle <= 135) || (angle >= -135 && angle <= -45);
        case 'pie':
            return (angle >= 90 && angle <= 180) || (angle >= -180 && angle <= -135);
        case 'na':
            return angle >= 0 && angle <= 90;
        case 'dian':
            return length < 150;
        default:
            return false;
    }
}

function handleTutorialCorrect() {
    const currentType = state.tutorialSteps[state.tutorialStepIndex];
    state.tutorialCompleted[currentType] = true;
    
    // Update progress UI
    const step = document.querySelector(`.progress-step[data-step="${currentType}"]`);
    if (step) {
        step.classList.remove('active');
        step.classList.add('completed');
        step.querySelector('.step-status').textContent = '✓';
    }
    
    // Show feedback
    showTutorialFeedback(true);
    
    // Move to next step
    setTimeout(() => {
        state.tutorialStepIndex++;
        
        if (state.tutorialStepIndex >= state.tutorialSteps.length) {
            // Tutorial complete!
            setTimeout(() => {
                state.tutorialActive = false;
                showScreen('training');
                startGame();
            }, 500);
        } else {
            updateTutorialStep();
        }
    }, 1000);
}

function handleTutorialWrong() {
    showTutorialFeedback(false);
    
    // Vibrate on mobile
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
}

function showTutorialFeedback(success) {
    if (!elements.tutorialFeedback) return;
    
    const icon = elements.tutorialFeedback.querySelector('.feedback-icon');
    const text = elements.tutorialFeedback.querySelector('.feedback-text');
    
    if (success) {
        elements.tutorialFeedback.style.background = 'rgba(46, 204, 113, 0.95)';
        icon.textContent = '✓';
        text.textContent = '很好！';
    } else {
        elements.tutorialFeedback.style.background = 'rgba(231, 76, 60, 0.95)';
        icon.textContent = '✗';
        text.textContent = '再试一次';
    }
    
    elements.tutorialFeedback.classList.remove('hidden');
    
    setTimeout(() => {
        elements.tutorialFeedback.classList.add('hidden');
    }, 800);
}

function updateTutorialStep() {
    const currentType = state.tutorialSteps[state.tutorialStepIndex];
    const strokeData = TUTORIAL_STROKES[currentType];
    
    // Update UI
    if (elements.tutorialStrokeName) {
        elements.tutorialStrokeName.textContent = strokeData.name;
    }
    if (elements.tutorialDirection) {
        elements.tutorialDirection.textContent = strokeData.direction;
    }
    if (elements.tutorialHint) {
        elements.tutorialHint.textContent = strokeData.hint;
    }
    
    // Update arrow style
    if (elements.strokeArrow) {
        elements.strokeArrow.className = 'stroke-arrow ' + strokeData.arrowClass;
    }
    
    // Update guide line
    if (elements.guideLine) {
        elements.guideLine.className = 'guide-line ' + currentType;
    }
    
    // Update progress steps
    elements.progressSteps?.forEach(step => {
        step.classList.remove('active');
        if (step.dataset.step === currentType) {
            step.classList.add('active');
        }
    });
    
    // Clear canvas
    clearTutorialCanvas();
}

function clearTutorialCanvas() {
    if (state.tutorialCtx && elements.tutorialCanvas) {
        state.tutorialCtx.clearRect(0, 0, elements.tutorialCanvas.width, elements.tutorialCanvas.height);
    }
}

async function startCalibration() {
    try {
        await setupCamera(elements.calibVideo);
        
        // Setup MediaPipe for calibration
        if (state.hands) {
            const calibCamera = new Camera(elements.calibVideo, {
                onFrame: async () => {
                    await state.hands.send({ image: elements.calibVideo });
                },
                width: 640,
                height: 480
            });
            calibCamera.start();
        }
    } catch (error) {
        console.error('Calibration camera setup failed:', error);
        // Fall back to touch mode
        state.inputMode = 'touch';
        showScreen('training');
        startGame();
    }
}

// ============================================
// Game Flow
// ============================================
function startGame(character = null) {
    // Set character
    if (character) {
        state.currentChar = character;
    } else {
        state.currentChar = getRandomCharacter(state.charSet);
    }
    
    // Reset game state
    state.currentStrokeIndex = 0;
    state.correctStrokes = 0;
    state.wrongAttempts = 0;
    state.timeRemaining = state.timeLimit;
    state.gameActive = true;
    
    // Update UI - both small display and embedded trace character
    if (elements.targetCharacter) {
        elements.targetCharacter.textContent = state.currentChar.char;
    }
    // Show the target character in camera area (for reference, not tracing)
    if (elements.traceCharacter) {
        elements.traceCharacter.textContent = state.currentChar.char;
    }
    
    // Reset animations
    resetAnimations();
    
    // Update game UI
    updateGameUI();
    
    // No stroke-by-stroke guide - player must know the stroke order!
    
    // Update writing hint based on input mode
    if (elements.writingHint) {
        if (state.inputMode === 'camera') {
            elements.writingHint.innerHTML = '👌 <strong>捏合拇指和食指</strong>开始写字，松开结束';
        } else {
            elements.writingHint.textContent = t('writingHintTouch');
        }
    }
    
    // Start camera tracking if using camera mode
    if (state.inputMode === 'camera') {
        startCameraTracking();
    }
    
    // Clear canvas
    clearWritingCanvas();
    
    // Start timer
    if (state.timeLimit > 0) {
        startTimer();
    }
    
    // Set fuse duration and start burning animation
    if (elements.fuse) {
        // Remove and re-add burning class to restart animation
        elements.fuse.classList.remove('burning');
        void elements.fuse.offsetWidth; // Force reflow
        elements.fuse.style.setProperty('--fuse-duration', state.timeLimit + 's');
        elements.fuse.classList.add('burning');
    }
    
    // Reset bomb urgency
    if (elements.bomb) {
        elements.bomb.classList.remove('urgent');
    }
}

function drawStrokeGuide() {
    if (!elements.strokeGuideCanvas || !state.currentChar) return;
    
    const canvas = elements.strokeGuideCanvas;
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the current stroke guide
    if (state.currentStrokeIndex < state.currentChar.strokes.length) {
        const stroke = state.currentChar.strokes[state.currentStrokeIndex];
        
        // Calculate offset for centering (10% padding)
        const padding = 0.1;
        const drawWidth = canvas.width * (1 - 2 * padding);
        const drawHeight = canvas.height * (1 - 2 * padding);
        const offsetX = canvas.width * padding;
        const offsetY = canvas.height * padding;
        
        // Draw stroke path as dotted guide
        ctx.strokeStyle = 'rgba(244, 208, 63, 0.6)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.setLineDash([8, 8]);
        
        ctx.beginPath();
        stroke.path.forEach((point, index) => {
            const x = offsetX + point[0] * drawWidth;
            const y = offsetY + point[1] * drawHeight;
            if (index === 0) {
                ctx.moveTo(x, y);
                
                // Draw start point
                ctx.save();
                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
                ctx.beginPath();
                ctx.arc(x, y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((state.currentStrokeIndex + 1).toString(), x, y);
                ctx.restore();
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw arrow at end
        if (stroke.path.length >= 2) {
            const lastPoint = stroke.path[stroke.path.length - 1];
            const prevPoint = stroke.path[stroke.path.length - 2];
            const endX = offsetX + lastPoint[0] * drawWidth;
            const endY = offsetY + lastPoint[1] * drawHeight;
            const angle = Math.atan2(
                lastPoint[1] - prevPoint[1],
                lastPoint[0] - prevPoint[0]
            );
            
            // Draw arrow head
            ctx.fillStyle = 'rgba(244, 208, 63, 0.8)';
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - 15 * Math.cos(angle - Math.PI / 6),
                endY - 15 * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                endX - 15 * Math.cos(angle + Math.PI / 6),
                endY - 15 * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
        }
    }
}

function startTimer() {
    clearInterval(state.timerInterval);
    
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateGameUI();
        
        // Add urgency when time is low (less than 10 seconds or 30% remaining)
        const urgencyThreshold = Math.min(10, state.timeLimit * 0.3);
        if (state.timeRemaining <= urgencyThreshold && state.timeRemaining > 0) {
            if (elements.bomb) {
                elements.bomb.classList.add('urgent');
            }
            if (elements.dangerText) {
                elements.dangerText.style.fontSize = '1rem';
            }
        }
        
        if (state.timeRemaining <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function resetAnimations() {
    // Reset bucket
    if (elements.bucket) {
        elements.bucket.className = 'bucket';
    }
    if (elements.waterDrops) {
        elements.waterDrops.classList.add('hidden');
    }
    if (elements.tiltBar) {
        elements.tiltBar.style.width = '0%';
    }
    
    // Reset bomb
    if (elements.bomb) {
        elements.bomb.style.opacity = '1';
        elements.bomb.style.transform = '';
        elements.bomb.classList.remove('wet', 'extinguished', 'urgent');
    }
    if (elements.fuse) {
        elements.fuse.classList.remove('extinguished', 'burning');
        elements.fuse.style.display = '';
    }
    if (elements.fuseLine) {
        elements.fuseLine.style.height = '100%';
    }
    if (elements.explosion) {
        elements.explosion.classList.add('hidden');
    }
    if (elements.dangerText) {
        elements.dangerText.style.fontSize = '';
    }

    // Remove any leftover water FX nodes
    try {
        document.querySelectorAll('.water-stream, .water-impact, .bomb-drips, .water-splash, .water-puddle').forEach(n => n.remove());
    } catch (e) {
        // ignore
    }
    
    // Reset marks
    if (elements.wrongMark) {
        elements.wrongMark.classList.add('hidden');
    }
    if (elements.correctMark) {
        elements.correctMark.classList.add('hidden');
    }
    
    // Clear stroke guide canvas
    if (elements.strokeGuideCanvas) {
        const ctx = elements.strokeGuideCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.strokeGuideCanvas.width, elements.strokeGuideCanvas.height);
    }
}

function showResult(success) {
    if (!elements.resultModal) return;
    
    if (success) {
        elements.resultIcon.textContent = '🎉';
        elements.resultTitle.textContent = t('resultSuccess');
        elements.resultMessage.textContent = t('resultSuccessMsg');
    } else {
        elements.resultIcon.textContent = '💥';
        elements.resultTitle.textContent = t('resultFail');
        elements.resultMessage.textContent = t('resultFailMsg');
    }
    
    // Stats
    elements.resCharacter.textContent = state.currentChar.char;
    elements.resTime.textContent = (state.timeLimit - state.timeRemaining) + '秒';
    
    const accuracy = state.currentChar.strokes.length > 0 
        ? Math.round((state.correctStrokes / state.currentChar.strokes.length) * 100) 
        : 0;
    elements.resAccuracy.textContent = accuracy + '%';
    
    elements.resultModal.classList.remove('hidden');
}

function hideResult() {
    if (elements.resultModal) {
        elements.resultModal.classList.add('hidden');
    }
}

function showHint() {
    if (!state.currentChar || state.currentStrokeIndex >= state.currentChar.strokes.length) return;
    
    const stroke = state.currentChar.strokes[state.currentStrokeIndex];
    
    // Draw hint on character canvas
    const ctx = state.characterCtx;
    if (!ctx || !elements.characterCanvas) return;
    
    const canvas = elements.characterCanvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stroke path as hint
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.8)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    stroke.path.forEach((point, index) => {
        const x = point[0] * canvas.width;
        const y = point[1] * canvas.height;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Clear after 2 seconds
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 2000);
}

// ============================================
// Settings
// ============================================
function showSettings() {
    if (elements.settingsModal) {
        elements.settingsModal.classList.remove('hidden');
    }
}

function hideSettings() {
    if (elements.settingsModal) {
        elements.settingsModal.classList.add('hidden');
    }
}

function updateSettings(setting, value) {
    switch (setting) {
        case 'difficulty':
            state.difficulty = value;
            break;
        case 'charset':
            state.charSet = value;
            break;
        case 'input':
            state.inputMode = value;
            break;
        case 'timer':
            state.timeLimit = parseInt(value);
            break;
    }
}

// ============================================
// Character Selection
// ============================================
function showCharacterSelect() {
    if (!elements.charSelectModal || !elements.charGrid) return;
    
    // Populate grid
    elements.charGrid.innerHTML = '';
    const chars = getCharacterSet(state.charSet);
    
    chars.forEach(char => {
        const item = document.createElement('button');
        item.className = 'char-item';
        item.textContent = char.char;
        item.addEventListener('click', () => {
            selectCharacter(char);
        });
        elements.charGrid.appendChild(item);
    });
    
    elements.charSelectModal.classList.remove('hidden');
}

function hideCharacterSelect() {
    if (elements.charSelectModal) {
        elements.charSelectModal.classList.add('hidden');
    }
}

function selectCharacter(char) {
    hideCharacterSelect();
    startGame(char);
}

// ============================================
// Language
// ============================================
function setLanguage(lang) {
    state.language = lang;
    
    // Update active button
    elements.langBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update all text (simplified - in production would use data-i18n attributes)
    updateAllText();
}

function updateAllText() {
    // Update key elements
    document.getElementById('perm-title')?.textContent && (document.getElementById('perm-title').textContent = t('permTitle'));
    document.getElementById('perm-desc')?.textContent && (document.getElementById('perm-desc').textContent = t('permDesc'));
    // ... more text updates would go here
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Permission screen
    elements.btnGrantPerm?.addEventListener('click', async () => {
        state.inputMode = 'camera';
        try {
            await setupCamera(elements.calibVideo);
            showScreen('calibration');
        } catch (error) {
            alert(t('cameraErrorMsg'));
            state.inputMode = 'touch';
            showScreen('tutorial'); // Go to tutorial first
        }
    });
    
    elements.btnSkipCamera?.addEventListener('click', () => {
        state.inputMode = 'touch';
        showScreen('tutorial'); // Go to tutorial first
    });
    
    // Calibration screen
    elements.btnStartTraining?.addEventListener('click', () => {
        showScreen('tutorial'); // Go to tutorial first
    });
    
    // Tutorial screen
    elements.btnClearTutorial?.addEventListener('click', clearTutorialCanvas);
    
    elements.btnSkipTutorial?.addEventListener('click', () => {
        state.tutorialActive = false;
        showScreen('training');
        startGame();
    });
    
    // Game controls
    elements.btnClear?.addEventListener('click', clearWritingCanvas);
    elements.btnHint?.addEventListener('click', showHint);
    elements.btnSkip?.addEventListener('click', () => {
        state.gameActive = false;
        clearInterval(state.timerInterval);
        startGame();
    });
    
    // Settings
    elements.btnSettings?.addEventListener('click', showSettings);
    elements.closeSettings?.addEventListener('click', hideSettings);
    
    // Settings options
    document.querySelectorAll('[data-difficulty]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-difficulty]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSettings('difficulty', btn.dataset.difficulty);
        });
    });
    
    document.querySelectorAll('[data-charset]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-charset]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSettings('charset', btn.dataset.charset);
        });
    });
    
    document.querySelectorAll('[data-input]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-input]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSettings('input', btn.dataset.input);
        });
    });
    
    document.querySelectorAll('[data-timer]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-timer]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSettings('timer', btn.dataset.timer);
        });
    });
    
    // Result modal
    elements.btnRetry?.addEventListener('click', () => {
        hideResult();
        startGame(state.currentChar);
    });
    
    elements.btnNextChar?.addEventListener('click', () => {
        hideResult();
        startGame();
    });
    
    // Character select
    elements.btnRandomChar?.addEventListener('click', () => {
        hideCharacterSelect();
        startGame();
    });
    
    elements.closeCharSelect?.addEventListener('click', hideCharacterSelect);
    
    // Language
    elements.langBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });
    
    // Click on character to select
    elements.targetCharacter?.addEventListener('click', showCharacterSelect);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSettings();
            hideCharacterSelect();
            hideResult();
        }
        if (e.key === 'c' && state.gameActive) {
            clearWritingCanvas();
        }
        if (e.key === 'h' && state.gameActive) {
            showHint();
        }
    });
}

// ============================================
// Initialize on DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', init);

