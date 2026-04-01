/**
 * Product Filter — Tag-Based Product Filtering
 * Filters products by mode tags (men, women, kids)
 */

(function() {
  'use strict';

  window.ProductFilter = {
    _staggerDelay: 50,
    _maxStagger: 500,

    init: function() {
      var self = this;

      // Listen for mode changes
      document.addEventListener('mode:changed', function(e) {
        self.filter(e.detail.mode);
      });

      // Initial filter
      var mode = window.ModeManager ? window.ModeManager.currentMode : null;
      if (mode) {
        // Small delay to let DOM settle
        setTimeout(function() {
          self.filter(mode);
        }, 100);
      }
    },

    filter: function(mode) {
      if (!mode) return;

      var cards = document.querySelectorAll('[data-tags]');
      if (cards.length === 0) return;

      var visibleCount = 0;
      var hiddenCount = 0;

      cards.forEach(function(card, index) {
        var tags = card.getAttribute('data-tags').toLowerCase();
        var tagList = tags.split(',').map(function(t) { return t.trim(); });
        var matches = tagList.indexOf(mode) !== -1;

        if (matches) {
          card.classList.remove('mode-hidden');
          card.classList.add('mode-visible');
          card.style.display = '';
          card.style.position = '';
          card.style.visibility = '';

          // Stagger animation
          var delay = Math.min(visibleCount * this._staggerDelay, this._maxStagger);
          card.style.transitionDelay = delay + 'ms';
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';

          visibleCount++;
        } else {
          card.classList.add('mode-hidden');
          card.classList.remove('mode-visible');
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.transitionDelay = '0ms';

          // After transition, hide completely
          setTimeout(function() {
            if (card.classList.contains('mode-hidden')) {
              card.style.display = 'none';
              card.style.position = 'absolute';
              card.style.visibility = 'hidden';
            }
          }, 350);

          hiddenCount++;
        }
      }.bind(this));

      // Update product counts
      this._updateCounts(visibleCount);

      // Handle empty states
      this._handleEmptyState(visibleCount, mode);

      // Reset stagger delays after animation
      setTimeout(function() {
        cards.forEach(function(card) {
          card.style.transitionDelay = '0ms';
        });
      }, this._maxStagger + 350);
    },

    _updateCounts: function(count) {
      var countEls = document.querySelectorAll('.mode-product-count, .products-count');
      var mode = window.ModeManager ? window.ModeManager.currentMode : 'men';

      countEls.forEach(function(el) {
        if (mode === 'kids') {
          el.textContent = count + ' awesome finds! \uD83C\uDFAF';
        } else if (mode === 'women') {
          el.textContent = count + ' products';
        } else {
          el.textContent = count + ' PRODUCTS';
        }
      });
    },

    _handleEmptyState: function(visibleCount, mode) {
      var emptyStates = document.querySelectorAll('.mode-empty-state');

      emptyStates.forEach(function(el) {
        if (visibleCount === 0) {
          el.classList.add('visible');
          // Set mode-specific message
          if (mode === 'kids') {
            el.innerHTML = '<p>\uD83C\uDF88 Oops! No toys here yet! Check back soon for awesome stuff!</p>';
          } else if (mode === 'women') {
            el.innerHTML = '<p>Nothing here yet \u2014 check back soon for beautiful finds!</p>';
          } else {
            el.innerHTML = '<p>No products found.</p>';
          }
        } else {
          el.classList.remove('visible');
        }
      });
    },

    // Filter search results
    filterSearch: function(mode) {
      var results = document.querySelectorAll('.search__results [data-tags]');
      results.forEach(function(card) {
        var tags = card.getAttribute('data-tags').toLowerCase();
        var tagList = tags.split(',').map(function(t) { return t.trim(); });
        var matches = tagList.indexOf(mode) !== -1;

        card.style.display = matches ? '' : 'none';
      });
    },

    // Filter recommendations
    filterRecommendations: function(mode) {
      var recs = document.querySelectorAll('.related-products [data-tags], .complementary-products [data-tags]');
      recs.forEach(function(card) {
        var tags = card.getAttribute('data-tags').toLowerCase();
        var tagList = tags.split(',').map(function(t) { return t.trim(); });
        var matches = tagList.indexOf(mode) !== -1;

        card.style.display = matches ? '' : 'none';
      });
    }
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ProductFilter.init();
    });
  } else {
    ProductFilter.init();
  }
})();
