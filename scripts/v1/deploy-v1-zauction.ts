import { ethers } from "hardhat";
import * as hre from "hardhat";
import { ZAuctionV1__factory } from "../../typechain";

const tradeToken = "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79";
const registrar = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";

const main = async () => {
  const signers = await ethers.getSigners();
  let deployer = signers[0];

  if (hre.ethers.provider.network.chainId == 31337) {
    const mainnetDeployer = "0x7829afa127494ca8b4ceef4fb81b78fee9d0e471";

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mainnetDeployer],
    });

    deployer = await hre.ethers.getSigner(mainnetDeployer);

    await hre.network.provider.send("hardhat_setBalance", [
      mainnetDeployer,
      "0x56BC75E2D63100000", // some big number
    ]);
  }

  console.log(`deployer is ${deployer.address}`);

  const factory = new ZAuctionV1__factory(deployer);
  const instance = await factory.deploy(tradeToken, registrar);

  console.log(instance.address);
};

main().catch(console.error);
