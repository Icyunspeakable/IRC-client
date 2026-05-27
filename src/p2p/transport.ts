import { BaseEvent } from '../types/events';

export interface Transport {
  publish(event: BaseEvent): Promise<void>;
  subscribe(onEvent: (event: BaseEvent) => Promise<void>): void;
}

export class MockTransport implements Transport {
  private handler?: (event: BaseEvent) => Promise<void>;
  async publish(event: BaseEvent): Promise<void> { if (this.handler) await this.handler(event); }
  subscribe(onEvent: (event: BaseEvent) => Promise<void>): void { this.handler = onEvent; }
}
