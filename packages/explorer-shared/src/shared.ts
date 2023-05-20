type WorkerMessage = {
    readonly command: string;
    readonly arguments: any[];
};

export type WorkerChannel = {
    onmessage: ((ev: MessageEvent) => any) | null;
    postMessage(message: WorkerMessage, transfer: Transferable[]): void;
}

export namespace WorkerChannel {

    export function connect<Local, Remote>(channel: WorkerChannel, fn: (remote: Remote) => Local): Remote {
        const remote: Remote = new Proxy({}, {
            get: function (target: any, property: string, receiver: any): () => void {
                return function (...args: any): void {
                    channel.postMessage({ command: property, arguments: [...args] }, [...args].filter(arg => arg instanceof ArrayBuffer));
                }
            }
        });
        const local: Local = fn(remote);
        channel.onmessage = function (e: MessageEvent): void {
            const message: WorkerMessage = e.data;
            (local as Record<string, Function>)[message.command].apply(local, message.arguments); // eslint-disable-line @typescript-eslint/ban-types
        };
        return remote;
    }
}

export type Frontend = {
    showProgress(message: string): void;
    showDialog(innerHTML: string): void;
    hideProgress(): void;
    replaceNavigation(innerHTML: string): void;
    replaceMainContent(title: string, innerHTML: string): void;
}

export type Backend = {
    beforecompile(): void;
    compile(documentURI: string, sourceText: ArrayBuffer, sourceTextHash: ArrayBuffer, sourceLanguage: string): void;
    aftercompile(): void;

    navigateTo(iri: string): void;
}
