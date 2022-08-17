import React from "react";
import { render } from "react-dom";
import { createRoot } from 'react-dom/client';

import Canvas from "./canvas";
import Info from "./info";

const canvasRoot = createRoot(document.getElementById("canvas")!);
const infoRoot = createRoot(document.getElementById("info")!);
canvasRoot.render(<Canvas/>);
infoRoot.render(<Info/>);
