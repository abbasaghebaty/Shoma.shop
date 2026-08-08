(() => {
  "use strict";

  /* ==========================================================
     تنظیمات شیفت‌های کاری فروشگاه (به وقت تهران)
     ========================================================== */
  const SHIFTS = [
    { start: [9, 0],  end: [14, 0] }, // شیفت صبح
    { start: [17, 0], end: [22, 0] }, // شیفت عصر
  ];
  const TIME_ZONE = "Asia/Tehran";

  const clockTimeEl   = document.getElementById("clockTime");
  const statusTitleEl = document.getElementById("statusTitle");
  const statusDetailEl= document.getElementById("statusDetail");
  const heroDotEl      = document.getElementById("heroDot");
  const headerDotEl    = document.getElementById("headerDot");
  const headerChipText = document.getElementById("headerChipText");

  /** ساعت، دقیقه و ثانیهٔ فعلی را به‌وقت تهران برمی‌گرداند */
  function getTehranParts(date) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(date).reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
    return {
      hour: parseInt(parts.hour, 10),
      minute: parseInt(parts.minute, 10),
      second: parseInt(parts.second, 10),
    };
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function minutesSinceMidnight({ hour, minute }) {
    return hour * 60 + minute;
  }

  /** بررسی می‌کند فروشگاه اکنون باز است یا نه، و اطلاعات شیفت جاری/بعدی را برمی‌گرداند */
  function computeStatus(nowParts) {
    const nowMin = minutesSinceMidnight(nowParts);

    for (const shift of SHIFTS) {
      const startMin = shift.start[0] * 60 + shift.start[1];
      const endMin = shift.end[0] * 60 + shift.end[1];
      if (nowMin >= startMin && nowMin < endMin) {
        return {
          open: true,
          endLabel: `${pad(shift.end[0])}:${pad(shift.end[1])}`,
        };
      }
    }

    // فروشگاه بسته است؛ پیدا کردن نزدیک‌ترین شیفت بعدی برای امروز
    const upcoming = SHIFTS
      .map((s) => ({ ...s, startMin: s.start[0] * 60 + s.start[1] }))
      .filter((s) => s.startMin > nowMin)
      .sort((a, b) => a.startMin - b.startMin)[0];

    if (upcoming) {
      return {
        open: false,
        nextLabel: `${pad(upcoming.start[0])}:${pad(upcoming.start[1])}`,
      };
    }

    // بعد از آخرین شیفت امروز؛ شیفت بعدی، شیفت صبح فرداست
    const first = SHIFTS[0];
    return {
      open: false,
      nextLabel: `${pad(first.start[0])}:${pad(first.start[1])} فردا`,
    };
  }

  function render() {
    const now = new Date();
    const parts = getTehranParts(now);

    if (clockTimeEl) {
      clockTimeEl.textContent = `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
    }

    const status = computeStatus(parts);

    if (status.open) {
      if (statusTitleEl) statusTitleEl.textContent = "فروشگاه هم‌اکنون باز است";
      if (statusDetailEl) statusDetailEl.textContent = `تا ساعت ${status.endLabel} پاسخگوی شما هستیم.`;
      if (headerChipText) headerChipText.textContent = "باز است";
      [heroDotEl, headerDotEl].forEach((el) => {
        if (!el) return;
        el.classList.add("is-open");
        el.classList.remove("is-closed");
      });
    } else {
      if (statusTitleEl) statusTitleEl.textContent = "فروشگاه در حال حاضر بسته است";
      if (statusDetailEl) statusDetailEl.textContent = `شروع شیفت بعدی: ساعت ${status.nextLabel}`;
      if (headerChipText) headerChipText.textContent = "بسته است";
      [heroDotEl, headerDotEl].forEach((el) => {
        if (!el) return;
        el.classList.add("is-closed");
        el.classList.remove("is-open");
      });
    }
  }

  render();
  setInterval(render, 1000);

  /* ==========================================================
     انیمیشن ظاهر شدن عناصر هنگام اسکرول
     ========================================================== */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback برای مرورگرهای بدون پشتیبانی از IntersectionObserver
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
