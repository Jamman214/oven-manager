import { type ReactNode} from "react";
import { FloatingInput } from "./FloatingInput";

interface Props {
    children: ReactNode;
}

function EditableDropdown ({children}: Props) {
    return <div className="editable-dropdown">
        {children}
        <button type="button" className="dropdown"/>
    </div>
}

export {EditableDropdown};