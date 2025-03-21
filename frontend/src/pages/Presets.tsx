import Container from "react-bootstrap/Container";
import { Outlet } from "react-router-dom";

function Presets() {
    return (
        <Container fluid>
            <Outlet />
        </Container>
    );
}

export default Presets;
