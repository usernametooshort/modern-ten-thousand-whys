import { vocabData } from './data.js';

class FrenchQuiz {
    constructor() {
        this.currentLang = 'de'; // Default to German context for Gymnasium
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.wrongAnswers = []; // Stores { question, userAnswer, correctAnswer }
        this.timer = null;
        this.timeLeft = 10;
        this.isRetryMode = false;

        // UI Text Resources
        this.i18n = {
            zh: {
                title: "法语词汇特训",
                subtitle: "Guten Tag! 我是你的法语老师。让我们通过测试来巩固Unit 1 & 2的词汇吧。",
                startBtn: "开始测试",
                retryBtn: "攻克错题 (直到100%)",
                scoreLabel: "最终得分",
                questionLabel: "请选择对应的法语单词：",
                nextBtn: "下一题",
                timeOut: "时间到！",
                resultTitle: "测试完成",
                perfectScore: "太棒了！满分掌握！",
                reviewList: "错题回顾"
            },
            de: {
                title: "Französisch Vokabeltrainer",
                subtitle: "Bonjour! Ich bin Ihr Französischlehrer. Lassen Sie uns die Vokabeln der Einheiten 1 & 2 festigen.",
                startBtn: "Test Starten",
                retryBtn: "Fehler wiederholen (bis 100%)",
                scoreLabel: "Endpunktzahl",
                questionLabel: "Wähle das passende französische Wort:",
                nextBtn: "Nächste Frage",
                timeOut: "Zeit abgelaufen!",
                resultTitle: "Test beendet",
                perfectScore: "Fantastisch! Alles richtig!",
                reviewList: "Fehlerüberprüfung"
            },
            en: {
                title: "French Vocab Drill",
                subtitle: "Bonjour! I'm your French teacher. Let's master the vocabulary from Units 1 & 2.",
                startBtn: "Start Quiz",
                retryBtn: "Retry Mistakes (Until 100%)",
                scoreLabel: "Final Score",
                questionLabel: "Select the corresponding French word:",
                nextBtn: "Next Question",
                timeOut: "Time's up!",
                resultTitle: "Quiz Complete",
                perfectScore: "Perfect! 100% Mastery!",
                reviewList: "Review Mistakes"
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUIText();
    }

    bindEvents() {
        // Lang Switchers
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setLanguage(e.target.dataset.lang);
            });
        });

        // Game Controls
        document.getElementById('start-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.startRetryGame());
        document.getElementById('home-btn').addEventListener('click', () => this.showScreen('start-screen'));
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
        document.getElementById('question-label').textContent = t.questionLabel;
        document.getElementById('result-title').textContent = t.resultTitle;
    }

    // --- Game Logic ---

    startNewGame() {
        // Shuffle all data
        this.questions = this.shuffleArray([...vocabData]);
        this.isRetryMode = false;
        this.resetGameState();
        this.startQuizLoop();
    }

    startRetryGame() {
        // Use only wrong answers from previous round
        // Map back to original objects
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
            this.showQuestion(this.questions[this.currentQuestionIndex]);
        } else {
            this.endGame();
        }
    }

    showQuestion(questionObj) {
        // Reset UI
        const optionsGrid = document.getElementById('options-grid');
        optionsGrid.innerHTML = '';
        document.getElementById('timer-bar').style.width = '100%';

        // Target Word (Prompt in current UI language, e.g. German)
        let promptText = "";
        if (this.currentLang === 'de') promptText = questionObj.german;
        else if (this.currentLang === 'zh') promptText = questionObj.chinese;
        else promptText = questionObj.english;

        document.getElementById('target-word').textContent = promptText;
        document.getElementById('progress-text').textContent = `${this.currentQuestionIndex + 1} / ${this.questions.length}`;

        // Create Options (Correct + 3 Distractors)
        // Distractors must be of same type if possible
        const distractors = vocabData
            .filter(item => item.id !== questionObj.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        const options = this.shuffleArray([questionObj, ...distractors]);

        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'option-btn';
            btn.textContent = opt.french;
            btn.onclick = () => this.handleAnswer(questionObj, opt, btn);
            optionsGrid.appendChild(btn);
        });

        // Start Timer
        this.timeLeft = 10; // 15 seconds per question? No, user said "timed". 10s is good pressure.
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft -= 0.1;
            document.getElementById('timer-bar').style.width = `${(this.timeLeft / 10) * 100}%`;
            if (this.timeLeft <= 0) {
                this.handleTimeout(questionObj);
            }
        }, 100);
    }

    handleAnswer(questionObj, selectedOption, btnElement) {
        clearInterval(this.timer);

        // Prevent multiple clicks
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.onclick = null);

        const isCorrect = selectedOption.id === questionObj.id;

        if (isCorrect) {
            btnElement.classList.add('correct');
            this.score++;
        } else {
            btnElement.classList.add('wrong');
            // Highlight correct one
            allBtns.forEach(b => {
                if (b.textContent === questionObj.french) b.classList.add('correct');
            });
            this.wrongAnswers.push({
                questionObj: questionObj,
                userAnswer: selectedOption.french,
                correctAnswer: questionObj.french
            });
        }

        // Delay before next
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.startQuizLoop();
        }, 1500);
    }

    handleTimeout(questionObj) {
        clearInterval(this.timer);

        // Show correct answer
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => {
            if (b.textContent === questionObj.french) b.classList.add('correct');
            b.onclick = null;
        });

        this.wrongAnswers.push({
            questionObj: questionObj,
            userAnswer: "Time Out",
            correctAnswer: questionObj.french
        });

        setTimeout(() => {
            this.currentQuestionIndex++;
            this.startQuizLoop();
        }, 2000);
    }

    endGame() {
        this.showScreen('result-screen');
        const t = this.i18n[this.currentLang];

        const percentage = Math.round((this.score / this.questions.length) * 100); // FIXED: score calculation
        document.getElementById('final-score').textContent = `${percentage}%`;

        // Show Wrong List
        const wrongListEl = document.getElementById('wrong-list');
        wrongListEl.innerHTML = '';
        if (this.wrongAnswers.length > 0) {
            this.wrongAnswers.forEach(item => {
                const div = document.createElement('div');
                div.className = 'wrong-item';
                // Show Prompt (based on lang) -> Correct French
                let prompt = "";
                if (this.currentLang === 'de') prompt = item.questionObj.german;
                else if (this.currentLang === 'zh') prompt = item.questionObj.chinese;
                else prompt = item.questionObj.english;

                div.innerHTML = `
                    <span>${prompt}</span>
                    <span class="correct-answer">${item.correctAnswer}</span>
                `;
                wrongListEl.appendChild(div);
            });
            document.getElementById('retry-btn').classList.remove('hidden');
        } else {
            wrongListEl.innerHTML = `<div style="text-align:center; padding:1rem;">${t.perfectScore}</div>`;
            document.getElementById('retry-btn').classList.add('hidden');
        }
    }

    // --- Helpers ---
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new FrenchQuiz();
});
