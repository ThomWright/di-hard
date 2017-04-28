const test = require("ava")

const {createContainer} = require("../container")

test("create", t => {
  const container = createContainer()
  t.is(typeof container, "object", "should create an object")
})

test("registering a component factory", t => {
  const container = createContainer()
  t.notThrows(() => {
    container.register("something", () => "something-instance")
  }, "should accept a registration")
})

test("getting a component instance", t => {
  const container = createContainer()
  container.register("something", () => "something-instance")
  const instance = container.get("something")
  t.is(instance, "something-instance", "should return the instance created by the factory")
})
