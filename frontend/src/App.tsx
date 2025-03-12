import { useState } from "react";
import NavBar from "./components/NavBar";

function App() {
    const navItems = [
        { text: "Config", href: "#config" },
        { text: "Presets", href: "#presets" },
        { text: "History", href: "#history" },
    ];
    return <NavBar heading="Oven Manager" items={navItems} />;
}

export default App;
