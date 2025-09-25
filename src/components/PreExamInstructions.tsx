import React from 'react';
import { Exam } from '../../types';
import { ClockIcon, BookOpenIcon, AlertTriangleIcon } from '../../components/icons';

interface PreExamInstructionsProps {
    exam: Exam;
    onStart: () => void;
}

const PreExamInstructions: React.FC<PreExamInstructionsProps> = ({ exam, onStart }) => {
    const rules = [
        "Ensure you have a stable internet connection.",
        "This is a timed exam. It will submit automatically when time runs out.",
        "Do not refresh the page or use the browser's back/forward buttons.",
        "Switching to other tabs or applications is not permitted and may be flagged.",
        "Copying and pasting text is disabled."
    ];

    return (
        <div className="flex justify-center items-center h-full animate-fadeInUp">
            <div className="w-full max-w-2xl bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
                <BookOpenIcon className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">{exam.title}</h1>
                <p className="text-gray-400 mb-6">{exam.topic}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left my-8">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <ClockIcon className="w-8 h-8 text-emerald-300 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Duration</p>
                            <p className="text-gray-300">{exam.duration} minutes</p>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <BookOpenIcon className="w-8 h-8 text-emerald-300 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Questions</p>
                            <p className="text-gray-300">{exam.questions.length} multiple-choice</p>
                        </div>
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-left">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangleIcon className="w-6 h-6 text-red-300" />
                        <h3 className="text-lg font-bold text-white">Important Rules</h3>
                    </div>
                    <ul className="space-y-2 text-red-200/90 list-disc list-inside">
                        {rules.map((rule, index) => (
                            <li key={index}>{rule}</li>
                        ))}
                    </ul>
                </div>
                
                <button
                    onClick={onStart}
                    className="mt-8 w-full max-w-xs mx-auto bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 text-lg transform hover:scale-105"
                >
                    Start Exam
                </button>
            </div>
        </div>
    );
};

export default PreExamInstructions;