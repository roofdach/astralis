"use client"

import * as React from "react"
import { ResponsiveContainer, Tooltip } from "recharts"

const ChartContext = React.createContext({
  config: {},
})

function useChart() {
  const context = React.useContext(ChartContext)
  
  if (!context) {
    throw new Error("Chart components must be used within a ChartContainer")
  }
  
  return context
}

const ChartContainer = React.forwardRef(
  ({ config = {}, children, className, ...props }, ref) => {
    const id = React.useId()
    const uniqueId = React.useMemo(() => `chart-${id}`, [id])
    
    const chartId = `chart-${uniqueId}`
    const cssVars = React.useMemo(() => {
      const vars = {}
      Object.entries(config).forEach(([key, value]) => {
        if (value?.color) {
          vars[`--color-${key}`] = value.color
        }
      })
      return vars
    }, [config])

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={uniqueId}
          ref={ref}
          className={className}
          style={cssVars}
          {...props}
        >
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltipContent = React.forwardRef(
  ({ active, payload, label, indicator = "dot", hideLabel = false, hideIndicator = false, formatter }, ref) => {
    const { config } = useChart()

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: 'var(--chart-tooltip-bg)',
          border: '1px solid var(--chart-tooltip-border)',
          borderRadius: 'var(--radius, 0.5rem)',
          padding: '0.75rem',
          color: 'var(--foreground)',
        }}
      >
        {!hideLabel && label && (
          <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {label}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {payload.map((item, index) => {
            const key = `${item.dataKey}-${index}`
            const itemConfig = config[item.dataKey]
            const indicatorColor = `var(--color-${item.dataKey})`

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                {!hideIndicator && (
                  <div
                    style={{
                      width: indicator === "line" ? "2px" : "0.5rem",
                      height: indicator === "line" ? "0.5rem" : "0.5rem",
                      borderRadius: indicator === "line" ? "1px" : "100%",
                      backgroundColor: indicatorColor,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', flex: 1 }}>
                  {itemConfig?.label ?? item.dataKey}
                </span>
                {formatter ? (
                  formatter(item.value, item.dataKey, item)
                ) : (
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartTooltip = ({ children, ...props }) => {
  return (
    <Tooltip
      {...props}
      content={<ChartTooltipContent>{children}</ChartTooltipContent>}
    />
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  useChart,
}
