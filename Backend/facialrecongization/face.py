"""
Mental Health AI Therapist - Custom Trained Emotion Recognition System

Uses custom CNN model trained on FER-2013 with Haar Cascade face detection
Detects primary emotions with specialized sadness level classification:
- Mild Sadness (Upset): Low intensity sadness, slight downturn
- Moderate Sadness (Melancholic): Clear sadness with visible distress  
- Severe Sadness (Depressed): Deep sadness with multiple indicators

Run:
    python3 face.py
Press 'q' in the preview window to quit.
"""

import time
import cv2
import pandas as pd
import numpy as np
from datetime import datetime
import tensorflow as tf
from tensorflow import keras
import os

# --------- CONFIG ----------
CAMERA_INDEX = 0
SAMPLE_INTERVAL = 0.3            # Faster sampling for better accuracy
AGGREGATION_WINDOW = 30          # Shorter window for mental health monitoring
OUTPUT_CSV = "therapy_emotion_log.csv"
USE_CUSTOM_MODEL = True          # Use custom trained model if available
MODEL_PATH = "emotion_model_best.h5"
# --------------------------

# Emotion labels (FER-2013 format)
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

# Sadness intensity thresholds based on emotion scores
SADNESS_LEVELS = {
    "upset": (0, 40),           # Mild sadness: 0-40% intensity
    "melancholic": (40, 70),    # Moderate sadness: 40-70% intensity
    "depressed": (70, 100)      # Severe sadness: 70-100% intensity
}

# Load Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def load_emotion_model():
    """
    Load custom trained model or fallback to DeepFace
    """
    if USE_CUSTOM_MODEL and os.path.exists(MODEL_PATH):
        print(f"Loading custom model from {MODEL_PATH}")
        model = keras.models.load_model(MODEL_PATH)
        return model, True
    else:
        print("Custom model not found, using DeepFace (fallback)")
        return None, False

