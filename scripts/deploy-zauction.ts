import { ZAuction__factory } from "../typechain";
import { upgrades, network, run, ethers } from "hardhat";

import {
  DeploymentData,
  DeploymentOutput,
  deploymentsFolder,
  getDeploymentData,
  getLogger,
  writeDeploymentData,
} from "../utilities";

import * as fs from "fs";

import {
  hashBytecodeWithoutMetadata,
  Manifest,
} from "@openzeppelin/upgrades-core";
import { Contract } from "ethers";
import { ZAuction } from "../typechain";
const logger = getLogger("scripts::deploy-zauction");

// Goerli addresses
const wildAddress = "0x0e46c45f8aca3f89Ad06F4a20E2BED1A12e4658C";
const zeroAddress = "0x3Fa5ae3F31D38bCc2cf1dA2394c938dA8a1C9f69";
const hubAddress = "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1";

const defaultRegistrarThatIsNowIgnored = ethers.constants.AddressZero;

interface DeployedContract {
  isUpgradable: boolean;
  instance: Contract;
  version: string;
  date: string;
}

interface UpgradableDeployedContract extends DeployedContract {
  implementationAddress: string;
  admin: string;
}

async function main() {
  await run("compile");
  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

  logger.debug(`Deploying to ${network.name}`);

  logger.debug(
    `'${deploymentAccount.address}' will be used as the deployment account`
  );

  const zauctionFactory = new ZAuction__factory(deploymentAccount);

  // Access static bytecode value instead of instance for factory
  const bytecodeHash = hashBytecodeWithoutMetadata(ZAuction__factory.bytecode);

  logger.debug(`Implementation version is ${bytecodeHash}`);

  const instance = await upgrades.deployProxy(
    zauctionFactory,
    [
      zeroAddress,
      wildAddress,
      hubAddress
    ],
    {
      initializer: "initialize",
    }
  );
  await instance.deployed();

  logger.debug(`Deployed contract to ${instance.address}`);

  const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
  const manifest = await ozUpgradesManifestClient.read();
  const implementationContract = manifest.impls[bytecodeHash];

  if (!manifest.admin) {
    throw Error(`No admin address?`);
  }

  if (!implementationContract) {
    throw Error(`No implementation contract?`);
  }

  const deploymentData: UpgradableDeployedContract = {
    isUpgradable: true,
    instance,
    implementationAddress: implementationContract.address,
    version: bytecodeHash,
    date: new Date().toISOString(),
    admin: manifest.admin.address,
  };

  logger.debug(`Saving deployment data...`);
  await saveDeploymentData(
    "zAuction",
    deploymentData,
    {
      defaultPaymentToken: zeroAddress,
      wildToken: wildAddress,
      hubAddress: hubAddress
    },
    "goerli-zauction-1-gorilla-time"
  );

  if (deploymentData.implementationAddress) {
    logger.debug(`Waiting for 5 confirmations`);
    await instance.deployTransaction.wait(5);

    logger.debug(`Attempting to verify implementation contract with etherscan`);
    try {
      await run("verify:verify", {
        address: deploymentData.implementationAddress,
        constructorArguments: [],
      });
    } catch (e) {
      logger.error(`Failed to verify contract: ${e}`);
    }
  }
}

const saveDeploymentData = async (
  type: string,
  deployment: DeployedContract | UpgradableDeployedContract,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: { [key: string]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tag?: string
) => {
  let deploymentData: DeploymentOutput = {};

  try {
    const existingData = getDeploymentData(network.name);
    deploymentData = existingData;
  } catch (e) {
    // create folder
    logger.debug(`no existing deployments found, creating folder`);
    fs.mkdirSync(deploymentsFolder, { recursive: true });
  }

  if (!deploymentData[type]) {
    deploymentData[type] = [];
  }

  const deployments = deploymentData[type];

  let implementation: string | undefined;
  let admin: string | undefined;

  // extract extra data if this is an upgradable contract
  if (deployment.isUpgradable) {
    const upgradableDeployment = deployment as UpgradableDeployedContract;
    implementation = upgradableDeployment.implementationAddress;
    admin = upgradableDeployment.admin;
  }

  const finalTag = tag || "untagged";

  checkUniqueTag(finalTag, deployments);

  logger.debug(`Registering new deployment of ${type} with tag '${finalTag}'`);
  const deploymentInstance: DeploymentData = {
    tag,
    address: deployment.instance.address,
    version: deployment.version,
    date: deployment.date,
    args,
    isUpgradable: deployment.isUpgradable,
    admin,
    implementation,
  };

  deployments.push(deploymentInstance);

  writeDeploymentData(network.name, deploymentData);
  logger.debug(`Updated ${network.name} deployment file.`);
};

const checkUniqueTag = (tag: string, deployments: DeploymentData[]) => {
  const numMatches = deployments.filter((d) => {
    if (!d.tag) {
      return false;
    }
    return d.tag.toLowerCase() === tag.toLowerCase();
  }).length;

  logger.warn(
    `There are ${numMatches} deployments with the same tag of ${tag}`
  );
};

main();
