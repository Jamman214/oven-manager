import { type ReactNode, useState, useRef, type ComponentPropsWithRef, type ComponentPropsWithoutRef} from "react";
import { FloatingInput } from "./FloatingInput";
import { useMergeRefs } from "../hooks/useMergeRefs";
import { useClickOutside } from "../hooks/useClickOutside";

interface Item {
    value: string;
    text: string;
    editText: string;
}

interface Props {
    // children: ReactNode;
    inputProps?: ComponentPropsWithRef<"input">;
    valueProps?: ComponentPropsWithRef<"input">;
    itemProps?: Omit<ComponentPropsWithoutRef<"button">, "onClick"> 
        & {
            onClick: (
                event: React.MouseEvent<HTMLButtonElement>,
                details: {
                    value: string,
                    text: string,
                    editText: string
                }
                
            ) => void
        }
    defaultItem: Item;
    items: Item[];
}

function EditableDropdown ({inputProps, valueProps, itemProps, defaultItem, items}: Props) {
    const [expanded, setExpanded] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const valueRef = useRef<HTMLInputElement | null>(null);
    const toggleRef = useRef<HTMLButtonElement | null>(null);
    const itemList = [defaultItem, ...items];

    const outsideClickHandler = (event: MouseEvent) => {
        if (
            !toggleRef.current 
            || toggleRef.current.contains(event.target as Node)
        ) return;
        setExpanded(false)
    }
    const dropdownRef = useClickOutside<HTMLDivElement>(outsideClickHandler, expanded);

    const clickHandler = () => {
        setExpanded((prev) => !prev)
    };

    const {ref: inputPropsRef, ...remainingInputProps} = inputProps || {};
    const {ref: valuePropsRef, ...remainingValueProps} = valueProps || {};
    const {onClick: itemPropsOnClick, ...remainingItemProps} = itemProps || {};

    return <div className="editable-dropdown">
        <input type="text" 
            ref={useMergeRefs(inputRef, inputPropsRef)} 
            {...remainingInputProps}
            
        />
        <input 
            type="hidden" 
            ref={useMergeRefs(valueRef, valuePropsRef)}
            {...remainingValueProps} 
        />
        <button 
            ref={toggleRef}
            type="button" 
            className="dropdown-toggle" 
            onClick={clickHandler}
        />
        <div 
            className={`dropdown ${expanded ? "expanded" : ""}`}
            ref={dropdownRef}
        >
            {itemList.map((item, i) => 
                <button 
                    key={i}
                    type="button"
                    onClick={(e) => {
                        setExpanded(false);
                        if (inputRef.current) {
                            inputRef.current.value = item.editText;
                        }
                        if (valueRef.current) {
                            valueRef.current.value = item.value;
                        }
                        itemPropsOnClick?.(e, {value: item.value, text: item.text, editText: item.editText})
                    }}
                    {...remainingItemProps}
                >
                    {item.text}
                </button>
            )}
        </div>
    </div>
}

export {EditableDropdown};