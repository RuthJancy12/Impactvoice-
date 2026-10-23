import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  MapPin,
  Mic,
  Send,
  Sparkles,
  Square,
  Trash2,
  UploadCloud,
  Volume2,
  WifiOff,
} from 'lucide-react';
import {
  IssueCategory,
  IssueReport,
  PriorityLevel,
  ScreenId,
  UserProfile,
} from '../types';
import {
  ASSETS,
  getDepartmentForCategory,
  getOfficialForDepartment,
  ISSUE_CATEGORIES,
  THOOTHUKUDI_LOCATIONS,
} from '../mockData';
import { ResilientImage } from './ResilientImage';
import { PriorityIndicator } from './StatusIndicators';

interface ReportIssueScreenProps {
  user: UserProfile;
  initialCategory: IssueCategory;
  isOnline: boolean;
  onSubmitReport: (
    newReport: Omit<
      IssueReport,
      | 'id'
      | 'referenceCode'
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'upvotes'
      | 'timeline'
      | 'comments'
    >,
    options?: { stayOnScreen?: boolean }
  ) => Promise<string | void> | string | void;
  onNavigate: (screen: ScreenId, reportId?: string) => void;
}

interface AIVoiceDetection {
  transcript: string;
  issue: string;
  location: string;
  locality: string;
  category: IssueCategory;
  description: string;
  priority: PriorityLevel;
  assignedDepartment: string;
  officialTitle: string;
}

function extractLocalityFromDisplay(locDisplay: string): string {
  const cleaned = locDisplay.replace(/,\s*thoothukudi/i, '').trim();
  const matched = THOOTHUKUDI_LOCATIONS.find(
    (l) =>
      l.name.toLowerCase() === cleaned.toLowerCase() ||
      locDisplay.toLowerCase().includes(l.name.toLowerCase())
  );
  return matched ? matched.name : cleaned || 'Millerpuram';
}

function clientFallbackUnderstand(transcript: string): AIVoiceDetection {
  const lower = transcript.toLowerCase();
  const matchedLoc =
    THOOTHUKUDI_LOCATIONS.find((l) => lower.includes(l.name.toLowerCase()))?.name ||
    (lower.includes('old bus')
      ? 'Thoothukudi Old Bus Stand'
      : lower.includes('new bus')
      ? 'New Bus Stand'
      : lower.includes('sipcot')
      ? 'SIPCOT Industrial Estate'
      : lower.includes('harbour') || lower.includes('harbor')
      ? 'Harbour Area'
      : 'Millerpuram');

  let issue = 'Civic Issue';
  let category: IssueCategory = 'Other';
  let description = transcript.trim();
  let priority: PriorityLevel = 'High';

  if (lower.includes('flood') || lower.includes('inundat') || lower.includes('waterlog')) {
    issue = 'Flood';
    category = 'Drainage';
    description = `Flooding and waterlogging reported in ${matchedLoc}`;
    priority = 'Critical';
  } else if (
    lower.includes('pipe breakage') ||
    lower.includes('broken pipe') ||
    lower.includes('pipe burst')
  ) {
    issue = 'Pipe Breakage';
    category = 'Water Leakage';
    description = 'Pipe breakage causing water leakage';
    priority = 'High';
  } else if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak')) {
    issue = lower.includes('burst') ? 'Water Main Burst' : 'Water Leakage';
    category = 'Water Leakage';
    description = `Water leakage reported in ${matchedLoc}`;
    priority = lower.includes('burst') ? 'Critical' : 'High';
  } else if (
    lower.includes('electric') ||
    lower.includes('transformer') ||
    lower.includes('power') ||
    lower.includes('spark') ||
    lower.includes('wire')
  ) {
    issue = lower.includes('transformer')
      ? 'Transformer Sparking'
      : lower.includes('wire')
      ? 'Fallen Electric Wire'
      : 'Power Outage';
    category = 'Electricity';
    description = `Electrical hazard and power disruption in ${matchedLoc}`;
    priority = lower.includes('spark') || lower.includes('wire') ? 'Critical' : 'High';
  } else if (lower.includes('pothole') || lower.includes('road')) {
    issue = lower.includes('pothole') ? 'Deep Pothole' : 'Road Damage';
    category = 'Road Damage';
    description = `Damaged road surface and pothole hazard in ${matchedLoc}`;
    priority = 'High';
  } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('bin')) {
    issue = lower.includes('overflow') ? 'Overflowing Garbage' : 'Garbage Accumulation';
    category = 'Garbage';
    description = `Uncollected garbage accumulation in ${matchedLoc}`;
    priority = 'Medium';
  } else if (
    lower.includes('street light') ||
    lower.includes('streetlight') ||
    lower.includes('lamp')
  ) {
    issue = 'Street Light Outage';
    category = 'Street Light';
    description = `Non-working street light in ${matchedLoc}`;
    priority = 'Medium';
  } else if (lower.includes('drain') || lower.includes('sewage') || lower.includes('sewer')) {
    issue = lower.includes('sewage') ? 'Sewage Overflow' : 'Drainage Blockage';
    category = 'Drainage';
    description = `Blocked drainage causing overflow in ${matchedLoc}`;
    priority = 'High';
  }

  const assignedDepartment = getDepartmentForCategory(category);
  return {
    transcript,
    issue,
    location: matchedLoc,
    locality: matchedLoc,
    category,
    description,
    priority,
    assignedDepartment,
    officialTitle: getOfficialForDepartment(assignedDepartment),
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1] || '';
        resolve(base64Data);
      } else {
        reject(new Error('Failed to read recorded audio blob.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading recorded audio data.'));
    reader.readAsDataURL(blob);
  });
}

