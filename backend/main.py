from typing import Union

from fastapi import FastAPI, UploadFile

from pypdf import PdfReader

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q+q}

@app.post("/upload")
def parse_pdf(file: UploadFile | None = None):
    if not file:
        return {"message": "No upload file sent"}
    
    pdf = PdfReader(file.file)
    # Extract PDF text
    text = ""
    for page_number in range(len(pdf.pages)):
        page = pdf.pages[page_number]
        text += page.extract_text().strip()
        text += "\n(End of Page)\n"
    text += "End of Document"

    # Clean up weird apostrophes
    text = text.replace("“", '"')
    text = text.replace("”", '"')
    text = text.replace("‘", "'")
    text = text.replace("’", "'")
    return {"filename": file.filename, "text": text}