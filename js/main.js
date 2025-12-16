"use strict";

function escapeHTML(html) {
    return ("" + html).replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function generateHTML(log) {
    return window.TemplateHTML.replace("__BATTLE_LOG__", log);
}

function setReplay(log) {
    const html = generateHTML(log);
    const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    const container = document.querySelector(".iframe-result-container");
    container.innerHTML = '<iframe src="' + url + '" style="width:100%;height:600px;" referrerpolicy="no-referrer" allowfullscreen></iframe>';
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function initialize() {
    const logFromURL = getQueryParam("log");
    if (logFromURL) {
        try {
            const log = LZString.decompressFromEncodedURIComponent(logFromURL);
            if (!log) throw new Error("Invalid or corrupted log");
            setReplay(log);
        } catch (e) {
            console.error("Failed to load log from URL. ", e);
            alert("Invalid log URL. Please contact support!");
        }
    }
}

if (document.readyState !== "loading") initialize();
else document.addEventListener("DOMContentLoaded", initialize);
