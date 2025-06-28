import { type ComponentProps } from "react";


interface Props {
    error: string|undefined;
}

function ErrorAlert({error}: Props) {
    if (!error) {
        return <></>;
    }

    return <div className="error">error</div>;
}

export default ErrorAlert