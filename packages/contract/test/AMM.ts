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

  describe("provide", function () {
    it("Token should be moved", async function () {
      const { amm, token0, token1, owner } = await loadFixture(deployContract);

      const ownerBalance0Before = await token0.balanceOf(owner.address);
      const ownerBalance1Before = await token1.balanceOf(owner.address);

      const ammBalance0Before = await token0.balanceOf(amm.getAddress());
      const ammBalance1Before = await token1.balanceOf(amm.getAddress());

      // 今回使用する2つのトークンはETHと同じ単位を使用するとしているので、
      // 100 ether (= 100 * 10^18) 分をprovideするという意味です。
      const amountProvide0 = ethers.parseEther('100');
      const amountProvide1 = ethers.parseEther('200');

      await token0.approve(amm.getAddress(), amountProvide0);
      await token1.approve(amm.getAddress(), amountProvide1);

      await amm.provide(
        token0.getAddress(),
        amountProvide0,
        token1.getAddress(),
        amountProvide1
      );

      // 送った分減った
      expect(await token0.balanceOf(owner.address)).to.eql(ownerBalance0Before - amountProvide0)
      expect(await token1.balanceOf(owner.address)).to.eql(ownerBalance1Before - amountProvide1)

      // ammはもらった分増えた
      expect(await token0.balanceOf(amm.getAddress())).to.eql(ammBalance0Before + amountProvide0)
      expect(await token0.balanceOf(amm.getAddress())).to.eql(ammBalance1Before + amountProvide0)
    })
  })

  async function deployContractWithLiquidity() {
    const { amm, token0, token1, owner, otherAccount } = await loadFixture(
      deployContract
    );
    const amountOwnerProvided0 = ethers.parseEther('100');
    const amountOwnerProvided1 = ethers.parseEther('200');

    await token0.approve(amm.getAddress(), amountOwnerProvided0);
    await token1.approve(amm.getAddress(), amountOwnerProvided1);
    await amm.provide(
      token0.getAddress(),
      amountOwnerProvided0,
      token1.getAddress(),
      amountOwnerProvided1
    );

    const amountOtherProvided0 = ethers.parseEther('10');
    const amountOtherProvided1 = ethers.parseEther('20');

    await token0.connect(otherAccount).approve(amm.getAddress(), amountOtherProvided0);
    await token1.connect(otherAccount).approve(amm.getAddress(), amountOtherProvided1);
    await amm
      .connect(otherAccount)
      .provide(
        token0.getAddress(),
        amountOtherProvided0,
        token1.getAddress(),
        amountOtherProvided1
      );

    return {
      amm,
      token0,
      amountOwnerProvided0,
      amountOtherProvided0,
      token1,
      amountOwnerProvided1,
      amountOtherProvided1,
      owner,
      otherAccount,
    };
  }

  describe("Deploy with liquidly", function () {
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        amountOtherProvided0,
        token1,
        amountOwnerProvided1,
        amountOtherProvided1,
        owner,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity);

      const precision = await amm.PRECISION();
      const BN100 = BigInt(100); // ownerのシェア: 最初の流動性提供者なので100
      const BN10 = BigInt(10); // otherAccountのシェア: ownerに比べて10分の1だけ提供しているので10
      expect(await amm.totalShare()).to.equal((BN100 + BN10) * precision);
      expect(await amm.share(owner.address)).to.equal(BN100 * precision);
      expect(await amm.share(otherAccount.address)).to.equal(BN10 * precision);
      expect(await amm.totalAmount(token0.getAddress())).to.equal(
        amountOwnerProvided0 + amountOtherProvided0
      )
      expect(await amm.totalAmount(token1.getAddress())).to.equal(
        amountOwnerProvided1 + amountOtherProvided1
      )
    });
  })
})