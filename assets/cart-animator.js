/**
 * Cart Animator — Add-to-Cart Animations per Mode
 * Men/Women: Fly-to-cart animation
 * Kids: GSAP character animation (loaded on demand)
 */

(function() {
  'use strict';

  window.CartAnimator = {
    _gsapLoaded: false,
    _gsapLoading: false,

    init: function() {
      this._interceptAddToCart();
    },

    _interceptAddToCart: function() {
      var self = this;

      // Listen for successful cart additions
      document.addEventListener('cart:item-added', function(e) {
        var mode = window.ModeManager ? window.ModeManager.currentMode : 'men';
        var triggerEl = e.detail && e.detail.triggerElement;

        if (mode === 'kids') {
          self._kidsAnimation(triggerEl);
        } else {
          self._flyToCart(triggerEl, mode);
        }
      });

      // Also intercept product form submissions
      document.addEventListener('submit', function(e) {
        var form = e.target;
        if (!form.matches('form[action*="/cart/add"]')) return;

        var btn = form.querySelector('[type="submit"], .product-form__submit');
        if (btn) {
          var mode = window.ModeManager ? window.ModeManager.currentMode : 'men';

          // Store the trigger for animation after response
          window._lastCartTrigger = btn;
        }
      });
    },

    _flyToCart: function(triggerEl, mode) {
      if (!triggerEl) triggerEl = window._lastCartTrigger;
      if (!triggerEl) return;

      var cartIcon = document.getElementById('cart-icon-bubble');
      if (!cartIcon) return;

      var triggerRect = triggerEl.getBoundingClientRect();
      var cartRect = cartIcon.getBoundingClientRect();

      // Create flying element
      var flyer = document.createElement('div');
      flyer.style.cssText = 'position:fixed;z-index:99999;width:20px;height:20px;border-radius:50%;pointer-events:none;';
      flyer.style.left = triggerRect.left + triggerRect.width / 2 + 'px';
      flyer.style.top = triggerRect.top + triggerRect.height / 2 + 'px';

      if (mode === 'women') {
        flyer.style.background = '#b76e79';
        flyer.style.boxShadow = '0 2px 10px rgba(183,110,121,0.4)';
      } else {
        flyer.style.background = '#ffffff';
        flyer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      }

      document.body.appendChild(flyer);

      // Animate
      var dx = cartRect.left + cartRect.width / 2 - (triggerRect.left + triggerRect.width / 2);
      var dy = cartRect.top + cartRect.height / 2 - (triggerRect.top + triggerRect.height / 2);

      flyer.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
      requestAnimationFrame(function() {
        flyer.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(0.3)';
        flyer.style.opacity = '0.5';
      });

      // Bounce cart icon
      setTimeout(function() {
        cartIcon.style.transition = 'transform 0.3s ease';
        cartIcon.style.transform = 'scale(1.3)';
        setTimeout(function() {
          cartIcon.style.transform = 'scale(1)';
        }, 200);
        flyer.remove();
      }, 600);

      window._lastCartTrigger = null;
    },

    _kidsAnimation: function(triggerEl) {
      var self = this;

      // Load GSAP if not loaded
      if (!this._gsapLoaded) {
        this._loadGSAP(function() {
          self._doKidsAnimation(triggerEl);
        });
        return;
      }

      this._doKidsAnimation(triggerEl);
    },

    _loadGSAP: function(callback) {
      if (this._gsapLoaded) {
        callback();
        return;
      }
      if (this._gsapLoading) {
        // Wait for load
        var check = setInterval(function() {
          if (window.gsap) {
            clearInterval(check);
            callback();
          }
        }, 100);
        return;
      }

      this._gsapLoading = true;
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      script.onload = function() {
        window.CartAnimator._gsapLoaded = true;
        window.CartAnimator._gsapLoading = false;
        callback();
      };
      document.head.appendChild(script);
    },

    _doKidsAnimation: function(triggerEl) {
      if (!triggerEl) triggerEl = window._lastCartTrigger;

      var cartIcon = document.getElementById('cart-icon-bubble');
      if (!cartIcon || !window.gsap) {
        this._flyToCart(triggerEl, 'kids');
        return;
      }

      // Create kids character element
      var character = document.querySelector('.kids-character-svg');
      if (!character) {
        this._flyToCart(triggerEl, 'kids');
        return;
      }

      var clone = character.cloneNode(true);
      clone.style.cssText = 'position:fixed;z-index:99999;width:60px;height:60px;pointer-events:none;';

      var startX, startY;
      if (triggerEl) {
        var rect = triggerEl.getBoundingClientRect();
        startX = rect.left + rect.width / 2 - 30;
        startY = rect.top - 70;
      } else {
        startX = window.innerWidth / 2 - 30;
        startY = window.innerHeight / 2;
      }

      clone.style.left = startX + 'px';
      clone.style.top = startY + 'px';
      document.body.appendChild(clone);

      var cartRect = cartIcon.getBoundingClientRect();

      // GSAP animation
      var tl = gsap.timeline({ onComplete: function() { clone.remove(); } });

      tl.from(clone, {
        scale: 0,
        rotation: -30,
        duration: 0.3,
        ease: 'back.out(1.7)'
      })
      .to(clone, {
        y: -40,
        duration: 0.3,
        ease: 'power2.out'
      })
      .to(clone, {
        x: cartRect.left - startX,
        y: cartRect.top - startY,
        scale: 0.3,
        rotation: 360,
        duration: 0.8,
        ease: 'power2.inOut'
      })
      .to(clone, {
        opacity: 0,
        scale: 0,
        duration: 0.2
      });

      // Sparkles
      this._createSparkles(startX + 30, startY + 30);

      // Bounce cart icon
      setTimeout(function() {
        if (window.gsap) {
          gsap.fromTo(cartIcon,
            { scale: 1 },
            { scale: 1.4, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }
          );
        }
      }, 1100);

      window._lastCartTrigger = null;
    },

    _createSparkles: function(x, y) {
      var colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B'];

      for (var i = 0; i < 8; i++) {
        var sparkle = document.createElement('div');
        sparkle.style.cssText = 'position:fixed;z-index:99999;width:8px;height:8px;border-radius:50%;pointer-events:none;';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.background = colors[i % colors.length];
        document.body.appendChild(sparkle);

        var angle = (i / 8) * Math.PI * 2;
        var distance = 40 + Math.random() * 30;

        if (window.gsap) {
          gsap.to(sparkle, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            scale: 0,
            opacity: 0,
            duration: 0.6 + Math.random() * 0.3,
            ease: 'power2.out',
            onComplete: function() { this.targets()[0].remove(); }
          });
        } else {
          sparkle.style.transition = 'all 0.6s ease-out';
          requestAnimationFrame(function() {
            sparkle.style.transform = 'translate(' + Math.cos(angle) * distance + 'px, ' + Math.sin(angle) * distance + 'px) scale(0)';
            sparkle.style.opacity = '0';
          });
          setTimeout(function() { sparkle.remove(); }, 700);
        }
      }
    }
  };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      CartAnimator.init();
    });
  } else {
    CartAnimator.init();
  }
})();
