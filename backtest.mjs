import { logWithBase, round, sumArray, parsePrice } from "./numbers.mjs";

// calculate the amount of fees earned in 1 period by 1 unit of unbounded liquidity //
// fg0 represents the amount of token 0, fg1 represents the amount of token1 //
export const calcUnboundedFees = (globalfee0, prevGlobalfee0, globalfee1, prevGlobalfee1, poolSelected) => {

  const fg0_0 = ((parseInt(globalfee0)) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token0.decimals));
  const fg0_1 = (((parseInt(prevGlobalfee0))) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token0.decimals));

  const fg1_0 = ((parseInt(globalfee1)) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token1.decimals));
  const fg1_1 = (((parseInt(prevGlobalfee1))) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token1.decimals));

  const fg0 = (fg0_0 - fg0_1); // fee of token 0 earned in 1 period by 1 unit of unbounded liquidity
  const fg1 = (fg1_0 - fg1_1); // fee of token 1 earned in 1 period by 1 unit of unbounded liquidity

  return [fg0, fg1];
}

// calculate the liquidity tick at a specified price 
export const getTickFromPrice = (price, pool, baseSelected = 0) => {
  const decimal0 = baseSelected && baseSelected === 1 ? parseInt(pool.token1.decimals) : parseInt(pool.token0.decimals);
  const decimal1 = baseSelected && baseSelected === 1 ? parseInt(pool.token0.decimals) : parseInt(pool.token1.decimals);
  const valToLog = parseFloat(price) * Math.pow(10, (decimal0 - decimal1));
  const tickIDXRaw = logWithBase(valToLog,  1.0001);

  return round(tickIDXRaw, 0);
}

// estimate the percentage of active liquidity for 1 period for a strategy based on min max bounds 
// low and high are the period's candle low / high values
export const activeLiquidityForCandle = (min, max, low, high) => {

  const divider = (high - low) !== 0 ? (high - low) : 1;
  const ratioTrue = (high - low) !== 0 ? (Math.min(max, high) - Math.max(min, low)) / divider : 1;
  let ratio = high > min && low < max ? ratioTrue * 100 : 0;

  return isNaN(ratio) || !ratio ? 0 : ratio;

}

// Calculate the number of tokens for a Strategy at a specific amount of liquidity & price
export const tokensFromLiquidity = (price, low, high, liquidity, decimal0, decimal1) => {

  const decimal = decimal1 - decimal0;
  const lowHigh = [(Math.sqrt(low * Math.pow(10, decimal))) * Math.pow(2, 96), (Math.sqrt(high * Math.pow(10, decimal))) * Math.pow(2, 96)];

  const sPrice = (Math.sqrt(price * Math.pow(10, decimal))) * Math.pow(2, 96);
  const sLow = Math.min(...lowHigh);
  const sHigh =  Math.max(...lowHigh);
  
  if (sPrice <= sLow) {

    const amount1 = ((liquidity * Math.pow(2, 96) * (sHigh -  sLow) / sHigh / sLow ) / Math.pow(10, decimal0) );
    return [0, amount1];

  } else if (sPrice < sHigh && sPrice > sLow) {
    const amount0 = liquidity * (sPrice - sLow) / Math.pow(2, 96) / Math.pow(10, decimal1);
    const amount1 = ((liquidity * Math.pow(2, 96) * (sHigh -  sPrice) / sHigh / sPrice ) / Math.pow(10, decimal0) );
    return [amount0, amount1];
  }
  else {
    const amount0 = liquidity * (sHigh - sLow) / Math.pow(2, 96) / Math.pow(10, decimal1);
    return [amount0, 0];
  }

}

// Calculate the number of Tokens a strategy owns at a specific price 
export const tokensForStrategy = (minRange, maxRange, investment, price, decimal) => {

  const sqrtPrice = Math.sqrt(price * (Math.pow(10, decimal)));
  const sqrtLow = Math.sqrt(minRange * (Math.pow(10, decimal)));
  const sqrtHigh = Math.sqrt(maxRange * (Math.pow(10, decimal)));

  let delta, amount0, amount1;

  if ( sqrtPrice > sqrtLow && sqrtPrice < sqrtHigh) {
     delta = investment / (((sqrtPrice - sqrtLow)) + (((1 / sqrtPrice) - (1 / sqrtHigh)) * (price * Math.pow(10, decimal))));
     amount1 = delta * (sqrtPrice - sqrtLow);
     amount0 = delta * ((1 / sqrtPrice) - (1 / sqrtHigh)) * Math.pow(10, decimal);
  }
  else if (sqrtPrice < sqrtLow) {
    delta = investment / ((((1 / sqrtLow) - (1 / sqrtHigh)) * price));
    amount1 = 0;
    amount0 = delta * ((1 / sqrtLow) - (1 / sqrtHigh));
  }
  else {
    delta = investment / ((sqrtHigh - sqrtLow)) ;
    amount1 = delta * (sqrtHigh - sqrtLow);
    amount0 = 0;
  }
  return [amount0, amount1];

}

