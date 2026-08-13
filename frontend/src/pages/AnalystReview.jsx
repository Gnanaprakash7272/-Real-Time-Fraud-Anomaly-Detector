import React, { useState } from 'react';
import ReviewQueue from '../components/ReviewQueue';
import TransactionInspector from '../components/TransactionInspector';

export default function AnalystReview({ transactions = [], onSubmitDecision, selectedTxn, onSelectTxn }) {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const handleOpenInspector = (txn) => {
    onSelectTxn(txn);
    setIsInspectorOpen(true);
  };

  return (
    <div style={{ width: '100%' }}>
      <ReviewQueue
        transactions={transactions}
        onSubmitDecision={onSubmitDecision}
        onSelectTxn={onSelectTxn}
        onOpenInspector={handleOpenInspector}
      />

      <TransactionInspector
        transaction={selectedTxn}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onSubmitDecision={onSubmitDecision}
      />
    </div>
  );
}
