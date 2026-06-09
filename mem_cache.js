'use strict'
const log = require('./logger')

module.exports = class MemCache{
  constructor({ mongo, collection, cacheName, jsonOnly }){
    if(!mongo || !collection || !dbName) throw `db info not provided`
    this._mongo = mongo, this._collection = collection, this._cache_name = cacheName || collection
    this._map = new Map(), this._cache_ready = false, this._watch, this._json_only = jsonOnly
    this._init()
  }
  _process_change( next = {} ){
    if(next.operationType == 'insert' || next.operationType == 'replace' || next.operationType == 'update'){
      if(!next?.fullDocument) return
      this._map.set( next.fullDocument._id, next.fullDocument.value )
      console.log(this._map)
    }
    if(next.operationType == 'delete'){
      if(!next?.documentKey) return
      this._map.delete( next?.documentKey?._id )
      console.log(this._map)
    }
  }
  async _init(){
    try{
      let status = this._mongo.status()
      if(status) status = await this._mongo.createCollection( this._collection )
      if(status) status = await this._load_map()
      console.log(this._map)
      if(status){
        this._watch = this._mongo.watch( this._collection )
        this._watch.on('change', (next)=>{
          this._process_change(next)
        })
        this._watch.on('error', (err)=>{
          log.error(err, this._cache_name)
        })
        this._cache_ready = true
        return log.info(`Cache ready...`, this._cache_name)
      }
      setTimeout(()=>this._init(), 5000)
    }catch(e){
      log.error(e, this._cache_name)
      setTimeout(()=>this._init(), 5000)
    }
  }
  async _load_map(){
    try{
      let array = await this._mongo.all( this._collection )
      if(!array || array?.length == 0) return true

      if(array?.length > 0) this._map = new Map(array.map(x=> [x._id, x.value]))
      return true
    }catch(e){
      log.error(e, this._cache_name)
    }
  }
  del( key ){
    try{
      this._map.delete( key )
      this._mongo.del( this._collection, { _id: key } )
    }catch(e){
      log.error(e, this._cache_name)
    }
  }
  get( key ){
    try{
      return this._map.get( key )
    }catch(e){
      log.error(e, this._cache_name)
    }
  }
  set( key, value ){
    if(!key) return
    if(this._json_only) return setJSON( key, value )
    this._map.set( key, value )
    this._mongo.set( this._collection, { _id: key }, { value } )
  }
  setJSON( key, value = {} ){
    try{
      if(!key) return
      let data = this._map.get( id ) || {}
      data = { ...data,...value }
      this._map.set( key, data )
      this._mongo.set( this._collection, { _id: key }, { value: data } )
    }catch(e){
      log.error(e, this._cache_name)
    }
  }
  status(){
    return this._cache_ready
  }
}
