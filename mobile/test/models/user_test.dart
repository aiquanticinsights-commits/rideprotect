import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/user.dart';

void main() {
  group('User', () {
    final json = {
      'id': 'clx12345',
      'email': 'test@example.com',
      'firstName': 'John',
      'lastName': 'Doe',
      'phone': '+911234567890',
      'isActive': true,
      'emailVerified': true,
      'createdAt': '2026-06-25T10:00:00.000Z',
    };

    test('fromJson creates user with all fields', () {
      final u = User.fromJson(json);
      expect(u.id, 'clx12345');
      expect(u.email, 'test@example.com');
      expect(u.firstName, 'John');
      expect(u.lastName, 'Doe');
      expect(u.phone, '+911234567890');
      expect(u.isActive, true);
      expect(u.emailVerified, true);
      expect(u.createdAt, '2026-06-25T10:00:00.000Z');
    });

    test('fromJson uses defaults for missing optional fields', () {
      final minimal = {
        'id': 'clx99999',
        'email': 'minimal@example.com',
        'firstName': 'Jane',
        'lastName': 'Smith',
        'createdAt': '2026-06-25T12:00:00.000Z',
      };
      final u = User.fromJson(minimal);
      expect(u.phone, null);
      expect(u.isActive, true);
      expect(u.emailVerified, false);
    });

    test('fullName combines first and last name', () {
      final u = User.fromJson(json);
      expect(u.fullName, 'John Doe');
    });
  });
}
