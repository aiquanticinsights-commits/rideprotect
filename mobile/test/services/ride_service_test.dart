import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/models/ride.dart';
import 'package:mobile/services/api_client.dart';
import 'package:mobile/services/ride_service.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockClient;
  late RideService service;

  setUp(() {
    mockClient = MockApiClient();
    service = RideService(mockClient);
  });

  group('getRides', () {
    test('returns paginated rides', () async {
      final response = {
        'rides': [
          {
            'id': 'clx1', 'userId': 'u1', 'vehicleId': 'v1',
            'startLat': 17.44, 'startLng': 78.38,
            'startTime': '2026-06-25T10:00:00Z', 'status': 'COMPLETED',
            'createdAt': '2026-06-25T10:00:00Z', 'updatedAt': '2026-06-25T11:00:00Z',
          }
        ],
        'total': 1, 'page': 1, 'pages': 1,
      };
      when(() => mockClient.get('/api/v1/rides?page=1&limit=20')).thenAnswer((_) async => response);

      final result = await service.getRides();
      expect((result['rides'] as List).length, 1);
      expect((result['rides'] as List).first.id, 'clx1');
      expect(result['total'], 1);
    });

    test('passes status filter', () async {
      when(() => mockClient.get('/api/v1/rides?page=1&limit=20&status=ACTIVE'))
          .thenAnswer((_) async => {'rides': [], 'total': 0, 'page': 1, 'pages': 1});

      await service.getRides(status: 'Active');
      verify(() => mockClient.get('/api/v1/rides?page=1&limit=20&status=ACTIVE')).called(1);
    });
  });

  group('getRide', () {
    test('returns ride by id', () async {
      final response = {
        'ride': {
          'id': 'clx1', 'userId': 'u1', 'vehicleId': 'v1',
          'startLat': 17.44, 'startLng': 78.38,
          'startTime': '2026-06-25T10:00:00Z', 'status': 'ACTIVE',
          'createdAt': '2026-06-25T10:00:00Z', 'updatedAt': '2026-06-25T10:00:00Z',
        }
      };
      when(() => mockClient.get('/api/v1/rides/clx1')).thenAnswer((_) async => response);

      final ride = await service.getRide('clx1');
      expect(ride.id, 'clx1');
      expect(ride.status, 'ACTIVE');
    });
  });

  group('startRide', () {
    test('sends correct body', () async {
      final response = {
        'ride': {
          'id': 'clxnew', 'userId': 'u1', 'vehicleId': 'v1',
          'startLat': 17.443, 'startLng': 78.380,
          'startTime': '2026-06-25T10:00:00Z', 'status': 'ACTIVE',
          'createdAt': '2026-06-25T10:00:00Z', 'updatedAt': '2026-06-25T10:00:00Z',
        }
      };
      when(() => mockClient.post('/api/v1/rides/start', any()))
          .thenAnswer((_) async => response);

      final ride = await service.startRide('v1');
      expect(ride.id, 'clxnew');

      verify(() => mockClient.post('/api/v1/rides/start', {
        'vehicleId': 'v1', 'startLat': 17.443, 'startLng': 78.380,
      })).called(1);
    });
  });

  group('endRide', () {
    test('sends correct body with defaults', () async {
      when(() => mockClient.patch('/api/v1/rides/clx1/end', any()))
          .thenAnswer((_) async => {
            'ride': {
              'id': 'clx1', 'userId': 'u1', 'vehicleId': 'v1',
              'startLat': 17.44, 'startLng': 78.38,
              'endLat': 17.443, 'endLng': 78.380,
              'startTime': '2026-06-25T10:00:00Z', 'status': 'COMPLETED',
              'score': 85.0,
              'createdAt': '2026-06-25T10:00:00Z', 'updatedAt': '2026-06-25T11:00:00Z',
            }
          });

      final ride = await service.endRide('clx1');
      expect(ride.status, 'COMPLETED');
      expect(ride.score, 85.0);

      verify(() => mockClient.patch('/api/v1/rides/clx1/end', {
        'endLat': 17.443, 'endLng': 78.380,
      })).called(1);
    });
  });

  group('cancelRide', () {
    test('calls correct endpoint', () async {
      when(() => mockClient.patch('/api/v1/rides/clx1/cancel', any()))
          .thenAnswer((_) async => {
            'ride': {
              'id': 'clx1', 'userId': 'u1', 'vehicleId': 'v1',
              'startLat': 17.44, 'startLng': 78.38,
              'startTime': '2026-06-25T10:00:00Z', 'status': 'CANCELLED',
              'createdAt': '2026-06-25T10:00:00Z', 'updatedAt': '2026-06-25T10:30:00Z',
            }
          });

      final ride = await service.cancelRide('clx1');
      expect(ride.status, 'CANCELLED');
      verify(() => mockClient.patch('/api/v1/rides/clx1/cancel', {})).called(1);
    });
  });

  group('getRideScore', () {
    test('returns score', () async {
      when(() => mockClient.get('/api/v1/rides/clx1/score'))
          .thenAnswer((_) async => {'score': 92.0});

      final score = await service.getRideScore('clx1');
      expect(score, 92.0);
    });

    test('returns null for unscored ride', () async {
      when(() => mockClient.get('/api/v1/rides/clx1/score'))
          .thenAnswer((_) async => {'score': null});

      final score = await service.getRideScore('clx1');
      expect(score, null);
    });
  });
}
