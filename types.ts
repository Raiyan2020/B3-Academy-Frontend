export enum UserRole {
  GUEST = 'GUEST',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR'
}

export enum ProductType {
  BOOK = 'BOOK',
  COURSE = 'COURSE',
  CONSULTATION = 'CONSULTATION',
  FOLLOWUP = 'FOLLOWUP'
}

export type LocalizedString = {
  en: string;
  ar: string;
  fr?: string;
  es?: string;
};

export interface Address {
  id: string;
  name: string;
  governorate: string;
  area: string;
  block: string;
  street: string;
  building: string;
  isDefault: boolean;
}

export interface UserConsultation {
  id: string;
  serviceName: LocalizedString;
  instructorName: LocalizedString;
  date: string;
  time: string;
  isCompleted: boolean;
  healthAssessmentCompleted: boolean;
  tripId?: string;
  clinicId?: string;
  meetLink?: string;
  chatLink?: string;
}

export interface CourseInstallment {
  courseId: string;
  nextPaymentDate: string;
  paymentsRemaining: number;
}

export interface User {
  id: string;
  name: string; // User names are usually not localized strictly, but kept as is
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  purchasedCourseIds: string[];
  courseInstallments?: CourseInstallment[];
  completedCourseIds?: string[];
  completedQuizIds?: string[]; // IDs of passed quizzes
  purchasedBookIds: string[];
  isSubscribed?: boolean;
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  isChatMuted?: boolean;
  healthAssessmentCompleted?: boolean;
  addresses: Address[];
  consultations?: UserConsultation[];
  trips?: {
    id: string;
    title: LocalizedString;
    date: string;
    isCompleted: boolean;
  }[];
  clinicBookings?: {
    id: string;
    serviceName: LocalizedString;
    date: string;
    time: string;
    location: string;
    isCompleted: boolean;
  }[];
}

export interface Instructor {
  id: string;
  name: LocalizedString;
  bio: LocalizedString;
  avatar: string;
  specialty: LocalizedString;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: LocalizedString;
  date: string;
}

export interface QuizQuestion {
  id: string;
  question: LocalizedString;
  options: LocalizedString[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  title: LocalizedString;
  questions: QuizQuestion[];
  passingScore: number; // e.g. 70
}

export interface LessonMaterial {
  id: string;
  title: LocalizedString;
  url: string;
}

export interface Lesson {
  id: string;
  title: LocalizedString;
  duration: string; // e.g. "12:30"
  videoUrl: string; // Dummy URL
  isFreePreview: boolean;
  description?: LocalizedString;
  materials?: LessonMaterial[];
}

export interface Module {
  id: string;
  title: LocalizedString;
  lessons: Lesson[];
  quiz?: Quiz; // Section quiz
}

export interface Course {
  id: string;
  title: LocalizedString;
  subtitle: LocalizedString;
  description: LocalizedString;
  price: number;
  thumbnail: string;
  instructor: Instructor;
  level: 'Beginner' | 'Intermediate' | 'Advanced'; // Keeping as enum key, displayed text will be localized
  duration: LocalizedString; // Total duration
  modules: Module[];
  reviews: Review[];
  topics: LocalizedString[];
  rating: number;
  studentsCount: number;
  finalExam?: Quiz;
}

export interface Book {
  id: string;
  title: LocalizedString;
  author: LocalizedString;
  description: LocalizedString;
  prices: {
    ebook: number;
    physical: number;
    bundle: number;
  };
  coverImage: string;
  pages: number;
  topics: LocalizedString[];
  rating: number;
  reviews: Review[];
}

export interface BookingSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  date: string;
  replies?: Comment[];
}

export interface Blog {
  id: string;
  title: LocalizedString;
  content: LocalizedString;
  authorId: string;
  authorName: string;
  date: string;
  imageUrl?: string;
  likes: string[]; // Array of user IDs who liked the blog
  comments: Comment[];
}

export interface Research {
  id: string;
  title: LocalizedString;
  content: LocalizedString;
  authorId: string;
  authorName: string;
  date: string;
  imageUrl?: string;
  likes: string[];
  comments: Comment[];
}

export interface Monograph {
  id: string;
  name: LocalizedString;
  scientificName: string;
  category: LocalizedString;
  type: 'Plant' | 'Fungi';
  imageUrl: string;
  description: LocalizedString;
  classifications: string[];
  properties: LocalizedString;
  benefits: LocalizedString;
  warnings: LocalizedString;
  family: LocalizedString;
  origin: LocalizedString;
  spread: LocalizedString;
}

export interface EncyclopediaEntry {
  id: string;
  name: LocalizedString;
  scientificName: string;
  category: 'plants' | 'fungi';
  tags: string[];
  image: string;
  description: LocalizedString;
  fullContent: LocalizedString;
  family?: LocalizedString;
  originCountry?: LocalizedString;
  sex?: LocalizedString;
}

export interface Theory {
  id: string;
  title: LocalizedString;
  content: LocalizedString;
  authorId: string;
  authorName: string;
  date: string;
  imageUrl?: string;
  likes: string[];
  comments: Comment[];
}

export interface Booking {
  id: string;
  type: 'CONSULTATION' | 'FOLLOWUP';
  date: string;
  time: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  meetingLink?: string;
}
