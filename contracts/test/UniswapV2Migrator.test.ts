import { expect } from "chai";
import { ethers } from "hardhat";

describe("UniswapV2Migrator", function () {
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

    const Factory = await ethers.getContractFactory("MockUniswapV2Factory");
    const factory = await Factory.deploy();

    const WethMock = await ethers.getContractFactory("KradlToken");
    const weth = await WethMock.deploy("Wrapped Ether", "WETH", owner.address);

    const Router = await ethers.getContractFactory("MockUniswapV2Router");
    const router = await Router.deploy(await factory.getAddress(), await weth.getAddress());

    const Migrator = await ethers.getContractFactory("UniswapV2Migrator");
    const migrator = await Migrator.deploy(await launchpad.getAddress(), await router.getAddress());

    await launchpad.connect(owner).setDexMigrator(await migrator.getAddress());

    return { owner, creator, trader, attacker, launchpad, factory, weth, router, migrator };
  }

  it("graduates a project automatically to Uniswap V2 and permanently burns LP tokens to 0x...dEaD", async function () {
    const { creator, trader, launchpad, factory, weth, router, migrator } = await deployFixture();

    const tx = await launchpad
      .connect(creator)
      .launchProject("Kradl App", "KAPP", "https://kradl.xyz/meta", 0n);
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

    // Buy enough ETH to cross graduation threshold (0.15 ETH + fees)
    await launchpad.connect(trader).buy(tokenAddr, 0n, { value: ethers.parseEther("0.20") });

    const curve = await launchpad.curves(tokenAddr);
    expect(curve.graduated).to.equal(true);

    const expectedPair = await factory.getPair(tokenAddr, await weth.getAddress());
    expect(expectedPair).to.not.equal(ethers.ZeroAddress);
    expect(curve.liquidityPool).to.equal(expectedPair);

    // Verify LP tokens were sent directly to DEAD_ADDRESS (permanent lock)
    expect(await router.lastTo()).to.equal(DEAD_ADDRESS);
    expect(await router.lastTokens()).to.equal(ethers.parseUnits("200000000", 18));
    // 98% of 0.15 ETH = 0.147 ETH (2% graduation fee went to platform)
    expect(await router.lastEth()).to.equal(ethers.parseEther("0.147"));
    // Migrator holds zero leftover tokens or ETH
    const Token = await ethers.getContractAt("KradlToken", tokenAddr);
    expect(await Token.balanceOf(await migrator.getAddress())).to.equal(0n);
  });

  it("survives front-run createPair griefing cleanly", async function () {
    const { creator, trader, attacker, launchpad, factory, weth } = await deployFixture();

    const tx = await launchpad
      .connect(creator)
      .launchProject("Grief Test", "GRF", "https://kradl.xyz", 0n);
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

    // Attacker pre-creates the Uniswap V2 pair before graduation
    await factory.connect(attacker).createPair(tokenAddr, await weth.getAddress());
    const preCreatedPair = await factory.getPair(tokenAddr, await weth.getAddress());

    // Graduation must still succeed using the existing pair
    await launchpad.connect(trader).buy(tokenAddr, 0n, { value: ethers.parseEther("0.20") });
    const curve = await launchpad.curves(tokenAddr);
    expect(curve.graduated).to.equal(true);
    expect(curve.liquidityPool).to.equal(preCreatedPair);
  });

  it("blocks unauthorized callers from invoking migrate directly", async function () {
    const { attacker, migrator, weth } = await deployFixture();

    await expect(
      migrator
        .connect(attacker)
        .migrate(await weth.getAddress(), 1000n, { value: ethers.parseEther("0.01") })
    ).to.be.revertedWithCustomError(migrator, "OnlyLaunchpad");
  });
});
