export default function OptionList({ options, selectedAnswer, onSelectAnswer }) {
  return (
    <div className="option-list">
      {options.map((option) => (
        <label key={option} className="option-item">
          <input
            type="radio"
            name="answer"
            value={option}
            checked={selectedAnswer === option}
            onChange={() => onSelectAnswer(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
