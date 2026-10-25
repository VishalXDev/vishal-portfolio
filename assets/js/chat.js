(function () {
  var root = document.querySelector("[data-chat]"); if (!root) return;
  var API = (window.CHAT_API_URL || "/api/chat");
  // The widget stays hidden until the server reports that ALPIE_API_KEY is set.
  fetch(API, { method: "GET" }).then(function (r) { return r.ok ? r.json() : { enabled: false }; }).then(function (j) { if (j && j.enabled) root.hidden = false; }).catch(function () {});
  var panel = root.querySelector(".chat-panel"), fab = root.querySelector("[data-chat-open]");
  var log = root.querySelector("[data-chat-log]"), form = root.querySelector("[data-chat-form]");
  var input = form.elements.q, send = form.querySelector("button"), chips = root.querySelector("[data-chat-chips]");
  var sid; try { sid = sessionStorage.getItem("chat-sid"); } catch (e) {}
  if (!sid) { sid = "s" + Math.random().toString(36).slice(2) + Date.now().toString(36); try { sessionStorage.setItem("chat-sid", sid); } catch (e) {} }
  var busy = false;

  function toggle(open) {
    panel.hidden = !open; fab.setAttribute("aria-expanded", open);
    if (open) input.focus(); else fab.focus();
  }
  fab.addEventListener("click", function () { toggle(panel.hidden); });
  root.querySelector("[data-chat-close]").addEventListener("click", function () { toggle(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) toggle(false); });

  function add(cls, text) {
    var p = document.createElement("p"); p.className = "msg " + cls; p.textContent = text || "";
    log.appendChild(p); log.scrollTop = log.scrollHeight; return p;
  }
  function ask(q) {
    if (busy || !q) return; busy = true; send.disabled = true; chips.hidden = true;
    add("me", q); var bot = add("bot wait", "");
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, session_id: sid }) })
      .then(function (res) {
        if (!res.ok || !res.body) throw new Error("bad");
        var reader = res.body.getReader(), dec = new TextDecoder(), got = false;
        return (function pump() {
          return reader.read().then(function (r) {
            if (r.done) { if (!got) throw new Error("empty"); return; }
            got = true; bot.classList.remove("wait"); bot.textContent += dec.decode(r.value, { stream: true });
            log.scrollTop = log.scrollHeight; return pump();
          });
        })();
      })
      .catch(function () { bot.classList.remove("wait"); bot.classList.add("err"); bot.textContent = "I couldn't answer that just now. You can email Vishal at Vishaldwidy@gmail.com instead."; })
      .then(function () { busy = false; send.disabled = false; input.focus(); });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); var q = input.value.trim(); input.value = ""; ask(q); });
  chips.addEventListener("click", function (e) { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });
})();