// Calculate the liquidity share for a strategy based on the number of tokens owned 
export const liquidityForStrategy = (price, low, high, tokens0, tokens1, decimal0, decimal1) => {
  
  const decimal = decimal1 - decimal0;
  const lowHigh = [(Math.sqrt(low * Math.pow(10, decimal))) * Math.pow(2, 96), (Math.sqrt(high * Math.pow(10, decimal))) * Math.pow(2, 96)];

  const sPrice = (Math.sqrt(price * Math.pow(10, decimal))) * Math.pow(2, 96);
  const sLow = Math.min(...lowHigh);
  const sHigh =  Math.max(...lowHigh);
  
  if (sPrice <= sLow) {

    return tokens0 / (( Math.pow(2, 96) * (sHigh-sLow) / sHigh / sLow) / Math.pow(10, decimal0));
    
  } else if (sPrice <= sHigh && sPrice > sLow) {

    const liq0 = tokens0 / (( Math.pow(2, 96) * (sHigh - sPrice) / sHigh / sPrice) / Math.pow(10, decimal0));
    const liq1 = tokens1 / ((sPrice - sLow) / Math.pow(2, 96) / Math.pow(10, decimal1));
    return Math.min(liq1, liq0);
  }
  else {

   return tokens1 / ((sHigh - sLow) / Math.pow(2, 96) / Math.pow(10, decimal1));
  }

}

// Calculate estimated fees
export const calcFees = (data, pool, priceToken, liquidity, unboundedLiquidity, investment, min, max) => {

  return data.map((d, i) => {

    const fg = i - 1 < 0 ? [0, 0] : calcUnboundedFees(d.feeGrowthGlobal0X128, data[(i-1)].feeGrowthGlobal0X128, d.feeGrowthGlobal1X128, data[(i-1)].feeGrowthGlobal1X128, pool);

    const low = priceToken === 0 ? d.low : 1 / (d.low === '0' ? 1 : d.low);
    const high = priceToken === 0 ? d.high : 1 / (d.high === '0' ? 1 : d.high);

    const lowTick = getTickFromPrice(low, pool, priceToken);
    const highTick = getTickFromPrice(high, pool, priceToken);
    const minTick = getTickFromPrice(min, pool, priceToken);
    const maxTick = getTickFromPrice(max, pool, priceToken);

    const activeLiquidity = activeLiquidityForCandle(minTick, maxTick, lowTick, highTick);
    const tokens = tokensFromLiquidity((priceToken === 1 ? 1 / d.close : d.close), min, max, liquidity, pool.token0.decimals, pool.token1.decimals);
    const feeToken0 = i === 0 ? 0 : fg[0] * liquidity * activeLiquidity / 100;
    const feeToken1 = i === 0 ? 0 : fg[1] * liquidity * activeLiquidity / 100;

    const feeUnb0 = i === 0 ? 0 : fg[0] * unboundedLiquidity;
    const feeUnb1 = i === 0 ? 0 : fg[1] * unboundedLiquidity;

    let fgV, feeV, feeUnb, amountV, feeUSD, amountTR;
    const latestRec = data[(data.length - 1)];
    const firstClose = priceToken === 1 ? 1 / data[0].close : data[0].close;

    const tokenRatioFirstClose = tokensFromLiquidity(firstClose, min, max, liquidity, pool.token0.decimals, pool.token1.decimals);
    const x0 = tokenRatioFirstClose[1];
    const y0 = tokenRatioFirstClose[0];

    if (priceToken === 0) {
      fgV = i === 0 ? 0 : fg[0] + (fg[1] * d.close);
      feeV =  i === 0 ? 0 : feeToken0 + (feeToken1 * d.close);
      feeUnb =  i === 0 ? 0 : feeUnb0 + (feeUnb1 * d.close);
      amountV = tokens[0] + (tokens[1] * d.close);
      feeUSD = feeV * parseFloat(latestRec.pool.totalValueLockedUSD) / ((parseFloat(latestRec.pool.totalValueLockedToken1) * parseFloat(latestRec.close) ) + parseFloat(latestRec.pool.totalValueLockedToken0) );
      amountTR = investment + (amountV - ((x0 * d.close) + y0));
    }
    else if (priceToken === 1) {
      fgV = i === 0 ? 0 : (fg[0] / d.close) + fg[1];
      feeV =  i === 0 ? 0 : (feeToken0  / d.close ) + feeToken1;
      feeUnb =  i === 0 ? 0 : feeUnb0 + (feeUnb1 * d.close);
      amountV = (tokens[1] / d.close) + tokens[0];
      feeUSD = feeV * parseFloat(latestRec.pool.totalValueLockedUSD) / (parseFloat(latestRec.pool.totalValueLockedToken1) + (parseFloat(latestRec.pool.totalValueLockedToken0) / parseFloat(latestRec.close)));
      amountTR = investment + (amountV - ((x0 * (1 / d.close)) + y0));
    }

    const date = new Date(d.periodStartUnix*1000);
    return {
      ...d,
      day: date.getUTCDate(),
      month: date.getUTCMonth(),
      year: date.getFullYear(), 
      fg0 : fg[0],
      fg1 : fg[1],
      activeliquidity: activeLiquidity,
      feeToken0: feeToken0,
      feeToken1: feeToken1,
      tokens: tokens,
      fgV: fgV,
      feeV: feeV,
      feeUnb: feeUnb,
      amountV: amountV,
      amountTR: amountTR,
      feeUSD: feeUSD,
      close: d.close,
      baseClose: priceToken === 1 ? 1 / d.close : d.close
    }

  });
}

