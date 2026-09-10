import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  let className = 'badge-routine';
  let label = status;

  if (['EMERGENCY', 'HIGH', 'CRITICAL'].includes(normalized)) {
    className = 'badge-emergency';
    label = '🚨 EMERGENCY';
  } else if (['URGENT', 'SUBMITTED', 'IN_TRANSIT', 'SAMPLE_PENDING'].includes(normalized)) {
    className = 'badge-urgent';
    label = normalized.replace('_', ' ');
  } else if (['ROUTINE', 'ACCEPTED', 'COMPLETED', 'RELEASED', 'CONFIRMED', 'DISPENSED'].includes(normalized)) {
    className = 'badge-routine';
    label = normalized.replace('_', ' ');
  } else if (['SELF_CARE', 'DRAFT', 'REQUESTED'].includes(normalized)) {
    className = 'badge-selfcare';
    label = normalized.replace('_', ' ');
  }

  return (
    <span className={`badge ${className}`}>
      {label}
    </span>
  );
};
