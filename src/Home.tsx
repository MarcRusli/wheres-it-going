import MapView from "./components/Map";
import BalloonSelector from "./components/BalloonSelector";
import { useState } from "react";
import SearchablePressureDropdown from "./components/PressureSelector";

const Home = () => {
  const [selectedBalloonId, setSelectedBalloonId] = useState(0);
  const [pressure, setPressure] = useState<number>(1000);

  return (
    <div className="page">
      <header className="header">
        <div className="logo">Where's it going?</div>
        <nav className="nav">
          <a href="#">Home</a>
          <a href="#">Features</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>
      </header>
      <main className="main">
        <p className="description">
          The map below compares the path of{" "}
          <a href="https://windbornesystems.com/" target="_blank">
            WindBorne
          </a>
          's sounding balloons to predicted paths based on publicly available
          wind data from{" "}
          <a href="https://open-meteo.com/" target="_blank">
            Open-Meteo.
          </a>
        </p>
        <BalloonSelector
          value={selectedBalloonId}
          onChange={setSelectedBalloonId}
        />
        <SearchablePressureDropdown
          selected={pressure}
          onSelect={(p) => setPressure(p)}
        />
        <MapView balloonId={selectedBalloonId} pressure={pressure} />
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Marc Rusli. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
