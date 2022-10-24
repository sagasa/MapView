import React from "react";
import { createRoot } from "react-dom/client";
import {AppRoot} from "./components/root";

const canvasRoot = createRoot(document.getElementById("canvas")!);
canvasRoot.render(<AppRoot/>);