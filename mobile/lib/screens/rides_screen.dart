import 'package:flutter/material.dart';
import '../models/ride.dart';
import '../services/api_client.dart';
import '../services/ride_service.dart';
import 'ride_detail_screen.dart';

class RidesScreen extends StatefulWidget {
  final ApiClient apiClient;

  const RidesScreen({super.key, required this.apiClient});

  @override
  State<RidesScreen> createState() => _RidesScreenState();
}

class _RidesScreenState extends State<RidesScreen> {
  late RideService _rideService;
  List<Ride> _rides = [];
  bool _loading = true;
  int _currentPage = 1;
  int _totalPages = 1;
  String _statusFilter = 'All';

  static const _statuses = ['All', 'Active', 'Completed', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _rideService = RideService(widget.apiClient);
    _loadRides();
  }

  Future<void> _loadRides() async {
    setState(() => _loading = true);
    try {
      final result = await _rideService.getRides(
        page: _currentPage,
        status: _statusFilter,
      );
      if (!mounted) return;
      setState(() {
        _rides = result['rides'] as List<Ride>;
        _totalPages = result['pages'] as int;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load rides: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rides')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _statuses.map((s) {
                  final selected = s == _statusFilter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(s),
                      selected: selected,
                      onSelected: (_) {
                        setState(() {
                          _statusFilter = s;
                          _currentPage = 1;
                        });
                        _loadRides();
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _rides.isEmpty
                    ? const Center(child: Text('No rides found'))
                    : RefreshIndicator(
                        onRefresh: _loadRides,
                        child: ListView.builder(
                          itemCount: _rides.length + (_currentPage < _totalPages ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _rides.length) {
                              return Padding(
                                padding: const EdgeInsets.all(16),
                                child: Center(
                                  child: TextButton(
                                    onPressed: () {
                                      _currentPage++;
                                      _loadRides();
                                    },
                                    child: const Text('Load more...'),
                                  ),
                                ),
                              );
                            }
                            return _rideTile(_rides[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _rideTile(Ride ride) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: ride.isActive
              ? Colors.green
              : ride.isCompleted
                  ? Colors.blue
                  : Colors.grey,
          child: Icon(
            ride.isActive ? Icons.play_arrow : ride.isCompleted ? Icons.check : Icons.cancel,
            color: Colors.white,
          ),
        ),
        title: Text(ride.vehicleDisplayName),
        subtitle: Text('${ride.dateFormatted}  \u2022  ${ride.durationFormatted}'),
        trailing: ride.score != null
            ? Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: ride.score! >= 70
                      ? Colors.green.shade100
                      : ride.score! >= 40
                          ? Colors.orange.shade100
                          : Colors.red.shade100,
                ),
                child: Center(
                  child: Text(
                    '${ride.score!.toInt()}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: ride.score! >= 70
                          ? Colors.green.shade800
                          : ride.score! >= 40
                              ? Colors.orange.shade800
                              : Colors.red.shade800,
                    ),
                  ),
                ),
              )
            : Text(ride.status, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => RideDetailScreen(
                apiClient: widget.apiClient,
                rideId: ride.id,
              ),
            ),
          );
        },
      ),
    );
  }
}
