import * as vec2 from "../vec2";
import { DispatcherHolder, EventBase } from "../utils";
import postRootData from "../components/root"
import {NORMAL_PIN, SINGLETON_PIN} from "../components/drawTools"
import { Connection } from "../connections/connecton";
import CookieManager from "../cookie";

const img = new Image();
img.src = "./backpack.png";
img.onerror = (e) => {
    console.log(e);
};

type TPinData = {
    id: string;
    type: string;
    label:string
    pos: vec2.Vec2;
};
type TMove = {
    id: string;
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
    private pinMap = new Map<string, TPinData>();
    private singletonPin = new Map<string,string>();
    private grab:string = "";
    private isSingleton = false;

    constructor() {
        //UIイベント系

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

        this.holder.registerFunc(
            () => {
                this.pinMap.clear()
                postRootData("redraw");
            },
            ["clear"]
        );

        //ネットワーク系
        Connection.register("pinAdd", (data) => {
            const pin = JSON.parse(data) as TPinData;
            this.put(pin,false)
        });
        Connection.register("pinDelete", (data) => {
            this.delete(data,false)
        });
        Connection.register("pinMove", (data) => {
            const move = JSON.parse(data) as TMove;
            this.move(move.id,move.pos,false)
        });
    }

    private getCollide = (mousePos: vec2.Vec2,scale:number)=>{
        const collide:TPinData[] = []
        this.pinMap.forEach((pin,k)=>{
            if(PinTool.collision(mousePos,pin.pos,scale)){
                collide.push(pin)
            }
        })
        return collide;
    }

    //追加処理
    private put(pin: TPinData, notfy: boolean = true) {
        if (notfy) Connection.send("pinAdd", pin);
        this.pinMap.set(pin.id, pin);
        postRootData("redraw");
    }


    //削除処理
    private delete(id: string, notfy: boolean = true) {
        if (notfy) Connection.send("pinDelete", id);
        this.pinMap.delete(id);
        postRootData("redraw");
    }

    //移動処理
    private move(id: string,pos:vec2.Vec2, notfy: boolean = true) {
        if (notfy) Connection.send("pinMove", {id:id,pos:pos});
        this.pinMap.get(id)!.pos = pos
        postRootData("redraw");
    }

    mouseDown = (mousePos: vec2.Vec2,scale:number,buttons:number) => {
        const collide = this.getCollide(mousePos,scale);
        if(collide.length!=0){
            //近い順にソート
            collide.sort((a,b)=>vec2.dist(a.pos,mousePos)-vec2.dist(b.pos,mousePos));
            if(buttons & 0b001){
                this.grab = collide[0].id
                postRootData("cursorAdd",CURSOR_GRAB)
            }else if(buttons & 0b010){
                this.delete(collide[0].id)
            }
            
        }else if(this.mode && buttons & 0b001){
            //追加処理
            let key = Math.random().toString(16).slice(2, 10);
            
            //1つのみ存在できるもの
            if(this.isSingleton){
                if(this.singletonPin.has(this.mode)){
                    key = this.singletonPin.get(this.mode)!
                }else{
                    this.singletonPin.set(this.mode,key)
                }
            }
            const pin:TPinData = {id:key,pos:mousePos,type:this.mode,label:this.isSingleton?CookieManager.getUserName():""}
            this.put(pin)
            
            postRootData("cursorAdd",CURSOR_CANGRAB)
        }
    };

    mouseUp = (button:number) => {
        if(this.grab){
            this.grab = ""
            postRootData("cursorRemove",CURSOR_GRAB)
            
        }
    };

    mouseMove = (mousePos: vec2.Vec2,diff: vec2.Vec2,scale:number) => {
        let redrawFlag = false
        const collide = this.getCollide(mousePos,scale)

        if(collide.length!=0){    
            postRootData("cursorAdd",CURSOR_CANGRAB)
        }else{
            postRootData("cursorRemove",CURSOR_CANGRAB)
        }

        if(this.grab){
            redrawFlag = true
            const pos = vec2.add(this.pinMap.get(this.grab)!.pos,diff)
            this.move(this.grab,pos)
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
        const imageSize = 64/scale

        ctx.imageSmoothingEnabled = false
        this.pinMap.forEach((pin,key)=>{

            ctx.shadowColor = "black"; 
            ctx.shadowBlur  = 0;
            if(this.grab===key){
                ctx.shadowOffsetX = 4;    
                ctx.shadowOffsetY = 4;
                ctx.drawImage(
                    imageMap.get(pin.type)!,
                    pin.pos.x - imageSize/1.88,
                    pin.pos.y - imageSize/1.88,
                    imageSize,
                    imageSize
                );
            }else{
                ctx.drawImage(
                    imageMap.get(pin.type)!,
                    pin.pos.x - imageSize/2,
                    pin.pos.y - imageSize/2,
                    imageSize,
                    imageSize
                );
            }
            
            ctx.shadowOffsetX = 0;    
            ctx.shadowOffsetY = 0;

            if(pin.label){
                const label = pin.label
                const textSize = Math.floor(18 / scale);
                ctx.font = `${textSize}px sans-serif`;
                const textWidth = ctx.measureText(label).width
                ctx.fillStyle = "black";
                ctx.globalAlpha = 0.3
                ctx.fillRect(pin.pos.x - textWidth/1.8,pin.pos.y+ imageSize/2.6,textWidth*1.1,textSize*1.1)
                ctx.globalAlpha = 1
                ctx.fillStyle = "white";
                ctx.fillText(label,pin.pos.x - textWidth/2,pin.pos.y+ imageSize/2.6+textSize)
            }
            
        })
        ctx.imageSmoothingEnabled = true
    };
}
