export type EventBase = {
    op: any;
};

type Dispatcher = {
    accepts: string[];
    dispatch: (event: EventBase) => void;
};

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

    //ホルダーを登録する場所は親の設定を
    registerHolder(dispatcher: DispatcherHolder) {
        if (dispatcher.parent) {
            console.log("error holder is already registered");
        }
        dispatcher.parent = this;
        this.register(dispatcher, dispatcher.accepts);
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
