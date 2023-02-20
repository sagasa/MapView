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
import bookmark from "../bookmark";
import MapCanvas, { EventViewChange } from "./mapCanvas";
import { DispatcherHolder, EventBase } from "../utils";

import { Connection } from "../connections/connecton";

import URLBar from "./urlbar";
import BookMarkBar from "./bookmarkbar";
import DrawTools from "./drawTools";
import MenuTest from "./menu";
import ConnInfo from "./connInfo";

function Test (){
    return(
        <div></div>
    )
}

//モバイル判別
export const isMobile = navigator.userAgent.match(/iPhone|Android.+Mobile/)!==null

//イベントディスパッチャーのルート
const rootDispacher = new DispatcherHolder("root");

const postRootData = (op: string, event: any = {}) => {
    if (event === undefined) {
        rootDispacher.dispatch({ op: op });
    } else {
        rootDispacher.dispatch({ op: op, ...event });
    }
};

//サーバーとのWS通信系
Connection.connect();
Connection.onchange = (s) => {
    if (s == "Connected") {
        Connection.send("joinRoom", "GGWP");
        Connection.send("test", isMobile);
    }
};

export default postRootData;

//スマホ関連
const touchHandler = (event: any) => {
    if (event.touches.length > 1) {
        
    }
};
document.addEventListener("touchstart", touchHandler, {
    passive: false,
});


//==


type EventSetUrl = {
    op: string;
    url?: string;
};

export const AppRoot: React.FC = () => {
    const [url, setUrl] = useState("");

    const [count,setCount] = useState<number[]>([]);

    //初期化
    useEffect(() => {
        //URLに指定があるなら画像のソースを設定
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.has("url")) {
            setUrl(searchParams.get("url") ?? "");
        }
        if (searchParams.has("room")) {
            searchParams.get("room");
        }
        //UIイベント
        rootDispacher.registerFunc(
            (e: EventSetUrl) => {
                setUrl(e?.url!);
                Connection.send("urlSet", e?.url!);
            },
            ["url"]
        );
        //ネットワーク系
        Connection.register("acceptJoin", (data) => {
            postRootData("clear");
        });
        Connection.register("urlSet", (data) => {
            setUrl(data);
        });
    }, []);

    useEffect(() => {
        const next = new URL(window.location.toString());
        next.searchParams.set("url", url);
        history.pushState("test", "", next.href);
    }, [url]);

    const ref = useRef();

    return (
        <div
            style={{
                overflow: "hidden",
            }}
        >
            <URLBar url={url}></URLBar>
            <BookMarkBar url={url}></BookMarkBar>
            <MapCanvas url={url} control={rootDispacher}></MapCanvas>
            <DrawTools></DrawTools>
            <ConnInfo></ConnInfo>
            
        </div>
    );//<MenuTest></MenuTest>
};
