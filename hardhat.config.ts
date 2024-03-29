// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import { task, HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@openzeppelin/hardhat-upgrades";
import "@openzeppelin/hardhat-defender";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import { removeConsoleLog } from "hardhat-preprocessor";

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
  },
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: `${process.env.TESTNET_PRIVATE_KEY}`,
          balance: "9999999999999999999999999",
        },
      ],
      forking: {
        url: "https://mainnet.infura.io/v3/b038070517554c7f9dab88e37d0b936a",
        blockNumber: 14490792,
      },
    },
    mainnet: {
      accounts: [`${process.env.MAINNET_PRIVATE_KEY}`],
      url: `https://mainnet.infura.io/v3/0e6434f252a949719227b5d68caa2657`,
      gasPrice: 30000000000,
    },
    kovan: {
      accounts: { mnemonic: process.env.TESTNET_MNEMONIC || "" },
      url: `https://kovan.infura.io/v3/0e6434f252a949719227b5d68caa2657`,
    },
    ropsten: {
      accounts: { mnemonic: process.env.TESTNET_MNEMONIC || "" },
      url: "https://ropsten.infura.io/v3/77c3d733140f4c12a77699e24cb30c27",
    },
    rinkeby: {
      accounts: [`${process.env.TESTNET_PRIVATE_KEY}`],
      url: "https://rinkeby.infura.io/v3/77c3d733140f4c12a77699e24cb30c27",
    },
    goerli: {
      accounts: [`${process.env.TESTNET_PRIVATE_KEY}`],
      url: "https://goerli.infura.io/v3/77c3d733140f4c12a77699e24cb30c27",
    },
    localhost: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: "http://127.0.0.1:8545",
      chainId: 1776,
      accounts: {
        mnemonic: "test test test test test test test test test test test test",
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: {
      mainnet: "PR3QC4MMMC2I1S7AVSMY6GX1ZBTFPP91MW",
      goerli: "PR3QC4MMMC2I1S7AVSMY6GX1ZBTFPP91MW"
    }
  },
  preprocess: {
    eachLine: removeConsoleLog(
      (hre) =>
        hre.network.name !== "hardhat" && hre.network.name !== "localhost"
    ),
  },
  defender: {
    apiKey: process.env.DEFENDER_TEAM_API_KEY || "",
    apiSecret: process.env.DEFENDER_TEAM_API_SECRET || "",
  },
};
export default config;
