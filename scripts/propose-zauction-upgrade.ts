import { ethers, network, run } from "hardhat";
import * as hre from "hardhat";
import { ZAuction__factory } from "../typechain/factories/contracts/Zauction.sol";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::upgrade-zauction");

// Rinkeby address
// const zAuctionProxyAddress = "0xb2416Aed6f5439Ffa0eCCAaa2b643f3D9828f86B";
// const lootToken = "0x5bAbCA2Af93A9887C86161083b8A90160DA068f2";
// const wildToken = "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79";

// Mainnet addresses
const zAuctionProxyAddress = "0x411973Fa81158A4c7767a0D6F7dF62723fDd541F";

// Upgrade from v2 to v2.1
async function main() {
  await run("compile");
  const accounts = await ethers.getSigners();
  const upgradingAccount = accounts[0];

  logger.debug(`Upgrading on ${network.name}`);

  logger.debug(
    `'${upgradingAccount.address}' will be used as the upgrading account`
  );

  const zAuctionFactory = new ZAuction__factory(upgradingAccount);

  const proposal = await hre.defender.proposeUpgrade(
    zAuctionProxyAddress,
    zAuctionFactory
  );
  console.log(`Proposed upgrade: ${proposal.url}`);

  if (proposal.metadata?.newImplementationAddress) {
    logger.info(`waiting 3 confirmations...`);
    await proposal.txResponse?.wait(3);

    logger.debug(
      `Attempting to verify implementation contract ${proposal.metadata.newImplementationAddress} with etherscan`
    );
    try {
      await run("verify:verify", {
        address: proposal.metadata.newImplementationAddress,
        constructorArguments: [],
      });
    } catch (e) {
      logger.error(`Failed to verify contract: ${e}`);
    }
  }
}

main();
