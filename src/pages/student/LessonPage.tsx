import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { storage, Lesson, Course, UserProgress } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export const LessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!lessonId) return;

    const courses = storage.getCourses();
    let foundLesson: Lesson | null = null;
    let foundCourse: Course | null = null;

    for (const course of courses) {
      const lesson = course.lessons.find(l => l.id === lessonId);
      if (lesson) {
        foundLesson = lesson;
        foundCourse = course;
        break;
      }
    }

    if (!foundLesson || !foundCourse) {
      navigate('/');
      return;
    }

    setLesson(foundLesson);
    setCourse(foundCourse);

    // Check if lesson is completed
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const userProgress = storage.getUserProgress(currentUser.id)
        .find(p => p.courseId === foundCourse.id);
      
      if (userProgress?.completedLessons.includes(lessonId)) {
        setIsCompleted(true);
      }
    }
  }, [lessonId, navigate]);

  const processContent = (content: string): string => {
    // Process Markdown-like content and shortcodes
    let processed = content;

    // Convert Markdown headers
    processed = processed.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>');
    processed = processed.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>');
    processed = processed.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-6">$1</h1>');

    // Convert line breaks
    processed = processed.replace(/\n\n/g, '</p><p class="mb-4">');
    processed = processed.replace(/\n/g, '<br/>');

    // Wrap in paragraph tags
    processed = `<p class="mb-4">${processed}</p>`;

    // Process shortcodes
    processed = processed.replace(/\[img:(.*?)\]/g, '<img src="$1" alt="Изображение" class="max-w-full h-auto rounded-lg my-4" />');
    processed = processed.replace(/\[file:(.*?)\]/g, '<a href="$1" target="_blank" class="text-primary hover:underline">📄 Скачать файл</a>');
    processed = processed.replace(/\[video:(.*?)\]/g, '<video controls class="w-full rounded-lg my-4"><source src="$1" type="video/mp4">Ваш браузер не поддерживает видео.</video>');
    processed = processed.replace(/\[quiz:(.*?)\]/g, '<div class="quiz-placeholder bg-primary/10 border-2 border-dashed border-primary rounded-lg p-6 my-6 text-center"><p class="text-primary font-medium">🎯 Тест: $1</p><p class="text-muted-foreground text-sm mt-2">Тест будет доступен после реализации системы тестирования</p></div>');

    return processed;
  };

  const handleCompleteLesson = () => {
    if (!lesson || !course) return;

    const currentUser = storage.getCurrentUser();
    if (!currentUser) return;

    // Get or create user progress
    let userProgress = storage.getUserProgress(currentUser.id)
      .find(p => p.courseId === course.id);

    if (!userProgress) {
      userProgress = {
        userId: currentUser.id,
        courseId: course.id,
        completedLessons: [],
        quizResults: [],
        courseCompleted: false,
        lastAccessedAt: new Date().toISOString()
      };
    }

    // Add lesson to completed if not already completed
    if (!userProgress.completedLessons.includes(lesson.id)) {
      userProgress.completedLessons.push(lesson.id);
      
      // Check if course is completed
      if (userProgress.completedLessons.length === course.lessons.length) {
        userProgress.courseCompleted = true;
      }
      
      userProgress.lastAccessedAt = new Date().toISOString();
      storage.saveUserProgress(userProgress);
      
      setIsCompleted(true);
      toast({
        title: "Урок завершен!",
        description: "Ваш прогресс сохранен"
      });
    }
  };

  const getNextLesson = () => {
    if (!lesson || !course) return null;
    
    const currentIndex = course.lessons.findIndex(l => l.id === lesson.id);
    if (currentIndex < course.lessons.length - 1) {
      return course.lessons[currentIndex + 1];
    }
    return null;
  };

  const nextLesson = getNextLesson();

  if (!lesson || !course) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Урок не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/course/${course.id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к курсу
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {course.title}
        </div>
      </div>

      {/* Lesson Content */}
      <Card className="shadow-medium">
        <CardContent className="p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
            
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: processContent(lesson.content) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lesson Actions */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isCompleted && (
                <div className="flex items-center space-x-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Урок завершен</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              {!isCompleted && (
                <Button onClick={handleCompleteLesson}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Завершить урок
                </Button>
              )}
              
              {nextLesson && (
                <Button 
                  variant={isCompleted ? "default" : "outline"}
                  onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                >
                  Следующий урок
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {!nextLesson && isCompleted && (
                <Button onClick={() => navigate(`/course/${course.id}`)}>
                  Вернуться к курсу
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};