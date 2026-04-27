"""
Rule-based Risk Assessment & Medicine Recommendation Engine.
Acts as a local RAG (Retrieval-Augmented Generation) knowledge base.
"""

MEDICINE_DB = {
    "mild": {
        "condition": "Mild Community-Acquired Pneumonia",
        "first_line": {"name": "Amoxicillin", "dose": "500 mg", "freq": "Every 8 hours", "duration": "5–7 days"},
        "alternative": {"name": "Azithromycin (Z-Pack)", "dose": "500 mg", "freq": "Once daily", "duration": "3–5 days"},
        "supportive": [
            {"name": "Paracetamol (Crocin/Calpol)", "dose": "500–1000 mg", "note": "For fever & pain, every 6 hrs as needed"},
            {"name": "Guaifenesin (Mucinex)", "dose": "400 mg", "note": "Expectorant — thins mucus, every 12 hrs"},
            {"name": "ORS / Electrolyte Solution", "dose": "1 sachet / 1L water", "note": "Stay well hydrated throughout"},
            {"name": "Vitamin C", "dose": "500 mg daily", "note": "Immune support supplement"},
        ],
        "avoid": ["Cough suppressants (let the body expel mucus)", "Alcohol and smoking"],
        "home_care": ["Rest for at least 5–7 days", "Steam inhalation twice daily", "Sleep with head elevated", "Avoid cold drinks"],
    },
    "moderate": {
        "condition": "Moderate Community-Acquired Pneumonia",
        "first_line": {"name": "Amoxicillin-Clavulanate (Augmentin)", "dose": "875/125 mg", "freq": "Twice daily", "duration": "7–10 days"},
        "alternative": {"name": "Levofloxacin", "dose": "750 mg", "freq": "Once daily", "duration": "5 days"},
        "supportive": [
            {"name": "Paracetamol", "dose": "1000 mg", "note": "Every 6 hours — max 4 g/day"},
            {"name": "Bromhexine (Bisolvon)", "dose": "8 mg", "note": "Mucolytic agent, 3 times daily"},
            {"name": "Zinc Supplement", "dose": "20 mg daily", "note": "Supports immune and lung function"},
            {"name": "Vitamin D3", "dose": "1000 IU daily", "note": "Deficiency linked to severe respiratory illness"},
        ],
        "avoid": ["Self-stopping antibiotics midway", "NSAIDs if dehydrated or kidney disease"],
        "home_care": ["Monitor oxygen saturation (SpO2) — should be > 95%", "Seek ER if SpO2 drops below 92%", "Breathing exercises (deep diaphragmatic breathing)"],
    },
    "severe": {
        "condition": "Severe Pneumonia — Hospital Admission Likely Required",
        "first_line": {"name": "IV Piperacillin-Tazobactam or Ceftriaxone", "dose": "As prescribed", "freq": "IV infusion", "duration": "Hospital stay"},
        "alternative": {"name": "Moxifloxacin IV", "dose": "400 mg", "freq": "Once daily IV", "duration": "5–10 days"},
        "supportive": [
            {"name": "Supplemental Oxygen Therapy", "dose": "2–4 L/min via nasal cannula", "note": "If SpO2 < 94%"},
            {"name": "IV Fluids (Normal Saline)", "dose": "As per clinical need", "note": "For hydration and hemodynamic stability"},
        ],
        "avoid": ["Delaying hospital admission", "Any home treatment if breathing is severely laboured"],
        "home_care": ["Call emergency services (102 / 112) immediately", "Do NOT drive yourself — call an ambulance"],
    },
    "asthma_addon": [
        {"name": "Salbutamol Inhaler (Ventolin)", "note": "2 puffs every 4–6 hrs for bronchospasm relief"},
        {"name": "Budesonide Inhaler (Pulmicort)", "note": "Anti-inflammatory controller, use as prescribed"},
    ],
    "diabetes_addon": [
        {"name": "Monitor Blood Glucose every 4–6 hrs", "note": "Infection causes glucose spikes"},
        {"name": "Consult endocrinologist for insulin adjustment", "note": "You may need higher doses during illness"},
    ],
    "covid_addon": [
        {"name": "Watch for secondary bacterial infection", "note": "Post-COVID lung damage increases pneumonia risk"},
        {"name": "Dexamethasone (if hospitalised, as per doctor)", "note": "Reduces inflammation in severe COVID-related pneumonia"},
    ],
    "smoker_addon": [
        {"name": "Nicotine Replacement Therapy (NRT)", "note": "Smoking severely worsens pneumonia outcomes — stop immediately"},
        {"name": "N-Acetyl Cysteine (NAC)", "dose": "600 mg twice daily", "note": "Antioxidant — helps break down mucus in smokers"},
    ],
}


def assess_risk(survey: dict, prediction: str) -> dict:
    """
    Takes the survey JSON and model prediction, returns a full risk report.
    """
    score = 0
    flags = []

    age = int(survey.get("age", 30))
    if age < 5 or age > 65:
        score += 2
        flags.append("Age is a high-risk factor (under 5 or over 65)")

    if survey.get("smoker"):
        score += 2
        flags.append("Active smoker — significantly weakens lung defence")

    if survey.get("asthma"):
        score += 2
        flags.append("Asthma — pre-existing airway inflammation increases severity")

    if survey.get("copd"):
        score += 3
        flags.append("COPD — severely limits lung capacity and recovery")

    if survey.get("diabetes"):
        score += 2
        flags.append("Diabetes — impairs immune response to infection")

    if survey.get("heart_disease"):
        score += 2
        flags.append("Heart disease — pneumonia can trigger cardiac complications")

    if survey.get("polluted_work"):
        score += 1
        flags.append("Occupational lung exposure increases susceptibility")

    if survey.get("covid_history"):
        score += 2
        flags.append("Post-COVID lung scarring increases pneumonia risk")

    breathing = int(survey.get("breathing_difficulty", 1))
    if breathing >= 4:
        score += 3
        flags.append("Severe breathing difficulty — requires urgent evaluation")
    elif breathing >= 3:
        score += 2

    fever = survey.get("fever")
    if fever:
        score += 1
        flags.append("Active fever present")

    duration = int(survey.get("symptom_days", 0))
    if duration > 7:
        score += 2
        flags.append(f"Symptoms lasting {duration} days — risk of complications rises")

    if prediction == "PNEUMONIA":
        score += 4

    # Risk level
    if score <= 3:
        risk_level, rec_key = "Low Risk", "mild"
    elif score <= 7:
        risk_level, rec_key = "Moderate Risk", "moderate"
    else:
        risk_level, rec_key = "High Risk — Seek Medical Attention", "severe"

    meds = MEDICINE_DB[rec_key].copy()

    # Add-ons based on comorbidities
    addons = []
    if survey.get("asthma"):   addons.extend(MEDICINE_DB["asthma_addon"])
    if survey.get("diabetes"): addons.extend(MEDICINE_DB["diabetes_addon"])
    if survey.get("covid_history"): addons.extend(MEDICINE_DB["covid_addon"])
    if survey.get("smoker"):   addons.extend(MEDICINE_DB["smoker_addon"])

    return {
        "risk_level": risk_level,
        "risk_score": score,
        "risk_flags": flags,
        "medicines": meds,
        "addons": addons,
    }
