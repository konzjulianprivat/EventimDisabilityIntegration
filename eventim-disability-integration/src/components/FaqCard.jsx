import React, { useState } from "react";
/**
 * FaqCard component: click to flip between question and answer.
 *
 * Props:
 * - question: string
 * - answer: string
 */
export default function FaqCard({ question, answer }) {
    const [flipped, setFlipped] = useState(false);

    const toggleFlip = () => setFlipped(prev => !prev);

    return (
        <div
            className="faq-card"
            onClick={toggleFlip}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleFlip(); }}
        >
            <div className={`faq-card-inner ${flipped ? 'flipped' : ''}`}>
                <div className="faq-card-front">
                    {question}
                </div>
                <div className="faq-card-back">
                    {answer}
                </div>
            </div>
        </div>
    );
}