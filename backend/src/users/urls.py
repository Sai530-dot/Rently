from django.urls import path
from . import views

urlpatterns = [
    path('signup/student/', views.student_signup),
    path('signup/landlord/', views.landlord_signup),
    path('universities/', views.university_list),
]