import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Upload,
  X,
  Plus,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Globe,
  DollarSign,
  Users,
  Award,
  Ticket
} from 'lucide-react';
import { eventsAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
  const [step, setStep] = useState(1);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'Regular', price: 0, quantity: 100, description: '' }
  ]);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [ticketingEnabled, setTicketingEnabled] = useState(true);
  const [locationType, setLocationType] = useState('physical');

  const createEventMutation = useMutation(
    (eventData) => eventsAPI.createEvent(eventData),
    {
      onSuccess: (data) => {
        toast.success('Event created successfully! Awaiting admin approval.');
        navigate(`/organizer/events/${data.data.event._id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create event');
      }
    }
  );

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
        city: data.city || undefined,
        country: data.country || undefined,
        virtualLink: data.virtualLink || undefined
      },
      votingSettings: {
        enabled: votingEnabled,
        startDate: votingEnabled && data.votingStartDate ? data.votingStartDate : undefined,
        endDate: votingEnabled && data.votingEndDate ? data.votingEndDate : undefined,
        allowMultipleVotes: data.allowMultipleVotes || false
      },
      ticketingSettings: {
        enabled: ticketingEnabled,
        ticketTypes: ticketingEnabled ? ticketTypes : []
      },
      sponsors: data.sponsors ? data.sponsors.split(',').map(s => s.trim()) : []
    };

    // Handle banner upload
    if (data.banner) {
      const formData = new FormData();
      formData.append('banner', data.banner);
      Object.keys(eventData).forEach(key => {
        if (key !== 'banner') {
          formData.append(key, typeof eventData[key] === 'object' ? JSON.stringify(eventData[key]) : eventData[key]);
        }
      });
      createEventMutation.mutate(formData);
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const totalSteps = 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/organizer')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="text-gray-600 mt-2">Set up your award event step by step</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= s ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Settings' : 'Review'}
                </span>
              </div>
              {s < totalSteps && (
                <div className={`flex-1 h-1 mx-4 ${
                  step > s ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <Input
                  {...register('title', { required: 'Event title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } })}
                  placeholder="e.g., Annual Music Awards 2024"
                />
                {errors.title && <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Description must be at least 20 characters' } })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your event..."
                />
                {errors.description && <p className="text-error-600 text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <Input
                    type="date"
                    {...register('eventDate', { required: 'Event date is required' })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.eventDate && <p className="text-error-600 text-sm mt-1">{errors.eventDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Time *
                  </label>
                  <Input
                    type="time"
                    {...register('eventTime', { required: 'Event time is required' })}
                  />
                  {errors.eventTime && <p className="text-error-600 text-sm mt-1">{errors.eventTime.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type *
                </label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="physical">Physical Venue</option>
                  <option value="virtual">Virtual Event</option>
                  <option value="hybrid">Hybrid (Both)</option>
                </select>
              </div>

              {locationType !== 'virtual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Name
                    </label>
                    <Input
                      {...register('venue')}
                      placeholder="e.g., National Theatre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <Input
                      {...register('address')}
                      placeholder="Street address"
                    />
                  </div>
                </div>
              )}

              {locationType !== 'physical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Virtual Link
                  </label>
                  <Input
                    type="url"
                    {...register('virtualLink')}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Banner
                </label>
                <div className="flex items-center gap-4">
                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerPreview(null);
                          setValue('banner', null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-error-600 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                    <Button variant="outline" as="span">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Banner
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Settings</h2>
            <div className="space-y-6">
              {/* Voting Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-primary-500" />
                      Voting System
                    </h3>
                    <p className="text-sm text-gray-600">Enable online voting for award categories</p>
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
                {votingEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voting Start Date
                      </label>
                      <Input
                        type="date"
                        {...register('votingStartDate')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voting End Date
                      </label>
                      <Input
                        type="date"
                        {...register('votingEndDate')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ticketing Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Ticket className="w-5 h-5 mr-2 text-primary-500" />
                      Ticketing System
                    </h3>
                    <p className="text-sm text-gray-600">Sell tickets for your event</p>
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
                  <div className="mt-4 space-y-4">
                    {ticketTypes.map((ticketType, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                          <Input
                            value={ticketType.name}
                            onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                            placeholder="Regular"
                            size="sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                          <Input
                            type="number"
                            value={ticketType.price}
                            onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                            placeholder="0"
                            size="sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                          <Input
                            type="number"
                            value={ticketType.quantity}
                            onChange={(e) => updateTicketType(index, 'quantity', e.target.value)}
                            placeholder="100"
                            size="sm"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <Input
                            value={ticketType.description}
                            onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                            placeholder="Optional"
                            size="sm"
                          />
                        </div>
                        <div className="col-span-1">
                          {ticketTypes.length > 1 && (
                            <Button
                              type="button"
                              variant="error"
                              size="sm"
                              onClick={() => removeTicketType(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTicketType}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ticket Type
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Review & Submit</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
                <p><strong>Title:</strong> {watch('title')}</p>
                <p><strong>Date:</strong> {watch('eventDate')} at {watch('eventTime')}</p>
                <p><strong>Location:</strong> {locationType}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
                <p><strong>Voting:</strong> {votingEnabled ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Ticketing:</strong> {ticketingEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
          >
            Previous
          </Button>
          {step < totalSteps ? (
            <Button
              type="button"
              onClick={() => {
                // Validate current step before proceeding
                if (step === 1) {
                  handleSubmit(() => setStep(2))();
                } else if (step === 2) {
                  setStep(3);
                }
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={createEventMutation.isLoading}
            >
              {createEventMutation.isLoading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;