import * as vec2 from "../vec2";
import { DispatcherHolder, EventBase } from "../utils";

type TDrawData = {
    id: string;
    color: string;
    width: number;
    min: vec2.Vec2;
    max: vec2.Vec2;
    stroke: vec2.Vec2[][];
};

type EventColorSet = EventBase & {
    color?: string;
};
type EventToolSet = EventBase & {
    tool?: string;
};
type EventWidthSet = EventBase & {
    width?: number;
};

const ERASE_RADIUS = 50;

export default class PenTool {
    readonly holder: DispatcherHolder = new DispatcherHolder("pen");

    private current: TDrawData | null = null;

    private mode: "none" | "line" | "arrow" | "erase" = "none";
    private color: string = "#FF4236";
    private width: number = 5;

    private readonly all = new Map<string, TDrawData>();
    private line = false;

    constructor() {
        this.holder.registerFunc(
            (e: EventColorSet) => {
                this.color = e.color ?? "#FFFFFF";
            },
            ["color"]
        );
        this.holder.registerFunc(
            (e: EventToolSet) => {
                if (e.tool === "pen") {
                    this.mode = "line";
                } else if (e.tool === "arrow") {
                    this.mode = "arrow";
                } else if (e.tool === "erase") {
                    this.mode = "erase";
                } else {
                    this.mode = "none";
                }
            },
            ["tool"]
        );
        this.holder.registerFunc(
            (e: EventWidthSet) => {
                this.width = e.width ?? 5;
            },
            ["lineWidth"]
        );
    }

    setShift = (shift: boolean) => {
        this.line = shift;
    };

    onChange = () => {};

    start = (pos: vec2.Vec2) => {
        if (this.mode == "arrow" || this.mode == "line")
            this.current = {
                id: "",
                color: this.color,
                width: this.width,
                max: vec2.zero(),
                min: vec2.zero(),
                stroke: [[pos]],
            };
        else if (this.mode == "erase") {
            this.erase(pos);
        }
    };

    //消しゴムツール
    private erase = (pos: vec2.Vec2) => {
        const remove: string[] = [];
        for (const elem of this.all.values()) {
            //線と点の距離を出す
            if (
                vec2.contain(elem.min, pos, elem.max,ERASE_RADIUS) &&
                elem.stroke.some(
                    (arr) => vec2.calcDistLinePoint(arr, pos) < ERASE_RADIUS
                )
            ) {
                remove.push(elem.id);
            }
        }
        remove.forEach((key) => {
            this.all.delete(key);
        });
    };

    stroke = (button: number, pos: vec2.Vec2) => {
        if (this.current && button & 0b001) {
            const arr = this.current.stroke[0];

            if (1 < arr.length) {
                const l = vec2.dist(arr[arr.length - 2], arr[arr.length - 1]);
                if (l < 2) {
                    arr.pop();
                } else {
                    const v0 = vec2.norm(vec2.sub(arr[arr.length - 1], pos));
                    const v1 = vec2.norm(vec2.sub(arr[arr.length - 2], pos));
                    const dot = vec2.dot(v0, v1);
                    //console.log(l)
                    const lim =
                        (Math.abs(dot - 1) * Math.max(l, 10)) / this.width;
                    if (lim < 0.05) {
                        arr.pop();
                    }
                }
            }
            arr.push(pos);
            return true;
        } else if (this.mode == "erase") {
            if (button & 0b001) {
                this.erase(pos);
            }

            return true;
        }
        return false;
    };

    end = () => {
        if (this.current) {
            const key = Math.random().toString(16).slice(2, 10);

            //長さの例外処理
            if (this.current.stroke[0].length == 0) {
                return;
            }
            if (1 < this.current.stroke[0].length) {
                if (this.line) {
                    //直線化
                    const arr = this.current.stroke[0];
                    this.current.stroke[0] = [arr[0], arr[arr.length - 1]];
                }
                if (this.mode == "arrow") {
                    //矢印付与
                    const arr = this.current.stroke[0];
                    const origin =
                        2 < arr.length
                            ? vec2.avg(arr[arr.length - 2], arr[arr.length - 3])
                            : arr[arr.length - 2];
                    const pos = arr[arr.length - 1];
                    const vec = vec2.mul(
                        vec2.norm(vec2.sub(origin, arr[arr.length - 1])),
                        this.current.width * 5
                    );
                    const rote = vec2.mul(vec2.rote90(vec), 1);

                    const p0 = vec2.add(vec2.add(pos, vec), rote);
                    const p1 = vec2.sub(vec2.add(pos, vec), rote);

                    this.current.stroke.push([p0, pos, p1]);
                }
            }

            //削除用max min作成
            this.current.max = this.current.stroke.reduce(
                (prev, arr) =>
                    vec2.max(
                        prev,
                        arr.reduce((prev, vec) => vec2.max(prev, vec)),
                        prev
                    ),
                vec2.infNega()
            );
            this.current.min = this.current.stroke.reduce(
                (prev, arr) =>
                    vec2.min(
                        prev,
                        arr.reduce((prev, vec) => vec2.min(prev, vec)),
                        prev
                    ),
                vec2.inf()
            );

            console.log(this.current.max);
            this.current.id = key;
            this.all.set(key, this.current);
            this.onChange();

            this.current = null;
        }
    };

    private static drawStroke(ctx: CanvasRenderingContext2D, data: TDrawData) {
        ctx.beginPath();
        ctx.strokeStyle = data.color;
        data.stroke.forEach((p) => {
            //ctx.rect(p.x - 0.5, p.y - 0.5, 1, 1);
        });

        const arr = data.stroke[0];
        if (arr.length == 1) {
            ctx.rect(arr[0].x - 0.5, arr[0].y - 0.5, 1, 1);
        }

        ctx.lineWidth = data.width;
        data.stroke.forEach((arr) => {
            arr.forEach((p, i) => {
                if (i == 0) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            });
        });
        ctx.stroke();
    }

    draw = (ctx: CanvasRenderingContext2D, mousePos: vec2.Vec2) => {
        this.all.forEach((v) => {
            PenTool.drawStroke(ctx, v);
        });
        if (this.current) {
            //描画なら
            const arr = this.current.stroke[0];
            if (this.line) {
                ctx.beginPath();
                ctx.strokeStyle = this.current.color;
                ctx.lineWidth = this.current.width;

                ctx.moveTo(arr[0].x, arr[0].y);
                ctx.lineTo(arr[arr.length - 1].x, arr[arr.length - 1].y);
                ctx.stroke();
            } else {
                PenTool.drawStroke(ctx, this.current);
            }

            if (1 < arr.length && this.mode == "arrow") {
                //直線なら始点を 3以上なら最後2,3の平均でなければ最後から2番目
                const origin = this.line
                    ? arr[0]
                    : 2 < arr.length
                    ? vec2.avg(arr[arr.length - 2], arr[arr.length - 3])
                    : arr[arr.length - 2];
                const pos = arr[arr.length - 1];
                const vec = vec2.mul(
                    vec2.norm(vec2.sub(origin, pos)),
                    this.current.width * 5
                );
                const rote = vec2.mul(vec2.rote90(vec), 1);

                const p0 = vec2.add(vec2.add(pos, vec), rote);
                const p1 = vec2.sub(vec2.add(pos, vec), rote);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(p0.x, p0.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
            }
        }

        if (this.mode == "erase") {
            ctx.strokeStyle = "#FFFFFF";
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(mousePos.x, mousePos.y, ERASE_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            //ctx.strokeRect(mousePos.x, mousePos.y, 10, 10);
        }
    };
}