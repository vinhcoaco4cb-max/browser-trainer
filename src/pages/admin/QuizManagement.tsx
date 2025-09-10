import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, HelpCircle, Download } from 'lucide-react';
import { storage, Quiz, Question } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface QuizManagementProps {
  onUpdate: () => void;
}

const questionTypes = [
  { value: 'single', label: 'Один правильный ответ' },
  { value: 'multiple', label: 'Несколько правильных ответов' },
  { value: 'truefalse', label: 'Верно/Неверно' },
  { value: 'fillblank', label: 'Заполнение пропусков' },
  { value: 'sequence', label: 'Установление последовательности' },
  { value: 'dragdrop', label: 'Перетаскивание' },
  { value: 'dragdrop-categories', label: 'Перетаскивание по категориям' },
  { value: 'hotspot', label: 'Клик по области' },
  { value: 'hotspot-multiple', label: 'Клик по нескольким областям' },
  { value: 'hotspot-sequence', label: 'Клик по областям в порядке' }
];

export const QuizManagement = ({ onUpdate }: QuizManagementProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = () => {
    const allQuizzes = storage.getQuizzes();
    setQuizzes(allQuizzes);
  };

  const handleSaveQuiz = (formData: FormData) => {
    const quizData: Quiz = {
      id: selectedQuiz?.id || `quiz-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      timeLimit: parseInt(formData.get('timeLimit') as string) || undefined,
      passingScore: parseInt(formData.get('passingScore') as string) || 70,
      questions: selectedQuiz?.questions || []
    };

    storage.saveQuiz(quizData);
    loadQuizzes();
    onUpdate();
    setShowQuizDialog(false);
    setSelectedQuiz(null);
    
    toast({
      title: "Успешно",
      description: "Тест сохранен"
    });
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (confirm('Удалить тест? Это действие нельзя отменить.')) {
      storage.deleteQuiz(quizId);
      loadQuizzes();
      onUpdate();
      toast({
        title: "Удалено",
        description: "Тест удален"
      });
    }
  };

  const handleSaveQuestion = (formData: FormData) => {
    if (!selectedQuiz) return;

    const type = formData.get('type') as Question['type'];
    let options: string[] | undefined;
    let correctAnswer: string | string[] | number;

    // Parse options and correct answer based on question type
    const optionsText = formData.get('options') as string;
    if (optionsText && ['single', 'multiple', 'sequence', 'dragdrop'].includes(type)) {
      options = optionsText.split('\n').filter(opt => opt.trim());
    }

    const correctAnswerText = formData.get('correctAnswer') as string;
    if (type === 'single') {
      correctAnswer = parseInt(correctAnswerText);
    } else if (type === 'multiple') {
      correctAnswer = correctAnswerText.split(',').map(i => i.trim());
    } else if (type === 'truefalse') {
      correctAnswer = correctAnswerText;
    } else {
      correctAnswer = correctAnswerText;
    }

    const questionData: Question = {
      id: editingQuestion?.id || `question-${Date.now()}`,
      type,
      question: formData.get('question') as string,
      options,
      correctAnswer,
      points: parseInt(formData.get('points') as string) || 10
    };

    const updatedQuiz = { ...selectedQuiz };
    if (editingQuestion) {
      const index = updatedQuiz.questions.findIndex(q => q.id === editingQuestion.id);
      updatedQuiz.questions[index] = questionData;
    } else {
      updatedQuiz.questions.push(questionData);
    }

    storage.saveQuiz(updatedQuiz);
    loadQuizzes();
    setSelectedQuiz(updatedQuiz);
    setShowQuestionDialog(false);
    setEditingQuestion(null);
    
    toast({
      title: "Успешно",
      description: "Вопрос сохранен"
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedQuiz) return;
    
    if (confirm('Удалить вопрос?')) {
      const updatedQuiz = {
        ...selectedQuiz,
        questions: selectedQuiz.questions.filter(q => q.id !== questionId)
      };
      
      storage.saveQuiz(updatedQuiz);
      loadQuizzes();
      setSelectedQuiz(updatedQuiz);
      
      toast({
        title: "Удалено",
        description: "Вопрос удален"
      });
    }
  };

  const exportQuizzes = () => {
    const data = JSON.stringify(quizzes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quizzes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление тестами</h2>
          <p className="text-muted-foreground">Создавайте и редактируйте тесты и вопросы</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportQuizzes}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedQuiz(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Новый тест
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedQuiz ? 'Редактировать тест' : 'Создать тест'}
                </DialogTitle>
                <DialogDescription>
                  Заполните информацию о тесте
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveQuiz(new FormData(e.currentTarget)); }} className="space-y-4">
                <div>
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={selectedQuiz?.title}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedQuiz?.description}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="timeLimit">Ограничение времени (секунды)</Label>
                  <Input
                    id="timeLimit"
                    name="timeLimit"
                    type="number"
                    defaultValue={selectedQuiz?.timeLimit}
                    placeholder="Оставьте пустым для отсутствия ограничения"
                  />
                </div>
                <div>
                  <Label htmlFor="passingScore">Проходной балл (%)</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={selectedQuiz?.passingScore || 70}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowQuizDialog(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Сохранить</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quizzes List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Тесты ({quizzes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Нет созданных тестов
              </p>
            ) : (
              <div className="space-y-3">
                {quizzes.map(quiz => (
                  <div
                    key={quiz.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuiz?.id === quiz.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedQuiz(quiz)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{quiz.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {quiz.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary">
                            {quiz.questions.length} вопросов
                          </Badge>
                          <Badge variant="outline">
                            {quiz.passingScore}% для прохождения
                          </Badge>
                          {quiz.timeLimit && (
                            <Badge variant="outline">
                              {Math.floor(quiz.timeLimit / 60)} мин
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuiz(quiz);
                            setShowQuizDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Questions */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Вопросы теста
              </span>
              {selectedQuiz && (
                <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setEditingQuestion(null)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить вопрос
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingQuestion ? 'Редактировать вопрос' : 'Создать вопрос'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveQuestion(new FormData(e.currentTarget)); }} className="space-y-4">
                      <div>
                        <Label htmlFor="question-type">Тип вопроса</Label>
                        <Select name="type" defaultValue={editingQuestion?.type || 'single'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="question-text">Текст вопроса</Label>
                        <Textarea
                          id="question-text"
                          name="question"
                          defaultValue={editingQuestion?.question}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="question-options">Варианты ответов (по одному на строку)</Label>
                        <Textarea
                          id="question-options"
                          name="options"
                          defaultValue={editingQuestion?.options?.join('\n')}
                          placeholder="Вариант 1&#10;Вариант 2&#10;Вариант 3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="correct-answer">Правильный ответ</Label>
                        <Input
                          id="correct-answer"
                          name="correctAnswer"
                          defaultValue={
                            Array.isArray(editingQuestion?.correctAnswer)
                              ? editingQuestion.correctAnswer.join(',')
                              : editingQuestion?.correctAnswer?.toString()
                          }
                          placeholder="Для single: номер варианта (0,1,2...), для multiple: номера через запятую (0,2)"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="points">Баллы за вопрос</Label>
                        <Input
                          id="points"
                          name="points"
                          type="number"
                          min="1"
                          defaultValue={editingQuestion?.points || 10}
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowQuestionDialog(false)}>
                          Отмена
                        </Button>
                        <Button type="submit">Сохранить</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedQuiz ? (
              <p className="text-muted-foreground text-center py-8">
                Выберите тест для просмотра вопросов
              </p>
            ) : selectedQuiz.questions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                В тесте пока нет вопросов
              </p>
            ) : (
              <div className="space-y-3">
                {selectedQuiz.questions.map((question, index) => (
                  <div key={question.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <Badge variant="secondary">
                            {questionTypes.find(t => t.value === question.type)?.label}
                          </Badge>
                          <Badge variant="outline">{question.points} баллов</Badge>
                        </div>
                        <p className="font-medium mb-1">{question.question}</p>
                        {question.options && (
                          <div className="text-sm text-muted-foreground">
                            Вариантов: {question.options.length}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowQuestionDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};