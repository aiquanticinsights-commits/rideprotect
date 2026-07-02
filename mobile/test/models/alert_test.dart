import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/alert.dart';

void main() {
  group('Alert', () {
    final json = {
      'id': 'clxalert1',
      'rideId': 'clxride1',
      'type': 'SPEEDING',
      'severity': 'WARNING',
      'message': 'Speed exceeded 120 km/h',
      'metadata': {'speed': 125, 'limit': 80},
      'acknowledged': true,
      'acknowledgedAt': '2026-06-25T11:00:00.000Z',
      'createdAt': '2026-06-25T10:30:00.000Z',
      'ride': {'status': 'ACTIVE'},
    };

    test('fromJson creates alert with all fields', () {
      final a = Alert.fromJson(json);
      expect(a.id, 'clxalert1');
      expect(a.rideId, 'clxride1');
      expect(a.type, 'SPEEDING');
      expect(a.severity, 'WARNING');
      expect(a.message, 'Speed exceeded 120 km/h');
      expect(a.metadata, {'speed': 125, 'limit': 80});
      expect(a.acknowledged, true);
      expect(a.acknowledgedAt, '2026-06-25T11:00:00.000Z');
      expect(a.createdAt, '2026-06-25T10:30:00.000Z');
      expect(a.rideStatus, 'ACTIVE');
    });

    test('fromJson handles null ride relationship', () {
      final withoutRide = {...json, 'ride': null};
      final a = Alert.fromJson(withoutRide);
      expect(a.rideStatus, null);
    });

    test('fromJson defaults acknowledged to false', () {
      final a = Alert.fromJson({...json, 'acknowledged': null});
      expect(a.acknowledged, false);
    });

    test('severityColor returns correct color for each severity', () {
      expect(Alert.fromJson({...json, 'severity': 'EMERGENCY'}).severityColor, Colors.red.shade900);
      expect(Alert.fromJson({...json, 'severity': 'CRITICAL'}).severityColor, Colors.red);
      expect(Alert.fromJson({...json, 'severity': 'WARNING'}).severityColor, Colors.orange);
      expect(Alert.fromJson({...json, 'severity': 'INFO'}).severityColor, Colors.blue);
      expect(Alert.fromJson({...json, 'severity': 'UNKNOWN'}).severityColor, Colors.grey);
    });

    test('severityIcon returns correct icon for each severity', () {
      expect(Alert.fromJson({...json, 'severity': 'EMERGENCY'}).severityIcon, Icons.warning);
      expect(Alert.fromJson({...json, 'severity': 'CRITICAL'}).severityIcon, Icons.error);
      expect(Alert.fromJson({...json, 'severity': 'WARNING'}).severityIcon, Icons.warning_amber);
      expect(Alert.fromJson({...json, 'severity': 'INFO'}).severityIcon, Icons.info);
      expect(Alert.fromJson({...json, 'severity': 'UNKNOWN'}).severityIcon, Icons.circle);
    });

    test('typeLabel returns correct label for each type', () {
      expect(Alert.fromJson({...json, 'type': 'SPEEDING'}).typeLabel, 'Speeding');
      expect(Alert.fromJson({...json, 'type': 'HARD_BRAKE'}).typeLabel, 'Hard Brake');
      expect(Alert.fromJson({...json, 'type': 'HARD_ACCELERATION'}).typeLabel, 'Hard Acceleration');
      expect(Alert.fromJson({...json, 'type': 'SHARP_TURN'}).typeLabel, 'Sharp Turn');
      expect(Alert.fromJson({...json, 'type': 'GEOFENCE_BREACH'}).typeLabel, 'Geofence Breach');
      expect(Alert.fromJson({...json, 'type': 'DEVICE_DISCONNECTED'}).typeLabel, 'Device Disconnected');
      expect(Alert.fromJson({...json, 'type': 'LOW_BATTERY'}).typeLabel, 'Low Battery');
      expect(Alert.fromJson({...json, 'type': 'CRASH_DETECTED'}).typeLabel, 'Crash Detected');
      expect(Alert.fromJson({...json, 'type': 'SOS'}).typeLabel, 'SOS');
    });

    test('typeLabel returns raw type for unknown', () {
      expect(Alert.fromJson({...json, 'type': 'CUSTOM_EVENT'}).typeLabel, 'CUSTOM_EVENT');
    });

    test('dateFormatted formats correctly', () {
      final a = Alert.fromJson(json);
      expect(a.dateFormatted, '25/6/2026 10:30');
    });
  });
}
