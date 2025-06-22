import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { MenuBurger } from "./MenuBurger.tsx";
import { breakpoint_sm } from "../utility/breakpoints.tsx"

import "../scss/components/NavBar.scss"

interface TextRefPair {
    text: string;
    link: string;
}

interface TextRefPairDropdown {
    text: string;
    subitems: TextRefPair[];
}

type NavItem = TextRefPair | TextRefPairDropdown;

interface NavBarProps {
    brand: TextRefPair;
    items: NavItem[];
}

function NavBar({ brand, items }: NavBarProps) {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [beenExpanded, setBeenExpanded] = useState<boolean>(false);

    // Closes dropdown when screen gets bigger
    // Also prevents animation from playing when screen gets smaller again
    useEffect(() => {
        function handleResize() {
            console.log("handled")
            if (window.innerWidth >= breakpoint_sm) {
                // If the screen isn't small, unexpand it
                setExpanded(false);
                setBeenExpanded(false);
            }
        }
        window.addEventListener('resize', handleResize);
    }, []);

    return (
        <div className="navbar">
            <NavLink className="navbar-brand"
                to={brand.link}
                onClick={() => setExpanded(false)}
            >
                {brand.text}
            </NavLink>
            <div className="navbar-collapse">
                {items.map((item: NavItem, i) => {
                    if ("subitems" in item) {
                        return (
                            <div className="navbar-dropdown" key={i}>
                                {item.subitems.map(
                                    (subitem: TextRefPair, j) => {
                                        return (
                                            <NavLink
                                                to={subitem.link}
                                                key={j}
                                                onClick={() =>
                                                    setExpanded(
                                                        false
                                                    )
                                                }
                                            >
                                                {subitem.text}
                                            </NavLink>
                                        );
                                    }
                                )}
                            </div>
                        );
                    }
                    return (
                        <NavLink
                            to={item.link}
                            key={i}
                            onClick={() => setExpanded(false)}
                        >
                            {item.text}
                        </NavLink>
                    );
                })}
            </div>

            <button className="navbar-toggle"
                onClick={() => {setExpanded((prev) => !prev); setBeenExpanded(true)}}
            >
                <MenuBurger isOpen={expanded} wasOpen={beenExpanded}/>
            </button>
        </div>
    );
}

export default NavBar;
