'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const isDebug = process.env.NODE_ENV === 'debug';
const isDev = process.env.NODE_ENV === 'development' || isDebug;
const vscode = require("vscode");
const statusIcon_1 = require("./statusIcon");
const remoteController_1 = require("./remoteController");
const localController_1 = require("./localController");
const fs = require("fs");
const lang = require("./lang/en");
const debug = isDev ? console.log.bind(console) : () => { }; //Debug('remote-editor:extension')
//const extensionConfig = vscode.workspace.getConfiguration('remote.editor')
let statusBarItem;
let remoteController;
function getStatusBarItem() {
    if (statusBarItem)
        return statusBarItem;
    statusBarItem = new statusIcon_1.StatusIcon({
        position: 'left',
        priority: 0,
        text: '⇅',
        tooltip: lang.syncFolderStructure,
        command: 'remote.editor.connectRemote'
    })
        .show();
    return statusBarItem;
}
function getRemoteController() {
    return __awaiter(this, void 0, void 0, function* () {
        if (remoteController)
            return remoteController;
        const path = vscode.workspace.rootPath + '/.remote';
        if (!fs.existsSync(vscode.workspace.rootPath + '/.remote')) {
            return vscode.window.showErrorMessage(lang.createRemoteEditor);
        }
        const configFile = yield vscode.workspace.openTextDocument(path);
        const configString = configFile.getText();
        const configJSON = JSON.parse(configString);
        remoteController = new remoteController_1.RemoteController(configJSON);
        remoteController.config = configJSON;
        return remoteController;
    });
}
function isDocIgnored(path) {
    const ignoredDocs = [
        /.remote$/
    ];
    return ignoredDocs.map(pattern => pattern.test(path)).filter(result => result === true).length;
}
function isDocInWorkspace(path) {
    debug('isDocInWorkspace', path, vscode.workspace.rootPath);
    return path.indexOf(vscode.workspace.rootPath) === 0;
}
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const statusBarItem = getStatusBarItem();
        yield getRemoteController();
        if (remoteController.config.autoConnect)
            yield connectRemoteEditor();
        vscode.workspace.onDidOpenTextDocument(function onDocOpen(doc) {
            return __awaiter(this, void 0, void 0, function* () {
                const path = doc.fileName;
                if (!doc.isDirty && !isDocIgnored(path) && isDocInWorkspace(path)) {
                    debug('open doc', doc);
                    statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing);
                    try {
                        const remoteController = yield getRemoteController();
                        if (!remoteController.isConnected) {
                            yield remoteController.connect();
                        }
                        yield remoteController.getFileContents(path);
                    }
                    catch (e) {
                        debug('Open document error', e);
                    }
                    statusBarItem.stopCycle().setText('⇅');
                }
            });
        });
        vscode.workspace.onDidSaveTextDocument(function onDocSave(doc) {
            return __awaiter(this, void 0, void 0, function* () {
                const path = doc.fileName;
                if (!doc.isDirty && !isDocIgnored(path) && isDocInWorkspace(path)) {
                    debug('save doc', doc);
                    statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing);
                    const remoteController = yield getRemoteController();
                    if (!remoteController.isConnected) {
                        yield remoteController.connect();
                    }
                    yield remoteController.putFileContents(path);
                    statusBarItem.stopCycle().setText('⇅');
                }
            });
        });
        function connectRemoteEditor() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!fs.existsSync(vscode.workspace.rootPath + '/.remote')) {
                    return vscode.window.showErrorMessage(lang.createRemoteEditor);
                }
                try {
                    statusBarItem.stopCycle().cycleDots('⇅ ' + lang.connecting);
                    //const remoteController = await getRemoteController()
                    debug('Connecting...');
                    remoteController.connect()
                        .then(() => {
                        statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing);
                        return remoteController.getFileTree()
                            .then(filetree => {
                            const localController = new localController_1.LocalController();
                            localController.createLocalRootFileTree(filetree);
                            statusBarItem.stopCycle().setText('⇅ ' + lang.done).setTextWait('⇅', 5000);
                        })
                            .catch(error => console.log(error));
                    })
                        .catch(error => {
                        console.error('Error connecting', error);
                        vscode.window.showErrorMessage(lang.errorMsg.replace('%s', error.message));
                        //throw new Error(lang.errorConnectionFailed)
                    });
                }
                catch (error) {
                    console.error(error);
                    statusBarItem.stopCycle().setText('⇅ ' + lang.error).setTextWait('⇅', 5000);
                    vscode.window.showErrorMessage(lang.errorMsg.replace('%s', error.message));
                }
            });
        }
        function disconnectRemoteEditor() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (remoteController && remoteController.isConnected) {
                        statusBarItem.stopCycle().cycleDots('⇅ ' + lang.disconnecting);
                        yield remoteController.disconnect();
                        statusBarItem.stopCycle().setText('⇅ ' + lang.done).setTextWait('⇅', 3000);
                    }
                }
                catch (error) {
                    console.error(error);
                    return vscode.window.showErrorMessage(lang.errorMsg.replace('%s', error.message));
                }
            });
        }
        context.subscriptions.push(vscode.commands.registerCommand('remote.editor.connectRemote', connectRemoteEditor));
        context.subscriptions.push(vscode.commands.registerCommand('remote.editor.disconnectRemote', disconnectRemoteEditor));
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        if (remoteController && remoteController.isConnected) {
            yield remoteController.disconnect();
        }
    });
}
exports.deactivate = deactivate;
process.on('unhandledRejection', (reason, promise) => {
    promise.catch(() => {
        if (isDev) {
            debug('Promise rejection unhandled', reason);
        }
    });
});
//# sourceMappingURL=extension.js.map