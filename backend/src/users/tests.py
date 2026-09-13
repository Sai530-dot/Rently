import json
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.cache import cache
from django.core.management import call_command
from django.test import Client, TestCase, override_settings

from .location_insights import (
    GEOAPIFY_GEOCODE_URL,
    LocationInsightsProviderError,
    analyze_property,
    generate_offer_analysis,
)
from .models import Conversation, CustomUser, Property, RoommateProfile, SavedProperty


PASSWORD = 'RainyAvenue!483'


class ReeltyApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()

    def post(self, path, data=None, client=None):
        return (client or self.client).post(path, json.dumps(data or {}), content_type='application/json')

    def patch(self, path, data=None, client=None):
        return (client or self.client).patch(path, json.dumps(data or {}), content_type='application/json')

    def signup(self, email, kind='student', name='Taylor Reed'):
        data = {'email': email, 'password': PASSWORD, 'name': name}
        data['university' if kind == 'student' else 'phone'] = 'University of Saskatchewan' if kind == 'student' else '+13065550123'
        response = self.post(f'/api/signup/{kind}/', data)
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()['user']

    def complete_profile(self, city='Saskatoon', budget=1200):
        response = self.post('/api/profile/', {
            'city': city, 'budget': budget, 'completed': True,
            'cleanliness': 'clean', 'sleepSchedule': 'early_bird',
            'interests': ['hiking', 'music'], 'numRoommates': 1,
        })
        self.assertEqual(response.status_code, 200, response.content)

    def test_signup_session_logout_and_password_login(self):
        user = self.signup('student1@example.ca')
        session = self.client.get('/api/auth/session/').json()
        self.assertEqual(session['user']['id'], user['id'])
        self.assertTrue(session['csrfToken'])
        self.assertEqual(self.post('/api/auth/logout/').status_code, 200)
        self.assertIsNone(self.client.get('/api/auth/session/').json()['user'])
        bad = self.post('/api/auth/login/', {'email': 'student1@example.ca', 'password': 'wrong', 'user_type': 'student'})
        self.assertEqual(bad.status_code, 401)
        good = self.post('/api/auth/login/', {'email': 'student1@example.ca', 'password': PASSWORD, 'user_type': 'student'})
        self.assertEqual(good.status_code, 200)

    def test_signup_rejects_duplicate_and_common_password(self):
        self.signup('duplicate@example.ca')
        duplicate = self.post('/api/signup/student/', {'email': 'DUPLICATE@example.ca', 'password': PASSWORD, 'name': 'Other', 'university': 'School'})
        self.assertEqual(duplicate.status_code, 409)
        common = self.post('/api/signup/student/', {'email': 'common@example.ca', 'password': 'password', 'name': 'Other', 'university': 'School'})
        self.assertEqual(common.status_code, 400)

    def test_landlord_property_crud_and_student_permissions(self):
        landlord = self.signup('landlord@example.ca', 'landlord', 'Morgan Lee')
        create = self.post('/api/properties/', {'title': 'Bright apartment', 'address': '10 River St', 'city': 'Saskatoon', 'province': 'sk', 'rent': 1400, 'bedrooms': 2, 'bathrooms': 1, 'property_type': 'Apartment'})
        self.assertEqual(create.status_code, 201, create.content)
        prop = create.json()['property']
        self.assertEqual(prop['owner_id'], landlord['id'])
        updated = self.patch(f"/api/properties/{prop['id']}/", {'rent': 1450, 'active': False})
        self.assertEqual(updated.json()['property']['rent'], 1450)
        self.post('/api/auth/logout/')
        self.signup('tenant@example.ca')
        forbidden = self.post('/api/properties/', {'title': 'Nope', 'address': '1 A St', 'city': 'Saskatoon', 'rent': 1000})
        self.assertEqual(forbidden.status_code, 403)
        hidden = self.client.get(f"/api/properties/{prop['id']}/")
        self.assertEqual(hidden.status_code, 404)

    def test_saved_properties_are_account_scoped(self):
        landlord = CustomUser.objects.create_user('owner@example.ca', email='owner@example.ca', password=PASSWORD, user_type='landlord', first_name='Owner')
        prop = Property.objects.create(owner=landlord, title='House', address='2 Main St', city='Regina', province='SK', rent=1250, bedrooms=1, bathrooms=1)
        self.signup('saver@example.ca')
        self.assertEqual(self.post(f'/api/saved-properties/{prop.id}/').status_code, 200)
        self.assertEqual(self.client.get('/api/saved-properties/').json()['properties'][0]['id'], prop.id)
        self.post('/api/auth/logout/')
        self.signup('other@example.ca')
        self.assertEqual(self.client.get('/api/saved-properties/').json()['properties'], [])

    def test_roommate_decisions_and_messages_work_between_accounts(self):
        first = self.signup('first@example.ca', name='First')
        self.complete_profile()
        self.post('/api/auth/logout/')
        second = self.signup('second@example.ca', name='Second')
        self.complete_profile()
        candidates = self.client.get('/api/roommates/').json()['matches']
        self.assertEqual(candidates[0]['id'], first['id'])
        self.assertEqual(self.post(f"/api/roommates/{first['id']}/decision/", {'liked': True}).status_code, 200)
        created = self.post('/api/conversations/', {'recipient_id': first['id']})
        conversation_id = created.json()['conversation']['id']
        sent = self.post(f'/api/conversations/{conversation_id}/messages/', {'text': 'Hello from Second'})
        self.assertEqual(sent.json()['messages'][0]['text'], 'Hello from Second')
        self.post('/api/auth/logout/')
        self.assertEqual(self.post('/api/auth/login/', {'email': 'first@example.ca', 'password': PASSWORD, 'user_type': 'student'}).status_code, 200)
        inbox = self.client.get('/api/conversations/').json()['conversations']
        self.assertEqual(inbox[0]['unread'], 1)
        messages = self.client.get(f'/api/conversations/{conversation_id}/messages/').json()['messages']
        self.assertEqual(messages[0]['sender_id'], second['id'])
        self.assertEqual(self.client.get('/api/conversations/').json()['conversations'][0]['unread'], 0)

    def test_csrf_is_required_for_authenticated_mutations(self):
        self.signup('csrf@example.ca')
        cookie = self.client.cookies['sessionid'].value
        checked = Client(enforce_csrf_checks=True)
        checked.cookies['sessionid'] = cookie
        rejected = checked.post('/api/profile/', '{}', content_type='application/json')
        self.assertEqual(rejected.status_code, 403)
        token = checked.get('/api/auth/session/').json()['csrfToken']
        accepted = checked.post('/api/profile/', json.dumps({'city': 'Regina'}), content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(accepted.status_code, 200)


class LocationInsightsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create_user(
            username='insights@example.ca', email='insights@example.ca', password=PASSWORD,
            user_type='student', first_name='Insights User',
        )
        self.owner = CustomUser.objects.create_user(
            username='insights-owner@example.ca', email='insights-owner@example.ca', password=PASSWORD,
            user_type='landlord', first_name='Insights Owner',
        )
        self.property = Property.objects.create(
            owner=self.owner, title='Campus apartment', address='101 College Drive', city='Saskatoon', province='SK',
            rent=1400, bedrooms=1, bathrooms=1, lat=52.128, lon=-106.634,
        )
        self.client.force_login(self.user)

    def post(self, data):
        return self.client.post('/api/location-insights/analyze/', json.dumps(data), content_type='application/json')

    def geocode_and_places(self, url, params):
        if url == GEOAPIFY_GEOCODE_URL:
            return {'features': [{'properties': {
                'formatted': '101 College Drive, Saskatoon, SK, Canada',
                'housenumber': '101', 'street': 'College Drive', 'lat': 52.128, 'lon': -106.634,
            }, 'geometry': {'coordinates': [-106.634, 52.128]}}]}
        return {'features': [{'properties': {
            'name': 'Campus Market', 'formatted': '100 College Drive, Saskatoon, SK, Canada', 'distance': 180,
        }}]}

    def provider_response(self):
        return {'candidates': [{'content': {'parts': [{'text': json.dumps({
            'transit_summary': 'One nearby transit stop was returned by the supplied evidence.',
            'student_fit_summary': 'The available nearby amenities may be useful to students.',
            'ai_summary': 'This summary only reflects the supplied location evidence.',
            'limitations': ['No verified public-safety dataset is configured.'],
        })}]}}]}

    @override_settings(GEOAPIFY_API_KEY='test-geoapify-key', GEMINI_API_KEY='test-gemini-key')
    @patch('users.location_insights._request_json')
    @patch('users.location_insights._geoapify_get')
    def test_detailed_location_uses_geocoding_and_caches_grounded_response(self, geoapify, provider):
        geoapify.side_effect = self.geocode_and_places
        provider.return_value = self.provider_response()

        first = analyze_property(self.property)
        second = analyze_property(self.property)

        self.assertEqual(first, second)
        self.assertEqual(first['location']['scope'], 'detailed')
        self.assertTrue(first['data_quality']['geocoded_coordinates_used'])
        self.assertFalse(first['data_quality']['stored_coordinates_used'])
        self.assertEqual(first['safety']['status'], 'unavailable')
        self.assertIsNone(first['safety']['rating'])
        self.assertEqual(first['amenities']['grocery'][0]['name'], 'Campus Market')
        self.assertEqual(provider.call_count, 1)
        self.assertIn('gemini-3.5-flash-lite:generateContent', provider.call_args.args[0])
        self.assertEqual(provider.call_args.kwargs['headers'], {'x-goog-api-key': 'test-gemini-key'})
        payload = provider.call_args.kwargs['payload']
        self.assertEqual(payload['generationConfig']['responseMimeType'], 'application/json')
        self.assertNotIn('tools', payload)
        self.assertIn('Never infer or invent crime statistics', payload['systemInstruction']['parts'][0]['text'])
        evidence = json.loads(payload['contents'][0]['parts'][0]['text'])
        self.assertEqual(evidence['location']['display_name'], first['location']['display_name'])

    @override_settings(GEOAPIFY_API_KEY='test-geoapify-key', GEMINI_API_KEY='test-gemini-key')
    @patch('users.location_insights._request_json')
    @patch('users.location_insights._geoapify_get')
    def test_insufficient_nearby_evidence_returns_without_calling_gemini(self, geoapify, provider):
        def detailed_location_without_places(url, params):
            if url == GEOAPIFY_GEOCODE_URL:
                return self.geocode_and_places(url, params)
            return {'features': []}

        geoapify.side_effect = detailed_location_without_places
        response = analyze_property(self.property)

        self.assertTrue(response['data_quality']['insufficient_evidence'])
        self.assertIn('not enough nearby evidence', response['ai_summary'])
        provider.assert_not_called()

    def test_city_only_and_imported_synthetic_locations_are_unavailable(self):
        city_only = Property.objects.create(
            owner=self.owner, title='City listing', address='', city='Regina', province='SK', rent=1200, bedrooms=1, bathrooms=1,
        )
        imported = Property.objects.create(
            title='Imported listing', address='', city='Regina', province='SK', rent=1200, bedrooms=1, bathrooms=1,
            lat=50.445, lon=-104.618,
        )

        city_response = analyze_property(city_only)
        imported_response = analyze_property(imported)

        self.assertEqual(city_response['location']['scope'], 'city')
        self.assertFalse(city_response['data_quality']['stored_coordinates_used'])
        self.assertEqual(imported_response['location']['scope'], 'city')
        self.assertFalse(imported_response['data_quality']['stored_coordinates_used'])
        self.assertIn('synthetic coordinates', ' '.join(imported_response['limitations']))

    def test_endpoint_validates_input_and_returns_provider_errors(self):
        unauthenticated = Client().post('/api/location-insights/analyze/', json.dumps({'property_id': self.property.id}), content_type='application/json')
        self.assertEqual(unauthenticated.status_code, 401)
        self.assertEqual(self.post({'property_id': True}).status_code, 400)
        self.assertEqual(self.post({'property_id': 0}).status_code, 400)
        expected = {'location': {'scope': 'city', 'display_name': 'Saskatoon, SK, Canada'}}
        with patch('users.api.analyze_property', return_value=expected):
            success = self.post({'property_id': self.property.id})
        self.assertEqual(success.status_code, 200)
        self.assertEqual(success.json()['insights'], expected)
        with patch('users.api.analyze_property', side_effect=LocationInsightsProviderError('llm_unavailable', 'Provider is unavailable.')):
            response = self.post({'property_id': self.property.id})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()['code'], 'llm_unavailable')


class ImportedListingSnapshotTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='snapshot@example.ca', email='snapshot@example.ca', password=PASSWORD,
            user_type='student', first_name='Snapshot User',
        )
        self.client.force_login(self.user)

    def import_items(self, items):
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / 'kijiji_listings.json'
            path.write_text(json.dumps(items), encoding='utf-8')
            call_command('import_listings', '--directory', temporary_directory)

    def source_item(self, **overrides):
        item = {
            'source_identifier': 'kijiji:1234567890',
            'url': 'https://www.kijiji.ca/v-apartments-condos/saskatoon/bright-suite/1234567890',
            'title': 'Bright one bedroom suite', 'address': 'University Heights, Saskatoon, SK', 'rent': 1350,
            'images': ['https://media.kijiji.ca/listing-1.jpg', 'https://media.kijiji.ca/listing-1.jpg', 'not-an-image'],
            'source_fields': {
                'bedrooms': 1, 'bathrooms': '1.0', 'square_feet': '650', 'property_type': 'Apartment',
                'parking': 'One included stall', 'pets': 'Cats allowed', 'utilities': ['Heat', 'Water'],
                'appliances': ['Fridge', 'Stove'], 'features': ['Balcony'], 'lease_term': '12 months',
                'available_date': 'May 1, 2027', 'description': 'A source-provided listing description.',
            },
        }
        item.update(overrides)
        return item

    def test_import_persists_source_snapshot_and_updates_without_erasing_fields(self):
        self.import_items([self.source_item()])
        property_record = Property.objects.get(source_listing_id='kijiji:1234567890')
        self.assertEqual(property_record.images, ['https://media.kijiji.ca/listing-1.jpg'])
        self.assertEqual(property_record.image, 'https://media.kijiji.ca/listing-1.jpg')
        self.assertEqual(property_record.square_feet, 650)
        self.assertEqual(property_record.utilities, ['Heat', 'Water'])
        self.assertEqual(property_record.listing_status, 'unknown')

        updated = self.source_item(rent=1400, images=[], source_fields={'parking': 'Two included stalls'})
        self.import_items([updated])
        property_record.refresh_from_db()
        self.assertEqual(property_record.rent, 1400)
        self.assertEqual(property_record.images, ['https://media.kijiji.ca/listing-1.jpg'])
        self.assertEqual(property_record.square_feet, 650)
        self.assertEqual(property_record.utilities, ['Heat', 'Water'])
        self.assertEqual(property_record.parking, 'Two included stalls')

        response = self.client.get('/api/properties/')
        snapshot = response.json()['properties'][0]
        self.assertEqual(snapshot['images'], ['https://media.kijiji.ca/listing-1.jpg'])
        self.assertEqual(snapshot['features'], ['Balcony'])
        self.assertEqual(snapshot['listing_status'], 'unknown')

    def test_unavailable_import_is_hidden_from_browse_but_remains_saved(self):
        self.import_items([self.source_item()])
        property_record = Property.objects.get(source_listing_id='kijiji:1234567890')
        SavedProperty.objects.create(user=self.user, property=property_record)
        property_record.listing_status = 'unavailable'
        property_record.save(update_fields=['listing_status'])
        self.assertEqual(self.client.get('/api/properties/').json()['properties'], [])
        saved = self.client.get('/api/saved-properties/').json()['properties']
        self.assertEqual(saved[0]['id'], property_record.id)
        self.assertEqual(saved[0]['listing_status'], 'unavailable')

    @patch('users.management.commands.recheck_imported_listings.check_source_url')
    def test_recheck_records_status_and_timestamp_without_changing_local_active(self, check_source):
        self.import_items([self.source_item()])
        property_record = Property.objects.get(source_listing_id='kijiji:1234567890')
        check_source.return_value = ('unknown', 'ambiguous access response')
        call_command('recheck_imported_listings', '--property-id', str(property_record.pk))
        property_record.refresh_from_db()
        self.assertEqual(property_record.listing_status, 'unknown')
        self.assertTrue(property_record.active)
        self.assertIsNotNone(property_record.last_checked)
        check_source.assert_called_once()


