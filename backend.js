// js/backend.js

/**
 * A more advanced backend for ALEXDOS.
 * It uses browser-based Local Storage to create a persistent
 * virtual file system and a user profile system.
 */
const backendCommands = {
    /**
     * Virtual File System (VFS) and Profile management.
     */
    fs: {
        currentDir: '/',
        user: 'guest',
        loadState: function() {
            try {
                const state = JSON.parse(localStorage.getItem('alexdos_state')) || {};
                this.fs.files = state.files || {
                    '/': {
                        type: 'dir',
                        contents: {}
                    }
                };
                this.fs.profiles = state.profiles || {
                    guest: {
                        home: '/home/guest'
                    }
                };
                this.fs.currentDir = state.currentDir || this.fs.profiles[this.fs.user].home;
            } catch (e) {
                console.error("Failed to load state from Local Storage. Initializing new state.");
                this.fs.reset();
            }
        },
        saveState: function() {
            const state = {
                files: this.fs.files,
                profiles: this.fs.profiles,
                currentDir: this.fs.currentDir
            };
            localStorage.setItem('alexdos_state', JSON.stringify(state));
        },
        reset: function() {
            localStorage.removeItem('alexdos_state');
            this.fs.loadState();
        },
        getFile: function(path) {
            let parts = path.split('/').filter(p => p);
            let current = this.fs.files;
            for (let part of parts) {
                if (!current[part]) return null;
                current = current[part].contents;
            }
            return current;
        }
    },

    /**
     * Core terminal commands.
     */
    cls: function() {
        this.clear();
    },

    echo: function(what) {
        this.echo(what);
    },

    /**
     * Lists files and directories in the current virtual directory.
     * Use 'ls -a' to show hidden files (starting with '.')
     */
    async ls(args) {
        let showHidden = args && args.includes('-a');
        const currentPath = backendCommands.fs.currentDir;
        const currentDir = backendCommands.fs.getFile(currentPath);

        if (!currentDir) {
            this.error('Directory not found: ' + currentPath);
            return;
        }

        for (const name in currentDir) {
            if (name.startsWith('.') && !showHidden) continue;
            const item = currentDir[name];
            const type = item.type === 'dir' ? '[[b;yellow;]' + name + '/]' : '[[b;white;]' + name + ']';
            this.echo(type);
        }
    },

    /**
     * Changes the current virtual directory.
     */
    async cd(path) {
        let newPath;
        if (path === '..') {
            const parts = backendCommands.fs.currentDir.split('/').filter(p => p);
            parts.pop();
            newPath = '/' + parts.join('/');
        } else if (path.startsWith('/')) {
            newPath = path;
        } else {
            newPath = backendCommands.fs.currentDir + (backendCommands.fs.currentDir.endsWith('/') ? '' : '/') + path;
        }

        const target = backendCommands.fs.getFile(newPath);

        if (target && target.type === 'dir') {
            backendCommands.fs.currentDir = newPath;
            const newPrompt = backendCommands.fs.currentDir.replace(/^\/$/, '') || '/';
            this.set_prompt(`C:${newPrompt}>`);
            backendCommands.fs.saveState();
        } else {
            this.error('Directory not found: ' + path);
        }
    },

    /**
     * Displays a help message with core commands and programs.
     * Combines command lists dynamically for easy expansion.
     */
    help: function() {
        this.echo('[[b;green;]ALEXDOS Help Menu]');
        this.echo('Core commands:');
        for (const cmd in backendCommands) {
            if (typeof backendCommands[cmd] === 'function') {
                this.echo(`  - ${cmd.toUpperCase()}`);
            }
        }
        this.echo('\nExtra programs (see `programs.js`):');
        for (const cmd in programCommands) {
            if (typeof programCommands[cmd] === 'function') {
                this.echo(`  - ${cmd.toUpperCase()}`);
            }
        }
    },

    /**
     * Displays system information.
     */
    info: function() {
        this.echo('ALEXDOS Version 1.1 (Web Based)');
        this.echo('Created using jQuery Terminal with Local Storage persistence.');
        this.echo('User: ' + backendCommands.fs.user);
    },

    /**
     * Simulates rebooting the system.
     */
    async reboot() {
        this.clear();
        this.echo('Rebooting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        location.reload(); // A simple reboot by reloading the page
    },

    /**
     * Manages user profiles.
     */
    async user(command, name) {
        if (command === 'create' && name) {
            if (!backendCommands.fs.profiles[name]) {
                backendCommands.fs.profiles[name] = { home: `/home/${name}` };
                backendCommands.fs.files['/']['contents']['home']['contents'][name] = { type: 'dir', contents: {} };
                backendCommands.fs.saveState();
                this.echo(`User '${name}' created.`);
            } else {
                this.error(`User '${name}' already exists.`);
            }
        } else if (command === 'login' && name) {
            if (backendCommands.fs.profiles[name]) {
                backendCommands.fs.user = name;
                backendCommands.fs.currentDir = backendCommands.fs.profiles[name].home;
                this.set_prompt(`C:${backendCommands.fs.currentDir}>`);
                this.echo(`Logged in as '${name}'.`);
                backendCommands.fs.saveState();
            } else {
                this.error(`User '${name}' does not exist.`);
            }
        } else if (command === 'list') {
            this.echo('Available users:');
            for (const u in backendCommands.fs.profiles) {
                this.echo(`- ${u}`);
            }
        } else {
            this.error('Usage: user <create|login|list> [name]');
        }
    }
};

// Immediately load the state when the backend script is executed.
backendCommands.fs.loadState();
