class Ride {
  final String id;
  final String userId;
  final String vehicleId;
  final double startLat;
  final double startLng;
  final double? endLat;
  final double? endLng;
  final String startTime;
  final String? endTime;
  final double? distanceKm;
  final int? durationSeconds;
  final String status;
  final double? score;
  final String createdAt;
  final String updatedAt;
  final String? vehicleMake;
  final String? vehicleModel;
  final String? licensePlate;
  final List<AlertSummary>? alerts;

  Ride({
    required this.id,
    required this.userId,
    required this.vehicleId,
    required this.startLat,
    required this.startLng,
    this.endLat,
    this.endLng,
    required this.startTime,
    this.endTime,
    this.distanceKm,
    this.durationSeconds,
    required this.status,
    this.score,
    required this.createdAt,
    required this.updatedAt,
    this.vehicleMake,
    this.vehicleModel,
    this.licensePlate,
    this.alerts,
  });

  factory Ride.fromJson(Map<String, dynamic> json) {
    final vehicle = json['vehicle'] as Map<String, dynamic>?;

    List<AlertSummary>? alertList;
    if (json['alerts'] != null) {
      alertList = (json['alerts'] as List<dynamic>)
          .map((a) => AlertSummary.fromJson(a as Map<String, dynamic>))
          .toList();
    }

    return Ride(
      id: json['id'] as String,
      userId: json['userId'] as String,
      vehicleId: json['vehicleId'] as String,
      startLat: (json['startLat'] as num).toDouble(),
      startLng: (json['startLng'] as num).toDouble(),
      endLat: (json['endLat'] as num?)?.toDouble(),
      endLng: (json['endLng'] as num?)?.toDouble(),
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String?,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      durationSeconds: json['durationSeconds'] as int?,
      status: json['status'] as String,
      score: (json['score'] as num?)?.toDouble(),
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
      vehicleMake: vehicle?['make'] as String?,
      vehicleModel: vehicle?['model'] as String?,
      licensePlate: vehicle?['licensePlate'] as String?,
      alerts: alertList,
    );
  }

  String get vehicleDisplayName {
    if (vehicleMake != null && vehicleModel != null) {
      return '$vehicleMake $vehicleModel';
    }
    return 'Vehicle';
  }

  String get durationFormatted {
    if (durationSeconds == null) return '--';
    final h = durationSeconds! ~/ 3600;
    final m = (durationSeconds! % 3600) ~/ 60;
    final s = durationSeconds! % 60;
    if (h > 0) return '${h}h ${m}m';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }

  String get distanceFormatted {
    if (distanceKm == null) return '--';
    return '${distanceKm!.toStringAsFixed(1)} km';
  }

  String get dateFormatted {
    final dt = DateTime.parse(startTime);
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  bool get isActive => status == 'ACTIVE';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';
}

class AlertSummary {
  final String id;
  final String type;
  final String severity;
  final String message;
  final bool acknowledged;
  final String createdAt;

  AlertSummary({
    required this.id,
    required this.type,
    required this.severity,
    required this.message,
    required this.acknowledged,
    required this.createdAt,
  });

  String get dateFormatted {
    final dt = DateTime.parse(createdAt);
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '${dt.day}/${dt.month}/${dt.year} $hour:$minute';
  }

  factory AlertSummary.fromJson(Map<String, dynamic> json) {
    return AlertSummary(
      id: json['id'] as String,
      type: json['type'] as String,
      severity: json['severity'] as String,
      message: json['message'] as String,
      acknowledged: json['acknowledged'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
    );
  }
}
