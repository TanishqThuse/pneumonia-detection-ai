import { useState, useRef, useEffect } from 'react';

const KB = [
  { tags: ['hello','hi','hey','help','start'], answer: "Hi! I'm PneumoBot 🤖 — your AI health assistant.\n\nAsk me about:\n• 🫁 Pneumonia symptoms & treatment\n• 🧠 How the DenseNet-121 model works\n• 📊 Your X-ray results\n• ⚕️ When to see a doctor" },
  { tags: ['what is pneumonia','define pneumonia','pneumonia is'], answer: "Pneumonia is an infection that inflames the air sacs (alveoli) in one or both lungs. They fill with fluid or pus, causing:\n\n🌡️ Fever & chills\n💨 Shortness of breath\n😣 Chest pain\n💊 Persistent cough\n😴 Fatigue" },
  { tags: ['symptom','sign','how do i know','feel like'], answer: "Common pneumonia symptoms:\n\n🌡️ High fever (38°C+)\n💨 Difficulty breathing\n🤧 Productive cough (yellow/green phlegm)\n😣 Chest pain when breathing deeply\n😴 Extreme fatigue\n🤢 Nausea or vomiting\n\n⚠️ Children may show fast breathing or chest in-drawing." },
  { tags: ['treatment','cure','medicine','antibiotic','recover'], answer: "Treatment depends on the cause:\n\n🦠 Bacterial → Antibiotics (amoxicillin, azithromycin)\n🧬 Viral → Antiviral drugs + rest\n🍄 Fungal → Antifungal medication\n\nFor all types:\n💧 Stay hydrated\n🛏️ Rest adequately\n🌡️ Fever reducers as needed\n\nSevere cases need hospitalization & oxygen therapy." },
  { tags: ['prevent','vaccine','vaccination','avoid'], answer: "Pneumonia prevention:\n\n💉 Get vaccinated (pneumococcal & flu vaccines)\n🧼 Wash hands frequently (20+ seconds)\n🚭 Avoid smoking\n😷 Wear masks in crowded spaces\n🏃 Exercise to boost immunity\n🥗 Eat a balanced diet" },
  { tags: ['densenet','architecture','model','neural network','cnn','how does the model'], answer: "Our model uses DenseNet-121 — a 121-layer CNN.\n\nKey idea: every layer connects to ALL previous layers, enabling:\n✅ Maximum feature reuse\n✅ No vanishing gradient\n✅ Only 8M parameters (vs ResNet's 25M)\n\nClassifier head: Linear(1024→256) → ReLU → Dropout(0.4) → Linear(256→2)" },
  { tags: ['transfer learning','imagenet','pretrained'], answer: "Transfer learning starts with ImageNet pre-trained weights (1.2M images). The model already understands edges, textures, and shapes. We then fine-tune it specifically for chest X-ray analysis — much faster and more accurate than training from scratch." },
  { tags: ['accuracy','performance','reliable','how good'], answer: "DenseNet-121 on chest X-ray datasets typically achieves 90-95% accuracy. We also apply:\n\n⚙️ Temperature Scaling (T=2.5)\n🧮 Bayesian Prior Correction\n🎯 55% Decision Threshold\n\nThis corrects for the 3:1 training data imbalance." },
  { tags: ['type','bacterial','viral','fungal','walking','kind of pneumonia'], answer: "Types of pneumonia:\n\n🦠 Bacterial — most common (Streptococcus pneumoniae)\n🧬 Viral — Influenza, COVID-19, RSV\n🍄 Fungal — rare, affects immunocompromised\n🚶 Walking pneumonia — mild, ambulatory\n\nAlso: Community-acquired vs Hospital-acquired" },
  { tags: ['risk','who gets','elderly','children','danger'], answer: "High-risk groups:\n\n👶 Children under 5\n👴 Adults over 65\n🤒 Immunocompromised patients\n🚬 Smokers\n🏥 Recently hospitalized\n😷 Chronic lung disease (COPD, asthma)\n\nPneumonia kills ~2.5M people per year globally." },
  { tags: ['contagious','spread','catch','transmit'], answer: "Contagiousness:\n\n😮 Spreads via respiratory droplets (coughs/sneezes)\n🤝 Contact with contaminated surfaces\n🌬️ Airborne in enclosed spaces\n\n🍄 Fungal pneumonia is NOT contagious.\n\nIncubation: 1-4 days (bacterial) to 14 days (some viral)." },
  { tags: ['xray','x-ray','radiograph','image'], answer: "Chest X-rays reveal:\n\n⬜ White consolidation = fluid/pus in alveoli\n🔲 Patchy infiltrates = inflammation\n💨 Air bronchograms = airways surrounded by fluid\n\nOur model trained on 5,216+ chest X-rays from the Kaggle Chest X-Ray dataset." },
  { tags: ['calibration','bias','temperature','threshold','imbalance'], answer: "The training set had 3:1 PNEUMONIA:NORMAL (heavily imbalanced). Without correction, model always said PNEUMONIA.\n\nOur fix:\n1️⃣ Temperature Scaling (T=2.5) — softens overconfident predictions\n2️⃣ Prior Correction — subtracts log(3)≈1.099 from PNEUMONIA logit\n3️⃣ 55% Decision Threshold" },
  { tags: ['dropout','regularization','overfitting'], answer: "Dropout randomly deactivates 40% of neurons during training.\n\n✅ Forces learning of robust, distributed features\n✅ Prevents over-reliance on any single neuron\n✅ Dramatically reduces overfitting\n\nAt inference time, all neurons are active." },
  { tags: ['doctor','hospital','emergency','when to go','urgent'], answer: "🚨 Seek IMMEDIATE medical care if:\n\n• Difficulty breathing at rest\n• Chest pain or pressure\n• Confusion or disorientation\n• Lips/nails turning blue\n• Fever above 39.5°C\n• Coughing up blood\n\n📞 Call emergency services immediately!" },
  { tags: ['kaggle','dataset','training data','train'], answer: "Training Dataset: Kaggle Chest X-Ray Images\n\n📁 5,216 training images:\n• NORMAL: 1,341 images\n• PNEUMONIA: 3,875 images\n\nSource: Guangzhou Women and Children's Medical Center.\n\n⚠️ The 3:1 imbalance required calibration techniques." },
  { tags: ['softmax','probability','confidence','percentage'], answer: "Softmax converts raw logits into probabilities:\n\nP(class_i) = exp(logit_i) / Σ exp(logit_j)\n\nBoth NORMAL + PNEUMONIA probabilities always sum to 100%.\n\nWe apply temperature scaling before softmax to spread out overconfident distributions." },
];

