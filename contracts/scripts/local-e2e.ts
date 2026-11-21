import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Local E2E script: deploys KradlLaunchpad to Hardhat localhost (31337),
 * launches 3 real on-chain app tokens, executes real buys/sells across accounts
 * (generating real Trade events across blocks), and saves the Launchpad address
 * to .env & apps/web/.env so the Indexer & Web UI sync live on-chain data.
 */
async function main() {
  const [deployer, builder1, builder2, builder3, trader1, trader2] = await ethers.getSigners();

  const virtualEth = ethers.parseEther("0.5");
  const virtualTokens = ethers.parseUnits("1073000000", 18);
  const gradThreshold = ethers.parseEther("2.0");

  const Launchpad = await ethers.getContractFactory("KradlLaunchpad");
  const launchpad = await Launchpad.deploy(
    deployer.address,
    virtualEth,
    virtualTokens,
    gradThreshold,
    0n
  );
  await launchpad.waitForDeployment();
  const launchpadAddr = await launchpad.getAddress();
  console.log(`✅ KradlLaunchpad deployed on localhost (31337): ${launchpadAddr}`);

  const demoProjects = [
    {
      signer: builder1,
      name: "NovaSQL",
      symbol: "NSQL",
      uri: "kradl://novasql",
      initialBuy: "0.12",
      trades: [
        { signer: trader1, buyEth: "0.25" },
        { signer: trader2, buyEth: "0.40" },
        { signer: trader1, buyEth: "0.18" },
      ],
    },
    {
      signer: builder2,
      name: "PulseDiff",
      symbol: "PDIFF",
      uri: "kradl://pulsediff",
      initialBuy: "0.08",
      trades: [
        { signer: trader2, buyEth: "0.15" },
        { signer: trader1, buyEth: "0.22" },
      ],
    },
    {
      signer: builder3,
      name: "VoxelForge",
      symbol: "VXFG",
      uri: "kradl://voxelforge",
      initialBuy: "0.05",
      trades: [
        { signer: trader1, buyEth: "0.10" },
        { signer: trader2, buyEth: "0.35" },
        { signer: trader1, buyEth: "0.30" },
      ],
    },
  ];

  const launched: Array<{ symbol: string; address: string; creator: string }> = [];

  for (const proj of demoProjects) {
    const tx = await launchpad
      .connect(proj.signer)
      .launchProject(proj.name, proj.symbol, proj.uri, 0n, {
        value: ethers.parseEther(proj.initialBuy),
      });
    const receipt = await tx.wait();
    const ev = receipt!.logs
      .map((l) => {
        try {
          return launchpad.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((p) => p?.name === "ProjectLaunched");
    const tokenAddr = ev!.args.token as string;
    launched.push({ symbol: proj.symbol, address: tokenAddr, creator: proj.signer.address });
    console.log(`   🚀 Launched ${proj.name} ($${proj.symbol}) at ${tokenAddr}`);

    for (const tr of proj.trades) {
      await ethers.provider.send("evm_increaseTime", [300]); // +5m between candles
      await ethers.provider.send("evm_mine", []);
      const bTx = await launchpad
        .connect(tr.signer)
        .buy(tokenAddr, 0n, { value: ethers.parseEther(tr.buyEth) });
      await bTx.wait();
    }
  }

  // Update root .env & apps/web/.env with NEXT_PUBLIC_LAUNCHPAD_ADDRESS_31337
  for (const envRel of ["../../.env", "../../apps/web/.env"]) {
    const envPath = path.resolve(__dirname, envRel);
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
    const line = `NEXT_PUBLIC_LAUNCHPAD_ADDRESS_31337="${launchpadAddr}"`;
    if (content.includes("NEXT_PUBLIC_LAUNCHPAD_ADDRESS_31337=")) {
      content = content.replace(/NEXT_PUBLIC_LAUNCHPAD_ADDRESS_31337=.*/g, line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
    fs.writeFileSync(envPath, content);
  }

  const outPath = path.resolve(__dirname, "../deployments/31337-demo.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ launchpad: launchpadAddr, launched }, null, 2)
  );
  console.log(`\n📄 Saved local E2E state to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
