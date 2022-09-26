import { Connection } from "../connections/connecton";
import * as vec2 from "../vec2";

type TDrawData = {
  id:string;
  color: string;
  width: number;
  stroke: vec2.Vec2[];
};



export class PenTool {
  current: TDrawData|null = null;

  all = new Map<string, TDrawData>();

  constructor(){
    Connection.register("addDraw",(data)=>{
      const draw = JSON.parse(data) as TDrawData
      this.onChange()
      this.all.set(draw.id,draw)
    })
  }

  onChange = ()=>{}

  start = () => {
    this.current = {id:"",color:"#FF0000",width:2,stroke:[]}
  };

  stroke = (pos: vec2.Vec2) => {
    if(this.current){
        this.current.stroke.push(pos);
        return true;
    }
    return false;
  };

  end = () => {
    if(this.current){
        const key = Math.random().toString(16).slice(2, 10);
        //this.all.set(key,this.current)
        Connection.send("addDraw",this.current)
        console.log(key)
    }
  };

  private static drawStroke(ctx:CanvasRenderingContext2D,data:TDrawData) {
    ctx.beginPath();
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        data.stroke.forEach((p,i)=>{
            if(i==0){
                ctx.moveTo(p.x,p.y);
            }else{
                ctx.lineTo(p.x,p.y);
            }
       })
    ctx.stroke();
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    if(this.current){
        PenTool.drawStroke(ctx,this.current);
    }
    
    this.all.forEach((v) => {
      ctx.beginPath();
      ctx.strokeStyle = v.color;
      ctx.lineWidth = v.width;
      v.stroke.forEach((p,i)=>{
        if(i==0){
            ctx.moveTo(p.x,p.y);
        }else{
            ctx.lineTo(p.x,p.y);
        }
    })
      ctx.stroke();
    });
  };
}
