import {type ComponentProps, type ReactNode} from "react";

interface Props extends ComponentProps<"label"> {
    text: string;
    children?: ReactNode
}

function FloatingInput ({text, children, ...labelProps}: Props) {
    return <div className="floating-input">
        {children}
        <label {...labelProps}>{text}</label>
    </div>
}

export {FloatingInput};