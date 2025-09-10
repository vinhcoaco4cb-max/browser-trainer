import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, CheckCircle, Lock, Clock } from 'lucide-react';
import { storage, Course, UserProgress } from '@/lib/storage';

export const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const foundCourse = storage.getCourses().find(c => c.id === courseId);
    if (!foundCourse) {
      navigate('/');
      return;
    }

    setCourse(foundCourse);

    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const userProgress = storage.getUserProgress(currentUser.id)
        .find(p => p.courseId === courseId);
      
      if (!userProgress) {
        // Create initial progress
        const initialProgress: UserProgress = {
          userId: currentUser.id,
          courseId,
          completedLessons: [],
          quizResults: [],
          courseCompleted: false,
          lastAccessedAt: new Date().toISOString()
        };
        storage.saveUserProgress(initialProgress);
        setProgress(initialProgress);
      } else {
        setProgress(userProgress);
      }
    }
  }, [courseId, navigate]);

  const isLessonAvailable = (lessonIndex: number) => {
    if (!course || !progress) return false;
    
    // First lesson is always available
    if (lessonIndex === 0) return true;
    
    // If course doesn't require sequential completion
    if (!course.lockUntilPassed) return true;
    
    // Check if previous lesson is completed
    const previousLesson = course.lessons[lessonIndex - 1];
    return progress.completedLessons.includes(previousLesson.id);
  };

  const getProgressPercentage = () => {
    if (!course || !progress) return 0;
    return course.lessons.length > 0 
      ? Math.round((progress.completedLessons.length / course.lessons.length) * 100)
      : 0;
  };

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Курс не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к курсам
        </Button>
      </div>

      {/* Course Header */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
              <CardDescription className="text-lg">
                {course.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-2">Прогресс курса</div>
              <div className="text-2xl font-bold text-primary">
                {getProgressPercentage()}%
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{progress?.completedLessons.length || 0} из {course.lessons.length} уроков завершено</span>
              <span>{course.lessons.length} уроков всего</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Уроки курса</h3>
        
        {course.lessons.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">В этом курсе пока нет уроков</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {course.lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson, index) => {
                const isCompleted = progress?.completedLessons.includes(lesson.id) || false;
                const isAvailable = isLessonAvailable(index);
                
                return (
                  <Card 
                    key={lesson.id} 
                    className={`shadow-medium transition-all duration-200 ${
                      isAvailable ? 'hover:shadow-large cursor-pointer' : 'opacity-60'
                    }`}
                    onClick={() => isAvailable && navigate(`/lesson/${lesson.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-success" />
                            ) : !isAvailable ? (
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <span className="text-primary font-semibold">{index + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{lesson.title}</h4>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {lesson.content.substring(0, 150).replace(/[#*]/g, '')}...
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {isCompleted && (
                            <Badge className="bg-success text-success-foreground">
                              Завершен
                            </Badge>
                          )}
                          
                          {!isAvailable && (
                            <Badge variant="secondary">
                              Заблокирован
                            </Badge>
                          )}
                          
                          {isAvailable && (
                            <Button size="sm" variant={isCompleted ? "outline" : "default"}>
                              {isCompleted ? (
                                <>
                                  <Clock className="w-4 h-4 mr-2" />
                                  Повторить
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  {index === 0 ? 'Начать' : 'Продолжить'}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};