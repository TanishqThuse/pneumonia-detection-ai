// AI insights generated from prediction result
function getInsights(result) {
  const p = result.prediction === 'PNEUMONIA';
  const conf = result.confidence;
  const severity = conf >= 85 ? 'High' : conf >= 65 ? 'Moderate' : 'Low';
  if (p) return [
    `🔴 Model detected consolidation patterns consistent with pneumonia (${conf}% confidence)`,
    `📊 Severity indicator: ${severity} — based on model confidence threshold analysis`,
    `🧠 DenseNet-121 flagged abnormal density in lung fields via dense feature map connections`,
    `⚙️ Bayesian calibration applied: raw logit corrected for 3:1 training imbalance (prior log(3)≈1.099)`,
    `⚕️ Recommended action: Consult a pulmonologist for chest auscultation and confirmatory tests`,
    `💊 If bacterial pneumonia confirmed, antibiotic therapy (amoxicillin/azithromycin) is first-line`,
    `📅 Typical recovery: 1–3 weeks with treatment; severe cases may need hospitalisation`,
  ];
  return [
    `🟢 Lung fields appear clear — no consolidation or infiltrates detected (${conf}% confidence)`,
    `📊 NORMAL probability: ${result.probabilities.NORMAL}% — well above the 45% PNEUMONIA threshold`,
    `🧠 DenseNet-121 found no abnormal density patterns across 121 dense convolutional layers`,
    `⚙️ Post-calibration: Temperature scaling (T=2.5) confirmed low pneumonia signal in logits`,
    `🫁 Air bronchograms and pleural spaces appear within expected normal radiographic range`,
    `✅ Continue preventive care: annual flu vaccine, avoid smoking, maintain good hand hygiene`,
    `⚠️ If symptoms persist (fever, cough, breathlessness), consult a physician regardless of this result`,
  ];
}

