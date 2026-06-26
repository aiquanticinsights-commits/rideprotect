import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('App renders login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const RideProtectApp());
    await tester.pump();
    expect(find.text('RideProtect'), findsWidgets);
  });
}
