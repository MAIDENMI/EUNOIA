"""
Simple Real-Time Emotion Detection: Happy vs Sad
Uses smile/frown detection with mouth corner analysis
"""

import cv2
import numpy as np
import pandas as pd
from datetime import datetime
import time

# --------- CONFIG ----------
CAMERA_INDEX = 0
SAMPLE_INTERVAL = 0.5
AGGREGATION_WINDOW = 30
OUTPUT_CSV = "emotion_log_simple.csv"
# --------------------------

# Load face and smile cascade classifiers
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def detect_emotion(face_roi, gray_face):
    """
    Detect emotion based on mouth shape analysis
    Returns: ('happy' or 'sad', confidence)
    """
    h, w = gray_face.shape
    
    # Focus on lower half of face (mouth region)
    mouth_region = gray_face[int(h/2):h, :]
    
    # Detect smile in mouth region
    smiles = smile_cascade.detectMultiScale(
        mouth_region,
        scaleFactor=1.8,
        minNeighbors=20,
        minSize=(25, 25)
    )
    
    # Analyze mouth shape using multiple methods
    mouth_roi = mouth_region[int(len(mouth_region)*0.2):, :]
    
    if len(mouth_roi) > 10 and len(mouth_roi[0]) > 10:
        # Method 1: Corner vs Center brightness
        third = len(mouth_roi[0]) // 3
        left_corner = mouth_roi[:, :third]
        center = mouth_roi[:, third:2*third]
        right_corner = mouth_roi[:, 2*third:]
        
        left_brightness = np.mean(left_corner)
        center_brightness = np.mean(center)
        right_brightness = np.mean(right_corner)
        
        corner_avg = (left_brightness + right_brightness) / 2
        brightness_diff = corner_avg - center_brightness
        
        # Method 2: Vertical position analysis (upside down smile detection)
        # For sad/pout: corners are LOWER than center (inverted U shape)
        # Split into top and bottom halves
        mouth_height = len(mouth_roi)
        top_half = mouth_roi[:mouth_height//2, :]
        bottom_half = mouth_roi[mouth_height//2:, :]
        
        # Analyze where the "mass" of the mouth is
        top_left = np.mean(top_half[:, :third])
        top_center = np.mean(top_half[:, third:2*third])
        top_right = np.mean(top_half[:, 2*third:])
        
        bottom_left = np.mean(bottom_half[:, :third])
        bottom_center = np.mean(bottom_half[:, third:2*third])
        bottom_right = np.mean(bottom_half[:, 2*third:])
        
        # Sad/pout: corners are in bottom half, center is in top half (inverted U)
        corner_bottom_bias = (bottom_left + bottom_right) / 2 - (top_left + top_right) / 2
        center_top_bias = top_center - bottom_center
        
        # Inverted smile indicator: corners down, center up
        inverted_smile = corner_bottom_bias + center_top_bias
        
        # Method 3: Edge detection for mouth curvature
        edges = cv2.Canny(mouth_roi, 50, 150)
        
        # Count edges in top vs bottom half
        top_edges = np.sum(edges[:mouth_height//2, :])
        bottom_edges = np.sum(edges[mouth_height//2:, :])
        
        # Sad: more edges in bottom (downturned corners)
        edge_ratio = bottom_edges / (top_edges + 1)
        
    else:
        brightness_diff = 0
        inverted_smile = 0
        edge_ratio = 1
    
    # Decision logic with multiple indicators
    confidence = 0
    
    # Strong smile detection (cascade classifier)
    if len(smiles) > 0:
        emotion = "happy"
        confidence = min(90, 60 + len(smiles) * 10)
    
    # Brightness-based smile (teeth showing)
    elif brightness_diff > 5:
        emotion = "happy"
        confidence = min(85, 50 + brightness_diff * 2)
    
    # IMPROVED SAD DETECTION
    # 1. Inverted smile shape (pout/upside down smile)
    elif inverted_smile > 8:
        emotion = "sad"
        confidence = min(85, 55 + inverted_smile * 2)
    
    # 2. Downturned corners (frown)
    elif edge_ratio > 1.5:
        emotion = "sad"
        confidence = min(80, 50 + (edge_ratio - 1) * 15)
    
    # 3. Dark corners (no smile, neutral/sad)
    elif brightness_diff < -2:
        emotion = "sad"
        confidence = min(75, 45 + abs(brightness_diff) * 3)
    
    # 4. Neutral face (no strong indicators)
    else:
        # Default to sad if no smile detected
        # (most people's resting face is neutral/slightly sad)
        emotion = "sad"
        confidence = 35
    
    return emotion, confidence

def draw_face_box(frame, x, y, w, h, emotion, confidence):
    """Draw bounding box with emotion label"""
    # Color based on emotion
    if emotion == "happy":
        color = (0, 255, 0)  # Green
        label = "HAPPY"
    else:
        color = (0, 0, 255)  # Red
        label = "SAD"
    
    # Draw rectangle
    thickness = 3
    cv2.rectangle(frame, (x, y), (x+w, y+h), color, thickness)
    
    # Draw label background
    label_text = f"{label} ({confidence:.0f}%)"
    label_size, _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
    cv2.rectangle(frame, (x, y-40), (x + label_size[0] + 10, y), color, -1)
    
    # Draw label text
    cv2.putText(frame, label_text, (x+5, y-12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)

def main():
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
            "primary_emotion", "avg_confidence", "samples_collected"
        ])
        df.to_csv(OUTPUT_CSV, index=False)

    # State variables
    window_emotions = []
    window_start = time.time()
    last_sample_time = 0.0
    
    current_emotion = "neutral"
    current_confidence = 0.0
    
    # Emotion counters for display
    happy_count = 0
    sad_count = 0

    print("\n" + "=" * 70)
    print("Simple Emotion Recognition: Happy vs Sad")
    print("=" * 70)
    print("Detection Method: Smile/Frown Analysis")
    print("Press 'q' to quit")
    print("=" * 70 + "\n")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        now = time.time()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(100, 100)
        )
        
        # Process faces
        if now - last_sample_time >= SAMPLE_INTERVAL and len(faces) > 0:
            last_sample_time = now
            
            for (x, y, w, h) in faces:
                face_roi = frame[y:y+h, x:x+w]
                gray_face = gray[y:y+h, x:x+w]
                
                # Detect emotion
                emotion, confidence = detect_emotion(face_roi, gray_face)
                
                current_emotion = emotion
                current_confidence = confidence
                
                # Store data
                window_emotions.append({
                    "emotion": emotion,
                    "confidence": confidence
                })
                
                # Update counters
                if emotion == "happy":
                    happy_count += 1
                else:
                    sad_count += 1
                
                break  # Only process first face
        
        # Draw face boxes
        for (x, y, w, h) in faces:
            draw_face_box(frame, x, y, w, h, current_emotion, current_confidence)
        
        # Info panel
        info_x = frame.shape[1] - 300
        y_pos = 30
        
        # Semi-transparent background
        overlay = frame.copy()
        cv2.rectangle(overlay, (info_x - 10, 10), (frame.shape[1] - 10, 220), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        # Display info
        cv2.putText(frame, f"Faces: {len(faces)}", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 30
        
        cv2.putText(frame, "Current Emotion:", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
        y_pos += 30
        
        emotion_color = (0, 255, 0) if current_emotion == "happy" else (0, 0, 255)
        cv2.putText(frame, current_emotion.upper(), (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, emotion_color, 2, cv2.LINE_AA)
        y_pos += 35
        
        cv2.putText(frame, f"Confidence: {current_confidence:.0f}%", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 35
        
        # Session stats
        cv2.putText(frame, "Session Stats:", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y_pos += 25
        cv2.putText(frame, f"Happy: {happy_count}", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)
        y_pos += 20
        cv2.putText(frame, f"Sad: {sad_count}", (info_x, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
        
        # Samples collected
        cv2.putText(frame, f"Samples: {len(window_emotions)}", 
                   (10, frame.shape[0] - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

        cv2.imshow("Emotion Detection: Happy vs Sad", frame)

        # Save window data
        if now - window_start >= AGGREGATION_WINDOW and window_emotions:
            emotion_counts = {}
            total_confidence = 0
            
            for entry in window_emotions:
                emo = entry["emotion"]
                emotion_counts[emo] = emotion_counts.get(emo, 0) + 1
                total_confidence += entry["confidence"]
            
            dominant = max(emotion_counts.items(), key=lambda x: x[1])[0]
            avg_confidence = total_confidence / len(window_emotions)
            
            window_end_time = datetime.utcnow().isoformat() + "Z"
            window_start_time = datetime.utcfromtimestamp(window_start).isoformat() + "Z"

            row = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "window_start": window_start_time,
                "window_end": window_end_time,
                "primary_emotion": dominant,
                "avg_confidence": f"{avg_confidence:.2f}",
                "samples_collected": len(window_emotions)
            }
            pd.DataFrame([row]).to_csv(OUTPUT_CSV, mode='a', header=False, index=False)

            print(f"\n[{window_end_time}] Window Summary:")
            print(f"  Primary Emotion: {dominant}")
            print(f"  Avg Confidence: {avg_confidence:.1f}%")
            print(f"  Samples: {len(window_emotions)}")
            print("-" * 70)

            window_emotions.clear()
            window_start = time.time()

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nSession complete. Data saved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
