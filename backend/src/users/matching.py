# ml_utils.py
import math


def _normalize_budget(amount, cap=5000.0):
    """
    Convert a budget/rent value into a [0, 1] range with a soft cap.
    Higher numbers mean the person is comfortable with (or asking) higher rent.
    """
    try:
        num = float(amount)
    except (TypeError, ValueError):
        return 0.0
    if num < 0:
        num = 0.0
    if num > cap:
        num = cap
    return num / cap


def _encode_profile(profile, is_user=False, interest_buckets=8):
    """
    Map profile attributes into a numeric feature vector for cosine similarity.
    The same dimensions are used for users and candidates; scaling is handled via weights.
    """
    # Weights double as feature scaling factors.
    WEIGHTS = {
        'budget': 0.35,
        'cleanliness': 0.25,
        'sleep': 0.20,
        'interests': 0.20
    }

    clean_map = {"messy": 1, "moderate": 3, "clean": 4, "very_clean": 5}
    sleep_map = {"early_bird": 0.0, "flexible": 0.5, "night_owl": 1.0}

    budget_key = 'budget_max' if is_user else 'rent_ask'
    budget_feat = _normalize_budget(profile.get(budget_key, 0)) * WEIGHTS['budget']

    clean_val = clean_map.get(profile.get('cleanliness', 'moderate'), 3)
    # Normalize cleanliness to [0,1]
    clean_feat = (clean_val - 1) / 4 * WEIGHTS['cleanliness']

    sleep_val = sleep_map.get(profile.get('sleep_schedule', 'flexible'), 0.5)
    sleep_feat = sleep_val * WEIGHTS['sleep']

    # Interest hashing into fixed buckets for consistent vector length.
    interest_vec = [0.0] * interest_buckets
    interests = profile.get('interests', []) or []
    for tag in interests:
        idx = abs(hash(str(tag).lower())) % interest_buckets
        interest_vec[idx] += 1.0
    # Normalize counts to [0,1] if any interests exist.
    total_interest = sum(interest_vec)
    if total_interest > 0:
        interest_vec = [(val / total_interest) * WEIGHTS['interests'] for val in interest_vec]
    else:
        interest_vec = [0.0 for _ in interest_vec]

    return [budget_feat, clean_feat, sleep_feat, *interest_vec]


def _cosine_similarity(vec_a, vec_b):
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def calculate_similarity(user_preferences, candidate_profile):
    """
    Calculates a match percentage (0-100) between a looking user and a candidate
    using cosine similarity over a weighted feature vector.
    """
    user_vec = _encode_profile(user_preferences, is_user=True)
    candidate_vec = _encode_profile(candidate_profile, is_user=False)
    similarity = _cosine_similarity(user_vec, candidate_vec)
    return int(round(similarity * 100))
