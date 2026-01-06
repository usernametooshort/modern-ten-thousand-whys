import { vocabData } from './data.js';

class FrenchQuiz {
    constructor() {
        this.currentLang = 'de';
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];
        this.timer = null;
        this.timeLeft = 45; // Default extended
        this.isRetryMode = false;
        this.currentMode = 'spelling'; // 'spelling' or 'judgment'

        // Scope Limit: Only use items from first 3 pages (ID < 158 for safe margin, let's say ID <= 157)
        // Adjust ID limit based on user request "limit to these 3 pages". 
        // Page 184 ends at ID 157.
        this.fullData = vocabData.filter(item => item.id <= 157);

        // UI Text
        this.i18n = {
            zh: {
                title: "法语词汇特训",
                subtitle: "Challenge: 拼写与快速判断 (Unit 1 & 2 Limited)",
                startBtn: "开始挑战",
                retryBtn: "攻克错题 (直到100%)",
                scoreLabel: "最终得分",
                questionLabel_spelling: "请使用下方键盘拼写单词：",
                questionLabel_judgment: "判断对错：",
                nextBtn: "下一题 ➝",
                timeOut: "时间到！",
                resultTitle: "测试完成",
                perfectScore: "完美！全部掌握！",
                reviewList: "错题回顾",
                correct: "正确！",
                wrong: "错误！正确答案：",
                tf_true: "正确",
                tf_false: "错误",
                placeholder: "点击按键输入..."
            },
            de: {
                title: "Französisch Vokabeltrainer",
                subtitle: "Challenge: Schreiben & Urteilen (Unit 1 & 2 Limitiert)",
                startBtn: "Test Starten",
                retryBtn: "Fehler wiederholen (bis 100%)",
                scoreLabel: "Endpunktzahl",
                questionLabel_spelling: "Benutzen Sie die Tastatur:",
                questionLabel_judgment: "Richtig oder Falsch?",
                nextBtn: "Nächste Frage ➝",
                timeOut: "Zeit abgelaufen!",
                resultTitle: "Test beendet",
                perfectScore: "Fantastisch! Alles richtig!",
                reviewList: "Fehlerüberprüfung",
                correct: "Richtig!",
                wrong: "Falsch! Lösung: ",
                tf_true: "Richtig",
                tf_false: "Falsch",
                placeholder: "Tippen Sie hier...",
            },
            en: {
                title: "French Vocab Drill",
                subtitle: "Challenge: Spelling & Judgment (Limit Unit 1&2)",
                startBtn: "Start Quiz",
                retryBtn: "Retry Mistakes (Until 100%)",
                scoreLabel: "Final Score",
                questionLabel_spelling: "Use the keyboard to type:",
                questionLabel_judgment: "True or False?",
                nextBtn: "Next Question ➝",
                timeOut: "Time's up!",
                resultTitle: "Quiz Complete",
                perfectScore: "Perfect! 100% Mastery!",
                reviewList: "Review Mistakes",
                correct: "Correct!",
                wrong: "Wrong! Answer: ",
                tf_true: "True",
                tf_false: "False",
                placeholder: "Tap keys to type..."
            }
        };

