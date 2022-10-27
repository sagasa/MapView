import * as vec2 from "../vec2";
import {DispatcherHolder} from "../utils"

type TDrawData = {
  id: string;
  color: string;
  width: number;
  stroke: vec2.Vec2[][];
};


export class PenTool {

  holder :DispatcherHolder = new DispatcherHolder()

  current: TDrawData | null = null;
  mode: "none" | "line" | "arrow" = "none";
  all = new Map<string, TDrawData>();
  line = false;
  arrow = false;

  onChange = () => {};

  start = (pos: vec2.Vec2) => {
    if (this.mode != "none")
      this.current = {
        id: "",
        color: "#FF0000",
        width: 2,
        stroke: [[pos]],
      };
  };

  stroke = (pos: vec2.Vec2) => {
    if (this.current) {
      const arr = this.current.stroke[0];

      if (1 < arr.length) {
        const l = vec2.dist(arr[arr.length - 2], arr[arr.length - 1]);
        if (l < 2) {
          arr.pop();
        } else {
          const v0 = vec2.norm(vec2.sub(arr[arr.length - 1], pos));
          const v1 = vec2.norm(vec2.sub(arr[arr.length - 2], pos));
          const dot = vec2.dot(v0, v1);
          const lim = Math.abs(dot - 1) * l;
          if (lim < 0.05) {
            arr.pop();
          }
        }
      }
      arr.push(pos);
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
        if (this.arrow) {
          //矢印付与
          const arr = this.current.stroke[0];
          const origin =
            2 < arr.length
              ? vec2.avg(arr[arr.length - 2], arr[arr.length - 3])
              : arr[arr.length - 2];
          const pos = arr[arr.length - 1];
          const vec = vec2.mul(
            vec2.norm(vec2.sub(origin, arr[arr.length - 1])),
            5
          );
          const rote = vec2.mul(vec2.rote90(vec), 1);

          const p0 = vec2.add(vec2.add(pos, vec), rote);
          const p1 = vec2.sub(vec2.add(pos, vec), rote);

          this.current.stroke.push([p0, pos, p1]);
        }
      }

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

    ctx.lineWidth = 0.5; //data.width;
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

  draw = (ctx: CanvasRenderingContext2D) => {
    if (this.current) {
      const arr = this.current.stroke[0];
      if (this.line) {
        ctx.beginPath();
        ctx.strokeStyle = this.current.color;
        ctx.lineWidth = 0.5; //data.width;

        ctx.moveTo(arr[0].x, arr[0].y);
        ctx.lineTo(arr[arr.length - 1].x, arr[arr.length - 1].y);
        ctx.stroke();
      } else PenTool.drawStroke(ctx, this.current);

      if (1 < arr.length && this.arrow) {
        //直線なら始点を 3以上なら最後2,3の平均でなければ最後から2番目
        const origin = this.line
          ? arr[0]
          : 2 < arr.length
          ? vec2.avg(arr[arr.length - 2], arr[arr.length - 3])
          : arr[arr.length - 2];
        const pos = arr[arr.length - 1];
        const vec = vec2.mul(vec2.norm(vec2.sub(origin, pos)), 5);
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

    this.all.forEach((v) => {
      PenTool.drawStroke(ctx, v);
    });
  };
}
