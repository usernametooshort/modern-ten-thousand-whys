const SCENARIOS = [
    {
        id: 'peer_pressure',
        title: 'Peer Pressure & Social Groups',
        image: 'assets/scenario_peer_pressure_1768408023369.png',
        question: 'What is happening in this picture? Why is the boy looking uncomfortable? (Use: mediation, group pressure)',
    },
    {
        id: 'studying',
        title: 'School Stress & Reflexive Verbs',
        image: 'assets/scenario_studying_reflexive_1768408037559.png',
        question: 'Describe the boy’s situation. What is he telling himself? (Use: reflexive pronouns like "himself", "myself")',
    },
    {
        id: 'compromise',
        title: 'Finding a Compromise',
        image: 'assets/scenario_compromise_discussion_1768408052645.png',
        question: 'These three friends want to do different things. How can they find a compromise? (Use: "I see your point", "Why don\'t we...")',
    },
    {
        id: 'adverbs',
        title: 'Describing Actions (Adverbs)',
        image: 'assets/scenario_adverbs_action_1768408069705.png',
        question: 'Describe how the people are doing these activities. (Use adverbs ending in -ly: quickly, loudly, carefully)',
    },
    {
        id: 'language',
        title: 'History of English',
        image: 'assets/scenario_language_history_1768408089358.png',
        question: 'Explain the difference between the "animal" words and the "food" words in English history. Who brought which words?',
    },
    {
        id: 'personalities',
        title: 'Personalities & Hobbies',
        image: 'assets/scenario_personalities_hobbies_1768408103915.png',
        question: 'Pick two of these teenagers. Describe their personalities and what they are like. (Use: creative, ambitious, social)',
    },
    // --- New Scenarios ---
    {
        id: 'shopping',
        title: 'Consumer Choices',
        image: 'assets/scenario_shopping_clothing_1768413484573.png',
        question: 'Why does the boy look worried? Talk about prices and making choices. (Use: expensive, afford, budget)',
    },
    {
        id: 'restaurant',
        title: 'Ordering Food',
        image: 'assets/scenario_restaurant_ordering_1768413497846.png',
        question: 'You are at a restaurant. Describe how to order food politely. (Use: "I would like...", "Could I have...")',
    },
    {
        id: 'travel',
        title: 'Travel & Transport',
        image: 'assets/scenario_travel_train_station_1768413514182.png',
        question: 'Describe the chaos at the station. What is the family trying to do? (Use: platform, departure, delayed)',
    },
    {
        id: 'sports',
        title: 'Sports & Teamwork',
        image: 'assets/scenario_sports_team_1768413527289.png',
        question: 'Why is teamwork important in sports? Describe what is happening in the game. (Use: pass, score, cooperate)',
    },
    {
        id: 'tech',
        title: 'Digital Dilemmas',
        image: 'assets/scenario_technology_problem_1768413542128.png',
        question: 'What is the problem with the laptop? functionality? How should she react? (Use: crash, error, restart)',
    },
    {
        id: 'environment',
        title: 'Environment & Recycling',
        image: 'assets/scenario_environment_recycling_1768413556652.png',
        question: 'What are these students doing for the environment? Why is it important? (Use: recycle, plastic, pollution)',
    },
    {
        id: 'party',
        title: 'Celebrations',
        image: 'assets/scenario_family_party_1768413575366.png',
        question: 'Describe the party atmosphere. What are people doing? (Use: celebrate, decorate, delicious)',
    },
    {
        id: 'holiday',
        title: 'Summer Holiday',
        image: 'assets/scenario_holiday_beach_1768413589459.png',
        question: 'Imagine you are on this beach. What are you doing? (Use: sunbathe, swim, relax)',
    },
    {
        id: 'health',
        title: 'Health & Illness',
        image: 'assets/scenario_health_doctor_1768413603236.png',
        question: 'What is wrong with the boy? What advice might the doctor give? (Use: stomachache, medicine, rest)',
    },
    {
        id: 'future',
        title: 'Dreams & Future',
        image: 'assets/scenario_future_plans_1768413618501.png',
        question: 'What is the girl dreaming about? What does she want to be? (Use: astronaut, space, ambitious)',
    }
];

