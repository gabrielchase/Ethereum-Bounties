const Bounties = artifacts.require("./Bounties.sol")
const { increaseTimeInSeconds, getCurrentTime } = require('./utils')

const VERY_FAR_DATE = 7257513600
const POINT_FIVE_ETH = 500000000000000000
const ONE_ETH = 1000000000000000000
const TWO_ETH = 2000000000000000000
const DAY_IN_SECONDS = 86400

contract('Fulfillments', (accounts) => {
    let bountiesInstance 
    let bounty 

    beforeEach(async () => {
        bountiesInstance = await Bounties.new()
        bounty = await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0], value: ONE_ETH })
    })

    it('should create a fulfillment when fulfillBounty is called by another account', async () => {
        let tx, bountyFulfillments, fulfillment
        
        // FIRST FULFILLMENT 

        tx = await bountiesInstance.fulfillBounty(0, 'i fulfilled the bounty!', { from: accounts[1] })

        assert.equal('BountyFulfilled', tx.logs[0].event)

        bountyFulfillments = await bountiesInstance.getNumberOfBountyFulfillments(0)

        assert.equal(1, bountyFulfillments)

        fulfillment = await bountiesInstance.fulfillments(0, 0)

        assert.equal(false, fulfillment.accepted)
        assert.equal('i fulfilled the bounty!', fulfillment.data)
        assert.equal(accounts[1], fulfillment.fulfiller)


        // SECOND FULFILLMENT

        tx = await bountiesInstance.fulfillBounty(0, 'i fulfilled the bounty!', { from: accounts[2] })

        assert.equal('BountyFulfilled', tx.logs[0].event)

        bountyFulfillments = await bountiesInstance.getNumberOfBountyFulfillments(0)

        assert.equal(2, bountyFulfillments)

        fulfillment = await bountiesInstance.fulfillments(0, 1)

        assert.equal(false, fulfillment.accepted)
        assert.equal('i fulfilled the bounty!', fulfillment.data)
        assert.equal(accounts[2], fulfillment.fulfiller)
    })

    it('should fail if the bounty issuer calls fulfillBounty', async () => {
        try {
            await bountiesInstance.fulfillBounty(0, 'i fulfilled the bounty!', { from: accounts[0] })
        } catch (error) {
            assert(error)
        }
    })

    it('should fulfill a bounty', async () => {
        const tx = await bountiesInstance.fulfillBounty(0, 'i fulfilled the bounty!', { from: accounts[1] })
        const bountyFulfillmentsLength = await bountiesInstance.getNumberOfBountyFulfillments(0)
        fulfillment = await bountiesInstance.fulfillments(0, 0)

        assert.equal('BountyFulfilled', tx.logs[0].event)
        assert.equal(1, bountyFulfillmentsLength)        
        assert.equal(false, fulfillment.accepted)
        assert.equal(accounts[1], fulfillment.fulfiller)
        assert.equal('i fulfilled the bounty!', fulfillment.data)
    })

    it('fulfillBounty should return the fulfillment index', async () => {

        const result = await bountiesInstance.fulfillBounty.call(0, 'i fulfilled the bounty!', { from: accounts[1] })
        
        assert.equal(0, result)
    })

    it('should fail a fulfillment when a bounty is fulfilled at a later date than a deadline', async () => {
        await bountiesInstance.issueBounty('requirements', VERY_FAR_DATE, { from: accounts[0], value: ONE_ETH })

        try {
            let now = await getCurrentTime()
            await bountiesInstance.issueBounty('requirements', now + (DAY_IN_SECONDS * 2), { from: accounts[0], value: 0 })
            await increaseTimeInSeconds((DAY_IN_SECONDS * 2) + 1)
        } catch (error) {
            assert(error)
        }
    })
})
