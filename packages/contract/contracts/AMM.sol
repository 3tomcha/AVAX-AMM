// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AMM {
    IERC20 private _tokenX; //ERC20を実装したコントラクト
    IERC20 private _tokenY; //ERC20を実装したコントラクト
    uint256 public totalShare; //シェアの総数
    mapping(address => uint256) public shares; // シェアの数
    mapping(IERC20 => uint256) public totalAmount; // プールにロックされた各トークンの量

    uint256 public constant PRECISION = 1_000_000; // シェアの精度に使用する定数(= 6桁)

    // プールに使えるトークンを指定します
    constructor(IERC20 tokenX, IERC20 tokenY) {
        _tokenX = tokenX;
        _tokenY = tokenY;
    }
}
