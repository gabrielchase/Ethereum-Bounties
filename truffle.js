const HDWalletProvider = require('truffle-hdwallet-provider')
const fs = require('fs')

let secrets

if (fs.existsSync('secrets.json')) {
    secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'))
}

module.exports = {
    networks: {
        development: {
            network_id: "*",
            host: 'localhost',
            port: 8545
        },
        rinkeby: {
            provider: new HDWalletProvider(secrets.MNENOMIC, `https://rinkeby.infura.io/v3/${secrets.INFURA_API_KEY}`),
            network_id: '4'
        }
    }
}
