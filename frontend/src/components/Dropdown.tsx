import { useEffect, useState, type ComponentProps, type PropsWithChildren } from "react";
import Form from "react-bootstrap/Form";
import { type SetStateAction } from "react";

type Item = {
    id: number;
    name: string;
}

interface Params 
    extends ComponentProps<"select">
    { 
        options: Item[];
        initial?: string;
        disableInitial?: boolean;
    }

function Dropdown({
    options,
    initial,
    children,
    disableInitial = true,
    ...props
}: Params) {
    return (
        <select {...props}>
            {
                initial &&
                <option value="" disabled={disableInitial}>
                    {initial}
                </option> 
            }
            {children}
            {
                options.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))
            }
        </select>
    );
}

export {Dropdown, type Item};
