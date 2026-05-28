"""SAKSHAM — Git operations for cloning and analyzing repositories."""

import os
import shutil
import asyncio
import tempfile
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("git_ops")

# File extensions to scan for vulnerabilities
SCANNABLE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".php",
    ".cs", ".c", ".cpp", ".h", ".rs", ".swift", ".kt", ".scala",
    ".html", ".htm", ".xml", ".yaml", ".yml", ".json", ".toml", ".ini",
    ".sql", ".sh", ".bash", ".ps1", ".bat", ".cmd",
    ".env", ".cfg", ".conf", ".config",
}

# Files to skip
SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".next", ".nuxt", "dist", "build",
    "venv", ".venv", "env", ".env", "vendor", "target", "bin", "obj",
    ".idea", ".vscode", ".cache", "coverage", ".tox",
}

# Dependency files to look for
DEPENDENCY_FILES = {
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "requirements.txt", "Pipfile", "Pipfile.lock", "poetry.lock", "pyproject.toml",
    "go.mod", "go.sum", "Cargo.toml", "Cargo.lock",
    "Gemfile", "Gemfile.lock", "composer.json", "composer.lock",
    "pom.xml", "build.gradle", "build.gradle.kts",
}

# Sensitive file patterns
SENSITIVE_PATTERNS = {
    ".env", ".env.local", ".env.production", ".env.development",
    "config.py", "settings.py", "secrets.py", "credentials.py",
    "auth.py", "token.py", "jwt.py", "password.py",
    "database.yml", "database.py", "db.py",
    "docker-compose.yml", "Dockerfile",
    "aws.py", "azure.py", "gcp.py",
}


def detect_language(file_path: str) -> str:
    """Detect programming language from file extension."""
    ext_map = {
        ".py": "python", ".js": "javascript", ".ts": "typescript",
        ".jsx": "javascript", ".tsx": "typescript", ".java": "java",
        ".go": "go", ".rb": "ruby", ".php": "php", ".cs": "csharp",
        ".c": "c", ".cpp": "cpp", ".rs": "rust", ".swift": "swift",
        ".kt": "kotlin", ".scala": "scala", ".sql": "sql",
        ".html": "html", ".xml": "xml", ".yaml": "yaml",
        ".yml": "yaml", ".json": "json", ".sh": "bash",
        ".toml": "toml", ".ini": "ini",
    }
    ext = Path(file_path).suffix.lower()
    return ext_map.get(ext, "text")


async def clone_repository(repo_url: str, branch: str = "main") -> Tuple[str, Dict[str, Any]]:
    """
    Clone a repository to a temporary directory.
    Returns (clone_path, metadata).
    In demo mode, creates a mock directory structure.
    """
    scan_dir = settings.SCAN_TEMP_DIR
    os.makedirs(scan_dir, exist_ok=True)

    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    clone_path = os.path.join(scan_dir, repo_name)

    # Clean up existing clone
    if os.path.exists(clone_path):
        shutil.rmtree(clone_path, ignore_errors=True)

    if settings.DEMO_MODE:
        # Create mock repository structure for demo
        clone_path = _create_demo_repo(clone_path, repo_name)
        return clone_path, {
            "repo_name": repo_name,
            "branch": branch,
            "clone_method": "demo",
        }

    try:
        logger.info(f"📥 Cloning repository", url=repo_url, branch=branch)
        process = await asyncio.create_subprocess_exec(
            "git", "clone", "--depth", "1", "--branch", branch, repo_url, clone_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=120)

        if process.returncode != 0:
            error = stderr.decode().strip()
            logger.error(f"❌ Clone failed: {error}")
            # Fall back to demo repo
            clone_path = _create_demo_repo(clone_path, repo_name)
            return clone_path, {"repo_name": repo_name, "clone_method": "demo_fallback", "error": error}

        # Get commit SHA
        sha_process = await asyncio.create_subprocess_exec(
            "git", "-C", clone_path, "rev-parse", "HEAD",
            stdout=asyncio.subprocess.PIPE,
        )
        sha_out, _ = await sha_process.communicate()
        commit_sha = sha_out.decode().strip()

        logger.info(f"✅ Repository cloned", path=clone_path, sha=commit_sha[:8])
        return clone_path, {
            "repo_name": repo_name,
            "branch": branch,
            "commit_sha": commit_sha,
            "clone_method": "git",
        }
    except asyncio.TimeoutError:
        logger.error("❌ Clone timed out")
        clone_path = _create_demo_repo(clone_path, repo_name)
        return clone_path, {"repo_name": repo_name, "clone_method": "demo_fallback", "error": "timeout"}
    except Exception as e:
        logger.error(f"❌ Clone error: {e}")
        clone_path = _create_demo_repo(clone_path, repo_name)
        return clone_path, {"repo_name": repo_name, "clone_method": "demo_fallback", "error": str(e)}


