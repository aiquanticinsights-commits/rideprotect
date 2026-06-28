import '../models/alert.dart';
import 'api_client.dart';

class AlertService {
  final ApiClient _client;

  AlertService(this._client);

  Future<Map<String, dynamic>> getAlerts({
    int page = 1,
    int limit = 50,
    String? type,
    String? severity,
    bool? acknowledged,
  }) async {
    String path = '/api/v1/alerts?page=$page&limit=$limit';
    if (type != null && type != 'All') path += '&type=$type';
    if (severity != null && severity != 'All') path += '&severity=$severity';
    if (acknowledged != null) path += '&acknowledged=$acknowledged';

    final data = await _client.get(path);
    final alerts = (data['alerts'] as List<dynamic>)
        .map((a) => Alert.fromJson(a as Map<String, dynamic>))
        .toList();
    return {
      'alerts': alerts,
      'total': data['total'] as int,
      'page': data['page'] as int,
      'pages': data['pages'] as int,
    };
  }

  Future<Alert> acknowledgeAlert(String id) async {
    final data = await _client.patch('/api/v1/alerts/$id/acknowledge', {});
    return Alert.fromJson(data['alert'] as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> getAlertStats() async {
    final data = await _client.get('/api/v1/alerts/stats');
    return data['stats'] as Map<String, dynamic>;
  }
}
