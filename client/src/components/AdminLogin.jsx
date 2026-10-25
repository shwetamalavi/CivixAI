import React, { useState, useEffect } from 'react';
import {
  Building2,
  KeyRound,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BadgeCheck,
  RefreshCw,
  Edit2,
  User,
} from 'lucide-react';
import { api } from '../services/api.js';

export default function AdminLogin({ onLoginSuccess, onSwitchToCitizen, onCancel }) {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [serverOtp, setServerOtp] = useState('');
  const [otpType, setOtpType] = useState('phone');
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

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your official mobile number or municipal Mail ID');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await api.sendOtp({
        identifier: identifier.trim(),
        role: 'officer',
      });

      if (res.success) {
        setStep('otp');
        setServerOtp(res.otp || '');
        setOtpType(res.type || 'phone');
        setInfoMsg(res.message || `Authorization OTP sent to ${identifier.trim()}`);
        setCooldown(30);
      } else {
        setErrorMsg(res.error || 'Failed to send authorization OTP.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Connection error with municipal server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setErrorMsg('Please enter the 6-digit municipal authorization OTP');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.verifyOtp({
        identifier: identifier.trim(),
        otp: otp.trim(),
        role: 'officer',
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user, res.token);
      } else {
        setErrorMsg(res.error || 'Invalid authorization code. Access denied.');
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
        maxWidth: '520px',
        width: '100%',
        borderRadius: '24px',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        padding: '36px',
        boxShadow: 'var(--shadow-lg), 0 0 40px rgba(147, 51, 234, 0.25)',
        position: 'relative',
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 18px rgba(147, 51, 234, 0.45)',
          }}>
            <Building2 size={28} color="#ffffff" />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '0.75rem',
            color: '#c084fc',
            fontWeight: 700,
            marginBottom: '10px',
          }}>
            <BadgeCheck size={14} /> OFFICIAL GOVERNMENT OTP ACCESS
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '8px' }}>
            Municipal Authority Login
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Enter your official mobile number or government email to receive your OTP
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

        {/* STEP 1: Enter Official Mobile or Mail ID */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Official Mobile Number or Government Mail ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-admin-identifier"
                  type="text"
                  placeholder="e.g. 7259316811 or pwd.engineer@civix.gov"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
                <Phone size={19} color="#c084fc" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              </div>
            </div>

            {/* Quick sample officials for testing */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '22px',
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="#f59e0b" /> Official test credentials:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                <button
                  type="button"
                  id="btn-admin-sample-shweta"
                  onClick={() => setIdentifier('7259316811')}
                  style={{
                    background: 'rgba(168, 85, 247, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: '#d8b4fe',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Er. Shweta (Executive Engineer - PWD)</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Mobile: 7259316811</span>
                </button>

                <button
                  type="button"
                  id="btn-admin-sample-admin"
                  onClick={() => setIdentifier('admin@civix.gov')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: '#cbd5e1',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Commissioner S. Rao (Central Admin)</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>admin@civix.gov</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-send-admin-otp"
              disabled={isLoading || !identifier.trim()}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(147, 51, 234, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Generating Authorization OTP...
                </>
              ) : (
                <>
                  Send Authorization OTP <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter & Verify Official OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {otpType === 'phone' ? 'SMS OTP sent to mobile:' : 'Authorization OTP sent to:'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {otpType === 'phone' ? <Phone size={15} color="#c084fc" /> : <Mail size={15} color="#c084fc" />}
                  {identifier}
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
                  color: '#c084fc',
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

            {/* Instant Demo OTP Display Banner */}
            {serverOtp && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#fde68a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={13} color="#f59e0b" /> Municipal OTP Code:
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '3px', fontFamily: 'monospace' }}>
                    {serverOtp}
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-admin-autofill-otp"
                  onClick={() => setOtp(serverOtp)}
                  style={{
                    background: 'rgba(245, 158, 11, 0.25)',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#fbbf24',
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
                Enter 6-Digit Municipal OTP <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-admin-otp"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 554500"
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
                <KeyRound size={19} color="#c084fc" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              </div>
            </div>

            <button
              type="submit"
              id="btn-verify-admin-otp"
              disabled={isLoading || otp.length < 4}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(147, 51, 234, 0.4)',
                transition: 'all 0.2s',
                marginBottom: '12px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Authorizing Officer...
                </>
              ) : (
                <>
                  Verify OTP & Access Console <ArrowRight size={18} />
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
                  color: cooldown > 0 ? 'var(--text-dim)' : '#c084fc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Switch to Citizen Portal Footer */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Are you a citizen looking to report or track a civic complaint?
          </p>
          <button
            type="button"
            id="btn-switch-to-citizen-login"
            onClick={onSwitchToCitizen}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <User size={16} /> Go to Citizen Civic Portal Login &rarr;
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