        this.init();
    }

    init() {
        this.renderVirtualKeyboard();
        this.bindEvents();
        this.updateUIText();
    }

    renderVirtualKeyboard() {
        const keyboardContainer = document.getElementById('virtual-keyboard');
        keyboardContainer.innerHTML = '';

        const rows = [
            ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï'],
            ['ô', 'ù', 'û', 'ü', 'BACKSPACE'],
            ['SPACE', 'ENTER'] // a simple layout + basic AZERTY letters?
            // User asked for "Virtual keyboard" because native suggestions are annoying.
            // Usually this means a FULL keyboard. Let's do a simple QWERTY/AZERTY hybrid or just ABCs?
            // Let's implement a standard AZERTY-ish layout row by row for French.
        ];

        // Let's do a standard layout:
        const azertyRows = [
            "azertyuiop".split(''),
            "qsdfghjklm".split(''),
            "wxcvbn-".split(''), // + hyphen
            ['é', 'è', 'à', 'ù', 'ç'], // Common accents
            ['SPACE', 'BACKSPACE', 'ENTER']
        ];

        azertyRows.forEach(rowKeys => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            rowKeys.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'key-btn';

                if (key === 'SPACE') {
                    btn.textContent = '⎵';
                    btn.classList.add('key-space');
                    btn.onclick = () => this.handleKeyInput(' ');
                } else if (key === 'BACKSPACE') {
                    btn.textContent = '⌫';
                    btn.classList.add('key-backspace');
                    btn.onclick = () => this.handleBackspace();
                } else if (key === 'ENTER') {
                    btn.textContent = '↵';
                    btn.classList.add('key-enter');
                    btn.onclick = () => this.handleSpellingSubmit();
                } else {
                    btn.textContent = key;
                    if (['é', 'è', 'à', 'ù', 'ç'].includes(key)) {
                        btn.classList.add('key-accent');
                    }
                    btn.onclick = () => this.handleKeyInput(key);
                }
                rowDiv.appendChild(btn);
            });
            keyboardContainer.appendChild(rowDiv);
        });
    }

    handleKeyInput(char) {
        const input = document.getElementById('vocab-input');
        input.value += char;
        // Keep focus away from input to prevent native keyboard? 
        // Actually input is readonly, so it won't show keyboard anyway.
    }

    handleBackspace() {
        const input = document.getElementById('vocab-input');
        input.value = input.value.slice(0, -1);
    }

    bindEvents() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setLanguage(e.target.dataset.lang);
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.startRetryGame());
        document.getElementById('home-btn').addEventListener('click', () => this.showScreen('start-screen'));
        document.getElementById('next-question-btn').addEventListener('click', () => this.advanceQuestion());

        // TF Buttons
        document.getElementById('btn-true').addEventListener('click', () => this.handleJudgmentSubmit(true));
        document.getElementById('btn-false').addEventListener('click', () => this.handleJudgmentSubmit(false));
    }

    setLanguage(lang) {
        this.currentLang = lang;
        this.updateUIText();
    }

    updateUIText() {
        const t = this.i18n[this.currentLang];
        document.querySelector('h1').textContent = t.title;
        document.querySelector('.subtitle').textContent = t.subtitle;
        document.getElementById('start-btn').textContent = t.startBtn;
        document.getElementById('retry-btn').textContent = t.retryBtn;
        document.getElementById('result-title').textContent = t.resultTitle;
        document.getElementById('btn-true').textContent = t.tf_true;
        document.getElementById('btn-false').textContent = t.tf_false;
        document.getElementById('vocab-input').placeholder = t.placeholder;
        document.getElementById('next-question-btn').textContent = t.nextBtn;
    }

    // --- Game Logic ---

    startNewGame() {
        // Use full filtered data
        this.questions = this.shuffleArray([...this.fullData]);
        this.isRetryMode = false;
        this.resetGameState();
        this.startQuizLoop();
    }

    startRetryGame() {
        this.questions = this.wrongAnswers.map(w => w.questionObj);
        this.isRetryMode = true;
        this.resetGameState();
        this.startQuizLoop();
    }

    resetGameState() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];
        this.showScreen('quiz-screen');
    }

    startQuizLoop() {
        if (this.currentQuestionIndex < this.questions.length) {
            this.prepareQuestion(this.questions[this.currentQuestionIndex]);
        } else {
            this.endGame();
        }
    }

    prepareQuestion(questionObj) {
        // Mode logic: 60% Spelling
        const isSpelling = Math.random() > 0.4;
        this.currentMode = isSpelling ? 'spelling' : 'judgment';

        // Reset UI
        document.getElementById('input-container').classList.add('hidden');
        document.getElementById('tf-container').classList.add('hidden');
        document.getElementById('feedback-area').classList.add('hidden'); // Hide container
        document.getElementById('feedback-msg').textContent = '';
        document.getElementById('feedback-msg').className = 'feedback-msg';
        document.getElementById('vocab-input').value = '';
        document.getElementById('vocab-input').classList.remove('error');
        document.getElementById('timer-bar').style.width = '100%';

        const t = this.i18n[this.currentLang];

        // Prompt
        let promptText = "";
        if (this.currentLang === 'de') promptText = questionObj.german;
        else if (this.currentLang === 'zh') promptText = questionObj.chinese || questionObj.german; // Fallback if no chinese
        else promptText = questionObj.english || questionObj.german;

        document.getElementById('progress-text').textContent = `${this.currentQuestionIndex + 1} / ${this.questions.length}`;

        if (this.currentMode === 'spelling') {
            document.getElementById('question-label').textContent = t.questionLabel_spelling;
            document.getElementById('target-word').textContent = promptText;
            document.getElementById('input-container').classList.remove('hidden');
            this.timeLeft = 45; // Increased time
        } else {
            document.getElementById('question-label').textContent = t.questionLabel_judgment;

            this.judgmentTargetIsCorrect = Math.random() > 0.5;
            let displayFrench = "";

            if (this.judgmentTargetIsCorrect) {
                displayFrench = questionObj.french;
            } else {
                // Distractor from LIMITED scope (this.fullData)
                const distractor = this.fullData.find(i => i.id !== questionObj.id && i.type === questionObj.type) || this.fullData[0];
                displayFrench = distractor.french;
            }

            document.getElementById('target-word').textContent = `${promptText} = ${displayFrench} ?`;
            document.getElementById('tf-container').classList.remove('hidden');
            this.timeLeft = 20; // Increased time
        }

        // Start Timer
        clearInterval(this.timer);
        const maxTime = this.timeLeft;
        this.timer = setInterval(() => {
            this.timeLeft -= 0.1;
            document.getElementById('timer-bar').style.width = `${Math.max(0, (this.timeLeft / maxTime) * 100)}%`;
            if (this.timeLeft <= 0) {
                this.handleTimeout(questionObj);
            }
        }, 100);
    }

    // --- Handling Answers ---

    handleSpellingSubmit() {
        const input = document.getElementById('vocab-input').value.trim().toLowerCase();
        // Allow empty check? No, must type something? allowed.
        const currentQ = this.questions[this.currentQuestionIndex];
        const correct = currentQ.french.toLowerCase();

        if (input === correct) {
            this.processResult(true, currentQ);
        } else {
            this.processResult(false, currentQ, input);
        }
    }

    handleJudgmentSubmit(userSaidTrue) {
        const currentQ = this.questions[this.currentQuestionIndex];
        const isCorrect = (userSaidTrue === this.judgmentTargetIsCorrect);
        this.processResult(isCorrect, currentQ, userSaidTrue ? "True" : "False");
    }

    processResult(isCorrect, questionObj, userAns = "") {
        clearInterval(this.timer);
        this.renderFeedback(isCorrect, questionObj);

        if (isCorrect) {
            this.score++;
        } else {
            this.wrongAnswers.push({
                questionObj: questionObj,
                userAnswer: userAns,
                correctAnswer: questionObj.french
            });
        }
        // WAIT for manual advance
    }

    handleTimeout(questionObj) {
        clearInterval(this.timer);
        const t = this.i18n[this.currentLang];
        const area = document.getElementById('feedback-area');
        const msg = document.getElementById('feedback-msg');

        area.classList.remove('hidden');
        msg.textContent = `${t.timeOut} ${t.wrong}${questionObj.french}`;
        msg.classList.add('wrong');

        this.wrongAnswers.push({
            questionObj: questionObj,
            userAnswer: "TIMEOUT",
            correctAnswer: questionObj.french
        });
    }

    renderFeedback(isCorrect, questionObj) {
        const t = this.i18n[this.currentLang];
        const area = document.getElementById('feedback-area');
        const msg = document.getElementById('feedback-msg');
        area.classList.remove('hidden');

        if (isCorrect) {
            msg.textContent = t.correct;
            msg.classList.add('correct');
            msg.classList.remove('wrong');
        } else {
            msg.textContent = `${t.wrong}${questionObj.french}`;
            msg.classList.add('wrong');
            msg.classList.remove('correct');
            document.getElementById('vocab-input').classList.add('error');
        }
    }

    advanceQuestion() {
        this.currentQuestionIndex++;
        this.startQuizLoop();
    }

    // --- End Game ---

    endGame() {
        this.showScreen('result-screen');
        const t = this.i18n[this.currentLang];

        const percentage = Math.round((this.score / this.questions.length) * 100);
        document.getElementById('final-score').textContent = `${percentage}%`;

        const wrongListEl = document.getElementById('wrong-list');
        wrongListEl.innerHTML = '';
        if (this.wrongAnswers.length > 0) {
            this.wrongAnswers.forEach(item => {
                const div = document.createElement('div');
                div.className = 'wrong-item';
                let prompt = "";
                if (this.currentLang === 'de') prompt = item.questionObj.german;
                else if (this.currentLang === 'zh') prompt = item.questionObj.chinese || item.questionObj.german;
                else prompt = item.questionObj.english || item.questionObj.german;

                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span style="color:#aaa;">${prompt}</span>
                        <span class="correct-answer">${item.correctAnswer}</span>
                    </div>
                `;
                wrongListEl.appendChild(div);
            });
            document.getElementById('retry-btn').classList.remove('hidden');
        } else {
            wrongListEl.innerHTML = `<div style="text-align:center; padding:1rem;">${t.perfectScore}</div>`;
            document.getElementById('retry-btn').classList.add('hidden');
        }
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FrenchQuiz();
});
