"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PerformanceRow } from "@/lib/dashboard/revenue-intelligence";

type ConversionBarChartProps = {
  rows: PerformanceRow[];
  limit?: number;
};

const BAR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
];

export function ConversionBarChart({ rows, limit = 6 }: ConversionBarChartProps) {
  const data = rows
    .slice(0, limit)
    .map((row) => ({
      name: row.label,
      conversionRate: row.conversionRate,
      leads: row.leads,
      bookings: row.bookings,
    }));

  if (data.length === 0) {
    return null;
  }

  const chartHeight = Math.max(140, data.length * 44);

  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
            formatter={(value) => [`${value}%`, "Conversion"]}
          />
          <Bar dataKey="conversionRate" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
            <LabelList
              dataKey="conversionRate"
              position="right"
              formatter={(value) => `${value}%`}
              style={{ fontSize: 12, fill: "#475569" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
