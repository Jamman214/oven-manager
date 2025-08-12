import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import HomePage from "./pages/Home";
import ConfigPage from "./pages/Config";
import HistoryPage from "./pages/History";
import CreatePreset from "./pages/create/CreatePreset";
import CreateScheduleDay from "./pages/create/schedule/CreateScheduleDay";


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
                            { text: "Day Schedule", link: "/create/schedule/day" },
                        ],
                    },
                    { text: "History", link: "/history" },
                ]}
            />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/create/preset" element={<CreatePreset />} />
                <Route path="/create/schedule/day" element={<CreateScheduleDay />} />
                <Route path="/history" element={<HistoryPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
