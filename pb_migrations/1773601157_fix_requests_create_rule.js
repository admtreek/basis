/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1003195976")

  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.body.author = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1003195976")

  unmarshal({
    "createRule": "@request.auth.id != \"\" && author = @request.auth.id"
  }, collection)

  return app.save(collection)
})
