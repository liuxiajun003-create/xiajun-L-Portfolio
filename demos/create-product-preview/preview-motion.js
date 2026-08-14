(function (global) {
  var SCROLL_MS = 400;
  var BEAM_MS = 420;
  var BEAM_HOLD_MS = 200;
  var BEAM_FADE_MS = 220;
  var HIGHLIGHT_IN_MS = 180;
  var HIGHLIGHT_HOLD_MS = 700;
  var HIGHLIGHT_OUT_MS = 250;
  var FADE_OUT_MS = 100;
  var FADE_IN_MS = 160;
  var CROSSFADE_MS = 220;
  var TYPING_DEBOUNCE_MS = 100;
  var STREAM_CHAR_MS = 18;
  var PASTE_CHAR_THRESHOLD = 3;
  var PHONE_CTA_RESERVE = 62;

  var FIELD_TARGETS = {
    productPhotos: '[data-preview="hero"]',
    productName: '[data-preview="title"]',
    productNameEn: '[data-preview="title"]',
    regularPrice: '[data-preview="price-current"]',
    sellingPrice: '[data-preview="price-current"]',
    recommendedUsers: '[data-preview="note-3"]',
    availableStores: '[data-preview="info-1"]',
    dineInRules: '[data-preview="info-0"]',
    validityPeriod: '[data-preview="note-1"]',
    availableHours: '[data-preview="note-2"]',
    reservationRules: '[data-preview="note-4"]',
    additionalInfo: '[data-preview="note-4"]',
    additionalInfoEn: '[data-preview="note-4"]',
    salePeriod: '[data-preview="info-0"]',
    limitPurchase: '[data-preview="note-4"]',
    unavailableDays: '[data-preview="note-1"]',
    minimumPurchase: '[data-preview="cta"]',
  };

  var scrollRoot = null;
  var activeField = null;
  var focusEffectsField = null;
  var focusHighlightTimer = null;
  var pulseHighlightTimer = null;
  var highlightEl = null;
  var scrollRafId = null;
  var textAnimStates = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  var beamLayer = null;
  var beamTimers = [];
  var beamAnimRaf = null;
  var landingEl = null;
  var LANDING_IN_MS = 280;
  var lastInputLengths = {};

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function getScrollRoot() {
    if (!scrollRoot) scrollRoot = document.querySelector(".phone-content");
    return scrollRoot;
  }

  function resolveSource(fieldKey) {
    var byName = document.querySelector('[name="' + fieldKey + '"]');
    if (byName) {
      return byName.closest(".ttgo-input") || byName.closest(".ttgo-textarea") || byName.closest(".field") || byName;
    }
    if (fieldKey === "productPhotos") {
      var photoBtn = document.querySelector(".photo-add");
      return photoBtn ? photoBtn.closest(".field") || photoBtn : null;
    }
    if (fieldKey === "availableStores") {
      var storesBtn = document.querySelector(".add-stores");
      return storesBtn ? storesBtn.closest(".field") || storesBtn : null;
    }
    var selectedRadio = document.querySelector(
      '.radio-item[data-group="' + fieldKey + '"].radio-item--selected'
    );
    if (selectedRadio) return selectedRadio.closest(".field") || selectedRadio;
    var radio = document.querySelector('.radio-item[data-group="' + fieldKey + '"]');
    if (radio) return radio.closest(".field") || radio;
    var checkbox = document.querySelector('.checkbox-item[data-group="' + fieldKey + '"]');
    if (checkbox) return checkbox.closest(".field") || checkbox;
    return null;
  }

  function getAnchorPoint(el, side) {
    var r = el.getBoundingClientRect();
    if (side === "out") return { x: r.right - 2, y: r.top + r.height * 0.5 };
    if (side === "in") return { x: r.left + 2, y: r.top + r.height * 0.5 };
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
  }

  function buildBeamPath(from, to, bend) {
    var dx = to.x - from.x;
    var cp1 = { x: from.x + dx * 0.42, y: from.y + bend * 0.35 };
    var cp2 = { x: from.x + dx * 0.58, y: to.y - bend * 0.35 };
    return (
      "M" +
      from.x +
      " " +
      from.y +
      " C" +
      cp1.x +
      " " +
      cp1.y +
      ", " +
      cp2.x +
      " " +
      cp2.y +
      ", " +
      to.x +
      " " +
      to.y
    );
  }

  function getLandingElement(fieldKey) {
    var selector = FIELD_TARGETS[fieldKey];
    if (!selector) return null;
    if (fieldKey === "productName" || fieldKey === "productNameEn") {
      return document.querySelector(".phone-title__content") || document.querySelector(selector);
    }
    return document.querySelector(selector);
  }

  function clearLandingFeedback() {
    if (!landingEl) return;
    landingEl.classList.remove("preview-landing");
    landingEl = null;
  }

  function showLandingFeedback(el) {
    clearLandingFeedback();
    if (!el) return;
    landingEl = el;
    el.classList.add("preview-landing");
  }

  function getLandingAnchor(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + 4, y: r.bottom - 1 };
  }

  function ensureBeamLayer() {
    if (beamLayer && !beamLayer.querySelector(".preview-beam-dot")) {
      beamLayer.remove();
      beamLayer = null;
    }
    if (beamLayer) return beamLayer;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "preview-beam-layer");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML =
      '<defs>' +
      '<linearGradient id="preview-beam-gradient" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0%" stop-color="#11B92E" stop-opacity="0.26"/>' +
      '<stop offset="100%" stop-color="#11B92E" stop-opacity="0.42"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<g class="preview-beam-lines"></g>' +
      '<circle class="preview-beam-dot" r="2" cx="0" cy="0"></circle>' +
      '<circle class="preview-beam-impact" r="0" cx="0" cy="0"></circle>';
    document.body.appendChild(svg);
    beamLayer = svg;
    return svg;
  }

  function clearBeam() {
    beamTimers.forEach(clearTimeout);
    beamTimers = [];
    if (beamAnimRaf) {
      cancelAnimationFrame(beamAnimRaf);
      beamAnimRaf = null;
    }
    if (!beamLayer) return;
    var lines = beamLayer.querySelector(".preview-beam-lines");
    if (lines) lines.innerHTML = "";
    var dot = beamLayer.querySelector(".preview-beam-dot");
    if (dot) {
      dot.setAttribute("cx", "0");
      dot.setAttribute("cy", "0");
      dot.style.opacity = "0";
    }
    var impact = beamLayer.querySelector(".preview-beam-impact");
    if (impact) {
      impact.setAttribute("r", "0");
      impact.style.opacity = "0";
    }
    beamLayer.classList.remove("is-active", "is-fading");
  }

  function fireBeam(sourceEl, landingEl, onDone) {
    if (!sourceEl || !landingEl) {
      if (onDone) onDone();
      return;
    }

    clearBeam();
    var svg = ensureBeamLayer();
    var linesGroup = svg.querySelector(".preview-beam-lines");
    var dot = svg.querySelector(".preview-beam-dot");
    var impact = svg.querySelector(".preview-beam-impact");
    var from = getAnchorPoint(sourceEl, "out");
    var to = getLandingAnchor(landingEl);
    var bend = Math.max(18, Math.min(72, Math.abs(to.y - from.y) * 0.45));

    svg.setAttribute("width", String(window.innerWidth));
    svg.setAttribute("height", String(window.innerHeight));
    svg.classList.add("is-active");

    var gradient = svg.querySelector("#preview-beam-gradient");
    if (gradient) {
      gradient.setAttribute("x1", String(from.x));
      gradient.setAttribute("y1", String(from.y));
      gradient.setAttribute("x2", String(to.x));
      gradient.setAttribute("y2", String(to.y));
    }

    var d = buildBeamPath(from, to, bend);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "preview-beam-path");
    linesGroup.appendChild(path);

    var pathLen = path.getTotalLength();
    path.style.strokeDasharray = String(pathLen);
    path.style.strokeDashoffset = String(pathLen);
    path.style.opacity = "1";

    if (dot) {
      dot.setAttribute("cx", String(from.x));
      dot.setAttribute("cy", String(from.y));
      dot.style.opacity = "0";
    }

    impact.setAttribute("cx", String(to.x));
    impact.setAttribute("cy", String(to.y));
    impact.style.opacity = "0";

    var start = 0;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / BEAM_MS, 1);
      var eased = easeOutCubic(t);
      path.style.strokeDashoffset = String(pathLen * (1 - eased));
      if (dot) {
        var pt = path.getPointAtLength(pathLen * eased);
        dot.setAttribute("cx", String(pt.x));
        dot.setAttribute("cy", String(pt.y));
        dot.style.opacity = t < 1 ? String(0.55 + eased * 0.35) : "0";
      }
      if (t < 1) {
        beamAnimRaf = requestAnimationFrame(step);
      } else {
        beamAnimRaf = null;
        if (dot) dot.style.opacity = "0";
        showLandingFeedback(landingEl);
        if (onDone) onDone();
        impact.style.opacity = "0.7";
        impact.setAttribute("r", "1.5");
        requestAnimationFrame(function () {
          impact.setAttribute("r", "2.5");
        });
        beamTimers.push(
          setTimeout(function () {
            svg.classList.add("is-fading");
            impact.style.opacity = "0";
          }, BEAM_HOLD_MS)
        );
        beamTimers.push(
          setTimeout(function () {
            clearBeam();
            svg.classList.remove("is-fading");
          }, BEAM_HOLD_MS + BEAM_FADE_MS)
        );
      }
    }
    requestAnimationFrame(function () {
      beamAnimRaf = requestAnimationFrame(step);
    });
  }

  function needsScroll(target) {
    var container = getScrollRoot();
    if (!container || !target) return false;
    if (!container.contains(target)) return false;
    return !isInView(container, target);
  }

  function resolveTarget(selector) {
    var node = document.querySelector(selector);
    if (!node) return null;
    if (node.matches('[data-preview="hero"]')) return node;
    if (node.matches(".phone-info-row, .phone-note-item, .phone-title")) return node;
    if (node.matches('[data-preview="price-current"]')) {
      return node.closest(".phone-card") || node;
    }
    if (node.matches('[data-preview="title"]')) {
      return node.closest(".phone-card") || node;
    }
    if (node.matches('[data-preview="cta"]')) {
      return node.closest(".phone-cta-bar") || node;
    }
    return node.closest(".phone-card") || node;
  }

  function isInView(container, el) {
    var cRect = container.getBoundingClientRect();
    var eRect = el.getBoundingClientRect();
    var paddingTop = 12;
    var paddingBottom = 12 + PHONE_CTA_RESERVE;
    return eRect.top >= cRect.top + paddingTop && eRect.bottom <= cRect.bottom - paddingBottom;
  }

  function cancelScroll() {
    if (scrollRafId) {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = null;
    }
  }

  function animateScrollTo(container, targetTop, onDone) {
    cancelScroll();
    var start = container.scrollTop;
    var change = targetTop - start;
    if (Math.abs(change) < 2) {
      if (onDone) onDone();
      return;
    }
    var startTime = 0;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / SCROLL_MS, 1);
      container.scrollTop = start + change * easeOutCubic(progress);
      if (progress < 1) {
        scrollRafId = requestAnimationFrame(step);
      } else {
        scrollRafId = null;
        if (onDone) onDone();
      }
    }
    scrollRafId = requestAnimationFrame(step);
  }

  function scrollToTarget(target, onDone) {
    var container = getScrollRoot();
    if (!container || !target) {
      if (onDone) onDone();
      return;
    }
    if (!container.contains(target)) {
      if (onDone) onDone();
      return;
    }
    if (isInView(container, target)) {
      if (onDone) onDone();
      return;
    }

    var cRect = container.getBoundingClientRect();
    var tRect = target.getBoundingClientRect();
    var edgePadding = 12;
    var bottomLimit = cRect.bottom - PHONE_CTA_RESERVE - edgePadding;
    var nextTop = container.scrollTop;

    if (tRect.bottom > bottomLimit) {
      nextTop += tRect.bottom - bottomLimit;
    } else if (tRect.top < cRect.top + edgePadding) {
      nextTop += tRect.top - cRect.top - edgePadding;
    } else {
      if (onDone) onDone();
      return;
    }

    var maxScroll = container.scrollHeight - container.clientHeight;
    animateScrollTo(container, Math.max(0, Math.min(maxScroll, nextTop)), onDone);
  }

  function clearFocusHighlight(immediate) {
    if (focusHighlightTimer) {
      clearTimeout(focusHighlightTimer);
      focusHighlightTimer = null;
    }
    if (!highlightEl) return;
    var el = highlightEl;
    highlightEl = null;
    el.classList.remove("is-highlight-active", "is-highlight-fade");
    if (immediate) {
      el.classList.remove("preview-highlight");
      return;
    }
    el.classList.add("is-highlight-fade");
    focusHighlightTimer = setTimeout(function () {
      el.classList.remove("preview-highlight", "is-highlight-fade");
      focusHighlightTimer = null;
    }, HIGHLIGHT_OUT_MS);
  }

  function pulseHighlight(target) {
    if (!target) return;
    if (pulseHighlightTimer) {
      clearTimeout(pulseHighlightTimer);
      pulseHighlightTimer = null;
    }
    target.classList.add("preview-highlight", "preview-highlight--pulse");
    requestAnimationFrame(function () {
      target.classList.add("is-highlight-active");
    });
    pulseHighlightTimer = setTimeout(function () {
      target.classList.remove("is-highlight-active");
      target.classList.add("is-highlight-fade");
      pulseHighlightTimer = setTimeout(function () {
        target.classList.remove("preview-highlight", "preview-highlight--pulse", "is-highlight-fade");
        pulseHighlightTimer = null;
      }, HIGHLIGHT_OUT_MS);
    }, HIGHLIGHT_IN_MS + 320);
  }

  function showHighlight(target) {
    if (!target) return;
    clearFocusHighlight(true);
    target.classList.remove("preview-highlight--pulse");
    target.classList.add("preview-highlight");
    requestAnimationFrame(function () {
      target.classList.add("is-highlight-active");
    });
    highlightEl = target;
    focusHighlightTimer = setTimeout(function () {
      if (highlightEl !== target) return;
      target.classList.remove("is-highlight-active");
      target.classList.add("is-highlight-fade");
      focusHighlightTimer = setTimeout(function () {
        target.classList.remove("preview-highlight", "is-highlight-fade");
        if (highlightEl === target) highlightEl = null;
        focusHighlightTimer = null;
      }, HIGHLIGHT_OUT_MS);
    }, HIGHLIGHT_IN_MS + HIGHLIGHT_HOLD_MS);
  }

  function launchFieldBeam(fieldKey, withHighlight) {
    var selector = FIELD_TARGETS[fieldKey];
    if (!selector) return;
    var target = resolveTarget(selector);
    var landing = getLandingElement(fieldKey) || target;
    if (!landing) return;
    var source = resolveSource(fieldKey);

    requestAnimationFrame(function () {
      if (source) {
        fireBeam(source, landing, withHighlight
          ? function () {
              showHighlight(landing);
            }
          : null);
      } else {
        showLandingFeedback(landing);
        if (withHighlight) showHighlight(landing);
      }
    });
  }

  function onFieldFocus(fieldKey) {
    if (!fieldKey) return;
    var isNewField = fieldKey !== focusEffectsField;
    activeField = fieldKey;
    focusEffectsField = fieldKey;

    var selector = FIELD_TARGETS[fieldKey];
    if (!selector) return;
    var target = resolveTarget(selector);
    if (!target) return;

    function afterScroll() {
      launchFieldBeam(fieldKey, true);
    }

    if (isNewField && needsScroll(target)) {
      scrollToTarget(target, afterScroll);
    } else if (isNewField) {
      afterScroll();
    }
  }

  function onFieldInput(fieldKey, inputEl) {
    if (!fieldKey || !CURSOR_FIELDS[fieldKey]) return;
    if (!inputEl) return;

    var nextLen = inputEl.value.length;
    var prevLen = lastInputLengths[fieldKey];
    if (prevLen == null) prevLen = Math.max(0, nextLen - 1);
    lastInputLengths[fieldKey] = nextLen;
    if (nextLen <= prevLen) return;

    activeField = fieldKey;
    launchFieldBeam(fieldKey, false);
  }

  function renderTextWithTypingTail(el, text) {
    text = text == null ? "" : String(text);
    el.textContent = "";
    if (!text) return null;
    if (text.length === 1) {
      var single = document.createElement("span");
      single.className = "preview-typing-tail";
      single.textContent = text;
      el.appendChild(single);
      return single;
    }
    el.appendChild(document.createTextNode(text.slice(0, -1)));
    var tail = document.createElement("span");
    tail.className = "preview-typing-tail";
    tail.textContent = text.slice(-1);
    el.appendChild(tail);
    return tail;
  }

  function updateTypingText(el, text) {
    if (!el) return;
    var tailEl = renderTextWithTypingTail(el, text);
    el.classList.add("preview-text-anim", "is-visible");
    if (!tailEl) return;
    tailEl.classList.remove("preview-typing-pop");
    void tailEl.offsetWidth;
    tailEl.classList.add("preview-typing-pop");
  }

  function getTextState(el) {
    if (!textAnimStates) {
      return {
        gen: 0,
        timer: null,
        burst: false,
        streamTimer: null,
        streamGen: 0,
        streaming: false,
      };
    }
    if (!textAnimStates.has(el)) {
      textAnimStates.set(el, {
        gen: 0,
        timer: null,
        burst: false,
        streamTimer: null,
        streamGen: 0,
        streaming: false,
      });
    }
    return textAnimStates.get(el);
  }

  function cancelTextStream(state) {
    if (!state) return;
    if (state.streamTimer) clearTimeout(state.streamTimer);
    state.streamTimer = null;
    state.streamGen = (state.streamGen || 0) + 1;
    state.streaming = false;
  }

  function isPasteLike(prev, next) {
    if (next === prev) return false;
    var added = next.length - prev.length;
    if (added >= PASTE_CHAR_THRESHOLD) return true;
    if (added < 0) return false;
    if (!prev.length || !next.length) return added >= PASTE_CHAR_THRESHOLD;
    var i = 0;
    var minLen = Math.min(prev.length, next.length);
    while (i < minLen && prev.charAt(i) === next.charAt(i)) i += 1;
    var changed = Math.max(prev.length, next.length) - i;
    return changed >= PASTE_CHAR_THRESHOLD;
  }

  function getStreamDelay(totalLen) {
    if (totalLen > 120) return 8;
    if (totalLen > 60) return 12;
    return STREAM_CHAR_MS;
  }

  function getStreamStep(totalLen, index) {
    var remaining = totalLen - index;
    if (remaining > 200) return 4;
    if (remaining > 80) return 2;
    return 1;
  }

  function streamFromIndex(el, text, index, state) {
    cancelTextStream(state);
    state.streaming = true;
    state.streamGen = (state.streamGen || 0) + 1;
    var gen = state.streamGen;
    var delay = getStreamDelay(text.length);

    function tick() {
      if (state.streamGen !== gen) return;
      if (index >= text.length) {
        state.streaming = false;
        state.streamTimer = null;
        el.classList.add("is-visible");
        return;
      }
      var step = getStreamStep(text.length, index);
      index = Math.min(text.length, index + step);
      updateTypingText(el, text.substring(0, index));
      state.streamTimer = setTimeout(tick, delay);
    }

    el.classList.add("preview-text-anim", "is-visible");
    tick();
  }

  function applyTextStream(el, text) {
    var state = getTextState(el);
    cancelTextStream(state);
    if (state.timer) clearTimeout(state.timer);
    state.burst = false;
    state.timer = null;

    var prev = el.textContent;
    if (prev === text) return;

    el.classList.add("preview-text-anim");

    if (prev && text.indexOf(prev) !== 0) {
      state.streamGen = (state.streamGen || 0) + 1;
      var fadeGen = state.streamGen;
      el.classList.remove("is-visible");
      el.classList.add("is-fading-out");
      setTimeout(function () {
        if (state.streamGen !== fadeGen) return;
        el.textContent = "";
        el.classList.remove("is-fading-out");
        streamFromIndex(el, text, 0, state);
      }, FADE_OUT_MS);
      return;
    }

    var startIdx = prev.length;
    el.textContent = text.substring(0, startIdx);
    streamFromIndex(el, text, startIdx, state);
  }

  function applyTextFade(el, text) {
    cancelTextStream(getTextState(el));
    el.classList.add("preview-text-anim");
    el.classList.remove("is-visible");
    el.classList.add("is-fading-out");

    setTimeout(function () {
      if (el.textContent === text) {
        el.classList.remove("is-fading-out");
        el.classList.add("is-visible");
        return;
      }
      el.textContent = text;
      el.classList.remove("is-fading-out");
      el.classList.add("is-fading-in");
      requestAnimationFrame(function () {
        el.classList.remove("is-fading-in");
        el.classList.add("is-visible");
      });
    }, FADE_OUT_MS);
  }

  function setText(el, text, animate) {
    if (!el) return;
    text = text == null ? "" : String(text);
    if (el.textContent === text) return;

    if (!animate) {
      cancelTextStream(getTextState(el));
      el.textContent = text;
      return;
    }

    var state = getTextState(el);
    var prev = el.textContent;

    if (state.streaming && !isPasteLike(prev, text)) {
      cancelTextStream(state);
      updateTypingText(el, text);
      if (state.timer) clearTimeout(state.timer);
      state.burst = true;
      state.timer = setTimeout(function () {
        state.burst = false;
        state.timer = null;
      }, TYPING_DEBOUNCE_MS * 2);
      return;
    }

    if (isPasteLike(prev, text)) {
      if (state.timer) clearTimeout(state.timer);
      state.burst = false;
      state.timer = null;
      applyTextStream(el, text);
      return;
    }

    if (state.timer) clearTimeout(state.timer);

    if (state.burst) {
      updateTypingText(el, text);
      state.timer = setTimeout(function () {
        state.burst = false;
        state.timer = null;
      }, TYPING_DEBOUNCE_MS * 2);
      return;
    }

    updateTypingText(el, text);
    state.burst = true;
    state.timer = setTimeout(function () {
      state.burst = false;
      state.timer = null;
    }, TYPING_DEBOUNCE_MS * 2);
  }

  function crossfadeHero(showImage, src, animate) {
    var heroImg = document.querySelector('[data-preview="hero-img"]');
    var heroEmpty = document.querySelector('[data-preview="hero-empty"]');
    var heroCounter = document.querySelector('[data-preview="hero-counter"]');
    if (!heroImg || !heroEmpty) return;

    var currentSrc = heroImg.getAttribute("src") || "";
    var currentlyShowing = !heroImg.classList.contains("is-hidden") && currentSrc;

    if (showImage && src) {
      if (currentlyShowing && currentSrc === src) return;

      if (!animate) {
        heroImg.src = src;
        heroImg.classList.remove("is-hidden");
        heroEmpty.classList.add("is-hidden");
        if (heroCounter) {
          heroCounter.hidden = false;
          heroCounter.textContent = "1/1";
        }
        return;
      }

      if (currentlyShowing && currentSrc !== src) {
        heroImg.classList.add("is-crossfade-out");
        setTimeout(function () {
          heroImg.classList.remove("is-crossfade-out");
          heroImg.src = src;
          heroImg.classList.add("is-crossfade-in");
          requestAnimationFrame(function () {
            heroImg.classList.remove("is-crossfade-in");
          });
        }, CROSSFADE_MS);
        return;
      }

      heroEmpty.classList.add("is-crossfade-out");
      setTimeout(function () {
        heroEmpty.classList.remove("is-crossfade-out", "is-hidden");
        heroImg.src = src;
        heroImg.classList.remove("is-hidden");
        heroImg.classList.add("is-crossfade-in");
        requestAnimationFrame(function () {
          heroImg.classList.remove("is-crossfade-in");
        });
        if (heroCounter) {
          heroCounter.hidden = false;
          heroCounter.textContent = "1/1";
        }
      }, CROSSFADE_MS);
      return;
    }

    if (!currentlyShowing) {
      if (!animate) {
        heroImg.classList.add("is-hidden");
        heroImg.removeAttribute("src");
        heroEmpty.classList.remove("is-hidden");
        if (heroCounter) heroCounter.hidden = true;
      }
      return;
    }

    if (!animate) {
      heroImg.classList.add("is-hidden");
      heroImg.removeAttribute("src");
      heroEmpty.classList.remove("is-hidden");
      if (heroCounter) heroCounter.hidden = true;
      return;
    }

    heroImg.classList.add("is-crossfade-out");
    setTimeout(function () {
      heroImg.classList.add("is-hidden");
      heroImg.classList.remove("is-crossfade-out");
      heroImg.removeAttribute("src");
      heroEmpty.classList.remove("is-hidden");
      heroEmpty.classList.add("is-crossfade-in");
      requestAnimationFrame(function () {
        heroEmpty.classList.remove("is-crossfade-in");
      });
      if (heroCounter) heroCounter.hidden = true;
    }, CROSSFADE_MS);
  }

  var CURSOR_FIELDS = {
    productName: "title",
    productNameEn: "title",
    regularPrice: "price",
    sellingPrice: "price",
  };

  function hidePreviewCursors() {
    document.querySelectorAll(".preview-sync-cursor").forEach(function (node) {
      node.classList.remove("is-visible");
    });
  }

  function showPreviewCursor(fieldKey) {
    hidePreviewCursors();
    var cursorKey = CURSOR_FIELDS[fieldKey];
    if (!cursorKey) return;
    var cursor = document.querySelector('[data-preview-cursor="' + cursorKey + '"]');
    if (cursor) cursor.classList.add("is-visible");
  }

  function isLeftFormFocused(formRoot) {
    var active = document.activeElement;
    if (!active || active === document.body) return false;
    var root = formRoot || document.querySelector(".form-scroll");
    if (!root || !root.contains(active)) return false;
    if (active.matches("input, textarea, select, button")) return true;
    if (active.closest(".ttgo-input, .ttgo-textarea, .ttgo-input--select")) return true;
    return false;
  }

  function clearPreviewFocusEffects() {
    activeField = null;
    focusEffectsField = null;
    lastInputLengths = {};
    clearLandingFeedback();
    hidePreviewCursors();
    clearFocusHighlight(true);
  }

  function bindForm(root) {
    root.addEventListener(
      "focusin",
      function (e) {
        var input = e.target.closest("input[name], textarea[name]");
        if (input && input.name) {
          if (CURSOR_FIELDS[input.name]) {
            lastInputLengths[input.name] = input.value.length;
          }
          onFieldFocus(input.name);
          showPreviewCursor(input.name);
        }
      },
      true
    );

    root.addEventListener(
      "input",
      function (e) {
        var input = e.target.closest("input[name], textarea[name]");
        if (input && input.name) {
          onFieldInput(input.name, input);
        }
      },
      true
    );

    root.addEventListener(
      "focusout",
      function (e) {
        var related = e.relatedTarget;
        if (related && root.contains(related)) return;
        setTimeout(function () {
          if (isLeftFormFocused(root)) {
            var active = document.activeElement;
            var activeName = active && active.name;
            if (activeName && CURSOR_FIELDS[activeName]) {
              showPreviewCursor(activeName);
            } else {
              hidePreviewCursors();
            }
            return;
          }
          clearPreviewFocusEffects();
        }, 0);
      },
      true
    );

    document.addEventListener("mousedown", function (e) {
      if (root.contains(e.target)) return;
      setTimeout(function () {
        if (!isLeftFormFocused(root)) clearPreviewFocusEffects();
      }, 0);
    });

    root.addEventListener("click", function (e) {
      var radio = e.target.closest(".radio-item[data-group]");
      if (radio) onFieldFocus(radio.dataset.group);

      if (e.target.closest(".photo-add")) onFieldFocus("productPhotos");
      if (e.target.closest(".add-stores")) onFieldFocus("availableStores");
      if (e.target.closest(".checkbox-item[data-group]")) {
        onFieldFocus(e.target.closest(".checkbox-item").dataset.group);
      }
    });
  }

  function init(formRoot) {
    scrollRoot = null;
    activeField = null;
    focusEffectsField = null;
    lastInputLengths = {};
    cancelScroll();
    clearBeam();
    clearLandingFeedback();
    hidePreviewCursors();
    bindForm(formRoot || document.querySelector(".form-scroll") || document);
    if (!window.__previewBeamResizeBound) {
      window.__previewBeamResizeBound = true;
      window.addEventListener("resize", function () {
        clearBeam();
        clearLandingFeedback();
      });
    }
  }

  var FIELD_ANIM_KEYS = {
    productPhotos: [],
    productName: ["title"],
    productNameEn: ["title"],
    regularPrice: ["price"],
    sellingPrice: ["price"],
    recommendedUsers: ["note3"],
    availableStores: ["info1"],
    dineInRules: ["info0", "note0"],
    validityPeriod: ["note1", "hiDays"],
    availableHours: ["note2"],
    reservationRules: ["note4"],
    additionalInfo: ["note4"],
    additionalInfoEn: ["note4"],
    salePeriod: ["info0"],
    limitPurchase: ["note4"],
    unavailableDays: ["note1"],
    minimumPurchase: ["price"],
  };

  function shouldAnimateField(sourceField, previewKey) {
    if (!sourceField || !previewKey) return false;
    var keys = FIELD_ANIM_KEYS[sourceField];
    if (!keys) return false;
    return keys.indexOf(previewKey) >= 0;
  }

  global.PreviewMotion = {
    init: init,
    onFieldFocus: onFieldFocus,
    setText: setText,
    pulseHighlight: pulseHighlight,
    crossfadeHero: crossfadeHero,
    fireBeam: fireBeam,
    resolveSource: resolveSource,
    resolveTarget: resolveTarget,
    shouldAnimateField: shouldAnimateField,
    getActiveField: function () {
      return activeField;
    },
    FIELD_TARGETS: FIELD_TARGETS,
    timings: {
      scroll: SCROLL_MS,
      highlightIn: HIGHLIGHT_IN_MS,
      highlightHold: HIGHLIGHT_HOLD_MS,
      highlightOut: HIGHLIGHT_OUT_MS,
      fadeOut: FADE_OUT_MS,
      fadeIn: FADE_IN_MS,
      crossfade: CROSSFADE_MS,
      beam: BEAM_MS,
    },
  };
})(window);
