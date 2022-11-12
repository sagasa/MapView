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

import {Connection} from "../connections/connecton"

import URLBar from "./urlbar";
import BookMarkBar from "./bookmarkbar";
import DrawTools from "./drawTools";
import MenuTest from "./menu";
import ConnInfo from "./connInfo"

const rootDispacher = new DispatcherHolder("root");

const postRootData = (op: string, event: any = {}) => {
    if(event===undefined){
        rootDispacher.dispatch({ op: op});
    }else{
        rootDispacher.dispatch({ op: op, ...event });
    }
    
};

//サーバーとのWS通信系
Connection.connect()

export default postRootData;

type EventSetUrl = {
    op: string;
    url?: string;
};

export const AppRoot: React.FC = () => {
    const [url, setUrl] = useState("");

    //初期化
    useEffect(() => {
        //URLに指定があるなら画像のソースを設定
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.has("url")) {
            setUrl(searchParams.get("url") ?? "");
        }
        rootDispacher.registerFunc(
            (e: EventSetUrl) => setUrl(e?.url!!),
            ["url"]
        );
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
            <MenuTest></MenuTest>
        </div>
    );
};
