"""
Advanced Mental Health Emotion Recognition
Binary Classification: Happy vs Sad with detailed facial feature analysis

Sadness Level Indicators:
- Eye openness (squinting/tears)
- Eyebrow position and distance
- Mouth corners (downturned)
- Cheek position
- Overall facial muscle tension

Sadness Levels:
- Mild (Upset): 0-35% - Slight downturn, minimal eye changes
- Moderate (Melancholic): 35-65% - Clear sadness, visible distress
- Severe (Depressed): 65-100% - Deep sadness, tears, extreme features
"""

import time
import cv2
import pandas as pd
import numpy as np
from datetime import datetime
import tensorflow as tf
from tensorflow import keras
import os
# Try to import dlib (optional)
try:
    import dlib
    DLIB_AVAILABLE = True
except ImportError:
    DLIB_AVAILABLE = False
    print("⚠ dlib not available - facial landmarks disabled")

# --------- CONFIG ----------
CAMERA_INDEX = 0
SAMPLE_INTERVAL = 0.3
AGGREGATION_WINDOW = 30
OUTPUT_CSV = "therapy_emotion_log_advanced.csv"
MODEL_PATH = "emotion_binary_best.h5"
SHAPE_PREDICTOR_PATH = "shape_predictor_68_face_landmarks.dat"
# --------------------------

# Sadness intensity thresholds
SADNESS_LEVELS = {
    "mild_upset": (0, 35),
    "moderate_melancholic": (35, 65),
    "severe_depressed": (65, 100)
}

# Initialize face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Try to load dlib face landmark predictor
if DLIB_AVAILABLE:
    try:
        if os.path.exists(SHAPE_PREDICTOR_PATH):
            predictor = dlib.shape_predictor(SHAPE_PREDICTOR_PATH)
            detector = dlib.get_frontal_face_detector()
            USE_LANDMARKS = True
            print("✓ Facial landmarks enabled (dlib)")
        else:
            USE_LANDMARKS = False
            print("⚠ Facial landmarks disabled (download shape_predictor_68_face_landmarks.dat)")
            print("  Download from: http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2")
    except:
        USE_LANDMARKS = False
        print("⚠ dlib not available, using basic detection")
else:
    USE_LANDMARKS = False

def load_emotion_model():
    """Load binary emotion model"""
    if os.path.exists(MODEL_PATH):
        print(f"✓ Loading model: {MODEL_PATH}")
        model = keras.models.load_model(MODEL_PATH)
        return model, True
    else:
        print(f"✗ Model not found: {MODEL_PATH}")
        print("  Train model first: python3 train_binary_model.py")
        return None, False

