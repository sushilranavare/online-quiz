import { useState } from 'react';
import OptionList from './OptionList';

export default function QuestionCard({ question, onAnswer }) {
    const [selectedOption, setSelectedOption] = useState(null);

    function handleSelectOption(index) {
        if (selectedOption !== null) return;
        
        setSelectedOption(index);
        const isCorrect = index === question.correctOption;
        
        // Delay before calling onAnswer to show feedback
        setTimeout(() => {
            onAnswer(question._id, index, isCorrect);
        }, 500);
    }

    return (
        <div className="question-card">
            <div className="question-header">
                <h2 className="question-text">{question.questionText}</h2>
            </div>
            
            <OptionList
                options={question.options}
                correctOption={question.correctOption}
                selectedOption={selectedOption}
                onSelect={handleSelectOption}
            />
        </div>
    );
}