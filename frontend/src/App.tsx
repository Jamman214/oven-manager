import NavBar from "./components/NavBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import ConfigPage from "./pages/Config";
import HistoryPage from "./pages/History";
import PresetCreate from "./pages/create/Preset";
import PresetSchedule from "./pages/create/Schedule";
import { useEffect } from "react";

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
                        header: { text: "Create", link: "/create"},
                        subitems: [
                            { text: "Preset", link: "/create/preset" },
                            { text: "Schedule", link: "/create/schedule" },
                        ],
                    },
                    { text: "History", link: "/history" },
                ]}
            />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/create/preset" element={<PresetCreate />} />
                <Route path="/create/schedule" element={<PresetSchedule />} />
                <Route path="/history" element={<HistoryPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
