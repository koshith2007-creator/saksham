"""SAKSHAM — Pattern-based code scanner for vulnerability detection."""

import re
from typing import List, Dict, Any
from pathlib import Path

from app.utils.logger import get_logger

logger = get_logger("scanner")


# ============================================================
# Vulnerability Pattern Database
# ============================================================
VULN_PATTERNS = {
    "python": [
        {
            "pattern": r'f"[^"]*\{[^}]*\}[^"]*".*(?:execute|cursor|query)',
            "title": "SQL Injection via f-string",
            "type": "SQL Injection",
            "cwe": "CWE-89",
            "severity": "critical",
            "confidence": 0.90,
        },
        {
            "pattern": r"\.format\([^)]*\).*(?:execute|cursor|query)",
            "title": "SQL Injection via .format()",
            "type": "SQL Injection",
            "cwe": "CWE-89",
            "severity": "critical",
            "confidence": 0.88,
        },
        {
            "pattern": r'["\'](?:SELECT|INSERT|UPDATE|DELETE)\s.*\+\s*(?:str\(|f"|request|input)',
            "title": "SQL Injection via string concatenation",
            "type": "SQL Injection",
            "cwe": "CWE-89",
            "severity": "critical",
            "confidence": 0.85,
        },
        {
            "pattern": r"(?:eval|exec)\s*\(",
            "title": "Code Injection via eval/exec",
            "type": "Code Injection",
            "cwe": "CWE-94",
            "severity": "critical",
            "confidence": 0.92,
        },
        {
            "pattern": r"subprocess\.(?:call|run|Popen)\s*\(.*shell\s*=\s*True",
            "title": "Command Injection via shell=True",
            "type": "Command Injection",
            "cwe": "CWE-78",
            "severity": "critical",
            "confidence": 0.90,
        },
        {
            "pattern": r"os\.system\s*\(",
            "title": "Command Injection via os.system",
            "type": "Command Injection",
            "cwe": "CWE-78",
            "severity": "high",
            "confidence": 0.85,
        },
        {
            "pattern": r"hashlib\.md5\(",
            "title": "Weak Cryptographic Hash (MD5)",
            "type": "Weak Cryptography",
            "cwe": "CWE-328",
            "severity": "medium",
            "confidence": 0.95,
        },
        {
            "pattern": r"hashlib\.sha1\(",
            "title": "Weak Cryptographic Hash (SHA1)",
            "type": "Weak Cryptography",
            "cwe": "CWE-328",
            "severity": "medium",
            "confidence": 0.90,
        },
        {
            "pattern": r'(?:verify_signature|verify)\s*[=:]\s*False',
            "title": "JWT Signature Verification Disabled",
            "type": "Insecure JWT",
            "cwe": "CWE-347",
            "severity": "critical",
            "confidence": 0.95,
        },
        {
            "pattern": r"requests\.get\s*\(\s*(?:request|url|user|input|param)",
            "title": "Server-Side Request Forgery (SSRF)",
            "type": "SSRF",
            "cwe": "CWE-918",
            "severity": "high",
            "confidence": 0.80,
        },
        {
            "pattern": r'(?:SECRET|PASSWORD|API_KEY|TOKEN|PRIVATE_KEY)\s*=\s*["\'][^"\']{8,}["\']',
            "title": "Hardcoded Secret/Credential",
            "type": "Hardcoded Secrets",
            "cwe": "CWE-798",
            "severity": "critical",
            "confidence": 0.88,
        },
        {
            "pattern": r"random\.(?:random|randint|choice|seed)\s*\(",
            "title": "Insecure Random Number Generator",
            "type": "Insecure Randomness",
            "cwe": "CWE-330",
            "severity": "medium",
            "confidence": 0.75,
        },
        {
            "pattern": r"open\s*\([^)]*(?:request|user|input|filename|path)",
            "title": "Potential Path Traversal",
            "type": "Path Traversal",
            "cwe": "CWE-22",
            "severity": "high",
            "confidence": 0.75,
        },
        {
            "pattern": r"pickle\.load\s*\(",
            "title": "Insecure Deserialization (pickle)",
            "type": "Insecure Deserialization",
            "cwe": "CWE-502",
            "severity": "critical",
            "confidence": 0.90,
        },
        {
            "pattern": r"yaml\.load\s*\([^)]*(?!Loader)",
            "title": "Unsafe YAML Loading",
            "type": "Insecure Deserialization",
            "cwe": "CWE-502",
            "severity": "high",
            "confidence": 0.85,
        },
    ],
    "javascript": [
        {
            "pattern": r"innerHTML\s*=",
            "title": "DOM-based XSS via innerHTML",
            "type": "XSS",
            "cwe": "CWE-79",
            "severity": "high",
            "confidence": 0.80,
        },
        {
            "pattern": r"eval\s*\(",
            "title": "Code Injection via eval()",
            "type": "Code Injection",
            "cwe": "CWE-94",
            "severity": "critical",
            "confidence": 0.90,
        },
        {
            "pattern": r"document\.write\s*\(",
            "title": "DOM-based XSS via document.write",
            "type": "XSS",
            "cwe": "CWE-79",
            "severity": "high",
            "confidence": 0.82,
        },
        {
            "pattern": r"(?:child_process|exec|spawn)\s*\(",
            "title": "Command Injection",
            "type": "Command Injection",
            "cwe": "CWE-78",
            "severity": "critical",
            "confidence": 0.85,
        },
        {
            "pattern": r'(?:SECRET|PASSWORD|API_KEY|TOKEN)\s*[=:]\s*["\'][^"\']{8,}["\']',
            "title": "Hardcoded Secret/Credential",
            "type": "Hardcoded Secrets",
            "cwe": "CWE-798",
            "severity": "critical",
            "confidence": 0.88,
        },
    ],
    "html": [
        {
            "pattern": r"\|\s*safe\s*[%}]",
            "title": "XSS via disabled auto-escaping (safe filter)",
            "type": "XSS",
            "cwe": "CWE-79",
            "severity": "high",
            "confidence": 0.90,
        },
        {
            "pattern": r"innerHTML\s*=",
            "title": "DOM-based XSS via innerHTML",
            "type": "XSS",
            "cwe": "CWE-79",
            "severity": "high",
            "confidence": 0.80,
        },
        {
            "pattern": r"on\w+\s*=\s*[\"']",
            "title": "Inline Event Handler (potential XSS vector)",
            "type": "XSS",
            "cwe": "CWE-79",
            "severity": "low",
            "confidence": 0.60,
        },
    ],
}

