# 🚀 THE ULTIMATE PNEUMONIA DETECTOR MASTER GUIDE
*(Everything You Need to Know About This Project, Explained from Top to Bottom)*

This document is your **"God Mode" manual**. If you read this, you will understand exactly how every single line of code, every file, and every algorithm in this project works. You will be able to explain it flawlessly to your evaluator, your friends, and anyone else.

---

## 🏗️ 1. BIG PICTURE: WHAT IS THIS PROJECT?

This is a **Full-Stack Deep Learning Medical Application**. 
It takes a chest X-ray image, passes it through a highly advanced Artificial Intelligence model to detect if the patient has Pneumonia, and then provides an interactive interface for the patient/doctor to see the results, view heatmaps, take a risk assessment survey, and chat with an AI assistant.

**The Tech Stack:**
- **The Brain (AI Model):** PyTorch (Python)
- **The Backend (Server):** FastAPI + Uvicorn (Python)
- **The Frontend (UI):** React.js + Vite (JavaScript/HTML/CSS)

---

## 📁 2. DIRECTORY STRUCTURE EXPLAINED

Here is what every file and folder actually does:

```text
CP/
│
├── .gitignore                    # Tells Git not to upload heavy junk (like node_modules) to GitHub.
├── README.md                     # The short, public guide for GitHub on how to run the project.
├── Team_Explanation_And_QA.md    # Your cheat-sheet for dividing work and answering evaluator questions.
├── FULL_PROJECT_DOCUMENTATION.md # THIS FILE! The ultimate guide.
│
├── xray images/                  # A folder to keep your test X-ray images so you have something to upload during the demo.
│
└── pneumonia-detector/           # THE ACTUAL CODE LIVES HERE
    │
    ├── requirements_run.txt      # List of Python packages needed (PyTorch, FastAPI, OpenCV).
    │
    ├── app/                      # THE BACKEND FOLDER (Python)
    │   ├── best_model.pth        # The actual trained weights (the "brain") of the AI. 29MB.
    │   ├── model.py              # The code that defines the DenseNet-121 architecture and mathematical calibration.
    │   ├── main.py               # The FastAPI server. Creates the `/predict` and `/assess-risk` endpoints.
    │   ├── gradcam.py            # The code that generates the red/blue "heatmaps" to show where the AI looked.
    │   └── risk.py               # The code containing the medicine database and risk scoring logic based on user surveys.
    │
    └── frontend/                 # THE FRONTEND FOLDER (React UI)
        ├── package.json          # List of Node.js packages needed (React, Vite).
        ├── index.html            # The main HTML file that loads the React app.
        └── src/                  
            ├── main.jsx          # Mounts the React app to the HTML.
            ├── index.css         # The styling! Contains the dark theme, glassmorphism, and animations.
            ├── App.jsx           # The main layout. Handles the Navbar, Landing Page, and Upload Image page.
            ├── DiagnoseResult.jsx# The component that shows the "NORMAL vs PNEUMONIA" result, bars, and AI insights.
            ├── RiskSurvey.jsx    # The new 3-step survey page that calculates risk and recommends medicines.
            └── Chatbot.jsx       # The floating "PneumoBot" code.
```

---

## 🧠 3. THE DEEP LEARNING MODEL (How the AI works)
*File: `app/model.py`*

We didn't just build a basic AI. We built a highly sophisticated medical model. Here is the breakdown:

### A. The Base Architecture: DenseNet-121
We used **DenseNet-121**. 
- In normal Neural Networks, layer 1 passes data to layer 2, layer 2 to 3, etc. 
- In DenseNet, **every layer connects to every other layer**. Layer 1 connects to 2, 3, 4, 5... This is called "Feature Reuse". It ensures the network doesn't forget important details (like the edges of a lung) as the image goes deeper into the network.

### B. Transfer Learning
We didn't train DenseNet from scratch. We loaded it with **ImageNet weights** (meaning it was already pre-trained by Google/researchers on 1.2 million random images to understand shapes, textures, and lines). We then froze those basic skills, and only trained the very end of the network on 5,216 chest X-rays.

### C. The Custom Classifier Head
The base DenseNet outputs 1024 mathematical features. We added our own custom "head" to narrow this down to 2 outputs (Normal vs Pneumonia).
- `Linear(1024 -> 256)`: Narrows down features.
- `ReLU`: Activation function.
- `Dropout(0.4)`: Randomly turns off 40% of the neurons during training. This forces the model to not rely on just one specific pixel and prevents **overfitting**.
- `Linear(256 -> 2)`: Outputs the final decision.

