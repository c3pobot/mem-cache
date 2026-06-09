'use strict'
const log = require('./logger')
const { MongoClient } = require('mongodb')

module.exports = class {
  constructor({ connection_string, db_name }){
    if(!connection_string || !db_name) throw `no connection info provided`
    this._mongo = new MongoClient( connection_string ), this._mongo_ready = false, this._db_name = db_name
    this._dbo = this._mongo.db(db_name)
    this._init()
  }
  async _init(){
    try{
      await this._mongo?.connect()
      let status = await this._mongo?.db('admin')?.command({ ping: 1 })
      if(status.ok > 0){
        this._mongo_ready = true
        return log.info(`connection successful...`)
      }
      setTimeout(()=>this._init(), 5000)
    }catch(e){
      log.error(e)
      setTimeout(()=>this._init(), 5000)
    }
  }
  async createCollection( collection ){
    try{
      let exists = await this._dbo.listCollections({ name: collection })?.toArray()
      if(exists?.length > 0) return true
      let created = await this._dbo.createCollection(collection)
      if(created?.s?.namespace?.collection == collection){
        log.info(`${collection} created...`)
        return true
      }
    }catch(e){
      log.error(e)
    }
  }
  async all( collection, matchCondition ){
    try{
      return await this._dbo.collection( collection )?.find( matchCondition ).toArray()
    }catch(e){
      log.error(e)
    }
  }
  async del( collection, matchCondition ){
    try{
      let res = await this._dbo.collection( collection ).deleteOne( matchCondition )
      return res?.acknowledged
    }catch(e){
      log.error(e)
    }
  }
  async get( collection, matchCondition ){
    try{
      let res = await this._dbo.collection( collection ).find( matchCondition ).toArray()
      if(res?.length > 0) return res[0]
    }catch(e){
      log.error(e)
    }
  }
  async replace( collection, matchCondition, data ){
    try{
      if(!data || !id ) return
      if(!data?.TTL) data.TTL = new Date()
      let res = await this._dbo.collection( collection ).replaceOne( matchCondition, data, { upsert: true } )
      delete data.TTL
      return res?.acknowledged
    }catch(e){
      log.error(e)
    }
  }
  async set( collection, matchCondition, data ){
    try{
      if(!data || !id ) return
      if(!data?.TTL) data.TTL = new Date()
      let res = await this._dbo.collection( collection ).updateOne( matchCondition, { $set: data }, { upsert: true } )
      delete data.TTL
      return res?.acknowledged
    }catch(e){
      log.error(e)
    }
  }
  status(){
    return this._mongo_ready
  }

  watch( collection ){
    try{
      return this._dbo.collection( collection ).watch( { fullDocument: 'updateLookup' } )
    }catch(e){
      log.error(e)
    }
  }
}
