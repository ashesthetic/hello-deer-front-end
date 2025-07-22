import React from 'react';
import { chartContainerClasses, chartLoadingSkeleton } from '../../utils/chartConfigs';

export interface ChartCardProps {
  title: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ 
  title, 
  subtitle, 
  loading = false, 
  error = null, 
  children, 
  className = '' 
}: ChartCardProps) {
  if (loading) {
    return (
      <div className={`${chartContainerClasses.container} ${className}`}>
        <div className="loading-skeleton">
          <div className={chartLoadingSkeleton.title}></div>
          <div className={chartLoadingSkeleton.content}></div>
          <div className={chartLoadingSkeleton.text}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${chartContainerClasses.container} ${className}`}>
        <h3 className={chartContainerClasses.title}>{title}</h3>
        {subtitle && <p className={chartContainerClasses.subtitle}>{subtitle}</p>}
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${chartContainerClasses.container} ${className}`}>
      <h3 className={chartContainerClasses.title}>{title}</h3>
      {subtitle && <p className={chartContainerClasses.subtitle}>{subtitle}</p>}
      <div className={chartContainerClasses.wrapper}>
        {children}
      </div>
    </div>
  );
}

// Loading skeleton for charts
export function ChartSkeleton({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className={chartContainerClasses.container}>
      {title && <h3 className={chartContainerClasses.title}>{title}</h3>}
      {subtitle && <p className={chartContainerClasses.subtitle}>{subtitle}</p>}
      <div className="loading-skeleton">
        <div className={chartLoadingSkeleton.content}></div>
      </div>
    </div>
  );
}

// Error state for charts
export function ChartError({ 
  title, 
  subtitle, 
  error, 
  onRetry 
}: { 
  title?: string; 
  subtitle?: string; 
  error: string; 
  onRetry?: () => void;
}) {
  return (
    <div className={chartContainerClasses.container}>
      {title && <h3 className={chartContainerClasses.title}>{title}</h3>}
      {subtitle && <p className={chartContainerClasses.subtitle}>{subtitle}</p>}
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
} 