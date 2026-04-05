import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCoreAPIs:
    """Core API endpoint tests"""

    def test_competitions_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/competitions")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"PASS: /api/competitions returned {len(data)} competitions")

    def test_leaderboard_individual(self):
        r = requests.get(f"{BASE_URL}/api/leaderboard?lb_type=individual&metric=composite")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "stats" in data[0]
        assert "username" in data[0]
        print(f"PASS: /api/leaderboard individual returned {len(data)} players")

    def test_leaderboard_team(self):
        r = requests.get(f"{BASE_URL}/api/leaderboard?lb_type=team")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"PASS: /api/leaderboard team returned {len(data)} teams")

    def test_leaderboard_live_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/leaderboard/live")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: /api/leaderboard/live returned {len(data)} entries (empty is ok)")

    def test_tournaments_bracket(self):
        r = requests.get(f"{BASE_URL}/api/tournaments/bracket")
        assert r.status_code == 200
        data = r.json()
        assert "rounds" in data
        assert "champion" in data
        assert len(data["rounds"]) > 0
        round_names = [rnd["name"] for rnd in data["rounds"]]
        assert "Semi-Finals" in round_names or "Finals" in round_names
        print(f"PASS: /api/tournaments/bracket returned rounds: {round_names}")

    def test_bracket_champion_present(self):
        r = requests.get(f"{BASE_URL}/api/tournaments/bracket")
        assert r.status_code == 200
        data = r.json()
        assert data["champion"] is not None
        assert "name" in data["champion"]
        print(f"PASS: Champion is {data['champion']['name']}")

    def test_register_wallet(self):
        r = requests.post(f"{BASE_URL}/api/players/register-wallet", json={
            "wallet_address": "TEST_WalletAddr1234567890abcdef",
            "username": "TEST_WalletUser"
        })
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert data["wallet_address"] == "TEST_WalletAddr1234567890abcdef"
        print(f"PASS: register-wallet created player id={data['id']}")

    def test_register_wallet_idempotent(self):
        """Second registration with same wallet returns same player"""
        wallet = "TEST_WalletAddrIdempotent12345"
        r1 = requests.post(f"{BASE_URL}/api/players/register-wallet", json={"wallet_address": wallet})
        r2 = requests.post(f"{BASE_URL}/api/players/register-wallet", json={"wallet_address": wallet})
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["id"] == r2.json()["id"]
        print("PASS: register-wallet is idempotent")

    def test_players_list(self):
        r = requests.get(f"{BASE_URL}/api/players")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 16
        print(f"PASS: /api/players returned {len(data)} players")

    def test_teams_list(self):
        r = requests.get(f"{BASE_URL}/api/teams")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 4
        print(f"PASS: /api/teams returned {len(data)} teams")

    def test_quests_list(self):
        r = requests.get(f"{BASE_URL}/api/quests")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: /api/quests returned {len(data)} quests")

    def test_social_feed(self):
        r = requests.get(f"{BASE_URL}/api/social")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: /api/social returned {len(data)} posts")

    def test_stats(self):
        r = requests.get(f"{BASE_URL}/api/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_players" in data
        assert data["total_players"] >= 16
        print(f"PASS: /api/stats: {data}")
