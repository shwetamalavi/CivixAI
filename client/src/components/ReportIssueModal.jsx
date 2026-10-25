import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle,
  Building2,
  Navigation,
  Info,
  ChevronRight,
  ShieldAlert,
  Loader2,
  SwitchCamera,
  RotateCcw,
  Trash2,
  ThumbsUp,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { presetPhotos } from '../data/presetPhotos.js';

export default function ReportIssueModal({
  isOpen,
  onClose,
  onIssueCreated,
  currentUser,
  initialCoordinates,
  initialAddress,
}) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('AUTO');
  const [priority, setPriority] = useState('AUTO');
  const [address, setAddress] = useState('350 5th Avenue, Ward 4, Metro City');
  const [coordinates, setCoordinates] = useState([-73.985131, 40.748817]); // [lng, lat]
  const [citizenName, setCitizenName] = useState(currentUser?.name || '');
  const [citizenPhone, setCitizenPhone] = useState(currentUser?.phone || '+91 7259316811');
  const [citizenEmail, setCitizenEmail] = useState(currentUser?.email || '');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (isOpen && initialCoordinates && initialCoordinates.length === 2) {
      setCoordinates(initialCoordinates);
    }
    if (isOpen && initialAddress) {
      setAddress(initialAddress);
    }
  }, [isOpen, initialCoordinates, initialAddress]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showGrievanceDraft, setShowGrievanceDraft] = useState(false);

  // TC-15 & TC-18 State
  const [validationError, setValidationError] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [upvotedExistingSuccess, setUpvotedExistingSuccess] = useState(null);

  // Location detection & geocoding state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);

  // Live Camera Capture State & Refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  // Close camera on modal close or component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.warn('[Video playback err]', e));
    }
  }, [isCameraOpen]);

  useEffect(() => {
    if (currentUser && isOpen) {
      if (currentUser.name) setCitizenName(currentUser.name);
      if (currentUser.phone) setCitizenPhone(currentUser.phone);
      if (currentUser.email) setCitizenEmail(currentUser.email);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // Start Camera Stream
  const startCamera = async (facing = cameraFacingMode) => {
    setCameraError('');
    setIsCameraOpen(true);
    setPhotoPreview('');
    setPhotoFile(null);

    // Stop existing stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (errFacing) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('[Camera Access Error]', err);
      let msg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera hardware found on this device.';
      }
      setCameraError(msg);
      setIsCameraOpen(false);
    }
  };

  // Switch Front/Back Camera
  const handleSwitchCamera = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture Photo From Camera Viewfinder
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPhotoPreview(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `civic-evidence-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setPhotoFile(file);
          runAiAnalysis(dataUrl, description);
        }
      },
      'image/jpeg',
      0.92
    );

    stopCamera();
  };

  // Handle Preset Photo Selection for quick demo
  const handleSelectPreset = async (preset) => {
    stopCamera();
    setPhotoPreview(preset.url);
    setPhotoFile(null);
    setTitle(preset.title);
    setDescription(preset.description);
    setAddress(preset.address);
    setCoordinates(preset.coordinates);
    setLocationDetails(null);

    // Trigger AI analysis on preset
    runAiAnalysis(preset.url, `${preset.title} ${preset.description}`);
  };

  // Handle Local File Upload
  const handleFileChange = (e) => {
    stopCamera();
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        runAiAnalysis(reader.result, description);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Multimodal AI Analysis (TC-11 to TC-17)
  const runAiAnalysis = async (imgData, userDesc = '') => {
    const text = (userDesc !== undefined ? userDesc : description || '').trim();
    const hasPhoto = Boolean(imgData || photoFile || photoPreview);

    // TC-15: Validation appears, unnecessary AI calls avoided
    if (!hasPhoto && !text) {
      setValidationError('Validation Error: Please provide an issue description or attach photo evidence before running AI analysis.');
      return;
    }
    setValidationError('');
    setIsAnalyzing(true);
    try {
      let res;
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('userDescription', text);
        res = await api.previewAiAnalysis(formData);
      } else {
        const pUrl = imgData && !imgData.startsWith('data:') ? imgData : (photoPreview && !photoPreview.startsWith('data:') ? photoPreview : null);
        const b64 = imgData && imgData.startsWith('data:') ? imgData : (photoPreview && photoPreview.startsWith('data:') ? photoPreview : null);
        res = await api.previewAiAnalysis({
          imageBase64: b64,
          photoUrl: pUrl,
          userDescription: text,
        });
      }

      if (res && res.success && res.data) {
        setAiResult(res.data);
        if (res.data.isRelevant !== false && res.data.isAmbiguous !== true) {
          if (!title) setTitle(res.data.identifiedProblem || '');
          if (category === 'AUTO') setCategory(res.data.category || 'ROADS');
          if (priority === 'AUTO') setPriority(res.data.priority || 'Medium');
        }
      } else if (res && res.validationError) {
        setValidationError(res.error || 'Empty AI request rejected by server validation.');
      }
    } catch (err) {
      console.error('[AI Analysis failed]', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Geolocation Browser API with Live Reverse Geocoding
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setAddress('Detecting location & city name...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoordinates([lng, lat]);

        try {
          const geo = await api.reverseGeocode(lat, lng);
          if (geo && geo.formattedAddress) {
            setAddress(geo.formattedAddress);
            setLocationDetails(geo);
          } else {
            setAddress(`Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`);
          }
        } catch (err) {
          console.error('[Reverse Geocode Error]', err);
          setAddress(`Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setAddress('350 5th Avenue, Ward 4, Metro City');
        alert('Could not access GPS location. Please check browser location permissions or type address manually.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Submit Issue (Handles TC-14 rejection, TC-15 validation, TC-18 duplicate prevention)
  const handleSubmit = async (e, forceAllowDuplicate = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setValidationError('');

    // TC-15: Validation appears, unnecessary requests avoided
    if (!photoPreview && !photoFile && !description.trim()) {
      setValidationError('Validation Error: Photo evidence or detailed issue description is required.');
      return;
    }

    // TC-14: Irrelevant input rejection
    if (aiResult && aiResult.isRelevant === false) {
      setValidationError('Cannot file grievance: The input was identified as unrelated to public civic infrastructure.');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload;
      if (photoFile) {
        payload = new FormData();
        payload.append('photo', photoFile);
        payload.append('title', title || aiResult?.identifiedProblem || 'Reported Civic Concern');
        payload.append('description', description);
        payload.append('category', category !== 'AUTO' ? category : (aiResult?.category || 'ROADS'));
        payload.append('priority', priority !== 'AUTO' ? priority : (aiResult?.priority || 'Medium'));
        payload.append('longitude', coordinates[0]);
        payload.append('latitude', coordinates[1]);
        payload.append('formattedAddress', address);
        if (locationDetails?.city) payload.append('city', locationDetails.city);
        if (locationDetails?.area) payload.append('area', locationDetails.area);
        if (locationDetails?.street) payload.append('street', locationDetails.street);
        payload.append('citizenName', citizenName || 'Concerned Resident');
        payload.append('citizenPhone', citizenPhone);
        payload.append('citizenEmail', citizenEmail);
        payload.append('isAnonymous', isAnonymous);
        if (forceAllowDuplicate) payload.append('allowDuplicate', 'true');
        if (aiResult) payload.append('precomputedAi', JSON.stringify(aiResult));
      } else {
        payload = {
          photoUrl: photoPreview,
          title: title || aiResult?.identifiedProblem || 'Reported Civic Concern',
          description,
          category: category !== 'AUTO' ? category : (aiResult?.category || 'ROADS'),
          priority: priority !== 'AUTO' ? priority : (aiResult?.priority || 'Medium'),
          longitude: coordinates[0],
          latitude: coordinates[1],
          formattedAddress: address,
          city: locationDetails?.city,
          area: locationDetails?.area,
          street: locationDetails?.street,
          citizenName: citizenName || 'Concerned Resident',
          citizenPhone,
          citizenEmail,
          isAnonymous,
          allowDuplicate: forceAllowDuplicate,
          precomputedAi: aiResult ? JSON.stringify(aiResult) : null,
        };
      }

      const res = await api.createIssue(payload);

      // TC-18: Duplicate grievance detected
      if (res && res.duplicateDetected && res.existingIssue) {
        setDuplicateAlert(res.existingIssue);
        setIsSubmitting(false);
        return;
      }

      if (res.success) {
        setSubmittedTicket(res.data);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onIssueCreated) onIssueCreated(res.data);
      } else {
        setValidationError(res.error || 'Failed to submit grievance');
      }
    } catch (err) {
      setValidationError(err.message || 'Error communicating with server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvoteExisting = async () => {
    if (!duplicateAlert) return;
    try {
      await api.upvoteIssue(duplicateAlert._id || duplicateAlert.ticketId);
      setUpvotedExistingSuccess(duplicateAlert);
      confetti({ particleCount: 75, spread: 60 });
      setDuplicateAlert(null);
    } catch (e) {
      alert('Upvote failed: ' + e.message);
    }
  };

  const handleResetAndClose = () => {
    stopCamera();
    setPhotoFile(null);
    setPhotoPreview('');
    setTitle('');
    setDescription('');
    setAiResult(null);
    setSubmittedTicket(null);
    setLocationDetails(null);
    setValidationError('');
    setDuplicateAlert(null);
    setUpvotedExistingSuccess(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '840px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        borderRadius: '24px',
        border: '1px solid var(--border-accent)',
        padding: '30px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg), 0 0 35px rgba(6, 182, 212, 0.25)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
            }}>
              <ShieldAlert size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>Report Civic Issue</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Multimodal AI extracts location, assesses hazard, drafts complaint & routes to department
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* If successfully upvoted existing ticket (TC-18 duplicate avoidance) */}
        {upvotedExistingSuccess ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '2px solid #38bdf8',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
            }}>
              <ThumbsUp size={36} />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '8px' }}>
              Civic Upvote Registered Successfully!
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Existing Ticket ID: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{upvotedExistingSuccess.ticketId}</strong>
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '540px',
              margin: '0 auto 24px',
              textAlign: 'left',
              fontSize: '0.88rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Issue Title:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{upvotedExistingSuccess.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{upvotedExistingSuccess.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Priority Urgency Boost:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>+1 Upvote (Duplicate Record Avoided)</span>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem' }}
            >
              Done & Return to Feed
            </button>
          </div>
        ) : submittedTicket ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
            }}>
              <CheckCircle size={38} />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '8px' }}>
              Civic Grievance Officially Registered!
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Ticket Reference ID: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{submittedTicket.ticketId}</strong>
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '540px',
              margin: '0 auto 24px',
              textAlign: 'left',
              fontSize: '0.88rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Department:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{submittedTicket.assignedDepartment}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assessed Severity:</span>
                <span style={{ color: submittedTicket.priority === 'Urgent' ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                  {submittedTicket.priority} (Hazard Index: {submittedTicket.aiAnalysis?.hazardScore || 85}/100)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Officer Alert Dispatched:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Automated SMS & Email Alert Sent</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Citizen Tracking SMS:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Sent to {submittedTicket.citizenInfo?.phone}</span>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem' }}
            >
              Done & Return to Feed
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* TC-18 Duplicate Alert Banner */}
            {duplicateAlert && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.1) 100%)',
                border: '1px solid #f59e0b',
                borderRadius: '16px',
                padding: '16px 18px',
                marginBottom: '20px',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <AlertTriangle size={20} color="#f59e0b" />
                  <h4 style={{ color: '#f59e0b', fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
                    Potential Duplicate Civic Grievance Detected (TC-18)
                  </h4>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#fde68a', marginBottom: '10px', lineHeight: 1.4 }}>
                  A similar civic issue is already active in the queue: Ticket <strong style={{ color: '#fff' }}>#{duplicateAlert.ticketId}</strong> (Status: <strong style={{ color: '#38bdf8' }}>{duplicateAlert.status}</strong>).
                </p>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  color: '#e2e8f0',
                  lineHeight: 1.4,
                }}>
                  <div><strong>Title:</strong> {duplicateAlert.title}</div>
                  <div><strong>Department:</strong> {duplicateAlert.assignedDepartment || 'Municipal Board'}</div>
                  <div><strong>Location:</strong> {duplicateAlert.address || 'Designated Coordinates'}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleUpvoteExisting}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ThumbsUp size={14} /> Upvote Existing Ticket (Avoid Duplicate)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(null, true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      color: '#cbd5e1',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Submit as Distinct Issue Anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateAlert(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      marginLeft: 'auto',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* TC-15 Validation Error Banner */}
            {validationError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '18px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{validationError}</span>
                <button
                  type="button"
                  onClick={() => setValidationError('')}
                  style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Step 1: Photo Evidence (Direct Camera Capture or Upload) */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} color="#38bdf8" /> Step 1: Photo Evidence (Click Direct Photo or Upload)
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mandatory for Multimodal Vision AI</span>
              </div>

              {/* Action Cards: Live Camera Click vs File Upload */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '14px',
              }}>
                {/* 1. Live Camera Button */}
                <button
                  type="button"
                  id="btn-open-camera"
                  onClick={() => startCamera()}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: isCameraOpen ? 'rgba(6, 182, 212, 0.25)' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(2, 132, 199, 0.08))',
                    border: isCameraOpen ? '2px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.35)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(6, 182, 212, 0.15)',
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(6, 182, 212, 0.4)',
                  }}>
                    <Camera size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8' }}>Click Photo Directly</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Capture live with device camera</div>
                  </div>
                </button>

                {/* 2. File Upload Button */}
                <label
                  id="btn-upload-file"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Upload size={22} color="#94a3b8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e2e8f0' }}>Upload from Device</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Choose JPG, PNG, or WEBP</div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  color: '#fca5a5',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Live Camera Viewfinder */}
              {isCameraOpen && (
                <div style={{
                  position: 'relative',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '2px solid #06b6d4',
                  background: '#070b13',
                  marginBottom: '16px',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.35)',
                }}>
                  {/* Video Stream */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '340px',
                      objectFit: 'cover',
                      display: 'block',
                      background: '#000',
                    }}
                  />

                  {/* Top Control Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 20,
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(7, 11, 19, 0.85)',
                      backdropFilter: 'blur(8px)',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 10px #ef4444',
                      }} />
                      LIVE CAMERA STREAM
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        title="Switch Camera (Front/Back)"
                        style={{
                          background: 'rgba(7, 11, 19, 0.85)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '50%',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff',
                        }}
                      >
                        <SwitchCamera size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        title="Cancel Camera"
                        style={{
                          background: 'rgba(7, 11, 19, 0.85)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '50%',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff',
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Centered Reticle / Framing Guide */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '200px',
                    height: '200px',
                    border: '2px dashed rgba(6, 182, 212, 0.6)',
                    borderRadius: '16px',
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.2)',
                  }} />

                  {/* Bottom Shutter Capture Bar */}
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 20,
                  }}>
                    <button
                      type="button"
                      id="btn-shutter-click"
                      onClick={capturePhoto}
                      style={{
                        width: '66px',
                        height: '66px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                        border: '4px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.8)',
                        transition: 'transform 0.12s ease',
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      title="Click Photo"
                    >
                      <Camera size={30} color="#ffffff" />
                    </button>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'rgba(7, 11, 19, 0.85)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 14px',
                      borderRadius: '999px',
                      letterSpacing: '0.3px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    }}>
                      📸 Click Button to Snap Photo Evidence
                    </span>
                  </div>
                </div>
              )}

              {/* Photo Evidence Attached Preview Card */}
              {photoPreview && !isCameraOpen && (
                <div style={{
                  position: 'relative',
                  borderRadius: '16px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.03)',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{
                    width: '140px',
                    height: '95px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0,
                  }}>
                    <img
                      src={photoPreview}
                      alt="Civic evidence"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}>
                      <CheckCircle size={12} /> Photo Evidence Attached
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Multimodal AI Vision will evaluate this evidence for hazard analysis & routing.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        style={{
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          color: '#38bdf8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <RotateCcw size={12} /> Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview('');
                          setPhotoFile(null);
                          setAiResult(null);
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          color: '#f87171',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Preset Selector Buttons */}
              <div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} color="#f59e0b" /> Or Test Drive With Preset Problem Samples:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {presetPhotos.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        padding: '6px 12px',
                        background: photoPreview === preset.url ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: photoPreview === preset.url ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: photoPreview === preset.url ? '#38bdf8' : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Vision Telemetry Preview Card */}
            {(isAnalyzing || aiResult) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 21, 38, 0.7) 100%)',
                border: '1px solid var(--border-accent)',
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '22px',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#38bdf8" />
                    <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>
                      Multimodal AI Vision Telemetry
                    </h4>
                    <span style={{
                      fontSize: '0.68rem',
                      background: 'rgba(6, 182, 212, 0.2)',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 700,
                    }}>
                      {aiResult?.modelUsed || 'Analyzing with Gemini...'}
                    </span>
                  </div>

                  {aiResult?.grievanceDraft && (
                    <button
                      type="button"
                      onClick={() => setShowGrievanceDraft(!showGrievanceDraft)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <FileText size={14} /> {showGrievanceDraft ? 'Hide Grievance Draft' : 'View Formal Grievance Draft'}
                    </button>
                  )}
                </div>

                {isAnalyzing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', color: 'var(--text-muted)' }}>
                    <Loader2 size={18} className="animate-spin" color="#38bdf8" />
                    <span style={{ fontSize: '0.85rem' }}>AI Vision scanning infrastructure defect & computing hazard score...</span>
                  </div>
                ) : aiResult ? (
                  <div>
                    {/* TC-16: Cloud AI failure / fallback notice */}
                    {(aiResult.cloudAiFailed || aiResult.fallbackUsed) && (
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        marginBottom: '12px',
                        fontSize: '0.78rem',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <Info size={15} style={{ flexShrink: 0 }} />
                        <span>
                          {aiResult.serviceStatus?.message || 'Cloud AI service is unavailable or timed out. Switched to Resilient Local Civic Engine.'} (TC-16)
                        </span>
                      </div>
                    )}

                    {/* TC-13: Ambiguous Input Handling */}
                    {aiResult.isAmbiguous ? (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        marginBottom: '10px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <HelpCircle size={18} color="#f59e0b" />
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f59e0b' }}>
                            Clarification Required: Ambiguous Complaint (TC-13)
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: '#fef3c7', marginBottom: '10px', lineHeight: 1.5 }}>
                          {aiResult.clarificationPrompt}
                        </p>
                        {aiResult.clarificationQuestions && (
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                              Information required to proceed:
                            </span>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                              {aiResult.clarificationQuestions.map((q, idx) => (
                                <li key={idx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiResult.quickSuggestions && (
                          <div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                              Click a suggestion below to specify the issue:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {aiResult.quickSuggestions.map((s, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const updated = description ? `${description} - ${s}` : s;
                                    setDescription(updated);
                                    runAiAnalysis(photoPreview, updated);
                                  }}
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                    color: '#fef08a',
                                    borderRadius: '999px',
                                    padding: '4px 10px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  + {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : aiResult.isRelevant === false ? (
                      /* TC-14: Irrelevant Input Handling */
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        marginBottom: '10px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <XCircle size={18} color="#ef4444" />
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f87171' }}>
                            Non-Civic / Irrelevant Input Detected (TC-14)
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: '#fca5a5', marginBottom: '8px', lineHeight: 1.5 }}>
                          {aiResult.message}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                          💡 {aiResult.guidance}
                        </p>
                      </div>
                    ) : (
                      /* TC-11 & TC-12 & TC-17: Relevant Civic Issue Result */
                      <div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '12px',
                          marginBottom: '12px',
                        }}>
                          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: '10px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Assessed Severity</span>
                            <span style={{
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              color: aiResult.priority === 'Urgent' ? '#ef4444' : aiResult.priority === 'High' ? '#f97316' : '#eab308',
                            }}>
                              {aiResult.priority} ({aiResult.hazardScore}/100 Hazard Index)
                            </span>
                          </div>

                          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: '10px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Auto-Target Department</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#38bdf8' }}>
                              {aiResult.recommendedDepartment}
                            </span>
                          </div>

                          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: '10px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>SLA Directive</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#10b981' }}>
                              {aiResult.recommendedTimeline}
                            </span>
                          </div>
                        </div>

                        {/* Detected Risk Tags */}
                        {aiResult.detectedObjects && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Identified Risk Factors:</span>
                            {aiResult.detectedObjects.map((obj, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '0.72rem',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: 'var(--text-main)',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                • {obj}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Expanded Formal Grievance Draft */}
                        {showGrievanceDraft && aiResult.grievanceDraft && (
                          <div style={{
                            marginTop: '14px',
                            background: '#090d16',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '10px',
                            padding: '14px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            lineHeight: 1.5,
                            color: '#cbd5e1',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '220px',
                            overflowY: 'auto',
                          }}>
                            {aiResult.grievanceDraft}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Step 2: Issue Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Headline / Identified Defect
                </label>
                <input
                  id="input-issue-title"
                  type="text"
                  placeholder="e.g. Deep Asphalt Crater on Main Road"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 15, 26, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Category & Priority
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    id="select-issue-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="AUTO">Auto (AI Vision)</option>
                    <option value="ROADS">Roads & Bridges</option>
                    <option value="SANITATION">Sanitation & Waste</option>
                    <option value="ELECTRICAL">Electrical & Lighting</option>
                    <option value="WATER">Water & Sewage</option>
                    <option value="SAFETY">Public Safety Hazard</option>
                  </select>

                  <select
                    id="select-issue-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="AUTO">Auto Severity</option>
                    <option value="Urgent">Urgent (Red Alert)</option>
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low Severity</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Additional Citizen Observations / Impact Details
                </label>
                <button
                  type="button"
                  id="btn-analyze-description"
                  onClick={() => runAiAnalysis(photoPreview, description)}
                  disabled={isAnalyzing || (!description.trim() && !photoPreview && !photoFile)}
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    color: '#38bdf8',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: (!description.trim() && !photoPreview && !photoFile) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                  title="Run AI Multimodal Analysis on current text and photo"
                >
                  <Sparkles size={13} color="#38bdf8" /> Analyze with AI
                </button>
              </div>
              <textarea
                id="input-issue-description"
                rows={3}
                placeholder="Describe details: e.g. rim damages, proximity to school, foul odor, traffic blockage..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationError) setValidationError('');
                }}
                style={{
                  width: '100%',
                  background: 'rgba(10, 15, 26, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Step 3: Location / Coordinates */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#06b6d4" /> Step 3: Geographical Location & 2dsphere Tagging
                </label>
                <button
                  type="button"
                  id="btn-get-live-gps"
                  onClick={handleGetLocation}
                  disabled={isDetectingLocation}
                  style={{
                    background: isDetectingLocation ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#38bdf8',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: isDetectingLocation ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Detecting Location & City...
                    </>
                  ) : (
                    <>
                      <Navigation size={13} /> Detect My Live GPS
                    </>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="input-issue-address"
                  type="text"
                  placeholder="Street Address or Landmark, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    flex: 2,
                    background: 'rgba(10, 15, 26, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                  required
                />
                <input
                  type="text"
                  value={`[${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`}
                  readOnly
                  title="GeoJSON Coordinates (lng, lat)"
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    textAlign: 'center',
                  }}
                />
              </div>

              {locationDetails?.city && (
                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: '#38bdf8',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  width: 'fit-content',
                }}>
                  <MapPin size={12} color="#06b6d4" />
                  <span>
                    Detected: <strong style={{ color: '#fff' }}>{locationDetails.city}</strong>
                    {locationDetails.area && locationDetails.area !== locationDetails.city ? ` (${locationDetails.area})` : ''}
                    {locationDetails.state ? `, ${locationDetails.state}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Step 4: Citizen Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '22px',
            }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Reporter Name
                </label>
                <input
                  id="input-reporter-name"
                  type="text"
                  placeholder="Your Name"
                  disabled={isAnonymous}
                  value={isAnonymous ? 'Anonymous' : citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  style={{
                    width: '100%',
                    background: isAnonymous ? 'rgba(255, 255, 255, 0.03)' : 'rgba(10, 15, 26, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: isAnonymous ? 'var(--text-dim)' : '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Mobile (For SMS Status Updates)
                </label>
                <input
                  id="input-reporter-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 15, 26, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <input
                    id="checkbox-anonymous"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ accentColor: '#06b6d4', width: '16px', height: '16px' }}
                  />
                  Submit Anonymously
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                id="btn-submit-grievance"
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || (!photoPreview && !photoFile && !description.trim()) || aiResult?.isRelevant === false}
                style={{
                  padding: '12px 28px',
                  fontSize: '0.95rem',
                  opacity: (aiResult?.isRelevant === false) ? 0.45 : 1,
                  cursor: (aiResult?.isRelevant === false) ? 'not-allowed' : 'pointer',
                }}
                title={aiResult?.isRelevant === false ? 'Cannot file grievance for irrelevant input (TC-14)' : ''}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Routing to Department...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={18} /> File Grievance & Dispatch Alert
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
