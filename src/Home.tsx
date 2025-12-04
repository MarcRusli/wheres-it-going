import MapView from "./Map";

const Home = () => {
  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <div className="logo">MyApp</div>
        <nav className="nav">
          <a href="#">Home</a>
          <a href="#">Features</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="main">
        <MapView/>
      </main>

      {/* Footer */}
      <footer className="footer">
        © {new Date().getFullYear()} MyApp. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
