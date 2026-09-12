export type WhatsAppTierCode =
  | 'TIER_50'
  | 'TIER_250'
  | 'TIER_1K'
  | 'TIER_10K'
  | 'TIER_100K'
  | 'TIER_UNLIMITED';

export interface TierInfo {
  tier: WhatsAppTierCode | string;
  label: string;
  shortLabel: string;
  limit: number;
  formattedLimit: string;
  badgeVariant: 'warning' | 'success' | 'purple' | 'neutral';
  levelNumber: number;
  description: string;
  upgradeTip: string;
}

export const ALL_TIERS: TierInfo[] = [
  {
    tier: 'TIER_50',
    label: 'Tier 50 (50 contacts / 24h)',
    shortLabel: '50 / 24h',
    limit: 50,
    formattedLimit: '50',
    badgeVariant: 'warning',
    levelNumber: 1,
    description: 'Trial mode or unverified phone number. Up to 50 unique business-initiated contacts in rolling 24h.',
    upgradeTip: 'Verify your phone number and complete basic Meta setup to reach Tier 250.',
  },
  {
    tier: 'TIER_250',
    label: 'Tier 250 (250 contacts / 24h)',
    shortLabel: '250 / 24h',
    limit: 250,
    formattedLimit: '250',
    badgeVariant: 'warning',
    levelNumber: 2,
    description: 'Standard Unverified Meta Business Account. Up to 250 unique business-initiated contacts in rolling 24h.',
    upgradeTip: 'Complete Meta Business Verification in Meta Business Suite to unlock Tier 1K (1,000 / day).',
  },
  {
    tier: 'TIER_1K',
    label: 'Tier 1K (1,000 contacts / 24h)',
    shortLabel: '1K / 24h',
    limit: 1000,
    formattedLimit: '1,000',
    badgeVariant: 'success',
    levelNumber: 3,
    description: 'Tier 1 (Verified Business). Up to 1,000 unique business-initiated contacts in rolling 24h.',
    upgradeTip: 'Send at least 500 high-quality messages within a 7-day period to automatically scale to Tier 10K.',
  },
  {
    tier: 'TIER_10K',
    label: 'Tier 10K (10,000 contacts / 24h)',
    shortLabel: '10K / 24h',
    limit: 10000,
    formattedLimit: '10,000',
    badgeVariant: 'purple',
    levelNumber: 4,
    description: 'Tier 2 (High Volume). Up to 10,000 unique business-initiated contacts in rolling 24h.',
    upgradeTip: 'Maintain GREEN quality rating and send high volume to scale to Tier 100K.',
  },
  {
    tier: 'TIER_100K',
    label: 'Tier 100K (100,000 contacts / 24h)',
    shortLabel: '100K / 24h',
    limit: 100000,
    formattedLimit: '100,000',
    badgeVariant: 'purple',
    levelNumber: 5,
    description: 'Tier 3 (Enterprise Volume). Up to 100,000 unique business-initiated contacts in rolling 24h.',
    upgradeTip: 'Maintain high message quality and Meta will automatically promote you to Tier Unlimited.',
  },
  {
    tier: 'TIER_UNLIMITED',
    label: 'Tier Unlimited (Unlimited / 24h)',
    shortLabel: 'Unlimited / 24h',
    limit: Infinity,
    formattedLimit: 'Unlimited',
    badgeVariant: 'success',
    levelNumber: 6,
    description: 'Tier 4 (Unlimited). No cap on unique business-initiated contacts per 24h.',
    upgradeTip: 'Maximum tier achieved. Maintain GREEN quality rating to prevent downgrades.',
  },
];

export function getTierInfo(tier?: string | null): TierInfo {
  if (!tier) {
    return {
      tier: 'TIER_250',
      label: 'Tier 250 (250 contacts / 24h)',
      shortLabel: '250 / 24h',
      limit: 250,
      formattedLimit: '250',
      badgeVariant: 'warning',
      levelNumber: 2,
      description: 'Standard Unverified Meta Business Account. Up to 250 unique business-initiated contacts in rolling 24h.',
      upgradeTip: 'Complete Meta Business Verification in Meta Business Suite to unlock Tier 1K (1,000 / day).',
    };
  }

  const normalized = tier.toUpperCase().trim();
  const match = ALL_TIERS.find((t) => t.tier === normalized);
  if (match) return match;

  // Handle number variations like "250", "1000", "10K"
  if (normalized.includes('50') && !normalized.includes('250')) return ALL_TIERS[0];
  if (normalized.includes('250')) return ALL_TIERS[1];
  if (normalized.includes('1K') || normalized.includes('1000')) return ALL_TIERS[2];
  if (normalized.includes('10K') || normalized.includes('10000')) return ALL_TIERS[3];
  if (normalized.includes('100K') || normalized.includes('100000')) return ALL_TIERS[4];
  if (normalized.includes('UNLIMITED')) return ALL_TIERS[5];

  return {
    tier: normalized,
    label: `${tier} (250 / 24h)`,
    shortLabel: `${tier}`,
    limit: 250,
    formattedLimit: '250',
    badgeVariant: 'neutral',
    levelNumber: 2,
    description: 'Custom or unmapped 24-hour business-initiated messaging limit tier.',
    upgradeTip: 'Maintain GREEN quality rating to increase capacity.',
  };
}

export function calculateTierCapacity(audienceCount: number, tierLimit: number) {
  if (tierLimit === Infinity) {
    return {
      percentage: 0,
      isExceeded: false,
      isWarning: false,
      exceededBy: 0,
      remaining: Infinity,
    };
  }

  const percentage = Math.min(100, Math.round((audienceCount / tierLimit) * 100));
  const isExceeded = audienceCount > tierLimit;
  const isWarning = !isExceeded && percentage >= 80;
  const exceededBy = isExceeded ? audienceCount - tierLimit : 0;
  const remaining = Math.max(0, tierLimit - audienceCount);

  return {
    percentage,
    isExceeded,
    isWarning,
    exceededBy,
    remaining,
  };
}
