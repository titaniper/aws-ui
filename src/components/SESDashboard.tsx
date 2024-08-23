'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SESStats {
  sendStatistics: AWS.SES.GetSendStatisticsResponse;
  sendQuota: AWS.SES.GetSendQuotaResponse;
}

interface ChartDataPoint {
  time: string;
  deliveries: number;
  bounces: number;
  complaints: number;
  rejects: number;
}

export default function SESDashboard() {
  const [stats, setStats] = useState<SESStats | null>(null);
  const [emailDetails, setEmailDetails] = useState({
    to: 'test@example.com',
    subject: 'Test Email from SES Dashboard',
    message: 'This is a test email sent from the SES Dashboard.'
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/ses-stats');
      const data = await response.json();
      setStats(data);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 매 1분마다 갱신

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    setEmailSent(false);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailDetails),
      });
      if (response.ok) {
        setEmailSent(true);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!stats) return <div>Loading...</div>;

  const chartData: ChartDataPoint[] = stats.sendStatistics.SendDataPoints?.map(point => ({
    time: new Date(point.Timestamp).toLocaleTimeString(),
    deliveries: point.DeliveryAttempts || 0,
    bounces: point.Bounces || 0,
    complaints: point.Complaints || 0,
    rejects: point.Rejects || 0,
  })) || [];

  return (
    <div className="p-4 bg-gray-100 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">SES Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Send Quota</h2>
        <p>Max 24 Hour Send: {stats.sendQuota.Max24HourSend}</p>
        <p>Max Send Rate: {stats.sendQuota.MaxSendRate}</p>
        <p>Sent Last 24 Hours: {stats.sendQuota.SentLast24Hours}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Send Statistics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="deliveries" stroke="#8884d8" />
            <Line type="monotone" dataKey="bounces" stroke="#82ca9d" />
            <Line type="monotone" dataKey="complaints" stroke="#ffc658" />
            <Line type="monotone" dataKey="rejects" stroke="#ff8042" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Send Test Email</h2>
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700">To:</label>
            <input
              type="email"
              id="to"
              name="to"
              value={emailDetails.to}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-800"
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={emailDetails.subject}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-800"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message:</label>
            <textarea
              id="message"
              name="message"
              value={emailDetails.message}
              onChange={handleInputChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-800"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={sendingEmail}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </button>
        </form>
        {emailSent && <p className="mt-2 text-green-600">Email sent successfully!</p>}
      </div>
    </div>
  );
}