# Generic patterns that apply to all languages
GENERIC_PATTERNS = [
    {
        "pattern": r"(?:AKIA[A-Z0-9]{16})",
        "title": "AWS Access Key ID Detected",
        "type": "Hardcoded Secrets",
        "cwe": "CWE-798",
        "severity": "critical",
        "confidence": 0.97,
    },
    {
        "pattern": r'(?:ghp_[a-zA-Z0-9]{36})',
        "title": "GitHub Personal Access Token Detected",
        "type": "Hardcoded Secrets",
        "cwe": "CWE-798",
        "severity": "critical",
        "confidence": 0.98,
    },
    {
        "pattern": r"(?:password|passwd|pwd)\s*=\s*[\"'][^\"']{4,}[\"']",
        "title": "Hardcoded Password",
        "type": "Hardcoded Secrets",
        "cwe": "CWE-798",
        "severity": "high",
        "confidence": 0.80,
    },
    {
        "pattern": r"(?:BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY)",
        "title": "Private Key in Source Code",
        "type": "Hardcoded Secrets",
        "cwe": "CWE-321",
        "severity": "critical",
        "confidence": 0.99,
    },
]


def scan_file(file_path: str, content: str, language: str) -> List[Dict[str, Any]]:
    """
    Scan a single file for vulnerability patterns.
    Returns a list of found vulnerabilities.
    """
    findings: List[Dict[str, Any]] = []
    lines = content.split("\n")

    # Get language-specific patterns
    patterns = VULN_PATTERNS.get(language, []) + GENERIC_PATTERNS

    for pattern_def in patterns:
        regex = pattern_def["pattern"]
        try:
            for line_num, line in enumerate(lines, 1):
                if re.search(regex, line, re.IGNORECASE):
                    # Get surrounding context (3 lines before and after)
                    start = max(0, line_num - 4)
                    end = min(len(lines), line_num + 3)
                    snippet = "\n".join(lines[start:end])

                    finding = {
                        "title": pattern_def["title"],
                        "description": f"{pattern_def['title']} detected in {file_path} at line {line_num}.",
                        "severity": pattern_def["severity"],
                        "confidence": pattern_def["confidence"],
                        "vulnerability_type": pattern_def["type"],
                        "cwe_id": pattern_def["cwe"],
                        "file_path": file_path,
                        "line_start": line_num,
                        "line_end": line_num,
                        "code_snippet": line.strip(),
                        "context": snippet,
                    }
                    findings.append(finding)
        except re.error:
            continue

    return findings


