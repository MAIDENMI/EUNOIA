"""
Mind+Motion AI Service (Python FastAPI)
Handles: Gemini AI, Emotion Detection, Pose Estimation, Biometrics
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from typing import Optional, List
import base64
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Mind+Motion AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
else:
    model = None
    print("⚠️ Warning: GEMINI_API_KEY not found in environment variables")


# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    context: Optional[List[dict]] = []
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    emotion_detected: Optional[str] = None
    suggested_movement: Optional[str] = None


class EmotionAnalysisRequest(BaseModel):
    text: Optional[str] = None
    audio_base64: Optional[str] = None


class BiometricData(BaseModel):
    heart_rate: Optional[int] = None
    hrv: Optional[float] = None
    user_id: str


# CBT-inspired system prompt
CBT_SYSTEM_PROMPT = """You are a compassionate AI therapist trained in Cognitive Behavioral Therapy (CBT).
Your role is to:
- Listen empathetically and validate emotions
- Help identify negative thought patterns
- Suggest gentle cognitive reframing
- Occasionally recommend micro-movements (e.g., "take a deep breath", "stretch your shoulders")
- Keep responses concise, warm, and supportive
- Never claim to be a replacement for human professionals
- Encourage seeking professional help for serious concerns

Integrate mind and body by occasionally suggesting brief physical movements during conversation."""


@app.get("/")
async def root():
    return {
        "service": "Mind+Motion AI Service",
        "status": "running",
        "endpoints": ["/chat", "/analyze-emotion", "/process-biometrics", "/health"]
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_configured": model is not None
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Handle conversational AI with CBT-inspired responses
    Includes emotion detection and movement suggestions
    """
    print(f"📥 Received chat request: {request.dict()}")
    
    if not model:
        print("❌ Gemini API not configured")
        raise HTTPException(status_code=500, detail="Gemini API not configured")
    
    try:
        # Build conversation context
        conversation_history = "\n".join([
            f"{'User' if msg.get('role') == 'user' else 'Assistant'}: {msg.get('content', '')}"
            for msg in request.context[-5:]  # Last 5 messages for context
        ])
        
        # Create prompt with CBT context
        full_prompt = f"{CBT_SYSTEM_PROMPT}\n\nConversation History:\n{conversation_history}\n\nUser: {request.message}\n\nAssistant:"
        
        # Generate response
        response = model.generate_content(full_prompt)
        ai_response = response.text
        
        # Simple emotion detection based on keywords (placeholder for advanced ML)
        emotion = detect_emotion_from_text(request.message)
        
        # Check if response includes movement suggestion
        movement = extract_movement_suggestion(ai_response)
        
        return ChatResponse(
            response=ai_response,
            emotion_detected=emotion,
            suggested_movement=movement
        )
    
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        
        # Check if it's a quota exceeded error
        if "quota" in str(e).lower() or "429" in str(e):
            print("🚫 Gemini API quota exceeded - using fallback response")
            return ChatResponse(
                response="I understand you'd like to chat, but I'm currently experiencing high demand. Please try again in a few minutes, or consider upgrading to a paid plan for uninterrupted service. In the meantime, take a deep breath and know that I'm here to help when available.",
                emotion_detected=detect_emotion_from_text(request.message),
                suggested_movement="Take three slow, deep breaths"
            )
        
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")


@app.post("/analyze-emotion")
async def analyze_emotion(request: EmotionAnalysisRequest):
    """
    Analyze emotion from text or voice audio
    Returns: emotion category and confidence
    """
    emotion = None
    confidence = 0.0
    
    if request.text:
        emotion = detect_emotion_from_text(request.text)
        confidence = 0.75  # Placeholder
    
    # TODO: Implement voice emotion detection with audio analysis
    if request.audio_base64:
        # Placeholder for audio emotion detection
        pass
    
    return {
        "emotion": emotion,
        "confidence": confidence,
        "suggestions": get_emotion_suggestions(emotion)
    }


@app.post("/process-biometrics")
async def process_biometrics(data: BiometricData):
    """
    Process biometric data and provide adaptive recommendations
    """
    recommendations = []
    stress_level = "normal"
    
    if data.heart_rate:
        if data.heart_rate > 100:
            stress_level = "elevated"
            recommendations.append({
                "type": "breathing",
                "message": "Your heart rate is elevated. Let's try some calming breathing exercises.",
                "exercise": "box_breathing"
            })
        elif data.heart_rate < 60 and data.heart_rate > 0:
            stress_level = "low"
            recommendations.append({
                "type": "energizing",
                "message": "You seem relaxed. Ready for some gentle energizing stretches?",
                "exercise": "morning_flow"
            })
    
    if data.hrv and data.hrv < 50:
        recommendations.append({
            "type": "stress_management",
            "message": "Your HRV suggests stress. Let's do a body scan meditation.",
            "exercise": "body_scan"
        })
    
    return {
        "user_id": data.user_id,
        "stress_level": stress_level,
        "recommendations": recommendations,
        "adaptive_music": "calming" if stress_level == "elevated" else "ambient"
    }


@app.post("/pose-estimation")
async def pose_estimation(image: UploadFile = File(...)):
    """
    Analyze yoga pose from uploaded image
    TODO: Integrate MediaPipe for pose detection
    """
    # Placeholder for MediaPipe integration
    return {
        "status": "pending_implementation",
        "message": "MediaPipe pose estimation will be integrated here",
        "detected_pose": None,
        "alignment_score": None,
        "corrections": []
    }


# Helper functions
def detect_emotion_from_text(text: str) -> str:
    """Simple keyword-based emotion detection (placeholder for ML model)"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ["anxious", "worried", "nervous", "scared", "afraid"]):
        return "anxious"
    elif any(word in text_lower for word in ["sad", "depressed", "down", "lonely", "hopeless"]):
        return "sad"
    elif any(word in text_lower for word in ["angry", "frustrated", "mad", "irritated"]):
        return "angry"
    elif any(word in text_lower for word in ["happy", "great", "wonderful", "excited", "joy"]):
        return "happy"
    elif any(word in text_lower for word in ["stressed", "overwhelmed", "pressure"]):
        return "stressed"
    else:
        return "neutral"


def extract_movement_suggestion(response: str) -> Optional[str]:
    """Extract movement suggestions from AI response"""
    movement_keywords = ["stretch", "breathe", "breathing", "shoulders", "relax", "press", "palms"]
    response_lower = response.lower()
    
    if any(keyword in response_lower for keyword in movement_keywords):
        return "micro_movement"
    return None


def get_emotion_suggestions(emotion: str) -> List[str]:
    """Get suggestions based on detected emotion"""
    suggestions_map = {
        "anxious": ["Try box breathing", "Ground yourself with a body scan", "Gentle stretching"],
        "sad": ["Gentle movement therapy", "Uplifting music", "Reach out to support"],
        "angry": ["Progressive muscle relaxation", "High-energy exercise", "Breathing exercises"],
        "stressed": ["Calming yoga flow", "Meditation", "Reduce sensory input"],
        "happy": ["Maintain with gratitude practice", "Energizing movement"],
        "neutral": ["Explore mindful activities", "Try a new yoga pose"]
    }
    return suggestions_map.get(emotion, ["Continue your practice"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
