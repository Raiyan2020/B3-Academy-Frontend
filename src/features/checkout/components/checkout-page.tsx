import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from '@/lib/routing/next-router-compat';
import { AlertTriangle, CheckCircle2, MapPin, Ticket, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { useAuth } from '@/features/auth/auth-provider';
import { getCourseById, getCourseInstallmentConfig, supportsPaymentMode } from '@/features/courses/services/courses.service';
import { getBookById, isFormatAvailable } from '@/features/books/services/books.service';
import { createPaymentIntent, failPaymentIntent, completePaymentIntent } from '@/features/payments/services/payments-storage.service';
import { getActiveSubscriptionPlans, getPlanPrice } from '@/features/subscriptions/services/subscriptions.service';
import { addSubscriptionHistory } from '@/features/subscriptions/services/subscription-history.service';
import type { CurrencyCode } from '@/features/business/business.types';
import type { PaymentIntent, PaymentKind } from '@/features/payments/types/payment.types';
import { useSearchParams } from 'next/navigation';
import { getClinicById, CARE_DOCTORS, getActiveConsultationPackages, getActiveTripPackages } from '@/features/care/services/care-data.service';
import { getConsultationTypeConfig } from '@/features/care/services/care-schedule-config.service';
import { readPendingIntent } from '@/features/access/services/pending-intent.service';
import { addStoredClinicBooking, addStoredConsultation, addStoredTripPurchase, hasStoredTripPurchase, purchasePackageWithSessions, updateStoredConsultation } from '@/features/care/services/care-records-storage.service';
import { getSlotById, isSlotAvailable, reserveSlot } from '@/features/care/services/slot-repository.service';
import { decrementTripSeats, getTripAvailableSeats, isTripSoldOut } from '@/features/care/services/trip-capacity.service';
import type { ConsultationKind } from '@/features/business/status.types';
import { addCourseEnrollment, getCourseEnrollment, payNextInstallment } from '@/features/learning/services/enrollment.service';
import { addBookPurchase } from '@/features/books/services/book-purchase.service';
import { ownsCourse, canPurchaseBookFormat } from '@/features/account/services/ownership.service';
import type { BookPurchaseFormat } from '@/features/books/types/book-purchase.types';
import { checkCarePrerequisite } from '@/features/care/components/care-prerequisite-gate';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';
import type { Address } from '../../../../types';

export const Checkout: React.FC = () => {
    const { type, id, format } = useParams<{ type: string; id: string; format?: string }>();
    const searchParams = useSearchParams();
    const pendingIntent = readPendingIntent();
    const slotId = searchParams?.get('slotId') || pendingIntent?.slotId || '';
    const slotDate = searchParams?.get('slotDate') || pendingIntent?.slotDate || '';
    const slotTime = searchParams?.get('slotTime') || pendingIntent?.slotTime || '';
    const tripId = searchParams?.get('tripId') || pendingIntent?.tripId || '';
    const clinicId = searchParams?.get('clinicId') || pendingIntent?.clinicId || '';
    const isInitial = searchParams?.get('isInitial') || '';
    const navigate = useNavigate();
    const { t, localize, language } = useLanguage();
    const { formatPrice, currency } = useCurrency();
    const { user, purchaseItem, subscribe, requireAuthAction, updateAddresses } = useAuth();

    const clientName = searchParams?.get('clientName') || user?.name || '';
    const clientEmail = searchParams?.get('clientEmail') || user?.email || '';
    const clientPhone = searchParams?.get('clientPhone') || user?.phone || '';
    const bookingNotes = searchParams?.get('notes') || '';
    const installmentParam = searchParams?.get('installment') || (pendingIntent?.installmentNumber ? String(pendingIntent.installmentNumber) : '');
    const requestedInstallment = installmentParam ? Number(installmentParam) : undefined;
    const selectedSlot = slotId ? getSlotById(slotId) : null;
    const requiresSlot = type === 'clinic-appointment' || type === 'consultation-session';

    const [addressId, setAddressId] = useState('');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
        name: '',
        governorate: '',
        area: '',
        block: '',
        street: '',
        building: '',
        isDefault: false,
    });
    const [paymentPlan, setPaymentPlan] = useState<'full' | 'installments'>(() => {
        if (type === 'course' && requestedInstallment && requestedInstallment > 1) return 'installments';
        return pendingIntent?.paymentMode || 'full';
    });
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isPurchased, setIsPurchased] = useState(false);
    const [successHref, setSuccessHref] = useState('/dashboard/payments');
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
        const typeConfig = getConsultationTypeConfig(id, formatParam as 'video' | 'text');
        const price = typeConfig?.priceUsd ?? (formatParam === 'video' ? 150 : 100);
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

    const bookFormatUnavailable =
      type === 'book' && format && !isFormatAvailable(item.id, format as BookPurchaseFormat);
    if (bookFormatUnavailable) {
      return (
        <div className="p-20 text-center">
          {localize({ ar: 'صيغة الكتاب غير متاحة.', en: 'This book format is unavailable.' })}
        </div>
      );
    }

    const clinicPrerequisiteBlocked =
      type === 'clinic-appointment' && user && !checkCarePrerequisite(user.id, 'clinic', id);
    const tripPrerequisiteBlocked =
      type === 'trip-package' && user && !checkCarePrerequisite(user.id, 'trip');

    if (clinicPrerequisiteBlocked) {
      return (
        <div className="p-20 text-center max-w-xl mx-auto">
          <p className="text-lg font-semibold text-amber-900 mb-4">
            {localize({
              ar: 'يجب إكمال الاستشارة الأولية للعيادة قبل حجز موعد.',
              en: 'You must complete the clinic initial consultation before booking an appointment.',
            })}
          </p>
          <Button onClick={() => navigate(`/clinic/${id}`)}>
            {localize({ ar: 'العودة لتفاصيل العيادة', en: 'Back to clinic details' })}
          </Button>
        </div>
      );
    }

    if (tripPrerequisiteBlocked) {
      return (
        <div className="p-20 text-center max-w-xl mx-auto">
          <p className="text-lg font-semibold text-amber-900 mb-4">
            {localize({
              ar: 'يجب إكمال الاستشارة الأولية العامة قبل شراء باقة الرحلة.',
              en: 'You must complete the general initial consultation before purchasing a trip package.',
            })}
          </p>
          <Button onClick={() => navigate(`/trips/${id}`)}>
            {localize({ ar: 'العودة لتفاصيل الرحلة', en: 'Back to trip details' })}
          </Button>
        </div>
      );
    }

    const courseSupportsInstallments = type === 'course' && supportsPaymentMode(id, 'installments');
    const courseInstallmentConfig = type === 'course' ? getCourseInstallmentConfig(id) : null;
    const existingCourseEnrollment = type === 'course' && user ? getCourseEnrollment(user.id, id) : null;
    const isNextInstallmentCheckout = Boolean(
        type === 'course' &&
        existingCourseEnrollment &&
        requestedInstallment &&
        requestedInstallment > 1 &&
        requestedInstallment === existingCourseEnrollment.paidInstallments + 1,
    );
    const installmentCount = courseInstallmentConfig?.count ?? 6;

    const basePrice = (type === 'course' || type === 'subscription' || type === 'clinic-appointment' || type === 'consultation-session' || type === 'consultation-package' || type === 'trip-package') 
        ? item.price 
        : item.prices[format!];

    const fullPrice = Math.max(0, basePrice - discount);
    const price = isNextInstallmentCheckout
        ? Math.max(0, fullPrice / installmentCount - (type === 'course' ? 0 : 0))
        : fullPrice;
    const isPhysical = type === 'book' && (format === 'physical' || format === 'bundle');
    const alreadyOwnsCourse = type === 'course' && Boolean(user && ownsCourse(user.id, item.id) && !isNextInstallmentCheckout);
    const alreadyOwnsBookFormat = type === 'book' && Boolean(
      user && format && !canPurchaseBookFormat(user.id, item.id, format as BookPurchaseFormat),
    );
    const alreadySubscribed = type === 'subscription' && isSubscriptionActive(user);
    const alreadyPurchasedTrip = type === 'trip-package' && Boolean(user && hasStoredTripPurchase(user.id, id));
    const tripSeats = type === 'trip-package' ? getTripAvailableSeats(id) : null;

    const selectedAddress = user?.addresses?.find((addr) => addr.id === addressId);
    const addressLabel = selectedAddress
        ? `${selectedAddress.name} - ${selectedAddress.governorate}, ${selectedAddress.area}, ${selectedAddress.street} ${selectedAddress.building}`
        : '';

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

    const handleSaveAddress = () => {
        if (!user || !addressForm.name.trim() || !addressForm.governorate.trim() || !addressForm.area.trim()) return;
        const newAddress: Address = {
            ...addressForm,
            id: `addr-${Date.now()}`,
        };
        const nextAddresses = [...(user.addresses || []), newAddress];
        updateAddresses(nextAddresses);
        setAddressId(newAddress.id);
        setShowAddressForm(false);
        setAddressForm({ name: '', governorate: '', area: '', block: '', street: '', building: '', isDefault: false });
    };

    const handlePurchase = () => {
        setPurchaseError(null);
        if (!requireAuthAction()) return;
        if (isPhysical && !addressId) {
            setPurchaseError(localize({ ar: 'يرجى اختيار عنوان الشحن.', en: 'Please select a shipping address.' }));
            return;
        }
        if (alreadyOwnsCourse || alreadyOwnsBookFormat || alreadySubscribed || alreadyPurchasedTrip) {
            setPurchaseError(localize({ ar: 'لا يمكن شراء هذا العنصر أو الصيغة مرة أخرى.', en: 'This item or format cannot be purchased again.' }));
            return;
        }
        if (type === 'trip-package' && isTripSoldOut(id)) {
            setPurchaseError(localize({ ar: 'لا توجد مقاعد متاحة لهذه الباقة.', en: 'No seats are available for this package.' }));
            return;
        }
        if (!user) return;

        const installmentNumber = isNextInstallmentCheckout
            ? requestedInstallment
            : paymentPlan === 'installments'
              ? 1
              : undefined;

        const nextIntent = createPaymentIntent({
            userId: user.id,
            kind: paymentKind,
            itemId: item.id || 'subscription',
            itemName: localize(item.title),
            amount: price,
            currency: currency as CurrencyCode,
            paymentMode: type === 'course' ? paymentPlan : undefined,
            installmentNumber,
        });
        setIntent(nextIntent);
        setPaymentError(null);
    };

    const confirmPayment = () => {
        if (!intent) return;
        setIsProcessing(true);
        const failedByCoupon = couponCode.trim().toUpperCase() === 'FAIL';
        window.setTimeout(() => {
            if (requiresSlot && slotId && !isSlotAvailable(slotId)) {
                setPaymentError(localize({
                    ar: 'الموعد المحدد لم يعد متاحاً. يرجى اختيار موعد آخر.',
                    en: 'The selected slot is no longer available. Please choose another appointment.',
                }));
                setIsProcessing(false);
                return;
            }
            if (type === 'trip-package' && isTripSoldOut(id)) {
                setPaymentError(localize({
                    ar: 'نفدت المقاعد أثناء المراجعة. يرجى العودة لصفحة الرحلة.',
                    en: 'Seats sold out during review. Please return to the trip page.',
                }));
                setIsProcessing(false);
                return;
            }
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
                if (isNextInstallmentCheckout) {
                    const result = payNextInstallment(user.id, item.id, record.id);
                    if (!result.ok) {
                        setPaymentError(localize({
                            ar: 'تعذر تحديث القسط. ربما تم دفع هذا القسط مسبقاً.',
                            en: 'Could not update installment. This payment may already have been processed.',
                        }));
                        setIsProcessing(false);
                        return;
                    }
                } else {
                    addCourseEnrollment({
                        userId: user.id,
                        courseId: item.id,
                        paymentMode: paymentPlan,
                        paymentId: record.id,
                    });
                    purchaseItem('course', item.id, { silent: true });
                }
            } else if (type === 'book') {
                addBookPurchase({
                    userId: user.id,
                    bookId: item.id,
                    format: format as BookPurchaseFormat,
                    price: price,
                    currency: currency as CurrencyCode,
                    shippingAddressId: addressId || undefined,
                    shippingAddressLabel: addressLabel || undefined,
                    paymentId: record.id,
                });
                purchaseItem('book', item.id, { silent: true });
            } else if (type === 'clinic-appointment') {
                const clinic = getClinicById(id);
                const slot = selectedSlot ?? (slotId ? getSlotById(slotId) : null);
                if (clinic && slot) {
                    reserveSlot(slot.id);
                    addStoredClinicBooking({
                        userId: user.id,
                        clinicId: clinic.id,
                        doctorId: clinic.doctor.id,
                        serviceName: { ar: `موعد عيادة - ${localize(clinic.name)}`, en: `Clinic Appointment - ${localize(clinic.name)}` },
                        doctorName: clinic.doctor.name,
                        location: clinic.address,
                        date: slot.date,
                        time: slot.time,
                        slotId: slot.id,
                        timezone: slot.timezone,
                        duration: slot.duration,
                        price: clinic.price,
                        status: 'scheduled',
                        bookingStatus: 'confirmed',
                        paymentId: record.id,
                        clientName: searchParams?.get('clientName') || user.name,
                        clientEmail: searchParams?.get('clientEmail') || user.email,
                        clientPhone: searchParams?.get('clientPhone') || user.phone,
                        notes: searchParams?.get('notes') || undefined,
                    });
                }
            } else if (type === 'consultation-session') {
                const doctorId = id;
                const formatParam = searchParams?.get('format') || 'video';
                const doctor = CARE_DOCTORS.find(d => d.id === doctorId);
                const typeConfig = getConsultationTypeConfig(doctorId, formatParam as 'video' | 'text');
                const price = typeConfig?.priceUsd ?? (formatParam === 'video' ? 150 : 100);
                
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

                const slot = selectedSlot ?? (slotId ? getSlotById(slotId) : null);
                const serviceKind: ConsultationKind = isInitialVal
                    ? (clinicIdVal ? 'clinic_initial' : 'trip_initial')
                    : (formatParam === 'video' ? 'individual_video' : 'individual_text');

                if (doctor && slot) {
                    reserveSlot(slot.id);
                    const created = addStoredConsultation({
                        userId: user.id,
                        doctorId: doctor.id,
                        doctorName: doctor.name,
                        serviceName,
                        kind: formatParam === 'video' ? 'individual-video' : 'individual-text',
                        serviceKind,
                        date: slot.date,
                        time: slot.time,
                        slotId: slot.id,
                        timezone: slot.timezone,
                        duration: slot.duration,
                        price,
                        status: 'scheduled',
                        bookingStatus: 'confirmed',
                        paymentId: record.id,
                        clinicId: clinicIdVal,
                        tripId: tripIdVal,
                    });
                    if (formatParam === 'text') {
                        updateStoredConsultation(created.id, { portalHref: `/consultation/${created.id}/chat` });
                    }
                }
            } else if (type === 'consultation-package') {
                const pkg = getActiveConsultationPackages().find(p => p.id === id);
                const doctor = pkg ? CARE_DOCTORS.find(d => d.id === pkg.doctorId) : null;
                if (pkg && doctor) {
                    const sessions = Array.from({ length: pkg.sessionCount }).map((_, index) => {
                        const sessionSlotId = searchParams?.get(`slot${index}`) || '';
                        const sessionFormat = (searchParams?.get(`format${index}`) || 'text') as 'video' | 'text';
                        const sessionDate = searchParams?.get(`date${index}`) || '';
                        const sessionTime = searchParams?.get(`time${index}`) || '';
                        const typeConfig = getConsultationTypeConfig(doctor.id, sessionFormat);
                        return {
                            slotId: sessionSlotId,
                            date: sessionDate,
                            time: sessionTime,
                            timezone: 'Asia/Riyadh',
                            duration: typeConfig?.durationMinutes ?? pkg.sessionDurationMinutes,
                            format: sessionFormat,
                        };
                    }).filter((session) => session.slotId);

                    if (sessions.length !== pkg.sessionCount) {
                        setPaymentError(localize({
                            ar: 'يجب حجز جميع جلسات الباقة قبل الدفع.',
                            en: 'All package sessions must be booked before payment.',
                        }));
                        setIsProcessing(false);
                        return;
                    }

                    sessions.forEach((session) => reserveSlot(session.slotId));
                    purchasePackageWithSessions({
                        userId: user.id,
                        packageId: pkg.id,
                        doctorId: doctor.id,
                        doctorName: doctor.name,
                        serviceName: pkg.name,
                        sessionCount: pkg.sessionCount,
                        price: pkg.price,
                        paymentId: record.id,
                        sessions,
                    });
                }
            } else if (type === 'trip-package') {
                const trip = getActiveTripPackages().find(t => t.id === id);
                if (trip && decrementTripSeats(trip.id)) {
                    addStoredTripPurchase({
                        userId: user.id,
                        tripId: trip.id,
                        title: trip.title,
                        place: trip.place,
                        price: trip.price,
                        currency: intent.currency,
                        image: trip.image,
                        durationDays: trip.durationDays,
                        category: trip.category,
                        features: trip.features,
                        status: 'purchased',
                        paymentId: record.id,
                        adminNotifyPending: true,
                        coordinationNote: {
                            ar: 'ستتواصل الإدارة معك لتنسيق تنفيذ الرحلة خارج المنصة.',
                            en: 'Administration will contact you to coordinate trip execution outside the platform.',
                        },
                    });
                } else if (trip) {
                    setPaymentError(localize({
                        ar: 'نفدت المقاعد أثناء الدفع. لم يتم إنشاء عملية الشراء.',
                        en: 'Seats sold out during payment. Purchase was not created.',
                    }));
                    setIsProcessing(false);
                    return;
                }
            }
            
            setIsProcessing(false);
            const returnTripId = searchParams?.get('returnTripId') || searchParams?.get('tripId');
            if (type === 'course') setSuccessHref(`/learn/${id}`);
            else if (type === 'book' && format === 'ebook') setSuccessHref(`/read/${id}`);
            else if (type === 'consultation-session' && isInitial === 'true' && returnTripId) setSuccessHref(`/trips/${returnTripId}`);
            else setSuccessHref('/dashboard/payments');
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
                            {intent.installmentNumber && (
                                <div className="flex justify-between gap-4">
                                    <span>{localize({ ar: 'القسط', en: 'Installment' })}</span>
                                    <strong>{intent.installmentNumber}</strong>
                                </div>
                            )}
                            {(selectedSlot || (slotDate && slotTime)) && (
                                <div className="flex justify-between gap-4">
                                    <span>{localize({ ar: 'الموعد', en: 'Appointment' })}</span>
                                    <strong>
                                        {(selectedSlot?.date || slotDate)} {localize({ ar: 'في', en: 'at' })} {(selectedSlot?.time || slotTime)}
                                    </strong>
                                </div>
                            )}
                            {type === 'trip-package' && tripSeats !== null && (
                                <div className="flex justify-between gap-4">
                                    <span>{localize({ ar: 'المقاعد المتاحة', en: 'Available seats' })}</span>
                                    <strong>{tripSeats}</strong>
                                </div>
                            )}
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
                        <p className="text-slate-600 mb-4">{t('checkout.success_desc')}</p>
                        {type === 'subscription' && user?.email && (
                            <p className="mb-8 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                                {localize({
                                    ar: `تم إرسال تأكيد الاشتراك إلى ${user.email}. يمكنك أيضاً مراجعة الفاتورة من حسابك.`,
                                    en: `A subscription confirmation was sent to ${user.email}. You can also review the invoice in your account.`,
                                })}
                            </p>
                        )}
                        {type !== 'subscription' && <div className="mb-8" />}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                          {type === 'course' && (
                            <Button onClick={() => navigate(successHref)}>
                              {localize({ ar: 'بدء محتوى الدورة', en: 'Start course content' })}
                            </Button>
                          )}
                          {type === 'subscription' && (
                            <Button onClick={() => navigate('/dashboard/subscription')}>
                              {localize({ ar: 'عرض اشتراكي', en: 'View my subscription' })}
                            </Button>
                          )}
                          <Button variant={type === 'course' || type === 'subscription' ? 'secondary' : undefined} onClick={() => navigate('/dashboard/payments')}>
                            {localize({ ar: 'عرض الفاتورة في الحساب', en: 'View invoice in account' })}
                          </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (alreadyOwnsCourse || alreadyOwnsBookFormat || alreadySubscribed || alreadyPurchasedTrip || (type === 'trip-package' && isTripSoldOut(id))) {
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
                        {(type === 'clinic-appointment' || type === 'consultation-session') && (
                          <div className="mt-3 space-y-1 text-sm text-slate-600">
                            {(selectedSlot || (slotDate && slotTime)) && (
                              <p>{localize({ ar: 'الموعد:', en: 'Appointment:' })} {(selectedSlot?.date || slotDate)} {(selectedSlot?.time || slotTime)}</p>
                            )}
                            {clientName && <p>{localize({ ar: 'الاسم:', en: 'Name:' })} {clientName}</p>}
                            {clientEmail && <p>{localize({ ar: 'البريد:', en: 'Email:' })} {clientEmail}</p>}
                            {clientPhone && <p>{localize({ ar: 'الهاتف:', en: 'Phone:' })} {clientPhone}</p>}
                            {bookingNotes && <p>{localize({ ar: 'ملاحظات:', en: 'Notes:' })} {bookingNotes}</p>}
                          </div>
                        )}
                        <p className="font-bold text-emerald-700">
                            {isNextInstallmentCheckout
                                ? `${formatPrice(price)} (${localize({ ar: `القسط ${requestedInstallment} من ${installmentCount}`, en: `Installment ${requestedInstallment} of ${installmentCount}` })})`
                                : paymentPlan === 'full'
                                  ? formatPrice(price)
                                  : `${formatPrice(price / installmentCount)} / ${t('checkout.monthly_payment')}`}
                        </p>
                        {discount > 0 && <p className="text-sm text-emerald-600">Discount: -{formatPrice(discount)}</p>}
                        {paymentPlan === 'installments' && !isNextInstallmentCheckout && (
                            <p className="text-sm text-slate-500 mt-1">
                                {t('checkout.total_price')}: {formatPrice(fullPrice)} ({installmentCount} {t('checkout.for_6_months').replace('6', String(installmentCount))})
                            </p>
                        )}
                    </div>

                    {type === 'course' && courseSupportsInstallments && (
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
                            <div className="relative group mb-3">
                                <select 
                                    className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm group-hover:border-slate-300"
                                    value={addressId}
                                    onChange={(e) => setAddressId(e.target.value)}
                                >
                                    <option value="">{t('checkout.select_address_placeholder')}</option>
                                    {user?.addresses?.map(addr => (
                                        <option key={addr.id} value={addr.id}>
                                            {addr.name} - {addr.area}, {addr.governorate}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                                    <ChevronRight size={18} className="rotate-90" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddressForm((current) => !current)}
                                className="text-sm font-semibold text-emerald-700 hover:underline"
                            >
                                {showAddressForm
                                    ? localize({ ar: 'إلغاء', en: 'Cancel' })
                                    : localize({ ar: '+ إضافة عنوان جديد', en: '+ Add new address' })}
                            </button>
                            {showAddressForm && (
                                <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={localize({ ar: 'اسم المستلم', en: 'Recipient name' })} value={addressForm.name} onChange={(e) => setAddressForm((c) => ({ ...c, name: e.target.value }))} />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={localize({ ar: 'المحافظة', en: 'Governorate' })} value={addressForm.governorate} onChange={(e) => setAddressForm((c) => ({ ...c, governorate: e.target.value }))} />
                                        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={localize({ ar: 'المنطقة', en: 'Area' })} value={addressForm.area} onChange={(e) => setAddressForm((c) => ({ ...c, area: e.target.value }))} />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={localize({ ar: 'القطعة', en: 'Block' })} value={addressForm.block} onChange={(e) => setAddressForm((c) => ({ ...c, block: e.target.value }))} />
                                        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={localize({ ar: 'الشارع', en: 'Street' })} value={addressForm.street} onChange={(e) => setAddressForm((c) => ({ ...c, street: e.target.value }))} />
                                        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={localize({ ar: 'المبنى', en: 'Building' })} value={addressForm.building} onChange={(e) => setAddressForm((c) => ({ ...c, building: e.target.value }))} />
                                    </div>
                                    <Button variant="secondary" onClick={handleSaveAddress}>
                                        {localize({ ar: 'حفظ العنوان', en: 'Save address' })}
                                    </Button>
                                </div>
                            )}
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
                        disabled={isPhysical && !addressId}
                    >
                        {t('checkout.pay')}
                    </Button>
                </div>
            </div>
        </div>
    );
};


export { Checkout as CheckoutPage };
