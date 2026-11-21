export const PROJECT_CATEGORIES = [
  "AI & Agents",
  "SaaS & Tools",
  "Games",
  "DeFi",
  "Social",
  "Open Source",
  "Other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "1d";

export interface DeployedContractsMap {
  [chainId: number]: {
    launchpad: `0x${string}`;
    vestingVault?: `0x${string}`;
    merkleDistributor?: `0x${string}`;
    deployedBlock: number;
  };
}
