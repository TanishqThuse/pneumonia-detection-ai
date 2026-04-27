# 🫁 PneumoAI - Deep Learning Pneumonia Detector

An AI-powered web application that automatically detects pneumonia from chest X-ray images. Built as a Deep Learning course project, this tool uses a calibrated DenseNet-121 model to provide accurate predictions, AI-generated insights, and an interactive health assistant chatbot.

---

## 📽️ Demo
*(This section is reserved for the project demonstration. Add screenshots, GIFs, or a video link showcasing the UI and model predictions in the `demo/` folder.)*

---

## ✨ Features
- **🧠 DenseNet-121 CNN**: Utilizes transfer learning (pre-trained on ImageNet) and fine-tuned on a dataset of 5,216 chest X-rays.
- **🎯 Calibrated Predictions**: Implements Temperature Scaling (T=2.5) and Bayesian Prior Correction to eliminate training data bias (3:1 class imbalance) and reduce false positives.
- **🎨 Premium UI**: A modern, dark-themed React application with glassmorphism design, drag-and-drop uploads, and dynamic probability animations.
- **🤖 PneumoBot Assistant**: An integrated rule-based chatbot capable of answering questions about symptoms, treatments, model architecture, and explaining patient results.
- **📄 Downloadable Reports**: Automatically generates text reports detailing the AI's findings, severity levels, and recommended next steps.

---

## 🚀 How to Clone and Run Locally

Follow these step-by-step instructions to get the full application running on your own machine.

### Prerequisites
Make sure you have the following installed on your system:
- **Git**
- **Python 3.10+** (for the backend)
- **Node.js v20+** (for the frontend)

### 1. Clone the Repository
Open your terminal and clone the project to your local machine:
```bash
git clone https://github.com/TanishqThuse/pneumonia-detection-ai.git
cd pneumonia-detection-ai
```

### 2. Start the Backend (Deep Learning API)
The backend uses FastAPI and PyTorch to serve the DenseNet model.

```bash
# Navigate into the project folder
cd pneumonia-detector

# Create a virtual environment (Recommended)
python -m venv venv

# Activate the virtual environment
# --> On Windows:
.\venv\Scripts\activate
# --> On Mac/Linux:
source venv/bin/activate

# Install all required Python packages
pip install -r requirements_run.txt

# Start the FastAPI server
uvicorn app.main:app --reload --reload-dir app
```
*The backend server will start at `http://localhost:8000`.*

### 3. Start the Frontend (React UI)
Open a **new, separate terminal window** (keep the backend running in the first one).

```bash
# Navigate to the frontend folder
cd pneumonia-detector/frontend

# Install the Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will start at `http://localhost:5173`. Open this URL in your web browser to use the application!*

---

## 📂 Project Structure
```text
pneumonia-detection-ai/
│
├── demo/                 # Folder reserved for demo assets (screenshots, videos)
├── xray images/          # Sample dataset of X-rays for testing
│
└── pneumonia-detector/   # Main Application Folder
    ├── app/              # FastAPI Backend (model.py, main.py, best_model.pth)
    ├── frontend/         # React + Vite Frontend
    ├── requirements_run.txt # Python dependencies for inference
    └── Project_Documentation.md # Detailed technical review of the DL algorithms used
```

---

## ⚠️ Disclaimer
This project was built for educational and research purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always consult a qualified physician or radiologist.
