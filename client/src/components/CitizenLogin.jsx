import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import { api } from '../services/api.js';

export default function CitizenLogin({ onLoginSuccess, onSwitchToAdmin, onCancel }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [useEmailFallback, setUseEmailFallback] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [serverOtp, setServerOtp] = useState('');
  const [smsDelivered, setSmsDelivered] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [smsProvider, setSmsProvider] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const activeTarget = useEmailFallback ? email.trim() : mobileNumber.trim();

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    if (!activeTarget) {
      setErrorMsg(useEmailFallback ? 'Please enter your Mail ID' : 'Please enter your 10-digit mobile number');
      return;
    }

    if (!useEmailFallback) {
      const cleanDigits = mobileNumber.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile phone number');
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await api.sendOtp({
        phone: useEmailFallback ? undefined : mobileNumber.trim(),
        email: useEmailFallback ? email.trim() : undefined,
        identifier: activeTarget,
        role: 'citizen',
      });

      if (res.success) {
        setStep('otp');
        setServerOtp(res.otp || '');
        setSmsDelivered(Boolean(res.smsDelivered));
        setNeedsApiKey(Boolean(res.needsApiKey));
        setSmsProvider(res.provider || '');
        setInfoMsg(res.message || `OTP sent via SMS to ${activeTarget}`);
        setCooldown(30);
      } else {
        setErrorMsg(res.error || 'Failed to send OTP. Please check your phone number.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your phone');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.verifyOtp({
        phone: useEmailFallback ? undefined : mobileNumber.trim(),
        email: useEmailFallback ? email.trim() : undefined,
        identifier: activeTarget,
        otp: otp.trim(),
        role: 'citizen',
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user, res.token);
      } else {
        setErrorMsg(res.error || 'Invalid OTP code. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 160px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        borderRadius: '24px',
        border: '1px solid var(--border-accent)',
        padding: '36px',
        boxShadow: 'var(--shadow-lg), 0 0 35px rgba(6, 182, 212, 0.2)',
        position: 'relative',
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 18px rgba(6, 182, 212, 0.45)',
          }}>
            <Phone size={28} color="#ffffff" />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '0.75rem',
            color: '#38bdf8',
            fontWeight: 700,
            marginBottom: '10px',
          }}>
            <ShieldCheck size={13} /> CITIZEN MOBILE OTP LOGIN
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '8px' }}>
            Citizen Portal Login
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Enter your mobile number to receive a 6-digit SMS verification code
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fca5a5',
            fontSize: '0.84rem',
          }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success / Info Alert */}
        {infoMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#6ee7b7',
            fontSize: '0.84rem',
          }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Mobile Number */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {useEmailFallback ? 'Mail ID' : 'Mobile Phone Number'}{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseEmailFallback(!useEmailFallback);
                    setErrorMsg('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {useEmailFallback ? 'Use Mobile Number instead' : 'Or use Mail ID'}
                </button>
              </div>

              {!useEmailFallback ? (
                <div style={{ position: 'relative', display: 'flex' }}>
                  <div style={{
                    position: 'absolute',
                    left: '12px',
                    top: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#38bdf8',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRight: '1px solid rgba(255, 255, 255, 0.15)',
                    paddingRight: '8px',
                    height: '24px',
                  }}>
                    <Phone size={16} />
                    <span>+91</span>
                  </div>
                  <input
                    id="input-citizen-phone"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile (e.g. 7259316811)"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px 12px 82px',
                      color: '#fff',
                      fontSize: '0.98rem',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    id="input-citizen-email"
                    type="email"
                    placeholder="Enter your email (e.g. shweta@gmail.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px 12px 42px',
                      color: '#fff',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                  <Mail size={19} color="#38bdf8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                </div>
              )}
            </div>

            {/* Quick-fill helper for test numbers */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="#f59e0b" /> Quick sample numbers:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  id="btn-sample-shweta"
                  onClick={() => {
                    setUseEmailFallback(false);
                    setMobileNumber('7259316811');
                  }}
                  style={{
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    color: '#38bdf8',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  7259316811 (Shweta)
                </button>
                <button
                  type="button"
                  id="btn-sample-rahul"
                  onClick={() => {
                    setUseEmailFallback(false);
                    setMobileNumber('9876543210');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    color: '#cbd5e1',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  9876543210 (Rahul)
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-send-citizen-otp"
              disabled={isLoading || !activeTarget}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Dispatching SMS OTP...
                </>
              ) : (
                <>
                  Send OTP to Mobile Number <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter & Verify SMS OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  SMS OTP sent to:
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={15} color="#38bdf8" />
                  {!useEmailFallback ? `+91 ${mobileNumber}` : email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setOtp('');
                  setErrorMsg('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Edit2 size={13} /> Change
              </button>
            </div>

            {/* Real Carrier Delivery or Demo Code Banner */}
            {serverOtp && (
              <div style={{
                background: smsDelivered ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: smsDelivered ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    fontSize: '0.74rem',
                    color: smsDelivered ? '#6ee7b7' : '#fde68a',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    {smsDelivered ? (
                      <>
                        <CheckCircle2 size={13} color="#10b981" /> Real SMS Dispatched via {smsProvider}!
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} color="#f59e0b" /> SMS OTP Code:
                      </>
                    )}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: smsDelivered ? '#34d399' : '#fbbf24',
                    letterSpacing: '3px',
                    fontFamily: 'monospace',
                  }}>
                    {serverOtp}
                  </div>
                  {needsApiKey && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      To send SMS to your real phone SIM, add Fast2SMS API Key in Settings
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  id="btn-autofill-otp"
                  onClick={() => setOtp(serverOtp)}
                  style={{
                    background: smsDelivered ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                    border: smsDelivered ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(245, 158, 11, 0.45)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: smsDelivered ? '#34d399' : '#fbbf24',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Auto-fill OTP
                </button>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Enter 6-Digit SMS OTP <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-citizen-otp"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 382758"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'rgba(10, 15, 26, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px 12px 42px',
                    color: '#fff',
                    fontSize: '1.15rem',
                    letterSpacing: '4px',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
                <KeyRound size={19} color="#38bdf8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              </div>
            </div>

            <button
              type="submit"
              id="btn-verify-citizen-otp"
              disabled={isLoading || otp.length < 4}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying Code...
                </>
              ) : (
                <>
                  Verify OTP & Login <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || cooldown > 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: cooldown > 0 ? 'var(--text-dim)' : '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                {cooldown > 0 ? `Resend SMS OTP in ${cooldown}s` : 'Resend SMS OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Switch to Municipal Portal Footer */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Are you an authorized municipal officer or field engineer?
          </p>
          <button
            type="button"
            id="btn-switch-to-admin-login"
            onClick={onSwitchToAdmin}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a855f7',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={16} /> Go to Municipal Authority (Admin) Login &rarr;
          </button>
        </div>

        {onCancel && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Continue browsing as guest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
