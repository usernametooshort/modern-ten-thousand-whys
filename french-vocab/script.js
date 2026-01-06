import { vocabData } from './data.js';

class FrenchQuiz {
    constructor() {
        this.currentLang = 'de';
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];
        this.timer = null;
        this.timeLeft = 15; // Increased for typing
        this.isRetryMode = false;
        this.currentMode = 'spelling'; // 'spelling' or 'judgment'

        // UI Text
        this.i18n = {
            zh: {
                title: "法语词汇特训",
                subtitle: "Challenge: 拼写与快速判断 (Unit 1 & 2)",
                startBtn: "开始挑战",
                retryBtn: "攻克错题 (直到100%)",
                scoreLabel: "最终得分",
                questionLabel_spelling: "请拼写出对应的单词：",
                questionLabel_judgment: "判断对错：",
                nextBtn: "下一题",
                timeOut: "时间到！",
                resultTitle: "测试完成",
                perfectScore: "完美！全部掌握！",
                reviewList: "错题回顾",
                correct: "正确！",
                wrong: "错误！正确答案：",
                tf_true: "正确",
                tf_false: "错误",
                placeholder: "在此输入法语..."
            },
            de: {
                title: "Französisch Vokabeltrainer",
                subtitle: "Challenge: Schreiben & Urteilen (Unit 1 & 2)",
                startBtn: "Test Starten",
                retryBtn: "Fehler wiederholen (bis 100%)",
                scoreLabel: "Endpunktzahl",
                questionLabel_spelling: "Schreiben Sie das Wort:",
                questionLabel_judgment: "Richtig oder Falsch?",
                nextBtn: "Nächste Frage",
                timeOut: "Zeit abgelaufen!",
                resultTitle: "Test beendet",
                perfectScore: "Fantastisch! Alles richtig!",
                reviewList: "Fehlerüberprüfung",
                correct: "Richtig!",
                wrong: "Falsch! Lösung: ",
                tf_true: "Richtig",
                tf_false: "Falsch",
                placeholder: "Französisch eingeben..."
            },
            en: {
                title: "French Vocab Drill",
                subtitle: "Challenge: Spelling & Judgment (Unit 1 & 2)",
                startBtn: "Start Quiz",
                retryBtn: "Retry Mistakes (Until 100%)",
                scoreLabel: "Final Score",
                questionLabel_spelling: "Type the French word:",
                questionLabel_judgment: "True or False?",
                nextBtn: "Next Question",
                timeOut: "Time's up!",
                resultTitle: "Quiz Complete",
                perfectScore: "Perfect! 100% Mastery!",
                reviewList: "Review Mistakes",
                correct: "Correct!",
                wrong: "Wrong! Answer: ",
                tf_true: "True",
                tf_false: "False",
                placeholder: "Type French here..."
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUIText();

        // Expose insertChar globally for onclick inline handlers
        window.insertChar = (char) => {
            const input = document.getElementById('vocab-input');
            input.value += char;
            input.focus();
        };
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

        // Input Submission
        document.getElementById('submit-input-btn').addEventListener('click', () => this.handleSpellingSubmit());
        document.getElementById('vocab-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSpellingSubmit();
        });

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
    }

    // --- Game Logic ---

