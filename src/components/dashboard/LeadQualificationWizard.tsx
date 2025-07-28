import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface QualificationStep {
  id: string;
  title: string;
  description: string;
  questions: {
    id: string;
    text: string;
    type: 'boolean' | 'scale' | 'text';
    required: boolean;
    weight: number;
  }[];
}

interface LeadQualificationWizardProps {
  dealId: string;
  currentStage: number;
  stages: QualificationStep[];
  onComplete: (responses: Record<string, any>) => void;
  onSkip?: () => void;
}

export function LeadQualificationWizard({
  dealId,
  currentStage: initialStage,
  stages,
  onComplete,
  onSkip
}: LeadQualificationWizardProps) {
  const [currentStage, setCurrentStage] = useState(initialStage);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stage = stages[currentStage];
  const isLastStage = currentStage === stages.length - 1;
  const progress = ((currentStage + 1) / stages.length) * 100;

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error when user provides response
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateStage = () => {
    const newErrors: Record<string, string> = {};
    
    stage.questions.forEach(question => {
      if (question.required && !responses[question.id]) {
        newErrors[question.id] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStage()) return;

    if (isLastStage) {
      onComplete(responses);
    } else {
      setCurrentStage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStage > 0) {
      setCurrentStage(prev => prev - 1);
    }
  };

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{question.text}</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={responses[question.id] === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleResponse(question.id, true)}
                className="flex-1"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Yes
              </Button>
              <Button
                type="button"
                variant={responses[question.id] === false ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleResponse(question.id, false)}
                className="flex-1"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                No
              </Button>
            </div>
            {errors[question.id] && (
              <p className="text-sm text-red-500">{errors[question.id]}</p>
            )}
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{question.text}</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(value => (
                <Button
                  key={value}
                  type="button"
                  variant={responses[question.id] === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleResponse(question.id, value)}
                  className="w-10 h-10 p-0"
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Low</span>
              <span>High</span>
            </div>
            {errors[question.id] && (
              <p className="text-sm text-red-500">{errors[question.id]}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{question.text}</label>
            <textarea
              className={cn(
                "w-full px-3 py-2 bg-gray-800 rounded-md text-white",
                "placeholder-gray-400 focus:outline-none focus:ring-2",
                errors[question.id] ? "focus:ring-red-500" : "focus:ring-flash-green"
              )}
              rows={3}
              value={responses[question.id] || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder="Enter your response..."
            />
            {errors[question.id] && (
              <p className="text-sm text-red-500">{errors[question.id]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Lead Qualification</CardTitle>
          <Badge variant="outline">
            Stage {currentStage + 1} of {stages.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-flash-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h3 className="text-lg font-semibold">{stage.title}</h3>
        <CardDescription>{stage.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Questions */}
        {stage.questions.map((question) => (
          <div key={question.id}>
            {renderQuestion(question)}
          </div>
        ))}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            {currentStage > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
            {onSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
              >
                Skip
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={handleNext}
            variant={isLastStage ? "btcOrange" : "default"}
          >
            {isLastStage ? 'Complete Qualification' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}