// State
let currentScenario = null; // Can be an object or a "Textbook" Placeholder
let uploadedImageData = null; // Base64 string for textbook mode
let activeMode = 'generator'; // 'generator' or 'textbook'

let recognition = null;
let isRecording = false;
let audioContext = null;
let analyser = null;
let source = null;
let animationId = null;
let currentStream = null;

// DOM Elements
const generatorSection = document.getElementById('generator-section');
const studentNameInput = document.getElementById('student-name');
const scenarioDisplay = document.getElementById('scenario-display');

// Mode Switch inputs
const modeRadios = document.getElementsByName('exam-mode');
const generatorControls = document.getElementById('generator-controls');
const uploadControls = document.getElementById('upload-controls');

// Controls
const generateBtn = document.getElementById('generate-btn');
const textbookUploadInput = document.getElementById('textbook-upload');
const startUploadBtn = document.getElementById('start-upload-btn');

const loadingOverlay = document.getElementById('loading-overlay');
const scenarioImage = document.getElementById('scenario-image');
const scenarioTitle = document.getElementById('scenario-title');
const scenarioTask = document.getElementById('scenario-task');

const recordBtn = document.getElementById('record-btn');
const recordStatus = document.getElementById('record-status');
const transcriptText = document.getElementById('transcript-text');
const gradeBtn = document.getElementById('grade-btn');
const gradingResult = document.getElementById('grading-result');
const gradingContent = document.getElementById('grading-content');
const retryBtn = document.getElementById('retry-btn');
const networkWarning = document.getElementById('network-warning');

// History
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Mic Diagnostics
const micTestBtn = document.getElementById('mic-test-btn');
const micStatus = document.getElementById('mic-status');
const micSelect = document.getElementById('mic-select');
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');

// --- Initialization ---
function init() {
    setupSpeechRecognition();
    loadHistory();

    // Check HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        networkWarning.classList.remove('hidden');
    }

    populateMicList();

    // Event Listeners
    generateBtn.addEventListener('click', startGeneration);
    startUploadBtn.addEventListener('click', startTextbookScenario);

    // Mode Switcher
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeMode = e.target.value;
            toggleModeUI(activeMode);
        });
    });

    // File Input
    textbookUploadInput.addEventListener('change', handleFileUpload);

    recordBtn.addEventListener('click', toggleRecording);
    gradeBtn.addEventListener('click', gradeAnswer);
    retryBtn.addEventListener('click', resetApp);
    clearHistoryBtn.addEventListener('click', clearHistory);

    if (micTestBtn) micTestBtn.addEventListener('click', visualizeAudio);

    transcriptText.addEventListener('input', () => {
        gradeBtn.disabled = transcriptText.value.length <= 10;
    });

    micSelect.addEventListener('change', populateMicList);

    // Load saved name
    const savedName = localStorage.getItem('english_exam_student_name');
    if (savedName) studentNameInput.value = savedName;
    studentNameInput.addEventListener('change', () => {
        localStorage.setItem('english_exam_student_name', studentNameInput.value);
    });
}

function toggleModeUI(mode) {
    if (mode === 'generator') {
        generatorControls.classList.remove('hidden');
        uploadControls.classList.add('hidden');
    } else {
        generatorControls.classList.add('hidden');
        uploadControls.classList.remove('hidden');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        startUploadBtn.disabled = false;
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageData = e.target.result; // Data URL
        };
        reader.readAsDataURL(file);
    } else {
        startUploadBtn.disabled = true;
        uploadedImageData = null;
    }
}

// ... (Mic / Speech setup remains same) ...

