import {useEffect, useRef} from "react";

function useClickOutside<T extends HTMLElement>(callback: (() => void) | ((event: MouseEvent) => void), active: boolean) {
    const ref = useRef<T>(null);

    useEffect(() => {
        if (!active) return;
        
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback(event);
            }
        }
        document.addEventListener("mouseup", handleClickOutside);

        return () => {
            removeEventListener("mouseup", handleClickOutside);
        }
    }, [callback, active])

    return ref;
}

export {useClickOutside}