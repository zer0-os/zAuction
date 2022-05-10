import { ethers, upgrades, network, run } from "hardhat";
import { ZAuction__factory } from "./../typechain/factories/contracts/Zauction.sol";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::deploy-zauction");

// Rinkeby address
const zAuctionProxyAddress = "0xb2416Aed6f5439Ffa0eCCAaa2b643f3D9828f86B";
const lootToken = "0x5bAbCA2Af93A9887C86161083b8A90160DA068f2";
const wildToken = "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79";

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
        args: [lootToken, wildToken],
      },
      unsafeAllowRenames: true,
    }
  );

  logger.debug(`Upgraded contract at ${upgradedContract.address}`);
}

main();
