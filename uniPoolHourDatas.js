const urlForProtocol = (protocol) => {
  return protocol === 1 ? "https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis" : 
    protocol === 2 ? "https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal" :
    protocol === 3 ? "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon" :
    protocol === 4 ? "https://api.thegraph.com/subgraphs/name/perpetual-protocol/perpetual-v2-optimism" :
    "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
}

const requestBody = (request) => {
  
  if(!request.query) return;

  const body = {
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: request.query,
        variables: request.variables || {}
      })
  }

  if (request.signal) body.signal = request.signal;
  return body;

}

exports.getPoolHourData = async function(pool, fromdate, protocol) {

  const query =  `query PoolHourDatas($pool: ID!, $fromdate: Int!) {
  poolHourDatas ( where:{ pool:$pool, periodStartUnix_gt:$fromdate close_gt: 0}, orderBy:periodStartUnix, orderDirection:desc, first:1000) {
    periodStartUnix
    liquidity
    high
    low
    pool {
      id
      totalValueLockedUSD
      totalValueLockedToken1
      totalValueLockedToken0
      token0
        {decimals}
      token1
        {decimals}
    }
    close
    feeGrowthGlobal0X128
    feeGrowthGlobal1X128
    }
  }
  `

  const url = urlForProtocol(protocol);

  try {
    const response = await fetch(url, requestBody({query: query, variables: {pool: pool, fromdate: fromdate} }));
    const data = await response.json();

    if (data && data.data && data.data.poolHourDatas) {
     
      return data.data.poolHourDatas;
    }
    else {
      console.log("nothing returned from getPoolHourData")
      return null;
    }

  } catch (error) {
    return {error: error};
  }

}