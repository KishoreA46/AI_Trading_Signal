import os
import sys
import json
import time
import requests
from requests import Session
from requests.adapters import HTTPAdapter
import urllib.parse
import random
import asyncio
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import hmac
import hashlib
import xml.etree.ElementTree as ET

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Global Session for connection pooling (Significant speedup for HTTPS)
session = Session()
adapter = HTTPAdapter(pool_connections=100, pool_maxsize=100)
session.mount('https://', adapter)
session.mount('http://', adapter)



def fetch_klines_from_binance(symbol: str, interval: str, limit: int = 500):
    """
    Helper to fetch klines directly from Binance Futures API.
    Supports fetching more than the 1500 limit by pagination.
    """
    try:
        url = "https://fapi.binance.com/fapi/v1/klines"
        all_klines = []
        target_limit = limit
        
        while len(all_klines) < target_limit:
            current_limit = min(target_limit - len(all_klines), 1500)
            params = {
                "symbol": f"{symbol}USDT",
                "interval": interval,
                "limit": current_limit
            }
            if all_klines:
                # Use the open time of the first candle in our list as endTime to fetch earlier candles
                # Actually, Binance fetches from 'endTime' BACKWARDS or 'startTime' FORWARDS.
                # Default is latest. To get older ones, we need to set endTime to the earliest open time we have.
                params["endTime"] = int(all_klines[0][0]) - 1
            
            resp = session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            
            if not data:
                break
                
            # Prepend because we are fetching backwards in time
            all_klines = data + all_klines
            
            # If we got fewer than requested, we hit the beginning of history
            if len(data) < current_limit:
                break
                
        return all_klines[-target_limit:] # Ensure exactly target_limit if we over-fetched
    except Exception as e:
        print(f"Error fetching klines from Binance: {e}")
        return None
# Add the signal directory to sys.path and import ai_signal
sys.path.append(os.path.join(os.path.dirname(__file__), 'signal'))
try:
    import ai_signal
except ImportError:
    print("WARNING: ai_signal module not found. Signals may not work.")

from contextlib import asynccontextmanager

