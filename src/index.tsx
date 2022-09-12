import React from "react";
import { render } from "react-dom";
import { createRoot } from "react-dom/client";

import Canvas from "./maps/canvas";
import WSConnection from "./connectionState";
import Info from "./info";

import { createContext } from "react";



type NetProp = {
  ws: WebSocket;
  connect: () => void;
};

const canvasRoot = createRoot(document.getElementById("canvas")!);
const infoRoot = createRoot(document.getElementById("info")!);

const stateRoot = createRoot(document.getElementById("state")!);

//const canvas2Root = createRoot(document.getElementById("canvas2")!);
//canvas2Root.render(<Canvas isFullScreen={false}/>);

canvasRoot.render(<Canvas isFullScreen={true} />);
infoRoot.render(<Info />);
stateRoot.render(<WSConnection></WSConnection>);
