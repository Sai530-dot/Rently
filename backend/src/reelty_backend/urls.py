from django.urls import path, include

# Vercel forwards requests with the /api prefix intact, so keep the 'api/' path here.
urlpatterns = [
    path('api/', include('users.urls')),
]
