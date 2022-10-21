import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useContext,
} from "react";

import * as vec2 from "../vec2";
import "../bookmark";
import bookmark from "../bookmark";

//位置
const ORIGIN = Object.freeze({ x: 0, y: 0 });

console.log(location.search);
const img = new Image();

img.referrerPolicy = "no-referrer";

//URLに指定があるなら画像のソースを設定
const searchParams = new URLSearchParams(location.search);
if (searchParams.has("url")) {
  img.src = searchParams.get("url") ?? "";
}

//セーブマネージャー
const save = bookmark();

type Props = {
  isFullScreen: boolean;
  control?:()=>{}
};

const MapCanvas: React.FC<Props> = (props) => {
  const resizeOps = props.isFullScreen ? "none" : "both";
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string>("NameTest");
  const [bookmarkList, setBookmarkList] = useState<JSX.Element[]>([]);
  const [inBookmark, setInBookmark] = useState<boolean>(false);
  const size: Size = props.isFullScreen
    ? useWindowSize()
    : useParentSize(divRef);

  const [cursor, setCursor] = useState<string>("auto");

  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = mainCanvasRef.current;
    return canvas.getContext("2d");
  };

  //スクリーン座標からキャンバス座標に
  function screen2CanvasPos(x: number, y: number) {
    const canvas: any = mainCanvasRef.current;
    return {
      x: x - canvas.offsetLeft,
      y: y - canvas.offsetTop,
    };
  }

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
    },
    []
  );

  //クリック
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      if (event.buttons & 0b101) {
        inDragRef.current = true;
        setCursor("move");
      }
    },
    []
  );
  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      inDragRef.current = false;
      setCursor("auto");
      event.preventDefault();
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

  //初期化
  useEffect(() => {
    //読み込み完了時処理
    img.onload = () => {
      scaleRef.current = Math.min(
        mainCanvasRef.current?.width! / img.width,
        mainCanvasRef.current?.height! / img.height
      );
      offsetRef.current.x =
        mainCanvasRef.current?.width! - img.width * scaleRef.current;
      offsetRef.current.x /= scaleRef.current * 2;
      offsetRef.current.y =
        mainCanvasRef.current?.height! - img.height * scaleRef.current;
      offsetRef.current.y /= scaleRef.current * 2;
      write();
    };
    updateBookmark();
    if (urlInputRef.current) urlInputRef.current.value = img.src;
  }, []);

  //表示関連
  const offsetRef = useRef<vec2.Vec2>({ x: 0, y: 0 });
  const scaleRef = useRef<number>(1);

  //canvasに描画
  const write = () => {
    const ctx: CanvasRenderingContext2D = getContext();

    if (ctx) {
      ctx.resetTransform();
      ctx.fillRect(
        0,
        0,
        mainCanvasRef.current?.width!,
        mainCanvasRef.current?.height!
      );
      //ctx.globalAlpha = 0.3
      ctx.scale(scaleRef.current, scaleRef.current);
      ctx.translate(offsetRef.current.x, offsetRef.current.y);

      ctx.drawImage(img, 0, 0, img.width, img.height);

      ctx.save();
    }
  };

  //URL変更
  const setUrl = useCallback((nextUrl: string, nextName: string) => {
    if (urlInputRef.current) urlInputRef.current.value = nextUrl;
    setName(nextName);
    img.src = nextUrl;
    const url = new URL(window.location.toString());
    url.searchParams.set("url", nextUrl);
    //console.log(url)
    history.pushState("test", "", url.href);
  }, []);

  //ブックマークに追加
  const addBookmark = useCallback(() => {
    save.set(
      nameInputRef.current?.value ?? "",
      urlInputRef.current?.value ?? ""
    );
    updateBookmark();
  }, []);
  //ブックマークから削除
  const removeBookmark = useCallback(() => {
    save.remove(nameInputRef.current?.value ?? "");
    updateBookmark();
  }, []);

  //左のブックマークを描画
  const updateBookmark = useCallback(() => {
    let arr: JSX.Element[] = [];
    let flag = false;
    for (const [key, value] of save.getEntris()) {
      let className = "listElement";
      if (nameInputRef.current?.value == key) {
        className += " select";
        flag = true;
      }
      arr.push(
        <div
          className={className}
          key={key}
          onClick={(e) => {
            setUrl(value, key);
          }}
        >
          <p>{key}</p>
        </div>
      );
    }
    setBookmarkList(arr);
    setInBookmark(flag);
  }, []);

  useEffect(() => {
    updateBookmark();
  }, [name]);

  useLayoutEffect(() => {
    write();
  }, [size.width, size.height]);

  //入力制限
  const handleNameInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setName(event.target.value.replace(/[^A-Za-z0-9]/g, ""));
    },
    []
  );
  const toClipboard = useCallback(() => {
    navigator.clipboard.writeText(save.toJson());
  }, []);
  const fromClipboard = useCallback(async (e:React.ChangeEvent<HTMLInputElement>) => {
    const event:any = e.nativeEvent
    if(event.inputType==="insertFromPaste"){
      
      save.fromJson(event.data)
      updateBookmark()
    }
    
  }, []);

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
          position: "fixed",
          zIndex: -100,
          width: `${size.width}px`,
          height: `${size.height}px`,
          boxSizing: `border-box`,
          cursor: `${cursor}`,
        }}
        width={size.width}
        height={size.height}
      />

      <div
        style={{
          display: "flex",
          width: `fit-content`,
        }}
      >
        <input
          type="text"
          ref={urlInputRef}
          style={{
            width: `${(size.width ?? 1) * 0.7}px`,
          }}
        />
        <button onClick={() => setUrl(urlInputRef.current?.value ?? "", "")}>
          Apply
        </button>
        <input
          type="text"
          ref={nameInputRef}
          style={{
            width: "10%",
          }}
          value={name}
          onChange={handleNameInput}
        />
        <button onClick={addBookmark}>Save</button>
        <button
          onClick={removeBookmark}
          style={{ visibility: inBookmark ? "visible" : "hidden" }}
        >
          Delete
        </button>
      </div>

      <div
        style={{
          position: "fixed",
          width: `fit-content`,
        }}
      >
        {bookmarkList}
        <input
          type="text"
          style={{
            width:40
          }}
          value="Import"
          onChange={fromClipboard}
        />
        <button onClick={toClipboard}>Export</button>
      </div>
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
