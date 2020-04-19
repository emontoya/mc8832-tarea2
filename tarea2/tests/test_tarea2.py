from tarea2 import __version__
from tarea2 import getDataFromCSVFile
from tarea2 import writeDataToFile
from pathlib import Path


def test_version():
    assert __version__ == "0.1.0"


def test_canProcessCSVFile():
    source_file = Path(__file__).parent / "test_data/WDIData.csv"
    target_file = Path(__file__).parent / "../../d3-chart/data/WDIData.json"
    print("File location: {file_path}")
    result = getDataFromCSVFile(source_file)
    assert len(result["years"]) == 60
    writeDataToFile(target_file, result)
