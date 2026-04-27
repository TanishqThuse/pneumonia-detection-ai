import { useState } from 'react';

const API = 'http://localhost:8000';

const STEPS = [
  {
    title: 'Personal Information',
    icon: '👤',
    fields: [
      { key: 'age',    label: 'Your Age',  type: 'number', placeholder: 'e.g. 32' },
      { key: 'gender', label: 'Gender',    type: 'select', options: ['Male', 'Female', 'Other'] },
    ],
  },
  {
    title: 'Current Symptoms',
    icon: '🌡️',
    fields: [
      { key: 'fever',               label: 'Do you currently have a fever?',              type: 'bool' },
      { key: 'breathing_difficulty', label: 'Rate your breathing difficulty (1–5)',        type: 'range', min: 1, max: 5 },
      { key: 'symptom_days',        label: 'How many days have you had symptoms?',         type: 'number', placeholder: 'e.g. 4' },
    ],
  },
  {
    title: 'Medical History',
    icon: '🏥',
    fields: [
      { key: 'smoker',       label: 'Do you currently smoke?',                      type: 'bool' },
      { key: 'asthma',       label: 'Do you have asthma?',                          type: 'bool' },
      { key: 'copd',         label: 'Do you have COPD or chronic lung disease?',    type: 'bool' },
      { key: 'diabetes',     label: 'Do you have diabetes?',                        type: 'bool' },
      { key: 'heart_disease',label: 'Do you have a heart condition?',               type: 'bool' },
      { key: 'polluted_work',label: 'Do you work in a factory, mine, or polluted area?', type: 'bool' },
      { key: 'covid_history',label: 'Have you had COVID-19 in the past year?',      type: 'bool' },
    ],
  },
];

const RISK_COLORS = {
  'Low Risk':                          { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)'  },
  'Moderate Risk':                     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  'High Risk — Seek Medical Attention':{ color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
};

function Field({ field, value, onChange }) {
  const s = { color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none' };

  if (field.type === 'bool') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {['Yes', 'No'].map(opt => (
          <button key={opt} onClick={() => onChange(opt === 'Yes')} style={{
            flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: value === (opt === 'Yes') ? 'linear-gradient(135deg,#00d4ff,#0077aa)' : 'rgba(255,255,255,0.06)',
            color: value === (opt === 'Yes') ? '#000' : 'rgba(255,255,255,0.6)',
          }}>{opt}</button>
        ))}
      </div>
    );
  }
  if (field.type === 'range') {
    const labels = ['', 'Normal', 'Slight', 'Moderate', 'Severe', 'Critical'];
    return (
      <div>
        <input type="range" min={field.min} max={field.max} value={value || field.min}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#00d4ff' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {labels.filter(Boolean).map((l, i) => (
            <span key={i} style={{ fontSize: 11, color: value === i + 1 ? '#00d4ff' : 'rgba(255,255,255,0.35)' }}>{l}</span>
          ))}
        </div>
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={s}>
        <option value="">Select…</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input type="number" placeholder={field.placeholder} value={value || ''}
      onChange={e => onChange(Number(e.target.value))} style={s}/>
  );
}

function MedicineCard({ meds, addons }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* First-line */}
      <div style={{ padding: '16px 18px', borderRadius: 14,
        background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
        <div style={{ color: '#00d4ff', fontWeight: 700, marginBottom: 10 }}>💊 First-Line Treatment</div>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <strong>{meds.first_line.name}</strong> · {meds.first_line.dose}<br/>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{meds.first_line.freq} · {meds.first_line.duration}</span>
        </div>
      </div>
      {/* Alternative */}
      <div style={{ padding: '14px 18px', borderRadius: 14,
        background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 8 }}>🔄 Alternative (if allergic)</div>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <strong>{meds.alternative.name}</strong> · {meds.alternative.dose}<br/>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{meds.alternative.freq} · {meds.alternative.duration}</span>
        </div>
      </div>
      {/* Supportive */}
      <div style={{ padding: '14px 18px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🩺 Supportive Medications</div>
        {meds.supportive.map((m, i) => (
          <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8,
            borderBottom: i < meds.supportive.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            paddingBottom: 6, marginBottom: 6 }}>
            <strong>{m.name}</strong>{m.dose ? ` · ${m.dose}` : ''}<br/>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>{m.note}</span>
          </div>
        ))}
      </div>
      {/* Home Care */}
      {meds.home_care && (
        <div style={{ padding: '14px 18px', borderRadius: 14,
          background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: 8 }}>🏠 Home Care Tips</div>
          {meds.home_care.map((tip, i) => (
            <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>• {tip}</div>
          ))}
        </div>
      )}
      {/* Avoid */}
      {meds.avoid && (
        <div style={{ padding: '14px 18px', borderRadius: 14,
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 8 }}>🚫 Avoid</div>
          {meds.avoid.map((a, i) => (
            <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>• {a}</div>
          ))}
        </div>
      )}
      {/* Add-ons */}
      {addons?.length > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: 14,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 10 }}>⚠️ Your Condition-Specific Add-Ons</div>
          {addons.map((a, i) => (
            <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 6 }}>
              <strong>{a.name}</strong>{a.dose ? ` · ${a.dose}` : ''}<br/>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>{a.note}</span>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
        ⚕️ Medication suggestions are informational only. Always consult a licensed physician before taking any medication.
      </p>
    </div>
  );
}

