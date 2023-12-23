import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('AMM', function () {
  async function deployContract() {
    const [owner, otherAccount] = await ethers.getSigners();

    const amountForOther = ethers.parseEther('5000');
    const USDCToken = await ethers.getContractFactory('USDCToken');
    const usdc = await USDCToken.deploy();
    await usdc.faucet(otherAccount.address, amountForOther);

    const JOEToken = await ethers.getContractFactory('JOEToken');
    const joe = await JOEToken.deploy();
    await joe.faucet(otherAccount.address, amountForOther);

    const AMM = await ethers.getContractFactory('AMM');
    const amm = await AMM.deploy(usdc, joe);

    return {
      amm,
      token0: usdc,
      token1: joe,
      owner,
      otherAccount,
    };
  }

  describe('init', function () {
    it('init', async function () {
      const { amm } = await loadFixture(deployContract);

      expect(await amm.totalShare()).to.eql(BigInt(0));
    });
  });
});