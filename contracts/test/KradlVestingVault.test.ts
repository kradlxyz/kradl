import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("KradlVestingVault", function () {
  it("locks creator tokens with cliff + linear vesting and releases accurately over time", async function () {
    const [creator, other] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("KradlToken");
    const token = await TokenFactory.deploy("Kradl", "KRADL", creator.address);
    await token.waitForDeployment();

    const VaultFactory = await ethers.getContractFactory("KradlVestingVault");
    const vault = await VaultFactory.deploy();
    await vault.waitForDeployment();

    const lockAmount = ethers.parseUnits("10000000", 18); // 10M tokens
    const cliff = 30 * 24 * 60 * 60; // 30 days
    const duration = 120 * 24 * 60 * 60; // 120 days

    await token.connect(creator).approve(await vault.getAddress(), lockAmount);
    await vault
      .connect(creator)
      .createLock(await token.getAddress(), creator.address, lockAmount, cliff, duration);

    // Before cliff: 0 claimable
    expect(await vault.claimableAmount(0)).to.equal(0n);
    await expect(vault.connect(creator).claim(0)).to.be.revertedWithCustomError(
      vault,
      "NothingClaimable"
    );

    // Non-beneficiary cannot claim
    await time.increase(duration);
    await expect(vault.connect(other).claim(0)).to.be.revertedWithCustomError(
      vault,
      "NotBeneficiary"
    );

    // After full duration: 100% claimable
    const balBefore = await token.balanceOf(creator.address);
    await vault.connect(creator).claim(0);
    const balAfter = await token.balanceOf(creator.address);
    expect(balAfter - balBefore).to.equal(lockAmount);
    expect(await vault.claimableAmount(0)).to.equal(0n);
  });

  it("releases proportional linear amount midway after cliff", async function () {
    const [creator] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("KradlToken");
    const token = await TokenFactory.deploy("Kradl", "KRADL", creator.address);
    await token.waitForDeployment();

    const VaultFactory = await ethers.getContractFactory("KradlVestingVault");
    const vault = await VaultFactory.deploy();
    await vault.waitForDeployment();

    const lockAmount = ethers.parseUnits("1000", 18);
    const cliff = 100;
    const duration = 1000;

    await token.connect(creator).approve(await vault.getAddress(), lockAmount);
    await vault
      .connect(creator)
      .createLock(await token.getAddress(), creator.address, lockAmount, cliff, duration);

    await time.increase(500); // 50% of duration
    const claimable = await vault.claimableAmount(0);
    expect(claimable).to.be.gte(ethers.parseUnits("500", 18));
    expect(claimable).to.be.lt(ethers.parseUnits("510", 18));

    await vault.connect(creator).claim(0);
    await time.increase(600); // past 100%
    await vault.connect(creator).claim(0);

    expect(await token.balanceOf(await vault.getAddress())).to.equal(0n);
  });
});
