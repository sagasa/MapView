export type EventBase = {
    op: any;
};

type Dispatcher = {
    accepts: string[];
    dispatch: (event: EventBase) => void;
};

const arrEq = (a:any[],b:any[])=>{
    return a.length===b.length && a.every((e,i)=>e===b[i])
}

export class DispatcherHolder {
    private parent?: DispatcherHolder;
    accepts: string[] = [];
    private map: Map<string, Dispatcher[]> = new Map();
    private name: string;

    constructor(name: string) {
        this.name = name;
    }
    //関数単体を登録
    registerFunc(func: (event: EventBase) => void, accepts: string[]) {
        this.register({ accepts: accepts, dispatch: func });
    }

    //関数単体を削除
    unregisterFunc(func: (event: EventBase) => void, accepts: string[]) {
        this.unregister({ accepts: accepts, dispatch: func });
    }

    //ホルダーを登録
    registerHolder(dispatcher: DispatcherHolder) {
        //親の設定をする
        if (dispatcher.parent) {
            console.log("error holder is already registered");
        }
        dispatcher.parent = this;
        this.register(dispatcher);
    }

    //ホルダーを削除
    unregisterHolder(dispatcher: DispatcherHolder) {
        //親の設定をする
        if (dispatcher.parent!==this) {
            console.log("error holder is not registered");
            return
        }
        dispatcher.parent = undefined;
        this.unregister(dispatcher);
    }

    private register(dispatcher: Dispatcher, ops?: string[]) {
        const accepts = ops ? ops : dispatcher.accepts;
        //親に登録
        if (this.parent) {
            this.parent.register(dispatcher, accepts);
        }
        this.accepts.push(...accepts);

        accepts.forEach((op) => {
            if (!this.map.has(op)) {
                this.map.set(op, []);
            }
            this.map.get(op)?.push(dispatcher);
        });
    }

    private unregister(dispatcher: Dispatcher, ops?: string[]) {
        const accepts = ops ? ops : dispatcher.accepts;
        //親のチェック
        if (this.parent) {
            this.parent.unregister(dispatcher, accepts);
        }
        accepts.forEach(op=>{
            this.accepts.splice(this.accepts.lastIndexOf(op),1)
        })

        accepts.forEach((op) => {
            if (this.map.has(op)) {
                const arr = this.map.get(op)!.filter(elem=>elem.dispatch!==dispatcher.dispatch||!arrEq(elem.accepts,dispatcher.accepts))
                if(arr.length===0){
                    this.map.delete(op)
                }else{
                    this.map.set(op, arr);
                }
            }
        });
    }

    dispatch(event: EventBase) {
        if (!this.map.has(event.op)) {
            console.log(
                "event not found",
                event,
                this.name,
                this.map,
                this.map.has(event.op)
            );
        }
        this.map
            .get(event.op)
            ?.forEach((dispatcher) => dispatcher.dispatch(event));
    }
}
