import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/ride.dart';

void main() {
  group('Ride', () {
    final json = {
      'id': 'clx12345',
      'userId': 'clxuser1',
      'vehicleId': 'clxveh1',
      'startLat': 17.443,
      'startLng': 78.380,
      'endLat': 17.453,
      'endLng': 78.390,
      'startTime': '2026-06-25T10:00:00.000Z',
      'endTime': '2026-06-25T11:30:00.000Z',
      'distanceKm': 25.5,
      'durationSeconds': 5400,
      'status': 'COMPLETED',
      'score': 85.0,
      'createdAt': '2026-06-25T10:00:00.000Z',
      'updatedAt': '2026-06-25T11:30:00.000Z',
      'vehicle': {'make': 'Honda', 'model': 'CBR600RR', 'licensePlate': 'TS-09-AB-1234'},
    };

    test('fromJson creates ride with all fields', () {
      final r = Ride.fromJson(json);
      expect(r.id, 'clx12345');
      expect(r.userId, 'clxuser1');
      expect(r.vehicleId, 'clxveh1');
      expect(r.startLat, 17.443);
      expect(r.startLng, 78.380);
      expect(r.endLat, 17.453);
      expect(r.endLng, 78.390);
      expect(r.status, 'COMPLETED');
      expect(r.score, 85.0);
    });

    test('fromJson handles null optional fields', () {
      final minimal = {
        'id': 'clx99999',
        'userId': 'clxuser2',
        'vehicleId': 'clxveh2',
        'startLat': 17.44,
        'startLng': 78.38,
        'startTime': '2026-06-25T10:00:00.000Z',
        'status': 'ACTIVE',
        'createdAt': '2026-06-25T10:00:00.000Z',
        'updatedAt': '2026-06-25T10:00:00.000Z',
      };
      final r = Ride.fromJson(minimal);
      expect(r.endLat, null);
      expect(r.endLng, null);
      expect(r.endTime, null);
      expect(r.distanceKm, null);
      expect(r.durationSeconds, null);
      expect(r.score, null);
      expect(r.vehicleMake, null);
      expect(r.vehicleModel, null);
      expect(r.licensePlate, null);
      expect(r.alerts, null);
    });

    test('vehicleDisplayName returns formatted name', () {
      final r = Ride.fromJson(json);
      expect(r.vehicleDisplayName, 'Honda CBR600RR');
    });

    test('vehicleDisplayName returns default when no make/model', () {
      final noVehicle = {
        'id': 'clx99999',
        'userId': 'clxu',
        'vehicleId': 'clxv',
        'startLat': 17.44,
        'startLng': 78.38,
        'startTime': '2026-06-25T10:00:00.000Z',
        'status': 'ACTIVE',
        'createdAt': '2026-06-25T10:00:00.000Z',
        'updatedAt': '2026-06-25T10:00:00.000Z',
      };
      expect(Ride.fromJson(noVehicle).vehicleDisplayName, 'Vehicle');
    });

    test('durationFormatted formats hours and minutes', () {
      final r = Ride.fromJson({...json, 'durationSeconds': 3661});
      expect(r.durationFormatted, '1h 1m');
    });

    test('durationFormatted formats minutes and seconds', () {
      final r = Ride.fromJson({...json, 'durationSeconds': 125});
      expect(r.durationFormatted, '2m 5s');
    });

    test('durationFormatted returns -- for null duration', () {
      final r = Ride.fromJson({...json, 'durationSeconds': null});
      expect(r.durationFormatted, '--');
    });

    test('distanceFormatted formats km', () {
      expect(Ride.fromJson(json).distanceFormatted, '25.5 km');
    });

    test('distanceFormatted returns -- for null distance', () {
      final r = Ride.fromJson({...json, 'distanceKm': null});
      expect(r.distanceFormatted, '--');
    });

    test('dateFormatted formats date string', () {
      final r = Ride.fromJson(json);
      expect(r.dateFormatted, '25/6/2026');
    });

    test('isActive returns true for ACTIVE status', () {
      final r = Ride.fromJson({...json, 'status': 'ACTIVE'});
      expect(r.isActive, true);
      expect(r.isCompleted, false);
      expect(r.isCancelled, false);
    });

    test('isCompleted returns true for COMPLETED status', () {
      expect(Ride.fromJson(json).isCompleted, true);
    });

    test('isCancelled returns true for CANCELLED status', () {
      final r = Ride.fromJson({...json, 'status': 'CANCELLED'});
      expect(r.isCancelled, true);
    });
  });

  group('AlertSummary', () {
    final json = {
      'id': 'clxalert1',
      'type': 'SPEEDING',
      'severity': 'WARNING',
      'message': 'Speed exceeded 120 km/h',
      'acknowledged': true,
      'createdAt': '2026-06-25T10:30:00.000Z',
    };

    test('fromJson creates alert summary', () {
      final a = AlertSummary.fromJson(json);
      expect(a.id, 'clxalert1');
      expect(a.type, 'SPEEDING');
      expect(a.severity, 'WARNING');
      expect(a.message, 'Speed exceeded 120 km/h');
      expect(a.acknowledged, true);
    });

    test('fromJson defaults acknowledged to false', () {
      final a = AlertSummary.fromJson({...json, 'acknowledged': null});
      expect(a.acknowledged, false);
    });

    test('dateFormatted formats correctly', () {
      final a = AlertSummary.fromJson(json);
      expect(a.dateFormatted, '25/6/2026 10:30');
    });
  });
}
