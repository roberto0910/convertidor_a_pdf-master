"""
Script de utilidad para inicializar la base de datos.
Puede usarse para reiniciar la BD o crear usuarios de prueba.
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

# Agregar app al path
sys.path.insert(0, __file__.split('manage.py')[0])

from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
from app.core.config import get_settings

settings = get_settings()


async def init_db():
    """
    Inicializa la base de datos creando todas las tablas.
    """
    print("🔄 Inicializando base de datos...")
    
    async with engine.begin() as conn:
        print("📊 Creando tablas...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tablas creadas exitosamente")


async def drop_db():
    """
    Elimina todas las tablas de la base de datos.
    ⚠️ CUIDADO: Esto borra todos los datos
    """
    confirm = input(
        "⚠️  ¿Estás seguro? Esto eliminará TODOS los datos. Escribe 'si' para continuar: "
    )
    
    if confirm.lower() != "si":
        print("❌ Operación cancelada")
        return
    
    print("🗑️  Eliminando tablas...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("✅ Tablas eliminadas")


async def create_admin_user(email: str, password: str):
    """
    Crea un usuario administrador.
    """
    async with AsyncSessionLocal() as session:
        # Verificar si existe
        from sqlalchemy import select
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"⚠️  Usuario {email} ya existe")
            return
        
        # Crear usuario
        admin = User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True
        )
        session.add(admin)
        await session.commit()
        
        print(f"✅ Usuario admin '{email}' creado exitosamente")
        print(f"   Email: {email}")
        print(f"   Rol: admin")


async def create_test_user(email: str, password: str):
    """
    Crea un usuario de prueba.
    """
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"⚠️  Usuario {email} ya existe")
            return
        
        user = User(
            email=email,
            password_hash=hash_password(password),
            role="user",
            is_active=True
        )
        session.add(user)
        await session.commit()
        
        print(f"✅ Usuario '{email}' creado exitosamente")
        print(f"   Email: {email}")
        print(f"   Rol: user")


async def list_users():
    """
    Lista todos los usuarios en la base de datos.
    """
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        stmt = select(User)
        result = await session.execute(stmt)
        users = result.scalars().all()
        
        if not users:
            print("No hay usuarios registrados")
            return
        
        print("\n📋 Usuarios registrados:")
        print("-" * 60)
        for user in users:
            status = "✅ Activo" if user.is_active else "❌ Inactivo"
            print(f"ID: {user.id} | Email: {user.email} | Rol: {user.role} | {status}")
        print("-" * 60)


def main():
    """
    Función principal para procesar comandos.
    """
    print(f"\n🔧 Gestor de Base de Datos - {settings.app_name}")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("\n📖 Uso: python manage.py <comando> [argumentos]\n")
        print("Comandos disponibles:")
        print("  init              → Inicializar base de datos")
        print("  drop              → Eliminar todas las tablas")
        print("  create-admin      → Crear usuario admin")
        print("  create-user       → Crear usuario normal")
        print("  list-users        → Listar usuarios")
        print("\nEjemplos:")
        print("  python manage.py init")
        print("  python manage.py create-admin admin@example.com micontraseña")
        print("  python manage.py create-user usuario@example.com micontraseña")
        return
    
    command = sys.argv[1]
    
    try:
        if command == "init":
            asyncio.run(init_db())
        
        elif command == "drop":
            asyncio.run(drop_db())
        
        elif command == "create-admin":
            if len(sys.argv) < 4:
                print("❌ Uso: python manage.py create-admin <email> <password>")
                return
            email = sys.argv[2]
            password = sys.argv[3]
            asyncio.run(create_admin_user(email, password))
        
        elif command == "create-user":
            if len(sys.argv) < 4:
                print("❌ Uso: python manage.py create-user <email> <password>")
                return
            email = sys.argv[2]
            password = sys.argv[3]
            asyncio.run(create_test_user(email, password))
        
        elif command == "list-users":
            asyncio.run(list_users())
        
        else:
            print(f"❌ Comando desconocido: {command}")
            print("Use 'python manage.py' sin argumentos para ver la ayuda")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
    
    print("✅ Operación completada\n")


if __name__ == "__main__":
    main()
