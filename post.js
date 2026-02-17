"use strict";

const POSTS_URL = "posts.json";
const POSTS_URL_BUSTED = `${POSTS_URL}?v=${Date.now()}`;

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function isSafeHttpUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:");
  } catch {
    return false;
  }
}

function getYouTubeId(input) {
  try {
    const u = new URL(input);

    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }

    if (u.hostname.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" && parts[1]) return parts[1];
      if (parts[0] === "embed" && parts[1]) return parts[1];
    }

    return null;
  } catch {
    return null;
  }
}

async function loadPosts() {
  const res = await fetch(POSTS_URL_BUSTED, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-store"
    }
  });
  if (!res.ok) throw new Error("Couldn't get posts.json");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("posts.json musi być tablicą");
  return data;
}

function qs(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function mountYouTube(videoId, watchUrl) {
  const mount = document.getElementById("videoMount");
  if (!mount) return;

  const iframe = document.createElement("iframe");
  const src = new URL(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`);
  src.searchParams.set("rel", "0");
  src.searchParams.set("modestbranding", "1");
  src.searchParams.set("playsinline", "1");

  iframe.src = src.toString();
  iframe.title = "YouTube video player";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;

  iframe.addEventListener("load", () => {
    console.log("[YT] iframe loaded:", iframe.src);
  });

  mount.textContent = "";
  mount.appendChild(iframe);

  // fallback po 8s (bez inline style)
  setTimeout(() => {
    const fallback = document.createElement("div");
    fallback.className = "fallback";

    const p = document.createElement("p");
    p.textContent = "The preview doesn't seem to load:";

    const a = document.createElement("a");
    a.className = "btn btn-primary";
    a.href = watchUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Watch on YouTube";

    fallback.appendChild(p);
    fallback.appendChild(a);

    if (mount.childNodes.length === 1 && mount.firstChild === iframe) {
      mount.textContent = "";
      mount.appendChild(fallback);
      console.log("[YT] fallback shown");
    }
  }, 8000);
}

function showError() {
  const err = document.getElementById("postError");
  if (err) err.hidden = false;
}

(async function main() {
  setYear();

  const id = qs("id");
  if (!id) return showError();

  try {
    const posts = await loadPosts();
    const post = posts.find(p => p && p.id === id);
    if (!post) return showError();

    const titleEl = document.getElementById("postTitle");
    if (titleEl) titleEl.textContent = post.title || "Post";

    const videoId = post.youtube ? getYouTubeId(post.youtube) : null;
    if (!videoId) return showError();
    mountYouTube(videoId, post.youtube);

    const workBtn = document.getElementById("workBtn");
    const lootBtn = document.getElementById("lootBtn");

    if (workBtn && isSafeHttpUrl(post.workink || "")) workBtn.href = post.workink;
    else if (workBtn) workBtn.remove();

    if (lootBtn && isSafeHttpUrl(post.lootlabs || "")) lootBtn.href = post.lootlabs;
    else if (lootBtn) lootBtn.remove();
  } catch {
    showError();
  }
})();