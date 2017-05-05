const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("simple circular dependency graph", async t => {
  const A = {
    id: "A",
    inject: ["B"],
    factory: () => "instance",
  }

  const B = {
    id: "B",
    inject: ["A"],
    factory: () => "instance",
  }

  const container = createContainer("root")
  container.register(A)
  container.register(B)

  const promise = container.get("A")
  const error = await t.throws(promise, Error, "should throw when there are circular dependencies")
  t.regex(error.message, /circular/i)
  t.regex(error.dependencyDiagram, /A>B>A/)
})

test("deeper circular dependency graph", async t => {
  const A = {
    id: "A",
    inject: ["B", "C"],
    factory: () => "instance",
  }

  const B = {
    id: "B",
    inject: ["D"],
    factory: () => "instance",
  }

  const C = {
    id: "C",
    inject: ["D"],
    factory: () => "instance",
  }

  const D = {
    id: "D",
    inject: ["C"],
    factory: () => "instance",
  }

  const container = createContainer("root")
  container.register(A)
  container.register(B)
  container.register(C)
  container.register(D)

  const promise = container.get("A")
  const error = await t.throws(promise, Error, "should throw when there are circular dependencies")
  t.regex(error.message, /circular/i)
  t.regex(error.dependencyDiagram, /[A>B>D>C>D|A>C>D>C]/, "ACDC is a circular dependency")
})
