/**
 * Modern Reader Experience & Accessibility Engine
 * Ultra-lightweight Vanilla JS (<6 KB) for Jekyll Blog
 */
document.addEventListener('DOMContentLoaded', function() {
  const postContent = document.querySelector('.post-content');
  const progressBar = document.getElementById('reading-progress-bar');
  if (!postContent) return;

  /* ==========================================================================
     1. Scroll Progress Sync (Cross-Browser Throttled RAF)
     ========================================================================== */
  if (progressBar) {
    let scrollTicking = false;
    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      progressBar.style.setProperty('--reading-progress', ratio);
      progressBar.setAttribute('aria-valuenow', Math.round(ratio * 100));
      scrollTicking = false;
    }

    window.addEventListener('scroll', function() {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateProgress);
        scrollTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  /* ==========================================================================
     2. Popover & UI Paneling State
     ========================================================================== */
  const settingsPopover = document.getElementById('reader-settings-popover');
  const ttsPanel = document.getElementById('reader-tts-panel');
  const btnToggleSettings = document.getElementById('btn-toggle-settings');
  const btnToggleTTS = document.getElementById('btn-toggle-tts');
  const btnClosePopover = document.getElementById('reader-close-popover');
  const btnCloseTTS = document.getElementById('reader-close-tts');

  function togglePopover(el) {
    if (!el) return;
    const isHidden = el.classList.contains('hidden');
    // Hide other panel first
    if (el === settingsPopover && ttsPanel) hidePopover(ttsPanel);
    if (el === ttsPanel && settingsPopover) hidePopover(settingsPopover);

    if (isHidden) {
      el.classList.remove('hidden');
      requestAnimationFrame(() => {
        el.classList.remove('opacity-0', 'translate-y-2');
      });
    } else {
      hidePopover(el);
    }
  }

  function hidePopover(el) {
    if (!el || el.classList.contains('hidden')) return;
    el.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => el.classList.add('hidden'), 200);
  }

  btnToggleSettings?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopover(settingsPopover);
  });
  btnClosePopover?.addEventListener('click', () => hidePopover(settingsPopover));

  btnToggleTTS?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopover(ttsPanel);
  });
  btnCloseTTS?.addEventListener('click', () => hidePopover(ttsPanel));

  document.addEventListener('click', (e) => {
    if (settingsPopover && !settingsPopover.contains(e.target) && !btnToggleSettings?.contains(e.target)) {
      hidePopover(settingsPopover);
    }
    if (ttsPanel && !ttsPanel.contains(e.target) && !btnToggleTTS?.contains(e.target)) {
      hidePopover(ttsPanel);
    }
  });

  /* ==========================================================================
     3. Zen Focus Mode
     ========================================================================== */
  const btnToggleZen = document.getElementById('btn-toggle-zen');
  const zenActiveDot = document.getElementById('zen-active-dot');

  function toggleZenMode() {
    const isZen = document.body.classList.toggle('zen-mode');
    if (zenActiveDot) {
      zenActiveDot.classList.toggle('hidden', !isZen);
    }
    if (btnToggleZen) {
      btnToggleZen.classList.toggle('bg-blue-50', isZen);
      btnToggleZen.classList.toggle('dark:bg-blue-950/60', isZen);
    }
    hidePopover(settingsPopover);
  }

  btnToggleZen?.addEventListener('click', toggleZenMode);

  /* ==========================================================================
     4. Theme Palette Switcher
     ========================================================================== */
  const themeBtns = document.querySelectorAll('.theme-btn');

  function setReadingTheme(theme) {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-reading-theme');
      localStorage.removeItem('reader-theme');
    } else {
      document.documentElement.setAttribute('data-reading-theme', theme);
      localStorage.setItem('reader-theme', theme);
    }
    themeBtns.forEach(btn => {
      const match = btn.getAttribute('data-theme') === theme;
      btn.classList.toggle('ring-2', match);
      btn.classList.toggle('ring-blue-500', match);
    });
  }

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setReadingTheme(btn.getAttribute('data-theme'));
    });
  });

  const initialTheme = localStorage.getItem('reader-theme') || 'default';
  setReadingTheme(initialTheme);

  /* ==========================================================================
     5. Typography & Font Resizer (Clamped 15px - 22px)
     ========================================================================== */
  const btnFontDec = document.getElementById('font-decrease-btn');
  const btnFontInc = document.getElementById('font-increase-btn');
  const fontSizeLabel = document.getElementById('font-size-label');
  const fontFamilyBtns = document.querySelectorAll('.font-family-btn');

  const FONT_SIZES = [
    { px: '15px', label: '85%' },
    { px: '16.5px', label: '95%' },
    { px: '17.6px', label: '100%' },
    { px: '19.5px', label: '110%' },
    { px: '21.5px', label: '120%' }
  ];
  let currentFontIndex = 2; // default 100%

  function applyFontSize(index) {
    currentFontIndex = Math.min(FONT_SIZES.length - 1, Math.max(0, index));
    const size = FONT_SIZES[currentFontIndex];
    document.documentElement.style.setProperty('--reader-font-size', size.px);
    if (fontSizeLabel) fontSizeLabel.textContent = size.label;
    localStorage.setItem('reader-font-size', size.px);
    localStorage.setItem('reader-font-idx', currentFontIndex.toString());
  }

  btnFontDec?.addEventListener('click', () => applyFontSize(currentFontIndex - 1));
  btnFontInc?.addEventListener('click', () => applyFontSize(currentFontIndex + 1));

  const savedFontIdx = localStorage.getItem('reader-font-idx');
  if (savedFontIdx !== null) {
    applyFontSize(parseInt(savedFontIdx, 10));
  }

  function setFontFamily(family) {
    let fontVal = 'inherit';
    if (family === 'serif') {
      fontVal = 'Merriweather, Charter, Georgia, Cambria, "Times New Roman", serif';
    } else if (family === 'sans') {
      fontVal = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
    document.documentElement.style.setProperty('--reader-font-family', fontVal);
    localStorage.setItem('reader-font-family', fontVal);

    fontFamilyBtns.forEach(btn => {
      const match = btn.getAttribute('data-family') === family;
      btn.classList.toggle('bg-blue-50', match);
      btn.classList.toggle('dark:bg-blue-950/60', match);
      btn.classList.toggle('border-blue-500', match);
    });
  }

  fontFamilyBtns.forEach(btn => {
    btn.addEventListener('click', () => setFontFamily(btn.getAttribute('data-family')));
  });

  /* ==========================================================================
     6. Bionic Speed Reading Engine (TreeWalker with Strict Sanitization)
     ========================================================================== */
  const btnToggleBionic = document.getElementById('btn-toggle-bionic');
  const bionicActiveDot = document.getElementById('bionic-active-dot');
  let originalArticleHtml = null;
  let isBionicActive = false;

  function bionicFormatText(text) {
    return text.replace(/\b([a-zA-Z0-9À-ž]+)\b/g, function(word) {
      if (word.length <= 1) return `<b>${word}</b>`;
      const mid = Math.ceil(word.length * 0.45);
      return `<b class="bionic-bold">${word.slice(0, mid)}</b>${word.slice(mid)}`;
    });
  }

  function toggleBionicReading() {
    if (!isBionicActive) {
      if (!originalArticleHtml) {
        originalArticleHtml = postContent.innerHTML;
      }
      
      const walker = document.createTreeWalker(postContent, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          // Strictly skip code, tables, diagrams, and metadata
          if (parent.closest('pre, code, kbd, var, table, figure, .mermaid, .architecture-card, .post-share-box, #reader-controls-dock')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const nodesToReplace = [];
      while (walker.nextNode()) {
        nodesToReplace.push(walker.currentNode);
      }

      nodesToReplace.forEach(node => {
        const span = document.createElement('span');
        span.className = 'bionic-wrapper';
        span.innerHTML = bionicFormatText(node.textContent);
        node.parentNode.replaceChild(span, node);
      });

      isBionicActive = true;
    } else {
      if (originalArticleHtml) {
        postContent.innerHTML = originalArticleHtml;
      }
      isBionicActive = false;
    }

    if (bionicActiveDot) bionicActiveDot.classList.toggle('hidden', !isBionicActive);
    if (btnToggleBionic) {
      btnToggleBionic.classList.toggle('bg-blue-50', isBionicActive);
      btnToggleBionic.classList.toggle('dark:bg-blue-950/60', isBionicActive);
    }
  }

  btnToggleBionic?.addEventListener('click', toggleBionicReading);

  /* ==========================================================================
     7. Text-to-Speech (Web Speech API with Active Paragraph Highlight)
     ========================================================================== */
  const ttsPlayBtn = document.getElementById('tts-play-btn');
  const ttsPlayIcon = document.getElementById('tts-play-icon');
  const ttsPlayText = document.getElementById('tts-play-text');
  const ttsSpeedBtn = document.getElementById('tts-speed-btn');
  const ttsStopBtn = document.getElementById('tts-stop-btn');
  const ttsStatusText = document.getElementById('tts-current-reading');
  const ttsLivePing = document.getElementById('tts-live-ping');
  const ttsLiveDot = document.getElementById('tts-live-dot');
  const ttsDockDot = document.getElementById('tts-dock-dot');

  if (!('speechSynthesis' in window)) {
    if (btnToggleTTS) btnToggleTTS.style.display = 'none';
  } else {
    let ttsElements = [];
    let currentTtsIndex = 0;
    let isPlaying = false;
    let isPaused = false;
    const SPEEDS = [1.0, 1.25, 1.5, 2.0, 0.75];
    let currentSpeedIndex = 0;

    function getCleanNarrativeElements() {
      const candidates = postContent.querySelectorAll('p, li, h2, h3, h4');
      return Array.from(candidates).filter(el => {
        return !el.closest('pre, code, table, figure, .mermaid, .architecture-card, .post-share-box');
      });
    }

    function clearParagraphHighlight() {
      document.querySelectorAll('.tts-active-paragraph').forEach(el => {
        el.classList.remove('tts-active-paragraph');
      });
    }

    function updateTTSUi(playing) {
      isPlaying = playing;
      if (ttsPlayIcon) ttsPlayIcon.textContent = playing ? (isPaused ? '▶' : '⏸') : '▶';
      if (ttsPlayText) ttsPlayText.textContent = playing ? (isPaused ? 'Lanjut' : 'Jeda') : 'Putar';
      if (ttsLivePing) ttsLivePing.classList.toggle('hidden', !playing || isPaused);
      if (ttsLiveDot) {
        ttsLiveDot.classList.toggle('bg-sky-500', playing && !isPaused);
        ttsLiveDot.classList.toggle('bg-slate-400', !playing || isPaused);
      }
      if (ttsDockDot) ttsDockDot.classList.toggle('hidden', !playing);
    }

    function speakNextParagraph() {
      if (!isPlaying || isPaused) return;

      if (currentTtsIndex >= ttsElements.length) {
        stopTTS();
        if (ttsStatusText) ttsStatusText.textContent = 'Selesai membaca artikel.';
        return;
      }

      clearParagraphHighlight();
      const activeEl = ttsElements[currentTtsIndex];
      activeEl.classList.add('tts-active-paragraph');
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const text = activeEl.textContent.trim();
      if (ttsStatusText) {
        ttsStatusText.textContent = text.slice(0, 40) + (text.length > 40 ? '...' : '');
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEEDS[currentSpeedIndex];
      utterance.lang = 'id-ID';

      utterance.onend = function() {
        if (isPlaying && !isPaused) {
          currentTtsIndex++;
          speakNextParagraph();
        }
      };

      utterance.onerror = function(err) {
        console.warn('TTS utterance error:', err);
        if (isPlaying && !isPaused) {
          currentTtsIndex++;
          speakNextParagraph();
        }
      };

      window.speechSynthesis.speak(utterance);
    }

    function playTTS() {
      if (!isPlaying) {
        ttsElements = getCleanNarrativeElements();
        if (!ttsElements.length) return;
        currentTtsIndex = 0;
        isPaused = false;
        updateTTSUi(true);
        speakNextParagraph();
      } else if (isPaused) {
        isPaused = false;
        window.speechSynthesis.resume();
        updateTTSUi(true);
      } else {
        isPaused = true;
        window.speechSynthesis.pause();
        updateTTSUi(true);
      }
    }

    function stopTTS() {
      window.speechSynthesis.cancel();
      clearParagraphHighlight();
      currentTtsIndex = 0;
      isPaused = false;
      updateTTSUi(false);
      if (ttsStatusText) ttsStatusText.textContent = 'Siap memutar audio...';
    }

    ttsPlayBtn?.addEventListener('click', playTTS);
    ttsStopBtn?.addEventListener('click', stopTTS);

    ttsSpeedBtn?.addEventListener('click', () => {
      currentSpeedIndex = (currentSpeedIndex + 1) % SPEEDS.length;
      const newSpeed = SPEEDS[currentSpeedIndex];
      if (ttsSpeedBtn) ttsSpeedBtn.textContent = `${newSpeed.toFixed(1)}x`;
      if (isPlaying && !isPaused) {
        window.speechSynthesis.cancel();
        speakNextParagraph();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    });
  }

  /* ==========================================================================
     8. Global Keyboard Shortcuts
     ========================================================================== */
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      toggleZenMode();
    } else if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      toggleBionicReading();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      btnToggleTTS?.click();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      btnFontInc?.click();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      btnFontDec?.click();
    } else if (e.key === 'Escape') {
      hidePopover(settingsPopover);
      hidePopover(ttsPanel);
      if (document.body.classList.contains('zen-mode')) {
        toggleZenMode();
      }
    }
  });
});
