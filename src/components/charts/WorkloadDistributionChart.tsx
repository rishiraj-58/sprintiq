'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MemberWorkload {
  id: string;
  name: string;
  avatar?: string;
  completedTasks: number;
  completedPoints: number;
  activeTasks: number;
  activePoints: number;
}

interface WorkloadDistributionChartProps {
  workloadData: MemberWorkload[];
}

export function WorkloadDistributionChart({ workloadData }: WorkloadDistributionChartProps) {
  if (!workloadData || workloadData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No workload data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCompletedPoints = workloadData.reduce((sum, member) => sum + member.completedPoints, 0);
  const totalActivePoints = workloadData.reduce((sum, member) => sum + member.activePoints, 0);
  const maxMemberPoints = Math.max(...workloadData.map(m => m.completedPoints + m.activePoints));

  // Generate colors for members
  const colors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Workload Distribution
          <div className="text-sm font-normal text-muted-foreground">
            Story points by team member
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Generate pie slices */}
                {workloadData.map((member, index) => {
                  const percentage = member.completedPoints / totalCompletedPoints;
                  const angle = percentage * 360;
                  
                  // Calculate the start angle (sum of previous slices)
                  const startAngle = workloadData.slice(0, index).reduce((sum, m) => {
                    return sum + (m.completedPoints / totalCompletedPoints) * 360;
                  }, 0);
                  
                  const endAngle = startAngle + angle;
                  
                  // Convert to radians
                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);
                  
                  const radius = 80;
                  const centerX = 100;
                  const centerY = 100;
                  
                  const x1 = centerX + radius * Math.cos(startRad);
                  const y1 = centerY + radius * Math.sin(startRad);
                  const x2 = centerX + radius * Math.cos(endRad);
                  const y2 = centerY + radius * Math.sin(endRad);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  return (
                    <path
                      key={member.id}
                      d={pathData}
                      fill={colors[index % colors.length]}
                      opacity="0.8"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
                
                {/* Center circle for donut effect */}
                <circle
                  cx="100"
                  cy="100"
                  r="30"
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                
                {/* Center text */}
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                  fontWeight="500"
                >
                  Total
                </text>
                <text
                  x="100"
                  y="110"
                  textAnchor="middle"
                  fontSize="14"
                  fill="#1f2937"
                  fontWeight="600"
                >
                  {totalCompletedPoints}
                </text>
              </svg>
            </div>
          </div>

          {/* Member List with Progress Bars */}
          <div className="space-y-3">
            {workloadData.map((member, index) => {
              const completedPercentage = totalCompletedPoints > 0 ? (member.completedPoints / totalCompletedPoints) * 100 : 0;
              const totalMemberPoints = member.completedPoints + member.activePoints;
              const activePercentage = totalMemberPoints > 0 ? (member.activePoints / totalMemberPoints) * 100 : 0;
              
              return (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{member.completedPoints} pts completed</div>
                      <div className="text-xs text-muted-foreground">
                        {member.activeTasks} active tasks ({member.activePoints} pts)
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar showing completed vs active work */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500"
                        style={{ 
                          width: `${totalMemberPoints > 0 ? (member.completedPoints / totalMemberPoints) * 100 : 0}%` 
                        }}
                      />
                      <div 
                        className="bg-blue-400"
                        style={{ 
                          width: `${activePercentage}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Completed Work</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-muted-foreground">Active Work</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              {totalActivePoints} points in progress
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
