#!/bin/bash
set -e
PROJECT_PATH=~/dev/ZeroCarbonProject/solidityWork/ZeroCarbonDistribution
SOLC_ARGS="openzeppelin-solidity=$PROJECT_PATH/node_modules/openzeppelin-solidity" solidity-docgen $PROJECT_PATH/ $PROJECT_PATH/contracts/ $PROJECT_PATH/docs/