// Pivot hourly estimated fee data (generated by calcFees) into daily values //
export const pivotFeeData = (data, priceToken, investment) => {

  const createPivotRecord = (date, data) => {
    return {
      date: `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getFullYear()}`,
      day: date.getUTCDate(),
      month: date.getUTCMonth(),
      year: date.getFullYear(),
      feeToken0: data.feeToken0,
      feeToken1: data.feeToken1,
      feeV: data.feeV,
      feeUnb: data.feeUnb,
      fgV: parseFloat(data.fgV),
      feeUSD: data.feeUSD,
      activeliquidity: isNaN(data.activeliquidity) ? 0 : data.activeliquidity,
      amountV: data.amountV,
      amountTR: data.amountTR,
      amountVLast: data.amountV,
      percFee: data.feeV / data.amountV,
      close: data.close,
      baseClose: priceToken === 1 ? 1 / data.close : data.close,
      count: 1
    }
    
  }
 
  const firstDate = new Date(data[0].periodStartUnix*1000);
  const pivot = [createPivotRecord(firstDate, data[0])];

  data.forEach((d, i) => {
    if (i > 0) {
      const currentDate = new Date(d.periodStartUnix * 1000);
      const currentPriceTick = pivot[(pivot.length - 1)];

      if ( currentDate.getUTCDate() === currentPriceTick.day && currentDate.getUTCMonth() === currentPriceTick.month && currentDate.getFullYear() === currentPriceTick.year) {    
        
        currentPriceTick.feeToken0 = currentPriceTick.feeToken0 + d.feeToken0;
        currentPriceTick.feeToken1 = currentPriceTick.feeToken1 + d.feeToken1;
        currentPriceTick.feeV = currentPriceTick.feeV + d.feeV;
        currentPriceTick.feeUnb = currentPriceTick.feeUnb + d.feeUnb;
        currentPriceTick.fgV = parseFloat(currentPriceTick.fgV) + parseFloat(d.fgV);
        currentPriceTick.feeUSD = currentPriceTick.feeUSD + d.feeUSD;
        currentPriceTick.activeliquidity = currentPriceTick.activeliquidity + d.activeliquidity;
        currentPriceTick.amountVLast = d.amountV;
        currentPriceTick.count = currentPriceTick.count + 1;

        if (i === (data.length - 1)) {
          currentPriceTick.activeliquidity = currentPriceTick.activeliquidity / currentPriceTick.count;
          currentPriceTick.percFee = currentPriceTick.feeV / currentPriceTick.amountV * 100;
        }
      }
      else {
        currentPriceTick.activeliquidity = currentPriceTick.activeliquidity / currentPriceTick.count;
        currentPriceTick.percFee = currentPriceTick.feeV / currentPriceTick.amountV * 100;
        pivot.push(createPivotRecord(currentDate, d));
      }
    }
  });
  return pivot;
}
