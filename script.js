/* ==========================================================================
   شما شاپ — script.js
   Modules:
   1. env detection      — hover-capable vs touch, reduced motion
   2. tehran clock        — live digital clock, Asia/Tehran
   3. store status engine — open / closing soon / opening soon / closed
   4. ripple + reveal     — small interaction polish
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. Environment detection
   *    Desktop mouse users get hover micro-interactions; touch users
   *    get a calmer, battery-friendlier page.
   * ------------------------------------------------------------------ */
  const root = document.documentElement;
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  if (hoverCapable) root.classList.add("hover-ok");
  if (!reducedMotion) root.classList.add("motion-ok");
  if (isTouch) root.classList.add("is-touch");

  /* ------------------------------------------------------------------ *
   * 2 + 3. Tehran clock & store status
   * ------------------------------------------------------------------ */
  const FA_DIGITS = { 0: "۰", 1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸", 9: "۹" };
  const toFa = (str) => String(str).replace(/[0-9]/g, (d) => FA_DIGITS[d]);
  const pad = (n) => String(n).padStart(2, "0");
  const faTime = (h, m) => `ساعت ${toFa(pad(h))}:${toFa(pad(m))}`;

  const clockEl = document.getElementById("clockTime");
  const statusTitleEl = document.getElementById("statusTitle");
  const statusDetailEl = document.getElementById("statusDetail");
  const heroCardEl = document.getElementById("statusCard");

  const dots = [document.getElementById("headerDot"), document.getElementById("heroDot")].filter(Boolean);
  const headerChipText = document.getElementById("headerChipText");

  const clockFormatter = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const partsFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function tehranParts(date) {
    const parts = partsFormatter.formatToParts(date);
    const map = {};
    parts.forEach((p) => (map[p.type] = p.value));
    let h = parseInt(map.hour, 10);
    if (h === 24) h = 0; // some engines report midnight as 24
    return { h, m: parseInt(map.minute, 10), s: parseInt(map.second, 10) };
  }

  // Shifts, expressed in seconds-since-midnight.
  const SHIFTS = [
    { start: 9 * 3600, end: 14 * 3600, startLabel: [9, 0], endLabel: [14, 0] },
    { start: 17 * 3600, end: 22 * 3600, startLabel: [17, 0], endLabel: [22, 0] },
  ];
  const SOON_WINDOW = 3600; // 1 hour

  function setDotState(state) {
    dots.forEach((dot) => {
      dot.classList.remove("is-open", "is-warn", "is-closed");
      dot.classList.add(state);
    });
    heroCardEl.classList.remove("is-open", "is-warn", "is-closed");
    heroCardEl.classList.add(state);
  }

  function renderStatus(nowSec) {
    // Currently inside a shift?
    const activeShift = SHIFTS.find((s) => nowSec >= s.start && nowSec < s.end);

    if (activeShift) {
      const remaining = activeShift.end - nowSec;
      const endTime = faTime(...activeShift.endLabel);

      if (remaining <= SOON_WINDOW) {
        setDotState("is-warn");
        statusTitleEl.textContent = "به‌زودی فروشگاه بسته می‌شود";
        statusDetailEl.textContent = `تا ${endTime} در خدمت شما هستیم.`;
        headerChipText.textContent = "به‌زودی بسته می‌شود";
      } else {
        setDotState("is-open");
        statusTitleEl.textContent = "اکنون فروشگاه باز است";
        statusDetailEl.textContent = `تا ${endTime} در خدمت شما هستیم.`;
        headerChipText.textContent = "اکنون باز است";
      }
      return;
    }

    // Not in a shift — find the next one (today or tomorrow morning).
    let next = SHIFTS.find((s) => s.start > nowSec);
    let untilNext;
    let nextLabel;

    if (next) {
      untilNext = next.start - nowSec;
      nextLabel = faTime(...next.startLabel);
    } else {
      // Past the last shift — next is tomorrow's first shift.
      const first = SHIFTS[0];
      untilNext = 24 * 3600 - nowSec + first.start;
      nextLabel = `فردا، ${faTime(...first.startLabel)}`;
    }

    if (untilNext <= SOON_WINDOW) {
      setDotState("is-warn");
      statusTitleEl.textContent = "به‌زودی فروشگاه باز می‌شود";
      statusDetailEl.textContent = `از ${nextLabel} در خدمت شما هستیم.`;
      headerChipText.textContent = "به‌زودی باز می‌شود";
    } else {
      setDotState("is-closed");
      statusTitleEl.textContent = "اکنون فروشگاه بسته است";
      statusDetailEl.textContent = `شروع شیفت بعدی: ${nextLabel}`;
      headerChipText.textContent = "اکنون بسته است";
    }
  }

  function tick() {
    const now = new Date();
    clockEl.textContent = clockFormatter.format(now);

    const { h, m, s } = tehranParts(now);
    renderStatus(h * 3600 + m * 60 + s);
  }

  tick();
  setInterval(tick, 1000);

  /* ------------------------------------------------------------------ *
   * 4. Ripple — a quiet feedback pulse on button press, only where
   *    hover/pointer precision suggests it will read as intentional.
   * ------------------------------------------------------------------ */
  function attachRipple(el) {
    el.addEventListener("pointerdown", (e) => {
      if (reducedMotion) return;
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.4;
      const span = document.createElement("span");
      span.className = "ripple";
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(span);
      span.addEventListener("animationend", () => span.remove());
    });
  }
  document.querySelectorAll(".contact-btn, .route-btn, .method-card").forEach(attachRipple);

  /* ------------------------------------------------------------------ *
   * Scroll reveal
   * ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
