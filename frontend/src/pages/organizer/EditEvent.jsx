import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Ticket,
  Award
} from 'lucide-react';
import { eventsAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
  
  const [bannerPreview, setBannerPreview] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [ticketingEnabled, setTicketingEnabled] = useState(true);
  const [locationType, setLocationType] = useState('physical');

  // Fetch event data
  const { data: eventData, isLoading } = useQuery(
    ['event', id],
    () => eventsAPI.getEventById(id),
    {
      enabled: !!id,
      onSuccess: (data) => {
        const event = data.data.event;
        setValue('title', event.title);
        setValue('description', event.description);
        setValue('eventDate', event.eventDate?.split('T')[0]);
        setValue('eventTime', event.eventTime);
        setValue('venue', event.location?.venue);
        setValue('address', event.location?.address);
        setValue('virtualLink', event.location?.virtualLink);
        setBannerPreview(event.banner);
        setVotingEnabled(event.votingSettings?.enabled || false);
        setTicketingEnabled(event.ticketingSettings?.enabled || false);
        setLocationType(event.location?.type || 'physical');
        setTicketTypes(event.ticketingSettings?.ticketTypes || []);
      }
    }
  );

  const updateEventMutation = useMutation(
    ({ eventId, eventData }) => eventsAPI.updateEvent(eventId, eventData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['event', id]);
        queryClient.invalidateQueries('organizerEvents');
        toast.success('Event updated successfully');
        navigate(`/organizer/events/${id}/analytics`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update event');
      }
    }
  );

  const event = eventData?.data?.event;

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
        setValue('banner', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, quantity: 100, description: '' }]);
  };

  const removeTicketType = (index) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const updateTicketType = (index, field, value) => {
    const updated = [...ticketTypes];
    updated[index][field] = field === 'price' || field === 'quantity' ? parseFloat(value) || 0 : value;
    setTicketTypes(updated);
  };

  const onSubmit = async (data) => {
    const eventData = {
      title: data.title,
      description: data.description,
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      location: {
        type: locationType,
        venue: data.venue || undefined,
        address: data.address || undefined,
        virtualLink: data.virtualLink || undefined
      },
      votingSettings: {
        enabled: votingEnabled,
        startDate: votingEnabled && data.votingStartDate ? data.votingStartDate : undefined,
        endDate: votingEnabled && data.votingEndDate ? data.votingEndDate : undefined
      },
      ticketingSettings: {
        enabled: ticketingEnabled,
        ticketTypes: ticketingEnabled ? ticketTypes : []
      }
    };

    if (data.banner) {
      const formData = new FormData();
      formData.append('banner', data.banner);
      Object.keys(eventData).forEach(key => {
        formData.append(key, typeof eventData[key] === 'object' ? JSON.stringify(eventData[key]) : eventData[key]);
      });
      updateEventMutation.mutate({ eventId: id, eventData: formData });
    } else {
      updateEventMutation.mutate({ eventId: id, eventData });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h3>
        <Button onClick={() => navigate('/organizer/events')}>Back to Events</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/organizer/events')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-2">Update your event details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
              <Input
                {...register('title', { required: 'Title is required' })}
                defaultValue={event.title}
              />
              {errors.title && <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                defaultValue={event.description}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                <Input
                  type="date"
                  {...register('eventDate', { required: 'Date is required' })}
                  defaultValue={event.eventDate?.split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Time *</label>
                <Input
                  type="time"
                  {...register('eventTime', { required: 'Time is required' })}
                  defaultValue={event.eventTime}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="physical">Physical</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {locationType !== 'virtual' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <Input {...register('venue')} defaultValue={event.location?.venue} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <Input {...register('address')} defaultValue={event.location?.address} />
                </div>
              </div>
            )}

            {locationType !== 'physical' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Virtual Link</label>
                <Input type="url" {...register('virtualLink')} defaultValue={event.location?.virtualLink} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Banner</label>
              <div className="flex items-center gap-4">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" className="w-32 h-32 object-cover rounded-lg" />
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg" />
                )}
                <label>
                  <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  <Button variant="outline" as="span">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Banner
                  </Button>
                </label>
              </div>
            </div>

            {/* Voting Settings */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-primary-500" />
                    Voting System
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={votingEnabled}
                    onChange={(e) => setVotingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            {/* Ticketing Settings */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Ticket className="w-5 h-5 mr-2 text-primary-500" />
                    Ticketing System
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ticketingEnabled}
                    onChange={(e) => setTicketingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              {ticketingEnabled && (
                <div className="mt-4 space-y-2">
                  {ticketTypes.map((tt, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <Input value={tt.name} onChange={(e) => updateTicketType(idx, 'name', e.target.value)} className="col-span-3" placeholder="Name" />
                      <Input type="number" value={tt.price} onChange={(e) => updateTicketType(idx, 'price', e.target.value)} className="col-span-2" placeholder="Price" />
                      <Input type="number" value={tt.quantity} onChange={(e) => updateTicketType(idx, 'quantity', e.target.value)} className="col-span-2" placeholder="Qty" />
                      <Input value={tt.description} onChange={(e) => updateTicketType(idx, 'description', e.target.value)} className="col-span-4" placeholder="Description" />
                      {ticketTypes.length > 1 && (
                        <Button variant="error" size="sm" onClick={() => removeTicketType(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" onClick={addTicketType}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ticket Type
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/organizer/events')}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateEventMutation.isLoading}>
            {updateEventMutation.isLoading ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditEvent;