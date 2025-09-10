import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, FileText, TrendingUp, Award, Clock } from 'lucide-react';
import { storage, User, Course, Quiz, UserProgress } from '@/lib/storage';
import { CourseManagement } from './CourseManagement';
import { QuizManagement } from './QuizManagement';
import { Reports } from './Reports';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalQuizzes: 0,
    averageProgress: 0
  });

  const [recentActivity, setRecentActivity] = useState<User[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const users = storage.getUsers().filter(u => u.role === 'student');
    const courses = storage.getCourses();
    const quizzes = storage.getQuizzes();
    const allProgress = storage.getAllProgress();

    // Calculate average progress
    let totalProgress = 0;
    let progressCount = 0;
    
    users.forEach(user => {
      courses.forEach(course => {
        const userProgress = allProgress.find(p => 
          p.userId === user.id && p.courseId === course.id
        );
        if (userProgress) {
          const courseCompletionRate = course.lessons.length > 0 
            ? (userProgress.completedLessons.length / course.lessons.length) * 100 
            : 0;
          totalProgress += courseCompletionRate;
          progressCount++;
        }
      });
    });

    const averageProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;

    setStats({
      totalUsers: users.length,
      totalCourses: courses.length,
      totalQuizzes: quizzes.length,
      averageProgress
    });

    // Get recent activity (last 5 users)
    const sortedUsers = users
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 5);
    setRecentActivity(sortedUsers);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Панель администратора</h1>
        <p className="text-muted-foreground mt-2">
          Управление курсами, тестами и мониторинг прогресса
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
          <TabsTrigger value="courses">Курсы</TabsTrigger>
          <TabsTrigger value="quizzes">Тесты</TabsTrigger>
          <TabsTrigger value="reports">Отчеты</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Активных обучаемых
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Курсы</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Доступных курсов
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Тесты</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
                <p className="text-xs text-muted-foreground">
                  Созданных тестов
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний прогресс</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageProgress}%</div>
                <p className="text-xs text-muted-foreground">
                  По всем курсам
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Последняя активность
              </CardTitle>
              <CardDescription>
                Недавно активные пользователи
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Нет активности пользователей
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-medium">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {new Date(user.lastActivity).toLocaleDateString('ru-RU')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <CourseManagement onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="quizzes">
          <QuizManagement onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="reports">
          <Reports />
        </TabsContent>
      </Tabs>
    </div>
  );
};