def detect_faces(frame):
    """Detect faces using Haar Cascade"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(48, 48)
    )
    return faces

def get_facial_landmarks(frame, face_rect):
    """
    Extract 68 facial landmarks using dlib
    Returns dict with key facial features
    """
    if not USE_LANDMARKS:
        return None
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    x, y, w, h = face_rect
    dlib_rect = dlib.rectangle(int(x), int(y), int(x+w), int(y+h))
    
    try:
        shape = predictor(gray, dlib_rect)
        landmarks = np.array([[p.x, p.y] for p in shape.parts()])
        
        # Extract key features
        features = {
            'left_eye': landmarks[36:42],      # Left eye points
            'right_eye': landmarks[42:48],     # Right eye points
            'left_eyebrow': landmarks[17:22],  # Left eyebrow
            'right_eyebrow': landmarks[22:27], # Right eyebrow
            'nose': landmarks[27:36],          # Nose
            'mouth': landmarks[48:68],         # Mouth
            'jaw': landmarks[0:17]             # Jaw line
        }
        
        return features
    except:
        return None

def calculate_eye_aspect_ratio(eye_points):
    """
    Calculate Eye Aspect Ratio (EAR)
    Lower EAR = more closed eyes (crying/squinting)
    """
    # Vertical eye distances
    A = np.linalg.norm(eye_points[1] - eye_points[5])
    B = np.linalg.norm(eye_points[2] - eye_points[4])
    # Horizontal eye distance
    C = np.linalg.norm(eye_points[0] - eye_points[3])
    
    ear = (A + B) / (2.0 * C)
    return ear

def calculate_eyebrow_distance(eyebrow_points, eye_points):
    """
    Calculate distance between eyebrow and eye
    Smaller distance = furrowed brows (sadness/distress)
    """
    eyebrow_center = np.mean(eyebrow_points, axis=0)
    eye_center = np.mean(eye_points, axis=0)
    distance = np.linalg.norm(eyebrow_center - eye_center)
    return distance

def calculate_mouth_aspect_ratio(mouth_points):
    """
    Calculate Mouth Aspect Ratio (MAR)
    Negative MAR = downturned mouth (sadness)
    """
    # Mouth corners
    left_corner = mouth_points[0]
    right_corner = mouth_points[6]
    # Mouth center points
    top_center = mouth_points[3]
    bottom_center = mouth_points[9]
    
    # Vertical distance
    vertical = np.linalg.norm(top_center - bottom_center)
    # Horizontal distance
    horizontal = np.linalg.norm(left_corner - right_corner)
    
    # Calculate if corners are below center (downturned)
    center_y = (top_center[1] + bottom_center[1]) / 2
    corner_avg_y = (left_corner[1] + right_corner[1]) / 2
    downturn = max(0, corner_avg_y - center_y)
    
    mar = vertical / horizontal if horizontal > 0 else 0
    return mar, downturn

def analyze_facial_features(landmarks):
    """
    Analyze facial features to determine sadness indicators
    Returns sadness score (0-100)
    """
    if landmarks is None:
        return 50.0  # Default if no landmarks
    
    sadness_score = 0.0
    confidence = 0.0
    
    # 1. Eye Analysis (30% weight)
    left_ear = calculate_eye_aspect_ratio(landmarks['left_eye'])
    right_ear = calculate_eye_aspect_ratio(landmarks['right_eye'])
    avg_ear = (left_ear + right_ear) / 2
    
    # Normal EAR ~0.25-0.30, lower = more closed (crying/tired)
    if avg_ear < 0.20:
        sadness_score += 30  # Very closed eyes
        confidence += 30
    elif avg_ear < 0.25:
        sadness_score += 20  # Somewhat closed
        confidence += 20
    
    # 2. Eyebrow Analysis (25% weight)
    left_brow_dist = calculate_eyebrow_distance(landmarks['left_eyebrow'], landmarks['left_eye'])
    right_brow_dist = calculate_eyebrow_distance(landmarks['right_eyebrow'], landmarks['right_eye'])
    avg_brow_dist = (left_brow_dist + right_brow_dist) / 2
    
    # Closer eyebrows = furrowed (sadness/concern)
    if avg_brow_dist < 15:
        sadness_score += 25  # Very furrowed
        confidence += 25
    elif avg_brow_dist < 20:
        sadness_score += 15  # Somewhat furrowed
        confidence += 15
    
    # 3. Mouth Analysis (35% weight)
    mar, downturn = calculate_mouth_aspect_ratio(landmarks['mouth'])
    
    # Downturned mouth is strong sadness indicator
    if downturn > 5:
        sadness_score += 35  # Strongly downturned
        confidence += 35
    elif downturn > 2:
        sadness_score += 20  # Moderately downturned
        confidence += 20
    
    # Small MAR = tight lips (tension)
    if mar < 0.3:
        sadness_score += 10
        confidence += 10
    
    # 4. Overall facial tension (10% weight)
    # Calculate variance in jaw points (tension = less variance)
    jaw_variance = np.var(landmarks['jaw'], axis=0).mean()
    if jaw_variance < 50:
        sadness_score += 10
        confidence += 10
    
    # Normalize score
    if confidence > 0:
        sadness_score = min(100, (sadness_score / confidence) * 100)
    
    return sadness_score

def preprocess_face(face_img):
    """Preprocess face for model"""
    face_resized = cv2.resize(face_img, (48, 48))
    face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
    face_normalized = face_gray / 255.0
    face_input = face_normalized.reshape(1, 48, 48, 1)
    return face_input

def predict_emotion(model, face_img, landmarks=None):
    """
    Predict emotion using model and facial features
    Returns: (emotion, sadness_intensity)
    """
    try:
        face_input = preprocess_face(face_img)
        predictions = model.predict(face_input, verbose=0)
        
        # Get emotion probabilities
        emotion_probs = predictions[0][0]
        sad_prob = emotion_probs[0] * 100
        happy_prob = emotion_probs[1] * 100
        
        # Get model's intensity prediction
        model_intensity = predictions[1][0][0] * 100
        
        # Determine primary emotion
        if happy_prob > sad_prob:
            emotion = "happy"
            intensity = 0.0
        else:
            emotion = "sad"
            # Combine model intensity with facial feature analysis
            if landmarks:
                feature_intensity = analyze_facial_features(landmarks)
                # Weighted average: 60% model, 40% features
                intensity = (model_intensity * 0.6) + (feature_intensity * 0.4)
            else:
                intensity = model_intensity
        
        return emotion, intensity, sad_prob, happy_prob
    except Exception as e:
        print(f"Prediction error: {e}")
        return "neutral", 0.0, 50.0, 50.0

def classify_sadness_level(intensity):
    """Classify sadness level based on intensity"""
    for level, (min_val, max_val) in SADNESS_LEVELS.items():
        if min_val <= intensity < max_val:
            return level.split('_')[1]  # Return just the level name
    return "upset"

def draw_face_box(frame, x, y, w, h, emotion, sadness_level=None, intensity=0):
    """Draw bounding box with emotion label"""
    # Color based on emotion
    if emotion == "happy":
        color = (0, 255, 0)  # Green
    else:
        # Red intensity based on sadness level
        if intensity < 35:
            color = (100, 100, 255)  # Light red
        elif intensity < 65:
            color = (50, 50, 255)    # Medium red
        else:
            color = (0, 0, 200)      # Dark red
    
    # Draw rectangle
    cv2.rectangle(frame, (x, y), (x+w, y+h), color, 3)
    
    # Prepare label
    if emotion == "sad" and sadness_level:
        label = f"{emotion.upper()} - {sadness_level.upper()}"
        sublabel = f"Intensity: {intensity:.0f}%"
    else:
        label = emotion.upper()
        sublabel = ""
    
    # Draw label background
    label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
    cv2.rectangle(frame, (x, y-60), (x + max(label_size[0], 200) + 10, y), color, -1)
    
    # Draw label text
    cv2.putText(frame, label, (x+5, y-35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
    
    if sublabel:
        cv2.putText(frame, sublabel, (x+5, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

def draw_landmarks(frame, landmarks):
    """Draw facial landmarks for visualization"""
    if landmarks is None:
        return
    
    # Draw eye points
    for point in landmarks['left_eye']:
        cv2.circle(frame, tuple(point), 2, (0, 255, 255), -1)
    for point in landmarks['right_eye']:
        cv2.circle(frame, tuple(point), 2, (0, 255, 255), -1)
    
    # Draw eyebrow points
    for point in landmarks['left_eyebrow']:
        cv2.circle(frame, tuple(point), 2, (255, 255, 0), -1)
    for point in landmarks['right_eyebrow']:
        cv2.circle(frame, tuple(point), 2, (255, 255, 0), -1)
    
    # Draw mouth points
    for point in landmarks['mouth']:
        cv2.circle(frame, tuple(point), 2, (255, 0, 255), -1)

def main():
    # Load model
    model, using_custom = load_emotion_model()
    if not using_custom:
        print("Cannot run without trained model. Exiting.")
        return
    
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("Unable to open webcam.")
        return

    # Prepare CSV
    try:
        pd.read_csv(OUTPUT_CSV)
    except FileNotFoundError:
        df = pd.DataFrame(columns=[
            "timestamp", "window_start", "window_end",
            "primary_emotion", "sadness_level", "sadness_intensity",
            "happy_confidence", "sad_confidence",
            "samples_collected", "landmarks_used"
        ])
        df.to_csv(OUTPUT_CSV, index=False)

    # State variables
    window_emotions = []
    window_sadness_data = []
    window_start = time.time()
    last_sample_time = 0.0
    
    current_emotion = "neutral"
    current_sadness_level = None
    current_intensity = 0.0
    current_sad_prob = 0.0
    current_happy_prob = 0.0

    print("\n" + "=" * 70)
    print("Advanced Mental Health Emotion Monitor")
    print("=" * 70)
    print(f"Model: Binary CNN (Happy vs Sad)")
    print(f"Face Detection: Haar Cascade")
    print(f"Facial Landmarks: {'Enabled (68 points)' if USE_LANDMARKS else 'Disabled'}")
    print("Press 'q' to quit, 'l' to toggle landmarks display")
    print("=" * 70 + "\n")
    
    show_landmarks = False
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        now = time.time()
        faces = detect_faces(frame)
        
        # Process faces
        if now - last_sample_time >= SAMPLE_INTERVAL and len(faces) > 0:
            last_sample_time = now
            
            x, y, w, h = faces[0]
            face_roi = frame[y:y+h, x:x+w]
            
            # Get facial landmarks
            landmarks = get_facial_landmarks(frame, (x, y, w, h))
            
            # Predict emotion
            emotion, intensity, sad_prob, happy_prob = predict_emotion(model, face_roi, landmarks)
            
            current_emotion = emotion
            current_intensity = intensity
            current_sad_prob = sad_prob
            current_happy_prob = happy_prob
            
            # Store data
            window_emotions.append({
                "emotion": emotion,
                "intensity": intensity,
                "sad_prob": sad_prob,
                "happy_prob": happy_prob
            })
            
            if emotion == "sad":
                sadness_level = classify_sadness_level(intensity)
                current_sadness_level = sadness_level
                window_sadness_data.append({
                    "level": sadness_level,
                    "intensity": intensity
                })
            else:
                current_sadness_level = None
        
        # Draw face boxes
        for (x, y, w, h) in faces:
            draw_face_box(frame, x, y, w, h, current_emotion, current_sadness_level, current_intensity)
            
            if show_landmarks and USE_LANDMARKS:
                landmarks = get_facial_landmarks(frame, (x, y, w, h))
                draw_landmarks(frame, landmarks)
        
        # Info panel
        info_x = frame.shape[1] - 320
        y_pos = 30
        
        overlay = frame.copy()
        cv2.rectangle(overlay, (info_x - 10, 10), (frame.shape[1] - 10, 280), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        cv2.putText(frame, f"Faces: {len(faces)}", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 25
        
        cv2.putText(frame, f"Landmarks: {'ON' if USE_LANDMARKS else 'OFF'}", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 35
        
        # Emotion
        emotion_color = (0, 255, 0) if current_emotion == "happy" else (0, 0, 255)
        cv2.putText(frame, "Emotion:", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
        y_pos += 25
        cv2.putText(frame, current_emotion.upper(), (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, emotion_color, 2, cv2.LINE_AA)
        y_pos += 35
        
        # Sadness level
        if current_sadness_level:
            cv2.putText(frame, f"Level: {current_sadness_level.upper()}", (info_x, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 255), 2, cv2.LINE_AA)
            y_pos += 25
            cv2.putText(frame, f"Intensity: {current_intensity:.0f}%", (info_x, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
            y_pos += 30
        
        # Probabilities
        cv2.putText(frame, "Confidence:", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 20
        cv2.putText(frame, f"Happy: {current_happy_prob:.0f}%", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)
        y_pos += 20
        cv2.putText(frame, f"Sad: {current_sad_prob:.0f}%", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
        y_pos += 30
        
        # Samples
        cv2.putText(frame, f"Samples: {len(window_emotions)}/{int(AGGREGATION_WINDOW/SAMPLE_INTERVAL)}", 
                   (10, frame.shape[0] - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

        cv2.imshow("Mental Health Emotion Monitor", frame)

        # Save window data
        if now - window_start >= AGGREGATION_WINDOW and window_emotions:
            emotion_counts = {}
            for entry in window_emotions:
                emo = entry["emotion"]
                emotion_counts[emo] = emotion_counts.get(emo, 0) + 1
            
            dominant = max(emotion_counts.items(), key=lambda x: x[1])[0]
            
            sadness_level = None
            sadness_intensity = None
            if window_sadness_data:
                level_counts = {}
                total_intensity = 0
                for sad_data in window_sadness_data:
                    level = sad_data["level"]
                    level_counts[level] = level_counts.get(level, 0) + 1
                    total_intensity += sad_data["intensity"]
                
                sadness_level = max(level_counts.items(), key=lambda x: x[1])[0]
                sadness_intensity = total_intensity / len(window_sadness_data)
            
            # Calculate average confidences
            avg_happy = np.mean([e["happy_prob"] for e in window_emotions])
            avg_sad = np.mean([e["sad_prob"] for e in window_emotions])
            
            window_end_time = datetime.utcnow().isoformat() + "Z"
            window_start_time = datetime.utcfromtimestamp(window_start).isoformat() + "Z"

            row = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "window_start": window_start_time,
                "window_end": window_end_time,
                "primary_emotion": dominant,
                "sadness_level": sadness_level if sadness_level else "N/A",
                "sadness_intensity": f"{sadness_intensity:.2f}" if sadness_intensity else "N/A",
                "happy_confidence": f"{avg_happy:.2f}",
                "sad_confidence": f"{avg_sad:.2f}",
                "samples_collected": len(window_emotions),
                "landmarks_used": USE_LANDMARKS
            }
            pd.DataFrame([row]).to_csv(OUTPUT_CSV, mode='a', header=False, index=False)

            print(f"\n[{window_end_time}] Window Summary:")
            print(f"  Primary Emotion: {dominant}")
            if sadness_level:
                print(f"  Sadness Level: {sadness_level} (intensity: {sadness_intensity:.1f}%)")
            print(f"  Samples: {len(window_emotions)}")
            print("-" * 70)

            window_emotions.clear()
            window_sadness_data.clear()
            window_start = time.time()

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('l'):
            show_landmarks = not show_landmarks

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nSession complete. Data saved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
