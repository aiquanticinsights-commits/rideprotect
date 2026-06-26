import 'package:flutter/material.dart';
import '../models/vehicle.dart';
import '../services/api_client.dart';
import '../services/vehicle_service.dart';
import 'add_vehicle_screen.dart';

class VehiclesScreen extends StatefulWidget {
  final ApiClient apiClient;

  const VehiclesScreen({super.key, required this.apiClient});

  @override
  State<VehiclesScreen> createState() => _VehiclesScreenState();
}

class _VehiclesScreenState extends State<VehiclesScreen> {
  late final VehicleService _vehicleService;
  List<Vehicle> _vehicles = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _vehicleService = VehicleService(widget.apiClient);
    _loadVehicles();
  }

  Future<void> _loadVehicles() async {
    setState(() => _loading = true);
    try {
      final vehicles = await _vehicleService.getVehicles();
      setState(() {
        _vehicles = vehicles;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load vehicles: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _addVehicle() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => AddVehicleScreen(vehicleService: _vehicleService),
      ),
    );
    if (result == true) _loadVehicles();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Vehicles')),
      floatingActionButton: FloatingActionButton(
        onPressed: _addVehicle,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _vehicles.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.directions_car, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No vehicles yet', style: TextStyle(fontSize: 18, color: Colors.grey)),
                      Text('Tap + to add one'),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadVehicles,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _vehicles.length,
                    itemBuilder: (context, index) {
                      final v = _vehicles[index];
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Icon(v.color != null ? Icons.directions_car : Icons.motorcycle),
                          ),
                          title: Text(v.displayName),
                          subtitle: Text([
                            if (v.licensePlate != null) v.licensePlate!,
                            if (v.vin != null) 'VIN: ${v.vin}',
                          ].join('\n')),
                          trailing: v.isActive
                              ? const Chip(label: Text('Active'), backgroundColor: Colors.green)
                              : null,
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
