from abc import ABC, abstractmethod
from pathlib import Path


class ParserError(Exception):
    pass


class KnowledgeFileParser(ABC):
    supported_extensions: set[str] = set()

    @abstractmethod
    def extract_text(self, content: bytes, filename: str) -> str:
        raise NotImplementedError


def get_supported_extensions() -> set[str]:
    return set(_PARSERS_BY_EXTENSION)


def parse_knowledge_file(extension: str, content: bytes, filename: str) -> str:
    parser = _PARSERS_BY_EXTENSION.get(extension.lower())
    if parser is None:
        supported = ", ".join(sorted(_PARSERS_BY_EXTENSION))
        raise ParserError(f"unsupported knowledge file type; supported extensions: {supported}")
    return parser.extract_text(content, Path(filename).name)


from src.modules.knowledge.parsers.csv_parser import CsvKnowledgeParser
from src.modules.knowledge.parsers.docx_parser import DocxKnowledgeParser
from src.modules.knowledge.parsers.json_parser import JsonKnowledgeParser
from src.modules.knowledge.parsers.pdf_parser import PdfKnowledgeParser
from src.modules.knowledge.parsers.pptx_parser import PptxKnowledgeParser
from src.modules.knowledge.parsers.text_parser import TextKnowledgeParser
from src.modules.knowledge.parsers.xlsx_parser import XlsxKnowledgeParser


_PARSER_INSTANCES: list[KnowledgeFileParser] = [
    TextKnowledgeParser(),
    CsvKnowledgeParser(),
    JsonKnowledgeParser(),
    PdfKnowledgeParser(),
    DocxKnowledgeParser(),
    PptxKnowledgeParser(),
    XlsxKnowledgeParser(),
]

_PARSERS_BY_EXTENSION: dict[str, KnowledgeFileParser] = {
    extension: parser
    for parser in _PARSER_INSTANCES
    for extension in parser.supported_extensions
}
