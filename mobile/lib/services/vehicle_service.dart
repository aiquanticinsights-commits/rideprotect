import '../models/vehicle.dart';
import 'api_client.dart';

class VehicleService {
  final ApiClient _client;

  VehicleService(this._client);

  Future<List<Vehicle>> getVehicles() async {
    final data = await _client.get('/api/v1/vehicles');
    final list = data['vehicles'] as List<dynamic>;
    return list.map((v) => Vehicle.fromJson(v as Map<String, dynamic>)).toList();
  }

  Future<Vehicle> createVehicle(Map<String, dynamic> vehicleData) async {
    final data = await _client.post('/api/v1/vehicles', vehicleData);
    return Vehicle.fromJson(data['vehicle'] as Map<String, dynamic>);
  }

  Future<Vehicle> getVehicle(String id) async {
    final data = await _client.get('/api/v1/vehicles/$id');
    return Vehicle.fromJson(data['vehicle'] as Map<String, dynamic>);
  }

  Future<Vehicle> updateVehicle(String id, Map<String, dynamic> vehicleData) async {
    final data = await _client.patch('/api/v1/vehicles/$id', vehicleData);
    return Vehicle.fromJson(data['vehicle'] as Map<String, dynamic>);
  }

  Future<void> deleteVehicle(String id) async {
    await _client.delete('/api/v1/vehicles/$id');
  }
}
