import { useEffect, useState, type ComponentProps, type PropsWithChildren } from "react";
import Form from "react-bootstrap/Form";
import { type SetStateAction } from "react";

type Item = {
    id: number;
    name: string;
}

interface Params 
    extends ComponentProps<typeof Form.Select>
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
        <Form.Select {...props}>
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
        </Form.Select>
    );
}

export {Dropdown, type Item};
