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

    // youtu.be/<id>
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }

    // youtube.com/watch?v=<id>
    if (u.hostname.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      // youtube.com/shorts/<id>
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" && parts[1]) return parts[1];

      // youtube.com/embed/<id>
      if (parts[0] === "embed" && parts[1]) return parts[1];
    }

    return null;
  } catch {
    return null;
  }
}

function getThumbUrl(youtubeUrl) {
  const id = getYouTubeId(youtubeUrl);
  if (!id) return null;
  // standard miniatura:
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

function normalizeText(s) {
  return (s || "").toString().toLowerCase().trim();
}

async function loadPosts() {
  const res = await fetch(POSTS_URL_BUSTED, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-store"
    }
  });
  if (!res.ok) throw new Error("Nie udało się pobrać posts.json");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("posts.json musi być tablicą");
  return data;
}

function createCard(post) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = `post.html?id=${encodeURIComponent(post.id)}`;

  const thumb = document.createElement("div");
  thumb.className = "thumb";

  const img = document.createElement("img");
  img.alt = post.title || "Post";
  const thumbUrl = post.youtube ? getThumbUrl(post.youtube) : null;
  if (thumbUrl) {
    img.src = thumbUrl;
    img.loading = "lazy";
  } else {
    img.src = "";
  }
  thumb.appendChild(img);

  const body = document.createElement("div");
  body.className = "card-body";

  const badgeRow = document.createElement("div");
  badgeRow.className = "badge-row";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = "NEW";
  badgeRow.appendChild(badge);

  body.appendChild(badgeRow);

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = post.title || "Bez tytułu";

  const sub = document.createElement("div");
  sub.className = "card-sub";
  sub.textContent = post.id ? `@${post.id}` : "@posta";

  body.appendChild(title);
  body.appendChild(sub);

  a.appendChild(thumb);
  a.appendChild(body);

  return a;
}

function render(posts) {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("emptyState");
  if (!grid) return;

  grid.textContent = "";
  posts.forEach(p => grid.appendChild(createCard(p)));

  if (empty) empty.hidden = posts.length !== 0;
}

function setupSearch(allPosts) {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");

  function apply() {
    const q = normalizeText(input ? input.value : "");
    if (!q) return render(allPosts);

    const filtered = allPosts.filter(p => normalizeText(p.title).includes(q));
    render(filtered);
  }

  if (input) input.addEventListener("input", apply);
  if (btn) btn.addEventListener("click", apply);
}

(async function main() {
  setYear();

  try {
    const posts = await loadPosts();

    // Minimalna walidacja danych
    const cleaned = posts.filter(p =>
      p && typeof p === "object" &&
      typeof p.id === "string" &&
      typeof p.title === "string" &&
      typeof p.youtube === "string" &&
      isSafeHttpUrl(p.youtube)
    );

    render(cleaned);
    setupSearch(cleaned);
  } catch (e) {
    const empty = document.getElementById("emptyState");
    if (empty) {
      empty.hidden = false;
      empty.textContent = "Błąd ładowania postów.";
    }
  }
})();