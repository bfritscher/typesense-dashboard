export interface ProductMerchandisingFields {
  id: string;
  is_featured: boolean;
  featured_rank: number;
  is_promoted: boolean;
  is_exclusive: boolean;
  pin_priority: number;
  default_rank: number;
  default_rank_with_pin: number;
  popularity: number;
  merchandising_source: string | null;
}

export interface MerchandisingEdit {
  docId: string;
  original: Partial<ProductMerchandisingFields>;
  changes: Partial<ProductMerchandisingFields>;
}

export interface BatchUpdateResult {
  success: boolean;
  docId: string;
  error?: string;
}

export const DEFAULT_PIN_MULTIPLIER = 10_000_000_000;
export const DEFAULT_FEATURED_MULTIPLIER = 1_000_000_000;

export function calculateDefaultRank(
  isFeatured: boolean,
  popularity: number,
  featuredMultiplier = DEFAULT_FEATURED_MULTIPLIER,
): number {
  return (isFeatured ? featuredMultiplier : 0) + popularity;
}

export function calculateDefaultRankWithPin(
  pinPriority: number,
  defaultRank: number,
  pinMultiplier = DEFAULT_PIN_MULTIPLIER,
): number {
  return pinPriority * pinMultiplier + defaultRank;
}
