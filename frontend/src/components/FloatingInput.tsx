import {type ComponentProps, type ReactNode} from "react";

interface Props extends ComponentProps<"label"> {
    text: string;
    children?: ReactNode
}

function FloatingInput ({text, children, ...labelProps}: Props) {
    return <div className="floating-input">
        <label {...labelProps}>{text}</label>
        {children}
    </div>
}

export {FloatingInput};