const requests = [];
const subscriptions = {};
let panelPort = null;
let schemaCache = null;
let devtoolsConfig = null;

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types { ...FullType }
      directives {
        name description locations args { ...InputValue }
      }
    }
  }
  fragment FullType on __Type {
    kind name description
    fields(includeDeprecated: true) {
      name description args { ...InputValue }
      type { ...TypeRef }
      isDeprecated deprecationReason
    }
    inputFields { ...InputValue }
    interfaces { ...TypeRef }
    enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason }
    possibleTypes { ...TypeRef }
  }
  fragment InputValue on __InputValue {
    name description type { ...TypeRef } defaultValue
  }
  fragment TypeRef on __Type {
    kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
  }
`;

async function downloadSchema(msg, port) {
  const endpoint = msg.endpoint || msg.payload?.endpoint || '';
  const headers = msg.headers || msg.payload?.headers || {};
  if (!endpoint) {
    port.postMessage({ type: 'schema-download-result', success: false, error: 'No endpoint configured' });
    return;
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({ query: INTROSPECTION_QUERY }),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    if (!res.ok || (data && data.errors)) {
      port.postMessage({ type: 'schema-download-result', success: false, error: (data?.errors?.[0]?.message || 'HTTP ' + res.status) });
      return;
    }
    schemaCache = data.data;
    port.postMessage({ type: 'schema', payload: data.data });
    port.postMessage({ type: 'schema-download-result', success: true, format: msg.format || 'json', data: data.data, raw: text });
  } catch (err) {
    port.postMessage({ type: 'schema-download-result', success: false, error: String(err) });
  }
}

function sendToPanel(msg) {
	if (!panelPort) return;
	try {
		panelPort.postMessage(msg);
	} catch {
		panelPort = null;
	}
}

console.log('[GraphQL DevTools] Background service worker started');

chrome.runtime.onMessage.addListener((msg, sender) => {
	console.log('[GraphQL DevTools] BG rx:', msg.type, sender.tab?.id);

	if (msg.type === 'graphql-request') {
		const entry = {
			...msg.payload,
			id: crypto.randomUUID(),
			tabId: sender.tab?.id,
			timestamp: Date.now(),
		};
		requests.push(entry);
		if (requests.length > 500) requests.splice(0, requests.length - 500);
		chrome.storage.local.set({ requests: requests.slice(-100) });
		sendToPanel({ type: 'new-request', entry });
	}

	if (msg.type === 'graphql-schema') {
		schemaCache = msg.payload;
		chrome.storage.local.set({ schema: schemaCache });
		sendToPanel({ type: 'schema', payload: schemaCache });
	}

	if (msg.type === 'devtools-config') {
		sendToPanel({ type: 'devtools-config', payload: msg.payload });
	}

	if (msg.type === 'graphql-subscription') {
		const payload = msg.payload;
		if (payload.type === 'open') {
			subscriptions[payload.subId] = {
				subId: payload.subId,
				url: payload.url,
				startTime: payload.timestamp,
				events: [],
				status: 'open',
			};
		} else if (payload.type === 'close') {
			if (subscriptions[payload.subId]) {
				subscriptions[payload.subId].status = 'closed';
				subscriptions[payload.subId].endTime = payload.timestamp;
			}
		} else if (payload.type === 'error') {
			if (subscriptions[payload.subId]) {
				subscriptions[payload.subId].status = 'error';
			}
		} else if (payload.type === 'next') {
			if (subscriptions[payload.subId]) {
				subscriptions[payload.subId].events.push({
					type: 'next',
					data: payload.payload,
					timestamp: payload.timestamp,
				});
			}
		} else if (payload.type === 'complete') {
			if (subscriptions[payload.subId]) {
				subscriptions[payload.subId].status = 'completed';
				subscriptions[payload.subId].endTime = payload.timestamp;
			}
		}
		sendToPanel({ type: 'subscription-event', payload: payload });
	}
});

chrome.runtime.onConnect.addListener((port) => {
	if (port.name === 'graphql-devtools') {
		panelPort = port;

		// send initial state
		port.postMessage({ type: 'all-requests', requests });
		port.postMessage({ type: 'all-subscriptions', subscriptions: Object.values(subscriptions) });
		if (schemaCache) {
			port.postMessage({ type: 'schema', payload: schemaCache });
		}

		// handle messages from panel (e.g. get-schema, download-schema, etc.)
		port.onMessage.addListener((msg) => {
			if (msg.type === 'get-schema') {
				port.postMessage({ type: 'schema', payload: schemaCache });
			}
			if (msg.type === 'download-schema') {
				downloadSchema(msg, port);
			}
		});

		port.onDisconnect.addListener(() => {
			panelPort = null;
		});
	}
});
