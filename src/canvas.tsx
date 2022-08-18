import ReactDOM from "react-dom";

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";

//位置
type Point = {
  x: number;
  y: number;
};
const ORIGIN = Object.freeze({ x: 0, y: 0 });

function diffPoints(p1: Point, p2: Point) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function addPoints(p1: Point, p2: Point) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

function scalePoint(p1: Point, scale: number) {
  return { x: p1.x * scale, y: p1.y * scale };
}

const img = new Image();
img.src =
  "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/5/55/CustomsLargeExpansionGloryMonki.png";
img.referrerPolicy = "no-referrer";

type Props = {
  isFullScreen: boolean;
};

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
    const mouseDiff = diffPoints(currentMousePos, lastMousePos);
    if (event.buttons & 1) {
      lastRefTest = currentMousePos;
      setOffset((prevOffset) => {
        //console.log(scalePoint(mouseDiff,scale),scale)
        return scalePoint(mouseDiff, scale);
      });

      const ctx: CanvasRenderingContext2D = getContext();

      ctx.translate(
        mouseDiff.x / ctx.getTransform().a,
        mouseDiff.y / ctx.getTransform().d
      );
    }
    const viewportMousePos = { x: event.clientX, y: event.clientY };
  }

  //マウスホイール
  function handleUpdateWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY) {
      const scaleDeff = 1 - event.deltaY * 0.001;
      console.log(lastRefTest);
      setScale((prev) => prev * scaleDeff);
      const ctx: CanvasRenderingContext2D = getContext();
      const zeroPos = ctx
        .getTransform()
        .transformPoint({ x: event.clientX, y: event.clientY });
      ctx.translate(-zeroPos.x, -zeroPos.y);
      ctx.scale(scaleDeff, scaleDeff);
      ctx.translate(zeroPos.x, zeroPos.y);
    }
  }

  //初期化
  useEffect(() => {
    const ctx: CanvasRenderingContext2D = getContext();
    const canvas: any = mainCanvasRef.current;

    console.log("初期化");
    canvas.addEventListener("mousemove", handleUpdateMove);
    canvas.addEventListener("wheel", handleUpdateWheel);
    return () => {
      canvas.removeEventListener("mousemove", handleUpdateMove);
      canvas.removeEventListener("wheel", handleUpdateWheel);
    };
  }, [mainCanvasRef]);

  //表示関連
  const [offset, setOffset] = useState<Point>(ORIGIN);
  const [scale, setScale] = useState<number>(1);

  useLayoutEffect(() => {
    const ctx: CanvasRenderingContext2D = getContext();
    if (ctx) {
      //ctx.resetTransform()
      ctx.clearRect(0, 0, size.width!, size.height!);

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
      console.log(ctx.getTransform(), zeroPos, mainCanvasRef);

      ctx.drawImage(img, 0, 0, img.width, img.height);
      ctx.strokeRect(-zeroPos.x, -zeroPos.y, 10, 10);
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
