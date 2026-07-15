"""AI assistant endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import ai_assistant, schemas
from ..database import get_db

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/query", response_model=schemas.AIResponse)
def ai_query(payload: schemas.AIQuery, db: Session = Depends(get_db)):
    answer, intent, data = ai_assistant.answer_query(db, payload.query)
    return schemas.AIResponse(answer=answer, intent=intent, data=data)
