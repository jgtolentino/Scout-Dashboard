import React, { useState } from 'react';
import LearnBotModal from './LearnBotModal';

const InteractiveTutorialCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="interactive-tutorial-card">
      <h3>Launch Interactive Tutorial</h3>
      <p>Get a guided tour of the Ask CES dashboard features.</p>
      <button onClick={() => setOpen(true)}>Launch Tutorial</button>

      {open && (
        <LearnBotModal
          // Switch context for Ask CES
          context="ask_ces_tutorial"
          // Point to the new Ask CES tutorial-generation endpoint
          apiEndpoint="/api/ask-ces/generate-tutorial"
          // Let the AI backend generate step definitions dynamically
          steps={undefined}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default InteractiveTutorialCard; 