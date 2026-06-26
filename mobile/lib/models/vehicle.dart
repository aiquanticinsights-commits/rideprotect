class Vehicle {
  final String id;
  final String make;
  final String model;
  final int year;
  final String? licensePlate;
  final String? vin;
  final String? color;
  final bool isActive;

  Vehicle({
    required this.id,
    required this.make,
    required this.model,
    required this.year,
    this.licensePlate,
    this.vin,
    this.color,
    this.isActive = true,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] as String,
      make: json['make'] as String,
      model: json['model'] as String,
      year: json['year'] as int,
      licensePlate: json['licensePlate'] as String?,
      vin: json['vin'] as String?,
      color: json['color'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'make': make,
      'model': model,
      'year': year,
      if (licensePlate != null) 'licensePlate': licensePlate,
      if (vin != null) 'vin': vin,
      if (color != null) 'color': color,
    };
  }

  String get displayName => '$year $make $model';
}
