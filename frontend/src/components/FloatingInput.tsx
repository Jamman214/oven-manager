import {type ComponentProps} from "react";

interface Props {
    text: string;
    id?: string;
    labelProps?: Omit<ComponentProps<"label">, "for">;
    inputProps?: Omit<ComponentProps<"input">, "id">;
}

function FloatingInput ({text, id, labelProps, inputProps}: Props) {
    return <div className="floating-input">
        <label {...{htmlFor: id, ...labelProps}}>{text}</label>
        <input {...{id: id, ...inputProps}}/>
    </div>
}

export {FloatingInput};