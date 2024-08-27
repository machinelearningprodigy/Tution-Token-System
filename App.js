import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

const tuitionTokenABI = [...]; // Add the ABI for TuitionToken
const tokenizedTuitionPaymentsABI = [...]; // Add the ABI for TokenizedTuitionPayments

const tuitionTokenAddress = "YOUR_TUITION_TOKEN_ADDRESS";
const tokenizedTuitionPaymentsAddress = "YOUR_TOKENIZED_TUITION_PAYMENTS_ADDRESS";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tuitionToken, setTuitionToken] = useState(null);
  const [tokenizedTuitionPayments, setTokenizedTuitionPayments] = useState(null);
  const [tuitionPlan, setTuitionPlan] = useState(null);

  useEffect(() => {
    initializeEthers();
  }, []);

  const initializeEthers = async () => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    setProvider(provider);
    setSigner(signer);

    const tuitionToken = new ethers.Contract(tuitionTokenAddress, tuitionTokenABI, signer);
    const tokenizedTuitionPayments = new ethers.Contract(tokenizedTuitionPaymentsAddress, tokenizedTuitionPaymentsABI, signer);

    setTuitionToken(tuitionToken);
    setTokenizedTuitionPayments(tokenizedTuitionPayments);

    await loadTuitionPlan();
  };

  const loadTuitionPlan = async () => {
    if (tokenizedTuitionPayments && signer) {
      const address = await signer.getAddress();
      const plan = await tokenizedTuitionPayments.getTuitionPlan(address);
      setTuitionPlan(plan);
    }
  };

  const payInstallment = async () => {
    if (tokenizedTuitionPayments && tuitionToken) {
      try {
        const installmentAmount = tuitionPlan.installmentAmount;
        await tuitionToken.approve(tokenizedTuitionPaymentsAddress, installmentAmount);
        await tokenizedTuitionPayments.payInstallment();
        await loadTuitionPlan();
      } catch (error) {
        console.error("Error paying installment:", error);
      }
    }
  };

  return (
    <div>
      <h1>Tokenized Tuition Payments</h1>
      {tuitionPlan ? (
        <div>
          <p>Total Amount: {ethers.utils.formatEther(tuitionPlan.totalAmount)} TUT</p>
          <p>Installment Amount: {ethers.utils.formatEther(tuitionPlan.installmentAmount)} TUT</p>
          <p>Paid Installments: {tuitionPlan.paidInstallments.toString()}</p>
          <p>Total Installments: {tuitionPlan.numberOfInstallments.toString()}</p>
          <p>Next Payment Date: {new Date(tuitionPlan.nextPaymentDate.toNumber() * 1000).toLocaleString()}</p>
          <button onClick={payInstallment}>Pay Installment</button>
        </div>
      ) : (
        <p>No active tuition plan</p>
      )}
    </div>
  );
}

export default App;