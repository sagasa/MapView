
type EventBase = {
    op: any;
  };

type Dispatcher = {
  accepts: string[];
  func: (event: EventBase) => void;
};

export class DispatcherHolder {
  dispatchers: Dispatcher[] = [];

  constructor() {}
  register(func: (event: EventBase) => void, accepts: string[]) {
    this.dispatchers.push({ accepts: accepts, func: func });
  }
  dispatch(event: EventBase) {
    for (const dispatcher of this.dispatchers) {
      if (dispatcher.accepts.includes(event.op)) {
        dispatcher.func(event);
        break;
      }
    }
  }
}
