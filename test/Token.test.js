const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  async function deployToken() {
    const [owner, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.deployed();
    return { token, owner, alice, bob };
  }

  it("mints on deposit and burns on withdraw", async function () {
    const { token, alice } = await deployToken();
    const amount = ethers.utils.parseEther("1");

    await expect(token.connect(alice).deposit({ value: amount }))
      .to.emit(token, "Deposit")
      .withArgs(alice.address, amount);

    expect(await token.balanceOf(alice.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(amount);

    await expect(token.connect(alice).withdraw(amount))
      .to.emit(token, "Withdrawal")
      .withArgs(alice.address, amount);

    expect(await token.balanceOf(alice.address)).to.equal(0);
    expect(await token.totalSupply()).to.equal(0);
  });

  it("distributes dividends pro-rata to holders", async function () {
    const { token, alice, bob } = await deployToken();

    await token.connect(alice).deposit({ value: ethers.utils.parseEther("1") });
    await token.connect(bob).deposit({ value: ethers.utils.parseEther("3") });

    await expect(token.distributeDividends({ value: ethers.utils.parseEther("2") }))
      .to.emit(token, "DividendsDistributed");

    expect(await token.dividends(alice.address)).to.equal(ethers.utils.parseEther("0.5"));
    expect(await token.dividends(bob.address)).to.equal(ethers.utils.parseEther("1.5"));
  });

  it("keeps dividends after token transfer until claim", async function () {
    const { token, owner, alice, bob } = await deployToken();

    await token.connect(alice).deposit({ value: ethers.utils.parseEther("1") });
    await token.connect(bob).deposit({ value: ethers.utils.parseEther("3") });
    await token.distributeDividends({ value: ethers.utils.parseEther("2") });

    const aliceBal = await token.balanceOf(alice.address);
    await token.connect(alice).transfer(owner.address, aliceBal);

    expect(await token.balanceOf(alice.address)).to.equal(0);
    expect(await token.dividends(alice.address)).to.equal(ethers.utils.parseEther("0.5"));
  });

  it("claims dividends and resets pending amount", async function () {
    const { token, alice } = await deployToken();

    await token.connect(alice).deposit({ value: ethers.utils.parseEther("1") });
    await token.distributeDividends({ value: ethers.utils.parseEther("1") });

    await expect(token.connect(alice).claimDividends())
      .to.emit(token, "DividendsClaimed")
      .withArgs(alice.address, ethers.utils.parseEther("1"));

    expect(await token.dividends(alice.address)).to.equal(0);
  });
});