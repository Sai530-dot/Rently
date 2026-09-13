"""Session-authenticated API for accounts, rentals and conversations."""
import json
import logging
import math
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email, URLValidator
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import JsonResponse, Http404
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from .models import CustomUser, RoommateProfile, Property, SavedProperty, RoommateDecision, Conversation, Message
from .matching import calculate_similarity
from .location_insights import LocationInsightsProviderError, analyze_property

logger = logging.getLogger(__name__)


def endpoint(methods, authenticated=True):
    def decorate(fn):
        @wraps(fn)
        def wrapped(request, *args, **kwargs):
            if request.method not in methods:
                response = JsonResponse({'message': 'Method not allowed'}, status=405)
                response['Allow'] = ', '.join(methods)
                return response
            if authenticated and not request.user.is_authenticated:
                return JsonResponse({'message': 'Please sign in to continue.'}, status=401)
            try:
                request.data = json.loads(request.body or '{}') if request.method != 'GET' else {}
                if not isinstance(request.data, dict):
                    raise ValidationError('Expected a JSON object.')
                return fn(request, *args, **kwargs)
            except (json.JSONDecodeError, UnicodeDecodeError):
                return JsonResponse({'message': 'Invalid JSON.'}, status=400)
            except ValidationError as exc:
                return JsonResponse({'message': ' '.join(exc.messages)}, status=400)
            except Http404:
                return JsonResponse({'message': 'Not found.'}, status=404)
            except IntegrityError:
                return JsonResponse({'message': 'This record already exists.'}, status=409)
            except Exception:
                logger.exception('Unhandled API error in %s', fn.__name__)
                return JsonResponse({'message': 'The server could not complete this request.'}, status=500)
        return wrapped
    return decorate


def text_field(data, key, limit=255, required=False):
    value = data.get(key, '')
    if not isinstance(value, str):
        raise ValidationError(f'{key} must be text.')
    value = value.strip()
    if required and not value:
        raise ValidationError(f'{key} is required.')
    if len(value) > limit:
        raise ValidationError(f'{key} must be at most {limit} characters.')
    return value


def number(data, key, default=0, minimum=0, maximum=100000, integer=False):
    value = data.get(key, default)
    try:
        if isinstance(value, bool):
            raise ValueError
        value = float(value)
        if not math.isfinite(value) or not minimum <= value <= maximum or (integer and value != int(value)):
            raise ValueError
    except (TypeError, ValueError, OverflowError):
        raise ValidationError(f'{key} must be between {minimum} and {maximum}' + (' and a whole number.' if integer else '.'))
    return int(value) if integer else value


def http_url(value):
    if value:
        URLValidator(schemes=['http', 'https'])(value)
    return value


def profile_data(profile):
    return {'budget': profile.budget_max, 'city': profile.city or '',
            'location': {'city': profile.city or '', 'formatted': profile.city or ''},
            'sleepSchedule': profile.sleep_schedule, 'cleanliness': profile.cleanliness,
            'interests': profile.interests, 'major': profile.major or '', 'avatar': profile.avatar or '',
            'bio': profile.bio, 'numRoommates': profile.num_roommates, 'completed': profile.completed}


def user_data(user):
    profile, _ = RoommateProfile.objects.get_or_create(user=user)
    return {'id': user.id, 'email': user.email, 'firstName': user.first_name,
            'user_type': user.user_type, 'phone': user.phone or '', 'company': user.company,
            'university': user.university or '', 'avatar': profile.avatar or '',
            'preferences': profile_data(profile)}


def throttle(request, action, limit=20):
    key = f"{action}:{request.META.get('REMOTE_ADDR', '')}"
    cache.add(key, 0, 300)
    try:
        attempts = cache.incr(key)
    except ValueError:
        cache.set(key, 1, 300)
        attempts = 1
    if attempts > limit:
        return JsonResponse({'message': 'Too many attempts. Please try again in five minutes.'}, status=429)


@endpoint(['GET'], authenticated=False)
def session(request):
    return JsonResponse({'user': user_data(request.user) if request.user.is_authenticated else None,
                         'csrfToken': get_token(request)})


