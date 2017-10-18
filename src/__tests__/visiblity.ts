import test from "ava"
import {createRootModuleRegistration, createRegistrationApi} from "../modules"
import Visibility, {forRootModule} from "../visibility"

test("public component in top level", t => {
  const rootModule = createRootModuleRegistration()
  const reg = createRegistrationApi(rootModule)
  reg.registerInstance("id", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom([])
  const visible = isVisible(["id"])
  t.is(visible, true, "top level components should be visible externally")
})

test("public component in same module", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerInstance("id", Visibility.Public, {instance: {}})
  reg.registerInstance("dep", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["dep"])
  t.is(
    visible,
    true,
    "components should be visible to other components in the same module",
  )
})

test("private component in same module", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerModule("mod", Visibility.Public)
  const modReg = reg.forSubModule("mod")
  modReg.registerInstance("id", Visibility.Private, {instance: {}})
  modReg.registerInstance("dep", Visibility.Private, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["mod", "id"])
  const visible = isVisible(["mod", "dep"])
  t.is(
    visible,
    true,
    "private components should be visible to other components in the same module",
  )
})

test("public component in private submodule", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerInstance("id", Visibility.Public, {instance: {}})
  reg.registerModule("mod", Visibility.Private)

  const modReg = reg.forSubModule("mod")
  modReg.registerInstance("dep", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["mod", "dep"])
  t.is(
    visible,
    true,
    "public components should be visible to components in the parent module",
  )
})

test("public component nested in private submodule", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerInstance("id", Visibility.Public, {instance: {}})
  reg.registerModule("mod", Visibility.Private)

  const modReg = reg.forSubModule("mod")
  modReg.registerModule("nested", Visibility.Public)

  const nestedReg = modReg.forSubModule("nested")
  nestedReg.registerInstance("dep", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["mod", "nested", "dep"])
  t.is(
    visible,
    true,
    "public components nested inside a private module should be visible to components in the owner module",
  )
})

test("private component in public submodule", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerInstance("id", Visibility.Public, {instance: {}})
  reg.registerModule("mod", Visibility.Public)

  const modReg = reg.forSubModule("mod")
  modReg.registerInstance("dep", Visibility.Private, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["mod", "dep"])
  t.is(
    visible,
    false,
    "private components should not be visible to components in the parent module",
  )
})

test("private component in public parent module", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerInstance("dep", Visibility.Private, {instance: {}})
  reg.registerModule("mod", Visibility.Public)

  const modReg = reg.forSubModule("mod")
  modReg.registerInstance("id", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["mod", "id"])
  const visible = isVisible(["dep"])
  t.is(
    visible,
    false,
    "private components should not be visible to components in the parent module",
  )
})

test("public component in private submodule", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerInstance("dep", Visibility.Public, {instance: {}})
  reg.registerModule("mod", Visibility.Private)

  const modReg = reg.forSubModule("mod")
  modReg.registerInstance("id", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["mod", "id"])
  const visible = isVisible(["dep"])
  t.is(
    visible,
    true,
    "private components should not be visible to components in the parent module",
  )
})

test("public component with private common ancestor", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerModule("modA", Visibility.Private)

  const modAReg = reg.forSubModule("modA")
  modAReg.registerInstance("dep", Visibility.Public, {instance: {}})
  modAReg.registerModule("modB", Visibility.Private)

  const modBReg = modAReg.forSubModule("modB")
  modBReg.registerInstance("id", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["modA", "modB", "id"])
  const visible = isVisible(["modA", "dep"])
  t.is(
    visible,
    true,
    "public components should be visible to components with common ancestors",
  )
})

test("public component with private common ancestor", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerModule("modA", Visibility.Private)

  const modAReg = reg.forSubModule("modA")
  modAReg.registerInstance("dep", Visibility.Private, {instance: {}})
  modAReg.registerModule("modB", Visibility.Private)

  const modBReg = modAReg.forSubModule("modB")
  modBReg.registerInstance("id", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["modA", "modB", "id"])
  const visible = isVisible(["modA", "dep"])
  t.is(
    visible,
    false,
    "private components should not be visible, even to components with common ancestors",
  )
})

test("ancester", t => {
  const rootModule = createRootModuleRegistration()

  const reg = createRegistrationApi(rootModule)
  reg.registerModule("modA", Visibility.Private)

  const modAReg = reg.forSubModule("modA")
  modAReg.registerModule("modB", Visibility.Private)

  const modBReg = modAReg.forSubModule("modB")
  modBReg.registerInstance("id", Visibility.Public, {instance: {}})

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["modA", "modB", "id"])
  const visible = isVisible(["modA"])
  t.is(visible, true, "private ancestors should be visible")
})
