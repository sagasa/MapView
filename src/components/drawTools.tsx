import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useContext,
  useReducer,
  useMemo,
} from "react";
import postRootData from "./root"

type Props = {};

const test = (event: React.MouseEvent<HTMLDivElement>) => {
  const target: any = event.target;
  console.log(target);
};

type MenuElement = {
  image: string;
  name: string;
  func?:()=>void
};

const menu = [
  { name: "move", image: "./move.png" },
  { name: "pen", image: "./pen.png" },
  { name: "arrow", image: "./arrow.png" },
  { name: "erase", image: "./erase.png" },
];

const icons = [
    [
        { name: "allive0", image: "./allive0.png" },
        { name: "allive1", image: "./allive1.png" },
        { name: "allive2", image: "./allive2.png" },
        { name: "allive3", image: "./allive3.png" },
    ],
    [
        { name: "death0", image: "./death0.png" },
        { name: "death1", image: "./death1.png" },
        { name: "death2", image: "./death2.png" },
        { name: "death3", image: "./death3.png" },
    ],
    [
        { name: "grenade", image: "./grenade.png" },
        { name: "gun", image: "./gun.png" },
        { name: "unknown", image: "./unknown.png" },
        { name: "backpack", image: "./backpack.png" },
    ]
];

const colors = [
    "#FF4236",
    "#FFFF38",
    "#8BC34A",
    "#2196F4"
  ];

const drawName = ["pen","arrow"]

const DrawTools: React.FC<Props> = (props) => {

    const topMenu = useMemo(()=>[
        { name: "move", image: "./move.png" },
        { name: "pen", image: "./pen.png" },
        { name: "arrow", image: "./arrow.png" },
        { name: "erase", image: "./erase.png" },
      ],[])

  const [current, setCurrent] = useState("move");
  const [isDraw, setIsDraw] = useState(false);
  const [colorIndex,setColorIndex] = useState("#FF4236")

  const makeMenuItem = (element: MenuElement) => {
    return (
      <div
        key={element.name}
        className={"pallet"+(current==element.name?" select":"")}
        onClick={(e) => {
          setCurrent(element.name);
          element.func?.();
        }}
        style={{ backgroundImage: `url(${element.image})` }}
      ></div>
    );
  };

  const makeMenu = (list: MenuElement[][]) => {
    let count = 0
    return list.map(arr=>
        <div className="palletHolder" key={`raw ${count++}`}>
            {arr.map(e=>makeMenuItem(e))}
        </div>
    )
  };

  const makeColor = (list: string[]) => {
    return list.map(val=>
        <input
            key = {val}  
            className={"pallet"+(colorIndex==val?" selectColor":"")}
          
          type="color"
          defaultValue={val}
          onClick={(e) => {
            
            const target:any = e.target
            if(colorIndex!=val){
                e.preventDefault()
                setColorIndex(val)
                postRootData("color",{color:target.value})
            }
        }}
        ></input>
    )
  };

  useEffect(() => {
    console.log(current);
  }, [current]);

  useEffect(() => {
    console.log(colorIndex);
  }, [colorIndex]);

  return (
    <div
      style={{
        background: "#2A3132",
        width: "fit-content",
        position: "fixed",
      }}
    >
      <div className="palletHolder">{topMenu.map((e) => makeMenuItem(e))}</div>
      <div className={"palletHolder"+(drawName.includes(current)?"":" hide")}>
        <div className="pallet" style={{ color: "white" }}>
          Hi
        </div>
        <input
          className="pallet"
          type="range"
          min={1}
          max={10}
          style={{ width: "96px" }}
        ></input>
      </div>
      <div className={"palletHolder"+(drawName.includes(current)?"":" hide")}>
        {makeColor(colors)}        
      </div>

      {makeMenu(icons)}

      <div className="palletHolder">
        <div
          className="pallet"
          style={{ backgroundImage: `url(./plus.png)` }}
        ></div>
        <div
          className="pallet"
          style={{ backgroundImage: `url(./minus.png)` }}
        ></div>
        <input className="pallet" type="color"></input>
        <input className="pallet" type="range"></input>
      </div>
    </div>
  );
};

export default DrawTools;
