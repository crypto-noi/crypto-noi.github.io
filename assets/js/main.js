/* =========================================================
   Крипто Ной — landing scripts
   ========================================================= */

(() => {
  const STORAGE_PREFIX = "noi.registered.";
  const EXCHANGES = ["bingx", "bybit", "weex"];

  // Performance gate: skip JS animations on small viewports & reduced-motion users.
  const mobileMQ = window.matchMedia("(max-width: 768px)");
  const reducedMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMobile = () => mobileMQ.matches;
  const skipAnimations = () => isMobile() || reducedMotionMQ.matches;

  // --- Stat formatting ---------------------------------------------------

  const formatStatValue = (n, prefix, suffix) => {
    const pretty = n >= 10000 ? n.toLocaleString("ru-RU").replace(/,/g, " ") : String(n);
    return `${prefix}${pretty}${suffix}`;
  };

  const setStatFinal = (el) => {
    const target = Number(el.dataset.count || "0");
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    el.textContent = formatStatValue(target, prefix, suffix);
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

  const revealables = document.querySelectorAll(".reveal");
  const statValues = document.querySelectorAll(".stat__value[data-count]");

  if (skipAnimations()) {
    // Mobile / reduced motion → static, no IO, no rAF loops.
    revealables.forEach((el) => el.classList.add("is-visible"));
    statValues.forEach(setStatFinal);
  } else {
    // Desktop → keep the rich UX.
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
  }

  // --- Hero video: autoplay with manual fallback -------------------------

  const heroVideo = document.getElementById("hero-video");
  const heroPlayBtn = document.getElementById("hero-play-overlay");

  if (heroVideo && heroPlayBtn) {
    const showOverlay = () => {
      heroPlayBtn.hidden = false;
    };
    const hideOverlay = () => {
      heroPlayBtn.hidden = true;
    };

    const tryPlay = () => {
      const p = heroVideo.play();
      if (p && typeof p.then === "function") {
        p.then(hideOverlay).catch(showOverlay);
      }
    };

    heroVideo.addEventListener("play", hideOverlay);
    heroVideo.addEventListener("playing", hideOverlay);

    heroPlayBtn.addEventListener("click", () => {
      // Some browsers require muted=true to autoplay; user click already unblocks audio
      // but we still keep muted on the manual trigger to match initial UX.
      heroVideo.muted = true;
      tryPlay();
    });

    if (heroVideo.readyState >= 2) {
      tryPlay();
    } else {
      heroVideo.addEventListener("loadeddata", tryPlay, { once: true });
    }
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

  // Secondary "already have account" links (e.g. Bybit affiliate-bind) also
  // count as registration — user is already on the exchange.
  document.querySelectorAll(".exchange__alt-link[data-exchange]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.exchange;
      if (!id) return;
      markRegistered(id);
      const primary = document.querySelector(`.exchange[data-exchange="${id}"]`);
      if (primary) primary.classList.add("is-done");
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