async function populateMicList() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        micSelect.innerHTML = '<option value="">Default Microphone</option>';
        audioInputs.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Microphone ${micSelect.options.length}`;
            micSelect.appendChild(option);
        });
    } catch (e) { console.warn(e); }
}

async function visualizeAudio() {
    if (animationId) cancelAnimationFrame(animationId);
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        try { await audioContext.close(); } catch (e) { }
    }
    audioContext = null;

    micStatus.className = 'status-text neutral';
    micStatus.innerText = "Requesting access...";

    const deviceId = micSelect.value;
    const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        micStatus.className = 'status-text success';
        micStatus.innerText = "Success! Speak to test.";

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        if (audioContext.state === 'suspended') await audioContext.resume();

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            canvasCtx.fillStyle = '#2c3e50';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                canvasCtx.fillStyle = `rgb(50, ${barHeight + 100}, 150)`;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    } catch (err) {
        micStatus.className = 'status-text error';
        micStatus.innerText = "Error: " + err.message;
    }
}

function setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
            else interim += event.results[i][0].transcript;
        }
        if (isRecording) transcriptText.value = final + interim;
        if (transcriptText.value.length > 10) gradeBtn.disabled = false;
    };

    recognition.onend = () => {
        if (isRecording) {
            try { recognition.start(); } catch (e) { isRecording = false; updateRecordButtonState(); }
        } else { updateRecordButtonState(); }
    };

    recognition.onerror = (event) => {
        let msg = "Error: " + event.error;
        if (event.error === 'network') msg = "Network/HTTPS Error. Please Type.";
        recordStatus.innerText = msg;
        if (['network', 'not-allowed'].includes(event.error)) {
            isRecording = false;
            updateRecordButtonState();
        }
    };
}

function updateRecordButtonState() {
    if (isRecording) {
        recordStatus.innerText = "Listening... (or Type below)";
        recordBtn.innerHTML = '<span class="mic-icon">⏹</span> Stop';
        recordBtn.classList.add('recording');
    } else {
        recordBtn.innerHTML = '<span class="mic-icon">🎤</span> Resume';
        recordBtn.classList.remove('recording');
    }
}

// --- Start Logic ---

function transitionToExam() {
    generatorSection.classList.add('hidden');
    scenarioDisplay.classList.remove('hidden');
    // Common Cleanup
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    if (audioContext) audioContext.close();
}

function startGeneration() {
    // GENERATOR MODE
    loadingOverlay.classList.remove('hidden');
    scenarioImage.classList.add('hidden');
    transitionToExam();

    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * SCENARIOS.length);
        currentScenario = SCENARIOS[randomIndex];
        // Ensure no leftover upload data
        uploadedImageData = null;

        scenarioTitle.innerText = "Topic: " + currentScenario.title;
        scenarioTask.innerText = currentScenario.question;
        scenarioImage.src = currentScenario.image;
        loadingOverlay.classList.add('hidden');
        scenarioImage.classList.remove('hidden');
    }, 1500);
}

function startTextbookScenario() {
    // TEXTBOOK MODE
    if (!uploadedImageData) return;
    transitionToExam();

    currentScenario = {
        title: "Textbook Image Analysis",
        question: "Describe what you see in this picture. What are the people doing? (Detailled description)",
        id: "textbook_upload"
    };

    scenarioTitle.innerText = "Textbook Mode";
    scenarioTask.innerText = currentScenario.question;
    scenarioImage.src = uploadedImageData; // Display uploaded image

    loadingOverlay.classList.add('hidden');
    scenarioImage.classList.remove('hidden');
}


function toggleRecording() {
    if (!recognition) {
        transcriptText.focus();
        return;
    }
    if (isRecording) {
        recognition.stop();
        isRecording = false;
    } else {
        try {
            recognition.start();
            isRecording = true;
        } catch (e) {
            recordStatus.innerText = "Start Error. Please Type.";
        }
    }
    updateRecordButtonState();
}

async function gradeAnswer() {
    isRecording = false;
    if (recognition) recognition.stop();
    updateRecordButtonState();

    gradeBtn.disabled = true;
    gradeBtn.innerText = "Grading...";
    gradingResult.classList.remove('hidden');
    gradingContent.innerHTML = "<p>Frau Müller is reviewing your answer...</p>";
    gradingResult.scrollIntoView({ behavior: 'smooth' });

    const studentName = studentNameInput.value || "Student";
    const mode = uploadedImageData ? 'textbook' : 'scenario';

    try {
        const feedback = await callGeminiAPI(currentScenario, transcriptText.value, studentName, mode, uploadedImageData);
        const parsedFeedback = marked.parse(feedback);
        gradingContent.innerHTML = parsedFeedback;

        saveToHistory(currentScenario, transcriptText.value, feedback);

    } catch (error) {
        gradingContent.innerText = "Error: " + error.message;
    } finally {
        gradeBtn.innerText = "📝 Grade My Answer";
    }
}

function resetApp() {
    if (confirm("Create a new scenario? This will clear your current answer.")) {
        location.reload();
    }
}

async function callGeminiAPI(scenario, studentAnswer, studentName, mode, imageData) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL_NAME}:generateContent?key=${CONFIG.API_KEY}`;

    let promptText = `
        Du bist Frau Müller, eine strenge aber faire Englischlehrerin an einem bayerischen Gymnasium (7. Klasse).
        Der Name des Schülers ist: ${studentName}.
        
        SZENARIO: ${scenario.title}
        AUFGABE: ${scenario.question}
        
        ANTWORT DES SCHÜLERS: "${studentAnswer}"
        
        AUFGABE FÜR DICH (KI):
        
        1. BEWERTUNG (auf Deutsch):
           - Analysiere die Antwort des Schülers.
           - Inhalt, Grammatik, Ausdruck (7. Klasse Niveau).
           - Gib eine Note (1-6).
           - Sprich den Schüler mit "${studentName}" an.
           
        2. MUSTERLÖSUNG (auf Englisch):
           - Schreibe eine Vorbild-Antwort (Model Answer).
           - Beschreibe GENAU, was im Bild zu sehen ist (besonders im Textbook Mode wichtig!).
           - Niveau: Perfektes Englisch für die 7. Klasse.
           - Überschrift: "### 💡 Musterlösung / Model Answer"
           
        Format: Markdown.
    `;

    // Construct Request Body
    const requestBody = {
        contents: [{
            parts: [{ text: promptText }]
        }]
    };

    // If Textbook Mode, add the image!
    if (mode === 'textbook' && imageData) {
        // Strip the "data:image/png;base64," prefix
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];

        requestBody.contents[0].parts.unshift({
            inline_data: {
                mime_type: mimeType,
                data: base64Data
            }
        });

        // Add specific instruction for image analysis
        promptText += "\n\nZusätzliche Anweisung: Analysiere das hochgeladene Bild. Bezieht sich die Antwort des Schülers korrekt auf das, was im Bild zu sehen ist?";
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`API Error ${response.status}: ${txt}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// ... (History logic remains same) ...

function saveToHistory(scenario, answer, feedback) {
    const historyItem = {
        date: new Date().toLocaleString(),
        scenario: scenario.title,
        answer: answer,
        feedback: feedback
    };

    const history = JSON.parse(localStorage.getItem('english_exam_history') || '[]');
    history.unshift(historyItem); // Add to top
    localStorage.setItem('english_exam_history', JSON.stringify(history));

    addHistoryItemToDOM(historyItem);
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('english_exam_history') || '[]');
    historyList.innerHTML = ''; // Clear default msg
    if (history.length === 0) {
        historyList.innerHTML = '<p class="status-text neutral">No exams completed yet.</p>';
        return;
    }
    history.forEach(addHistoryItemToDOM);
}

function addHistoryItemToDOM(item) {
    const noMsg = document.getElementById('no-history-msg');
    if (noMsg) noMsg.remove();

    const div = document.createElement('div');
    div.className = 'history-item';

    div.innerHTML = `
        <h4>${item.scenario}</h4>
        <div class="history-meta">${item.date}</div>
        <div><strong>Answer:</strong> <em>"${item.answer.substring(0, 100)}${item.answer.length > 100 ? '...' : ''}"</em></div>
        <div class="history-feedback">
            <details>
                <summary>View Feedback</summary>
                <div style="margin-top:10px">${marked.parse(item.feedback)}</div>
            </details>
        </div>
    `;

    historyList.insertBefore(div, historyList.firstChild);
}

function clearHistory() {
    if (confirm("Clear all exam history?")) {
        localStorage.removeItem('english_exam_history');
        loadHistory();
    }
}

init();
