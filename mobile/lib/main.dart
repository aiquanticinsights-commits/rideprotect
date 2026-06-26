import 'package:flutter/material.dart';
import 'services/api_client.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const RideProtectApp());
}

class RideProtectApp extends StatefulWidget {
  const RideProtectApp({super.key});

  @override
  State<RideProtectApp> createState() => _RideProtectAppState();
}

class _RideProtectAppState extends State<RideProtectApp> {
  final ApiClient _apiClient = ApiClient();
  bool _checking = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _apiClient.loadTokens();
    setState(() => _checking = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const MaterialApp(
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    return MaterialApp(
      title: 'RideProtect',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.indigo,
        useMaterial3: true,
        brightness: Brightness.light,
      ),
      home: _apiClient.isAuthenticated
          ? HomeScreen(apiClient: _apiClient)
          : LoginScreen(apiClient: _apiClient),
    );
  }
}
