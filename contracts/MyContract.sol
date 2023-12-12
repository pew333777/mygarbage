// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract LootBoxes {
    // 定義三種物品：Dragon, Silver, Common
    string[3] public items = ["Dragon", "Silver", "Common"];

    // 分別爲這三種物品設置抽中概率：Dragon 5%，Silver 20%，Common 75%
    uint[3] public odds = [5, 20, 75];

    // 用於追踪每個玩家在最後一個區塊購買的記錄
    mapping(string => uint) lastBlock;

    // 新增：追踪每個玩家對“Dragon”的抽取次數
    mapping(string => uint) dragonDrawCount;

    // 定義一個事件，當玩家抽中物品時觸發
    event Draws(string item, string player);

    // 玩家調用此函數來抽取物品
    function drawItem(string memory playerIdentifier) public returns(string memory) {
        // 確保每個區塊只能購買一次
        require(block.number != lastBlock[playerIdentifier], "One loot box per block allowed.");

        // 更新玩家在此區塊的購買記錄
        lastBlock[playerIdentifier] = block.number;

        // 檢查該玩家是否達到50次抽取，如果是，保證他們抽中Dragon並重置計數
        if (dragonDrawCount[playerIdentifier] >= 49) {
            dragonDrawCount[playerIdentifier] = 0;
            emit Draws("Dragon", playerIdentifier);
            return "Dragon";
        }

        // 生成一個0到99之間的隨機數
        uint randomValue = RNG(playerIdentifier);
        uint lowerBoundary = 0;

        // 遍歷每個物品
        for (uint i = 0; i < items.length; i++) {
            // 檢查隨機數是否落在當前物品的概率範圍內
            if (randomValue >= lowerBoundary && randomValue < lowerBoundary + odds[i]) {
                // 檢查是否抽中Dragon，如果是，重置計數
                if (keccak256(bytes(items[i])) == keccak256(bytes("Dragon"))) {
                    dragonDrawCount[playerIdentifier] = 0;
                } else {
                    // 否則，增加該玩家的Dragon抽取計數
                    dragonDrawCount[playerIdentifier]++;
                }
                // 發出事件並返回抽中的物品
                emit Draws(items[i], playerIdentifier);
                return items[i];
            }
            // 更新概率下限，進入下一物品的概率範圍
            lowerBoundary = lowerBoundary + odds[i];
        }

        // 如果沒有物品被抽中，則還原交易（按照設置，這應該不會發生）
        revert("No item drawn.");
    }

    // 生成隨機數的函數，返回一個0到99之間的值
    function RNG(string memory playerIdentifier) private view returns (uint8) {
        // 使用區塊時間戳和玩家標識符來生成隨機數
        return uint8(uint256(keccak256(abi.encodePacked(block.timestamp, playerIdentifier))) % 100);
    }
}