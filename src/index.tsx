import React from "react";
import { render } from "react-dom";
import { createRoot } from 'react-dom/client';

import Canvas from "./canvas";
import Info from "./info";

const canvasRoot = createRoot(document.getElementById("canvas")!);
const infoRoot = createRoot(document.getElementById("info")!);

const canvas2Root = createRoot(document.getElementById("canvas2")!);

canvasRoot.render(<Canvas isFullScreen={true}/>);
canvas2Root.render(<Canvas isFullScreen={false}/>);
infoRoot.render(<Info/>);
