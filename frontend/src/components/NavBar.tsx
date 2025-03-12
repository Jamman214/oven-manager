// return (
//     <nav className="navbar bg-dark navbar-expand-sm" data-bs-theme="dark">
//         <div className="container-fluid">
//             <a className="navbar-brand" href="#">
//                 Oven Manager
//             </a>

//             <button
//                 className="navbar-toggler"
//                 type="button"
//                 data-bs-toggle="collapse"
//                 data-bs-target="#navbarNav"
//                 aria-controls="navbarNav"
//                 aria-expanded="false"
//                 aria-label="Toggle navigation"
//             >
//                 <span className="navbar-toggler-icon"></span>
//             </button>

//             <div className="collapse navbar-collapse" id="navbarNav">
//                 <ul className="navbar-nav">
//                     {navs.map((item, index) => {
//                         return (
//                             <li className="nav-item" key={index}>
//                                 <a
//                                     className={
//                                         "nav-link" +
//                                         (index === selectedNav
//                                             ? " active"
//                                             : "")
//                                     }
//                                     aria-current={
//                                         index === selectedNav && "page"
//                                     }
//                                     href="#"
//                                     onClick={() => {
//                                         setSelectedNav(index);
//                                     }}
//                                 >
//                                     {item}
//                                 </a>
//                             </li>
//                         );
//                     })}
//                 </ul>
//             </div>
//         </div>
//     </nav>
// );

import { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

interface ItemProps {
    text: string;
    href: string;
}

interface Props {
    heading: string;
    items: ItemProps[];
}

function NavBar({ heading, items }: Props) {
    const [selectedNav, setSelectedNav] = useState(0);

    return (
        <Navbar
            expand="lg"
            className="bg-dark navbar-expand-sm"
            data-bs-theme="dark"
        >
            <Container fluid>
                <Navbar.Brand href="#home">{heading}</Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {items.map(({ text, href }: ItemProps, index) => {
                            return (
                                <Nav.Link
                                    href={href}
                                    className={
                                        selectedNav === index ? "active" : ""
                                    }
                                    aria-current={
                                        index === selectedNav && "page"
                                    }
                                    onClick={() => {
                                        setSelectedNav(index);
                                    }}
                                >
                                    {text}
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
