import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { NavLink } from "react-router-dom";

interface TextRefPair {
    text: string;
    link: string;
}

interface Props {
    brand: TextRefPair;
    items: TextRefPair[];
}

function NavBar({ brand, items }: Props) {
    return (
        <Navbar
            expand="lg"
            className="bg-dark navbar-expand-sm"
            data-bs-theme="dark"
        >
            <Container fluid>
                <Navbar.Brand as={NavLink} to={brand.link}>
                    {brand.text}
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {items.map((item: TextRefPair, index) => {
                            return (
                                <Nav.Link as={NavLink} to={item.link}>
                                    {item.text}
                                </Nav.Link>
                            );
                        })}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavBar;
