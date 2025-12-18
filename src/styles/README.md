# Centralized Styling System

This document explains the centralized styling system implemented for the Hello Deer Panel React application to ensure consistency across all components.

## Overview

The styling system consists of:
1. **Common CSS Classes** (`common.css`) - Centralized Tailwind CSS classes
2. **Reusable Components** (`components/common/`) - Standardized UI components
3. **Chart Configurations** (`utils/chartConfigs.ts`) - Common chart settings and utilities
4. **Utility Functions** - Shared formatting and helper functions

## File Structure

```
src/
├── styles/
│   ├── common.css              # Centralized CSS classes
│   └── README.md              # This documentation
├── components/
│   └── common/
│       ├── DataTable.tsx      # Reusable table component
│       └── ChartCard.tsx      # Reusable chart wrapper
├── utils/
│   └── chartConfigs.ts        # Chart configurations and utilities
└── index.tsx                  # Imports common.css
```

## Common CSS Classes

### Table Styles

```css
.table-container          # Main table wrapper with shadow and border
.table-wrapper           # Overflow container for horizontal scrolling
.table                   # Base table styles
.table-header            # Table header background
.table-header-cell       # Regular header cell
.table-header-cell-sortable # Sortable header cell with hover
.table-body              # Table body styles
.table-row               # Table row with hover effect
.table-cell              # Regular table cell
.table-cell-text         # Table cell for text content
.table-cell-bold         # Bold table cell
.table-cell-medium       # Medium weight table cell
.table-cell-actions      # Table cell for action buttons
.table-empty             # Empty state styling
```

### Button Styles

```css
.btn                     # Base button styles
.btn-primary            # Primary blue button
.btn-secondary          # Secondary gray button
.btn-success            # Success green button
.btn-danger             # Danger red button
.btn-warning            # Warning yellow button
.btn-outline            # Outline button
.btn-sm                 # Small button
.btn-lg                 # Large button

/* Action buttons in tables */
.btn-action             # Base action button
.btn-action-view        # View action (blue)
.btn-action-edit        # Edit action (green)
.btn-action-delete      # Delete action (red)
.btn-action-edit-alt    # Alternative edit action (indigo)
```

### Card Styles

```css
.card                   # Base card container
.card-header            # Card header section
.card-title             # Card title
.card-subtitle          # Card subtitle
.card-content           # Card content area
```

### Loading Styles

```css
.loading-spinner        # Animated loading spinner
.loading-container      # Loading container with centering
.loading-skeleton       # Skeleton loading animation
.loading-skeleton-title # Skeleton for titles
.loading-skeleton-content # Skeleton for content
.loading-skeleton-text  # Skeleton for text
```

### Badge Styles

```css
.badge                  # Base badge styles
.badge-blue             # Blue badge
.badge-green            # Green badge
.badge-red              # Red badge
.badge-yellow           # Yellow badge
.badge-gray             # Gray badge
```

### Form Styles

```css
.form-group             # Form group container
.form-label             # Form label
.form-input             # Text input
.form-textarea          # Textarea
.form-select            # Select dropdown
.form-error             # Error message
```

### Layout Styles

```css
.page-container         # Page wrapper
.page-content           # Page content container
.page-header            # Page header section
.page-title             # Page title
.page-subtitle          # Page subtitle
```

### Chart Styles

```css
.chart-container        # Chart card container
.chart-title            # Chart title
.chart-subtitle         # Chart subtitle
.chart-wrapper          # Chart wrapper with height
```

## Reusable Components

### DataTable Component

A standardized table component that handles:
- Consistent styling
- Loading states
- Empty states
- Sorting
- Action buttons

