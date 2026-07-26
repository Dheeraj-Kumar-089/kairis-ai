import { config } from "../config/config.js";

const MAX_FILES = 60;
const MAX_FILE_SIZE = 200 * 1024; // 200KB per file
const MAX_TOTAL_SIZE = 2 * 1024 * 1024; // 2MB total per repo index (keeps indexing time bounded under the embeddings API's rate limit)

const SKIP_DIR_SEGMENTS = new Set([
    "node_modules", ".git", "dist", "build", ".next", ".turbo",
    "vendor", "venv", ".venv", "__pycache__", "coverage", ".cache",
]);

const SKIP_FILE_NAMES = new Set([
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".DS_Store",
]);

const ALLOWED_EXTENSIONS = new Set([
    "js", "jsx", "ts", "tsx", "mjs", "cjs",
    "py", "java", "go", "rb", "php", "rs", "c", "cpp", "h", "hpp", "cs",
    "json", "yml", "yaml", "toml", "md", "mdx", "txt",
    "html", "css", "scss", "sql", "sh", "example",
]);

function parseRepoUrl(repoUrl) {
    // Accepts: https://github.com/owner/repo(.git)(/tree/branch)
    const match = repoUrl
        .trim()
        .replace(/\.git$/, "")
        .match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/i);

    if (!match) {
        throw new Error("Invalid GitHub repo URL");
    }

    return { owner: match[1], repo: match[2], branch: match[3] || null };
}

function githubHeaders(token) {
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "kairis-ai",
    };
    const activeToken = token || config.GITHUB_TOKEN;
    if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
    }
    return headers;
}

async function getDefaultBranch(owner, repo, token) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: githubHeaders(token),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch repo info: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.default_branch;
}

function isAllowedPath(path) {
    const segments = path.split("/");
    if (segments.some((seg) => SKIP_DIR_SEGMENTS.has(seg))) return false;

    const fileName = segments[segments.length - 1];
    if (SKIP_FILE_NAMES.has(fileName)) return false;

    const ext = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
    return ALLOWED_EXTENSIONS.has(ext);
}

// Fetch repo file tree + text content for allowed files, capped by count/size.
// `token` is the requesting user's own GitHub OAuth token (if they've
// connected their account); falls back to the server-wide GITHUB_TOKEN
// (public repos / rate limit boost only) when not provided.
export async function fetchRepoFiles(repoUrl, token) {
    const { owner, repo, branch: branchFromUrl } = parseRepoUrl(repoUrl);
    const branch = branchFromUrl || (await getDefaultBranch(owner, repo, token));

    const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: githubHeaders(token) }
    );
    if (!treeRes.ok) {
        throw new Error(`Failed to fetch repo tree: ${treeRes.status} ${await treeRes.text()}`);
    }
    const treeData = await treeRes.json();
    if (treeData.truncated) {
        console.warn(`Repo tree truncated for ${owner}/${repo} - only partial file list indexed`);
    }

    const candidateFiles = (treeData.tree || [])
        .filter((entry) => entry.type === "blob")
        .filter((entry) => isAllowedPath(entry.path))
        .filter((entry) => !entry.size || entry.size <= MAX_FILE_SIZE)
        .slice(0, MAX_FILES);

    const activeToken = token || config.GITHUB_TOKEN;
    const files = [];
    let totalSize = 0;
    const FETCH_CONCURRENCY = 20;

    for (let i = 0; i < candidateFiles.length; i += FETCH_CONCURRENCY) {
        if (totalSize >= MAX_TOTAL_SIZE) break;

        const batch = candidateFiles.slice(i, i + FETCH_CONCURRENCY);
        const results = await Promise.all(
            batch.map(async (entry) => {
                const rawRes = await fetch(
                    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${entry.path}`,
                    { headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {} }
                );
                if (!rawRes.ok) return null;
                const text = await rawRes.text();
                if (!text || !text.trim()) return null;
                return { filename: entry.path, text };
            })
        );

        for (const file of results) {
            if (!file) continue;
            if (totalSize >= MAX_TOTAL_SIZE) break;
            totalSize += file.text.length;
            files.push(file);
        }
    }

    return { owner, repo, branch, files };
}

// Fetch the connected user's own repos (for a repo picker UI). Requires a
// user access token (public GITHUB_TOKEN fallback would list the wrong account).
export async function listUserRepos(token) {
    if (!token) return [];

    const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: githubHeaders(token),
    });
    if (!res.ok) {
        throw new Error(`Failed to list repos: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.map((r) => ({
        fullName: r.full_name,
        private: r.private,
        url: r.html_url,
        defaultBranch: r.default_branch,
        updatedAt: r.updated_at,
    }));
}