def detect_faces(frame):
    """
    Detect faces using Haar Cascade
    Returns list of (x, y, w, h) tuples
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(48, 48),
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    return faces

def preprocess_face(face_img):
    """
    Preprocess face image for model prediction
    """
    # Resize to 48x48 (FER-2013 size)
    face_resized = cv2.resize(face_img, (48, 48))
    # Convert to grayscale
    face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
    # Normalize
    face_normalized = face_gray / 255.0
    # Reshape for model
    face_input = face_normalized.reshape(1, 48, 48, 1)
    return face_input

def predict_emotion_custom(model, face_img):
    """
    Predict emotion using custom model
    Returns dict with emotion scores
    """
    try:
        face_input = preprocess_face(face_img)
        predictions = model.predict(face_input, verbose=0)[0]
        
        # Create emotion scores dict
        emotion_scores = {EMOTIONS[i]: float(predictions[i] * 100) 
                         for i in range(len(EMOTIONS))}
        
        return emotion_scores
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

def analyze_emotion_deepface(frame_bgr):
    """
    Fallback: Use DeepFace for emotion analysis
    """
    try:
        from deepface import DeepFace
        result = DeepFace.analyze(
            frame_bgr,
            actions=["emotion"],
            detector_backend="opencv",
            enforce_detection=False
        )
        if isinstance(result, list):
            return result[0].get("emotion", None)
        else:
            return result.get("emotion", None)
    except Exception as e:
        return None

def classify_sadness_level(sad_score, fear_score=0, neutral_score=0):
    """
    Classify sadness intensity based on emotion scores.
    Considers fear and neutral as modifiers for more accurate classification.
    
    Returns: tuple (sadness_level, confidence)
    """
    # Adjust sadness score based on fear (often co-occurs with depression)
    # and neutral (may indicate emotional numbness/depression)
    adjusted_score = sad_score
    
    # If fear is high with sadness, it indicates anxiety/distress (moderate-severe)
    if fear_score > 20:
        adjusted_score = min(100, sad_score + (fear_score * 0.3))
    
    # High neutral with sadness may indicate emotional flatness (depression)
    if neutral_score > 40 and sad_score > 20:
        adjusted_score = min(100, sad_score + (neutral_score * 0.2))
    
    # Classify based on adjusted score
    for level, (min_val, max_val) in SADNESS_LEVELS.items():
        if min_val <= adjusted_score < max_val:
            confidence = adjusted_score
            return level, confidence
    
    return "upset", sad_score  # Default to mild

def get_dominant_emotion(emotion_scores):
    """
    Get the dominant emotion from scores dict.
    """
    if not emotion_scores:
        return None, None
    
    # Map emotions to our categories
    emotion_map = {
        "happy": "happy",
        "sad": "sad",
        "angry": "angry",
        "fear": "fearful",
        "surprise": "surprised",
        "neutral": "neutral",
        "disgust": "angry"  # Map disgust to angry for simplicity
    }
    
    max_emotion = max(emotion_scores.items(), key=lambda x: x[1])
    mapped_emotion = emotion_map.get(max_emotion[0], max_emotion[0])
    
    return mapped_emotion, emotion_scores

def draw_face_box(frame, x, y, w, h, emotion, sadness_level=None):
    """
    Draw bounding box around detected face with emotion label
    """
    # Color based on emotion
    color_map = {
        "happy": (0, 255, 0),      # Green
        "sad": (0, 0, 255),         # Red
        "angry": (0, 0, 200),       # Dark Red
        "fearful": (255, 165, 0),   # Orange
        "surprised": (0, 255, 255), # Yellow
        "neutral": (128, 128, 128)  # Gray
    }
    
    color = color_map.get(emotion, (255, 255, 255))
    
    # Draw rectangle
    cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
    
    # Prepare label
    label = emotion.upper()
    if sadness_level:
        label += f" ({sadness_level})"
    
    # Draw label background
    label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    cv2.rectangle(frame, (x, y-30), (x + label_size[0] + 10, y), color, -1)
    
    # Draw label text
    cv2.putText(frame, label, (x+5, y-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

def main():
    # Load model
    model, using_custom = load_emotion_model()
    
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("Unable to open webcam. Check CAMERA_INDEX.")
        return

    # Prepare output CSV with new columns
    try:
        pd.read_csv(OUTPUT_CSV)
    except FileNotFoundError:
        df_existing = pd.DataFrame(columns=[
            "timestamp", "window_start", "window_end", 
            "primary_emotion", "sadness_level", "sadness_intensity",
            "emotion_scores", "samples_collected", "model_type"
        ])
        df_existing.to_csv(OUTPUT_CSV, index=False)

    # Store emotion data for aggregation
    window_emotions = []
    window_sadness_data = []
    window_start = time.time()
    last_sample_time = 0.0
    
    # Current state for display
    current_emotion = "neutral"
    current_sadness_level = None
    current_scores = {}
    last_face_box = None

    print("\n" + "=" * 60)
    print("Mental Health Emotion Monitor")
    print("=" * 60)
    print(f"Model: {'Custom CNN (FER-2013)' if using_custom else 'DeepFace (Fallback)'}")
    print(f"Face Detection: Haar Cascade")
    print("Press 'q' to quit.")
    print("=" * 60 + "\n")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Frame capture failed, exiting.")
            break

        now = time.time()

        # Detect faces
        faces = detect_faces(frame)
        
        # Take a sample
        if now - last_sample_time >= SAMPLE_INTERVAL and len(faces) > 0:
            last_sample_time = now
            
            # Process first detected face
            x, y, w, h = faces[0]
            last_face_box = (x, y, w, h)
            face_roi = frame[y:y+h, x:x+w]
            
            # Get emotion scores
            if using_custom and model is not None:
                emotion_scores = predict_emotion_custom(model, face_roi)
            else:
                emotion_scores = analyze_emotion_deepface(face_roi)
            
            if emotion_scores:
                # Get dominant emotion
                dominant_emotion, scores = get_dominant_emotion(emotion_scores)
                current_emotion = dominant_emotion
                current_scores = scores
                
                # Store for aggregation
                window_emotions.append({
                    "emotion": dominant_emotion,
                    "scores": emotion_scores
                })
                
                # If sad, classify sadness level
                if dominant_emotion == "sad":
                    sad_score = emotion_scores.get("sad", 0)
                    fear_score = emotion_scores.get("fear", 0)
                    neutral_score = emotion_scores.get("neutral", 0)
                    
                    sadness_level, intensity = classify_sadness_level(
                        sad_score, fear_score, neutral_score
                    )
                    current_sadness_level = sadness_level
                    
                    window_sadness_data.append({
                        "level": sadness_level,
                        "intensity": intensity
                    })
                else:
                    current_sadness_level = None
        
        # Draw face boxes for all detected faces
        for (x, y, w, h) in faces:
            draw_face_box(frame, x, y, w, h, current_emotion, current_sadness_level)

        # Display info panel on right side
        info_x = frame.shape[1] - 300
        y_pos = 30
        
        # Draw semi-transparent background for info panel
        overlay = frame.copy()
        cv2.rectangle(overlay, (info_x - 10, 10), (frame.shape[1] - 10, 250), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        
        # Model info
        cv2.putText(frame, f"Model: {'Custom CNN' if using_custom else 'DeepFace'}", 
                   (info_x, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 25
        
        # Faces detected
        cv2.putText(frame, f"Faces: {len(faces)}", 
                   (info_x, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 30
        
        # Primary emotion
        emotion_color = (0, 255, 0) if current_emotion == "happy" else \
                       (0, 0, 255) if current_emotion == "sad" else \
                       (255, 165, 0) if current_emotion == "fearful" else \
                       (0, 255, 255) if current_emotion == "surprised" else \
                       (128, 128, 128)
        
        cv2.putText(frame, f"Emotion:", (info_x, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
        y_pos += 25
        cv2.putText(frame, current_emotion.upper(), (info_x, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, emotion_color, 2, cv2.LINE_AA)
        y_pos += 30
        
        # Sadness level if applicable
        if current_sadness_level:
            level_color = (100, 100, 255) if current_sadness_level == "upset" else \
                         (50, 50, 255) if current_sadness_level == "melancholic" else \
                         (0, 0, 200)
            
            cv2.putText(frame, f"Sadness Level:", (info_x, y_pos),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            y_pos += 20
            cv2.putText(frame, current_sadness_level.upper(), (info_x, y_pos),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, level_color, 2, cv2.LINE_AA)
            y_pos += 25
        
        # Show top 3 emotion scores
        if current_scores:
            y_pos += 10
            cv2.putText(frame, "Scores:", (info_x, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
            y_pos += 20
            for emotion, score in sorted(current_scores.items(), key=lambda x: x[1], reverse=True)[:3]:
                cv2.putText(frame, f"{emotion}: {score:.0f}%", (info_x, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
                y_pos += 20
        
        # Samples collected
        cv2.putText(frame, f"Samples: {len(window_emotions)}/{int(AGGREGATION_WINDOW/SAMPLE_INTERVAL)}", 
                   (10, frame.shape[0] - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

        cv2.imshow("Mental Health Emotion Monitor", frame)

        # Aggregation window check
        if now - window_start >= AGGREGATION_WINDOW:
            if window_emotions:
                # Calculate dominant emotion over window
                emotion_counts = {}
                for entry in window_emotions:
                    emo = entry["emotion"]
                    emotion_counts[emo] = emotion_counts.get(emo, 0) + 1
                
                dominant = max(emotion_counts.items(), key=lambda x: x[1])[0]
                
                # Calculate average sadness level if applicable
                sadness_level = None
                sadness_intensity = None
                if window_sadness_data:
                    # Get most common sadness level
                    level_counts = {}
                    total_intensity = 0
                    for sad_data in window_sadness_data:
                        level = sad_data["level"]
                        level_counts[level] = level_counts.get(level, 0) + 1
                        total_intensity += sad_data["intensity"]
                    
                    sadness_level = max(level_counts.items(), key=lambda x: x[1])[0]
                    sadness_intensity = total_intensity / len(window_sadness_data)
                
                window_end_time = datetime.utcnow().isoformat() + "Z"
                window_start_time = datetime.utcfromtimestamp(window_start).isoformat() + "Z"

                row = {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "window_start": window_start_time,
                    "window_end": window_end_time,
                    "primary_emotion": dominant,
                    "sadness_level": sadness_level if sadness_level else "N/A",
                    "sadness_intensity": f"{sadness_intensity:.2f}" if sadness_intensity else "N/A",
                    "emotion_scores": str(emotion_counts),
                    "samples_collected": len(window_emotions),
                    "model_type": "Custom CNN" if using_custom else "DeepFace"
                }
                pd.DataFrame([row]).to_csv(OUTPUT_CSV, mode='a', header=False, index=False)

                print(f"\n[{window_end_time}] Window Summary:")
                print(f"  Primary Emotion: {dominant}")
                if sadness_level:
                    print(f"  Sadness Level: {sadness_level} (intensity: {sadness_intensity:.1f}%)")
                print(f"  Samples: {len(window_emotions)}")
                print("-" * 50)

            window_emotions.clear()
            window_sadness_data.clear()
            window_start = time.time()

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nSession complete. Data saved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
