import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import HomePage from "./pages/Home";
import ConfigPage from "./pages/Config";
import HistoryPage from "./pages/History";
import AtomicPreset from "./pages/preset/AtomicPreset";
import DayPreset from "./pages/preset/DayPreset";


import "./scss/App.scss";

function App() {
    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    }, []);

    return (
        <BrowserRouter>
            <NavBar
                brand={{ text: "Oven Manager", link: "/" }}
                items={[
                    { text: "Config", link: "/config" },
                    {
                        header: { text: "Presets", link: "/preset"},
                        subitems: [
                            { text: "Atomic", link: "/preset/atomic" },
                            { text: "Day", link: "/preset/day" },
                        ],
                    },
                    { text: "History", link: "/history" },
                ]}
            />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/preset/atomic" element={<AtomicPreset />} />
                <Route path="/preset/day" element={<DayPreset />} />
                <Route path="/history" element={<HistoryPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
