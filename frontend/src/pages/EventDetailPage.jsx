import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  Award,
  Clock,
  Share2,
  Heart,
  Eye,
  Vote,
  ShoppingBag,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { eventsAPI, categoriesAPI, votesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import NomineeCard from '../components/NomineeCard';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: eventData, isLoading, error } = useQuery(
    ['event', id],
    () => eventsAPI.getEventById(id),
    {
      enabled: !!id,
      retry: 2
    }
  );

  const { data: categoriesData } = useQuery(
    ['categories', id],
    () => categoriesAPI.getCategoriesByEvent(id),
    {
      enabled: !!id && !!eventData
    }
  );

  const event = eventData?.data?.event;
  const categories = categoriesData?.data?.categories || [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h3>
            <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/events')}>Back to Events</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </button>

      {/* Event Banner */}
      <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
        {event.banner ? (
          <img
            src={event.banner}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <Calendar className="w-24 h-24 text-primary-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {event.title}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(event.eventDate)}
                </div>
                {event.location?.venue && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location.venue}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'categories', 'tickets', 'about'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </Card>

              {/* Event Details */}
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-primary-500 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Date & Time</p>
                      <p className="text-gray-600">
                        {formatDate(event.eventDate)} at {event.eventTime || formatTime(event.eventDate)}
                      </p>
                    </div>
                  </div>

                  {event.location?.venue && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-primary-500 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Location</p>
                        <p className="text-gray-600">{event.location.venue}</p>
                        {event.location.address && (
                          <p className="text-gray-600">{event.location.address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {event.location?.virtualLink && (
                    <div className="flex items-start">
                      <ExternalLink className="w-5 h-5 text-primary-500 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Virtual Event</p>
                        <a
                          href={event.location.virtualLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Join Virtual Event
                        </a>
                      </div>
                    </div>
                  )}

                  {categories.length > 0 && (
                    <div className="flex items-start">
                      <Award className="w-5 h-5 text-primary-500 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Award Categories</p>
                        <p className="text-gray-600">{categories.length} categories</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {categories.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Yet</h3>
                    <p className="text-gray-600">Categories will be added soon.</p>
                  </div>
                </Card>
              ) : (
                categories.map((category) => (
                  <Card key={category._id}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-gray-600">{category.description}</p>
                        )}
                      </div>
                      {category.nominees?.length > 0 && (
                        <Badge variant="primary">
                          {category.nominees.length} Nominees
                        </Badge>
                      )}
                    </div>

                    {category.nominees && category.nominees.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {category.nominees.slice(0, 4).map((nominee) => (
                          <NomineeCard key={nominee._id} nominee={nominee} />
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/events/${id}/vote?category=${category._id}`)}
                      >
                        View All Nominees & Vote
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <Card>
              {event.ticketingSettings?.enabled ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Your Tickets</h2>
                  {event.ticketingSettings.ticketTypes && event.ticketingSettings.ticketTypes.length > 0 ? (
                    <div className="space-y-4">
                      {event.ticketingSettings.ticketTypes.map((ticketType, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900">{ticketType.name}</h3>
                            <p className="text-sm text-gray-600">
                              {ticketType.quantity - ticketType.sold} tickets remaining
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-primary-600">
                              {ticketType.price === 0 ? 'Free' : `$${ticketType.price}`}
                            </span>
                            <Button
                              onClick={() => navigate(`/events/${id}/tickets?type=${ticketType.name}`)}
                              disabled={ticketType.quantity - ticketType.sold === 0}
                            >
                              {ticketType.quantity - ticketType.sold === 0 ? 'Sold Out' : 'Buy Ticket'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Ticket types will be available soon.</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ticketing Not Available</h3>
                  <p className="text-gray-600">Tickets are not available for this event.</p>
                </div>
              )}
            </Card>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Organizer</h2>
              {event.organizer ? (
                <div>
                  <p className="text-gray-700">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                  {event.organizer.bio && (
                    <p className="text-gray-600 mt-2">{event.organizer.bio}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Organizer information not available.</p>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {event.votingSettings?.enabled && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(`/events/${id}/vote`)}
                >
                  <Vote className="w-4 h-4 mr-2" />
                  Vote Now
                </Button>
              )}
              {event.ticketingSettings?.enabled && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab('tickets')}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Buy Tickets
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </Button>
            </div>
          </Card>

          {/* Event Stats */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
            <div className="space-y-3">
              {event.analytics?.totalViews > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Views
                  </span>
                  <span className="font-semibold text-gray-900">
                    {event.analytics.totalViews.toLocaleString()}
                  </span>
                </div>
              )}
              {categories.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Categories
                  </span>
                  <span className="font-semibold text-gray-900">{categories.length}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Organizer Info */}
          {event.organizer && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
              <div className="flex items-center">
                {event.organizer.avatar ? (
                  <img
                    src={event.organizer.avatar}
                    alt={event.organizer.firstName}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                  <p className="text-sm text-gray-600">Event Organizer</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;