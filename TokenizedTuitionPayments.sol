// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenizedTuitionPayments is Ownable {
    IERC20 public tuitionToken;
    
    struct TuitionPlan {
        uint256 totalAmount;
        uint256 installmentAmount;
        uint256 numberOfInstallments;
        uint256 paidInstallments;
        uint256 nextPaymentDate;
        bool isActive;
    }
    
    mapping(address => TuitionPlan) public studentPlans;
    
    event TuitionPlanCreated(address indexed student, uint256 totalAmount, uint256 numberOfInstallments);
    event InstallmentPaid(address indexed student, uint256 amount, uint256 remainingInstallments);
    event PlanCompleted(address indexed student);
    
    constructor(address _tuitionToken) Ownable(msg.sender) {
        tuitionToken = IERC20(_tuitionToken);
    }
    
    function createTuitionPlan(address student, uint256 totalAmount, uint256 numberOfInstallments) external onlyOwner {
        require(studentPlans[student].isActive == false, "Student already has an active plan");
        require(totalAmount > 0 && numberOfInstallments > 0, "Invalid plan parameters");
        
        uint256 installmentAmount = totalAmount / numberOfInstallments;
        
        studentPlans[student] = TuitionPlan({
            totalAmount: totalAmount,
            installmentAmount: installmentAmount,
            numberOfInstallments: numberOfInstallments,
            paidInstallments: 0,
            nextPaymentDate: block.timestamp + 30 days,
            isActive: true
        });
        
        emit TuitionPlanCreated(student, totalAmount, numberOfInstallments);
    }
    
    function payInstallment() external {
        TuitionPlan storage plan = studentPlans[msg.sender];
        require(plan.isActive, "No active tuition plan");
        require(block.timestamp >= plan.nextPaymentDate, "Too early for next payment");
        require(plan.paidInstallments < plan.numberOfInstallments, "All installments paid");
        
        tuitionToken.transferFrom(msg.sender, address(this), plan.installmentAmount);
        
        plan.paidInstallments++;
        plan.nextPaymentDate = block.timestamp + 30 days;
        
        emit InstallmentPaid(msg.sender, plan.installmentAmount, plan.numberOfInstallments - plan.paidInstallments);
        
        if (plan.paidInstallments == plan.numberOfInstallments) {
            plan.isActive = false;
            emit PlanCompleted(msg.sender);
        }
    }
    
    function getTuitionPlan(address student) external view returns (TuitionPlan memory) {
        return studentPlans[student];
    }
    
    function withdrawTokens(uint256 amount) external onlyOwner {
        tuitionToken.transfer(owner(), amount);
    }
}