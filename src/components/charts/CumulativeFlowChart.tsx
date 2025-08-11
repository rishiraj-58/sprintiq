'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FlowData {
  date: string;
  backlog: number;
  todo: number;
  inProgress: number;
  done: number;
}

interface CumulativeFlowChartProps {
  flowData: FlowData[];
}

export function CumulativeFlowChart({ flowData }: CumulativeFlowChartProps) {
  if (!flowData || flowData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Flow Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No flow data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...flowData.map(d => d.backlog + d.todo + d.inProgress + d.done));
  const chartHeight = 200;
  const chartWidth = 400;
  
  // Generate SVG path for each status area
  const generateAreaPath = (data: FlowData[], accessor: (d: FlowData, prevCumulative: number) => number) => {
    let points: string[] = [];
    let prevCumulative = 0;
    
    // Forward pass
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth + 50;
      const cumulative = accessor(d, prevCumulative);
      const y = chartHeight - (cumulative / maxTotal) * chartHeight + 20;
      points.push(`${x},${y}`);
      prevCumulative = cumulative;
    });
    
    // Backward pass for area
    prevCumulative = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      const x = (i / (data.length - 1)) * chartWidth + 50;
      const prevTotal = i === 0 ? 0 : 
        accessor(data[i-1], 0); // Get the previous layer's value
      const y = chartHeight - (prevTotal / maxTotal) * chartHeight + 20;
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Cumulative Flow Diagram
          <div className="text-sm font-normal text-muted-foreground">
            Task flow over time
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 w-full">
          <svg className="w-full h-full" viewBox="0 0 500 240">
            {/* Grid lines */}
            <defs>
              <pattern id="flow-grid" width="50" height="24" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 24" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#flow-grid)" />
            
            {/* Y-axis labels */}
            {[0, Math.floor(maxTotal * 0.25), Math.floor(maxTotal * 0.5), Math.floor(maxTotal * 0.75), maxTotal].map((value, index) => (
              <g key={value}>
                <text 
                  x="25" 
                  y={220 - (value / maxTotal) * 200} 
                  fontSize="10" 
                  fill="#6b7280" 
                  textAnchor="end"
                >
                  {value}
                </text>
              </g>
            ))}
            
            {/* Stacked areas */}
            {/* Done area (bottom layer) */}
            <polygon
              points={flowData.map((d, i) => {
                const x = (i / (flowData.length - 1)) * chartWidth + 50;
                const y = chartHeight - (d.done / maxTotal) * chartHeight + 20;
                return `${x},${y}`;
              }).concat([
                `${(flowData.length - 1) / (flowData.length - 1) * chartWidth + 50},${chartHeight + 20}`,
                `50,${chartHeight + 20}`
              ]).join(' ')}
              fill="#22c55e"
              opacity="0.7"
            />
            
            {/* In Progress area */}
            <polygon
              points={flowData.map((d, i) => {
                const x = (i / (flowData.length - 1)) * chartWidth + 50;
                const y = chartHeight - ((d.done + d.inProgress) / maxTotal) * chartHeight + 20;
                return `${x},${y}`;
              }).concat(
                flowData.slice().reverse().map((d, i) => {
                  const reverseIndex = flowData.length - 1 - i;
                  const x = (reverseIndex / (flowData.length - 1)) * chartWidth + 50;
                  const y = chartHeight - (d.done / maxTotal) * chartHeight + 20;
                  return `${x},${y}`;
                })
              ).join(' ')}
              fill="#3b82f6"
              opacity="0.7"
            />
            
            {/* To Do area */}
            <polygon
              points={flowData.map((d, i) => {
                const x = (i / (flowData.length - 1)) * chartWidth + 50;
                const y = chartHeight - ((d.done + d.inProgress + d.todo) / maxTotal) * chartHeight + 20;
                return `${x},${y}`;
              }).concat(
                flowData.slice().reverse().map((d, i) => {
                  const reverseIndex = flowData.length - 1 - i;
                  const x = (reverseIndex / (flowData.length - 1)) * chartWidth + 50;
                  const y = chartHeight - ((d.done + d.inProgress) / maxTotal) * chartHeight + 20;
                  return `${x},${y}`;
                })
              ).join(' ')}
              fill="#f59e0b"
              opacity="0.7"
            />
            
            {/* Backlog area (top layer) */}
            <polygon
              points={flowData.map((d, i) => {
                const x = (i / (flowData.length - 1)) * chartWidth + 50;
                const total = d.backlog + d.todo + d.inProgress + d.done;
                const y = chartHeight - (total / maxTotal) * chartHeight + 20;
                return `${x},${y}`;
              }).concat(
                flowData.slice().reverse().map((d, i) => {
                  const reverseIndex = flowData.length - 1 - i;
                  const x = (reverseIndex / (flowData.length - 1)) * chartWidth + 50;
                  const y = chartHeight - ((d.done + d.inProgress + d.todo) / maxTotal) * chartHeight + 20;
                  return `${x},${y}`;
                })
              ).join(' ')}
              fill="#94a3b8"
              opacity="0.7"
            />
            
            {/* Date labels */}
            {flowData.map((d, i) => {
              if (i % Math.ceil(flowData.length / 6) === 0) { // Show every 6th date
                const x = (i / (flowData.length - 1)) * chartWidth + 50;
                return (
                  <text
                    key={i}
                    x={x}
                    y={235}
                    fontSize="9"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                );
              }
              return null;
            })}
          </svg>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-400 opacity-70"></div>
            <span className="text-muted-foreground">Backlog</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 opacity-70"></div>
            <span className="text-muted-foreground">To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 opacity-70"></div>
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 opacity-70"></div>
            <span className="text-muted-foreground">Done</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
