import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from '@/lib/routing/next-router-compat';
import { AlertTriangle, CheckCircle2, MapPin, Ticket, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { useAuth } from '@/features/auth/auth-provider';
import { getCourseById } from '@/features/courses/services/courses.service';
import { getBookById } from '@/features/books/services/books.service';
import { createPaymentIntent, failPaymentIntent, completePaymentIntent } from '@/features/payments/services/payments-storage.service';
import { getActiveSubscriptionPlans, getPlanPrice } from '@/features/subscriptions/services/subscriptions.service';
import { addSubscriptionHistory } from '@/features/subscriptions/services/subscription-history.service';
import type { CurrencyCode } from '@/features/business/business.types';
import type { PaymentIntent, PaymentKind } from '@/features/payments/types/payment.types';
import { useSearchParams } from 'next/navigation';
import { getClinicById, CARE_DOCTORS, getActiveConsultationPackages, getActiveTripPackages } from '@/features/care/services/care-data.service';
import { addStoredClinicBooking, addStoredConsultation, addStoredTripPurchase } from '@/features/care/services/care-records-storage.service';
import { addCourseEnrollment } from '@/features/learning/services/enrollment.service';
import { addBookPurchase } from '@/features/books/services/book-purchase.service';

export const Checkout: React.FC = () => {
    const { type, id, format } = useParams<{ type: string; id: string; format?: string }>();
    const searchParams = useSearchParams();
    const slotId = searchParams?.get('slotId') || '';
    const tripId = searchParams?.get('tripId') || '';
    const clinicId = searchParams?.get('clinicId') || '';
    const isInitial = searchParams?.get('isInitial') || '';
    
    const navigate = useNavigate();
    const { t, localize, language } = useLanguage();
    const { formatPrice, currency } = useCurrency();
    const { user, purchaseItem, subscribe, requireAuthAction } = useAuth();

    const [address, setAddress] = useState('');
    const [paymentPlan, setPaymentPlan] = useState<'full' | 'installments'>('full');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isPurchased, setIsPurchased] = useState(false);
    const [intent, setIntent] = useState<PaymentIntent | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    let item: any = null;
    if (type === 'course') item = getCourseById(id);
    else if (type === 'book') item = getBookById(id);
    else if (type === 'subscription') {
        const plan = getActiveSubscriptionPlans().find((candidate) => candidate.id === id) || getActiveSubscriptionPlans()[0];
        item = plan ? { ...plan, title: plan.name, price: getPlanPrice(plan, currency as CurrencyCode) } : null;
    } else if (type === 'clinic-appointment') {
        const clinic = getClinicById(id);
        item = clinic ? { ...clinic, title: clinic.name, price: clinic.price } : null;
    } else if (type === 'consultation-session') {
        const doctor = CARE_DOCTORS.find(d => d.id === id);
        const formatParam = searchParams?.get('format') || 'video';
        const price = formatParam === 'video' ? 150 : 100;
        const serviceName = isInitial === 'true'
            ? (clinicId 
                ? { ar: 'استشارة أولية للعيادة', en: 'Clinic Initial Consultation' }
                : { ar: 'استشارة أولية للرحلة', en: 'Trip Initial Consultation' })
            : (formatParam === 'video' 
                ? { ar: 'استشارة مرئية فردية', en: 'Individual video consultation' } 
                : { ar: 'استشارة نصية فردية', en: 'Individual text consultation' });
        item = doctor ? { 
            id: doctor.id, 
            title: {
                ar: `${localize(serviceName)} - ${localize(doctor.name)}`,
                en: `${localize(serviceName)} - ${localize(doctor.name)}`,
            }, 
            price 
        } : null;
    } else if (type === 'consultation-package') {
        const pkg = getActiveConsultationPackages().find(p => p.id === id);
        const doctor = pkg ? CARE_DOCTORS.find(d => d.id === pkg.doctorId) : null;
        item = pkg && doctor ? { 
            ...pkg, 
            title: {
                ar: `${localize(pkg.name)} - ${localize(doctor.name)}`,
                en: `${localize(pkg.name)} - ${localize(doctor.name)}`,
            }
        } : null;
    } else if (type === 'trip-package') {
        const trip = getActiveTripPackages().find(t => t.id === id);
        item = trip ? { ...trip, title: trip.title, price: trip.price } : null;
    }

    const paymentKind: PaymentKind = useMemo(() => {
        if (type === 'course') return paymentPlan === 'installments' ? 'course-installment' : 'course-full';
        if (type === 'subscription') return 'subscription-plan';
        if (type === 'book') {
            if (format === 'physical') return 'book-print';
            if (format === 'bundle') return 'book-bundle';
            return 'book-ebook';
        }
        if (type === 'clinic-appointment') return 'clinic-appointment';
        if (type === 'consultation-session') return 'consultation-session';
        if (type === 'consultation-package') return 'consultation-package';
        if (type === 'trip-package') return 'trip-package';
        return 'book-ebook';
    }, [format, paymentPlan, type]);

    if (!item || (type === 'book' && !format)) return <div className="p-20 text-center">Invalid request</div>;

    const basePrice = (type === 'course' || type === 'subscription' || type === 'clinic-appointment' || type === 'consultation-session' || type === 'consultation-package' || type === 'trip-package') 
        ? item.price 
        : item.prices[format!];
        
    const price = Math.max(0, basePrice - discount);
    const isPhysical = type === 'book' && (format === 'physical' || format === 'bundle');
    const alreadyOwnsCourse = type === 'course' && Boolean(user?.purchasedCourseIds.includes(item.id));
    const alreadyOwnsBookFormat = type === 'book' && Boolean(user?.purchasedBookIds.includes(item.id)) && (format === 'ebook' || format === 'bundle');
    const alreadySubscribed = type === 'subscription' && Boolean(user?.isSubscribed);

    const applyCoupon = () => {
        setCouponMessage(null);
        if (couponCode === 'SAVE10') {
            setDiscount(basePrice * 0.1);
            setCouponMessage({
                text: localize({ ar: 'تم تطبيق الكوبون! خصم 10%.', en: 'Coupon applied! 10% discount.' }),
                isError: false
            });
        } else {
            setCouponMessage({
                text: localize({ ar: 'كوبون غير صالح.', en: 'Invalid coupon' }),
                isError: true
            });
        }
    };

    const handlePurchase = () => {
        setPurchaseError(null);
        if (!requireAuthAction()) return;
        if (isPhysical && !address) {
            setPurchaseError(localize({ ar: 'يرجى اختيار عنوان الشحن.', en: 'Please select a shipping address.' }));
            return;
        }
        if (alreadyOwnsCourse || alreadyOwnsBookFormat || alreadySubscribed) {
            setPurchaseError(localize({ ar: 'لا يمكن شراء هذا العنصر أو الصيغة مرة أخرى.', en: 'This item or format cannot be purchased again.' }));
            return;
        }
        if (!user) return;

        const nextIntent = createPaymentIntent({
            userId: user.id,
            kind: paymentKind,
            itemId: item.id || 'subscription',
            itemName: localize(item.title),
            amount: price,
            currency: currency as CurrencyCode,
        });
        setIntent(nextIntent);
        setPaymentError(null);
    };

    const confirmPayment = () => {
        if (!intent) return;
        setIsProcessing(true);
        const failedByCoupon = couponCode.trim().toUpperCase() === 'FAIL';
        window.setTimeout(() => {
            if (failedByCoupon) {
                failPaymentIntent(intent.id, 'gateway-declined');
                setPaymentError(localize({ ar: 'رفضت بوابة الدفع العملية. يمكنك إزالة كود FAIL والمحاولة مرة أخرى.', en: 'The gateway declined this payment. Remove the FAIL code and retry.' }));
                setIsProcessing(false);
                return;
            }
            const record = completePaymentIntent(intent.id);
            if (!record) {
                setPaymentError(localize({ ar: 'تعذر إكمال عملية الدفع. حاول مرة أخرى.', en: 'Payment could not be completed. Please retry.' }));
                setIsProcessing(false);
                return;
            }
            
            if (type === 'subscription') {
                subscribe(item.id);
                const startedAt = new Date();
                const expiresAt = new Date(startedAt);
                if (String(item.id).includes('monthly')) expiresAt.setMonth(expiresAt.getMonth() + 1);
                else expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                addSubscriptionHistory({
                    userId: user.id,
                    planId: item.id,
                    planName: localize(item.title),
                    amount: intent.amount,
                    currency: intent.currency,
                    startedAt: startedAt.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    renewal: 'manual',
                    paymentId: record.id,
                });
            } else if (type === 'course') {
                addCourseEnrollment({
                    userId: user.id,
                    courseId: item.id,
                    paymentMode: paymentPlan,
                });
                purchaseItem('course', item.id, { silent: true });
            } else if (type === 'book') {
                addBookPurchase({
                    userId: user.id,
                    bookId: item.id,
                    format: format as any,
                    price: price,
                    shippingAddress: address || undefined,
                    paymentId: record.id,
                });
                purchaseItem('book', item.id, { silent: true });
            } else if (type === 'clinic-appointment') {
                const clinic = getClinicById(id);
                if (clinic) {
                    addStoredClinicBooking({
                        userId: user.id,
                        clinicId: clinic.id,
                        doctorId: clinic.doctor.id,
                        serviceName: { ar: `موعد عيادة - ${localize(clinic.name)}`, en: `Clinic Appointment - ${localize(clinic.name)}` },
                        doctorName: clinic.doctor.name,
                        location: clinic.address,
                        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                        time: '11:00 AM',
                        price: clinic.price,
                        status: 'scheduled',
                        paymentId: record.id,
                    });
                }
            } else if (type === 'consultation-session') {
                const doctorId = id;
                const formatParam = searchParams?.get('format') || 'video';
                const doctor = CARE_DOCTORS.find(d => d.id === doctorId);
                const price = formatParam === 'video' ? 150 : 100;
                
                const isInitialVal = searchParams?.get('isInitial') === 'true';
                const clinicIdVal = searchParams?.get('clinicId') || undefined;
                const tripIdVal = searchParams?.get('tripId') || undefined;
                
                const serviceName = isInitialVal
                    ? (clinicIdVal 
                        ? { ar: 'استشارة أولية للعيادة', en: 'Clinic Initial Consultation' }
                        : { ar: 'استشارة أولية للرحلة', en: 'Trip Initial Consultation' })
                    : (formatParam === 'video' 
                        ? { ar: 'استشارة مرئية فردية', en: 'Individual video consultation' } 
                        : { ar: 'استشارة نصية فردية', en: 'Individual text consultation' });

                if (doctor) {
                    addStoredConsultation({
                        userId: user.id,
                        doctorId: doctor.id,
                        doctorName: doctor.name,
                        serviceName,
                        kind: formatParam === 'video' ? 'individual-video' : 'individual-text',
                        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                        time: formatParam === 'video' ? '10:00 AM' : '04:00 PM',
                        price,
                        status: 'scheduled',
                        paymentId: record.id,
                        clinicId: clinicIdVal,
                        tripId: tripIdVal,
                        portalHref: formatParam === 'text' ? `/consultation/${doctor.id}-${Date.now()}/chat` : undefined,
                    });
                }
            } else if (type === 'consultation-package') {
                const pkg = getActiveConsultationPackages().find(p => p.id === id);
                const doctor = pkg ? CARE_DOCTORS.find(d => d.id === pkg.doctorId) : null;
                if (pkg && doctor) {
                    addStoredConsultation({
                        userId: user.id,
                        doctorId: doctor.id,
                        doctorName: doctor.name,
                        serviceName: pkg.name,
                        kind: 'package',
                        date: new Date().toISOString().slice(0, 10),
                        time: '-',
                        price: pkg.price,
                        status: 'purchased',
                        paymentId: record.id,
                        packageId: pkg.id,
                        sessionCount: pkg.sessionCount,
                        remainingSessions: pkg.sessionCount,
                    });
                }
            } else if (type === 'trip-package') {
                const trip = getActiveTripPackages().find(t => t.id === id);
                if (trip) {
                    addStoredTripPurchase({
                        userId: user.id,
                        tripId: trip.id,
                        title: trip.title,
                        place: trip.place,
                        price: trip.price,
                        status: 'purchased',
                        paymentId: record.id,
                        coordinationNote: {
                            ar: 'ستتواصل الإدارة معك لتنسيق تنفيذ الرحلة خارج المنصة.',
                            en: 'Administration will contact you to coordinate trip execution outside the platform.',
                        },
                    });
                }
            }
            
            setIsProcessing(false);
            setIsPurchased(true);
        }, 450);
    };

    const resetPaymentReview = () => {
        setIntent(null);
        setPaymentError(null);
    };

    if (intent) {
        return (
            <div className="bg-slate-50 min-h-screen py-12">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <div className="mb-6 flex items-start gap-3">
                            {paymentError ? <AlertTriangle className="mt-1 h-6 w-6 text-red-600" /> : <CheckCircle2 className="mt-1 h-6 w-6 text-emerald-700" />}
                            <div>
                                <h1 className="text-2xl font-bold">{localize({ ar: 'مراجعة الدفع', en: 'Payment review' })}</h1>
                                <p className="mt-2 text-slate-600">
                                    {localize({ ar: 'راجع تفاصيل العملية قبل التأكيد. لن يتم إصدار فاتورة إلا بعد نجاح الدفع.', en: 'Review the transaction before confirmation. An invoice is issued only after successful payment.' })}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-3 rounded-xl bg-slate-50 p-5 text-sm">
                            <div className="flex justify-between gap-4"><span>{localize({ ar: 'العنصر', en: 'Item' })}</span><strong>{intent.itemName}</strong></div>
                            <div className="flex justify-between gap-4"><span>{localize({ ar: 'النوع', en: 'Type' })}</span><strong>{intent.kind}</strong></div>
                            <div className="flex justify-between gap-4"><span>{localize({ ar: 'المبلغ', en: 'Amount' })}</span><strong>{formatPrice(intent.amount)}</strong></div>
                            <div className="flex justify-between gap-4"><span>{localize({ ar: 'الحالة', en: 'Status' })}</span><strong>{paymentError ? 'failed' : intent.status}</strong></div>
                        </div>
                        {paymentError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{paymentError}</p>}
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button className="flex-1" onClick={confirmPayment} disabled={isProcessing}>
                                {isProcessing ? localize({ ar: 'جاري المعالجة...', en: 'Processing...' }) : paymentError ? localize({ ar: 'إعادة المحاولة', en: 'Retry payment' }) : localize({ ar: 'تأكيد الدفع', en: 'Confirm payment' })}
                            </Button>
                            <Button className="flex-1" variant="secondary" onClick={resetPaymentReview} disabled={isProcessing}>
                                {localize({ ar: 'تعديل الطلب', en: 'Edit order' })}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isPurchased) {
        return (
            <div className="bg-slate-50 min-h-screen py-12">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                        <h1 className="text-3xl font-bold mb-4">{t('checkout.success')}</h1>
                        <p className="text-slate-600 mb-8">{t('checkout.success_desc')}</p>
                        <Button onClick={() => navigate('/dashboard/payments')}>{localize({ ar: 'عرض الفاتورة في الحساب', en: 'View invoice in account' })}</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (alreadyOwnsCourse || alreadyOwnsBookFormat || alreadySubscribed) {
        return (
            <div className="bg-slate-50 min-h-screen py-12">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                        <h1 className="text-3xl font-bold mb-4">{localize({ ar: 'الشراء غير متاح', en: 'Purchase unavailable' })}</h1>
                        <p className="text-slate-600 mb-8">{localize({ ar: 'أنت تمتلك هذا العنصر أو لديك اشتراك فعّال بالفعل.', en: 'You already own this item or already have an active subscription.' })}</p>
                        <Button onClick={() => navigate(type === 'course' ? `/courses/${item.id}` : type === 'book' ? `/books/${item.id}` : '/subscriptions')}>{localize({ ar: 'العودة للتفاصيل', en: 'Back to details' })}</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h1 className="text-2xl font-bold mb-6">{t('checkout.title')}</h1>
                    
                    <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                        <h2 className="font-bold mb-2">{t('checkout.order_summary')}</h2>
                        <p>{localize(item.title)} {type === 'book' && format ? `- ${format.toUpperCase()}` : ''}</p>
                        <p className="font-bold text-emerald-700">
                            {paymentPlan === 'full' 
                                ? formatPrice(price) 
                                : `${formatPrice(price / 6)} / ${t('checkout.for_6_months')}`}
                        </p>
                        {discount > 0 && <p className="text-sm text-emerald-600">Discount: -{formatPrice(discount)}</p>}
                        {paymentPlan === 'installments' && (
                            <p className="text-sm text-slate-500 mt-1">
                                {t('checkout.total_price')}: {formatPrice(price)}
                            </p>
                        )}
                    </div>

                    {type === 'course' && (
                        <div className="mb-8">
                            <label className="block font-medium mb-3">{t('checkout.installment_plan')}</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        paymentPlan === 'full' 
                                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 ring-opacity-10' 
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                    onClick={() => setPaymentPlan('full')}
                                >
                                    <div className="font-bold text-slate-900">{t('checkout.pay_full')}</div>
                                    <div className="text-sm text-slate-500">{formatPrice(price)}</div>
                                </button>
                                <button
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        paymentPlan === 'installments' 
                                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 ring-opacity-10' 
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                    onClick={() => setPaymentPlan('installments')}
                                >
                                    <div className="font-bold text-slate-900">{t('checkout.installments')}</div>
                                    <div className="text-sm text-slate-500">{formatPrice(price / 6)} / {t('checkout.monthly_payment')}</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Shipping Address Section */}
                    {isPhysical && (
                        <div className="mb-8">
                            <label className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
                                <MapPin size={18} className="text-emerald-600" />
                                {t('checkout.shipping_address')}
                            </label>
                            <div className="relative group">
                                <select 
                                    className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm group-hover:border-slate-300"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                >
                                    <option value="">{t('checkout.select_address_placeholder')}</option>
                                    {user?.addresses?.map(addr => (
                                        <option key={addr.id} value={addr.id}>{addr.name} - {addr.area}, {addr.governorate}</option>
                                    ))}
                                    <option value="123 Main St">123 Main St, London</option>
                                    <option value="456 Oak Ave">456 Oak Ave, Manchester</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                                    <ChevronRight size={18} className="rotate-90" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">{localize({ en: 'Delivery takes 3-5 business days.', ar: 'يستغرق التوصيل من 3 إلى 5 أيام عمل.' })}</p>
                        </div>
                    )}

                    {/* Coupon Code Section */}
                    <div className="mb-8 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                        <label className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
                            <Ticket size={18} className="text-emerald-600" />
                            {t('checkout.coupon_code')}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow group">
                                <input 
                                    type="text" 
                                    className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm group-hover:border-slate-300 uppercase font-medium tracking-wider"
                                    placeholder={t('checkout.coupon_placeholder')}
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                            </div>
                            <Button 
                                onClick={applyCoupon} 
                                variant="secondary" 
                                className="px-6 rounded-xl hover:shadow-md transition-shadow active:scale-95"
                            >
                                {t('checkout.apply_coupon')}
                            </Button>
                        </div>
                        {couponMessage && (
                            <div className={`mt-3 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${couponMessage.isError ? 'text-red-700' : 'text-emerald-700'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${couponMessage.isError ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                {couponMessage.text}
                            </div>
                        )}
                    </div>

                    {purchaseError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-700 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {purchaseError}
                        </div>
                    )}

                    <Button 
                        className="w-full"
                        onClick={handlePurchase}
                        disabled={isPhysical && !address}
                    >
                        {t('checkout.pay')}
                    </Button>
                </div>
            </div>
        </div>
    );
};


export { Checkout as CheckoutPage };
