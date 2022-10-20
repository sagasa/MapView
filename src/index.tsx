import React from "react";
import { createRoot } from "react-dom/client";

import Canvas from "./maps/canvas";
const canvasRoot = createRoot(document.getElementById("canvas")!);
canvasRoot.render(<Canvas isFullScreen={true} />);