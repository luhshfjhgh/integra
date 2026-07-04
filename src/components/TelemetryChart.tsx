import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { Telemetry } from "@/lib/supabase";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export function TelemetryChart({ data }: { data: Telemetry[] }) {
  const sorted = [...data].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const labels = sorted.map((d) => new Date(d.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Temperatura (°C)",
            data: sorted.map((d) => d.temperatura),
            borderColor: "rgb(59 130 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: "Umidade (%)",
            data: sorted.map((d) => d.umidade),
            borderColor: "rgb(34 197 94)",
            backgroundColor: "rgba(34, 197, 94, 0.08)",
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
        },
        scales: {
          y: { grid: { color: "rgba(148,163,184,0.15)" }, ticks: { color: "rgb(100 116 139)" } },
          x: { grid: { display: false }, ticks: { color: "rgb(100 116 139)", maxTicksLimit: 8 } },
        },
      }}
    />
  );
}