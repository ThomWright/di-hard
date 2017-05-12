const test = require("ava")
const createContainerModule = require("../container")
const {TRANSIENT, REGISTRATION_SCOPED} = require("../lifetimes")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("default", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should have TRANSIENT lifetime")
})

test("transient", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, TRANSIENT)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should return a new instance each time")
})

test("registration_scoped", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION_SCOPED)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance")
})

test("registration_scoped with child containers", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION_SCOPED)

  const i = container.child().resolve("id")
  const j = container.child().resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance for the lifetime of the registration container")
})
