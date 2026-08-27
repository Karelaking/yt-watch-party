type Factory<T> = (container: Container) => T;

export class Container {
  private static instance: Container;
  private services = new Map<symbol, unknown>();
  private factories = new Map<symbol, { factory: Factory<unknown>; singleton: boolean }>();

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public registerInstance<T>(token: symbol, instance: T): void {
    this.services.set(token, instance);
  }

  public registerSingleton<T>(token: symbol, factory: Factory<T>): void {
    this.factories.set(token, { factory: factory as Factory<unknown>, singleton: true });
  }

  public registerTransient<T>(token: symbol, factory: Factory<T>): void {
    this.factories.set(token, { factory: factory as Factory<unknown>, singleton: false });
  }

  public resolve<T>(token: symbol): T {
    if (this.services.has(token)) {
      return this.services.get(token) as T;
    }

    const registration = this.factories.get(token);
    if (!registration) {
      throw new Error(`No registration found for token: ${token.toString()}`);
    }

    const instance = registration.factory(this) as T;
    if (registration.singleton) {
      this.services.set(token, instance);
    }
    return instance;
  }

  public reset(): void {
    this.services.clear();
    this.factories.clear();
  }
}

export const container = Container.getInstance();
