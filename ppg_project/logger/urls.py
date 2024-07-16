from django.urls import path
from .views import PPGDataView, chart_view

urlpatterns = [
    path('ppg/', PPGDataView.as_view(), name='ppg_data'),
    path('chart/', chart_view, name='chart_view'),
]

