const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const TuitionToken = await hre.ethers.getContractFactory("TuitionToken");
  const tuitionToken = await TuitionToken.deploy(hre.ethers.utils.parseEther("1000000"));
  await tuitionToken.deployed();

  console.log("TuitionToken deployed to:", tuitionToken.address);

  const TokenizedTuitionPayments = await hre.ethers.getContractFactory("TokenizedTuitionPayments");
  const tokenizedTuitionPayments = await TokenizedTuitionPayments.deploy(tuitionToken.address);
  await tokenizedTuitionPayments.deployed();

  console.log("TokenizedTuitionPayments deployed to:", tokenizedTuitionPayments.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });