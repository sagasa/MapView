import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import React, { useEffect, useState, useRef, useLayoutEffect ,useCallback} from "react";
import get from "superagent";
import * as vec2 from "./vec2";

import MapInfo from "./map.json";

//位置
type Point = {
  x: number;
  y: number;
};
const ORIGIN = Object.freeze({ x: 0, y: 0 });

const img = new Image();
img.src = MapInfo.url;
img.referrerPolicy = "no-referrer";

type Props = {
  isFullScreen: boolean;
};

function* generator() {
  while (true) {
    const random = Math.random()
      .toString(16)
      .slice(2, 10);
    yield `0x${random}`;
  }
}

function httpTest(){
  const url = `${window.location.protocol}//${window.location.hostname}:3001/api`;
  console.log(url);
  get
  .get(url)
  .end(function(err, res){
    console.log(res);//レスポンス
    //レスポンスがJSONの場合 
    console.log(res);//ここにparse済みのオブジェクトが入る
  });
}

const MapCanvas: React.FC<Props> = (props) => {
  const resizeOps = props.isFullScreen ? "none" : "both";
  const mainCanvasRef = useRef(null);
  const divRef = useRef(null);
  const size: Size = props.isFullScreen
    ? useWindowSize()
    : useParentSize(divRef);
  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = mainCanvasRef.current;
    return canvas.getContext("2d");
  };

  const id = generator().next().value;

  console.log("make func "+id)

    //スクリーン座標からキャンバス座標に
    function screen2CanvasPos(x:number,y:number){
      const canvas: any = mainCanvasRef.current;
      return {
        x: x - canvas.offsetLeft,
        y: y - canvas.offsetTop,
      }
    }
    //キャンバス座標からイメージ座標へ
    function canvas2ImagePos(pos:vec2.Vec2){
      
      return vec2.sub(vec2.div(pos,scaleRef.current),offsetRef.current)
      //return vec2.div(pos,scaleRaw)
    }

  //マウス位置
  const lastMousePosRef = useRef<Point>(ORIGIN);
  const inDragRef =  useRef<boolean>(false);

  //マウス移動
  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    //マウスの位置処理
    const lastMousePos = lastMousePosRef.current;

    const currentMousePos = screen2CanvasPos(event.pageX,event.pageY)
    lastMousePosRef.current = currentMousePos;

    //差分化
    const mouseDiff = vec2.sub(currentMousePos, lastMousePos);
    if (event.buttons & 1&&inDragRef.current) {
      offsetRef.current = vec2.add(offsetRef.current,vec2.div(mouseDiff, scaleRef.current))
      write();
      //setOffset((prevOffset) => vec2.add(prevOffset,vec2.div(mouseDiff, scaleRaw)));
    }else{
      inDragRef.current=false
    }
  }

  //マウスクリック
  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    inDragRef.current = true
    
    screen2CanvasPos(event.pageX,event.pageY)
    const mousePos = vec2.sub(vec2.mul(lastMousePosRef.current,scaleRef.current),offsetRef.current)

    const isHit = MapInfo.regions[0].outlines.some(outline=>outline.every((p0,i)=>{
      const p1 = outline[(outline.length + i + 1) % outline.length];
      return 0<vec2.cross3(p0,p1,mousePos);
    }))
    console.log(isHit)

    //httpTest()
  }

  function handleMouseWheel(event: React.WheelEvent) {
    if (event.deltaY) {
      const scaleDeff = event.deltaY * 0.001
      scaleRef.current *= 1 - scaleDeff;
      offsetRef.current = vec2.add(offsetRef.current,vec2.mul(lastMousePosRef.current,scaleDeff/scaleRef.current))
      //setOffset(prev=>vec2.add(prev,vec2.mul(lastMousePosRef.current,scaleDeff/scaleRaw)));
      //setScale(scaleRaw);
      write();
    }
  }

    //表示関連
    const offsetRef = useRef<Point>(ORIGIN);
    const scaleRef = useRef<number>(1);

  //canvasに描画
  function write(){
    const ctx: CanvasRenderingContext2D = getContext();
    
    if (ctx) {
      ctx.resetTransform()
      ctx.clearRect(0, 0, size.width!, size.height!);
      //ctx.globalAlpha = 0.3
      ctx.font = '20px serif';
      ctx.scale(scaleRef.current,scaleRef.current)
      ctx.translate(offsetRef.current.x,offsetRef.current.y)
      
      //setViewportTopLeft((prevVal) => diffPoints(prevVal, offsetDiff));
      //    isResetRef.current = false;

      const inversed = ctx.getTransform().inverse();

      const zeroPos = canvas2ImagePos(lastMousePosRef.current)


      //console.log(ctx.getTransform(), zeroPos, mainCanvasRef);

      ctx.drawImage(img, 0, 0, img.width, img.height);
      ctx.strokeRect(zeroPos.x, zeroPos.y, 10, 10);

      ctx.strokeStyle = "red";
      
      MapInfo.regions[0].outlines.forEach(outline=>{
        ctx.beginPath();
        ctx.moveTo(outline[outline.length-1].x,outline[outline.length-1].y)
        outline.forEach(e=>{
          ctx.lineTo(e.x,e.y);
        })
        ctx.stroke()
      })
      //console.log(offset);
      ctx.save();
    }
  }

  useLayoutEffect(() => {
    write();
  }, [size.width, size.height]);


  return (
    <div
      ref={divRef}
      style={{
        resize: `${resizeOps}`,
        overflow: "hidden",
        position: "absolute",
        left: "0px",
        top: "0px",
      }}
    >
      <canvas
        className="canvas"
        ref={mainCanvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onWheel={handleMouseWheel}
        style={{
          //border: "2px solid #000",
          width: `${size.width}px`,
          height: `${size.height}px`,
          boxSizing: `border-box`,
        }}
        width={size.width}
        height={size.height}
      />
    </div>
  );
};

interface Size {
  width: number | undefined;
  height: number | undefined;
}

function useWindowSize(): Size {
  const [windowSize, setWindowSize] = useState<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

function useParentSize(parentRef: React.RefObject<null>): Size {
  const [windowSize, setWindowSize] = useState<Size>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const parent: any = parentRef.current;
    // Handler to call on resize
    function handleResize() {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      setWindowSize({
        width: w,
        height: h,
      });
      console.log("resize");
    }

    const observer = new MutationObserver((mutations) => {
      const el: any = mutations[0].target;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const isChange = mutations
        .map((m) => `${m.oldValue}`)
        .some(
          (prev) =>
            prev.indexOf(`width: ${w}px`) === -1 ||
            prev.indexOf(`height: ${h}px`) === -1
        );
      if (isChange) {
        handleResize();
      }
    });
    observer.observe(parent, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["style"],
    });
    // Add event listener
    parent.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => observer.disconnect();
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

export default MapCanvas;
