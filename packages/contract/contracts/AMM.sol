// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AMM {
    IERC20 private _tokenX; //ERC20を実装したコントラクト
    IERC20 private _tokenY; //ERC20を実装したコントラクト
    uint256 public totalShare; //シェアの総数
    mapping(address => uint256) public share; // シェアの数
    mapping(IERC20 => uint256) public totalAmount; // プールにロックされた各トークンの量

    uint256 public constant PRECISION = 1_000_000; // シェアの精度に使用する定数(= 6桁)

    // プールに使えるトークンを指定します
    constructor(IERC20 tokenX, IERC20 tokenY) {
        _tokenX = tokenX;
        _tokenY = tokenY;
    }

    // プールに流動生があり、使用可能であることを確認します
    modifier activePool() {
        require(totalShare > 0, "Zero Liquidity");
        _;
    }

    // スマートコントラクトが使えるトークンであることを確認します
    modifier validToken(IERC20 token) {
        require(
            token == _tokenX || token == _tokenY,
            "Token is not in the pool"
        );
        _;
    }

    // スマートコントラクトが扱えるトークンであることを確認します。
    modifier validTokens(IERC20 tokenX, IERC20 tokenY) {
        require(
            tokenX == _tokenX || tokenY == _tokenY,
            "Token is not in the pool"
        );
        require(
            tokenY == _tokenX || tokenY == _tokenY,
            "Token is not in the pool"
        );
        require(tokenX != tokenY, "Tokens should be different!");
        _;
    }

    // 引数のトークンとペアのトークンのコントラクトを返します。
    function _pairToken(
        IERC20 token
    ) private view validToken(token) returns (IERC20) {
        if (token == _tokenX) {
            return _tokenY;
        }
        return _tokenX;
    }

    function provide(
        IERC20 tokenX,
        uint256 amountX,
        IERC20 tokenY,
        uint256 amountY
    ) external validTokens(tokenX, tokenY) returns (uint256) {
        require(amountX > 0, "Amount cannnot be zero");
        require(amountY > 0, "Amount cannnot be zero");

        uint256 newshare;

        if (totalShare == 0) {
            newshare = 100 * PRECISION;
        } else {
            uint256 shareX = (totalShare * amountX) / totalAmount[tokenX];
            uint256 shareY = (totalShare * amountY) / totalAmount[tokenY];
            require(shareX == shareY, "Equivalent value not provided...");
            newshare = shareX;
        }

        require(newshare > 0, "Asset value less than threshold for condition");

        tokenX.transferFrom(msg.sender, address(this), amountX);
        tokenY.transferFrom(msg.sender, address(this), amountY);

        totalAmount[tokenX] += amountX;
        totalAmount[tokenY] += amountY;

        totalShare += newshare;
        share[msg.sender] += newshare;

        return newshare;
    }
}
