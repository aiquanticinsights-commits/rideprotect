class ApiConfig {
  static const String _defaultBaseUrl = 'http://10.0.2.2:3000';

  static String get baseUrl {
    const fromDefine = String.fromEnvironment('API_BASE_URL');
    return fromDefine.isNotEmpty ? fromDefine : _defaultBaseUrl;
  }

  static const String register = '/api/v1/auth/register';
  static const String login = '/api/v1/auth/login';
  static const String refresh = '/api/v1/auth/refresh';
  static const String me = '/api/v1/auth/me';
  static const String vehicles = '/api/v1/vehicles';
  static const String rides = '/api/v1/rides';
  static const String alerts = '/api/v1/alerts';
  static const String devices = '/api/v1/devices';
}
