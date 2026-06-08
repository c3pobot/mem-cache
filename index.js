const log = require('./logger')
const { MongoClient } = require('mongodb')

class MongoConnect {
  constructor( connection_string ){
    if(!connection_string) throw `no connection_string provided`
    this._mongo = new MongoClient(connection_string), this._mongo_ready = false
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
      log.error(e, this.cache_name)
      setTimeout(()=>this._init(), 5000)
    }
  }
  status(){
    return this._mongo_ready
  }

}
class MemCache{
  constructor({ mongo, collection, db_name, cache_name }){
    if(!mongo || !collection || !db_name) throw `db info not provided`
    this._mongo = mongo, this._collection = collection, this._db_name = db_name, this._cache_name = cache_name || collection
    this._dbo = mongo.db(this._db_name), this._map = new Map(), this._cache_ready = false, this._watch
    _init()
  }
  async _init(){
    try{
      let status = this._mongo.status()
      if(status) status = await this._create_collection()
      if(!status) status = await this._load_map()
      if(status){

        this._watch = this._dbo.collection.watch({ fullDocument: 'updateLookup' })
        this._watch.on('change', (next)=>{
          console.log('Operation Type:', next.operationType);
          console.log('Changed Document:', next.fullDocument);
        })
        this._watch.on('error', (err)=>{
          log.error(err, this._cache_name)
        })
        this._cache_ready = true
        return log.info(`Cache ready`, this._cache_name)
      }
      setTimeout(this._init, 5000)
    }catch(e){
      log.error(e, this._cache_name)
      setTimeout(this._init, 5000)
    }
  }
  async _create_collection(){
    try{
      let exists = this._dbo({ name: this._collection })?.toArray()
      if(! exists || exists?.length == 0) await this._dbo.createCollection( this._collection )
      log.info(`${this._collection} exists/created...`, this._cache_name)
      return true
    }catch(e){
      log.error(e, this._cache_name)
    }
  }
  async _load_map(){
    try{
      let array = await this._all()
      if(array) return
      if(array?.length > 0) this._map = new Map(array.map(x=> [x._id, x.value]))
      return true
    }catch(e){
      log.error(e, this._cache_name)

    }
  }
  async _all(){
    try{
      return await this._dbo.collection( this._collection ).find( { }, { projection: { TTL: 0 } } ).toArray()
    }catch(e){
      log.error(e, this.cache_name)
    }
  }
  async _del( id ){
    try{
      return await this._dbo.collection( this._collection ).deleteOne({ _id: id })
    }catch(e){
      log.error(e, this.cache_name)
    }
  }
  async _get( id ){
    try{
      let res = await this._dbo.collection( this._collection ).find( { _id: id }, { projection: { TTL: 0 } } ).toArray()
      if(res?.length > 0) return res[0]
    }catch(e){
      log.error(e, this.cache_name)
    }
  }
  async _replace( id, data){
    try{
      if(!data || !id ) return
      if(!data?.TTL) data.TTL = new Date()
      let res = await this._dbo.collection( this._collection ).replaceOne( { _id: id }, data, { upsert: true } )
      delete data.TTL
      return res?.acknowledged
    }catch(e){
      log.error(e, this.cache_name)
    }
  }
  async _set( id, data ){
    try{
      if(!data || !matchCondition || !collection) return
      if(!data?.TTL) data.TTL = new Date()
      let res = await this._dbo.collection( this._collection ).updateOne( { _id: id }, { $set: data }, { upsert: true } )
      delete data.TTL
      return res?.acknowledged
    }catch(e){
      log.error(e, this.cache_name)
    }
  }
  del( key ){
    try{
      this._map.delete( key )
      this._del( key )
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
  set( key, value = {} ){
    try{
      if(!key) return
      let data = this._map.get( id ) || {}
      data = { ...data,...value }
      this._map.set(key, data)
      this._set( id, data )
    }catch(e){
      log.error(e, this._cache_name)
    }
  }
  status(){
    return this._cache_ready
  }
}
module.export.MongoConnect = MongoConnect
module.export.MemCache = MemCache
