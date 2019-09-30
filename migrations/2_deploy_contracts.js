let Bounties = artifacts.require('../contracts/Bounties.sol')

module.exports = function (deployer) {
    deployer.deploy(Bounties)
}
