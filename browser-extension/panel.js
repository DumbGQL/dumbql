let requests = [];
let subscriptions = [];
let selectedId = null;
let selectedSubId = null;
let port = null;
let currentTab = 'Overview';
let navMode = 'requests'; // 'requests' or 'subscriptions'
let searchFilter = '';
let schemaData = null;
let selectedType = null;

const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const countEl = document.getElementById('count');
const clearBtn = document.getElementById('clearBtn');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const toastEl = document.getElementById('toast');

function escapeHtml(s) {
	return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tryJson(s) {
	try { return JSON.parse(s); } catch { return null; }
}

function round(n, d) { return Number(n).toFixed(d ?? 1); }

function toast(msg) {
	toastEl.textContent = msg;
	toastEl.classList.add('show');
	clearTimeout(toastEl._t);
	toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

function getBody(req) {
	if (!req.body) return null;
	try { return JSON.parse(typeof req.body === 'string' ? req.body : req.body); } catch { return null; }
}

function getQueryStr(req) { const b = getBody(req); return b?.query || ''; }

function getVars(req) { const b = getBody(req); return b?.variables || null; }

function getOpName(req) {
	const q = getQueryStr(req);
	const m = q.match(/(?:query|mutation|subscription)\s+(\w+)/i);
	return m ? m[1] : '(anonymous)';
}

function getOpType(req) {
	const q = getQueryStr(req).trimStart();
	if (q.startsWith('mutation')) return 'mutate';
	if (q.startsWith('subscription')) return 'subscribe';
	return 'query';
}

function getStatusCode(req) {
	const s = parseInt(req.status);
	return isNaN(s) ? 0 : s;
}

function isOk(req) { const s = getStatusCode(req); return s >= 200 && s < 300; }

function jsonColor(s) {
	if (!s) return '';
	return escapeHtml(s)
		.replace(/"([^"\\]*(\\.[^"\\]*)*)":/g, '<span class="jkey">"$1"</span>:')
		.replace(/: "([^"]*)"/g, ': <span class="jstr">"$1"</span>')
		.replace(/: (-?\d+\.?\d*)/g, ': <span class="jnum">$1</span>')
		.replace(/: (true|false)/g, ': <span class="jbool">$1</span>')
		.replace(/: (null)/g, ': <span class="jnull">$1</span>');
}

// ── query tree ───────────────────────────────────────
function parseQueryTree(queryStr) {
	if (!queryStr) return [];
	const result = [];
	let d = 0;
	let buf = '';
	for (const c of queryStr) {
		if (c === '\n') { if (buf.trim()) result.push({ d, buf: buf.trim() }); buf = ''; continue; }
		if (c === '{') { if (buf.trim()) result.push({ d, buf: buf.trim() }); buf = ''; d++; }
		else if (c === '}') { if (buf.trim()) result.push({ d, buf: buf.trim() }); buf = ''; d = Math.max(0, d - 1); }
		else buf += c;
	}
	if (buf.trim()) result.push({ d, buf: buf.trim() });
	return result;
}

function renderQueryTree(queryStr) {
	const tree = parseQueryTree(queryStr);
	return tree.map(n =>
		`<div class="line"><span class="indent" style="padding-left:${n.d * 16}px">${escapeHtml(n.buf)}</span></div>`
	).join('');
}

// ── normalization ────────────────────────────────────
function normalizeData(data, parentPath) {
	if (!data || typeof data !== 'object') return [];
	const entries = [];
	const typename = data.__typename || null;
	const id = data.id || data._id || null;
	if (typename && id) {
		entries.push({ type: typename, id: String(id), path: parentPath || '.' });
	}
	for (const [k, v] of Object.entries(data)) {
		if (k === '__typename') continue;
		if (Array.isArray(v)) {
			v.forEach((item, i) => entries.push(...normalizeData(item, parentPath ? `${parentPath}.${k}[${i}]` : `${k}[${i}]`)));
		} else if (v && typeof v === 'object') {
			entries.push(...normalizeData(v, parentPath ? `${parentPath}.${k}` : k));
		}
	}
	return entries;
}

function groupNorm(entries) {
	const groups = {};
	for (const e of entries) {
		if (!groups[e.type]) groups[e.type] = [];
		groups[e.type].push(e);
	}
	return groups;
}

function renderNormView(data) {
	if (!data) return '<div class="empty">No response data</div>';
	const entries = normalizeData(data, '');
	if (entries.length === 0) return '<div class="empty">No normalized entities found (need __typename + id)</div>';
	const groups = groupNorm(entries);
	let html = '';
	for (const [type, items] of Object.entries(groups)) {
		html += `<h4>${escapeHtml(type)} (${items.length})</h4>`;
		html += `<table class="norm-table"><tr><th>ID</th><th>Path</th></tr>`;
		for (const item of items) {
			html += `<tr><td class="id">${escapeHtml(item.id)}</td><td style="font-size:.6rem;color:var(--text-dim)">${escapeHtml(item.path)}</td></tr>`;
		}
		html += `</table>`;
	}
	return html;
}

// ── field projection ─────────────────────────────────
function extractFields(obj, prefix) {
	if (!obj || typeof obj !== 'object') return [];
	const fields = [];
	for (const [k, v] of Object.entries(obj)) {
		if (k === '__typename') continue;
		const path = prefix ? `${prefix}.${k}` : k;
		fields.push(path);
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			fields.push(...extractFields(v, path));
		} else if (Array.isArray(v) && v[0] && typeof v[0] === 'object') {
			fields.push(...extractFields(v[0], `${path}[]`));
		}
	}
	return fields;
}

function parseQueryFields(queryStr) {
	if (!queryStr) return [];
	const fields = [];
	const lines = queryStr.split('\n');
	const path = [];
	for (const line of lines) {
		const trimmed = line.replace(/#.*$/, '').trim();
		if (!trimmed) continue;
		let inBrackets = 0;
		for (const c of trimmed) {
			if (c === '{') { inBrackets++; }
			else if (c === '}') { inBrackets--; if (path.length) path.pop(); }
		}
		const match = trimmed.match(/^\s*(\w+)/);
		if (match && inBrackets >= 0 && !['query', 'mutation', 'fragment', 'on', 'subscription'].includes(match[1])) {
			const fullPath = path.length ? [...path, match[1]].join('.') : match[1];
			fields.push(fullPath);
			if (trimmed.includes('{') && !match[1].startsWith('__')) path.push(match[1]);
		}
	}
	return fields;
}

function computeProjection(queryStr, responseObj) {
	if (!queryStr || !responseObj) return [];
	const reqFields = parseQueryFields(queryStr);
	const respFields = extractFields(responseObj, '');
	const result = [];
	const respSet = new Set(respFields);
	for (const f of reqFields) {
		if (respSet.has(f)) result.push({ field: f, status: 'matched' });
		else result.push({ field: f, status: 'missing' });
	}
	const reqSet = new Set(reqFields);
	for (const f of respFields) {
		if (!reqSet.has(f)) result.push({ field: f, status: 'extra' });
	}
	return result;
}

function renderProjectionView(req) {
	const queryStr = getQueryStr(req);
	const resp = tryJson(req.response);
	const data = resp?.data || null;
	if (!queryStr || !data) return '<div class="empty">No query or response data</div>';
	const proj = computeProjection(queryStr, data);
	if (proj.length === 0) return '<div class="empty">Could not parse fields</div>';
	let matched = 0, missing = 0, extra = 0;
	let html = '<div class="proj-legend">';
	html += `<span><span class="proj-status matched">✓</span> Matched</span>`;
	html += `<span><span class="proj-status missing">✗</span> Missing</span>`;
	html += `<span><span class="proj-status extra">+</span> Extra</span>`;
	html += `</div>`;
	for (const p of proj) {
		if (p.status === 'matched') matched++;
		else if (p.status === 'missing') missing++;
		else extra++;
		const symbol = p.status === 'matched' ? '✓' : p.status === 'missing' ? '✗' : '+';
		html += `<div class="proj-row"><span class="proj-status ${p.status}">${symbol}</span><span class="proj-path"><span class="highlight-${p.status}">${escapeHtml(p.field)}</span></span></div>`;
	}
	html += `<div style="margin-top:.5rem;font-size:.65rem;color:var(--text-dim)">Matched: ${matched} · Missing: ${missing} · Extra: ${extra}</div>`;
	return html;
}

// ── timing ───────────────────────────────────────────
function renderTimingChart(req) {
	const total = req.duration || 1;
	return `<div class="timing-chart">
		<div class="timing-row"><span class="tl">Total</span><div class="tr"><div class="bar net" style="width:100%"></div></div><span class="tv">${round(total)}ms</span></div>
		<div class="timing-row"><span class="tl">Network</span><div class="tr"><div class="bar net" style="width:${round(Math.min(100, total * 0.7 / total * 100))}%"></div></div><span class="tv">${round(total * 0.7)}ms</span></div>
		<div class="timing-row"><span class="tl">Parse</span><div class="tr"><div class="bar resp" style="width:${round(Math.min(100, total * 0.3 / total * 100))}%"></div></div><span class="tv">${round(total * 0.3)}ms</span></div>
	</div>`;
}

// ── overview ─────────────────────────────────────────
function renderOverviewView(req) {
	const opType = getOpType(req);
	const opName = getOpName(req);
	const resp = tryJson(req.response);
	const data = resp?.data || null;
	const err = resp?.errors || null;
	const ok = isOk(req);
	const entries = normalizeData(data, '');
	const groups = groupNorm(entries);
	let errMsg = '';
	if (err && err.length) {
		errMsg = err.map(e => e.message).join('; ');
	} else if (!ok && req.response && !err) {
		errMsg = `HTTP ${req.status}`;
	} else if (!ok) {
		errMsg = 'Network error';
	}

	let html = `<div class="meta">`;
	html += `<dt>Type</dt><dd><span class="badge ${opType}">${opType}</span></dd>`;
	html += `<dt>Name</dt><dd>${escapeHtml(opName)}</dd>`;
	html += `<dt>URL</dt><dd style="word-break:break-all">${escapeHtml(req.url || '-')}</dd>`;
	html += `<dt>Status</dt><dd style="color:${ok ? 'var(--green)' : 'var(--red)'}">${getStatusCode(req)}</dd>`;
	html += `<dt>Duration</dt><dd>${round(req.duration)}ms</dd>`;
	html += `<dt>Time</dt><dd>${new Date(req.timestamp || req.startTime).toLocaleTimeString()}</dd>`;
	if (errMsg) html += `<dt>Error</dt><dd style="color:var(--red)">${escapeHtml(errMsg)}</dd>`;
	html += `</div>`;

	if (data) {
		html += `<h3>Response Summary</h3>`;
		html += `<div class="meta">`;
		html += `<dt>Entity Types</dt><dd>${Object.keys(groups).length}</dd>`;
		html += `<dt>Total Entities</dt><dd>${entries.length}</dd>`;
		html += `<dt>Fields Returned</dt><dd>${extractFields(data, '').length}</dd>`;
		html += `</div>`;
	}

	html += `<h3>Timing</h3>` + renderTimingChart(req);

	if (errMsg) {
		html += `<h3 style="color:var(--red)">Error</h3>`;
		html += `<pre style="color:var(--red);border-color:var(--red)">${escapeHtml(errMsg)}</pre>`;
	}

	return html;
}

function renderResponseView(req) {
	const resp = req.response;
	if (!resp) return '<div class="empty">No response</div>';
	let formatted = resp;
	try { formatted = JSON.stringify(JSON.parse(resp), null, 2); } catch { }
	return `<pre>${jsonColor(formatted)}</pre>`;
}

function renderQueryView(req) {
	const q = getQueryStr(req);
	if (!q) return '<div class="empty">No query</div>';
	return `<div class="query-tree">${renderQueryTree(q)}</div>
		<button class="copy-btn" data-copy="true">Copy</button>
		<pre style="margin-top:.5rem">${escapeHtml(q)}</pre>`;
}

function renderVarsView(req) {
	const v = getVars(req);
	if (!v) return '<div class="empty">No variables</div>';
	return `<pre>${jsonColor(JSON.stringify(v, null, 2))}</pre>`;
}

// ── cache viewer ─────────────────────────────────────
function renderCacheView(data) {
	if (!data) return '<div class="empty">No response data to infer cache from</div>';
	const entries = normalizeData(data, '');
	if (entries.length === 0) return '<div class="empty">No entities found (need __typename + id)</div>';
	const groups = groupNorm(entries);
	let html = '';
	for (const [type, items] of Object.entries(groups)) {
		html += `<h4>${escapeHtml(type)} (${items.length})</h4>`;
		for (const item of items) {
			html += `<div class="cache-entry"><span class="cache-type">${escapeHtml(type)}</span>:<span class="cache-key">${escapeHtml(item.id)}</span> <span style="color:var(--text-dim)">${escapeHtml(item.path)}</span></div>`;
		}
	}
	return html;
}

// ── schema browser ───────────────────────────────────
var schemaEndpoint = '';

function getBaseTypeName(typeRef) {
	if (!typeRef) return null;
	let current = typeRef;
	while (current.ofType) {
		current = current.ofType;
	}
	return current.name;
}

function isPrimitiveType(name) {
	return ['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime', 'JSON', 'Upload', 'UUID', 'Long', 'BigInt'].includes(name);
}

function getSchemaConnections(typeName) {
	if (!schemaData) return { incoming: [], outgoing: [] };
	const types = schemaData.__schema?.types || schemaData.types || [];
	const currentType = types.find(t => t.name === typeName);
	if (!currentType) return { incoming: [], outgoing: [] };

	const incoming = [];
	const outgoing = new Set();

	const fields = currentType.fields || currentType.inputFields || [];
	for (const f of fields) {
		const baseType = getBaseTypeName(f.type);
		if (baseType && !isPrimitiveType(baseType) && baseType !== typeName) {
			outgoing.add(baseType);
		}
	}

	for (const t of types) {
		if (t.name.startsWith('__') || t.name === typeName) continue;
		const tFields = t.fields || t.inputFields || [];
		for (const f of tFields) {
			if (getBaseTypeName(f.type) === typeName) {
				incoming.push(t.name);
				break;
			}
		}
	}

	return {
		incoming: Array.from(new Set(incoming)),
		outgoing: Array.from(outgoing)
	};
}

function renderSchemaGraphSVG(typeName) {
	const connections = getSchemaConnections(typeName);
	const incoming = connections.incoming;
	const outgoing = connections.outgoing;

	const boxWidth = 140;
	const boxHeight = 30;
	const colGap = 160;
	const rowGap = 40;

	const maxRows = Math.max(1, incoming.length, outgoing.length);
	const height = Math.max(200, maxRows * rowGap + 40);
	const width = colGap * 2 + boxWidth + 60;

	const centerY = height / 2;
	const midX = width / 2 - boxWidth / 2;

	let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:var(--bg-elev);border:1px solid var(--border);border-radius:3px;margin-top:10px">`;
	
	svg += `<defs>
		<marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
			<path d="M 0 2 L 10 5 L 0 8 z" fill="var(--text-mid)" />
		</marker>
	</defs>`;

	const midY = centerY - boxHeight / 2;
	svg += `<g class="graph-node selected" style="cursor:default">
		<rect x="${midX}" y="${midY}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="var(--badge-query)" stroke="var(--blue)" stroke-width="2" />
		<text x="${midX + boxWidth / 2}" y="${midY + boxHeight / 2 + 4}" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">${escapeHtml(typeName)}</text>
	</g>`;

	const leftX = midX - colGap;
	const leftStart = centerY - (incoming.length * rowGap) / 2 + rowGap / 2 - boxHeight / 2;
	incoming.forEach((name, i) => {
		const y = leftStart + i * rowGap;
		svg += `<g class="graph-node" data-node-click="${escapeHtml(name)}" style="cursor:pointer" title="Go to ${escapeHtml(name)}">
			<rect x="${leftX}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="var(--bg-elev2)" stroke="var(--border-light)" />
			<text x="${leftX + boxWidth / 2}" y="${y + boxHeight / 2 + 4}" fill="var(--text)" font-size="10" text-anchor="middle">${escapeHtml(name)}</text>
		</g>`;

		const startX = leftX + boxWidth;
		const startY = y + boxHeight / 2;
		const endX = midX;
		const endY = midY + boxHeight / 2;
		
		const cp1X = startX + colGap / 3;
		const cp2X = endX - colGap / 3;
		svg += `<path d="M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}" fill="none" stroke="var(--border-light)" stroke-width="1.5" marker-end="url(#arrow)" />`;
	});

	const rightX = midX + colGap;
	const rightStart = centerY - (outgoing.length * rowGap) / 2 + rowGap / 2 - boxHeight / 2;
	outgoing.forEach((name, i) => {
		const y = rightStart + i * rowGap;
		svg += `<g class="graph-node" data-node-click="${escapeHtml(name)}" style="cursor:pointer" title="Go to ${escapeHtml(name)}">
			<rect x="${rightX}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="var(--bg-elev2)" stroke="var(--border-light)" />
			<text x="${rightX + boxWidth / 2}" y="${y + boxHeight / 2 + 4}" fill="var(--text)" font-size="10" text-anchor="middle">${escapeHtml(name)}</text>
		</g>`;

		const startX = midX + boxWidth;
		const startY = midY + boxHeight / 2;
		const endX = rightX;
		const endY = y + boxHeight / 2;

		const cp1X = startX + colGap / 3;
		const cp2X = endX - colGap / 3;
		svg += `<path d="M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}" fill="none" stroke="var(--border-light)" stroke-width="1.5" marker-end="url(#arrow)" />`;
	});

	svg += `</svg>`;
	return svg;
}

function renderSchemaView(schema) {
	var hasSchema = !!schema;
	var html = '<div style="display:flex;gap:.4rem;margin-bottom:.5rem;flex-wrap:wrap;align-items:center">';
	html += '<input id="schemaEndpointInput" type="text" placeholder="GraphQL endpoint URL" value="' + escapeHtml(schemaEndpoint) + '" style="flex:1;min-width:120px;background:var(--bg-main);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:.2rem .4rem;font-size:.7rem">';
	html += '<button class="dl-btn" data-dl-schema="true">Download</button>';
	if (hasSchema) {
		html += '<input id="schemaFilenameInput" type="text" value="graphql-schema.json" style="width:160px;background:var(--bg-main);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:.2rem .4rem;font-size:.7rem">';
		html += '<button class="dl-btn" data-save-schema="true">Save</button>';
	}
	html += '</div>';

	if (!hasSchema) {
		return html + '<div class="empty">Enter your GraphQL endpoint URL above and click Download, or send an introspection query from the page.</div>';
	}
	var types = (schema.__schema?.types || schema.types || []).filter(function (t) { return !t.name.startsWith('__'); });
	html += '<div class="schema-list">';
	for (const t of types) {
		const kind = t.kind?.toLowerCase() || 'object';
		html += `<div class="type-item" data-schema-type="${escapeHtml(t.name)}">
			<span class="type-kind ${kind}">${kind}</span>
			<span>${escapeHtml(t.name)}</span>
		</div>`;
	}
	html += '</div>';
	return html;
}

function renderSchemaDetail(typeName) {
	if (!schemaData) return '';
	const types = schemaData.__schema?.types || schemaData.types || [];
	const t = types.find(t => t.name === typeName);
	if (!t) return '<div class="empty">Type not found</div>';

	let html = `<button class="dl-btn" data-schema-back="true" style="margin-bottom:.5rem">← Back to Schema</button>`;
	html += `<div class="schema-detail"><h3>${escapeHtml(t.name)}</h3><div class="meta"><dt>Kind</dt><dd>${t.kind}</dd></div>`;

	if (t.description) {
		html += `<pre style="margin-top:.3rem">${escapeHtml(t.description)}</pre>`;
	}

	if (t.fields) {
		html += `<h4>Fields</h4><table class="norm-table"><tr><th>Name</th><th>Type</th><th>Args</th></tr>`;
		for (const f of t.fields) {
			const ft = formatFieldType(f.type);
			const args = f.args?.map(a => `${a.name}: ${formatFieldType(a.type)}`).join(', ') || '';
			html += `<tr><td>${escapeHtml(f.name)}</td><td class="id">${escapeHtml(ft)}</td><td style="font-size:.6rem">${escapeHtml(args)}</td></tr>`;
		}
		html += `</table>`;
	}

	if (t.inputFields) {
		html += `<h4>Input Fields</h4><table class="norm-table"><tr><th>Name</th><th>Type</th></tr>`;
		for (const f of t.inputFields) {
			html += `<tr><td>${escapeHtml(f.name)}</td><td class="id">${escapeHtml(formatFieldType(f.type))}</td></tr>`;
		}
		html += `</table>`;
	}

	if (t.enumValues) {
		html += `<h4>Values</h4><div style="display:flex;flex-wrap:wrap;gap:.3rem">`;
		for (const v of t.enumValues) {
			html += `<span class="badge query">${escapeHtml(v.name)}</span>`;
		}
		html += `</div>`;
	}

	if (t.possibleTypes) {
		html += `<h4>Possible Types</h4>`;
		for (const p of t.possibleTypes) {
			html += `<div class="cache-entry">${escapeHtml(p.name)}</div>`;
		}
	}

	if (t.interfaces) {
		html += `<h4>Implements</h4>`;
		for (const i of t.interfaces) {
			html += `<div class="cache-entry">${escapeHtml(i.name)}</div>`;
		}
	}

	html += `<h3>Schema Graph</h3>` + renderSchemaGraphSVG(t.name);
	html += '</div>';
	return html;
}

function formatFieldType(typeRef) {
	if (!typeRef) return 'unknown';
	let current = typeRef;
	let nullable = true;
	let list = false;
	while (current.ofType) {
		if (current.kind === 'NON_NULL') nullable = false;
		if (current.kind === 'LIST') list = true;
		current = current.ofType;
	}
	let name = current.name || 'unknown';
	if (list) name = `${name}[]`;
	if (nullable) name = `${name}?`;
	return name;
}

// ── diff / compare ───────────────────────────────────
function renderCompareView(req1, req2) {
	if (!req1 || !req2) return '<div class="empty">Select two requests to compare</div>';
	const resp1 = tryJson(req1.response);
	const resp2 = tryJson(req2.response);
	return `<div class="compare-pane">
		<div>
			<h4>Request 1 (${getOpName(req1)})</h4>
			<pre>${jsonColor(JSON.stringify(resp1, null, 2))}</pre>
		</div>
		<div>
			<h4>Request 2 (${getOpName(req2)})</h4>
			<pre>${jsonColor(JSON.stringify(resp2, null, 2))}</pre>
		</div>
	</div>`;
}

// ── subscriptions view ───────────────────────────────
function renderSubscriptionsList() {
	if (subscriptions.length === 0) return '<div class="empty">No subscriptions recorded. Open a GraphQL subscription from the page.</div>';

	let html = '<div class="sub-list">';
	for (const sub of subscriptions) {
		const statusColor = sub.status === 'open' ? 'var(--green)' : sub.status === 'error' ? 'var(--red)' : 'var(--text-dim)';
		const eventCount = (sub.events || []).filter(e => e.type === 'next').length;
		const duration = sub.endTime ? round(sub.endTime - sub.startTime) + 'ms' : 'active';
		html += `<div class="sub-entry ${sub.subId === selectedSubId ? 'active' : ''}" data-sub-id="${escapeHtml(sub.subId)}">
			<span class="sub-status-dot" style="background:${statusColor}"></span>
			<span class="sub-url">${escapeHtml(sub.url || '-')}</span>
			<span class="sub-events">${eventCount} events</span>
			<span class="sub-dur">${duration}</span>
		</div>`;
	}
	html += '</div>';
	return html;
}

function renderSubscriptionDetail(subId) {
	const sub = subscriptions.find(s => s.subId === subId);
	if (!sub) return '<div class="empty">Select a subscription to inspect</div>';

	const statusColor = sub.status === 'open' ? 'var(--green)' : sub.status === 'error' ? 'var(--red)' : 'var(--text-dim)';
	const duration = sub.endTime ? round(sub.endTime - sub.startTime) + 'ms' : 'active...';

	let html = `<div class="meta">`;
	html += `<dt>Status</dt><dd style="color:${statusColor}">${escapeHtml(sub.status)}</dd>`;
	html += `<dt>URL</dt><dd>${escapeHtml(sub.url || '-')}</dd>`;
	html += `<dt>Started</dt><dd>${new Date(sub.startTime).toLocaleTimeString()}</dd>`;
	if (sub.endTime) html += `<dt>Ended</dt><dd>${new Date(sub.endTime).toLocaleTimeString()}</dd>`;
	html += `<dt>Duration</dt><dd>${duration}</dd>`;
	html += `<dt>Events</dt><dd>${(sub.events || []).length}</dd>`;
	html += `</div>`;

	const events = sub.events || [];
	if (events.length > 0) {
		html += `<h3>Events (${events.length})</h3>`;
		for (const ev of events) {
			const time = new Date(ev.timestamp).toLocaleTimeString();
			if (ev.type === 'next') {
				html += `<div class="sub-event sub-event-next">
					<span class="sub-event-time">${escapeHtml(time)}</span>
					<span class="sub-event-badge sub-event-badge-next">DATA</span>
					<pre class="sub-event-data">${jsonColor(JSON.stringify(ev.data, null, 2))}</pre>
				</div>`;
			} else {
				html += `<div class="sub-event sub-event-other">
					<span class="sub-event-time">${escapeHtml(time)}</span>
					<span class="sub-event-badge">${escapeHtml(ev.type.toUpperCase())}</span>
				</div>`;
			}
		}
	}

	return html;
}

// ── request detail ───────────────────────────────────
function renderRequestDetailTabs(tab) {
	const tabs = ['Overview', 'Query', 'Variables', 'Response', 'Projection', 'Cache', 'Schema'];
	let content = '';
	switch (tab || 'Overview') {
		case 'Overview': content = renderOverviewView(reqForDetail()); break;
		case 'Query': content = renderQueryView(reqForDetail()); break;
		case 'Variables': content = renderVarsView(reqForDetail()); break;
		case 'Response': content = renderResponseView(reqForDetail()); break;
		case 'Projection': content = renderProjectionView(reqForDetail()); break;
		case 'Cache': content = renderCacheView(tryJson(reqForDetail().response)?.data || null); break;
		case 'Schema': content = selectedType ? renderSchemaDetail(selectedType) : renderSchemaView(schemaData); break;
	}

	let tabHtml = '<div class="tab-bar">';
	for (const t of tabs) {
		const activeClass = t === tab ? ' active' : '';
		tabHtml += `<button class="tab-btn${activeClass}" data-tab="${t}">${t}</button>`;
	}
	tabHtml += '</div>';

	return tabHtml + `<div class="tab-content">${content}</div>`;
}

// ── render detail ────────────────────────────────────
function reqForDetail() {
	return requests.find(r => r.id === selectedId);
}

function renderDetail() {
	if (navMode === 'subscriptions') {
		if (selectedSubId) {
			return `<div class="tab-content">${renderSubscriptionDetail(selectedSubId)}</div>`;
		}
		return '<div class="tab-content"><div class="empty">Select a subscription to inspect</div></div>';
	}

	const req = reqForDetail();
	if (!req) {
		return '<div class="tab-content"><div class="empty">Select a request to inspect</div></div>';
	}

	return renderRequestDetailTabs(currentTab);
}

// ── list ─────────────────────────────────────────────
function onSearch() {
	searchFilter = searchInput.value.toLowerCase();
	renderList();
}

function renderList() {
	listEl.innerHTML = '';
	if (navMode === 'requests') {
		let filtered = requests;
		if (searchFilter) {
			filtered = requests.filter(r => {
				const name = getOpName(r).toLowerCase();
				const q = getQueryStr(r).toLowerCase();
				return name.includes(searchFilter) || q.includes(searchFilter);
			});
		}

		const maxDur = filtered.reduce((m, r) => Math.max(m, r.duration || 1), 1);
		for (const req of filtered) {
			const opType = getOpType(req);
			const opName = getOpName(req);
			const ok = isOk(req);
			const pct = req.duration ? Math.max(2, (req.duration / maxDur) * 100) : 0;

			const div = document.createElement('div');
			div.className = `entry${req.id === selectedId ? ' active' : ''}`;
			setSafeHtml(div, `
				<span class="status-dot ${ok ? 'ok' : 'err'}"></span>
				<span class="badge ${opType}">${opType}</span>
				<span class="op-name">${escapeHtml(opName)}</span>
				<div class="timing-bar-wrap"><div class="timing-bar" style="width:${round(pct)}%;background:${ok ? 'var(--blue)' : 'var(--red)'}"></div></div>
				<span class="dur">${round(req.duration)}ms</span>
			`);
			div.addEventListener('click', () => selectEntry(req.id));
			listEl.appendChild(div);
		}

		const reqCount = filtered.length;
		countEl.textContent = `${reqCount} requests`;
	} else {
		let filtered = subscriptions;
		if (searchFilter) {
			filtered = subscriptions.filter(s => {
				return (s.url || '').toLowerCase().includes(searchFilter);
			});
		}

		for (const sub of filtered) {
			const statusColor = sub.status === 'open' ? 'var(--green)' : sub.status === 'error' ? 'var(--red)' : 'var(--text-dim)';
			const eventCount = (sub.events || []).filter(e => e.type === 'next').length;
			const duration = sub.endTime ? round(sub.endTime - sub.startTime) + 'ms' : 'active';

			const div = document.createElement('div');
			div.className = `entry${sub.subId === selectedSubId ? ' active' : ''}`;
			setSafeHtml(div, `
				<span class="status-dot" style="background:${statusColor}"></span>
				<span class="badge query">sub</span>
				<span class="op-name">${escapeHtml(sub.url || '-')}</span>
				<span class="dur" style="width:auto">${eventCount} evs</span>
			`);
			div.addEventListener('click', () => selectSubscription(sub.subId));
			listEl.appendChild(div);
		}

		const subCount = filtered.length;
		countEl.textContent = `${subCount} subs`;
	}
}

function selectEntry(id) {
	selectedId = id;
	selectedSubId = null;
	navMode = 'requests';
	selectedType = null;
	renderList();
	setSafeHtml(detailEl, renderDetail());
}

function selectNav(nav) {
	navMode = nav;
	selectedSubId = null;
	selectedType = null;
	const navBtns = document.querySelectorAll('.nav-bar .nav-btn');
	for (const btn of navBtns) {
		if (btn.dataset.nav === nav) {
			btn.classList.add('active');
		} else {
			btn.classList.remove('active');
		}
	}
	renderList();
	setSafeHtml(detailEl, renderDetail());
}

function selectTab(tab) {
	currentTab = tab;
	selectedType = null;
	setSafeHtml(detailEl, renderDetail());
}

function selectSchemaType(name) {
	selectedType = name;
	currentTab = 'Schema';
	setSafeHtml(detailEl, renderDetail());
}

function selectSubscription(subId) {
	selectedSubId = subId;
	navMode = 'subscriptions';
	setSafeHtml(detailEl, renderDetail());
}

function copyText(btn) {
	const pre = btn.parentElement.querySelector('pre');
	if (pre) {
		navigator.clipboard.writeText(pre.textContent).then(() => toast('Copied!')).catch(() => toast('Failed to copy'));
	}
}

clearBtn.addEventListener('click', () => {
	requests = [];
	subscriptions = [];
	selectedId = null;
	selectedSubId = null;
	selectedType = null;
	navMode = 'requests';
	renderList();
	setSafeHtml(detailEl, renderDetail());
	toast('Cleared');
});

exportBtn.addEventListener('click', () => {
	const data = { requests, subscriptions };
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `graphql-data-${Date.now()}.json`;
	a.click();
	URL.revokeObjectURL(url);
	toast('Exported');
});

importBtn.addEventListener('click', () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.onchange = () => {
		const file = input.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(reader.result);
				if (Array.isArray(data)) {
					requests.push(...data);
				} else if (data.requests) {
					requests.push(...data.requests);
					if (data.subscriptions) subscriptions.push(...data.subscriptions);
				}
				if (requests.length > 500) requests.splice(0, requests.length - 500);
				renderList();
				setSafeHtml(detailEl, renderDetail());
				toast('Imported');
			} catch {
				toast('Invalid JSON');
			}
		};
		reader.readAsText(file);
	};
	input.click();
});

