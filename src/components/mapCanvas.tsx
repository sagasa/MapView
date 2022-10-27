import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useContext,
  useReducer,
} from "react";

import * as vec2 from "../vec2";
import { DispatcherHolder } from "../utils";
import { PenTool } from "../maps/pen";

//位置
const ORIGIN = Object.freeze({ x: 0, y: 0 });

//export type DispatcherHolder<T> = {
//  dispatcher?: React.Dispatch<T>;
//};

type Props = {
  url: string;
  control: DispatcherHolder;
};

//表示位置関連
type ViewInfo = {
  offset: vec2.Vec2;
  scale: number;
};

export type EventViewChange = {
  op: "move" | "scale" | "set" | "reset";
  vec?: vec2.Vec2;
  num?: number;
};

const MapCanvas: React.FC<Props> = (props) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef(new Image());
  const size: Size = useWindowSize();

  const drawRef = useRef(new PenTool());
  const [drawCount, updateDraw] = useReducer((prev: number) => prev + 1, 0);

  const [cursor, setCursor] = useState<string>("auto");

  //命令ディスパッチャーを登録
  useEffect(() => {
    props.control.registerFunc(applyViewChange, ["move", "scale", "set"]);
    props.control.registerFunc((e) => fitImg(), ["reset"]);

  }, [props.control]);

  //表示
  const lastViewState = useRef<ViewInfo>({ offset: { x: 0, y: 0 }, scale: 1 });
  const [viewState, applyViewChange] = useReducer(
    (prev: ViewInfo, e: EventViewChange) => {
      switch (e.op) {
        case "scale": {
          let nextScale = prev.scale * (1 - e.num!);
          let nextOffset = vec2.add(
            prev.offset,
            vec2.mul(e.vec!, e.num! / nextScale)
          );
          return { offset: nextOffset, scale: nextScale };
        }
        case "move": {
          let nextOffset = vec2.add(prev.offset, vec2.div(e.vec!, prev.scale));
          return { ...prev, offset: nextOffset };
        }
        case "set": {
          return { offset: e.vec!, scale: e.num! };
        }
      }

      return { ...prev };
    },
    { offset: { x: 0, y: 0 }, scale: 1 }
  );
  //現在有効な値を保存
  useEffect(() => {
    lastViewState.current = viewState;
  }, [viewState]);

  //マウス位置
  const lastMousePosRef = useRef<vec2.Vec2>(ORIGIN);
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
      if (inDragRef.current && event.buttons & 0b110) {
        applyViewChange({ op: "move", vec: mouseDiff });
      } else {
        inDragRef.current = false;
        setCursor("auto");
      }

      if (event.buttons & 0b001) {
        //ペンを動かす
        if (drawRef.current.stroke(canvas2ImagePos(currentMousePos))) {
          updateDraw();
        }
      }
    },
    []
  );

  //クリック
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      mainCanvasRef.current?.focus();
      event.preventDefault();
      if (event.buttons & 0b110) {
        inDragRef.current = true;
        setCursor("move");
      } else if (event.buttons & 0b001) {
        //ペンを下ろす
        drawRef.current.start(
          canvas2ImagePos(screen2CanvasPos(event.pageX, event.pageY))
        );
        updateDraw();
      }
    },
    []
  );
  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      inDragRef.current = false;
      setCursor("auto");
      event.preventDefault();
      //ペンを離す
      if (event.button == 0) {
        drawRef.current.end();
        updateDraw();
      }
    },
    []
  );

  //マウスホイール
  const handleMouseWheel = useCallback((event: React.WheelEvent) => {
    if (event.deltaY) {
      const scaleDeff = event.deltaY * 0.001;
      applyViewChange({
        op: "scale",
        num: scaleDeff,
        vec: lastMousePosRef.current,
      });
    }
  }, []);

  function handleMenu(event: React.MouseEvent<HTMLCanvasElement>) {
    event.preventDefault();
  }

  const fitImg = useCallback(() => {
    const img = imgRef.current;
    const scale = Math.min(
      mainCanvasRef.current?.width! / img.width,
      mainCanvasRef.current?.height! / img.height
    );
    const offset = { x: 0, y: 0 };
    offset.x = mainCanvasRef.current?.width! - img.width * scale;
    offset.x /= scale * 2;
    offset.y = mainCanvasRef.current?.height! - img.height * scale;
    offset.y /= scale * 2;
    applyViewChange({ op: "set", num: scale, vec: offset });
  }, []);

  //キーボード
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (event.key == "Shift") {
        drawRef.current.line = true;
        updateDraw();
      }
    },
    []
  );
  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (event.key == "Shift") {
        drawRef.current.line = false;
        updateDraw();
      }
    },
    []
  );

  //===== 描画系 =====
  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = mainCanvasRef.current;
    return canvas.getContext("2d");
  };

  //スクリーン座標からキャンバス座標に
  const screen2CanvasPos = useCallback((x: number, y: number) => {
    const canvas: any = mainCanvasRef.current;
    return {
      x: x - canvas.offsetLeft,
      y: y - canvas.offsetTop,
    };
  }, []);

  //キャンバス座標からイメージ座標へ
  const canvas2ImagePos = useCallback((pos: vec2.Vec2) => {
    return vec2.sub(
      vec2.div(pos, lastViewState.current.scale),
      lastViewState.current.offset
    );
  }, []);

  //canvas描画
  useLayoutEffect(() => {
    const ctx: CanvasRenderingContext2D = getContext();
    const img = imgRef.current;
    if (ctx) {
      ctx.resetTransform();
      ctx.fillRect(
        0,
        0,
        mainCanvasRef.current?.width!,
        mainCanvasRef.current?.height!
      );
      //ctx.globalAlpha = 0.3
      ctx.scale(viewState.scale, viewState.scale);
      ctx.translate(viewState.offset.x, viewState.offset.y);

      ctx.drawImage(img, 0, 0, img.width, img.height);

      drawRef.current.draw(ctx);

      ctx.save();
    }
  }, [viewState, size.width, size.height, drawCount]);

  //URL変更
  useLayoutEffect(() => {
    const next = new Image();
    next.referrerPolicy = "no-referrer";
    next.src = props.url;
    next.onload = () => {
      imgRef.current = next;
      fitImg();
    };
  }, [props.url]);

  const height = size.height!! - (mainCanvasRef.current?.offsetTop ?? 0);
  return (
    <canvas
      className="canvas"
      ref={mainCanvasRef}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleMouseWheel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={handleMenu}
      style={{
        display: "block",
        //border: "2px solid #000",
        position: "fixed",
        zIndex: -100,
        width: `${size.width}px`,
        height: `${height}px`,
        //boxSizing: `border-box`,
        cursor: `${cursor}`,
      }}
      width={size.width}
      height={height}
    />
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

export default MapCanvas;
