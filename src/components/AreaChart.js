"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart"

const data = [
  { month: "Jan", desktop: 186 },
  { month: "Feb", desktop: 305 },
  { month: "Mar", desktop: 237 },
  { month: "Apr", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "Jun", desktop: 214 },
  { month: "Jul", desktop: 305 },
  { month: "Aug", desktop: 186 },
  { month: "Sep", desktop: 305 },
  { month: "Oct", desktop: 237 },
  { month: "Nov", desktop: 73 },
  { month: "Dec", desktop: 209 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-2)",
  },
}

export default function ThemedAreaChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: 0,
          right: 12,
          top: 12,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-desktop)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-desktop)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid 
        strokeDasharray="3 3"        
        stroke="var(--chart-grid)"   
        vertical={true}               
        horizontal={true}             
        strokeOpacity={0.3}           
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Area
          dataKey="desktop"
          type="natural"
          fill="url(#fillDesktop)"
          stroke="var(--color-desktop)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