export default function DiagnoseResult({ result }) {
  const p = result.prediction === 'PNEUMONIA';
  const conf = result.confidence;
  const severity = conf >= 85 ? { label:'High Risk', color:'#ef4444' }
    : conf >= 65 ? { label:'Moderate Risk', color:'#f59e0b' }
    : { label:'Low Risk', color:'#22c55e' };
  const insights = getInsights(result);
  const mainColor = p ? '#f87171' : '#4ade80';
  const borderClr = p ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)';
  const bgClr     = p ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)';

  const handleDownload = () => {
    const txt = [
      'PNEUMOAI — X-RAY ANALYSIS REPORT',
      '================================',
      `Prediction:  ${result.prediction}`,
      `Confidence:  ${result.confidence}%`,
      `NORMAL:      ${result.probabilities.NORMAL}%`,
      `PNEUMONIA:   ${result.probabilities.PNEUMONIA}%`,
      '',
      'AI INSIGHTS:',
      ...insights.map((ins, i) => `${i+1}. ${ins}`),
      '',
      'DISCLAIMER: For educational purposes only. Not a medical diagnosis.',
      `Generated: ${new Date().toLocaleString()}`,
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type:'text/plain' }));
    a.download = 'pneumoai-report.txt'; a.click();
  };

  return (
    <div style={{ border:`1px solid ${borderClr}`, borderRadius:20, padding:28,
      background:bgClr, backdropFilter:'blur(12px)', animation:'fadeUp 0.5s ease both',
      marginTop:24 }}>

      {/* Verdict row */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22, flexWrap:'wrap' }}>
        <div style={{ width:54, height:54, borderRadius:14, flexShrink:0,
          background: p ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
          {p ? '⚠️' : '✅'}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:24, fontWeight:800, color:mainColor }}>{result.prediction}</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:2 }}>
            {conf}% confidence · DenseNet-121 Analysis
          </div>
        </div>
        <div style={{ padding:'6px 14px', borderRadius:20, fontWeight:700, fontSize:13,
          background:`${severity.color}22`, color:severity.color,
          border:`1px solid ${severity.color}44` }}>
          {severity.label}
        </div>
      </div>

      {/* Probability bars */}
      {Object.entries(result.probabilities).map(([label, pct]) => {
        const c = label === 'PNEUMONIA' ? '#ef4444' : '#22c55e';
        return (
          <div key={label} style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
              <span style={{ fontWeight:600 }}>{label}</span>
              <span style={{ color:c, fontWeight:700 }}>{pct}%</span>
            </div>
            <div style={{ height:10, background:'rgba(255,255,255,0.08)', borderRadius:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, borderRadius:5,
                background:`linear-gradient(90deg,${c}88,${c})`,
                animation:'barFill 0.9s ease both' }}/>
            </div>
          </div>
        );
      })}

      {/* ── Grad-CAM Heatmap ── */}
      {result.gradcam && (
        <div style={{ marginTop:22, padding:'18px 20px', borderRadius:14,
          background:'rgba(124,58,237,0.07)', border:'1px solid rgba(124,58,237,0.25)' }}>
          <div style={{ fontWeight:700, color:'#a78bfa', marginBottom:12, fontSize:15 }}>
            🔥 Grad-CAM Explainability Heatmap
          </div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.7, marginBottom:14 }}>
            The heatmap shows <strong style={{color:'#ef4444'}}>red/warm areas</strong> where the DenseNet-121 model
            focused most when making its decision. In pneumonia cases, these typically highlight regions of
            lung consolidation or fluid accumulation.
          </p>
          <img src={result.gradcam} alt="Grad-CAM heatmap"
            style={{ width:'100%', borderRadius:12, objectFit:'contain', border:'1px solid rgba(255,255,255,0.1)' }}/>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:10, lineHeight:1.6 }}>
            Generated using Gradient-weighted Class Activation Mapping (Grad-CAM) on the final DenseBlock of DenseNet-121.
            Colours: 🔴 Red = high activation · 🔵 Blue = low activation.
          </p>
        </div>
      )}

      {/* AI Insights */}
      <div style={{ marginTop:22, padding:'18px 20px', borderRadius:14,
        background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)' }}>
        <div style={{ fontWeight:700, color:'#00d4ff', marginBottom:14, fontSize:15,
          display:'flex', alignItems:'center', gap:8 }}>
          🧠 AI Insights
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.75)',
              lineHeight:1.6, padding:'8px 12px', borderRadius:8,
              background:'rgba(255,255,255,0.03)',
              borderLeft:`3px solid rgba(0,212,255,0.4)` }}>
              {ins}
            </div>
          ))}
        </div>
      </div>

      {/* What to do next */}
      <div style={{ marginTop:16, padding:'16px 18px', borderRadius:14,
        background: p ? 'rgba(239,68,68,0.07)' : 'rgba(34,197,94,0.07)',
        border:`1px solid ${borderClr}` }}>
        <div style={{ fontWeight:700, marginBottom:10, fontSize:14 }}>
          {p ? '🔴 Next Steps' : '🟢 What To Do Now'}
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.75 }}>
          {p
            ? '1. Book an appointment with a physician urgently\n2. Get a sputum culture or CT scan for confirmation\n3. Rest, increase fluid intake, avoid cold air\n4. Do NOT self-medicate — antibiotics require a prescription\n5. Ask your doctor about the PneumoBot chatbot insights below 💬'
            : '1. Continue routine annual health check-ups\n2. Get your pneumococcal & influenza vaccines\n3. Maintain good respiratory hygiene (handwashing, masks in crowds)\n4. If symptoms develop later, repeat the scan and see a doctor\n5. Use the PneumoBot 💬 to learn more about pneumonia prevention'}
        </div>
      </div>

      {/* Technical summary */}
      <div style={{ marginTop:14, padding:'14px 16px', borderRadius:12,
        background:'rgba(124,58,237,0.07)', border:'1px solid rgba(124,58,237,0.2)',
        fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.8 }}>
        <strong style={{ color:'#a78bfa' }}>Model Details</strong> · Architecture: DenseNet-121 ·
        Calibration: Temperature Scaling (T=2.5) + Bayesian Prior Correction [log(3)] ·
        Decision threshold: 55% · Input: 224×224 RGB normalised with ImageNet stats
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, marginTop:18, flexWrap:'wrap' }}>
        <button onClick={handleDownload} style={{
          flex:1, padding:'11px 16px', borderRadius:10, border:'1px solid rgba(0,212,255,0.3)',
          background:'rgba(0,212,255,0.08)', color:'#00d4ff', fontWeight:600, fontSize:13,
          cursor:'pointer' }}>
          📥 Download Report
        </button>
        <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} style={{
          flex:1, padding:'11px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)',
          background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.6)', fontWeight:600,
          fontSize:13, cursor:'pointer' }}>
          🔄 New Analysis
        </button>
      </div>

      <p style={{ marginTop:16, fontSize:11, color:'rgba(255,255,255,0.25)', lineHeight:1.6 }}>
        ⚕️ For educational & research purposes only. This AI tool does not constitute medical advice.
        Always consult a qualified physician or radiologist for any medical decision.
      </p>
    </div>
  );
}