### D. The Calibration (The hardest part to explain, but gives highest marks)
The training dataset was imbalanced (3875 Pneumonia vs 1341 Normal). Because of this, the model developed a "bias" and started guessing Pneumonia for almost everything just to be safe.
We fixed this mathematically in `model.py` using two techniques:
1. **Bayesian Prior Correction:** We literally subtracted `log(3)` from the Pneumonia score to handicap it and balance the scales.
2. **Temperature Scaling (T=2.5):** We divided the final mathematical outputs (logits) by 2.5 before turning them into percentages. This "softens" the model so it isn't overly confident (e.g., changing a 99.9% confidence to a more realistic 75%).

---

## 🔥 4. EXPLAINABLE AI (XAI) / GRAD-CAM
*File: `app/gradcam.py`*

Medical professionals hate "black box" AIs that just give an answer without explaining why.
We implemented **Grad-CAM** (Gradient-weighted Class Activation Mapping).

**How it works:** 
When the X-ray passes through the DenseNet model, we "hook" into the very last convolutional layer. We calculate the mathematical gradients (derivatives) going backward to see which pixels had the highest impact on the final decision.
We then use OpenCV to draw a **Heatmap** (Red = high focus, Blue = low focus) and overlay it on top of the original X-ray.

---

## 🩺 5. RISK ASSESSMENT & RAG MEDICINE ENGINE
*Files: `app/risk.py` & `frontend/src/RiskSurvey.jsx`*

We added a feature that acts like a digital doctor consultation.

**How it works:**
1. The user goes to the "Risk & Medicines" tab.
2. They fill out a 3-step survey (Age, Symptoms, Smoker, Asthma, etc.).
3. The React frontend sends this survey, ALONG with the AI's X-ray prediction, to the backend `/assess-risk` endpoint.
4. `risk.py` calculates a **Risk Score** out of 22. For example, being over 65 adds 2 points, being a smoker adds 2 points, having severe breathing difficulty adds 3 points.
5. Based on the score, it pulls data from a local **Knowledge Base / Database** (`MEDICINE_DB`).
6. It returns:
   - **Risk Level:** Mild, Moderate, or Severe.
   - **Medicines:** First-line antibiotics (e.g., Amoxicillin), Alternatives, Supportive Care (Paracetamol), and Home Care tips.
   - **Add-ons:** If the user said they have Asthma, it automatically adds Inhaler recommendations.

---

## 🤖 6. PNEUMOBOT (The Chatbot)
*File: `frontend/src/Chatbot.jsx`*

We built a floating chatbot widget in the bottom right corner.
It is a **Rule-Based Chatbot**. We pre-programmed it with about 17 specific "intents" (topics).

It uses **Regex (Regular Expressions)** to scan what the user types. 
- If the user types "what is your architecture", Regex catches "architecture" and outputs the DenseNet-121 explanation.
- It is **Context-Aware**. If an X-ray was uploaded and the AI predicted Pneumonia, and the user types "explain my result", the chatbot looks at the React state (`lastPrediction`) and gives a custom response based on their specific X-ray.

---

## ⚙️ 7. HOW DATA FLOWS IN THE APP (The Step-by-Step Execution)

If an evaluator asks "Walk me through what happens when I click upload", say this:

1. **Frontend:** The user drags an image into `App.jsx`. The React app creates a `FormData` object and sends an HTTP POST request to `http://localhost:8000/predict`.
2. **Backend Entry (`main.py`):** The FastAPI server receives the image. It checks if the file is an image and under 10MB.
3. **Preprocessing (`model.py`):** The image is resized to 224x224 pixels, converted to a PyTorch Tensor, and mathematically normalized using ImageNet colors.
4. **Inference (`model.py`):** The tensor is passed through the loaded `best_model.pth` DenseNet-121 weights. The raw logits are calibrated (Temperature Scaling + Prior Correction) and converted into percentages using Softmax.
5. **Grad-CAM (`gradcam.py`):** The backend quickly runs a backward pass to generate the heatmap, converts it into a base64 string.
6. **Response:** FastAPI sends a JSON back to React containing the Prediction, Confidences, AI Insights, and the base64 Heatmap image.
7. **UI Update (`DiagnoseResult.jsx`):** React receives the JSON and dynamically animates the probability bars, renders the heatmap, and displays the results!

---
*End of Documentation. You are now a master of this project.* 🚀
