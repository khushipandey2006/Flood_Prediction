import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Info } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const CLASSES = ["High", "Moderate", "Low"];

export default function FeatureImportanceChart() {
  const [riskClass, setRiskClass] = useState("High");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${API_URL}/feature-importance?risk_class=${riskClass}`)
      .then(res => {
        if (!res.ok) throw new Error("Could not load feature importance");
        return res.json();
      })
      .then(json => {
        if (!cancelled) {
          setData(json.features.map(f => ({
            label: f.label,
            importance: f.importance,
            share: f.share,
          })));
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(
            e.message === "Failed to fetch"
              ? "Cannot reach the backend. Is the server running on port 8000?"
              : e.message
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [riskClass]);

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <h2>Overall feature importance</h2>
          <p>Which inputs matter most to the model across the dataset (from the trained model)</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {CLASSES.map(c => (
            <button
              key={c}
              className="outline-btn"
              onClick={() => setRiskClass(c)}
              style={c === riskClass ? { fontWeight: 700 } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="result-note"><Info size={15} /> {error}</div>}
      {loading && !error && <p>Loading...</p>}

      {!loading && !error && data.length > 0 && (
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 20, bottom: 5 }}>
              <CartesianGrid stroke="#eaf0f6" strokeDasharray="4 5" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#8190a5", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8190a5", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name, item) => [`${value} (${item.payload.share}% of total)`, "Mean |SHAP|"]}
                contentStyle={{ border: "1px solid #e7edf4", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="importance" fill="#1685e5" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="explain-foot">
        <Info size={15} /> Average absolute SHAP value over a sample of the dataset, for the selected risk class. This chart uses real model output and describes the model overall, not one prediction.
      </div>
    </article>
  );
}