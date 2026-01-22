# Arc Wardens - Circle Wallet Management

A full-stack application for managing Circle wallets on Arc Testnet, featuring a modern React frontend and Flask backend API.

## Features

- **Wallet Set Management**: Create and manage wallet sets
- **Wallet Operations**: Create wallets, view balances
- **Faucet Integration**: Request test USDC from the faucet
- **Transfer Functionality**: Send USDC tokens between wallets

## Project Structure

```
Arc-Wardens/
├── Circle_wallet/          # Python wallet scripts
├── backend/                # Flask API server
│   ├── app.py             # Main Flask application
│   └── requirements.txt   # Python dependencies
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
└── README.md
```

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn
- Circle API credentials in `.env` file

## Setup

### 1. Backend Setup

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Make sure your .env file is in the project root with:
# CIRCLE_API_KEY=your_api_key
# CIRCLE_ENTITY_SECRET_BASE64=your_secret
# CIRCLE_PUBLIC_KEY_PEM=your_public_key
# (and other Circle credentials as needed)
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend

```bash
# From the project root
cd backend
python app.py
```

The backend will run on `http://localhost:5000`

### Start the Frontend

```bash
# From the project root
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API requests to the backend.

## Usage

1. **Create a Wallet Set**: Click "Create Wallet Set" to create a new wallet set. The Wallet Set ID will be displayed.

2. **Create a Wallet**: Use the Wallet Set ID (or leave empty to use the one from `.env`) and click "Create Wallet". The Wallet ID and Address will be displayed.

3. **Get Balance**: Enter a Wallet ID and click "Get Balance" to view token balances.

4. **Request Test USDC**: Enter a wallet address (or use the one from a created wallet) and click "Request Test USDC" to fund from the faucet.

5. **Send Transfer**: Fill in the wallet ID, destination address, amount, and token ID, then click "Send Transfer" to send USDC.

## Environment Variables

Create a `.env` file in the project root with:

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/wallet-set` - Create a wallet set
- `POST /api/wallet` - Create a wallet
- `GET /api/wallet/<wallet_id>/balance` - Get wallet balance
- `POST /api/faucet` - Request test USDC from faucet
- `POST /api/transfer` - Send USDC transfer

## Development

The frontend uses Vite for fast development with hot module replacement. The backend uses Flask with CORS enabled for development.

## License

MIT
