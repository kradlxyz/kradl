import { expect } from "chai";
import { ethers } from "hardhat";
import { KradlLaunchpad, KradlToken, MockDexMigrator } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("KradlLaunchpad", function () {
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let trader1: HardhatEthersSigner;
  let trader2: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  let launchpad: KradlLaunchpad;
  let migrator: MockDexMigrator;

  const VIRTUAL_ETH = ethers.parseEther("1.5");
  const VIRTUAL_TOKENS = ethers.parseUnits("1073000000", 18);
  const GRAD_THRESHOLD = ethers.parseEther("5.0");
  const CREATION_FEE = 0n;

  beforeEach(async function () {
    [owner, creator, trader1, trader2, treasury] = await ethers.getSigners();

    const LaunchpadFactory = await ethers.getContractFactory("KradlLaunchpad");
    launchpad = await LaunchpadFactory.deploy(
      owner.address,
      VIRTUAL_ETH,
      VIRTUAL_TOKENS,
      GRAD_THRESHOLD,
      CREATION_FEE
    );
    await launchpad.waitForDeployment();

    const MigratorFactory = await ethers.getContractFactory("MockDexMigrator");
    migrator = await MigratorFactory.deploy();
    await migrator.waitForDeployment();
  });

  async function launchSampleProject(initialBuyEth = 0n): Promise<{
    tokenAddress: string;
    token: KradlToken;
  }> {
    const tx = await launchpad
      .connect(creator)
      .launchProject("NovaSQL AI", "NSQL", "kradl://project/novasql", 0n, {
        value: initialBuyEth,
      });
    const receipt = await tx.wait();
    const launchEvent = receipt!.logs
      .map((log) => {
        try {
          return launchpad.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed?.name === "ProjectLaunched");

    const tokenAddress = launchEvent!.args.token as string;
    const token = (await ethers.getContractAt("KradlToken", tokenAddress)) as unknown as KradlToken;
    return { tokenAddress, token };
  }

  it("launches a fair-launch ERC-20 token with 1B fixed supply", async function () {
    const { tokenAddress, token } = await launchSampleProject();

    expect(await token.name()).to.equal("NovaSQL AI");
    expect(await token.symbol()).to.equal("NSQL");
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("1000000000", 18));
    expect(await token.balanceOf(await launchpad.getAddress())).to.equal(
      ethers.parseUnits("1000000000", 18)
    );
    expect(await launchpad.totalProjects()).to.equal(1n);

    const curve = await launchpad.curves(tokenAddress);
    expect(curve.creator).to.equal(creator.address);
    expect(curve.realTokenReserve).to.equal(ethers.parseUnits("800000000", 18));
    expect(curve.dexTokenReserve).to.equal(ethers.parseUnits("200000000", 18));
    expect(curve.graduated).to.equal(false);
  });

  it("supports initial creator buy atomically during launchProject", async function () {
    const buyEth = ethers.parseEther("0.5");
    const { tokenAddress, token } = await launchSampleProject(buyEth);

    const creatorBalance = await token.balanceOf(creator.address);
    expect(creatorBalance).to.be.gt(0n);

    // 0.5% platform + 0.5% creator fee on 0.5 ETH = 0.0025 ETH each
    expect(await launchpad.platformFeesAccrued()).to.equal(ethers.parseEther("0.0025"));
    expect(await launchpad.creatorFeesAccrued(creator.address)).to.equal(
      ethers.parseEther("0.0025")
    );

    const curve = await launchpad.curves(tokenAddress);
    expect(curve.realEthReserve).to.equal(ethers.parseEther("0.495"));
  });

  it("executes buy and sell with exact 0.5% platform + 0.5% creator fee split and ETH accounting invariant", async function () {
    const { tokenAddress, token } = await launchSampleProject();

    // Trader1 buys 1 ETH worth
    const buyValue = ethers.parseEther("1.0");
    const [quotedTokens, qPlatformFee, qCreatorFee] = await launchpad.quoteBuy(
      tokenAddress,
      buyValue
    );
    expect(qPlatformFee).to.equal(ethers.parseEther("0.005"));
    expect(qCreatorFee).to.equal(ethers.parseEther("0.005"));

    await launchpad.connect(trader1).buy(tokenAddress, quotedTokens, { value: buyValue });
    expect(await token.balanceOf(trader1.address)).to.equal(quotedTokens);

    // Trader1 sells half back
    const sellAmount = quotedTokens / 2n;
    const [quotedNetEth] = await launchpad.quoteSell(tokenAddress, sellAmount);
    await token.connect(trader1).approve(await launchpad.getAddress(), sellAmount);

    const ethBefore = await ethers.provider.getBalance(trader1.address);
    const sellTx = await launchpad.connect(trader1).sell(tokenAddress, sellAmount, quotedNetEth);
    const sellReceipt = await sellTx.wait();
    const gasCost = sellReceipt!.gasUsed * sellReceipt!.gasPrice;
    const ethAfter = await ethers.provider.getBalance(trader1.address);

    expect(ethAfter + gasCost - ethBefore).to.equal(quotedNetEth);

    // Accounting Invariant: contract ETH balance == realEthReserve + platformFees + creatorFees
    const curve = await launchpad.curves(tokenAddress);
    const contractBalance = await ethers.provider.getBalance(await launchpad.getAddress());
    const accountedEth =
      curve.realEthReserve +
      (await launchpad.platformFeesAccrued()) +
      (await launchpad.creatorFeesAccrued(creator.address));
    expect(contractBalance).to.equal(accountedEth);
  });

  it("reverts on slippage exceeded for buy and sell", async function () {
    const { tokenAddress, token } = await launchSampleProject();
    const buyValue = ethers.parseEther("0.5");
    const [quotedTokens] = await launchpad.quoteBuy(tokenAddress, buyValue);

    await expect(
      launchpad.connect(trader1).buy(tokenAddress, quotedTokens + 1n, { value: buyValue })
    ).to.be.revertedWithCustomError(launchpad, "SlippageExceeded");

    await launchpad.connect(trader1).buy(tokenAddress, quotedTokens, { value: buyValue });
    await token.connect(trader1).approve(await launchpad.getAddress(), quotedTokens);
    const [quotedNetEth] = await launchpad.quoteSell(tokenAddress, quotedTokens);

    await expect(
      launchpad.connect(trader1).sell(tokenAddress, quotedTokens, quotedNetEth + 1n)
    ).to.be.revertedWithCustomError(launchpad, "SlippageExceeded");
  });

  it("refunds excess ETH on graduation, takes 2% graduation fee, and migrates to DEX migrator", async function () {
    await launchpad.connect(owner).setDexMigrator(await migrator.getAddress());
    const { tokenAddress } = await launchSampleProject();

    // Send 8 ETH when graduationThreshold is 5 ETH -> should graduate & refund excess
    const hugeBuy = ethers.parseEther("8.0");
    const balBefore = await ethers.provider.getBalance(trader2.address);
    const tx = await launchpad.connect(trader2).buy(tokenAddress, 0n, { value: hugeBuy });
    const receipt = await tx.wait();
    const gasCost = receipt!.gasUsed * receipt!.gasPrice;
    const balAfter = await ethers.provider.getBalance(trader2.address);

    const netSpent = balBefore - balAfter - gasCost;
    // Should only spend ~5.0505 ETH (5 ETH net + 1% trade fee), refunding ~2.95 ETH
    expect(netSpent).to.be.lt(ethers.parseEther("5.06"));
    expect(netSpent).to.be.gt(ethers.parseEther("5.04"));

    const curve = await launchpad.curves(tokenAddress);
    expect(curve.graduated).to.equal(true);
    expect(curve.realEthReserve).to.equal(0n);
    expect(curve.liquidityPool).to.not.equal(ethers.ZeroAddress);

    // 2% graduation fee on 5 ETH = 0.1 ETH; 98% = 4.9 ETH migrated to DEX
    expect(await migrator.migratedEth(tokenAddress)).to.equal(ethers.parseEther("4.9"));
    expect(await migrator.migratedTokens(tokenAddress)).to.equal(
      ethers.parseUnits("200000000", 18)
    );

    // Further buys/sells on graduated token must revert
    await expect(
      launchpad.connect(trader1).buy(tokenAddress, 0n, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWithCustomError(launchpad, "AlreadyGraduated");

    // Invariant: contract ETH balance == platformFees + creatorFees
    const contractBalance = await ethers.provider.getBalance(await launchpad.getAddress());
    const expectedBalance =
      (await launchpad.platformFeesAccrued()) +
      (await launchpad.creatorFeesAccrued(creator.address));
    expect(contractBalance).to.equal(expectedBalance);
  });

  it("parks funds safely in pendingMigrations if no DEX migrator is set yet, then migrates later", async function () {
    const { tokenAddress } = await launchSampleProject();
    await launchpad.connect(trader2).buy(tokenAddress, 0n, { value: ethers.parseEther("6.0") });

    const pm = await launchpad.pendingMigrations(tokenAddress);
    expect(pm.pending).to.equal(true);
    expect(pm.ethAmount).to.equal(ethers.parseEther("4.9"));

    // Owner configures DEX migrator later and executes pending migration
    await launchpad.connect(owner).setDexMigrator(await migrator.getAddress());
    await launchpad.connect(owner).executePendingMigration(tokenAddress);

    const pmAfter = await launchpad.pendingMigrations(tokenAddress);
    expect(pmAfter.pending).to.equal(false);
    expect(await migrator.migratedEth(tokenAddress)).to.equal(ethers.parseEther("4.9"));
  });

  it("allows creator and platform owner to claim accrued fees via pull-payment", async function () {
    const { tokenAddress } = await launchSampleProject();
    await launchpad.connect(trader1).buy(tokenAddress, 0n, { value: ethers.parseEther("2.0") });

    const creatorFee = await launchpad.creatorFeesAccrued(creator.address);
    const platformFee = await launchpad.platformFeesAccrued();
    expect(creatorFee).to.equal(ethers.parseEther("0.01"));
    expect(platformFee).to.equal(ethers.parseEther("0.01"));

    // Creator claims
    const cBefore = await ethers.provider.getBalance(creator.address);
    const cTx = await launchpad.connect(creator).claimCreatorFees();
    const cRec = await cTx.wait();
    const cAfter = await ethers.provider.getBalance(creator.address);
    expect(cAfter + cRec!.gasUsed * cRec!.gasPrice - cBefore).to.equal(creatorFee);
    expect(await launchpad.creatorFeesAccrued(creator.address)).to.equal(0n);

    // Double claim reverts
    await expect(launchpad.connect(creator).claimCreatorFees()).to.be.revertedWithCustomError(
      launchpad,
      "NothingToClaim"
    );

    // Non-owner cannot claim platform fees
    await expect(
      launchpad.connect(trader1).claimPlatformFees(trader1.address)
    ).to.be.revertedWithCustomError(launchpad, "OwnableUnauthorizedAccount");

    // Owner claims platform fees to treasury
    const tBefore = await ethers.provider.getBalance(treasury.address);
    await launchpad.connect(owner).claimPlatformFees(treasury.address);
    const tAfter = await ethers.provider.getBalance(treasury.address);
    expect(tAfter - tBefore).to.equal(platformFee);
    expect(await launchpad.platformFeesAccrued()).to.equal(0n);
  });

  it("rejects oversized name, symbol, or metadataUri to prevent indexer event bloat", async function () {
    const longName = "A".repeat(65);
    await expect(
      launchpad.connect(creator).launchProject(longName, "SYM", "kradl://ok", 0n)
    ).to.be.revertedWithCustomError(launchpad, "EmptyInput");

    const longSymbol = "S".repeat(17);
    await expect(
      launchpad.connect(creator).launchProject("Valid App", longSymbol, "kradl://ok", 0n)
    ).to.be.revertedWithCustomError(launchpad, "EmptyInput");

    const longUri = "u".repeat(257);
    await expect(
      launchpad.connect(creator).launchProject("Valid App", "SYM", longUri, 0n)
    ).to.be.revertedWithCustomError(launchpad, "EmptyInput");
  });
});
