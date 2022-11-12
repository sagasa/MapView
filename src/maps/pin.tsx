import * as vec2 from "../vec2";
import { DispatcherHolder, EventBase } from "../utils";
import postRootData from "../components/root"
import {NORMAL_PIN, SINGLETON_PIN} from "../components/drawTools"

const img = new Image();
img.src = "./backpack.png";
img.onerror = (e) => {
    console.log(e);
};

type TPinData = {
    id: string;
    type: string;
    pos: vec2.Vec2;
};

type EventToolSet = EventBase & {
    tool?: string;
};

const imageMap = new Map<string, HTMLImageElement>();
{
    NORMAL_PIN.forEach((elem) =>
        {
            const img = new Image();
            img.src = elem.image;
            imageMap.set(elem.name, img);
        }
    );
    SINGLETON_PIN.forEach((elem) =>
        {
            const img = new Image();
            img.src = elem.image;
            imageMap.set(elem.name, img);
        }
    );
}


const CURSOR_CANGRAB = {cursor:"grab",priority:3}
const CURSOR_GRAB = {cursor:"grabbing",priority:4}

export default class PinTool {
    readonly holder: DispatcherHolder = new DispatcherHolder("pen");

    private mode: string = "";
    private all = new Map<string, TPinData>();
    private singletonPin = new Map<string,string>();
    private grab:string = "";
    private isSingleton = false;

    constructor() {
        this.holder.registerFunc(
            (e: EventToolSet) => {
                if (imageMap.has(e.tool!)) {
                    this.mode = e.tool!;
                    this.isSingleton = SINGLETON_PIN.some(elem=>elem.name===e.tool);
                }else{
                    this.mode = "";
                }
            },
            ["tool"]
        );
    }

    private getCollide = (mousePos: vec2.Vec2,scale:number)=>{
        const collide:TPinData[] = []
        this.all.forEach((pin,k)=>{
            if(PinTool.collision(mousePos,pin.pos,scale)){
                collide.push(pin)
            }
        })
        return collide;
    }

    private addPin=()=>{

    }

    down = (mousePos: vec2.Vec2,scale:number,buttons:number) => {
        const collide = this.getCollide(mousePos,scale);
        if(collide.length!=0){
            //近い順にソート
            collide.sort((a,b)=>vec2.dist(a.pos,mousePos)-vec2.dist(b.pos,mousePos));
            if(buttons & 0b001){
                this.grab = collide[0].id
                postRootData("cursorAdd",CURSOR_GRAB)
            }else if(buttons & 0b010){
                this.all.delete(collide[0].id)
                postRootData("redraw")
            }
            
        }else if(this.mode && buttons & 0b001){
            //追加処理
            let key = Math.random().toString(16).slice(2, 10);
            
            //１
            if(this.isSingleton){
                if(this.singletonPin.has(this.mode)){
                    key = this.singletonPin.get(this.mode)!
                }else{
                    this.singletonPin.set(this.mode,key)
                }
            }
            const pin:TPinData = {id:key,pos:mousePos,type:this.mode}
            this.all.set(key,pin)
            
            postRootData("cursorAdd",CURSOR_CANGRAB)
        }
    };

    up = (button:number) => {
        if(this.grab){
            this.grab = ""
            postRootData("cursorRemove",CURSOR_GRAB)
            
        }
    };

    move = (mousePos: vec2.Vec2,diff: vec2.Vec2,scale:number) => {
        let redrawFlag = false
        const collide = this.getCollide(mousePos,scale)

        if(collide.length!=0){    
            postRootData("cursorAdd",CURSOR_CANGRAB)
        }else{
            postRootData("cursorRemove",CURSOR_CANGRAB)
        }

        if(this.grab){
            redrawFlag = true
            this.all.get(this.grab)!.pos = vec2.add(this.all.get(this.grab)!.pos,diff)
        }

        return redrawFlag;
    };

    private static collision(a:vec2.Vec2,b:vec2.Vec2,scale:number) {
        return Math.abs(a.x-b.x)<32/scale && Math.abs(a.y-b.y)<32/scale
    }

    draw = (
        ctx: CanvasRenderingContext2D,
        scale: number,
        mousePos: vec2.Vec2
    ) => {
        ctx.imageSmoothingEnabled = false
        this.all.forEach((pin,key)=>{

            ctx.shadowColor = "black"; 
            ctx.shadowBlur  = 0;
            if(this.grab===key){
                ctx.shadowOffsetX = 4;    
                ctx.shadowOffsetY = 4;
                ctx.drawImage(
                    imageMap.get(pin.type)!,
                    pin.pos.x - 34 / scale,
                    pin.pos.y - 34 / scale,
                    64 / scale,
                    64 / scale
                );
            }else{
                ctx.drawImage(
                    imageMap.get(pin.type)!,
                    pin.pos.x - 32 / scale,
                    pin.pos.y - 32 / scale,
                    64 / scale,
                    64 / scale
                );
            }

            
            ctx.shadowOffsetX = 0;    
            ctx.shadowOffsetY = 0;
        })
        ctx.imageSmoothingEnabled = true
    };
}