class OfferEvaluatorTests(TestCase):
    payload = {
        'monthlyRent': '2000', 'securityDeposit': '2000', 'utilities': 'included',
        'utilitiesCost': '', 'leaseTerm': '12', 'location': 'Toronto, ON',
        'squareFeet': '650', 'bedrooms': '1', 'bathrooms': '1', 'parking': 'yes',
        'laundry': 'in-unit', 'petFriendly': 'no', 'furnished': 'no',
    }

    def post(self):
        return self.client.post('/api/offer-evaluation/evaluate', json.dumps(self.payload), content_type='application/json')

    @patch('users.views.generate_offer_analysis')
    def test_offer_evaluator_keeps_deterministic_result_and_adds_grounded_analysis(self, provider):
        provider.return_value = {
            'overallExplanation': 'The supplied deterministic result is below its estimate.',
            'positiveFactors': ['Utilities are included.'],
            'considerations': ['Confirm the lease terms.'],
            'limitations': ['The city baseline is limited.'],
        }

        response = self.post()

        self.assertEqual(response.status_code, 200, response.content)
        evaluation = response.json()['evaluation']
        self.assertEqual(evaluation['score'], 100)
        self.assertEqual(evaluation['marketComparison']['marketAverage'], 2750)
        self.assertTrue(evaluation['aiAnalysis']['available'])
        provider.assert_called_once()
        evidence = provider.call_args.args[0]
        self.assertEqual(evidence['calculated_results']['deterministic_deal_score'], 100)
        self.assertEqual(evidence['market_location_evidence']['detected_city'], 'Toronto')

    @patch('users.views.generate_offer_analysis', side_effect=RuntimeError('provider unavailable'))
    def test_offer_evaluator_returns_deterministic_result_when_analysis_fails(self, provider):
        response = self.post()

        self.assertEqual(response.status_code, 200, response.content)
        evaluation = response.json()['evaluation']
        self.assertEqual(evaluation['score'], 100)
        self.assertFalse(evaluation['aiAnalysis']['available'])
        self.assertIn('deterministic evaluation', evaluation['aiAnalysis']['message'])


