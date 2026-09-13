from django.urls import path
from . import views, api

urlpatterns = [
    path('auth/session/', api.session),
    path('auth/login/', api.signin),
    path('auth/logout/', api.signout),
    path('auth/password-reset/', api.password_reset),
    path('auth/password-confirm/', api.password_confirm),
    path('auth/password-change/', api.change_password),
    path('signup/student/', api.signup, {'user_type': 'student'}),
    path('signup/landlord/', api.signup, {'user_type': 'landlord'}),
    path('profile/', api.preferences),
    path('properties/', api.properties),
    path('properties/<int:pk>/', api.property_detail),
    path('location-insights/analyze/', api.location_insights),
    path('saved-properties/', api.saved_properties),
    path('saved-properties/<int:pk>/', api.save_property),
    path('roommates/', api.roommates),
    path('roommates/<int:pk>/decision/', api.roommate_decision),
    path('roommates/passes/', api.roommate_decision),
    path('conversations/', api.conversations),
    path('conversations/<int:pk>/messages/', api.messages),
    path('universities/', views.university_list),
    path('offer-evaluation/evaluate', views.evaluate_offer),
    path('roommate-matching/match', api.roommates),
    path('roommate-matching/save-preferences', api.preferences),
]