    startNewGame() {
        this.questions = this.shuffleArray([...vocabData]);
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
        // Randomly choose mode: 60% Spelling (harder), 40% Judgment (faster)
        const isSpelling = Math.random() > 0.4;
        this.currentMode = isSpelling ? 'spelling' : 'judgment';

        // Reset UI
        document.getElementById('input-container').classList.add('hidden');
        document.getElementById('tf-container').classList.add('hidden');
        document.getElementById('feedback-msg').textContent = '';
        document.getElementById('feedback-msg').className = 'feedback-msg hidden';
        document.getElementById('vocab-input').value = '';
        document.getElementById('vocab-input').classList.remove('error');
        document.getElementById('secondary-clue').classList.add('hidden');
        document.getElementById('timer-bar').style.width = '100%';

        const t = this.i18n[this.currentLang];

        // Get Prompt (Target Language)
        let promptText = "";
        if (this.currentLang === 'de') promptText = questionObj.german;
        else if (this.currentLang === 'zh') promptText = questionObj.chinese;
        else promptText = questionObj.english;

        // Common Setup
        document.getElementById('progress-text').textContent = `${this.currentQuestionIndex + 1} / ${this.questions.length}`;

        if (this.currentMode === 'spelling') {
            // SPELLING MODE
            document.getElementById('question-label').textContent = t.questionLabel_spelling;
            document.getElementById('target-word').textContent = promptText;
            document.getElementById('input-container').classList.remove('hidden');
            document.getElementById('vocab-input').focus();
            this.timeLeft = 15; // More time for typing

        } else {
            // JUDGMENT MODE
            document.getElementById('question-label').textContent = t.questionLabel_judgment;

            // Decid if we show Correct or Wrong pair
            this.judgmentTargetIsCorrect = Math.random() > 0.5;
            let displayFrench = "";

            if (this.judgmentTargetIsCorrect) {
                displayFrench = questionObj.french;
            } else {
                // Pick a distractor
                const distractor = vocabData.find(i => i.id !== questionObj.id && i.type === questionObj.type) || vocabData[0];
                displayFrench = distractor.french;
            }

            document.getElementById('target-word').textContent = `${promptText} = ${displayFrench} ?`;
            document.getElementById('tf-container').classList.remove('hidden');
            this.timeLeft = 8; // Less time for judgment
        }

        // Start Timer
        clearInterval(this.timer);
        const maxTime = this.timeLeft;
        this.timer = setInterval(() => {
            this.timeLeft -= 0.1;
            document.getElementById('timer-bar').style.width = `${(this.timeLeft / maxTime) * 100}%`;
            if (this.timeLeft <= 0) {
                this.handleTimeout(questionObj);
            }
        }, 100);
    }

    // --- Handling Answers ---

    handleSpellingSubmit() {
        const input = document.getElementById('vocab-input').value.trim().toLowerCase();
        const currentQ = this.questions[this.currentQuestionIndex];
        const correct = currentQ.french.toLowerCase();

        // Simple normalization (ignore punctuation case but strict on accents)
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
        const t = this.i18n[this.currentLang];
        const feedbackEl = document.getElementById('feedback-msg');
        feedbackEl.classList.remove('hidden');

        if (isCorrect) {
            this.score++;
            feedbackEl.textContent = t.correct;
            feedbackEl.classList.add('correct');
            feedbackEl.classList.remove('wrong');
        } else {
            feedbackEl.textContent = `${t.wrong}${questionObj.french}`;
            feedbackEl.classList.add('wrong');
            feedbackEl.classList.remove('correct');
            document.getElementById('vocab-input').classList.add('error');

            this.wrongAnswers.push({
                questionObj: questionObj,
                userAnswer: userAns,
                correctAnswer: questionObj.french
            });
        }

        // Delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.startQuizLoop();
        }, 2000);
    }

    handleTimeout(questionObj) {
        clearInterval(this.timer);
        const t = this.i18n[this.currentLang];
        const feedbackEl = document.getElementById('feedback-msg');
        feedbackEl.classList.remove('hidden');
        feedbackEl.classList.add('wrong');
        feedbackEl.textContent = `${t.timeOut} ${t.wrong}${questionObj.french}`;

        this.wrongAnswers.push({
            questionObj: questionObj,
            userAnswer: "TIMEOUT",
            correctAnswer: questionObj.french
        });

        setTimeout(() => {
            this.currentQuestionIndex++;
            this.startQuizLoop();
        }, 2500);
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
                else if (this.currentLang === 'zh') prompt = item.questionObj.chinese;
                else prompt = item.questionObj.english;

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
