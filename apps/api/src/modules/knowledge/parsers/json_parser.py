import json

from src.modules.knowledge.parsers.base import KnowledgeFileParser
from src.modules.knowledge.parsers.text_parser import decode_text


class JsonKnowledgeParser(KnowledgeFileParser):
    supported_extensions = {".json"}

    def extract_text(self, content: bytes, filename: str) -> str:
        decoded = decode_text(content, filename)
        try:
            parsed = json.loads(decoded)
        except json.JSONDecodeError:
            return decoded
        return json.dumps(parsed, ensure_ascii=False, indent=2, sort_keys=True)
