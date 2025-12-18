import React from 'react';
import { Award, Users } from 'lucide-react';
import Badge from './ui/Badge';
import Button from './ui/Button';

const NomineeCard = ({ nominee, onVote, disabled, showVoteButton = true }) => {
  return (
    <div className="group transition-all duration-300 hover:scale-[1.02]">
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        {/* Nominee Image */}
        <div className="relative h-32 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg mb-3 overflow-hidden">
          {nominee.image || nominee.logo ? (
            <img
              src={nominee.image || nominee.logo}
              alt={nominee.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Award className="w-12 h-12 text-primary-400" />
            </div>
          )}
        </div>

        {/* Nominee Info */}
        <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
          {nominee.name}
        </h3>
        
        {nominee.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {nominee.description}
          </p>
        )}

        {/* Vote Count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-primary-600">
            <Users className="w-4 h-4 mr-1" />
            <span className="text-lg font-bold">
              {nominee.voteCount || 0}
            </span>
            <span className="text-sm text-gray-600 ml-1">votes</span>
          </div>
          {nominee.position && (
            <Badge variant="primary">#{nominee.position}</Badge>
          )}
        </div>

        {/* Vote Button */}
        {showVoteButton && onVote && (
          <Button
            variant="primary"
            className="w-full"
            onClick={onVote}
            disabled={disabled}
          >
            {disabled ? 'Voting...' : 'Vote'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NomineeCard;