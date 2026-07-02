import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/vehicle.dart';

void main() {
  group('Vehicle', () {
    final json = {
      'id': 'clx12345',
      'make': 'Honda',
      'model': 'CBR600RR',
      'year': 2023,
      'licensePlate': 'TS-09-AB-1234',
      'vin': 'JH2PC4023PM000001',
      'color': 'Red',
      'isActive': true,
    };

    test('fromJson creates vehicle with all fields', () {
      final v = Vehicle.fromJson(json);
      expect(v.id, 'clx12345');
      expect(v.make, 'Honda');
      expect(v.model, 'CBR600RR');
      expect(v.year, 2023);
      expect(v.licensePlate, 'TS-09-AB-1234');
      expect(v.vin, 'JH2PC4023PM000001');
      expect(v.color, 'Red');
      expect(v.isActive, true);
    });

    test('fromJson handles missing optional fields', () {
      final minimal = {
        'id': 'clx99999',
        'make': 'Yamaha',
        'model': 'MT-15',
        'year': 2024,
      };
      final v = Vehicle.fromJson(minimal);
      expect(v.id, 'clx99999');
      expect(v.licensePlate, null);
      expect(v.vin, null);
      expect(v.color, null);
      expect(v.isActive, true);
    });

    test('toJson returns correct map', () {
      final v = Vehicle.fromJson(json);
      final map = v.toJson();
      expect(map['make'], 'Honda');
      expect(map['model'], 'CBR600RR');
      expect(map['year'], 2023);
      expect(map['licensePlate'], 'TS-09-AB-1234');
      expect(map['vin'], 'JH2PC4023PM000001');
      expect(map['color'], 'Red');
    });

    test('toJson excludes null optional fields', () {
      final minimal = {
        'id': 'clx99999',
        'make': 'Yamaha',
        'model': 'MT-15',
        'year': 2024,
      };
      final v = Vehicle.fromJson(minimal);
      final map = v.toJson();
      expect(map.containsKey('licensePlate'), false);
      expect(map.containsKey('vin'), false);
      expect(map.containsKey('color'), false);
    });

    test('displayName formats correctly', () {
      final v = Vehicle.fromJson(json);
      expect(v.displayName, '2023 Honda CBR600RR');
    });
  });
}
