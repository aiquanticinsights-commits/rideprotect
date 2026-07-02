import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/services/api_client.dart';
import 'package:mobile/services/vehicle_service.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockClient;
  late VehicleService service;

  setUp(() {
    mockClient = MockApiClient();
    service = VehicleService(mockClient);
  });

  group('getVehicles', () {
    test('returns vehicle list', () async {
      final response = {
        'vehicles': [
          {'id': 'clxv1', 'make': 'Honda', 'model': 'CBR600RR', 'year': 2023},
        ]
      };
      when(() => mockClient.get('/api/v1/vehicles')).thenAnswer((_) async => response);

      final vehicles = await service.getVehicles();
      expect(vehicles.length, 1);
      expect(vehicles.first.make, 'Honda');
    });
  });

  group('createVehicle', () {
    test('sends correct body', () async {
      final data = {'make': 'Yamaha', 'model': 'MT-15', 'year': 2024};
      when(() => mockClient.post('/api/v1/vehicles', data))
          .thenAnswer((_) async => {'vehicle': { ...data, 'id': 'clxv2' }});

      final vehicle = await service.createVehicle(data);
      expect(vehicle.make, 'Yamaha');
      expect(vehicle.model, 'MT-15');
    });
  });

  group('getVehicle', () {
    test('calls correct endpoint', () async {
      when(() => mockClient.get('/api/v1/vehicles/clxv1'))
          .thenAnswer((_) async => {
            'vehicle': {'id': 'clxv1', 'make': 'Honda', 'model': 'CBR600RR', 'year': 2023},
          });

      final vehicle = await service.getVehicle('clxv1');
      expect(vehicle.id, 'clxv1');
    });
  });

  group('updateVehicle', () {
    test('sends correct body', () async {
      final updates = {'color': 'Blue'};
      when(() => mockClient.patch('/api/v1/vehicles/clxv1', updates))
          .thenAnswer((_) async => {
            'vehicle': {'id': 'clxv1', 'make': 'Honda', 'model': 'CBR600RR', 'year': 2023, 'color': 'Blue'},
          });

      final vehicle = await service.updateVehicle('clxv1', updates);
      expect(vehicle.color, 'Blue');
    });
  });

  group('deleteVehicle', () {
    test('calls correct endpoint', () async {
      when(() => mockClient.delete('/api/v1/vehicles/clxv1'))
          .thenAnswer((_) async => {});

      await service.deleteVehicle('clxv1');
      verify(() => mockClient.delete('/api/v1/vehicles/clxv1')).called(1);
    });
  });
}
