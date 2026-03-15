# CryptoAI Trading Dashboard

A professional-grade cryptocurrency trading dashboard with AI-powered signals, paper trading, and performance analytics.

## Features

### Signal Dashboard
- Real-time trading signals with buy/sell recommendations
- Signal strength and confidence metrics
- Technical indicator analysis
- Filter signals by type (all, buy, sell)
- Quick execution from signal cards

### Paper Trading
- Simulate trades without real money
- Track open and closed positions
- Record entry/exit prices and quantities
- Set stop loss and take profit levels
- Monitor P&L in real-time
- Full trade history

### Performance Analytics
- Cumulative P&L visualization
- Monthly returns chart
- Win/loss distribution
- Portfolio allocation by asset
- Trade statistics (total trades, win rate, etc.)
- Risk metrics (Sharpe ratio, drawdown, profit factor)

### Trading Alerts
- Price level alerts
- Signal-based alerts
- P&L milestone alerts
- Email and push notifications
- Alert management and history

### Settings & Configuration
- Risk management parameters
  - Maximum position size
  - Maximum daily loss
  - Risk per trade percentage
  - Leverage settings
- Trading preferences
- Notification settings
- API integration configuration

## Tech Stack

- **Frontend**: Vite, React 19, TypeScript
- **Styling**: Tailwind CSS v4, custom design system
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Real-time Updates**: REST API polling (WebSocket ready)

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)
- Python backend (for production)

### Installation Checkout

```bash
# 1. Start the backend
cd server
pip install -r requirements.txt
python api.py

# 2. Start the frontend
cd client
pnpm install
pnpm dev
```

The dashboard will be available at `http://localhost:5173`

## Environment Variables

```bash
# Backend API URL (optional, defaults to http://localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints Required

Your Python backend must implement the following endpoints:

#### Signals
- `GET /api/signals/latest` - Get latest signals
- `GET /api/signals/symbol/{symbol}` - Get signals for specific symbol
- `GET /api/signals/history?limit=50` - Get historical signals

#### Trading
- `POST /api/trades` - Create new trade
- `GET /api/trades` - Get all trades
- `GET /api/trades?status=OPEN|CLOSED` - Get trades by status
- `POST /api/trades/{id}/close` - Close a trade
- `GET /api/trades/stats` - Get trading statistics

#### Performance
- `GET /api/performance/summary` - Get performance summary
- `GET /api/performance/pnl?days=30` - Get P&L history
- `GET /api/performance/metrics` - Get detailed metrics

#### Alerts
- `POST /api/alerts` - Create alert
- `GET /api/alerts` - Get all alerts
- `DELETE /api/alerts/{id}` - Delete alert
- `PATCH /api/alerts/{id}/toggle` - Toggle alert status

#### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

#### Health
- `GET /api/health` - Health check endpoint

## Example Response Formats

### Signal Object
```json
{
  "id": "123",
  "symbol": "BTC/USDT",
  "type": "BUY",
  "strength": 8.5,
  "confidence": 92,
  "indicators": ["RSI", "MACD"],
  "timestamp": "2024-02-21T10:30:00Z"
}
```

### Trade Object
```json
{
  "id": "trade_123",
  "symbol": "BTC/USDT",
  "side": "LONG",
  "entryPrice": 43250.50,
  "entryTime": "2024-02-21T10:30:00Z",
  "exitPrice": null,
  "exitTime": null,
  "quantity": 0.5,
  "stopLoss": 41000,
  "takeProfit": 46000,
  "status": "OPEN",
  "pnl": null
}
```

## Project Structure

```
├── client/                 # Frontend (Vite/React)
│   ├── app/                # Root layout & pages
│   ├── components/         # Shared UI components
│   ├── hooks/              # React hooks
│   ├── lib/                # API client & utilities
│   ├── public/             # Static assets
│   └── styles/             # Global styles
├── server/                 # Backend (FastAPI/Python)
│   ├── api.py              # Main API entry point
│   ├── signal/             # AI Signal generation logic
│   ├── scripts/            # Backend utilities
│   └── requirements.txt    # Python dependencies
└── .env                    # Shared environment variables
```

## Security Considerations

- API keys stored in environment variables
- CORS configured for backend
- Input validation on all forms

## Performance Tips

- Reduce polling interval only if necessary
- Enable caching for chart data
- Use WebSocket for high-frequency updates
- Lazy load analytics charts
- Optimize images and assets

## Troubleshooting

### No signals appearing
1. Check `NEXT_PUBLIC_API_URL` is correct
2. Verify backend is running
3. Check browser console for API errors
4. Test `/api/signals/latest` endpoint

### Notifications not working
1. Allow notifications in browser settings
2. Check `Notification.permission === 'granted'`
3. Verify backend email service if using email alerts

### Charts not rendering
1. Check Recharts is installed
2. Verify data format matches expected schema
3. Clear browser cache and reload

## License

MIT License - See LICENSE file for details.
