/* Worldwide Auto Leasing — site behaviour (vanilla, no build step) */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = n => "$" + Number(n).toLocaleString("en-US");

  /* ---- header ---------------------------------------------------------- */
  const header = $("#site-header"), toggle = $("#nav-toggle"), nav = $("#site-nav");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("is-open")) toggle.click(); });
  }

  /* ---- scroll reveal + counters ---------------------------------------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-visible");
      if (en.target.dataset.count) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .1 }) : null;
  $$(".reveal, [data-count]").forEach(el => io ? io.observe(el) : el.classList.add("is-visible"));
  // safety net: nothing stays hidden if the observer never fires
  setTimeout(() => $$(".reveal:not(.is-visible)").forEach(el => { el.classList.add("is-visible"); if (el.dataset.count) countUp(el); }), 2500);
  function countUp(el) {
    const end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "", dec = (el.dataset.count.split(".")[1] || "").length;
    if (reduced) { el.textContent = end.toFixed(dec) + suffix; return; }
    const t0 = performance.now(), dur = 1400;
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---- 3D tilt on cards ------------------------------------------------ */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", e => {
      const card = e.target.closest && e.target.closest(".card--tilt");
      if (!card) return;
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
    });
    document.addEventListener("pointerout", e => {
      const card = e.target.closest && e.target.closest(".card--tilt");
      if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
    });
  }

  /* ---- forms: validation, 10DLC consent proof, JSON submit ------------ */
  const toast = document.createElement("div"); toast.className = "toast"; toast.setAttribute("role", "status"); document.body.appendChild(toast);
  function say(msg) { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("is-on"), 4500); }

  $$("form[data-lead]").forEach(form => {
    // pre-fill vehicle from ?vehicle=
    const q = new URLSearchParams(location.search), vf = form.querySelector("[name=vehicle]");
    const want = q.get("vehicle") || q.get("make") || (q.get("body") ? "Any " + q.get("body").toLowerCase() : "");
    if (want && vf && !vf.value) vf.value = want;
    const phone = form.querySelector("[name=phone]");
    if (phone) phone.addEventListener("input", () => { const d = phone.value.replace(/\D/g, "").slice(0, 10); phone.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d; });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      let ok = true;
      $$("[required]", form).forEach(f => {
        const field = f.closest(".field") || f.closest(".consent");
        const valid = f.type === "checkbox" ? f.checked : f.type === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value) : f.name === "phone" ? f.value.replace(/\D/g, "").length === 10 : f.value.trim().length > 0;
        if (field) field.classList.toggle("field--error", !valid);
        if (!valid) ok = false;
      });
      if (!ok) { say("Please complete the highlighted fields."); return; }
      if (form.querySelector("[name=_honey]") && form.querySelector("[name=_honey]").value) return; // bot

      const fd = new FormData(form), payload = {};
      fd.forEach((v, k) => { if (!k.startsWith("_")) payload[k] = v; });
      const sms = form.querySelector("[name=sms_consent]");
      payload.sms_consent = sms && sms.checked ? "YES" : "NO";
      if (sms && sms.checked) {                       // proof of consent for 10DLC audits
        payload.sms_consent_text = sms.closest(".consent").textContent.replace(/\s+/g, " ").trim();
        payload.sms_consent_timestamp = new Date().toISOString();
        payload.sms_consent_version = "2026-10-20";
        payload.sms_consent_page = location.href;
        payload.sms_consent_user_agent = navigator.userAgent;
      }
      payload._subject = `${window.WWAL.BRAND}: ${form.dataset.lead} from ${payload.name || "website"}`;
      payload._template = "table";

      const btn = form.querySelector("[type=submit]"), label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const res = await fetch(window.WWAL.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.success === false || out.success === "false") throw new Error("Form service refused: " + (out.message || res.status));
        location.href = window.WWAL.THANK_YOU_URL + (payload.sms_consent === "YES" ? "?sms=1" : "");
      } catch (err) {
        btn.disabled = false; btn.textContent = label;
        say("We could not send that. Please call " + window.WWAL.PHONE + " or try again.");
        console.error(err);
      }
    });
  });

})();
