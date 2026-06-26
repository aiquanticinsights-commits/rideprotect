class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final bool isActive;
  final bool emailVerified;
  final String createdAt;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.isActive = true,
    this.emailVerified = false,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      phone: json['phone'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      emailVerified: json['emailVerified'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
    );
  }

  String get fullName => '$firstName $lastName';
}
