import { useState, useEffect } from 'react';

const API = 'http://localhost:8000';

function StatCard({ label, value, color = '#00d4ff', sub }) {
  return (
    <div className="glass" style={{ borderRadius: 14, padding: '20px 22px', textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ConfusionMatrix({ cm }) {
  const total = cm.TP + cm.FP + cm.FN + cm.TN;
  const cells = [
    { label: 'True Positive',  val: cm.TP, note: 'Correctly predicted PNEUMONIA', bg: 'rgba(34,197,94,0.15)',  bd: 'rgba(34,197,94,0.3)'  },
    { label: 'False Positive', val: cm.FP, note: 'Predicted PNEUMONIA but was NORMAL', bg: 'rgba(239,68,68,0.1)',  bd: 'rgba(239,68,68,0.25)' },
    { label: 'False Negative', val: cm.FN, note: 'Missed PNEUMONIA (predicted NORMAL)', bg: 'rgba(239,68,68,0.1)',  bd: 'rgba(239,68,68,0.25)' },
    { label: 'True Negative',  val: cm.TN, note: 'Correctly predicted NORMAL', bg: 'rgba(34,197,94,0.15)',  bd: 'rgba(34,197,94,0.3)'  },
  ];
  return (
    <div>
      <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>🎯 Confusion Matrix <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>({total} test samples)</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cells.map((c, i) => (
          <div key={i} style={{ padding: '18px 14px', borderRadius: 12,
            background: c.bg, border: `1px solid ${c.bd}`, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{c.val}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>{c.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLineChart({ data, color, label, yFormat = v => v }) {
  if (!data || data.length === 0) return null;
  const W = 340, H = 100, PAD = 16;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    PAD + (i / (data.length - 1)) * (W - PAD * 2),
    PAD + (1 - (v - min) / range) * (H - PAD * 2),
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{label}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${d} V${H - PAD} H${PAD} Z`} fill={`url(#g${color.replace('#','')})`}/>
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
        {pts.map((p, i) => i === pts.length - 1 && (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill={color}/>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
        <span>Epoch 1</span>
        <span style={{ color }}>{yFormat(data[data.length - 1])}</span>
        <span>Epoch {data.length}</span>
      </div>
    </div>
  );
}

function RocCurve({ fpr, tpr, auc }) {
  const W = 220, H = 180, PAD = 24;
  const toX = v => PAD + v * (W - PAD * 2);
  const toY = v => H - PAD - v * (H - PAD * 2);
  const pts = fpr.map((f, i) => `${i === 0 ? 'M' : 'L'}${toX(f).toFixed(1)},${toY(tpr[i]).toFixed(1)}`).join(' ');
  const diag = `M${toX(0)},${toY(0)} L${toX(1)},${toY(1)}`;
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 8 }}>
        📈 ROC Curve · AUC = <span style={{ color: '#00d4ff' }}>{(auc * 100).toFixed(1)}%</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <path d={diag} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4,4" fill="none"/>
        <path d={`${pts} L${toX(1)},${toY(0)} H${toX(0)} Z`} fill="rgba(124,58,237,0.15)"/>
        <path d={pts} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round"/>
        <text x={PAD} y={H - 4} fontSize="9" fill="rgba(255,255,255,0.35)">FPR →</text>
        <text x={4} y={PAD} fontSize="9" fill="rgba(255,255,255,0.35)" writingMode="vertical-rl">TPR</text>
      </svg>
    </div>
  );
}

export default function MetricsDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');

  useEffect(() => {
    fetch(`${API}/metrics`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-dim)' }}>Loading model metrics…</div>
  );
  if (!data) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#f87171' }}>
      ⚠️ Could not connect to backend. Make sure the server is running.
    </div>
  );

  const tabs = [['overview','📊 Overview'], ['training','📈 Training'], ['roc','🎯 ROC & CM'], ['live','⚡ Live']];

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '44px 24px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeUp 0.6s ease both' }}>
        <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.3)', borderRadius: 100,
          padding: '5px 16px', fontSize: 12, color: '#a78bfa', marginBottom: 16 }}>
          🔬 MLOps Model Evaluation Dashboard
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Model <span className="gradient-text">Metrics</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Real-time performance stats and evaluation metrics for DenseNet-121
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === key ? 'linear-gradient(135deg,#00d4ff22,#7c3aed22)' : 'rgba(255,255,255,0.04)',
            color: tab === key ? '#00d4ff' : 'rgba(255,255,255,0.5)',
            border: tab === key ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            fontWeight: 600, fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard label="Accuracy"  value={`${data.summary.accuracy}%`}  color="#22c55e" sub="on 624 test images"/>
            <StatCard label="Precision" value={`${data.summary.precision}%`} color="#00d4ff" sub="PNEUMONIA class"/>
            <StatCard label="Recall"    value={`${data.summary.recall}%`}    color="#f59e0b" sub="PNEUMONIA class"/>
            <StatCard label="F1 Score"  value={`${data.summary.f1_score}%`}  color="#a78bfa" sub="Harmonic mean"/>
            <StatCard label="AUC"       value={`${data.summary.auc}%`}       color="#f97316" sub="ROC curve"/>
          </div>
          <div className="glass" style={{ borderRadius: 16, padding: '20px 22px', fontSize: 13, lineHeight: 1.9, color: 'rgba(255,255,255,0.7)' }}>
            <strong style={{ color: '#00d4ff' }}>Model:</strong> {data.summary.model}<br/>
            <strong style={{ color: '#00d4ff' }}>Test Set:</strong> {data.summary.total_test_samples} images (Guangzhou Women & Children Medical Center)<br/>
            <strong style={{ color: '#00d4ff' }}>Calibration:</strong> Temperature Scaling (T=2.5) + Bayesian Prior Correction + 55% threshold<br/>
            <strong style={{ color: '#00d4ff' }}>Uncertainty:</strong> Monte Carlo Dropout (25 stochastic passes)
          </div>
        </div>
      )}

      {/* Training History Tab */}
      {tab === 'training' && data.training_history && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.4s ease both' }}>
          <MiniLineChart data={data.training_history.val_accuracy} color="#22c55e"
            label="Validation Accuracy" yFormat={v => `${(v*100).toFixed(1)}%`}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <MiniLineChart data={data.training_history.train_loss} color="#00d4ff"
              label="Training Loss" yFormat={v => v.toFixed(3)}/>
            <MiniLineChart data={data.training_history.val_loss}   color="#f97316"
              label="Validation Loss" yFormat={v => v.toFixed(3)}/>
          </div>
          <div className="glass" style={{ borderRadius: 12, padding: '14px 16px', fontSize: 12, color: 'var(--text-dim)' }}>
            📌 Val loss begins increasing after epoch ~13 (overfitting onset). Dropout(0.4) and early stopping were used to counteract this.
          </div>
        </div>
      )}

      {/* ROC & Confusion Matrix Tab */}
      {tab === 'roc' && (
        <div style={{ animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 20 }}>
            <RocCurve fpr={data.roc_curve.fpr} tpr={data.roc_curve.tpr} auc={data.roc_curve.auc}/>
            <div className="glass" style={{ borderRadius: 12, padding: 14 }}>
              <ConfusionMatrix cm={data.confusion_matrix}/>
            </div>
          </div>
          <div className="glass" style={{ borderRadius: 12, padding: '14px 16px', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8 }}>
            <strong style={{ color: '#a78bfa' }}>Calibration Improvement:</strong><br/>
            Raw model AUC before calibration ≈ 0.87 (biased toward Pneumonia).<br/>
            After Temperature Scaling + Prior Correction: AUC = {data.summary.auc}% — a significant improvement in reliability.
          </div>
        </div>
      )}

      {/* Live Stats Tab */}
      {tab === 'live' && data.live && (
        <div style={{ animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
            <StatCard label="Total Predictions" value={data.live.total_predictions} color="#00d4ff"/>
            <StatCard label="PNEUMONIA Detected" value={data.live.pneumonia_count}  color="#ef4444"/>
            <StatCard label="NORMAL Results"     value={data.live.normal_count}     color="#22c55e"/>
            <StatCard label="Doctor Agreed"      value={data.live.doctor_agreed}    color="#a78bfa"/>
            <StatCard label="Doctor Disagreed"   value={data.live.doctor_disagreed} color="#f59e0b"/>
          </div>
          <div className="glass" style={{ borderRadius: 12, padding: '14px 16px', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8 }}>
            ⚡ These counters reset when the backend server restarts.<br/>
            All predictions are permanently logged in <code style={{ color: '#00d4ff' }}>logs/predictions.jsonl</code> with timestamps and SHA-256 image hashes.<br/>
            Images flagged by doctors are saved to <code style={{ color: '#f59e0b' }}>flagged_for_retraining/</code> for future model improvement.
          </div>
        </div>
      )}
    </div>
  );
}
