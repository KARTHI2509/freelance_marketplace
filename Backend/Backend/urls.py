from django.contrib import admin
from django.urls import path
from freelancers import views as freelancer_views
from clients import views as client_views
from projects import views as project_views
from bids import views as bid_views
from contracts import views as contract_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Freelancer Management
    path('freelancers/', freelancer_views.get_freelancers, name='get_freelancers'),
    path('freelancers/add/', freelancer_views.add_freelancer, name='add_freelancer'),
    path('freelancers/update/<int:id>/', freelancer_views.update_freelancer, name='update_freelancer'),
    path('freelancers/delete/<int:id>/', freelancer_views.delete_freelancer, name='delete_freelancer'),

    # Client Management
    path('clients/', client_views.get_clients, name='get_clients'),
    path('clients/add/', client_views.add_client, name='add_client'),
    path('clients/update/<int:id>/', client_views.update_client, name='update_client'),
    path('clients/delete/<int:id>/', client_views.delete_client, name='delete_client'),

    # Project Management
    path('projects/', project_views.get_projects, name='get_projects'),
    path('projects/add/', project_views.add_project, name='add_project'),
    path('projects/update/<int:id>/', project_views.update_project, name='update_project'),
    path('projects/delete/<int:id>/', project_views.delete_project, name='delete_project'),

    # Bid Management
    path('bids/', bid_views.get_bids, name='get_bids'),
    path('bids/add/', bid_views.add_bid, name='add_bid'),
    path('bids/update/<int:id>/', bid_views.update_bid, name='update_bid'),
    path('bids/delete/<int:id>/', bid_views.delete_bid, name='delete_bid'),

    # Contract Management
    path('contracts/', contract_views.get_contracts, name='get_contracts'),
    path('contracts/add/', contract_views.add_contract, name='add_contract'),
    path('contracts/update/<int:id>/', contract_views.update_contract, name='update_contract'),
    path('contracts/delete/<int:id>/', contract_views.delete_contract, name='delete_contract'),
]