@endpoint(['POST'], authenticated=False)
def signup(request, user_type):
    limited = throttle(request, 'signup')
    if limited is not None:
        return limited
    data = request.data
    email = text_field(data, 'email', 254, True).lower()
    validate_email(email)
    name = text_field(data, 'name', 150, True)
    password = text_field(data, 'password', 128, True)
    university = text_field(data, 'university', required=user_type == 'student')
    phone = text_field(data, 'phone', 20, required=user_type == 'landlord')
    user = CustomUser(username=email, email=email, first_name=name, user_type=user_type,
                      university=university, phone=phone, company=text_field(data, 'company'))
    validate_password(password, user)
    if CustomUser.objects.filter(email__iexact=email).exists():
        return JsonResponse({'message': 'An account with this email already exists.'}, status=409)
    with transaction.atomic():
        user.set_password(password)
        user.save()
        RoommateProfile.objects.create(user=user, completed=user_type == 'landlord')
    login(request, user)
    request.session.set_expiry(0)
    return JsonResponse({'status': 'success', 'user': user_data(user), 'csrfToken': get_token(request)}, status=201)


@endpoint(['POST'], authenticated=False)
def signin(request):
    limited = throttle(request, 'login')
    if limited is not None:
        return limited
    email = text_field(request.data, 'email', 254, True).lower()
    password = text_field(request.data, 'password', 128, True)
    existing = CustomUser.objects.filter(email__iexact=email).first()
    user = authenticate(request, username=existing.username if existing else email, password=password)
    if not user or request.data.get('user_type', user.user_type) != user.user_type:
        return JsonResponse({'message': 'Email, password or account type is incorrect.'}, status=401)
    login(request, user)
    request.session.set_expiry(1209600 if request.data.get('remember') is True else 0)
    return JsonResponse({'user': user_data(user), 'csrfToken': get_token(request)})


@endpoint(['POST'])
def signout(request):
    logout(request)
    return JsonResponse({'success': True, 'csrfToken': get_token(request)})


@endpoint(['POST'], authenticated=False)
def password_reset(request):
    limited = throttle(request, 'reset', 5)
    if limited is not None:
        return limited
    email = text_field(request.data, 'email', 254, True)
    validate_email(email)
    user = CustomUser.objects.filter(email__iexact=email, is_active=True).first()
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f'{settings.FRONTEND_URL}/#reset-password/{uid}/{token}'
        send_mail('Reset your Reelty password', f'Use this link to reset your password:\n{link}\n\nIf you did not request this, ignore this email.',
                  settings.DEFAULT_FROM_EMAIL, [user.email])
    return JsonResponse({'message': 'If this account exists, password reset instructions have been sent.'})


@endpoint(['POST'], authenticated=False)
def password_confirm(request):
    limited = throttle(request, 'reset-confirm')
    if limited is not None:
        return limited
    try:
        uid = urlsafe_base64_decode(text_field(request.data, 'uid', 100, True)).decode()
        user = CustomUser.objects.get(pk=int(uid), is_active=True)
    except (ValueError, UnicodeDecodeError, OverflowError, CustomUser.DoesNotExist):
        raise ValidationError('This reset link is invalid or expired.')
    if not default_token_generator.check_token(user, text_field(request.data, 'token', 200, True)):
        raise ValidationError('This reset link is invalid or expired.')
    password = text_field(request.data, 'password', 128, True)
    validate_password(password, user)
    user.set_password(password)
    user.save(update_fields=['password'])
    return JsonResponse({'message': 'Password updated. You can now sign in.'})


@endpoint(['POST'])
def change_password(request):
    if not request.user.check_password(text_field(request.data, 'currentPassword', 128, True)):
        raise ValidationError('Current password is incorrect.')
    password = text_field(request.data, 'password', 128, True)
    validate_password(password, request.user)
    request.user.set_password(password)
    request.user.save(update_fields=['password'])
    update_session_auth_hash(request, request.user)
    return JsonResponse({'message': 'Password updated.'})


