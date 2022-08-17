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
  return { x: p1.x / scale, y: p1.y / scale };
}

function Canvas() {
  const canvasRef = useRef(null);
  const size: Size = useWindowSize();
  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = canvasRef.current;
    return canvas.getContext("2d");
  };

  //マウス位置
  const [mousePos, setMousePos] = useState<Point>(ORIGIN);
  const lastMousePosRef = useRef<Point>(ORIGIN);

  //初期化
  useEffect(() => {
    const ctx: CanvasRenderingContext2D = getContext();
    const canvas: any = canvasRef.current;

    //マウス移動関連
    function handleUpdateMouse(event: MouseEvent) {
      event.preventDefault();
      //マウスの位置処理
      const lastMousePos = lastMousePosRef.current;
      const currentMousePos = { x: event.pageX, y: event.pageY }; // use document so can pan off element
      lastMousePosRef.current = currentMousePos;
      //差分化
      const mouseDiff = diffPoints(currentMousePos,lastMousePos);
      if (event.buttons & 1){
        console.log(mouseDiff)
        setOffset(addPoints(offset,mouseDiff));
      }

      const viewportMousePos = { x: event.clientX, y: event.clientY };
      
    }
    console.log("初期化")
    canvas.addEventListener("mousemove", handleUpdateMouse);
    //canvas.addEventListener("wheel", handleUpdateMouse);
    return () => {
      canvas.removeEventListener("mousemove", handleUpdateMouse);
      //canvas.removeEventListener("wheel", handleUpdateMouse);
    };
  }, [canvasRef]);

  //表示関連
  const [offset, setOffset] = useState<Point>(ORIGIN);
  const lastOffsetRef = useRef<Point>(ORIGIN);
  //参照の更新
  useEffect(() => {
    lastOffsetRef.current = offset;
  }, [offset]);

  useLayoutEffect(() => {
    const ctx: CanvasRenderingContext2D = getContext();
    if (ctx && lastOffsetRef.current) {
      const offsetDiff: Point = {
        x: offset.x - lastOffsetRef.current.x,
        y: offset.y - lastOffsetRef.current.y,
      };
      ctx.translate(offset.x, offset.y);
      //setViewportTopLeft((prevVal) => diffPoints(prevVal, offsetDiff));
      //    isResetRef.current = false;

      ctx.strokeRect(0, 0, 100, 100);
      const img = new Image();
      img.src =
        "https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/5/55/CustomsLargeExpansionGloryMonki.png";
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, img.width, img.height);
      };
      ctx.save();
    }
  }, [offset]);

  return (
    <canvas
      className="canvas"
      ref={canvasRef}
      style={{
        border: "2px solid #000",
        width: `${size.width}px`,
        height: `${size.height}px`,
        boxSizing: `border-box`,
      }}
      width={size.width}
      height={size.height}
    />
  );
}

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

export default Canvas;
