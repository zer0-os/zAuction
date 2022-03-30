import * as hre from "hardhat";
import { ZAuction__factory } from "../typechain";

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const user = signers[0];

  const instance = ZAuction__factory.connect(
    "0xb2416Aed6f5439Ffa0eCCAaa2b643f3D9828f86B",
    user
  );

  await instance.acceptBid(
    "0x34c3d59d78921c430c2caaf361311b5ff7179c34b708ea9fc9e5ddc920f755e5319bf3736b85b008430d563a2986771ce4e60fe3369a13e6053272bab815a0be1c",
    30830423791,
    "0xaE3153c9F5883FD2E78031ca2716520748c521dB",
    "32456700000000000000",
    "0xef19e4b21819162b1083f981cf7330e784b8cd98b0a603bd5dd02e1fc5bc7fc4",
    0,
    0,
    "99999999999"
  );
};

main().catch(console.error);
