'use client';

import React, { useState, useEffect } from 'react';

interface SESMessage {
  Id: string;
  Region: string;
  Destination?: {
    ToAddresses?: string[];
  };
  Source: string;
  Subject?: string;
  Body?: {
    text_part: string | null;
    html_part: string | null;
  };
  RawData?: string;
  Timestamp: string;
}

export default function SESMessageList() {
  const [messages, setMessages] = useState<SESMessage[]>([]);
  const [filterEmail, setFilterEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [filterEmail]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when itemsPerPage changes
  }, [itemsPerPage]);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = filterEmail
        ? `/api/ses/get?email=${encodeURIComponent(filterEmail)}`
        : '/api/ses/get';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch SES messages');
      }
      const data = await response.json();
      const sortedMessages = sortMessagesByDate(data.messages, sortOrder);
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching SES messages:', error);
      setError('Failed to fetch SES messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sortMessagesByDate = (msgs: SESMessage[], order: 'desc' | 'asc') => {
    return [...msgs].sort((a, b) => {
      const dateA = new Date(a.Timestamp).getTime();
      const dateB = new Date(b.Timestamp).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterEmail(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    setMessages(sortMessagesByDate(messages, newOrder));
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
  };

  const getRecipients = (message: SESMessage) => {
    if (message.Destination?.ToAddresses) {
      return message.Destination.ToAddresses.join(', ');
    }
    if (message.RawData) {
      const toMatch = message.RawData.match(/To: (.+?)(?=\r\n|\n)/);
      return toMatch ? toMatch[1] : 'N/A';
    }
    return 'N/A';
  };

  const getSubject = (message: SESMessage) => {
    if (message.Subject) {
      return message.Subject;
    }
    if (message.RawData) {
      const subjectMatch = message.RawData.match(/Subject: (.+?)(?=\r\n|\n)/);
      if (subjectMatch) {
        const encodedSubject = subjectMatch[1];
        if (encodedSubject.startsWith('=?UTF-8?B?')) {
          return decodeURIComponent(escape(atob(encodedSubject.replace(/=\?UTF-8\?B\?(.+?)\?=/, "$1"))));
        }
        return encodedSubject;
      }
    }
    return 'N/A';
  };

  const getBody = (message: SESMessage) => {
    if (message.Body?.text_part) {
      return message.Body.text_part;
    }
    if (message.Body?.html_part) {
      return message.Body.html_part;
    }
    if (message.RawData) {
      const bodyMatch = message.RawData.match(/Content-Transfer-Encoding: base64\r\n\r\n(.+?)(\r\n----|\r\n\r\n)/s);
      if (bodyMatch) {
        try {
          return decodeURIComponent(escape(atob(bodyMatch[1].replace(/\r\n/g, ''))));
        } catch (error) {
          console.error('Error decoding body:', error);
          return 'Error decoding body';
        }
      }
    }
    return 'N/A';
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = messages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(messages.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md text-gray-800">
      <h2 className="text-xl font-semibold mb-4">SES Messages</h2>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <label htmlFor="filterEmail" className="block text-sm font-medium text-gray-700">Filter by email:</label>
          <input
            type="text"
            id="filterEmail"
            value={filterEmail}
            onChange={handleFilterChange}
            placeholder="Enter email address"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-800"
          />
        </div>
        <div>
          <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700">Items per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-800"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button
          onClick={handleSortChange}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Sort {sortOrder === 'desc' ? '▼' : '▲'}
        </button>
      </div>
      {isLoading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && messages.length === 0 && <p className="text-gray-600">No messages found.</p>}
      {!isLoading && !error && messages.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">To</th>
                  <th className="px-4 py-2 text-left">From</th>
                  <th className="px-4 py-2 text-left">Subject</th>
                  <th className="px-4 py-2 text-left">Body</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((message) => (
                  <tr key={message.Id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{message.Id.slice(0, 8)}...</td>
                    <td className="px-4 py-2">{getRecipients(message)}</td>
                    <td className="px-4 py-2">{message.Source}</td>
                    <td className="px-4 py-2">{getSubject(message)}</td>
                    <td className="px-4 py-2">{getBody(message)}</td>
                    <td className="px-4 py-2">{new Date(message.Timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, messages.length)} of {messages.length} entries
            </span>
            <div>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === number ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}