const SUGGESTIONS = [
  "What is pneumonia?",
  "How does the AI model work?",
  "What are the symptoms?",
  "When should I see a doctor?",
  "How accurate is this model?",
  "What does my result mean?",
];

function getResponse(input, result) {
  const q = input.toLowerCase();
  if (result && (q.includes('result') || q.includes('my result') || q.includes('what does it mean') || q.includes('prediction') || q.includes('diagnosis'))) {
    const p = result.prediction === 'PNEUMONIA';
    return p
      ? `Your X-ray result: 🔴 PNEUMONIA\n\nConfidence: ${result.confidence}%\nPNEUMONIA probability: ${result.probabilities.PNEUMONIA}%\nNORMAL probability: ${result.probabilities.NORMAL}%\n\n⚠️ Please consult a doctor immediately. This AI result is assistive — not a confirmed medical diagnosis.`
      : `Your X-ray result: 🟢 NORMAL\n\nConfidence: ${result.confidence}%\nNORMAL probability: ${result.probabilities.NORMAL}%\nPNEUMONIA probability: ${result.probabilities.PNEUMONIA}%\n\n✅ No significant signs detected. If you still have symptoms, please see a physician — AI is assistive, not definitive.`;
  }
  for (const item of KB) {
    if (item.tags.some(t => q.includes(t))) return item.answer;
  }
  return "I'm not sure about that. Try asking:\n• What is pneumonia?\n• How does the model work?\n• What does my result mean?\n• When to see a doctor?";
}

