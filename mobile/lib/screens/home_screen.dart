import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import 'login_screen.dart';
import 'vehicles_screen.dart';

class HomeScreen extends StatefulWidget {
  final ApiClient apiClient;

  const HomeScreen({super.key, required this.apiClient});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  User? _user;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final data = await widget.apiClient.getProfile();
      setState(() {
        _user = User.fromJson(data['user'] as Map<String, dynamic>);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load profile: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _logout() async {
    await widget.apiClient.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => LoginScreen(apiClient: widget.apiClient)),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RideProtect'),
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _user == null
              ? const Center(child: Text('Could not load profile'))
              : RefreshIndicator(
                  onRefresh: _loadProfile,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 32,
                                child: Text(
                                  '${_user!.firstName[0]}${_user!.lastName[0]}',
                                  style: const TextStyle(fontSize: 24),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(_user!.fullName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                                    Text(_user!.email, style: TextStyle(color: Colors.grey[600])),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _menuItem(
                        icon: Icons.directions_car,
                        title: 'My Vehicles',
                        subtitle: 'Manage your vehicles',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => VehiclesScreen(apiClient: widget.apiClient),
                          ),
                        ),
                      ),
                      _menuItem(
                        icon: Icons.route,
                        title: 'Rides',
                        subtitle: 'View ride history',
                        onTap: () => _showSnackBar('Coming soon'),
                      ),
                      _menuItem(
                        icon: Icons.warning_amber,
                        title: 'Alerts',
                        subtitle: 'Check safety alerts',
                        onTap: () => _showSnackBar('Coming soon'),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _menuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: ListTile(
        leading: Icon(icon, size: 32),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}
