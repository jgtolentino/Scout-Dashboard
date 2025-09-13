/**
 * ScoreChart.jsx
 * 
 * A component for visualizing prompt scores and metrics.
 * Displays scores in a radar or bar chart format.
 */

import React, { useEffect, useRef } from 'react';

// Simple chart rendering using canvas
const ScoreChart = ({ scores, type = 'radar' }) => {
  const canvasRef = useRef(null);
  
  // Default scores if none provided
  const defaultScores = {
    clarity: 0,
    specificity: 0,
    completeness: 0,
    conciseness: 0,
    effectiveness: 0
  };
  
  // Combine provided scores with defaults
  const chartScores = { ...defaultScores, ...scores };
  
  // Colors for the chart
  const colors = {
    fill: 'rgba(75, 192, 192, 0.2)',
    stroke: 'rgba(75, 192, 192, 1)',
    text: '#333',
    grid: '#ddd'
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (type === 'radar') {
      drawRadarChart(ctx, canvas.width, canvas.height, chartScores, colors);
    } else {
      drawBarChart(ctx, canvas.width, canvas.height, chartScores, colors);
    }
  }, [scores, type]);
  
  return (
    <div className="score-chart">
      <canvas ref={canvasRef} width={400} height={300}></canvas>
    </div>
  );
};

// Function to draw a radar chart
function drawRadarChart(ctx, width, height, scores, colors) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.8;
  
  // Get score keys and values
  const categories = Object.keys(scores);
  const values = Object.values(scores);
  const numCategories = categories.length;
  
  // Draw grid and labels
  ctx.strokeStyle = colors.grid;
  ctx.fillStyle = colors.text;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw concentric circles
  for (let i = 1; i <= 5; i++) {
    const circleRadius = radius * (i / 5);
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw score label on the top
    if (i > 0) {
      ctx.fillText(i.toString(), centerX, centerY - circleRadius - 5);
    }
  }
  
  // Draw category axes and labels
  for (let i = 0; i < numCategories; i++) {
    const angle = (i * 2 * Math.PI / numCategories) - (Math.PI / 2);
    const axisX = centerX + Math.cos(angle) * radius;
    const axisY = centerY + Math.sin(angle) * radius;
    
    // Draw axis
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(axisX, axisY);
    ctx.stroke();
    
    // Draw label
    const labelX = centerX + Math.cos(angle) * (radius + 20);
    const labelY = centerY + Math.sin(angle) * (radius + 20);
    ctx.fillText(categories[i], labelX, labelY);
  }
  
  // Draw data
  ctx.beginPath();
  for (let i = 0; i < numCategories; i++) {
    const angle = (i * 2 * Math.PI / numCategories) - (Math.PI / 2);
    const value = values[i];
    const pointRadius = radius * (value / 5);
    const x = centerX + Math.cos(angle) * pointRadius;
    const y = centerY + Math.sin(angle) * pointRadius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  // Close the path
  ctx.closePath();
  
  // Fill and stroke
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

// Function to draw a bar chart
function drawBarChart(ctx, width, height, scores, colors) {
  const padding = { top: 30, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Get score keys and values
  const categories = Object.keys(scores);
  const values = Object.values(scores);
  const numCategories = categories.length;
  
  // Calculate bar width
  const barWidth = chartWidth / numCategories * 0.8;
  const barSpacing = chartWidth / numCategories * 0.2;
  
  // Draw axes
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  
  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();
  
  // Draw y-axis labels and grid lines
  ctx.fillStyle = colors.text;
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i <= 5; i++) {
    const y = height - padding.bottom - (i / 5) * chartHeight;
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    
    // Label
    ctx.fillText(i.toString(), padding.left - 5, y);
  }
  
  // Draw bars and x-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  for (let i = 0; i < numCategories; i++) {
    const value = values[i];
    const barHeight = (value / 5) * chartHeight;
    const x = padding.left + (i * chartWidth / numCategories) + (barSpacing / 2);
    const y = height - padding.bottom - barHeight;
    
    // Draw bar
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.rect(x, y, barWidth, barHeight);
    ctx.fill();
    ctx.stroke();
    
    // Draw value on top of bar
    ctx.fillStyle = colors.text;
    ctx.fillText(value.toString(), x + barWidth / 2, y - 15);
    
    // Draw category label
    ctx.fillText(
      categories[i], 
      x + barWidth / 2, 
      height - padding.bottom + 5
    );
  }
}

export default ScoreChart;