import pytest
from app.services.verify import (
    verify_quote,
    normalize_text,
    verify_term_value,
    extract_numbers_from_value,
    normalize_digit_grouping,
    MIN_QUOTE_LENGTH_CHARS,
    MIN_QUOTE_LENGTH_WORDS,
)


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


def test_verify_quote_minimum_thresholds():
    source = "The lock-in period is 6 months. The monthly rent is Rs. 32,000. Irrevocable lock-in term applies."
    # Under 25 characters (19 chars, 4 words) -> False
    short_quote = "Rent is Rs. 32,000."
    assert len(short_quote) < MIN_QUOTE_LENGTH_CHARS
    assert verify_quote(short_quote, source) is False

    # Under 4 words (28 chars, 3 words) -> False
    few_words_quote = "Irrevocable lock-in applies."
    assert len(few_words_quote.split()) < MIN_QUOTE_LENGTH_WORDS
    assert verify_quote(few_words_quote, source) is False

    # Valid quote (>= 25 chars and >= 4 words) -> True
    valid_quote = "The lock-in period is 6 months."
    assert len(valid_quote) >= MIN_QUOTE_LENGTH_CHARS
    assert len(valid_quote.split()) >= MIN_QUOTE_LENGTH_WORDS
    assert verify_quote(valid_quote, source) is True


def test_normalize_digit_grouping():
    assert normalize_digit_grouping("Rs. 1,59,000/-") == "Rs. 159000/-"
    assert normalize_digit_grouping("₹26,500 per month") == "₹26500 per month"
    assert normalize_digit_grouping("3,500 and 8,000") == "3500 and 8000"


def test_extract_numbers_from_value():
    assert extract_numbers_from_value("₹26,500") == ["26500"]
    assert extract_numbers_from_value("₹1,59,000") == ["159000"]
    assert extract_numbers_from_value("6 months") == ["6"]
    assert extract_numbers_from_value("18% p.a.") == ["18"]
    assert extract_numbers_from_value("₹32,000.00") == ["32000"]
    assert extract_numbers_from_value("No numbers here") == []


def test_verify_term_value_matching():
    # Value numbers appear in quote with Indian commas
    quote = "The monthly rent for the schedule premises shall be Rs. 26,500/- per month."
    assert verify_term_value("₹26,500", quote) is True
    assert verify_term_value("26500", quote) is True

    # Multi-digit deposit
    deposit_quote = "The Lessee has paid a refundable security deposit of Rs. 1,59,000/- only."
    assert verify_term_value("₹1,59,000", deposit_quote) is True
    assert verify_term_value("159000", deposit_quote) is True

    # Lock-in duration
    lockin_quote = "The initial 6 (six) months shall be an irrevocable lock-in period."
    assert verify_term_value("6 months", lockin_quote) is True

    # Value without numbers
    assert verify_term_value("Standard", "This is standard lease agreement.") is True


def test_verify_term_value_wrong_value_fails():
    # Wrong rent value
    quote = "The monthly rent for the schedule premises shall be Rs. 26,500/- per month."
    assert verify_term_value("₹35,000", quote) is False
    assert verify_term_value("35000", quote) is False

    # Wrong deposit value
    deposit_quote = "The Lessee has paid a refundable security deposit of Rs. 1,59,000/- only."
    assert verify_term_value("₹1,60,000", deposit_quote) is False
    assert verify_term_value("200000", deposit_quote) is False

    # Wrong months duration
    lockin_quote = "The initial 6 (six) months shall be an irrevocable lock-in period."
    assert verify_term_value("11 months", lockin_quote) is False
