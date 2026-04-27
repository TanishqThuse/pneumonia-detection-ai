# Deep Learning Course Project Review: Pneumonia Detection from Chest X-Rays

## 1. Project Overview
This project is a web-based application that utilizes deep learning to automatically detect **Pneumonia** from chest X-ray images. The application consists of a deep learning model served via a backend API and an interactive web frontend for users to upload X-rays and receive instant predictions.

## 2. Model Architecture & Algorithms
The core algorithm used in this project is a **Convolutional Neural Network (CNN)**, specifically the **DenseNet-121** architecture.

### Why DenseNet-121?
DenseNet (Dense Convolutional Network) connects each layer to every other layer in a feed-forward fashion. It was chosen for this project because it:
- Alleviates the vanishing-gradient problem.
- Strengthens feature propagation and encourages feature reuse.
- Requires fewer parameters compared to traditional CNNs like ResNet or VGG, making it highly efficient for medical imaging tasks.

### Custom Classifier Head
While the base feature extractor is DenseNet-121, the classifier head was custom-built for this binary classification task (Normal vs. Pneumonia):
1. **Fully Connected Layer (Linear):** Maps the 1024 features from DenseNet to 256 dimensions.
2. **ReLU Activation:** Introduces non-linearity (`max(0, x)`).
3. **Dropout Layer (40%):** A regularization technique that randomly drops 40% of the neurons during training to prevent the model from overfitting to the training data.
4. **Output Layer (Linear):** Maps the 256 dimensions to 2 final output classes.
5. **Softmax Activation:** Applied during inference to convert the raw output scores into confidence probabilities (percentages) for each class.

## 3. Deep Learning Techniques Used

### A. Transfer Learning
Training a deep learning model from scratch on medical images requires an enormous dataset and massive computational power. To solve this, **Transfer Learning** was utilized. The model leverages weights pre-trained on ImageNet, allowing it to start with a strong understanding of edges, textures, and shapes before being fine-tuned specifically on chest X-rays.

### B. Image Preprocessing & Augmentation Pipeline
Before an image is fed into the model, it must be carefully preprocessed to match the format the model expects:
- **Resizing:** All incoming X-rays are resized to exactly **224x224 pixels**.
- **Tensor Conversion:** Images are converted from pixel arrays into PyTorch Tensors.
- **Normalization:** The image channels (RGB) are normalized using standard ImageNet mean values `[0.485, 0.456, 0.406]` and standard deviations `[0.229, 0.224, 0.225]`. This standardizes the data and helps the model converge faster.

### C. Explainable AI (XAI) / Grad-CAM 
The project structure includes provisions for **Grad-CAM (Gradient-weighted Class Activation Mapping)**. This technique is used to generate heatmaps over the X-rays, highlighting the specific regions (e.g., fluid in the lungs) that the model focused on to make its prediction. This adds critical interpretability and trust for medical professionals.

## 4. Project Structure & Tech Stack

The project follows a decoupled client-server architecture:

### Backend (Deep Learning API)
- **Framework:** `FastAPI` (Python)
- **Server:** `Uvicorn`
- **Deep Learning Library:** `PyTorch` (`torch`, `torchvision`)
- **How it works:** The backend exposes a `/predict` REST API endpoint. It loads the pre-trained weights (`best_model.pth`) into RAM on startup. When an image is received, it runs the preprocessing pipeline, passes the tensor through the model, applies Softmax, and returns the predicted class and confidence percentages.

### Frontend (User Interface)
- **Framework:** `React.js`
- **Build Tool:** `Vite`
- **How it works:** Provides an intuitive web interface for users to upload X-ray files, handles client-side validation, sends the image to the FastAPI backend, and visually displays the diagnosis results and confidence bars to the user.

### Directory Breakdown
```text
pneumonia-detector/
│
├── app/                  # FastAPI Backend Source Code
│   ├── main.py           # API endpoints and server configuration
│   ├── model.py          # PyTorch model architecture and inference logic
│   ├── gradcam.py        # Explainable AI scripts
│   └── best_model.pth    # Saved PyTorch model weights (~29MB)
│
├── frontend/             # React Frontend Source Code
│   ├── src/              # React components and logic
│   ├── package.json      # Node.js dependencies
│   └── vite.config.js    # Vite configuration
│
├── requirements.txt      # Python dependencies for training
├── requirements_run.txt  # Optimized Python dependencies for inference
└── docker-compose.yml    # Docker orchestration configs
```

## 5. Potential Future Enhancements
- **Multi-class Classification:** Expanding the model to differentiate between Viral and Bacterial Pneumonia.
- **Edge Deployment:** Converting the PyTorch model to ONNX or TensorFlow Lite to run directly in the browser or on mobile devices.
- **Active Learning:** Allowing doctors to flag incorrect predictions to automatically retrain and improve the model over time.
