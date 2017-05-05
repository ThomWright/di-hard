const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("creation", t => {
  const container = createContainer("root")
  const child = container.child("child")
  t.is(typeof child, "object", "should create a child container")
})

test("resolving instances from parent", async t => {
  const componentDefinition = {
    id: "testComponent",
    factory: () => "testComponentInstance",
  }

  const parent = createContainer("root")
  parent.register(componentDefinition)
  const child = parent.child("child")

  const instance = await child.get("testComponent")
  t.is(instance, "testComponentInstance", "children should be able to access components registered with the parent")
})

test("registering definitions", async t => {
  const componentDefinition = {
    id: "testComponent",
    factory: () => "testComponentInstance",
  }

  const parent = createContainer("root")
  const child = parent.child("child")
  child.register(componentDefinition)

  const promise = parent.get("testComponent")
  const error = await t.throws(
    promise,
    Error,
    "parent should not be able to access components registered with a child"
  )
  t.regex(error.message, /testComponent/)
})

test("with same name as parent", t => {
  const parent = createContainer("root")
  const child = parent.child("second")
  const error = t.throws(() => child.child("root"), Error)
  t.regex(error.message, /second->root/, "should show hierarchy in error message")
})

test("unknown id", async t => {
  const container = createContainer("high")
    .child("mid")
    .child("low")

  const promise = container.get("notThere")
  const error = await t.throws(promise, Error, "should throw when requesting an unknown id")
  t.regex(error.message, /notThere/, "should specify unknown id")
  t.regex(error.searchPath, /low->mid->high/, "should specify search path")
})

test("unknown dependency id", async t => {
  const componentDefinition = {
    id: "testComponent",
    inject: ["dependencyName"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  }

  const container = createContainer("high")
    .child("mid")
    .child("low")
  container.register(componentDefinition)

  const promise = container.get("testComponent")
  const error = await t.throws(promise, Error, "should throw when requesting to inject unknown id")
  t.regex(error.message, /dependencyName/, "should specify unknown id")
  t.regex(error.searchPath, /low->mid->high/, "should specify search path")
})
