import type { StockDefinition, StockRelation, RelationType } from './types';
import { RELATION_DESCRIPTIONS } from './relationData';

interface RelationEffect {
  ticker: string;
  impactMultiplier: number;
  trendShiftMultiplier: number;
}

function pickRelationType(fromSector: string, toSector: string): RelationType {
  const roll = Math.random();
  let type: RelationType;
  if (roll < 0.4) type = 'competitor';
  else if (roll < 0.7) type = 'supplier';
  else type = 'partner';
  return type;
}

function pickTarget(
  fromTicker: string,
  fromSector: string,
  type: RelationType,
  candidates: StockDefinition[],
  existingPairs: Set<string>
): StockDefinition | null {
  // Filter out already-paired candidates
  const available = candidates.filter(
    (c) => c.ticker !== fromTicker && !existingPairs.has(pairKey(fromTicker, c.ticker))
  );
  if (available.length === 0) return null;

  const sameSector = available.filter((c) => c.sector === fromSector);
  const crossSector = available.filter((c) => c.sector !== fromSector);

  // Competitor favors same sector, supplier favors cross sector, partner no bias
  if (type === 'competitor' && sameSector.length > 0 && Math.random() < 0.8) {
    return sameSector[Math.floor(Math.random() * sameSector.length)];
  }
  if (type === 'supplier' && crossSector.length > 0 && Math.random() < 0.8) {
    return crossSector[Math.floor(Math.random() * crossSector.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function makeDescription(type: RelationType, fromName: string, toName: string): string {
  const templates = RELATION_DESCRIPTIONS[type];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{from}', fromName).replace('{to}', toName);
}

function countRelations(ticker: string, relations: StockRelation[]): number {
  return relations.filter((r) => r.from === ticker || r.to === ticker).length;
}

export function generateInitialRelations(defs: StockDefinition[]): StockRelation[] {
  const relations: StockRelation[] = [];
  const pairs = new Set<string>();

  for (const def of defs) {
    const currentCount = countRelations(def.ticker, relations);
    const targetCount = Math.floor(Math.random() * 3) + 1; // 1-3
    const toAdd = Math.max(0, targetCount - currentCount);

    for (let i = 0; i < toAdd; i++) {
      // Skip if this stock already has 3 relations
      if (countRelations(def.ticker, relations) >= 3) break;

      const type = pickRelationType(def.sector, '');
      const target = pickTarget(def.ticker, def.sector, type, defs, pairs);
      if (!target) break;

      // Skip if the target already has 3 relations
      if (countRelations(target.ticker, relations) >= 3) continue;

      pairs.add(pairKey(def.ticker, target.ticker));
      relations.push({
        from: def.ticker,
        to: target.ticker,
        type,
        description: makeDescription(type, def.name, target.name),
      });
    }
  }

  // Ensure every stock has at least 1 relation
  for (const def of defs) {
    if (countRelations(def.ticker, relations) === 0) {
      const type = pickRelationType(def.sector, '');
      const target = pickTarget(def.ticker, def.sector, type, defs, pairs);
      if (target && countRelations(target.ticker, relations) < 3) {
        pairs.add(pairKey(def.ticker, target.ticker));
        relations.push({
          from: def.ticker,
          to: target.ticker,
          type,
          description: makeDescription(type, def.name, target.name),
        });
      }
    }
  }

  return relations;
}

export function generateRelationsForReplacement(
  newTicker: string,
  newSector: string,
  newName: string,
  allDefs: StockDefinition[],
  existingRelations: StockRelation[]
): StockRelation[] {
  const pairs = new Set<string>();
  for (const r of existingRelations) {
    pairs.add(pairKey(r.from, r.to));
  }

  const count = Math.floor(Math.random() * 3) + 1;
  const newRelations: StockRelation[] = [];

  for (let i = 0; i < count; i++) {
    const type = pickRelationType(newSector, '');
    const target = pickTarget(newTicker, newSector, type, allDefs, pairs);
    if (!target) break;
    if (countRelations(target.ticker, [...existingRelations, ...newRelations]) >= 3) continue;

    pairs.add(pairKey(newTicker, target.ticker));
    newRelations.push({
      from: newTicker,
      to: target.ticker,
      type,
      description: makeDescription(type, newName, target.name),
    });
  }

  return newRelations;
}

export function removeRelationsForTicker(
  relations: StockRelation[],
  ticker: string
): StockRelation[] {
  return relations.filter((r) => r.from !== ticker && r.to !== ticker);
}

export function computeRelationEffects(
  targetTicker: string,
  relations: StockRelation[]
): RelationEffect[] {
  const effects: RelationEffect[] = [];

  for (const rel of relations) {
    let relatedTicker: string | null = null;
    if (rel.from === targetTicker) relatedTicker = rel.to;
    else if (rel.to === targetTicker) relatedTicker = rel.from;
    if (!relatedTicker) continue;

    // Probability check
    const probs: Record<RelationType, number> = { competitor: 0.5, supplier: 0.6, partner: 0.45 };
    if (Math.random() > probs[rel.type]) continue;

    // Impact fraction (randomized in range)
    const ranges: Record<RelationType, [number, number]> = {
      competitor: [0.20, 0.35],
      supplier: [0.25, 0.40],
      partner: [0.15, 0.30],
    };
    const [min, max] = ranges[rel.type];
    const fraction = min + Math.random() * (max - min);

    // Competitor inverts the effect, others preserve direction
    const multiplier = rel.type === 'competitor' ? -fraction : fraction;

    effects.push({
      ticker: relatedTicker,
      impactMultiplier: multiplier,
      trendShiftMultiplier: multiplier,
    });
  }

  return effects;
}
