import React, {
    useEffect,
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useContext,
    useReducer,
} from "react";

import postRootData from "./root";

type Props = {};

const ConnInfo: React.FC<Props> = (props) => {

    useEffect(()=>{
        
    },[])
    
    return (
        <div
            style={{
                background: "#2A3132",
                width: "100",
                position: "fixed",
                right: "0px",
            }}
        >
            <div
                style={{
                    background: "#2A3132",
                }}
            >
                <input type="text" maxLength={6} placeholder="room name" style={{width:"80px"}}/>
                <button className="">Connect</button>
            </div>
            <div
                style={{
                    background: "#2A3132",
                }}
            >
                <button className="">URL</button>
            </div>
        </div>
    );
};

export default ConnInfo;
