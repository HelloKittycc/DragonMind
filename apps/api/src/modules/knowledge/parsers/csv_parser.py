import csv
from io import StringIO

from src.modules.knowledge.parsers.base import KnowledgeFileParser, ParserError
from src.modules.knowledge.parsers.text_parser import decode_text


class CsvKnowledgeParser(KnowledgeFileParser):
    supported_extensions = {".csv"}

    def extract_text(self, content: bytes, filename: str) -> str:
        decoded = decode_text(content, filename)
        try:
            rows = list(csv.reader(StringIO(decoded)))
        except csv.Error as exc:
            raise ParserError("CSV file could not be parsed") from exc
        if not rows:
            return ""
        lines: list[str] = []
        for index, row in enumerate(rows, start=1):
            values = [cell.strip() for cell in row]
            if any(values):
                lines.append(f"row {index}: " + " | ".join(values))
        return "\n".join(lines)
