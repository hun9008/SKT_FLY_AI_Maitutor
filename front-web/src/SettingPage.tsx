import { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from './WebSocketContext';
import QrPage from './QrPage';
import CameraPage from './camera.tsx';
import PCControlPage from './PCControlPage.tsx';
import StudyGoals from './StudyGoals.tsx';
import LoadingPage from './LoadingPage';
import OcrResultPage from './OcrCheck.tsx';

interface Step {
  id: string;
  title: string;
}

const steps: Step[] = [
  { id: 'webcam', title: '웹캠 설정' },
  { id: 'qr', title: '모바일 연결' },
  { id: 'mobcam', title: '모바일 카메라 설정' },
  { id: 'goals', title: '공부 목표 설정' },
  { id: 'ocr-check', title: 'OCR 결과 확인' },
  { id: 'complete', title: '설정 완료' },
];

function SettingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  // console.log("currentStep: ", currentStep)
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoalsSubmitted, setIsGoalsSubmitted] = useState(false);
  const [isOcrSubmitted, setIsOcrSubmitted] = useState(false);
  const navigate = useNavigate();
  const { solutionResponse } = useWebSocket();

  const updateCompletedSteps = (stepIndex: number) => {
    const newCompleted: Record<string, boolean> = {};
    steps.forEach((step, index) => {
      if (index < stepIndex) {
        newCompleted[step.id] = true;
      }
    });
    setCompleted(newCompleted);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      updateCompletedSteps(nextStepIndex);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      updateCompletedSteps(prevStepIndex);
    }
  };

  const handleGoalsSubmit = () => {
    setIsGoalsSubmitted(true);
    nextStep();
  };

  const handleOcrSubmit = () => {
    setIsOcrSubmitted(true);
    nextStep();
  };

  const goToGamePage = () => {
    if (!solutionResponse) {
      setIsLoading(true);
    } else {
      navigate('/game');
    }
  };

  useEffect(() => {
    if (isLoading && solutionResponse) {
      setIsLoading(false);
      navigate('/game');
    }
  }, [solutionResponse, isLoading, navigate]);

  const renderStepContent = (step: Step) => {
    switch (step.id) {
      case 'webcam':
        return <CameraPage />;
      case 'qr':
        return <QrPage />;
      case 'mobcam':
        return <PCControlPage />;
      case 'goals':
        return (
          <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-lg text-white mb-6">
              오늘의 공부 목표를 설정하고, 집중할 준비를 해보세요!
            </p>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <StudyGoals onGoalsSubmit={handleGoalsSubmit} />
            </div>
          </div>
        );
      case 'ocr-check':
        return <OcrResultPage onOcrSubmit={handleOcrSubmit} />;
      case 'complete':
        return (
          <p>모든 설정이 완료되었습니다. 공부를 시작할 준비가 되었습니다.</p>
        );
      default:
        return null;
    }
  };
  

  if (isLoading) {
    return <LoadingPage />;
  }

  const isNextButtonDisabled =
    (currentStep === 3 && !isGoalsSubmitted) ||
    (currentStep === 4 && !isOcrSubmitted);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">스터디 설정</h1>
      <div className="mb-8 overflow-x-auto">
        <ol className="flex items-center whitespace-nowrap min-w-full">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-center flex-shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index <= currentStep
                    ? 'bg-primary-400 border-primary-400 text-white'
                    : 'border-gray-300'
                }`}
              >
                {completed[step.id] ? <Check size={16} /> : index + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  index <= currentStep
                    ? 'text-primary-400 font-medium'
                    : 'text-gray-300'
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight
                  className="mx-2 text-gray-400 flex-shrink-0"
                  size={16}
                />
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white shadow rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {steps[currentStep].title}
        </h2>
        {renderStepContent(steps[currentStep])}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 disabled:opacity-50"
        >
          이전
        </button>
        {currentStep !== 3 && (
          <button
            onClick={currentStep === steps.length - 1 ? goToGamePage : nextStep}
            disabled={isNextButtonDisabled}
            className={`px-4 py-2 ${
              isNextButtonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-400 text-white hover:bg-primary-500'
            } rounded-2xl`}
          >
            {currentStep === steps.length - 1 ? '완료' : '다음'}
          </button>
        )}
      </div>
    </div>
  );
}

export default SettingPage;
