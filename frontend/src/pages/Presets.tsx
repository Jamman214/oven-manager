import Container from "react-bootstrap/Container";
import { Outlet } from "react-router-dom";
import { ResponsiveSubmissionProvider } from "../components/SubmitButton";

function Presets() {
    return (
        <Container fluid>
            <ResponsiveSubmissionProvider>
                <Outlet />
            </ResponsiveSubmissionProvider>
        </Container>
    );
}

export default Presets;
