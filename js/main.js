"use strict";

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

function initialize() {

    const raw = window.location.hash.slice(1);
    if (!raw.startsWith("cr1:")) return;

    const payload = raw.slice(4);

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
    } catch (e) {
        console.error("Failed to load log from URL.", e);
        alert("Invalid log URL. Please contact support!");
    }
}

if (document.readyState !== "loading") initialize();
else document.addEventListener("DOMContentLoaded", initialize);