def _create_demo_repo(clone_path: str, repo_name: str) -> str:
    """Create a realistic mock repository for demo scanning."""
    os.makedirs(clone_path, exist_ok=True)

    demo_files = {
        "src/db/queries.py": '''"""Database query module."""
import sqlite3

def get_user(user_id):
    """Get user by ID — VULNERABLE: SQL injection."""
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    return cursor.fetchone()

def search_users(search_term):
    """Search users — VULNERABLE: SQL injection."""
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE name LIKE '%{search_term}%'"
    cursor.execute(query)
    return cursor.fetchall()
''',
        "src/auth/token.py": '''"""JWT Token handling."""
import jwt

SECRET_KEY = "super-secret-key-do-not-share"

def verify_token(token):
    """Verify JWT — VULNERABLE: signature not verified."""
    decoded = jwt.decode(token, options={"verify_signature": False})
    return decoded

def create_token(payload):
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
''',
        "src/api/proxy.py": '''"""API proxy endpoint."""
import requests

def fetch_url(url):
    """Fetch URL — VULNERABLE: SSRF."""
    response = requests.get(url)
    return response.text

def proxy_request(target_url, method="GET"):
    """Proxy requests — VULNERABLE: SSRF with no validation."""
    response = requests.request(method, target_url)
    return response.json()
''',
        "src/views/search.html": '''<!DOCTYPE html>
<html>
<head><title>Search</title></head>
<body>
  <h1>Search Results</h1>
  <!-- VULNERABLE: Reflected XSS via safe filter -->
  <p>Results for: {{ request.args.q | safe }}</p>
  <div id="results"></div>
  <script>
    // VULNERABLE: DOM-based XSS
    document.getElementById("results").innerHTML = window.location.hash.substr(1);
  </script>
</body>
</html>
''',
        "config/aws.py": '''"""AWS Configuration — VULNERABLE: hardcoded secrets."""
import os

AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION = "us-east-1"
S3_BUCKET = "acme-corp-private-data"
''',
        "config/database.py": '''"""Database config — VULNERABLE: hardcoded credentials."""

DB_HOST = "prod-db.acme-corp.internal"
DB_PORT = 5432
DB_USER = "admin"
DB_PASSWORD = "P@ssw0rd123!"
DB_NAME = "production"

CONNECTION_STRING = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
''',
        "src/utils/crypto.py": '''"""Cryptography utilities — VULNERABLE: weak crypto."""
import hashlib
import random

def hash_password(password):
    """Hash password — VULNERABLE: MD5 without salt."""
    return hashlib.md5(password.encode()).hexdigest()

def generate_token():
    """Generate token — VULNERABLE: predictable random."""
    return str(random.randint(100000, 999999))

def encrypt_data(data, key):
    """Encrypt — VULNERABLE: XOR cipher is not encryption."""
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(data.encode())])
''',
        "src/api/upload.py": '''"""File upload handler — VULNERABLE: path traversal."""
import os

UPLOAD_DIR = "/var/uploads"

def save_upload(filename, content):
    """Save uploaded file — VULNERABLE: path traversal."""
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return filepath

def read_file(filename):
    """Read file — VULNERABLE: arbitrary file read."""
    with open(filename, "r") as f:
        return f.read()
''',
        "requirements.txt": '''flask==2.0.1
requests==2.25.0
pyjwt==2.1.0
cryptography==3.3.2
pillow==8.2.0
jinja2==2.11.3
sqlalchemy==1.4.0
pyyaml==5.4.0
urllib3==1.26.4
''',
        "package.json": '''{
  "name": "acme-frontend",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20",
    "express": "4.17.1",
    "jsonwebtoken": "8.5.1",
    "axios": "0.21.1",
    "serialize-javascript": "4.0.0"
  }
}
''',
        "README.md": f"# {repo_name}\n\nA demo repository for SAKSHAM security scanning.\n",
    }

    for path, content in demo_files.items():
        full_path = os.path.join(clone_path, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

    logger.info(f"📦 Demo repository created", path=clone_path, files=len(demo_files))
    return clone_path


def scan_file_tree(repo_path: str) -> Dict[str, Any]:
    """Scan repository file tree and gather metadata."""
    files: List[Dict[str, Any]] = []
    total_lines = 0
    language_counts: Dict[str, int] = {}
    dependency_files_found: List[str] = []
    sensitive_files_found: List[str] = []

    for root, dirs, filenames in os.walk(repo_path):
        # Skip unwanted directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in filenames:
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, repo_path)
            ext = Path(filename).suffix.lower()

            # Check for dependency files
            if filename in DEPENDENCY_FILES:
                dependency_files_found.append(rel_path)

            # Check for sensitive files
            if filename in SENSITIVE_PATTERNS or any(p in filename.lower() for p in [".env", "secret", "credential", "password"]):
                sensitive_files_found.append(rel_path)

            # Only process scannable files
            if ext not in SCANNABLE_EXTENSIONS:
                continue

            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    line_count = content.count("\n") + 1
                    total_lines += line_count

                    lang = detect_language(filename)
                    language_counts[lang] = language_counts.get(lang, 0) + line_count

                    files.append({
                        "path": rel_path,
                        "language": lang,
                        "lines": line_count,
                        "size_bytes": len(content),
                    })
            except Exception:
                continue

    return {
        "files": files,
        "total_files": len(files),
        "total_lines": total_lines,
        "language_breakdown": language_counts,
        "dependency_files": dependency_files_found,
        "sensitive_files": sensitive_files_found,
    }


def read_file_content(repo_path: str, rel_path: str) -> Optional[str]:
    """Read file content from the cloned repo."""
    full_path = os.path.join(repo_path, rel_path)
    try:
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return None


def cleanup_clone(clone_path: str):
    """Remove cloned repository after scanning."""
    try:
        if os.path.exists(clone_path):
            shutil.rmtree(clone_path, ignore_errors=True)
            logger.info(f"🧹 Cleaned up clone", path=clone_path)
    except Exception as e:
        logger.warning(f"⚠️ Cleanup failed: {e}")
