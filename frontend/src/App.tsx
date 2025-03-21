import NavBar from "./components/NavBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import ConfigPage from "./pages/Config";
import PresetsPage from "./pages/Presets";
import HistoryPage from "./pages/History";
import PresetSingle from "./pages/presets/Single";
import { useEffect } from "react";

import "./scss/app.scss";
// import "./app.css";

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
                            { text: "Single", link: "/presets/single" },
                            { text: "Multiple", link: "/presets/multiple" },
                        ],
                    },
                    { text: "History", link: "/history" },
                ]}
            />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/presets" element={<PresetsPage />}>
                    <Route path="single" element={<PresetSingle />} />
                    <Route path="multiple" element={<></>} />
                </Route>

                <Route path="/history" element={<HistoryPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
