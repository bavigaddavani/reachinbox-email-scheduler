import React, { useState, useEffect } from 'react';
import './App.css';

interface EmailJob {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledFor: string;
  status: string;
  sentAt?: string | null;
  previewUrl?: string | null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'scheduled' | 'sent'>('schedule');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  
  const [scheduledList, setScheduledList] = useState<EmailJob[]>([]);
  const [sentList, setSentList] = useState<EmailJob[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const API_BASE = 'http://localhost:5000/api/emails';

  const fetchScheduled = async () => {
    try {
      const res = await fetch(`${API_BASE}/scheduled`);
      if (res.ok) {
        const data = await res.json();
        setScheduledList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSent = async () => {
    try {
      const res = await fetch(`${API_BASE}/sent`);
      if (res.ok) {
        const data = await res.json();
        setSentList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'scheduled') fetchScheduled();
    if (activeTab === 'sent') fetchSent();
  }, [activeTab]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!recipient || !subject || !body || !scheduledFor) {
      setMessage({ text: 'Please fill out all required fields.', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          subject,
          body,
          scheduledFor: new Date(scheduledFor).toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Scheduling failed.');

      setMessage({ text: 'Email scheduled successfully!', type: 'success' });
      setRecipient('');
      setSubject('');
      setBody('');
      setScheduledFor('');
      setActiveTab('scheduled');
      fetchScheduled();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to schedule email.', type: 'error' });
    }
  };

  return (
    <div className="container">
      <h1 className="title">ReachInbox Email Scheduler</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule Email
        </button>
        <button
          className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled Emails
        </button>
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent Emails
        </button>
      </div>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      {activeTab === 'schedule' && (
        <div className="card">
          <form onSubmit={handleSchedule}>
            <div className="form-group">
              <label>Recipient Email</label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="candidate@reachinbox.ai"
                required
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Interview Confirmation"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Body</label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter email body text..."
                required
              />
            </div>
            <div className="form-group">
              <label>Scheduled Time</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Schedule Email
            </button>
          </form>
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="card">
          <div className="list-header">
            <h3>Scheduled List</h3>
            <button className="refresh-btn" onClick={fetchScheduled}>↻ Refresh</button>
          </div>
          {scheduledList.length === 0 ? (
            <p style={{ color: '#64748b' }}>No pending scheduled emails.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Scheduled For</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduledList.map((job) => (
                  <tr key={job.id}>
                    <td>{job.recipient}</td>
                    <td>{job.subject}</td>
                    <td>{new Date(job.scheduledFor).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-scheduled">{job.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="card">
          <div className="list-header">
            <h3>Sent List</h3>
            <button className="refresh-btn" onClick={fetchSent}>↻ Refresh</button>
          </div>
          {sentList.length === 0 ? (
            <p style={{ color: '#64748b' }}>No records found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {sentList.map((job) => (
                  <tr key={job.id}>
                    <td>{job.recipient}</td>
                    <td>{job.subject}</td>
                    <td>{job.sentAt ? new Date(job.sentAt).toLocaleString() : '-'}</td>
                    <td>
                      <span className="badge badge-sent">{job.status}</span>
                    </td>
                    <td>
                      {job.previewUrl ? (
                        <a
                          href={job.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="view-link"
                        >
                          View Email ↗
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
