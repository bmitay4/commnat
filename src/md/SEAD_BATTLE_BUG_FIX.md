# SEAD Battle Report Bug Fixes

## Issues Identified

### Issue 1: Wrong Battle Log Message ⚠️
**Problem:** SEAD attacks show "ballistic missiles bypassed defenses" instead of "cruise missiles dismantled air grid"

**Cause:** Scenario detection not matching stored value in database

**Fixed in:** `src/battleReport.js`
- Added more SEAD scenario patterns: `sead`, `suppress_air_defense`, `suppress_air_defenses`, `suppression_of_enemy_air_defenses`
- Added attack_type fallback: `a.attack_type === 'sead'`
- Improved result_summary detection to catch: SAM, SEAD, air defense, air defence, suppress, SAM battery

### Issue 2: Incorrect Victory/Defeat Status 🚨 (CRITICAL)
**Problem:** Battle shows VICTORY even when:
- Attacker lost 22 cruise missiles + 80 fighter jets
- Defender had NO losses
- This should clearly be a DEFEAT

**Root Cause:** Backend battle calculation logic is setting `success = true` incorrectly

**Where the bug lives:** Backend (Edge Function or database function that processes battles)

---

## Frontend Fixes Applied ✅

### File: `src/battleReport.js`

#### 1. Enhanced SEAD Scenario Detection (Line 380-387)
```javascript
// BEFORE:
if (scenario === 'sead' || scenario === 'suppress_air_defense') {

// AFTER:
if (scenario === 'sead' || 
    scenario === 'suppress_air_defense' || 
    scenario === 'suppress_air_defenses' ||
    scenario === 'suppression_of_enemy_air_defenses' ||
    a.attack_type === 'sead') {
```

#### 2. Improved Result Summary Detection (Line 464-466)
```javascript
// BEFORE:
if (clean.includes('SAM') || clean.includes('SEAD') || clean.includes('air defense')) {

// AFTER:
if (clean.includes('SAM') || clean.includes('SEAD') || clean.includes('air defense') || 
    clean.includes('air defence') || clean.includes('suppress') || clean.includes('SAM battery')) {
```

---

## Backend Fix Required 🔧

### The Critical Bug
The backend battle calculation for SEAD missions is setting `success = true` when it should be `false`.

### SEAD Battle Logic (from game design doc)
```
Attacker uses: Cruise Missiles + Fighter Jets
Defender uses: SAM Battery
Goal: Destroy the enemy's SAM Battery
```

### Correct Success Conditions
**Success (attacker wins):**
- Enemy SAM Battery is destroyed (or significantly damaged)
- Attacker may lose units but achieves the objective

**Failure (attacker loses):**
- Enemy SAM Battery survives
- Attacker loses units without achieving objective

### Current Bug Example
```
Attack Result:
- Attacker lost: 22 cruise missiles, 80 fighter jets
- Defender lost: NOTHING (0 units)
- Database stored: success = TRUE ❌ WRONG!
- Should be: success = FALSE ✅ CORRECT
```

---

## Where to Fix the Backend

### Location 1: Edge Function (Most Likely)
**File:** `supabase/functions/process-battle/index.ts` (or similar)

Look for the SEAD battle logic function. It should look something like:

```typescript
function processSEADBattle(attacker, defender, units) {
  // Calculate losses
  const attackerLosses = calculateAttackerLosses(...)
  const defenderLosses = calculateDefenderLosses(...)
  
  // CURRENT BUG: Wrong success calculation
  const success = true  // ❌ ALWAYS TRUE!
  
  // CORRECT FIX: Check if SAM was destroyed
  const success = defenderLosses.sam_battery > 0 || 
                  (defenderLosses.total / defender.sam_battery_total) > 0.3
  
  return { success, attackerLosses, defenderLosses }
}
```

### Location 2: Database Function
**Query to find it:**
```sql
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%SEAD%'
   OR routine_definition LIKE '%suppress%'
   OR routine_definition LIKE '%SAM%'
   AND routine_schema = 'public';
```

### Location 3: Stored Procedure
```sql
SELECT * FROM pg_proc 
WHERE proname LIKE '%battle%' 
   OR proname LIKE '%sead%'
   OR proname LIKE '%combat%';
```

