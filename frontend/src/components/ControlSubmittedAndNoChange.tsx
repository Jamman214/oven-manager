import { ReactNode, useEffect, useRef } from "react";
import Form from "react-bootstrap/Form";

interface Props {
    returnState: React.Dispatch<React.SetStateAction<boolean>>;
    startState: boolean;
    children?: ReactNode;
}

function ControlSubmittedAndNoChange({
    returnState,
    startState,
    children,
    ...formControlProps
}: Props & React.ComponentProps<typeof Form.Control>) {
    useEffect(() => {
        if (!startState) {
            return;
        }
        returnState(true);
    }, [startState]);

    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <Form.Control
            {...formControlProps}
            onChange={(e) => {
                // Call the existing registered onChange handler
                formControlProps.onChange?.(e);
                if (startState) {
                    returnState(false);
                }
            }}
            onClick={(e) => {
                inputRef.current?.focus();
            }}
        >
            {children}
        </Form.Control>
    );
}

export default ControlSubmittedAndNoChange;
