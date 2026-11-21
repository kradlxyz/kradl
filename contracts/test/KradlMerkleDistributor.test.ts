import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

function hashLeaf(index: number, account: string, amount: bigint): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const inner = ethers.keccak256(abiCoder.encode(["uint256", "address", "uint256"], [index, account, amount]));
  return ethers.keccak256(inner);
}

function hashPair(a: string, b: string): string {
  return BigInt(a) < BigInt(b)
    ? ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [a, b])
    : ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [b, a]);
}

describe("KradlMerkleDistributor", function () {
  async function deployFixture() {
    const [creator, alice, bob, attacker] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("KradlToken");
    const token = await Token.deploy("Kradl Reward", "KRADL", creator.address);

    const Distributor = await ethers.getContractFactory("KradlMerkleDistributor");
    const distributor = await Distributor.deploy();

    const amountAlice = ethers.parseUnits("1000", 18);
    const amountBob = ethers.parseUnits("2500", 18);
    const totalAmount = amountAlice + amountBob;

    const leaf0 = hashLeaf(0, alice.address, amountAlice);
    const leaf1 = hashLeaf(1, bob.address, amountBob);
    const merkleRoot = hashPair(leaf0, leaf1);

    const now = await time.latest();
    const deadline = now + 30 * 86_400; // 30 days

    await token.connect(creator).approve(await distributor.getAddress(), totalAmount);
    await distributor
      .connect(creator)
      .createCampaign(await token.getAddress(), merkleRoot, totalAmount, deadline);

    return {
      creator,
      alice,
      bob,
      attacker,
      token,
      distributor,
      amountAlice,
      amountBob,
      totalAmount,
      leaf0,
      leaf1,
      merkleRoot,
      deadline,
    };
  }

  it("allows valid claims and prevents double claiming", async function () {
    const { alice, token, distributor, amountAlice, leaf1 } = await deployFixture();

    expect(await distributor.isClaimed(0, 0)).to.equal(false);

    await distributor.connect(alice).claim(0, 0, alice.address, amountAlice, [leaf1]);

    expect(await distributor.isClaimed(0, 0)).to.equal(true);
    expect(await token.balanceOf(alice.address)).to.equal(amountAlice);

    // Double claim must revert
    await expect(
      distributor.connect(alice).claim(0, 0, alice.address, amountAlice, [leaf1])
    ).to.be.revertedWithCustomError(distributor, "AlreadyClaimed");
  });

  it("rejects tampered proofs, wrong amounts, and wrong accounts", async function () {
    const { alice, attacker, distributor, amountAlice, leaf0, leaf1 } = await deployFixture();

    // Attacker tries to claim Alice's leaf to attacker's address
    await expect(
      distributor.connect(attacker).claim(0, 0, attacker.address, amountAlice, [leaf1])
    ).to.be.revertedWithCustomError(distributor, "InvalidProof");

    // Wrong amount
    await expect(
      distributor.connect(alice).claim(0, 0, alice.address, amountAlice + 1n, [leaf1])
    ).to.be.revertedWithCustomError(distributor, "InvalidProof");

    // Wrong proof
    await expect(
      distributor.connect(alice).claim(0, 0, alice.address, amountAlice, [leaf0])
    ).to.be.revertedWithCustomError(distributor, "InvalidProof");
  });

  it("blocks claims after deadline and lets only creator sweep unclaimed tokens", async function () {
    const { creator, alice, bob, attacker, token, distributor, amountAlice, amountBob, leaf0, leaf1, deadline } =
      await deployFixture();

    // Alice claims before deadline
    await distributor.connect(alice).claim(0, 0, alice.address, amountAlice, [leaf1]);

    // Creator cannot sweep while active
    await expect(
      distributor.connect(creator).sweepExpired(0)
    ).to.be.revertedWithCustomError(distributor, "CampaignActive");

    // Advance past deadline
    await time.increaseTo(deadline + 1);

    // Bob can no longer claim after deadline
    await expect(
      distributor.connect(bob).claim(0, 1, bob.address, amountBob, [leaf0])
    ).to.be.revertedWithCustomError(distributor, "CampaignExpired");

    // Non-creator cannot sweep
    await expect(
      distributor.connect(attacker).sweepExpired(0)
    ).to.be.revertedWithCustomError(distributor, "NotCreator");

    // Creator sweeps Bob's unclaimed tokens
    const balBefore = await token.balanceOf(creator.address);
    await distributor.connect(creator).sweepExpired(0);
    const balAfter = await token.balanceOf(creator.address);
    expect(balAfter - balBefore).to.equal(amountBob);

    // Sweeping twice reverts
    await expect(
      distributor.connect(creator).sweepExpired(0)
    ).to.be.revertedWithCustomError(distributor, "InsufficientRemaining");
  });

  it("rejects invalid campaign creation parameters", async function () {
    const { creator, token, distributor, merkleRoot } = await deployFixture();
    const now = await time.latest();

    await expect(
      distributor.connect(creator).createCampaign(ethers.ZeroAddress, merkleRoot, 100n, now + 100)
    ).to.be.revertedWithCustomError(distributor, "InvalidParams");

    await expect(
      distributor.connect(creator).createCampaign(await token.getAddress(), ethers.ZeroHash, 100n, now + 100)
    ).to.be.revertedWithCustomError(distributor, "InvalidParams");

    await expect(
      distributor.connect(creator).createCampaign(await token.getAddress(), merkleRoot, 100n, now - 1)
    ).to.be.revertedWithCustomError(distributor, "InvalidParams");
  });
});
