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
import {DispatcherHolder,EventBase} from "../utils"

import URLBar from "./urlbar";
import BookMarkBar from "./bookmarkbar";
import DrawTools from "./drawTools";


const postRootData = (op:string,event:any={}) => {
    rootDispacher.dispatch({op:op,...event})
}

const rootDispacher = new DispatcherHolder()
const subDispacher = new DispatcherHolder()

rootDispacher.registerHolder(subDispacher)

export default postRootData

type EventSetUrl = {
    op:string
    url?:string
}

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
        rootDispacher.registerFunc((e:EventSetUrl)=>setUrl(e?.url!!),["url"])
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
        <MapCanvas url={url} control={rootDispacher}></MapCanvas>
        <DrawTools></DrawTools>
    </div>)
}