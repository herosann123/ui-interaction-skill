/* =========================================================================
   Motion Kit · motion-kit.js  v1.0.0
   ui-interaction-skill 内置交互行为库（零依赖）

   用法：
     <link rel="stylesheet" href="motion-kit.css">
     <script src="motion-kit.js" defer><\/script>

   data-attribute 自动绑定：
     data-reveal[="up|fade|left|right|scale"]   滚动入场（IO）
     data-reveal-stagger="80"                    子元素自动错峰
     data-parallax="0.2"                         视差层（需父级 [data-parallax-scope] 或父元素）
     data-magnetic="0.3"                         磁吸（仅精细指针 + 非 reduced）
     data-tilt="10"                             3D 倾斜（仅精细指针 + 非 reduced）
     data-ripple                                 点击水波纹
     data-counter="1280"                         数字滚动
     data-stream data-stream-text="..."          流式打字
     data-modal-open="id" / data-modal-close     原生 <dialog> 开关
     data-sheet-open="id" / data-sheet-close     底部抽屉
     data-tabs / data-tabs-viewport              Tab + scroll-snap
     data-swipe-row                              列表滑动显露操作
     data-swipe-toggle                           行内“更多”按钮，切换滑开状态
     data-cmdk / data-cmdk-input / data-cmdk-item 命令栏（⌘/Ctrl+K）
     data-haptic="tap|snap|success|warn"         触感反馈

   编程 API：
     MotionKit.init(root?) / MotionKit.destroy()
     MotionKit.stream(el, text, opts) -> Promise
     MotionKit.haptic(kind)
     MotionKit.bump(el, delta)
     MotionKit.capture(el) / MotionKit.flip(first, lastEl, opts)
     MotionKit.animateValue({from,to,duration,ease,onUpdate,onDone})
     MotionKit.reduced / MotionKit.finePointer / MotionKit.version
   ========================================================================= */

