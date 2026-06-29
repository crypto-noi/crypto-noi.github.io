/* =========================================================
   Крипто Ной — landing scripts
   ========================================================= */

(() => {
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
    revealables.forEach((el) => el.classList.add("is-visible"));
    statValues.forEach(setStatFinal);
  } else {
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
  const heroSoundBtn = document.getElementById("hero-sound");

  if (heroVideo && heroPlayBtn) {
    const showOverlay = () => { heroPlayBtn.hidden = false; };
    const hideOverlay = () => { heroPlayBtn.hidden = true; };

    const syncSound = () => {
      if (!heroSoundBtn) return;
      const muted = heroVideo.muted || heroVideo.volume === 0;
      heroSoundBtn.classList.toggle("is-muted", muted);
      heroSoundBtn.setAttribute("aria-pressed", String(!muted));
      heroSoundBtn.setAttribute("aria-label", muted ? "Включить звук" : "Выключить звук");
      const label = heroSoundBtn.querySelector(".hero__player-sound-label");
      if (label) label.textContent = muted ? "Включить звук" : "Звук включён";
    };

    // Try to play; resolve tells us whether playback actually started.
    const attempt = () => {
      const p = heroVideo.play();
      return p && typeof p.then === "function" ? p : Promise.resolve();
    };

    // Browsers block unmuted autoplay without a user gesture — this is a
    // platform policy that cannot be bypassed. Strategy: start muted (always
    // allowed), then unmute on the very first interaction (scroll / click /
    // touch / keydown / mousemove). Sound kicks in the moment the user moves
    // the mouse or scrolls even one pixel — no button press required.
    let started = false;
    const startOnce = () => { if (started) return; started = true; start(); };

    let soundUnlocked = false;
    const unlockSound = () => {
      if (soundUnlocked) return;
      soundUnlocked = true;
      heroVideo.muted = false;
      if (heroVideo.volume === 0) heroVideo.volume = 1;
      syncSound();
      ["click","touchstart","scroll","keydown","mousemove"].forEach(ev =>
        window.removeEventListener(ev, unlockSound));
    };

    const start = () => {
      heroVideo.muted = true;
      attempt()
        .then(() => { hideOverlay(); syncSound(); })
        .catch(showOverlay);
      ["click","touchstart","scroll","keydown","mousemove"].forEach(ev =>
        window.addEventListener(ev, unlockSound, { passive: true }));
    };

    heroVideo.addEventListener("play", hideOverlay);
    heroVideo.addEventListener("playing", hideOverlay);
    heroVideo.addEventListener("volumechange", syncSound);

    if (heroSoundBtn) {
      heroSoundBtn.addEventListener("click", () => {
        heroVideo.muted = !heroVideo.muted;
        if (!heroVideo.muted && heroVideo.volume === 0) heroVideo.volume = 1;
        soundUnlocked = !heroVideo.muted;
        attempt().catch(() => {});
        syncSound();
      });
    }

    // Manual play fallback button.
    heroPlayBtn.addEventListener("click", () => {
      attempt().then(hideOverlay).catch(showOverlay).finally(syncSound);
    });

    // readyState 2 = HAVE_CURRENT_DATA, 3 = HAVE_FUTURE_DATA, 4 = HAVE_ENOUGH_DATA
    if (heroVideo.readyState >= 2) {
      startOnce();
    } else {
      heroVideo.addEventListener("loadeddata", startOnce, { once: true });
      heroVideo.addEventListener("canplay", startOnce, { once: true });
    }

    syncSound();
  }

  // --- Footer year -------------------------------------------------------

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ==========================================================================
  // Чат-ассистент — пошаговый онбординг
  // ==========================================================================

  const EXCHANGES = {
    bingx: {
      name: "BingX",
      url: "https://bingxdao.com/invite/PXZSFD",
    },
    bybit: {
      name: "Bybit",
      url: "https://partner.bybit.com/b/noi",
      alt: {
        label: "Уже есть аккаунт Bybit — привязать",
        url: "https://www.bybit.com/ru-RU/aff-bind?affiliate_id=44222",
      },
    },
    weex: {
      name: "Weex",
      url: "https://www.weex.com/ru/register?vipCode=2c7d",
    },
  };

  const STORAGE_KEY = "noi.chat.v1";
  const TYPING_BASE_MS = skipAnimations() ? 220 : 520;

  const defaultState = () => ({
    step: "greet", // greet | choose | go | uid | done
    exchange: null,
    visited: false,
    uid: null,
  });

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  };

  const saveState = (s) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  };

  const clearState = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  let state = loadState();

  const chat = document.getElementById("chat");
  const launcher = document.getElementById("chat-launcher");
  const panel = document.getElementById("chat-panel");
  const messagesEl = document.getElementById("chat-messages");
  const inputForm = document.getElementById("chat-input-form");
  const inputField = document.getElementById("chat-input-field");
  const resetBtn = document.getElementById("chat-reset");
  const closeBtn = document.getElementById("chat-close");
  const lessonsEl = document.getElementById("lessons");
  const lessonVideo = document.getElementById("lesson-video");

  if (!chat || !launcher || !panel || !messagesEl) return;

  // Play buttons inside the lessons grid
  document.querySelectorAll("[data-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const video = document.getElementById(btn.dataset.play);
      if (!video) return;
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      video.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  const openChat = () => {
    panel.hidden = false;
    // next frame so transition runs
    requestAnimationFrame(() => {
      chat.dataset.open = "true";
    });
    // If we're at the initial step and the log is empty, kick off the greet flow.
    if (state.step === "greet" && messagesEl.childElementCount === 0) {
      runGreet();
    }
    setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 50);
  };

  const closeChat = () => {
    chat.dataset.open = "false";
    setTimeout(() => { panel.hidden = true; }, 220);
  };

  document.querySelectorAll('[data-open-chat], #open-chat').forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openChat();
    });
  });

  launcher.addEventListener("click", openChat);
  closeBtn?.addEventListener("click", closeChat);

  resetBtn?.addEventListener("click", () => {
    clearState();
    state = defaultState();
    messagesEl.innerHTML = "";
    inputForm.hidden = true;
    // re-lock lessons
    lockLessons();
    runGreet();
  });

  // --- Renderers ---------------------------------------------------------

  const appendRow = (who, content, actions) => {
    const row = document.createElement("div");
    row.className = `chat-row chat-row--${who}`;

    if (content) {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      // content can be string or DocumentFragment / element
      if (typeof content === "string") bubble.innerHTML = content;
      else bubble.appendChild(content);
      row.appendChild(bubble);
    }

    if (actions && actions.length) {
      const actionsEl = document.createElement("div");
      actionsEl.className = "chat-actions";
      actions.forEach((a) => actionsEl.appendChild(a));
      row.appendChild(actionsEl);
    }

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
  };

  const showTyping = () => {
    const row = document.createElement("div");
    row.className = "chat-row chat-row--bot";
    const typing = document.createElement("div");
    typing.className = "chat-bubble chat-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    row.appendChild(typing);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
  };

  const botSay = (htmlOrEl, opts = {}) =>
    new Promise((resolve) => {
      const typingRow = showTyping();
      const delay = opts.delay ?? TYPING_BASE_MS;
      setTimeout(() => {
        typingRow.remove();
        const row = appendRow("bot", htmlOrEl, opts.actions);
        resolve(row);
      }, delay);
    });

  const userSay = (text) => appendRow("user", escapeHtml(text));

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  const makeBtn = (label, opts = {}) => {
    const isLink = !!opts.href;
    const el = document.createElement(isLink ? "a" : "button");
    el.className = `chat-action${opts.ghost ? " chat-action--ghost" : ""}`;
    if (isLink) {
      el.href = opts.href;
      el.target = "_blank";
      el.rel = "noopener";
    } else {
      el.type = "button";
    }
    el.innerHTML = opts.icon ? `${opts.icon} ${label}` : label;
    if (opts.onClick) el.addEventListener("click", opts.onClick);
    return el;
  };

  // --- Flow steps --------------------------------------------------------

  const persist = () => saveState(state);

  const runGreet = async () => {
    state.step = "greet";
    persist();
    await botSay(
      "Привет 👋 Я ассистент Алексея — помогу открыть бесплатный урок по стратегии <strong>«Макдивер»</strong>."
    );
    await botSay(
      "Пройдём короткую инструкцию из 3 шагов. Готов?",
      {
        delay: 700,
        actions: [
          makeBtn("Поехали", { onClick: runChoose }),
        ],
      }
    );
  };

  const runChoose = async () => {
    userSay("Поехали");
    state.step = "choose";
    persist();
    await botSay("Выбери биржу, на которой удобнее зарегистрироваться:", {
      actions: Object.entries(EXCHANGES).map(([id, ex]) =>
        makeBtn(ex.name, { onClick: () => runGo(id) })
      ),
    });
  };

  const runGo = async (id) => {
    const ex = EXCHANGES[id];
    if (!ex) return;
    state.exchange = id;
    state.step = "go";
    state.visited = false;
    persist();

    userSay(ex.name);

    await botSay(
      `Отлично, <strong>${ex.name}</strong>. Перейди по ссылке ниже, заведи аккаунт и вернись сюда.`
    );

    const linkBtn = makeBtn(`Открыть ${ex.name} →`, {
      href: ex.url,
      onClick: () => {
        state.visited = true;
        persist();
      },
    });

    const actions = [linkBtn];

    if (ex.alt) {
      actions.push(
        makeBtn(ex.alt.label, {
          href: ex.alt.url,
          ghost: true,
          onClick: () => {
            state.visited = true;
            persist();
          },
        })
      );
    }

    await botSay("Открой ссылку в новой вкладке:", { actions });

    await botSay("Когда зарегистрируешься — жми кнопку ниже.", {
      delay: 700,
      actions: [
        makeBtn("Я зарегистрировался", { onClick: runUid }),
        makeBtn("Другую биржу", { ghost: true, onClick: runChoose }),
      ],
    });
  };

  const runUid = async () => {
    userSay("Я зарегистрировался");
    state.step = "uid";
    persist();
    await botSay(
      "Огонь. Теперь введи свой <strong>UID</strong> — это идентификатор твоего аккаунта на бирже (обычно цифры, найдёшь в профиле)."
    );
    await botSay("Введи UID в поле ниже:", { delay: 600 });

    inputForm.hidden = false;
    inputField.value = "";
    inputField.focus();
  };

  const runDone = async (uid) => {
    state.uid = uid;
    state.step = "done";
    persist();

    inputForm.hidden = true;
    userSay(`UID: ${uid}`);

    await botSay("Принято ✅");
    await botSay(
      "Проверяю аккаунт…",
      { delay: 800 }
    );
    await botSay(
      "Готово. Доступ к бесплатному уроку открыт.",
      {
        delay: 1100,
        actions: [
          makeBtn("Смотреть урок", { onClick: unlockAndGoToLesson }),
        ],
      }
    );

    // Unlock the lesson player immediately so the user sees it the moment they close chat.
    unlockLesson();
  };

  const unlockLesson = () => {
    if (lessonsEl) lessonsEl.dataset.locked = "false";
  };

  const lockLessons = () => {
    if (lessonsEl) lessonsEl.dataset.locked = "true";
  };

  const unlockAndGoToLesson = () => {
    unlockLesson();
    closeChat();
    const target = document.getElementById("lesson");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      if (lessonVideo) {
        const p = lessonVideo.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    }, 600);
  };

  const UID_MIN = 6;
  const UID_MAX = 15;
  let lastErrorRow = null;

  const showError = (text) => {
    if (lastErrorRow) {
      lastErrorRow.remove();
      lastErrorRow = null;
    }
    const row = document.createElement("div");
    row.className = "chat-row chat-row--bot";
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-bubble--error";
    bubble.innerHTML = text;
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    lastErrorRow = row;
  };

  const clearError = () => {
    if (lastErrorRow) {
      lastErrorRow.remove();
      lastErrorRow = null;
    }
    inputField.classList.remove("is-invalid");
  };

  inputField?.addEventListener("input", () => {
    if (inputField.classList.contains("is-invalid")) clearError();
  });

  inputForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = (inputField.value || "").trim();

    if (v.length < UID_MIN || v.length > UID_MAX) {
      inputField.classList.add("is-invalid");
      inputField.focus();
      inputField.select();
      showError("UID введён некорректно. Проверьте правильность ввода.");
      return;
    }

    clearError();
    runDone(v);
  });

  // --- Restore from saved state -----------------------------------------

  const restore = async () => {
    // Trivial restore: just replay the final state without typing animations.
    if (state.step === "greet") return; // nothing to render yet

    const quick = (htmlOrEl, opts = {}) => appendRow("bot", htmlOrEl, opts.actions);
    const quickUser = (t) => userSay(t);

    quick("Привет 👋 Я ассистент Алексея — помогу открыть бесплатный урок по стратегии <strong>«Макдивер»</strong>.");
    quick("Пройдём короткую инструкцию из 3 шагов. Готов?");

    if (state.step === "choose") {
      quickUser("Поехали");
      quick("Выбери биржу, на которой удобнее зарегистрироваться:", {
        actions: Object.entries(EXCHANGES).map(([id, ex]) =>
          makeBtn(ex.name, { onClick: () => runGo(id) })
        ),
      });
      return;
    }

    if (state.exchange) {
      quickUser("Поехали");
      const ex = EXCHANGES[state.exchange];
      quickUser(ex.name);
      quick(`Отлично, <strong>${ex.name}</strong>. Перейди по ссылке ниже, заведи аккаунт и вернись сюда.`);

      const actions = [
        makeBtn(`Открыть ${ex.name} →`, {
          href: ex.url,
          onClick: () => { state.visited = true; persist(); },
        }),
      ];
      if (ex.alt) {
        actions.push(makeBtn(ex.alt.label, {
          href: ex.alt.url,
          ghost: true,
          onClick: () => { state.visited = true; persist(); },
        }));
      }
      quick("Открой ссылку в новой вкладке:", { actions });
    }

    if (state.step === "go") {
      quick("Когда зарегистрируешься — жми кнопку ниже.", {
        actions: [
          makeBtn("Я зарегистрировался", { onClick: runUid }),
          makeBtn("Другую биржу", { ghost: true, onClick: runChoose }),
        ],
      });
      return;
    }

    if (state.step === "uid") {
      quickUser("Я зарегистрировался");
      quick("Огонь. Теперь введи свой <strong>UID</strong> — это идентификатор твоего аккаунта на бирже (обычно цифры, найдёшь в профиле).");
      quick("Введи UID в поле ниже:");
      inputForm.hidden = false;
      return;
    }

    if (state.step === "done") {
      quickUser("Я зарегистрировался");
      quick("Огонь. Теперь введи свой <strong>UID</strong> — это идентификатор твоего аккаунта на бирже (обычно цифры, найдёшь в профиле).");
      quickUser(`UID: ${state.uid || ""}`);
      quick("Принято ✅");
      quick("Готово. Доступ к бесплатному уроку открыт.", {
        actions: [makeBtn("Смотреть урок", { onClick: unlockAndGoToLesson })],
      });
      unlockLesson();
    }
  };

  // If user previously completed the flow, lesson stays unlocked across reloads.
  if (state.step === "done") unlockLesson();

  // Pre-render history so users can re-open the chat and continue.
  restore();

  // --- Voice testimonial player -----------------------------------------

  const SPEEDS = [
    { rate: 1, label: "1×" },
    { rate: 1.25, label: "1.25×" },
    { rate: 1.5, label: "1.5×" },
    { rate: 1.75, label: "1.75×" },
    { rate: 2, label: "2×" },
  ];
  const DEFAULT_SPEED_IDX = 2; // 1.5× by default — the voice is slow

  const initPlayer = (player) => {
    const audio = player.querySelector("[data-audio]");
    const btn = player.querySelector("[data-play]");
    const wave = player.querySelector("[data-wave]");
    const timeEl = player.querySelector("[data-time]");
    const speedBtn = player.querySelector("[data-speed]");
    const card = player.closest(".testimonial");
    const metaDurationEl = card && card.querySelector("[data-meta-duration]");
    if (!audio || !btn || !wave) return;

    const BAR_COUNT = 38;
    const bars = [];
    wave.innerHTML = "";
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement("span");
      bar.className = "bar";
      const wobble = Math.sin(i * 0.7) * 22 + Math.sin(i * 1.9 + 1.3) * 14;
      const h = Math.max(18, Math.min(96, 55 + wobble));
      bar.style.height = h + "%";
      wave.appendChild(bar);
      bars.push(bar);
    }

    const fmt = (t) => {
      if (!isFinite(t) || t < 0) t = 0;
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      return m + ":" + String(s).padStart(2, "0");
    };

    let speedIdx = DEFAULT_SPEED_IDX;
    const applySpeed = () => {
      audio.playbackRate = SPEEDS[speedIdx].rate;
      if (speedBtn) speedBtn.textContent = SPEEDS[speedIdx].label;
    };
    applySpeed();

    if (speedBtn) {
      speedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        speedIdx = (speedIdx + 1) % SPEEDS.length;
        applySpeed();
      });
    }

    btn.addEventListener("click", () => {
      if (audio.paused) {
        document.querySelectorAll("[data-audio]").forEach((a) => {
          if (a !== audio) a.pause();
        });
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });

    wave.addEventListener("click", (e) => {
      const d = audio.duration;
      if (!isFinite(d) || d <= 0) return;
      const rect = wave.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * d;
    });

    audio.addEventListener("play", () => player.classList.add("is-playing"));
    audio.addEventListener("pause", () => player.classList.remove("is-playing"));
    audio.addEventListener("ended", () => {
      player.classList.remove("is-playing");
      bars.forEach((b) => b.classList.remove("is-active"));
      if (timeEl) timeEl.textContent = fmt(audio.duration);
    });

    audio.addEventListener("loadedmetadata", () => {
      const d = audio.duration;
      if (timeEl) timeEl.textContent = fmt(d);
      if (metaDurationEl) metaDurationEl.textContent = fmt(d);
    });

    audio.addEventListener("timeupdate", () => {
      const d = audio.duration || 0;
      const c = audio.currentTime || 0;
      const p = d ? c / d : 0;
      const fillCount = Math.round(p * BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        bars[i].classList.toggle("is-active", i < fillCount);
      }
      if (timeEl) timeEl.textContent = fmt(d - c);
    });
  };

  document.querySelectorAll("[data-player]").forEach(initPlayer);
})();
