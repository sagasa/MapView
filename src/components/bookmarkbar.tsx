import React, {
    useEffect,
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useContext,
    useReducer,
} from "react";

import * as vec2 from "../vec2";
import bookmark from "../bookmark";
import postRootData from "./root"

//セーブマネージャー
const save = bookmark();

type Props={
    url :string
}

const BookMarkBar: React.FC<Props> = (props:Props) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState<string>("");
    const [bookmarkList, setBookmarkList] = useState<JSX.Element[]>([]);
    const [inBookmark, setInBookmark] = useState<boolean>(false);

    //ブックマークに追加
    const addBookmark = useCallback(() => {
        console.log(nameInputRef.current?.value,props.url)
        if(nameInputRef.current?.value){
            save.set(
                nameInputRef.current?.value ?? "",
                props.url
            );
            updateBookmark();
        }
    }, [props.url]);
    //ブックマークから削除
    const removeBookmark = useCallback(() => {
        save.remove(nameInputRef.current?.value ?? "");
        updateBookmark();
    }, []);

    useEffect(() => {
        updateBookmark();
    }, [name,props.url]);

    //入力制限
    const handleNameInput = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setName(event.target.value.replace(/[^A-Za-z0-9]/g, ""));
        },
        []
    );

    useEffect(() => {
        updateBookmark()
      }, []);

    //左のブックマークを描画
    const updateBookmark = useCallback(() => {
        let arr: JSX.Element[] = [];
        let flag = false;
        for (const [key, value] of save.getEntris()) {
            let className = "listElement";
            if (nameInputRef.current?.value == key) {
                className += " select";
                flag = true;
            }
            arr.push(
                <button
                    className={className}
                    key={key}
                    onClick={() => {
                        if(nameInputRef.current?.value == key&&props.url == value)
                            postRootData("reset","")
                        else
                            postRootData("url",value)
                        setName(key)
                    }}
                    style={{
                        width: `100px`,
                    }}
                >
                    {key}
                </button>
            );
        }
        setBookmarkList(arr);
        setInBookmark(flag);
    }, [props.url]);

    const toClipboard = useCallback(() => {
        navigator.clipboard.writeText(save.toJson());
    }, []);
    const fromClipboard = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const event: any = e.nativeEvent;
            if (event.inputType === "insertFromPaste") {
                save.fromJson(event.data);
                updateBookmark();
            }
        },
        []
    );

    return (
        <div
            style={{
                background: "#2A3132",
            }}
        >
            {bookmarkList}
            <button className={inBookmark?"right":"right hide"} onClick={removeBookmark}>
                Delete
            </button>
            <input
                className="right"
                type="text"
                placeholder="bookmark name"
                ref={nameInputRef}
                style={{
                    width: "100px",
                }}
                value={name}
                onChange={handleNameInput}
            />
            <button className="right" onClick={addBookmark}>
                Add
            </button>
        </div>
    );
};

export default BookMarkBar;
