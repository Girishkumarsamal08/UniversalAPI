from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
import requests
import os
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Integration
from datetime import datetime, timedelta

router = APIRouter()

# For demonstration, using dummy IDs. These should be in .env.
CLIENT_ID = os.getenv("HUBSPOT_CLIENT_ID", "YOUR_HUBSPOT_CLIENT_ID")
CLIENT_SECRET = os.getenv("HUBSPOT_SECRET", "YOUR_HUBSPOT_SECRET")
REDIRECT_URI = "http://localhost:8000/auth/hubspot/callback"

AUTH_URL = "https://app.hubspot.com/oauth/authorize"
TOKEN_URL = "https://api.hubapi.com/oauth/v1/token"

@router.get("/auth/hubspot/start")
def start_oauth():
    url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=contacts"
    return RedirectResponse(url)

@router.get("/auth/hubspot/callback")
def oauth_callback(code: str, db: Session = Depends(get_db)):
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "code": code,
    }

    response = requests.post(TOKEN_URL, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch token from HubSpot")
        
    token_data = response.json()
    
    # Store token in DB
    integration = db.query(Integration).filter(Integration.provider == "hubspot").first()
    if not integration:
        integration = Integration(provider="hubspot")
        db.add(integration)
    
    integration.access_token = token_data.get("access_token")
    integration.refresh_token = token_data.get("refresh_token")
    
    expires_in = token_data.get("expires_in", 3600)
    integration.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    
    db.commit()
    
    return {"status": "success", "message": "HubSpot connected successfully!"}
