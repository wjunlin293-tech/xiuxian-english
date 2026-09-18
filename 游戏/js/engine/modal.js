/* ───────────────────────────────────────────────────────────────
 * modal.js · P-MODAL 低打扰弹窗 / 确认 / 事件提示
 * 三层反馈：toast 继续给普通反馈；modal 只处理低频、重要、不可逆事项。
 * ─────────────────────────────────────────────────────────────── */
(function (Game) {
  "use strict";

  let activeClose = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function ensureRoot() {
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      root.className = "modal-root";
      document.body.appendChild(root);
    }
    return root;
  }
  function bodyHtml(opts) {
    if (opts.html) return opts.html;
    const body = opts.body || opts.message || "";
    return String(body).split(/\n+/).filter(Boolean).map((p) => "<p>" + esc(p) + "</p>").join("");
  }
  function closeRoot(value) {
    if (activeClose) return activeClose(value);
    return false;
  }
  function open(opts) {
    opts = opts || {};
    const root = ensureRoot();
    if (activeClose) activeClose({ replaced: true });
    const actions = opts.actions || [{ label: opts.closeText || "知道了", value: true, gold: true }];
    const canClose = opts.canClose !== false;
    root.innerHTML =
      '<div class="modal-backdrop"></div>' +
      '<section class="game-modal modal-' + esc(opts.kind || "event") + '" role="dialog" aria-modal="true">' +
      (canClose ? '  <button class="modal-x" aria-label="关闭">✕</button>' : '') +
      '  <div class="modal-tag">' + esc(opts.tag || "灵讯") + '</div>' +
      '  <h2>' + esc(opts.title || "提示") + '</h2>' +
      '  <div class="modal-body">' + bodyHtml(opts) + '</div>' +
      '  <div class="modal-actions">' + actions.map((a, i) =>
        '<button class="btn ' + (a.gold ? "btn-gold " : "") + 'modal-action" data-i="' + i + '">' + esc(a.label || "确定") + '</button>'
      ).join("") + '</div>' +
      '</section>';
    root.classList.add("show");
    document.body.classList.add("modal-open");

    let done = false;
    activeClose = function (value) {
      if (done) return;
      done = true;
      root.classList.remove("show");
      document.body.classList.remove("modal-open");
      root.innerHTML = "";
      activeClose = null;
      opts.onClose && opts.onClose(value);
    };
    if (canClose) {
      const x = root.querySelector(".modal-x");
      const bg = root.querySelector(".modal-backdrop");
      if (x) x.onclick = () => closeRoot(false);
      if (bg) bg.onclick = () => closeRoot(false);
    }
    root.querySelectorAll(".modal-action").forEach((b) => {
      b.onclick = () => {
        const a = actions[Number(b.dataset.i)] || {};
        if (a.onClick) {
          const keepOpen = a.onClick();
          if (keepOpen === false) return;
        }
        closeRoot(a.value == null ? true : a.value);
      };
    });
    return { close: closeRoot };
  }

  function alert(opts, onClose) {
    if (typeof opts === "string") opts = { body: opts };
    opts = opts || {};
    opts.kind = opts.kind || "alert";
    if (onClose) opts.onClose = onClose;
    return open(opts);
  }

  function event(opts, onClose) {
    opts = opts || {};
    opts.kind = opts.kind || "event";
    opts.tag = opts.tag || "机缘";
    opts.closeText = opts.closeText || "收入识海";
    if (onClose) opts.onClose = onClose;
    return open(opts);
  }

  function confirm(opts, onConfirm, onCancel) {
    if (typeof opts === "string") opts = { body: opts };
    opts = opts || {};
    opts.kind = opts.kind || "confirm";
    opts.tag = opts.tag || "确认";
    opts.actions = [
      { label: opts.cancelText || "再想想", value: false },
      { label: opts.confirmText || "确认", value: true, gold: true, onClick: onConfirm },
    ];
    opts.onClose = function (value) {
      if (!value && onCancel) onCancel();
    };
    return open(opts);
  }

  function firstTime(id, opts, onClose) {
    Game.normalizeState && Game.normalizeState();
    const s = Game.state || {};
    s.flags = s.flags || {};
    const key = "modalSeen_" + id;
    if (s.flags[key]) {
      onClose && onClose(false);
      return null;
    }
    s.flags[key] = true;
    if (Game.save) {
      const old = Game.save.read && Game.save.read();
      Game.save.write({ view: old && old.view ? old.view : "hub", chapterId: old && old.chapterId, idx: old && old.idx });
    }
    return event(opts, function () { onClose && onClose(true); });
  }

  function isOpen() { return !!activeClose; }

  Game.modal = { open, alert, event, confirm, firstTime, close: closeRoot, isOpen };
})(window.Game = window.Game || {});
