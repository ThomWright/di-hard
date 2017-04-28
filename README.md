# DI

Dependency injection

## Requirements

### MVP

- register component factories with container
  - `container.register("logger", createLogger)`
- get component instances from container
  - `container.get("logger")`
- annotate factories with required dependencies
  - `@inject(["logger"])`
- instances have their dependencies injected
- helpful error messages when required dependency not found
- factories of the form:
  - `({dependencyName}) => {}`

### More

- child containers
  - `container.child("request")`
- annotate factories with contexts
  - `@context("global")`, `@context("request")`
