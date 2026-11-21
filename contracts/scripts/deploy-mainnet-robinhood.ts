import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Canonical Uniswap V3 & WETH addresses on Robinhood Chain Mainnet (Chain ID 4663)
const ROBINHOOD_MAINNET_POSITION_MANAGER = "0x73991a25c818bf1f1128deaab1492d45638de0d3";
const ROBINHOOD_MAINNET_WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  if (chainId !== 4663) {
    throw new Error(`Expected Robinhood Chain Mainnet (4663), got chainId ${chainId}`);
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

  // 2. UniswapV3Migrator + Wire into Launchpad
  const Migrator = await ethers.getContractFactory("UniswapV3Migrator");
  const migrator = await Migrator.deploy(
    launchpadAddr,
    ROBINHOOD_MAINNET_POSITION_MANAGER,
    ROBINHOOD_MAINNET_WETH
  );
  await migrator.waitForDeployment();
  const migratorAddr = await migrator.getAddress();
  await (await launchpad.setDexMigrator(migratorAddr)).wait();
  console.log(`✅ UniswapV3Migrator:      ${migratorAddr} (wired to Launchpad)`);

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
        uniswapV3Migrator: migratorAddr,
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
  console.log(`📄 Saved Robinhood Mainnet deployment artifact to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
