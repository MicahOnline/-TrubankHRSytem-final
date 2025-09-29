import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Exam, Role } from '../../types';
import * as api from '../utils/api';
import * as geminiService from '../../services/geminiService';
import { ClockIcon, AlertTriangleIcon, ShieldCheckIcon, EyeIcon } from '../../components/icons';
import ConfirmationModal from './ConfirmationModal';
import AlertModal from './AlertModal';

interface ExamTakingProps {
  examId: string;
  userId: number;
  onFinish: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  userRole: Role;
}

const MAX_VIOLATIONS = 3;

const ExamTaking: React.FC<ExamTakingProps> = ({ examId, userId, onFinish, addToast, userRole }) => {
    const [exam, setExam] = useState<Exam | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [answers, setAnswers] = useState<{ [key: string]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const storageKey = useMemo(() => `exam-progress-${userId}-${examId}`, [userId, examId]);

    // Anti-cheating state
    const [violations, setViolations] = useState(0);
    const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
    const [violationMessage, setViolationMessage] = useState('');
    const examContainerRef = useRef<HTMLDivElement>(null);
    
    // AI Proctoring State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // FIX: Changed NodeJS.Timeout to number for browser compatibility.
    const proctoringIntervalRef = useRef<number | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [aiProctoringStatus, setAiProctoringStatus] = useState('Initializing...');


    const handleSubmit = useCallback(async (isTimeUp = false, isViolation = false) => {
        if (!exam || isSubmitting) return; // Prevent multiple submissions
        setIsSubmitting(true);
        if (isConfirming) setIsConfirming(false);

        if (isViolation) {
            addToast("Exam terminated due to multiple rule violations. Your answers have been submitted.", 'error');
        } else if (isTimeUp) {
            addToast("Time's up! Your exam has been submitted automatically.", 'error');
        }

        try {
            const result = await api.submitExam(userId, exam.id, answers);
            if (!isTimeUp && !isViolation) {
                addToast(`Exam submitted! Your score: ${result.score}%. Status: ${result.status}`, result.status === 'Passed' ? 'success' : 'error');
            }
            sessionStorage.removeItem(storageKey);
            onFinish();
        } catch (error) {
            addToast('There was an error submitting your exam.', 'error');
            setIsSubmitting(false); // Allow retry if submission fails
        }
    }, [userId, exam, answers, addToast, onFinish, isConfirming, storageKey, isSubmitting]);
    
    const handleViolation = useCallback((message: string) => {
        setViolations(currentViolations => {
            const newViolations = currentViolations + 1;
            if (newViolations >= MAX_VIOLATIONS) {
                // Use a timeout to ensure the state update for `violations` is processed
                // before calling handleSubmit which relies on the component not re-rendering.
                setTimeout(() => handleSubmit(false, true), 0);
            } else {
                setViolationMessage(message);
                setIsViolationModalOpen(true);
            }
            return newViolations;
        });
    }, [handleSubmit]);


    useEffect(() => {
        const fetchAndResume = async () => {
            try {
                const examData = await api.getExam(examId);
                setExam(examData);

                const savedStateJSON = sessionStorage.getItem(storageKey);
                if (savedStateJSON) {
                    const savedState = JSON.parse(savedStateJSON);
                    const elapsedSeconds = Math.floor((Date.now() - savedState.startTime) / 1000);
                    const newTimeLeft = savedState.timeLeft - elapsedSeconds;

                    if (newTimeLeft > 0) {
                        setTimeLeft(newTimeLeft);
                        setAnswers(savedState.answers || {});
                        addToast('Exam progress restored.', 'success');
                    } else {
                        setAnswers(savedState.answers || {});
                        setTimeLeft(0);
                    }
                } else {
                    setTimeLeft(examData.duration * 60);
                    const initialState = {
                        answers: {},
                        timeLeft: examData.duration * 60,
                        startTime: Date.now()
                    };
                    sessionStorage.setItem(storageKey, JSON.stringify(initialState));
                }
            } catch (error) {
                addToast('Failed to load the exam.', 'error');
                onFinish();
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndResume();
    }, [examId, userId, storageKey, addToast, onFinish]);
    
    // AI Proctoring Setup
    useEffect(() => {
        if (isLoading) {
            return;
        }

        const setupCamera = async () => {
             if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraError("Your browser does not support camera access, which is required for this exam.");
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraReady(true);
                    setAiProctoringStatus('Secure');
                }
            } catch (err) {
                console.error("Camera access error:", err);
                let message = "An unexpected error occurred while accessing the camera. Please ensure it is not in use by another application and try again.";
                if (err instanceof DOMException) {
                    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        message = "Camera Not Found.\n\nWe couldn't detect a webcam. Please check that your camera is properly connected and not being used by another application. Once connected, please refresh the page to try again.";
                    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        message = "Camera Access Denied.\n\nProctoring requires camera permissions. Please enable camera access in your browser settings for this site, and then refresh the page.";
                    } else if (err.name === 'NotReadableError') {
                         message = "Camera In Use.\n\nYour webcam might be in use by another application. Please close any other programs using the camera (e.g., Zoom, Skype) and refresh the page.";
                    }
                }
                setCameraError(message);
            }
        };

        setupCamera();
        
        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };

    }, [isLoading]);
    
    const analyzeFrame = useCallback(async () => {
        if (!isCameraReady || !videoRef.current || !canvasRef.current || isSubmitting) return;

        setAiProctoringStatus('Analyzing...');
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64ImageData = canvas.toDataURL('image/jpeg').split(',')[1];
        
        try {
            const result = await geminiService.analyzeWebcamFrame(base64ImageData);
            if(result.isViolation) {
                handleViolation(result.reason);
            }
            setTimeout(() => setAiProctoringStatus('Secure'), 1000);
        } catch (error) {
            console.warn("AI Proctoring analysis failed:", error);
            setAiProctoringStatus('Secure'); // Revert status on error
        }
    }, [isCameraReady, handleViolation, isSubmitting]);

    // Anti-cheating measures effect
    useEffect(() => {
        if (isSubmitting || !isCameraReady) {
             if (proctoringIntervalRef.current) {
                clearInterval(proctoringIntervalRef.current);
                proctoringIntervalRef.current = null;
            }
            return;
        }
        
        // Start AI proctoring interval only when camera is ready
        if (isCameraReady && !proctoringIntervalRef.current) {
             proctoringIntervalRef.current = setInterval(analyzeFrame, 20000); // Analyze every 20 seconds
        }

        const requestFullScreen = () => {
            const elem = document.documentElement;
            if (elem.requestFullscreen && !document.fullscreenElement) {
                elem.requestFullscreen().catch(err => {
                    console.warn(`Could not enter fullscreen: ${err.message}`);
                    addToast("Fullscreen is required for this exam.", "error");
                });
            }
        };

        requestFullScreen();

        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                handleViolation("You have exited full-screen mode. This is against the exam rules.");
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation("You have switched to another tab or window. Please remain on the exam page.");
            }
        };

        const preventAction = (e: Event) => e.preventDefault();
        
        const container = examContainerRef.current;
        container?.addEventListener('contextmenu', preventAction);
        container?.addEventListener('copy', preventAction);
        container?.addEventListener('paste', preventAction);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            container?.removeEventListener('contextmenu', preventAction);
            container?.removeEventListener('copy', preventAction);
            container?.removeEventListener('paste', preventAction);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
             if (proctoringIntervalRef.current) {
                clearInterval(proctoringIntervalRef.current);
                proctoringIntervalRef.current = null;
            }
        };
    }, [addToast, handleSubmit, isSubmitting, isCameraReady, analyzeFrame, handleViolation]);


    // Timer and auto-submit effect
    useEffect(() => {
        if (isLoading || isSubmitting) return;

        if (timeLeft <= 0) {
            if (exam) { // Ensure exam is loaded before submitting
                 handleSubmit(true);
            }
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, exam, isLoading, isSubmitting, handleSubmit]);

    // Auto-save effect
    useEffect(() => {
        if (isLoading || isSubmitting) return;

        const saveState = () => {
            const stateToSave = {
                answers,
                timeLeft: timeLeft,
                startTime: Date.now()
            };
            sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
        };
        
        const intervalId = setInterval(saveState, 5000); // Save every 5 seconds

        return () => clearInterval(intervalId);
    }, [answers, timeLeft, isLoading, isSubmitting, storageKey]);


    const handleAnswerChange = (questionId: string, answerIndex: number) => {
        const newAnswers = { ...answers, [questionId]: answerIndex };
        setAnswers(newAnswers);
        const stateToSave = {
            answers: newAnswers,
            timeLeft: timeLeft,
            startTime: Date.now()
        };
        sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
    };
    
    const handleNext = () => {
        if (exam && currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleCloseViolationModal = () => {
        setIsViolationModalOpen(false);
        const elem = document.documentElement;
        if (elem.requestFullscreen && !document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                console.warn(`Could not re-enter fullscreen: ${err.message}`);
            });
        }
    };

    const formattedTime = useMemo(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, [timeLeft]);
    
    const ProctoringStatusIcon = () => {
        switch(aiProctoringStatus) {
            case 'Analyzing...': return <EyeIcon className="w-5 h-5 text-cyan-400 animate-pulse" />;
            case 'Secure': default: return <ShieldCheckIcon className="w-5 h-5 text-green-400" />;
        }
    };


    if (isLoading || !exam) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (cameraError) {
        return <AlertModal isOpen={true} onClose={onFinish} title="Camera Required" message={cameraError} />;
    }
    
    const currentQuestion = exam.questions[currentQuestionIndex];

    return (
        <>
            <div ref={examContainerRef} className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl animate-fadeInUp flex flex-col h-full max-h-[calc(100vh-4rem)] disable-selection">
                <header className="sticky top-0 z-20 bg-black/50 backdrop-blur-lg p-4 sm:p-6 border-b border-white/10 rounded-t-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
                            <p className="text-gray-400 mt-1">{exam.topic}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div role="status" className="flex items-center gap-2 text-gray-300 bg-black/30 px-3 py-2 rounded-lg text-sm font-semibold">
                                <ProctoringStatusIcon />
                                <span>AI Proctor: {aiProctoringStatus}</span>
                            </div>
                            {violations > 0 && (
                                 <div role="alert" className="flex items-center gap-2 text-yellow-400 bg-yellow-500/20 px-3 py-2 rounded-lg text-sm font-semibold">
                                    <AlertTriangleIcon className="w-5 h-5" />
                                    <span>Violations: {violations} / {MAX_VIOLATIONS - 1}</span>
                                </div>
                            )}
                            <div role="timer" aria-live="polite" aria-atomic="true" className={`flex items-center gap-3 text-2xl font-bold font-mono px-4 py-2 rounded-lg border ${timeLeft < 60 ? 'text-red-400 border-red-500/30 bg-red-500/20' : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/20'}`}>
                                <ClockIcon className="w-7 h-7" />
                                <span className="sr-only">{`${Math.floor(timeLeft / 60)} minutes and ${timeLeft % 60} seconds remaining`}</span>
                                <span aria-hidden="true">{formattedTime}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 space-y-8 overflow-y-auto flex-1">
                    {currentQuestion && (
                        <div key={currentQuestion.id} className="bg-white/5 p-5 rounded-lg border border-white/10 animate-fadeInUp">
                             <fieldset>
                                <legend className="font-semibold text-white mb-4">
                                    Question {currentQuestionIndex + 1}: <span className="font-normal">{currentQuestion.text}</span>
                                </legend>
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, optIndex) => (
                                        <label key={optIndex} className={`flex items-center p-3 rounded-md border-2 transition-all cursor-pointer ${answers[currentQuestion.id] === optIndex ? 'bg-emerald-500/30 border-emerald-400' : 'bg-black/30 border-transparent hover:border-white/20'}`}>
                                            <input
                                                type="radio"
                                                name={currentQuestion.id}
                                                checked={answers[currentQuestion.id] === optIndex}
                                                onChange={() => handleAnswerChange(currentQuestion.id, optIndex)}
                                                className="form-radio h-5 w-5 text-emerald-400 bg-gray-700 border-gray-600 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="ml-4 text-gray-200">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </div>
                    )}
                </main>

                <footer className="p-4 sm:p-6 border-t border-white/10 mt-auto">
                     <div className="flex justify-between items-center">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        
                        <p className="text-gray-400 text-sm font-medium" aria-live="polite">
                            Question {currentQuestionIndex + 1} of {exam.questions.length}
                        </p>

                        {currentQuestionIndex < exam.questions.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-2 bg-white/20 border border-white/30 rounded-lg text-sm font-semibold text-white hover:bg-white/30 transition-colors"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsConfirming(true)}
                                disabled={isSubmitting}
                                className="px-8 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 transform hover:scale-105"
                            >
                                Submit Exam
                            </button>
                        )}
                    </div>
                </footer>
            </div>
            
            <>
                <video ref={videoRef} autoPlay muted playsInline className="fixed bottom-4 left-4 w-32 h-24 sm:w-48 sm:h-36 rounded-lg border-2 border-emerald-500/50 shadow-2xl object-cover z-30" />
                <canvas ref={canvasRef} className="hidden"></canvas>
            </>
            
            <ConfirmationModal
                isOpen={isConfirming}
                onClose={() => setIsConfirming(false)}
                onConfirm={() => handleSubmit(false)}
                title="Submit Your Exam?"
                message="Are you sure you want to submit your answers? You will not be able to change them afterwards."
                confirmText="Submit"
                isConfirming={isSubmitting}
            />
            
            <AlertModal
                isOpen={isViolationModalOpen}
                onClose={handleCloseViolationModal}
                title="Exam Rule Violation"
                message={violationMessage}
            />


            <style>{`
                 .form-radio {
                    -webkit-appearance: none;
                    appearance: none;
                    transition: all 0.2s;
                    border-radius: 50%;
                }
                .form-radio:checked {
                    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
                }
                .disable-selection {
                    -webkit-user-select: none; /* Safari */
                    -ms-user-select: none; /* IE 10+ */
                    user-select: none; /* Standard syntax */
                }
            `}</style>
        </>
    );
};

export default ExamTaking;