export default function RiskSurvey({ lastPrediction }) {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState(null);

  const set = (key, val) => setAnswers(p => ({ ...p, [key]: val }));

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/assess-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey: answers, prediction: lastPrediction || 'NORMAL' }),
      });
      setReport(await res.json());
    } catch (e) { alert('Could not connect to the server. Is the backend running?'); }
    finally { setLoading(false); }
  };

  const currentStep = STEPS[step];
  const riskStyle   = report ? (RISK_COLORS[report.risk_level] || RISK_COLORS['Moderate Risk']) : {};

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '44px 24px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeUp 0.6s ease both' }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.25)', borderRadius: 100,
          padding: '5px 16px', fontSize: 12, color: '#00d4ff', marginBottom: 18 }}>
          🩺 AI Risk Assessment & Medicine Guide
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Personalised <span className="gradient-text">Risk Report</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Answer a few questions to get a personalised risk score, insights, and medicine recommendations.
        </p>
        {lastPrediction && (
          <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 20, display: 'inline-block',
            background: lastPrediction === 'PNEUMONIA' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${lastPrediction === 'PNEUMONIA' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            fontSize: 13, color: lastPrediction === 'PNEUMONIA' ? '#f87171' : '#4ade80' }}>
            {lastPrediction === 'PNEUMONIA' ? '⚠️' : '✅'} AI Diagnosis: <strong>{lastPrediction}</strong> — factored into your risk score
          </div>
        )}
      </div>

      {!report ? (
        <div className="glass" style={{ borderRadius: 20, padding: 28, animation: 'fadeUp 0.5s ease both' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
                background: i <= step ? '#00d4ff' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s' }}/>
            ))}
          </div>

          <div style={{ fontSize: 22, marginBottom: 4 }}>{currentStep.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{currentStep.title}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {currentStep.fields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600,
                  marginBottom: 10, color: 'rgba(255,255,255,0.8)' }}>{f.label}</label>
                <Field field={f} value={answers[f.key]} onChange={v => set(f.key, v)}/>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
                fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" style={{ flex: 2, fontSize: 15, padding: '12px' }}
                onClick={() => setStep(s => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn-primary" disabled={loading} style={{ flex: 2, fontSize: 15, padding: '12px' }}
                onClick={submit}>
                {loading ? 'Generating Report…' : '🔬 Generate Risk Report'}
              </button>
            )}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginTop: 14 }}>
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      ) : (
        <div style={{ animation: 'fadeUp 0.5s ease both' }}>
          {/* Risk Level Card */}
          <div style={{ borderRadius: 20, padding: 28, marginBottom: 20,
            background: riskStyle.bg, border: `1px solid ${riskStyle.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: riskStyle.color, marginBottom: 10 }}>
              RISK ASSESSMENT RESULT
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: riskStyle.color, marginBottom: 6 }}>
              {report.risk_level}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
              Risk Score: <strong style={{ color: '#fff' }}>{report.risk_score}</strong> / 22 points
            </div>
            {/* Risk score bar */}
            <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 14, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(report.risk_score / 22) * 100}%`,
                background: `linear-gradient(90deg, ${riskStyle.color}88, ${riskStyle.color})`,
                borderRadius: 4, animation: 'barFill 1s ease both' }}/>
            </div>
          </div>

          {/* Flags */}
          {report.risk_flags.length > 0 && (
            <div className="glass" style={{ borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: '#f59e0b' }}>⚠️ Risk Factors Detected</div>
              {report.risk_flags.map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', padding: '6px 0',
                  borderBottom: i < report.risk_flags.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  • {f}
                </div>
              ))}
            </div>
          )}

          {/* Medicines */}
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, marginTop: 8 }}>
            💊 <span className="gradient-text">Recommended Medicines</span>
          </h2>
          <MedicineCard meds={report.medicines} addons={report.addons}/>

          <button onClick={() => setReport(null)} className="btn-primary"
            style={{ width: '100%', marginTop: 24, fontSize: 14, padding: '13px' }}>
            🔄 Retake Assessment
          </button>
        </div>
      )}
    </div>
  );
}
