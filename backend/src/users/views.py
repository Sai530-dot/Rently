import json
import requests
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login
from .models import CustomUser
import firebase_admin
from firebase_admin import credentials, auth
from .matching import calculate_similarity


# Random mock candidates to check if matching logic works
# this is just a sample I REPEEATT THIS IS JUST A SAMPLE
MOCK_CANDIDATES = [
    {
        "id": 101, "name": "Sarah Johnson", "major": "CS", 
        "rent_ask": 1100, "cleanliness": "very_clean", "sleep_schedule": "night_owl",
        "interests": ["coding", "gaming", "movies"], "image": ""
    },
    {
        "id": 102, "name": "Mike Chen", "major": "Business", 
        "rent_ask": 900, "cleanliness": "moderate", "sleep_schedule": "early_bird",
        "interests": ["gym", "cooking", "hiking"], "image": ""
    },
    {
        "id": 103, "name": "Emma Davis", "major": "Psychology", 
        "rent_ask": 1250, "cleanliness": "clean", "sleep_schedule": "flexible",
        "interests": ["reading", "yoga", "coffee"], "image": ""
    }
]

CITY_RENT_DATA = {
    "toronto": 2450,
    "vancouver": 2700,
    "montreal": 1750,
    "calgary": 1800,
    "ottawa": 1900,
    "edmonton": 1300,
    "winnipeg": 1400,
    "halifax": 1850,
    "saskatoon": 1200,
    "regina": 1150,
    "kitchener": 1900,
    "waterloo": 1950,
    "london": 1800,
    "victoria": 2100
}

# Initialize Firebase
try:
    cred_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-key.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    print("Firebase initialized successfully!")
except ValueError:
    print("Firebase already initialized")
except Exception as e:
    print(f"Firebase init error: {e}")


# views.py (Updated student_signup)

