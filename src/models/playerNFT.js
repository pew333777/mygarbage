// src/models/playerNFT.js
const mongoose = require('mongoose');
const Web3 = require('web3');
const nftContractABI = require('../../config/nftContractABI.json');
const nftContractAddress = '0x...'; // 智能合约地址

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const playerNFTSchema = new mongoose.Schema({
    PlayerNFTID: {
        type: Number,
        required: true,
        unique: true  // 确保每个 PlayerNFTID 是唯一的
    },
    PlayerID: {
        type: Number,
        required: true
    },
    NFTContractAddress: {
        type: String,
        required: true
    },
    TokenID: {
        type: Number,
        required: true
    }
    // 您可以在此处添加更多字段，例如 NFT 的元数据、图片链接等
});

const PlayerNFT = mongoose.model('PlayerNFT', playerNFTSchema);

const getAllNFTsFromBlockchain = async () => {
    // 假设您的智能合约有一个方法可以返回所有 NFT 的信息
    // 例如，这个方法可能叫做 getAllNFTs，它返回一个数组，每个元素包含 NFT 的所有者地址和 tokenId
    try {
        const nfts = await nftContract.methods.getAllNFTs().call();
        return nfts.map(nft => {
            return {
                owner: nft.owner,
                tokenId: nft.tokenId
            };
        });
    } catch (error) {
        console.error('Error fetching NFTs from blockchain:', error);
        return [];
    }
};

module.exports = { PlayerNFT, getAllNFTsFromBlockchain };
