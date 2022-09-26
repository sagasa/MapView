import { createContext } from "react";

type WSState = `Disconnected` | `Connecting` | `Connected`;

//接続ホルダー
type Connection = {
  send: (name: string, data: any) => boolean;
  onmessage: ((e: MessageEvent<any>) => void) | undefined;
  register:(ops:string,func:(data:string)=>void)=>boolean;
  onchange: ((state: WSState) => void) | undefined;
  connect: () => void;
};

const createWS = () => {
  let ws: WebSocket;
  let retryCount = 3;
  let handler = new Map<string,(data:string)=>void>

  const register = (ops:string,func:(data:string)=>void)=>{
    if(handler.has(ops))return false
    handler.set(ops,func)
    return true
  }

  const connection: Connection = {
    connect: () => {},
    send: () => false,
    register:register,
    onchange: undefined,
    onmessage: undefined,
  };

  const connect = () => {
    connection.onchange?.("Connecting");
    const url = `ws://${window.location.hostname}:3001/ws`;
    ws = new WebSocket(url);
    ws.onmessage = (e) => {
      const split = e.data.indexOf(":")
      const ops = e.data.slice(0,split)
      const data = e.data.slice(split+1)
      handler.get(ops)?.(data)
    };

    ws.onopen = (e) => {
      retryCount = 3;
      connection.onchange?.("Connected");
    };

    ws.onclose = (e) => {
      if (0 < retryCount) {
        connect();
        retryCount--;
      } else {
        connection.onchange?.("Disconnected");
      }
    };
  };
  connection.connect = connect;
  connection.send = (name, data) => {
    if (ws.readyState == ws.OPEN) {
      console.log(`${name}:${data}`, JSON.stringify(data));
      ws.send(`${name}:${JSON.stringify(data)}`);
      return true;
    }
    console.log("send err");
    return false;
  };

  connect();
  return connection;
};

export const Connection = createWS();


