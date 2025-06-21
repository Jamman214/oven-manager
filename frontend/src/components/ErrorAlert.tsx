import Alert from "react-bootstrap/Alert";
import { type ComponentProps } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";


interface Props {
    row?: boolean | ComponentProps<typeof Row>
    col?: boolean | ComponentProps<typeof Col>
    error: string|undefined;
}

function ErrorAlert({error, col, row}: Props) {
    if (!error) {
        return <></>;
    }

    let alert = (
        <Alert variant="danger">
            {error}
        </Alert>
    )

    if (col) {
        alert = (
            <Col {...(typeof col !== 'boolean') && col}>
                {alert}
            </Col>
        )
    }

    if (row) {
        alert = (
            <Row {...(typeof row !== 'boolean') && row}>
                {alert}
            </Row>
        )
    }

    return alert;
}

export default ErrorAlert