import React, {
    useEffect,
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useContext,
    useReducer,
    useMemo,
} from "react";

type Props = {
    select: boolean;
    defaultValue: string;
    onChange: (color: string, key: string) => void;
};

const InputColor: React.FC<Props> = (props) => {
    const func = (e:any) => {
        const target: any = e.target;
        if (!props.select) {
            e.preventDefault();
            props.onChange(target.value, props.defaultValue);
        }
    }
    return (
        <input
            className={"pallet" + (props.select ? " selectColor" : "")}
            type="color"
            defaultValue={props.defaultValue}
            onClick={func}
            onTouchEnd={func}
            onChange={(e) => props.onChange(e.target.value, props.defaultValue)}
        />
    );
};
export default InputColor;
