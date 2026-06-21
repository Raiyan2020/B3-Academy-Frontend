import React from 'react';
import { Star, Clock, User, ChevronDown } from 'lucide-react';
import { Link } from '@/lib/routing/next-router-compat';
import { Course, Book } from '../types';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { useAuth } from '../src/features/auth/auth-provider';
import { HempLeafGraphic, MushroomGraphic } from './Graphics';

// --- Currency Selector ---
export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const currencies = ['USD', 'EUR', 'GBP', 'AED', 'JPY', 'CNH'] as const;

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as any)}
        className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg ps-3 pe-8 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
      >
        {currencies.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute end-3 text-slate-400 pointer-events-none" />
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: 'emerald' | 'blue' | 'purple' | 'orange' }> = ({ children, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  className = '', 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:shadow-emerald-300",
    secondary: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
    outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50",
    ghost: "text-slate-600 hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3.5 text-lg",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin me-2" />
      ) : null}
      {children}
    </button>
  );
};

// --- Course Card ---
export const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const { localize, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const isCompleted = user?.completedCourseIds?.includes(course.id);

  return (
    <Link to={`/courses/${course.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full hover:-translate-y-1 relative">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none overflow-hidden z-0">
        <HempLeafGraphic className="w-full h-full transform translate-x-1/4 -translate-y-1/4 text-emerald-600" />
      </div>
      <div className="relative h-48 overflow-hidden z-10">
        <img src={course.thumbnail} alt={localize(course.title)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <div className="absolute top-3 start-3">
          <Badge color="emerald">{t(`filter.${course.level.toLowerCase()}` as any)}</Badge>
        </div>
        {isCompleted && (
          <div className="absolute top-3 end-3">
            <Badge color="blue">Completed</Badge>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {localize(course.title)}
        </h3>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{localize(course.description)}</p>
        
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{localize(course.duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User size={14} />
            <span>{course.studentsCount} {t('misc.students')}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-amber-400 gap-1 text-sm font-bold">
            <Star size={16} fill="currentColor" />
            <span>{course.rating}</span>
          </div>
          <span className="text-lg font-bold text-emerald-700">{formatPrice(course.price)}</span>
        </div>
      </div>
    </Link>
  );
};

// --- Book Card ---
export const BookCard: React.FC<{ book: Book }> = ({ book }) => {
  const { localize } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const isOwned = user?.purchasedBookIds.includes(book.id);

  return (
    <Link to={isOwned ? `/read/${book.id}` : `/books/${book.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full hover:-translate-y-1 relative">
      <div className="absolute bottom-0 left-0 w-24 h-24 opacity-5 pointer-events-none overflow-hidden z-0">
        <MushroomGraphic className="w-full h-full transform -translate-x-1/4 translate-y-1/4 text-emerald-600" />
      </div>
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 z-10">
        <img src={book.coverImage} alt={localize(book.title)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">
          {localize(book.title)}
        </h3>
        <p className="text-xs text-slate-500 mb-2">{localize(book.author)}</p>
        <div className="mt-auto flex items-center justify-between">
            <Badge color="blue">E-Book</Badge>
            <span className="font-bold text-emerald-700">{isOwned ? 'Owned' : formatPrice(book.prices.ebook)}</span>
        </div>
      </div>
    </Link>
  );
};

// --- Section Header ---
export const SectionHeader: React.FC<{ title: string; subtitle: string; centered?: boolean; light?: boolean }> = ({ title, subtitle, centered, light }) => (
  <div className={`mb-10 ${centered ? 'text-center' : ''}`}>
    <h2 className={`text-3xl font-bold mb-3 ${light ? 'text-[#ede3ce]' : 'text-slate-800'}`}>{title}</h2>
    <p className={`max-w-2xl text-lg ${centered ? 'mx-auto' : ''} ${light ? 'text-[#ede3ce]/90' : 'text-slate-600'}`}>{subtitle}</p>
  </div>
);