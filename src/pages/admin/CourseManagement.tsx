import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, BookOpen, FileText, Download, Upload } from 'lucide-react';
import { storage, Course, Lesson } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface CourseManagementProps {
  onUpdate: () => void;
}

export const CourseManagement = ({ onUpdate }: CourseManagementProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    const allCourses = storage.getCourses();
    setCourses(allCourses);
  };

  const handleSaveCourse = (formData: FormData) => {
    const courseData = {
      id: selectedCourse?.id || `course-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      lockUntilPassed: formData.get('lockUntilPassed') === 'on',
      lessons: selectedCourse?.lessons || []
    };

    storage.saveCourse(courseData);
    loadCourses();
    onUpdate();
    setShowCourseDialog(false);
    setSelectedCourse(null);
    
    toast({
      title: "Успешно",
      description: "Курс сохранен"
    });
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm('Удалить курс? Это действие нельзя отменить.')) {
      storage.deleteCourse(courseId);
      loadCourses();
      onUpdate();
      toast({
        title: "Удалено",
        description: "Курс удален"
      });
    }
  };

  const handleSaveLesson = (formData: FormData) => {
    if (!selectedCourse) return;

    const lessonData: Lesson = {
      id: editingLesson?.id || `lesson-${Date.now()}`,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      courseId: selectedCourse.id,
      order: editingLesson?.order || selectedCourse.lessons.length + 1,
      completed: false
    };

    const updatedCourse = { ...selectedCourse };
    if (editingLesson) {
      const index = updatedCourse.lessons.findIndex(l => l.id === editingLesson.id);
      updatedCourse.lessons[index] = lessonData;
    } else {
      updatedCourse.lessons.push(lessonData);
    }

    storage.saveCourse(updatedCourse);
    loadCourses();
    setSelectedCourse(updatedCourse);
    setShowLessonDialog(false);
    setEditingLesson(null);
    
    toast({
      title: "Успешно",
      description: "Урок сохранен"
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!selectedCourse) return;
    
    if (confirm('Удалить урок?')) {
      const updatedCourse = {
        ...selectedCourse,
        lessons: selectedCourse.lessons.filter(l => l.id !== lessonId)
      };
      
      storage.saveCourse(updatedCourse);
      loadCourses();
      setSelectedCourse(updatedCourse);
      
      toast({
        title: "Удалено",
        description: "Урок удален"
      });
    }
  };

  const exportCourses = () => {
    const data = JSON.stringify(courses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление курсами</h2>
          <p className="text-muted-foreground">Создавайте и редактируйте курсы и уроки</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportCourses}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedCourse(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Новый курс
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedCourse ? 'Редактировать курс' : 'Создать курс'}
                </DialogTitle>
                <DialogDescription>
                  Заполните информацию о курсе
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveCourse(new FormData(e.currentTarget)); }} className="space-y-4">
                <div>
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={selectedCourse?.title}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedCourse?.description}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lockUntilPassed"
                    name="lockUntilPassed"
                    defaultChecked={selectedCourse?.lockUntilPassed}
                  />
                  <Label htmlFor="lockUntilPassed">
                    Блокировать уроки до прохождения предыдущих
                  </Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCourseDialog(false)}>
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
        {/* Courses List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Курсы ({courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Нет созданных курсов
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map(course => (
                  <div
                    key={course.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary">
                            {course.lessons.length} уроков
                          </Badge>
                          {course.lockUntilPassed && (
                            <Badge variant="outline">Последовательно</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourse(course);
                            setShowCourseDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
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

        {/* Course Details */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Уроки курса
              </span>
              {selectedCourse && (
                <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setEditingLesson(null)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить урок
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLesson ? 'Редактировать урок' : 'Создать урок'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveLesson(new FormData(e.currentTarget)); }} className="space-y-4">
                      <div>
                        <Label htmlFor="lesson-title">Название урока</Label>
                        <Input
                          id="lesson-title"
                          name="title"
                          defaultValue={editingLesson?.title}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lesson-content">Содержание (Markdown)</Label>
                        <Textarea
                          id="lesson-content"
                          name="content"
                          rows={10}
                          defaultValue={editingLesson?.content}
                          placeholder="# Заголовок урока&#10;&#10;Содержание урока в формате Markdown.&#10;&#10;Доступные шорткоды:&#10;- [img:path/to/image.jpg]&#10;- [file:path/to/document.pdf]&#10;- [video:path/to/video.mp4]&#10;- [quiz:quiz-id]"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowLessonDialog(false)}>
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
            {!selectedCourse ? (
              <p className="text-muted-foreground text-center py-8">
                Выберите курс для просмотра уроков
              </p>
            ) : selectedCourse.lessons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                В курсе пока нет уроков
              </p>
            ) : (
              <div className="space-y-3">
                {selectedCourse.lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, index) => (
                    <div key={lesson.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <h4 className="font-medium">{lesson.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {lesson.content.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingLesson(lesson);
                              setShowLessonDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLesson(lesson.id)}
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