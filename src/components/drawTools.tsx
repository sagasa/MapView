import React, {
    useEffect,
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useContext,
    useReducer,
} from "react";


type Props = {
    
}

const DrawTools: React.FC<Props> = (props) => {
  
    return (
        <div
            style={{
                background: "#2A3132",
                width:"fit-content",
                position:"fixed"
            }}
        >
            <div>
                <div className="pallet" style={{backgroundImage:`url(./move.png)`}}></div>
                <div className="pallet" style={{backgroundImage:`url(./pen.png)`}}></div>
                <div className="pallet" style={{backgroundImage:`url(./arrow.png)`}}></div>
                <div className="pallet" style={{backgroundImage:`url(./erase.png)`}}></div>
            </div>
            <div>
                <div className="pallet" style={{backgroundImage:`url(./plus.png)`}}></div>
                <div className="pallet" style={{backgroundImage:`url(./minus.png)`}}></div>
            </div>
        </div>
    );
};

export default DrawTools;
