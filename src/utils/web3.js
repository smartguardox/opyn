import Web3 from 'web3'
import { notify } from './blockNative'
const oTokenABI = require('../constants/abi/OptionContract.json')

export const getAccounts = async() => {
  const accounts = await window.ethereum.enable();
  return accounts
}

export const liquidate = async(oTokenAddr, owner, liquidateAmt) => {
  
  const accounts = await window.ethereum.enable();
  const web3 = new Web3(window.ethereum);
  const oToken = new web3.eth.Contract(oTokenABI, oTokenAddr)
  
  await oToken.methods.liquidate(owner, liquidateAmt).send({from: accounts[0]})
    .on('transactionHash', (hash)=>{
      notify.hash(hash)
    })
}

export const addETHCollateral = async (oTokenAddr, owner, ethAmount) => {
  const accounts = await window.ethereum.enable();
  const web3 = new Web3(window.ethereum);
  const oToken = new web3.eth.Contract(oTokenABI, oTokenAddr)
  await oToken.methods.addETHCollateral(owner).send({from: accounts[0], value: web3.utils.toWei(ethAmount)})
    .on('transactionHash', (hash)=>{
      notify.hash(hash)
    })
}