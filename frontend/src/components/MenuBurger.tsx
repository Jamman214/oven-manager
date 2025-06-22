import "../scss/components/MenuBurger.scss"

interface MenuBurgerProps {
    isOpen: boolean;
    wasOpen: boolean;
}

function MenuBurger({isOpen, wasOpen}: MenuBurgerProps) {
    return <div className={`menu-burger ${isOpen ? "open" : (wasOpen ? "was-open" : "")}`}>
        <div className="topbar"></div>
        <div className="midbar"></div>
        <div className="botbar"></div>
    </div>
}

export { MenuBurger }