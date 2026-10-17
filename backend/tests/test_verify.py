import pytest
from app.services.verify import verify_quote, normalize_text


def test_normalize_text():
    raw = "  The   Monthly \n Rent\tIs Rs. 32,000/-  "
    expected = "the monthly rent is rs. 32,000/-"
    assert normalize_text(raw) == expected


def test_verify_quote_exact():
    source = "The monthly rent for the premises shall be Rs. 32,000/- per month."
    quote = "The monthly rent for the premises shall be Rs. 32,000/- per month."
    assert verify_quote(quote, source) is True


def test_verify_quote_whitespace_and_case():
    source = "The monthly rent for the premises shall be Rs. 32,000/- per month."
    quote = "the   monthly rent \nfor the premises   shall be rs. 32,000/- per month."
    assert verify_quote(quote, source) is True


def test_verify_quote_substring():
    source = "This agreement is entered between Lessor and Lessee. The lock-in period shall be 6 months. Rent is Rs. 32,000."
    quote = "The lock-in period shall be 6 months."
    assert verify_quote(quote, source) is True


def test_verify_quote_negative_not_present():
    source = "The tenancy shall be for 11 months with a 6-month lock-in."
    quote = "The tenancy allows sub-leasing without landlord permission."
    assert verify_quote(quote, source) is False


def test_verify_quote_negative_modified_value():
    source = "The security deposit shall be Rs. 1,60,000/- refundable upon handover."
    quote = "The security deposit shall be Rs. 80,000/- refundable upon handover."
    assert verify_quote(quote, source) is False


def test_verify_quote_empty():
    assert verify_quote("", "Some document text") is False
    assert verify_quote("Some quote", "") is False
    assert verify_quote("   ", "Some text") is False
