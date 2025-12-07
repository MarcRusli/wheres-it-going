import MapView from "./components/Map";

const Home = () => {
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
          The map below compares the path of one of{" "}
          <a href="https://windbornesystems.com/" target="_blank">
            WindBorne
          </a>
          's sounding balloons to a predicted path based on publicly available
          wind data from{" "}
          <a href="https://open-meteo.com/" target="_blank">
            Open-Meteo.
          </a>
        </p>
        <MapView />
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Marc Rusli. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
