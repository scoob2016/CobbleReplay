"use strict";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("CobbleReplayDB", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const store = db.createObjectStore("replays", { keyPath: "id" });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveReplay(id, payload, players) {
    const db = await openDB();
    const tx = db.transaction("replays", "readwrite");
    const store = tx.objectStore("replays");

    store.put({
        id,
        payload,
        players,
        savedAt: Date.now()
    });

    await tx.complete;
}

async function removeReplay(id) {
    const db = await openDB();
    const tx = db.transaction("replays", "readwrite");
    const store = tx.objectStore("replays");
    await store.delete(id);
    await tx.complete;
}

async function isReplayStarred(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("replays", "readonly");
        const store = tx.objectStore("replays");
        const request = store.get(id);
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
    });
}

function decodeCurrentReplay() {
    const raw = window.location.hash.slice(1);
    const payload = raw.slice(4);

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const json = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(json);
}

async function toggleStar() {
    const button = document.getElementById("starReplayButton");
    const id = getReplayIdFromHash();
    if (!id) return;

    const starred = await isReplayStarred(id);

    if (starred) {
        await removeReplay(id);
        button.textContent = "☆ Star";
        button.classList.remove("starred");
    } else {
        const data = decodeCurrentReplay();
        const players = extractPlayersFromLog(data.r);

        await saveReplay(id, id, players);
        button.textContent = "★ Starred";
        button.classList.add("starred");
    }

    refreshSavedReplaysDropdown();
}

async function updateStarButton() {
    const button = document.getElementById("starReplayButton");
    const id = getReplayIdFromHash();
    if (!id) {
        button.style.display = "none";
        return;
    }

    button.style.display = "inline-block";

    const starred = await isReplayStarred(id);
    if (starred) {
        button.textContent = "★ Starred";
        button.classList.add("starred");
    } else {
        button.textContent = "☆ Star";
        button.classList.remove("starred");
    }
}

function extractPlayersFromLog(log) {
    let p1 = "Player 1";
    let p2 = "Player 2";

    const lines = log.split('\n');
    for (const line of lines) {
        if (line.startsWith('|player|p1|')) {
            p1 = line.split('|')[3] || p1;
        }
        if (line.startsWith('|player|p2|')) {
            p2 = line.split('|')[3] || p2;
        }
    }

    return { p1, p2 };
}

async function refreshSavedReplaysDropdown() {
    const dropdown = document.getElementById("savedReplaysDropdown");

    dropdown.innerHTML =
        '<option value="" disabled selected hidden>★ View Favourites</option>';

    const db = await openDB();

    const replays = await new Promise((resolve, reject) => {
        const tx = db.transaction("replays", "readonly");
        const store = tx.objectStore("replays");
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    for (const r of replays) {
        const opt = document.createElement("option");
        opt.value = "#cr1:" + r.payload;
        opt.textContent = `${r.players.p1} vs ${r.players.p2}`;
        dropdown.appendChild(opt);
    }
}

function generateHTML(log, fakemonSprites) {
    return window.TemplateHTML.replace("__BATTLE_LOG__", log)
    .replace(
        "__FAKEMON_JSON__",
        JSON.stringify(fakemonSprites || {})
    );
}

function setTheme(theme) {
    if (!theme || typeof theme !== "object") return;

    const root = document.documentElement;

    if (theme.b) {
        root.style.setProperty('--bg-color', theme.b);
    }

    if (theme.tc) {
        root.style.setProperty('--accent-color', theme.tc);
    }

    if (theme.eb) {
        root.style.setProperty('--box-bg', theme.eb);
    }

    if (theme.fb) {
        root.style.setProperty('--footer-bg', theme.fb);
    }

    if (theme.t) {
        document.title = theme.t;
        const heading = document.querySelector('h1');
        if (heading) heading.textContent = theme.t;
    }

    if (theme.f) {
        const footer = document.querySelector('.site-footer');
        if (footer) footer.style.color = theme.f;
    }
}

function setReplay(log, fakemonSprites) {
    const html = generateHTML(log, fakemonSprites);
    const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    const container = document.querySelector(".iframe-result-container");
    container.innerHTML = '<iframe src="' + url + '" style="width:100%;height:600px;" referrerpolicy="no-referrer" allowfullscreen></iframe>';
}

function getReplayIdFromHash() {
    const raw = window.location.hash.slice(1);
    if (!raw.startsWith("cr1:")) return null;
    return raw.slice(4);
}

function attachUIListeners() {
    document.getElementById("starReplayButton")
        .addEventListener("click", toggleStar);

    document.getElementById("savedReplaysDropdown")
        .addEventListener("change", (e) => {
            if (e.target.value) {
                window.location.hash = e.target.value;
                e.target.value = "";
            }
        });
}

function initialize() {
    const container = document.querySelector(".iframe-result-container");
    container.innerHTML = '';

    const payload = getReplayIdFromHash();

    try {

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64);

        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const json = pako.inflate(bytes, { to: 'string' });
        const data = JSON.parse(json);
        setTheme(data.t)
        setReplay(data.r, data.f)
        updateStarButton();
    } catch (e) {
        console.error("Failed to load log from URL.", e);
        alert("Invalid log URL. Please contact support!");
    }
}

function onReady() {
    attachUIListeners();
    refreshSavedReplaysDropdown();
    initialize();
}

if (document.readyState !== "loading") onReady();
else document.addEventListener("DOMContentLoaded", onReady);

window.addEventListener("hashchange", () => {
    initialize();
});