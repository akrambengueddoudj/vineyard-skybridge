# Vineyard Spray Tracking System - SkyBridge

A Django-powered web application that tracks chemical spraying operations in a vineyard.

## 1. System Overview

- Real-time 15×10 grid visualization  
- Daily spray tracking with threshold alerts  
- Statistical analysis of spraying patterns  
- Calendar-based historical review  

## 2. Core Components

### A. Data Models

```python
# Stores individual spray events
class SprayedCell(models.Model):
    x = models.IntegerField()  # Column (0-14)
    y = models.IntegerField()  # Row (0-9)
    timestamp = models.DateTimeField(auto_now_add=True)

# Daily aggregated data
class DailySpray(models.Model):
    date = models.DateField(unique=True)
    count = models.IntegerField(default=0)
    exceeded_threshold = models.BooleanField(default=False)
    most_sprayed_column = models.IntegerField(null=True)
    spray_pattern = models.JSONField()  # Format: {"column_number": spray_count}
```

### B. Key Configuration

- **Grid Dimensions**: 15 columns × 10 rows  
- **Spray Threshold**: 20 sprays/day (configurable)  
- **Color Coding**:  
  - Green: Normal operation  
  - Red: Threshold exceeded  

## 3. Data Flow

### 1. Robot Data Submission

- **Endpoint**: `POST /api/log-spray/`  
- **Payload**:

```json
{
  "x": 5,
  "y": 3
}
```

Automatically:
- Records spray event  
- Updates daily statistics  
- Checks threshold  

### 2. Frontend Data Retrieval

- `GET /api/daily-data/` – Current day sprays  
- `GET /api/calendar-data/` – Calendar data  
- `GET /api/daily-stats/YYYY-MM-DD/` – Detailed stats for a specific day  

## 4. Visual Components

### A. Main Spray Grid

- 15 columns with double-width gaps  
- 10 contiguous rows  
- Hover shows coordinates  
- Sprayed cells turn red  
- Unsprayed cells remain green  

### B. Calendar View

- 30-day rolling window  
- Color-coded days:
  - Green: Normal
  - Red: Threshold exceeded  
- Clickable dates show daily stats and update grid  

### C. Statistics Panel

#### 1. Summary Cards

- Total sprays  
- Most sprayed column  
- Threshold status  

#### 2. Interactive Charts

- Column distribution (bar chart)  
- Row distribution (bar chart)  

## 5. Technical Implementation

### Backend (Django)

- **Database**: SQLite (PostgreSQL-ready)  

```python
# Daily stats calculation
column_stats = SprayedCell.objects.filter(
    timestamp__date=target_date
).values('x').annotate(count=Count('x')).order_by('-count')

# Threshold check
DailySpray.exceeded_threshold = (DailySpray.count > settings.SPRAY_THRESHOLD)
```

### Frontend (Vanilla JS)

```javascript
function renderGrid(sprayData) {
  // Resets all cells to green
  // Marks sprayed cells red based on API data
}

function updateCharts(stats) {
  // Updates Chart.js instances with new data
}
```

- Chart.js for data visualization  
- Native CSS Grid for layout  

## 6. Key Features

### A. Real-time Monitoring

- Auto-refresh every 60 seconds  
- Immediate visual feedback on sprays  

### B. Historical Analysis

- Tracks spraying patterns over time  
- Identifies frequently sprayed areas  

### C. Alert System

- Visual indicators for threshold breaches  
- Persistent record of exceedances  

## 7. Usage Workflow

1. **Field Operation**:  
   - Robot scans rows  
   - Posts spray coordinates when chemicals deployed  

2. **Monitoring**:  
   - Supervisor views grid  
   - Uses calendar for trends  
   - Reviews daily statistics  

3. **Decision Making**:  
   - Identifies over-sprayed areas  
   - Adjusts application plans  
   - Verifies compliance  
 

## 8. Extension Points

### Future Enhancements

- Mobile notifications for threshold breaches  
- PDF report generation  
- Multi-user collaboration  

### Scalability

- PostgreSQL-ready  
- Designed for additional sensor integration  
