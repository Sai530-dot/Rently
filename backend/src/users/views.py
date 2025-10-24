import json
import requests
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login
from .models import CustomUser
import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase
try:
    cred_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-key.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized successfully!")
except ValueError:
    print("⚠️ Firebase already initialized")
except Exception as e:
    print(f"❌ Firebase init error: {e}")


@csrf_exempt
def student_signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data['email']
            password = data['password']
            name = data.get('name', '')
            university = data.get('university', '')

            # 1. Validate student email
            if not is_student_email(email):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Please use a valid student email address (.edu)'
                })

            # 2. Create user in Firebase
            try:
                firebase_user = auth.create_user(
                    email=email,
                    password=password,
                    display_name=name,
                    email_verified=False
                )
                print(f"✅ Firebase user created: {firebase_user.uid}")
            except auth.EmailAlreadyExistsError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'An account with this email already exists'
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Firebase error: {str(e)}'
                })

            # 3. Create user in Django
            user = CustomUser.objects.create_user(
                username=email,
                email=email,
                password=password,
                user_type='student',
                first_name=name,
                university=university
            )
            print(f"✅ Django user created: {user.id}")

            return JsonResponse({
                'status': 'success',
                'user_id': user.id,
                'firebase_uid': firebase_user.uid,
                'message': 'Student account created! Check email for verification.'
            })

        except Exception as e:
            print(f"❌ Student signup error: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)})


@csrf_exempt
def landlord_signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data['email']
            password = data['password']
            name = data.get('name', '')
            phone = data.get('phone', '')

            # 1. Create user in Firebase
            try:
                firebase_user = auth.create_user(
                    email=email,
                    password=password,
                    display_name=name,
                    phone_number=phone
                )
                print(f"✅ Firebase landlord created: {firebase_user.uid}")
            except auth.EmailAlreadyExistsError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'An account with this email already exists'
                })

            # 2. Create user in Django
            user = CustomUser.objects.create_user(
                username=email,
                email=email,
                password=password,
                user_type='landlord',
                first_name=name,
                phone=phone
            )
            print(f"✅ Django landlord created: {user.id}")

            return JsonResponse({
                'status': 'success',
                'user_id': user.id,
                'firebase_uid': firebase_user.uid,
                'message': 'Landlord account created successfully!'
            })

        except Exception as e:
            print(f"❌ Landlord signup error: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)})


@csrf_exempt
@csrf_exempt
def university_list(request):
    """Get hardcoded list of Canadian universities"""
    universities = [
        {"name": "University of Saskatchewan", "country": "Canada", "domain": "usask.ca"},
        {"name": "University of Toronto", "country": "Canada", "domain": "utoronto.ca"},
        {"name": "University of British Columbia", "country": "Canada", "domain": "ubc.ca"},
        {"name": "McGill University", "country": "Canada", "domain": "mcgill.ca"},
        {"name": "University of Alberta", "country": "Canada", "domain": "ualberta.ca"},
        {"name": "University of Calgary", "country": "Canada", "domain": "ucalgary.ca"},
        {"name": "University of Ottawa", "country": "Canada", "domain": "uottawa.ca"},
        {"name": "University of Waterloo", "country": "Canada", "domain": "uwaterloo.ca"},
        {"name": "Western University", "country": "Canada", "domain": "uwo.ca"},
        {"name": "Queen's University", "country": "Canada", "domain": "queensu.ca"},
        {"name": "University of Manitoba", "country": "Canada", "domain": "umanitoba.ca"},
        {"name": "Simon Fraser University", "country": "Canada", "domain": "sfu.ca"},
        {"name": "University of Victoria", "country": "Canada", "domain": "uvic.ca"},
        {"name": "University of Guelph", "country": "Canada", "domain": "uoguelph.ca"},
        {"name": "University of Windsor", "country": "Canada", "domain": "uwindsor.ca"},
        {"name": "York University", "country": "Canada", "domain": "yorku.ca"},
        {"name": "Carleton University", "country": "Canada", "domain": "carleton.ca"},
        {"name": "University of Regina", "country": "Canada", "domain": "uregina.ca"},
        {"name": "Dalhousie University", "country": "Canada", "domain": "dal.ca"},
        {"name": "University of New Brunswick", "country": "Canada", "domain": "unb.ca"},
        {"name": "University of Lethbridge", "country": "Canada", "domain": "uleth.ca"},
        {"name": "University of Northern British Columbia", "country": "Canada", "domain": "unbc.ca"},
        {"name": "Mount Royal University", "country": "Canada", "domain": "mtroyal.ca"},
        {"name": "MacEwan University", "country": "Canada", "domain": "macewan.ca"},
        {"name": "Thompson Rivers University", "country": "Canada", "domain": "tru.ca"},
    ]

    return JsonResponse({
        'status': 'success',
        'universities': universities,
        'count': len(universities)
    })

def is_student_email(email):
    """Check if email is from educational institution (including Canadian)"""
    student_domains = [
        # Canadian domains
        '.ca', '.qc.ca',
        # US domains
        '.edu',
        # Other common educational domains
        '.ac.uk', '.edu.au', '.ac.nz'
    ]
    return any(domain in email.lower() for domain in student_domains)