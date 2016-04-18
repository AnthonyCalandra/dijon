# dijon - (d)ependency (i)n(j)ecti(on)

This is an experimental dependency injection (DI) library targeting ES7.

## The Goal

Suppose we had a `Driver` we would like to have injected into `Car`:

```js
class Driver {
  constructor(name, age) {
    this._name = name;
    this._age = age;
  }

  get name() {
    return this._name;
  }

  get age() {
    return this._age;
  }

  toString() {
    return `name: ${this._name}, age: ${this._age}`;
  }
}
```
Now for an example of dijon's end goals:
```js
import { DriverFactory } from 'driver.js';

// Class-level dependencies or injectors which take a dependency factory and inject them into classes. Useful for multiple dependencies of the same type. (WIP)
// @injector(DriverFactory)
// =========================
// Class-level dependencies and middlewares.
@inject('Driver', Driver, 'Stan', 53)
// Called whenever 'Driver' dependency is used.
@middleware('Driver', (driver) => console.log(`class middleware: { ${driver} }`))
class Car {
  // Method-level dependencies and middlewares which override class-level ones.
  @inject('Driver', Driver, 'Anthony', 21)
  get driver() {
    return this.Driver;
  }

  @inject('Driver2', Driver, 'Joe', 21)
  get driver2() {
    // Can access dependencies by name using `this`.
    return this.Driver2;
  }
}
```
These are the desired features among others.

## Current Features

### Injection

This is the most basic way to use the library.

The `@inject` decorator accepts an alias (for multiple dependencies), a class object, and an optional list of arguments to that class' constructor .

You can inject regular or frozen dependencies depending on whether you use `@inject` or `@frozenInject`. A frozen dependency is one whose instance is wrapped in `Object.freeze` preventing any modification to it. The decorator arguments are the same for both.

Class-level DI:
```js
@inject('Driver', Driver, 'Stan', 53)
class Car {
  get driver() {
    return this.Driver;
  }
}

const car = new Car();
console.log(car.driver.name); // Stan
```

Method-level DI:
```js
class Car {
  @inject('Driver', Driver, 'Stan', 53)
  get driver() {
    return this.Driver;
  }

  @inject('Driver2', Driver, 'Anthony', 21)
  get driver2() {
    return this.Driver2;
  }
}

const car = new Car();
console.log(car.driver.name); // Stan
console.log(car.driver2.name); // Anthony
```

### Middleware

Class-level:
```js
const log = (driver) => console.log(`Accessed: { ${driver.toString()} }`);

@inject('Driver', Driver, 'Stan', 53)
@inject('Driver2', Driver, 'Anthony', 21)
@middleware('Driver', log)
@middleware('Driver2', log)
class Car {
  get driver() {
    return this.Driver;
  }
  get driver2() {
    return this.Driver2;
  }
}

const car = new Car();
car.driver.name; // Accessed: { name: Stan, age: 53 }
car.driver2.name; // Accessed: { name: Anthony, age: 21 }
```

Method-level:
TODO

## Author

Anthony Calandra

## License

MIT
