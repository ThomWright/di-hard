import test from "ava"

import createContainerModule from "../container"

const {createContainer} = createContainerModule()

test("create", t => {
  const container = createContainer("root")
  t.is(typeof container, "object", "should create an object")
})
