
import React, { useState, memo } from 'react';
import { Coupon } from '../types';

interface CouponCardProps {
  coupon: Coupon;
  onVote: (id: string, newVote: 'up' | 'down' | null, previousVote: 'up' | 'down' | null) => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onVote }) => {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVote = (type: 'up' | 'down') => {
    const previousVote = voted;
    const newVote = voted === type ? null : type;
    
    setVoted(newVote);
    onVote(coupon.id, newVote, previousVote);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = coupon.upvotes - coupon.downvotes;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded uppercase tracking-wider mb-2">
            Active
          </span>
          <h3 className="text-lg font-bold text-gray-800 font-mono tracking-tight">{coupon.code}</h3>
        </div>
        <button 
          onClick={copyToClipboard}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {coupon.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleVote('up')}
            className={`flex items-center gap-1.5 transition-all p-1 rounded-md ${
              voted === 'up' 
                ? 'text-green-600 bg-green-50 scale-110' 
                : 'text-gray-400 hover:text-green-600 hover:bg-gray-50'
            }`}
            title={voted === 'up' ? "Remove Upvote" : "Upvote"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={voted === 'up' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-xs font-medium">{coupon.upvotes}</span>
          </button>
          
          <button 
            onClick={() => handleVote('down')}
            className={`flex items-center gap-1.5 transition-all p-1 rounded-md ${
              voted === 'down' 
                ? 'text-red-600 bg-red-50 scale-110' 
                : 'text-gray-400 hover:text-red-600 hover:bg-gray-50'
            }`}
            title={voted === 'down' ? "Remove Downvote" : "Downvote"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={voted === 'down' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-xs font-medium">{coupon.downvotes}</span>
          </button>
        </div>

        <div className="text-[10px] text-gray-400 font-medium italic">
          Score: {score > 0 ? `+${score}` : score}
        </div>
      </div>
    </div>
  );
};

export default memo(CouponCard);
