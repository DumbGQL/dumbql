(function () {
  'use strict';

  function createEl(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  function setHTML(el, html) {
    el.insertAdjacentHTML('afterbegin', html);
  }

  var EXT_SOURCE = 'dumb-keystore-graphql-debug';

  // In Chrome MAIN world: window is the page's window.
  // In Firefox ISOLATED world: window.wrappedJSObject is the page's window.
  var pageWindow = (typeof window.wrappedJSObject !== 'undefined') ? window.wrappedJSObject : window;

  var GRAPHQL_PATTERNS = ['/graphql', '/api/graphql', '/gql'];

  function isGraphqlUrl(url) {
    try {
      var u = new URL(url);
      return GRAPHQL_PATTERNS.some(function (p) { return u.pathname.includes(p); });
    } catch (_) {
      return false;
    }
  }

  function send(type, payload) {
    window.postMessage({
      source: EXT_SOURCE,
      type: type,
      payload: payload,
    }, '*');
  }

  function sendRequest(payload) {
    send('graphql-request', payload);
  }

  function sendSchema(schema) {
    send('graphql-schema', schema);
  }

      // ── Bridge: forward messages from Angular DevtoolsService ──
  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    var msg = event.data;
    if (!msg || msg.source !== EXT_SOURCE) return;
    if (msg.type === 'null-detection' && msg.payload) {
      spawnEpicFetus(msg.payload.type, msg.payload);
      return;
    }
  });

  // Signal to Angular DevtoolsService that extension is ready
  window.postMessage({ source: EXT_SOURCE, type: 'devtools-ready' }, '*');

  if (typeof console !== 'undefined') {
    console.log('[GraphQL DevTools] bridge active, pageScope:', pageWindow !== window ? 'wrappedJSObject' : 'main');
  }

  // ── Helper: patch page globals ──────────────────────
  function patchPage(name, patcher) {
    if (name in pageWindow) {
      var orig = pageWindow[name];
      pageWindow[name] = patcher(orig);
    }
  }

  // ── patch fetch ─────────────────────────────────────
  patchPage('fetch', function (origFetch) {
    return async function patchedFetch(input, init) {
      var url = typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : (input && input.url) || '';
      var method = (init && init.method) || (input instanceof Request ? input.method : 'POST');
      var body = (init && init.body) || (input instanceof Request ? undefined : undefined);
      var requestBody = body || (input instanceof Request ? await input.clone().text() : undefined);
      var startTime = performance.now();

      if (!isGraphqlUrl(url) || method !== 'POST') {
        return origFetch.apply(this, arguments);
      }

      try {
        var response = await origFetch.apply(this, arguments);
        var clone = response.clone();
        var text = await clone.text();
        sendRequest({
          method: method,
          url: url,
          body: requestBody,
          startTime: startTime,
          endTime: performance.now(),
          duration: performance.now() - startTime,
          response: text,
          status: response.status,
        });
        checkResponseForNull(text, requestBody);
        return response;
      } catch (err) {
        sendRequest({
          method: method,
          url: url,
          body: requestBody,
          startTime: startTime,
          endTime: performance.now(),
          duration: performance.now() - startTime,
          response: 'Network error',
          status: 0,
        });
        throw err;
      }
    };
  });

  // ── patch XMLHttpRequest ─────────────────────────────
  if ('XMLHttpRequest' in pageWindow) {
    var XHR = pageWindow.XMLHttpRequest;
    var origOpen = XHR.prototype.open;
    var origSend = XHR.prototype.send;

    XHR.prototype.open = function (method, url) {
      this._gqlUrl = url;
      this._gqlMethod = method;
      return origOpen.apply(this, arguments);
    };

    XHR.prototype.send = function (body) {
      var self = this;
      var startTime = performance.now();

      if (isGraphqlUrl(this._gqlUrl) && this._gqlMethod === 'POST') {
        this.addEventListener('loadend', function () {
          sendRequest({
            method: self._gqlMethod,
            url: self._gqlUrl,
            body: body,
            startTime: startTime,
            endTime: performance.now(),
            duration: performance.now() - startTime,
            response: self.responseText,
            status: self.status,
          });
          checkResponseForNull(self.responseText, body);
        });
      }

      return origSend.apply(this, arguments);
    };
  }

  // ── patch WebSocket for GraphQL subscriptions ────────
  function isGraphqlWs(url, protocols) {
    if (protocols && protocols.indexOf('graphql-transport-ws') !== -1) return true;
    if (typeof url === 'string') {
      try {
        var u = new URL(url);
        return GRAPHQL_PATTERNS.some(function (p) { return u.pathname.includes(p); });
      } catch (_) { return false; }
    }
    return false;
  }

  if ('WebSocket' in pageWindow) {
    var OrigWebSocket = pageWindow.WebSocket;

    pageWindow.WebSocket = function PatchedWebSocket(url, protocols) {
      var isGraphql = isGraphqlWs(url, protocols);
      var ws = new OrigWebSocket(url, protocols);

      if (!isGraphql) return ws;

      var subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

      ws.addEventListener('open', function () {
        send('graphql-subscription', {
          subId: subId,
          type: 'open',
          url: typeof url === 'string' ? url : '',
          timestamp: Date.now(),
        });
      });

      ws.addEventListener('message', function (event) {
        var msg;
        try { msg = JSON.parse(event.data); } catch (_) { return; }

        send('graphql-subscription', {
          subId: subId,
          type: msg.type === 'next' ? 'next' : msg.type === 'error' ? 'error' : msg.type === 'complete' ? 'complete' : 'message',
          wsType: msg.type,
          payload: msg.payload || null,
          timestamp: Date.now(),
        });
      });

      ws.addEventListener('error', function () {
        send('graphql-subscription', {
          subId: subId,
          type: 'error',
          error: 'WebSocket error',
          timestamp: Date.now(),
        });
      });

      ws.addEventListener('close', function (event) {
        send('graphql-subscription', {
          subId: subId,
          type: 'close',
          code: event.code,
          reason: event.reason,
          timestamp: Date.now(),
        });
      });

      var origWsSend = ws.send;
      ws.send = function patchedWsSend(data) {
        var msg;
        try { msg = JSON.parse(typeof data === 'string' ? data : data); } catch (_) { return origWsSend.call(ws, data); }

        send('graphql-subscription', {
          subId: subId,
          type: 'send',
          wsType: msg.type,
          payload: msg.payload || null,
          timestamp: Date.now(),
        });

        return origWsSend.call(ws, data);
      };

      return ws;
    };

    // Copy static properties for instanceof compatibility
    pageWindow.WebSocket.CONNECTING = 0;
    pageWindow.WebSocket.OPEN = 1;
    pageWindow.WebSocket.CLOSING = 2;
    pageWindow.WebSocket.CLOSED = 3;
    pageWindow.WebSocket.prototype = OrigWebSocket.prototype;
  }

  // ── Epic Fetus Null Detection ──────────────────────────
  var EF_CSS = null;
  var efTimer = null;
  var efReticleInterval = null;
  var efEnabled = true;

  // Listen for config from the bridge
  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== EXT_SOURCE) return;
    if (event.data.type === 'epic-fetus-config' && event.data.payload) {
      efEnabled = event.data.payload.enabled !== false;
    }
  });

  // Also keep the existing null-detection handler (for framework hooks)
  // but wrap spawnEpicFetus in the flag check

  function emitNullDetection(type, info) {
    window.postMessage({
      source: EXT_SOURCE,
      type: 'null-detection',
      payload: Object.assign({ type: type }, info),
    }, '*');
  }

  function injectEfStyles() {
    if (EF_CSS) return;
    EF_CSS = document.createElement('style');
    EF_CSS.textContent = `
.ef-container{position:fixed;inset:0;z-index:999999;pointer-events:none;overflow:hidden}
/* Reticle */
.ef-reticle{position:absolute;top:50%;left:50%;z-index:15;width:120px;height:120px;margin-left:-60px;margin-top:-60px;animation:ef-reticle-pulse .4s ease-in-out infinite alternate}
.ef-reticle-ring{position:absolute;inset:0;border:3px solid #f44;border-radius:50%;box-shadow:0 0 20px rgba(255,50,50,.6),inset 0 0 20px rgba(255,50,50,.3)}
.ef-reticle-cross-h,.ef-reticle-cross-v{position:absolute;background:#f44;box-shadow:0 0 10px #f44}
.ef-reticle-cross-h{top:50%;left:0;right:0;height:2px;margin-top:-1px}
.ef-reticle-cross-v{left:50%;top:0;bottom:0;width:2px;margin-left:-1px}
.ef-reticle-dot{position:absolute;top:50%;left:50%;width:8px;height:8px;margin-left:-4px;margin-top:-4px;background:#f44;border-radius:50%;box-shadow:0 0 15px #f44}
.ef-reticle-arc{position:absolute;width:40px;height:40px;border:2px solid #f44;border-radius:50%;box-shadow:0 0 8px rgba(255,50,50,.4)}
.ef-reticle-arc:nth-child(5){top:-10px;left:-10px;border-right:none;border-bottom:none}
.ef-reticle-arc:nth-child(6){top:-10px;right:-10px;border-left:none;border-bottom:none}
.ef-reticle-arc:nth-child(7){bottom:-10px;left:-10px;border-right:none;border-top:none}
.ef-reticle-arc:nth-child(8){bottom:-10px;right:-10px;border-left:none;border-top:none}
/* Warning line from top */
.ef-warning{position:absolute;top:0;left:50%;width:4px;height:50%;margin-left:-2px;z-index:14;background:linear-gradient(to bottom,#f44,rgba(255,50,50,0));animation:ef-warning-pulse .2s ease-in-out infinite alternate}
/* Missile */
.ef-missile{position:absolute;top:0;left:50%;z-index:16;width:30px;height:80px;margin-left:-15px;animation:ef-missile-drop .7s cubic-bezier(.36,.45,.63,.9) forwards;filter:drop-shadow(0 0 15px #f60)}
.ef-missile-body{width:100%;height:100%;border-radius:4px 4px 8px 8px;background:linear-gradient(to right,#666,#bbb,#666);clip-path:polygon(30% 0,70% 0,100% 80%,100% 100%,0 100%,0 80%)}
.ef-missile-tip{position:absolute;top:-4px;left:50%;margin-left:-10px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:14px solid #f44}
.ef-missile-fin{position:absolute;top:10px;width:10px;height:20px;background:#888;clip-path:polygon(0 0,100% 0,0 100%)}
.ef-missile-fin:first-of-type{left:-8px}
.ef-missile-fin:last-of-type{right:-8px;transform:scaleX(-1)}
.ef-missile-trail{position:absolute;top:100%;left:50%;margin-left:-4px;width:8px;height:0;background:linear-gradient(to bottom,#ff0,#f80,#f00,transparent);animation:ef-missile-trail .7s ease-out forwards}
/* Explosion */
.ef-explosion{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:5;width:10px;height:10px}
.ef-fireball{position:absolute;top:50%;left:50%;margin-top:-200px;margin-left:-200px;width:400px;height:400px;background:radial-gradient(circle,#fff 0%,#ffe066 10%,#ff8800 30%,#ff4400 50%,#cc2200 65%,rgba(100,30,0,0) 80%);border-radius:50%;animation:ef-fireball .7s ease-out forwards;mix-blend-mode:screen}
.ef-fireball::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.8) 0%,transparent 40%);animation:ef-fireball-core .5s ease-out forwards}
.ef-shockwave{position:absolute;top:50%;left:50%;margin-top:-300px;margin-left:-300px;width:600px;height:600px;border:6px solid rgba(255,200,100,.7);border-radius:50%;animation:ef-shock .8s ease-out forwards;box-shadow:0 0 40px rgba(255,200,100,.4)}
.ef-smoke{position:absolute;top:50%;left:50%;z-index:4;width:100px;height:100px;margin-left:-50px;margin-top:-50px;background:radial-gradient(circle,rgba(80,80,80,.6),transparent);border-radius:50%;animation:ef-smoke-up 1.5s ease-out forwards}
.ef-smoke:nth-child(3){margin-left:-80px;margin-top:-30px;animation-delay:.1s}
.ef-smoke:nth-child(4){margin-left:30px;margin-top:-60px;animation-delay:.2s}
.ef-smoke:nth-child(5){margin-left:-40px;margin-top:20px;animation-delay:.15s}
/* Debris */
.ef-debris{position:absolute;top:50%;left:50%;z-index:6;width:20px;height:20px;margin-left:-10px;margin-top:-10px;animation:ef-fly 1.2s cubic-bezier(.5,0,.6,1) forwards}
.ef-debris.null{background:#ff0;box-shadow:0 0 10px #ff0}
.ef-debris.error{background:#f44;box-shadow:0 0 10px #f44}
.ef-debris-dark{background:#555;box-shadow:0 0 5px rgba(0,0,0,.3)}
/* Screen shake */
.ef-shake{animation:ef-shake .8s ease-in-out}
/* Overlay message */
.ef-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;animation:ef-fade .3s ease-out;z-index:20}
.ef-overlay.null{background:rgba(0,0,0,.92)}
.ef-overlay.error{background:rgba(80,0,0,.92)}
.ef-overlay-content{text-align:center;animation:ef-appear .5s cubic-bezier(.22,1,.36,1)}
.ef-icon{font-size:6rem;margin-bottom:1rem;filter:drop-shadow(0 0 30px currentColor)}
.ef-null-sym{color:#ff0;text-shadow:0 0 20px #ff0,0 0 40px #ff0,0 0 80px #f80;animation:ef-pulse 1.5s ease-in-out infinite}
.ef-err-sym{color:#f44;text-shadow:0 0 20px #f44,0 0 40px #f44,0 0 80px #a00;animation:ef-pulse 1.5s ease-in-out infinite}
.ef-title{font-size:3rem;font-weight:900;letter-spacing:.15em;margin-bottom:.75rem;text-transform:uppercase;animation:ef-glitch 4s ease-in-out infinite}
.null .ef-title{color:#ff0;text-shadow:0 0 20px #ff0,4px 0 0 rgba(255,0,0,.5),-4px 0 0 rgba(0,0,255,.5)}
.error .ef-title{color:#f44;text-shadow:0 0 20px #f44,4px 0 0 rgba(255,255,0,.5),-4px 0 0 rgba(255,0,0,.5)}
.ef-message{font-size:1.25rem;color:rgba(255,255,255,.7);font-family:monospace;margin-bottom:1rem;white-space:pre-wrap;word-break:break-all}
.ef-sub{font-size:.85rem;color:rgba(255,255,255,.4);letter-spacing:.3em;text-transform:uppercase}
@keyframes ef-reticle-pulse{0%{transform:scale(.9);opacity:.7}100%{transform:scale(1.1);opacity:1}}
@keyframes ef-warning-pulse{0%{opacity:.3}100%{opacity:1}}
@keyframes ef-missile-drop{0%{transform:translateY(-200px) rotate(180deg);opacity:0}20%{opacity:1}100%{transform:translateY(calc(50vh + 40px)) rotate(0deg);opacity:1}}
@keyframes ef-missile-trail{0%{height:0;opacity:1}100%{height:200px;opacity:0}}
@keyframes ef-fireball{0%{transform:scale(0);opacity:1}30%{opacity:1}100%{transform:scale(2);opacity:0}}
@keyframes ef-fireball-core{0%{transform:scale(.5);opacity:0}30%{opacity:1}100%{transform:scale(1.5);opacity:0}}
@keyframes ef-shock{0%{transform:scale(0);opacity:1}50%{opacity:.8}100%{transform:scale(2.5);opacity:0}}
@keyframes ef-smoke-up{0%{transform:translateY(0) scale(.5);opacity:.8}100%{transform:translateY(-100px) scale(2);opacity:0}}
@keyframes ef-fly{0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1}20%{opacity:1}100%{transform:translate(calc(cos(var(--a))*300px+var(--d,0)),calc(sin(var(--a))*180px+120px)) rotate(calc(var(--a)*5)) scale(.3);opacity:0}}
@keyframes ef-fade{from{opacity:0;backdrop-filter:blur(0)}to{opacity:1;backdrop-filter:blur(4px)}}
@keyframes ef-appear{from{transform:scale(.5) translateY(40px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
@keyframes ef-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}
@keyframes ef-glitch{0%,90%,100%{transform:translate(0)}92%{transform:translate(-3px,1px)}94%{transform:translate(3px,-1px)}96%{transform:translate(-1px,2px)}98%{transform:translate(1px,-2px)}}
@keyframes ef-shake{0%,100%{transform:translate(0)}10%{transform:translate(-10px,5px)}20%{transform:translate(8px,-8px)}30%{transform:translate(-5px,10px)}40%{transform:translate(10px,-3px)}50%{transform:translate(-8px,8px)}60%{transform:translate(5px,-10px)}70%{transform:translate(-3px,5px)}80%{transform:translate(8px,-5px)}90%{transform:translate(-5px,3px)}
`;
    document.documentElement.appendChild(EF_CSS);
  }

  function walkForNull(obj, path) {
    if (obj === null) return [path];
    if (Array.isArray(obj)) {
      var r = [];
      for (var i = 0; i < obj.length; i++) r.push.apply(r, walkForNull(obj[i], path + '[' + i + ']'));
      return r;
    }
    if (typeof obj === 'object' && obj !== null) {
      var keys = Object.keys(obj);
      var r = [];
      for (var i = 0; i < keys.length; i++) r.push.apply(r, walkForNull(obj[keys[i]], path + '.' + keys[i]));
      return r;
    }
    return [];
  }

  function getOpName(bodyStr) {
    try {
      var b = JSON.parse(typeof bodyStr === 'string' ? bodyStr : bodyStr);
      var q = b && b.query || '';
      var m = q.match(/(?:query|mutation|subscription)\s+(\w+)/i);
      return m ? m[1] : undefined;
    } catch (_) { return undefined; }
  }

  function checkResponseForNull(responseText, bodyStr) {
    try {
      var parsed = JSON.parse(responseText);
      var opName = getOpName(bodyStr);
      if (parsed.errors && parsed.errors.length) {
        emitNullDetection('query-error', { message: parsed.errors[0].message, operationName: opName });
        return;
      }
      if (parsed.data !== null && parsed.data !== undefined) {
        var paths = walkForNull(parsed.data, 'data');
        if (paths.length) {
          emitNullDetection('null-value', { path: paths[0], operationName: opName });
        }
      }
    } catch (_) {}
  }

  function spawnEpicFetus(type, info) {
    if (efTimer) return;
    if (!efEnabled) return;
    injectEfStyles();
    var isNull = type === 'null-value';
    var title = isNull ? 'NULL DETECTED' : 'У ВАС ОШИБКА В КВЕРИ';
    var message = isNull ? (info.path || 'unknown') : info.message;

    var c = document.createElement('div');
    c.className = 'ef-container';

    // Phase 1: Reticle + warning line
    var reticle = createEl('div', 'ef-reticle');
    setHTML(reticle, '<div class="ef-reticle-ring"></div><div class="ef-reticle-cross-h"></div><div class="ef-reticle-cross-v"></div><div class="ef-reticle-dot"></div><div class="ef-reticle-arc"></div><div class="ef-reticle-arc"></div><div class="ef-reticle-arc"></div><div class="ef-reticle-arc"></div>');
    c.appendChild(reticle);

    var warning = document.createElement('div');
    warning.className = 'ef-warning';
    c.appendChild(warning);

    document.body.appendChild(c);

    // Phase 2: Missile from top (after 600ms)
    var missileTimer = setTimeout(function() {
      reticle.style.display = 'none';
      warning.style.display = 'none';

      var missile = createEl('div', 'ef-missile');
      setHTML(missile, '<div class="ef-missile-tip"></div><div class="ef-missile-body"></div><div class="ef-missile-fin"></div><div class="ef-missile-fin"></div><div class="ef-missile-trail"></div>');
      c.appendChild(missile);
    }, 600);

    // Phase 3: Explosion (after 1300ms)
    var explosionTimer = setTimeout(function() {
      var existingMissile = c.querySelector('.ef-missile');
      if (existingMissile) existingMissile.remove();

      var exp = createEl('div', 'ef-explosion');
      setHTML(exp, '<div class="ef-fireball"></div><div class="ef-shockwave"></div>');
      c.appendChild(exp);
      c.classList.add('ef-shake');

      for (var i = 0; i < 3; i++) {
        var smoke = document.createElement('div');
        smoke.className = 'ef-smoke';
        c.appendChild(smoke);
      }
    }, 1300);

    // Phase 4: Debris + dark chunks (after 1800ms)
    var debrisTimer = setTimeout(function() {
      var expEl = c.querySelector('.ef-explosion');
      if (expEl) expEl.style.display = 'none';

      for (var i = 0; i < 16; i++) {
        var d = document.createElement('div');
        d.className = 'ef-debris' + (i < 4 ? ' ef-debris-dark' : ' ' + (isNull ? 'null' : 'error'));
        var angle = i * 22.5 + 'deg';
        var drift = (i % 4) * 15 + 'px';
        d.style.setProperty('--a', angle);
        d.style.setProperty('--d', drift);
        if (i % 2 === 0) { d.style.borderRadius = '4px'; d.style.width = '14px'; d.style.height = '14px'; }
        if (i % 3 === 0) { d.style.width = '10px'; d.style.height = '18px'; }
        c.appendChild(d);
      }
    }, 1800);

    // Phase 5: Message overlay (after 2500ms)
    var overlayTimer = setTimeout(function() {
      var allDebris = c.querySelectorAll('.ef-debris, .ef-smoke');
      for (var i = 0; i < allDebris.length; i++) allDebris[i].remove();
      var existingExp = c.querySelector('.ef-explosion');
      if (existingExp) existingExp.remove();
      c.classList.remove('ef-shake');

      var overlay = createEl('div', 'ef-overlay ' + (isNull ? 'null' : 'error'));
      var content = createEl('div', 'ef-overlay-content');
      var icon = createEl('div', 'ef-icon');
      if (isNull) {
        var ns = createEl('span', 'ef-null-sym');
        ns.textContent = '\u2205';
        icon.appendChild(ns);
      } else {
        var es = createEl('span', 'ef-err-sym');
        es.textContent = '\u26A0';
        icon.appendChild(es);
      }
      content.appendChild(icon);
      var titleEl = createEl('div', 'ef-title');
      titleEl.textContent = title;
      content.appendChild(titleEl);
      var msgEl = createEl('div', 'ef-message');
      msgEl.textContent = message;
      content.appendChild(msgEl);
      var subEl = createEl('div', 'ef-sub');
      subEl.textContent = 'THE DATA IS CORRUPTED';
      content.appendChild(subEl);
      overlay.appendChild(content);
      c.appendChild(overlay);
    }, 2500);

    efTimer = setTimeout(function() {
      c.remove();
      efTimer = null;
    }, 6000);
  }
})();