@endpoint(['POST', 'PATCH'])
def preferences(request):
    data = request.data
    profile, _ = RoommateProfile.objects.get_or_create(user=request.user)
    for field, target, limit in [('city', 'city', 100), ('major', 'major', 100), ('bio', 'bio', 500), ('avatar', 'avatar', 2000)]:
        if field in data:
            value = text_field(data, field, limit)
            setattr(profile, target, http_url(value) if field == 'avatar' else value)
    if 'budget' in data:
        profile.budget_max = number(data, 'budget')
        profile.rent_ask = profile.budget_max
    if 'numRoommates' in data:
        profile.num_roommates = number(data, 'numRoommates', minimum=1, maximum=10, integer=True)
    for key, target, choices in [('sleepSchedule', 'sleep_schedule', RoommateProfile.SLEEP_CHOICES), ('cleanliness', 'cleanliness', RoommateProfile.CLEANLINESS_CHOICES)]:
        if key in data:
            if data[key] not in dict(choices):
                raise ValidationError(f'Invalid {key}.')
            setattr(profile, target, data[key])
    if 'interests' in data:
        interests = data['interests']
        if not isinstance(interests, list) or len(interests) > 20 or any(not isinstance(v, str) or len(v) > 40 for v in interests):
            raise ValidationError('Use at most 20 interests of up to 40 characters each.')
        profile.interests = list(dict.fromkeys(v.strip().lower() for v in interests if v.strip()))
    if 'firstName' in data:
        request.user.first_name = text_field(data, 'firstName', 150, True)
    if data.get('completed'):
        if request.user.user_type == 'student' and (not profile.city or profile.budget_max <= 0):
            raise ValidationError('Enter a city and a monthly budget to complete your profile.')
        profile.completed = True
    with transaction.atomic():
        profile.save()
        request.user.save(update_fields=['first_name'])
    return JsonResponse({'success': True, 'user': user_data(request.user)})


def property_data(prop):
    return {'id': prop.pk, 'owner_id': prop.owner_id, 'title': prop.title, 'address': prop.address,
            'city': prop.city, 'province': prop.province, 'rent': float(prop.rent),
            'bedrooms': prop.bedrooms, 'bathrooms': float(prop.bathrooms) if prop.bathrooms is not None else None, 'property_type': prop.property_type,
            'description': prop.description, 'image': prop.image, 'images': prop.images or [],
            'square_feet': prop.square_feet, 'parking': prop.parking, 'pets': prop.pets,
            'utilities': prop.utilities or [], 'appliances': prop.appliances or [], 'features': prop.features or [],
            'lease_term': prop.lease_term, 'available_date': prop.available_date,
            'listing_status': prop.listing_status, 'last_checked': prop.last_checked.isoformat() if prop.last_checked else None,
            'source_listing_id': prop.source_listing_id, 'lat': prop.lat, 'lon': prop.lon,
            'active': prop.active, 'url': prop.source_url, 'imported': prop.owner_id is None,
            'landlord': prop.owner.first_name if prop.owner_id else 'External listing',
            'updated_at': prop.updated_at.isoformat()}


def update_property(prop, data):
    for field, limit in [('title', 200), ('address', 300), ('city', 100), ('province', 2), ('description', 10000), ('image', 2000)]:
        if field in data or not prop.pk:
            value = text_field(data, field, limit, field in ['title', 'address', 'city'])
            setattr(prop, field, http_url(value) if field == 'image' else value)
    prop.province = prop.province.upper()
    for field, minimum, maximum, integer in [('rent', 1, 100000, False), ('bedrooms', 0, 20, True), ('bathrooms', 0.5, 20, False)]:
        setattr(prop, field, number(data, field, getattr(prop, field), minimum, maximum, integer))
    if 'property_type' in data:
        if data['property_type'] not in ['Apartment', 'Single Family House', 'Condominium', 'Room']:
            raise ValidationError('Invalid property type.')
        prop.property_type = data['property_type']
    if 'active' in data:
        if not isinstance(data['active'], bool):
            raise ValidationError('active must be true or false.')
        prop.active = data['active']
    for field, low, high in [('lat', -90, 90), ('lon', -180, 180)]:
        if field in data:
            setattr(prop, field, None if data[field] in [None, ''] else number(data, field, minimum=low, maximum=high))
    if (prop.lat is None) != (prop.lon is None):
        raise ValidationError('Provide both latitude and longitude, or leave both empty.')
    prop.save()


