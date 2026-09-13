import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .location_insights import generate_offer_analysis

logger = logging.getLogger(__name__)

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

@csrf_exempt
def university_list(request):
    """Get hardcoded list of Canadian universities"""
    if request.method != 'GET':
        return JsonResponse({'message': 'Method not allowed'}, status=405)
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

            evaluation = {
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

            try:
                evaluation['aiAnalysis'] = {
                    'available': True,
                    **generate_offer_analysis(_offer_analysis_evidence(
                        data, rent_offer, detected_city, base_rent, bedrooms, bathrooms,
                        parking, furnished, utilities_included, market_value, diff_percentage,
                        final_score, label,
                    )),
                }
            except Exception as exc:
                logger.warning('Gemini offer analysis unavailable: %s', exc)
                evaluation['aiAnalysis'] = {
                    'available': False,
                    'message': 'AI Offer Analysis is unavailable. The deterministic evaluation is still shown.',
                }

            return JsonResponse({'success': True, 'evaluation': evaluation})

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})


def _offer_analysis_evidence(data, rent_offer, detected_city, base_rent, bedrooms, bathrooms,
                             parking, furnished, utilities_included, market_value,
                             diff_percentage, final_score, label):
    """Describe the already-computed evaluator result without deriving a new score."""
    bedroom_multiplier = 0.85 if bedrooms == 0 else 1.4 if bedrooms == 2 else 1.7 if bedrooms == 3 else 2.1 if bedrooms >= 4 else 1
    bathroom_adjustment = (bathrooms - 1) * 150 if bathrooms > 1 else 0
    return {
        'user_inputs': {
            'asking_rent': rent_offer,
            'security_deposit': data.get('securityDeposit') or None,
            'location': ' '.join(str(data.get('location', '')).split())[:300],
            'square_feet': data.get('squareFeet') or None,
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'parking': parking,
            'furnished': furnished,
            'laundry': data.get('laundry'),
            'pet_friendly': data.get('petFriendly') == 'yes',
            'utilities': 'included' if utilities_included else 'not included',
            'utilities_cost': data.get('utilitiesCost') or None,
            'lease_term_months': data.get('leaseTerm'),
        },
        'market_location_evidence': {
            'source': 'CITY_RENT_DATA deterministic city baseline',
            'detected_city': detected_city,
            'baseline_market_rent': base_rent,
            'fallback_baseline_used': detected_city == 'Unknown',
        },
        'deterministic_adjustments': {
            'bedroom_multiplier': bedroom_multiplier,
            'bathroom_adjustment': bathroom_adjustment,
            'parking_adjustment': 150 if parking else 0,
            'furnished_adjustment': 250 if furnished else 0,
            'utilities_included_adjustment': 150 if utilities_included else 0,
        },
        'calculated_results': {
            'estimated_market_rent': int(market_value),
            'asking_rent_difference_percent': round(diff_percentage * 100, 1),
            'asking_rent_is_above_estimate': diff_percentage > 0,
            'deterministic_deal_score': final_score,
            'deterministic_deal_label': label,
        },
        'limitations': [
            'The market estimate is a deterministic city baseline adjusted only by the listed inputs.',
            *(['No city match was found, so the deterministic default baseline was used.'] if detected_city == 'Unknown' else []),
        ],
    }

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