(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var doc = global.document;

  // SSR / Node 环境：不访问 DOM，返回安全的 no-op API
  if (!doc) {
    var noop = function () { return noop; };
    global.MotionKit = {
      version: VERSION,
      init: noop,
      destroy: noop,
      stream: function () { return Promise.resolve(); },
      haptic: noop,
      toast: noop,
      bump: noop,
      capture: function () { return { left: 0, top: 0, width: 0, height: 0 }; },
      flip: function () { return null; },
      animateValue: function (opts) {
        if (opts && opts.onUpdate) opts.onUpdate(opts.to == null ? 1 : opts.to);
        if (opts && opts.onDone) opts.onDone();
        return { cancel: noop };
      },
      reduced: false,
      finePointer: false,
    };
    return;
  }

  var root = doc.documentElement;
  var reduceMQ = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  var fineMQ = global.matchMedia
    ? global.matchMedia('(hover: hover) and (pointer: fine)')
    : null;

  var cleanups = [];
  var globalCleanups = [];
  var globalBound = false;
  var sheetState = new WeakMap();

  var reduced = function () {
    return !!(reduceMQ && reduceMQ.matches);
  };

  var finePointer = function () {
    return !!(fineMQ && fineMQ.matches);
  };

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function qsa(selector, ctx) {
    ctx = ctx || doc;
    var out = [];
    if (ctx !== doc && ctx.nodeType === 1 && ctx.matches && ctx.matches(selector)) {
      out.push(ctx);
    }
    if (ctx.querySelectorAll) {
      out.push.apply(out, Array.from(ctx.querySelectorAll(selector)));
    }
    return out;
  }

  // 同一元素可以叠加多种行为；data-mk-bound 用空格记录已绑定的行为
  function claim(el, key) {
    var keys = (el.dataset.mkBound || '').split(' ').filter(Boolean);
    if (keys.indexOf(key) !== -1) return false;
    keys.push(key);
    el.dataset.mkBound = keys.join(' ');
    return true;
  }

  function add(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    cleanups.push(function () {
      el.removeEventListener(type, fn, opts);
    });
  }

  function addGlobal(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    globalCleanups.push(function () {
      target.removeEventListener(type, fn, opts);
    });
  }

  function rafThrottle(fn) {
    var id = 0;
    var lastArgs = null;
    function run() {
      id = 0;
      fn.apply(null, lastArgs || []);
    }
    var wrapped = function () {
      lastArgs = arguments;
      if (id) return;
      id = global.requestAnimationFrame(run);
    };
    wrapped.cancel = function () {
      if (id) {
        global.cancelAnimationFrame(id);
        id = 0;
      }
    };
    return wrapped;
  }

  /* ---------------------------------------------------------------------
     滚动入场
     --------------------------------------------------------------------- */
  function initReveal(ctx) {
    qsa('[data-reveal-stagger]', ctx).forEach(function (parent) {
      if (!claim(parent, 'reveal-stagger')) return;
      var step = parseFloat(parent.dataset.revealStagger) || 80;
      Array.from(parent.children).forEach(function (child, i) {
        if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
        if (!child.dataset.revealDelay) {
          child.dataset.revealDelay = String(Math.round(i * step));
        }
      });
    });

    var els = qsa('[data-reveal]', ctx).filter(function (el) {
      return claim(el, 'reveal');
    });
    if (!els.length) return;
    els.forEach(function (el) {
      if (el.dataset.revealDelay) {
        el.style.setProperty('--mk-delay', parseFloat(el.dataset.revealDelay) + 'ms');
      }
      if (el.dataset.revealDuration) {
        el.style.setProperty('--mk-reveal-dur', parseFloat(el.dataset.revealDuration) + 'ms');
      }
      if (el.dataset.revealDistance) {
        el.style.setProperty('--mk-reveal-y', parseFloat(el.dataset.revealDistance) + 'px');
      }
    });

    if (reduced() || !('IntersectionObserver' in global)) {
      els.forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }

    root.classList.add('mk-js');
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var once = entry.target.dataset.revealOnce !== 'false';
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('is-in');
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
    cleanups.push(function () {
      io.disconnect();
    });
  }

  /* ---------------------------------------------------------------------
     视差：以「未变换的父级」为测量基准，避免 transform 反馈循环
     --------------------------------------------------------------------- */
  function initParallax(ctx) {
    var els = qsa('[data-parallax]', ctx).filter(function (el) {
      return claim(el, 'parallax');
    });
    if (!els.length) return;

    var nodes = els.map(function (el) {
      return {
        el: el,
        scope: el.closest('[data-parallax-scope]') || el.parentElement || el,
        speed: parseFloat(el.dataset.parallax) || 0.2,
        height: 0,
      };
    });

    if (reduced()) return;

    var vh = global.innerHeight;
    var measure = function () {
      vh = global.innerHeight;
      nodes.forEach(function (node) {
        node.height = node.scope.offsetHeight || 0;
        node.top = node.scope.getBoundingClientRect().top;
      });
    };
    var read = function () {
      nodes.forEach(function (node) {
        node.top = node.scope.getBoundingClientRect().top;
      });
    };
    var write = function () {
      nodes.forEach(function (node) {
        var delta = (node.top + node.height / 2 - vh / 2) / vh;
        var y = clamp(delta * node.speed * 100, -160, 160);
        node.el.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
      });
    };
    var update = rafThrottle(function () {
      read();
      write();
    });

    add(doc, 'scroll', update, { passive: true, capture: true });
    add(global, 'resize', function () {
      measure();
      update();
    });
    measure();
    update();
  }

  /* ---------------------------------------------------------------------
     磁吸按钮（仅 hover/pointer:fine）
     --------------------------------------------------------------------- */
  function initMagnetic(ctx) {
    if (reduced() || !finePointer()) return;

    qsa('[data-magnetic]', ctx).forEach(function (el) {
      if (!claim(el, 'magnetic')) return;
      var strength = parseFloat(el.dataset.magnetic) || 0.3;
      var x = 0;
      var y = 0;
      var tx = 0;
      var ty = 0;
      var raf = 0;

      var apply = function () {
        raf = 0;
        x = lerp(x, tx, 0.28);
        y = lerp(y, ty, 0.28);
        el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
        if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) {
          raf = global.requestAnimationFrame(apply);
        }
      };
      var kick = function () {
        if (!raf) raf = global.requestAnimationFrame(apply);
      };

      add(el, 'pointerenter', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        el.classList.add('is-active');
      });
      add(
        el,
        'pointermove',
        function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          var rect = el.getBoundingClientRect();
          tx = (e.clientX - (rect.left + rect.width / 2)) * strength;
          ty = (e.clientY - (rect.top + rect.height / 2)) * strength;
          kick();
        },
        { passive: true }
      );
      var reset = function () {
        el.classList.remove('is-active');
        tx = 0;
        ty = 0;
        kick();
      };
      add(el, 'pointerleave', reset);
      add(el, 'blur', reset);
      cleanups.push(function () {
        global.cancelAnimationFrame(raf);
      });
    });
  }

  /* ---------------------------------------------------------------------
     3D 倾斜
     --------------------------------------------------------------------- */
  function initTilt(ctx) {
    if (reduced() || !finePointer()) return;

    qsa('[data-tilt]', ctx).forEach(function (el) {
      if (!claim(el, 'tilt')) return;
      var max = parseFloat(el.dataset.tilt) || 10;
      var rx = 0;
      var ry = 0;
      var trx = 0;
      var tryValue = 0;
      var raf = 0;

      var apply = function () {
        raf = 0;
        rx = lerp(rx, trx, 0.2);
        ry = lerp(ry, tryValue, 0.2);
        el.style.transform =
          'perspective(900px) rotateX(' +
          rx.toFixed(2) +
          'deg) rotateY(' +
          ry.toFixed(2) +
          'deg)';
        if (Math.abs(trx - rx) > 0.05 || Math.abs(tryValue - ry) > 0.05) {
          raf = global.requestAnimationFrame(apply);
        }
      };
      var kick = function () {
        if (!raf) raf = global.requestAnimationFrame(apply);
      };

      add(
        el,
        'pointermove',
        function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          var rect = el.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width;
          var py = (e.clientY - rect.top) / rect.height;
          trx = (0.5 - py) * max * 2;
          tryValue = (px - 0.5) * max * 2;
          el.style.setProperty('--mk-mx', (px * 100).toFixed(2) + '%');
          el.style.setProperty('--mk-my', (py * 100).toFixed(2) + '%');
          el.classList.add('is-active');
          kick();
        },
        { passive: true }
      );
      add(el, 'pointerleave', function () {
        el.classList.remove('is-active');
        trx = 0;
        tryValue = 0;
        kick();
      });
      add(el, 'focusin', function () {
        el.classList.add('is-active');
      });
      add(el, 'focusout', function () {
        el.classList.remove('is-active');
      });
      cleanups.push(function () {
        global.cancelAnimationFrame(raf);
      });
    });
  }

  /* ---------------------------------------------------------------------
     水波纹
     --------------------------------------------------------------------- */
  function initRipple(ctx) {
    qsa('[data-ripple]', ctx).forEach(function (el) {
      if (!claim(el, 'ripple')) return;
      add(el, 'pointerdown', function (e) {
        var rect = el.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2.2;
        var ink = doc.createElement('span');
        ink.className = 'mk-ripple';
        ink.style.width = size + 'px';
        ink.style.height = size + 'px';
        ink.style.left = e.clientX - rect.left - size / 2 + 'px';
        ink.style.top = e.clientY - rect.top - size / 2 + 'px';
        if (el.dataset.rippleColor) {
          ink.style.setProperty('--mk-ripple-color', el.dataset.rippleColor);
        }
        el.appendChild(ink);
        var remove = function () {
          if (ink.parentNode) ink.parentNode.removeChild(ink);
        };
        ink.addEventListener('animationend', remove, { once: true });
        global.setTimeout(remove, 900);
      });
    });
  }

  /* ---------------------------------------------------------------------
     数字滚动
     --------------------------------------------------------------------- */
  function paintCounter(el, value) {
    var decimals = parseInt(el.dataset.counterDecimals || '0', 10);
    var locale = el.dataset.counterLocale || 'zh-CN';
    var formatter;
    try {
      formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch (err) {
      formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    el.textContent =
      (el.dataset.counterPrefix || '') +
      formatter.format(value) +
      (el.dataset.counterSuffix || '');
  }

  function initCounters(ctx) {
    qsa('[data-counter]', ctx).forEach(function (el) {
      if (!claim(el, 'counter')) return;
      var to = parseFloat(el.dataset.counter) || 0;
      var from = parseFloat(el.dataset.counterFrom) || 0;
      var dur = parseInt(el.dataset.counterDuration || '1200', 10);

      if (reduced()) {
        paintCounter(el, to);
        return;
      }

      var started = false;
      var start = function () {
        if (started) return;
        started = true;
        var t0 = performance.now();
        var tick = function (now) {
          var p = clamp((now - t0) / dur, 0, 1);
          paintCounter(el, from + (to - from) * easeOutExpo(p));
          if (p < 1) global.requestAnimationFrame(tick);
        };
        global.requestAnimationFrame(tick);
      };

      if (!('IntersectionObserver' in global)) {
        start();
        return;
      }
      var io = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) {
            start();
            io.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(el);
      cleanups.push(function () {
        io.disconnect();
      });
    });
  }

  /* ---------------------------------------------------------------------
     流式打字
     --------------------------------------------------------------------- */
  var streamStates = new WeakMap();

  function stream(el, text, opts) {
    opts = opts || {};
    if (!el) return Promise.resolve();
    var full = text == null ? '' : String(text);
    var prev = streamStates.get(el);
    if (prev) {
      prev.cancelled = true;
      global.clearTimeout(prev.timer);
    }
    var state = { cancelled: false, timer: 0 };
    streamStates.set(el, state);

    var box = el.querySelector('[data-stream-text]');
    if (!box) {
      box = doc.createElement('span');
      box.setAttribute('data-stream-text', '');
      el.insertBefore(box, el.firstChild);
    }
    el.classList.add('mk-stream');
    el.classList.remove('is-done');

    var caret = el.querySelector('.mk-caret');
    if (opts.caret !== false && !caret) {
      caret = doc.createElement('span');
      caret.className = 'mk-caret';
      caret.setAttribute('aria-hidden', 'true');
      el.appendChild(caret);
    }
    if (caret) caret.style.opacity = '';

    var finish = function () {
      el.classList.add('is-done');
      if (caret) caret.style.opacity = '0.35';
      return Promise.resolve();
    };

    if (reduced() || opts.instant) {
      box.textContent = full;
      return finish();
    }

    box.textContent = '';
    var speed = opts.speed || 28;
    return new Promise(function (resolve) {
      var i = 0;
      var step = function () {
        if (state.cancelled) return resolve();
        if (i >= full.length) {
          finish().then(resolve);
          return;
        }
        var ch = full.charAt(i++);
        box.textContent += ch;
        var delay = speed;
        if (/[，。！？、；：,.!?;:…—]/.test(ch)) delay = speed * 3;
        if (ch === '\n') delay = speed * 4;
        state.timer = global.setTimeout(step, delay);
      };
      step();
    });
  }

  function initStreams(ctx) {
    qsa('[data-stream]', ctx).forEach(function (el) {
      if (!claim(el, 'stream')) return;
      var text = el.dataset.streamText || (el.textContent || '').trim();
      if (!el.dataset.streamText) el.textContent = '';
      var speed = parseInt(el.dataset.streamSpeed || '28', 10);
      var loop = el.hasAttribute('data-stream-loop');

      var run = function () {
        return stream(el, text, { speed: speed }).then(function () {
          if (loop && !reduced()) {
            global.setTimeout(run, 1800);
          }
        });
      };

      if (el.dataset.streamOn === 'load' || !('IntersectionObserver' in global)) {
        run();
        return;
      }
      var io = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) {
            run();
            io.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      io.observe(el);
      cleanups.push(function () {
        io.disconnect();
      });
    });
  }

  /* ---------------------------------------------------------------------
     Dialog / Sheet 开关
     --------------------------------------------------------------------- */
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  function openSheet(sheet) {
    if (!sheet || sheet.open) return;
    sheet.style.removeProperty('transform');
    openDialog(sheet);
    var state = sheetState.get(sheet);
    if (state) state.open = true;
  }

  function initDialogs(ctx) {
    qsa('dialog[data-modal]', ctx).forEach(function (dialog) {
      if (!claim(dialog, 'dialog')) return;
      add(dialog, 'click', function (e) {
        if (e.target !== dialog) return;
        var rect = dialog.getBoundingClientRect();
        var inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (!inside) closeDialog(dialog);
      });
    });
  }

  /* ---------------------------------------------------------------------
     底部抽屉
     --------------------------------------------------------------------- */
  function initSheets(ctx) {
    qsa('dialog[data-sheet]', ctx).forEach(function (sheet) {
      if (!claim(sheet, 'sheet')) return;
      var handle = sheet.querySelector('[data-sheet-handle]');
      var snaps = (sheet.dataset.snap || '0.55,0.92')
        .split(',')
        .map(Number)
        .filter(function (n) {
          return n > 0;
        })
        .sort(function (a, b) {
          return a - b;
        });
      if (!snaps.length) snaps = [0.55, 0.92];
      var maxSnap = snaps[snaps.length - 1];
      var minSnap = snaps[0];
      var state = {
        sheet: sheet,
        snaps: snaps,
        maxSnap: maxSnap,
        minSnap: minSnap,
        y: 0,
        open: false,
      };
      sheetState.set(sheet, state);

      var height = function () {
        return sheet.getBoundingClientRect().height || global.innerHeight * maxSnap;
      };
      var yFor = function (fraction) {
        return Math.max(0, height() * (1 - fraction / Math.max(maxSnap, 0.01)));
      };
      var setY = function (y, animate) {
        state.y = y;
        if (animate === false) {
          sheet.classList.add('is-dragging');
        } else {
          sheet.classList.remove('is-dragging');
        }
        sheet.style.transform = 'translateY(' + Math.max(0, y) + 'px)';
      };

      sheet.addEventListener('close', function () {
        state.open = false;
        sheet.classList.remove('is-dragging');
        sheet.style.removeProperty('transform');
      });

      add(sheet, 'click', function (e) {
        if (e.target !== sheet) return;
        var rect = sheet.getBoundingClientRect();
        if (e.clientY < rect.top) closeDialog(sheet);
      });

      if (handle && !reduced()) {
        var dragging = false;
        var startY = 0;
        var startOffset = 0;
        var lastY = 0;
        var lastT = 0;
        var vy = 0;

        add(handle, 'pointerdown', function (e) {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          dragging = true;
          startY = e.clientY;
          startOffset = state.y;
          lastY = e.clientY;
          lastT = performance.now();
          vy = 0;
          sheet.classList.add('is-dragging');
          if (handle.setPointerCapture) {
            try { handle.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
          }
        });

        add(
          handle,
          'pointermove',
          function (e) {
            if (!dragging) return;
            var dy = e.clientY - startY;
            var now = performance.now();
            var dt = Math.max(1, now - lastT);
            vy = (e.clientY - lastY) / dt;
            lastY = e.clientY;
            lastT = now;
            var y = startOffset + dy;
            if (y < 0) y *= 0.2;
            setY(y, false);
          },
          { passive: true }
        );

        var end = function () {
          if (!dragging) return;
          dragging = false;
          sheet.classList.remove('is-dragging');
          var maxY = yFor(minSnap);
          if (vy > 0.55 || state.y > maxY * 0.92) {
            closeDialog(sheet);
            return;
          }
          var best = state.y;
          var bestDist = Infinity;
          snaps.forEach(function (fraction) {
            var candidate = yFor(fraction);
            var dist = Math.abs(candidate - state.y);
            if (dist < bestDist) {
              bestDist = dist;
              best = candidate;
            }
          });
          setY(best, true);
        };

        add(handle, 'pointerup', end);
        add(handle, 'pointercancel', function () {
          if (!dragging) return;
          dragging = false;
          sheet.classList.remove('is-dragging');
          setY(0, true);
        });
      }

      cleanups.push(function () {
        sheet.style.removeProperty('transform');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Tabs：内容区原生 scroll-snap，指示器由 scrollLeft 驱动
     --------------------------------------------------------------------- */
  function initTabs(ctx) {
    qsa('[data-tabs]', ctx).forEach(function (tabs) {
      if (!claim(tabs, 'tabs')) return;
      var bar = tabs.querySelector('[role="tablist"]');
      var viewport = tabs.querySelector('[data-tabs-viewport]');
      var tabEls = Array.from(tabs.querySelectorAll('[role="tab"]'));
      var panels = Array.from(tabs.querySelectorAll('[role="tabpanel"]'));
      if (!bar || !viewport || !tabEls.length || !panels.length) return;

      var indicator = tabs.querySelector('.mk-tabs__indicator');
      var raf = 0;
      var active = 0;

      var setIndicator = function (progress) {
        if (!indicator) return;
        var p = clamp(progress, 0, tabEls.length - 1);
        var i = Math.floor(p);
        var t = p - i;
        var a = tabEls[i];
        var b = tabEls[Math.min(i + 1, tabEls.length - 1)];
        var x = lerp(a.offsetLeft, b.offsetLeft, t);
        var w = lerp(a.offsetWidth, b.offsetWidth, t);
        indicator.style.transform = 'translate3d(' + x + 'px,0,0)';
        indicator.style.width = w + 'px';
      };

      var setActive = function (index) {
        active = index;
        tabEls.forEach(function (tab, i) {
          var on = i === index;
          tab.setAttribute('aria-selected', on ? 'true' : 'false');
          tab.tabIndex = on ? 0 : -1;
        });
      };

      var progress = function () {
        var max = viewport.scrollWidth - viewport.clientWidth;
        var p = max > 0 ? viewport.scrollLeft / max : 0;
        return p * (tabEls.length - 1);
      };

      var update = function () {
        raf = 0;
        var p = progress();
        setIndicator(p);
        var next = Math.round(p);
        if (next !== active) setActive(next);
      };

      var onScroll = function () {
        if (!raf) raf = global.requestAnimationFrame(update);
      };

      var goTo = function (index) {
        var panel = panels[clamp(index, 0, panels.length - 1)];
        var left =
          panel.getBoundingClientRect().left -
          viewport.getBoundingClientRect().left +
          viewport.scrollLeft;
        viewport.scrollTo({ left: left, behavior: reduced() ? 'auto' : 'smooth' });
      };

      tabEls.forEach(function (tab, i) {
        add(tab, 'click', function () {
          goTo(i);
        });
        add(tab, 'keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i + 1;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i - 1;
          if (e.key === 'Home') next = 0;
          if (e.key === 'End') next = tabEls.length - 1;
          if (next == null) return;
          e.preventDefault();
          next = clamp(next, 0, tabEls.length - 1);
          tabEls[next].focus();
          goTo(next);
        });
      });

      add(viewport, 'scroll', onScroll, { passive: true });
      add(global, 'resize', update);
      if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) {
        doc.fonts.ready.then(update).catch(function () {});
      }
      setActive(0);
      global.requestAnimationFrame(function () {
        setIndicator(0);
      });
      cleanups.push(function () {
        global.cancelAnimationFrame(raf);
      });
    });
  }

  /* ---------------------------------------------------------------------
     列表滑动操作
     --------------------------------------------------------------------- */
  function initSwipeRows(ctx) {
    qsa('[data-swipe-row]', ctx).forEach(function (row) {
      if (!claim(row, 'swipe')) return;
      var content = row.querySelector('[data-swipe-content]');
      var actions = row.querySelector('.mk-swipe__actions');
      if (!content || !actions) return;

      var buttons = Array.from(actions.querySelectorAll('button, a'));
      var open = false;

      var actionWidth = function () {
        return actions.offsetWidth || 152;
      };

      var applyOffset = function (x, animate) {
        content.style.transition = animate === false ? 'none' : '';
        content.style.transform = 'translate3d(' + x + 'px,0,0)';
        if (animate === false) {
          global.requestAnimationFrame(function () {
            content.style.transition = '';
          });
        }
      };

      var setOpen = function (value, animate) {
        open = value;
        applyOffset(value ? -actionWidth() : 0, animate);
        row.classList.toggle('is-open', value);
        buttons.forEach(function (btn) {
          if (value) {
            btn.removeAttribute('tabindex');
            btn.removeAttribute('aria-hidden');
          } else {
            btn.setAttribute('tabindex', '-1');
            btn.setAttribute('aria-hidden', 'true');
          }
        });
        if (value) {
          Array.from(doc.querySelectorAll('[data-swipe-row].is-open')).forEach(function (other) {
            if (other !== row) {
              other.dispatchEvent(new CustomEvent('mk:close-swipe'));
            }
          });
        }
      };

      add(row, 'mk:close-swipe', function () {
        if (open) setOpen(false, true);
      });

      var toggle = row.querySelector('[data-swipe-toggle]');
      if (toggle) {
        add(toggle, 'click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open, true);
        });
      }

      setOpen(false, false);

      var dragging = false;
      var axis = null;
      var startX = 0;
      var startY = 0;
      var startOffset = 0;
      var lastX = 0;
      var lastT = 0;
      var vx = 0;
      var current = 0;
      var detach = null;
      var gestureCleanupAdded = false;

      var finish = function (cancelled) {
        if (!dragging) return;
        dragging = false;
        row.classList.remove('is-dragging');
        if (detach) detach();
        detach = null;
        var wasOpen = open;
        if (cancelled) {
          setOpen(wasOpen, true);
          return;
        }
        var width = actionWidth();
        var shouldOpen;
        if (vx < -0.4 || current < -width * 0.45) {
          shouldOpen = true;
        } else if (vx > 0.4 || current > -width * 0.55) {
          shouldOpen = false;
        } else {
          shouldOpen = current < -width / 2;
        }
        setOpen(shouldOpen, true);
        if (shouldOpen !== wasOpen) haptic('snap');
      };

      add(content, 'pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        axis = null;
        startX = e.clientX;
        startY = e.clientY;
        startOffset = open ? -actionWidth() : 0;
        current = startOffset;
        lastX = e.clientX;
        lastT = performance.now();
        vx = 0;
        row.classList.add('is-dragging');

        var move = function (ev) {
          if (!dragging) return;
          var dx = ev.clientX - startX;
          var dy = ev.clientY - startY;
          if (!axis) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            if (axis === 'y') {
              finish(true);
              return;
            }
          }
          var now = performance.now();
          var dt = Math.max(1, now - lastT);
          vx = (ev.clientX - lastX) / dt;
          lastX = ev.clientX;
          lastT = now;
          current = startOffset + dx;
          var width = actionWidth();
          if (current > 0) current *= 0.2;
          if (current < -width) current = -width + (current + width) * 0.2;
          content.style.transform = 'translate3d(' + current + 'px,0,0)';
          if (ev.cancelable) ev.preventDefault();
        };
        var up = function () {
          finish(false);
        };
        var cancel = function () {
          finish(true);
        };

        global.addEventListener('pointermove', move, { passive: false });
        global.addEventListener('pointerup', up);
        global.addEventListener('pointercancel', cancel);
        detach = function () {
          global.removeEventListener('pointermove', move);
          global.removeEventListener('pointerup', up);
          global.removeEventListener('pointercancel', cancel);
        };
        if (!gestureCleanupAdded) {
          gestureCleanupAdded = true;
          cleanups.push(function () {
            if (detach) detach();
          });
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     命令栏
     --------------------------------------------------------------------- */
  var cmdkCounter = 0;

  function openCmdk(dialog) {
    if (!dialog) return;
    if (dialog._mkOpen) {
      dialog._mkOpen();
    } else {
      openDialog(dialog);
    }
  }

  function initCmdk(ctx) {
    qsa('dialog[data-cmdk]', ctx).forEach(function (dialog) {
      if (!claim(dialog, 'cmdk')) return;
      var input = dialog.querySelector('[data-cmdk-input]');
      var active = -1;

      var items = function () {
        return Array.from(dialog.querySelectorAll('[data-cmdk-item]'));
      };
      var visible = function () {
        return items().filter(function (item) {
          return !item.hidden;
        });
      };
      var setActive = function (index) {
        var list = visible();
        items().forEach(function (item) {
          item.classList.remove('is-active');
          item.setAttribute('aria-selected', 'false');
        });
        if (!list.length) {
          active = -1;
          return;
        }
        active = clamp(index, 0, list.length - 1);
        list[active].classList.add('is-active');
        list[active].setAttribute('aria-selected', 'true');
        if (list[active].id) {
          if (input) input.setAttribute('aria-activedescendant', list[active].id);
          list[active].scrollIntoView({ block: 'nearest' });
        }
      };
      var filter = function () {
        var query = (input && input.value ? input.value : '').trim().toLowerCase();
        items().forEach(function (item) {
          if (!item.id) item.id = 'mk-cmdk-item-' + ++cmdkCounter;
          var hay = (item.dataset.keywords || '') + ' ' + (item.textContent || '');
          item.hidden = query ? hay.toLowerCase().indexOf(query) === -1 : false;
          item.setAttribute('role', 'option');
        });
        var empty = dialog.querySelector('[data-cmdk-empty]');
        if (empty) empty.hidden = visible().length > 0;
        setActive(0);
      };

      var open = function () {
        if (dialog.open) return;
        if (input) input.value = '';
        filter();
        openDialog(dialog);
        if (input) input.focus();
      };
      dialog._mkOpen = open;

      if (input) {
        add(input, 'input', filter);
        add(input, 'keydown', function (e) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(active + 1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(active - 1);
          } else if (e.key === 'Enter') {
            var list = visible();
            if (!list.length) return;
            e.preventDefault();
            var target = list[active < 0 ? 0 : active];
            var clickable = target.querySelector('button, a') || target;
            clickable.click();
            closeDialog(dialog);
          }
        });
      }

      add(dialog, 'click', function (e) {
        var item = e.target.closest('[data-cmdk-item]');
        if (item && !item.hidden) closeDialog(dialog);
        if (e.target === dialog) {
          var rect = dialog.getBoundingClientRect();
          var inside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;
          if (!inside) closeDialog(dialog);
        }
      });

      filter();
      cleanups.push(function () {
        delete dialog._mkOpen;
      });
    });
  }

  /* ---------------------------------------------------------------------
     触感 / 角标
     --------------------------------------------------------------------- */
  var HAPTICS = { tap: 10, snap: 4, success: [8, 40, 12], warn: [20, 60, 20] };

  function haptic(kind) {
    if (reduced()) return;
    if (!global.navigator || typeof global.navigator.vibrate !== 'function') return;
    // 合成事件 / 用户尚未交互时浏览器会拦截并报 intervention，直接跳过
    if (global.navigator.userActivation && !global.navigator.userActivation.hasBeenActive) return;
    try {
      global.navigator.vibrate(HAPTICS[kind] || HAPTICS.tap);
    } catch (err) {
      /* iOS Safari 等不支持时静默降级 */
    }
  }

  function initHaptics(ctx) {
    qsa('[data-haptic]', ctx).forEach(function (el) {
      if (!claim(el, 'haptic')) return;
      add(
        el,
        'pointerdown',
        function () {
          haptic(el.dataset.haptic || 'tap');
        },
        { passive: true }
      );
    });
  }

  var toastEl = null;
  var toastTimer = 0;

  function toast(message, opts) {
    if (!doc.body || message == null) return;
    if (!toastEl) {
      toastEl = doc.createElement('div');
      toastEl.className = 'mk-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      doc.body.appendChild(toastEl);
    }
    toastEl.textContent = String(message);
    toastEl.classList.add('is-on');
    global.clearTimeout(toastTimer);
    var duration = (opts && opts.duration) || 2000;
    toastTimer = global.setTimeout(function () {
      toastEl.classList.remove('is-on');
    }, duration);
  }

  function bump(el, delta) {
    if (!el) return;
    delta = typeof delta === 'number' ? delta : 1;
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
    el.addEventListener('animationend', function () {
      el.classList.remove('is-bump');
    }, { once: true });

    if (delta >= 2 && !reduced()) {
      var plus = doc.createElement('span');
      plus.className = 'mk-bump-plus';
      plus.textContent = '+' + delta;
      plus.style.left = '50%';
      plus.style.top = '-0.4em';
      plus.style.transform = 'translateX(-50%)';
      if (global.getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }
      el.appendChild(plus);
      global.setTimeout(function () {
        if (plus.parentNode) plus.parentNode.removeChild(plus);
      }, 900);
    }
  }

  /* ---------------------------------------------------------------------
     FLIP
     --------------------------------------------------------------------- */
  function capture(el) {
    var rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  function flip(first, lastEl, opts) {
    opts = opts || {};
    if (!lastEl) return null;
    var from = first && first.nodeType === 1 ? capture(first) : first;
    if (!from) return null;
    var last = lastEl.getBoundingClientRect();
    if (reduced()) return null;

    var dx = from.left - last.left;
    var dy = from.top - last.top;
    var sx = last.width ? from.width / last.width : 1;
    var sy = last.height ? from.height / last.height : 1;

    var animation = lastEl.animate(
      [
        {
          transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')',
          transformOrigin: 'top left',
        },
        { transform: 'none', transformOrigin: 'top left' },
      ],
      {
        duration: opts.duration || 420,
        easing: opts.easing || 'cubic-bezier(0.32, 0.72, 0, 1)',
        fill: 'both',
      }
    );
    animation.finished
      .then(function () {
        animation.cancel();
      })
      .catch(function () {});
    return animation;
  }

  /* ---------------------------------------------------------------------
     数值动画
     --------------------------------------------------------------------- */
  function animateValue(opts) {
    opts = opts || {};
    var from = opts.from || 0;
    var to = opts.to == null ? 1 : opts.to;
    var duration = opts.duration || 600;
    var ease = opts.ease || easeOutExpo;
    var cancelled = false;
    var id = 0;

    if (reduced()) {
      if (opts.onUpdate) opts.onUpdate(to);
      if (opts.onDone) opts.onDone();
      return { cancel: function () {} };
    }

    var t0 = performance.now();
    var tick = function (now) {
      if (cancelled) return;
      var p = clamp((now - t0) / duration, 0, 1);
      if (opts.onUpdate) opts.onUpdate(from + (to - from) * ease(p));
      if (p < 1) {
        id = global.requestAnimationFrame(tick);
      } else if (opts.onDone) {
        opts.onDone();
      }
    };
    id = global.requestAnimationFrame(tick);
    return {
      cancel: function () {
        cancelled = true;
        global.cancelAnimationFrame(id);
      },
    };
  }

  /* ---------------------------------------------------------------------
     全局委托：dialog/sheet 开关、⌘K、reduced 变化
     --------------------------------------------------------------------- */
  function bindGlobals() {
    if (globalBound) return;
    globalBound = true;

    var click = function (e) {
      var toastTrigger = e.target.closest('[data-toast]');
      if (toastTrigger) {
        if (toastTrigger.tagName === 'A' && toastTrigger.getAttribute('href') === '#') {
          e.preventDefault();
        }
        toast(toastTrigger.dataset.toast, {
          duration: parseInt(toastTrigger.dataset.toastDuration || '2000', 10),
        });
        if (toastTrigger.hasAttribute('data-toast-close')) {
          var toastDialog = toastTrigger.closest('dialog');
          if (toastDialog) closeDialog(toastDialog);
        }
      }
      var cmdkOpener = e.target.closest('[data-cmdk-open]');
      if (cmdkOpener) {
        var target = cmdkOpener.dataset.cmdkOpen
          ? doc.getElementById(cmdkOpener.dataset.cmdkOpen)
          : doc.querySelector('dialog[data-cmdk]');
        if (target) {
          e.preventDefault();
          openCmdk(target);
        }
      }
      var opener = e.target.closest('[data-modal-open],[data-sheet-open]');
      if (opener) {
        if (opener.dataset.modalOpen) {
          openDialog(doc.getElementById(opener.dataset.modalOpen));
        }
        if (opener.dataset.sheetOpen) {
          openSheet(doc.getElementById(opener.dataset.sheetOpen));
        }
      }
      var closer = e.target.closest('[data-modal-close],[data-sheet-close]');
      if (closer) {
        var dialog = closer.closest('dialog');
        if (dialog) closeDialog(dialog);
      }
    };
    addGlobal(doc, 'click', click);

    var keydown = function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        var cmdk = doc.querySelector('dialog[data-cmdk]');
        if (cmdk) {
          e.preventDefault();
          openCmdk(cmdk);
        }
      }
    };
    addGlobal(doc, 'keydown', keydown);

    if (reduceMQ && reduceMQ.addEventListener) {
      var onReduce = function (e) {
        if (!e.matches) return;
        qsa('[data-parallax],[data-magnetic],[data-tilt]').forEach(function (el) {
          el.style.removeProperty('transform');
          el.classList.remove('is-active');
        });
        qsa('[data-reveal]').forEach(function (el) {
          el.classList.add('is-in');
        });
      };
      addGlobal(reduceMQ, 'change', onReduce);
    }
  }

  /* ---------------------------------------------------------------------
     init / destroy
     --------------------------------------------------------------------- */
  function init(ctx) {
    if (!doc || !doc.body) return api;
    ctx = ctx || doc;
    bindGlobals();
    initReveal(ctx);
    initParallax(ctx);
    initMagnetic(ctx);
    initTilt(ctx);
    initRipple(ctx);
    initCounters(ctx);
    initStreams(ctx);
    initDialogs(ctx);
    initSheets(ctx);
    initTabs(ctx);
    initSwipeRows(ctx);
    initCmdk(ctx);
    initHaptics(ctx);
    return api;
  }

  function destroy() {
    cleanups.forEach(function (fn) {
      try { fn(); } catch (err) { /* noop */ }
    });
    cleanups = [];
    globalCleanups.forEach(function (fn) {
      try { fn(); } catch (err) { /* noop */ }
    });
    globalCleanups = [];
    globalBound = false;

    qsa('[data-mk-bound]').forEach(function (el) {
      delete el.dataset.mkBound;
    });
    qsa('[data-reveal].is-in').forEach(function (el) {
      el.classList.remove('is-in');
    });
    qsa('[data-parallax],[data-magnetic],[data-tilt]').forEach(function (el) {
      el.style.removeProperty('transform');
      el.classList.remove('is-active');
    });
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    toastEl = null;
    global.clearTimeout(toastTimer);
    root.classList.remove('mk-js');
    return api;
  }

  var api = {
    version: VERSION,
    init: init,
    destroy: destroy,
    stream: stream,
    haptic: haptic,
    toast: toast,
    bump: bump,
    capture: capture,
    flip: flip,
    animateValue: animateValue,
    get reduced() {
      return reduced();
    },
    get finePointer() {
      return finePointer();
    },
  };

  global.MotionKit = api;

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () { init(); }, { once: true });
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {}));
