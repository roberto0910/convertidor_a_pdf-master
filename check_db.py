
import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models import Permission, Document, User

async def check_permissions():
    async with SessionLocal() as db:
        # Check users
        users = await db.execute(select(User))
        print(f"Users: {[u.email for u in users.scalars().all()]}")
        
        # Check all permissions
        stmt = select(Permission, Document, User).join(Document).join(User)
        result = await db.execute(stmt)
        rows = result.all()
        print(f"Total permissions: {len(rows)}")
        for perm, doc, user in rows:
            print(f"User: {user.email} | Doc: {doc.name} | Level: {perm.permission_level}")

if __name__ == "__main__":
    asyncio.run(check_permissions())
