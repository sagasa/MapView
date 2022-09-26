import ReactDOM from "react-dom";
import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useContext
} from "react";
import get from "superagent";


import * as vec2 from "../vec2";

import MapJson from "../map.json";
import { Connection } from "../connections/connecton";
import { PenTool } from "./pen";

const MapInfo:IMapData = MapJson

type TPinData={
  x:number
  y:number
  rotation:number
  url:string
}

interface IMapData{
  url:string,
  regions:{
    difference:{
      src:{
        p0:vec2.Vec2,
        p1:vec2.Vec2,
        p2:vec2.Vec2
      },
      dest:{
        p0:vec2.Vec2,
        p1:vec2.Vec2,
        p2:vec2.Vec2
      },
      matrix?:DOMMatrix,
      inversed?:DOMMatrix
    },
    outlines:vec2.Vec2[][]
  }[]
}

//変換
MapInfo.regions.forEach((region) => {
  const matrix = vec2.calcAffine(
    region.difference.src,
    region.difference.dest
  );
  region.difference.matrix = matrix
  region.difference.inversed = matrix.inverse()
  //region.difference.affine = vec2.calcAffine(region.difference.src,region.difference.dest)
});

//位置
type Point = {
  x: number;
  y: number;
};
const ORIGIN = Object.freeze({ x: 0, y: 0 });

const img = new Image();
img.src = MapInfo.url;
img.referrerPolicy = "no-referrer";

const ping = new Image();
ping.src = "/ping.png";

type Props = {
  isFullScreen: boolean;
};

const MapCanvas: React.FC<Props> = (props) => {
  const resizeOps = props.isFullScreen ? "none" : "both";
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef(null);
  const size: Size = props.isFullScreen
    ? useWindowSize()
    : useParentSize(divRef);

  const [cursor, setCursor] = useState<string>("auto");

  const penToolRef = useRef(new PenTool())

  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = mainCanvasRef.current;
    return canvas.getContext("2d");
  };

  //初期化
  useEffect(() => {
    penToolRef.current.onChange = write;
  }, []);

  //スクリーン座標からキャンバス座標に
  function screen2CanvasPos(x: number, y: number) {
    const canvas: any = mainCanvasRef.current;
    return {
      x: x - canvas.offsetLeft,
      y: y - canvas.offsetTop,
    };
  }
  //キャンバス座標からイメージ座標へ
  function canvas2ImagePos(pos: vec2.Vec2) {
    return vec2.sub(vec2.div(pos, scaleRef.current), offsetRef.current);
    //return vec2.div(pos,scaleRaw)
  }

  //マウス位置
  const lastMousePosRef = useRef<Point>(ORIGIN);
  const inDragRef = useRef<boolean>(false);

  //マウス移動
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      //マウスの位置処理
      const lastMousePos = lastMousePosRef.current;

      const currentMousePos = screen2CanvasPos(event.pageX, event.pageY);
      lastMousePosRef.current = currentMousePos;
      //差分化
      const mouseDiff = vec2.sub(currentMousePos, lastMousePos);
      if (inDragRef.current && event.buttons & 0b101) {
        offsetRef.current = vec2.add(
          offsetRef.current,
          vec2.div(mouseDiff, scaleRef.current)
        );
        write();
      } else {
        inDragRef.current = false;
        setCursor("auto");
      }

      //ドロー
      if(event.buttons&0b010){
        if(penToolRef.current.stroke(canvas2ImagePos(currentMousePos)))
          write();
      }
    },
    []
  );

  //クリック
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {

      event.preventDefault();
      screen2CanvasPos(event.pageX, event.pageY);
      const mousePos = canvas2ImagePos(
        screen2CanvasPos(event.clientX, event.clientY)
      );

      if (event.buttons & 0b101) {
        inDragRef.current = true;
        setCursor("move");
      }else if(event.buttons & 0b010){
        penToolRef.current.start()

        const data = {
          ops:"move",
          x:mousePos.x,
          y:mousePos.y,
        }
        Connection.send("move",data)
      }

      const isHit = MapInfo.regions[0].outlines.some((outline) =>
        outline.every((p0, i) => {
          const p1 = outline[(outline.length + i + 1) % outline.length];
          return 0 < vec2.cross3(p0, p1, mousePos);
        })
      );

      //httpTest()
    },
    []
  );
  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      inDragRef.current = false;
    
      setCursor("auto");
      event.preventDefault();
      
      //ペンを離す
      if(event.button==2){
        penToolRef.current.end()
      }
      
    },
    []
  );

  //マウスホイール
  const handleMouseWheel = useCallback((event: React.WheelEvent) => {
    if (event.deltaY) {
      const scaleDeff = event.deltaY * 0.001;
      scaleRef.current *= 1 - scaleDeff;
      offsetRef.current = vec2.add(
        offsetRef.current,
        vec2.mul(lastMousePosRef.current, scaleDeff / scaleRef.current)
      );
      write();
    }
  }, []);

  function handleMenu(event: React.MouseEvent<HTMLCanvasElement>) {
    event.preventDefault();
  }

  //表示関連
  const offsetRef = useRef<Point>(ORIGIN);
  const scaleRef = useRef<number>(1);

  //canvasに描画
  const write =()=>{
    const ctx: CanvasRenderingContext2D = getContext();
    
    if (ctx) {
      ctx.resetTransform();
      ctx.clearRect(0, 0, mainCanvasRef.current?.width!, mainCanvasRef.current?.height!);
      //ctx.globalAlpha = 0.3
      ctx.font = "20px serif";
      ctx.scale(scaleRef.current, scaleRef.current);
      ctx.translate(offsetRef.current.x, offsetRef.current.y);

      //setViewportTopLeft((prevVal) => diffPoints(prevVal, offsetDiff));
      //    isResetRef.current = false;

      const inversed = ctx.getTransform().inverse();

      const zeroPos = canvas2ImagePos(lastMousePosRef.current);

      //console.log(ctx.getTransform(), zeroPos, mainCanvasRef);

      ctx.drawImage(img, 0, 0, img.width, img.height);

      penToolRef.current.draw(ctx);

      for (let i = 0; i < 10; i++) {
        ctx.drawImage(
          ping,
          i * 100,
          0,
          ping.width / scaleRef.current,
          ping.height / scaleRef.current
        );
      }

      ctx.strokeRect(zeroPos.x, zeroPos.y, 10, 10);

      ctx.strokeStyle = "red";

      MapInfo.regions.forEach((region) => {
        region.outlines.forEach((outline) => {
          ctx.beginPath();
          ctx.moveTo(
            outline[outline.length - 1].x,
            outline[outline.length - 1].y
          );
          outline.forEach((e) => {
            ctx.lineTo(e.x, e.y);
          });
          ctx.stroke();
        });

        region.outlines.forEach((outline) => {
          ctx.beginPath();
          //const affine = region.difference.affine
          const affine = region.difference.matrix!;
          const last = affine.transformPoint(outline[outline.length - 1]);
          ctx.moveTo(last.x, last.y);
          outline.forEach((e) => {
            const pos = affine.transformPoint(e);
            ctx.lineTo(pos.x, pos.y);
          });
          ctx.stroke();
        });
      });

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
        onMouseUp={handleMouseUp}
        onWheel={handleMouseWheel}
        onContextMenu={handleMenu}
        style={{
          //border: "2px solid #000",
          width: `${size.width}px`,
          height: `${size.height}px`,
          boxSizing: `border-box`,
          cursor: `${cursor}`,
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
