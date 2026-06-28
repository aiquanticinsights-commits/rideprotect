import '../models/ride.dart';
import 'api_client.dart';

class RideService {
  final ApiClient _client;

  RideService(this._client);

  static const double _defaultLat = 17.443;
  static const double _defaultLng = 78.380;

  Future<Map<String, dynamic>> getRides({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    String path = '/api/v1/rides?page=$page&limit=$limit';
    if (status != null && status != 'All') {
      path += '&status=${status.toUpperCase()}';
    }
    final data = await _client.get(path);
    final rides = (data['rides'] as List<dynamic>)
        .map((r) => Ride.fromJson(r as Map<String, dynamic>))
        .toList();
    return {
      'rides': rides,
      'total': data['total'] as int,
      'page': data['page'] as int,
      'pages': data['pages'] as int,
    };
  }

  Future<Ride> getRide(String id) async {
    final data = await _client.get('/api/v1/rides/$id');
    return Ride.fromJson(data['ride'] as Map<String, dynamic>);
  }

  Future<Ride> startRide(String vehicleId) async {
    final data = await _client.post('/api/v1/rides/start', {
      'vehicleId': vehicleId,
      'startLat': _defaultLat,
      'startLng': _defaultLng,
    });
    return Ride.fromJson(data['ride'] as Map<String, dynamic>);
  }

  Future<Ride> endRide(String id, {
    double? endLat,
    double? endLng,
    double? distanceKm,
  }) async {
    final body = <String, dynamic>{
      'endLat': endLat ?? _defaultLat,
      'endLng': endLng ?? _defaultLng,
    };
    if (distanceKm != null) body['distanceKm'] = distanceKm;
    final data = await _client.patch('/api/v1/rides/$id/end', body);
    return Ride.fromJson(data['ride'] as Map<String, dynamic>);
  }

  Future<Ride> cancelRide(String id) async {
    final data = await _client.patch('/api/v1/rides/$id/cancel', {});
    return Ride.fromJson(data['ride'] as Map<String, dynamic>);
  }

  Future<double?> getRideScore(String id) async {
    final data = await _client.get('/api/v1/rides/$id/score');
    return data['score'] as double?;
  }
}
