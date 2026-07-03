from src.modules.knowledge.parsers.base import KnowledgeFileParser, ParserError


class TextKnowledgeParser(KnowledgeFileParser):
    supported_extensions = {".txt", ".md"}

    def extract_text(self, content: bytes, filename: str) -> str:
        return decode_text(content, filename)


def decode_text(content: bytes, filename: str) -> str:
    for encoding in ("utf-8-sig", "utf-16"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ParserError(f"{filename or 'knowledge file'} must be UTF-8 or UTF-16 text")
