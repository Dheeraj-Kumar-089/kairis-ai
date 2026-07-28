
let cachedFingerprint = null;

function getCanvasSignal() {
    try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 100, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("kairis-ai-fp", 2, 2);
        return canvas.toDataURL();
    } catch {
        return "";
    }
}

async function sha256(text) {
    if (window.crypto?.subtle) {
        const data = new TextEncoder().encode(text);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }
    // Fallback (very old browsers without SubtleCrypto): weak but harmless -
    // guest limit just becomes cookie-only for those users.
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
}

export async function getFingerprint() {
    if (cachedFingerprint) return cachedFingerprint;

    const signals = [
        navigator.userAgent,
        navigator.language,
        String(screen.width),
        String(screen.height),
        String(screen.colorDepth),
        String(new Date().getTimezoneOffset()),
        String(navigator.hardwareConcurrency || ""),
        getCanvasSignal(),
    ].join("||");

    cachedFingerprint = await sha256(signals);
    return cachedFingerprint;
}