export default function Chatbot({ result }) {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([{ from:'bot', text:"Hi! I'm PneumoBot 🤖\n\nAsk me anything about pneumonia, the AI model, or your results!" }]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const [showSug, setShowSug] = useState(true);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, typing]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMsgs(p => [...p, { from:'user', text:q }]);
    setInput(''); setTyping(true); setShowSug(false);
    setTimeout(() => {
      setTyping(false);
      setMsgs(p => [...p, { from:'bot', text: getResponse(q, result) }]);
    }, 600 + Math.random() * 400);
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} title="Open PneumoBot" style={{
        position:'fixed', bottom:28, right:28, zIndex:1000,
        width:60, height:60, borderRadius:'50%', border:'none',
        background:'linear-gradient(135deg,#00d4ff,#0077aa)',
        boxShadow:'0 0 36px rgba(0,212,255,0.45)', cursor:'pointer',
        fontSize:26, transition:'transform 0.2s',
        animation: open ? 'none' : 'pulseOrb 3s ease-in-out infinite',
      }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        {open ? '✕' : '💬'}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position:'fixed', bottom:100, right:28, zIndex:999,
          width:360, height:520, borderRadius:20, overflow:'hidden',
          display:'flex', flexDirection:'column',
          background:'rgba(10,15,28,0.97)',
          border:'1px solid rgba(0,212,255,0.22)',
          boxShadow:'0 0 60px rgba(0,212,255,0.12)',
          backdropFilter:'blur(16px)',
          animation:'fadeUp 0.3s ease both',
        }}>
          {/* Header */}
          <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:10,
            background:'linear-gradient(135deg,rgba(0,212,255,0.12),rgba(124,58,237,0.12))',
            borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width:36, height:36, borderRadius:'50%',
              background:'linear-gradient(135deg,#00d4ff,#7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🤖</div>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>PneumoBot</div>
              <div style={{ fontSize:11, color:'#22c55e', display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }}/>
                AI Health Assistant · Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 10px', display:'flex', flexDirection:'column', gap:8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.from==='user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:'84%', padding:'9px 13px', fontSize:13, lineHeight:1.65,
                  whiteSpace:'pre-line',
                  borderRadius: m.from==='user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: m.from==='user' ? 'linear-gradient(135deg,#00d4ff,#0077aa)' : 'rgba(255,255,255,0.07)',
                  color: m.from==='user' ? '#000' : '#fff',
                  border: m.from==='bot' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display:'flex', gap:5, padding:'10px 13px', width:'fit-content',
                background:'rgba(255,255,255,0.07)', borderRadius:'14px 14px 14px 3px',
                border:'1px solid rgba(255,255,255,0.07)' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#00d4ff',
                    animation:`pulseOrb 1s ${i*0.2}s ease-in-out infinite` }}/>
                ))}
              </div>
            )}
            {showSug && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={() => send(s)} style={{
                    padding:'5px 11px', borderRadius:20, border:'1px solid rgba(0,212,255,0.3)',
                    background:'rgba(0,212,255,0.07)', color:'#00d4ff',
                    fontSize:11, cursor:'pointer', fontWeight:500,
                  }}>{s}</button>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.06)',
            display:'flex', gap:8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Ask me anything…"
              style={{ flex:1, padding:'9px 14px', borderRadius:10,
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                color:'#fff', fontSize:13, outline:'none' }}/>
            <button onClick={() => send()} style={{
              padding:'9px 16px', borderRadius:10, border:'none',
              background:'linear-gradient(135deg,#00d4ff,#0077aa)',
              color:'#000', fontWeight:700, cursor:'pointer', fontSize:14 }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
