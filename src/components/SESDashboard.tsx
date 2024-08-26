'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function SESDashboard() {
  const [stats, setStats] = useState<SESStats | null>(null);
  const [emailDetails, setEmailDetails] = useState({
    to: 'test@example.com',
    subject: 'Test Email from SES Dashboard',
    message: 'This is a test email sent from the SES Dashboard.'
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [simulationType, setSimulationType] = useState('normal');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ses-stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        body: JSON.stringify({ ...emailDetails, simulationType }),
      });
      if (response.ok) {
        setEmailSent(true);
        await fetchStats(); // Refresh stats after sending email
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

  const resetStats = async () => {
    try {
      await fetch('/api/reset-stats', { method: 'POST' });
      await fetchStats();
    } catch (error) {
      console.error('Error resetting stats:', error);
      alert('Failed to reset stats. Please try again.');
    }
  };

  if (!stats) return <div>Loading...</div>;

  const chartData: ChartDataPoint[] = stats.sendStatistics?.SendDataPoints?.map(point => ({
    time: new Date(point.Timestamp).toLocaleTimeString(),
    deliveries: point.DeliveryAttempts || 0,
    bounces: point.Bounces || 0,
    complaints: point.Complaints || 0,
    rejects: point.Rejects || 0,
  })) || [];

  const latestDataPoint = chartData[0] || { deliveries: 0, bounces: 0, complaints: 0, rejects: 0 };
  const pieChartData = [
    { name: 'Deliveries', value: latestDataPoint.deliveries },
    { name: 'Bounces', value: latestDataPoint.bounces },
    { name: 'Complaints', value: latestDataPoint.complaints },
    { name: 'Rejects', value: latestDataPoint.rejects },
  ];

  const quotaData = [
    { name: 'Used', value: stats.sendQuota?.SentLast24Hours },
    { name: 'Remaining', value: stats.sendQuota?.Max24HourSend - stats.sendQuota?.SentLast24Hours },
  ];

  return (
    <div className="p-4 bg-gray-100 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">SES Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Send Quota</h2>
        <p>Max 24 Hour Send: {stats.sendQuota?.Max24HourSend}</p>
        <p>Max Send Rate: {stats.sendQuota?.MaxSendRate}</p>
        <p>Sent Last 24 Hours: {stats.sendQuota?.SentLast24Hours}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Send Statistics Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="deliveries" stroke="#0088FE" />
              <Line type="monotone" dataKey="bounces" stroke="#00C49F" />
              <Line type="monotone" dataKey="complaints" stroke="#FFBB28" />
              <Line type="monotone" dataKey="rejects" stroke="#FF8042" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Latest Send Statistics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">24 Hour Send Quota Usage</h2>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={quotaData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
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
          <div>
            <label htmlFor="simulationType" className="block text-sm font-medium text-gray-700">Simulation Type:</label>
            <select
              id="simulationType"
              name="simulationType"
              value={simulationType}
              onChange={(e) => setSimulationType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-800"
            >
              <option value="normal">Normal Delivery</option>
              <option value="bounce">Bounce</option>
              <option value="complaint">Complaint</option>
              <option value="reject">Reject</option>
            </select>
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

      <div className="mb-8">
        <button
          onClick={resetStats}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Reset Statistics
        </button>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Explanations / 설명</h2>
        <ul className="list-disc pl-5 space-y-4">
          <li>
            <p><strong>Deliveries:</strong> The number of email messages successfully delivered to recipients.</p>
            <p><strong>배달(Deliveries):</strong> 수신자에게 성공적으로 전달된 이메일 메시지의 수입니다.</p>
          </li>
          <li>
            <p><strong>Bounces:</strong> The number of email messages that were rejected by the recipient's email server. This can be due to invalid email addresses, full mailboxes, or other delivery issues.</p>
            <p><strong>반송(Bounces):</strong> 수신자의 이메일 서버에 의해 거부된 이메일 메시지의 수입니다. 이는 잘못된 이메일 주소, 가득 찬 메일박스, 또는 기타 배달 문제로 인해 발생할 수 있습니다.</p>
          </li>
          <li>
            <p><strong>Complaints:</strong> The number of recipients who marked the email as spam or filed a complaint. This is crucial for maintaining a good sender reputation.</p>
            <p><strong>불만(Complaints):</strong> 이메일을 스팸으로 표시하거나 불만을 제기한 수신자의 수입니다. 이는 좋은 발신자 평판을 유지하는 데 중요합니다.</p>
          </li>
          <li>
            <p><strong>Rejects:</strong> The number of email messages rejected by Amazon SES before attempting delivery. This can be due to malformed emails, blacklisted sender addresses, or other policy violations.</p>
            <p><strong>거부(Rejects):</strong> Amazon SES가 배달을 시도하기 전에 거부한 이메일 메시지의 수입니다. 이는 잘못 형식화된 이메일, 블랙리스트에 오른 발신자 주소, 또는 기타 정책 위반으로 인해 발생할 수 있습니다.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}