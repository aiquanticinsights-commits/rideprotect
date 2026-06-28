import 'package:flutter/material.dart';

class Alert {
  final String id;
  final String rideId;
  final String type;
  final String severity;
  final String message;
  final Map<String, dynamic>? metadata;
  final bool acknowledged;
  final String? acknowledgedAt;
  final String createdAt;
  final String? rideStatus;

  Alert({
    required this.id,
    required this.rideId,
    required this.type,
    required this.severity,
    required this.message,
    this.metadata,
    this.acknowledged = false,
    this.acknowledgedAt,
    required this.createdAt,
    this.rideStatus,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    final ride = json['ride'] as Map<String, dynamic>?;

    return Alert(
      id: json['id'] as String,
      rideId: json['rideId'] as String,
      type: json['type'] as String,
      severity: json['severity'] as String,
      message: json['message'] as String,
      metadata: json['metadata'] as Map<String, dynamic>?,
      acknowledged: json['acknowledged'] as bool? ?? false,
      acknowledgedAt: json['acknowledgedAt'] as String?,
      createdAt: json['createdAt'] as String,
      rideStatus: ride?['status'] as String?,
    );
  }

  Color get severityColor {
    switch (severity) {
      case 'EMERGENCY':
        return Colors.red.shade900;
      case 'CRITICAL':
        return Colors.red;
      case 'WARNING':
        return Colors.orange;
      case 'INFO':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData get severityIcon {
    switch (severity) {
      case 'EMERGENCY':
        return Icons.warning;
      case 'CRITICAL':
        return Icons.error;
      case 'WARNING':
        return Icons.warning_amber;
      case 'INFO':
        return Icons.info;
      default:
        return Icons.circle;
    }
  }

  String get typeLabel {
    switch (type) {
      case 'SPEEDING':
        return 'Speeding';
      case 'HARD_BRAKE':
        return 'Hard Brake';
      case 'HARD_ACCELERATION':
        return 'Hard Acceleration';
      case 'SHARP_TURN':
        return 'Sharp Turn';
      case 'GEOFENCE_BREACH':
        return 'Geofence Breach';
      case 'DEVICE_DISCONNECTED':
        return 'Device Disconnected';
      case 'LOW_BATTERY':
        return 'Low Battery';
      case 'CRASH_DETECTED':
        return 'Crash Detected';
      case 'SOS':
        return 'SOS';
      default:
        return type;
    }
  }

  String get dateFormatted {
    final dt = DateTime.parse(createdAt);
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '${dt.day}/${dt.month}/${dt.year} $hour:$minute';
  }
}
