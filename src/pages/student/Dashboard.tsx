import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, CheckCircle, Clock } from 'lucide-react';
import { storage, Course, UserProgress } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const allCourses = storage.getCourses();
    setCourses(allCourses);
    
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const userProgress = storage.getUserProgress(currentUser.id);
      setProgress(userProgress);
    }
  }, []);

  const getCourseProgress = (courseId: string) => {
    const courseProgress = progress.find(p => p.courseId === courseId);
    if (!courseProgress) return { completed: 0, total: 0, percentage: 0 };
    
    const course = courses.find(c => c.id === courseId);
    if (!course) return { completed: 0, total: 0, percentage: 0 };
    
    const total = course.lessons.length;
    const completed = courseProgress.completedLessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const getStatusBadge = (courseId: string) => {
    const courseProgress = progress.find(p => p.courseId === courseId);
    if (!courseProgress) {
      return <Badge variant="secondary">Не начат</Badge>;
    }
    
    if (courseProgress.courseCompleted) {
      return <Badge className="bg-success text-success-foreground">Завершен</Badge>;
    }
    
    const { completed, total } = getCourseProgress(courseId);
    if (completed > 0) {
      return <Badge className="bg-warning text-warning-foreground">В процессе</Badge>;
    }
    
    return <Badge variant="secondary">Не начат</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Мои курсы</h1>
          <p className="text-muted-foreground mt-2">
            Выберите курс для продолжения обучения
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="shadow-medium">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Курсы не найдены</h3>
            <p className="text-muted-foreground">
              Пока что нет доступных курсов для изучения
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const { completed, total, percentage } = getCourseProgress(course.id);
            
            return (
              <Card key={course.id} className="hover:shadow-large transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/course/${course.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </div>
                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Прогресс</span>
                    <span className="font-medium">{completed} из {total} уроков</span>
                  </div>
                  
                  <Progress value={percentage} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    {getStatusBadge(course.id)}
                    <Button size="sm" variant="outline">
                      {percentage === 0 ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Начать
                        </>
                      ) : percentage === 100 ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Повторить
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Продолжить
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};