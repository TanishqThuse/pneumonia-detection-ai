import { useState, useRef, useEffect, useCallback } from 'react';
import './index.css';
import Chatbot from './Chatbot';
import DiagnoseResult from './DiagnoseResult';
import RiskSurvey from './RiskSurvey';
import HistoryPanel from './HistoryPanel';
import MetricsDashboard from './MetricsDashboard';

const API = 'http://localhost:8000';

function Orbs() {
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,212,255,0.10) 0%,transparent 70%)',
        top:'-200px', left:'-200px', animation:'pulseOrb 9s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(124,58,237,0.09) 0%,transparent 70%)',
        bottom:'-100px', right:'-100px', animation:'pulseOrb 12s ease-in-out infinite reverse' }}/>
      <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,212,255,0.05) 0%,transparent 70%)',
        top:'40%', right:'8%', animation:'floatOrb 16s ease-in-out infinite' }}/>
    </div>
  );
}

function Navbar({ onNav, page }) {
  return (
    <nav style={{ position:'sticky', top:0, zIndex:100, padding:'16px 40px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      borderBottom:'1px solid rgba(255,255,255,0.05)',
      background:'rgba(8,12,20,0.85)', backdropFilter:'blur(16px)' }}>
      <button onClick={() => onNav('landing')} style={{ display:'flex', alignItems:'center',
        gap:10, background:'none', border:'none', cursor:'pointer' }}>
        <span style={{ fontSize:24 }}>🫁</span>
        <span style={{ fontSize:17, fontWeight:800,
          background:'linear-gradient(135deg,#00d4ff,#7c3aed)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PneumoAI</span>
      </button>
      <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
        {[['landing','🏠'],['diagnose','🔬 Diagnose'],['risk','🩺 Risk'],['history','📋 History'],['metrics','📊 Metrics']].map(([p, label]) => (
          <button key={p} onClick={() => onNav(p)} style={{
            padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer',
            background: page===p ? 'rgba(0,212,255,0.12)' : 'transparent',
            color: page===p ? '#00d4ff' : 'rgba(255,255,255,0.5)',
            fontWeight:600, fontSize:13, transition:'all 0.2s', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
        <button className="btn-primary" style={{ padding:'8px 18px', fontSize:13 }}
          onClick={() => onNav('diagnose')}>Diagnose</button>
      </div>
    </nav>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onStart }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);

  const features = [
    { icon:'🧠', title:'DenseNet-121 CNN', desc:'121-layer dense network — each layer receives input from ALL previous layers, maximising feature reuse and eliminating vanishing gradients.' },
    { icon:'⚡', title:'Transfer Learning', desc:'Starts with ImageNet pre-trained weights (1.2M images), then fine-tuned on 5,216 chest X-rays for pneumonia detection.' },
    { icon:'🎯', title:'Calibrated Predictions', desc:'Temperature scaling (T=2.5) + Bayesian prior correction combat the 3:1 training imbalance that caused 100% PNEUMONIA predictions.' },
    { icon:'🔬', title:'Explainable AI Ready', desc:'Architecture supports Grad-CAM heatmaps to highlight suspicious lung regions — critical for medical trust and interpretability.' },
    { icon:'🚀', title:'FastAPI Backend', desc:'Async Python REST API with multipart upload, content-type validation, 10MB file guard, and CORS support.' },
    { icon:'💬', title:'PneumoBot AI Chat', desc:'Rule-based chatbot with 17+ Q&A topics covering symptoms, treatment, model architecture, and context-aware result explanations.' },
  ];

  const steps = [
    { num:'01', icon:'📤', title:'Upload X-Ray', desc:'Drag & drop or click to upload a chest X-ray (JPG/PNG, max 10MB).' },
    { num:'02', icon:'⚙️', title:'AI Processes', desc:'Resized to 224×224, normalised with ImageNet stats, passed through DenseNet-121.' },
    { num:'03', icon:'📊', title:'Get Results', desc:'Calibrated NORMAL/PNEUMONIA prediction with 7 AI insights + next steps.' },
  ];

  const facts = [
    { label:'💡 What is Pneumonia?', text:'An infection inflaming the air sacs in one or both lungs. Sacs fill with fluid/pus causing cough, fever, and breathing difficulty.' },
    { label:'📊 Global Impact', text:'Kills ~2.5 million people per year. Leading infectious cause of death in children under 5 globally.' },
    { label:'🔍 X-Ray Detection', text:'Consolidation (white areas) and infiltrates (patchy opacity) are key radiographic signs AI learns to detect.' },
    { label:'⚕️ Disclaimer', text:'This tool is for educational & research purposes only. Always consult a qualified physician for any medical decision.' },
  ];

  return (
    <div style={{ position:'relative', zIndex:1 }}>
      {/* Hero */}
      <section style={{ textAlign:'center', padding:'88px 24px 60px',
        opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(36px)',
        transition:'all 0.8s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display:'inline-block', background:'rgba(0,212,255,0.08)',
          border:'1px solid rgba(0,212,255,0.25)', borderRadius:100,
          padding:'5px 16px', fontSize:12, color:'#00d4ff', marginBottom:24 }}>
          🔬 Deep Learning · Medical Imaging · Course Project
        </div>
        <h1 style={{ fontSize:'clamp(36px,6vw,68px)', fontWeight:900, lineHeight:1.1, marginBottom:22 }}>
          Detect Pneumonia from<br/>
          <span className="gradient-text">Chest X-Rays in Seconds</span>
        </h1>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.58)', maxWidth:540, margin:'0 auto 36px', lineHeight:1.75 }}>
          Upload a chest X-ray. Our calibrated DenseNet-121 model analyses it instantly
          and returns a prediction with AI insights, next steps, and a downloadable report.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn-primary" style={{ fontSize:16, padding:'15px 44px' }} onClick={onStart}>
            Upload X-Ray →
          </button>
          <a href="#how-it-works" style={{ padding:'15px 28px', borderRadius:10, fontSize:15,
            border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.65)',
            textDecoration:'none', lineHeight:1.5, transition:'border-color 0.2s' }}
            onMouseEnter={e=>e.target.style.borderColor='rgba(0,212,255,0.4)'}
            onMouseLeave={e=>e.target.style.borderColor='rgba(255,255,255,0.14)'}>
            Learn More
          </a>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display:'flex', justifyContent:'center', gap:18, padding:'0 24px 72px', flexWrap:'wrap' }}>
        {[
          { val:'DenseNet', sub:'121 Layers', color:'#00d4ff' },
          { val:'5,216', sub:'Training X-Rays', color:'#7c3aed' },
          { val:'224px', sub:'Input Resolution', color:'#22c55e' },
          { val:'T=2.5', sub:'Temperature Scale', color:'#f59e0b' },
        ].map((s,i) => (
          <div key={i} className="glass" style={{ borderRadius:16, padding:'22px 32px',
            textAlign:'center', animation:`fadeUp 0.6s ${i*0.1}s ease both` }}>
            <div style={{ fontSize:30, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ color:'var(--text-dim)', fontSize:12, marginTop:5 }}>{s.sub}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding:'0 24px 72px', maxWidth:1080, margin:'0 auto' }}>
        <h2 style={{ textAlign:'center', fontSize:34, fontWeight:800, marginBottom:44 }}>
          Why <span className="gradient-text">PneumoAI?</span>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18 }}>
          {features.map((f,i) => (
            <div key={i} className="glass" style={{ borderRadius:16, padding:'26px 22px',
              transition:'all 0.25s', cursor:'default', animation:`fadeUp 0.6s ${i*0.08}s ease both` }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(0,212,255,0.06)';
                e.currentTarget.style.borderColor='rgba(0,212,255,0.28)';
                e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='var(--card)';
                e.currentTarget.style.borderColor='var(--border)';
                e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ fontSize:32, marginBottom:10 }}>{f.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:7 }}>{f.title}</div>
              <div style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.72 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding:'0 24px 72px', maxWidth:860, margin:'0 auto', textAlign:'center' }}>
        <h2 style={{ fontSize:34, fontWeight:800, marginBottom:44 }}>
          How It <span className="gradient-text">Works</span>
        </h2>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start', flexWrap:'wrap', justifyContent:'center' }}>
          {steps.map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', flex:'1', minWidth:210, flexDirection:'column' }}>
              <div className="glass" style={{ width:'100%', borderRadius:16, padding:'26px 18px', textAlign:'center' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#00d4ff', letterSpacing:3, marginBottom:10 }}>STEP {s.num}</div>
                <div style={{ fontSize:34, marginBottom:10 }}>{s.icon}</div>
                <div style={{ fontWeight:700, marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:12, color:'var(--text-dim)', lineHeight:1.7 }}>{s.desc}</div>
              </div>
              {i<2 && <div style={{ color:'#00d4ff', fontSize:20, margin:'6px 0', transform:'rotate(90deg)' }}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* About pneumonia */}
      <section style={{ background:'rgba(0,212,255,0.03)',
        borderTop:'1px solid rgba(0,212,255,0.08)', borderBottom:'1px solid rgba(0,212,255,0.08)',
        padding:'60px 24px' }}>
        <div style={{ maxWidth:840, margin:'0 auto' }}>
          <h2 style={{ fontSize:28, fontWeight:800, marginBottom:28, textAlign:'center' }}>About Pneumonia</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:18 }}>
            {facts.map((c,i) => (
              <div key={i} className="glass" style={{ borderRadius:14, padding:'20px' }}>
                <div style={{ fontWeight:700, color:'#00d4ff', marginBottom:9, fontSize:14 }}>{c.label}</div>
                <div style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.75 }}>{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ textAlign:'center', padding:'72px 24px' }}>
        <h2 style={{ fontSize:34, fontWeight:800, marginBottom:14 }}>
          Ready to <span className="gradient-text">Diagnose?</span>
        </h2>
        <p style={{ color:'var(--text-dim)', marginBottom:28 }}>Upload a chest X-ray and get an AI-powered result with insights in seconds.</p>
        <button className="btn-primary" style={{ fontSize:16, padding:'15px 48px' }} onClick={onStart}>
          Start Diagnosis →
        </button>
      </section>
      <footer style={{ borderTop:'1px solid var(--border)', padding:'22px', textAlign:'center',
        color:'var(--text-dim)', fontSize:12 }}>
        PneumoAI · Deep Learning Course Project · DenseNet-121 + FastAPI + React · Educational Use Only
      </footer>
    </div>
  );
}

// ─── Diagnose Page ────────────────────────────────────────────────────────────
function DiagnosePage({ onResultChange }) {
  const [image,   setImage]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [drag,    setDrag]    = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImage(file); setPreview(URL.createObjectURL(file));
    setResult(null); setError(null); onResultChange(null);
  }, [onResultChange]);

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData(); form.append('file', image);
      const res = await fetch(`${API}/predict`, { method:'POST', body:form });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data); onResultChange(data);
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:660, margin:'0 auto', padding:'44px 24px', position:'relative', zIndex:1 }}>
      <div style={{ textAlign:'center', marginBottom:36, animation:'fadeUp 0.6s ease both' }}>
        <div style={{ display:'inline-block', background:'rgba(0,212,255,0.08)',
          border:'1px solid rgba(0,212,255,0.25)', borderRadius:100,
          padding:'5px 16px', fontSize:12, color:'#00d4ff', marginBottom:18 }}>
          🫁 AI Pneumonia Detection
        </div>
        <h1 style={{ fontSize:34, fontWeight:800, marginBottom:8 }}>
          Upload <span className="gradient-text">Chest X-Ray</span>
        </h1>
        <p style={{ color:'var(--text-dim)', fontSize:14 }}>Drag & drop or click · JPG, PNG, JPEG · Max 10MB</p>
      </div>

      {/* Upload zone */}
      <div className="glass"
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        style={{ borderRadius:20, padding: preview ? 14 : 44, cursor:'pointer',
          textAlign:'center', marginBottom:16, position:'relative', overflow:'hidden',
          border: drag ? '2px dashed #00d4ff' : '2px dashed rgba(255,255,255,0.12)',
          background: drag ? 'rgba(0,212,255,0.07)' : 'var(--card)', transition:'all 0.25s' }}>
        {loading && (
          <div style={{ position:'absolute', left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,#00d4ff,transparent)',
            animation:'scanLine 1.2s linear infinite', zIndex:5 }}/>
        )}
        {preview
          ? <img src={preview} alt="X-ray preview" style={{ maxHeight:320, maxWidth:'100%',
              borderRadius:10, objectFit:'contain', display:'block', margin:'0 auto',
              opacity:loading?0.45:1, transition:'opacity 0.3s' }}/>
          : <>
              <div style={{ fontSize:48, marginBottom:14, lineHeight:1 }}>🫁</div>
              <p style={{ color:'rgba(255,255,255,0.7)', fontWeight:600, marginBottom:5 }}>Drag & drop your X-ray here</p>
              <p style={{ color:'var(--text-dim)', fontSize:12 }}>or click to browse files</p>
            </>}
        <input ref={inputRef} type="file" accept="image/*"
          onChange={e => handleFile(e.target.files[0])} style={{ display:'none' }}/>
      </div>

      {preview && <p style={{ textAlign:'center', color:'var(--text-dim)', fontSize:12, marginBottom:16 }}>
        Click the image area to change the file
      </p>}

      <button className="btn-primary" disabled={!image||loading} onClick={handlePredict}
        style={{ width:'100%', fontSize:16, padding:'15px',
          display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
        {loading
          ? <><div style={{ width:18, height:18, borderRadius:'50%',
                border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'#000',
                animation:'spinRing 0.8s linear infinite' }}/> Analysing…</>
          : '🔬 Analyse X-Ray'}
      </button>

      {error && <div style={{ marginTop:18, padding:'13px 18px',
        background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
        borderRadius:12, color:'#fca5a5', fontSize:13 }}>⚠️ {error}</div>}

      {result && <DiagnoseResult result={result} />}

      {/* Model info */}
      <div className="glass" style={{ marginTop:20, borderRadius:14, padding:'16px 18px',
        fontSize:12, color:'var(--text-dim)', lineHeight:1.8 }}>
        <strong style={{ color:'#00d4ff' }}>Model</strong> DenseNet-121 · Classifier: Linear(1024→256)→ReLU→Dropout(0.4)→Linear(256→2)<br/>
        <strong style={{ color:'#00d4ff' }}>Calibration</strong> Temperature Scaling T=2.5 · Prior Correction log(3) · Threshold 55%
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page,   setPage]   = useState('landing');
  const [result, setResult] = useState(null);

  // Expose feedback handler to DiagnoseResult's buttons via window
  useEffect(() => {
    window._pneumoFeedback = async (action) => {
      if (!result) return;
      try {
        await fetch('http://localhost:8000/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_hash: 'session',
            prediction: result.prediction,
            agreed: action === 'agree',
          }),
        });
        alert(action === 'agree'
          ? '✅ Thank you! Your confirmation helps the model stay accurate.'
          : '⚠️ Feedback recorded. This scan has been flagged for expert review.');
      } catch { alert('Could not send feedback — is the server running?'); }
    };
    return () => { delete window._pneumoFeedback; };
  }, [result]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Orbs/>
      <Navbar onNav={setPage} page={page}/>
      {page === 'landing'  && <LandingPage     onStart={() => setPage('diagnose')}/>}
      {page === 'diagnose' && <DiagnosePage    onResultChange={setResult}/>}
      {page === 'risk'     && <RiskSurvey      lastPrediction={result?.prediction}/>}
      {page === 'history'  && <HistoryPanel    newResult={null}/>}
      {page === 'metrics'  && <MetricsDashboard/>}
      <Chatbot result={result}/>
    </div>
  );
}
