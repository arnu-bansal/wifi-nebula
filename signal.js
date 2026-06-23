// signal.js — reads real browser connection data + active ping measurements
// Exports a single global: window.Signal

window.Signal = (() => {
  // Internal state
  let _strength = 0.5;   // 0–1, smoothed
  let _target   = 0.5;
  let _pingMs   = null;
  let _connType = '—';
  let _downlink = null;
  let _rtt      = null;

  // ── Network Information API ──────────────────────────────────────────
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  function readNavConn() {
    if (!conn) return;
    _connType = conn.effectiveType || conn.type || '?';
    _downlink = conn.downlink ?? null;
    _rtt      = conn.rtt      ?? null;

    const typeScore = { 'slow-2g': 0.08, '2g': 0.22, '3g': 0.50, '4g': 0.88 }[_connType] ?? 0.5;
    const dlScore   = _downlink != null ? Math.min(_downlink / 50, 1)    : typeScore;
    const rttScore  = _rtt      != null ? Math.max(0, 1 - _rtt / 400)    : 0.5;

    _target = clamp(typeScore * 0.25 + dlScore * 0.5 + rttScore * 0.25, 0.05, 1);
  }

  if (conn) {
    conn.addEventListener('change', readNavConn);
    readNavConn();
  }

  // ── Active ping ──────────────────────────────────────────────────────
  // Fetch a tiny cachebust URL and measure round-trip ms.
  // We hit the page's own origin so no CORS issues.
  const PING_TARGETS = [
    () => `${location.origin}/favicon.ico?_=${Date.now()}`,
    () => `https://www.google.com/generate_204?_=${Date.now()}`,
  ];
  let pingTargetIdx = 0;

  async function doPing() {
    const url = PING_TARGETS[pingTargetIdx % PING_TARGETS.length]();
    const t0 = performance.now();
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
      _pingMs = Math.round(performance.now() - t0);
    } catch {
      // if blocked, just leave last value
    }
    pingTargetIdx++;

    // Convert ping to a 0–1 score (0 ms → 1.0, 500 ms → 0.0)
    if (_pingMs != null) {
      const pingScore = clamp(1 - _pingMs / 500, 0, 1);
      // Blend ping score into existing target (ping gets 35% weight)
      _target = clamp(_target * 0.65 + pingScore * 0.35, 0.05, 1);
    }
  }

  // Ping every 4 seconds
  doPing();
  setInterval(() => { doPing(); readNavConn(); }, 4000);

  // ── Smooth interpolation (call in animation loop) ────────────────────
  function tick() {
    _strength += (_target - _strength) * 0.015;
  }

  // ── UI helpers ───────────────────────────────────────────────────────
  function qualityLabel(s) {
    if (s < 0.25) return { text: 'poor signal',  cls: 'poor'  };
    if (s < 0.5 ) return { text: 'fair signal',  cls: 'fair'  };
    if (s < 0.75) return { text: 'good signal',  cls: 'good'  };
    return              { text: 'great signal', cls: 'great' };
  }

  function updateUI() {
    const q = qualityLabel(_strength);
    const badge = document.getElementById('quality-badge');
    if (badge) { badge.textContent = q.text; badge.className = `badge ${q.cls}`; }

    setText('s-type', _connType);
    setText('s-dl',   _downlink != null ? `${_downlink} Mbps` : (conn ? '—' : 'N/A'));
    setText('s-rtt',  _rtt      != null ? `${_rtt} ms`        : (conn ? '—' : 'N/A'));
    setText('s-ping', _pingMs   != null ? `${_pingMs} ms`     : '…');
    setText('s-sig',  `${Math.round(_strength * 100)}%`);

    const note = document.getElementById('note');
    if (note) {
      if (!conn) {
        note.textContent = 'Network Information API not supported — using ping-only mode.';
      } else {
        note.textContent = 'Nebula energy reflects your real connection strength, updated every 4 s.';
      }
    }
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ── Public API ───────────────────────────────────────────────────────
  return {
    tick,
    updateUI,
    get strength() { return _strength; },
  };
})();