@csrf_exempt
def student_signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data['email']
            password = data['password']
            name = data.get('name', '')
            university = data.get('university', '')

            # DEBUG PRINT
            print(f"Attempting signup for: {email}")

            # 1. Validate student email (Ensure you are using a valid domain during test!)
            if not is_student_email(email):
                print(f"Invalid domain: {email}")
                return JsonResponse({
                    'status': 'error',
                    'message': 'Please use a valid student email address (.edu, .ca, etc.)'
                })

            # 2. Create user in Firebase
            try:
                firebase_user = auth.create_user(
                    email=email,
                    password=password,
                    display_name=name,
                    email_verified=False
                )
                print(f"Firebase user created: {firebase_user.uid}")
            
            except auth.EmailAlreadyExistsError:
                print("Firebase Error: Email exists")
                return JsonResponse({
                    'status': 'error',
                    'message': 'An account with this email already exists'
                })
            except Exception as fb_error:
                print(f"Firebase Critical Error: {fb_error}")
                # This helps see if it's a credential/permission issue
                return JsonResponse({
                    'status': 'error',
                    'message': f'Firebase error: {str(fb_error)}'
                })

            # 3. Create user in Django
            try:
                user = CustomUser.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    user_type='student',
                    first_name=name,
                    university=university
                )
                print(f"Django user created: {user.id}")
            except Exception as db_error:
                # If Django fails, we should ideally delete the Firebase user to keep sync,
                # but for now let's just report the error.
                print(f"Django DB Error: {db_error}")
                return JsonResponse({'status': 'error', 'message': f"Database error: {str(db_error)}"})

            return JsonResponse({
                'status': 'success',
                'user_id': user.id,
                'firebase_uid': firebase_user.uid,
                'message': 'Student account created!'
            })

        except Exception as e:
            print(f"General Error: {e}")
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
                print(f"Firebase landlord created: {firebase_user.uid}")
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
            print(f"Django landlord created: {user.id}")

            return JsonResponse({
                'status': 'success',
                'user_id': user.id,
                'firebase_uid': firebase_user.uid,
                'message': 'Landlord account created successfully!'
            })

        except Exception as e:
            print(f"Landlord signup error: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)})


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


@csrf_exempt
def evaluate_offer(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # 1. Extract Inputs
            rent_offer = float(data.get('monthlyRent', 0))
            location_raw = data.get('location', '').lower()
            bedrooms = int(data.get('bedrooms', 1))
            bathrooms = float(data.get('bathrooms', 1))
            parking = data.get('parking') == 'yes'
            furnished = data.get('furnished') == 'yes'
            utilities_included = data.get('utilities') == 'included'

            # 2. Determine Baseline Rent for Location
            # Simple fuzzy search for city name in the location string
            base_rent = 2000 # Default fallback
            detected_city = "Unknown"
            
            for city, price in CITY_RENT_DATA.items():
                if city in location_raw:
                    base_rent = price
                    detected_city = city.capitalize()
                    break

            # 3. Adjust Market Value based on Specs
            market_value = base_rent
            
            # Bedroom Adjustment
            if bedrooms == 0: market_value *= 0.85 # Studio
            elif bedrooms == 2: market_value *= 1.4
            elif bedrooms == 3: market_value *= 1.7
            elif bedrooms >= 4: market_value *= 2.1
            
            # Bathroom Adjustment
            if bathrooms > 1:
                market_value += (bathrooms - 1) * 150

            # Amenities Adjustment
            if parking: market_value += 150
            if furnished: market_value += 250
            if utilities_included: market_value += 150

            # 4. Calculate Score (0 to 100)
            # If Offer < Market Value -> Good Score
            # If Offer > Market Value -> Bad Score
            
            diff_percentage = (rent_offer - market_value) / market_value
            # e.g., Offer 2200, Market 2000 -> +10% diff -> Score drops
            
            base_score = 75
            score_adjustment = diff_percentage * 100 * 2 # Scikit-learn logic simplified
            
            final_score = int(max(0, min(100, base_score - score_adjustment)))

            # 5. Generate Response
            label = "Fair Deal"
            color = "#ff922b"
            if final_score >= 80:
                label, color = "Excellent Deal", "#51cf66"
            elif final_score >= 60:
                label, color = "Good Deal", "#ffd93d"
            elif final_score < 40:
                label, color = "Poor Deal", "#ff6b6b"

            return JsonResponse({
                'success': True,
                'evaluation': {
                    'score': final_score,
                    'label': label,
                    'color': color,
                    'totalMonthlyCost': rent_offer,
                    'marketComparison': {
                        'marketAverage': int(market_value),
                        'percentDifference': round(abs(diff_percentage * 100), 1),
                        'isAboveMarket': diff_percentage > 0
                    },
                    'pros': generate_pros(data),
                    'cons': generate_cons(data),
                    'recommendations': generate_recommendations(final_score),
                    'confidence': 92 # Mock ML confidence
                }
            })

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

def generate_pros(data):
    pros = []
    if data.get('utilities') == 'included': pros.append("Utilities included saves ~$150/mo")
    if data.get('parking') == 'yes': pros.append("Parking spot holds significant value")
    if data.get('laundry') == 'in-unit': pros.append("High demand in-unit laundry")
    return pros if pros else ["Standard market features"]

def generate_cons(data):
    cons = []
    if data.get('leaseTerm') == '24': cons.append("Long 24-month commitment")
    if data.get('utilities') != 'included': cons.append("Additional utility costs apply")
    return cons if cons else ["No major red flags"]

def generate_recommendations(score):
    if score > 80: return ["Apply immediately", "Have deposit ready"]
    if score < 50: return ["Negotiate rent down", "Compare with similar listings"]
    return ["Good option", "Verify lease terms"]

@csrf_exempt
def match_roommates(request):
    if request.method == 'POST':
        try:
            # 1. Get the current user's preferences from the frontend
            data = json.loads(request.body)
            user_prefs = {
                'budget_max': data.get('budget', 1000),
                'cleanliness': data.get('cleanliness', 'moderate'), # messy, moderate, clean, very_clean
                'sleep_schedule': data.get('sleepSchedule', 'flexible'),
                'interests': data.get('interests', [])
            }

            # 2. Run the Algorithm
            ranked_matches = []
            
            for candidate in MOCK_CANDIDATES:
                score = calculate_similarity(user_prefs, candidate)
                
                # Only return decent matches (> 40%)
                if score > 40:
                    # Add score to the candidate object so frontend sees it
                    candidate_with_score = candidate.copy()
                    candidate_with_score['match_score'] = score
                    ranked_matches.append(candidate_with_score)

            # 3. Sort by highest score
            ranked_matches.sort(key=lambda x: x['match_score'], reverse=True)

            return JsonResponse({
                'success': True,
                'matches': ranked_matches,
                'count': len(ranked_matches)
            })

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})