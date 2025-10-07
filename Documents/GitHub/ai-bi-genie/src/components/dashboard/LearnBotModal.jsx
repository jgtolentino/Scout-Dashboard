import React, { useEffect, useState } from 'react';
import askCesClient from '@/lib/askCesClient';

const LearnBotModal = ({ context, apiEndpoint, steps: staticSteps, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [tutorialSteps, setTutorialSteps] = useState(staticSteps);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (apiEndpoint && !staticSteps) {
      const fetchTutorialSteps = async () => {
        try {
          setLoading(true);
          const response = await askCesClient.generateTutorial({ context });
          setTutorialSteps(response.steps);
        } catch (error) {
          console.error("Error fetching tutorial steps:", error);
          setTutorialSteps([{ title: "Error", description: "Could not load tutorial." }]);
        } finally {
          setLoading(false);
        }
      };
      fetchTutorialSteps();
    } else {
      setLoading(false);
    }
  }, [context, apiEndpoint, staticSteps]);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Loading Tutorial...</h2>
          <p>Please wait while we fetch the latest insights from Ask CES AI.</p>
        </div>
      </div>
    );
  }

  if (!tutorialSteps || tutorialSteps.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>No Tutorial Available</h2>
          <p>We couldn't find any tutorial steps for this context.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{step.title}</h2>
        <p>{step.description}</p>
        <div className="modal-navigation">
          {currentStep > 0 && (
            <button onClick={handlePrev}>Previous</button>
          )}
          <button onClick={handleNext}>
            {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default LearnBotModal; 