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
import "../bookmark";
import bookmark from "../bookmark";
import MapCanvas, {EventViewChange} from "./mapCanvas";
import {DispatcherHolder} from "../utils"

import URLBar from "./urlbar";
import BookMarkBar from "./bookmarkbar";
import DrawTools from "./drawTools";



const eventMap = new Map<string, (val: string) => void>()

const postRootData = (op: 'url'|'reset', data: string) => {
    eventMap.get(op)?.(data)
}


export default postRootData

export const AppRoot: React.FC = () => {

    const mapControllerRef = useRef<DispatcherHolder>(new DispatcherHolder())
    const [url, setUrl] = useState("")

    //初期化
    useEffect(() => {
        //URLに指定があるなら画像のソースを設定
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.has("url")) {
            setUrl(searchParams.get("url") ?? "");
        }
        eventMap.set("url", setUrl)
        eventMap.set("reset",()=>mapControllerRef.current.dispatch({op:"reset"}))
    }, [])

    useEffect(()=>{
        const next = new URL(window.location.toString());
        next.searchParams.set("url", url);
        history.pushState("test", "", next.href);
    },[url])

    const ref = useRef()

    return (<div
        style={{
            overflow: "hidden",
        }}
    >
        <URLBar url={url}></URLBar>
        <BookMarkBar url={url}></BookMarkBar>
        <MapCanvas url={url} control={mapControllerRef.current}></MapCanvas>
        <DrawTools></DrawTools>
    </div>)
}