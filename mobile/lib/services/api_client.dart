import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  String? _accessToken;
  String? _refreshToken;

  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';

  ApiClient();

  Future<void> loadTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString(_accessKey);
    _refreshToken = prefs.getString(_refreshKey);
  }

  Future<void> _saveTokens(String access, String refresh) async {
    _accessToken = access;
    _refreshToken = refresh;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, access);
    await prefs.setString(_refreshKey, refresh);
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
  }

  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  Future<Map<String, dynamic>> get(String path) async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> post(
      String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> patch(
      String path, Map<String, dynamic> body) async {
    final response = await http.patch(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> register(
      String email, String password, String firstName, String lastName) async {
    final data = await post(ApiConfig.register, {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
    });
    await _saveTokens(data['accessToken'], data['refreshToken']);
    return data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await post(ApiConfig.login, {
      'email': email,
      'password': password,
    });
    await _saveTokens(data['accessToken'], data['refreshToken']);
    return data;
  }

  Future<Map<String, dynamic>> getProfile() async {
    return get(ApiConfig.me);
  }

  Future<void> logout() async {
    try {
      await post(ApiConfig.refresh, {'refreshToken': _refreshToken ?? ''});
    } catch (_) {}
    await clearTokens();
  }

  bool get isAuthenticated => _accessToken != null;

  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final error = body['error'] as Map<String, dynamic>?;
    final message = error?['message'] as String? ?? 'Unknown error';
    throw ApiException(message, statusCode: response.statusCode);
  }
}
