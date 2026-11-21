import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Canonical Uniswap V2 Router02 on Base Mainnet (Chain ID 8453)
// Factory: 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6
// WETH:    0x4200000000000000000000000000000000000006
const BASE_MAINNET_UNISWAP_V2_ROUTER = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  if (chainId !== 8453) {
    throw new Error(`Expected Base Mainnet (8453), got chainId ${chainId}`);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`\n🚀 Deploying Kradl Full Suite to ${network.name} (chainId: ${chainId})`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${ethers.formatEther(balance)} ETH\n`);

  const virtualEthReserve = ethers.parseEther(process.env.MAINNET_VIRTUAL_ETH || "1.0");
  const virtualTokenReserve = ethers.parseUnits("1073000000", 18);
  const graduationThreshold = ethers.parseEther(process.env.MAINNET_GRAD_THRESHOLD || "3.0");
  const creationFee = 0n;

  // 1. KradlLaunchpad
  const Launchpad = await ethers.getContractFactory("KradlLaunchpad");
  const launchpad = await Launchpad.deploy(
    deployer.address,
    virtualEthReserve,
    virtualTokenReserve,
    graduationThreshold,
    creationFee
  );
  await launchpad.waitForDeployment();
  const launchpadAddr = await launchpad.getAddress();
  const launchpadReceipt = await launchpad.deploymentTransaction()?.wait();
  const deployedBlock = launchpadReceipt?.blockNumber ?? 0;
  console.log(`✅ KradlLaunchpad:         ${launchpadAddr} (block ${deployedBlock})`);

  // 2. UniswapV2Migrator + Wire into Launchpad
  const Migrator = await ethers.getContractFactory("UniswapV2Migrator");
  const migrator = await Migrator.deploy(launchpadAddr, BASE_MAINNET_UNISWAP_V2_ROUTER);
  await migrator.waitForDeployment();
  const migratorAddr = await migrator.getAddress();
  await (await launchpad.setDexMigrator(migratorAddr)).wait();
  console.log(`✅ UniswapV2Migrator:      ${migratorAddr} (wired to Launchpad)`);

  // 3. KradlVestingVault
  const Vault = await ethers.getContractFactory("KradlVestingVault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`✅ KradlVestingVault:      ${vaultAddr}`);

  // 4. KradlMerkleDistributor
  const Distributor = await ethers.getContractFactory("KradlMerkleDistributor");
  const distributor = await Distributor.deploy();
  await distributor.waitForDeployment();
  const distributorAddr = await distributor.getAddress();
  console.log(`✅ KradlMerkleDistributor: ${distributorAddr}\n`);

  const deploymentsDir = path.resolve(__dirname, "../deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const outPath = path.join(deploymentsDir, `${chainId}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        chainId,
        network: network.name,
        launchpad: launchpadAddr,
        uniswapV2Migrator: migratorAddr,
        vestingVault: vaultAddr,
        merkleDistributor: distributorAddr,
        deployedBlock,
        virtualEthReserve: virtualEthReserve.toString(),
        virtualTokenReserve: virtualTokenReserve.toString(),
        graduationThreshold: graduationThreshold.toString(),
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`📄 Saved Base Mainnet deployment artifact to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
