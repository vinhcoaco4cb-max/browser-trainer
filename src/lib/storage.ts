// Local storage management for LMS
export interface User {
  id: string;
  name: string;
  department: string;
  role: 'student' | 'admin';
  lastActivity: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lockUntilPassed: boolean;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  courseId: string;
  order: number;
  completed: boolean;
}

export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'truefalse' | 'fillblank' | 'sequence' | 'dragdrop' | 'dragdrop-categories' | 'hotspot' | 'hotspot-multiple' | 'hotspot-sequence';
  question: string;
  options?: string[];
  correctAnswer: string | string[] | number;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number;
  passingScore: number;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  answers: Record<string, any>;
  completedAt: string;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  quizResults: QuizResult[];
  courseCompleted: boolean;
  lastAccessedAt: string;
}

class StorageManager {
  private static instance: StorageManager;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Users
  getUsers(): User[] {
    const users = localStorage.getItem('lms_users');
    return users ? JSON.parse(users) : [];
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('lms_users', JSON.stringify(users));
  }

  getCurrentUser(): User | null {
    const currentUserId = localStorage.getItem('lms_current_user');
    if (!currentUserId) return null;
    const users = this.getUsers();
    return users.find(u => u.id === currentUserId) || null;
  }

  setCurrentUser(userId: string): void {
    localStorage.setItem('lms_current_user', userId);
  }

  logout(): void {
    localStorage.removeItem('lms_current_user');
  }

  // Courses
  getCourses(): Course[] {
    const courses = localStorage.getItem('lms_courses');
    return courses ? JSON.parse(courses) : [];
  }

  saveCourse(course: Course): void {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === course.id);
    if (index >= 0) {
      courses[index] = course;
    } else {
      courses.push(course);
    }
    localStorage.setItem('lms_courses', JSON.stringify(courses));
  }

  deleteCourse(courseId: string): void {
    const courses = this.getCourses().filter(c => c.id !== courseId);
    localStorage.setItem('lms_courses', JSON.stringify(courses));
  }

  // Quizzes
  getQuizzes(): Quiz[] {
    const quizzes = localStorage.getItem('lms_quizzes');
    return quizzes ? JSON.parse(quizzes) : [];
  }

  saveQuiz(quiz: Quiz): void {
    const quizzes = this.getQuizzes();
    const index = quizzes.findIndex(q => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.push(quiz);
    }
    localStorage.setItem('lms_quizzes', JSON.stringify(quizzes));
  }

  deleteQuiz(quizId: string): void {
    const quizzes = this.getQuizzes().filter(q => q.id !== quizId);
    localStorage.setItem('lms_quizzes', JSON.stringify(quizzes));
  }

  // User Progress
  getUserProgress(userId: string): UserProgress[] {
    const progress = localStorage.getItem('lms_progress');
    const allProgress: UserProgress[] = progress ? JSON.parse(progress) : [];
    return allProgress.filter(p => p.userId === userId);
  }

  saveUserProgress(progress: UserProgress): void {
    const allProgress = localStorage.getItem('lms_progress');
    const progressArray: UserProgress[] = allProgress ? JSON.parse(allProgress) : [];
    
    const index = progressArray.findIndex(p => 
      p.userId === progress.userId && p.courseId === progress.courseId
    );
    
    if (index >= 0) {
      progressArray[index] = progress;
    } else {
      progressArray.push(progress);
    }
    
    localStorage.setItem('lms_progress', JSON.stringify(progressArray));
  }

  getAllProgress(): UserProgress[] {
    const progress = localStorage.getItem('lms_progress');
    return progress ? JSON.parse(progress) : [];
  }

  // Initialize default data
  initializeDefaultData(): void {
    // Create default admin user if no users exist
    const users = this.getUsers();
    if (users.length === 0) {
      const adminUser: User = {
        id: 'admin',
        name: 'Администратор',
        department: 'IT',
        role: 'admin',
        lastActivity: new Date().toISOString()
      };
      this.saveUser(adminUser);
    }

    // Create sample course if no courses exist
    const courses = this.getCourses();
    if (courses.length === 0) {
      const sampleCourse: Course = {
        id: 'course-1',
        title: 'Введение в систему',
        description: 'Базовый курс для знакомства с платформой обучения',
        lockUntilPassed: true,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Добро пожаловать',
            content: '# Добро пожаловать в систему обучения\n\nЭто ваш первый урок. Здесь вы изучите основы работы с платформой.\n\n## Что вы узнаете:\n- Как проходить уроки\n- Как сдавать тесты\n- Как отслеживать свой прогресс\n\n[quiz:quiz-1]',
            courseId: 'course-1',
            order: 1,
            completed: false
          }
        ]
      };
      this.saveCourse(sampleCourse);

      // Create sample quiz
      const sampleQuiz: Quiz = {
        id: 'quiz-1',
        title: 'Проверка знаний',
        description: 'Тест по первому уроку',
        timeLimit: 600, // 10 minutes
        passingScore: 70,
        questions: [
          {
            id: 'q1',
            type: 'single',
            question: 'Как называется эта платформа?',
            options: ['LMS Система', 'Обучающая платформа', 'Система обучения', 'Все варианты верны'],
            correctAnswer: 3,
            points: 10
          }
        ]
      };
      this.saveQuiz(sampleQuiz);
    }
  }
}

export const storage = StorageManager.getInstance();