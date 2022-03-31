import { ZAuction__factory } from "./../typechain/factories/ZAuction__factory";
import { ethers, upgrades, network, run } from "hardhat";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::deploy-zauction");

// mainnet 0x1ee3F16aa8081891CfcfAB59d0DBFe03f2B77ff6

// Rinkeby addresses 0xb2416Aed6f5439Ffa0eCCAaa2b643f3D9828f86B
const zAuctionProxyAddress = "0x1ee3F16aa8081891CfcfAB59d0DBFe03f2B77ff6";

async function main() {
  await run("compile");
  const accounts = await ethers.getSigners();
  const upgradingAccount = accounts[0];

  logger.debug(`Upgrading on ${network.name}`);

  logger.debug(
    `'${upgradingAccount.address}' will be used as the upgrading account`
  );

  const zauctionfactory = new ZAuction__factory(upgradingAccount);

  // init only happens once, need to upgrade then call `setZnsHub`
  const upgrade = await upgrades.upgradeProxy(
    zAuctionProxyAddress,
    zauctionfactory
  );

  logger.debug(`Upgraded contract at ${upgrade.address}`);
}

main();
