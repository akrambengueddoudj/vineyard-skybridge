document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('vineyard-grid');
    const calendar = document.getElementById('calendar');
    let threshold = 20;
    let selectedDate = new Date().toISOString().split('T')[0];
    
    // Initialize grid
    function initGrid() {
        grid.innerHTML = '';
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 15; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                grid.appendChild(cell);
            }
        }
    }
    
    // Load grid data for selected date
    function loadGridData(date) {
        fetch(`/api/daily-data/?date=${date}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Reset all cells to green
                    document.querySelectorAll('.grid-cell').forEach(cell => {
                        cell.classList.remove('sprayed');
                    });
                    
                    // Mark sprayed cells red
                    data.data.forEach(cell => {
                        const cellElem = document.querySelector(
                            `.grid-cell[data-x="${cell.x}"][data-y="${cell.y}"]`
                        );
                        if (cellElem) {
                            cellElem.classList.add('sprayed');
                        }
                    });
                }
            });
    }
    
    // Initialize calendar
    function initCalendar() {
        fetch('/api/calendar-data/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    const calendar = document.getElementById('calendar');
                    calendar.innerHTML = '';
                    
                    // Create header with month/year
                    const today = new Date();
                    const monthYearHeader = document.createElement('h3');
                    monthYearHeader.textContent = today.toLocaleDateString('en-US', {
                        month: 'long', 
                        year: 'numeric'
                    });
                    calendar.parentNode.insertBefore(monthYearHeader, calendar);
                    
                    // Create day headers (Sun-Sat)
                    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    daysOfWeek.forEach(day => {
                        const dayHeader = document.createElement('div');
                        dayHeader.className = 'calendar-day-header';
                        dayHeader.textContent = day;
                        calendar.appendChild(dayHeader);
                    });
    
                    // Create calendar days
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    
                    // Add empty cells for days before the 1st
                    for (let i = 0; i < firstDay.getDay(); i++) {
                        const emptyDay = document.createElement('div');
                        emptyDay.className = 'calendar-day empty';
                        calendar.appendChild(emptyDay);
                    }
    
                    // Add actual days of the month
                    for (let d = 1; d <= lastDay.getDate(); d++) {
                        const dayStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                        const dayData = data.data[dayStr] || { count: 0, exceeded: false };
                        
                        const dayElement = document.createElement('div');
                        dayElement.className = 'calendar-day';
                        dayElement.textContent = d;
                        
                        if (dayData.exceeded) {
                            dayElement.classList.add('exceeded');
                        }
                        
                        dayElement.title = `${dayStr}: ${dayData.count} sprays`;
                        dayElement.addEventListener('click', () => {
                            // Remove previous selection
                            document.querySelectorAll('.calendar-day.selected').forEach(el => {
                                el.classList.remove('selected');
                            });
                            // Add new selection
                            dayElement.classList.add('selected');
                            loadGridData(dayStr);
                            loadDailyStats(dayStr);  // Load stats for selected day
                        });
                        
                        // Highlight today
                        if (d === today.getDate()) {
                            dayElement.classList.add('today');
                        }
                        
                        calendar.appendChild(dayElement);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading calendar data:', error);
                document.getElementById('calendar').innerHTML = 
                    '<p class="error">Error loading calendar data</p>';
            });
    }

    let columnChart, rowChart;

    function loadDailyStats(dateStr) {
        fetch(`/api/daily-stats/${dateStr}/`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    updateStatsUI(data.data);
                    renderCharts(data.data);
                }
            });
    }

    function updateStatsUI(stats) {
        document.getElementById('stats-date').textContent = stats.date;
        document.getElementById('total-sprays').textContent = stats.total_sprays;
        document.getElementById('active-column').textContent = 
            stats.most_active_column !== null ? stats.most_active_column : '-';
        
        const thresholdEl = document.getElementById('threshold-status');
        thresholdEl.textContent = stats.exceeded_threshold ? 'Exceeded' : 'Normal';
        thresholdEl.className = stats.exceeded_threshold ? 'exceeded' : '';
    }

    function renderCharts(stats) {
        const ctx1 = document.getElementById('columnChart').getContext('2d');
        const ctx2 = document.getElementById('rowChart').getContext('2d');
        
        // Destroy existing charts if they exist
        if (columnChart) columnChart.destroy();
        if (rowChart) rowChart.destroy();
        
        // Column Distribution Chart
        columnChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: Object.keys(stats.column_distribution).map(x => `Col ${x}`),
                datasets: [{
                    label: 'Sprays per Column',
                    data: Object.values(stats.column_distribution),
                    backgroundColor: '#4CAF50',
                    borderColor: '#388E3C',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Sprays'
                        }
                    }
                }
            }
        });
        
        // Row Distribution Chart
        rowChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: Object.keys(stats.row_distribution).map(y => `Row ${y}`),
                datasets: [{
                    label: 'Sprays per Row',
                    data: Object.values(stats.row_distribution),
                    backgroundColor: '#2196F3',
                    borderColor: '#1976D2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Sprays'
                        }
                    }
                }
            }
        });
    }

    
    // Initialize everything
    initGrid();
    initCalendar();
    loadGridData(selectedDate);
    
    // Auto-refresh every minute
    setInterval(() => {
        initCalendar();
        loadGridData(selectedDate);
    }, 60000);

    // Load today's stats initially
    loadDailyStats(new Date().toISOString().split('T')[0]);
    
    // Make sure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded!');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(script).onload = initCalendar;
    }
});