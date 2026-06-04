import asyncio
import sys
import os

# Enable importing from current dir
sys.path.append(os.getcwd())

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.document import Document, Permission

async def main():
    try:
        async with AsyncSessionLocal() as db:
            output = []
            output.append("--- USERS ---")
            result = await db.execute(select(User))
            users = result.scalars().all()
            for u in users:
                output.append(f"ID: {u.id}, Email: {u.email}")
                
            output.append("\n--- DOCUMENTS ---")
            result = await db.execute(select(Document))
            docs = result.scalars().all()
            for d in docs:
                output.append(f"ID: {d.id}, Name: {d.name}, OwnerID: {d.user_id}")
                
            output.append("\n--- PERMISSIONS ---")
            result = await db.execute(select(Permission))
            perms = result.scalars().all()
            for p in perms:
                output.append(f"ID: {p.id}, DocID: {p.document_id}, UserID: {p.user_id}, Level: {p.permission_level}")
            
            with open("debug_output.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(output))
                print("Output written to debug_output.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
