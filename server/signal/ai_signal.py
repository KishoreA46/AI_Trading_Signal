import sys
import os
from datetime import datetime

# Add the project root to sys.path so we can import Final
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import Final

SUPPORTED_COINS = Final.SUPPORTED_COINS

TIMEFRAME_MAP = {
    "15M": ("15m", "15 Min"),
    "30M": ("30m", "30 Min"),
    "1H": ("1h", "1 Hour"),
    "4H": ("4h", "4 Hour"),
    "1D": ("1d", "1 Day"),
}

def get_v6_signal(symbol: str, tf_key: str):
    """Refactored to use Final.py Elite Signal logic."""
    # Clean symbol (e.g. BTC/USDT -> BTC)
    coin = symbol.split('/')[0].upper()
    
    # Final.py handles its own caching and models
    res = Final.get_elite_signal(coin, tf_key)
    if not res:
        return None
        
    return res

if __name__ == "__main__":
    if len(sys.argv) > 2:
        res = get_v6_signal(sys.argv[1], sys.argv[2])
        print(res)
    else:
        print("Usage: python ai_signal.py <COIN> <TF>")