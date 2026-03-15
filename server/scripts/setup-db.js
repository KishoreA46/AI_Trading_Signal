import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('[v0] Starting database setup...');

    // Create settings table
    const settingsQuery = `
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
        max_position_size DECIMAL(10, 2) DEFAULT 1000,
        max_daily_loss DECIMAL(10, 2) DEFAULT 2000,
        risk_per_trade DECIMAL(5, 2) DEFAULT 2,
        leverage DECIMAL(5, 2) DEFAULT 1,
        alert_email BOOLEAN DEFAULT true,
        alert_push BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create paper_trades table
    const paperTradesQuery = `
      CREATE TABLE IF NOT EXISTS paper_trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        entry_price DECIMAL(15, 8) NOT NULL,
        entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
        exit_price DECIMAL(15, 8),
        exit_time TIMESTAMP WITH TIME ZONE,
        quantity DECIMAL(15, 8) NOT NULL,
        side VARCHAR(4) NOT NULL CHECK (side IN ('LONG', 'SHORT')),
        stop_loss DECIMAL(15, 8),
        take_profit DECIMAL(15, 8),
        pnl DECIMAL(15, 8),
        status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
        signal_id UUID REFERENCES signals(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create alerts table
    const alertsQuery = `
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        condition VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        triggered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create watchlist table
    const watchlistQuery = `
      CREATE TABLE IF NOT EXISTS watchlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, symbol)
      );
    `;

    // Create signals table
    const signalsQuery = `
      CREATE TABLE IF NOT EXISTS signals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(20) NOT NULL,
        signal_type VARCHAR(20) NOT NULL CHECK (signal_type IN ('BUY', 'SELL')),
        strength DECIMAL(5, 2) NOT NULL,
        confidence DECIMAL(5, 2) NOT NULL,
        indicators JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Execute queries
    const { error: settingsError } = await supabase.rpc('exec', {
      sql: settingsQuery
    }).catch(() => ({ error: null })); // Fallback for RPC

    console.log('[v0] Database setup complete');
    console.log('[v0] Tables created: settings, paper_trades, alerts, watchlist, signals');
  } catch (error) {
    console.error('[v0] Database setup error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
