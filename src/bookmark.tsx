type Bookmark = {
  entryMap: Map<string, string>;
};

//Map対応Json
const stringifyFunc = (k: any, v: any) => {
  if (v instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(v),
    };
  }
  return v;
};
const parseFunc = (k: string, v: any) => {
  if (typeof v === "object" && v !== null) {
    if (v.dataType === "Map") {
      return new Map(v.value);
    }
  }
  return v;
};

const ENTRY_NAME = "bookmark"

//keyにJsonで許可できない文字が入ると壊れる
const saveData = (data:Bookmark)=>{
    document.cookie = `${ENTRY_NAME}=${encodeURI(JSON.stringify(data, stringifyFunc))};max-age=157788000`
}

const loadData = ()=>{
    const cookies = document.cookie;
    const cookiesArray = cookies.split(';');

    for(const c of cookiesArray){
        const split = c.indexOf('=')
        const key = c.substring(0,split)
        const value = c.substring(split+1)
        if(key == ENTRY_NAME){
            return JSON.parse(decodeURI(value), parseFunc) 
        }
    }
    return { entryMap: new Map<string, string>() }
}


export default function bookmark(){
  let save: Bookmark = { entryMap: new Map<string, string>() }

  try {
    save = loadData()
  } catch (error) {
    console.log("invalid cookie",error);
    save = { entryMap: new Map<string, string>() }
    saveData(save)
  }

  const getEntris = ()=>{
    return save.entryMap.entries()
  }

  const set = (key:string,value:string)=>{
    save.entryMap.set(key,value)
    saveData(save)
    console.log(save,key,value)
  }

  const remove = (key:string)=>{
    save.entryMap.delete(key)
    saveData(save)
  }

  const toJson = ()=>{
    return JSON.stringify(save, stringifyFunc)
  }
  const fromJson = (json:string)=>{
    try {
      save = JSON.parse(json,parseFunc)
      saveData(save)
    } catch (error) {
      console.log("err in toJson",error)
    }
  }

  return {getEntris:getEntris,set:set,remove:remove,toJson:toJson,fromJson:fromJson}
}