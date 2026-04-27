import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pneumoai_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function Sparkline({ data, color }) {
  if (data.length < 2) return null;
  const W = 80, H = 28, PAD = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    PAD + (i / (data.length - 1)) * (W - PAD * 2),
    PAD + (1 - (v - min) / range) * (H - PAD * 2),
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} style={{ opacity: 0.8 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export default function HistoryPanel({ newResult }) {
  const [history, setHistory] = useState(loadHistory);
  const [filter,  setFilter]  = useState('ALL');

  // Append new result when it arrives
  useEffect(() => {
    if (!newResult) return;
    setHistory(prev => {
      const entry = {
        id:         Date.now(),
        timestamp:  new Date().toLocaleString(),
        prediction: newResult.prediction,
        confidence: newResult.confidence,
        uncertainty: newResult.uncertainty,
        severity:   newResult.severity?.level,
        timing:     newResult.timing?.total_ms,
      };
      const updated = [entry, ...prev].slice(0, 50); // keep last 50
      saveHistory(updated);
      return updated;
    });
  }, [newResult]);

  const filtered = filter === 'ALL' ? history : history.filter(h => h.prediction === filter);
  const pneumoniaCount = history.filter(h => h.prediction === 'PNEUMONIA').length;
  const normalCount    = history.filter(h => h.prediction === 'NORMAL').length;
  const avgConf        = history.length ? (history.reduce((s, h) => s + h.confidence, 0) / history.length).toFixed(1) : '—';
  const confTrend      = history.slice(0, 10).reverse().map(h => h.confidence);

  const clearHistory = () => {
    setHistory([]); localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '44px 24px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeUp 0.6s ease both' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.25)', borderRadius: 100,
          padding: '5px 16px', fontSize: 12, color: '#00d4ff', marginBottom: 16 }}>
          📋 Session Scan History
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Patient <span className="gradient-text">History</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          All scans from this browser session. Stored locally — never uploaded anywhere.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Scans',   val: history.length,  color: '#00d4ff' },
          { label: 'Pneumonia',     val: pneumoniaCount,  color: '#ef4444' },
          { label: 'Normal',        val: normalCount,     color: '#22c55e' },
          { label: 'Avg Confidence',val: `${avgConf}%`,  color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trend sparkline */}
      {confTrend.length >= 2 && (
        <div className="glass" style={{ borderRadius: 14, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', marginBottom: 4 }}>Confidence Trend (last 10 scans)</div>
            <Sparkline data={confTrend} color="#00d4ff"/>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            Shows how model confidence varied across recent scans.
            High variance may indicate inconsistent image quality.
          </div>
        </div>
      )}

      {/* Filter + Clear */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'PNEUMONIA', 'NORMAL'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filter === f ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
              color:      filter === f ? '#00d4ff' : 'rgba(255,255,255,0.5)',
              border: filter === f ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}>{f}</button>
          ))}
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} style={{
            padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>
            🗑️ Clear History
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass" style={{ borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: 'var(--text-dim)' }}>
          {history.length === 0
            ? '📂 No scans yet — go to the Diagnose tab and upload an X-ray!'
            : '📂 No scans match the selected filter.'}
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr',
            padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 0.5 }}>
            <span>TIMESTAMP</span><span>RESULT</span><span>CONFIDENCE</span><span>SEVERITY</span><span>TIME (ms)</span>
          </div>
          {filtered.map((h, i) => {
            const p = h.prediction === 'PNEUMONIA';
            const c = p ? '#f87171' : '#4ade80';
            return (
              <div key={h.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr',
                padding: '12px 18px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                fontSize: 13,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{h.timestamp}</span>
                <span style={{ color: c, fontWeight: 700 }}>{p ? '⚠️' : '✅'} {h.prediction}</span>
                <span style={{ color: c, fontWeight: 600 }}>{h.confidence}%</span>
                <span style={{ fontSize: 12 }}>{h.severity || '—'}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{h.timing ? `${h.timing}ms` : '—'}</span>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 14, textAlign: 'center' }}>
        History is stored only in your browser's localStorage. Maximum 50 entries kept.
      </p>
    </div>
  );
}
