"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const mkdirp = require("mkdirp");
const fs = require("fs");
const EventEmitter = require("events");
exports.LocalController = class LocalController extends EventEmitter {
    constructor() {
        super();
        this.rootPath = vscode_1.workspace.rootPath + '/';
        if (!this.rootPath) {
            this.error(new Error('no workspace found'));
        }
    }
    createLocalRootFileTree(fileTree) {
        this.createFileTree(fileTree, this.rootPath);
    }
    createFileTree(fileTree, path) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let key in fileTree) {
                const absFilePath = path + key;
                if (fileTree[key] === null) {
                    // is a file
                    if (!fs.existsSync(absFilePath)) {
                        yield this.makeBlankFile(absFilePath);
                    }
                }
                else if (typeof fileTree[key] === 'object') {
                    // is a folder
                    mkdirp(absFilePath);
                    yield this.createFileTree(fileTree[key], absFilePath + '/');
                }
            }
        });
    }
    makeBlankFile(absolutePath) {
        return new Promise((resolve, reject) => {
            fs.appendFile(absolutePath, '', (err) => {
                if (err) {
                    this.error(err);
                    reject(err);
                }
                else {
                    resolve(absolutePath);
                }
            });
        });
    }
    error(error) {
        console.error(error);
        this.emit('error', error);
    }
};
//# sourceMappingURL=localController.js.map