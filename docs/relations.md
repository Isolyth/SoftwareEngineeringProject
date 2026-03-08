# Company Relations System

## Overview

Stocks have inter-company relationships that cause news effects to propagate between them. Three relationship types exist, each with different propagation behavior.

**Files:** `src/relationEngine.ts`, `src/relationData.ts`

## Relation Types

| Type | Propagation Direction | Probability | Impact Fraction |
|------|----------------------|-------------|-----------------|
| Competitor | **Inverted** — good news for A hurts B | 50% per tick | 20-35% |
| Supplier | **Same** — bad news for A also hurts B | 60% per tick | 25-40% |
| Partner | **Same** — good news for A helps B | 45% per tick | 15-30% |

## Generation Rules

### Initial Generation (`generateInitialRelations`)

For each of the 15 stocks:
1. Target 1-3 relations per stock
2. Pick relation type with weights: 40% competitor, 30% supplier, 30% partner
3. Pick target stock with sector affinity:
   - Competitors: 80% chance of same-sector target
   - Suppliers: 80% chance of cross-sector target
   - Partners: no sector bias
4. Constraints:
   - No duplicate pairs (A-B and B-A count as the same pair)
   - No self-relations
   - Maximum 3 relations per stock
5. Ensure every stock has at least 1 relation (second pass)

### Replacement Generation (`generateRelationsForReplacement`)

When a bankrupt stock is replaced:
1. Remove all relations involving the old ticker
2. Generate 1-3 new relations for the replacement stock
3. Same type/target selection rules as initial generation
4. Respects existing pair constraints

## Effect Propagation

### At News Generation Time (trend shifts)

When ticker-targeted news is generated:
1. Primary stock gets the full `trendShift`
2. `computeRelationEffects()` rolls probability for each related stock
3. Related stocks get `trendShift * multiplier` (where multiplier is the signed fraction)
4. Trend shifts are accumulated and applied in the tick loop

### Per-Tick (ongoing influence)

While a news effect is active (`computeNewsInfluence`):
1. For each active effect targeting a different ticker
2. Check if that ticker has a relation to the current stock
3. Roll probability (50%/60%/45% per tick)
4. If triggered, apply fractional impact with appropriate sign

This per-tick stochastic check creates the "sometimes reacts" feel — related stocks don't move in lockstep, they occasionally respond.

## Description Templates

Each relation gets a human-readable description generated from templates:

**Competitor examples:**
- "{from} competes directly with {to}"
- "{from} is losing market share to {to}"
- "{from} undercuts {to} on pricing"

**Supplier examples:**
- "{from} supplies key components to {to}"
- "{to} depends on materials from {from}"
- "{to} requires parts made by {from}"

**Partner examples:**
- "{from} and {to} have a joint venture"
- "{to} licenses technology from {from}"
- "{from} has a revenue-sharing deal with {to}"

Descriptions are shown as hover tooltips on relation tags in the UI.

## UI Display

### Stock List (left sidebar)
- Relation icons appear after the % change for stocks related to the **currently selected** stock
- Icon types: ⚔ (competitor), ⬌ (supplier), ♠ (partner)
- Colored by type: orange (competitor), blue (supplier), green (partner)

### Search UI
- Each stock row shows all its relation tags
- Tags display: icon + other ticker (e.g., `⚔ MXPD`)
- Full description shown on hover via `title` attribute
