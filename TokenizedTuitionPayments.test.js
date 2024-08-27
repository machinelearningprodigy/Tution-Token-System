const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenizedTuitionPayments", function () {
  let TuitionToken, tuitionToken, TokenizedTuitionPayments, tokenizedTuitionPayments;
  let owner, student, otherAccount;

  beforeEach(async function () {
    [owner, student, otherAccount] = await ethers.getSigners();

    TuitionToken = await ethers.getContractFactory("TuitionToken");
    tuitionToken = await TuitionToken.deploy(ethers.utils.parseEther("1000000"));
    await tuitionToken.deployed();

    TokenizedTuitionPayments = await ethers.getContractFactory("TokenizedTuitionPayments");
    tokenizedTuitionPayments = await TokenizedTuitionPayments.deploy(tuitionToken.address);
    await tokenizedTuitionPayments.deployed();

    await tuitionToken.transfer(student.address, ethers.utils.parseEther("10000"));
  });

  it("Should create a tuition plan", async function () {
    await tokenizedTuitionPayments.createTuitionPlan(student.address, ethers.utils.parseEther("1000"), 10);
    const plan = await tokenizedTuitionPayments.getTuitionPlan(student.address);
    expect(plan.isActive).to.be.true;
    expect(plan.totalAmount).to.equal(ethers.utils.parseEther("1000"));
    expect(plan.numberOfInstallments).to.equal(10);
  });

  it("Should pay an installment", async function () {
    await tokenizedTuitionPayments.createTuitionPlan(student.address, ethers.utils.parseEther("1000"), 10);
    await tuitionToken.connect(student).approve(tokenizedTuitionPayments.address, ethers.utils.parseEther("100"));
    
    await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // Increase time by 30 days
    await ethers.provider.send("evm_mine");

    await tokenizedTuitionPayments.connect(student).payInstallment();
    
    const plan = await tokenizedTuitionPayments.getTuitionPlan(student.address);
    expect(plan.paidInstallments).to.equal(1);
  });

  it("Should complete the plan after all installments are paid", async function () {
    await tokenizedTuitionPayments.createTuitionPlan(student.address, ethers.utils.parseEther("1000"), 10);
    await tuitionToken.connect(student).approve(tokenizedTuitionPayments.address, ethers.utils.parseEther("1000"));
    
    for (let i = 0; i < 10; i++) {
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await tokenizedTuitionPayments.connect(student).payInstallment();
    }
    
    const plan = await tokenizedTuitionPayments.getTuitionPlan(student.address);
    expect(plan.isActive).to.be.false;
    expect(plan.paidInstallments).to.equal(10);
  });
});