export default function OptionList({ options, correctOption, selectedOption, onSelect }) {
    return (
        <div className="option-list">
            {options.map((option, index) => {
                let className = 'option-btn';
                
                if (selectedOption !== null) {
                    if (index === correctOption) {
                        className += ' correct';
                    } else if (index === selectedOption) {
                        className += ' incorrect';
                    }
                }

                return (
                    <button
                        key={index}
                        onClick={() => onSelect(index)}
                        disabled={selectedOption !== null}
                        className={className}
                    >
                        <span className="option-label">{String.fromCharCode(65 + index)}</span>
                        <span className="option-text">{option}</span>
                    </button>
                );
            })}
        </div>
    );
}