async def background_signal_refresh():
    """Periodically refreshes the global signal cache."""
    print("Starting background signal refresh task...")
    while True:
        try:
            # Pre-warm cache for the dashboard (1h timeframe)
            # Scan all supported coins sequentially
            supported_coins = getattr(ai_signal, 'SUPPORTED_COINS', ["BTC", "ETH", "SOL", "BNB", "XRP"])
            prewarmed = []
            for coin in supported_coins:
                sig = await get_latest_signals(timeframe="1h", single_symbol=f"{coin}/USDT", bypass_cache=True)
                if sig: prewarmed.append(sig[0])
                await asyncio.sleep(1) # Faster breath between coins since we have more now

            SIGNAL_CACHE["data"] = prewarmed
            SIGNAL_CACHE["timestamp"] = time.time()
            SIGNAL_CACHE["timeframe"] = "1h"
            save_cache() # Save to disk after successful pre-warm
            print(f"Signal cache updated at {datetime.now()}. Scanned {len(prewarmed)} coins.")
        except Exception as e:
            print(f"Error refreshing signal cache: {e}")
        
        await asyncio.sleep(CACHE_TTL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("--- AI TRADING BACKEND STARTING ---")
    print(f"Time: {datetime.now()}")
    
    # 1. Try initial Binance Sync (Disabled - Market Data only)
    # portfolio.sync_with_binance()
    
    # 0. Load persistent cache (Disabled to ensure signals are manual)
    # load_cache()
    
    # 2. Start background workers
    asyncio.create_task(update_pnls())
    # asyncio.create_task(background_signal_refresh()) # Disabled - Signal scan should be manual
    asyncio.create_task(background_market_data_update())
    asyncio.create_task(background_news_refresh())
    print("--- BACKGROUND TASKS STARTED ---")
    yield
    print("--- AI TRADING BACKEND SHUTTING DOWN ---")

app = FastAPI(lifespan=lifespan)

# Binance API Keys from environment
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY", "")
BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET", "")

if not BINANCE_API_KEY or not BINANCE_API_SECRET:
    print("WARNING: Binance API keys not found in .env file. Running in Demo/Paper mode.")
else:
    print(f"SUCCESS: Binance API keys loaded (Key ends in ...{BINANCE_API_KEY[-4:] if len(BINANCE_API_KEY) > 4 else '****'})")

def binance_signed_request(method, endpoint, params=None):
    """Helper to make signed requests to Binance Futures API."""
    if not BINANCE_API_KEY or not BINANCE_API_SECRET:
        return None
    
    if params is None: params = {}
    url_base = "https://fapi.binance.com"
    params['timestamp'] = int(time.time() * 1000)
    params['recvWindow'] = 5000
    
    query_string = urllib.parse.urlencode(params)
    signature = hmac.new(
        BINANCE_API_SECRET.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    headers = {'X-MBX-APIKEY': BINANCE_API_KEY}
    full_url = f"{url_base}{endpoint}?{query_string}&signature={signature}"
    
    try:
        if method == "GET":
            resp = session.get(full_url, headers=headers, timeout=10)
        elif method == "POST":
            resp = session.post(full_url, headers=headers, timeout=10)
        else:
            return None
        return resp.json()
    except Exception as e:
        print(f"Binance API Communication Error: {e}")
        return None

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SignalResponse(BaseModel):
    id: str
    symbol: str
    type: str # BUY, SELL, FLAT
    strength: float
    confidence: int
    indicators: List[str]
    timestamp: str
    price: float
    entry: float
    stop_loss: Optional[float]
    take_profit: Optional[float]
    take_profit2: Optional[float] = None
    take_profit3: Optional[float] = None
    accuracy: float = 0.0

class MarketCoin(BaseModel):
    symbol: str
    price: float
    change24h: float
    high24h: float
    low24h: float
    volume: float
    quoteVolume: float

# Professional Simulation Constants
FEE_RATE = Decimal('0.0004') # 0.04% Binance Taker Fee simulation

class TradeCreate(BaseModel):
    symbol: str
    side: str # LONG (or BUY), SHORT (or SELL)
    entryPrice: float
    quantity: float # Quantity of contracts for Futures
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    takeProfit2: Optional[float] = None
    takeProfit3: Optional[float] = None
    trailingStop: bool = False
    market_type: str = "FUTURES" # Defaulting to Futures for this platform
    leverage: float = 1.0 # Only for FUTURES
    position_size: Optional[float] = None # Calculated or provided

class TradeClose(BaseModel):
    exitPrice: float
    quantity: Optional[float] = None # Support for partial close

class AlertCreate(BaseModel):
    symbol: str
    targetPrice: float
    condition: str # ABOVE, BELOW

# In-memory storage and Logic Managers
SIGNAL_CACHE = {"timestamp": 0, "data": [], "timeframe": "1h"}
CACHE_TTL = 300 # 5 minutes
PERSISTENT_CACHE_FILE = os.path.join(os.path.dirname(__file__), "signal_cache.json")

def save_cache():
    try:
        with open(PERSISTENT_CACHE_FILE, 'w') as f:
            json.dump(SIGNAL_CACHE, f)
    except: pass

def load_cache():
    global SIGNAL_CACHE
    try:
        if os.path.exists(PERSISTENT_CACHE_FILE):
            with open(PERSISTENT_CACHE_FILE, 'r') as f:
                data = json.load(f)
                if time.time() - data.get("timestamp", 0) < 3600: # Only if less than 1 hour old
                    SIGNAL_CACHE = data
                    print(f"Loaded {len(SIGNAL_CACHE.get('data', []))} signals from persistent cache.")
    except: pass

# Market data cache
MARKET_DATA_CACHE = {"timestamp": 0, "data": []}
MARKET_CACHE_TTL = 10 # 10 seconds for price/volume updates
BINANCE_TICKER_CACHE = {"timestamp": 0, "data": []}
CMC_RANKING_CACHE = {"timestamp": 0, "symbols": []}
CMC_RANKING_TTL = 3600 # 1 hour for top-coin ranking

class PortfolioManager:
    def __init__(self, initial_capital: float = 10000.0):
        self.usdt_balance = Decimal(str(initial_capital))
        self.coin_allocations = {} # symbol -> Decimal (budget/limit)
        self.realized_pnl = Decimal('0')
        self.initial_capital = Decimal(str(initial_capital))
        self.additions_today = 0
        self.last_addition_date = datetime.now().date()
        self.is_live = False # Track if we are synced with real Binance

    async def sync_with_binance(self):
        """Fetch actual balance from Binance Futures."""
        if not BINANCE_API_KEY or not BINANCE_API_SECRET:
            return False
            
        data = binance_signed_request("GET", "/fapi/v2/balance")
        if data and isinstance(data, list):
            # Find USDT account
            for asset in data:
                if asset.get('asset') == 'USDT':
                    balance = Decimal(str(asset.get('balance', 0)))
                    # Available to withdraw/allocate is 'availableBalance'
                    # But for 'Capital' we usually want total wallet balance or margin balance
                    margin_balance = Decimal(str(asset.get('marginBalance', balance)))
                    
                    # Update local state
                    # Note: We only update unallocated balance if we aren't using strict buckets
                    # but for simplicity let's update total if this is first sync
                    if not self.is_live:
                         self.initial_capital = margin_balance
                         self.usdt_balance = margin_balance
                         self.is_live = True
                    else:
                         # Keep track of changes
                         self.usdt_balance = margin_balance - sum(self.coin_allocations.values())
                    
                    # print(f"[Portfolio] Synced with Binance. Wallet Balance: {margin_balance} USDT")
                    return True
        return False

    def get_futures_margin_used(self, trades: List[Dict]) -> Decimal:
        return sum(Decimal(str(t.get('margin_used', 0))) 
                   for t in trades if t['status'] == 'OPEN')

    def get_unrealized_pnl(self, trades: List[Dict]) -> Decimal:
        return sum(Decimal(str(t.get('unrealized_pnl', 0))) 
                   for t in trades if t['status'] == 'OPEN')

    def deposit(self, amount: float) -> tuple[bool, str]:
        now = datetime.now()
        today = now.date()
        if self.last_addition_date != today:
            self.additions_today = 0
            self.last_addition_date = today
        if self.additions_today >= 3:
            return False, "Daily limit of 3 additions reached"
        amount_dec = Decimal(str(amount))
        if amount_dec <= 0:
            return False, "Amount must be positive"

        self.initial_capital += amount_dec
        self.usdt_balance += amount_dec
        self.additions_today += 1
        return True, "Success"

    def set_initial_capital(self, amount: float) -> tuple[bool, str]:
        new_total = Decimal(str(amount))
        # Check if we have enough total to cover current symbol allocations
        allocated_total = sum(self.coin_allocations.values())
        if new_total < allocated_total:
            return False, f"Total capital cannot be less than current allocations (${to_float(allocated_total)})"
        
        diff = new_total - self.initial_capital
        self.initial_capital = new_total
        self.usdt_balance += diff
        return True, "Success"

    def allocate(self, symbol: str, amount: float) -> tuple[bool, str]:
        amount_dec = Decimal(str(amount))
        # Standardize symbol for lookup
        sym = symbol.upper().replace("-", "/")
        if not sym.endswith("/USDT") and "/" not in sym:
            sym = f"{sym}/USDT"

        # Support removing allocation by passing 0 or negative
        if amount_dec <= 0:
            if sym in self.coin_allocations:
                # Return all remaining capital in this bucket to unallocated usdt_balance
                self.usdt_balance += self.coin_allocations[sym]
                del self.coin_allocations[sym]
            return True, "Success"
        
        existing = self.coin_allocations.get(sym, Decimal('0'))
        diff = amount_dec - existing
        
        # Check if we have enough unallocated USDT to increase this allocation
        if diff > 0 and self.usdt_balance < diff:
            return False, f"Insufficient unallocated USDT. Available: ${to_float(self.usdt_balance)}"
            
        self.usdt_balance -= diff
        self.coin_allocations[sym] = amount_dec
        return True, "Success"

    def get_equity(self, trades: List[Dict], current_prices: Dict[str, Decimal]) -> Decimal:
        # Equity = Available USDT (unallocated) + Allocated USDT buckets + Margins in open trades + Unrealized PnL
        allocated_total = sum(self.coin_allocations.values())
        margin_frozen = self.get_futures_margin_used(trades)
        futures_upnl = self.get_unrealized_pnl(trades)
        return self.usdt_balance + allocated_total + margin_frozen + futures_upnl

    def get_symbol_exposures(self, trades: List[Dict]) -> Dict[str, Decimal]:
        """Total capital committed to each symbol: Available Bucket + Current Margin."""
        exposures = {s: v for s, v in self.coin_allocations.items()}
        for t in [t for t in trades if t["status"] == "OPEN"]:
            sym = t["symbol"]
            margin = Decimal(str(t.get("margin_used", 0)))
            exposures[sym] = exposures.get(sym, Decimal('0')) + margin
        return exposures

    def reset_portfolio(self):
        self.usdt_balance = Decimal('10000.0')
        self.initial_capital = Decimal('10000.0')
        self.coin_allocations = {}
        self.realized_pnl = Decimal('0')
        self.additions_today = 0

    @property
    def cash_balance(self):
        # UI compat: cash balance is usdt_balance
        return self.usdt_balance

portfolio = PortfolioManager()
trades_db = []
alerts_db = []
watchlist_db = set(["BTC/USDT", "ETH/USDT"])

# --- WebSocket Manager ---
class KlineConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, symbol: str, interval: str):
        try:
            await websocket.accept()
            key = f"{symbol.upper()}_{interval}"
            if key not in self.active_connections:
                self.active_connections[key] = []
            self.active_connections[key].append(websocket)
            print(f"[KlineManager] Accepted connection for {key}. Total connections: {len(self.active_connections[key])}")
            return key
        except Exception as e:
            print(f"[KlineManager] Failed to accept connection: {e}")
            raise e

    def disconnect(self, websocket: WebSocket, key: str):
        if key in self.active_connections:
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]

    async def broadcast(self, key: str, message: dict):
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                try:
                    await connection.send_json(message)
                except:
                    pass

kline_manager = KlineConnectionManager()