class OfferAnalysisProviderTests(TestCase):
    @override_settings(GEMINI_API_KEY='test-gemini-key')
    @patch('users.location_insights._request_json')
    def test_offer_analysis_uses_grounded_structured_gemini_request(self, provider):
        provider.return_value = {'candidates': [{'content': {'parts': [{'text': json.dumps({
            'overall_explanation': 'This explains only the supplied deterministic evidence.',
            'positive_factors': ['Utilities are included.'],
            'considerations': ['Review lease terms.'],
            'limitations': ['The baseline is city-level.'],
        })}]}}]}
        evidence = {
            'user_inputs': {'asking_rent': 2000, 'location': 'Toronto, ON'},
            'calculated_results': {'deterministic_deal_score': 100},
        }

        analysis = generate_offer_analysis(evidence)

        self.assertEqual(analysis['overallExplanation'], 'This explains only the supplied deterministic evidence.')
        self.assertEqual(provider.call_count, 1)
        self.assertIn('gemini-3.5-flash-lite:generateContent', provider.call_args.args[0])
        self.assertEqual(provider.call_args.kwargs['headers'], {'x-goog-api-key': 'test-gemini-key'})
        payload = provider.call_args.kwargs['payload']
        self.assertEqual(payload['generationConfig']['responseMimeType'], 'application/json')
        self.assertNotIn('tools', payload)
        self.assertIn('Do not calculate, revise, estimate, infer, or invent a deal score', payload['systemInstruction']['parts'][0]['text'])
        self.assertEqual(json.loads(payload['contents'][0]['parts'][0]['text']), evidence)
