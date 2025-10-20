import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Calendar, Plus, MapPin, Clock, Users, Trash2, Edit2, ImageIcon, X } from 'lucide-react';

export default function CircleEventsView({ db, storage, stakeId, wardId, circleId, currentMemberId, currentMemberName, circleMembers }) {
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const now = new Date().toISOString();
    const eventsQuery = query(
      collection(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId, 'events'),
      where('eventDate', '>=', now),
      orderBy('eventDate', 'asc')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, [db, stakeId, wardId, circleId]);

  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId, 'events', eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-green-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
          <p className="text-sm text-gray-600">{events.length} scheduled</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="mb-2">No upcoming events</p>
          <p className="text-sm">Create an event to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              circleMembers={circleMembers}
              currentMemberId={currentMemberId}
              onEdit={() => {
                setSelectedEvent(event);
                setShowEditModal(true);
              }}
              onDelete={() => handleDeleteEvent(event.id)}
              formatEventDate={formatEventDate}
              formatEventTime={formatEventTime}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal
          db={db}
          storage={storage}
          stakeId={stakeId}
          wardId={wardId}
          circleId={circleId}
          currentMemberId={currentMemberId}
          currentMemberName={currentMemberName}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditEventModal
          db={db}
          storage={storage}
          stakeId={stakeId}
          wardId={wardId}
          circleId={circleId}
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}

function EventCard({ event, circleMembers, currentMemberId, onEdit, onDelete, formatEventDate, formatEventTime }) {
  const organizer = circleMembers.find(m => m.id === event.organizerId);
  const isOrganizer = event.organizerId === currentMemberId;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-gray-600 mb-3">{event.description}</p>
          )}
        </div>
        {isOrganizer && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-green-500" />
          <span>{formatEventDate(event.eventDate)}</span>
        </div>

        {event.eventTime && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-green-500" />
            <span>{formatEventTime(event.eventTime)}</span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-green-500" />
            <span>{event.location}</span>
          </div>
        )}

        {organizer && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-3 pt-3 border-t">
            <Users className="w-4 h-4" />
            <span>Organized by {organizer.fullName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateEventModal({ db, storage, stakeId, wardId, circleId, currentMemberId, currentMemberName, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `circles/${circleId}/events/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setFormData(prev => ({ ...prev, imageUrl: downloadUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.eventDate) {
      alert('Please fill in title and date');
      return;
    }

    setCreating(true);
    try {
      const eventDateTime = formData.eventTime
        ? `${formData.eventDate}T${formData.eventTime}:00`
        : `${formData.eventDate}T00:00:00`;

      await addDoc(collection(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId, 'events'), {
        ...formData,
        eventDate: eventDateTime,
        organizerId: currentMemberId,
        organizerName: currentMemberName,
        createdAt: serverTimestamp()
      });

      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Create Event</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {formData.imageUrl && (
            <div className="relative">
              <img
                src={formData.imageUrl}
                alt="Event"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                className="absolute top-2 right-2 p-2 bg-white rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!formData.imageUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Image (Optional)</label>
              <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 cursor-pointer transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Game Night"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Tell us about the event..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Smith's Home or 123 Main St"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || uploading || !formData.title.trim() || !formData.eventDate}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditEventModal({ db, stakeId, wardId, circleId, event, onClose }) {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
    eventTime: event.eventTime || '',
    location: event.location || ''
  });
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!formData.title.trim() || !formData.eventDate) {
      alert('Please fill in title and date');
      return;
    }

    setUpdating(true);
    try {
      const eventDateTime = formData.eventTime
        ? `${formData.eventDate}T${formData.eventTime}:00`
        : `${formData.eventDate}T00:00:00`;

      await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId, 'events', event.id), {
        ...formData,
        eventDate: eventDateTime,
        updatedAt: serverTimestamp()
      });

      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Edit Event</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating || !formData.title.trim() || !formData.eventDate}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Event'}
          </button>
        </div>
      </div>
    </div>
  );
}