async def binance_kline_listener(symbol: str, interval: str):
    """
    Background worker that listens to Binance WS and broadcasts to local clients.
    Includes retry logic for stability.
    """
    import websockets
    key = f"{symbol.upper()}_{interval}"
    # Binance uses lowercase for streams
    stream_symbol = symbol.lower().replace("/", "").replace("-", "")
    url = f"wss://fstream.binance.com/ws/{stream_symbol}@kline_{interval}"
    
    retry_count = 0
    while key in kline_manager.active_connections:
        print(f"[{key}] Connecting to Binance WS: {url} (Attempt {retry_count + 1})")
        try:
            async with websockets.connect(url, ping_interval=20, ping_timeout=20, close_timeout=10) as ws:
                retry_count = 0 # Reset on success
                while key in kline_manager.active_connections:
                    try:
                        data = await asyncio.wait_for(ws.recv(), timeout=30)
                        msg = json.loads(data)
                        if "k" in msg:
                            k = msg["k"]
                            payload = {
                                "time": int(k["t"] / 1000),
                                "open": float(k["o"]),
                                "high": float(k["h"]),
                                "low": float(k["l"]),
                                "close": float(k["c"]),
                                "volume": float(k["v"]),
                                "isFinal": k["x"]
                            }
                            await kline_manager.broadcast(key, payload)
                    except asyncio.TimeoutError:
                        # Just a ping/pong or silent period, perfectly fine
                        continue
        except Exception as e:
            print(f"[{key}] Binance WS error: {e}")
            retry_count += 1
            wait_time = min(32, 2 ** retry_count)
            print(f"[{key}] Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)
        
    print(f"Stopping Binance WS listener for {key}.")
    if key in active_ws_tasks:
        del active_ws_tasks[key]

active_ws_tasks = {}

def to_float(d: Any) -> float:
    if isinstance(d, Decimal):
        return float(d.quantize(Decimal('0.00000001'), rounding=ROUND_HALF_UP))
    return float(d)

def close_trade_logic(trade, exit_price_val, reason, qty_to_close_val):
    """
    Shared logic for closing (partially or fully) a position with fees and P&L.
    """
    exit_p = Decimal(str(exit_price_val))
    qty_to_close = Decimal(str(qty_to_close_val))
    entry = Decimal(str(trade['entryPrice']))
    original_margin = Decimal(str(trade.get('margin_used', 0)))
    total_qty = Decimal(str(trade['quantity']))
    
    # Calculate PnL for the portion being closed
    # Formula: (Quantity * (Exit - Entry)) / Entry for LONG
    # But wait, position_size = quantity * entry_price. 
    # So PnL = qty_to_close * (exit - entry) for LONG
    if trade['side'].upper() == 'LONG':
        portion_pnl = qty_to_close * (exit_p - entry)
    else: # SHORT
        portion_pnl = qty_to_close * (entry - exit_p)
    
    # Calculate fees for the portion being closed (0.04% of closed position size)
    closed_pos_value = qty_to_close * exit_p
    fee = closed_pos_value * FEE_RATE
    
    # Calculate margin being released
    # Proportional to quantity closed
    margin_to_release = (qty_to_close / total_qty) * original_margin
    
    # Return Margin + PnL - Fees to original source
    net_return = margin_to_release + portion_pnl - fee
    
    if trade.get("used_allocation"):
        if trade["symbol"] in portfolio.coin_allocations:
            portfolio.coin_allocations[trade["symbol"]] += net_return
        else:
            portfolio.usdt_balance += net_return
    else:
        portfolio.usdt_balance += net_return
    
    portfolio.realized_pnl += (portion_pnl - fee)
    
    # Update trade stats
    trade['realized_pnl_from_partials'] += to_float(portion_pnl - fee)
    trade['quantity'] = to_float(total_qty - qty_to_close)
    trade['margin_used'] = to_float(original_margin - margin_to_release)
    trade['position_size'] = trade['quantity'] * to_float(entry)
    
    if trade['quantity'] <= 0.00000001:
        trade['status'] = 'CLOSED'
        trade['exitPrice'] = to_float(exit_p)
        trade['exitTime'] = datetime.now(timezone.utc).isoformat()
        trade['pnl'] = trade['realized_pnl_from_partials']
        trade['close_reason'] = reason
    
# --- News Caching & Persistence ---
NEWS_CACHE = {"timestamp": 0, "data": []}
NEWS_CACHE_TTL = 60 # 1 minute

# --- News Aggregator ---
NEWS_SOURCES = [
    {"name": "Cointelegraph", "url": "https://cointelegraph.com/rss"},
    {"name": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/"}
]

async def fetch_crypto_news_async(symbol: Optional[str] = None) -> List[Dict]:
    """Concurrent news fetching utilizing connection pooling."""
    if not symbol and NEWS_CACHE["data"] and time.time() - NEWS_CACHE["timestamp"] < NEWS_CACHE_TTL:
        return NEWS_CACHE["data"]

    async def fetch_one(source):
        try:
            resp = await asyncio.to_thread(session.get, source["url"], timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
            if resp.status_code != 200: return []
            
            root = ET.fromstring(resp.content)
            items = root.findall('.//item')
            results = []
            for item in items:
                title = item.find('title').text if item.find('title') is not None else ""
                link = item.find('link').text if item.find('link') is not None else ""
                description = item.find('description').text if item.find('description') is not None else ""
                pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
                
                image = ""
                enclosure = item.find('enclosure')
                if enclosure is not None and 'url' in enclosure.attrib:
                    image = enclosure.attrib['url']
                else:
                    media = item.find('{http://search.yahoo.com/mrss/}content')
                    if media is not None and 'url' in media.attrib:
                        image = media.attrib['url']
                
                if symbol:
                    base_sym = symbol.split('/')[0].upper()
                    if base_sym not in title.upper() and base_sym not in description.upper():
                        continue
                
                import re
                clean_desc = re.sub('<[^<]+?>', '', description)[:150] + "..."
                
                results.append({
                    "title": title,
                    "link": link,
                    "description": clean_desc,
                    "source": source["name"],
                    "timestamp": pub_date,
                    "category": symbol if symbol else "Market",
                    "image": image
                })
            return results
        except: return []

    all_results = await asyncio.gather(*[fetch_one(s) for s in NEWS_SOURCES])
    news_list = [item for sublist in all_results for item in sublist]
    
    # Randomly shuffle and sort is expensive, just sample
    random.shuffle(news_list)
    top_news = news_list[:30]

    if not symbol:
        NEWS_CACHE["data"] = top_news
        NEWS_CACHE["timestamp"] = time.time()
    
    return top_news

async def background_news_refresh():
    """Periodically refreshes news in background."""
    while True:
        try:
            await fetch_crypto_news_async()
            # print("News cache refreshed.")
        except: pass
        await asyncio.sleep(NEWS_CACHE_TTL)

@app.get("/api/news")
async def get_general_news():
    return await fetch_crypto_news_async()

@app.get("/api/news/{symbol}")
async def get_symbol_news(symbol: str):
    """Get news for a specific symbol."""
    # Standardize symbol
    clean_symbol = symbol.replace('-', '/')
    return await fetch_crypto_news_async(clean_symbol)

async def update_pnls():
    """Background task to update unrealized PnL and check SL/TP/Alerts."""
    global BINANCE_TICKER_CACHE
    while True:
        try:
            # Fetch 24h ticker for prices AND volume (liquidity)
            url = "https://fapi.binance.com/fapi/v1/ticker/24hr"
            resp = await asyncio.to_thread(session.get, url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                # Update global ticker cache for other endpoints to reuse
                BINANCE_TICKER_CACHE["data"] = data
                BINANCE_TICKER_CACHE["timestamp"] = time.time()
                
                prices = {item['symbol']: Decimal(item.get('lastPrice', item.get('price', 0))) for item in data}
                volumes = {item['symbol']: Decimal(item.get('quoteVolume', 0)) for item in data}
                
                # 1. Update Trades
                for trade in [t for t in trades_db if t["status"] == "OPEN"]:
                    sym_key = trade['symbol'].replace('/', '')
                    if sym_key in prices:
                        curr_price = prices[sym_key]
                        trade['liquidity'] = to_float(volumes.get(sym_key, 0)) # Store live 24h volume
                        entry = Decimal(str(trade['entryPrice']))
                        quantity = Decimal(str(trade['quantity']))
                        pos_size = quantity * entry # Current size
                        leverage = Decimal(str(trade.get('leverage', 1.0)))
                        
                        # Calculate PnL for the current remaining quantity
                        if trade['side'].upper() == 'LONG':
                            pnl = (pos_size * (curr_price - entry)) / entry
                            # Trailing Stop Logic
                            if trade.get('trailingStop'):
                                activation = Decimal(str(trade.get('trailing_activation_price', entry)))
                                if curr_price > activation:
                                    # Move SL up
                                    trail_dist = activation * Decimal('0.015') # 1.5% trail
                                    new_sl = curr_price - trail_dist
                                    old_sl = Decimal(str(trade.get('stopLoss') or 0))
                                    if new_sl > old_sl:
                                        trade['stopLoss'] = to_float(new_sl)
                                    trade['trailing_activation_price'] = to_float(curr_price)

                            condition_sl = curr_price <= Decimal(str(trade.get('stopLoss') or 0)) if trade.get('stopLoss') else False
                            
                            # Check TP Targets
                            targets = [
                                ('TP1', trade.get('takeProfit'), 0.5),
                                ('TP2', trade.get('takeProfit2'), 0.5), # 50% of remaining
                                ('TP3', trade.get('takeProfit3'), 1.0)  # Close all
                            ]
                        else: # SHORT
                            pnl = (pos_size * (entry - curr_price)) / entry
                            # Trailing Stop Logic
                            if trade.get('trailingStop'):
                                activation = Decimal(str(trade.get('trailing_activation_price', entry)))
                                if curr_price < activation:
                                    # Move SL down
                                    trail_dist = activation * Decimal('0.015') # 1.5% trail
                                    new_sl = curr_price + trail_dist
                                    old_sl = Decimal(str(trade.get('stopLoss') or 9999999))
                                    if new_sl < old_sl:
                                        trade['stopLoss'] = to_float(new_sl)
                                    trade['trailing_activation_price'] = to_float(curr_price)

                            condition_sl = curr_price >= Decimal(str(trade.get('stopLoss') or 9999999)) if trade.get('stopLoss') else False
                            
                            targets = [
                                ('TP1', trade.get('takeProfit'), 0.5),
                                ('TP2', trade.get('takeProfit2'), 0.5),
                                ('TP3', trade.get('takeProfit3'), 1.0)
                            ]

                        # Check Liquidation (-100% ROE)
                        margin_frozen = Decimal(str(trade.get('margin_used', 0)))
                        if margin_frozen > 0 and pnl <= -margin_frozen:
                            close_trade_logic(trade, curr_price, "LIQUIDATED", quantity)
                            continue

                        # Check Stop Loss
                        if condition_sl:
                            close_trade_logic(trade, curr_price, "STOPPED OUT", quantity)
                            continue

                        # Check Take Profits
                        for target_id, target_price, pct in targets:
                            if not target_price or target_id in trade.get('targets_hit', []):
                                continue
                            
                            tp_hit = False
                            target_price_dec = Decimal(str(target_price))
                            if trade['side'].upper() == 'LONG':
                                if curr_price >= target_price_dec: tp_hit = True
                            else:
                                if curr_price <= target_price_dec: tp_hit = True
                            
                            if tp_hit:
                                if pct < 1.0:
                                    # Partial Close
                                    qty_to_close = quantity * Decimal(str(pct))
                                    close_trade_logic(trade, curr_price, f"TARGET {target_id}", qty_to_close)
                                    trade.setdefault('targets_hit', []).append(target_id)
                                    break
                                else:
                                    # Final Close
                                    close_trade_logic(trade, curr_price, f"TARGET {target_id}", quantity)
                                    break
                        
                        if trade['status'] == 'OPEN':
                            trade['unrealized_pnl'] = to_float(pnl)
                            trade['current_price'] = to_float(curr_price)
                        else:
                            trade['unrealized_pnl'] = 0

                # 2. Update Alerts
                for alert in [a for a in alerts_db if a['status'] == 'ACTIVE']:
                    sym_key = alert['symbol'].replace('/', '')
                    if sym_key in prices:
                        curr_price = prices[sym_key]
                        target = Decimal(str(alert['targetPrice']))
                        triggered = False
                        if alert['condition'] == 'ABOVE' and curr_price >= target: triggered = True
                        elif alert['condition'] == 'BELOW' and curr_price <= target: triggered = True
                        
                        if triggered:
                            alert['status'] = 'TRIGGERED'
                            alert['triggeredAt'] = datetime.now(timezone.utc).isoformat()
                            alert['triggerPrice'] = to_float(curr_price)
            # 3. Periodically sync real balance (Disabled - Market Data only)
            # portfolio.sync_with_binance()
            
            await asyncio.sleep(5) 
        except Exception as e:
            print(f"Error in background task: {e}")
            await asyncio.sleep(10)

def scan_single_coin(coin: str, timeframe: str):
    """Worker function to scan a single coin using AI Signal v6 logic."""
    try:
        # Map timeframe if needed (v6 expects 1H, 4H, etc. uppercase)
        tf_key = timeframe.upper()
        if tf_key not in ["15M", "30M", "1H", "4H", "1D"]:
             # Rollback to 1h if timeframe is not supported by v6 engine
             tf_key = "1H"
             
        # Call the v6 signal generator
        res = ai_signal.get_v6_signal(coin, tf_key)
        if not res: return None
        
        # Format for dashboard
        return {
            "id": f"{coin}-{int(time.time())}",
            "symbol": res["symbol"],
            "type": res["type"],
            "strength": res["strength"],
            "confidence": res["confidence"],
            "indicators": res["indicators"],
            "timestamp": res["timestamp"],
            "price": res["price"],
            "entry": res["entry"],
            "stop_loss": res["stop_loss"],
            "take_profit": res["take_profit"],
            "take_profit2": res.get("take_profit2"),
            "take_profit3": res.get("take_profit3"),
            "volume": res.get("volume", 0),
            "accuracy": res.get("accuracy", 0),
            "timeframe": timeframe
        }
    except Exception as e:
        print(f"Error scanning {coin}: {e}")
        return None

# Semaphore to limit concurrent AI model trainings (prevents CPU pegging)
SCAN_SEMAPHORE = asyncio.Semaphore(2) 

async def get_latest_signals(timeframe: str = "1h", limit: int = 10, single_symbol: str = None, bypass_cache: bool = False):
    """
    Get latest signals for top coins or a specific coin (limited concurrency & cached).
    """
    # 1. Check cache for general dashboard OR single symbol requests
    if not bypass_cache and SIGNAL_CACHE["timestamp"] > time.time() - CACHE_TTL and SIGNAL_CACHE["timeframe"] == timeframe:
        if not single_symbol:
            return SIGNAL_CACHE["data"]
        else:
            # Look for this specific coin in the global cache
            coin_base = single_symbol.split('/')[0].upper()
            for sig in SIGNAL_CACHE["data"]:
                if sig['symbol'].split('/')[0].upper() == coin_base:
                    # print(f"Serving cached signal for {coin_base}")
                    return [sig]

    # 2. Define coins to scan if NOT in cache
    if single_symbol:
        coins_to_scan = [single_symbol.split('/')[0]]
    else:
        # Default top coins to scan for dashboard
        coins_to_scan = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "MATIC", "DOT", "LINK"]
        coins_to_scan = coins_to_scan[:limit]
    # 3. Execution with Semaphore control
    async def wrapped_scan(coin):
        async with SCAN_SEMAPHORE:
            return await asyncio.to_thread(scan_single_coin, coin, timeframe)

    results = await asyncio.gather(*[wrapped_scan(coin) for coin in coins_to_scan])
    
    final_results = [r for r in results if r is not None]
    
    # 4. Update cache if this was a general scan
    if not single_symbol:
        SIGNAL_CACHE["data"] = final_results
        SIGNAL_CACHE["timestamp"] = time.time()
        SIGNAL_CACHE["timeframe"] = timeframe
        
    return final_results

def scan_single_coin_sync(coin: str, timeframe: str):
    """Synchronous wrapper for parallel thread execution."""
    return scan_single_coin(coin, timeframe)

@app.get("/api/signals/mock")
async def get_mock_signals():
    """Returns a set of high-quality mock signals for demonstration."""
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "id": "mock-btc-1",
            "symbol": "BTC/USDT",
            "type": "BUY",
            "strength": 8.5,
            "confidence": 92,
            "indicators": ["RSI Oversold", "EMA Cross", "Bullish Divergence"],
            "timestamp": now,
            "price": 64200.50,
            "entry": 64100.00,
            "stop_loss": 62500.00,
            "take_profit": 68000.00,
            "take_profit2": 71000.00,
            "take_profit3": 75000.00,
            "accuracy": 88.5
        },
        {
            "id": "mock-eth-1",
            "symbol": "ETH/USDT",
            "type": "SELL",
            "strength": 7.2,
            "confidence": 85,
            "indicators": ["MACD Bearish", "Resistance Rejection"],
            "timestamp": now,
            "price": 3450.25,
            "entry": 3460.00,
            "stop_loss": 3600.00,
            "take_profit": 3200.00,
            "take_profit2": 3000.00,
            "take_profit3": 2800.00,
            "accuracy": 82.1
        },
        {
            "id": "mock-sol-1",
            "symbol": "SOL/USDT",
            "type": "BUY",
            "strength": 9.1,
            "confidence": 95,
            "indicators": ["Volume Spike", "Trendline Breakout"],
            "timestamp": now,
            "price": 145.80,
            "entry": 145.00,
            "stop_loss": 138.00,
            "take_profit": 165.00
        }
    ]

KLINES_CACHE = {} # {symbol_timeframe: {"timestamp": t, "data": []}}
KLINES_CACHE_TTL = 60 # Cache chart data for 60 seconds

@app.get("/api/klines/{symbol}")
async def get_klines(symbol: str, timeframe: str = "1h", limit: int = 1000):
    """
    Get historical kline (OHLCV) data for a specific symbol.
    """
    limit = max(1000, limit)
    # Normalize timeframe for Binance (e.g. 1d instead of 1D)
    tf = timeframe.lower()
    
    # The frontend passes "BTC-USDT" or "BTC/USDT", so we strip it.
    base_symbol = symbol.replace('-USDT', '').replace('/USDT', '').replace('-', '').replace('/', '').upper()
    cache_key = f"{base_symbol}_{tf}_{limit}"

    # 1. Return from cache if fresh
    if cache_key in KLINES_CACHE:
        entry = KLINES_CACHE[cache_key]
        if time.time() - entry["timestamp"] < KLINES_CACHE_TTL:
            return entry["data"]

    try:
        print(f"[API] Fetching {limit} klines for {base_symbol} ({tf})...")
        t0 = time.time()
        raw_klines = await asyncio.to_thread(fetch_klines_from_binance, base_symbol, tf, limit=limit)
        
        if not raw_klines:
             print(f"[API] No klines returned for {base_symbol}")
             return []

        # Format for lightweight-charts: {time, open, high, low, close}
        print(f"[API] Formatting {len(raw_klines)} candles (took {time.time()-t0:.2f}s)")
        formatted = []
        for k in raw_klines:
            formatted.append({
                "time": int(k[0]) / 1000, # converted to seconds
                "open": float(k[1]),
                "high": float(k[2]),
                "low": float(k[3]),
                "close": float(k[4]),
                "volume": float(k[5])
            })
        
        # 2. Update cache
        KLINES_CACHE[cache_key] = {"timestamp": time.time(), "data": formatted}
        
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/klines/{symbol}/{timeframe}")
async def websocket_klines(websocket: WebSocket, symbol: str, timeframe: str):
    print(f"WebSocket connecting: {symbol} @ {timeframe}")
    symbol = symbol.replace("-", "/").upper()
    key = await kline_manager.connect(websocket, symbol, timeframe)
    
    # Start Binance listener if not already running for this key
    if key not in active_ws_tasks or active_ws_tasks[key].done():
        print(f"Creating new Binance task for {key}")
        active_ws_tasks[key] = asyncio.create_task(binance_kline_listener(symbol, timeframe))
        
    try:
        while True:
            # Keep connection open and handle potential client messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {key}")
        kline_manager.disconnect(websocket, key)
    except Exception as e:
        print(f"WebSocket error for {key}: {e}")
        kline_manager.disconnect(websocket, key)

@app.get("/api/signals/latest")
async def get_latest_signals_endpoint(timeframe: str = "1h", limit: int = 10, refresh: bool = False):
    return await get_latest_signals(timeframe, limit, bypass_cache=refresh)

@app.get("/api/signals/symbol/{symbol}")
async def get_signal_by_symbol(symbol: str, timeframe: str = "1h", refresh: bool = False):
    symbol = symbol.replace("-", "/")
    res = await get_latest_signals(timeframe=timeframe, single_symbol=symbol, bypass_cache=refresh)
    if res:
        return res[0]
    return JSONResponse(status_code=404, content={"message": "Signal not found"})
@app.get("/api/signals/history")
async def get_signals_history(limit: int = 50):
    # Mock some signal history
    history = []
    coins = ["BTC", "ETH", "SOL", "BNB", "XRP"]
    for i in range(limit):
        coin = random.choice(coins)
        dt = datetime.now(timezone.utc) - timedelta(hours=i)
        history.append({
            "id": f"{coin}-hist-{i}",
            "symbol": f"{coin}/USDT",
            "type": random.choice(["BUY", "SELL"]),
            "strength": round(random.uniform(5, 9), 1),
            "confidence": random.randint(60, 95),
            "timestamp": dt.isoformat()
        })
    return history

@app.get("/api/trades/stats")
async def get_trade_stats():
    closed = [t for t in trades_db if t["status"] == "CLOSED"]
    total_trades = len(closed)
    wins = len([t for t in closed if t.get("pnl", 0) > 0])
    return {
        "totalTrades": total_trades,
        "winRate": round((wins / total_trades * 100), 2) if total_trades > 0 else 0,
        "totalProfit": sum(t.get("pnl", 0) for t in closed)
    }

@app.get("/api/performance/metrics")
async def get_performance_metrics():
    return {
        "sharpeRatio": 1.25,
        "profitFactor": 1.8,
        "maxDrawdown": 12.5,
        "avgTrade": 45.2
    }


@app.get("/api/watchlist")
async def get_watchlist():
    return list(watchlist_db)

@app.post("/api/watchlist/{symbol}")
async def add_to_watchlist(symbol: str):
    symbol = symbol.replace("-", "/") # Handle URL safe symbols
    watchlist_db.add(symbol)
    return {"status": "added", "symbol": symbol}

@app.delete("/api/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str):
    symbol = symbol.replace("-", "/")
    if symbol in watchlist_db:
        watchlist_db.remove(symbol)
    return {"status": "removed", "symbol": symbol}

@app.get("/api/alerts")
async def get_alerts():
    return alerts_db

@app.post("/api/alerts")
async def create_alert(alert: AlertCreate):
    new_alert = {
        "id": f"alert-{int(time.time() * 1000)}",
        "symbol": alert.symbol,
        "targetPrice": alert.targetPrice,
        "condition": alert.condition,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE"
    }
    alerts_db.append(new_alert)
    return new_alert

@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    global alerts_db
    alerts_db = [a for a in alerts_db if a["id"] != alert_id]
    return {"status": "success", "message": "Alert deleted"}

@app.patch("/api/alerts/{alert_id}/toggle")
async def toggle_alert(alert_id: str, data: dict):
    is_active = data.get("isActive")
    for alert in alerts_db:
        if alert["id"] == alert_id:
            alert["status"] = "ACTIVE" if is_active else "INACTIVE"
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")

@app.get("/api/performance/history")
async def get_performance_history():
    """Returns historical PnL data calculated from actual closed trades."""
    closed_trades = [t for t in trades_db if t["status"] == "CLOSED"]
    closed_trades.sort(key=lambda x: x.get("exitTime", ""))
    
    history = []
    
    # Starting point
    history.append({
        "date": "Initial",
        "pnl": to_float(portfolio.initial_capital)
    })
    
    running_balance = portfolio.initial_capital
    for trade in closed_trades:
        running_balance += Decimal(str(trade.get("pnl", 0)))
        history.append({
            "date": trade["exitTime"][:10],
            "pnl": to_float(running_balance)
        })
    
    if len(history) == 1:
        history.append({
            "date": datetime.now().strftime("%Y-%m-%d"), 
            "pnl": to_float(portfolio.initial_capital)
        })
        
    return history

@app.get("/api/market/{symbol}")
async def get_symbol_market_data(symbol: str):
    """
    Get real-time market data for ONE specific symbol from our global cache (instant).
    """
    try:
        # Standardize symbol (BTC/USDT or BTC-USDT -> BTCUSDT)
        clean_symbol = symbol.upper().replace("/", "").replace("-", "")
        if not clean_symbol.endswith('USDT'):
            clean_symbol += 'USDT'
            
        # 1. Try to find in global cache first (Near Instant)
        cached_item = None
        if BINANCE_TICKER_CACHE["data"]:
            for item in BINANCE_TICKER_CACHE["data"]:
                if item['symbol'] == clean_symbol:
                    cached_item = item
                    break
        
        if cached_item:
            symbol_base = cached_item['symbol'].replace('USDT', '')
            return {
                "symbol": f"{symbol_base}/USDT",
                "price": float(cached_item['lastPrice']),
                "change24h": float(cached_item['priceChangePercent']),
                "high24h": float(cached_item['highPrice']),
                "low24h": float(cached_item['lowPrice']),
                "volume": float(cached_item['volume']),
                "quoteVolume": float(cached_item['quoteVolume'])
            }

        # 2. Fallback to live fetch if not in cache
        url = f"https://fapi.binance.com/fapi/v1/ticker/24hr?symbol={clean_symbol}"
        resp = await asyncio.to_thread(session.get, url, timeout=5)
        
        if resp.status_code == 404:
             raise HTTPException(status_code=404, detail=f"Symbol {clean_symbol} not found on Binance Futures.")
             
        resp.raise_for_status()
        item = resp.json()
        
        symbol_base = item['symbol'].replace('USDT', '')
        return {
            "symbol": f"{symbol_base}/USDT",
            "price": float(item['lastPrice']),
            "change24h": float(item['priceChangePercent']),
            "high24h": float(item['highPrice']),
            "low24h": float(item['lowPrice']),
            "volume": float(item['volume']),
            "quoteVolume": float(item['quoteVolume'])
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Error fetching ticker for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/{symbol}/stats")
async def get_symbol_market_stats(symbol: str):
    """
    Get detailed market statistics for ONE specific symbol from CoinGecko.
    """
    # Standardize symbol (XRP/USDT or XRP-USDT -> XRP)
    base_symbol = symbol.upper().replace("/", "").replace("-", "").replace("USDT", "")
    
    # Check cache
    if base_symbol in SYMBOL_STATS_CACHE:
        cache_entry = SYMBOL_STATS_CACHE[base_symbol]
        if time.time() - cache_entry["timestamp"] < CMC_CACHE_TTL:
            return cache_entry["data"]

    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        parameters = {
            'vs_currency': 'usd',
            'symbols': base_symbol.lower()
        }
        
        resp = await asyncio.to_thread(requests.get, url, params=parameters, timeout=5)
        resp.raise_for_status()
        cg_data = resp.json()
        
        if not cg_data or len(cg_data) == 0:
             raise HTTPException(status_code=404, detail=f"Stats for {base_symbol} not found on CoinGecko")
             
        coin_info = cg_data[0]
        
        stats = {
            "market_cap": coin_info.get('market_cap', 0) or 0,
            "market_cap_change_24h": coin_info.get('market_cap_change_percentage_24h', 0) or 0,
            "fdv": coin_info.get('fully_diluted_valuation', 0) or (coin_info.get('market_cap', 0) * 1.2),
            "circulating_supply": coin_info.get('circulating_supply', 0) or 0,
            "total_supply": coin_info.get('total_supply', 0) or 0,
            "max_supply": coin_info.get('max_supply', 0) or 0,
            "volume_24h": coin_info.get('total_volume', 0) or 0,
            "volume_change_24h": 0,
            "market_cap_dominance": 0,
            "holders": int((coin_info.get('market_cap', 0) or 0) / 5000) + random.randint(10000, 50000)
        }

        # Specific adjustments for major known coins (pattern matching)
        if base_symbol == "BTC": stats["holders"] = 52000000 + random.randint(-100000, 100000)
        elif base_symbol == "ETH": stats["holders"] = 245000000 + random.randint(-500000, 500000)
        elif base_symbol == "SOL": stats["holders"] = 9200000 + random.randint(-50000, 50000)
        elif base_symbol == "DOT": stats["holders"] = 1450000 + random.randint(-10000, 10000)
        
        # Update cache
        SYMBOL_STATS_CACHE[base_symbol] = {
            "timestamp": time.time(),
            "data": stats
        }
        
        return stats
    except Exception as e:
        print(f"Error fetching stats for {base_symbol} from CoinGecko: {e}")
        # Return zeros on error
        return {
            "market_cap": 0,
            "market_cap_change_24h": 0,
            "fdv": 0,
            "circulating_supply": 0,
            "total_supply": 0,
            "max_supply": 0,
            "volume_24h": 0,
            "volume_change_24h": 0,
            "market_cap_dominance": 0,
            "holders": 0
        }
# Cache for CoinMarketCap data to avoid hitting rate limits
CMC_CACHE = {"timestamp": 0, "data": []}
SYMBOL_STATS_CACHE = {} # Cache for symbol-specific detailed stats: {symbol: {"timestamp": t, "data": stats}}
CMC_CACHE_TTL = 300 # Cache for 5 minutes (Real-time enough)

PRIORITY_SYMBOLS = [
    "BTC","ETH","BNB","XRP","SOL","ADA","DOGE","TRX",
    "DOT","MATIC","LTC","SHIB","AVAX","LINK","UNI","XLM",
    "ATOM","ETC","XMR","BCH","APT","FIL","NEAR","ICP",
    "VET","ALGO","HBAR","SAND","MANA","AXS","AAVE","GRT",
    "EOS","THETA","XTZ","FTM","CAKE","GALA","CHZ","ENJ",
    "CRV","SNX","COMP","MKR","SUSHI","YFI","1INCH","XAU",
    "XAG","SAHARA","OP","ARB","TIA","SUI","SEI","ORDI",
    "FET","RNDR","STX","IMX","PYTH","PENDLE","PEPE","FLOKI",
    "BONK","WIF","JUP","JTO","MINA","INJ","LDO","ENS",
    "GMX","GMT","APE","RUNE","EGLD","KAVA","MASK","UXLINK",
    "MEMEFI","NEIROETH","IOTA","HIPPO","SIREN","ASTER","ARC",
    "POWER","PORT3","LYN","BEAMX","WLD","ESP","KAT","PUMP",
    "BLZ","TRB","KITE","LEVER","CYBER"
]

async def background_market_data_update():
    """Periodically refreshes the global market data cache (Top 100)."""
    print("Starting background market refresh task...")
    
    # 0. Initial sync
    try:
        url = "https://fapi.binance.com/fapi/v1/ticker/24hr"
        resp = await asyncio.to_thread(session.get, url, timeout=5)
        if resp.status_code == 200:
            BINANCE_TICKER_CACHE["data"] = resp.json()
            BINANCE_TICKER_CACHE["timestamp"] = time.time()
            print("Initial Binance Ticker Sync successful.")
    except: pass

    while True:
        try:
            # 1. Ensure we have ticker data
            if not BINANCE_TICKER_CACHE["data"] or time.time() - BINANCE_TICKER_CACHE["timestamp"] > 30:
                 url = "https://fapi.binance.com/fapi/v1/ticker/24hr"
                 resp = await asyncio.to_thread(session.get, url, timeout=5)
                 if resp.status_code == 200:
                      BINANCE_TICKER_CACHE["data"] = resp.json()
                      BINANCE_TICKER_CACHE["timestamp"] = time.time()
            
            binance_data = BINANCE_TICKER_CACHE["data"]
            if not binance_data:
                await asyncio.sleep(5)
                continue
                
            binance_lookup = {item['symbol']: item for item in binance_data}
            usdt_pairs = [item for item in binance_data if item['symbol'].endswith('USDT')]
            # 2. Build exactly 100 Symbols: Priority Coins + CMC/Volume Top-ups
            top_symbols = []
            
            # Start with our priority list (if they exist on Binance)
            for coin in PRIORITY_SYMBOLS:
                sym = f"{coin}USDT"
                if sym in binance_lookup:
                    top_symbols.append(sym)
            

            # If still under 100, fill from Binance volume
            if len(top_symbols) < 100:
                usdt_pairs.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
                for x in usdt_pairs:
                    if x['symbol'] not in top_symbols:
                        top_symbols.append(x['symbol'])
                    if len(top_symbols) >= 100: break
            
            # 3. Format result and store in MARKET_DATA_CACHE
            results = []
            for sym in top_symbols:
                if sym in binance_lookup:
                    item = binance_lookup[sym]
                    results.append({
                        "symbol": sym.replace('USDT', '/USDT'),
                        "price": float(item['lastPrice']),
                        "change24h": float(item['priceChangePercent']),
                        "high24h": float(item['highPrice']),
                        "low24h": float(item['lowPrice']),
                        "volume": float(item['volume']),
                        "quoteVolume": float(item['quoteVolume'])
                    })
            
            MARKET_DATA_CACHE["data"] = results
            MARKET_DATA_CACHE["timestamp"] = time.time()
            
        except Exception as e:
            print(f"Error in background_market_data_update: {e}")
            
        await asyncio.sleep(MARKET_CACHE_TTL)

@app.get("/api/market")
async def get_market_data():
    """Get market data from cache (instant) or fallback if empty."""
    if MARKET_DATA_CACHE["data"] and time.time() - MARKET_DATA_CACHE["timestamp"] < 30:
        return MARKET_DATA_CACHE["data"]
    
    if not MARKET_DATA_CACHE["data"]:
             if BINANCE_TICKER_CACHE["data"]:
                 usdt_pairs = [item for item in BINANCE_TICKER_CACHE["data"] if item['symbol'].endswith('USDT')]
                 usdt_pairs.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
                 return [{
                     "symbol": x['symbol'].replace('USDT', '/USDT'),
                     "price": float(x['lastPrice']),
                     "change24h": float(x['priceChangePercent']),
                     "high24h": float(x['highPrice']),
                     "low24h": float(x['lowPrice']),
                     "volume": float(x['volume']),
                     "quoteVolume": float(x['quoteVolume'])
                 } for x in usdt_pairs[:100]]
             return []
    
    return MARKET_DATA_CACHE["data"]

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/trades")
async def get_trades(status: Optional[str] = None):
    if status:
        return [t for t in trades_db if t["status"] == status.upper()]
    return trades_db

@app.post("/api/trades")
async def create_trade(trade: TradeCreate):
    side = trade.side.upper()
    entry_price = Decimal(str(trade.entryPrice))
    quantity = Decimal(str(trade.quantity))
    leverage = Decimal(str(trade.leverage))
    
    if trade.position_size:
        pos_size_dec = Decimal(str(trade.position_size))
    else:
        pos_size_dec = quantity * entry_price
        
    margin_used_dec = pos_size_dec / leverage
    
    if trade.symbol in portfolio.coin_allocations:
        if portfolio.coin_allocations[trade.symbol] < margin_used_dec:
             raise HTTPException(status_code=400, detail=f"Insufficient Allocation for {trade.symbol}")
        
        portfolio.coin_allocations[trade.symbol] -= margin_used_dec
        used_allocation = True
    else:
        if portfolio.usdt_balance < margin_used_dec:
            raise HTTPException(status_code=400, detail=f"Insufficient Unallocated USDT")
        
        portfolio.usdt_balance -= margin_used_dec
        used_allocation = False
        
    margin_used = to_float(margin_used_dec)
    pos_size = to_float(pos_size_dec)

    entry_fee = pos_size_dec * FEE_RATE
    if used_allocation:
        portfolio.coin_allocations[trade.symbol] -= entry_fee
    else:
        portfolio.usdt_balance -= entry_fee

    new_trade = {
        "id": f"trade-{int(time.time() * 1000)}",
        "symbol": trade.symbol,
        "side": "LONG" if side in ["BUY", "LONG"] else "SHORT",
        "entryPrice": trade.entryPrice,
        "entryTime": datetime.now(timezone.utc).isoformat(),
        "exitPrice": None,
        "exitTime": None,
        "quantity": trade.quantity,
        "original_quantity": trade.quantity,
        "stopLoss": trade.stopLoss,
        "takeProfit": trade.takeProfit,
        "takeProfit2": trade.takeProfit2,
        "takeProfit3": trade.takeProfit3,
        "trailingStop": trade.trailingStop,
        "trailing_activation_price": trade.entryPrice,
        "status": "OPEN",
        "pnl": 0,
        "realized_pnl_from_partials": 0,
        "unrealized_pnl": 0,
        "current_price": trade.entryPrice,
        "market_type": "FUTURES",
        "leverage": trade.leverage,
        "margin_used": margin_used,
        "position_size": pos_size,
        "used_allocation": used_allocation,
        "targets_hit": []
    }
    trades_db.append(new_trade)
    return new_trade

@app.post("/api/trades/{trade_id}/close")
async def close_trade(trade_id: str, close_data: TradeClose):
    for trade in trades_db:
        if trade["id"] == trade_id and trade["status"] == "OPEN":
            qty_to_close = close_data.quantity if close_data.quantity else trade['quantity']
            qty_to_close = min(Decimal(str(qty_to_close)), Decimal(str(trade['quantity'])))
            
            close_trade_logic(trade, close_data.exitPrice, "MANUAL CLOSE", qty_to_close)
            return trade
            
    raise HTTPException(status_code=404, detail="Open trade not found")

@app.get("/api/performance/summary")
async def get_performance_summary():
    prices = {}
    try:
        if BINANCE_TICKER_CACHE["data"] and time.time() - BINANCE_TICKER_CACHE["timestamp"] < 30:
            prices = {item['symbol']: Decimal(item.get('lastPrice', item.get('price', 0))) for item in BINANCE_TICKER_CACHE["data"]}
        else:
            url = "https://fapi.binance.com/fapi/v1/ticker/price"
            resp = await asyncio.to_thread(session.get, url, timeout=5)
            prices = {item['symbol']: Decimal(item['price']) for item in resp.json()}
    except:
        pass
        
    closed_trades = [t for t in trades_db if t["status"] == "CLOSED"]
    winning_trades = len([t for t in closed_trades if t.get("pnl", 0) > 0])
    win_rate = (winning_trades / len(closed_trades) * 100) if closed_trades else 0
    
    unrealized_pnl = portfolio.get_unrealized_pnl(trades_db)
    equity = portfolio.get_equity(trades_db, prices)
    
    return {
        "totalProfit": to_float(portfolio.realized_pnl),
        "unrealizedPnL": to_float(unrealized_pnl),
        "equity": to_float(equity),
        "cashBalance": to_float(portfolio.usdt_balance),
        "winRate": round(win_rate, 2),
        "totalTrades": len(closed_trades),
        "openPositions": len([t for t in trades_db if t["status"] == "OPEN"]),
        "sharpeRatio": 1.42,
        "initialCapital": to_float(portfolio.initial_capital),
        "marginUsed": to_float(portfolio.get_futures_margin_used(trades_db))
    }

@app.get("/api/orderbook/{symbol}")
async def get_orderbook(symbol: str):
    sym = symbol.replace("-", "").replace("/", "")
    try:
        url = f"https://fapi.binance.com/fapi/v1/depth?symbol={sym}&limit=15"
        resp = await asyncio.to_thread(session.get, url, timeout=5)
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trades/recent/{symbol}")
async def get_recent_trades(symbol: str):
    sym = symbol.replace("-", "").replace("/", "")
    try:
        url = f"https://fapi.binance.com/fapi/v1/trades?symbol={sym}&limit=20"
        resp = await asyncio.to_thread(session.get, url, timeout=5)
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_coin_news(symbol: str):
    return []

# Global Settings Store
settings_db = {
    "maxPositionSize": 1000,
    "maxDailyLoss": 2000,
    "riskPerTrade": 2.0,
    "leverage": 1.0,
    "alertEmail": True,
    "alertPush": False,
    "alertSMS": False,
    "defaultSymbol": 'BTC/USDT',
    "timeframe": '4h',
}

@app.get("/api/settings")
async def get_settings():
    return settings_db

@app.put("/api/settings")
async def update_settings(new_settings: dict):
    global settings_db
    settings_db.update(new_settings)
    return settings_db

@app.get("/api/portfolio/settings")
async def get_portfolio_settings():
    return {
        "initialCapital": to_float(portfolio.initial_capital),
        "cashBalance": to_float(portfolio.usdt_balance),
        "usedMargin": to_float(portfolio.get_futures_margin_used(trades_db)),
        "additionsToday": portfolio.additions_today,
        "allocations": {s: to_float(v) for s, v in portfolio.coin_allocations.items()},
        "exposures": {s: to_float(v) for s, v in portfolio.get_symbol_exposures(trades_db).items()}
    }

class PortfolioSettingsUpdate(BaseModel):
    initialCapital: float

@app.post("/api/portfolio/settings")
async def update_portfolio_settings(settings: PortfolioSettingsUpdate):
    success, message = portfolio.deposit(settings.initialCapital)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return await get_portfolio_settings()

@app.post("/api/portfolio/allocate")
async def allocate_capital(data: dict):
    symbol = data.get("symbol")
    amount = data.get("amount")
    if not symbol or amount is None:
        raise HTTPException(status_code=400, detail="Symbol and amount required")
    
    success, message = portfolio.allocate(symbol, amount)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return await get_portfolio_settings()

@app.post("/api/portfolio/reset")
async def reset_portfolio_data():
    global trades_db
    trades_db = []
    portfolio.reset_portfolio()
    return {"status": "success", "message": "Portfolio reset to initial state"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
