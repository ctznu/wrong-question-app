from abc import ABC, abstractmethod
from typing import Dict, Optional

class QuestionAnalyzer(ABC):
    def __init__(self, **kwargs):
        self.grade = kwargs.get('grade', '')
    
    @abstractmethod
    def analyze_question(self, text: str, image_path: str, **kwargs) -> Dict:
        pass

    @abstractmethod
    def parse_result(self, raw_result: Dict, ocr_result: Optional[Dict] = None) -> Dict:
        pass
