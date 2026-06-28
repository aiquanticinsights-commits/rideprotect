import 'package:flutter/material.dart';
import '../models/ride.dart';
import '../services/api_client.dart';
import '../services/ride_service.dart';

class RideDetailScreen extends StatefulWidget {
  final ApiClient apiClient;
  final String rideId;

  const RideDetailScreen({
    super.key,
    required this.apiClient,
    required this.rideId,
  });

  @override
  State<RideDetailScreen> createState() => _RideDetailScreenState();
}

class _RideDetailScreenState extends State<RideDetailScreen> {
  late RideService _rideService;
  Ride? _ride;
  bool _loading = true;
  bool _actionLoading = false;

  @override
  void initState() {
    super.initState();
    _rideService = RideService(widget.apiClient);
    _loadRide();
  }

  Future<void> _loadRide() async {
    setState(() => _loading = true);
    try {
      final ride = await _rideService.getRide(widget.rideId);
      if (!mounted) return;
      setState(() {
        _ride = ride;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load ride: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _endRide() async {
    setState(() => _actionLoading = true);
    try {
      final ride = await _rideService.endRide(widget.rideId);
      if (!mounted) return;
      setState(() {
        _ride = ride;
        _actionLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Ride ended! Score: ${ride.score?.toStringAsFixed(0) ?? "N/A"}'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _actionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to end ride: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _cancelRide() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Ride'),
        content: const Text('Are you sure you want to cancel this ride?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes, Cancel')),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _actionLoading = true);
    try {
      final ride = await _rideService.cancelRide(widget.rideId);
      if (!mounted) return;
      setState(() {
        _ride = ride;
        _actionLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ride cancelled'), backgroundColor: Colors.orange),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _actionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to cancel ride: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ride Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ride == null
              ? const Center(child: Text('Could not load ride'))
              : RefreshIndicator(
                  onRefresh: _loadRide,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _statusCard(),
                      const SizedBox(height: 16),
                      if (_ride!.isActive) _actionButtons(),
                      if (_ride!.score != null) ...[
                        const SizedBox(height: 16),
                        _scoreCard(),
                      ],
                      const SizedBox(height: 16),
                      _statsCard(),
                      const SizedBox(height: 16),
                      _locationCard(),
                      const SizedBox(height: 16),
                      if (_ride!.alerts != null && _ride!.alerts!.isNotEmpty) ...[
                        _alertsSection(),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _statusCard() {
    final ride = _ride!;
    final Color statusColor = ride.isActive
        ? Colors.green
        : ride.isCompleted
            ? Colors.blue
            : Colors.grey;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ride.vehicleDisplayName,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    if (ride.licensePlate != null)
                      Text(ride.licensePlate!, style: TextStyle(color: Colors.grey[600])),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    ride.status,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(ride.dateFormatted, style: TextStyle(color: Colors.grey[500])),
          ],
        ),
      ),
    );
  }

  Widget _actionButtons() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _actionLoading ? null : _endRide,
                icon: _actionLoading
                    ? const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.stop),
                label: const Text('End Ride'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _actionLoading ? null : _cancelRide,
                icon: const Icon(Icons.cancel),
                label: const Text('Cancel'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _scoreCard() {
    final score = _ride!.score!;
    final Color scoreColor = score >= 70
        ? Colors.green
        : score >= 40
            ? Colors.orange
            : Colors.red;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Safety Score', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: scoreColor.withValues(alpha: 0.15),
                border: Border.all(color: scoreColor, width: 4),
              ),
              child: Center(
                child: Text(
                  '${score.toInt()}',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: scoreColor,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              score >= 80
                  ? 'Great ride!'
                  : score >= 60
                      ? 'Good, but room for improvement'
                      : 'Needs improvement',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statsCard() {
    final ride = _ride!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ride Stats', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Row(
              children: [
                _statItem(Icons.timer, 'Duration', ride.durationFormatted),
                const SizedBox(width: 24),
                _statItem(Icons.route, 'Distance', ride.distanceFormatted),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _statItem(Icons.schedule, 'Start', ride.dateFormatted),
                const SizedBox(width: 24),
                if (ride.endTime != null)
                  _statItem(Icons.schedule, 'End', ride.dateFormatted),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statItem(IconData icon, String label, String value) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _locationCard() {
    final ride = _ride!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Location', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('Start: ${ride.startLat.toStringAsFixed(4)}, ${ride.startLng.toStringAsFixed(4)}',
                style: TextStyle(color: Colors.grey[700])),
            if (ride.endLat != null)
              Text('End: ${ride.endLat!.toStringAsFixed(4)}, ${ride.endLng!.toStringAsFixed(4)}',
                  style: TextStyle(color: Colors.grey[700])),
            const SizedBox(height: 8),
            Container(
              height: 120,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.map, size: 40, color: Colors.grey[400]),
                    const SizedBox(height: 4),
                    Text('Map view', style: TextStyle(color: Colors.grey[500])),
                    Text('${ride.startLat.toStringAsFixed(2)}, ${ride.startLng.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[400])),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _alertsSection() {
    final alerts = _ride!.alerts!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Alerts (${alerts.length})',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...alerts.map((a) => ListTile(
                  dense: true,
                  leading: Icon(Icons.warning_amber, color: Colors.orange, size: 20),
                  title: Text(a.message, style: const TextStyle(fontSize: 14)),
                  subtitle: Text('${a.type}  \u2022  ${a.dateFormatted}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                )),
          ],
        ),
      ),
    );
  }
}
