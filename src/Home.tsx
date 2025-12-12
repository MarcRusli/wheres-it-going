import MapView from "./components/Map";
import BalloonSelector from "./components/BalloonSelector";
import { useState } from "react";
import SearchablePressureDropdown from "./components/PressureSelector";

const Home = () => {
  const [selectedBalloonId, setSelectedBalloonId] = useState(0);
  const [pressure, setPressure] = useState<number>(1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2d2c] via-[#284846] to-[#1f3a38] text-[#dae0d3] flex flex-col">
      <header className="bg-[#284846]/80 backdrop-blur-sm border-b border-[#abc8cc]/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Site Title */}
            <h1 className="text-2xl font-bold text-[#abc8cc]">
              Where does the wind blow?
            </h1>

            {/* Social Icons */}
            <nav className="flex gap-4">
              {/* GitHub Icon */}
              <a
                href="https://github.com/MarcRusli"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#dae0d3]/80 hover:text-[#abc8cc] transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.744.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.303-5.467-1.335-5.467-5.93 0-1.31.465-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 013.003-.404 11.5 11.5 0 013.003.404c2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.242 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.48 5.922.43.37.815 1.096.815 2.21 0 1.595-.015 2.882-.015 3.273 0 .32.216.694.825.576C20.565 21.796 24 17.303 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>

              {/* LinkedIn Icon */}
              <a
                href="https://linkedin.com/in/marcrusli/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#dae0d3]/80 hover:text-[#abc8cc] transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.452 20.452h-3.554v-5.569c0-1.327-.026-3.037-1.849-3.037-1.851 0-2.134 1.446-2.134 2.939v5.667H9.357V9h3.414v1.561h.049c.476-.9 1.637-1.849 3.368-1.849 3.599 0 4.264 2.368 4.264 5.451v6.289zM5.337 7.433c-1.145 0-2.069-.927-2.069-2.068s.924-2.068 2.069-2.068c1.143 0 2.068.926 2.068 2.068s-.925 2.068-2.068 2.068zM7.114 20.452H3.562V9h3.552v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.206 24 24 23.226 24 22.271V1.729C24 .774 23.206 0 22.225 0z" />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="bg-[#284846]/30 backdrop-blur-md rounded-2xl border border-[#abc8cc]/30 p-6 mb-6 shadow-xl">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-[#abc8cc]/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#abc8cc]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>

            {/* Text Content */}
            <div className="flex-1 space-y-4 text-[#dae0d3] leading-relaxed">
              {/* Title */}
              <h2 className="text-lg font-semibold text-[#abc8cc]">
                How do I use this?
              </h2>

              {/* Intro paragraph */}
              <p>
                The map below visualizes wind vectors from{" "}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  className="text-[#abc8cc] hover:text-[#c5dce0] font-medium underline decoration-[#abc8cc]/30 hover:decoration-[#abc8cc]/60 transition-colors"
                >
                  Open-Meteo
                </a>{" "}
                around the flight paths of{" "}
                <a
                  href="https://windbornesystems.com/"
                  target="_blank"
                  className="text-[#abc8cc] hover:text-[#c5dce0] font-medium underline decoration-[#abc8cc]/30 hover:decoration-[#abc8cc]/60 transition-colors"
                >
                  WindBorne Systems
                </a>{" "}
                sounding balloons. This lets us compare each balloon’s logged
                trajectory with predicted atmospheric winds along its route.
              </p>

              {/* Bullet List of Tips */}
              <ul className="list-disc list-outside space-y-2 text-[#dae0d3]/90">
                <li>
                  The app fetches wind vectors from Open-Meteo in a 5×5 grid
                  around the balloon’s path.
                </li>
                <li>
                  The app currently only plots the last 5-6 hours of balloon
                  data.
                </li>
                <li>
                  WindBorne tracks hundreds of balloons.{" "}
                  <span className="text-[#abc8cc] font-medium">
                    Click on the balloon selector
                  </span>{" "}
                  to choose which one to follow.
                </li>
                <li>
                  Wind data is provided at fixed{" "}
                  <strong>pressure levels</strong>, not exact altitudes, though
                  each pressure level corresponds to an approximate height in
                  the atmosphere.{" "}
                  <span className="text-[#abc8cc] font-medium">
                    Click on the pressure selector
                  </span>{" "}
                  to explore how winds differ across atmospheric layers.
                </li>
                <li>
                  <span className="text-[#abc8cc] font-medium">
                    Hover over a balloon's path points
                  </span>{" "}
                  to show its location and time data.
                </li>
              </ul>

              {/* 🔶 Warning Block */}
              <div className="mt-4 bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex gap-3 shadow-inner">
                <svg
                  className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v3m0 3h.01M12 5l7 12H5l7-12z"
                  ></path>
                </svg>

                <p className="text-amber-200/90 leading-relaxed">
                  This app uses Open-Meteo's non-commercial usage license. This
                  means that each device this program runs on can only view wind
                  data at a limited frequency. Limits are: 24/min, 200/hr,
                  400/day.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#284846]/40 rounded-2xl border border-[#abc8cc]/20 p-6 mb-6 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Balloon Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#abc8cc] mb-1">
                Select Balloon
                {/* Info Icon + Tooltip */}
                <div className="relative group cursor-pointer">
                  <svg
                    className="w-4 h-4 text-[#abc8cc]/70 group-hover:text-[#abc8cc] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 110-18 9 9 0 010 18z"
                    />
                  </svg>

                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-lg bg-[#abc8cc] border border-[#dae0d3]/30 text-[#284846] text-xs px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                    WindBorne launches hundreds of balloons. Choose one to
                    explore its trajectory.
                  </div>
                </div>
              </label>

              <div className="balloon-selector-wrapper">
                <BalloonSelector
                  value={selectedBalloonId}
                  onChange={setSelectedBalloonId}
                />
              </div>
            </div>

            {/* Pressure Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#abc8cc] mb-1">
                Pressure Level (hPa)
                {/* Info Icon + Tooltip */}
                <div className="relative group cursor-pointer">
                  <svg
                    className="w-4 h-4 text-[#abc8cc]/70 group-hover:text-[#abc8cc] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 110-18 9 9 0 010 18z"
                    />
                  </svg>

                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-52 rounded-lg bg-[#abc8cc] border border-[#dae0d3]/30 text-[#284846] text-xs px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                    Open-Meteo provides winds at set pressure levels. These
                    correspond to approximate altitudes. Compare wind data close
                    to the balloon's altitude!
                  </div>
                </div>
              </label>

              <div className="pressure-dropdown-wrapper">
                <SearchablePressureDropdown
                  selected={pressure}
                  onSelect={(p) => setPressure(p)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#284846]/40 backdrop-blur-md rounded-2xl border border-[#abc8cc]/20 p-4 shadow-2xl">
          <div className="map-wrapper rounded-xl overflow-hidden relative z-0">
            <MapView balloonId={selectedBalloonId} pressure={pressure} />
          </div>
        </div>

        {/* Grey Bugs & TODO Panel */}
        <div className="bg-[#1f2a2a]/80 backdrop-blur-md rounded-2xl border border-[#555]/30 p-6 mt-6 shadow-lg">
          <div className="flex items-start gap-4">
            {/* Frowny Face Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-[#555]/20 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="M4.285 12.433a.5.5 0 0 0 .683-.183A3.5 3.5 0 0 1 8 10.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5m4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5" />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4 text-[#ccc] leading-relaxed">
              <h2 className="text-lg font-semibold text-[#aaa]">
                Future Things
              </h2>

              {/* Bugs Section */}
              <div>
                <h3 className="text-sm font-medium text-[#bbb] mb-2">
                  KNOWN BUGS
                </h3>
                <ul className="list-disc list-inside space-y-1 text-[#ccc]/90">
                  <li>
                    Balloon paths that cross the antimeridian take the long way
                    around the world instead
                  </li>
                </ul>
              </div>

              {/* TODO Section */}
              <div>
                <h3 className="text-sm font-medium text-[#bbb] mb-2">TODO</h3>
                <ul className="list-disc list-inside space-y-1 text-[#ccc]/90">
                  <li>
                    Create a slider or something to view wind data at different
                    times
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-8 text-center text-[#dae0d3]/60 text-sm border-t border-[#abc8cc]/10">
        © {new Date().getFullYear()} Marc Rusli. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
