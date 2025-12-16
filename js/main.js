"use strict";

function escapeHTML(html) {
    return ("" + html).replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function generateHTML(log) {
    return window.TemplateHTML.replace("${BATTLE_LOG}", log);
}

function setReplay(log) {
    const html = generateHTML(log);
    const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    const container = document.querySelector(".iframe-result-container");
    container.innerHTML = '<iframe src="' + url + '" style="width:100%;height:600px;" referrerpolicy="no-referrer" allowfullscreen></iframe>';
}

function uploadLog(logFile) {
    if (!logFile) return;
    const reader = new FileReader();
    reader.readAsText(logFile, "UTF-8");
    reader.onload = (evt) => setReplay(evt.target.result);
    reader.onerror = (err) => console.error(err);
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function initialize() {
    const btn = document.querySelector("#upload-button");
    const fileInput = document.querySelector("#upload-file");

    btn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) uploadLog(e.target.files[0]);
    });

    document.addEventListener("drop", (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files.length) uploadLog(e.dataTransfer.files[0]);
    });
    document.addEventListener("dragover", (e) => { e.preventDefault(); e.stopPropagation(); });

    const logFromURL = getQueryParam("log");
    if (logFromURL) {
        try {
            const log = LZString.decompressFromEncodedURIComponent(logFromURL) || decodeURIComponent(logFromURL);
            setReplay(log);
        } catch (e) {
            console.error("Failed to load log from URL", e);
        }
    }
}

if (document.readyState !== "loading") initialize();
else document.addEventListener("DOMContentLoaded", initialize);
