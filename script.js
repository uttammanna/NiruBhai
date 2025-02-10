class TypingTest {
    constructor() {
        this.textDisplay = document.getElementById('textDisplay');
        this.textInput = document.getElementById('textInput');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        this.timeBtns = document.querySelectorAll('.time-btn');
        this.progress = document.querySelector('.progress');
        this.resultModal = document.getElementById('resultModal');
        
        this.timeDisplay = document.getElementById('time');
        this.wpmDisplay = document.getElementById('wpm');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.errorsDisplay = document.getElementById('errors');
        
        this.currentText = '';
        this.typedCharacters = 0;
        this.errors = 0;
        this.startTime = null;
        this.timer = null;
        this.isPaused = false;
        this.elapsedTime = 0;
        this.currentDifficulty = 'medium';
        this.selectedTime = 60;
        this.timeLimit = 60;
        this.isTimeUp = false;

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

        this.initializeEventListeners();
        this.setRandomText();
    }

    generateRandomParagraph(length = 5000) {
        let paragraph = '';
        let currentLength = 0;
        let sentenceLength = 0;
        let wordsInCurrentSentence = 0;

        while (currentLength < length) {
            // Add a word
            let word = this.commonWords[Math.floor(Math.random() * this.commonWords.length)];
            
            // Capitalize first word of sentence
            if (wordsInCurrentSentence === 0) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }

            paragraph += word;
            currentLength += word.length;
            sentenceLength += word.length;
            wordsInCurrentSentence++;

            // Decide whether to end sentence or add transition
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

        // Ensure proper ending
        if (!paragraph.endsWith('.')) {
            paragraph = paragraph.trim() + '.';
        }

        return paragraph;
    }

    setRandomText() {
        this.currentText = this.generateRandomParagraph(5000);
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startTest());
        this.resetBtn.addEventListener('click', () => this.resetTest());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.textInput.addEventListener('input', () => this.handleInput());
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDifficulty(btn.dataset.difficulty);
            });
        });

        this.timeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTimeLimit(parseInt(btn.dataset.time));
            });
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.resultModal.classList.remove('show');
        });
    }

    setTimeLimit(seconds) {
        this.timeLimit = seconds;
        this.selectedTime = seconds;
        this.timeBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.time) === seconds);
        });
        this.resetTest();
    }

    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.difficultyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        this.resetTest();
    }

    startTest() {
        this.setRandomText();
        this.displayText();
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
        this.textInput.value = '';
        this.textInput.disabled = true;
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
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        this.textInput.disabled = this.isPaused;
        if (!this.isPaused) {
            this.startTime = new Date() - this.elapsedTime * 1000;
            this.textInput.focus();
        }
    }

    updateTimer() {
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

                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                this.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                this.updateStats();
            }
        }, 1000);
    }

    displayText() {
        this.textDisplay.innerHTML = this.currentText.split('').map(char => 
            `<span>${char}</span>`
        ).join('');
    }

    handleInput() {
        const inputText = this.textInput.value;
        const textArray = this.currentText.split('');
        const inputArray = inputText.split('');
        
        let correctChars = 0;
        this.textDisplay.innerHTML = textArray.map((char, i) => {
            let className = '';
            if (i < inputArray.length) {
                className = inputArray[i] === char ? 'correct' : 'incorrect';
                if (className === 'correct') correctChars++;
            }
            if (i === inputArray.length) className = 'current';
            return `<span class="${className}">${char}</span>`;
        }).join('');

        this.typedCharacters = inputArray.length;
        this.errors = this.typedCharacters - correctChars;
        this.updateStats();
        this.updateProgress(inputText.length / this.currentText.length * 100);

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

    finishTest() {
        clearInterval(this.timer);
        this.textInput.disabled = true;
        this.showResults();
    }

    showResults() {
        const finalWpm = document.getElementById('finalWpm');
        const finalAccuracy = document.getElementById('finalAccuracy');
        const finalErrors = document.getElementById('finalErrors');
        const finalChars = document.getElementById('finalChars');

        finalWpm.textContent = this.wpmDisplay.textContent;
        finalAccuracy.textContent = this.accuracyDisplay.textContent;
        finalErrors.textContent = this.errors;
        finalChars.textContent = this.typedCharacters;

        this.resultModal.classList.add('show');
    }
}

// Initialize the typing test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TypingTest();
});
