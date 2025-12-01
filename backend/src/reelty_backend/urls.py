from django.urls import path, include

# Expose user endpoints at the API root; Vercel already routes /api/* to this app.
urlpatterns = [
    path('', include('users.urls')),
]
