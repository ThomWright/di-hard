const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("single dependency", async t => {
  const componentDefinition = {
    id: "testComponent",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  }

  const dependencyDefinition = {
    id: "dependency",
    factory: () => "dependencyInstance",
  }

  const container = createContainer("root")
  container.register(componentDefinition)
  container.register(dependencyDefinition)

  const instance = await container.get("testComponent")
  const dep = instance.getInjectedDependency()
  t.is(dep, "dependencyInstance", "should inject an instance of the requested dependency")
})

test("promise-resolved dependency", async t => {
  const componentDefinition = {
    id: "testComponent",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  }

  const dependencyDefinition = {
    id: "dependency",
    factory: () => Promise.resolve("dependencyInstance"),
  }

  const container = createContainer("root")
  container.register(componentDefinition)
  container.register(dependencyDefinition)

  const instance = await container.get("testComponent")
  const dep = instance.getInjectedDependency()
  t.is(dep, "dependencyInstance", "should inject an instance of the requested dependency")
})

test("unknown dependency key", async t => {
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

  const container = createContainer("root")
  container.register(componentDefinition)

  const promise = container.get("testComponent")
  const error = await t.throws(promise, Error)
  t.regex(error.message, /dependencyName/, "should specify unknown key")
})
