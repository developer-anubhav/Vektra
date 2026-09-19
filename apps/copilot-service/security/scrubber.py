import re
from typing import Any, Dict, List, Union

# Regex patterns for PII & sensitive data
PATTERNS = {
    # Banking routing numbers (e.g., "routing number is 123456789", "routing: 123456789", "ABA 123456789")
    "routing_number": re.compile(
        r"\b(?:routing(?:\s+number|\s*#)?|aba)(?:\s+(?:is|was|:|=)|\s*[:=])?\s*(\d{9})\b",
        re.IGNORECASE,
    ),
    "ifsc_code": re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b", re.IGNORECASE),
    
    # Bank Account numbers (e.g., "account number is 987654321012", "acct # 12345678")
    "bank_account": re.compile(
        r"\b(?:bank\s+)?(?:account|acct|acc)(?:\s+number|\s*#|[\s_]*no)?(?:\s+(?:is|was|:|=)|\s*[:=])?\s*(\d{8,18})\b",
        re.IGNORECASE,
    ),
    
    # Credit Card numbers (13-19 digits, optionally spaced or hyphenated)
    "credit_card": re.compile(
        r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b"
    ),
    
    # Passwords and secrets in plaintext strings (e.g. "password: Secret123", "passwd = abc")
    "password": re.compile(
        r"\b(?:password|passwd|secret|api[_-]?key|jwt|auth[_-]?token)(?:\s+(?:is|was|:|=)|\s*[:=])\s*['\"]?([^\s'\"]{4,})['\"]?",
        re.IGNORECASE,
    ),
    
    # Raw biometric vector arrays (e.g., lists of floats like [0.12345, -0.9876, 0.0012, ...])
    "biometric_vector": re.compile(
        r"\[\s*-?\d+\.\d+(?:\s*,\s*-?\d+\.\d+){3,}\s*\]"
    ),
    
    # US SSN
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
}

def scrub_text(text: str) -> str:
    """
    Scrubs PII, banking/routing numbers, passwords, and raw biometric vectors from text.
    """
    if not isinstance(text, str):
        return text

    scrubbed = text

    # Strip biometric float vectors
    scrubbed = PATTERNS["biometric_vector"].sub("[REDACTED_BIOMETRIC_VECTOR]", scrubbed)

    # Strip passwords/tokens
    scrubbed = PATTERNS["password"].sub("password: [REDACTED_PASSWORD]", scrubbed)

    # Strip routing & IFSC numbers
    scrubbed = PATTERNS["routing_number"].sub("routing: [REDACTED_ROUTING]", scrubbed)
    scrubbed = PATTERNS["ifsc_code"].sub("[REDACTED_IFSC]", scrubbed)

    # Strip bank accounts
    scrubbed = PATTERNS["bank_account"].sub("account: [REDACTED_ACCOUNT]", scrubbed)

    # Strip credit cards & SSN
    scrubbed = PATTERNS["credit_card"].sub("[REDACTED_CARD]", scrubbed)
    scrubbed = PATTERNS["ssn"].sub("[REDACTED_SSN]", scrubbed)

    return scrubbed

def scrub_payload(data: Union[Dict[str, Any], List[Any], str, Any]) -> Any:
    """
    Recursively scrub dictionary, list, or primitive structures.
    """
    if isinstance(data, str):
        return scrub_text(data)
    elif isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            lower_k = str(k).lower()
            if any(s in lower_k for s in ["embedding", "face_vector", "biometric", "facial_features"]):
                cleaned[k] = "[REDACTED_BIOMETRIC_VECTOR]"
            elif any(s in lower_k for s in ["password", "passwd", "secret", "token"]):
                cleaned[k] = "[REDACTED_SECRET]"
            elif any(s in lower_k for s in ["bank_account", "account_number", "routing_number"]):
                cleaned[k] = "[REDACTED_FINANCIAL_INFO]"
            else:
                cleaned[k] = scrub_payload(v)
        return cleaned
    elif isinstance(data, list):
        if len(data) > 4 and all(isinstance(x, (float, int)) for x in data):
            return "[REDACTED_BIOMETRIC_VECTOR]"
        return [scrub_payload(item) for item in data]
    return data
