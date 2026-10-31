import { useEffect, useRef, useState } from "react";
import { Map, Marker, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";
import type { Dive, DiveSite } from "./types/dive";
import sitesData from "./data/sites.json";
import divesData from "./data/dives.json";

setWorkerUrl(workerUrl);

const sites: DiveSite[] = sitesData.map((site) => ({
  ...site,
  coordinates: site.coordinates as [number, number],
}));

const dives: Dive[] = divesData;

function getDivesForSite(siteId: string): Dive[] {
  return dives
    .filter((dive) => dive.siteId === siteId)
    .sort((a, b) => b.id - a.id);
}

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedDiveId, setSelectedDiveId] = useState<number | null>(null);
  const [isAddingDive, setIsAddingDive] = useState(false);
  const selectedSite = sites.find((site) => site.id === selectedSiteId);
  const siteDives = selectedSite ? getDivesForSite(selectedSite.id) : [];
  const selectedDive = siteDives.find((dive) => dive.id === selectedDiveId);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [151.296, -33.803],
      zoom: 13,
      pitch: 0,
    });

    const markers = sites.map((site) => {
      const element = document.createElement("button");
      element.className = "dive-pin";
      const diveCount = getDivesForSite(site.id).length;
      element.textContent = String(diveCount);
      element.title = `${site.name} — ${diveCount} dives`;
      element.setAttribute("aria-label", element.title);
      element.type = "button";

      element.addEventListener('click', () => {
        setIsAddingDive(false)
        setSelectedSiteId(site.id)
        setSelectedDiveId(null)
      })

      return new Marker({ element }).setLngLat(site.coordinates).addTo(map);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, []);

  return (
    <div className="app">
      <div ref={mapContainer} className="map" />

      <header className="navbar">
        <h1>Shaohan's Logbook</h1>
        <button
          className="add-dive-button"
          onClick={() => {
            setSelectedSiteId(null);
            setSelectedDiveId(null);
            setIsAddingDive(true);
          }}
        >
          <span>＋</span>
          Add Dive
        </button>
      </header>

      {selectedSite && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div>
              <span className="eyebrow">DIVE SITE</span>
              <h2>{selectedSite.name}</h2>
              <p>{siteDives.length} dives recorded</p>
            </div>

            <button
              className="close-button"
              onClick={() => {
                setSelectedSiteId(null);
                setSelectedDiveId(null);
              }}
              aria-label="Close sidebar"
            >
              ×
            </button>
          </div>

          <div className="sidebar-content">
            <span className="eyebrow">DIVE HISTORY</span>
            {siteDives.map((dive) => (
              <div key={dive.id}>
                <button
                  className={`dive-row ${
                    selectedDiveId === dive.id ? "active" : ""
                  }`}
                  onClick={() =>
                    setSelectedDiveId(
                      selectedDiveId === dive.id ? null : dive.id,
                    )
                  }
                >
                  <span>
                    <strong>Dive #{dive.id}</strong>
                    <small>{dive.date}</small>
                  </span>
                  <span>{dive.depth} m</span>
                </button>

                {selectedDive?.id === dive.id && (
                  <div className="dive-detail">
                    <div className="stats">
                      <div>
                        <small>DEPTH</small>
                        <strong>{dive.depth} m</strong>
                      </div>
                      <div>
                        <small>DURATION</small>
                        <strong>{dive.duration} min</strong>
                      </div>
                      <div>
                        <small>TEMP</small>
                        <strong>{dive.temperature}°C</strong>
                      </div>
                    </div>

                    <dl>
                      <dt>Gas</dt>
                      <dd>{dive.gas}</dd>
                      <dt>Cylinder</dt>
                      <dd>{dive.cylinder} L</dd>
                      <dt>Pressure</dt>
                      <dd>
                        {dive.startPressure} → {dive.endPressure} bar
                      </dd>
                      {dive.visibility != null && (
                        <>
                          <dt>Visibility</dt>
                          <dd>{dive.visibility} m</dd>
                        </>
                      )}
                    </dl>

                    {dive.notes && <p>{dive.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      {isAddingDive && (
        <aside className="sidebar add-dive-sidebar">
          <div className="sidebar-header">
            <div>
              <span className="eyebrow">NEW ENTRY</span>
              <h2>Add Dive</h2>
              <p>A new memory beneath the surface.</p>
            </div>

            <button
              className="close-button"
              onClick={() => setIsAddingDive(false)}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <div className="sidebar-content">
            <form
              className="dive-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                Dive Number
                <input type="number" placeholder="109" />
              </label>

              <label>
                Dive Site
                <select defaultValue="">
                  <option value="" disabled>
                    Select a dive site
                  </option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input type="date" />
              </label>

              <div className="form-grid">
                <label>
                  Max Depth (m)
                  <input type="number" step="0.1" />
                </label>

                <label>
                  Duration (min)
                  <input type="number" />
                </label>

                <label>
                  Water Temp (°C)
                  <input type="number" step="0.1" />
                </label>

                <label>
                  Gas
                  <select defaultValue="Air">
                    <option value="Air">Air</option>
                    <option value="EAN32">EAN32</option>
                    <option value="EAN36">EAN36</option>
                  </select>
                </label>

                <label>
                  Cylinder (L)
                  <input type="number" step="0.1" defaultValue="12" />
                </label>

                <label>
                  Visibility (m)
                  <input type="number" step="0.1" />
                </label>

                <label>
                  Start Pressure (bar)
                  <input type="number" />
                </label>

                <label>
                  End Pressure (bar)
                  <input type="number" />
                </label>
              </div>

              <label>
                Notes
                <textarea rows={3} placeholder="Anything memorable..." />
              </label>

              <button className="save-dive-button" type="submit" disabled>
                Save Dive — Coming Soon
              </button>
            </form>
          </div>
        </aside>
      )}
    </div>
  );
}

export default App;
