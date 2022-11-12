import React, {
    useEffect,
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useContext,
    useMemo,
    useReducer,
} from "react";

import * as vec2 from "../vec2";
import { DispatcherHolder } from "../utils";
import DrawPen from "../maps/draw";
import PinTool from "../maps/pin";

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

type CursorEntry = {
    cursor: string;
    priority: number;
};


type EventCursor = {
    op: "cursorAdd" | "cursorRemove";
    cursor?: string;
    priority?: number;
};

export type EventViewChange = {
    op: "move" | "scale" | "set" | "reset";
    vec?: vec2.Vec2;
    num?: number;
};

const CURSOR_MOVE = {cursor:"move",priority:5}

const MapCanvas: React.FC<Props> = (props) => {
    const dispatcherHolder = useRef(new DispatcherHolder("canvas"))

    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef(new Image());
    const size: Size = useWindowSize();

    const pinRef = useRef(new PinTool());
    const drawRef = useRef(new DrawPen());
    const [drawCount, updateDraw] = useReducer((prev: number) => prev + 1, 0);

    //const [cursor, setCursor] = useState<string>("auto");

    //命令ディスパッチャーを登録
    useEffect(() => {
        dispatcherHolder.current.registerFunc(applyViewChange, ["move", "scale", "set"]);
        dispatcherHolder.current.registerFunc((e) => fitImg(), ["reset"]);
        dispatcherHolder.current.registerFunc((e) => updateDraw(), ["redraw"]);
        dispatcherHolder.current.registerFunc(applyCursor, ["cursorAdd","cursorRemove"]);
        dispatcherHolder.current.registerHolder(drawRef.current.holder);
        dispatcherHolder.current.registerHolder(pinRef.current.holder);

        props.control.registerHolder(dispatcherHolder.current)
        
        return ()=>{
            props.control.unregisterHolder(dispatcherHolder.current)
        }
    }, [props.control]);

    //カーソルの状態管理
    const [cursorStack, applyCursor] = useReducer(
        (prev: CursorEntry[], event: EventCursor) => {
            if (
                prev.some(
                    (e) =>
                        e.cursor === event.cursor &&
                        e.priority === event.priority
                )
            ) {
                //エントリが存在するなら
                if (event.op == "cursorRemove") {
                    return prev.filter(
                        (e) =>
                            e.cursor !== event.cursor ||
                            e.priority !== event.priority
                    );
                }
            } else {
                //エントリがないなら
                if (event.op == "cursorAdd") {
                    const entry = {
                        cursor: event.cursor!,
                        priority: event.priority!,
                    };
                    prev.push(entry);
                    prev.sort((a, b) => a.priority - b.priority);
                    return [...prev]
                }
            }
            return prev;
        },
        []
    );

    //カーソルを決定
    const cursor = useMemo(() => {
        if (cursorStack.length == 0){
            return "auto"
        }
        return cursorStack[cursorStack.length - 1].cursor;
    }, [cursorStack]);

    //表示
    const lastViewState = useRef<ViewInfo>({
        offset: { x: 0, y: 0 },
        scale: 1,
    });
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
                    let nextOffset = vec2.add(
                        prev.offset,
                        vec2.div(e.vec!, prev.scale)
                    );
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
                applyCursor({op:"cursorRemove",...CURSOR_MOVE});

                //ペンを動かす
                const imgPos = canvas2ImagePos(currentMousePos);
                if (drawRef.current.stroke(event.buttons, imgPos)) {
                    updateDraw();
                }
                //ピン関連
                if(pinRef.current.move(
                    imgPos,
                    vec2.div(mouseDiff,lastViewState.current.scale),
                    lastViewState.current.scale
                )){
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
            const imagePos = canvas2ImagePos(
                                screen2CanvasPos(event.pageX, event.pageY)
                            );
            if (event.buttons & 0b110) {
                inDragRef.current = true;
                applyCursor({op:"cursorAdd",...CURSOR_MOVE});
            } else if (event.buttons & 0b001) {
                
                //ペンを下ろす
                drawRef.current.start(imagePos);
                updateDraw();
            }
            pinRef.current.down(imagePos, lastViewState.current.scale,event.buttons);
        },
        []
    );
    const handleMouseUp = useCallback(
        (event: React.MouseEvent<HTMLCanvasElement>) => {
            if (event.button == 2 || event.button == 1) {
                inDragRef.current = false;
                applyCursor({op:"cursorRemove",...CURSOR_MOVE});
                event.preventDefault();
            }
            pinRef.current.up(event.button)
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
                drawRef.current.setShift(true);
                updateDraw();
            }
        },
        []
    );
    const handleKeyUp = useCallback(
        (event: React.KeyboardEvent<HTMLCanvasElement>) => {
            if (event.key == "Shift") {
                drawRef.current.setShift(false);
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
            ctx.fillStyle = "#000";
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

            const mousePos = canvas2ImagePos(lastMousePosRef.current);
            drawRef.current.draw(ctx, viewState.scale,mousePos);
            pinRef.current.draw(ctx, viewState.scale, mousePos);

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
