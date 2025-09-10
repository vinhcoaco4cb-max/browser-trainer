import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, FileSpreadsheet } from 'lucide-react';
import { storage, User, UserProgress, Course } from '@/lib/storage';

interface UserReport {
  user: User;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  completedCourses: number;
  totalCourses: number;
  lastActivity: string;
}

export const Reports = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<UserReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    generateReports();
  }, []);

  useEffect(() => {
    const filtered = reports.filter(report => 
      report.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(filtered);
  }, [reports, searchTerm]);

  const generateReports = () => {
    const users = storage.getUsers().filter(u => u.role === 'student');
    const courses = storage.getCourses();
    const allProgress = storage.getAllProgress();

    const userReports: UserReport[] = users.map(user => {
      const userProgress = allProgress.filter(p => p.userId === user.id);
      
      let totalLessons = 0;
      let completedLessons = 0;
      let totalScores = 0;
      let scoreCount = 0;
      let completedCourses = 0;

      courses.forEach(course => {
        totalLessons += course.lessons.length;
        const courseProgress = userProgress.find(p => p.courseId === course.id);
        
        if (courseProgress) {
          completedLessons += courseProgress.completedLessons.length;
          
          if (courseProgress.courseCompleted) {
            completedCourses++;
          }

          // Calculate average quiz scores
          courseProgress.quizResults.forEach(result => {
            totalScores += result.score;
            scoreCount++;
          });
        }
      });

      const averageScore = scoreCount > 0 ? Math.round(totalScores / scoreCount) : 0;

      return {
        user,
        completedLessons,
        totalLessons,
        averageScore,
        completedCourses,
        totalCourses: courses.length,
        lastActivity: user.lastActivity
      };
    });

    setReports(userReports);
  };

  const exportToJSON = () => {
    const data = JSON.stringify(filteredReports, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['ФИО', 'Отдел', 'Уроков завершено', 'Всего уроков', 'Средний балл', 'Курсов завершено', 'Всего курсов', 'Последняя активность'];
    
    const csvData = [
      headers.join(','),
      ...filteredReports.map(report => [
        `"${report.user.name}"`,
        `"${report.user.department}"`,
        report.completedLessons,
        report.totalLessons,
        report.averageScore,
        report.completedCourses,
        report.totalCourses,
        `"${new Date(report.lastActivity).toLocaleDateString('ru-RU')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProgressBadge = (completed: number, total: number) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    if (percentage === 100) {
      return <Badge className="bg-success text-success-foreground">Завершено</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-warning text-warning-foreground">В процессе</Badge>;
    } else if (percentage > 0) {
      return <Badge variant="secondary">Начато</Badge>;
    } else {
      return <Badge variant="outline">Не начато</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Отчеты</h2>
          <p className="text-muted-foreground">Статистика прогресса пользователей</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToJSON}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт JSON
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Прогресс пользователей</CardTitle>
          <CardDescription>
            Подробная статистика по всем обучаемым
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или отделу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Пользователи не найдены' : 'Нет данных о пользователях'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Прогресс уроков</TableHead>
                    <TableHead>Прогресс курсов</TableHead>
                    <TableHead>Средний балл</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Последняя активность</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.user.id}>
                      <TableCell className="font-medium">
                        {report.user.name}
                      </TableCell>
                      <TableCell>{report.user.department}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.completedLessons} из {report.totalLessons}
                          <div className="text-xs text-muted-foreground">
                            {report.totalLessons > 0 
                              ? Math.round((report.completedLessons / report.totalLessons) * 100)
                              : 0}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.completedCourses} из {report.totalCourses}
                          <div className="text-xs text-muted-foreground">
                            {report.totalCourses > 0 
                              ? Math.round((report.completedCourses / report.totalCourses) * 100)
                              : 0}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.averageScore >= 70 ? "default" : "secondary"}>
                          {report.averageScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getProgressBadge(report.completedLessons, report.totalLessons)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.lastActivity).toLocaleDateString('ru-RU')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};