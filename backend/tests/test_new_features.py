"""Tests for new features: Team Chat, Auto-enroll, WebSocket leaderboard, Animations"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

TEAM_ID = "9870b7f2-ab22-441b-b72d-369848376ead"  # Alpha Wolves
PLAYER_ID = "5825b0ce-2ac8-4ea2-b3b4-070c2b5a7df9"  # CryptoViking

# ========= TEAM CHAT TESTS =========

class TestTeamChat:
    """Team chat REST API tests"""

    def test_get_chat_empty_or_list(self):
        r = requests.get(f"{BASE_URL}/api/teams/{TEAM_ID}/chat")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"GET chat returned {len(data)} messages")

    def test_post_chat_message(self):
        r = requests.post(f"{BASE_URL}/api/teams/{TEAM_ID}/chat", json={
            "sender_id": PLAYER_ID,
            "content": "TEST_Hello from automated test!"
        })
        assert r.status_code == 200
        msg = r.json()
        assert msg["content"] == "TEST_Hello from automated test!"
        assert msg["team_id"] == TEAM_ID
        assert msg["sender_id"] == PLAYER_ID
        assert msg["sender_name"] == "CryptoViking"
        assert "id" in msg
        print(f"POST chat message OK: id={msg['id']}")

    def test_get_chat_after_post(self):
        # Post a message first
        requests.post(f"{BASE_URL}/api/teams/{TEAM_ID}/chat", json={
            "sender_id": PLAYER_ID,
            "content": "TEST_persistence check"
        })
        r = requests.get(f"{BASE_URL}/api/teams/{TEAM_ID}/chat")
        assert r.status_code == 200
        msgs = r.json()
        contents = [m["content"] for m in msgs]
        assert any("TEST_" in c for c in contents), "Posted message not found in GET"
        print(f"Chat persistence verified: {len(msgs)} msgs")

    def test_post_chat_invalid_team(self):
        r = requests.post(f"{BASE_URL}/api/teams/invalid-team-id/chat", json={
            "sender_id": PLAYER_ID, "content": "test"
        })
        assert r.status_code == 404

    def test_post_chat_anonymous_sender(self):
        """Unknown sender_id should still work with Anonymous name"""
        r = requests.post(f"{BASE_URL}/api/teams/{TEAM_ID}/chat", json={
            "sender_id": "nonexistent-player", "content": "TEST_anon message"
        })
        assert r.status_code == 200
        msg = r.json()
        assert msg["sender_name"] == "Anonymous"


# ========= AUTO-ENROLL TESTS =========

class TestAutoEnroll:
    """Test wallet registration + auto-enroll in active competitions"""

    def test_register_wallet_auto_enroll(self):
        import time
        wallet = f"TEST_AutoEnroll{int(time.time())}"
        r = requests.post(f"{BASE_URL}/api/players/register-wallet", json={
            "wallet_address": wallet,
            "username": f"TEST_AutoEnroll_{int(time.time())}"
        })
        assert r.status_code == 200
        player = r.json()
        assert player["wallet_address"] == wallet
        # competition_ids can be empty if no active competitions, but field must exist
        assert "competition_ids" in player
        print(f"Auto-enroll: player enrolled in {len(player['competition_ids'])} competitions")

    def test_register_wallet_idempotent(self):
        """Registering same wallet twice should return existing player"""
        wallet = "TEST_IdempotentWallet_NewFeature"
        requests.post(f"{BASE_URL}/api/players/register-wallet", json={
            "wallet_address": wallet, "username": "TEST_Idempotent"
        })
        r2 = requests.post(f"{BASE_URL}/api/players/register-wallet", json={
            "wallet_address": wallet, "username": "TEST_Idempotent"
        })
        assert r2.status_code == 200
        assert r2.json()["wallet_address"] == wallet


# ========= LEADERBOARD LIVE =========

class TestLiveLeaderboard:
    def test_live_leaderboard_returns_list(self):
        r = requests.get(f"{BASE_URL}/api/leaderboard/live")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"Live leaderboard: {len(data)} players")

    def test_competition_leaderboard(self):
        r = requests.get(f"{BASE_URL}/api/leaderboard")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"Competition leaderboard: {len(data)} players")
