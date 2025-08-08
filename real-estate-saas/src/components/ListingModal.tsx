'use client';

import { Dialog } from '@headlessui/react';
import { useState } from 'react';

export default function ListingModal({ isOpen, onClose, title, description }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl bg-white rounded p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold mb-2">{title}</Dialog.Title>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{description}</p>
          <button onClick={onClose} className="mt-4 text-blue-500 hover:underline">
            Close
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
