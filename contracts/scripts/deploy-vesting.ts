import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  console.log(`\n🔒 Deploying KradlVestingVault to ${network.name} (chainId: ${chainId})`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(
    `   Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`
  );

  const Vault = await ethers.getContractFactory("KradlVestingVault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  const receipt = await vault.deploymentTransaction()?.wait();
  const deployedBlock = receipt?.blockNumber ?? 0;

  console.log(`✅ KradlVestingVault deployed at: ${vaultAddress}`);
  console.log(`   Deployed block:                ${deployedBlock}\n`);

  const deploymentsDir = path.resolve(__dirname, "../deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const outPath = path.join(deploymentsDir, `${chainId}.json`);

  let existing: Record<string, unknown> = { chainId, network: network.name };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
  }

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        ...existing,
        vestingVault: vaultAddress,
        vestingVaultDeployedBlock: deployedBlock,
        vestingVaultDeployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`📄 Updated deployment artifact at ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
