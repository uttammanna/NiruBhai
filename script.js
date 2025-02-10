class TypingTest {
    constructor() {
        // Initialize DOM elements
        this.textDisplay = document.getElementById('textDisplay');
        this.textInput = document.getElementById('textInput');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        this.timeBtns = document.querySelectorAll('.time-btn');
        this.progress = document.querySelector('.progress');
        this.resultModal = document.getElementById('resultModal');
        this.themeToggle = document.getElementById('themeToggle');
        
        // Initialize stat elements
        this.timeDisplay = document.getElementById('time');
        this.wpmDisplay = document.getElementById('wpm');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.errorsDisplay = document.getElementById('errors');
        
        // Initialize state
        this.currentText = '';
        this.typedCharacters = 0;
        this.errors = 0;
        this.startTime = null;
        this.timer = null;
        this.isPaused = false;
        this.elapsedTime = 0;
        this.currentDifficulty = 'easy';
        this.selectedTime = 60;
        this.timeLimit = 60;
        this.isTimeUp = false;
        this.hasStarted = false;
        this.inactivityTimer = null;

        // Word lists for random paragraph generation
        this.commonWords = [
            "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", 
            "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", 
            "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", 
            "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", 
            "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", 
            "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", 
            "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
        ];

        this.transitions = [
            ", ", ". ", "! ", "? ", "; ", ": ", " - ", ". However, ", ". Moreover, ", ". In addition, ", 
            ". Furthermore, ", ". Nevertheless, ", ". Consequently, ", ". As a result, ", ". Therefore, ",
            ". Meanwhile, ", ". Subsequently, ", ". In contrast, ", ". For instance, ", ". In fact, "
        ];

        // Initialize theme
        this.theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', this.theme);

        // Initialize the test
        this.initializeEventListeners();
        this.setRandomText();
        this.displayText();
        this.setupAutoStart();
        this.setupThemeToggle();
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startTest());
        this.resetBtn.addEventListener('click', () => this.resetTest());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.textInput.addEventListener('input', () => this.handleInput());
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setDifficulty(btn.dataset.difficulty));
        });

        this.timeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setTimeLimit(parseInt(btn.dataset.time)));
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.resultModal.classList.remove('show');
            this.resetTest();
        });
    }

    setupAutoStart() {
        document.addEventListener('keydown', (e) => {
            if (!this.hasStarted && e.code === 'Space') {
                e.preventDefault();
                this.startTest();
            }
        });

        let inactivityTimeout = null;
        
        document.addEventListener('keydown', () => {
            if (!this.hasStarted || this.isTimeUp) return;

            if (inactivityTimeout) {
                clearTimeout(inactivityTimeout);
            }

            if (this.isPaused) {
                this.togglePause();
            }

            inactivityTimeout = setTimeout(() => {
                if (this.hasStarted && !this.isPaused && !this.isTimeUp) {
                    this.togglePause();
                }
            }, 6000);
        });
    }

    setupThemeToggle() {
        this.themeToggle.addEventListener('click', () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.theme);
            localStorage.setItem('theme', this.theme);
        });
    }

    generateRandomParagraph(length = 5000) {
        let paragraph = '';
        let currentLength = 0;
        let sentenceLength = 0;
        let wordsInCurrentSentence = 0;

        while (currentLength < length) {
            let word = this.commonWords[Math.floor(Math.random() * this.commonWords.length)];
            
            if (wordsInCurrentSentence === 0) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }

            paragraph += word;
            currentLength += word.length;
            sentenceLength += word.length;
            wordsInCurrentSentence++;

            if (wordsInCurrentSentence >= 8 || Math.random() < 0.2) {
                let transition = this.transitions[Math.floor(Math.random() * this.transitions.length)];
                paragraph += transition;
                currentLength += transition.length;
                
                if (transition.includes('.') || transition.includes('!') || transition.includes('?')) {
                    sentenceLength = 0;
                    wordsInCurrentSentence = 0;
                } else {
                    paragraph += ' ';
                    currentLength += 1;
                }
            } else {
                paragraph += ' ';
                currentLength += 1;
            }
        }

        if (!paragraph.endsWith('.')) {
            paragraph = paragraph.trim() + '.';
        }

        return paragraph;
    }

    setRandomText() {
        this.currentText = this.generateRandomParagraph(5000);
    }

    displayText() {
        this.textDisplay.innerHTML = this.currentText.split('').map(char => 
            `<span>${char}</span>`
        ).join('');
    }

    startTest() {
        if (this.hasStarted) return;
        
        this.hasStarted = true;
        this.textInput.value = '';
        this.textInput.disabled = false;
        this.startBtn.disabled = true;
        this.resetBtn.disabled = false;
        this.pauseBtn.disabled = false;
        this.typedCharacters = 0;
        this.errors = 0;
        this.startTime = new Date();
        this.elapsedTime = 0;
        this.isPaused = false;
        this.isTimeUp = false;
        
        this.updateTimer();
        this.textInput.focus();
    }

    resetTest() {
        clearInterval(this.timer);
        
        this.hasStarted = false;
        this.textInput.value = '';
        this.textInput.disabled = false;
        this.startBtn.disabled = false;
        this.resetBtn.disabled = true;
        this.pauseBtn.disabled = true;
        this.typedCharacters = 0;
        this.errors = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isPaused = false;
        this.isTimeUp = false;
        
        this.updateStats();
        this.setRandomText();
        this.displayText();
        this.progress.style.width = '0%';
        this.timeDisplay.textContent = this.formatTime(this.timeLimit);
    }

    togglePause() {
        if (!this.hasStarted || this.isTimeUp) return;
        
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        this.textInput.disabled = this.isPaused;
        
        if (this.isPaused) {
            clearInterval(this.timer);
        } else {
            this.startTime = new Date() - this.elapsedTime * 1000;
            this.updateTimer();
            this.textInput.focus();
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            if (!this.isPaused) {
                const currentTime = new Date();
                this.elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
                const timeLeft = this.timeLimit - this.elapsedTime;
                
                if (timeLeft <= 0 && !this.isTimeUp) {
                    this.isTimeUp = true;
                    this.finishTest();
                    return;
                }

                this.timeDisplay.textContent = this.formatTime(timeLeft);
                this.updateStats();
            }
        }, 1000);
    }

    handleInput() {
        if (!this.hasStarted || this.isTimeUp) return;
        
        const inputText = this.textInput.value;
        const textArray = this.currentText.split('');
        
        // Reset all spans to their original state
        this.textDisplay.querySelectorAll('span').forEach((span, i) => {
            span.className = '';
        });
        
        let correctChars = 0;
        let errors = 0;
        
        // Compare each character and update the display
        for (let i = 0; i < inputText.length; i++) {
            const span = this.textDisplay.querySelectorAll('span')[i];
            if (!span) break;
            
            if (inputText[i] === textArray[i]) {
                span.className = 'correct';
                correctChars++;
            } else {
                span.className = 'incorrect';
                errors++;
            }
        }
        
        // Highlight the current character
        const currentSpan = this.textDisplay.querySelectorAll('span')[inputText.length];
        if (currentSpan) {
            currentSpan.className = 'current';
        }
        
        // Auto-scroll the text display to keep the current character visible
        if (currentSpan) {
            const textDisplayRect = this.textDisplay.getBoundingClientRect();
            const spanRect = currentSpan.getBoundingClientRect();
            
            if (spanRect.bottom > textDisplayRect.bottom) {
                this.textDisplay.scrollTop += spanRect.bottom - textDisplayRect.bottom + 20;
            } else if (spanRect.top < textDisplayRect.top) {
                this.textDisplay.scrollTop -= textDisplayRect.top - spanRect.top + 20;
            }
        }
        
        this.typedCharacters = inputText.length;
        this.errors = errors;
        
        // Update statistics
        this.updateStats();
        this.updateProgress(inputText.length / this.currentText.length * 100);
        
        // Check if the test is complete
        if (inputText.length === this.currentText.length) {
            this.finishTest();
        }
    }

    updateStats() {
        const timeInMinutes = this.elapsedTime / 60;
        const wordsTyped = this.typedCharacters / 5;
        const wpm = Math.round(timeInMinutes > 0 ? wordsTyped / timeInMinutes : 0);
        const accuracy = Math.round(((this.typedCharacters - this.errors) / this.typedCharacters) * 100) || 100;

        this.wpmDisplay.textContent = wpm;
        this.accuracyDisplay.textContent = accuracy + '%';
        this.errorsDisplay.textContent = this.errors;
    }

    updateProgress(percentage) {
        this.progress.style.width = percentage + '%';
    }

    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.difficultyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        this.resetTest();
    }

    setTimeLimit(seconds) {
        this.timeLimit = seconds;
        this.selectedTime = seconds;
        this.timeBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.time) === seconds);
        });
        this.resetTest();
    }

    finishTest() {
        this.isTimeUp = true;
        clearInterval(this.timer);
        this.textInput.disabled = true;
        
        document.getElementById('finalWpm').textContent = this.wpmDisplay.textContent;
        document.getElementById('finalAccuracy').textContent = this.accuracyDisplay.textContent;
        document.getElementById('finalErrors').textContent = this.errors;
        document.getElementById('finalChars').textContent = this.typedCharacters;
        
        this.resultModal.classList.add('show');
    }
}

// Initialize the typing test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TypingTest();
});
