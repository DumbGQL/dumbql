(function () {
  'use strict';

  var SOURCE = 'dumb-keystore-graphql-debug';
  var runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime
    : (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime
    : null;

  if (!runtime) {
    console.warn('[GraphQL DevTools] runtime not available');
    return;
  }

  var msgCount = 0;
  console.log('[GraphQL DevTools] ISOLATED world bridge active');

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    var msg = event.data;
    if (!msg || msg.source !== SOURCE) return;

    msgCount++;

    try {
      switch (msg.type) {
        case 'graphql-request':
          runtime.sendMessage({ type: 'graphql-request', payload: msg.payload });
          break;
        case 'graphql-schema':
          runtime.sendMessage({ type: 'graphql-schema', payload: msg.payload });
          break;
        case 'graphql-subscription':
          runtime.sendMessage({ type: 'graphql-subscription', payload: msg.payload });
          break;
        case 'all-requests':
          runtime.sendMessage({ type: 'all-requests', payload: msg.payload });
          break;
		case 'devtools-config':
          runtime.sendMessage({ type: 'devtools-config', payload: msg.payload });
          break;
        case 'devtools-ready':
          // ignore — Angular DevtoolsService handshake
          break;
      }
    } catch (e) {
      console.warn('[GraphQL DevTools] runtime.sendMessage error:', e);
    }
  });
})();
