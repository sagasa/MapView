import React, {
    useEffect,
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useContext,
    useReducer,
} from "react";

import "../bookmark";
import bookmark from "../bookmark";
import postRootData from "./root";

type Props = {

};

const Menu: React.FC<Props> = (props) => {

    return (
        <div
            className="menuItem"
            style={{
                background: "#FFF",
                position:"absolute",
                left:"500px",
                top:"500px",
                width:"32px",
                height:"32px",
                //pointerEvents:"none"
            }}
        >
            <div className="menuItem" style={{top:"32px",backgroundImage: `url(./erase.png)`}}  onMouseOverCapture={e=>console.log(e)}>
                <div className="menuItem" style={{top:"32px",background:"#F00"}}></div>
                <div className="menuItem" style={{left:"32px",background:"#F00"}}></div>
                <div className="menuItem" style={{left:"-32px",background:"#F00"}}></div>
            </div>
            <div className="menuItem" style={{top:"-32px"}}>
                <div className="menuItem" style={{top:"-32px",background:"#F00"}}></div>
                <div className="menuItem" style={{left:"32px",background:"#F00"}}></div>
                <div className="menuItem" style={{left:"-32px",background:"#F00"}}></div>
            </div>
            <div className="menuItem" style={{left:"32px"}}>
                <div className="menuItem" style={{top:"32px",background:"#F00"}}></div>
                <div className="menuItem" style={{left:"32px",background:"#F00"}}></div>
                <div className="menuItem" style={{top:"-32px",background:"#F00"}}></div>
            </div>
            <div className="menuItem" style={{left:"-32px"}}>
                <div className="menuItem" style={{top:"32px",background:"#F00"}}></div>
                <div className="menuItem" style={{top:"-32px",background:"#F00"}}></div>
                <div className="menuItem" style={{left:"-32px",background:"#F00"}}></div>
            </div>
        </div>
    );
};

export default Menu;