function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({
  user,
  initialCategory,
  isOnline,
  onSubmitReport,
  onNavigate,
}) => {
  const [category, setCategory] = useState<IssueCategory>(initialCategory);
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<string>(user.location || 'Millerpuram');
  const [ward, setWard] = useState<string>(user.ward || 'Zone 2 — Central West');
  const [observedAt, setObservedAt] = useState('2026-10-04T09:30');
  const [coords, setCoords] = useState({
    lat: 8.7986,
    lng: 78.1321,
    mapX: 38,
    mapY: 46,
  });
  const [imageUrl, setImageUrl] = useState<string | undefined>(ASSETS.waterLeak);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const issueInputRef = useRef<HTMLInputElement | null>(null);

  // Voice ORB + OpenAI Whisper + Gemini AI State
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribingWhisper, setIsTranscribingWhisper] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState('');
  const [aiDetection, setAiDetection] = useState<AIVoiceDetection | null>(null);
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);
  const [isUserConfirmed, setIsUserConfirmed] = useState(false);
  const [isSendingVoiceReport, setIsSendingVoiceReport] = useState(false);
  const [confirmedBanner, setConfirmedBanner] = useState<{
    issue: string;
    department: string;
    officialTitle: string;
    category: IssueCategory;
    location: string;
    priority: PriorityLevel;
    reportId?: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const liveSpeechRef = useRef<string>('');

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // Cleanup active microphone stream and timer on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const routedDepartment = getDepartmentForCategory(category);
  const selectedCategoryMeta =
    ISSUE_CATEGORIES.find((c) => c.category === category) || ISSUE_CATEGORIES[0];

  const handleLocationSelect = (locName: string) => {
    const cleanLocality = extractLocalityFromDisplay(locName);
    setLocation(cleanLocality);
    const match = THOOTHUKUDI_LOCATIONS.find((l) => l.name === cleanLocality);
    if (match) {
      setWard(match.ward);
      setCoords({
        lat: match.lat,
        lng: match.lng,
        mapX: match.mapX,
        mapY: match.mapY,
      });
    }
  };

  const applyDetectionToForm = (det: AIVoiceDetection) => {
    setCategory(det.category);
    setPriority(det.priority);
    setTitle(det.issue);
    setDescription(det.description);
    handleLocationSelect(det.locality || det.location);
    if (det.category === 'Water Leakage' || det.category === 'Drainage') {
      setImageUrl(ASSETS.waterLeak);
    } else if (det.category === 'Road Damage') {
      setImageUrl(ASSETS.roadPothole);
    } else if (det.category === 'Street Light' || det.category === 'Electricity') {
      setImageUrl(ASSETS.streetLight);
    }
  };

  const analyzeTranscriptWithGemini = async (textToAnalyze: string) => {
    const cleanText = textToAnalyze.trim();
    if (!cleanText) {
      setErrorMsg('No recognized speech text to analyze. Please tap the ORB and speak.');
      return;
    }

    setErrorMsg('');
    setConfirmedBanner(null);
    setIsAnalyzingVoice(true);
    setIsEditingExtracted(false);
    setIsUserConfirmed(false);

    try {
      const response = await fetch('/api/voice-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: cleanText }),
      });

      if (!response.ok) {
        throw new Error('Voice analysis endpoint error');
      }

      const data = await response.json();
      const fallback = clientFallbackUnderstand(cleanText);
      const detCategory = (data.category as IssueCategory) || fallback.category;
      const detDept = data.assignedDepartment || getDepartmentForCategory(detCategory);
      const detOfficial = data.officialTitle || getOfficialForDepartment(detDept);
      const detLocality = extractLocalityFromDisplay(
        data.locality || data.location || fallback.locality
      );
      const detIssue = data.issue || data.title || fallback.issue;

      const detection: AIVoiceDetection = {
        transcript: cleanText,
        issue: detIssue,
        location: detLocality,
        locality: detLocality,
        category: detCategory,
        description: data.description || fallback.description,
        priority: (data.priority as PriorityLevel) || fallback.priority,
        assignedDepartment: detDept,
        officialTitle: detOfficial,
      };

      setAiDetection(detection);
      applyDetectionToForm(detection);
    } catch {
      const detection = clientFallbackUnderstand(cleanText);
      setAiDetection(detection);
      applyDetectionToForm(detection);
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const transcribeAudioWithWhisper = async (
    audioBlob: Blob,
    mimeType: string,
    capturedSpeech: string
  ) => {
    setIsTranscribingWhisper(true);
    setErrorMsg('');
    setMicPermissionError('');

    try {
      const audioBase64 = audioBlob.size > 0 ? await blobToBase64(audioBlob) : '';
      const serverResp = await fetch('/api/whisper-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: mimeType || audioBlob.type || 'audio/webm',
          browserTranscript: capturedSpeech,
        }),
      });

      const serverData = await serverResp.json();
      if (!serverResp.ok) {
        throw new Error(
          serverData?.error || 'Failed to transcribe recorded audio with Whisper.'
        );
      }

      const recognizedText = (serverData.text || '').trim();

      if (!recognizedText) {
        setErrorMsg(
          'No speech was detected in your recording. Please tap the ORB, speak clearly into the microphone, and tap the ORB again to stop.'
        );
        setIsTranscribingWhisper(false);
        return;
      }

      // Step 1: Display exact recognized text
      setVoiceTranscript(recognizedText);
      setIsTranscribingWhisper(false);

      // Step 2: Send recognized text to existing Gemini AI
      await analyzeTranscriptWithGemini(recognizedText);
    } catch (err: any) {
      setIsTranscribingWhisper(false);
      setErrorMsg(
        err?.message ||
          'Speech-to-text transcription failed. Please check your microphone and try again.'
      );
    }
  };

  const startRecordingMicrophone = async () => {
    setErrorMsg('');
    setMicPermissionError('');
    setConfirmedBanner(null);
    setAiDetection(null);
    liveSpeechRef.current = '';

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setMicPermissionError(
        'Microphone recording is not supported in this browser environment. Please use a modern browser with microphone support.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      isRecordingRef.current = true;

      // Start parallel continuous microphone speech capture (strictly controlled by manual ORB stop)
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.lang = 'en-IN';
          recognition.continuous = true;
          recognition.interimResults = true;

          let accumulatedFinal = '';
          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const seg = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                accumulatedFinal += seg + ' ';
              } else {
                interim += seg;
              }
            }
            liveSpeechRef.current = (accumulatedFinal + interim).trim();
          };

          recognition.onend = () => {
            // Keep listening until the user manually taps the ORB to stop
            if (isRecordingRef.current) {
              try {
                recognition.start();
              } catch {
                // ignore restart error
              }
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch {
          // ignore if speech recognition unavailable
        }
      }

      const supportedMime = getSupportedAudioMimeType();
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        isRecordingRef.current = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
          recognitionRef.current = null;
        }
        // Stop all microphone tracks immediately when recording stops
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        const mimeType = recorder.mimeType || supportedMime || 'audio/webm';
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const capturedSpeech = liveSpeechRef.current.trim();
        audioChunksRef.current = [];

        if (recordedBlob.size === 0 && !capturedSpeech) {
          setErrorMsg('Recorded audio was empty. Please tap the ORB and speak before stopping.');
          return;
        }

        await transcribeAudioWithWhisper(recordedBlob, mimeType, capturedSpeech);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Collect audio chunks every 250ms; never stops until user taps ORB again
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      isRecordingRef.current = false;
      setIsRecording(false);
      const errName = err?.name || '';
      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errName === 'SecurityError'
      ) {
        setMicPermissionError(
          'Microphone permission was denied. Please allow microphone access in your browser address bar and tap the ORB again.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setMicPermissionError(
          'No microphone device was found. Please connect a microphone and try again.'
        );
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setMicPermissionError(
          'Your microphone is currently in use by another application. Please close other apps using the mic and try again.'
        );
      } else {
        setMicPermissionError(
          err?.message ||
            'Unable to access the microphone. Please check your browser microphone permissions.'
        );
      }
    }
  };

  const stopRecordingMicrophone = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      }
    }
  };

  // Strict manual START / STOP toggle on ORB tap
  const handleOrbTap = () => {
    if (isTranscribingWhisper || isAnalyzingVoice) {
      return;
    }
    if (isRecording) {
      stopRecordingMicrophone();
    } else {
      startRecordingMicrophone();
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const handleExtractedFieldChange = (
    field: keyof AIVoiceDetection,
    value: string
  ) => {
    if (!aiDetection) return;
    const updated: AIVoiceDetection = { ...aiDetection, [field]: value };

    if (field === 'category') {
      const newCat = value as IssueCategory;
      const newDept = getDepartmentForCategory(newCat);
      updated.category = newCat;
      updated.assignedDepartment = newDept;
      updated.officialTitle = getOfficialForDepartment(newDept);
    } else if (field === 'location') {
      updated.location = value;
      updated.locality = extractLocalityFromDisplay(value);
    } else if (field === 'priority') {
      updated.priority = value as PriorityLevel;
    }

    setAiDetection(updated);
    applyDetectionToForm(updated);
  };

  const handleToggleEditCard = () => {
    const next = !isEditingExtracted;
    setIsEditingExtracted(next);
    if (next) {
      setTimeout(() => {
        issueInputRef.current?.focus();
      }, 50);
    }
  };

  const handleSendExtractedReport = async () => {
    if (!aiDetection) return;
    if (!isUserConfirmed) {
      setErrorMsg('Please confirm the extracted report details before sending.');
      return;
    }

    setErrorMsg('');
    setIsSendingVoiceReport(true);

    try {
      const cleanLocality = extractLocalityFromDisplay(aiDetection.location);
      const locObj =
        THOOTHUKUDI_LOCATIONS.find((l) => l.name === cleanLocality) ||
        THOOTHUKUDI_LOCATIONS[0];
      const dept =
        aiDetection.assignedDepartment.trim() ||
        getDepartmentForCategory(aiDetection.category);

      const createdId = await onSubmitReport(
        {
          title: (aiDetection.issue || `${aiDetection.category} in ${locObj.name}`).slice(0, 200),
          description: (aiDetection.description || aiDetection.transcript).slice(0, 2000),
          category: aiDetection.category,
          priority: aiDetection.priority,
          location: locObj.name,
          ward: locObj.ward,
          coordinates: {
            lat: locObj.lat,
            lng: locObj.lng,
            mapX: locObj.mapX,
            mapY: locObj.mapY,
          },
          observedAt,
          reporterId: user.id,
          userId: user.id,
          reporterName: user.name,
          imageUrl,
          assignedDepartment: dept,
          assignedCrew: 'Unassigned',
          isOfflineQueued: !isOnline,
        },
        { stayOnScreen: true }
      );

      setConfirmedBanner({
        issue: aiDetection.issue,
        department: dept,
        officialTitle: getOfficialForDepartment(dept),
        category: aiDetection.category,
        location: locObj.name,
        priority: aiDetection.priority,
        reportId: typeof createdId === 'string' ? createdId : undefined,
      });
      setIsEditingExtracted(false);
    } finally {
      setIsSendingVoiceReport(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(8, Math.min(92, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.max(10, Math.min(90, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    const lat = Number((8.74 + (100 - yPct) * 0.0008).toFixed(4));
    const lng = Number((78.08 + xPct * 0.001).toFixed(4));
    setCoords({ lat, lng, mapX: xPct, mapY: yPct });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalTitle = (
      title.trim() || `${category} issue reported at ${location}`
    ).slice(0, 200);
    const finalDesc = (
      description.trim() ||
      `Resident field observation logged for ${category.toLowerCase()} at ${location} (${ward}), Thoothukudi.`
    ).slice(0, 2000);

    if (!location.trim()) {
      setErrorMsg('Please select or enter a Thoothukudi location so crews can locate the issue.');
      return;
    }

    onSubmitReport({
      title: finalTitle,
      description: finalDesc,
      category,
      priority,
      location: location.trim().slice(0, 200),
      ward: ward.trim().slice(0, 120),
      coordinates: coords,
      observedAt,
      reporterId: user.id,
      userId: user.id,
      reporterName: user.name,
      imageUrl,
      assignedDepartment: routedDepartment,
      assignedCrew: 'Unassigned',
      isOfflineQueued: !isOnline,
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-14 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Thoothukudi Civic Intake · AI Voice ORB & Municipal Dispatch
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Report a Civic Issue in Thoothukudi
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Tap the glowing AI Voice ORB to record your complaint, transcribe with OpenAI Whisper, and extract details with Gemini AI.
          </p>
        </div>

        {!isOnline && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Offline Queue Mode Active</span>
          </div>
        )}
      </div>

      {/* AI Voice ORB Experience Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white p-6 sm:p-8 shadow-xl space-y-6">
        {/* Ambient radial background glow */}
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${
            isRecording
              ? 'bg-rose-500/30 scale-110'
              : isTranscribingWhisper || isAnalyzingVoice
              ? 'bg-indigo-500/30 scale-105'
              : 'bg-sky-500/20 scale-100'
          }`}
        />

        {/* Header Strip */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-400/30 text-xs font-semibold text-sky-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Voice ORB</span>
            </span>
            <span className="text-xs text-slate-400">
              Tap ORB (Start) → Speak → Tap ORB (Stop) → OpenAI Whisper → Gemini AI → Edit / Send
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            OpenAI Whisper STT + Gemini AI
          </span>
        </div>

        {/* Centerpiece Glowing ORB */}
        <div className="relative z-10 flex flex-col items-center justify-center py-4 text-center">
          <div className="relative flex items-center justify-center">
            {/* Outer glowing halo rings */}
            <div
              className={`absolute w-44 h-44 rounded-full transition-all duration-500 ${
                isRecording
                  ? 'bg-rose-500/30 animate-ping'
                  : isTranscribingWhisper || isAnalyzingVoice
                  ? 'bg-indigo-500/25 animate-pulse scale-110'
                  : 'bg-sky-500/15 animate-pulse'
              }`}
            />
            <div
              className={`absolute w-36 h-36 rounded-full border transition-all duration-500 ${
                isRecording
                  ? 'border-rose-400/70 bg-rose-500/20 scale-110'
                  : isTranscribingWhisper || isAnalyzingVoice
                  ? 'border-indigo-400/60 bg-indigo-500/15 animate-spin'
                  : 'border-sky-400/40 bg-sky-500/10'
              }`}
            />

            {/* Main interactive ORB button: Strictly toggles START and STOP */}
            <button
              type="button"
              onClick={handleOrbTap}
              disabled={isTranscribingWhisper || isAnalyzingVoice}
              aria-label={isRecording ? 'Stop recording voice' : 'Start recording voice'}
              className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none disabled:opacity-75 disabled:cursor-wait ${
                isRecording
                  ? 'bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 shadow-[0_0_60px_rgba(244,63,94,0.9)] scale-105 ring-4 ring-rose-300/60'
                  : isTranscribingWhisper || isAnalyzingVoice
                  ? 'bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 shadow-[0_0_55px_rgba(99,102,241,0.85)] ring-4 ring-indigo-300/50'
                  : 'bg-gradient-to-br from-sky-400 via-sky-600 to-indigo-700 shadow-[0_0_45px_rgba(14,165,233,0.7)] hover:shadow-[0_0_65px_rgba(56,189,248,0.95)] hover:scale-105 ring-2 ring-sky-300/40'
              }`}
            >
              {isTranscribingWhisper || isAnalyzingVoice ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : isRecording ? (
                <Square className="w-9 h-9 text-white fill-white animate-pulse" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
              <span className="mt-1.5 text-[10px] font-bold tracking-wider uppercase text-white/95">
                {isRecording
                  ? 'Tap to Stop'
                  : isTranscribingWhisper
                  ? 'Whisper STT'
                  : isAnalyzingVoice
                  ? 'Gemini AI'
                  : 'Tap to Start'}
              </span>
            </button>
          </div>

          {/* Dynamic State Indicator */}
          <div className="mt-6 min-h-[2.5rem] flex flex-col items-center justify-center gap-1.5">
            {isRecording ? (
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm font-semibold">
                <span className="flex items-end gap-1 h-3.5">
                  <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" />
                  <span className="w-1 h-3.5 bg-rose-300 rounded-full animate-pulse" />
                  <span className="w-1 h-2.5 bg-rose-400 rounded-full animate-bounce" />
                </span>
                <span>Listening... ({formatTimer(recordingSeconds)})</span>
                <span className="text-xs font-normal text-rose-300">
                  — Tap ORB again to stop
                </span>
              </div>
            ) : isTranscribingWhisper ? (
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-sm font-semibold">
                <Loader2 className="w-4 h-4 text-sky-300 animate-spin" />
                <span>Transcribing audio with OpenAI Whisper...</span>
              </div>
            ) : isAnalyzingVoice ? (
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-300 animate-spin" />
                <span>AI is understanding...</span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-300">
                Tap the ORB once to start recording your microphone, then tap the ORB again when finished speaking.
              </p>
            )}
          </div>
        </div>

        {/* Microphone Permission Error Banner */}
        {micPermissionError && (
          <div className="relative z-10 p-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Microphone Access Required</p>
              <p className="mt-0.5">{micPermissionError}</p>
            </div>
          </div>
        )}

        {/* Recognized Speech Text Box */}
        <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>Recognized Speech Text (OpenAI Whisper)</span>
              {isRecording && (
                <span className="text-[11px] font-mono text-rose-400 animate-pulse">
                  ● Recording live microphone audio...
                </span>
              )}
            </label>
            {voiceTranscript.trim() && !isRecording && (
              <button
                type="button"
                onClick={() => analyzeTranscriptWithGemini(voiceTranscript)}
                disabled={isAnalyzingVoice || isTranscribingWhisper}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-run Gemini AI</span>
              </button>
            )}
          </div>

          <textarea
            rows={2}
            value={voiceTranscript}
            onChange={(e) => setVoiceTranscript(e.target.value)}
            placeholder="Your exact recognized speech from OpenAI Whisper will appear here after you stop recording..."
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-700/80 bg-slate-950/90 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Extracted Report in an Editable Card */}
        {aiDetection && !isAnalyzingVoice && !isTranscribingWhisper && (
          <div className="relative z-10 rounded-xl border border-sky-500/40 bg-slate-900/95 p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  AI Extracted Civic Report {isEditingExtracted ? '(Editing Mode)' : ''}
                </h3>
              </div>
              <span className="text-xs font-mono text-sky-300">
                Review or edit fields below, confirm, and click Send Report
              </span>
            </div>

            {/* Structured Editable Grid matching required fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Issue */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Issue
                </label>
                {isEditingExtracted ? (
                  <input
                    ref={issueInputRef}
                    type="text"
                    value={aiDetection.issue}
                    onChange={(e) => handleExtractedFieldChange('issue', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-semibold rounded border border-sky-500/60 bg-slate-900 text-white focus:outline-none focus:border-sky-400"
                  />
                ) : (
                  <p className="text-sm font-bold text-white">{aiDetection.issue}</p>
                )}
              </div>

              {/* 2. Location */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Location
                </label>
                {isEditingExtracted ? (
                  <input
                    type="text"
                    list="thoothukudi-voice-locations"
                    value={aiDetection.location}
                    onChange={(e) => handleExtractedFieldChange('location', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-semibold rounded border border-sky-500/60 bg-slate-900 text-white focus:outline-none focus:border-sky-400"
                  />
                ) : (
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{aiDetection.location}</span>
                  </p>
                )}
                <datalist id="thoothukudi-voice-locations">
                  {THOOTHUKUDI_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name} />
                  ))}
                </datalist>
              </div>

              {/* 3. Category */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category
                </label>
                {isEditingExtracted ? (
                  <select
                    value={aiDetection.category}
                    onChange={(e) => handleExtractedFieldChange('category', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-semibold rounded border border-sky-500/60 bg-slate-900 text-white focus:outline-none focus:border-sky-400"
                  >
                    {ISSUE_CATEGORIES.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.category}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-sky-300">{aiDetection.category}</p>
                )}
              </div>

              {/* 4. Priority */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Priority
                </label>
                {isEditingExtracted ? (
                  <select
                    value={aiDetection.priority}
                    onChange={(e) => handleExtractedFieldChange('priority', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-semibold rounded border border-sky-500/60 bg-slate-900 text-white focus:outline-none focus:border-sky-400"
                  >
                    {(['Low', 'Medium', 'High', 'Critical'] as PriorityLevel[]).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-0.5">
                    <PriorityIndicator priority={aiDetection.priority} />
                  </div>
                )}
              </div>

              {/* 5. Department */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 sm:col-span-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Department
                </label>
                {isEditingExtracted ? (
                  <input
                    type="text"
                    value={aiDetection.assignedDepartment}
                    onChange={(e) =>
                      handleExtractedFieldChange('assignedDepartment', e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-semibold rounded border border-sky-500/60 bg-slate-900 text-white focus:outline-none focus:border-sky-400"
                  />
                ) : (
                  <div>
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>{aiDetection.assignedDepartment}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Official: {aiDetection.officialTitle}
                    </p>
                  </div>
                )}
              </div>

              {/* 6. Description */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 sm:col-span-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                {isEditingExtracted ? (
                  <textarea
                    rows={2}
                    value={aiDetection.description}
                    onChange={(e) => handleExtractedFieldChange('description', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded border border-sky-500/60 bg-slate-900 text-white focus:outline-none focus:border-sky-400"
                  />
                ) : (
                  <p className="text-sm text-slate-200">{aiDetection.description}</p>
                )}
              </div>
            </div>

            {/* Mandatory User Confirmation + [Edit] and [Send Report] Buttons */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isUserConfirmed}
                  onChange={(e) => {
                    setIsUserConfirmed(e.target.checked);
                    if (e.target.checked) setErrorMsg('');
                  }}
                  className="w-4 h-4 rounded border-slate-600 text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <span>
                  I confirm these extracted details are accurate and ready to send to{' '}
                  <strong className="text-sky-300">{aiDetection.assignedDepartment}</strong>
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleEditCard}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isEditingExtracted
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200 hover:bg-sky-500/30'
                      : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {isEditingExtracted ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Done Editing</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendExtractedReport}
                  disabled={isSendingVoiceReport}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isUserConfirmed
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/50'
                      : 'bg-emerald-600/80 text-white hover:bg-emerald-600'
                  }`}
                >
                  {isSendingVoiceReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Banner after Send */}
        {confirmedBanner && (
          <div className="relative z-10 p-5 rounded-xl border-2 border-emerald-500 bg-emerald-950/80 text-emerald-100 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Report submitted to {confirmedBanner.department}
                  </h3>
                  <p className="mt-1 text-xs text-emerald-200">
                    Issue <strong>“{confirmedBanner.issue}”</strong> ({confirmedBanner.category}) at{' '}
                    <strong>{confirmedBanner.location}</strong> saved to Firebase Firestore and dispatched to{' '}
                    <strong>{confirmedBanner.officialTitle}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('notifications')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>View Official Department Notification</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-dashboard')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-100 bg-slate-900 border border-emerald-700 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Open Department Assigned Reports</span>
              </button>
              {confirmedBanner.reportId && (
                <button
                  type="button"
                  onClick={() => onNavigate('report-details', confirmedBanner.reportId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:underline cursor-pointer"
                >
                  <span>Inspect Report Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Issue Category & Automatic Department Routing */}
        <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              01. Select Issue Category
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-700 dark:text-sky-300">
              <Building2 className="w-3.5 h-3.5" />
              <span>Auto-Routed Department: {routedDepartment}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ISSUE_CATEGORIES.map((item) => {
              const active = category === item.category;
              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => {
                    setCategory(item.category);
                    if (item.category === 'Water Leakage' || item.category === 'Drainage') {
                      setImageUrl(ASSETS.waterLeak);
                    } else if (item.category === 'Road Damage') {
                      setImageUrl(ASSETS.roadPothole);
                    } else if (item.category === 'Street Light' || item.category === 'Electricity') {
                      setImageUrl(ASSETS.streetLight);
                    }
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.category}</span>
                    <span className="text-[11px] font-mono tabular-nums text-sky-600 dark:text-sky-400">
                      {item.department}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Priority & Observation Date/Time */}
        <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            02. Priority Level & Observation Time
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as PriorityLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      priority === level
                        ? level === 'Critical'
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                          : level === 'High'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                          : 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {priority === 'Critical' &&
                  'Immediate safety hazard, main water burst, or live electrical line.'}
                {priority === 'High' &&
                  'Active road obstruction, deep pothole, or overflowing drainage.'}
                {priority === 'Medium' &&
                  'Standard municipal maintenance needed within 24–48 hours.'}
                {priority === 'Low' &&
                  'Minor upkeep or non-urgent civic maintenance.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date & Time Observed
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="datetime-local"
                  value={observedAt}
                  onChange={(e) => setObservedAt(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Thoothukudi Location & Interactive Street Map Picker */}
        <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                03. Thoothukudi Location & GPS Pin
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a Thoothukudi locality below or click the map grid to refine GPS coordinates.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              GPS: {coords.lat}° N, {coords.lng}° E
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {THOOTHUKUDI_LOCATIONS.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleLocationSelect(loc.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  location === loc.name
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:border-sky-500'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Thoothukudi Locality
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    value={
                      THOOTHUKUDI_LOCATIONS.some((l) => l.name === location)
                        ? location
                        : THOOTHUKUDI_LOCATIONS[0].name
                    }
                    onChange={(e) => handleLocationSelect(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  >
                    {THOOTHUKUDI_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Zone / Municipal Ward
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Interactive SVG Street Grid Map */}
            <div className="md:col-span-6">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950">
                <svg
                  viewBox="0 0 400 200"
                  onClick={handleMapClick}
                  className="w-full h-44 cursor-crosshair select-none"
                >
                  <rect width="400" height="200" className="fill-slate-100 dark:fill-slate-950" />
                  <rect x="15" y="15" width="95" height="65" rx="6" className="fill-emerald-500/15" />
                  <path
                    d="M 320 0 Q 345 100 390 200 L 400 200 L 400 0 Z"
                    className="fill-sky-500/20"
                  />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                  <line x1="0" y1="105" x2="400" y2="105" stroke="#94a3b8" strokeWidth="6" opacity="0.45" />
                  <line x1="0" y1="160" x2="400" y2="160" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                  <line x1="85" y1="0" x2="85" y2="200" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                  <line x1="190" y1="0" x2="190" y2="200" stroke="#94a3b8" strokeWidth="6" opacity="0.45" />
                  <line x1="285" y1="0" x2="285" y2="200" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                  <text x="12" y="99" className="fill-slate-500 text-[9px] font-mono">
                    PALAYAMKOTTAI RD
                  </text>
                  <text x="12" y="44" className="fill-slate-500 text-[9px] font-mono">
                    SIPCOT / 3RD MILE
                  </text>
                  <text x="292" y="44" className="fill-slate-500 text-[9px] font-mono">
                    BEACH RD
                  </text>
                  <circle
                    cx={(coords.mapX / 100) * 400}
                    cy={(coords.mapY / 100) * 200}
                    r="14"
                    className="fill-sky-500/25"
                  />
                  <circle
                    cx={(coords.mapX / 100) * 400}
                    cy={(coords.mapY / 100) * 200}
                    r="6"
                    className="fill-sky-600 stroke-white stroke-2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Issue Details & Photo Evidence Upload UI */}
        <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            04. Issue Title, Description & Photo Evidence
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Issue Title
            </label>
            <input
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g., ${category} near ${location}`}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Observation Description
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe the ${category.toLowerCase()} issue in ${location} so ${selectedCategoryMeta.department} field engineers can respond promptly...`}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Image Upload UI */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Field Photo Attachment (Helps crews bring the right repair tools)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Sample Photos:</span>
                <button
                  type="button"
                  onClick={() => setImageUrl(ASSETS.waterLeak)}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Water Leak
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => setImageUrl(ASSETS.roadPothole)}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Road Damage
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => setImageUrl(ASSETS.streetLight)}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Street Light
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="sm:col-span-7 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-sky-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-950/50"
              >
                <UploadCloud className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-2" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Click to upload a photo from your phone or computer
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Supports JPG, PNG, WebP · Auto-compressed for offline storage
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose Image File</span>
                </span>
              </div>

              <div className="sm:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 relative h-44">
                {imageUrl ? (
                  <>
                    <ResilientImage
                      src={imageUrl}
                      alt="Attached issue preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl(undefined)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                    No photo attached yet. Upload a file or select a sample photo above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('citizen-dashboard')}
            className="px-5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isOnline
                ? `Submit Report to ${routedDepartment}`
                : 'Save Report to Offline Queue'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
