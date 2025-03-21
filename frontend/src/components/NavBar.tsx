import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import NavDropdown from "react-bootstrap/NavDropdown";

interface TextRefPair {
    text: string;
    link: string;
}

interface TextRefPairDropdown {
    text: string;
    subitems: TextRefPair[];
}

type NavItem = TextRefPair | TextRefPairDropdown;

interface Props {
    brand: TextRefPair;
    items: NavItem[];
}

function NavBar({ brand, items }: Props) {
    const [expanded, setExpanded] = useState<boolean>(false);

    return (
        <Navbar expand="sm" expanded={expanded}>
            <Container fluid>
                <Navbar.Brand
                    as={NavLink}
                    to={brand.link}
                    onClick={() => setExpanded(false)}
                >
                    {brand.text}
                </Navbar.Brand>

                <Navbar.Toggle
                    aria-controls="navbar"
                    onClick={() => setExpanded(!expanded)}
                />

                <Navbar.Collapse id="navbar">
                    <Nav>
                        {items.map((item: NavItem, i) => {
                            if ("subitems" in item) {
                                return (
                                    <NavDropdown title={item.text} key={i}>
                                        {item.subitems.map(
                                            (subitem: TextRefPair, j) => {
                                                return (
                                                    <NavDropdown.Item
                                                        as={NavLink}
                                                        to={subitem.link}
                                                        key={j}
                                                        onClick={() =>
                                                            setExpanded(
                                                                !expanded
                                                            )
                                                        }
                                                    >
                                                        {subitem.text}
                                                    </NavDropdown.Item>
                                                );
                                            }
                                        )}
                                    </NavDropdown>
                                );
                            }
                            return (
                                <Nav.Link
                                    as={NavLink}
                                    to={item.link}
                                    key={i}
                                    onClick={() => setExpanded(false)}
                                >
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
