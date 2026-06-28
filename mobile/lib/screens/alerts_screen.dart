import 'package:flutter/material.dart';
import '../models/alert.dart';
import '../services/api_client.dart';
import '../services/alert_service.dart';

class AlertsScreen extends StatefulWidget {
  final ApiClient apiClient;

  const AlertsScreen({super.key, required this.apiClient});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  late AlertService _alertService;
  List<Alert> _alerts = [];
  bool _loading = true;
  int _currentPage = 1;
  int _totalPages = 1;
  String _typeFilter = 'All';
  String _severityFilter = 'All';

  static const _types = [
    'All', 'SPEEDING', 'HARD_BRAKE', 'HARD_ACCELERATION',
    'SHARP_TURN', 'CRASH_DETECTED', 'LOW_BATTERY', 'DEVICE_DISCONNECTED',
  ];

  static const _severities = ['All', 'INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'];

  @override
  void initState() {
    super.initState();
    _alertService = AlertService(widget.apiClient);
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    setState(() => _loading = true);
    try {
      final result = await _alertService.getAlerts(
        page: _currentPage,
        type: _typeFilter,
        severity: _severityFilter,
      );
      if (!mounted) return;
      setState(() {
        _alerts = result['alerts'] as List<Alert>;
        _totalPages = result['pages'] as int;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load alerts: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _acknowledgeAlert(Alert alert) async {
    try {
      await _alertService.acknowledgeAlert(alert.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Alert acknowledged'), backgroundColor: Colors.green),
      );
      _loadAlerts();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to acknowledge: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Alerts')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Type', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 4),
                SizedBox(
                  height: 32,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: _types.map((t) {
                      final selected = t == _typeFilter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: FilterChip(
                          label: Text(t == 'All' ? 'All' : _typeLabel(t),
                              style: const TextStyle(fontSize: 11)),
                          selected: selected,
                          onSelected: (_) {
                            setState(() {
                              _typeFilter = t;
                              _currentPage = 1;
                            });
                            _loadAlerts();
                          },
                          visualDensity: VisualDensity.compact,
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 8),
                const Text('Severity', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 4),
                SizedBox(
                  height: 32,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: _severities.map((s) {
                      final selected = s == _severityFilter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: FilterChip(
                          label: Text(s, style: const TextStyle(fontSize: 11)),
                          selected: selected,
                          onSelected: (_) {
                            setState(() {
                              _severityFilter = s;
                              _currentPage = 1;
                            });
                            _loadAlerts();
                          },
                          visualDensity: VisualDensity.compact,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _alerts.isEmpty
                    ? const Center(child: Text('No alerts found'))
                    : RefreshIndicator(
                        onRefresh: _loadAlerts,
                        child: ListView.builder(
                          itemCount: _alerts.length + (_currentPage < _totalPages ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _alerts.length) {
                              return Padding(
                                padding: const EdgeInsets.all(16),
                                child: Center(
                                  child: TextButton(
                                    onPressed: () {
                                      _currentPage++;
                                      _loadAlerts();
                                    },
                                    child: const Text('Load more...'),
                                  ),
                                ),
                              );
                            }
                            return _alertTile(_alerts[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'SPEEDING': return 'Speeding';
      case 'HARD_BRAKE': return 'Hard Brake';
      case 'HARD_ACCELERATION': return 'Hard Accel';
      case 'SHARP_TURN': return 'Sharp Turn';
      case 'CRASH_DETECTED': return 'Crash';
      case 'LOW_BATTERY': return 'Low Battery';
      case 'DEVICE_DISCONNECTED': return 'Disconnected';
      default: return type;
    }
  }

  Widget _alertTile(Alert alert) {
    return Dismissible(
      key: Key(alert.id),
      direction: alert.acknowledged ? DismissDirection.none : DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.green,
        child: const Icon(Icons.check, color: Colors.white),
      ),
      onDismissed: (_) => _acknowledgeAlert(alert),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: alert.severityColor.withValues(alpha: 0.2),
            child: Icon(alert.severityIcon, color: alert.severityColor, size: 22),
          ),
          title: Row(
            children: [
              Text(alert.typeLabel, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: alert.severityColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  alert.severity,
                  style: TextStyle(
                    fontSize: 10, fontWeight: FontWeight.bold,
                    color: alert.severityColor,
                  ),
                ),
              ),
              if (alert.acknowledged) ...[
                const SizedBox(width: 6),
                Icon(Icons.check_circle, size: 14, color: Colors.green[400]),
              ],
            ],
          ),
          subtitle: Text(alert.message,
              maxLines: 2, overflow: TextOverflow.ellipsis),
          trailing: Text(alert.dateFormatted,
              style: TextStyle(fontSize: 11, color: Colors.grey[500])),
          onTap: () => _showAlertDetail(alert),
        ),
      ),
    );
  }

  void _showAlertDetail(Alert alert) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(alert.severityIcon, color: alert.severityColor, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(alert.typeLabel,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(alert.severity,
                          style: TextStyle(color: alert.severityColor, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(alert.message, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 8),
            Text('Ride ID: ${alert.rideId}', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            Text(alert.dateFormatted, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            if (alert.acknowledged)
              Text('Acknowledged', style: TextStyle(color: Colors.green[600], fontWeight: FontWeight.w500)),
            const SizedBox(height: 16),
            if (!alert.acknowledged)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _acknowledgeAlert(alert);
                  },
                  child: const Text('Acknowledge'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
