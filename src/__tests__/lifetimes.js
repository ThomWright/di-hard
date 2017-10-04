const test = require("ava")
const createContainerModule = require("../container")
const lifetimes = require("../lifetimes")
const {TRANSIENT, REGISTRATION} = lifetimes

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("accessing an invalid lifetime", t => {
  const lifetimes = require("../lifetimes")
  const error = t.throws(
    () => lifetimes.notARealLifetime,
    Error,
    "should not be able to access non-existant lifetimes"
  )
  t.regex(error.message, /notARealLifetime/, "should specify the problem lifetime")
})

test("default", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should have TRANSIENT lifetime")
})

test("undefined", t => {
  let instances = 0
  const container = createContainer("root")
  const error = t.throws(
    () => container.registerFactory("ididid", () => ++instances, lifetimes.NAHMATE),
    Error
  )
  t.regex(error.message, /NAHMATE/)
})

test("TRANSIENT", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, TRANSIENT)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should return a new instance each time")
})

test("REGISTRATION", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance")
})

test("REGISTRATION with child containers", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION)

  const i = container.child("name1").resolve("id")
  const j = container.child("name2").resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance for the lifetime of the registration container")
})
