import { sign } from "crypto";
import * as hre from "hardhat";
import { ZAuction__factory } from "../typechain";

const main = async () => {
  const signers = await hre.ethers.getSigners();
  let user = signers[0];

  const mainnetDeployer = "0x7f3A152F09324f2aee916CE069D3908603449173";

  if ((await hre.ethers.provider.getNetwork()).chainId == 31337) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mainnetDeployer],
    });

    user = await hre.ethers.getSigner(mainnetDeployer);

    await hre.network.provider.send("hardhat_setBalance", [
      mainnetDeployer,
      "0x56BC75E2D63100000", // some big number
    ]);
  }

  const instance = ZAuction__factory.connect(
    "0x411973Fa81158A4c7767a0D6F7dF62723fDd541F",
    user
  );

  await instance.setBuyPrice(
    1,
    "0x4bf9bf3901d0a7da2253423a73ec4ac7b8f6be67b04f50c58e43108c15a5b51a"
  );

  // await instance.acceptBid(
  //   "0x34c3d59d78921c430c2caaf361311b5ff7179c34b708ea9fc9e5ddc920f755e5319bf3736b85b008430d563a2986771ce4e60fe3369a13e6053272bab815a0be1c",
  //   30830423791,
  //   "0xaE3153c9F5883FD2E78031ca2716520748c521dB",
  //   "32456700000000000000",
  //   "0xef19e4b21819162b1083f981cf7330e784b8cd98b0a603bd5dd02e1fc5bc7fc4",
  //   0,
  //   0,
  //   "99999999999"
  // );
};

main().catch(console.error);
