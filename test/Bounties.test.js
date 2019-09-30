const Bounties = artifacts.require("./Bounties.sol")
const { increaseTimeInSeconds, getCurrentTime } = require('./utils')

const VERY_FAR_DATE = 7257513600
const POINT_NINE_ETH = 900000000000000000
const ONE_ETH = 1000000000000000000
const TWO_ETH = 2000000000000000000
const DAY_IN_SECONDS = 86400

contract('Bounties', (accounts) => {
    let bountiesInstance 

    beforeEach(async () => {
        bountiesInstance = await Bounties.new()
    })

    it('should issue a new bounty', async () => {
        let tx = await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0], value: ONE_ETH })
        const { event } = tx.logs[0]
        let bountiesLength = await bountiesInstance.getNumberOfBounties()
        let bounty = await bountiesInstance.bounties(0)
        let bountyStatus = await bountiesInstance.getBountyStatus(0)
        
        assert.equal(event, 'BountyIssued')

        assert.equal(1, bountiesLength) 

        assert.equal('CREATED', bountyStatus)
        assert.equal(accounts[0], bounty.issuer)
        assert.equal('requirements', bounty.data)
        assert.equal(VERY_FAR_DATE, bounty.deadline)
        assert.equal(ONE_ETH, bounty.reward)
    })

    it('should issue 2 bounties', async () => {
        let balance 
        await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0], value: ONE_ETH })
        balance = await web3.eth.getBalance(bountiesInstance.address)

        assert.equal(ONE_ETH, balance)

        await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0], value: ONE_ETH })
        balance = await web3.eth.getBalance(bountiesInstance.address)

        assert.equal(TWO_ETH, balance)

        const numberOfBounties = await bountiesInstance.getNumberOfBounties()
        assert.equal(2, numberOfBounties)
    })

    it('should return an integer 0 when calling issueBounty', async () => {
        let result = await bountiesInstance.issueBounty.call('requirements', VERY_FAR_DATE, { from: accounts[0], value: ONE_ETH })

        assert.equal(0, result)
    })

    // Tests the 'payable' keyword
    it('should fail when issueBounty has no eth value', async () => {
        try {
            await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0] })
        } catch (error) {
            assert(error)
        }
    })

    // Tests a value of 0 wei in issueBounty
    it('should fail when issueBounty has no eth value', async () => {
        try {
            await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0], value: 0 })
        } catch (error) {
            assert(error)
        }
    })

    it('should cancel a bounty', async () => {
        const issuerOldBalance = await web3.eth.getBalance(accounts[0])
        
        await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0], value: ONE_ETH })

        const issuerNewBalance = await web3.eth.getBalance(accounts[0])
        const instanceOldBalance = await web3.eth.getBalance(bountiesInstance.address)
        console.log('typeof: ', issuerNewBalance - issuerOldBalance)

        
        assert.isAtLeast(ONE_ETH, parseInt(issuerNewBalance) - parseInt(issuerOldBalance))
        assert.equal(ONE_ETH, instanceOldBalance)
        
        const tx = await bountiesInstance.cancelBounty(0, { from: accounts[0] })

        assert.equal('BountyCancelled', tx.logs[0].event)

        const instanceNewBalance = await web3.eth.getBalance(bountiesInstance.address)
        const issuerBalanceAfterCancel = await web3.eth.getBalance(accounts[0])

        assert.equal(0, instanceNewBalance)
        console.log(typeof issuerOldBalance)
        assert.isAtLeast(POINT_NINE_ETH + parseInt(issuerOldBalance), parseInt(issuerBalanceAfterCancel))
    })

    it('should fail to cancel a bounty if called by non bounty issuer', async () => {
        try {
            await bountiesInstance.cancelBounty(0, { from: accounts[1] })
        } catch (error) {
            assert(error)
        }
    })
})

