import { useState, useEffect } from "react";
import { useClickOutside } from "../hooks/useClickOutside.tsx"
import { NavLink, useLocation } from "react-router-dom";
import { MenuBurger } from "./MenuBurger.tsx";
import { breakpoint_sm } from "../utility/breakpoints.tsx"

import "../scss/components/NavBar.scss"

interface AtomicNavItem {
    text: string;
    link: string;
}

interface AtomicNavItemProps{
    item: AtomicNavItem;
    onClick?: () => void;
}

function AtomicNavItem({item, onClick=undefined}: AtomicNavItemProps) {
    return (
        <NavLink
            className={({isActive})=>`nav-item ${isActive ? "is-active" : ""}`}
            to={item.link}
            onClick={onClick}
        >
            {item.text}
        </NavLink>
    );
}

interface CompoundNavItem {
    header: AtomicNavItem;
    subitems: AtomicNavItem[];
}

interface CompoundNavItemProps {
    item: CompoundNavItem;
    onClick?: () => void;
}

function CompoundNavItem({item, onClick}: CompoundNavItemProps) {
    const location = useLocation();
    const isHeaderActive = location.pathname.startsWith(item.header.link);

    const [expanded, setExpanded] = useState<boolean>(false);

    const outsideClickHandler = () => {setExpanded(false)}
    const ref = useClickOutside<HTMLDivElement>(outsideClickHandler, expanded);

    return (
        <div className="navgroup" ref={ref}>
            <button 
                type="button" 
                className={`nav-item expandable ${isHeaderActive ? "is-active" : ""}`}
                onClick={() => setExpanded((prev) => !prev)}
            > 
                { item.header.text } 
            </button>
            
            { expanded && (
                <div className="expanded-nav-item">
                    {
                        item.subitems.map(
                            (subitem: AtomicNavItem, i) => 
                                <NavLink
                                    className={({isActive, isPending})=>`nav-item ${isActive || isPending ? "is-active" : ""}`}
                                    to={subitem.link}
                                    key={i}
                                    onClick={() => {setExpanded(false); onClick?.()}}
                                >
                                    {subitem.text}
                                </NavLink>
                                
                            
                        )
                    }
                </div>
            )}
        </div>
    )
}





type NavItem = AtomicNavItem | CompoundNavItem;

interface NavBarProps {
    brand: AtomicNavItem;
    items: NavItem[];
}

function NavBar({ brand, items }: NavBarProps) {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [beenExpanded, setBeenExpanded] = useState<boolean>(false);

    const expandState = expanded ? "expanded" : beenExpanded ? "collapsed" : "";

    // Closes dropdown when screen gets bigger
    // Also prevents animation from playing when screen gets smaller again
    useEffect(() => {
        function handleResize() {
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            if (window.innerWidth >= 28 * rem) {
                // If the screen isn't small, unexpand it
                setExpanded(false);
                setBeenExpanded(false);
            }
        }
        window.addEventListener('resize', handleResize);
    }, []);

    return (<>
        <div className="navbar">
            <div className="navbar-static">
                <NavLink className="navbar-brand"
                    to={brand.link}
                    onClick={() => setExpanded(false)}
                >
                    {brand.text}
                </NavLink>

                <button className="navbar-toggle"
                    onClick={() => {setExpanded((prev) => !prev); setBeenExpanded(true)}}
                >
                    <MenuBurger isOpen={expanded} wasOpen={beenExpanded}/>
                </button>
            </div>
            <div className={`navbar-collapse ${expandState}`}>
                {items.map((item: NavItem, i) => {
                    if ("subitems" in item) {
                        return <CompoundNavItem 
                            key={i}
                            item={item} 
                            onClick={() => {setExpanded(false); setBeenExpanded(true)}}
                        />
                    }
                    return <AtomicNavItem 
                        key={i}
                        item={item}
                        onClick={() => {setExpanded(false); setBeenExpanded(true)}}
                    />
                    
                })}
            </div>
        </div>
        </>
    );
}

export default NavBar;
