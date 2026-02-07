	import React from 'react';
	import { FileText, PlusCircle, CheckCircle } from 'lucide-react';
	function QuestionCard({ question, onGenerateSimilar }) {
	  return (
	    <div className="question-card">
	      <div className="card-header">
	        <span className={`badge ${question.difficulty === '容易' ? 'badge-easy' : 'badge-hard'}`}>
	          {question.subject} · {question.difficulty}
	        </span>
	        <span className="date">{question.date}</span>
	      </div>
	      <div className="card-body">
	        <div className="question-text">
	          <FileText size={16} />
	          <p>{question.question}</p>
	        </div>
	        {question.isWrong && (
	          <div className="wrong-mark">
	            <CheckCircle size={16} className="icon-wrong" />
	            <span>易错点：{question.analysis}</span>
	          </div>
	        )}
	        {/* 变题生成按钮 */}
	        <button 
	          className="btn-generate" 
	          onClick={() => onGenerateSimilar(question.id)}
	        >
	          <PlusCircle size={16} />
	          生成相似变题
	        </button>
	        {/* 相似题展示 */}
	        {question.similarQuestions && question.similarQuestions.length > 0 && (
	          <div className="similar-list">
	            <h4>推荐练习：</h4>
	            {question.similarQuestions.map((similar, idx) => (
	              <div key={idx} className="similar-item">
	                {similar}
	              </div>
	            ))}
	          </div>
	        )}
	      </div>
	    </div>
	  );
	}
	export default QuestionCard;