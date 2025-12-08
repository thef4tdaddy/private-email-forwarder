import pytest
from backend.services.detector import ReceiptDetector

class MockEmail:
    def __init__(self, subject="", body="", sender=""):
        self.subject = subject
        self.body = body
        self.sender = sender

def test_is_receipt_strong_indicators():
    email = MockEmail(
        subject="Your Order Confirmation",
        body="Thank you for your order. Order #123456. Total: $50.00",
        sender="orders@shop.com"
    )
    assert ReceiptDetector.is_receipt(email) == True

def test_is_promotional_email_spam():
    email = MockEmail(
        subject="Huge Sale! 50% Off Everything!",
        body="Don't miss out on these deals! Click here to shop now.",
        sender="marketing@shop.com"
    )
    assert ReceiptDetector.is_receipt(email) == False
    assert ReceiptDetector.is_promotional_email(email.subject, email.body, email.sender) == True

def test_is_shipping_notification():
    email = MockEmail(
        subject="Your package has shipped",
        body="Your item is on the way. Track it here.",
        sender="shipping@amazon.com"
    )
    # Should be excluded even if it looks transactional-ish, because it's shipping
    assert ReceiptDetector.is_shipping_notification(email.subject, email.body, email.sender) == True
    assert ReceiptDetector.is_receipt(email) == False

def test_shipping_with_receipt_indicators_should_pass_checks():
    # If a shipping email implies it's also a receipt (contains payment info), logic might be tricky.
    # The JS logic says: it's shipping IF matches shipping patterns AND NOT purchase indicators.
    # So if it HAS purchase indicators, it returns FALSE for is_shipping_notification.
    # Thus, it flows through to subsequent checks and might be marked as receipt.
    email = MockEmail(
        subject="Your package has shipped",
        body="Your item is on the way. Order Total: $25.99. Payment method: Visa.",
        sender="notifications@generic-store.com"
    )
    # is_shipping_notification should return False because it has purchase indicators
    assert ReceiptDetector.is_shipping_notification(email.subject, email.body, email.sender) == False
    # So is_receipt should likely return True (as it's a receipt + shipping info)
    assert ReceiptDetector.is_receipt(email) == True

def test_parity_cases_amazon_order():
    email = MockEmail(
        subject="Your Amazon.com order #112-3492812-12345",
        body="Thank you for your order. Total: $12.99",
        sender="auto-confirm@amazon.com"
    )
    assert ReceiptDetector.is_receipt(email) == True
    assert ReceiptDetector.categorize_receipt(email) == "amazon"

def test_parity_cases_uber_trip():
    email = MockEmail(
        subject="Your Tuesday morning trip with Uber",
        body="Total: $15.42. Thanks for riding.",
        sender="receipts@uber.com"
    )
    assert ReceiptDetector.is_receipt(email) == True
    assert ReceiptDetector.categorize_receipt(email) == "transportation"

def test_reply_exclusion():
    email = MockEmail(
        subject="Re: Your Order",
        body="Hey, did you see this?",
        sender="me@gmail.com"
    )
    assert ReceiptDetector.is_receipt(email) == False

def test_transactional_score_low_matches():
    # Email with weak signals
    email = MockEmail(
        subject="Meeting reminder",
        body="Don't forget the meeting.",
        sender="colleague@work.com"
    )
    assert ReceiptDetector.calculate_transactional_score(email.subject, email.body, email.sender) == 0
    assert ReceiptDetector.is_receipt(email) == False

def test_transactional_score_high_matches():
    # Email with generic transactional terms but no 'receipt' keyword
    email = MockEmail(
        subject="Payment Notification",
        body="We received your payment of $100.00. Invoice #999.",
        sender="billing@service.com"
    )
    # Score:
    # $... -> 2
    # Invoice #... -> 2
    # Payment -> 1
    # Billing -> 1
    # Total > 3
    assert ReceiptDetector.calculate_transactional_score(email.subject, email.body, email.sender) >= 3
    assert ReceiptDetector.is_receipt(email) == True
