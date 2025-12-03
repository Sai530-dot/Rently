from django.urls import path
from . import views

urlpatterns = [
    path('signup/student/', views.student_signup),
    path('signup/landlord/', views.landlord_signup),
    path('universities/', views.university_list),
    path('offer-evaluation/evaluate', views.evaluate_offer),
    path('roommate-matching/match', views.match_roommates),
    path('roommate-matching/save-preferences', views.save_roommate_preferences),
]
