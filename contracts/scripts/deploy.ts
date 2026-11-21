import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  console.log(`\n🚀 Deploying KradlLaunchpad to ${network.name} (chainId: ${chainId})`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Curve defaults: testnet uses smaller graduation threshold for easy E2E testing
  const isTestnet = chainId === 31337 || chainId === 46630 || chainId === 84532;
  const virtualEthReserve = isTestnet ? ethers.parseEther("0.05") : ethers.parseEther("1.5");
  const virtualTokenReserve = ethers.parseUnits("1073000000", 18); // 1.073B virtual tokens
  const graduationThreshold = isTestnet ? ethers.parseEther("0.15") : ethers.parseEther("5.0");
  const creationFee = 0n;

  const Launchpad = await ethers.getContractFactory("KradlLaunchpad");
  const launchpad = await Launchpad.deploy(
    deployer.address,
    virtualEthReserve,
    virtualTokenReserve,
    graduationThreshold,
    creationFee
  );
  await launchpad.waitForDeployment();

  const launchpadAddress = await launchpad.getAddress();
  const receipt = await launchpad.deploymentTransaction()?.wait();
  const deployedBlock = receipt?.blockNumber ?? 0;

  console.log(`✅ KradlLaunchpad deployed at: ${launchpadAddress}`);
  console.log(`   Deployed block:             ${deployedBlock}`);
  console.log(`   Virtual ETH Reserve:        ${ethers.formatEther(virtualEthReserve)} ETH`);
  console.log(`   Graduation Threshold:       ${ethers.formatEther(graduationThreshold)} ETH\n`);

  // Save deployment record
  const deploymentsDir = path.resolve(__dirname, "../deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const outPath = path.join(deploymentsDir, `${chainId}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        chainId,
        network: network.name,
        launchpad: launchpadAddress,
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
  console.log(`📄 Saved deployment artifact to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
