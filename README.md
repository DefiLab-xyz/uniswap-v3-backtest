# Uniswap V3 LP Strategy BackTester

Strategy Backtester for providing liquidity to a Uniswap V3 Pool. Based on logic described in the following article:


[Historical Performances of Uniswap V3 Pools](https://defi-lab.medium.com/historical-performances-of-uniswap-l3-pools-2de713f7c70f)

![backtest-performance](https://user-images.githubusercontent.com/5744432/167617903-efd0829f-0b32-4c7f-b611-47398d8e435c.png)


## Install 

```shell
npm install uniswap-v3-backtest
```


## Usage 

```js
import uniswapStrategyBacktest from 'uniswap-v3-backtest'
const backtestResults = await uniswapStrategyBacktest("0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", 1000, 2120.09, 2662.99, {days: 25, period: "daily"});
```

Example Output: 

```

// Hourly //

{
  periodStartUnix: 1652274000,
  liquidity: '7675942584871332685',
  high: '2266.726774269547858798641816695647',
  low: '2145.393138561593202680715136665708',
  pool: {
    id: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    totalValueLockedUSD: '231193174.2181918276487229629805612',
    totalValueLockedToken1: '71499.990198836160751569',
    totalValueLockedToken0: '71417122.541685',
    token0: { decimals: '6' },
    token1: { decimals: '18' }
  },
  close: '2246.577649943233620476969923660446',
  feeGrowthGlobal0X128: '1432478142734251891146870279471391',
  feeGrowthGlobal1X128: '491787243029421936881695073823469456119843',
  day: 11,
  month: 4,
  year: 2022,
  fg0: 0,
  fg1: 0,
  activeliquidity: 100,
  feeToken0: 0,
  feeToken1: 0,
  tokens: [ 259.4720394308191, 0.3296249121804859 ],
  fgV: 0,
  feeV: 0,
  feeUnb: 0,
  amountV: 999.9999999999999,
  amountTR: 1000,
  feeUSD: 0,
  baseClose: '2246.577649943233620476969923660446'
}

// Daily //
{
  date: '5/11/2022',
  day: 11,
  month: 4,
  year: 2022,
  feeToken0: -3.4440601554207775,
  feeToken1: -0.0015405996636897285,
  feeV: -7.061140100789986,
  feeUnb: -0.1933135552371638,
  fgV: -3.677055720111889e-14,
  feeUSD: -5.640380083495151,
  activeliquidity: 100,
  amountV: 999.9999999999998,
  amountTR: 1000,
  amountVLast: 1032.5671065225727,
  percFee: -0.7061140100789988,
  close: '2241.121068655049392145921171725936',
  baseClose: '2241.121068655049392145921171725936',
  count: 14
}
```

## **uniswapStrategyBacktest() input**

uniswapStrategyBacktest() should be called with the following arguments:

```
uniswapStrategyBacktest(    
  poolID,    
  investmentAmount,    
  minRange,    
  maxRange,    
  options
)
```

**poolID** = the ID of the pool you'd like to run the backtest for. Example for [ETH / USD 0.05%](https://info.uniswap.org/#/pools/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640) would be "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"

**investmentAmount** = the initial amount invested in the LP strategy. This value is presumed to be denominated in the base token of the pair (Token0) but can be overridden to use the quote token with the options argument. 

**minRange** = the lower bound of the LP Strategy. As with investmentAmount, presumed to be in base but can be overridden to use quote.
**maxRange** = the upper bound of the LP Strategy. As with investmentAmount, presumed to be in base but can be overridden to use quote.

**options** = Optional values that override default values. Formed as a JSON key value pair `{days: 30, protocol: 0, priceToken: 0, period: "hourly"}`    
    **days** = number of days to run the backtest from todays date. Defaults to 30, Currently maxed to 30.     
    **priceToken** = 0 = values in baseToken, 1 = values in quoteToken (Token0, Token1) 
    **period** = Calculate fees "daily" or "hourly", defaults to "hourly"  
    **protocol** - Which chain, sidechain or L2 to use:  
        0 = Ethereum (default)    
        1 = Optimism    
        2 = Arbitrum   
        3 = Polygon   


## **uniswapStrategyBacktest() output**

**amountV** = the total value of the LP position for the specified period.    
**feeV** =  the fees generated for the specified period.    
**activeliquidity** = the % of the strategies liquidity that was active within the specified period.    
**feeUSD** = the total fees in USD   


  



