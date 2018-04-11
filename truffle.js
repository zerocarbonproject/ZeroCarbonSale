module.exports = {
  networks: {
    mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: '1', // Match any network id
      gas: 3500000,
      gasPrice: 10000000000
    },
    development: {
      // Ganache
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 4500000,
    },
    ropsten : {
      host: "127.0.0.1",
      port: 8545,
      network_id: "3", // Match any network id
      gas: 4500000,
    }
  },
  dependencies: {},
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