def scan_dependencies(dep_file_path: str, content: str) -> List[Dict[str, Any]]:
    """Scan dependency files for known vulnerable versions."""
    findings: List[Dict[str, Any]] = []
    filename = Path(dep_file_path).name

    # Known vulnerable package versions (simplified database)
    KNOWN_VULNS = {
        "python": {
            "flask": {"vuln_below": "2.0.2", "cve": "CVE-2023-30861", "title": "Flask session cookie vulnerability"},
            "requests": {"vuln_below": "2.31.0", "cve": "CVE-2023-32681", "title": "Requests unintended credential leak"},
            "pillow": {"vuln_below": "9.3.0", "cve": "CVE-2022-45198", "title": "Pillow buffer overflow"},
            "jinja2": {"vuln_below": "3.1.2", "cve": "CVE-2024-22195", "title": "Jinja2 XSS vulnerability"},
            "urllib3": {"vuln_below": "2.0.6", "cve": "CVE-2023-43804", "title": "urllib3 cookie leak"},
            "pyyaml": {"vuln_below": "6.0.0", "cve": "CVE-2020-14343", "title": "PyYAML arbitrary code execution"},
            "cryptography": {"vuln_below": "41.0.0", "cve": "CVE-2023-38325", "title": "Cryptography PKCS7 certificate verification"},
        },
        "javascript": {
            "lodash": {"vuln_below": "4.17.21", "cve": "CVE-2021-23337", "title": "Lodash command injection"},
            "axios": {"vuln_below": "0.21.2", "cve": "CVE-2021-3749", "title": "Axios ReDoS vulnerability"},
            "express": {"vuln_below": "4.18.2", "cve": "CVE-2024-29041", "title": "Express path traversal"},
            "jsonwebtoken": {"vuln_below": "9.0.0", "cve": "CVE-2022-23529", "title": "jsonwebtoken arbitrary code execution"},
            "serialize-javascript": {"vuln_below": "5.0.0", "cve": "CVE-2020-7660", "title": "serialize-javascript XSS"},
        },
    }

    if filename == "requirements.txt":
        for line in content.split("\n"):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Parse package==version or package>=version
            for sep in ["==", ">=", "<=", "~=", ">"]:
                if sep in line:
                    pkg, version = line.split(sep, 1)
                    pkg = pkg.strip().lower()
                    version = version.strip()
                    if pkg in KNOWN_VULNS["python"]:
                        vuln_info = KNOWN_VULNS["python"][pkg]
                        findings.append({
                            "title": f"Vulnerable dependency: {pkg}=={version}",
                            "description": f"{vuln_info['title']}. Current version {version} is below safe version {vuln_info['vuln_below']}.",
                            "severity": "high",
                            "confidence": 0.90,
                            "vulnerability_type": "Vulnerable Dependency",
                            "cwe_id": "CWE-1395",
                            "cve_id": vuln_info["cve"],
                            "file_path": dep_file_path,
                            "line_start": 0,
                            "line_end": 0,
                            "code_snippet": line,
                            "remediation": f"Upgrade {pkg} to version {vuln_info['vuln_below']} or later.",
                        })
                    break

    elif filename == "package.json":
        import json as json_module
        try:
            pkg_data = json_module.loads(content)
            deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
            for pkg, version in deps.items():
                pkg_lower = pkg.lower()
                version_clean = version.lstrip("^~>=<")
                if pkg_lower in KNOWN_VULNS["javascript"]:
                    vuln_info = KNOWN_VULNS["javascript"][pkg_lower]
                    findings.append({
                        "title": f"Vulnerable dependency: {pkg}@{version_clean}",
                        "description": f"{vuln_info['title']}. Current version {version_clean} may be below safe version {vuln_info['vuln_below']}.",
                        "severity": "high",
                        "confidence": 0.85,
                        "vulnerability_type": "Vulnerable Dependency",
                        "cwe_id": "CWE-1395",
                        "cve_id": vuln_info["cve"],
                        "file_path": dep_file_path,
                        "line_start": 0,
                        "line_end": 0,
                        "code_snippet": f'"{pkg}": "{version}"',
                        "remediation": f"Upgrade {pkg} to version {vuln_info['vuln_below']} or later.",
                    })
        except Exception:
            pass

    return findings
