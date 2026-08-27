import { EventEmitter } from 'node:events';
import type { IDomainEvent } from './domain-events.js';

export type EventHandler<T = unknown> = (event: IDomainEvent<T>) => Promise<void> | void;

export interface IEventDispatcher {
  publish<T>(event: IDomainEvent<T>): void;
  subscribe<T>(eventName: string, handler: EventHandler<T>): void;
  unsubscribe<T>(eventName: string, handler: EventHandler<T>): void;
}

export class EventDispatcher implements IEventDispatcher {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  public publish<T>(event: IDomainEvent<T>): void {
    // Asynchronous dispatch to avoid blocking callers
    setImmediate(() => {
      this.emitter.emit(event.eventName, event);
      this.emitter.emit('*', event);
    });
  }

  public subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    this.emitter.on(eventName, handler as (event: unknown) => void);
  }

  public unsubscribe<T>(eventName: string, handler: EventHandler<T>): void {
    this.emitter.off(eventName, handler as (event: unknown) => void);
  }
}

export const eventDispatcher = new EventDispatcher();
export * from './domain-events.js';
