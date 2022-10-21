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
import MapCanvas from "../maps/mapCanvas";

let Mary: 'Cat' | 'Dog' | 'Rabbit' = 'Cat';

const test = (fun:(op:'A'|'B')=>{})=>{
  fun("A");
}

type EventTest = {
  op:string
}

type StateTest = {
  a:number
  b:number
}

type EventProvider<T> = {
  dispatch?:React.Dispatch<T>
}

const AppRoot: React.FC = () => {

  const [state,dispatch] = useReducer((state:StateTest,action:EventTest)=>{return {a:2,b:3}} ,{a:1,b:2})

  const provider : EventProvider<EventTest> = {}
  provider.dispatch = dispatch

  const mapRef = useRef(null)

  return (<div 
    style={{
      overflow: "hidden",
    }}
  >
    
    <MapCanvas isFullScreen={true}></MapCanvas>
    <p style={{
      position:"absolute",
      background:"red"}}>{state.a}</p>
  </div>)
}

export default AppRoot