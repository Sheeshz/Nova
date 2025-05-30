
import os
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai # Changed from groq
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Changed to GEMINI_API_KEY
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("API key for Gemini (GEMINI_API_KEY) missing from .env file")

# Configure the Gemini client
try:
    genai.configure(api_key=GEMINI_API_KEY)
except Exception as e:
    raise ValueError(f"Failed to configure Gemini API: {str(e)}")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    message: str
    role: str = "user" # Role from user input, defaults to "user"
    conversation_id: str

class Conversation:
    def __init__(self):
        # The system message is handled by system_instruction in Gemini
        self.messages: List[Dict[str, str]] = [
             {"role": "system", "content": "You are a helpful and friendly AI assistant."}
        ]
        self.active: bool = True

# Global store for conversations. Consider a more robust solution for production.
conversations: Dict[str, Conversation] = {}

def query_gemini_api(conversation_history: List[Dict[str, str]], system_prompt: str) -> str:
    try:
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash-latest', # Using flash for faster responses
            system_instruction=system_prompt
        )
        
        # Convert conversation history to Gemini format
        # Gemini expects roles 'user' and 'model'.
        # The history passed here already includes the latest user message.
        gemini_formatted_history = []
        for msg in conversation_history:
            if msg['role'] == 'system': # System prompt is handled by system_instruction
                continue
            # Map 'assistant' role to 'model' for Gemini
            role = 'model' if msg['role'] == 'assistant' else msg['role']
            if role not in ['user', 'model']: # Ensure only valid roles
                print(f"Skipping message with unknown role: {msg['role']}")
                continue
            gemini_formatted_history.append({
                "role": role,
                "parts": [{"text": msg['content']}]
            })

        if not gemini_formatted_history or gemini_formatted_history[-1]['role'] != 'user':
             # This case should ideally not happen if a user message was just added.
             # If the last message is not from user, Gemini might error or behave unexpectedly.
            print("Warning: Last message in history for Gemini is not from 'user'.")


        api_response = model.generate_content(gemini_formatted_history, stream=True)
        
        response_text = ""
        for chunk in api_response:
            # Ensure parts exist and have text. Sometimes, a chunk might be empty or finish_reason.
            if chunk.parts:
                response_text += chunk.parts[0].text
            elif hasattr(chunk, 'text') and chunk.text: # Fallback for simpler text responses
                response_text += chunk.text
        
        return response_text
    except Exception as e:
        print(f"Error with Gemini API: {str(e)}") # Log the error server-side
        # Check for specific API errors if possible, e.g., auth, quota
        if "API key not valid" in str(e):
            raise HTTPException(status_code=401, detail="Gemini API key is not valid. Please check your configuration.")
        elif "quota" in str(e).lower():
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please check your quota or billing.")
        raise HTTPException(status_code=500, detail=f"Error with Gemini API: {str(e)}")

def get_or_create_conversation(conversation_id: str) -> Conversation:
    if conversation_id not in conversations:
        conversations[conversation_id] = Conversation()
    return conversations[conversation_id]

@app.post("/chat/")
async def chat(user_input: UserInput): # Changed variable name for clarity
    current_conversation = get_or_create_conversation(user_input.conversation_id)
    
    if not current_conversation.active:
        raise HTTPException(
            status_code=400, 
            detail="This chat session has ended."
        )
        
    try:
        # Append user message to our stored history
        current_conversation.messages.append({
            "role": user_input.role, # Should be "user"
            "content": user_input.message
        })
        
        # Extract system prompt (first message) and the rest of the history
        system_prompt_obj = current_conversation.messages[0] if current_conversation.messages and current_conversation.messages[0]['role'] == 'system' else {"content": "You are a helpful AI assistant."}
        system_prompt_text = system_prompt_obj['content']
        
        # History for Gemini API should not include the system prompt if passed separately
        history_for_gemini = [msg for msg in current_conversation.messages if msg['role'] != 'system']


        # Get response from Gemini
        # The history_for_gemini now includes the latest user message.
        bot_response_text = query_gemini_api(history_for_gemini, system_prompt_text)
        
        # Append bot's response to our stored history
        current_conversation.messages.append({
            "role": "assistant", 
            "content": bot_response_text
        })
        
        return {
            "response": bot_response_text,
            "conversation_id": user_input.conversation_id
        }
    except HTTPException: # Re-raise HTTPExceptions from query_gemini_api
        raise
    except Exception as e:
        print(f"Error in /chat/ endpoint: {str(e)}") # Log the error server-side
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server with Gemini backend...")
    # Ensure the host is accessible if running frontend from a different origin (like Firebase Studio's dev server)
    uvicorn.run(app, host="0.0.0.0", port=8000)
