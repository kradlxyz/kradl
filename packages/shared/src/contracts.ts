import { DeployedContractsMap } from "./types.js";

/**
 * Default Launchpad contract registry per chainId.
 * Override via environment variables (NEXT_PUBLIC_LAUNCHPAD_ADDRESS_<chainId>).
 */
export const DEFAULT_DEPLOYED_CONTRACTS: DeployedContractsMap = {
  4663: {
    launchpad: "0x2FEE1b921F68A19bFdA0B587dff8bC245727D518",
    vestingVault: "0x94DD22D82Ae5f4370BCEBF97F94A505D413a70F5",
    merkleDistributor: "0xd352961fc0b140F73142FF8EB20B59c077d6e8bF",
    deployedBlock: 119616143,
  },
  46630: {
    launchpad: "0x2FEE1b921F68A19bFdA0B587dff8bC245727D518",
    vestingVault: "0xD02a30af2430FD2CCE14987016819AeD4744d20f",
    merkleDistributor: "0xe66D459b6E4E5b70Cb6129f827869E3e5D38E60C",
    deployedBlock: 155815386,
  },
};

export function getLaunchpadAddress(
  chainId: number,
  env?: Record<string, string | undefined>
): `0x${string}` | null {
  const resolvedEnv =
    env ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ??
    {};
  const fromEnv =
    resolvedEnv[`NEXT_PUBLIC_LAUNCHPAD_ADDRESS_${chainId}`] ||
    resolvedEnv[`LAUNCHPAD_ADDRESS_${chainId}`];
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) {
    return fromEnv as `0x${string}`;
  }
  return DEFAULT_DEPLOYED_CONTRACTS[chainId]?.launchpad ?? null;
}

export function getVestingVaultAddress(
  chainId: number,
  env?: Record<string, string | undefined>
): `0x${string}` | null {
  const resolvedEnv =
    env ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ??
    {};
  const fromEnv =
    resolvedEnv[`NEXT_PUBLIC_VESTING_VAULT_ADDRESS_${chainId}`] ||
    resolvedEnv[`VESTING_VAULT_ADDRESS_${chainId}`];
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) {
    return fromEnv as `0x${string}`;
  }
  return DEFAULT_DEPLOYED_CONTRACTS[chainId]?.vestingVault ?? null;
}

export function getMerkleDistributorAddress(
  chainId: number,
  env?: Record<string, string | undefined>
): `0x${string}` | null {
  const resolvedEnv =
    env ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ??
    {};
  const fromEnv =
    resolvedEnv[`NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS_${chainId}`] ||
    resolvedEnv[`MERKLE_DISTRIBUTOR_ADDRESS_${chainId}`];
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) {
    return fromEnv as `0x${string}`;
  }
  return DEFAULT_DEPLOYED_CONTRACTS[chainId]?.merkleDistributor ?? null;
}

export function getLaunchpadStartBlock(chainId: number): bigint {
  const block = DEFAULT_DEPLOYED_CONTRACTS[chainId]?.deployedBlock ?? 0;
  return BigInt(block);
}
