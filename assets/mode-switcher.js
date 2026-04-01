/**
 * Mode Switcher — Core JavaScript
 * Handles mode switching, localStorage, content swapping, and font loading
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'shopify_mode_preference';
  const VALID_MODES = ['men', 'women', 'kids'];
  const DEFAULT_MODE = 'men';
  const DEBOUNCE_MS = 300;

  /* ================================
     Font Loading
     ================================ */
  const MODE_FONTS = {
    men: [
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
    ],
    women: [
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&family=Nunito:wght@400;600;700&display=swap'
    ],
    kids: [
      'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Bubblegum+Sans&family=Comic+Neue:wght@400;700&display=swap'
    ]
  };

  const loadedFonts = {};

  function loadFontsForMode(mode) {
    if (loadedFonts[mode]) return;
    loadedFonts[mode] = true;

    MODE_FONTS[mode].forEach(function(url) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.media = 'print';
      link.onload = function() { this.media = 'all'; };
      document.head.appendChild(link);
    });
  }

  function preloadAllFonts() {
    VALID_MODES.forEach(function(mode) {
      loadFontsForMode(mode);
    });
  }

  /* ================================
     Mode Manager
     ================================ */
  window.ModeManager = {
    currentMode: null,
    _debounceTimer: null,
    _listeners: [],

    init: function() {
      var saved = this.getSavedMode();
      if (saved) {
        this.applyMode(saved, true);
      } else {
        this.showPopup();
      }
      // Preload other fonts after initial mode is set
      setTimeout(preloadAllFonts, 2000);
      this._initScrollToTop();
    },

    getSavedMode: function() {
      try {
        var mode = localStorage.getItem(STORAGE_KEY);
        return VALID_MODES.indexOf(mode) !== -1 ? mode : null;
      } catch (e) {
        return null;
      }
    },

    saveMode: function(mode) {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch (e) {
        // localStorage not available
      }
    },

    applyMode: function(mode, instant) {
      if (VALID_MODES.indexOf(mode) === -1) return;
      if (this.currentMode === mode) return;

      var self = this;
      loadFontsForMode(mode);

      if (instant) {
        self._doApply(mode);
        return;
      }

      // Debounce
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(function() {
        self._animatedSwitch(mode);
      }, DEBOUNCE_MS);
    },

    _animatedSwitch: function(mode) {
      var self = this;
      var overlay = document.querySelector('.mode-transition-overlay');

      if (overlay) {
        overlay.classList.add('active');
        setTimeout(function() {
          self._doApply(mode);
          // Re-filter products
          if (window.ProductFilter) {
            window.ProductFilter.filter(mode);
          }
          setTimeout(function() {
            overlay.classList.remove('active');
          }, 100);
        }, 200);
      } else {
        self._doApply(mode);
        if (window.ProductFilter) {
          window.ProductFilter.filter(mode);
        }
      }
    },

    _doApply: function(mode) {
      var prev = this.currentMode;
      this.currentMode = mode;

      // Set data-mode on body/html
      document.documentElement.setAttribute('data-mode', mode);
      document.body.setAttribute('data-mode', mode);

      // Save
      this.saveMode(mode);

      // Swap section content
      this._swapContent(mode);

      // Update mode toggle
      this._updateToggle(mode);

      // Close popup if open
      this._closePopup();

      // Notify listeners
      this._listeners.forEach(function(fn) {
        fn(mode, prev);
      });

      // Dispatch event
      document.dispatchEvent(new CustomEvent('mode:changed', {
        detail: { mode: mode, previousMode: prev }
      }));
    },

    onModeChange: function(fn) {
      this._listeners.push(fn);
    },

    /* ================================
       Content Swapping
       ================================ */
    _swapContent: function(mode) {
      // Swap text content
      var textEls = document.querySelectorAll('[data-mode-content]');
      textEls.forEach(function(el) {
        var key = 'data-' + mode + '-content';
        var content = el.getAttribute(key);
        if (content !== null) {
          el.textContent = content;
        }
      });

      // Swap HTML content
      var htmlEls = document.querySelectorAll('[data-mode-html]');
      htmlEls.forEach(function(el) {
        var key = 'data-' + mode + '-html';
        var content = el.getAttribute(key);
        if (content !== null) {
          el.innerHTML = content;
        }
      });

      // Swap images
      var imgEls = document.querySelectorAll('[data-mode-content="image"], img[data-men-src]');
      imgEls.forEach(function(el) {
        var key = 'data-' + mode + '-src';
        var src = el.getAttribute(key);
        if (src) {
          el.setAttribute('src', src);
          // Also update srcset if applicable
          var srcsetKey = 'data-' + mode + '-srcset';
          var srcset = el.getAttribute(srcsetKey);
          if (srcset) {
            el.setAttribute('srcset', srcset);
          }
        }
      });

      // Swap links
      var linkEls = document.querySelectorAll('[data-mode-link]');
      linkEls.forEach(function(el) {
        var key = 'data-' + mode + '-link';
        var href = el.getAttribute(key);
        if (href) {
          el.setAttribute('href', href);
        }
      });

      // Show/hide mode-specific elements
      document.querySelectorAll('[data-show-mode]').forEach(function(el) {
        var showModes = el.getAttribute('data-show-mode').split(',');
        el.style.display = showModes.indexOf(mode) !== -1 ? '' : 'none';
      });

      // Swap collections (for featured collection sections)
      document.querySelectorAll('[data-mode-collection]').forEach(function(el) {
        var key = 'data-' + mode + '-collection';
        var collectionUrl = el.getAttribute(key);
        if (collectionUrl) {
          el.setAttribute('href', collectionUrl);
        }
      });
    },

    /* ================================
       Toggle Update
       ================================ */
    _updateToggle: function(mode) {
      var toggleBtns = document.querySelectorAll('.mode-toggle__btn');
      toggleBtns.forEach(function(btn) {
        var btnMode = btn.getAttribute('data-mode-value');
        btn.classList.toggle('mode-toggle__btn--active', btnMode === mode);
        btn.setAttribute('aria-pressed', btnMode === mode ? 'true' : 'false');
      });

      // Update pill indicator position
      var activeBtn = document.querySelector('.mode-toggle__btn--active');
      var indicator = document.querySelector('.mode-toggle__indicator');
      if (activeBtn && indicator) {
        var container = activeBtn.closest('.mode-toggle');
        if (container) {
          var containerRect = container.getBoundingClientRect();
          var btnRect = activeBtn.getBoundingClientRect();
          indicator.style.width = btnRect.width + 'px';
          indicator.style.transform = 'translateX(' + (btnRect.left - containerRect.left) + 'px)';
        }
      }
    },

    /* ================================
       Popup
       ================================ */
    showPopup: function() {
      var popup = document.getElementById('mode-popup');
      if (popup) {
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      // Apply default mode visually while popup shows
      document.documentElement.setAttribute('data-mode', DEFAULT_MODE);
      document.body.setAttribute('data-mode', DEFAULT_MODE);
      loadFontsForMode(DEFAULT_MODE);
    },

    _closePopup: function() {
      var popup = document.getElementById('mode-popup');
      if (popup && popup.classList.contains('active')) {
        popup.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    /* ================================
       Scroll to Top
       ================================ */
    _initScrollToTop: function() {
      var btn = document.querySelector('.mode-scroll-top');
      if (!btn) return;

      window.addEventListener('scroll', function() {
        if (window.scrollY > 400) {
          btn.classList.add('visible');
        } else {
          btn.classList.remove('visible');
        }
      }, { passive: true });

      btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  /* ================================
     Initialize on DOM ready
     ================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ModeManager.init();
    });
  } else {
    ModeManager.init();
  }
})();
