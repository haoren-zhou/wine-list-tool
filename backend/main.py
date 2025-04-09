from typing import Union, BinaryIO
from fastapi import FastAPI, UploadFile
from pypdf import PdfReader
import asyncio

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

def extract_pdf_text_sync(pdf: BinaryIO) -> str:
    reader = PdfReader(pdf)
    text = "\n(End of Page)\n".join(page.extract_text().strip() or "" for page in reader.pages)
    text += "(End of Document)"
    # Clean up weird apostrophes
    text = text.replace("“", '"')
    text = text.replace("”", '"')
    text = text.replace("‘", "'")
    text = text.replace("’", "'")
    return text

async def extract_pdf_text(pdf: BinaryIO) -> str:
    return await asyncio.to_thread(extract_pdf_text_sync, pdf)

def extract_wine_info(text: str) -> list:
    

@app.post("/upload")
async def parse_pdf(file: UploadFile | None = None):
    if not file:
        return {"message": "No upload file sent"}
    
    text = await extract_pdf_text(file.file)
    return {"filename": file.filename, "text": text}