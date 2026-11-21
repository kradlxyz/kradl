import { expect } from "chai";
import { ethers } from "hardhat";

describe("UniswapV3Migrator", function () {
  const VIRTUAL_ETH = ethers.parseEther("0.05");
  const VIRTUAL_TOKEN = ethers.parseUnits("1073000000", 18);
  const GRAD_THRESHOLD = ethers.parseEther("0.15");
  const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

  async function deployFixture() {
    const [owner, creator, trader, attacker] = await ethers.getSigners();

    const Launchpad = await ethers.getContractFactory("KradlLaunchpad");
    const launchpad = await Launchpad.deploy(
      owner.address,
      VIRTUAL_ETH,
      VIRTUAL_TOKEN,
      GRAD_THRESHOLD,
      0n
    );

    const Weth = await ethers.getContractFactory("MockWETH9");
    const weth = await Weth.deploy();

    const PositionManager = await ethers.getContractFactory("MockUniswapV3PositionManager");
    const positionManager = await PositionManager.deploy();

    const Migrator = await ethers.getContractFactory("UniswapV3Migrator");
    const migrator = await Migrator.deploy(
      await launchpad.getAddress(),
      await positionManager.getAddress(),
      await weth.getAddress()
    );

    await launchpad.connect(owner).setDexMigrator(await migrator.getAddress());

    return { owner, creator, trader, attacker, launchpad, weth, positionManager, migrator };
  }

  it("graduates a project to Uniswap V3 full-range pool and burns the LP NFT to 0x...dEaD", async function () {
    const { creator, trader, launchpad, weth, positionManager, migrator } = await deployFixture();

    const tx = await launchpad
      .connect(creator)
      .launchProject("Robinhood App", "RHAPP", "https://kradl.xyz", 0n);
    const receipt = await tx.wait();
    const launchedEvent = receipt?.logs
      .map((l) => {
        try {
          return launchpad.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((p) => p?.name === "ProjectLaunched");
    const tokenAddr = launchedEvent!.args.token as string;

    await launchpad.connect(trader).buy(tokenAddr, 0n, { value: ethers.parseEther("0.20") });

    const curve = await launchpad.curves(tokenAddr);
    expect(curve.graduated).to.equal(true);
    expect(curve.liquidityPool).to.not.equal(ethers.ZeroAddress);

    // LP Position NFT sent directly to DEAD_ADDRESS (permanent lock)
    expect(await positionManager.lastRecipient()).to.equal(DEAD_ADDRESS);
    expect(await positionManager.lastTickLower()).to.equal(-887_200);
    expect(await positionManager.lastTickUpper()).to.equal(887_200);
    expect(await positionManager.lastSqrtPriceX96()).to.be.gt(0n);

    // Migrator retains zero leftover tokens or WETH
    const Token = await ethers.getContractAt("KradlToken", tokenAddr);
    expect(await Token.balanceOf(await migrator.getAddress())).to.equal(0n);
    expect(await weth.balanceOf(await migrator.getAddress())).to.equal(0n);
  });

  it("computes accurate non-overflowing sqrtPriceX96 in both token0/token1 sort orders", async function () {
    const { migrator } = await deployFixture();

    const tokens = ethers.parseUnits("200000000", 18); // 200M tokens
    const eth = ethers.parseEther("5"); // 5 ETH

    const p1 = await migrator.computeSqrtPriceX96(tokens, eth);
    const p2 = await migrator.computeSqrtPriceX96(eth, tokens);

    expect(p1).to.be.gt(0n);
    expect(p2).to.be.gt(0n);

    // p1 * p2 should equal (2^96)^2 within 0.01% rounding
    const q192 = 1n << 192n;
    const product = p1 * p2;
    const diff = product > q192 ? product - q192 : q192 - product;
    expect(diff * 10_000n).to.be.lt(q192);
  });

  it("rejects unauthorized direct calls to migrate", async function () {
    const { attacker, migrator, weth } = await deployFixture();

    await expect(
      migrator
        .connect(attacker)
        .migrate(await weth.getAddress(), 1000n, { value: ethers.parseEther("0.01") })
    ).to.be.revertedWithCustomError(migrator, "OnlyLaunchpad");
  });
});