// ── event delegation (no inline handlers — blocked by MV3 CSP) ──
document.addEventListener('click', function (e) {
	const target = e.target;

	const navBtn = target.closest('.nav-btn');
	if (navBtn && navBtn.dataset.nav) {
		selectNav(navBtn.dataset.nav);
		return;
	}

	const backBtn = target.closest('[data-schema-back]');
	if (backBtn) {
		selectedType = null;
		setSafeHtml(detailEl, renderDetail());
		return;
	}

	const nodeClick = target.closest('[data-node-click]');
	if (nodeClick) {
		selectSchemaType(nodeClick.dataset.nodeClick);
		return;
	}

	const tabBtn = target.closest('.tab-btn');
	if (tabBtn && tabBtn.dataset.tab) {
		selectTab(tabBtn.dataset.tab);
		return;
	}

	if (target.closest('[data-copy]')) {
		copyText(target.closest('[data-copy]'));
		return;
	}

	const typeItem = target.closest('[data-schema-type]');
	if (typeItem) {
		selectSchemaType(typeItem.dataset.schemaType);
		return;
	}

	const subEntry = target.closest('[data-sub-id]');
	if (subEntry) {
		selectSubscription(subEntry.dataset.subId);
		return;
	}

	// download schema from endpoint
	const dlBtn = target.closest('[data-dl-schema]');
	if (dlBtn) {
		var endpointInput = document.getElementById('schemaEndpointInput');
		var ep = endpointInput ? endpointInput.value.trim() : '';
		if (!ep) { toast('Enter an endpoint URL'); return; }
		schemaEndpoint = ep;
		dlBtn.textContent = 'Downloading...';
		dlBtn.disabled = true;
		port.postMessage({ type: 'download-schema', endpoint: ep, format: 'json' });
		return;
	}

	// save schema as JSON file with custom name
	const saveBtn = target.closest('[data-save-schema]');
	if (saveBtn && schemaData) {
		var fnInput = document.getElementById('schemaFilenameInput');
		var filename = fnInput ? fnInput.value.trim() : 'graphql-schema.json';
		if (!filename) filename = 'graphql-schema.json';
		var blob = new Blob([JSON.stringify(schemaData, null, 2)], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		toast('Schema saved: ' + filename);
		return;
	}
});

searchInput.addEventListener('input', onSearch);

// ── connection ───────────────────────────────────────
port = chrome.runtime.connect({ name: 'graphql-devtools' });
port.onMessage.addListener((msg) => {
	if (msg.type === 'all-requests') {
		requests = msg.requests || [];
		renderList();
		setSafeHtml(detailEl, renderDetail());
	} else if (msg.type === 'all-subscriptions') {
		subscriptions = msg.subscriptions || [];
		renderList();
	} else if (msg.type === 'new-request') {
		requests.push(msg.entry);
		if (requests.length > 500) requests.splice(0, requests.length - 500);
		if (navMode === 'requests') {
			if (!selectedId) {
				selectEntry(msg.entry.id);
			} else {
				renderList();
			}
		} else {
			renderList();
		}
	} else if (msg.type === 'subscription-event') {
		const payload = msg.payload;
		const existing = subscriptions.find(s => s.subId === payload.subId);
		if (payload.type === 'open') {
			if (!existing) {
				subscriptions.push({
					subId: payload.subId,
					url: payload.url,
					startTime: payload.timestamp,
					events: [],
					status: 'open',
				});
			}
		} else if (existing) {
			if (payload.type === 'close') {
				existing.status = 'closed';
				existing.endTime = payload.timestamp;
			} else if (payload.type === 'error') {
				existing.status = 'error';
			} else if (payload.type === 'next') {
				existing.events.push({ type: 'next', data: payload.payload, timestamp: payload.timestamp });
			} else if (payload.type === 'complete') {
				existing.status = 'completed';
				existing.endTime = payload.timestamp;
			}
		}
		renderList();
		if (navMode === 'subscriptions') {
			setSafeHtml(detailEl, renderDetail());
		}
	} else if (msg.type === 'schema') {
		schemaData = msg.payload;
		if (navMode === 'requests' && currentTab === 'Schema') {
			setSafeHtml(detailEl, renderDetail());
		}
	} else if (msg.type === 'devtools-config') {
		var cfg = msg.payload || {};
		if (cfg.endpoint) schemaEndpoint = cfg.endpoint;
		if (cfg.schemaDownload && cfg.schemaDownload.endpoint) schemaEndpoint = cfg.schemaDownload.endpoint;
	} else if (msg.type === 'schema-download-result') {
		// re-enable download button
		var dlBtns = document.querySelectorAll('[data-dl-schema]');
		for (var i = 0; i < dlBtns.length; i++) {
			dlBtns[i].textContent = 'Download Schema';
			dlBtns[i].disabled = false;
		}
		if (msg.success) {
			toast('Schema downloaded');
		} else {
			toast('Error: ' + (msg.error || 'Unknown'));
		}
		if (navMode === 'requests' && currentTab === 'Schema') {
			setSafeHtml(detailEl, renderDetail());
		}
	}
});

port.postMessage({ type: 'get-schema' });

function setSafeHtml(element, htmlString) {
	element.textContent = '';
	var parser = new DOMParser();
	var doc = parser.parseFromString(htmlString, 'text/html');
	var body = doc.body;
	while (body.firstChild) {
		element.appendChild(body.firstChild);
	}
}
