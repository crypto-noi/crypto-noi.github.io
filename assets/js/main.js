/* =========================================================
   Крипто Ной — landing scripts
   ========================================================= */

(() => {
  const STORAGE_PREFIX = "noi.registered.";
  const EXCHANGES = ["bybit", "toobit", "weex"];

  // --- Reveal on scroll --------------------------------------------------

  const revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealables.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-visible"));
  }

  // --- Animated stats ----------------------------------------------------

  const formatStatValue = (n, prefix, suffix) => {
    const pretty = n >= 10000 ? n.toLocaleString("ru-RU").replace(/,/g, " ") : String(n);
    return `${prefix}${pretty}${suffix}`;
  };

  const animateCount = (el) => {
    const target = Number(el.dataset.count || "0");
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (!target) return;

    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = formatStatValue(value, prefix, suffix);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const statValues = document.querySelectorAll(".stat__value[data-count]");
  if (statValues.length) {
    if ("IntersectionObserver" in window) {
      const statsIO = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              statsIO.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.4 }
      );
      statValues.forEach((el) => statsIO.observe(el));
    } else {
      statValues.forEach(animateCount);
    }
  }

  // --- Hero video resilience --------------------------------------------

  const heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    const ensurePlay = () => {
      const p = heroVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    heroVideo.addEventListener("pause", ensurePlay);
    heroVideo.addEventListener("ended", ensurePlay);
    heroVideo.addEventListener("loadeddata", ensurePlay);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) ensurePlay();
    });
    // iOS sometimes needs a nudge after first interaction
    document.addEventListener(
      "touchstart",
      () => {
        if (heroVideo.paused) ensurePlay();
      },
      { once: true, passive: true }
    );
    ensurePlay();
  }

  // --- Gate (exchanges → unlock lesson) ---------------------------------

  const player = document.getElementById("player");
  const unlockBtn = document.getElementById("unlock-btn");
  const gateNote = document.getElementById("gate-note");
  const exchangeLinks = document.querySelectorAll(".exchange[data-exchange]");

  const isRegistered = (id) => {
    try {
      return localStorage.getItem(STORAGE_PREFIX + id) === "1";
    } catch {
      return false;
    }
  };

  const markRegistered = (id) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + id, "1");
    } catch {
      /* noop */
    }
  };

  const countRegistered = () =>
    EXCHANGES.reduce((acc, id) => acc + (isRegistered(id) ? 1 : 0), 0);

  const syncExchangeVisual = () => {
    exchangeLinks.forEach((el) => {
      const id = el.dataset.exchange;
      el.classList.toggle("is-done", isRegistered(id));
    });
  };

  const updateGateState = () => {
    const count = countRegistered();
    const ready = count > 0;

    if (unlockBtn) unlockBtn.disabled = !ready;

    if (gateNote) {
      gateNote.textContent = ready
        ? "Доступ открыт. Жми «Открыть урок»."
        : "Активируется после регистрации хотя бы на одной бирже";
    }
  };

  exchangeLinks.forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.exchange;
      if (!id) return;
      markRegistered(id);
      el.classList.add("is-done");
      updateGateState();
    });
  });

  if (unlockBtn) {
    unlockBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (unlockBtn.disabled) return;
      if (player) {
        player.classList.remove("locked");
        player.scrollIntoView({ behavior: "smooth", block: "center" });
        const video = player.querySelector("video");
        if (video) {
          setTimeout(() => {
            const p = video.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          }, 600);
        }
      }
    });
  }

  // Restore state on load
  syncExchangeVisual();
  updateGateState();
  if (countRegistered() > 0 && player) {
    player.classList.remove("locked");
  }

  // --- Footer year -------------------------------------------------------

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
