import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/models/alert.dart';
import 'package:mobile/services/api_client.dart';
import 'package:mobile/services/alert_service.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockClient;
  late AlertService service;

  setUp(() {
    mockClient = MockApiClient();
    service = AlertService(mockClient);
  });

  group('getAlerts', () {
    test('calls correct endpoint with params', () async {
      final response = {
        'alerts': [
          {
            'id': 'clxa1', 'rideId': 'clxr1', 'type': 'SPEEDING',
            'severity': 'WARNING', 'message': 'Speed exceeded',
            'createdAt': '2026-06-25T10:00:00Z',
          }
        ],
        'total': 1, 'page': 1, 'pages': 1,
      };
      when(() => mockClient.get('/api/v1/alerts?page=1&limit=50'))
          .thenAnswer((_) async => response);

      final result = await service.getAlerts();
      expect((result['alerts'] as List).length, 1);
      expect((result['alerts'] as List).first.type, 'SPEEDING');
    });

    test('passes filter params', () async {
      when(() => mockClient.get('/api/v1/alerts?page=1&limit=50&type=SPEEDING&severity=WARNING'))
          .thenAnswer((_) async => {'alerts': [], 'total': 0, 'page': 1, 'pages': 1});

      await service.getAlerts(type: 'SPEEDING', severity: 'WARNING');
      verify(() => mockClient.get(
        '/api/v1/alerts?page=1&limit=50&type=SPEEDING&severity=WARNING',
      )).called(1);
    });
  });

  group('acknowledgeAlert', () {
    test('calls correct endpoint', () async {
      when(() => mockClient.patch('/api/v1/alerts/clxa1/acknowledge', any()))
          .thenAnswer((_) async => {
            'alert': {
              'id': 'clxa1', 'rideId': 'clxr1', 'type': 'SPEEDING',
              'severity': 'WARNING', 'message': 'Speed exceeded',
              'acknowledged': true,
              'createdAt': '2026-06-25T10:00:00Z',
            }
          });

      final alert = await service.acknowledgeAlert('clxa1');
      expect(alert.acknowledged, true);
    });
  });

  group('getAlertStats', () {
    test('calls correct endpoint', () async {
      when(() => mockClient.get('/api/v1/alerts/stats'))
          .thenAnswer((_) async => {'stats': {'total': 10, 'unacknowledged': 3}});

      final stats = await service.getAlertStats();
      expect(stats['total'], 10);
      expect(stats['unacknowledged'], 3);
    });
  });
}
