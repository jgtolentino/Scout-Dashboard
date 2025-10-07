/**
 * TagList.jsx
 * 
 * A component for displaying and managing prompt tags.
 * Supports filtering, adding, and removing tags.
 */

import React from 'react';

const TagList = ({ tags = [], onAddTag, onRemoveTag, editable = false }) => {
  const [newTag, setNewTag] = React.useState('');
  
  const handleAddTag = () => {
    if (newTag.trim() && onAddTag) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };
  
  const handleRemoveTag = (tag) => {
    if (onRemoveTag) {
      onRemoveTag(tag);
    }
  };
  
  return (
    <div className="tag-list">
      <div className="tags-container">
        {tags.length === 0 ? (
          <span className="no-tags">No tags</span>
        ) : (
          tags.map((tag, index) => (
            <span key={`tag-${index}`} className="tag">
              {tag}
              {editable && (
                <button 
                  className="remove-tag-button"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
      </div>
      
      {editable && (
        <div className="add-tag-container">
          <input
            type="text"
            className="add-tag-input"
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="add-tag-button"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default TagList;