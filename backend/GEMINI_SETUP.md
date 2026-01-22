# Google Gemini API Setup Guide

This guide will help you set up Google Gemini API keys for the Arc Wardens campaign agent.

## Step 1: Get Your Google API Key

1. **Go to Google AI Studio**
   - Visit: https://makersuite.google.com/app/apikey
   - Or visit: https://aistudio.google.com/app/apikey

2. **Sign in with your Google Account**
   - Use your Google account to sign in

3. **Create a new API key**
   - Click "Create API Key" button
   - Select an existing Google Cloud project or create a new one
   - The API key will be generated automatically

4. **Copy your API key**
   - Copy the generated API key immediately (you won't be able to see it again)
   - It will look something like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

## Step 2: Add API Key to Your Environment

Add the following to your `.env` file in the project root:

```env
# Google Gemini API Key (for LangChain agent)
GOOGLE_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the actual API key you copied from Google AI Studio.

## Step 3: Install Dependencies

Make sure you have the updated requirements installed:

```bash
cd backend
pip install -r requirements.txt
```

The updated requirements include:
- `langchain-google-genai==1.0.0` (replaces `langchain-openai`)

## Step 4: Verify Setup

1. Start your backend server:
   ```bash
   python server.py
   ```

2. The agent will now use Gemini models instead of OpenAI:
   - Default model: `gemini-1.5-pro`
   - Alternative: `gemini-1.5-flash` (faster, cheaper)

## Available Gemini Models

You can change the model in `backend/agents/campaign_agent.py`:

- `gemini-1.5-pro` - Best for complex tasks (default)
- `gemini-1.5-flash` - Faster and more cost-effective
- `gemini-pro` - Previous generation (still available)

## Free Tier Limits

Google AI Studio provides:
- **Free tier**: 15 requests per minute (RPM)
- **Rate limits**: May vary based on usage
- **No credit card required** for free tier

For production use, consider:
- Google Cloud Vertex AI (higher rate limits)
- Paid Google AI Studio plan

## Troubleshooting

### Error: "API key not valid"
- Make sure your API key is correctly set in the `.env` file
- Verify there are no extra spaces or quotes around the key
- Check that you're using the correct environment variable name: `GOOGLE_API_KEY`

### Error: "Rate limit exceeded"
- You've exceeded the free tier limits (15 RPM)
- Wait a minute and try again
- Consider upgrading to a paid plan for higher limits

### Error: "Model not found"
- Make sure you're using a valid model name
- Check that the model is available in your region
- Try using `gemini-1.5-flash` as an alternative

## Security Notes

- **Never commit your API key to version control**
- Keep your `.env` file in `.gitignore`
- Rotate your API key if it's accidentally exposed
- Use environment variables in production deployments
