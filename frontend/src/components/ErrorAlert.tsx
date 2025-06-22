import { type ComponentProps } from "react";


interface Props {
    error: string|undefined;
}

function ErrorAlert({error}: Props) {
    if (!error) {
        return <></>;
    }

    return error;
}

export default ErrorAlert