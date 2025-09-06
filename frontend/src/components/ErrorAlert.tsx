interface Props {
    error: string | undefined | false;
}

function ErrorAlert({error}: Props) {
    if (!error) {
        return <></>;
    }

    return <div className="error">{error}</div>;
}

export {ErrorAlert}