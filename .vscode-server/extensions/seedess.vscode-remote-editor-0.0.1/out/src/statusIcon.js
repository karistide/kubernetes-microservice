"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const { window } = vscode;
exports.StatusIcon = class StatusIcon {
    constructor(options) {
        let pos;
        if (options.position === 'right') {
            pos = vscode.StatusBarAlignment.Right;
        }
        else {
            pos = vscode.StatusBarAlignment.Left;
        }
        this.ref = window.createStatusBarItem(pos, options.priority);
        if (options.text) {
            this.setText(options.text);
        }
        if (options.tooltip) {
            this.setTooltip(options.tooltip);
        }
        if (options.command) {
            this.setCommand(options.command);
        }
        return this;
    }
    setText(text) {
        this.ref.text = text;
        return this;
    }
    setTextWait(text, timeout = 1000) {
        clearInterval(this.waitInterval);
        this.waitInterval = setTimeout(() => this.setText(text), timeout);
        return this;
    }
    setTooltip(tooltip) {
        this.ref.tooltip = tooltip;
        return this;
    }
    setCommand(command) {
        this.ref.command = command;
        return this;
    }
    cycle(states, interval = 700) {
        let idx = 0;
        this.cycleInterval = setInterval(() => {
            this.setText(states[idx]);
            if (++idx === states.length) {
                idx = 0;
            }
        }, interval);
        return this;
    }
    cycleDots(msg, interval = 700) {
        this.cycle([msg + '   ', msg + '.  ', msg + '.. ', msg + '...']);
        return this;
    }
    stopCycle() {
        clearInterval(this.cycleInterval);
        return this;
    }
    show() {
        this.ref.show();
        return this;
    }
    hide() {
        this.ref.hide();
        return this;
    }
};
//# sourceMappingURL=statusIcon.js.map