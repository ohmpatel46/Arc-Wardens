"""
Script to list available Google Gemini models.
Uses the Google Generative AI API to fetch the list of available models.
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("Error: GOOGLE_API_KEY not found in environment variables")
    exit(1)

# Google Generative AI API endpoint for listing models
API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

print("Fetching available Gemini models...")
print(f"Using API Key: {GOOGLE_API_KEY[:20]}...")
print("-" * 80)

try:
    # Make request to list models
    response = requests.get(
        API_URL,
        params={"key": GOOGLE_API_KEY}
    )
    
    if response.status_code == 200:
        data = response.json()
        models = data.get("models", [])
        
        if not models:
            print("No models found.")
        else:
            print(f"\nFound {len(models)} available models:\n")
            
            # Filter and display models that support generateContent
            generate_content_models = []
            for model in models:
                name = model.get("name", "")
                display_name = model.get("displayName", "")
                supported_methods = model.get("supportedGenerationMethods", [])
                
                # Check if model supports generateContent
                if "generateContent" in supported_methods:
                    generate_content_models.append({
                        "name": name,
                        "display_name": display_name,
                        "methods": supported_methods
                    })
            
            print("Models that support 'generateContent' (for ChatGoogleGenerativeAI):")
            print("=" * 80)
            
            for model in sorted(generate_content_models, key=lambda x: x["name"]):
                model_id = model["name"].replace("models/", "")
                print(f"\nModel ID: {model_id}")
                if model["display_name"]:
                    print(f"  Display Name: {model['display_name']}")
                print(f"  Supported Methods: {', '.join(model['methods'])}")
            
            print("\n" + "=" * 80)
            print("\nRecommended models for LangChain ChatGoogleGenerativeAI:")
            print("- gemini-1.5-pro")
            print("- gemini-1.5-flash")
            print("- gemini-pro")
            print("\nNote: Use the model ID (without 'models/' prefix) in your code.")
            
    else:
        print(f"Error: API returned status code {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"Error fetching models: {str(e)}")
    import traceback
    traceback.print_exc()
