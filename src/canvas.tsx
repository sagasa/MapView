import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import get from "superagent";
import * as vec2 from "./vec2";

import MapInfo from "./map.json";

console.log("json test")
MapInfo.regions[0].outline.forEach(e=>{
  console.log()
})

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

  //マウス位置
  const [mousePos, setMousePos] = useState<Point>(ORIGIN);
  const lastMousePosRef = useRef<Point>(ORIGIN);
  let lastRefTest: Point = ORIGIN;
  let inDrag = false;

  //マウス移動
  function handleUpdateMove(event: MouseEvent) {
    event.preventDefault();
    //マウスの位置処理
    const lastMousePos = lastMousePosRef.current;
    //console.log("Move ",lastRefTest,lastMousePos)
    const canvas: any = mainCanvasRef.current;
    const currentMousePos = {
      x: event.pageX - canvas.offsetLeft,
      y: event.pageY - canvas.offsetTop,
    };
    lastMousePosRef.current = currentMousePos;

    //差分化
    const mouseDiff = vec2.sub(currentMousePos, lastMousePos);
    if (event.buttons & 1&&inDrag) {
      setOffset((prevOffset) => vec2.add(prevOffset,vec2.div(mouseDiff, scaleRaw)));
    }else{
      inDrag=false
    }
  }

  //マウスクリック
  function handleUpdateDown(event: MouseEvent) {
    inDrag = true
    httpTest()
  }

  //マウスホイール
  function handleUpdateWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY) {
      const scaleDeff = event.deltaY * 0.001
      scaleRaw *= 1 - scaleDeff;

      setOffset(prev=>vec2.add(prev,vec2.mul(lastMousePosRef.current,scaleDeff/scaleRaw)));
      setScale(scaleRaw);
    }
  }

  
  function reset(){
    //console.log()
    //setScale(Math.min(size.width!/img.width,size.height!/img.height))
  }

  //初期化
  useEffect(() => {
    const ctx: CanvasRenderingContext2D = getContext();
    const canvas: any = mainCanvasRef.current;

    //リセット
    reset();
    console.log("初期化");
    canvas.addEventListener("mousemove", handleUpdateMove);
    canvas.addEventListener("wheel", handleUpdateWheel);
    canvas.addEventListener("mousedown", handleUpdateDown);
    return () => {
      canvas.removeEventListener("mousemove", handleUpdateMove);
      canvas.removeEventListener("wheel", handleUpdateWheel);
      canvas.removeEventListener("mousedown", handleUpdateDown);
    };
  }, [mainCanvasRef]);

  //表示関連
  const [offset, setOffset] = useState<Point>(ORIGIN);
  const [scale, setScale] = useState<number>(1);
  let scaleRaw = 1;

  useLayoutEffect(() => {
    reset()
  }, [size.width, size.height]);

  useLayoutEffect(() => {
    const ctx: CanvasRenderingContext2D = getContext();

    if (ctx) {
      ctx.resetTransform()
      ctx.clearRect(0, 0, size.width!, size.height!);
      //ctx.globalAlpha = 0.3
      ctx.font = '20px serif';
      ctx.scale(scale,scale)
      ctx.translate(offset.x,offset.y)
      
      //setViewportTopLeft((prevVal) => diffPoints(prevVal, offsetDiff));
      //    isResetRef.current = false;

      const inversed = ctx.getTransform().inverse();

      const zeroPos = ctx
        .getTransform()
        .transformPoint({
          x: -lastMousePosRef.current.x / ctx.getTransform().a,
          y: -lastMousePosRef.current.y / ctx.getTransform().a,
        });

      zeroPos.x /= ctx.getTransform().a;
      zeroPos.y /= ctx.getTransform().d;
      //console.log(ctx.getTransform(), zeroPos, mainCanvasRef);

      ctx.drawImage(img, 0, 0, img.width, img.height);
      ctx.strokeRect(-zeroPos.x, -zeroPos.y, 10, 10);

      ctx.strokeStyle = "red";
      ctx.beginPath();
      const outline = MapInfo.regions[0].outline;
      ctx.moveTo(outline[outline.length-1].x,outline[outline.length-1].y)
      MapInfo.regions[0].outline.forEach(e=>{
        ctx.lineTo(e.x,e.y);
      })
      ctx.stroke()

      //console.log(offset);
      ctx.save();
    }
  }, [offset, scale, size.width, size.height]);

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
    width: undefined,
    height: undefined,
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
