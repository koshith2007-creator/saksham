"""SAKSHAM — Google Gemini API Client with retry logic and token tracking."""

import asyncio
import time
import json
from typing import Optional, Dict, Any, List

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("gemini")

# Vulnerability analysis prompt templates
PROMPTS = {
    "static_analysis": """You are an expert cybersecurity code auditor. Analyze the following source code for security vulnerabilities.

File: {file_path}
Language: {language}

```{language}
{code}
```

Identify ALL security vulnerabilities. For each vulnerability found, respond with a JSON array where each item has:
- "title": Short vulnerability title
- "description": Detailed description
- "severity": One of "critical", "high", "medium", "low", "info"
- "confidence": Float 0.0-1.0
- "vulnerability_type": Type (e.g., "SQL Injection", "XSS", "SSRF")
- "cwe_id": CWE identifier (e.g., "CWE-89")
- "line_start": Starting line number
- "line_end": Ending line number
- "code_snippet": The vulnerable code snippet
- "attack_vector": How it can be exploited
- "remediation": How to fix it
- "patch_diff": A diff showing the fix

If no vulnerabilities are found, return an empty JSON array: []
Respond ONLY with valid JSON.""",

    "exploitability": """You are a penetration testing expert. Analyze whether this vulnerability is ACTUALLY exploitable in context.

Vulnerability: {title}
Type: {vuln_type}
File: {file_path}
Code:
```
{code_snippet}
```

Surrounding context:
```
{context}
```

Determine:
1. Is this vulnerability actually exploitable? (true/false)
2. What is the exploitability score? (0.0 to 1.0)
3. What is your detailed reasoning?
4. What is the attack vector?
5. Could this be a false positive? Why or why not?

Respond with JSON:
{{
  "is_exploitable": true/false,
  "exploitability_score": 0.0-1.0,
  "reasoning": "detailed analysis...",
  "attack_vector": "description of attack...",
  "is_false_positive": true/false,
  "false_positive_reasoning": "why..."
}}
Respond ONLY with valid JSON.""",

    "remediation": """You are a senior security engineer. Generate a production-safe remediation for this vulnerability.

Vulnerability: {title}
Type: {vuln_type}
Severity: {severity}
File: {file_path}
Language: {language}

Vulnerable code:
```{language}
{code_snippet}
```

Generate:
1. A clear fix description
2. A patch diff showing exactly what to change
3. An explanation of why this fix works
4. Confidence score (0.0 to 1.0)

Respond with JSON:
{{
  "fix_description": "what to do...",
  "patch_diff": "- old line\\n+ new line",
  "explanation": "why this works...",
  "confidence": 0.0-1.0
}}
Respond ONLY with valid JSON.""",

    "repo_intelligence": """You are a software architecture expert. Analyze this repository structure and provide intelligence.

Repository: {repo_name}
Files:
{file_tree}

Key files content samples:
{samples}

Provide analysis as JSON:
{{
  "primary_language": "language",
  "frameworks_detected": ["framework1", "framework2"],
  "architecture_pattern": "e.g., MVC, microservice, monolith",
  "entry_points": ["file paths that accept external input"],
  "sensitive_files": ["files containing secrets, configs, auth"],
  "dependency_files": ["package.json", "requirements.txt", etc.],
  "security_observations": "initial security observations",
  "tech_stack_summary": "brief summary of tech stack"
}}
Respond ONLY with valid JSON.""",

    "threat_intel": """You are a threat intelligence analyst. Analyze this vulnerability against known threat databases.

CVE/CWE: {identifier}
Vulnerability Type: {vuln_type}
Description: {description}

Provide threat intelligence as JSON:
{{
  "epss_score_estimate": 0.0-1.0,
  "is_actively_exploited": true/false,
  "exploit_maturity": "one of: proof-of-concept, weaponized, active",
  "ransomware_associated": true/false,
  "mitre_techniques": ["T1190", "T1059"],
  "risk_context": "contextual risk analysis...",
  "recommended_priority": "immediate/high/medium/low"
}}
Respond ONLY with valid JSON.""",
}


