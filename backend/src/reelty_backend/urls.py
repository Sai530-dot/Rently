from django.http import JsonResponse
from django.urls import path, include


def api_status(request):
    return JsonResponse({"status": "ok", "message": "Reelty backend is running", "paths": ["api/"]})


# Vercel forwards requests with the /api prefix intact, so keep the 'api/' path here.
urlpatterns = [
    path('api/', api_status),
    path('api/', include('users.urls')),
    path('', api_status),
]
