import {useRef, useState} from "react";


function useUpdateWhenEqual(val: unknown, target: unknown) {
    const prevVal = useRef(val);
    
    const [update, setUpdate] = useState(0);

    if (prevVal.current !== val) {
        if (val === target) setUpdate(prev => prev + 1)
        prevVal.current = val
    }

    return update
}

export {useUpdateWhenEqual}