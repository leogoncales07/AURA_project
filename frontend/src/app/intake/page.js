'use client';
import { ArrowUpDown, CheckCircle2, Sparkles } from 'lucide-react';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Button from '@/components/Button';

import StaggeredEntrance from '@/components/StaggeredEntrance';

const STEPS = [
  {
    id: 'energy',
    question: 'how does your energy feel today?',
    options: [
      { text: 'radiant and flowing', value: 'high' },
      { text: 'balanced and steady', value: 'mid' },
      { text: 'cloudy and slow', value: 'low' },
      { text: 'heavy and depleted', value: 'severe' }
    ]
  },
  {
    id: 'sleep',
    question: 'describe your recent sleep patterns.',
    options: [
      { text: 'deep and restorative', value: 'good' },
      { text: 'mostly stable', value: 'ok' },
      { text: 'fragmented and short', value: 'poor' },
      { text: 'restless and difficult', value: 'insomnia' }
    ]
  },
  {
    id: 'focus',
    question: 'what is your primary focus here?',
    options: [
      { text: 'emotional balance', value: 'balance' },
      { text: 'deeper sleep', value: 'sleep' },
      { text: 'mental clarity', value: 'focus' },
      { text: 'managing stress', value: 'stress' }
    ]
  },
  {
    id: 'presence',
    question: 'how connected do you feel to the present moment?',
    options: [
      { text: 'fully grounded', value: 'full' },
      { text: 'somewhat distracted', value: 'partial' },
      { text: 'drifting and distant', value: 'none' }
    ]
  }
];

export default function IntakePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [direction, setDirection] = useState('entering'); // entering, leaving
  const currentStepData = STEPS[currentStep];

  const handleNext = useCallback((value) => {
    setSelectedOption(value);
    setAnswers(prev => ({ ...prev, [currentStepData.id]: value }));

    // Delay for micro-animation
    setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setDirection('leaving');
        
        // Wait for exit animation
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
          setDirection('entering');
          setSelectedOption(null);
        }, 400);
      } else {
        setIsFinishing(true);
      }
    }, 450);
  }, [currentStep, currentStepData]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection('leaving');
      setCurrentStep(prev => prev - 1);
      setSelectedOption(null);
    }
  }, [currentStep]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinishing) return;

      const options = currentStepData.options;
      const currentIndex = options.findIndex(opt => opt.value === selectedOption);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (currentIndex + 1) % options.length;
        setSelectedOption(options[nextIdx].value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = (currentIndex - 1 + options.length) % options.length;
        setSelectedOption(options[prevIdx].value);
      } else if (e.key === 'Enter' && selectedOption) {
        e.preventDefault();
        handleNext(selectedOption);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepData, selectedOption, handleNext, isFinishing]);

  const progressWidth = ((currentStep + 1) / STEPS.length) * 100;

  if (isFinishing) {
    return (
      <div className={styles.finalReveal}>
        <div className={styles.summaryCard}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div className="icon-circle" style={{ background: 'rgba(142, 207, 176, 0.1)', color: 'var(--aura-aurora-3)' }}>
              <CheckCircle2 size={32} />
            </div>
          </div>
          <h2 className={styles.summaryTitle}>your sanctuary is ready.</h2>
          <p className={styles.summaryDesc}>
            we've tuned aura to your frequency. your journey to mental clarity and emotional balance begins now.
          </p>
          <Button 
            variant="primary" 
            style={{ width: '100%' }}
            onClick={() => router.push('/dashboard')}
          >
            enter my space
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div 
        className={styles.progressBar} 
        style={{ width: `${progressWidth}%` }} 
      />

      <main className={styles.contentWrapper}>
        <div 
          className={`${styles.slideContainer} ${direction === 'entering' ? styles.slideIn : styles.slideOut}`}
        >
          <div className="fade-up-stagger">
            <h1 className={styles.questionText}>
              {currentStepData.question}
            </h1>

            <StaggeredEntrance className={styles.optionsGrid} style={{ marginTop: '48px' }}>
              {currentStepData.options.map((option, idx) => (
                <button
                  key={option.value}
                  className={`${styles.optionCard} ${selectedOption === option.value ? styles.optionSelected : ''}`}
                  onClick={() => handleNext(option.value)}
                  onMouseEnter={() => setSelectedOption(option.value)}
                >
                  <span className={styles.optionKey}>
                    {idx + 1}
                  </span>
                  <span className={styles.optionText}>
                    {option.text}
                  </span>
                </button>
              ))}
            </StaggeredEntrance>
          </div>
        </div>

        <div className={styles.navHint}>
          <ArrowUpDown size={14} />
          <span>↑↓ to navigate · enter to select</span>
        </div>
      </main>
    </div>
  );
}
