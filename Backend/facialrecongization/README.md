# Mental Health AI Therapist - Emotion Recognition System

Advanced emotion recognition system with specialized sadness classification for mental health monitoring.

## Features

- **Custom CNN Model** trained on FER-2013 dataset (28,709 images)
- **Haar Cascade Face Detection** with bounding boxes
- **7 Primary Emotions**: angry, disgust, fear, happy, sad, surprise, neutral
- **3 Sadness Levels**: 
  - **Upset** (0-40%): Mild sadness
  - **Melancholic** (40-70%): Moderate sadness with distress
  - **Depressed** (70-100%): Severe sadness with deep indicators
- **Real-time visualization** with color-coded boxes
- **CSV logging** for therapy session analysis

## Installation

```bash
# Install dependencies
pip install tensorflow opencv-python pandas numpy matplotlib deepface

# Optional: For custom model training
pip install scikit-learn
```

## Quick Start (Using DeepFace Fallback)

```bash
python3 face.py
```

This will use DeepFace as a fallback. Press 'q' to quit.

## Training Custom Model

### Step 1: Download FER-2013 Dataset

Download from Kaggle: https://www.kaggle.com/datasets/msambare/fer2013

Place `fer2013.csv` in this directory.

### Step 2: Train the Model

```bash
python3 train_model.py
```

Training takes ~2-4 hours on CPU, ~30 minutes on GPU.

**Model Architecture:**
- 4 Convolutional blocks with BatchNormalization
- MaxPooling and Dropout for regularization
- Dense layers with 512 → 256 → 7 neurons
- Class weights emphasize sadness detection (1.5x weight)

**Expected Accuracy:** ~65-70% on FER-2013 test set

### Step 3: Run with Custom Model

```bash
python3 face.py
```

The system automatically detects and loads `emotion_model_best.h5`.

## How It Works

### Face Detection
- **Haar Cascade** detects faces in real-time
- Draws colored bounding boxes around detected faces
- Color indicates emotion (green=happy, red=sad, etc.)

### Emotion Classification
- Extracts 48x48 grayscale face ROI
- Feeds to CNN model
- Returns probability distribution over 7 emotions

### Sadness Level Classification
Considers multiple factors:
- **Sad score**: Primary indicator
- **Fear score**: Anxiety/distress modifier (adds 30%)
- **Neutral score**: Emotional flatness indicator (adds 20%)

Example:
```
sad=35%, fear=25%, neutral=10%
→ adjusted_score = 35 + (25 * 0.3) = 42.5%
→ Classification: MELANCHOLIC
```

### Data Logging

Every 30 seconds, saves to `therapy_emotion_log.csv`:
- Timestamp
- Primary emotion
- Sadness level (if applicable)
- Sadness intensity percentage
- Emotion distribution
- Sample count
- Model type used

## Display

### Bounding Box
- Color-coded by emotion
- Shows emotion label
- Shows sadness level if sad

### Info Panel (Right side)
- Model type (Custom CNN / DeepFace)
- Number of faces detected
- Current emotion
- Sadness level
- Top 3 emotion scores

## Configuration

Edit `face.py`:

```python
CAMERA_INDEX = 0              # Webcam index
SAMPLE_INTERVAL = 0.3         # Seconds between samples
AGGREGATION_WINDOW = 30       # Seconds per logging window
USE_CUSTOM_MODEL = True       # Use custom model if available
MODEL_PATH = "emotion_model_best.h5"
```

## Sadness Level Thresholds

Adjust in `face.py`:

```python
SADNESS_LEVELS = {
    "upset": (0, 40),         # Mild
    "melancholic": (40, 70),  # Moderate
    "depressed": (70, 100)    # Severe
}
```

## Research Basis

### Sadness Classification
Based on clinical depression indicators:
- **Upset**: Transient sadness, normal emotional response
- **Melancholic**: Persistent sadness with visible distress
- **Depressed**: Severe sadness with emotional numbness/flatness

### Multi-factor Analysis
- **Fear co-occurrence**: Anxiety often accompanies depression
- **Neutral expression**: Emotional blunting is a depression symptom
- **Temporal patterns**: 30-second windows capture mood stability

## Model Performance

### FER-2013 Baseline
- **Angry**: ~50% accuracy
- **Happy**: ~85% accuracy
- **Sad**: ~60% accuracy (improved with class weights)
- **Neutral**: ~70% accuracy

### Improvements for Mental Health
- 1.5x weight on sadness class
- Data augmentation (rotation, shift, flip)
- Dropout layers prevent overfitting
- Early stopping preserves best model

## Troubleshooting

### "Custom model not found"
- Train the model first with `train_model.py`
- Or let it use DeepFace fallback

### "Unable to open webcam"
- Check `CAMERA_INDEX` (try 0, 1, 2)
- Grant camera permissions to Terminal

### Low accuracy
- Ensure good lighting
- Face camera directly
- Train longer (increase epochs)

### No face detected
- Check lighting conditions
- Adjust Haar Cascade parameters in `detect_faces()`

## Files

- `face.py` - Main emotion recognition system
- `train_model.py` - Model training script
- `emotion_model_best.h5` - Trained model (after training)
- `therapy_emotion_log.csv` - Session data log
- `training_history.png` - Training metrics plot

## Citation

FER-2013 Dataset:
```
Goodfellow, I. J., et al. (2013). 
Challenges in representation learning: A report on three machine learning contests. 
Neural Networks, 64, 59-63.
```

## License

For educational and research purposes in mental health applications.
