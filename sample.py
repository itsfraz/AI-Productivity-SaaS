# sample.py
import os

# Security issue for Security Agent to catch:
API_SECRET = "sk_live_1234567890abcdef"

def get_user_data(user_id):
    # Performance & Clean code issue (missing error handling, inefficient loop):
    users = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    for u in users:
        if u["id"] == user_id:
            return u
    return None
