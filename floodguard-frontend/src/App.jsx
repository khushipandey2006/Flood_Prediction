
import { useState } from "react";
import {
  Activity, AlertTriangle, Bell, ChevronDown, CloudRain,
  Droplets, LayoutDashboard, MapPin, Menu, Search,
  ShieldCheck, TrendingUp, Waves, Clock3, ArrowUpRight,
  History, Settings, Info, Zap
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import "./App.css";

const trendData = [
  { time: "06 AM", rainfall: 18, risk: 18 },
  { time: "08 AM", rainfall: 28, risk: 24 },
  { time: "10 AM", rainfall: 42, risk: 38 },
  { time: "12 PM", rainfall: 35, risk: 32 },
  { time: "02 PM", rainfall: 61, risk: 54 },
  { time: "04 PM", rainfall: 78, risk: 72 },
  { time: "06 PM", rainfall: 56, risk: 63 },
];

const locations = [
  { name: "Bengaluru", region: "Karnataka", risk: "Moderate", probability: 46, rainfall: 42, water: 2.8 },
  { name: "Chennai", region: "Tamil Nadu", risk: "High", probability: 76, rainfall: 78, water: 4.2 },
  { name: "Kochi", region: "Kerala", risk: "Very High", probability: 89, rainfall: 112, water: 5.1 },
  { name: "Hyderabad", region: "Telangana", risk: "Low", probability: 18, rainfall: 12, water: 1.4 },
];

const zones = [
  { name: "North Zone", x: 27, y: 23, risk: "moderate" },
  { name: "Central Zone", x: 48, y: 39, risk: "low" },
  { name: "East Zone", x: 71, y: 29, risk: "high" },
  { name: "West Zone", x: 20, y: 56, risk: "low" },
  { name: "South Zone", x: 49, y: 68, risk: "moderate" },
  { name: "River Belt", x: 76, y: 63, risk: "very-high" },
  { name: "Lake Area", x: 34, y: 43, risk: "high" },
];

function RiskBadge({ risk }) {
  const cls = risk.toLowerCase().replace(" ", "-");
  return <span className={`risk-badge ${cls}`}>{risk}</span>;
}

function StatCard({ title, value, unit, note, icon: Icon, color }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${color}`}><Icon size={20} /></span>
        <span className="stat-note"><TrendingUp size={13} /> {note}</span>
      </div>
      <p className="stat-label">{title}</p>
      <div className="stat-value">{value}<span>{unit}</span></div>
    </article>
  );
}

function RiskMap({ location }) {
  return (
    <div className="map-canvas">
      <div className="map-grid" />
      <svg className="river" viewBox="0 0 500 330" preserveAspectRatio="none">
        <path d="M-20 90 C 90 20, 90 170, 190 130 S 320 60, 370 160 S 450 230, 520 175" />
        <path d="M30 330 C 80 240, 165 280, 220 200 S 340 220, 470 10" />
      </svg>
      <div className="map-label label-a">NORTH DISTRICT</div>
      <div className="map-label label-b">CENTRAL DISTRICT</div>
      <div className="map-label label-c">SOUTH DISTRICT</div>
      {zones.map((zone, i) => (
        <div
          key={zone.name}
          className={`map-zone ${zone.risk}`}
          style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
          title={`${zone.name}: ${zone.risk.replace("-", " ")} risk`}
        >
          <span>{i + 1}</span>
        </div>
      ))}
      <div className="map-pin"><MapPin size={17} fill="currentColor" /></div>
      <div className="map-location"><strong>{location}</strong><span>Selected location</span></div>
      <div className="map-legend">
        <span><i className="dot low-dot" />Low</span>
        <span><i className="dot moderate-dot" />Moderate</span>
        <span><i className="dot high-dot" />High</span>
        <span><i className="dot very-high-dot" />Very high</span>
      </div>
      <div className="map-watermark">ILLUSTRATIVE RISK ZONES</div>
    </div>
  );
}

function Dashboard({ selected, setSelected, onAnalyze }) {
  const current = locations.find(l => l.name === selected) || locations[0];

  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="live-dot" /> FLOOD MONITORING OVERVIEW</div>
          <h1>Good afternoon <span>👋</span></h1>
          <p className="subtitle">Understand flood risk. Make informed decisions.</p>
        </div>
        <button className="primary-btn" onClick={onAnalyze}>
          <Activity size={17} /> Analyze risk <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="prototype-notice">
        <Info size={17} />
        <span><strong>Prototype preview:</strong> Values and risk zones are illustrative sample data, not live measurements or a validated forecast.</span>
      </div>

      <section className="location-row">
        <div className="location-copy">
          <span className="location-icon"><MapPin size={19} /></span>
          <div><strong>Selected location</strong><span>Explore a location's sample risk profile</span></div>
        </div>
        <div className="location-actions">
          <select value={selected} onChange={e => setSelected(e.target.value)} aria-label="Select location">
            {locations.map(l => <option key={l.name} value={l.name}>{l.name}, {l.region}</option>)}
          </select>
          <button className="outline-btn" onClick={onAnalyze}>View analysis</button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="Flood probability" value={current.probability} unit="%" note="Sample estimate" icon={Activity} color="blue" />
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon amber"><AlertTriangle size={20} /></span>
            <span className="mini-label">Current assessment</span>
          </div>
          <p className="stat-label">Risk classification</p>
          <div className="risk-value"><RiskBadge risk={current.risk} /></div>
          <p className="stat-foot">Based on illustrative values</p>
        </article>
        <StatCard title="Rainfall" value={current.rainfall} unit=" mm" note="Sample reading" icon={CloudRain} color="teal" />
        <StatCard title="Water level" value={current.water.toFixed(1)} unit=" m" note="Sample reading" icon={Waves} color="purple" />
      </section>

      <section className="main-grid">
        <article className="panel map-panel">
          <div className="panel-heading">
            <div><h2>Flood-risk map</h2><p>Illustrative zone-level risk visualization</p></div>
            <button className="icon-button" title="Map information"><Info size={17} /></button>
          </div>
          <RiskMap location={selected} />
        </article>

        <article className="panel explain-panel">
          <div className="panel-heading">
            <div><h2>Why this prediction?</h2><p>Example of a future SHAP explanation</p></div>
            <span className="ai-icon"><Zap size={16} /></span>
          </div>
          <div className="explain-intro">
            <span className="explain-check"><ShieldCheck size={20} /></span>
            <div><strong>Model explanation preview</strong><p>Illustrative factor contributions only</p></div>
          </div>
          {[
            { name: "Recent rainfall", value: 82, text: "High", color: "bar-blue" },
            { name: "Water-level change", value: 65, text: "Elevated", color: "bar-teal" },
            { name: "Terrain & elevation", value: 44, text: "Location dependent", color: "bar-purple" },
            { name: "Humidity", value: 28, text: "Supporting factor", color: "bar-amber" },
          ].map(f => (
            <div className="factor" key={f.name}>
              <div className="factor-label"><span>{f.name}</span><small>{f.text}</small></div>
              <div className="factor-track"><div className={`factor-fill ${f.color}`} style={{ width: `${f.value}%` }} /></div>
            </div>
          ))}
          <div className="explain-foot"><Info size={15} /> These bars are illustrative, not actual SHAP values.</div>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div><h2>Environmental trend</h2><p>Illustrative rainfall and relative risk trend</p></div>
            <span className="chart-tag"><Activity size={14} /> Sample series</span>
          </div>
          <div className="chart-legend"><span><i className="legend-line rain-line" />Rainfall (mm)</span><span><i className="legend-line risk-line" />Relative risk index</span></div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1685e5" stopOpacity={0.2}/><stop offset="100%" stopColor="#1685e5" stopOpacity={0}/></linearGradient>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16b8a6" stopOpacity={0.15}/><stop offset="100%" stopColor="#16b8a6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke="#eaf0f6" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#8190a5", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8190a5", fontSize: 11 }} />
                <Tooltip contentStyle={{ border: "1px solid #e7edf4", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#1685e5" strokeWidth={2.5} fill="url(#rainFill)" />
                <Area type="monotone" dataKey="risk" name="Relative risk index" stroke="#16b8a6" strokeWidth={2.5} fill="url(#riskFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel history-panel">
          <div className="panel-heading">
            <div><h2>Location overview</h2><p>Sample comparison across locations</p></div>
            <History size={18} className="heading-icon" />
          </div>
          <div className="location-list">
            {locations.map(l => (
              <button className={`location-item ${l.name === selected ? "selected" : ""}`} key={l.name} onClick={() => setSelected(l.name)}>
                <span className={`location-avatar ${l.risk.toLowerCase().replace(" ", "-")}`}><MapPin size={16} /></span>
                <span className="location-details"><strong>{l.name}</strong><small>{l.region}</small></span>
                <span className="location-risk"><RiskBadge risk={l.risk}/><small>{l.probability}% sample</small></span>
              </button>
            ))}
          </div>
          <p className="list-foot"><Info size={13}/> Not live or official risk information.</p>
        </article>
      </section>

      <footer className="footer"><span>🌊 ClariFlood <span className="footer-muted">· Explainable flood-risk research prototype</span></span><span><Clock3 size={14}/> Demo data · Not an official warning service</span></footer>
    </>
  );
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const locationCoords = {
  Bengaluru: { latitude: "12.9716", longitude: "77.5946" },
  Chennai: { latitude: "13.0827", longitude: "80.2707" },
  Kochi: { latitude: "9.9312", longitude: "76.2673" },
  Hyderabad: { latitude: "17.3850", longitude: "78.4867" },
};

const NUMERIC_FIELDS = [
  "latitude", "longitude", "elevation_m", "drainage_density_km_per_km2",
  "storm_drain_proximity_m", "historical_rainfall_intensity_mm_hr", "return_period_years",
];

function PredictionPage({ selected, setSelected }) {
  const [form, setForm] = useState({
    latitude: "12.9716",
    longitude: "77.5946",
    elevation_m: "10",
    land_use: "Residential",
    soil_group: "D",
    drainage_density_km_per_km2: "4.5",
    storm_drain_proximity_m: "150",
    storm_drain_type: "CurbInlet",
    historical_rainfall_intensity_mm_hr: "80",
    return_period_years: "50",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function chooseLocation(name) {
    setSelected(name);
    const c = locationCoords[name];
    if (c) setForm(f => ({ ...f, ...c }));
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    const payload = {};
    for (const [key, value] of Object.entries(form)) {
      if (value === "") payload[key] = null;
      else payload[key] = NUMERIC_FIELDS.includes(key) ? Number(value) : value;
    }

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.detail)
            ? "Please fill latitude, longitude, rainfall intensity and return period."
            : data.detail || "Request failed"
        );
      }
      setResult(data);
    } catch (e) {
      setError(
        e.message === "Failed to fetch"
          ? "Cannot reach the backend. Is the server running on port 8000?"
          : e.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">PREDICTION WORKSPACE</div>
          <h1>Explore a risk scenario</h1>
          <p className="subtitle">Enter site conditions and get a prediction from the trained XGBoost model.</p>
        </div>
      </div>
      <div className="prototype-notice">
        <Info size={17} />
        <span>Results come from the project's trained model. This is an academic prototype, not an official warning service.</span>
      </div>
      <div className="prediction-grid">
        <article className="panel form-panel">
          <h2>Site inputs</h2>
          <p className="form-subtitle">Pick a location to fill coordinates, then adjust the values.</p>

          <label>Location preset
            <select value={selected} onChange={e => chooseLocation(e.target.value)}>
              {locations.map(l => <option key={l.name} value={l.name}>{l.name}, {l.region}</option>)}
            </select>
          </label>
          <label>Latitude
            <input type="number" step="any" value={form.latitude} onChange={e => update("latitude", e.target.value)} />
          </label>
          <label>Longitude
            <input type="number" step="any" value={form.longitude} onChange={e => update("longitude", e.target.value)} />
          </label>
          <label>Elevation (m)
            <input type="number" step="any" value={form.elevation_m} onChange={e => update("elevation_m", e.target.value)} />
          </label>
          <label>Land use
            <select value={form.land_use} onChange={e => update("land_use", e.target.value)}>
              <option value="">Unknown</option>
              {["Institutional", "Residential", "Industrial", "Roads", "Commercial", "Green", "Water", "Mixed", "Informal"]
                .map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Soil group
            <select value={form.soil_group} onChange={e => update("soil_group", e.target.value)}>
              <option value="">Unknown</option>
              {["A", "B", "C", "D"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Drainage density (km/km²)
            <input type="number" step="any" min="0" value={form.drainage_density_km_per_km2} onChange={e => update("drainage_density_km_per_km2", e.target.value)} />
          </label>
          <label>Storm drain distance (m)
            <input type="number" step="any" min="0" value={form.storm_drain_proximity_m} onChange={e => update("storm_drain_proximity_m", e.target.value)} />
          </label>
          <label>Storm drain type
            <select value={form.storm_drain_type} onChange={e => update("storm_drain_type", e.target.value)}>
              <option value="">Unknown</option>
              {["CurbInlet", "OpenChannel", "Manhole", "GratedInlet"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Rainfall intensity (mm/hr)
            <input type="number" step="any" min="0" value={form.historical_rainfall_intensity_mm_hr} onChange={e => update("historical_rainfall_intensity_mm_hr", e.target.value)} />
          </label>
          <label>Return period (years)
            <input type="number" step="any" min="1" value={form.return_period_years} onChange={e => update("return_period_years", e.target.value)} />
          </label>

          <button className="primary-btn full-btn" onClick={analyze} disabled={loading}>
            <Activity size={17} /> {loading ? "Analyzing..." : "Predict flood risk"}
          </button>
        </article>

        <article className="panel result-panel">
          <div className="panel-heading">
            <div><h2>Assessment result</h2><p>Model output</p></div>
            <span className="ai-icon"><Zap size={16} /></span>
          </div>

          {error && <div className="result-note"><Info size={15} /> {error}</div>}

          {!result && !error && (
            <div className="empty-result">
              <span className="empty-icon"><CloudRain size={30} /></span>
              <h3>Ready to explore?</h3>
              <p>Fill in the site inputs and run the prediction.</p>
            </div>
          )}

          {result && (
            <div className="demo-result">
              <span className="result-caption">PREDICTED RISK LEVEL</span>
              <div className="result-number">{Math.round(result.confidence * 100)}<small>% confidence</small></div>
              <RiskBadge risk={result.risk_level} />
              <div className="result-meter"><div style={{ width: `${Math.round(result.confidence * 100)}%` }} /></div>
              <p>
                {Object.entries(result.probabilities).map(([name, p]) => (
                  <span key={name} style={{ display: "block" }}>{name}: {(p * 100).toFixed(1)}%</span>
                ))}
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function HistoryPage() {
  return (
    <section className="page-section">
      <div className="welcome-row"><div><div className="eyebrow">RECORDS & TRENDS</div><h1>Prediction history</h1><p className="subtitle">Explore the structure planned for saved assessments.</p></div></div>
      <div className="prototype-notice"><Info size={17}/><span>Sample records only. Persistent history will become available after database integration.</span></div>
      <article className="panel table-panel">
        <div className="panel-heading"><div><h2>Recent assessments</h2><p>Illustrative records for UI development</p></div><History size={18} className="heading-icon"/></div>
        <div className="table-wrap"><table><thead><tr><th>Location</th><th>Probability</th><th>Risk</th><th>Rainfall</th><th>Status</th></tr></thead><tbody>
          {locations.map(l=><tr key={l.name}><td><strong>{l.name}</strong><small>{l.region}</small></td><td>{l.probability}%</td><td><RiskBadge risk={l.risk}/></td><td>{l.rainfall} mm</td><td><span className="sample-status">Sample</span></td></tr>)}
        </tbody></table></div>
      </article>
    </section>
  );
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [selected, setSelected] = useState("Bengaluru");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(false);

  function navigate(next) {
    setPage(next);
    setMobileOpen(false);
  }

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Predictions", icon: Activity },
    { name: "History", icon: History },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Waves size={23}/></span><span>Clari<span className="brand-accent">Flood</span><small>RISK INTELLIGENCE</small></span></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>{navItems.map(({name, icon: Icon})=><button key={name} className={`nav-link ${page === name ? "active" : ""}`} onClick={()=>navigate(name)}><Icon size={18}/><span>{name}</span>{name==="History" && <span className="nav-soon">DEMO</span>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="sidebar-card"><span className="sidebar-card-icon"><ShieldCheck size={19}/></span><strong>Built for awareness</strong><p>Explainable insights for flood-risk research.</p></div>
          <button className="nav-link" onClick={()=>setNotice(!notice)}><Settings size={18}/><span>About this prototype</span></button>
          {notice && <p className="sidebar-note">ClariFlood is an academic prototype. Sample data is not suitable for emergency decisions.</p>}
          <div className="profile"><div className="profile-avatar">CF</div><div><strong>ClariFlood Team</strong><small>Mini project · Review 2</small></div></div>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-overlay" aria-label="Close menu" onClick={()=>setMobileOpen(false)}/>}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={()=>setMobileOpen(!mobileOpen)}><Menu size={21}/></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-sep">/</span><strong>{page}</strong></div>
          <div className="topbar-right">
            <span className="demo-pill"><span/> DEMO MODE</span>
            <button className="top-icon" title="Notifications" onClick={()=>setNotice(!notice)}><Bell size={18}/><i/></button>
            <div className="top-date"><span>PROJECT ENVIRONMENT</span><strong><span className="green-dot"/> Prototype active</strong></div>
          </div>
        </header>
        <div className="content-wrap">
          {page==="Dashboard" && <Dashboard selected={selected} setSelected={setSelected} onAnalyze={()=>navigate("Predictions")}/>}
          {page==="Predictions" && <PredictionPage selected={selected} setSelected={setSelected}/>}
          {page==="History" && <HistoryPage/>}
        </div>
      </main>
    </div>
  );
}
