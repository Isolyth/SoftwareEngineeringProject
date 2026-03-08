import type { RelationType } from './types';

export const RELATION_DESCRIPTIONS: Record<RelationType, string[]> = {
  competitor: [
    '{from} competes directly with {to}',
    '{from} and {to} are rivals in the same market',
    '{from} is losing market share to {to}',
    '{from} and {to} fight over the same customers',
    '{from} launched a product to counter {to}',
    '{from} undercuts {to} on pricing',
  ],
  supplier: [
    '{from} supplies key components to {to}',
    '{to} depends on materials from {from}',
    '{from} is a critical vendor for {to}',
    '{to} sources infrastructure from {from}',
    '{from} provides manufacturing for {to}',
    '{to} requires parts made by {from}',
  ],
  partner: [
    '{from} and {to} have a joint venture',
    '{from} partnered with {to} on distribution',
    '{to} licenses technology from {from}',
    '{from} and {to} co-develop products',
    '{from} has a revenue-sharing deal with {to}',
    '{to} and {from} share R&D facilities',
  ],
};
