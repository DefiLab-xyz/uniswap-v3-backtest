require('./uniPoolHourDatas')

const DateByDaysAgo = (days) => {
  const date = new Date();
  return Math.round( (date.setDate(date.getDate() - days) / 1000 ));
}

exports.backtestStrategy = function () {
    console.log("testing")
}