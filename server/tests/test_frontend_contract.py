"""Integration checks for the UI contract, using a disposable SQLite database.

Run: python -m unittest discover -s server/tests -v
"""
import os
from pathlib import Path
import sys
import tempfile
import unittest
from datetime import date, timedelta

TEST_DIRECTORY = tempfile.TemporaryDirectory(prefix="quickwork-contract-")
os.environ.update({
    "DB_HOST": "localhost", "DB_PORT": "5432", "DB_USER": "test",
    "DB_PASS": "test", "DB_NAME": (Path(TEST_DIRECTORY.name) / "test").as_posix(),
    "JWT_SECRET_KEY": "quickwork-isolated-test-secret-key-for-contract-tests",
    "JWT_ALGORITHM": "HS256",
})
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from httpx import ASGITransport, AsyncClient
from db.database import Base, async_engine, session_factory
from main import app
from models.models import Category, Feature, City, User, Role, Work, Company, UserWork, WorkCategory, WorkFeature, RefreshSession


class FrontendContractTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        async with async_engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)
        async with session_factory() as session, session.begin():
            session.add_all([Category(id=1, name="Кафе", slug="eating"), Feature(id=1, name="Паспорт"), City(name="Belgrade", name_key="belgrade")])
        self.client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        await async_engine.dispose()

    async def account(self, username):
        payload = {"username": username, "password": "test-password-123", "first_name": "Тест", "last_name": "Пользователь", "age": 24}
        response = await self.client.post("/auth/register", json=payload)
        self.assertEqual(response.status_code, 201, response.text)
        user_id = response.json()["user_id"]
        response = await self.client.post("/auth/login", json={"username": username, "password": payload["password"]})
        self.assertEqual(response.status_code, 200, response.text)
        return {"Authorization": f"Bearer {response.json()['access_token']}"}, user_id

    def vacancy(self, **updates):
        return {"title": "Бариста", "description": "Приготовление кофе", "work_date": (date.today() + timedelta(days=1)).isoformat(), "time_from": "09:00", "time_to": "17:00", "city": "Belgrade", "salary": 4200, "features_id": 1, "category_id": 1, **updates}

    async def test_account_company_shift_and_application_lifecycle(self):
        employer, _ = await self.account("employer")
        worker, worker_id = await self.account("worker")
        outsider, _ = await self.account("outsider")
        self.assertIsNone((await self.client.get("/company/me", headers=employer)).json())
        self.assertEqual((await self.client.get("/work/mine", headers=employer)).json(), [])
        response = await self.client.post("/company/create", headers=employer, json={"name": "Кофейня", "description": "Наш бизнес"})
        self.assertEqual(response.status_code, 201, response.text)
        company_id = response.json()["company_id"]
        self.assertEqual((await self.client.get("/company/me", headers=employer)).json()["id"], company_id)
        self.assertIsNone((await self.client.get("/company/me", headers=worker)).json())
        self.assertEqual((await self.client.get("/work/options")).json()["categories"][0]["id"], 1)
        response = await self.client.post("/work/create", headers=employer, json=self.vacancy())
        self.assertEqual(response.status_code, 201, response.text)
        work_id = response.json()["vacancy_id"]
        catalog = (await self.client.get("/work/")).json()
        self.assertEqual(catalog[0]["company_id"], company_id)
        self.assertEqual(catalog[0]["category_id"], 1)
        self.assertEqual(catalog[0]["description"], "Приготовление кофе")
        self.assertEqual((await self.client.get("/work/mine", headers=employer)).json()[0]["id"], work_id)
        self.assertEqual((await self.client.get("/work/mine", headers=outsider)).json(), [])
        detail = (await self.client.get(f"/work/{work_id}")).json()
        self.assertEqual(detail["city"], "Belgrade")
        self.assertFalse(detail["ends_next_day"])
        response = await self.client.post(f"/uwe/add_work?work_id={work_id}", headers=worker)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["status"], "pending")
        self.assertEqual((await self.client.post(f"/uwe/add_work?work_id={work_id}", headers=worker)).status_code, 409)
        response = await self.client.get("/uwe/getworks", headers=worker)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()[0]["time_from"], "09:00:00")
        self.assertEqual(response.json()[0]["status"], "pending")
        self.assertEqual(response.json()[0]["company_name"], "Кофейня")
        response = await self.client.get("/uwe/get_response", headers=employer)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()[0]["user"]["id"], worker_id)
        self.assertEqual(response.json()[0]["work"]["work_date"], self.vacancy()["work_date"])
        status_payload = {"user_id": worker_id, "work_id": work_id, "status": "approved"}
        self.assertEqual((await self.client.patch("/uwe/status_update", headers=outsider, json=status_payload)).status_code, 404)
        self.assertEqual((await self.client.patch("/uwe/status_update", headers=employer, json=status_payload)).status_code, 200)
        self.assertEqual((await self.client.get("/uwe/getworks", headers=worker)).json()[0]["status"], "approved")
        self.assertEqual((await self.client.patch(f"/work/update/{work_id}", headers=outsider, json={"salary": 5000})).status_code, 403)
        self.assertEqual((await self.client.patch(f"/work/update/{work_id}", headers=employer, json={"salary": 5000})).status_code, 200)
        self.assertEqual((await self.client.get(f"/work/{work_id}")).json()["salary"], 5000)
        self.assertEqual((await self.client.patch("/user/update", headers=worker, json={"first_name": "Анна", "last_name": "Тестовая", "age": 25})).status_code, 200)
        self.assertEqual((await self.client.get("/user/me", headers=worker)).json()["first_name"], "Анна")
        response = await self.client.delete(f"/work/delete/{work_id}", headers=employer)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual((await self.client.get("/uwe/getworks", headers=worker)).json(), [])
        self.assertEqual((await self.client.get("/uwe/get_response", headers=employer)).json(), [])
        self.assertEqual((await self.client.get(f"/work/{work_id}")).status_code, 404)

    async def test_night_shift_validation_and_auth_boundaries(self):
        employer, _ = await self.account("night_employer")
        await self.client.post("/company/create", headers=employer, json={"name": "Ночная компания", "description": "Смены"})
        self.assertEqual((await self.client.post("/work/create", headers=employer, json=self.vacancy(time_from="22:00", time_to="06:00"))).status_code, 422)
        response = await self.client.post("/work/create", headers=employer, json=self.vacancy(time_from="22:00", time_to="06:00", ends_next_day=True))
        self.assertEqual(response.status_code, 201, response.text)
        self.assertTrue((await self.client.get(f"/work/{response.json()['vacancy_id']}")).json()["ends_next_day"])
        self.assertEqual((await self.client.get("/company/me")).status_code, 401)
        self.assertEqual((await self.client.get("/work/mine")).status_code, 401)
        self.assertEqual((await self.client.get("/work/?page=0")).status_code, 422)

    async def test_catalog_seeding_is_persistent_and_repeatable(self):
        from repositories.core import add_category, add_feture
        for _ in range(2):
            await add_category()
            await add_feture()
        response = (await self.client.get("/work/options")).json()
        self.assertEqual(len(response["categories"]), 3)
        self.assertEqual(len(response["features"]), 4)
        self.assertIn("cleaning", {item["slug"] for item in response["categories"]})

    async def admin_account(self, username="administrator"):
        headers, user_id = await self.account(username)
        async with session_factory() as session, session.begin():
            user = await session.get(User, user_id)
            user.role = Role.ADMIN
        return headers, user_id

    async def company_account(self, username="company_owner"):
        headers, user_id = await self.account(username)
        response = await self.client.post("/company/create", headers=headers, json={"name": username, "description": "Компания"})
        self.assertEqual(response.status_code, 201, response.text)
        return headers, user_id

    def multi_vacancy(self, **updates):
        payload = self.vacancy()
        payload.pop("category_id")
        payload.pop("features_id")
        return {**payload, "category_ids": [1, 2], "feature_ids": [1, 2], **updates}

    async def extra_selections(self):
        async with session_factory() as session, session.begin():
            session.add_all([Category(id=2, name="События", slug="events"), Feature(id=2, name="Питание")])

    async def test_admin_console_grant_revoke_and_unknown_user(self):
        import asyncio
        import subprocess
        headers, _ = await self.account("console_admin")
        server_dir = Path(__file__).resolve().parents[1]
        for arguments, expected_role in [(["console_admin"], "admin"), (["console_admin", "--revoke"], "worker")]:
            result = await asyncio.to_thread(subprocess.run, [sys.executable, "src/manage_admin.py", *arguments], cwd=server_dir, capture_output=True, text=True, timeout=20)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual((await self.client.get("/user/me", headers=headers)).json()["role"], expected_role)
        result = await asyncio.to_thread(subprocess.run, [sys.executable, "src/manage_admin.py", "missing_user"], cwd=server_dir, capture_output=True, text=True, timeout=20)
        self.assertNotEqual(result.returncode, 0)

    async def test_admin_authorization_and_registration_role(self):
        worker, _ = await self.account("ordinary")
        for method, path, payload in [("GET", "/admin/catalogs", None), ("POST", "/admin/cities", {"name": "Ниш"}), ("PATCH", "/admin/cities/1", {"name": "Ниш"}), ("DELETE", "/admin/cities/1", None)]:
            for headers, status in [({}, 401), (worker, 403)]:
                response = await self.client.request(method, path, headers=headers, **({"json": payload} if payload else {}))
                self.assertEqual(response.status_code, status, response.text)
        self.assertEqual((await self.client.get("/api/admin/catalogs", headers=worker)).status_code, 403)
        response = await self.client.post("/auth/register", json={"username": "fake_admin", "password": "test-password-123", "first_name": "Тест", "last_name": "Тест", "age": 24, "role": "admin"})
        self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual((await self.client.get("/user/me", headers=worker)).json()["role"], "worker")
        admin, admin_id = await self.admin_account()
        self.assertEqual((await self.client.get("/api/admin/catalogs", headers=admin)).status_code, 200)
        self.assertEqual((await self.client.get("/user/me", headers=admin)).json()["role"], "admin")
        async with session_factory() as session, session.begin():
            (await session.get(User, admin_id)).role = Role.WORKER
        self.assertEqual((await self.client.get("/admin/catalogs", headers=admin)).status_code, 403)

    async def test_admin_catalog_crud_validation_and_public_options(self):
        admin, _ = await self.admin_account()
        for kind, name in [("cities", "Нови Сад"), ("categories", "Разгрузка"), ("features", "Без опыта")]:
            response = await self.client.post(f"/admin/{kind}", headers=admin, json={"name": "  " + name + "  "})
            self.assertEqual(response.status_code, 201, response.text)
            item = response.json()
            self.assertEqual(item["name"], name)
            duplicate = await self.client.post(f"/admin/{kind}", headers=admin, json={"name": name.upper()})
            self.assertEqual(duplicate.status_code, 409, duplicate.text)
            options = (await self.client.get("/work/options")).json()
            self.assertIn(name, options[kind] if kind == "cities" else [entry["name"] for entry in options[kind]])
            renamed = await self.client.patch(f"/admin/{kind}/{item['id']}", headers=admin, json={"name": name + " 2"})
            self.assertEqual(renamed.status_code, 200, renamed.text)
            self.assertEqual((await self.client.delete(f"/admin/{kind}/{item['id']}", headers=admin)).status_code, 204)
            self.assertEqual((await self.client.patch(f"/admin/{kind}/{item['id']}", headers=admin, json={"name": name})).status_code, 404)
        for kind, body in [("cities", {"name": "   "}), ("cities", {"name": "x" * 101}), ("features", {"name": "Тест", "slug": "test"}), ("categories", {"name": "Тест", "slug": "BAD SLUG"})]:
            response = await self.client.post(f"/admin/{kind}", headers=admin, json=body)
            self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual((await self.client.post("/admin/categories", headers=admin, json={"name": "Дубликат кода", "slug": "eating"})).status_code, 409)
        self.assertEqual((await self.client.post("/admin/unknown", headers=admin, json={"name": "Тест"})).status_code, 422)

    async def test_multiple_selections_in_all_work_responses_and_cleanup(self):
        from sqlalchemy import func, select
        await self.extra_selections()
        employer, _ = await self.company_account()
        worker, _ = await self.account("multi_worker")
        response = await self.client.post("/work/create", headers=employer, json=self.multi_vacancy(city="  belgrade  "))
        self.assertEqual(response.status_code, 201, response.text)
        work_id = response.json()["vacancy_id"]
        await self.client.post(f"/uwe/add_work?work_id={work_id}", headers=worker)
        for path, headers in [(f"/work/{work_id}", {}), ("/work/", {}), ("/work/mine", employer), ("/uwe/getworks", worker), ("/uwe/get_response", employer)]:
            response = await self.client.get(path, headers=headers)
            self.assertEqual(response.status_code, 200, response.text)
            item = response.json()
            if isinstance(item, list): item = item[0]
            if "work" in item: item = item["work"]
            self.assertEqual(item["category_ids"], [1, 2], path)
            self.assertEqual(item["feature_ids"], [1, 2], path)
            self.assertEqual(item["city"], "Belgrade", path)
        await self.client.patch(f"/work/update/{work_id}", headers=employer, json={"salary": 5000})
        self.assertEqual((await self.client.get(f"/work/{work_id}")).json()["category_ids"], [1, 2])
        response = await self.client.patch(f"/work/update/{work_id}", headers=employer, json={"category_ids": [2], "feature_ids": [2]})
        self.assertEqual(response.status_code, 200, response.text)
        detail = (await self.client.get(f"/work/{work_id}")).json()
        self.assertEqual(detail["category_ids"], [2])
        self.assertEqual(detail["feature_ids"], [2])
        self.assertEqual(detail["category_id"], 2)
        self.assertEqual(detail["features_id"], 2)
        self.assertEqual((await self.client.delete(f"/work/delete/{work_id}", headers=employer)).status_code, 200)
        async with session_factory() as session:
            for table in [WorkCategory, WorkFeature, UserWork]:
                self.assertEqual(await session.scalar(select(func.count()).select_from(table)), 0)

    async def test_selection_validation_and_transaction_rollback(self):
        await self.extra_selections()
        employer, _ = await self.company_account()
        response = await self.client.post("/work/create", headers=employer, json=self.multi_vacancy())
        self.assertEqual(response.status_code, 201, response.text)
        work_id = response.json()["vacancy_id"]
        for invalid in [{"category_ids": []}, {"feature_ids": []}, {"category_ids": None}, {"feature_ids": None}, {"category_ids": [999]}, {"feature_ids": [999]}, {"category_ids": [1, 1]}, {"feature_ids": [True]}, {"category_ids": ["1"]}, {"category_id": None}, {"category_ids": [1, 2], "category_id": 1}, {"city": "Unknown city"}]:
            with self.subTest(invalid=invalid):
                for path, method, body in [("/work/create", "POST", self.multi_vacancy(**invalid)), (f"/work/update/{work_id}", "PATCH", invalid)]:
                    response = await self.client.request(method, path, headers=employer, json=body)
                    self.assertEqual(response.status_code, 422, response.text)
        response = await self.client.patch(f"/work/update/{work_id}", headers=employer, json={"category_ids": [2], "feature_ids": [999], "title": "Should roll back"})
        self.assertEqual(response.status_code, 422, response.text)
        detail = (await self.client.get(f"/work/{work_id}")).json()
        self.assertEqual(detail["category_ids"], [1, 2])
        self.assertEqual(detail["title"], "Бариста")
        self.assertEqual(len((await self.client.get("/work/")).json()), 1)
        for key in ["category_ids", "feature_ids"]:
            body = self.multi_vacancy(); body.pop(key)
            self.assertEqual((await self.client.post("/work/create", headers=employer, json=body)).status_code, 422)

    async def test_used_catalog_entries_protected_and_rename_propagation(self):
        await self.extra_selections()
        admin, _ = await self.admin_account()
        employer, _ = await self.company_account()
        created = await self.client.post("/work/create", headers=employer, json=self.multi_vacancy())
        work_id = created.json()["vacancy_id"]
        snapshot = (await self.client.get("/admin/catalogs", headers=admin)).json()
        for kind in ["cities", "categories", "features"]:
            for item in snapshot[kind]:
                self.assertEqual(item["usage_count"], 1)
                response = await self.client.delete(f"/admin/{kind}/{item['id']}", headers=admin)
                self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(snapshot["stats"], {"users": 2, "companies": 1, "works": 1})
        response = await self.client.patch("/admin/cities/1", headers=admin, json={"name": "Белград"})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual((await self.client.get(f"/work/{work_id}")).json()["city"], "Белград")
        self.assertEqual((await self.client.get("/work/options")).json()["cities"], ["Белград"])
        await self.client.patch("/admin/categories/2", headers=admin, json={"name": "Мероприятия"})
        self.assertEqual((await self.client.get("/work/options")).json()["categories"][1]["name"], "Мероприятия")

    async def test_fresh_database_and_repeatable_initialization(self):
        from sqlalchemy import func, select
        from repositories.core import init_db
        async with async_engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await init_db()
        async with session_factory() as session:
            for model in [User, Company, Work, UserWork, City, WorkCategory, WorkFeature, RefreshSession]:
                self.assertEqual(await session.scalar(select(func.count()).select_from(model)), 0)
        headers, _ = await self.account("fresh_user")
        await init_db()
        self.assertEqual((await self.client.get("/user/me", headers=headers)).status_code, 200)

    async def test_refresh_cookie_rotation_and_reuse_detection(self):
        from hashlib import sha256
        from sqlalchemy import select
        headers, _ = await self.account("refresh_user")
        original = self.client.cookies.get("qw_refresh")
        self.assertTrue(original)
        async with session_factory() as session:
            record = await session.scalar(select(RefreshSession))
            self.assertEqual(record.token_hash, sha256(original.encode()).hexdigest())
            expiry = record.expires_at
        response = await self.client.post("/api/auth/refresh")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["expires_in"], 900)
        replacement = self.client.cookies.get("qw_refresh")
        self.assertNotEqual(original, replacement)
        cookie = response.headers["set-cookie"]
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=lax", cookie)
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertNotIn("refresh_token", response.json())
        self.assertEqual((await self.client.get("/user/me", headers={"Authorization": "Bearer " + response.json()["access_token"]})).status_code, 200)
        async with session_factory() as session:
            records = (await session.scalars(select(RefreshSession))).all()
            self.assertEqual(len(records), 2)
            self.assertTrue(records[0].revoked)
            self.assertEqual(records[1].expires_at, expiry)
        self.assertEqual((await self.client.get("/user/me", headers={"Authorization": "Bearer " + replacement})).status_code, 401)
        replay = await self.client.post("/auth/refresh", headers={"Cookie": "qw_refresh=" + original})
        self.assertEqual(replay.status_code, 401)
        self.assertIn("Max-Age=0", replay.headers["set-cookie"])
        self.assertEqual((await self.client.post("/auth/refresh", headers={"Cookie": "qw_refresh=" + replacement})).status_code, 401)
        # Previously issued access tokens live only until their short expiry.
        self.assertEqual((await self.client.get("/user/me", headers=headers)).status_code, 200)

    async def test_logout_revokes_refresh_without_access_token(self):
        await self.account("logout_user")
        original = self.client.cookies.get("qw_refresh")
        response = await self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 204, response.text)
        self.assertFalse(self.client.cookies.get("qw_refresh"))
        self.assertEqual((await self.client.post("/auth/refresh", headers={"Cookie": "qw_refresh=" + original})).status_code, 401)
        self.assertEqual((await self.client.post("/auth/logout")).status_code, 204)

    async def test_refresh_expired_unknown_and_deleted_user(self):
        from datetime import datetime, timezone
        from sqlalchemy import delete, update
        await self.account("expired_refresh")
        async with session_factory() as session, session.begin():
            await session.execute(update(RefreshSession).values(expires_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=1)))
        self.assertEqual((await self.client.post("/auth/refresh")).status_code, 401)
        self.assertEqual((await self.client.post("/auth/refresh", headers={"Cookie": "qw_refresh=unknown"})).status_code, 401)
        _, user_id = await self.account("deleted_refresh")
        async with session_factory() as session, session.begin():
            await session.execute(delete(User).where(User.id == user_id))
        self.assertEqual((await self.client.post("/auth/refresh")).status_code, 401)

    async def test_refresh_origin_and_secure_cookie(self):
        from unittest.mock import patch
        from core.config import settings
        await self.account("origin_user")
        original = self.client.cookies.get("qw_refresh")
        for path in ["/auth/login", "/auth/refresh", "/api/auth/logout"]:
            response = await self.client.post(path, headers={"Origin": "https://foreign.example"}, json={"username": "origin_user", "password": "test-password-123"})
            self.assertEqual(response.status_code, 403, response.text)
        self.assertEqual(self.client.cookies.get("qw_refresh"), original)
        with patch.object(settings, "COOKIE_SECURE", True):
            response = await self.client.post("/auth/refresh", headers={"Origin": "http://localhost:5173"})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertIn("Secure", response.headers["set-cookie"])

    async def test_refresh_concurrent_claim_and_independent_sessions(self):
        import asyncio
        from services.refresh import create_refresh_session, rotate_refresh_session
        _, user_id = await self.account("concurrent_refresh")
        original = self.client.cookies.get("qw_refresh")
        independent = await create_refresh_session(user_id)
        results = await asyncio.gather(rotate_refresh_session(original), rotate_refresh_session(original))
        self.assertEqual(sum(result is not None for result in results), 1)
        replacement = next(result[1] for result in results if result is not None)
        self.assertIsNone(await rotate_refresh_session(replacement))
        self.assertIsNotNone(await rotate_refresh_session(independent))

    async def test_expired_access_can_be_renewed_and_claims_are_required(self):
        import jwt
        from datetime import datetime, timezone
        from core.config import settings
        headers, user_id = await self.account("expired_access")
        now = datetime.now(timezone.utc)
        for payload in [
            {"sub": str(user_id), "type": "access", "iat": now - timedelta(hours=1), "exp": now - timedelta(minutes=1)},
            {"sub": str(user_id), "type": "access", "iat": now},
            {"sub": str(user_id), "type": "refresh", "iat": now, "exp": now + timedelta(minutes=1)},
        ]:
            token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
            self.assertEqual((await self.client.get("/user/me", headers={"Authorization": "Bearer " + token})).status_code, 401)
        response = await self.client.post("/auth/refresh")
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.json()["access_token"], headers["Authorization"].split()[1])
        self.assertEqual((await self.client.get("/user/me", headers={"Authorization": "Bearer " + response.json()["access_token"]})).status_code, 200)

    async def test_partial_overnight_update_uses_saved_time_values(self):
        employer, _ = await self.company_account()
        response = await self.client.post("/work/create", headers=employer, json=self.vacancy(time_from="22:00", time_to="06:00", ends_next_day=True))
        work_id = response.json()["vacancy_id"]
        self.assertEqual((await self.client.patch(f"/work/update/{work_id}", headers=employer, json={"time_to": "05:00"})).status_code, 200)
        self.assertEqual((await self.client.patch(f"/work/update/{work_id}", headers=employer, json={"ends_next_day": False})).status_code, 422)
        for field in ["title", "description", "work_date", "time_from", "time_to", "ends_next_day"]:
            self.assertEqual((await self.client.patch(f"/work/update/{work_id}", headers=employer, json={field: None})).status_code, 422)

    @unittest.skipUnless((Path(__file__).resolve().parents[2] / "frontend/dist/index.html").exists(), "Build frontend first to check SPA routes")
    async def test_built_frontend_routes_and_api_aliases(self):
        for path in ("/", "/profile", "/company", "/company/create", "/company/shifts/new", "/shifts/1", "/saved", "/admin"):
            response = await self.client.get(path)
            self.assertEqual(response.status_code, 200, f"{path}: {response.text}")
            self.assertIn('id="root"', response.text)
        self.assertEqual((await self.client.get("/api/work/")).json(), [])
        self.assertEqual((await self.client.get("/api/company/me")).status_code, 401)
        self.assertEqual((await self.client.get("/api/does-not-exist")).status_code, 404)
        self.assertEqual((await self.client.get("/assets/missing.js")).status_code, 404)


if __name__ == "__main__":
    unittest.main()
