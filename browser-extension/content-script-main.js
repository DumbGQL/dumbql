(function () {
  'use strict';

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
    // Messages from Angular already reach ISOLATED world directly.
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
})();
