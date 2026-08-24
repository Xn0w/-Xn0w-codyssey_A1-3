# ===========================================================
# api/review.py
# Vercel Serverless Function (Python 런타임).
# 프론트엔드(review.html)가 POST /api/review 로 {code, language}를
# 보내면, Gemini API를 호출해 코드 리뷰 결과를 JSON으로 돌려준다.
#
# 로컬 테스트: `vercel dev` 실행 후 http://localhost:3000/api/review
# 배포 후: Vercel 프로젝트 Environment Variables에 GEMINI_API_KEY 등록 필수.
# ===========================================================

import json
import os
import re
from http.server import BaseHTTPRequestHandler

# google-genai SDK는 requirements.txt에 명시되어야 Vercel 빌드 시 설치된다.
from google import genai

# 프롬프트에 넣을 리뷰 지침. Gemini에게 "반드시 JSON만" 반환하도록 강하게 지시한다.
SYSTEM_INSTRUCTION = """당신은 학생들의 과제 코드를 검토하는 시니어 개발자입니다.
주어진 코드를 읽고 아래 JSON 형식으로만 답하세요. 다른 설명, 마크다운 코드블록, 인사말은 절대 포함하지 마세요.

{
  "score": 0-100 사이 정수 (가독성과 안정성을 종합한 점수),
  "findings": [
    {"type": "good" | "warn" | "bad", "tag": "한 단어 태그", "message": "한두 문장 피드백 (한국어)"}
  ]
}

findings는 최소 2개, 최대 5개로 작성하세요. 실제로 발견한 점만 적고, 억지로 지어내지 마세요.
"""


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        # 프론트와 다른 오리진에서 로컬 개발할 때를 대비한 CORS 허용
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        # 브라우저의 CORS preflight 요청에 대한 응답
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_POST(self):
        # ---- 1) 요청 본문 파싱 ----
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length else b"{}"
            payload = json.loads(raw_body.decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "요청 본문을 JSON으로 해석할 수 없습니다."})
            return

        code = (payload.get("code") or "").strip()
        language = (payload.get("language") or "etc").strip()

        # ---- 2) 빈 입력(필수값 누락) 검증 ----
        if not code:
            self._send_json(400, {"error": "code 필드가 비어 있습니다."})
            return

        # 과금/쿼터 보호를 위해 지나치게 긴 입력은 잘라서 보낸다.
        MAX_CODE_CHARS = 6000
        if len(code) > MAX_CODE_CHARS:
            code = code[:MAX_CODE_CHARS] + "\n# (이하 생략)"

        # ---- 3) API 키 확인 ----
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            self._send_json(
                500,
                {"error": "서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Vercel 환경 변수를 확인하세요."},
            )
            return

        # ---- 4) Gemini API 호출 ----
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"언어: {language}\n\n코드:\n```{language}\n{code}\n```"
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_INSTRUCTION,
                    "temperature": 0.4,
                },
            )
            raw_text = (response.text or "").strip()
        except Exception as exc:  # noqa: BLE001 - 외부 API 실패를 그대로 사용자에게 요약 전달
            self._send_json(502, {"error": f"AI API 호출에 실패했습니다: {exc}"})
            return

        # ---- 5) 응답 파싱 (모델이 ```json 코드블록으로 감싸 보내는 경우 대비) ----
        cleaned = re.sub(r"^```json|```$", "", raw_text.strip(), flags=re.MULTILINE).strip()
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            self._send_json(502, {"error": "AI 응답을 해석할 수 없는 형식입니다. 다시 시도해주세요."})
            return

        # 최소한의 형태 검증
        if "score" not in result or "findings" not in result:
            self._send_json(502, {"error": "AI 응답에 필요한 필드가 없습니다."})
            return

        self._send_json(200, result)