class GeminiClient:
    """Client for Google Gemini API with retry logic."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = "gemini-2.0-flash"
        self.total_tokens = 0
        self.total_requests = 0
        self._initialized = False

    async def _ensure_init(self):
        """Lazy-initialize the Gemini client."""
        if self._initialized:
            return
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._genai = genai
                self._model = genai.GenerativeModel(self.model)
                self._initialized = True
                logger.info("✅ Gemini API client initialized", model=self.model)
            except Exception as e:
                logger.warning(f"⚠️ Gemini init failed: {e}")
                self._initialized = False
        else:
            logger.info("📦 Gemini API key not set, using mock responses")

    async def generate(
        self,
        prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 4096,
        retries: int = 3,
        fallback_to_mock: bool = False,
    ) -> str:
        """Generate text with retry logic."""
        await self._ensure_init()

        if not self._initialized:
            if not fallback_to_mock:
                raise RuntimeError("Gemini API client is not initialized")
            return self._mock_response(prompt)

        for attempt in range(retries):
            try:
                start = time.time()
                response = await asyncio.to_thread(
                    self._model.generate_content,
                    prompt,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    },
                )
                elapsed = int((time.time() - start) * 1000)
                self.total_requests += 1

                text = response.text.strip()
                # Clean markdown code fences if present
                if text.startswith("```"):
                    text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                    if text.endswith("```"):
                        text = text[:-3].strip()

                logger.info("🤖 Gemini response", duration_ms=elapsed, length=len(text))
                return text

            except Exception as e:
                logger.warning(f"⚠️ Gemini attempt {attempt+1}/{retries} failed: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    logger.error(f"❌ Gemini failed after {retries} attempts")
                    if not fallback_to_mock:
                        raise
                    return self._mock_response(prompt)

    async def analyze_code(self, file_path: str, code: str, language: str = "python") -> List[Dict]:
        """Analyze code for vulnerabilities using Gemini."""
        prompt = PROMPTS["static_analysis"].format(
            file_path=file_path, language=language, code=code
        )
        response = await self.generate(prompt, fallback_to_mock=settings.DEMO_MODE)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.warning("Failed to parse Gemini code analysis response")
            return []

    async def validate_exploitability(self, vuln_data: Dict, context: str = "") -> Dict:
        """Validate if a vulnerability is actually exploitable."""
        prompt = PROMPTS["exploitability"].format(
            title=vuln_data.get("title", ""),
            vuln_type=vuln_data.get("vulnerability_type", ""),
            file_path=vuln_data.get("file_path", ""),
            code_snippet=vuln_data.get("code_snippet", ""),
            context=context,
        )
        response = await self.generate(prompt, fallback_to_mock=settings.DEMO_MODE)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"is_exploitable": False, "exploitability_score": 0.0, "reasoning": "Analysis failed"}

    async def generate_remediation(self, vuln_data: Dict, language: str = "python") -> Dict:
        """Generate remediation for a vulnerability."""
        prompt = PROMPTS["remediation"].format(
            title=vuln_data.get("title", ""),
            vuln_type=vuln_data.get("vulnerability_type", ""),
            severity=vuln_data.get("severity", "medium"),
            file_path=vuln_data.get("file_path", ""),
            language=language,
            code_snippet=vuln_data.get("code_snippet", ""),
        )
        response = await self.generate(prompt, fallback_to_mock=settings.DEMO_MODE)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"fix_description": "Manual review required", "patch_diff": "", "explanation": "", "confidence": 0.0}

    async def analyze_repo(self, repo_name: str, file_tree: str, samples: str) -> Dict:
        """Analyze repository structure and provide intelligence."""
        prompt = PROMPTS["repo_intelligence"].format(
            repo_name=repo_name, file_tree=file_tree, samples=samples
        )
        response = await self.generate(prompt, fallback_to_mock=settings.DEMO_MODE)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"primary_language": "unknown", "frameworks_detected": [], "entry_points": []}

    def _mock_response(self, prompt: str) -> str:
        """Return mock responses when API is unavailable."""
        if "security vulnerabilities" in prompt.lower() or "static_analysis" in prompt.lower():
            return json.dumps([
                {
                    "title": "Potential SQL Injection",
                    "description": "User input concatenated into SQL query without parameterization",
                    "severity": "critical",
                    "confidence": 0.92,
                    "vulnerability_type": "SQL Injection",
                    "cwe_id": "CWE-89",
                    "line_start": 10,
                    "line_end": 12,
                    "code_snippet": "query = f\"SELECT * FROM users WHERE id = {user_input}\"",
                    "attack_vector": "Network - HTTP request parameter",
                    "remediation": "Use parameterized queries",
                    "patch_diff": "- query = f\"SELECT * FROM users WHERE id = {user_input}\"\n+ query = \"SELECT * FROM users WHERE id = %s\"\n+ cursor.execute(query, (user_input,))"
                }
            ])
        if "exploitable" in prompt.lower():
            return json.dumps({
                "is_exploitable": True,
                "exploitability_score": 0.85,
                "reasoning": "The input flows directly from user-controlled source to dangerous sink without sanitization.",
                "attack_vector": "Network-accessible endpoint with no input validation",
                "is_false_positive": False,
                "false_positive_reasoning": "Clear data flow from source to sink confirmed."
            })
        if "remediation" in prompt.lower():
            return json.dumps({
                "fix_description": "Use parameterized queries instead of string concatenation",
                "patch_diff": "- query = f\"SELECT * FROM users WHERE id = {user_input}\"\n+ query = \"SELECT * FROM users WHERE id = %s\"\n+ cursor.execute(query, (user_input,))",
                "explanation": "Parameterized queries ensure user input is treated as data, not SQL code.",
                "confidence": 0.95
            })
        return json.dumps({"status": "mock_response", "message": "API key not configured"})


# Singleton instance
gemini_client = GeminiClient()
