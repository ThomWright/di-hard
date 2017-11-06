import dihard, {Container} from "../src"

interface InfoGiver {
  getInfo(): string
}

function myDependencyFactory() {
  return {
    getInfo() {
      return "(dependency)"
    },
  }
}
function myServiceFactory({myDependency}: {myDependency: InfoGiver}) {
  return {
    getInfo() {
      return `(service - dependencies: ${myDependency.getInfo()})`
    },
  }
}

const container: Container = dihard.createContainer("application")
container.registerFactory("myService", myServiceFactory)
container.registerFactory("myDependency", myDependencyFactory)

const myService = container.resolve("myService") as InfoGiver
console.log(myService.getInfo()) // "(service - dependencies: (dependency))"
