# ml_utils.py
import math

def calculate_similarity(user_preferences, candidate_profile):
    """
    Calculates a match percentage (0-100) between a looking user and a candidate.
    Uses a Weighted Sum Model (a simple form of Multi-Criteria Decision Analysis).
    """
    
    # --- 1. CONFIGURATION: WEIGHTS ---
    # Adjust these based on what you think is most important
    WEIGHTS = {
        'budget': 0.35,      # 35% importance
        'cleanliness': 0.25, # 25% importance
        'sleep': 0.20,       # 20% importance
        'interests': 0.20    # 20% importance
    }

    score = 0.0

    # --- 2. BUDGET SCORE (Numerical Distance) ---
    # We allow a buffer of $200. If within buffer, score is high.
    user_budget = float(user_preferences.get('budget_max', 0))
    candidate_price = float(candidate_profile.get('rent_ask', 0))
    
    price_diff = abs(user_budget - candidate_price)
    
    if price_diff <= 50: # Perfect match
        budget_score = 1.0
    elif price_diff <= 200: # Good match
        budget_score = 0.8
    elif price_diff <= 400: # Okay match
        budget_score = 0.5
    else: # Too expensive/cheap
        budget_score = 0.0
        
    score += budget_score * WEIGHTS['budget']

    # --- 3. CLEANLINESS SCORE (Categorical Ordinal) ---
    # Map text to numbers: 1 (Messy) to 5 (Sparkling)
    clean_map = {"messy": 1, "moderate": 3, "clean": 4, "very_clean": 5}
    
    user_clean = clean_map.get(user_preferences.get('cleanliness', 'moderate'), 3)
    cand_clean = clean_map.get(candidate_profile.get('cleanliness', 'moderate'), 3)
    
    # Calculate normalized difference
    clean_diff = abs(user_clean - cand_clean)
    # If diff is 0, score 1. If diff is 4 (max), score 0.
    clean_score = 1 - (clean_diff / 4) 
    
    score += clean_score * WEIGHTS['cleanliness']

    # --- 4. SLEEP SCHEDULE (Categorical Exact) ---
    # If they match, 100%. If "Flexible", 80% match with anyone.
    u_sleep = user_preferences.get('sleep_schedule', 'flexible')
    c_sleep = candidate_profile.get('sleep_schedule', 'flexible')
    
    if u_sleep == c_sleep:
        sleep_score = 1.0
    elif u_sleep == 'flexible' or c_sleep == 'flexible':
        sleep_score = 0.8
    else:
        # e.g. Early Bird vs Night Owl
        sleep_score = 0.2
        
    score += sleep_score * WEIGHTS['sleep']

    # --- 5. INTERESTS (Jaccard Similarity) ---
    # Intersection over Union: How many shared tags vs total unique tags
    u_interests = set(user_preferences.get('interests', []))
    c_interests = set(candidate_profile.get('interests', []))
    
    if len(u_interests) + len(c_interests) == 0:
        interest_score = 0.5 # Neutral if no data
    else:
        intersection = len(u_interests.intersection(c_interests))
        union = len(u_interests.union(c_interests))
        interest_score = intersection / union

    score += interest_score * WEIGHTS['interests']

    # Final result as percentage
    return int(round(score * 100))