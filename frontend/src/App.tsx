import NavBar from "./components/NavBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import ConfigPage from "./pages/Config";
import PresetsPage from "./pages/Presets";
import HistoryPage from "./pages/History";

function App() {
    return (
        <BrowserRouter>
            <NavBar
                brand={{ text: "Oven Manager", link: "/" }}
                items={[
                    { text: "Config", link: "/config" },
                    { text: "Presets", link: "/presets" },
                    { text: "History", link: "/history" },
                ]}
            />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/presets" element={<PresetsPage />} />
                <Route path="/history" element={<HistoryPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
