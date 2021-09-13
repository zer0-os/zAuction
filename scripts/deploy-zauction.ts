import { ZAuction__factory } from "./../typechain/factories/ZAuction__factory";
import { ethers, upgrades, network, run } from "hardhat";

import {
  DeployedContract,
  DeploymentOutput,
  deploymentsFolder,
  getLogger,
} from "../utilities";

import * as fs from "fs";

import {
  hashBytecodeWithoutMetadata,
  Manifest,
} from "@openzeppelin/upgrades-core";

const logger = getLogger("scripts::deploy-zauction");

const tokenAddress = "0x50A0A3E9873D7e7d306299a75Dc05bd3Ab2d251F"; //kovan addresses, change to correct later
const registrarAddress = "0xC613fCc3f81cC2888C5Cccc1620212420FFe4931";

async function main() {
  await run("compile");
  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

  logger.log(`Deploying to ${network.name}`);

  logger.log(
    `'${deploymentAccount.address}' will be used as the deployment account`
  );

  const zauctionfactory = new ZAuction__factory(deploymentAccount);
  const bytecodeHash = hashBytecodeWithoutMetadata(zauctionfactory.bytecode);
  logger.log(`Implementation version is ${bytecodeHash}`);

  const instance = await upgrades.deployProxy(
    zauctionfactory,
    [tokenAddress, registrarAddress],
    {
      initializer: "initialize",
    }
  );

  await instance.deployed();

  logger.log(`Deployed zAuction to '${instance.address}'`);

  const deploymentRecord: DeployedContract = {
    name: "zAuction",
    address: instance.address,
    version: bytecodeHash,
    date: new Date().toISOString(),
  };

  const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
  const manifest = await ozUpgradesManifestClient.read();
  const implementationContract = manifest.impls[bytecodeHash];

  if (implementationContract) {
    deploymentRecord.implementation = implementationContract.address;
  }

  deploymentData.zAuction = deploymentRecord;

  const jsonToWrite = JSON.stringify(deploymentData, undefined, 2);

  logger.log(`Updated ${filepath}`);

  fs.mkdirSync(deploymentsFolder, { recursive: true });
  fs.writeFileSync(filepath, jsonToWrite);

  if (implementationContract) {
    logger.log(`Waiting for 5 confirmations`);
    await instance.deployTransaction.wait(5);

    logger.log(`Attempting to verify implementation contract with etherscan`);
    try {
      await run("verify:verify", {
        address: implementationContract.address,
        constructorArguments: [],
      });
    } catch (e) {
      logger.error(`Failed to verify contract: ${e}`);
    }
  }
}

main();
