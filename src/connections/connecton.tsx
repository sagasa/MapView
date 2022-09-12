
import { createContext } from "react";

type WSState = `Disconnected`|`Connecting`|`Connected`;

//接続ホルダー
type Connection = {
    send:(name:string,data: any)=>boolean;
    onmessage: ((e:MessageEvent<any>)=>void)|undefined;
    onchange:((state:WSState)=>void)|undefined;
    connect:()=>void;
}

const createWS = ()=>{
    let ws: WebSocket;
    let retryCount = 3;

    
    const connection : Connection= {connect:()=>{},send:()=>false,onchange:undefined,onmessage:undefined}

    const connect = ()=>{
        connection.onchange?.("Connecting")
        const url = `ws://${window.location.hostname}:3001/ws`;
        ws = new WebSocket(url);
        ws.onmessage = (e) => {
          connection.onmessage?.(e);
        };
      
        ws.onopen = (e) => {
          retryCount = 3;
          connection.onchange?.("Connected");
        };
      
        ws.onclose = (e) => {
          if (0 < retryCount) {
            connect();
            retryCount--;
          }else{
            connection.onchange?.("Disconnected")
          }
        };
    }
    connection.connect = connect;
    connection.send = (name,data)=>{
        if(ws.readyState==ws.OPEN){
            console.log(`${name}:${data}`,JSON.stringify(data))
            ws.send(`${name}:${data}`)
            return true
        }
        console.log("send err")
        return false
    }

    connect();
    return connection;
}



export const Connection = createWS();

Connection.onmessage = (e)=>{
    console.log(e.data)
  }