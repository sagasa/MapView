
export type EventBase = {
    op: any;
  };

type Dispatcher = {
  accepts: string[];
  dispatch: (event: EventBase) => void;
};

export class DispatcherHolder {
  private parent?:DispatcherHolder
  accepts:string[] = [];
  map:Map<string,Dispatcher> = new Map()

  constructor() {}
  //関数単体を登録
  registerFunc(func: (event: EventBase) => void, accepts: string[]) {
    this.register({ accepts: accepts, dispatch: func })
  }

  registerHolder(dispatcher:DispatcherHolder){
    if(dispatcher.parent){
      console.log("error holder is already registered")
    }
    dispatcher.parent = this
  }

  private register(dispatcher:Dispatcher,ops?:string[]){
    const accepts = ops?ops:dispatcher.accepts
    if(this.accepts.some(op=>accepts.includes(op))){
      console.log("error op duplicated",this.accepts.find(op=>accepts.includes(op)))
    }
    //親に登録
    if(this.parent){
      this.parent.register(dispatcher,accepts)
    }
    this.accepts.push(...accepts)
    accepts.forEach(op=>this.map.set(op,dispatcher))
  }

  dispatch(event: EventBase) {
    this.map.get(event.op)?.dispatch(event)
  }
}
