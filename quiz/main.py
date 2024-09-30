# main.py
import os
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

# Database configuration
DATABASE_URL = "postgresql://osmanorka:Allah2480@localhost/quiz"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    question_id = Column(Integer, ForeignKey("questions.id"))
    question = relationship("Question", back_populates="answers")

# Pydantic models for request/response
class AnswerCreate(BaseModel):
    text: str
    is_correct: bool

class AnswerUpdate(BaseModel):
    text: Optional[str] = None
    is_correct: Optional[bool] = None

class AnswerOut(BaseModel):
    id: int
    text: str
    is_correct: bool

    class Config:
        orm_mode = True

class QuestionCreate(BaseModel):
    text: str
    answers: List[AnswerCreate]

class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    answers: Optional[List[AnswerCreate]] = None

class QuestionOut(BaseModel):
    id: int
    text: str
    answers: List[AnswerOut]

    class Config:
        orm_mode = True

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tüm soruları getirmek için yeni bir endpoint ekleyin
@app.get("/questions/", response_model=List[QuestionOut])
def read_questions(db: Session = Depends(get_db)):
    questions = db.query(Question).all()
    return questions

# API endpoints
@app.post("/questions/", response_model=QuestionOut)
def create_question(question: QuestionCreate, db: Session = Depends(get_db)):
    db_question = Question(text=question.text)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    for answer in question.answers:
        db_answer = Answer(text=answer.text, is_correct=answer.is_correct, question_id=db_question.id)
        db.add(db_answer)
    
    db.commit()
    db.refresh(db_question)
    return db_question

@app.get("/questions/{question_id}", response_model=QuestionOut)
def read_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@app.put("/questions/{question_id}", response_model=QuestionOut)
def update_question(question_id: int, question: QuestionUpdate, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.text:
        db_question.text = question.text

    if question.answers:
        db.query(Answer).filter(Answer.question_id == question_id).delete()
        for answer in question.answers:
            db_answer = Answer(text=answer.text, is_correct=answer.is_correct, question_id=db_question.id)
            db.add(db_answer)

    db.commit()
    db.refresh(db_question)
    return db_question

@app.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(db_question)
    db.commit()
    return {"message": "Question deleted successfully"}

# Create tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)