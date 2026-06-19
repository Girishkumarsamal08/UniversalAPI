from fastapi import FastAPI, Depends, HTTPException
from .database import engine, get_db
from .models import Base, Integration
from .services import oauth_service
from .providers.hubspot_provider import HubspotProvider
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Unified API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default dev port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include OAuth router
app.include_router(oauth_service.router)

@app.get("/contacts/{provider}")
def get_contacts(provider: str, db: Session = Depends(get_db)):
    # Fetch token from DB for the provider
    integration = db.query(Integration).filter(Integration.provider == provider).first()
    
    if not integration:
        # Fallback for development if token isn't in DB yet
        token = "demo_token_123"
        print(f"Warning: No real token found for {provider}, using dummy token.")
    else:
        token = integration.access_token

    if provider == "hubspot":
        try:
            hubspot_client = HubspotProvider(token)
            data = hubspot_client.get_contacts()
            return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=404, detail=f"Provider {provider} not supported.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
