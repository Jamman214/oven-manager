import NavBar from "./components/NavBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import ConfigPage from "./pages/Config";
import HistoryPage from "./pages/History";
import PresetCreate from "./pages/presets/PresetCreate";
import PresetSchedule from "./pages/presets/PresetSchedule";
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
                        text: "Presets",
                        subitems: [
                            { text: "Create", link: "/presets/create" },
                            { text: "Schedule", link: "/presets/schedule" },
                        ],
                    },
                    { text: "History", link: "/history" },
                ]}
            />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/presets/create" element={<PresetCreate />} />
                <Route path="/presets/schedule" element={<PresetSchedule />} />
                <Route path="/history" element={<HistoryPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
