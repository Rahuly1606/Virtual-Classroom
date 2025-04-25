import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { BiSearch, BiPlus, BiCalendarPlus, BiEdit, BiTrash, BiVideoPlus, BiCalendarCheck, BiBook, BiTime, BiRightArrowAlt, BiVideo, BiCheck, BiX } from 'react-icons/bi'
import useAuth from '../../hooks/useAuth'
import sessionService from '../../services/sessionService'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

const Sessions = () => {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'
  
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, upcoming, active, past
  const [updatingStatus, setUpdatingStatus] = useState(null)
  
  // Fetch sessions on mount and when filters change
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const data = await sessionService.getSessions()
        setSessions(data)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        toast.error('Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessions()
  }, [])
  
  // Filter and search sessions
  const filteredSessions = sessions
    .filter(session => {
      const now = new Date()
      const startTime = new Date(session.startTime)
      const endTime = new Date(session.endTime)
      
      switch (filter) {
        case 'upcoming':
          return startTime > now
        case 'active':
          return startTime <= now && endTime >= now
        case 'past':
          return endTime < now
        default:
          return true
      }
    })
    .filter(session => {
      const searchLower = searchTerm.toLowerCase()
      return (
        session.title.toLowerCase().includes(searchLower) ||
        (session.description && session.description.toLowerCase().includes(searchLower)) ||
        (session.course && session.course.name && session.course.name.toLowerCase().includes(searchLower))
      )
    })
  
  // Handle delete session
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return
    }
    
    try {
      await sessionService.deleteSession(id)
      setSessions(sessions.filter(session => session._id !== id))
      toast.success('Session deleted successfully')
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Failed to delete session')
    }
  }
  
  // Handle toggle session completion status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setUpdatingStatus(id)
      // Toggle the completion status
      const newStatus = !currentStatus
      const updatedSession = await sessionService.toggleSessionStatus(id, newStatus)
      
      // Update the sessions list
      setSessions(sessions.map(session => 
        session._id === id ? { ...session, isCompleted: newStatus } : session
      ))
      
      toast.success(`Session marked as ${newStatus ? 'completed' : 'incomplete'}`)
    } catch (error) {
      console.error('Error updating session status:', error)
      toast.error('Failed to update session status')
    } finally {
      setUpdatingStatus(null)
    }
  }
  
  // Calculate session status
  const getSessionStatus = (session) => {
    const now = new Date()
    const startTime = new Date(session.startTime)
    const endTime = new Date(session.endTime)
    
    if (now < startTime) {
      return 'upcoming'
    } else if (now >= startTime && now <= endTime) {
      return 'active'
    } else {
      return 'ended'
    }
  }
  
  // Stop propagation for action buttons
  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h1>
        {isTeacher && (
          <Button to="/sessions/create" icon={<BiCalendarPlus className="h-5 w-5" />} variant="primary">
            Create Session
          </Button>
        )}
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md items-center rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
          <BiSearch className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-2 flex-1 border-0 focus:outline-none focus:ring-0"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'past' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>
      </div>
      
      {/* Sessions list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="flex flex-col items-center justify-center py-8">
              <BiVideoPlus className="h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter !== 'all'
                  ? `No ${filter} sessions found. Try changing the filter.`
                  : searchTerm
                  ? 'No sessions match your search. Try a different search term.'
                  : isTeacher
                  ? 'Create your first session to get started.'
                  : 'No sessions available yet. Check back later.'}
              </p>
              {isTeacher && filter === 'all' && !searchTerm && (
                <Button to="/sessions/create" variant="primary" className="mt-4">
                  Create Your First Session
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredSessions.map((session, index) => {
            const status = getSessionStatus(session);
            const statusColors = {
              upcoming: {
                bg: 'from-blue-600 to-blue-400',
                light: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                icon: <BiCalendarPlus className="mr-1 h-3.5 w-3.5" />,
                pulse: 'bg-blue-400'
              },
              active: {
                bg: 'from-green-600 to-green-400',
                light: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                icon: <BiVideoPlus className="mr-1 h-3.5 w-3.5" />,
                pulse: 'bg-green-400'
              },
              ended: {
                bg: 'from-gray-600 to-gray-400',
                light: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
                icon: <BiCalendarCheck className="mr-1 h-3.5 w-3.5" />,
                pulse: 'bg-gray-400'
              }
            };
            
            const startTime = new Date(session.startTime);
            const endTime = new Date(session.endTime);
            const duration = Math.round((endTime - startTime) / (1000 * 60));
            
            return (
              <Card 
                key={session._id} 
                className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 animate-fade-in-up" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Status Header */}
                <div className="relative h-16">
                  {/* Gradient background based on status */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${statusColors[status].bg}`}></div>
                  
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoLTR2LTJoNHYtNGgydjRoNHYyaC00djR6TTAgMGg0djRIMFYwem0wIDEyaDR2NEgwdi00em0wIDEyaDR2NEgwdi00em0wIDEyaDR2NEgwdi00em0wIDEyaDR2NEgwdi00ek0xMiAwaDF2NGgtNFYwaC0xeiIvPjwvZz48L3N2Zz4=')]"></div>
                  
                  {/* Status Label and Time */}
                  <div className="absolute inset-0 p-4 flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 mr-3">
                        <BiVideo className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider font-semibold opacity-80">
                          {status === 'upcoming' ? 'Upcoming Session' : status === 'active' ? 'Live Session' : 'Past Session'}
                        </div>
                        <div className="text-sm font-medium">{startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="flex items-center">
                      <div className="flex items-center px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                        {statusColors[status].icon}
                        <span>
                          {status === 'upcoming' 
                            ? `In ${Math.round((startTime - new Date()) / (1000 * 60 * 60))} hours` 
                            : status === 'active' 
                            ? 'Live Now'
                            : 'Completed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main Content */}
                <div className="relative">
                  <Link to={`/sessions/${session._id}`} className="block">
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-1">
                        {session.title}
                      </h3>
                      
                      {/* Course Info */}
                      {session.course && (
                        <div className="flex items-center mt-2 mb-3">
                          <BiBook className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {typeof session.course === 'object' 
                              ? session.course.title || session.course.name 
                              : 'Course Session'}
                          </span>
                        </div>
                      )}
                      
                      {/* Session Details */}
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <BiCalendarCheck className="h-4 w-4 mr-1.5 text-gray-400" />
                          <span>{startTime.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <BiTime className="h-4 w-4 mr-1.5 text-gray-400" />
                          <span>{duration} minutes</span>
                        </div>
                      </div>
                      
                      {/* Description if available */}
                      {session.description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                      
                      {/* Join/View button - Only inside the Link */}
                      <div className="mt-4 flex items-center justify-end">
                        <div className={`inline-flex items-center justify-center rounded text-sm font-medium px-2 py-1.5 transition-all duration-200 group-hover:scale-105 group-hover:shadow-sm min-w-[120px]
                          ${status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'}`}
                        >
                          {status === 'active' ? 'Join Now' : status === 'upcoming' ? 'View Details' : 'View Recording'}
                          <BiRightArrowAlt className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Action buttons - OUTSIDE the Link */}
                  {isTeacher && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-2 flex gap-2 bg-gray-50 dark:bg-gray-800">
                      <Button 
                        to={`/sessions/edit/${session._id}`} 
                        variant="ghost"
                        size="xs"
                        icon={<BiEdit className="h-4 w-4" />}
                        onClick={handleActionClick}
                      >
                        Edit
                      </Button>
                      <button 
                        onClick={(e) => {
                          handleActionClick(e);
                          handleDelete(session._id);
                        }}
                        className="inline-flex items-center rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50 text-sm px-2.5 py-1.5 transition-colors"
                      >
                        <BiTrash className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                      <button 
                        onClick={(e) => {
                          handleActionClick(e);
                          handleToggleStatus(session._id, session.isCompleted);
                        }}
                        className={`inline-flex items-center rounded text-sm px-2.5 py-1.5 transition-colors ${
                          session.isCompleted 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                        disabled={updatingStatus === session._id}
                        title={session.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                      >
                        {updatingStatus === session._id ? (
                          <Spinner size="xs" className="mr-1" />
                        ) : session.isCompleted ? (
                          <BiX className="h-4 w-4 mr-1" />
                        ) : (
                          <BiCheck className="h-4 w-4 mr-1" />
                        )}
                        {session.isCompleted ? 'Incomplete' : 'Complete'}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  )
}

export default Sessions 