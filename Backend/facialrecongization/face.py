"""
Real-time emotion aggregator using DeepFace + OpenCV with weighted emotions.

Saves the dominant emotion for each aggregation window (e.g., every 60 seconds) into a CSV.

Run:
    python realtime_emotion_aggregator.py
Press 'q' in the preview window to quit.
"""

import time
import cv2
import pandas as pd
from collections import Counter
from deepface import DeepFace
from datetime import datetime

# --------- CONFIG ----------
CAMERA_INDEX = 0                 # default webcam
SAMPLE_INTERVAL = 0.6            # seconds between emotion inferences (0.5-1.0 typical)
AGGREGATION_WINDOW = 60          # seconds: how long to collect emotions before storing the main one
OUTPUT_CSV = "emotion_log.csv"
DETECTOR_BACKEND = "opencv"      # options: 'opencv','mtcnn','dlib','retinaface','ssd'
ENFORCE_DETECTION = False        # False => won't crash if no face sometimes; tweak as needed
# --------------------------

# Emotion weights: higher = more influence
EMOTION_WEIGHTS = {
    "neutral": 0.5,
    "sad": 2.0,
    "fear": 2.0,
    "happy": 1.0,
    "surprised": 1.5
}

def analyze_emotion(frame_bgr):
    """
    Run DeepFace emotion analysis on the supplied BGR frame.
    Returns dominant_emotion string or None on failure.
    """
    try:
        result = DeepFace.analyze(
            frame_bgr,
            actions=["emotion"],
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=ENFORCE_DETECTION
        )
        if isinstance(result, list):
            dom = result[0].get("dominant_emotion", None)
        else:
            dom = result.get("dominant_emotion", None)
        return dom
    except Exception:
        return None

def weighted_most_common(emotion_list):
    """
    Returns the dominant emotion considering weights.
    """
    if not emotion_list:
        return None
    weighted_counts = Counter()
    for emo in emotion_list:
        weight = EMOTION_WEIGHTS.get(emo, 1.0)  # default weight = 1
        weighted_counts[emo] += weight
    return weighted_counts.most_common(1)[0][0]

def main():
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("Unable to open webcam. Check CAMERA_INDEX.")
        return

    # Prepare output CSV
    try:
        pd.read_csv(OUTPUT_CSV)
    except FileNotFoundError:
        df_existing = pd.DataFrame(columns=["window_start", "window_end", "dominant_emotion", "samples_collected"])
        df_existing.to_csv(OUTPUT_CSV, index=False)

    window_emotions = []
    window_start = time.time()
    last_sample_time = 0.0
    recent_counts = Counter()

    print("Starting webcam. Press 'q' to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Frame capture failed, exiting.")
            break

        now = time.time()

        # Take a sample
        if now - last_sample_time >= SAMPLE_INTERVAL:
            last_sample_time = now
            dom = analyze_emotion(frame)
            if dom:
                emotion = dom.lower()
                window_emotions.append(emotion)
                recent_counts[emotion] += 1

        # Display overlay
        display_text = "No samples yet"
        if window_emotions:
            current_mode = weighted_most_common(window_emotions)
            display_text = f"Current window mode: {current_mode} | samples: {len(window_emotions)}"

        cv2.putText(frame, display_text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

        y = 60
        for emo, cnt in recent_counts.most_common(5):
            cv2.putText(frame, f"{emo}: {cnt}", (10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1, cv2.LINE_AA)
            y += 20

        cv2.imshow("Emotion Recognizer", frame)

        # Aggregation window check
        if now - window_start >= AGGREGATION_WINDOW:
            dominant = weighted_most_common(window_emotions)
            window_end_time = datetime.utcnow().isoformat() + "Z"
            window_start_time = datetime.utcfromtimestamp(window_start).isoformat() + "Z"

            row = {
                "window_start": window_start_time,
                "window_end": window_end_time,
                "dominant_emotion": dominant if dominant else "no_data",
                "samples_collected": len(window_emotions)
            }
            pd.DataFrame([row]).to_csv(OUTPUT_CSV, mode='a', header=False, index=False)

            print(f"Saved window {window_start_time} → {window_end_time} dominant: {row['dominant_emotion']} ({row['samples_collected']} samples)")

            window_emotions.clear()
            recent_counts.clear()
            window_start = time.time()

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Done. CSV saved at:", OUTPUT_CSV)

if __name__ == "__main__":
    main()