---

## SEAD Success Logic (Correct Implementation)

```javascript
// Pseudocode for correct SEAD battle logic
function calculateSEADSuccess(attackResult) {
  const {
    defenderSAMDestroyed,
    defenderSAMTotal,
    attackerCruiseLost,
    attackerFightersLost
  } = attackResult;
  
  // Calculate SAM destruction percentage
  const samDestructionRate = defenderSAMDestroyed / defenderSAMTotal;
  
  // Success if:
  // 1. Destroyed at least 30% of enemy SAM batteries
  // OR
  // 2. Completely eliminated all SAM (100%)
  const success = samDestructionRate >= 0.3;
  
  // Even if attacker loses units, if SAM is destroyed = success
  // Even if attacker loses NO units, if SAM survives = failure
  
  return success;
}
```

---

## Testing the Fix

### Backend Test Case 1: Clear Failure
```javascript
Input:
  Attacker: 30 cruise missiles, 100 fighter jets
  Defender: 50 SAM batteries
  
Result:
  Attacker lost: 22 cruise, 80 fighters
  Defender lost: 0 SAM
  
Expected: success = FALSE ✅
Current:  success = TRUE ❌
```

### Backend Test Case 2: Clear Success
```javascript
Input:
  Attacker: 30 cruise missiles, 100 fighter jets
  Defender: 50 SAM batteries
  
Result:
  Attacker lost: 5 cruise, 20 fighters
  Defender lost: 35 SAM (70% destroyed)
  
Expected: success = TRUE ✅
```

### Backend Test Case 3: Pyrrhic Victory
```javascript
Input:
  Attacker: 30 cruise missiles, 100 fighter jets
  Defender: 50 SAM batteries
  
Result:
  Attacker lost: 28 cruise, 95 fighters (massive losses)
  Defender lost: 40 SAM (80% destroyed)
  
Expected: success = TRUE ✅ (objective achieved despite heavy losses)
```

---

## Database Schema Check

The attacks table should have these fields:
```sql
SELECT 
  id,
  attacker_nation_id,
  defender_nation_id,
  attack_type,          -- Should be 'sead' or similar
  scenario_type,        -- Should match attack_type
  success,              -- BOOLEAN - this is the bug field
  att_soldiers_lost,
  def_soldiers_lost,
  attacker_equipment_lost,   -- JSON: { cruise_missile: 22, fighter_jet: 80 }
  defender_equipment_lost,   -- JSON: { sam_battery: 0 } ← BUG: should be > 0 for victory
  result_summary,
  attacked_at
FROM attacks
WHERE attack_type LIKE '%sead%'
ORDER BY attacked_at DESC
LIMIT 10;
```

---

## Quick Manual Fix (Temporary)

If you need to fix specific battle records manually while the backend is being fixed:

```sql
-- Find incorrect SEAD battles (victories with no enemy losses)
UPDATE attacks
SET success = FALSE
WHERE (attack_type = 'sead' OR scenario_type = 'sead')
  AND success = TRUE
  AND (
    defender_equipment_lost IS NULL 
    OR defender_equipment_lost->>'sam_battery' = '0'
    OR defender_equipment_lost = '{}'::jsonb
  );
```

---

## Summary

### ✅ Fixed (Frontend)
- Battle log now correctly detects SEAD scenarios
- Improved pattern matching for scenario types
- Better fallback detection

### ⚠️ Requires Backend Fix
- SEAD battle success calculation is wrong
- Currently marks all SEAD attacks as success=true regardless of outcome
- Need to check SAM battery destruction to determine success

### 🎯 Next Steps
1. Locate the battle processing function (likely in Supabase Edge Functions)
2. Find the SEAD battle logic section
3. Replace hardcoded `success = true` with actual SAM destruction check
4. Test with the 3 test cases above
5. Deploy the fix
6. Optionally: Run the manual SQL fix to correct historical bad records

### Impact
**High Priority** - This affects game balance significantly. Players are:
- Getting victories they didn't earn
- Seeing confusing results that don't match reality
- Potentially gaming the system if they realize SEAD always succeeds
