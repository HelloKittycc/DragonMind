from io import BytesIO

from src.modules.knowledge.parsers.base import KnowledgeFileParser, ParserError


class PdfKnowledgeParser(KnowledgeFileParser):
    supported_extensions = {".pdf"}

    def extract_text(self, content: bytes, filename: str) -> str:
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise ParserError("PDF parser dependency is not installed") from exc

        try:
            reader = PdfReader(BytesIO(content))
            page_texts = []
            for index, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                if text.strip():
                    page_texts.append(f"[Page {index}]\n{text.strip()}")
        except Exception as exc:
            raise ParserError("PDF file could not be parsed") from exc

        extracted = "\n\n".join(page_texts).strip()
        if not extracted:
            raise ParserError("当前文件可能是扫描版 PDF，暂不支持 OCR。")
        return extracted
