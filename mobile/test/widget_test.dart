import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/main.dart';
import 'package:mobile/screens/login_screen.dart';
import 'package:mobile/screens/register_screen.dart';
import 'package:mobile/services/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  testWidgets('RideProtectApp shows loading then login screen', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const RideProtectApp());
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pump();
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
  });

  testWidgets('Login screen has email and password fields', (WidgetTester tester) async {
    final mockClient = MockApiClient();
    when(() => mockClient.isAuthenticated).thenReturn(false);
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: LoginScreen(apiClient: mockClient)),
    ));
    await tester.pump();
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text("Don't have an account? Register"), findsOneWidget);
  });

  testWidgets('Register screen has first name, last name, email, password fields',
      (WidgetTester tester) async {
    final mockClient = MockApiClient();
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: RegisterScreen(apiClient: mockClient)),
    ));
    await tester.pump();
    expect(find.text('First Name'), findsOneWidget);
    expect(find.text('Last Name'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Register'), findsOneWidget);
  });
}
