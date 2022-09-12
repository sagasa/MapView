import ReactDOM from "react-dom";
import React, { useEffect, useState, useRef } from "react";

function Info() {


  return (
    <div>
      <table>
        <tbody>
          <tr>
            <td>自分の位置</td>
            <td>目的地</td>
            <td>パス描画</td>
          </tr>
          <tr>
            <td>PMC</td>
            <td>疑い(PMC)</td>
            <td>死体(PMC)</td>
          </tr>
          <tr>
            <td>SCAV</td>
            <td>疑い(SCAV)</td>
            <td>死体(SCAV)</td>
          </tr>
          <tr>
            <td>BOSS</td>
            <td>疑い(BOSS)</td>
            <td>死体(BOSS)</td>
          </tr>
          <tr>
            <td>クエスト</td>
            <td>ペン描画</td>
            <td>矢印描画</td>
          </tr>
        </tbody>
      </table>
      <input type="color" id="body" name="body" defaultValue="#f6b73c"></input>
      <input type="text" id="body" name="body" defaultValue="Name"></input>
    </div>
  );
}

export default Info;
