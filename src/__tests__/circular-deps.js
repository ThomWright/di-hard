const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("simple circular dependency graph", t => {
  const A = ({B}) => B
  const B = ({A}) => A

  const container = createContainer("root")
  container.register("A", A)
  container.register("B", B)

  const error = t.throws(
    () => container.resolve("A"),
    Error,
    "should throw when there are circular dependencies")
  t.regex(error.message, /circular/i)
  t.regex(error.dependencyDiagram, /A -> B -> A/)
})

test("deeper circular dependency graph", t => {
  const A = ({B, C}) => [B, C]
  const B = ({D}) => D
  const C = ({D}) => D
  const D = ({C}) => C

  const container = createContainer("root")
  container.register("A", A)
  container.register("B", B)
  container.register("C", C)
  container.register("D", D)

  const error = t.throws(
    () => container.resolve("A"),
    Error,
    "should throw when there are circular dependencies"
  )
  t.regex(error.message, /circular/i)
  t.regex(error.dependencyDiagram, /[A -> B -> D -> C -> D|A -> C -> D -> C]/, "ACDC is a circular dependency")
})