```tsx
import { DataTable, TableColumn, ActionButtons } from './common/DataTable';

const columns: TableColumn<YourType>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (item) => item.name
  },
  {
    key: 'actions',
    header: 'Actions',
    className: 'table-cell-actions',
    render: (item) => (
      <ActionButtons 
        actions={[
          { label: 'View', onClick: () => handleView(item), variant: 'view' },
          { label: 'Edit', onClick: () => handleEdit(item), variant: 'edit' },
          { label: 'Delete', onClick: () => handleDelete(item), variant: 'delete' }
        ]} 
      />
    )
  }
];

<DataTable
  data={items}
  columns={columns}
  loading={loading}
  emptyMessage="No items found."
  sortField={sortField}
  sortDirection={sortDirection}
  onSort={handleSort}
  rowKey={(item) => item.id}
/>
```

### ChartCard Component

A standardized chart wrapper that handles:
- Consistent chart styling
- Loading states
- Error states
- Title and subtitle

```tsx
import { ChartCard } from './common/ChartCard';

<ChartCard 
  title="Sales Trend"
  subtitle="Last 30 days"
  loading={loading}
  error={error}
>
  <Line data={chartData} options={lineChartOptions} />
</ChartCard>
```

## Chart Configurations

### Common Utilities

```tsx
import { 
  formatCurrency, 
  formatDate, 
  formatShortDate,
  formatWeek 
} from '../utils/chartConfigs';

// Format currency (CAD)
formatCurrency(1234.56); // "$1,234.56"

// Format dates
formatDate('2025-01-15'); // "Jan 15, 2025"
formatShortDate('2025-01-15'); // "Jan 15\nWed"
formatWeek('2025-01-15'); // "Jan 15"
```

### Chart Options

```tsx
import { 
  commonChartOptions,
  lineChartOptions,
  barChartOptions 
} from '../utils/chartConfigs';

// Use predefined options
<Line data={data} options={lineChartOptions} />
<Bar data={data} options={barChartOptions} />
```

### Dataset Creators

```tsx
import { 
  createLineDataset,
  createBarDataset,
  createHighlightedBarDataset 
} from '../utils/chartConfigs';

const lineData = createLineDataset('Sales', [100, 200, 300], '#3B82F6');
const barData = createBarDataset('Revenue', [100, 200, 300], '#10B981');
const highlightedData = createHighlightedBarDataset('Top Sales', [100, 200, 300], '#6B7280');
```

## Migration Guide

### Converting Existing Tables

1. **Replace custom table HTML with DataTable component**
2. **Define columns array with proper typing**
3. **Use ActionButtons component for action columns**
4. **Remove custom loading and empty states**

Before:
```tsx
<div className="overflow-x-auto">
  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
    {/* Custom table implementation */}
  </table>
</div>
```

After:
```tsx
<DataTable
  data={items}
  columns={columns}
  loading={loading}
  emptyMessage="No items found."
/>
```

### Converting Existing Charts

1. **Import chart configurations and utilities**
2. **Replace custom chart options with predefined ones**
3. **Use ChartCard component for consistent styling**
4. **Remove duplicate formatting functions**

Before:
```tsx
<div className="bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
  <div className="relative h-64">
    <Line data={chartData} options={customOptions} />
  </div>
</div>
```

After:
```tsx
<ChartCard title={title}>
  <Line data={chartData} options={lineChartOptions} />
</ChartCard>
```

## Best Practices

1. **Always use the centralized CSS classes** instead of inline Tailwind classes
2. **Use the reusable components** (DataTable, ChartCard) for consistency
3. **Import utilities from chartConfigs** instead of duplicating formatting functions
4. **Follow the established patterns** for new components
5. **Update existing components gradually** to maintain consistency

## Benefits

- **Consistency**: All tables, charts, and UI elements look the same
- **Maintainability**: Changes to styling can be made in one place
- **Reduced Redundancy**: No duplicate CSS classes or utility functions
- **Better Developer Experience**: Clear patterns and reusable components
- **Easier Theming**: Centralized styling makes theme changes easier

## Future Enhancements

- Dark mode support
- Additional chart types
- More form components
- Animation utilities
- Responsive design utilities 