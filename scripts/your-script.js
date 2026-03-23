const hre = require("hardhat");

async function main() {
  const [owner, alice, bob] = await hre.ethers.getSigners();

  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();

  console.log("Token deployed:", token.address);

  await (await token.connect(alice).deposit({ value: hre.ethers.utils.parseEther("1") })).wait();
  await (await token.connect(bob).deposit({ value: hre.ethers.utils.parseEther("3") })).wait();

  const totalSupply = await token.totalSupply();
  const aliceBal = await token.balanceOf(alice.address);
  const bobBal = await token.balanceOf(bob.address);

  console.log("totalSupply:", hre.ethers.utils.formatEther(totalSupply));
  console.log("aliceToken:", hre.ethers.utils.formatEther(aliceBal));
  console.log("bobToken:", hre.ethers.utils.formatEther(bobBal));

  await (await token.connect(owner).distributeDividends({ value: hre.ethers.utils.parseEther("2") })).wait();

  const aliceDiv = await token.dividends(alice.address);
  const bobDiv = await token.dividends(bob.address);

  console.log("aliceDividend:", hre.ethers.utils.formatEther(aliceDiv));
  console.log("bobDividend:", hre.ethers.utils.formatEther(bobDiv));

  await (await token.connect(alice).transfer(owner.address, aliceBal)).wait();

  const aliceAfter = await token.balanceOf(alice.address);
  const aliceDivAfterTransfer = await token.dividends(alice.address);

  console.log("aliceTokenAfterTransfer:", hre.ethers.utils.formatEther(aliceAfter));
  console.log("aliceDividendStill:", hre.ethers.utils.formatEther(aliceDivAfterTransfer));

  await (await token.connect(alice).claimDividends()).wait();

  const aliceDivAfterClaim = await token.dividends(alice.address);
  console.log("aliceDividendAfterClaim:", hre.ethers.utils.formatEther(aliceDivAfterClaim));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
