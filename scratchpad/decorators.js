const {define, delegate} = require("@mft/di")

module.exports.redisCacheDefinition = define({
  decorate: ["redisStorage", "fileStorage"],
  inject: [delegate("storage")],
  factory: cacheFactory,
})

// must have the same interface as what we're decorating
function cacheFactory({storage}) {
  // const cache = {}
  return {
    put() {
      // use cache
      return storage.put()
    },
    get() {
      // use cache
      return storage.get()
    },
  }
}

module.exports.redisCacheDefinition = define({
  key: "redisStorage",
  factory: redisStorageFactory,
})
function redisStorageFactory() {
  return {
    put: () => {},
    get: () => {},
  }
}

module.exports.fileCacheDefinition = define({
  key: "fileStorage",
  factory: fileStorageFactory,
})
function fileStorageFactory() {
  return {
    put: () => {},
    get: () => {},
  }
}
