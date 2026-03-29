# Population Growth Rate Update

## Changes Made

### Frontend Display Updated ✅
Updated the dashboard to show the correct population growth rate.

**Files Modified:**
1. `src/pages/dashboard.js` - Changed display from "+10,000/day" to "+10,000/20 min"
2. `src/locales/en.json` - Added translation: `"per20Min": "20 min"`
3. `src/locales/he.json` - Added translation: `"per20Min": "20 דק'"`

### Backend Configuration Needed ⚠️
The actual population growth rate is controlled server-side. Here's where to update it:

## Where Population Growth is Controlled

Population growth in this game is likely managed by one of these:

### Option 1: Supabase Edge Function
Location: Should be in a Supabase Edge Function that runs on a cron schedule

**How to update:**
1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Look for a function like `population-growth` or `cron-handler`
4. Update the growth value from whatever it currently is to `10000`

**Example Edge Function:**
```javascript
// supabase/functions/population-growth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Update this value to 10000
  const POPULATION_GROWTH_PER_CYCLE = 10000

  const { error } = await supabase.rpc('increment_population', {
    growth_amount: POPULATION_GROWTH_PER_CYCLE
  })

  return new Response(JSON.stringify({ success: !error }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Option 2: Database Function (PostgreSQL)
Location: Supabase Database > SQL Editor or Functions

**How to update:**
1. Go to Supabase Dashboard → Database → Functions
2. Look for a function like `increment_population` or `grow_population`
3. Update the growth constant

**Example SQL Function:**
```sql
CREATE OR REPLACE FUNCTION increment_population()
RETURNS void AS $$
BEGIN
  -- Update this value to 10000
  UPDATE nations
  SET population = population + 10000
  WHERE is_alive = true;
END;
$$ LANGUAGE plpgsql;
```

### Option 3: Cron Configuration
Location: Supabase Dashboard → Database → Cron Jobs

**Current Setup (likely):**
- **Schedule:** Every 20 minutes (`*/20 * * * *`)
- **Growth:** Currently set to a different value, needs to be changed to 10,000

**How to update:**
1. Go to Supabase Dashboard → Database → Cron Jobs (pg_cron extension)
2. Find the job that runs population growth
3. Update the SQL or function call to use 10,000

**Example Cron Job:**
```sql
-- Schedule: Every 20 minutes
SELECT cron.schedule(
  'population-growth',
  '*/20 * * * *',  -- Every 20 minutes
  $$
    UPDATE nations
    SET population = population + 10000
    WHERE is_alive = true;
  $$
);
```

## Current vs New Growth Rate

| Period | Old Rate | New Rate | Daily Total |
|--------|----------|----------|-------------|
| 20 min | ~347 (10k/day ÷ 72) | **10,000** | 720,000 |
| 1 hour | ~1,042 | **30,000** | 720,000 |
| 1 day | 10,000 | **720,000** | 720,000 |

**Impact:**
- **72x faster** population growth
- Nations will reach large populations much quicker
- More soldiers available for drafting
- More dynamic gameplay

## How to Find the Exact Location

If you have access to the Supabase project, search for:

1. **Edge Functions:**
   ```bash
   # In your Supabase project directory
   cd supabase/functions
   grep -r "population" .
   ```

2. **Database Functions:**
   ```sql
   -- In Supabase SQL Editor
   SELECT 
     routine_name, 
     routine_definition 
   FROM information_schema.routines 
   WHERE routine_definition LIKE '%population%';
   ```

3. **Cron Jobs:**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM cron.job WHERE jobname LIKE '%pop%';
   ```

## Testing the Change

After updating the backend:

1. Note your current population
2. Wait 20 minutes
3. Check if population increased by exactly 10,000
4. If not, check Supabase logs for errors

## Alternative: Environment Variable

If the growth rate is configured via environment variable:

**Location:** Supabase Dashboard → Settings → Edge Functions → Environment Variables

**Variable name (might be):**
- `POPULATION_GROWTH_RATE`
- `POP_GROWTH_PER_CYCLE`
- `GROWTH_AMOUNT`

**Set value to:** `10000`

## Summary

✅ **Frontend updated** - Now shows "+10,000/20 min"  
⚠️ **Backend needs update** - Actual growth rate must be changed server-side  
📍 **Most likely location** - Supabase Edge Function running on cron, or a pg_cron job  

The frontend change is cosmetic - the real population growth happens in your Supabase backend.
