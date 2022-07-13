import { ethers, upgrades, network, run } from "hardhat";
import { ZAuction__factory } from "../typechain/factories/contracts/Zauction.sol";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::deploy-zauction");

// Rinkeby address
// const zAuctionProxyAddress = "0xb2416Aed6f5439Ffa0eCCAaa2b643f3D9828f86B";
// const lootToken = "0x5bAbCA2Af93A9887C86161083b8A90160DA068f2";
// const wildToken = "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79";

// Mainnet addresses
const zAuctionProxyAddress = "0x411973Fa81158A4c7767a0D6F7dF62723fDd541F";
const zeroToken = "0x0eC78ED49C2D27b315D462d43B5BAB94d2C79bf8";
const wildToken = "0x2a3bFF78B79A009976EeA096a51A948a3dC00e34";
const wildNetwork =
  "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b";

// Upgrade from v2 to v2.1
async function main() {
  await run("compile");
  const accounts = await ethers.getSigners();
  const upgradingAccount = accounts[0];

  logger.debug(`Upgrading on ${network.name}`);

  logger.debug(
    `'${upgradingAccount.address}' will be used as the upgrading account`
  );

  const zauctionfactory = new ZAuction__factory(upgradingAccount);

  const upgradedContract = await upgrades.upgradeProxy(
    zAuctionProxyAddress,
    zauctionfactory,
    {
      call: {
        fn: "upgradeFromV2",
        args: [zeroToken, wildToken],
      },
      unsafeAllowRenames: true,
    }
  );

  await upgradedContract.deployTransaction.wait(1);

  const contract = ZAuction__factory.connect(
    zAuctionProxyAddress,
    upgradingAccount
  );

  await contract.setNetworkToken(wildNetwork, wildToken);

  logger.debug(`Upgraded contract at ${upgradedContract.address}`);
}

main();