@endpoint(['GET', 'POST'])
def properties(request):
    if request.method == 'POST':
        if request.user.user_type != 'landlord':
            return JsonResponse({'message': 'Only landlords can publish properties.'}, status=403)
        prop = Property(owner=request.user)
        update_property(prop, request.data)
        return JsonResponse({'property': property_data(prop)}, status=201)
    props = Property.objects.select_related('owner').all()
    if request.GET.get('mine') == 'true':
        props = props.filter(owner=request.user)
    else:
        # Local `active` remains the landlord/Rently publication flag. An
        # imported listing confirmed unavailable at its marketplace is hidden
        # separately, while saved and direct records remain accessible.
        props = props.filter(active=True).exclude(owner__isnull=True, listing_status='unavailable')
    query = request.GET.get('q', '').strip()
    if query:
        props = props.filter(Q(title__icontains=query) | Q(city__icontains=query) | Q(address__icontains=query))
    return JsonResponse({'success': True, 'properties': [property_data(p) for p in props.order_by('-created_at')]})


@endpoint(['GET', 'PATCH', 'DELETE'])
def property_detail(request, pk):
    prop = get_object_or_404(Property.objects.select_related('owner'), pk=pk)
    if request.method == 'GET':
        if not prop.active and prop.owner_id != request.user.id:
            raise Http404
        return JsonResponse({'property': property_data(prop)})
    if prop.owner_id != request.user.id:
        return JsonResponse({'message': 'You can only change your own listings.'}, status=403)
    if request.method == 'DELETE':
        prop.delete()
        return JsonResponse({'success': True})
    update_property(prop, request.data)
    return JsonResponse({'property': property_data(prop)})


@endpoint(['POST'])
def location_insights(request):
    """Analyze one server-side listing; never trust browser-supplied coordinates."""
    limited = throttle(request, 'location-insights', limit=8)
    if limited is not None:
        return limited
    property_id = number(request.data, 'property_id', minimum=1, maximum=2147483647, integer=True)
    prop = get_object_or_404(
        Property.objects.select_related('owner').filter(Q(active=True) | Q(owner=request.user)),
        pk=property_id,
    )
    try:
        insights = analyze_property(prop)
    except LocationInsightsProviderError as exc:
        return JsonResponse({'message': exc.message, 'code': exc.code}, status=503)
    return JsonResponse({'success': True, 'insights': insights})


@endpoint(['GET'])
def saved_properties(request):
    rows = request.user.saved_properties.select_related('property__owner').order_by('-created_at')
    return JsonResponse({'properties': [property_data(row.property) for row in rows]})


@endpoint(['POST', 'DELETE'])
def save_property(request, pk):
    if request.method == 'DELETE':
        SavedProperty.objects.filter(user=request.user, property_id=pk).delete()
    else:
        prop = get_object_or_404(Property, pk=pk, active=True)
        SavedProperty.objects.get_or_create(user=request.user, property=prop)
    return JsonResponse({'success': True})


def candidate_data(profile, requester):
    candidate = {'id': profile.user_id, 'name': profile.user.first_name, 'major': profile.major,
                 'rent_ask': profile.rent_ask, 'cleanliness': profile.cleanliness,
                 'sleep_schedule': profile.sleep_schedule, 'interests': profile.interests,
                 'city': profile.city, 'image': profile.avatar or '', 'bio': profile.bio}
    candidate['match_score'] = calculate_similarity({'budget_max': requester.budget_max, 'cleanliness': requester.cleanliness,
        'sleep_schedule': requester.sleep_schedule, 'interests': requester.interests}, candidate)
    return candidate


