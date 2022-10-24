import React from "react";
import { createRoot } from "react-dom/client";
import {AppRoot} from "./components/root";

import MapCanvas from "./maps/mapCanvas";

const canvasRoot = createRoot(document.getElementById("canvas")!);
canvasRoot.render(<AppRoot/>);