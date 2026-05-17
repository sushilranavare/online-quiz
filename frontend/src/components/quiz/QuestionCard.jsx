import OptionList from './OptionList';

export default function QuestionCard({ question, selectedAnswer, onSelectAnswer }) {
  return (
    <div className="card question-card">
      <h3>{question.questionText}</h3>
      <OptionList options={question.options} selectedAnswer={selectedAnswer} onSelectAnswer={onSelectAnswer} />
    </div>
  );
}