@endpoint(['GET', 'POST'])
def roommates(request):
    requester, _ = RoommateProfile.objects.get_or_create(user=request.user)
    if request.user.user_type != 'student':
        return JsonResponse({'message': 'Roommate matching is available to student accounts.'}, status=403)
    if not requester.completed:
        raise ValidationError('Complete your profile in Settings to find roommates.')
    decisions = dict(request.user.roommate_decisions.values_list('candidate_id', 'liked'))
    candidates = RoommateProfile.objects.filter(completed=True, user__user_type='student', user__is_active=True).exclude(user=request.user).select_related('user')
    unseen, liked = [], []
    for profile in candidates:
        candidate = candidate_data(profile, requester)
        if decisions.get(profile.user_id) is True:
            candidate['mutual'] = RoommateDecision.objects.filter(user=profile.user, candidate=request.user, liked=True).exists()
            liked.append(candidate)
        elif profile.user_id not in decisions and (profile.city or '').casefold() == (requester.city or '').casefold():
            unseen.append(candidate)
    unseen.sort(key=lambda p: (-p['match_score'], p['id']))
    return JsonResponse({'success': True, 'matches': unseen, 'liked': liked, 'passes': sum(not v for v in decisions.values())})


@endpoint(['POST', 'DELETE'])
def roommate_decision(request, pk=None):
    if request.user.user_type != 'student':
        return JsonResponse({'message': 'Student account required.'}, status=403)
    if request.method == 'DELETE':
        request.user.roommate_decisions.filter(liked=False).delete()
        return JsonResponse({'success': True})
    candidate = get_object_or_404(CustomUser, pk=pk, is_active=True, user_type='student', roommate_profile__completed=True)
    if candidate.pk == request.user.pk or not isinstance(request.data.get('liked'), bool):
        raise ValidationError('Choose another student and a valid decision.')
    RoommateDecision.objects.update_or_create(user=request.user, candidate=candidate, defaults={'liked': request.data['liked']})
    return JsonResponse({'success': True})


def conversation_data(conversation, user):
    other = conversation.user_high if conversation.user_low_id == user.pk else conversation.user_low
    latest = conversation.messages.order_by('-created_at', '-id').first()
    return {'id': conversation.pk, 'user_id': other.pk, 'name': other.first_name, 'user_type': other.user_type,
            'lastMessage': latest.text if latest else '', 'timestamp': latest.created_at.isoformat() if latest else conversation.created_at.isoformat(),
            'unread': conversation.messages.exclude(sender=user).filter(read_at=None).count()}


@endpoint(['GET', 'POST'])
def conversations(request):
    if request.method == 'POST':
        other_id = number(request.data, 'recipient_id', minimum=1, maximum=2147483647, integer=True)
        other = get_object_or_404(CustomUser, pk=other_id, is_active=True)
        if other == request.user:
            raise ValidationError('You cannot message yourself.')
        low, high = sorted([other.pk, request.user.pk])
        conv, _ = Conversation.objects.get_or_create(user_low_id=low, user_high_id=high)
        return JsonResponse({'conversation': conversation_data(conv, request.user)}, status=201)
    convs = Conversation.objects.filter(Q(user_low=request.user) | Q(user_high=request.user)).select_related('user_low', 'user_high')
    rows = sorted([conversation_data(c, request.user) for c in convs], key=lambda c: c['timestamp'], reverse=True)
    return JsonResponse({'conversations': rows})


@endpoint(['GET', 'POST'])
def messages(request, pk):
    conv = get_object_or_404(Conversation.objects.filter(Q(user_low=request.user) | Q(user_high=request.user)), pk=pk)
    if request.method == 'POST':
        text = text_field(request.data, 'text', 5000, True)
        Message.objects.create(conversation=conv, sender=request.user, text=text)
    conv.messages.exclude(sender=request.user).filter(read_at=None).update(read_at=timezone.now())
    rows = [{'id': m.pk, 'text': m.text, 'sender_id': m.sender_id, 'timestamp': m.created_at.isoformat(), 'read': m.read_at is not None}
            for m in conv.messages.all()]
    return JsonResponse({'messages': rows})


def csrf_failure(request, reason=''):
    return JsonResponse({'message': 'Your session has changed. Reload the page and try again.'}, status=403)
