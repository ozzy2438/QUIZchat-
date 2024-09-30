'use client'


import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Fireworks } from '@fireworks-js/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2, Edit2, Play, ChevronRight, RotateCcw } from 'lucide-react'

// Types
type Answer = {
  id?: number
  text: string
  is_correct: boolean
}

type Question = {
  id: number
  text: string
  answers: Answer[]
}

export function AiQuizApp() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswers, setNewAnswers] = useState<Answer[]>([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false }
  ])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizResult, setQuizResult] = useState<'success' | 'failure' | null>(null)

  useEffect(() => {
    fetchQuestions()
    // Her 30 saniyede bir soruları yenile
    const interval = setInterval(fetchQuestions, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:8000/questions/')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      console.log('Fetched questions:', data) // Hata ayıklama için
      setQuestions(data)
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleAddQuestion = async () => {
    if (newQuestion.trim() === '' || newAnswers.some(answer => answer.text.trim() === '') || !newAnswers.some(answer => answer.is_correct)) {
      alert('Please fill in all fields and select a correct answer.')
      return
    }

    const questionData = {
      text: newQuestion,
      answers: newAnswers
    }

    try {
      const response = await fetch('http://localhost:8000/questions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      setNewQuestion('')
      setNewAnswers([
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ])
      fetchQuestions()
    } catch (error) {
      console.error('Error adding question:', error)
    }
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return

    try {
      const response = await fetch(`http://localhost:8000/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editingQuestion.text,
          answers: editingQuestion.answers
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      setEditingQuestion(null)
      fetchQuestions()
    } catch (error) {
      console.error('Error updating question:', error)
    }
  }

  const handleDeleteQuestion = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/questions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchQuestions()
      } else {
        console.error('Failed to delete question')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  const startQuiz = () => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random())
    setQuizQuestions(shuffled.slice(0, 5))
    setCurrentQuestionIndex(0)
    setScore(0)
    setQuizStarted(true)
    setQuizFinished(false)
    setQuizResult(null)
  }

  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswer(answerId)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const currentQuestion = quizQuestions[currentQuestionIndex]
      const selectedAnswerObj = currentQuestion.answers.find(answer => answer.id === selectedAnswer)
      if (selectedAnswerObj && selectedAnswerObj.is_correct) {
        setScore(score + 1)
      }
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
    } else {
      setQuizFinished(true)
      const successThreshold = Math.ceil(quizQuestions.length * 0.7) // 70% başarı eşiği
      setQuizResult(score >= successThreshold ? 'success' : 'failure')
    }
  }

  useEffect(() => {
    if (quizFinished && quizResult === 'success') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [quizFinished, quizResult])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8"
    >
      <div className="container mx-auto">
        <motion.h1 
          className="text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          AI-Powered Quiz Platform
        </motion.h1>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="create" className="text-lg">Create Question</TabsTrigger>
            <TabsTrigger value="view" className="text-lg">View Questions</TabsTrigger>
            <TabsTrigger value="quiz" className="text-lg">Start Quiz</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl">Add New Question</CardTitle>
                <CardDescription>Create a new AI-generated quiz question with multiple choice answers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter your question here"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                {newAnswers.map((answer, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`answer-${index}`}>Answer {index + 1}</Label>
                    <div className="flex space-x-2">
                      <Input
                        id={`answer-${index}`}
                        value={answer.text}
                        onChange={(e) => {
                          const updatedAnswers = [...newAnswers]
                          updatedAnswers[index].text = e.target.value
                          setNewAnswers(updatedAnswers)
                        }}
                        placeholder={`Enter answer ${index + 1}`}
                        className="bg-gray-700 border-gray-600 text-white flex-grow"
                      />
                      <Button
                        variant={answer.is_correct ? "default" : "secondary"}
                        onClick={() => {
                          const updatedAnswers = newAnswers.map((a, i) => ({
                            ...a,
                            is_correct: i === index
                          }))
                          setNewAnswers(updatedAnswers)
                        }}
                        className="w-24"
                      >
                        {answer.is_correct ? "Correct" : "Mark Correct"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddQuestion} className="w-full bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="view">
            <motion.div 
              className="space-y-4"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="show"
            >
              {questions.map((question) => (
                <motion.div
                  key={question.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl">{question.text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup>
                        {question.answers.map((answer) => (
                          <div key={answer.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={answer.id?.toString() || ''} id={`answer-${answer.id}`} />
                            <Label htmlFor={`answer-${answer.id}`} className={answer.is_correct ? 'text-green-400 font-bold' : ''}>
                              {answer.text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="secondary" onClick={() => setEditingQuestion(question)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" onClick={() => handleDeleteQuestion(question.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
          <TabsContent value="quiz">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl">Take the Quiz</CardTitle>
                <CardDescription>Test your knowledge with our AI-generated questions.</CardDescription>
              </CardHeader>
              <CardContent>
                {!quizStarted ? (
                  <div className="text-center">
                    <p className="mb-4">Ready to challenge yourself? Start the quiz now!</p>
                    <Button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700">
                      <Play className="mr-2 h-4 w-4" /> Start Quiz
                    </Button>
                  </div>
                ) : quizFinished ? (
                  <AnimatePresence>
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-2xl font-bold mb-4">Quiz Tamamlandı!</h3>
                      <p className="text-xl mb-4">Puanınız: {score} / {quizQuestions.length}</p>
                      {quizResult === 'success' ? (
                        <>
                          <p className="text-2xl mb-4">🎉 Tebrikler! Harika bir iş çıkardınız! 🎉</p>
                          <Fireworks
                            options={{
                              rocketsPoint: {
                                min: 0,
                                max: 100
                              }
                            }}
                            style={{
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              position: 'fixed',
                              background: 'transparent'
                            }}
                          />
                        </>
                      ) : (
                        <p className="text-2xl mb-4">😔 Üzülme, bir dahaki sefere daha iyi olacak!</p>
                      )}
                      <Button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700">
                        <RotateCcw className="mr-2 h-4 w-4" /> Quizi Yeniden Başlat
                      </Button>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div 
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-semibold mb-4">Question {currentQuestionIndex + 1} of {quizQuestions.length}</h3>
                    <p className="text-lg mb-4">{quizQuestions[currentQuestionIndex].text}</p>
                    <RadioGroup value={selectedAnswer?.toString()} onValueChange={(value) => handleAnswerSelect(parseInt(value))}>
                      {quizQuestions[currentQuestionIndex].answers.map((answer) => (
                        <div key={answer.id} className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value={answer.id?.toString() || ''} id={`quiz-answer-${answer.id}`} />
                          <Label htmlFor={`quiz-answer-${answer.id}`}>{answer.text}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </motion.div>
                )}
              </CardContent>
              {quizStarted && !quizFinished && (
                <CardFooter>
                  <Button onClick={handleNextQuestion} className="w-full bg-blue-600 hover:bg-blue-700" disabled={selectedAnswer === null}>
                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                      <>
                        Next Question <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Finish Quiz'
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {editingQuestion && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2 className="text-2xl font-bold mb-4">Edit Question</h2>
            <Input
              value={editingQuestion.text}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
              className="mb-4 bg-gray-700 border-gray-600 text-white"
            />
            {editingQuestion.answers.map((answer, index) => (
              <div key={index} className="mb-4">
                <Input
                  value={answer.text}
                  onChange={(e) => {
                    const newAnswers = [...editingQuestion.answers]
                    newAnswers[index].text = e.target.value
                    setEditingQuestion({ ...editingQuestion, answers: newAnswers })
                  }}
                  className="mb-2 bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  variant={answer.is_correct ? "default" : "secondary"}
                  onClick={() => {
                    const newAnswers = editingQuestion.answers.map((a, i) => ({
                      ...a,
                      is_correct: i === index
                    }))
                    setEditingQuestion({ ...editingQuestion, answers: newAnswers })
                  }}
                  className="w-full"
                >
                  {answer.is_correct ? "Correct" : "Mark Correct"}
                </Button>
              </div>
            ))}
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setEditingQuestion(null)}>Cancel</Button>
              <Button onClick={handleUpdateQuestion}>Save Changes</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>
    </motion.div>
  )
}