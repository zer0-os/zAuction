import { ZAuction__factory } from "./../typechain/factories/contracts/Zauction.sol";
import { ethers, upgrades, network, run } from "hardhat";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::deploy-zauction");

// Rinkeby address
const zAuctionProxyAddress = "0xb2416Aed6f5439Ffa0eCCAaa2b643f3D9828f86B";

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

  const upgrade = await upgrades.upgradeProxy(
    zAuctionProxyAddress,
    zauctionfactory
  );

  logger.debug(`Upgraded contract at ${upgrade.address}`);
}

main();
