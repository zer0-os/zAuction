import { ethers } from "hardhat";
import { ZAuctionV1__factory } from "../../typechain";

const tradeToken = "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79";
const registrar = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";

const main = async () => {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log(`deployer is ${deployer.address}`);

  const factory = new ZAuctionV1__factory(deployer);
  const instance = await factory.deploy(tradeToken, registrar);

  console.log(instance.address);
};

main().catch(console.error);
