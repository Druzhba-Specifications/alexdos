// js/programs.js

/**
 * An object containing additional programs for the ALEXDOS terminal.
 * The `this` context inside each function refers to the terminal instance.
 * The programs are self-contained and use `this.echo()` for output.
 */
const programCommands = {

    /**
     * A simple, in-terminal text editor.
     * Use `edit [filename]` to edit or create a new file.
     * The file content is stored in the virtual file system.
     */
    async edit(filename) {
        if (!filename) {
            this.error('Usage: edit [filename]');
            return;
        }

        const fullPath = backendCommands.fs.currentDir + '/' + filename;
        let fileContent = '';

        const parentDir = backendCommands.fs.getFile(backendCommands.fs.currentDir);
        if (parentDir && parentDir.contents[filename]) {
            fileContent = parentDir.contents[filename].contents;
            this.echo(`Loading '${filename}'. Type 'SAVE' to save, 'EXIT' to quit without saving.`);
        } else {
            this.echo(`Creating new file '${filename}'. Type 'SAVE' to save, 'EXIT' to quit.`);
        }

        this.push(
            function(command) {
                if (command.toUpperCase() === 'SAVE') {
                    if (parentDir) {
                        parentDir.contents[filename] = { type: 'file', contents: fileContent };
                        backendCommands.fs.saveState();
                        this.echo(`File '${filename}' saved.`);
                    }
                    this.pop();
                } else if (command.toUpperCase() === 'EXIT') {
                    this.echo(`Changes to '${filename}' discarded.`);
                    this.pop();
                } else {
                    fileContent += command + '\n';
                }
            }, {
                prompt: 'EDITOR> '
            }
        );
    },

    /**
     * Rock Paper Scissors game.
     * Use `rps` to play.
     */
    async rps(choice) {
        const choices = ['rock', 'paper', 'scissors'];
        const computerChoice = choices[Math.floor(Math.random() * choices.length)];

        if (!choice) {
            this.echo('Usage: rps <rock|paper|scissors>');
            return;
        }

        choice = choice.toLowerCase();
        if (!choices.includes(choice)) {
            this.error('Invalid choice. Please choose rock, paper, or scissors.');
            return;
        }

        this.echo(`You chose: ${choice}`);
        this.echo(`Computer chose: ${computerChoice}`);

        if (choice === computerChoice) {
            this.echo('It\'s a tie!');
        } else if (
            (choice === 'rock' && computerChoice === 'scissors') ||
            (choice === 'paper' && computerChoice === 'rock') ||
            (choice === 'scissors' && computerChoice === 'paper')
        ) {
            this.echo('You win!');
        } else {
            this.echo('You lose!');
        }
    },

    /**
     * A simple chat client that demonstrates basic messaging.
     * Note: This is not a real-time chat.
     */
    chat: async function() {
        const chatLogFile = 'chat.log';
        let chatLog = '';
        
        const homeDir = backendCommands.fs.getFile(backendCommands.fs.profiles[backendCommands.fs.user].home);
        if (homeDir && homeDir.contents[chatLogFile]) {
            chatLog = homeDir.contents[chatLogFile].contents;
        }

        this.echo('[[b;green;]ALEXDOS Chat]');
        this.echo('Type your message and press Enter.');
        this.echo('Type `EXIT` to leave chat.');
        this.echo('------------------------------');
        this.echo(chatLog);
        this.echo('------------------------------');

        this.push(
            function(message) {
                if (message.toUpperCase() === 'EXIT') {
                    if (homeDir) {
                        homeDir.contents[chatLogFile] = { type: 'file', contents: chatLog };
                        backendCommands.fs.saveState();
                    }
                    this.echo('Chat session ended.');
                    this.pop();
                } else {
                    const timestamp = new Date().toLocaleTimeString();
                    const userMessage = `[[b;white;]${backendCommands.fs.user} (${timestamp})]: ${message}\n`;
                    this.echo(userMessage);
                    chatLog += userMessage;
                }
            }, {
                prompt: '>> '
            }
        );
    },

    /**
     * A system profiling tool.
     */
    sysinfo: async function() {
        this.echo('[[b;yellow;]-- System Information --]');
        this.echo(`  ALEXDOS Kernel: 1.1`);
        this.echo(`  Terminal Version: ${$.terminal.version}`);
        this.echo(`  Browser: ${navigator.userAgent}`);
        this.echo(`  Screen Resolution: ${window.screen.width}x${window.screen.height}`);
        this.echo(`  Date: ${new Date().toLocaleString()}`);
        this.echo(`  CPU Cores: ${navigator.hardwareConcurrency || 'N/A'}`);
        this.echo('[[b;yellow;]------------------------]');
    },

    /**
     * Prints the content of a file to the terminal.
     * Use `cat [filename]`
     */
    async cat(filename) {
        if (!filename) {
            this.error('Usage: cat [filename]');
            return;
        }
        const parentDir = backendCommands.fs.getFile(backendCommands.fs.currentDir);
        const file = parentDir?.contents[filename];
        if (file && file.type === 'file') {
            this.echo(file.contents);
        } else {
            this.error(`File not found: ${filename}`);
        }
    },

    /**
     * Moves or renames a file or directory.
     * Use `mv [old_path] [new_path]`
     */
    async mv(oldPath, newPath) {
        if (!oldPath || !newPath) {
            this.error('Usage: mv <source> <destination>');
            return;
        }

        const currentDir = backendCommands.fs.getFile(backendCommands.fs.currentDir);
        if (!currentDir || !currentDir.contents[oldPath]) {
            this.error(`Source file or directory not found: ${oldPath}`);
            return;
        }

        if (currentDir.contents[newPath]) {
            this.error(`Destination already exists: ${newPath}`);
            return;
        }

        currentDir.contents[newPath] = currentDir.contents[oldPath];
        delete currentDir.contents[oldPath];
        backendCommands.fs.saveState();
        this.echo(`Moved ${oldPath} to ${newPath}`);
    },

    /**
     * Removes a file.
     * Use `rm [filename]`
     */
    async rm(filename) {
        if (!filename) {
            this.error('Usage: rm [filename]');
            return;
        }

        const currentDir = backendCommands.fs.getFile(backendCommands.fs.currentDir);
        if (currentDir && currentDir.contents[filename] && currentDir.contents[filename].type === 'file') {
            delete currentDir.contents[filename];
            backendCommands.fs.saveState();
            this.echo(`Removed file: ${filename}`);
        } else {
            this.error(`File not found: ${filename}`);
        }
    },

    /**
     * A simple calculator.
     * Use `calc [expression]`
     */
    async calc(expression) {
        try {
            const result = eval(expression);
            this.echo(result);
        } catch (e) {
            this.error('Invalid expression.');
        }
    },

    /**
     * A simple quiz game.
     * Use `quiz` to start.
     */
    quiz: async function() {
        const questions = [{
            q: 'What is the capital of France?',
            a: 'paris'
        }, {
            q: 'Which planet is known as the Red Planet?',
            a: 'mars'
        }, {
            q: 'What is 7 multiplied by 8?',
            a: '56'
        }];

        let score = 0;
        let currentQuestion = 0;

        const startQuiz = () => {
            if (currentQuestion < questions.length) {
                this.echo(`Question ${currentQuestion + 1}: ${questions[currentQuestion].q}`);
            } else {
                this.echo('[[b;green;]Quiz finished!]');
                this.echo(`You scored ${score} out of ${questions.length}.`);
                this.pop();
            }
        };

        this.push(
            function(answer) {
                const correctAnswer = questions[currentQuestion].a;
                if (answer.toLowerCase() === correctAnswer) {
                    score++;
                    this.echo('Correct!');
                } else {
                    this.echo('Incorrect.');
                }
                currentQuestion++;
                startQuiz();
            }, {
                prompt: 'ANSWER> ',
                greetings: 'Starting quiz. Type your answer and press Enter.'
            }
        );
        startQuiz();
    }
};

