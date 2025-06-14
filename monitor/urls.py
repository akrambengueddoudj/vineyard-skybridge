from django.urls import path
from . import views

urlpatterns = [
    path('', views.spray_tracker_view, name='spray_tracker'),  # Main page
    path('api/log-spray/', views.log_spray, name='log_spray'),
    path('api/daily-data/', views.get_daily_data, name='daily_data'),
    path('api/calendar-data/', views.get_calendar_data, name='calendar_data'),
    path('api/daily-stats/<str:date_str>/', views.daily_stats, name='daily_stats'),
]