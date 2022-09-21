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
const SSH = require("node-ssh");
const EventEmitter = require("events");
const vscode_1 = require("vscode");
const Debug = require("debug");
const debug = Debug('remote-editor:remoteController');
exports.RemoteController = class RemoteController extends EventEmitter {
    get isConnected() {
        return this.ssh.connection;
    }
    constructor(config) {
        super();
        const mappedIgnores = this.getMappedIgnores(config.basePath, config.ignore);
        const basePath = config.basePath && config.basePath.slice(config.basePath.length - 1) !== '/'
            ? config.basePath += '/'
            : config.basePath;
        this.connectionInfo = config.connection;
        this.basePath = basePath || './';
        this.ignore = mappedIgnores || [];
        this.ssh = new SSH;
        this.hasSFTP = false;
        return this;
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.ssh
                .connect(this.connectionInfo)
                .then(() => {
                debug('connected', this.connectionInfo);
                return this.ssh
                    .requestSFTP()
                    .then((sftp) => {
                    this.sftp = sftp;
                    this.hasSFTP = true;
                    resolve();
                })
                    .catch((err) => {
                    this.error(err);
                    reject(err);
                });
            })
                .catch((err) => {
                debug('connection error', err);
                this.error(err);
                reject(err);
            });
        });
    }
    disconnect() {
        if (this.ssh.connection) {
            this.ssh.dispose();
        }
    }
    error(error) {
        this.emit('error', error);
    }
    getMappedIgnores(basePath, ignores) {
        return ignores.map(ignore => basePath + ignore);
    }
    enumerateRemoteFiles(path) {
        return new Promise((resolve, reject) => {
            this.sftp.readdir(path, {}, (err, filelist) => {
                if (err) {
                    this.error(err);
                    reject(err);
                }
                else {
                    resolve(filelist);
                }
            });
        });
    }
    processFile(fileOrFolder, path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fileOrFolder &&
                fileOrFolder.attrs &&
                'function' === typeof fileOrFolder.attrs.isDirectory &&
                fileOrFolder.attrs.isDirectory()) {
                const newPath = path + fileOrFolder.filename + '/';
                const filelist = yield this.enumerateRemoteFiles(newPath);
                return yield this.processFilelist(filelist, newPath);
            }
            else {
                return null;
            }
        });
    }
    processFilelist(filelist, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const levelRes = {};
            for (let i = 0; i < filelist.length; i++) {
                let shouldIgnore = this.ignore && this.ignore.indexOf(path + filelist[i].filename) !== -1;
                // debug(`is ${path + filelist[i].filename} in the ignore list? ${shouldIgnore ? 'yes' : 'no'}`)
                if (shouldIgnore) {
                    continue;
                }
                else {
                    levelRes[filelist[i].filename] = yield this.processFile(filelist[i], path);
                }
            }
            return levelRes;
        });
    }
    getFileTree(path = this.basePath) {
        return new Promise((resolve, reject) => {
            this.enumerateRemoteFiles(path)
                .then((filelist) => {
                try {
                    const filetree = this.processFilelist(filelist, path);
                    resolve(filetree);
                }
                catch (ex) {
                    this.error(ex);
                    reject(ex);
                }
            });
        });
    }
    getFileContents(localPath) {
        let remotePath = localPath
            .replace(vscode_1.workspace.rootPath, '')
            .replace(/^[\/\\]/, '')
            .replace(/[\/\\]/g, '/');
        remotePath = this.basePath + remotePath;
        return this.ssh.getFile(localPath, remotePath);
    }
    putFileContents(localPath) {
        let remotePath = localPath
            .replace(vscode_1.workspace.rootPath, '')
            .replace(/^[\/\\]/, '')
            .replace(/[\/\\]/g, '/');
        remotePath = this.basePath + remotePath;
        return this.ssh.putFile(localPath, remotePath);
    }
};
//# sourceMappingURL=remoteController.js.map