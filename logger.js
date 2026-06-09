'use strict'
let logLevel = process.env.LOG_LEVEL || 'info';

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Etc/GMT+5',
  hour12: false,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});


function getTimeStamp(timestamp = Date.now()) {
  return timestampFormatter.format(new Date(timestamp));
}

function error(msg, cache_name = 'mem-cache'){
  try{
    if(msg?.name?.toLowerCase().includes('mongonetworkerror') && logLevel !== 'debug') return
    console.error(`${getTimeStamp(Date.now())} ERROR [${cache_name}] ${msg}`)
    if(msg?.stack) console.error(msg)
  }catch(e){
    console.error(e)
  }
}
function info(msg, cache_name = 'mem-cache'){
  try{
    console.log(`${getTimeStamp(Date.now())} INFO [${cache_name}] ${msg}`)
  }catch(e){
    console.error(e)
  }
}
function debug(msg, cache_name = 'mem-cache'){
  try{
    if(logLevel == 'debug') console.log(`${getTimeStamp(Date.now())} DEBUG [${cache_name}] ${msg}`)
  }catch(e){
    console.error(e, cache_name)
  }
}

module.exports = { error, debug, info }
