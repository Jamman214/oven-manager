import { NavLink } from "react-router-dom";
import { useState } from "react";

import "../scss/NavBar.scss"

interface TextRefPair {
    text: string;
    link: string;
}

interface TextRefPairDropdown {
    text: string;
    subitems: TextRefPair[];
}

type NavItem = TextRefPair | TextRefPairDropdown;


interface MenuIconProps {
    expanded: boolean;
    beenExpanded: boolean;
}

function MenuIcon({expanded, beenExpanded}: MenuIconProps) {
    return <div className={`menuicon ${expanded ? "expanded" : (beenExpanded ? "contracted" : "")}`}>
        <div className="topbar"></div>
        <div className="midbar"></div>
        <div className="botbar"></div>
    </div>
}

interface NavBarProps {
    brand: TextRefPair;
    items: NavItem[];
}

function NavBar({ brand, items }: NavBarProps) {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [beenExpanded, setBeenExpanded] = useState<boolean>(false);

    return (
        <div className="navbar">
            <NavLink className="navbar-brand"
                to={brand.link}
                onClick={() => setExpanded(false)}
            >
                {brand.text} - {String(expanded)}
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
                    <MenuIcon expanded={expanded} beenExpanded={beenExpanded}/>
                </button>
        </div>
    );
}

export default NavBar;
