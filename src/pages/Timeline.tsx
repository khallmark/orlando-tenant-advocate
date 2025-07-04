import React, { useState, useEffect } from 'react';
import TimelineEventForm from './Timeline/TimelineEventForm';

import Tooltip from '../components/Tooltip';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Edit, Trash2 } from 'lucide-react';
import { 
  TimelineEvent, 
  FormData, 
  loadEvents, 
  saveEvents, 
  addEvent, 
  replaceEvent, 
  deleteEvent, 
  eventToFormData, 
  initialFormData, 
  exportToJson, 
  importFromJson, 
  formatTimeForDisplay,
  createEvent,
  updateEvent
} from './Timeline/TimelineRepository';
import TimelineEventRenderer from './Timeline/TimelineEvent/TimelineEventRenderer';
import { CollapsibleSection } from '../components/Collapsible';

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData());
  const [modalFormData, setModalFormData] = useState<FormData>(initialFormData());
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const resetForm = () => {
    setFormData(initialFormData());
  };

  const resetModalForm = () => {
    setModalFormData(initialFormData());
    setEditingEvent(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModalForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.label) {
      alert('Please fill in required fields');
      return;
    }

    const newEvent = createEvent(formData);
    const updatedEvents = addEvent(events, newEvent);
    setEvents(updatedEvents);
    resetForm();
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modalFormData.date || !modalFormData.label || !editingEvent) {
      alert('Please fill in required fields');
      return;
    }

    const updatedEvent = updateEvent(editingEvent, modalFormData);
    const updatedEvents = replaceEvent(events, updatedEvent);
    setEvents(updatedEvents);
    closeModal();
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setModalFormData(eventToFormData(event));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = deleteEvent(events, id);
      setEvents(updatedEvents);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFromJson(file)
        .then(importedEvents => {
          setEvents(prevEvents => [...prevEvents, ...importedEvents]);
        })
        .catch(err => setError(err.message));
    }
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleModalSubmit(e as any);
    }
  };

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="timeline">
      <h1>Case Timeline Editor</h1>
      <p>
        Track important events in your case. Hover over the info icon next to each field 
        for specific guidance. Use {isMac ? 'Cmd+Enter' : 'Ctrl+Enter'} to quickly submit forms.
      </p>

      <CollapsibleSection title="How to Use the Timeline Tool">
        <div className="feature-explanation">
          <p>
            The <strong>Timeline Tool</strong> is designed to help you create a detailed, chronological record of all events related to your tenancy and eviction case. Proper documentation is critical for defending your rights.
          </p>
          <h4>Key Features:</h4>
          <ul>
            <li><strong>Event Tracking:</strong> Log every interaction, notice, payment, and communication. The tool automatically calculates critical deadlines based on the dates you provide.</li>
            <li><strong>Notice Analysis:</strong> When you enter a notice from your landlord (like a 3-Day Notice for rent), the tool analyzes it for compliance with Florida law, such as checking if the deadline is calculated correctly.</li>
            <li><strong>Data Management:</strong> Your timeline is saved securely in your browser's local storage. You can also export it to a JSON file for your records or to share with an attorney, and import it on another device.</li>
          </ul>
          <h4>How to Use the Timeline:</h4>
          <ol>
            <li>Click "Add New Event" below to open the form.</li>
            <li>Select the `Event Type` that best matches your situation. Different forms will appear for specific legal notices.</li>
            <li>Fill in all required fields. The more detail you provide, the stronger your record will be.</li>
            <li>The tool will display analysis and calculated dates (e.g., "Objection Due Date") directly on the timeline event.</li>
          </ol>
          <p>
            Use this tool to build a comprehensive history. If you end up in court, this timeline will be an invaluable resource for you and your legal representative.
          </p>
        </div>
      </CollapsibleSection>

      {error && (
        <div className="error-message">
          {error} 
          <Button onClick={() => setError(null)}>&times;</Button>
        </div>
      )}

      {/* Main Create Form */}
      <TimelineEventForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        buttonText="Add Event"
        isModal={false}
      />

      {/* Import/Export */}
      <div className="import-export-section">
        <Button 
          type="button" 
          variant="secondary"
          onClick={() => exportToJson(events)}
        >
          Export Timeline Data
        </Button>
        <label className="import-btn">
          <span className="btn btn-secondary">
            Import Timeline Data
          </span>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Events Table */}
      <div className="events-section">
        <h2>Timeline Events ({events.length})</h2>
        {events.length === 0 ? (
          <p>No events recorded yet. Add your first event above.</p>
        ) : (
          <div className="events-table-container">
            <table className="events-table">
              <thead>
                <tr>
                  <th>&nbsp;</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Label</th>
                  <th>Description</th>
                  <th>Notice Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      {event.noticeFields?.complianceNotes ? (
                        <Tooltip content={event.noticeFields.complianceNotes}>
                          <div className={`compliance-status ${event.noticeFields.isCompliant ? 'compliant' : 'non-compliant'}`}>
                            {event.noticeFields.isCompliant ? (
                              <Icon type="success" size={16} />
                            ) : (
                              <Icon type="warning" size={16} />
                            )}
                          </div>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="datetime-cell">
                        <div className="date">{new Date(event.date + 'T12:00:00').toDateString()}</div>
                        {event.time && (
                          <div className="time">
                            {formatTimeForDisplay(event.time)} {event.timezone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{event.eventType}</td>
                    <td>{event.label}</td>
                    <td>{event.description}</td>
                    <td>
                      <TimelineEventRenderer event={event} />
                    </td>
                    <td className="actions-cell">
                      <Button 
                        onClick={() => handleEdit(event)}
                        variant="ghost"
                        size="small"
                        icon={<Edit size={14} />}
                      >
                        Edit
                      </Button>
                      <Button 
                        onClick={() => handleDelete(event.id)}
                        variant="danger"
                        size="small"
                        icon={<Trash2 size={14} />}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingEvent && (
        <Modal onClose={closeModal}>
          <h2>Edit Event</h2>
          <TimelineEventForm
            formData={modalFormData}
            setFormData={setModalFormData}
            onSubmit={handleModalSubmit}
            onKeyDown={handleModalKeyDown}
            buttonText="Update Event"
            isModal={true}
          />
          <Button 
            type="button" 
            onClick={closeModal}
            variant="secondary"
          >
            Cancel
          </Button>
        </Modal>
      )}
    </div>
  );
}   