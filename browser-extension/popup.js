var runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime
  : (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime
  : null;

var openBtn = document.getElementById('openDevtools');
var clearBtn = document.getElementById('clearPopup');
var totalEl = document.getElementById('totalCount');
var okEl = document.getElementById('okCount');
var errEl = document.getElementById('errCount');
var typeCountEl = document.getElementById('typeCount');
var avgDurEl = document.getElementById('avgDur');
var recentListEl = document.getElementById('recentList');
var bridgeStatusEl = document.getElementById('bridgeStatus');
var epicFetusToggle = document.getElementById('epicFetusToggle');

// ── Epic Fetus toggle ──
if (epicFetusToggle && runtime) {
  runtime.storage.local.get('epicFetusEnabled', function (data) {
    epicFetusToggle.checked = data.epicFetusEnabled !== false;
  });

  epicFetusToggle.addEventListener('change', function () {
    runtime.storage.local.set({ epicFetusEnabled: epicFetusToggle.checked });
  });
}

function setBridgeStatus(ok, msg) {
  if (!bridgeStatusEl) return;
  bridgeStatusEl.textContent = msg || (ok ? 'Connected' : 'Disconnected');
  bridgeStatusEl.style.color = ok ? 'var(--green,#2ecc71)' : 'var(--red,#e74c3c)';
}

openBtn.addEventListener('click', function () {
  alert('Open DevTools (F12) → "GraphQL" tab');
});

clearBtn.addEventListener('click', function () {
  if (!runtime) return;
  runtime.storage.local.set({ requests: [] }, function () { updateStats([]); });
});

// Try to connect to background to check bridge status
setBridgeStatus(false, 'No data');
if (runtime) {
  try {
    var port = runtime.connect({ name: 'graphql-devtools-popup' });
    setBridgeStatus(true, 'Connected');
    port.onDisconnect.addListener(function () {
      setBridgeStatus(false, 'Disconnected');
    });
  } catch (_) {
    setBridgeStatus(false, 'No background');
  }

  runtime.storage.local.get('requests', function (data) {
    var requests = data.requests || [];
    setBridgeStatus(requests.length > 0, requests.length + ' requests stored');
    updateStats(requests);
  });
} else {
  setBridgeStatus(false, 'No runtime');
}

function updateStats(requests) {
  totalEl.textContent = requests.length;
  var ok = requests.filter(function (r) { var s = parseInt(r.status); return s >= 200 && s < 300; }).length;
  var err = requests.filter(function (r) { var s = parseInt(r.status); return s >= 400 || s === 0; }).length;
  okEl.textContent = ok;
  errEl.textContent = err;

  var types = new Set();
  var totalDur = 0;
  var durCount = 0;
  for (var i = 0; i < requests.length; i++) {
    var r = requests[i];
    if (r.duration) { totalDur += r.duration; durCount++; }
    try {
      var resp = JSON.parse(r.response);
      if (resp.data) extractTypes(resp.data, types);
    } catch (e) { /* ignore */ }
  }
  typeCountEl.textContent = types.size;
  avgDurEl.textContent = durCount ? Number(totalDur / durCount).toFixed(0) + 'ms' : '-';

  var html = '';
  if (requests.length === 0) {
    html = '<div class="empty" style="text-align:center;padding:.5rem;color:var(--text-dim);font-size:.7rem">No requests yet</div>';
  } else {
    var recent = requests.slice(-10).reverse();
    for (var i = 0; i < recent.length; i++) {
      var r = recent[i];
      var opType = 'query';
      var opName = '(error)';
      try {
        var b = JSON.parse(r.body);
        opType = b.query && b.query.trimStart().startsWith('mutation') ? 'mutate' : 'query';
        var m = b.query && b.query.match(/(?:query|mutation|subscription)\s+(\w+)/i);
        opName = m ? m[1] : '(anonymous)';
      } catch (e) { /* ignore */ }
      var ok = parseInt(r.status) >= 200 && parseInt(r.status) < 300;
      html += '<div class="recent-item" style="display:flex;align-items:center;gap:.4rem;padding:.2rem .3rem;font-size:.65rem;border-bottom:1px solid var(--border)">' +
        '<span class="status-dot" style="width:5px;height:5px;border-radius:50%;flex-shrink:0;background:' + (ok ? 'var(--green,#2ecc71)' : 'var(--red,#e74c3c)') + '"></span>' +
        '<span class="badge" style="font-size:.55rem;font-weight:700;text-transform:uppercase;padding:.05rem .25rem;border-radius:2px;background:' + (opType === 'mutate' ? '#8a6b1a' : '#1a6b8a') + ';color:#fff">' + opType + '</span>' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(opName) + '</span>' +
        '<span style="color:var(--text-dim,#667);font-size:.6rem">' + (r.duration ? Number(r.duration).toFixed(0) + 'ms' : '') + '</span>' +
        '</div>';
  }
  setSafeHtml(recentListEl, html);
  }
}

function setSafeHtml(element, htmlString) {
  element.textContent = '';
  var parser = new DOMParser();
  var doc = parser.parseFromString(htmlString, 'text/html');
  var body = doc.body;
  while (body.firstChild) {
    element.appendChild(body.firstChild);
  }
}

function extractTypes(data, set) {
  if (!data || typeof data !== 'object') return;
  if (data.__typename) set.add(data.__typename);
  for (var k in data) {
    var v = data[k];
    if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) extractTypes(v[i], set); }
    else if (v && typeof v === 'object') extractTypes(v, set);
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
