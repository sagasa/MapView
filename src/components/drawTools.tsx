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

import InputColor from "./inputColor"

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

  const [colorIndex,setColorIndex] = useState("#FF4236")
  const [color,setColor] = useState("#FF4236")
  const [width,setWidth] = useState(5)

  //選択状態を反映したメニューアイテムを作成
  const makeMenuItem = (element: MenuElement) => {
    return (
      <div
        key={element.name}
        className={"pallet"+(current==element.name?" select":"")}
        onClick={(e) => {
          setCurrent(element.name);
          postRootData("tool",{tool:element.name})
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
        <InputColor
          key = {val}
          defaultValue={val}
          select={colorIndex==val}
          onChange={(color,index)=>{
            setColorIndex(index)
            setColor(color)
            postRootData("color",{color:color})
          }}
        ></InputColor>
    )
  };

  useEffect(() => {
    console.log(current);
  }, [current]);

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
          <div style={{position:"relative",height:width,width:width,top:16-width/2,left:16-width/2,background:color}}></div>
        </div>
        <input
          className="pallet"
          type="range"
          min={1}
          max={20}
          value={width}
          onChange={e=>{
            postRootData("lineWidth",{width:parseInt(e.target.value)})
            setWidth(parseInt(e.target.value))
          }}
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
