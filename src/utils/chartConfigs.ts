// Common Chart Configurations for Hello Deer Panel

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Edmonton'
  });
};

export const formatShortDate = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Edmonton'
  });
  const dayStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'America/Edmonton'
  });
  return `${dateStr}\n${dayStr}`;
};

export const formatWeek = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Edmonton'
  });
};

// Common chart options
export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 50,
      bottom: 20,
      left: 15,
      right: 15
    }
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const value = parseFloat(context.parsed.y) || 0;
          return formatCurrency(value);
        }
      }
    },
    datalabels: {
      display: true,
      color: '#374151',
      font: {
        weight: 'bold' as const,
        size: 9
      },
      formatter: function(value: any) {
        const numValue = parseFloat(value) || 0;
        return formatCurrency(numValue);
      },
      anchor: 'end' as const,
      align: 'top' as const,
      offset: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 3,
      padding: {
        top: 1,
        bottom: 1,
        left: 3,
        right: 3
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#6B7280',
        maxRotation: 45,
        minRotation: 45
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#E5E7EB',
      },
      ticks: {
        color: '#6B7280',
        stepSize: 500,
        callback: function(value: any) {
          const numValue = parseFloat(value) || 0;
          return formatCurrency(numValue);
        }
      },
    },
  },
};

// Line chart specific options
export const lineChartOptions = {
  ...commonChartOptions,
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 4,
      hoverRadius: 6,
    },
  },
};

// Bar chart specific options
export const barChartOptions = {
  ...commonChartOptions,
  plugins: {
    ...commonChartOptions.plugins,
    datalabels: {
      ...commonChartOptions.plugins.datalabels,
      anchor: 'end' as const,
      align: 'top' as const,
    }
  }
};

// Common dataset configurations
export const createLineDataset = (label: string, data: number[], color: string) => ({
  label,
  data,
  borderColor: color,
  backgroundColor: color + '20', // 20% opacity
  borderWidth: 2,
  fill: true,
  tension: 0.4,
  pointBackgroundColor: color,
  pointBorderColor: '#fff',
  pointBorderWidth: 2,
  pointRadius: 4,
  pointHoverRadius: 6,
});

export const createBarDataset = (label: string, data: number[], color: string) => ({
  label,
  data,
  backgroundColor: color,
  borderColor: color,
  borderWidth: 1,
  borderRadius: 4,
});

// Top 3 highlighting for bar charts
export const createHighlightedBarDataset = (
  label: string, 
  data: number[], 
  color: string,
  highlightColors: string[] = ['#FF6B6B', '#4ECDC4', '#45B7D1']
) => {
  // Find the top 3 values and their indices
  const dataWithIndices = data.map((value, index) => ({ value, index }));
  const sortedByValue = [...dataWithIndices].sort((a, b) => b.value - a.value);
  const top3Indices = sortedByValue.slice(0, 3).map(item => item.index);
  
  // Create background colors array
  const backgroundColors = data.map((_, index) => {
    if (top3Indices.includes(index)) {
      const top3Rank = top3Indices.indexOf(index);
      return highlightColors[top3Rank] || color;
    }
    return color;
  });

  return {
    label,
    data,
    backgroundColor: backgroundColors,
    borderColor: backgroundColors,
    borderWidth: 1,
    borderRadius: 4,
  };
};

// Loading skeleton component configuration
export const chartLoadingSkeleton = {
  title: 'h-4 bg-gray-200 rounded w-1/2 mb-4',
  content: 'h-32 bg-gray-200 rounded mb-4',
  text: 'h-4 bg-gray-200 rounded w-1/4'
};

// Chart container classes
export const chartContainerClasses = {
  container: 'bg-white rounded-lg shadow-lg p-6',
  title: 'text-lg font-semibold text-gray-900 mb-2',
  subtitle: 'text-sm text-gray-600 mb-4',
  wrapper: 'relative h-64'
}; 