import asyncio
import aiosqlite

async def check_user():
    async with aiosqlite.connect('gestion_documental.db') as db:
        async with db.execute('SELECT * FROM users WHERE email = "mcabrera@itb.edu.ec"') as cursor:
            row = await cursor.fetchone()
            print(f"Usuario mcabrera: {row}")

if __name__ == "__main__":
    asyncio.run(check_user())
