import test from "ava"

import createContainerModule from "../container"
import Lifetime from "../lifetimes"
const {Transient, Registration} = Lifetime

const {createContainer} = createContainerModule()

test("listing registrations and their dependencies", t => {
  const parent = createContainer("parent")
  parent.registerFactory("A", ({B}) => B, {lifetime: Registration})
  parent.registerFactory("B", ({}) => {})

  const child = parent.child("child")
  child.registerFactory("C", ({A}) => A)
  child.registerFactory("D", ({E}) => E)

  child.registerValue("E", "e")

  child
    .registerSubmodule("M")
    .registerValue("MV", "mv")
    .registerSubmodule("N")

  const tree = child.getDebugInfo()

  t.deepEqual(tree, {
    name: "child",
    module: {
      modulePath: "",
      factories: {
        C: {
          lifetime: Transient,
          dependencies: ["A"],
        },
        D: {
          lifetime: Transient,
          dependencies: ["E"],
        },
      },
      instances: ["E"],
      modules: {
        M: {
          modulePath: "M",
          factories: {},
          instances: ["MV"],
          modules: {
            N: {
              modulePath: "M.N",
              factories: {},
              instances: [],
              modules: {},
            },
          },
        },
      },
    },
    parentContainer: {
      name: "parent",
      module: {
        modulePath: "",
        factories: {
          A: {
            lifetime: Registration,
            dependencies: ["B"],
          },
          B: {
            lifetime: Transient,
            dependencies: [],
          },
        },
        instances: [],
        modules: {},
      },
    },
  })
})
