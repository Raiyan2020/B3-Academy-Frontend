import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { Button } from '../../../../components/UI';
import { useAuth } from '@/features/auth/auth-provider';
import { Address } from '../../../../types';
import { PhoneInput } from '@/components/ui/phone-input';
import { PasswordInput } from '@/components/ui/password-input';
import { VerificationCodeInput } from '@/components/ui/verification-code-input';
import { useBackendAddressActions, useBackendAddresses } from '../hooks/use-account-api';
import { getStoredApiToken } from '@/features/auth/services/auth-api.service';
import { showMutationError } from '@/lib/feedback/toast';

export const Settings: React.FC = () => {
    const { user, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const backendAddresses = useBackendAddresses();
    const backendAddressActions = useBackendAddressActions();

    if (!user) {
        navigate('/auth');
        return null;
    }

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phone || '');
    const [addresses, setAddresses] = useState<Address[]>(user.addresses || []);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [showAddressPopup, setShowAddressPopup] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
        name: '',
        governorate: '',
        area: '',
        block: '',
        street: '',
        building: '',
        isDefault: false
    });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpCountdown, setOtpCountdown] = useState(30);
    const [canResendOtp, setCanResendOtp] = useState(false);

    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (showOtpPopup && otpCountdown > 0) {
            timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
        } else if (otpCountdown === 0) {
            setCanResendOtp(true);
        }
        return () => clearTimeout(timer);
    }, [showOtpPopup, otpCountdown]);

    useEffect(() => {
        if (backendAddresses.data) setAddresses(backendAddresses.data);
    }, [backendAddresses.data]);

    const handleSave = () => {
        setProfileMessage(null);
        if (!name.trim()) {
            setProfileMessage({ type: 'error', text: 'Name is required.' });
            return;
        }
        if (email !== user.email) {
            setShowOtpPopup(true);
            setOtpCountdown(30);
            setCanResendOtp(false);
        } else {
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        }
    };

    const handleVerifyOtp = () => {
        setOtpError(null);
        if (otp === '123456') {
            setShowOtpPopup(false);
            setOtp('');
            setProfileMessage({ type: 'success', text: 'Email verified and profile updated successfully!' });
        } else {
            setOtpError('Invalid OTP code. Please use test code 123456.');
        }
    };

    const handleResendOtp = () => {
        setOtpCountdown(30);
        setCanResendOtp(false);
        setOtpError(null);
        setProfileMessage({ type: 'success', text: 'Verification code resent!' });
    };

    const handleAddAddress = async () => {
        try {
            if (getStoredApiToken()) {
                if (editingAddress) {
                    await backendAddressActions.update.mutateAsync({ id: editingAddress.id, input: newAddress });
                } else {
                    await backendAddressActions.create.mutateAsync(newAddress);
                }
            } else if (editingAddress) {
                setAddresses(addresses.map(a => a.id === editingAddress.id ? { ...newAddress, id: editingAddress.id } : a));
            } else {
                setAddresses([...addresses, { ...newAddress, id: Date.now().toString() }]);
            }
        } catch (error) {
            showMutationError(error);
            return;
        }
        setShowAddressPopup(false);
        setEditingAddress(null);
        setNewAddress({ name: '', governorate: '', area: '', block: '', street: '', building: '', isDefault: false });
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            if (getStoredApiToken()) await backendAddressActions.delete.mutateAsync(id);
            else setAddresses(addresses.filter(a => a.id !== id));
        } catch (error) {
            showMutationError(error);
        }
    };

    const handleSetDefaultAddress = async (id: string) => {
        try {
            if (getStoredApiToken()) await backendAddressActions.setDefault.mutateAsync(id);
            else setAddresses(addresses.map((address) => ({ ...address, isDefault: address.id === id })));
        } catch (error) {
            showMutationError(error);
        }
    };

    const handleEditAddress = (addr: Address) => {
        setEditingAddress(addr);
        setNewAddress(addr);
        setShowAddressPopup(true);
    };

    const validatePassword = (pass: string) => {
        if (pass.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(pass) && !/[!@#$%^&*]/.test(pass)) return 'Password must contain at least one number or special character.';
        return null;
    };

    const handleResetPassword = () => {
        setPasswordError(null);
        if (!currentPassword) {
            setPasswordError('Current password is required.');
            return;
        }
        const strengthError = validatePassword(newPassword);
        if (strengthError) {
            setPasswordError(strengthError);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match!');
            return;
        }
        setProfileMessage({ type: 'success', text: 'Password reset successfully!' });
        setShowPasswordPopup(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-4">
                {profileMessage && (
                    <div className={`p-4 mb-6 rounded-xl border text-sm font-bold animate-in fade-in duration-200 ${
                        profileMessage.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                        : 'bg-red-50 border-red-250 text-red-800'
                    }`}>
                        {profileMessage.text}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
                    <h1 className="text-2xl font-bold mb-6">Settings</h1>
                    
                    <section className="mb-8">
                        <h2 className="text-lg font-bold mb-4">Account Info</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Full Name</label>
                                <input type="text" className="w-full p-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Email Address</label>
                                <input type="email" className="w-full p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Phone Number</label>
                                <PhoneInput
                                    international
                                    defaultCountry="SA"
                                    value={phone}
                                    onChange={(value) => setPhone(value || '')}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </section>
 
                    <section className="mb-8">
                        <h2 className="text-lg font-bold mb-4">Security</h2>
                        <div className="space-y-4">
                            <Button variant="secondary" onClick={() => setShowPasswordPopup(true)}>Change Password</Button>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-lg font-bold mb-4">Addresses</h2>
                        <div className="space-y-4">
                            {addresses.map(addr => (
                                <div key={addr.id} className="p-4 border rounded flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{addr.name}</p>
                                        <p className="text-sm text-slate-600">{addr.governorate}, {addr.area}, Block {addr.block}, Street {addr.street}, Building {addr.building}</p>
                                        {addr.isDefault && <p className="text-xs text-emerald-600 font-medium">Default Address</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleEditAddress(addr)}>Edit</Button>
                                        {!addr.isDefault && <Button variant="outline" size="sm" onClick={() => void handleSetDefaultAddress(addr.id)}>Set default</Button>}
                                        <Button variant="outline" size="sm" onClick={() => void handleDeleteAddress(addr.id)}>Delete</Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="secondary" onClick={() => setShowAddressPopup(true)}>Add Address</Button>
                        </div>
                    </section>

                    <section className="mt-12 pt-8 border-t border-red-100">
                        <h2 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Permanently delete your account and all associated data including courses, certificates, and bookings.
                        </p>
                        <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => setShowDeletePopup(true)}>
                            Delete Account
                        </Button>
                    </section>
                </div>
                <div className="sticky bottom-0 bg-white p-4 border-t shadow-lg">
                    <Button className="w-full" onClick={handleSave}>Save Changes</Button>
                </div>
            </div>

            {showPasswordPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Change Password</h2>
                        {passwordError && (
                            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-150 text-red-800 text-xs font-bold">
                                {passwordError}
                            </div>
                        )}
                        <div className="space-y-4">
                            <PasswordInput placeholder="Current Password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }} />
                            <PasswordInput placeholder="New Password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }} />
                            <PasswordInput placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }} />
                            <div className="flex gap-2">
                                <Button className="flex-grow" onClick={handleResetPassword}>Reset Password</Button>
                                <Button variant="secondary" onClick={() => { setShowPasswordPopup(false); setPasswordError(null); }}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAddressPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">{editingAddress ? 'Edit Address' : 'Add Address'}</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Address Name" className="w-full p-2 border rounded" value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} />
                            <input type="text" placeholder="Governorate" className="w-full p-2 border rounded" value={newAddress.governorate} onChange={(e) => setNewAddress({...newAddress, governorate: e.target.value})} />
                            <input type="text" placeholder="Area" className="w-full p-2 border rounded" value={newAddress.area} onChange={(e) => setNewAddress({...newAddress, area: e.target.value})} />
                            <input type="text" placeholder="Block" className="w-full p-2 border rounded" value={newAddress.block} onChange={(e) => setNewAddress({...newAddress, block: e.target.value})} />
                            <input type="text" placeholder="Street" className="w-full p-2 border rounded" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} />
                            <input type="text" placeholder="Building" className="w-full p-2 border rounded" value={newAddress.building} onChange={(e) => setNewAddress({...newAddress, building: e.target.value})} />
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})} />
                                Set as default
                            </label>
                            <div className="flex gap-2">
                                <Button className="flex-grow" onClick={() => void handleAddAddress()}>{editingAddress ? 'Save' : 'Add'}</Button>
                                <Button variant="secondary" onClick={() => { setShowAddressPopup(false); setEditingAddress(null); }}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showOtpPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
                        <h2 className="text-lg font-bold mb-2">Verify Email</h2>
                        <p className="text-sm text-slate-600 mb-4">Enter the verification code sent to {email}</p>
                        {otpError && (
                            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-150 text-red-800 text-xs font-bold">
                                {otpError}
                            </div>
                        )}
                        <div className="space-y-4">
                            <VerificationCodeInput value={otp} onChange={(value) => { setOtp(value); setOtpError(null); }} invalid={Boolean(otpError)} />
                            <div className="text-xs font-bold text-slate-500 flex justify-between items-center px-1">
                                {canResendOtp ? (
                                    <button onClick={handleResendOtp} className="text-emerald-600 hover:underline">Resend Code</button>
                                ) : (
                                    <span>Resend in {otpCountdown}s</span>
                                )}
                                <span>(Use test code 123456)</span>
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-grow" onClick={handleVerifyOtp} disabled={otp.length < 6}>Verify</Button>
                                <Button variant="secondary" onClick={() => { setShowOtpPopup(false); setOtpError(null); setOtp(''); }}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeletePopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                        <h2 className="text-xl font-bold text-red-700 mb-4">Delete Account</h2>
                        
                        <div className="bg-red-50 text-red-950 p-4 rounded-xl text-sm leading-relaxed mb-6 border border-red-100">
                            <strong>Warning:</strong> This action is permanent and cannot be undone. You will lose access to:
                            <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                                <li>All your enrolled courses and certificates</li>
                                <li>Active bookings and consultation history</li>
                                <li>Saved addresses and payment history</li>
                            </ul>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            To confirm, please type <strong className="text-slate-800 font-black">DELETE</strong> in the box below:
                        </p>
                        
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Type DELETE" 
                                className="w-full p-3 border border-slate-200 rounded-xl text-center font-bold tracking-widest outline-none focus:border-red-550 focus:ring-1 focus:ring-red-500 transition-all text-sm" 
                                value={deleteConfirmText} 
                                onChange={(e) => {
                                    setDeleteConfirmText(e.target.value);
                                    setDeleteError(null);
                                }} 
                            />
                            {deleteError && (
                                <p className="text-xs font-bold text-red-650">{deleteError}</p>
                            )}
                            <div className="flex gap-3">
                                <button 
                                    className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50"
                                    onClick={() => {
                                        if (deleteConfirmText === 'DELETE') {
                                            deleteAccount('DELETE');
                                            setShowDeletePopup(false);
                                            setProfileMessage({ type: 'success', text: 'Your account has been deleted successfully.' });
                                            setTimeout(() => {
                                                navigate('/auth');
                                            }, 2000);
                                        } else {
                                            setDeleteError('Confirmation text does not match.');
                                        }
                                    }}
                                    disabled={deleteConfirmText !== 'DELETE'}
                                >
                                    Delete Permanently
                                </button>
                                <button 
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all" 
                                    onClick={() => {
                                        setShowDeletePopup(false);
                                        setDeleteConfirmText('');
                                        setDeleteError(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export { Settings as SettingsPage };
