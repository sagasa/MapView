import React, {
    useEffect,
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useContext,
    useReducer,
} from "react";

import postRootData from "./root";

type Props = {
    url: string;
};

const URLBar: React.FC<Props> = (props) => {
    const urlInputRef = useRef<HTMLInputElement>(null);

    const setUrl = useCallback((nextUrl: string) => {
        if (urlInputRef.current) urlInputRef.current.value = nextUrl;

        const url = new URL(window.location.toString());
        url.searchParams.set("url", nextUrl);
        //console.log(url)
        history.pushState("test", "", url.href);
    }, []);

    useEffect(() => {
        if (urlInputRef.current) urlInputRef.current.value = props.url;
    }, [props.url]);

    return (
        <div
            style={{
                background: "#2A3132",
            }}
        >
            <input
                type="text"
                ref={urlInputRef}
                placeholder="enter image url"
                defaultValue={props.url}
                onBlur={(e) =>
                    postRootData("url", {
                        url: urlInputRef.current?.value ?? "",
                    })
                }
                style={{
                    width: `80%`,
                }}
            />
            <button
                onClick={() =>
                    postRootData("url", {
                        url: urlInputRef.current?.value ?? "",
                    })
                }
            >
                Apply
            </button>

            <input
                className="right hide"
                type="text"
                style={{
                    width: 40,
                }}
                defaultValue="Import"
            />
            <button className="right hide">Export</button>
        </div>
    );
};

export default URLBar;
