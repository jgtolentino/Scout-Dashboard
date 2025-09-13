from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional
from dotenv import load_dotenv
from claude_proxy import generate_ui_with_claude

# Load environment variables
load_dotenv()

app = FastAPI(title="Magic Patterns API", description="AI-driven UI/UX generator API")

# Get allowed origins from environment or use development default
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in allowed_origins.split(",")] if allowed_origins != "*" else ["*"]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

class UIPrompt(BaseModel):
    text: str
    style: Optional[str] = None
    components: Optional[list] = None
    
class UIResponse(BaseModel):
    ui_code: str
    
@app.get("/")
async def read_root():
    return {"message": "Welcome to Magic Patterns API"}

@app.post("/generate-ui")
async def generate_ui(prompt: UIPrompt):
    try:
        if not prompt.text.strip():
            return {"ui_code": "<div class='p-4 bg-red-100 text-red-700 rounded-lg'><p>Prompt text cannot be empty</p></div>"}
        
        # Log the incoming request
        print(f"Received prompt: {prompt.text}")
        
        # Generate UI code
        ui_code = generate_ui_with_claude(prompt.text, style=prompt.style, components=prompt.components)
        
        # Log the response
        print(f"Generated UI code length: {len(ui_code)}")
        
        # Return response
        return {"ui_code": ui_code}
    except Exception as e:
        print(f"Error in generate_ui: {str(e)}")
        # Return a minimal UI with error message instead of raising an exception
        return {"ui_code": f"<div class='p-4 bg-red-100 text-red-700 rounded-lg'><p>Error generating UI: {str(e)}</p></div>"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)