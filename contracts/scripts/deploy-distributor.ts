import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  console.log(`\n🎁 Deploying KradlMerkleDistributor to ${network.name} (chainId: ${chainId})`);
  console.log(`   Deployer: ${deployer.address}`);

  const Distributor = await ethers.getContractFactory("KradlMerkleDistributor");
  const distributor = await Distributor.deploy();
  await distributor.waitForDeployment();

  const distributorAddress = await distributor.getAddress();
  const receipt = await distributor.deploymentTransaction()?.wait();
  const deployedBlock = receipt?.blockNumber ?? 0;

  console.log(`✅ KradlMerkleDistributor deployed at: ${distributorAddress}`);
  console.log(`   Deployed block:                     ${deployedBlock}\n`);

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
        merkleDistributor: distributorAddress,
        merkleDistributorDeployedBlock: deployedBlock,
        merkleDistributorDeployedAt: new Date().toISOString(),
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
