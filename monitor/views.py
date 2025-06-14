from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import SprayedCell, DailySpray
from datetime import datetime, timedelta, date
import json
from django.db.models import Count
SPRAY_THRESHOLD = 20  # Critical number of sprays per day

@csrf_exempt
@require_POST
def log_spray(request):
    try:
        data = json.loads(request.body)
        x, y = data['x'], data['y']
        spray_date = date.today()
        
        # Create/update spray record
        SprayedCell.objects.create(x=x, y=y)
        
        # Update daily statistics
        daily, created = DailySpray.objects.get_or_create(date=spray_date)
        
        # Update basic count
        daily.count = SprayedCell.objects.filter(timestamp__date=spray_date).count()
        
        # Calculate column statistics
        column_stats = SprayedCell.objects.filter(
            timestamp__date=spray_date
        ).values('x').annotate(count=Count('x')).order_by('-count')
        
        if column_stats.exists():
            daily.most_sprayed_column = column_stats[0]['x']
            daily.spray_pattern = {
                str(stat['x']): stat['count'] 
                for stat in column_stats
            }
        
        daily.exceeded_threshold = daily.count > SPRAY_THRESHOLD
        daily.save()
        
        return JsonResponse({'status': 'success'})
    
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
def get_daily_data(request):
    date_str = request.GET.get('date')
    if date_str:
        selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    else:
        selected_date = date.today()
        
    cells = SprayedCell.objects.filter(
        timestamp__date=selected_date
    ).values('x', 'y')
    
    return JsonResponse({
        'status': 'success',
        'data': list(cells),
        'date': selected_date.strftime('%Y-%m-%d')
    })

def get_calendar_data(request):
    start_date = date.today() - timedelta(days=30)
    days = DailySpray.objects.filter(
        date__gte=start_date
    ).order_by('date')
    
    calendar_data = {
        day.date.strftime('%Y-%m-%d'): {
            'count': day.count,
            'exceeded': day.exceeded_threshold
        } for day in days
    }
    
    return JsonResponse({
        'status': 'success',
        'data': calendar_data,
        'threshold': SPRAY_THRESHOLD
    })

def spray_tracker_view(request):
    """Renders the main spray tracking interface"""
    return render(request, 'spray_tracker.html')

def daily_stats(request, date_str=None):
    try:
        target_date = date.today() if not date_str else datetime.strptime(date_str, '%Y-%m-%d').date()
        
        daily_data = DailySpray.objects.get(date=target_date)
        cells = SprayedCell.objects.filter(timestamp__date=target_date)
        
        # Row statistics
        row_stats = cells.values('y').annotate(count=Count('y')).order_by('y')
        column_stats = cells.values('x').annotate(count=Count('x')).order_by('x')
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'date': target_date.strftime('%Y-%m-%d'),
                'total_sprays': daily_data.count,
                'exceeded_threshold': daily_data.exceeded_threshold,
                'most_active_column': daily_data.most_sprayed_column,
                'column_distribution': {stat['x']: stat['count'] for stat in column_stats},
                'row_distribution': {stat['y']: stat['count'] for stat in row_stats},
                'threshold': SPRAY_THRESHOLD
            }
        })
    
    except DailySpray.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'No data for this date'}, status=404)

