/* ───────────────────────────────────────────────────────────────
 * image_preview.js · 图片点击放大预览
 * 只处理视觉查看；不写存档、不改状态。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  const SELECTOR = [
    ".rel-avatar img",
    ".story-portrait img",
    ".boss-duel-art img",
    ".cb-art img",
    ".yg-img"
  ].join(",");

  let root = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function ensureRoot() {
    if (root) return root;
    root = document.createElement("div");
    root.className = "image-preview-root";
    document.body.appendChild(root);
    return root;
  }

  function titleOf(img) {
    return img.getAttribute("data-preview-title") || img.getAttribute("alt") || "";
  }

  function open(img) {
    if (!img || !img.src) return false;
    const el = ensureRoot();
    const title = titleOf(img);
    el.innerHTML =
      '<div class="image-preview-backdrop"></div>' +
      '<section class="image-preview-box" role="dialog" aria-modal="true">' +
      '  <button class="image-preview-close" aria-label="关闭">✕</button>' +
      '  <img src="' + esc(img.src) + '" alt="' + esc(title || "图片预览") + '">' +
      (title ? '  <div class="image-preview-title">' + esc(title) + '</div>' : '') +
      '</section>';
    el.classList.add("show");
    document.body.classList.add("image-preview-open");
    const bg = el.querySelector(".image-preview-backdrop");
    const closeBtn = el.querySelector(".image-preview-close");
    if (bg) bg.onclick = close;
    if (closeBtn) closeBtn.onclick = close;
    return true;
  }

  function close() {
    if (!root || !root.classList.contains("show")) return false;
    root.classList.remove("show");
    document.body.classList.remove("image-preview-open");
    root.innerHTML = "";
    return true;
  }

  function isOpen() {
    return !!(root && root.classList.contains("show"));
  }

  function markTargets(scope) {
    (scope || document).querySelectorAll(SELECTOR).forEach((img) => {
      img.classList.add("img-preview-target");
      if (!img.getAttribute("title")) img.setAttribute("title", "点击放大");
    });
  }

  document.addEventListener("mouseover", function (e) {
    const img = e.target && e.target.closest && e.target.closest(SELECTOR);
    if (img) markTargets(img.parentElement || document);
  });

  document.addEventListener("click", function (e) {
    const img = e.target && e.target.closest && e.target.closest(SELECTOR);
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();
    markTargets(img.parentElement || document);
    open(img);
  });

  Game.imagePreview = { open, close, isOpen, markTargets };
})(window.Game = window.Game || {});
