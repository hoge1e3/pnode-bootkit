//@ts-check
const ws = new WebSocket("ws://localhost:8080");
const files = {}; // path -> {mtime, content}
const log=(...a)=>console.log(...a);
ws.addEventListener("open", () => {
    log("connected");
});
ws.addEventListener("message", e => {
    const _data = JSON.parse(e.data);
    if (_data.type === "init") {
        Object.assign(files, _data.files);
        log("initialized: " + Object.keys(files).slice(0,10).join(", "));
    } else if (_data.type === "update") {
        const { path, info } = _data;
        const cur = readFile(path);
        if (!cur || info.mtime > cur.mtime) {
            writeFile(path, info, true);
            log("updated from server: " + path);
        }
    } else if (_data.type === "delete") {
        const { path } = _data;
        deleteFile(path, true);
        log("deleted from server: " + path);
    }
});
// --- API ---
export function readFile(path) {
    return files[path] || null;
}
export function writeFile(path, info, nosend) {
    files[path] = info;
    if (nosend) return;
    ws.send(JSON.stringify({
        type: "update",
        path,
        info
    }));
}
export function deleteFile(path, nosend) {
    delete files[path];
    if (nosend) return;
    ws.send(JSON.stringify({
        type: "delete",
        path
    }));
}